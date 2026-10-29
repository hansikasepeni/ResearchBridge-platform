from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, HttpUrl
from app.schemas.common import PublicationVisibility


class PublicationBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=300)
    abstract: Optional[str] = Field(None, max_length=5000)
    authors: List[str] = Field(default_factory=list)
    venue: Optional[str] = Field(None, max_length=200)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    doi: Optional[str] = Field(None, pattern=r"^(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)?$")
    external_url: Optional[str] = None
    pdf_document_id: Optional[UUID] = None
    visibility: PublicationVisibility = PublicationVisibility.PUBLIC


class PublicationCreate(PublicationBase):
    pass


class PublicationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=300)
    abstract: Optional[str] = Field(None, max_length=5000)
    authors: Optional[List[str]] = None
    venue: Optional[str] = Field(None, max_length=200)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    doi: Optional[str] = Field(None, pattern=r"^(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)?$")
    external_url: Optional[str] = None
    pdf_document_id: Optional[UUID] = None
    visibility: Optional[PublicationVisibility] = None


class PublicationResponse(PublicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    professor_id: UUID
    professor_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
