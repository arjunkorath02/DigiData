from motor.motor_asyncio import AsyncIOMotorDatabase
from models import FileItem, User, FileItemResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
import os

class DatabaseManager:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def create_user(self, user: User) -> User:
        """Create a new user"""
        await self.db.users.insert_one(user.dict())
        return user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        user_data = await self.db.users.find_one({"email": email})
        if user_data:
            return User(**user_data)
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        user_data = await self.db.users.find_one({"id": user_id})
        if user_data:
            return User(**user_data)
        return None

    async def update_user_storage(self, user_id: str, size_change: int):
        """Update user's storage usage"""
        await self.db.users.update_one(
            {"id": user_id},
            {"$inc": {"storage_used": size_change}}
        )

    async def create_file_item(self, file_item: FileItem) -> FileItem:
        """Create a new file or folder"""
        await self.db.files.insert_one(file_item.dict())
        return file_item

    async def get_file_by_id(self, file_id: str, user_id: str) -> Optional[FileItem]:
        """Get file by ID (only if user has access)"""
        file_data = await self.db.files.find_one({
            "id": file_id,
            "$or": [
                {"owner_id": user_id},
                {"shared_with.user_id": user_id}
            ],
            "is_trashed": False
        })
        if file_data:
            return FileItem(**file_data)
        return None

    async def get_folder_contents(self, folder_id: Optional[str], user_id: str) -> List[FileItem]:
        """Get contents of a folder"""
        query = {
            "parent_id": folder_id,
            "$or": [
                {"owner_id": user_id},
                {"shared_with.user_id": user_id}
            ],
            "is_trashed": False
        }
        
        files_data = await self.db.files.find(query).sort("type", 1).sort("name", 1).to_list(1000)
        return [FileItem(**file_data) for file_data in files_data]

    async def update_file_item(self, file_id: str, user_id: str, update_data: dict) -> bool:
        """Update file item"""
        update_data["modified_at"] = datetime.utcnow()
        result = await self.db.files.update_one(
            {"id": file_id, "owner_id": user_id, "is_trashed": False},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def delete_file_item(self, file_id: str, user_id: str) -> bool:
        """Move file to trash"""
        result = await self.db.files.update_one(
            {"id": file_id, "owner_id": user_id, "is_trashed": False},
            {"$set": {"is_trashed": True, "trashed_at": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def permanently_delete_file(self, file_id: str, user_id: str) -> Optional[FileItem]:
        """Permanently delete file from database"""
        file_data = await self.db.files.find_one({"id": file_id, "owner_id": user_id})
        if file_data:
            await self.db.files.delete_one({"id": file_id, "owner_id": user_id})
            return FileItem(**file_data)
        return None

    async def search_files(self, query: str, user_id: str, limit: int = 50) -> List[FileItem]:
        """Search files by name"""
        search_query = {
            "name": {"$regex": query, "$options": "i"},
            "$or": [
                {"owner_id": user_id},
                {"shared_with.user_id": user_id}
            ],
            "is_trashed": False
        }
        
        files_data = await self.db.files.find(search_query).limit(limit).to_list(limit)
        return [FileItem(**file_data) for file_data in files_data]

    async def get_recent_files(self, user_id: str, limit: int = 20) -> List[FileItem]:
        """Get recently modified files"""
        query = {
            "$or": [
                {"owner_id": user_id},
                {"shared_with.user_id": user_id}
            ],
            "is_trashed": False,
            "type": "file"
        }
        
        files_data = await self.db.files.find(query).sort("modified_at", -1).limit(limit).to_list(limit)
        return [FileItem(**file_data) for file_data in files_data]

    async def get_starred_files(self, user_id: str) -> List[FileItem]:
        """Get starred files"""
        query = {
            "$or": [
                {"owner_id": user_id},
                {"shared_with.user_id": user_id}
            ],
            "is_starred": True,
            "is_trashed": False
        }
        
        files_data = await self.db.files.find(query).sort("name", 1).to_list(1000)
        return [FileItem(**file_data) for file_data in files_data]

    async def get_trashed_files(self, user_id: str) -> List[FileItem]:
        """Get trashed files"""
        query = {
            "owner_id": user_id,
            "is_trashed": True
        }
        
        files_data = await self.db.files.find(query).sort("trashed_at", -1).to_list(1000)
        return [FileItem(**file_data) for file_data in files_data]

    async def get_shared_files(self, user_id: str) -> List[FileItem]:
        """Get files shared with user"""
        query = {
            "shared_with.user_id": user_id,
            "is_trashed": False
        }
        
        files_data = await self.db.files.find(query).sort("name", 1).to_list(1000)
        return [FileItem(**file_data) for file_data in files_data]

    async def share_file(self, file_id: str, owner_id: str, target_user_id: str, permission: str) -> bool:
        """Share file with another user"""
        # Remove existing share with same user if exists
        await self.db.files.update_one(
            {"id": file_id, "owner_id": owner_id},
            {"$pull": {"shared_with": {"user_id": target_user_id}}}
        )
        
        # Add new share
        result = await self.db.files.update_one(
            {"id": file_id, "owner_id": owner_id},
            {"$push": {"shared_with": {"user_id": target_user_id, "permission": permission}}}
        )
        return result.modified_count > 0

    async def get_breadcrumbs(self, folder_id: Optional[str], user_id: str) -> List[Dict[str, str]]:
        """Get breadcrumb navigation for a folder"""
        breadcrumbs = [{"id": None, "name": "My Drive"}]
        
        current_id = folder_id
        path = []
        
        while current_id:
            folder = await self.get_file_by_id(current_id, user_id)
            if not folder or folder.type != "folder":
                break
            path.append({"id": folder.id, "name": folder.name})
            current_id = folder.parent_id
        
        # Reverse to get correct order
        path.reverse()
        breadcrumbs.extend(path)
        
        return breadcrumbs