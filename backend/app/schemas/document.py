from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.common import DocumentScope, DocumentStatus


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    owner_name: Optional[str] = None
    institution_id: Optional[UUID] = None
    original_filename: str
    storage_path: str
    mime_type: str
    file_size: int
    sha256_hash: str
    title: Optional[str] = None
    description: Optional[str] = None
    access_scope: DocumentScope
    associated_request_id: Optional[UUID] = None
    associated_publication_id: Optional[UUID] = None
    processing_status: DocumentStatus
    created_at: datetime
    updated_at: datetime


class DocumentDownloadResponse(BaseModel):
    document_id: UUID
    download_url: str
    filename: str
    expires_in_seconds: int = 3600
