from typing import List, Optional
from uuid import UUID
from app.repositories.db_adapter import db
from app.schemas.profile import ProfileResponse
from app.schemas.professor import ProfessorListItem
from app.schemas.research_project import ResearchProjectResponse
from app.schemas.recommendation import ProfessorRecommendationItem, ProjectRecommendationItem


class MatchingService:
    async def recommend_professors(
        self, student_profile: ProfileResponse, limit: int = 10
    ) -> List[ProfessorRecommendationItem]:
        """
        Calculates explainable recommendations of professors for a given student.
        """
        # Fetch candidate professors
        inst_id = str(student_profile.institution_id) if student_profile.institution_id else None
        prof_items, _ = await db.list_professors(
            institution_id=inst_id,
            page=1,
            limit=100,
        )

        student_interests = set(i.lower().strip() for i in student_profile.academic_interests)
        student_skills = set(s.lower().strip() for s in student_profile.relevant_skills)

        recommendations = []
        for prof in prof_items:
            score = 20.0  # Base score for same institution/active
            reasons = []

            if prof.get("is_accepting_students"):
                score += 25.0
                openings = prof.get("advertised_openings_count", 1)
                reasons.append(f"Actively accepting research students ({openings} advertised opening{'s' if openings > 1 else ''})")
            else:
                score -= 10.0

            prof_interests = [i.lower().strip() for i in prof.get("research_interests", [])]
            matched_interests = [i for i in prof.get("research_interests", []) if i.lower().strip() in student_interests]

            if matched_interests:
                score += min(35.0, len(matched_interests) * 15.0)
                reasons.append(f"Shared research interest{'s' if len(matched_interests) > 1 else ''}: {', '.join(matched_interests)}")

            # Skill overlap with preferred qualifications or interests
            matched_skills = [s for s in student_profile.relevant_skills if any(s.lower() in pi for pi in prof_interests)]
            if matched_skills:
                score += min(20.0, len(matched_skills) * 10.0)
                reasons.append(f"Relevant student skill{'s' if len(matched_skills) > 1 else ''}: {', '.join(matched_skills)}")

            if not reasons:
                reasons.append("Faculty member in your institution's department")

            score = min(100.0, max(10.0, score))
            recommendations.append(
                ProfessorRecommendationItem(
                    professor=ProfessorListItem(**prof),
                    match_score=round(score, 1),
                    match_reasons=reasons,
                )
            )

        # Sort descending by score
        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        return recommendations[:limit]

    async def recommend_projects(
        self, student_profile: ProfileResponse, limit: int = 10
    ) -> List[ProjectRecommendationItem]:
        """
        Calculates explainable recommendations of open research projects for a given student.
        """
        inst_id = str(student_profile.institution_id) if student_profile.institution_id else None
        projects, _ = await db.list_research_projects(
            status="open",
            page=1,
            limit=100,
        )

        student_interests = set(i.lower().strip() for i in student_profile.academic_interests)
        student_skills = set(s.lower().strip() for s in student_profile.relevant_skills)

        recommendations = []
        for proj in projects:
            # Check institution match
            if inst_id and str(proj.get("institution_id")) != inst_id:
                continue

            score = 25.0
            reasons = []

            # Check required skills
            prereqs = proj.get("prerequisite_skills", [])
            matched_skills = [sk for sk in prereqs if sk.lower().strip() in student_skills]
            if matched_skills:
                score += min(40.0, len(matched_skills) * 20.0)
                reasons.append(f"You meet prerequisite skill{'s' if len(matched_skills) > 1 else ''}: {', '.join(matched_skills)}")

            # Check open openings
            openings = proj.get("openings_count", 1)
            score += 15.0
            reasons.append(f"{openings} open position{'s' if openings > 1 else ''}")

            # Check department alignment
            if student_profile.department_id and str(proj.get("department_id")) == str(student_profile.department_id):
                score += 10.0
                reasons.append("Project is within your academic department")

            if not reasons:
                reasons.append("Open research opening in your institution")

            score = min(100.0, max(10.0, score))
            recommendations.append(
                ProjectRecommendationItem(
                    project=ResearchProjectResponse(**proj),
                    match_score=round(score, 1),
                    match_reasons=reasons,
                )
            )

        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        return recommendations[:limit]


matching_service = MatchingService()
