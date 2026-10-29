from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, HttpUrl
from app.schemas.common import UserRole, AccountStatus, VerificationStatus


class ProfileBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    institution_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=2000)

    # Student fields
    degree: Optional[str] = Field(None, max_length=100)
    year_of_study: Optional[int] = Field(None, ge=1, le=8)
    academic_interests: List[str] = Field(default_factory=list)
    relevant_skills: List[str] = Field(default_factory=list)
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    weekly_availability_hours: Optional[int] = Field(None, ge=1, le=80)


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    institution_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=2000)

    # Student fields
    degree: Optional[str] = Field(None, max_length=100)
    year_of_study: Optional[int] = Field(None, ge=1, le=8)
    academic_interests: Optional[List[str]] = None
    relevant_skills: Optional[List[str]] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    weekly_availability_hours: Optional[int] = Field(None, ge=1, le=80)


class ProfessorProfileFields(BaseModel):
    academic_title: str = "Assistant Professor"
    biography: Optional[str] = None
    research_interests: List[str] = Field(default_factory=list)
    is_accepting_students: bool = True
    max_student_capacity: int = 5
    advertised_openings_count: int = 1
    preferred_qualifications: Optional[str] = None
    preferred_weekly_hours: int = 10
    office_location: Optional[str] = None
    office_hours: Optional[str] = None
    verification_status: VerificationStatus = VerificationStatus.PENDING


class ProfessorProfileUpdate(BaseModel):
    academic_title: Optional[str] = None
    biography: Optional[str] = None
    research_interests: Optional[List[str]] = None
    is_accepting_students: Optional[bool] = None
    max_student_capacity: Optional[int] = Field(None, ge=0, le=50)
    advertised_openings_count: Optional[int] = Field(None, ge=0, le=50)
    preferred_qualifications: Optional[str] = None
    preferred_weekly_hours: Optional[int] = Field(None, ge=1, le=80)
    office_location: Optional[str] = None
    office_hours: Optional[str] = None


class ProfileResponse(ProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    role: UserRole
    account_status: AccountStatus
    institution_name: Optional[str] = None
    department_name: Optional[str] = None
    professor_profile: Optional[ProfessorProfileFields] = None
    created_at: datetime
    updated_at: datetime
