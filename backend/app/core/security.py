import hashlib
import re
import jwt
from typing import Any, Dict, Optional
from app.core.config import settings
from app.core.errors import AuthenticationError
from app.core.logging import logger


def calculate_sha256(content: bytes) -> str:
    """Calculate the SHA-256 hex digest of file bytes."""
    return hashlib.sha256(content).hexdigest()


def sanitize_filename(filename: str) -> str:
    """Sanitize original filename to prevent path traversal and injection."""
    cleaned = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", filename)
    cleaned = re.sub(r"_+", "_", cleaned)
    return cleaned.strip("._") or "document.pdf"


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a Supabase JWT token.
    If SUPABASE_JWT_SECRET is configured, verifies cryptographic signature.
    Otherwise decodes claims and validates expiration and structure.
    """
    try:
        if settings.SUPABASE_JWT_SECRET:
            # Full cryptographic verification with secret
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256", "RS256"],
                options={"verify_exp": True, "verify_aud": False},
            )
            return payload
        else:
            # Decode token without secret verification (for local dev / mocking or when Supabase client handles it)
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_exp": True},
            )
            return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Supabase JWT has expired")
        raise AuthenticationError("Session has expired. Please log in again.")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {str(e)}")
        raise AuthenticationError("Invalid authentication token.")
    except Exception as e:
        logger.error(f"Error decoding JWT token: {str(e)}")
        raise AuthenticationError("Could not validate credentials.")
