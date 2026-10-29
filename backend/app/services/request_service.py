from typing import Any, Dict, List, Optional
from uuid import UUID
from app.core.errors import ConflictError, ForbiddenError, NotFoundError, AppException
from app.repositories.db_adapter import db
from app.schemas.common import RequestStatus, NotificationType
from app.services.notification_service import notification_service


class RequestService:
    async def create_request(
        self,
        student_id: UUID,
        professor_id: UUID,
        project_id: Optional[UUID],
        subject: str,
        motivation_statement: str,
        student_skills: List[str],
        proposed_availability_hours: int,
        supporting_document_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Creates a new collaboration request from student to professor.
        Enforces:
        - No duplicate active request for student, professor, project.
        - Student cannot apply to themselves.
        """
        if student_id == professor_id:
            raise ConflictError("You cannot submit a research application to yourself.")

        # Check existing active requests
        existing_requests = await db.list_research_requests(str(student_id), role="student")
        for req in existing_requests:
            if (
                str(req.get("professor_id")) == str(professor_id)
                and str(req.get("project_id")) == str(project_id)
                and req.get("status") in ("submitted", "under_review", "accepted", "needs_information")
            ):
                raise ConflictError("You already have an active application with this professor for this project.")

        record = {
            "student_id": str(student_id),
            "professor_id": str(professor_id),
            "project_id": str(project_id) if project_id else None,
            "subject": subject,
            "motivation_statement": motivation_statement,
            "student_skills": student_skills,
            "proposed_availability_hours": proposed_availability_hours,
            "supporting_document_id": str(supporting_document_id) if supporting_document_id else None,
            "status": RequestStatus.SUBMITTED.value,
        }

        created = await db.create_research_request(record)

        # Notify professor
        student = await db.get_profile(str(student_id))
        student_name = student.get("full_name", "A student") if student else "A student"
        await notification_service.notify(
            recipient_id=professor_id,
            notification_type=NotificationType.REQUEST_SUBMITTED,
            title="New Research Collaboration Request",
            body=f"{student_name} submitted a research request: '{subject}'",
            metadata={"request_id": created["id"], "student_id": str(student_id)},
        )

        return created

    async def transition_status(
        self,
        request_id: UUID,
        new_status: RequestStatus,
        actor_id: UUID,
        actor_role: str,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Enforces strict role-based status transition rules.
        """
        req = await db.get_research_request(str(request_id))
        if not req:
            raise NotFoundError("Research request not found.")

        current_status = req.get("status")
        is_student = str(req.get("student_id")) == str(actor_id)
        is_professor = str(req.get("professor_id")) == str(actor_id)
        is_admin = actor_role == "admin"

        if not (is_student or is_professor or is_admin):
            raise ForbiddenError("You are not authorized to update this request.")

        # Student actions: can only withdraw their own application
        if new_status == RequestStatus.WITHDRAWN:
            if not (is_student or is_admin):
                raise ForbiddenError("Only the student applicant or an administrator can withdraw a request.")
            if current_status in (RequestStatus.ACCEPTED.value, RequestStatus.REJECTED.value, RequestStatus.WITHDRAWN.value):
                raise ConflictError(f"Cannot withdraw a request that is already {current_status}.")

        # Professor actions: accept, reject, request information, or mark under_review
        elif new_status in (RequestStatus.ACCEPTED, RequestStatus.REJECTED, RequestStatus.NEEDS_INFORMATION, RequestStatus.UNDER_REVIEW):
            if not (is_professor or is_admin):
                raise ForbiddenError("Only the supervising professor or an administrator can update application review status.")
            if is_student:
                raise ForbiddenError("Students cannot accept, reject, or request information on their own requests.")
            if current_status in (RequestStatus.REJECTED.value, RequestStatus.WITHDRAWN.value):
                raise ConflictError(f"Cannot transition a request that is already {current_status}.")

        updated = await db.update_research_request_status(
            request_id=str(request_id),
            new_status=new_status.value,
            changed_by=str(actor_id),
            notes=notes,
        )

        # Send notifications
        target_recipient = UUID(req["student_id"]) if not is_student else UUID(req["professor_id"])
        status_label = new_status.value.replace("_", " ").title()
        
        notif_type = NotificationType.STATUS_CHANGED
        if new_status == RequestStatus.NEEDS_INFORMATION:
            notif_type = NotificationType.INFORMATION_REQUESTED

        await notification_service.notify(
            recipient_id=target_recipient,
            notification_type=notif_type,
            title=f"Application Status Updated: {status_label}",
            body=f"Your research request '{req.get('subject')}' is now marked as {status_label}. {notes or ''}",
            metadata={"request_id": str(request_id), "new_status": new_status.value},
        )

        return updated


request_service = RequestService()
