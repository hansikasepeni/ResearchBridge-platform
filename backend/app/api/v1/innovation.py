from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import get_current_user, require_admin, require_professor, require_student
from app.core.errors import ForbiddenError
from app.schemas.common import MessageResponse
from app.schemas.innovation import (
    CollaborationGraphResponse,
    ContributionSummaryPortfolioResponse,
    CrossDepartmentDiscoveryResponse,
    FairOpportunityReportResponse,
    IdeaProposalCreate,
    IdeaProposalResponse,
    OpportunityGapAnalysisResponse,
    OpportunityRadarResponse,
    ProjectBreakdownRequest,
    ProjectBreakdownResponse,
    ResearchIdeaCreate,
    ResearchIdeaResponse,
    SkillEndorsementRequest,
    SkillPassportCreate,
    SkillPassportResponse,
    StudentContributionCreate,
    StudentContributionResponse,
    TalentMatcherResponse,
    TeamCompositionRequest,
    TeamCompositionResponse,
)
from app.schemas.profile import ProfileResponse
from app.services.innovation_service import innovation_service

router = APIRouter(tags=["Innovation & Differentiator Suite"])


# ---------------------------------------------------------------------------
# 1. Explainable AI Talent Matcher (Faculty-facing candidate scoring)
# ---------------------------------------------------------------------------
@router.get("/recommendations/projects/{project_id}/talent-matcher", response_model=TalentMatcherResponse)
async def match_talent_for_project(
    project_id: UUID,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Feature 1: Recommends suitable students for a faculty project, explaining why
    each person is a match, missing skills, supporting project evidence, and alternatives.
    """
    return await innovation_service.match_talent_for_project(project_id)


# ---------------------------------------------------------------------------
# 2. Evidence-Based Skill Passport
# ---------------------------------------------------------------------------
@router.post("/skills/passport", response_model=SkillPassportResponse, status_code=status.HTTP_201_CREATED)
async def add_skill_passport_entry(
    payload: SkillPassportCreate,
    current_user: ProfileResponse = Depends(require_student),
):
    """
    Feature 2: Adds a skill with an evidence trail (self-reported, project-supported, or document-backed).
    """
    return await innovation_service.add_skill_passport(current_user.id, payload.model_dump())


@router.get("/skills/passport", response_model=List[SkillPassportResponse])
async def list_my_skill_passport(
    student_id: Optional[UUID] = Query(None, description="Optional target student ID to view"),
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Feature 2: Retrieves verified skill passport entries.
    """
    target = student_id or current_user.id
    return await innovation_service.list_student_passports(target)


@router.post("/skills/passport/{skill_id}/endorse", response_model=SkillPassportResponse)
async def endorse_student_skill(
    skill_id: UUID,
    payload: SkillEndorsementRequest,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Feature 2: Allows verified faculty to review evidence and formally endorse a student's skill.
    """
    return await innovation_service.endorse_skill(
        skill_id=skill_id,
        endorser=current_user,
        notes=payload.endorsement_notes,
        verified_proficiency=payload.verified_proficiency or "advanced",
    )


# ---------------------------------------------------------------------------
# 3. AI Team Composer
# ---------------------------------------------------------------------------
@router.post("/teams/compose", response_model=TeamCompositionResponse)
async def compose_research_team(
    payload: TeamCompositionRequest,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Feature 3: Assembles a multidisciplinary research team, displaying coverage score,
    missing roles, and alternative candidate combinations.
    """
    return await innovation_service.compose_team(payload)


# ---------------------------------------------------------------------------
# 4. Opportunity Gap Analyzer
# ---------------------------------------------------------------------------
@router.get("/research-projects/{project_id}/gap-analysis", response_model=OpportunityGapAnalysisResponse)
async def analyze_opportunity_gap(
    project_id: UUID,
    current_user: ProfileResponse = Depends(require_student),
):
    """
    Feature 4: Analyzes what a student is missing for a target project and provides
    a structured preparation path with beginner-friendly micro-tasks.
    """
    return await innovation_service.analyze_opportunity_gap(project_id, current_user)


# ---------------------------------------------------------------------------
# 5. Research Idea-to-Prototype Pipeline
# ---------------------------------------------------------------------------
@router.post("/pipeline/ideas", response_model=ResearchIdeaResponse, status_code=status.HTTP_201_CREATED)
async def publish_research_idea(
    payload: ResearchIdeaCreate,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Feature 5: Faculty publish early-stage research ideas (not just finished descriptions).
    """
    return await innovation_service.create_research_idea(current_user, payload.model_dump())


@router.get("/pipeline/ideas", response_model=List[ResearchIdeaResponse])
async def list_research_ideas(
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Feature 5: Lists open research ideas in the pipeline across disciplines.
    """
    return await innovation_service.list_research_ideas()


@router.post("/pipeline/ideas/{idea_id}/proposals", response_model=IdeaProposalResponse, status_code=status.HTTP_201_CREATED)
async def submit_idea_proposal(
    idea_id: UUID,
    payload: IdeaProposalCreate,
    current_user: ProfileResponse = Depends(require_student),
):
    """
    Feature 5: Students propose solutions and apply to contribute to early-stage research ideas.
    """
    return await innovation_service.submit_idea_proposal(idea_id, current_user, payload.model_dump())


# ---------------------------------------------------------------------------
# 6. Contribution & Impact Tracker
# ---------------------------------------------------------------------------
@router.post("/contributions", response_model=StudentContributionResponse, status_code=status.HTTP_201_CREATED)
async def log_contribution(
    payload: StudentContributionCreate,
    current_user: ProfileResponse = Depends(require_student),
):
    """
    Feature 6: Logs assigned tasks, completed milestones, hours invested, and deliverables.
    """
    return await innovation_service.log_contribution(current_user.id, payload.model_dump())


@router.get("/contributions/portfolio/{student_id}", response_model=ContributionSummaryPortfolioResponse)
async def get_portfolio_contribution_summary(
    student_id: UUID,
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Feature 6: Generates a verified contribution summary based on actual task records
    that students can add to their academic portfolio.
    """
    return await innovation_service.get_portfolio_contribution_summary(student_id)


# ---------------------------------------------------------------------------
# 7. Cross-Department Talent Discovery
# ---------------------------------------------------------------------------
@router.get("/recommendations/cross-department", response_model=CrossDepartmentDiscoveryResponse)
async def discover_cross_department_talent(
    skill: str = Query(..., min_length=2, description="Required skill (e.g. 'Web Development', 'Robotics')"),
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Feature 7: Recommends students from other departments when their skills fit the project,
    fostering interdisciplinary collaboration across the whole university.
    """
    return await innovation_service.discover_cross_department_talent(current_user, skill)


# ---------------------------------------------------------------------------
# 8. Opportunity Radar for Hidden Talent
# ---------------------------------------------------------------------------
@router.get("/opportunities/radar", response_model=OpportunityRadarResponse)
async def get_opportunity_radar(
    current_user: ProfileResponse = Depends(require_student),
):
    """
    Feature 8: Proactively identifies projects matching the student's demonstrated strengths
    and latent potential, explaining why the opportunity suits them.
    """
    return await innovation_service.get_opportunity_radar_for_student(current_user)


# ---------------------------------------------------------------------------
# 9. Research Collaboration Graph
# ---------------------------------------------------------------------------
@router.get("/collaboration-graph", response_model=CollaborationGraphResponse)
async def get_collaboration_graph(
    current_user: ProfileResponse = Depends(get_current_user),
):
    """
    Feature 9: Generates visual network data connecting students, faculty, skills,
    research interests, and projects for visual graph rendering.
    """
    return await innovation_service.get_collaboration_graph()


# ---------------------------------------------------------------------------
# 10. Fair Opportunity Monitor
# ---------------------------------------------------------------------------
@router.get("/admin/fair-opportunity-monitor", response_model=FairOpportunityReportResponse)
async def get_fair_opportunity_monitor(
    current_user: ProfileResponse = Depends(require_admin),
):
    """
    Feature 10: Audits recommendation distribution to prevent opportunity monopolization,
    monitoring candidate pool consideration, beginner openings, and department representation.
    """
    return await innovation_service.get_fair_opportunity_report()


# ---------------------------------------------------------------------------
# 11. Automatic Research Project Breakdown
# ---------------------------------------------------------------------------
@router.post("/ai/project-breakdown", response_model=ProjectBreakdownResponse)
async def generate_project_breakdown(
    payload: ProjectBreakdownRequest,
    current_user: ProfileResponse = Depends(require_professor),
):
    """
    Feature 11: Decomposes a research idea into assignable student work packages,
    prerequisite skills, roles, and deliverables without requiring any new API keys.
    """
    duration = payload.target_duration or "1 semester"
    return await innovation_service.generate_project_breakdown(payload.research_idea, duration)
