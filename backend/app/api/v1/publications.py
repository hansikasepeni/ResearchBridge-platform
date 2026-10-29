from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.api.dependencies import get_current_user, require_professor
from app.core.errors import ForbiddenError, NotFoundError
from app.repositories.db_adapter import db
from app.schemas.common import MessageResponse
from app.schemas.profile import ProfileResponse
from app.schemas.publication import (
    PublicationCreate,
    PublicationResponse,
    PublicationUpdate,
)

router = APIRouter(tags=["Publications"])


@router.get("/professors/{professor_id}/publications", response_model=List[PublicationResponse])
async def list_professor_publications(
    professor_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Lists publications authored by a professor, filtered by visibility permissions.
    """
    items = await db.list_publications(str(professor_id), viewer_id=str(current_user.id))
    return [PublicationResponse(**item) for item in items]


@router.post(
    "/publications",
    response_model=PublicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_publication(
    payload: PublicationCreate,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Creates a new research publication record. Only authorized professors may author publications.
    """
    data = payload.model_dump(exclude_unset=True)
    if data.get("pdf_document_id"):
        data["pdf_document_id"] = str(data["pdf_document_id"])
    data["professor_id"] = str(current_user.id)
    data["professor_name"] = current_user.full_name

    created = await db.create_publication(data)
    return PublicationResponse(**created)


@router.patch("/publications/{publication_id}", response_model=PublicationResponse)
async def update_publication(
    publication_id: UUID,
    payload: PublicationUpdate,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Updates an existing publication. Enforces ownership: only author or admin.
    """
    pub = await db.get_publication(str(publication_id))
    if not pub:
        raise NotFoundError("Publication not found.")

    if str(pub.get("professor_id")) != str(current_user.id) and current_user.role != "admin":
        raise ForbiddenError("You may only edit publications you authored.")

    updates = payload.model_dump(exclude_unset=True)
    if updates.get("pdf_document_id"):
        updates["pdf_document_id"] = str(updates["pdf_document_id"])

    updated = await db.update_publication(str(publication_id), updates)
    return PublicationResponse(**updated)


@router.delete("/publications/{publication_id}", response_model=MessageResponse)
async def delete_publication(
    publication_id: UUID,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Deletes a publication. Enforces ownership: only author or admin.
    """
    pub = await db.get_publication(str(publication_id))
    if not pub:
        raise NotFoundError("Publication not found.")

    if str(pub.get("professor_id")) != str(current_user.id) and current_user.role != "admin":
        raise ForbiddenError("You may only delete publications you authored.")

    await db.delete_publication(str(publication_id))
    return MessageResponse(message="Publication deleted successfully.")
