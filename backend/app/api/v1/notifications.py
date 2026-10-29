from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user
from app.core.errors import NotFoundError
from app.repositories.db_adapter import db
from app.schemas.common import MessageResponse
from app.schemas.notification import NotificationResponse
from app.schemas.profile import ProfileResponse

router = APIRouter(tags=["Notifications"])


@router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Retrieves all notifications for the authenticated user.
    """
    items = await db.list_notifications(str(current_user.id))
    return [NotificationResponse(**n) for n in items]


@router.post("/notifications/{notification_id}/read", response_model=MessageResponse)
async def mark_notification_read(
    notification_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Marks a specific notification as read.
    Users cannot modify other users' notifications.
    """
    ok = await db.mark_notification_read(str(notification_id), str(current_user.id))
    if not ok:
        raise NotFoundError("Notification not found or access denied.")
    return MessageResponse(message="Notification marked as read.")


@router.post("/notifications/read-all", response_model=MessageResponse)
async def mark_all_notifications_read(
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Marks all notifications for the current user as read.
    """
    count = await db.mark_all_notifications_read(str(current_user.id))
    return MessageResponse(message=f"{count} notifications marked as read.")
