from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    institution_id: UUID
    name: str
    code: Optional[str] = None
    is_active: bool = True
    created_at: datetime


class InstitutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    verified_domains: List[str] = Field(default_factory=list)
    is_active: bool = True
    departments: List[DepartmentResponse] = Field(default_factory=list)
    created_at: datetime


class ResearchInterestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    category: Optional[str] = None
