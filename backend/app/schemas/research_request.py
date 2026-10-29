from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.common import RequestStatus


class ResearchRequestCreate(BaseModel):
    professor_id: UUID
    project_id: Optional[UUID] = None
    subject: str = Field(..., min_length=3, max_length=200)
    motivation_statement: str = Field(..., min_length=20, max_length=5000)
    student_skills: List[str] = Field(default_factory=list)
    proposed_availability_hours: int = Field(default=10, ge=1, le=80)
    supporting_document_id: Optional[UUID] = None


class StatusTransitionRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=1000)


class RequestInformationPayload(BaseModel):
    notes: str = Field(..., min_length=5, max_length=1000, description="Details of information required")


class StatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    request_id: UUID
    old_status: Optional[RequestStatus] = None
    new_status: RequestStatus
    changed_by: UUID
    changed_by_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


class ResearchRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    professor_id: UUID
    professor_name: Optional[str] = None
    project_id: Optional[UUID] = None
    project_title: Optional[str] = None
    subject: str
    motivation_statement: str
    student_skills: List[str] = Field(default_factory=list)
    proposed_availability_hours: int
    supporting_document_id: Optional[UUID] = None
    status: RequestStatus
    status_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    status_history: List[StatusHistoryResponse] = Field(default_factory=list)
