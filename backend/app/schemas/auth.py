from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.schemas.common import UserRole, AccountStatus, VerificationStatus
from app.schemas.profile import ProfileResponse


class UserSessionResponse(BaseModel):
    user_id: UUID
    email: str
    role: UserRole
    account_status: AccountStatus
    profile: ProfileResponse


class OnboardingCompleteRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    institution_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    degree: Optional[str] = None
    year_of_study: Optional[int] = Field(None, ge=1, le=8)
    academic_interests: list[str] = Field(default_factory=list)
    relevant_skills: list[str] = Field(default_factory=list)
    weekly_availability_hours: Optional[int] = Field(None, ge=1, le=80)


class ProfessorOnboardingRequestCreate(BaseModel):
    institution_id: UUID
    department_id: Optional[UUID] = None
    academic_title: str = Field(..., min_length=2, max_length=100)
    institutional_email: EmailStr
    verification_notes: Optional[str] = Field(None, max_length=2000)
    verification_document_url: Optional[str] = None


class ProfessorOnboardingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    institution_id: UUID
    department_id: Optional[UUID] = None
    academic_title: str
    institutional_email: str
    verification_notes: Optional[str] = None
    verification_document_url: Optional[str] = None
    status: VerificationStatus
    admin_notes: Optional[str] = None
    created_at: datetime
