from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from app.api.dependencies import get_current_user
from app.core.errors import ForbiddenError, NotFoundError
from app.repositories.db_adapter import db
from app.schemas.ai import PaperSummaryResponse
from app.schemas.common import DocumentScope, MessageResponse
from app.schemas.document import DocumentDownloadResponse, DocumentResponse
from app.schemas.profile import ProfileResponse
from app.services.document_service import document_service
from app.services.gemini_service import gemini_service

router = APIRouter(tags=["Documents & Research Papers"])


@router.post(
    "/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(..., description="PDF research paper or supporting attachment"),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    access_scope: DocumentScope = Form(DocumentScope.PRIVATE),
    associated_request_id: Optional[UUID] = Form(None),
    associated_publication_id: Optional[UUID] = Form(None),
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Uploads and validates a research document PDF.
    Validates magic bytes, enforces max 20MB limit, hashes SHA-256.
    """
    created = await document_service.upload_document(
        file=file,
        owner_id=current_user.id,
        institution_id=current_user.institution_id,
        title=title,
        description=description,
        access_scope=access_scope,
        associated_request_id=associated_request_id,
        associated_publication_id=associated_publication_id,
    )
    return DocumentResponse(**created)


@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Lists documents accessible to the current user (owned, public, or institution-scoped).
    """
    inst_id = str(current_user.institution_id) if current_user.institution_id else None
    items = await db.list_documents(str(current_user.id), institution_id=inst_id)
    return [DocumentResponse(**item) for item in items]


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Retrieves metadata for a specific document after verifying access.
    """
    doc = await db.get_document(str(document_id))
    if not doc:
        raise NotFoundError("Document not found.")

    is_owner = str(doc.get("owner_id")) == str(current_user.id)
    is_public = doc.get("access_scope") == "public"
    is_admin = current_user.role == "admin"

    if not (is_owner or is_public or is_admin):
        raise ForbiddenError("You do not have permission to view this document.")

    return DocumentResponse(**doc)


@router.get("/documents/{document_id}/download", response_model=DocumentDownloadResponse)
async def get_document_download(
    document_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Generates a secure, expiring download URL for an authorized document.
    """
    res = await document_service.get_document_download_url(
        document_id=document_id,
        requester_id=current_user.id,
        requester_role=current_user.role.value,
    )
    return DocumentDownloadResponse(**res)


@router.delete("/documents/{document_id}", response_model=MessageResponse)
async def delete_document(
    document_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Deletes an uploaded document and removes associated storage.
    """
    await document_service.delete_document(
        document_id=document_id,
        requester_id=current_user.id,
        requester_role=current_user.role.value,
    )
    return MessageResponse(message="Document deleted successfully.")


@router.post("/documents/{document_id}/summarize", response_model=PaperSummaryResponse)
async def summarize_document(
    document_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Analyzes an uploaded research PDF using Google Gemini and produces a 15-part structured summary.
    Checks and caches summary to avoid redundant provider costs.
    """
    doc = await db.get_document(str(document_id))
    if not doc:
        raise NotFoundError("Document not found.")

    # Authorization
    is_owner = str(doc.get("owner_id")) == str(current_user.id)
    is_public = doc.get("access_scope") == "public"
    is_admin = current_user.role == "admin"
    if not (is_owner or is_public or is_admin):
        raise ForbiddenError("You do not have access to analyze this document.")

    # Check database cache first
    cached = await db.get_paper_summary(str(document_id), version="v1")
    if cached:
        return PaperSummaryResponse(**cached)

    # Extract text and call Gemini service
    text = await document_service.get_document_text(document_id)
    summary_data = await gemini_service.summarize_paper(text, fallback_title=doc.get("title"))

    # Save to database
    record = {
        "document_id": str(document_id),
        "document_hash": doc["sha256_hash"],
        "model_used": gemini_service.model,
        "prompt_version": "v1",
        **summary_data.model_dump(),
    }
    saved = await db.create_paper_summary(record)
    return PaperSummaryResponse(**saved)


@router.get("/documents/{document_id}/summary", response_model=PaperSummaryResponse)
async def get_document_summary(
    document_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Returns the cached summary for an authorized document.
    """
    doc = await db.get_document(str(document_id))
    if not doc:
        raise NotFoundError("Document not found.")

    is_owner = str(doc.get("owner_id")) == str(current_user.id)
    is_public = doc.get("access_scope") == "public"
    is_admin = current_user.role == "admin"
    if not (is_owner or is_public or is_admin):
        raise ForbiddenError("You do not have access to this document summary.")

    summary = await db.get_paper_summary(str(document_id), version="v1")
    if not summary:
        raise NotFoundError("No summary has been generated for this document yet.")
    return PaperSummaryResponse(**summary)
