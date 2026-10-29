from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_current_user, require_professor
from app.core.errors import NotFoundError
from app.repositories.db_adapter import db
from app.schemas.common import PaginatedResponse
from app.schemas.professor import (
    ProfessorDashboardResponse,
    ProfessorDetailResponse,
    ProfessorListItem,
)
from app.schemas.profile import (
    ProfessorProfileFields,
    ProfessorProfileUpdate,
    ProfileResponse,
)

router = APIRouter(tags=["Professor Discovery & Details"])


@router.get("/professors", response_model=PaginatedResponse[ProfessorListItem])
async def list_professors(
    search: Optional[str] = Query(None, description="Search across name, bio, or research interests"),
    institution_id: Optional[UUID] = Query(None, description="Filter by institution"),
    department_id: Optional[UUID] = Query(None, description="Filter by department"),
    interest: Optional[str] = Query(None, description="Filter by research interest"),
    is_accepting: Optional[bool] = Query(None, description="Filter by student supervision availability"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Search and discover professors with filtering across institution, department, research topics, and capacity.
    """
    items, total = await db.list_professors(
        search=search,
        institution_id=str(institution_id) if institution_id else None,
        department_id=str(department_id) if department_id else None,
        interest=interest,
        is_accepting=is_accepting,
        page=page,
        limit=limit,
    )

    pages = (total + limit - 1) // limit if total > 0 else 1
    return PaginatedResponse(
        items=[ProfessorListItem(**item) for item in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/professors/me/dashboard", response_model=ProfessorDashboardResponse)
async def get_professor_dashboard(
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Returns aggregated dashboard metrics for the authenticated professor.
    """
    prof_id = str(current_user.id)
    requests = await db.list_research_requests(prof_id, role="professor")
    projects, _ = await db.list_research_projects(professor_id=prof_id, status=None, limit=100)
    publications = await db.list_publications(prof_id, viewer_id=prof_id)

    pending_count = sum(1 for r in requests if r.get("status") in ("submitted", "under_review"))
    accepted_count = sum(1 for r in requests if r.get("status") == "accepted")

    return ProfessorDashboardResponse(
        professor_id=current_user.id,
        total_received_requests=len(requests),
        pending_requests_count=pending_count,
        accepted_students_count=accepted_count,
        active_projects_count=len(projects),
        publications_count=len(publications),
        unread_messages_count=0,
        recent_requests=requests[:5],
    )


@router.get("/professors/{professor_id}", response_model=ProfessorDetailResponse)
async def get_professor_details(
    professor_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Retrieves full public academic details for a specific professor.
    """
    profile = await db.get_profile(str(professor_id))
    if not profile or profile.get("role") != "professor":
        raise NotFoundError("Professor profile not found.")

    p_ext = await db.get_professor_profile(str(professor_id)) or {}
    pubs = await db.list_publications(str(professor_id), viewer_id=str(current_user.id))
    projs, _ = await db.list_research_projects(professor_id=str(professor_id), status="open")

    return ProfessorDetailResponse(
        id=profile["id"],
        full_name=profile["full_name"],
        email=profile["email"],
        avatar_url=profile.get("avatar_url"),
        bio=profile.get("bio") or p_ext.get("biography"),
        institution_id=profile.get("institution_id"),
        institution_name=profile.get("institution_name"),
        department_id=profile.get("department_id"),
        department_name=profile.get("department_name"),
        academic_title=p_ext.get("academic_title", "Assistant Professor"),
        research_interests=p_ext.get("research_interests", []),
        is_accepting_students=p_ext.get("is_accepting_students", True),
        advertised_openings_count=p_ext.get("advertised_openings_count", 1),
        max_student_capacity=p_ext.get("max_student_capacity", 5),
        preferred_qualifications=p_ext.get("preferred_qualifications"),
        preferred_weekly_hours=p_ext.get("preferred_weekly_hours", 10),
        office_location=p_ext.get("office_location"),
        office_hours=p_ext.get("office_hours"),
        publications_count=len(pubs),
        active_projects_count=len(projs),
    )


@router.patch("/professors/me", response_model=ProfessorProfileFields)
async def update_my_professor_profile(
    updates: ProfessorProfileUpdate,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Updates the authenticated professor's supervision details and availability.
    """
    data = updates.model_dump(exclude_unset=True)
    updated = await db.update_professor_profile(str(current_user.id), data)
    return ProfessorProfileFields(**updated)
