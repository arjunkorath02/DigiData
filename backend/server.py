from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import aiofiles
from io import BytesIO

# Import our models and utilities
from models import *
from auth import *
from file_manager import file_manager
from database import DatabaseManager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
db_manager = DatabaseManager(db)

# Create the main app
app = FastAPI(title="Google Drive Clone API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Dependencies
async def get_db():
    return db

async def get_current_user_dep(credentials=Depends(security)):
    return await get_current_user(credentials, db)

# Authentication Routes
@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db_manager.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hashed_password
    )
    
    await db_manager.create_user(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.dict())
    }

@api_router.post("/auth/login", response_model=dict)
async def login(user_data: UserLogin):
    # Find user
    user = await db_manager.get_user_by_email(user_data.email)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.dict())
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user_dep)):
    return current_user

# File Management Routes
@api_router.post("/files/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    parent_id: Optional[str] = Form(None),
    current_user: UserResponse = Depends(get_current_user_dep)
):
    try:
        # Check storage limit
        if current_user.storage_used + len(await file.read()) > current_user.storage_limit:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Storage limit exceeded"
            )
        
        # Reset file pointer
        await file.seek(0)
        
        # Save file to disk
        file_path, mime_type, file_size = await file_manager.save_file(file, current_user.id)
        
        # Create thumbnail if it's an image
        thumbnail_path = await file_manager.create_thumbnail(file_path, current_user.id)
        
        # Get file icon and color
        icon, color = file_manager.get_file_icon_and_color(mime_type, "file")
        
        # Create file record in database
        file_item = FileItem(
            name=file.filename,
            type=FileType.FILE,
            size=file_size,
            parent_id=parent_id,
            owner_id=current_user.id,
            file_path=file_path,
            mime_type=mime_type,
            thumbnail_path=thumbnail_path
        )
        
        await db_manager.create_file_item(file_item)
        
        # Update user storage
        await db_manager.update_user_storage(current_user.id, file_size)
        
        file_response = FileItemResponse(
            **file_item.dict(),
            icon=icon,
            color=color
        )
        
        return UploadResponse(
            file=file_response,
            message="File uploaded successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@api_router.post("/folders", response_model=FileItemResponse)
async def create_folder(
    folder_data: FileItemCreate,
    current_user: UserResponse = Depends(get_current_user_dep)
):
    if folder_data.type != FileType.FOLDER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type must be 'folder'"
        )
    
    folder_item = FileItem(
        **folder_data.dict(),
        owner_id=current_user.id
    )
    
    await db_manager.create_file_item(folder_item)
    
    icon, color = file_manager.get_file_icon_and_color("", "folder")
    
    return FileItemResponse(
        **folder_item.dict(),
        icon=icon,
        color=color
    )

@api_router.get("/files", response_model=FolderContents)
async def get_files(
    folder_id: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user_dep)
):
    # Get folder contents
    items = await db_manager.get_folder_contents(folder_id, current_user.id)
    
    # Get folder info if not root
    folder = None
    if folder_id:
        folder_item = await db_manager.get_file_by_id(folder_id, current_user.id)
        if folder_item:
            icon, color = file_manager.get_file_icon_and_color(folder_item.mime_type, folder_item.type)
            folder = FileItemResponse(**folder_item.dict(), icon=icon, color=color)
    
    # Convert to response format
    item_responses = []
    for item in items:
        icon, color = file_manager.get_file_icon_and_color(item.mime_type, item.type)
        item_responses.append(FileItemResponse(**item.dict(), icon=icon, color=color))
    
    # Get breadcrumbs
    breadcrumbs = await db_manager.get_breadcrumbs(folder_id, current_user.id)
    
    return FolderContents(
        folder=folder,
        items=item_responses,
        breadcrumbs=breadcrumbs
    )

@api_router.get("/files/recent", response_model=List[FileItemResponse])
async def get_recent_files(current_user: UserResponse = Depends(get_current_user_dep)):
    items = await db_manager.get_recent_files(current_user.id)
    
    item_responses = []
    for item in items:
        icon, color = file_manager.get_file_icon_and_color(item.mime_type, item.type)
        item_responses.append(FileItemResponse(**item.dict(), icon=icon, color=color))
    
    return item_responses

@api_router.get("/files/starred", response_model=List[FileItemResponse])
async def get_starred_files(current_user: UserResponse = Depends(get_current_user_dep)):
    items = await db_manager.get_starred_files(current_user.id)
    
    item_responses = []
    for item in items:
        icon, color = file_manager.get_file_icon_and_color(item.mime_type, item.type)
        item_responses.append(FileItemResponse(**item.dict(), icon=icon, color=color))
    
    return item_responses

@api_router.get("/files/shared", response_model=List[FileItemResponse])
async def get_shared_files(current_user: UserResponse = Depends(get_current_user_dep)):
    items = await db_manager.get_shared_files(current_user.id)
    
    item_responses = []
    for item in items:
        icon, color = file_manager.get_file_icon_and_color(item.mime_type, item.type)
        item_responses.append(FileItemResponse(**item.dict(), icon=icon, color=color, can_edit=False))
    
    return item_responses

@api_router.get("/files/trash", response_model=List[FileItemResponse])
async def get_trashed_files(current_user: UserResponse = Depends(get_current_user_dep)):
    items = await db_manager.get_trashed_files(current_user.id)
    
    item_responses = []
    for item in items:
        icon, color = file_manager.get_file_icon_and_color(item.mime_type, item.type)
        item_responses.append(FileItemResponse(**item.dict(), icon=icon, color=color))
    
    return item_responses

@api_router.get("/files/search", response_model=SearchResults)
async def search_files(
    q: str,
    current_user: UserResponse = Depends(get_current_user_dep)
):
    items = await db_manager.search_files(q, current_user.id)
    
    item_responses = []
    for item in items:
        icon, color = file_manager.get_file_icon_and_color(item.mime_type, item.type)
        item_responses.append(FileItemResponse(**item.dict(), icon=icon, color=color))
    
    return SearchResults(
        items=item_responses,
        total=len(item_responses)
    )

@api_router.get("/files/{file_id}/download")
async def download_file(
    file_id: str,
    current_user: UserResponse = Depends(get_current_user_dep)
):
    file_item = await db_manager.get_file_by_id(file_id, current_user.id)
    if not file_item or file_item.type != FileType.FILE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if not os.path.exists(file_item.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    return FileResponse(
        path=file_item.file_path,
        filename=file_item.name,
        media_type=file_item.mime_type
    )

@api_router.put("/files/{file_id}", response_model=FileItemResponse)
async def update_file(
    file_id: str,
    update_data: FileItemUpdate,
    current_user: UserResponse = Depends(get_current_user_dep)
):
    success = await db_manager.update_file_item(file_id, current_user.id, update_data.dict(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or no changes made"
        )
    
    file_item = await db_manager.get_file_by_id(file_id, current_user.id)
    icon, color = file_manager.get_file_icon_and_color(file_item.mime_type, file_item.type)
    
    return FileItemResponse(**file_item.dict(), icon=icon, color=color)

@api_router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    permanent: bool = False,
    current_user: UserResponse = Depends(get_current_user_dep)
):
    if permanent:
        # Permanently delete
        file_item = await db_manager.permanently_delete_file(file_id, current_user.id)
        if not file_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Delete from filesystem
        if file_item.file_path:
            file_manager.delete_file(file_item.file_path)
        if file_item.thumbnail_path:
            file_manager.delete_thumbnail(file_item.thumbnail_path)
        
        # Update user storage
        await db_manager.update_user_storage(current_user.id, -file_item.size)
        
        return {"message": "File permanently deleted"}
    else:
        # Move to trash
        success = await db_manager.delete_file_item(file_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        return {"message": "File moved to trash"}

@api_router.post("/files/{file_id}/share")
async def share_file(
    file_id: str,
    share_data: ShareRequest,
    current_user: UserResponse = Depends(get_current_user_dep)
):
    # Find target user
    target_user = await db_manager.get_user_by_email(share_data.user_email)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Share file
    success = await db_manager.share_file(file_id, current_user.id, target_user.id, share_data.permission)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or sharing failed"
        )
    
    return {"message": f"File shared with {share_data.user_email}"}

# Health check route
@api_router.get("/")
async def root():
    return {"message": "Google Drive Clone API is running", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
