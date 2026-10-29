from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.common import ProjectStatus, ProjectArrangement, CompensationType


class ResearchProjectBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    summary: str = Field(..., min_length=10, max_length=500)
    description: str = Field(..., min_length=20, max_length=5000)
    research_question: Optional[str] = Field(None, max_length=1000)
    methodology: Optional[str] = Field(None, max_length=2000)
    prerequisite_skills: List[str] = Field(default_factory=list)
    expected_duration: Optional[str] = Field(None, max_length=100)
    weekly_hours: int = Field(default=10, ge=1, le=80)
    arrangement: ProjectArrangement = ProjectArrangement.REMOTE
    compensation_type: CompensationType = CompensationType.UNPAID
    compensation_details: Optional[str] = Field(None, max_length=300)
    application_deadline: Optional[datetime] = None
    openings_count: int = Field(default=1, ge=1, le=50)
    status: ProjectStatus = ProjectStatus.OPEN
    eligibility_requirements: Optional[str] = Field(None, max_length=1000)
    department_id: Optional[UUID] = None
    interest_ids: List[UUID] = Field(default_factory=list)


class ResearchProjectCreate(ResearchProjectBase):
    pass


class ResearchProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    summary: Optional[str] = Field(None, min_length=10, max_length=500)
    description: Optional[str] = Field(None, min_length=20, max_length=5000)
    research_question: Optional[str] = None
    methodology: Optional[str] = None
    prerequisite_skills: Optional[List[str]] = None
    expected_duration: Optional[str] = None
    weekly_hours: Optional[int] = Field(None, ge=1, le=80)
    arrangement: Optional[ProjectArrangement] = None
    compensation_type: Optional[CompensationType] = None
    compensation_details: Optional[str] = None
    application_deadline: Optional[datetime] = None
    openings_count: Optional[int] = Field(None, ge=1, le=50)
    status: Optional[ProjectStatus] = None
    eligibility_requirements: Optional[str] = None
    department_id: Optional[UUID] = None
    interest_ids: Optional[List[UUID]] = None


class ResearchProjectResponse(ResearchProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    professor_id: UUID
    professor_name: Optional[str] = None
    institution_id: UUID
    institution_name: Optional[str] = None
    department_name: Optional[str] = None
    interest_names: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
