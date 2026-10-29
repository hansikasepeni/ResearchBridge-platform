from typing import Any, Dict, Optional
from uuid import UUID
from app.core.logging import logger
from app.repositories.db_adapter import db
from app.schemas.common import NotificationType


class NotificationService:
    async def notify(
        self,
        recipient_id: UUID,
        notification_type: NotificationType,
        title: str,
        body: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Creates a persistent notification for a user.
        """
        record = {
            "recipient_id": str(recipient_id),
            "notification_type": notification_type.value,
            "title": title,
            "body": body,
            "safe_metadata": metadata or {},
        }
        notif = await db.create_notification(record)
        logger.info(f"Notification [{notification_type.value}] created for user {recipient_id}: {title}")
        return notif


notification_service = NotificationService()
