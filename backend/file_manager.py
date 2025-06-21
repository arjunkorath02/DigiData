import os
import shutil
import aiofiles
from pathlib import Path
from typing import Optional, List
from fastapi import UploadFile
import magic
from PIL import Image
import uuid

class FileManager:
    def __init__(self, base_path: str = "/app/backend/uploads"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)
        self.thumbnails_path = self.base_path / "thumbnails"
        self.thumbnails_path.mkdir(exist_ok=True)

    def get_user_directory(self, user_id: str) -> Path:
        user_dir = self.base_path / user_id
        user_dir.mkdir(exist_ok=True)
        return user_dir

    async def save_file(self, file: UploadFile, user_id: str) -> tuple[str, str, int]:
        """Save uploaded file and return (file_path, mime_type, size)"""
        user_dir = self.get_user_directory(user_id)
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = user_dir / unique_filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Get file size
        file_size = len(content)
        
        # Get MIME type
        mime_type = magic.from_file(str(file_path), mime=True)
        
        return str(file_path), mime_type, file_size

    async def create_thumbnail(self, file_path: str, user_id: str) -> Optional[str]:
        """Create thumbnail for image files"""
        try:
            path = Path(file_path)
            if not path.exists():
                return None
                
            # Check if it's an image
            mime_type = magic.from_file(str(path), mime=True)
            if not mime_type.startswith('image/'):
                return None
            
            # Create thumbnail
            thumbnail_filename = f"{path.stem}_thumb.jpg"
            thumbnail_path = self.thumbnails_path / user_id
            thumbnail_path.mkdir(exist_ok=True)
            full_thumbnail_path = thumbnail_path / thumbnail_filename
            
            with Image.open(path) as img:
                img.thumbnail((200, 200))
                img.save(full_thumbnail_path, "JPEG")
            
            return str(full_thumbnail_path)
        except Exception:
            return None

    def delete_file(self, file_path: str) -> bool:
        """Delete file from filesystem"""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception:
            return False

    def delete_thumbnail(self, thumbnail_path: str) -> bool:
        """Delete thumbnail from filesystem"""
        try:
            path = Path(thumbnail_path)
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception:
            return False

    def get_file_info(self, file_path: str) -> dict:
        """Get file information"""
        try:
            path = Path(file_path)
            if not path.exists():
                return {}
            
            stat = path.stat()
            mime_type = magic.from_file(str(path), mime=True)
            
            return {
                "size": stat.st_size,
                "mime_type": mime_type,
                "modified_at": stat.st_mtime
            }
        except Exception:
            return {}

    def get_file_icon_and_color(self, mime_type: str, file_type: str) -> tuple[str, str]:
        """Get appropriate icon and color for file type"""
        if file_type == "folder":
            return "📁", "#4285f4"
        
        if not mime_type:
            return "📄", "#6b7280"
        
        if mime_type.startswith('image/'):
            return "🖼️", "#34a853"
        elif mime_type.startswith('video/'):
            return "🎥", "#fbbc05"
        elif mime_type.startswith('audio/'):
            return "🎵", "#9c27b0"
        elif 'pdf' in mime_type:
            return "📄", "#ea4335"
        elif any(x in mime_type for x in ['word', 'doc']):
            return "📝", "#4285f4"
        elif any(x in mime_type for x in ['sheet', 'excel']):
            return "📊", "#34a853"
        elif any(x in mime_type for x in ['presentation', 'powerpoint']):
            return "📊", "#ea4335"
        elif 'zip' in mime_type or 'archive' in mime_type:
            return "🗜️", "#607d8b"
        elif 'text' in mime_type:
            return "📝", "#6b7280"
        else:
            return "📄", "#6b7280"

file_manager = FileManager()