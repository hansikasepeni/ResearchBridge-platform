from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from app.schemas.common import VerificationStatus, AccountStatus


class AdminProfessorDecision(BaseModel):
    decision: Optional[VerificationStatus] = Field(None, description="'approved' or 'rejected'")
    admin_notes: Optional[str] = Field(None, max_length=1000)


class AdminInstitutionCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    slug: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9\-]+$")
    verified_domains: List[str] = Field(default_factory=list)
    is_active: bool = True


class AdminDepartmentCreate(BaseModel):
    institution_id: UUID
    name: str = Field(..., min_length=2, max_length=150)
    code: Optional[str] = Field(None, max_length=20)
    is_active: bool = True


class AdminAccountStatusUpdate(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: Optional[UUID] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None
    created_at: datetime
