from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class FileType(str, Enum):
    FOLDER = "folder"
    FILE = "file"

class SharePermission(str, Enum):
    VIEW = "view"
    EDIT = "edit"
    OWNER = "owner"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    storage_used: int = Field(default=0)  # in bytes
    storage_limit: int = Field(default=15 * 1024 * 1024 * 1024)  # 15GB default

class UserCreate(BaseModel):
    email: str
    name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    storage_used: int
    storage_limit: int
    created_at: datetime

class FileItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: FileType
    size: int = Field(default=0)  # in bytes
    parent_id: Optional[str] = None  # null for root files
    owner_id: str
    file_path: Optional[str] = None  # actual file path on disk for files
    mime_type: Optional[str] = None
    thumbnail_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: datetime = Field(default_factory=datetime.utcnow)
    shared_with: List[Dict[str, str]] = Field(default_factory=list)  # [{"user_id": "...", "permission": "view"}]
    is_starred: bool = Field(default=False)
    is_trashed: bool = Field(default=False)
    trashed_at: Optional[datetime] = None

class FileItemCreate(BaseModel):
    name: str
    type: FileType
    parent_id: Optional[str] = None

class FileItemUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None
    is_starred: Optional[bool] = None

class FileItemResponse(BaseModel):
    id: str
    name: str
    type: FileType
    size: int
    parent_id: Optional[str]
    owner_id: str
    mime_type: Optional[str]
    created_at: datetime
    modified_at: datetime
    is_starred: bool
    is_trashed: bool
    can_edit: bool = True
    icon: str = "📄"
    color: str = "#6b7280"

class ShareRequest(BaseModel):
    file_id: str
    user_email: str
    permission: SharePermission

class ShareResponse(BaseModel):
    id: str
    file_name: str
    shared_by: str
    permission: SharePermission
    shared_at: datetime

class UploadResponse(BaseModel):
    file: FileItemResponse
    message: str

class FolderContents(BaseModel):
    folder: Optional[FileItemResponse]
    items: List[FileItemResponse]
    breadcrumbs: List[Dict[str, str]]

class SearchResults(BaseModel):
    items: List[FileItemResponse]
    total: int