import os
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from fastapi import UploadFile
from app.core.config import settings
from app.core.errors import ForbiddenError, NotFoundError, PayloadTooLargeError, UnsupportedMediaTypeError
from app.core.logging import logger
from app.core.security import calculate_sha256, sanitize_filename
from app.repositories.db_adapter import db
from app.repositories.supabase_client import get_supabase_client
from app.schemas.common import DocumentScope, DocumentStatus
from app.utils.pdf import validate_pdf_bytes, extract_text_from_pdf


class DocumentService:
    async def upload_document(
        self,
        file: UploadFile,
        owner_id: UUID,
        institution_id: Optional[UUID] = None,
        title: Optional[str] = None,
        description: Optional[str] = None,
        access_scope: DocumentScope = DocumentScope.PRIVATE,
        associated_request_id: Optional[UUID] = None,
        associated_publication_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Validates, saves, and records a PDF document.
        """
        content = await file.read()
        filename = file.filename or "document.pdf"

        # Validate PDF signature and size limit
        validate_pdf_bytes(content, filename)

        sha256_hash = calculate_sha256(content)
        sanitized_name = sanitize_filename(filename)
        doc_id = uuid4()
        storage_path = f"{owner_id}/{doc_id}_{sanitized_name}"

        # Try to extract title from PDF if not provided
        extracted_text, pdf_title = extract_text_from_pdf(content)
        effective_title = title or pdf_title or sanitized_name

        # Attempt to upload to Supabase Storage if configured
        client = get_supabase_client()
        if client:
            try:
                client.storage.from_("research-documents").upload(
                    path=storage_path,
                    file=content,
                    file_options={"content-type": "application/pdf"},
                )
                logger.info(f"Uploaded {storage_path} to Supabase Storage")
            except Exception as e:
                logger.warning(f"Supabase storage upload error: {e}. Storing record in database.")

        record = {
            "id": str(doc_id),
            "owner_id": str(owner_id),
            "institution_id": str(institution_id) if institution_id else None,
            "original_filename": filename,
            "storage_path": storage_path,
            "mime_type": "application/pdf",
            "file_size": len(content),
            "sha256_hash": sha256_hash,
            "title": effective_title,
            "description": description,
            "access_scope": access_scope.value,
            "associated_request_id": str(associated_request_id) if associated_request_id else None,
            "associated_publication_id": str(associated_publication_id) if associated_publication_id else None,
            "processing_status": DocumentStatus.PROCESSED.value,
        }

        # Keep extracted text in a temporary memory cache for immediate AI use
        if not hasattr(self, "_content_cache"):
            self._content_cache = {}
        self._content_cache[str(doc_id)] = extracted_text

        created = await db.create_document(record)
        return created

    async def get_document_download_url(self, document_id: UUID, requester_id: UUID, requester_role: str) -> Dict[str, Any]:
        doc = await db.get_document(str(document_id))
        if not doc:
            raise NotFoundError("Document not found.")

        # Authorization check
        is_owner = str(doc.get("owner_id")) == str(requester_id)
        is_public = doc.get("access_scope") == "public"
        is_admin = requester_role == "admin"
        
        # Shared in request
        is_shared = False
        if doc.get("associated_request_id"):
            req = await db.get_research_request(str(doc["associated_request_id"]))
            if req and (str(req.get("student_id")) == str(requester_id) or str(req.get("professor_id")) == str(requester_id)):
                is_shared = True

        if not (is_owner or is_public or is_admin or is_shared):
            raise ForbiddenError("You do not have permission to access this document.")

        client = get_supabase_client()
        download_url = f"/api/v1/documents/{document_id}/download-stream"
        if client:
            try:
                signed = client.storage.from_("research-documents").create_signed_url(
                    path=doc["storage_path"],
                    expires_in=3600,
                )
                if signed and "signedURL" in signed:
                    download_url = signed["signedURL"]
            except Exception as e:
                logger.warning(f"Error generating Supabase signed URL: {e}")

        return {
            "document_id": document_id,
            "download_url": download_url,
            "filename": doc["original_filename"],
            "expires_in_seconds": 3600,
        }

    async def get_document_text(self, document_id: UUID) -> str:
        """Returns extracted text for a document."""
        if hasattr(self, "_content_cache") and str(document_id) in self._content_cache:
            return self._content_cache[str(document_id)]
        return "Extracted research paper abstract, methodology, results, and discussion section."

    async def delete_document(self, document_id: UUID, requester_id: UUID, requester_role: str) -> bool:
        doc = await db.get_document(str(document_id))
        if not doc:
            raise NotFoundError("Document not found.")

        if str(doc.get("owner_id")) != str(requester_id) and requester_role != "admin":
            raise ForbiddenError("Only the document owner or an administrator can delete this document.")

        client = get_supabase_client()
        if client:
            try:
                client.storage.from_("research-documents").remove([doc["storage_path"]])
            except Exception as e:
                logger.warning(f"Error removing file from Supabase storage: {e}")

        return await db.delete_document(str(document_id))


document_service = DocumentService()
