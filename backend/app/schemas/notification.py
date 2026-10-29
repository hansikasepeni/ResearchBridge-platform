from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.common import NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipient_id: UUID
    notification_type: NotificationType
    title: str
    body: str
    safe_metadata: Dict[str, Any] = Field(default_factory=dict)
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
