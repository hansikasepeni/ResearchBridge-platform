from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from app.api.dependencies import get_current_user, require_professor
from app.core.errors import ForbiddenError, NotFoundError
from app.repositories.db_adapter import db
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.profile import ProfileResponse
from app.schemas.research_project import (
    ResearchProjectCreate,
    ResearchProjectResponse,
    ResearchProjectUpdate,
)

router = APIRouter(tags=["Research Projects"])


@router.get("/research-projects", response_model=PaginatedResponse[ResearchProjectResponse])
async def list_research_projects(
    search: Optional[str] = Query(None, description="Search in title or summary"),
    department_id: Optional[UUID] = Query(None),
    arrangement: Optional[str] = Query(None),
    status: Optional[str] = Query("open"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Lists research projects available to students, with department, arrangement, and status filters.
    """
    items, total = await db.list_research_projects(
        search=search,
        department_id=str(department_id) if department_id else None,
        arrangement=arrangement,
        status=status,
        page=page,
        limit=limit,
    )
    pages = (total + limit - 1) // limit if total > 0 else 1
    return PaginatedResponse(
        items=[ResearchProjectResponse(**item) for item in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/professors/me/research-projects", response_model=List[ResearchProjectResponse])
async def list_my_research_projects(
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Lists all research projects managed by the authenticated professor.
    """
    items, _ = await db.list_research_projects(
        professor_id=str(current_user.id),
        status=None,
        limit=100,
    )
    return [ResearchProjectResponse(**item) for item in items]


@router.get("/research-projects/{project_id}", response_model=ResearchProjectResponse)
async def get_research_project(
    project_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Retrieves full details of a specific research project.
    """
    proj = await db.get_research_project(str(project_id))
    if not proj:
        raise NotFoundError("Research project not found.")
    return ResearchProjectResponse(**proj)


@router.post(
    "/research-projects",
    response_model=ResearchProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_research_project(
    payload: ResearchProjectCreate,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Creates a new research project and advertised openings.
    """
    data = payload.model_dump(exclude_unset=True)
    data["professor_id"] = str(current_user.id)
    data["institution_id"] = str(current_user.institution_id) if current_user.institution_id else "22222222-2222-2222-2222-222222222201"
    if data.get("department_id"):
        data["department_id"] = str(data["department_id"])

    created = await db.create_research_project(data)
    return ResearchProjectResponse(**created)


@router.patch("/research-projects/{project_id}", response_model=ResearchProjectResponse)
async def update_research_project(
    project_id: UUID,
    payload: ResearchProjectUpdate,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Updates a research project. Enforces ownership: only supervising professor or admin.
    """
    proj = await db.get_research_project(str(project_id))
    if not proj:
        raise NotFoundError("Research project not found.")

    if str(proj.get("professor_id")) != str(current_user.id) and current_user.role != "admin":
        raise ForbiddenError("You may only modify projects you supervise.")

    updates = payload.model_dump(exclude_unset=True)
    if updates.get("department_id"):
        updates["department_id"] = str(updates["department_id"])

    updated = await db.update_research_project(str(project_id), updates)
    return ResearchProjectResponse(**updated)


@router.delete("/research-projects/{project_id}", response_model=MessageResponse)
async def delete_research_project(
    project_id: UUID,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Deletes a research project.
    """
    proj = await db.get_research_project(str(project_id))
    if not proj:
        raise NotFoundError("Research project not found.")

    if str(proj.get("professor_id")) != str(current_user.id) and current_user.role != "admin":
        raise ForbiddenError("You may only delete projects you supervise.")

    await db.delete_research_project(str(project_id))
    return MessageResponse(message="Research project deleted successfully.")
