from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.profile import ProfessorProfileFields


class ProfessorListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    institution_id: Optional[UUID] = None
    institution_name: Optional[str] = None
    department_id: Optional[UUID] = None
    department_name: Optional[str] = None
    academic_title: str = "Assistant Professor"
    research_interests: List[str] = Field(default_factory=list)
    is_accepting_students: bool = True
    advertised_openings_count: int = 1
    max_student_capacity: int = 5


class ProfessorDetailResponse(ProfessorListItem):
    preferred_qualifications: Optional[str] = None
    preferred_weekly_hours: int = 10
    office_location: Optional[str] = None
    office_hours: Optional[str] = None
    publications_count: int = 0
    active_projects_count: int = 0


class ProfessorDashboardResponse(BaseModel):
    professor_id: UUID
    total_received_requests: int
    pending_requests_count: int
    accepted_students_count: int
    active_projects_count: int
    publications_count: int
    unread_messages_count: int
    recent_requests: List[dict] = Field(default_factory=list)
