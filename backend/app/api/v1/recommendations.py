from typing import List
from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_current_user
from app.schemas.profile import ProfileResponse
from app.schemas.recommendation import (
    ProfessorRecommendationItem,
    ProjectRecommendationItem,
)
from app.services.matching_service import matching_service

router = APIRouter(tags=["Matching & Recommendations"])


@router.get("/recommendations/professors", response_model=List[ProfessorRecommendationItem])
async def get_professor_recommendations(
    limit: int = Query(10, ge=1, le=50),
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Computes explainable professor recommendations for the authenticated student
    based on overlapping research interests, department alignment, and active availability.
    """
    return await matching_service.recommend_professors(current_user, limit=limit)


@router.get("/recommendations/projects", response_model=List[ProjectRecommendationItem])
async def get_project_recommendations(
    limit: int = Query(10, ge=1, le=50),
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Computes explainable research project openings matching the student's prerequisite skills.
    """
    return await matching_service.recommend_projects(current_user, limit=limit)
