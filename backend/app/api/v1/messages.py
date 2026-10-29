from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from app.api.dependencies import get_current_user
from app.core.errors import ForbiddenError, NotFoundError
from app.repositories.db_adapter import db
from app.schemas.common import MessageResponse, NotificationType, PaginatedResponse
from app.schemas.message import MessageCreate, MessageResponseSchema
from app.schemas.profile import ProfileResponse
from app.services.notification_service import notification_service

router = APIRouter(tags=["Messaging"])


@router.get("/research-requests/{request_id}/messages", response_model=PaginatedResponse[MessageResponseSchema])
async def list_messages(
    request_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Lists paginated messages in a request thread.
    Enforces authorization: only participants or admin.
    """
    req = await db.get_research_request(str(request_id))
    if not req:
        raise NotFoundError("Research request not found.")

    is_student = str(req.get("student_id")) == str(current_user.id)
    is_prof = str(req.get("professor_id")) == str(current_user.id)
    is_admin = current_user.role == "admin"

    if not (is_student or is_prof or is_admin):
        raise ForbiddenError("You are not authorized to view messages for this request.")

    msgs, total = await db.list_messages(str(request_id), page=page, limit=limit)
    pages = (total + limit - 1) // limit if total > 0 else 1
    return PaginatedResponse(
        items=[MessageResponseSchema(**m) for m in msgs],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.post(
    "/research-requests/{request_id}/messages",
    response_model=MessageResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    request_id: UUID,
    payload: MessageCreate,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Sends a message within a research request thread.
    Enforces authorization: sender must be student applicant or target professor.
    """
    req = await db.get_research_request(str(request_id))
    if not req:
        raise NotFoundError("Research request not found.")

    is_student = str(req.get("student_id")) == str(current_user.id)
    is_prof = str(req.get("professor_id")) == str(current_user.id)

    if not (is_student or is_prof or current_user.role == "admin"):
        raise ForbiddenError("You are not a participant in this conversation.")

    record = {
        "request_id": str(request_id),
        "sender_id": str(current_user.id),
        "message_body": payload.message_body,
        "attachment_document_id": str(payload.attachment_document_id) if payload.attachment_document_id else None,
    }

    created = await db.create_message(record)

    # Notify counterparty
    counterparty_id = UUID(req["professor_id"]) if is_student else UUID(req["student_id"])
    await notification_service.notify(
        recipient_id=counterparty_id,
        notification_type=NotificationType.NEW_MESSAGE,
        title="New Message Received",
        body=f"{current_user.full_name}: {payload.message_body[:80]}...",
        metadata={"request_id": str(request_id), "message_id": created["id"]},
    )

    return MessageResponseSchema(**created)


@router.post("/research-requests/{request_id}/read", response_model=MessageResponse)
async def mark_thread_read(
    request_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Marks all unread incoming messages in this request thread as read.
    """
    req = await db.get_research_request(str(request_id))
    if not req:
        raise NotFoundError("Research request not found.")

    is_student = str(req.get("student_id")) == str(current_user.id)
    is_prof = str(req.get("professor_id")) == str(current_user.id)
    is_admin = current_user.role == "admin"
    if not (is_student or is_prof or is_admin):
        raise ForbiddenError("You are not authorized to access messages for this request.")

    count = await db.mark_messages_as_read(str(request_id), str(current_user.id))
    return MessageResponse(message=f"{count} messages marked as read.")
