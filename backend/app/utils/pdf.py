import io
from typing import Optional, Tuple
from pypdf import PdfReader
from app.core.config import settings
from app.core.errors import PayloadTooLargeError, UnsupportedMediaTypeError, AppException
from app.core.logging import logger


def validate_pdf_bytes(file_bytes: bytes, filename: str) -> None:
    """
    Validates that the file:
    1. Does not exceed maximum allowed size (20MB).
    2. Has valid PDF magic bytes (%PDF-).
    3. Has valid PDF structure parseable by pypdf.
    """
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise PayloadTooLargeError(
            f"File size ({len(file_bytes)} bytes) exceeds the maximum allowed limit of {settings.MAX_UPLOAD_SIZE_BYTES} bytes."
        )

    # Magic byte check
    if not file_bytes.startswith(b"%PDF-"):
        raise UnsupportedMediaTypeError("File signature does not match a valid PDF document.")

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        if len(reader.pages) == 0:
            raise UnsupportedMediaTypeError("PDF document contains no pages.")
    except Exception as e:
        logger.warning(f"Failed to parse PDF {filename}: {str(e)}")
        raise UnsupportedMediaTypeError("Invalid or corrupted PDF file.")


def extract_text_from_pdf(file_bytes: bytes, max_pages: int = 50) -> Tuple[str, Optional[str]]:
    """
    Extracts text from PDF bytes.
    Returns (extracted_text, extracted_title).
    """
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text_chunks = []
        pages_to_read = min(len(reader.pages), max_pages)

        for i in range(pages_to_read):
            page_text = reader.pages[i].extract_text() or ""
            if page_text.strip():
                text_chunks.append(page_text)

        full_text = "\n\n".join(text_chunks)
        title = None
        if reader.metadata and reader.metadata.title:
            title = reader.metadata.title.strip()

        return full_text, title
    except Exception as e:
        logger.warning(f"Error extracting text from PDF: {str(e)}")
        return "", None
