from enum import Enum
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class UserRole(str, Enum):
    STUDENT = "student"
    PROFESSOR = "professor"
    ADMIN = "admin"


class AccountStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PublicationVisibility(str, Enum):
    PUBLIC = "public"
    INSTITUTION = "institution"
    PRIVATE = "private"


class ProjectStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    CLOSED = "closed"
    ARCHIVED = "archived"


class ProjectArrangement(str, Enum):
    ON_SITE = "on_site"
    REMOTE = "remote"
    HYBRID = "hybrid"


class CompensationType(str, Enum):
    UNPAID = "unpaid"
    STIPEND = "stipend"
    HOURLY = "hourly"
    CREDIT = "credit"


class RequestStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    NEEDS_INFORMATION = "needs_information"
    WITHDRAWN = "withdrawn"


class DocumentScope(str, Enum):
    PRIVATE = "private"
    SHARED_REQUEST = "shared_request"
    INSTITUTION = "institution"
    PUBLIC = "public"


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    FAILED = "failed"


class NotificationType(str, Enum):
    REQUEST_SUBMITTED = "request_submitted"
    STATUS_CHANGED = "status_changed"
    NEW_MESSAGE = "new_message"
    INFORMATION_REQUESTED = "information_requested"
    PROFESSOR_APPROVED = "professor_approved"
    PROFESSOR_REJECTED = "professor_rejected"
    SYSTEM = "system"


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number, 1-indexed")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int


class MessageResponse(BaseModel):
    message: str
    success: bool = True
