from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, status
from app.api.dependencies import require_admin
from app.core.errors import ConflictError, NotFoundError
from app.repositories.db_adapter import db
from app.schemas.admin import (
    AdminAccountStatusUpdate,
    AdminDepartmentCreate,
    AdminInstitutionCreate,
    AdminProfessorDecision,
    AuditLogResponse,
)
from app.schemas.auth import ProfessorOnboardingResponse
from app.schemas.common import AccountStatus, MessageResponse, NotificationType, VerificationStatus
from app.schemas.institution import DepartmentResponse, InstitutionResponse
from app.schemas.profile import ProfileResponse
from app.services.notification_service import notification_service

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/professors/pending", response_model=List[ProfessorOnboardingResponse])
async def list_pending_professor_requests(
    current_admin: ProfileResponse = Depends(require_admin),
):
    """
    Lists pending onboarding requests from professors awaiting credential verification.
    """
    items = await db.list_pending_professor_requests()
    return [ProfessorOnboardingResponse(**item) for item in items]


@router.post("/professors/{request_id}/approve", response_model=ProfessorOnboardingResponse)
async def approve_professor_request(
    request_id: UUID,
    payload: Optional[AdminProfessorDecision] = None,
    current_admin: ProfileResponse = Depends(require_admin),
):
    """
    Approves a professor onboarding request and elevates user's role to 'professor'.
    """
    req = await db.get_professor_onboarding_request(str(request_id))
    if not req:
        raise NotFoundError("Onboarding request not found.")

    admin_notes = payload.admin_notes if payload else "Credentials verified by administrator."
    now = datetime.now(timezone.utc).isoformat()

    # Update onboarding request record
    updated_req = await db.update_professor_onboarding_request(
        str(request_id),
        {
            "status": VerificationStatus.APPROVED.value,
            "reviewed_by": str(current_admin.id),
            "reviewed_at": now,
            "admin_notes": admin_notes,
        },
    )
    if not updated_req:
        raise NotFoundError("Onboarding request not found.")

    user_id = str(req["user_id"])
    # Elevate role in profiles table
    await db.update_profile(user_id, {
        "role": "professor",
        "institution_id": req.get("institution_id"),
        "department_id": req.get("department_id"),
    })

    # Ensure professor extension record is approved
    await db.update_professor_profile(user_id, {
        "academic_title": req.get("academic_title", "Assistant Professor"),
        "verification_status": "approved",
    })

    # Log audit event
    await db.create_audit_log({
        "user_id": str(current_admin.id),
        "action": "PROFESSOR_APPROVED",
        "resource_type": "user",
        "resource_id": user_id,
        "details": {"request_id": str(request_id), "admin_notes": admin_notes},
    })

    # Notify approved professor
    await notification_service.notify(
        recipient_id=UUID(user_id),
        notification_type=NotificationType.PROFESSOR_APPROVED,
        title="Professor Account Approved",
        body="Your professor account has been verified. You can now publish projects and receive student applications.",
    )

    return ProfessorOnboardingResponse(**updated_req)


@router.post("/professors/{request_id}/reject", response_model=ProfessorOnboardingResponse)
async def reject_professor_request(
    request_id: UUID,
    payload: Optional[AdminProfessorDecision] = None,
    current_admin: ProfileResponse = Depends(require_admin),
):
    """
    Rejects a professor onboarding request.
    """
    req = await db.get_professor_onboarding_request(str(request_id))
    if not req:
        raise NotFoundError("Onboarding request not found.")

    admin_notes = payload.admin_notes if payload else "Verification declined."
    now = datetime.now(timezone.utc).isoformat()

    updated_req = await db.update_professor_onboarding_request(
        str(request_id),
        {
            "status": VerificationStatus.REJECTED.value,
            "reviewed_by": str(current_admin.id),
            "reviewed_at": now,
            "admin_notes": admin_notes,
        },
    )
    if not updated_req:
        raise NotFoundError("Onboarding request not found.")

    user_id = str(req["user_id"])
    await db.create_audit_log({
        "user_id": str(current_admin.id),
        "action": "PROFESSOR_REJECTED",
        "resource_type": "user",
        "resource_id": user_id,
        "details": {"request_id": str(request_id), "admin_notes": admin_notes},
    })

    await notification_service.notify(
        recipient_id=UUID(user_id),
        notification_type=NotificationType.PROFESSOR_REJECTED,
        title="Professor Verification Declined",
        body=f"Your professor verification request was not approved: {admin_notes}",
    )

    return ProfessorOnboardingResponse(**updated_req)


@router.post("/institutions", response_model=InstitutionResponse, status_code=status.HTTP_201_CREATED)
async def create_institution(
    payload: AdminInstitutionCreate,
    current_admin: ProfileResponse = Depends(require_admin),
):
    """
    Registers a new university/institution.
    """
    for inst in db.institutions.values():
        if inst["slug"] == payload.slug:
            raise ConflictError("An institution with this slug already exists.")

    now = datetime.now(timezone.utc).isoformat()
    inst_id = str(uuid4())
    record = {
        "id": inst_id,
        "name": payload.name,
        "slug": payload.slug,
        "verified_domains": payload.verified_domains,
        "is_active": payload.is_active,
        "created_at": now,
        "updated_at": now,
    }
    db.institutions[inst_id] = record

    await db.create_audit_log({
        "user_id": str(current_admin.id),
        "action": "INSTITUTION_CREATED",
        "resource_type": "institution",
        "resource_id": inst_id,
        "details": {"name": payload.name, "slug": payload.slug},
    })

    record_copy = dict(record)
    record_copy["departments"] = []
    return InstitutionResponse(**record_copy)


@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    payload: AdminDepartmentCreate,
    current_admin: ProfileResponse = Depends(require_admin),
):
    """
    Creates a new department under an existing institution.
    """
    if str(payload.institution_id) not in db.institutions:
        raise NotFoundError("Institution not found.")

    now = datetime.now(timezone.utc).isoformat()
    dept_id = str(uuid4())
    record = {
        "id": dept_id,
        "institution_id": str(payload.institution_id),
        "name": payload.name,
        "code": payload.code,
        "is_active": payload.is_active,
        "created_at": now,
        "updated_at": now,
    }
    db.departments[dept_id] = record
    return DepartmentResponse(**record)


@router.post("/users/{user_id}/suspend", response_model=MessageResponse)
async def suspend_user(
    user_id: UUID,
    payload: Optional[AdminAccountStatusUpdate] = None,
    current_admin: ProfileResponse = Depends(require_admin),
):
    """
    Suspends a user account to revoke platform access.
    """
    target = await db.get_profile(str(user_id))
    if not target:
        raise NotFoundError("User not found.")

    if target.get("role") == "admin":
        raise ConflictError("Cannot suspend another administrator.")

    await db.update_profile(str(user_id), {"account_status": AccountStatus.SUSPENDED.value})

    await db.create_audit_log({
        "user_id": str(current_admin.id),
        "action": "USER_SUSPENDED",
        "resource_type": "user",
        "resource_id": str(user_id),
        "details": {"reason": payload.reason if payload else "Administrative action"},
    })
    return MessageResponse(message=f"User {user_id} suspended.")


@router.post("/users/{user_id}/reactivate", response_model=MessageResponse)
async def reactivate_user(
    user_id: UUID,
    current_admin: ProfileResponse = Depends(require_admin),
):
    """
    Reactivates a suspended user account.
    """
    target = await db.get_profile(str(user_id))
    if not target:
        raise NotFoundError("User not found.")

    await db.update_profile(str(user_id), {"account_status": AccountStatus.ACTIVE.value})

    await db.create_audit_log({
        "user_id": str(current_admin.id),
        "action": "USER_REACTIVATED",
        "resource_type": "user",
        "resource_id": str(user_id),
    })
    return MessageResponse(message=f"User {user_id} reactivated.")


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    current_admin: ProfileResponse = Depends(require_admin),
):
    """
    Lists administrative audit log records.
    """
    logs = await db.list_audit_logs(limit=100)
    return [AuditLogResponse(**log) for log in logs]
