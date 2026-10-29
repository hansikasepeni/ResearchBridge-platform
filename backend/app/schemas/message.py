from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    message_body: str = Field(..., min_length=1, max_length=5000)
    attachment_document_id: Optional[UUID] = None


class MessageResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    request_id: UUID
    sender_id: UUID
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None
    message_body: str
    attachment_document_id: Optional[UUID] = None
    attachment_filename: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
