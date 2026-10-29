from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.professor import ProfessorListItem
from app.schemas.research_project import ResearchProjectResponse


class ProfessorRecommendationItem(BaseModel):
    professor: ProfessorListItem
    match_score: float = Field(..., ge=0.0, le=100.0)
    match_reasons: List[str] = Field(default_factory=list)


class ProjectRecommendationItem(BaseModel):
    project: ResearchProjectResponse
    match_score: float = Field(..., ge=0.0, le=100.0)
    match_reasons: List[str] = Field(default_factory=list)
