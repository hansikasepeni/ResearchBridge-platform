from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.api.dependencies import get_current_user, require_student
from app.core.errors import ForbiddenError, NotFoundError
from app.repositories.db_adapter import db
from app.schemas.common import RequestStatus
from app.schemas.profile import ProfileResponse
from app.schemas.research_request import (
    RequestInformationPayload,
    ResearchRequestCreate,
    ResearchRequestResponse,
    StatusTransitionRequest,
)
from app.services.request_service import request_service

router = APIRouter(tags=["Research Collaboration Requests"])


@router.post(
    "/research-requests",
    response_model=ResearchRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_research_request(
    payload: ResearchRequestCreate,
    current_user: ProfileResponse = Depends(require_student),
):
    """
    Submits a research collaboration application from student to professor.
    Enforces uniqueness: no duplicate active applications to same professor & project.
    """
    created = await request_service.create_request(
        student_id=current_user.id,
        professor_id=payload.professor_id,
        project_id=payload.project_id,
        subject=payload.subject,
        motivation_statement=payload.motivation_statement,
        student_skills=payload.student_skills,
        proposed_availability_hours=payload.proposed_availability_hours,
        supporting_document_id=payload.supporting_document_id,
    )
    return ResearchRequestResponse(**created)


@router.get("/research-requests", response_model=List[ResearchRequestResponse])
async def list_research_requests(
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Lists research requests.
    Students see their submitted requests;
    Professors see incoming requests sent to them.
    """
    items = await db.list_research_requests(
        user_id=str(current_user.id),
        role=current_user.role.value,
    )
    return [ResearchRequestResponse(**item) for item in items]


@router.get("/research-requests/{request_id}", response_model=ResearchRequestResponse)
async def get_research_request(
    request_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Retrieves a single research request and its status audit history.
    Enforces authorization: only student applicant, target professor, or admin.
    """
    req = await db.get_research_request(str(request_id))
    if not req:
        raise NotFoundError("Research request not found.")

    is_student = str(req.get("student_id")) == str(current_user.id)
    is_prof = str(req.get("professor_id")) == str(current_user.id)
    is_admin = current_user.role == "admin"

    if not (is_student or is_prof or is_admin):
        raise ForbiddenError("You are not authorized to view this research request.")

    return ResearchRequestResponse(**req)


@router.post("/research-requests/{request_id}/accept", response_model=ResearchRequestResponse)
async def accept_research_request(
    request_id: UUID,
    payload: Optional[StatusTransitionRequest] = None,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Accepts a student's research application. Only target professor or admin.
    """
    notes = payload.notes if payload else "Application accepted."
    updated = await request_service.transition_status(
        request_id=request_id,
        new_status=RequestStatus.ACCEPTED,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        notes=notes,
    )
    return ResearchRequestResponse(**updated)


@router.post("/research-requests/{request_id}/reject", response_model=ResearchRequestResponse)
async def reject_research_request(
    request_id: UUID,
    payload: Optional[StatusTransitionRequest] = None,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Rejects a research application. Only target professor or admin.
    """
    notes = payload.notes if payload else "Application declined."
    updated = await request_service.transition_status(
        request_id=request_id,
        new_status=RequestStatus.REJECTED,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        notes=notes,
    )
    return ResearchRequestResponse(**updated)


@router.post("/research-requests/{request_id}/request-information", response_model=ResearchRequestResponse)
async def request_information(
    request_id: UUID,
    payload: RequestInformationPayload,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Requests additional details from the applicant.
    """
    updated = await request_service.transition_status(
        request_id=request_id,
        new_status=RequestStatus.NEEDS_INFORMATION,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        notes=payload.notes,
    )
    return ResearchRequestResponse(**updated)


@router.post("/research-requests/{request_id}/withdraw", response_model=ResearchRequestResponse)
async def withdraw_research_request(
    request_id: UUID,
    payload: Optional[StatusTransitionRequest] = None,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Allows a student to withdraw their active application.
    """
    notes = payload.notes if payload else "Application withdrawn by applicant."
    updated = await request_service.transition_status(
        request_id=request_id,
        new_status=RequestStatus.WITHDRAWN,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        notes=notes,
    )
    return ResearchRequestResponse(**updated)
