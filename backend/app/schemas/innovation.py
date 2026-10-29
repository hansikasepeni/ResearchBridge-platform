from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# 1. Explainable AI Talent Matcher
# ---------------------------------------------------------------------------
class TalentCandidateMatch(BaseModel):
    student_id: UUID
    full_name: str
    email: str
    degree: Optional[str] = None
    department_name: Optional[str] = None
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    supporting_project_evidence: List[str]
    explanation: str
    readiness_level: str  # "immediate_fit", "minor_upskill_needed", "foundational"


class TalentMatcherResponse(BaseModel):
    project_id: UUID
    project_title: str
    total_evaluated_candidates: int
    matched_candidates: List[TalentCandidateMatch]
    alternative_candidates: List[TalentCandidateMatch]


# ---------------------------------------------------------------------------
# 2. Evidence-Based Skill Passport
# ---------------------------------------------------------------------------
class SkillPassportCreate(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=100)
    proficiency_level: str = Field("intermediate", pattern=r"^(beginner|intermediate|advanced|expert)$")
    verification_tier: str = Field("self_reported", pattern=r"^(self_reported|project_supported|faculty_endorsed)$")
    evidence_url: Optional[str] = None
    evidence_description: Optional[str] = None
    supporting_document_id: Optional[UUID] = None


class SkillEndorsementRequest(BaseModel):
    endorsement_notes: str = Field(..., min_length=5, max_length=1000)
    verified_proficiency: Optional[str] = Field("advanced", pattern=r"^(beginner|intermediate|advanced|expert)$")


class SkillPassportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    skill_name: str
    proficiency_level: str
    verification_tier: str
    evidence_url: Optional[str] = None
    evidence_description: Optional[str] = None
    supporting_document_id: Optional[UUID] = None
    endorsed_by: Optional[UUID] = None
    endorser_name: Optional[str] = None
    endorsement_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# 3. AI Team Composer
# ---------------------------------------------------------------------------
class TeamRoleRequirement(BaseModel):
    role_name: str  # e.g., "Frontend Developer", "AI / PyTorch Student"
    required_skills: List[str]
    minimum_hours: int = 10


class TeamCompositionRequest(BaseModel):
    project_id: Optional[UUID] = None
    project_title: str = "Research Initiative"
    roles: List[TeamRoleRequirement]


class TeamMemberAssignment(BaseModel):
    role_name: str
    student_id: UUID
    student_name: str
    student_skills: List[str]
    covered_skills: List[str]
    missing_skills: List[str]


class TeamCombination(BaseModel):
    team_id: str
    team_name: str
    overall_coverage_score: float
    members: List[TeamMemberAssignment]
    uncovered_skills: List[str]
    synergy_highlights: List[str]


class TeamCompositionResponse(BaseModel):
    project_title: str
    recommended_team: TeamCombination
    alternative_teams: List[TeamCombination]


# ---------------------------------------------------------------------------
# 4. Opportunity Gap Analyzer
# ---------------------------------------------------------------------------
class PreparationStep(BaseModel):
    step_number: int
    title: str
    description: str
    estimated_time: str
    learning_resources: List[str]


class OpportunityGapAnalysisResponse(BaseModel):
    project_id: UUID
    project_title: str
    student_id: UUID
    readiness_percentage: float
    qualified_skills: List[str]
    missing_skills: List[str]
    preparation_path: List[PreparationStep]
    recommended_beginner_tasks: List[str]
    can_reapply: bool = True


# ---------------------------------------------------------------------------
# 5. Research Idea-to-Prototype Pipeline
# ---------------------------------------------------------------------------
class ResearchIdeaCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    problem_statement: str = Field(..., min_length=20)
    vision_description: str = Field(..., min_length=20)
    required_disciplines: List[str] = Field(default_factory=list)
    target_prototype_outcome: Optional[str] = None
    is_interdisciplinary: bool = True
    is_beginner_friendly: bool = False


class ResearchIdeaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    professor_id: UUID
    professor_name: Optional[str] = None
    institution_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    title: str
    problem_statement: str
    vision_description: str
    required_disciplines: List[str]
    stage: str
    target_prototype_outcome: Optional[str] = None
    is_interdisciplinary: bool
    is_beginner_friendly: bool
    proposals_count: int = 0
    created_at: datetime


class IdeaProposalCreate(BaseModel):
    proposal_title: str = Field(..., min_length=5, max_length=200)
    proposed_approach: str = Field(..., min_length=20)
    contributor_role: str = Field(..., min_length=2, max_length=100)


class IdeaProposalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    idea_id: UUID
    student_id: UUID
    student_name: Optional[str] = None
    proposal_title: str
    proposed_approach: str
    contributor_role: str
    status: str
    faculty_feedback: Optional[str] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# 6. Contribution & Impact Tracker
# ---------------------------------------------------------------------------
class StudentContributionCreate(BaseModel):
    project_id: UUID
    task_name: str = Field(..., min_length=3, max_length=200)
    deliverable_summary: str = Field(..., min_length=10)
    deliverable_url: Optional[str] = None
    hours_logged: int = Field(1, ge=1, le=200)


class StudentContributionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    project_id: UUID
    task_name: str
    deliverable_summary: str
    deliverable_url: Optional[str] = None
    hours_logged: int
    status: str
    faculty_feedback: Optional[str] = None
    verified_by: Optional[UUID] = None
    verified_at: Optional[datetime] = None
    created_at: datetime


class ContributionSummaryPortfolioResponse(BaseModel):
    student_id: UUID
    student_name: str
    total_hours_contributed: int
    completed_milestones_count: int
    verified_tasks: List[StudentContributionResponse]
    verified_statement: str


# ---------------------------------------------------------------------------
# 7. Cross-Department Talent Discovery
# ---------------------------------------------------------------------------
class CrossDepartmentTalentMatch(BaseModel):
    student_id: UUID
    full_name: str
    department_name: str
    degree: Optional[str] = None
    relevant_skills: List[str]
    interdisciplinary_synergy: str
    match_score: float


class CrossDepartmentDiscoveryResponse(BaseModel):
    target_skill: str
    total_cross_dept_found: int
    results: List[CrossDepartmentTalentMatch]


# ---------------------------------------------------------------------------
# 8. Opportunity Radar for Hidden Talent
# ---------------------------------------------------------------------------
class OpportunityRadarAlert(BaseModel):
    project_id: UUID
    project_title: str
    professor_name: str
    radar_score: float
    potential_explanation: str
    is_beginner_friendly: bool
    matched_strengths: List[str]


class OpportunityRadarResponse(BaseModel):
    student_id: UUID
    radar_opportunities: List[OpportunityRadarAlert]


# ---------------------------------------------------------------------------
# 9. Research Collaboration Graph
# ---------------------------------------------------------------------------
class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "student", "professor", "project", "skill", "department"
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str  # "POSSESSES_SKILL", "REQUIRES_SKILL", "SUPERVISES", "AFFILIATED_WITH"
    weight: float = 1.0


class CollaborationGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int


# ---------------------------------------------------------------------------
# 10. Fair Opportunity Monitor
# ---------------------------------------------------------------------------
class DepartmentDiversityMetric(BaseModel):
    department_name: str
    total_students: int
    recommended_count: int
    coverage_rate: float


class FairOpportunityReportResponse(BaseModel):
    total_evaluated_students: int
    total_unique_students_recommended: int
    recommendation_concentration_index: float  # 0.0 (perfect distribution) to 1.0 (concentrated)
    beginner_friendly_openings_ratio: float
    department_metrics: List[DepartmentDiversityMetric]
    fairness_audit_passed: bool
    audit_notes: List[str]


# ---------------------------------------------------------------------------
# 11. Automatic Research Project Breakdown
# ---------------------------------------------------------------------------
class ProjectBreakdownRequest(BaseModel):
    research_idea: str = Field(..., min_length=15, max_length=2000)
    target_duration: Optional[str] = "1 semester (16 weeks)"


class BreakdownTask(BaseModel):
    task_name: str
    role: str
    prerequisite_skills: List[str]
    description: str
    estimated_weekly_hours: int
    deliverable: str


class ProjectBreakdownResponse(BaseModel):
    project_title: str
    executive_summary: str
    suggested_timeline: str
    suggested_openings_count: int
    recommended_tasks: List[BreakdownTask]
