from fastapi import APIRouter, Depends, status
from app.api.dependencies import get_current_user
from app.core.errors import ConflictError
from app.repositories.db_adapter import db
from app.schemas.auth import (
    OnboardingCompleteRequest,
    ProfessorOnboardingRequestCreate,
    ProfessorOnboardingResponse,
    UserSessionResponse,
)
from app.schemas.profile import ProfileResponse

router = APIRouter(tags=["Authentication & Onboarding"])


@router.get("/auth/me", response_model=UserSessionResponse)
async def get_my_session(current_user: ProfileResponse = Depends(get_current_user)):
    """
    Returns current authenticated session and profile details.
    Identity is strictly derived from the verified Supabase Bearer token.
    """
    return UserSessionResponse(
        user_id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        account_status=current_user.account_status,
        profile=current_user,
    )


@router.get("/profiles/me", response_model=ProfileResponse)
async def get_my_profile(current_user: ProfileResponse = Depends(get_current_user)):
    """
    Returns current user's profile.
    """
    return current_user


@router.patch("/profiles/me", response_model=ProfileResponse)
async def update_my_profile(
    updates: dict,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Updates the current user's profile.
    Critical Security Rule:
    A request body can never modify role, email, or account_status directly.
    """
    safe_fields = {
        "full_name",
        "institution_id",
        "department_id",
        "avatar_url",
        "bio",
        "degree",
        "year_of_study",
        "academic_interests",
        "relevant_skills",
        "portfolio_url",
        "github_url",
        "weekly_availability_hours",
    }
    filtered_updates = {k: v for k, v in updates.items() if k in safe_fields and v is not None}

    updated = await db.update_profile(str(current_user.id), filtered_updates)
    return ProfileResponse(**updated)


@router.post("/onboarding/complete", response_model=ProfileResponse)
async def complete_onboarding(
    payload: OnboardingCompleteRequest,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Completes onboarding for a newly registered student.
    """
    data = payload.model_dump(exclude_unset=True)
    updated = await db.update_profile(str(current_user.id), data)
    return ProfileResponse(**updated)


@router.post(
    "/onboarding/professor-request",
    response_model=ProfessorOnboardingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def request_professor_access(
    payload: ProfessorOnboardingRequestCreate,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Submits an application for professor account status.
    Remains unprivileged ('pending') until reviewed and approved by an administrator.
    """
    record = {
        "user_id": str(current_user.id),
        "institution_id": str(payload.institution_id),
        "department_id": str(payload.department_id) if payload.department_id else None,
        "academic_title": payload.academic_title,
        "institutional_email": payload.institutional_email,
        "verification_notes": payload.verification_notes,
        "verification_document_url": payload.verification_document_url,
    }
    created = await db.create_professor_onboarding_request(record)
    return ProfessorOnboardingResponse(**created)
