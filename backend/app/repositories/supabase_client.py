from typing import Optional
from supabase import Client, create_client
from app.core.config import settings
from app.core.logging import logger

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Returns the Supabase client initialized with the Service Role key
    for secure server-side operations, or None if not configured.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if settings.is_supabase_configured:
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        try:
            _supabase_client = create_client(settings.SUPABASE_URL, key)
            logger.info("Successfully connected to Supabase client")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            _supabase_client = None
    return _supabase_client
