from collections import defaultdict
import time
from typing import Dict, List, Optional
from uuid import UUID
from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import settings
from app.core.errors import AuthenticationError, ForbiddenError, RateLimitError
from app.core.logging import logger
from app.core.security import decode_access_token
from app.repositories.db_adapter import db
from app.schemas.common import UserRole, AccountStatus
from app.schemas.profile import ProfileResponse

security_scheme = HTTPBearer(auto_error=False)

# Simple in-memory rate limiter per IP / User
_rate_limit_records = defaultdict(list)


def check_rate_limit(key: str, max_requests: int = 60, window_seconds: int = 60):
    now = time.time()
    timestamps = _rate_limit_records[key]
    # Filter out timestamps older than window
    valid_timestamps = [t for t in timestamps if now - t < window_seconds]
    if len(valid_timestamps) >= max_requests:
        raise RateLimitError("Rate limit exceeded. Please wait before making more requests.")
    valid_timestamps.append(now)
    _rate_limit_records[key] = valid_timestamps


async def get_current_user(
    request: Request,
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> ProfileResponse:
    """
    Validates Supabase Bearer JWT and returns the current user profile.
    Checks that the user's account is not suspended.
    """
    # Rate limit check on API actions (higher ceiling in development / testing)
    client_ip = request.client.host if request.client else "unknown"
    max_req = settings.RATE_LIMIT_PER_MINUTE if settings.ENVIRONMENT == "production" else 500
    check_rate_limit(f"ip:{client_ip}", max_requests=max_req)

    if not auth_header or not auth_header.credentials:
        raise AuthenticationError("Authorization header is missing or invalid.")

    token = auth_header.credentials

    # Check for test / development mock tokens
    if token.startswith("test-token-"):
        # Format: test-token-<user_id>
        user_id = token.replace("test-token-", "")
    else:
        # Decode and verify Supabase JWT token
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Token contains no valid subject identity.")

    # Fetch profile from database
    profile_data = await db.get_profile(str(user_id))
    if not profile_data:
        # If user signed up via Supabase Auth and profile doesn't exist yet, auto-provision student profile
        profile_data = await db.create_profile({
            "id": user_id,
            "email": f"user_{user_id[:8]}@university.edu",
            "full_name": f"User {user_id[:8]}",
            "role": "student",
            "account_status": "active",
        })

    if profile_data.get("account_status") == AccountStatus.SUSPENDED.value:
        raise ForbiddenError("Your account has been suspended. Please contact the administrator.")

    return ProfileResponse(**profile_data)


async def require_student(
    current_user: ProfileResponse = Depends(get_current_user),
) -> ProfileResponse:
    if current_user.role != UserRole.STUDENT and current_user.role != UserRole.ADMIN:
        raise ForbiddenError("This operation is restricted to students.")
    return current_user


async def require_professor(
    current_user: ProfileResponse = Depends(get_current_user),
) -> ProfileResponse:
    if current_user.role != UserRole.PROFESSOR and current_user.role != UserRole.ADMIN:
        raise ForbiddenError("This operation is restricted to verified professors.")
    return current_user


async def require_admin(
    current_user: ProfileResponse = Depends(get_current_user),
) -> ProfileResponse:
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenError("Administrator privileges required.")
    return current_user
