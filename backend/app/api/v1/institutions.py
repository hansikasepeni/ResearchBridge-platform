from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_current_user
from app.repositories.db_adapter import db
from app.schemas.institution import (
    DepartmentResponse,
    InstitutionResponse,
    ResearchInterestResponse,
)
from app.schemas.profile import ProfileResponse

router = APIRouter(tags=["Institutions & Metadata"])


@router.get("/institutions", response_model=List[InstitutionResponse])
async def list_institutions():
    """
    Lists active universities and research institutions.
    """
    institutions = []
    for inst in db.institutions.values():
        if inst.get("is_active"):
            # Attach departments
            depts = [
                DepartmentResponse(**d)
                for d in db.departments.values()
                if str(d.get("institution_id")) == str(inst["id"]) and d.get("is_active")
            ]
            inst_copy = dict(inst)
            inst_copy["departments"] = depts
            institutions.append(InstitutionResponse(**inst_copy))
    return institutions


@router.get("/departments", response_model=List[DepartmentResponse])
async def list_departments(
    institution_id: Optional[UUID] = Query(None, description="Filter departments by institution"),
):
    """
    Lists academic departments.
    """
    results = []
    for d in db.departments.values():
        if d.get("is_active"):
            if institution_id and str(d.get("institution_id")) != str(institution_id):
                continue
            results.append(DepartmentResponse(**d))
    return results


@router.get("/research-interests", response_model=List[ResearchInterestResponse])
async def list_research_interests():
    """
    Returns the global research interest taxonomy.
    """
    return [ResearchInterestResponse(**r) for r in db.research_interests.values()]
