import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from app.core.config import settings
from app.core.logging import logger
from app.repositories.supabase_client import get_supabase_client

PERSISTENCE_FILE = Path(__file__).resolve().parent.parent.parent / "database_state.json"


class DatabaseAdapter:
    """
    Unified database access layer.
    Queries live Supabase PostgreSQL when configured;
    falls back to a rich in-memory store for local testing/development
    matching the schema in database/01_schema.sql and 04_seed.sql.
    """

    def __init__(self):
        self._init_memory_store()
        self._load_from_disk()

    def _save_to_disk(self):
        if "pytest" in sys.modules or os.environ.get("PYTEST_CURRENT_TEST"):
            return
        try:
            state = {
                "profiles": self.profiles,
                "professor_profiles": self.professor_profiles,
                "professor_onboarding_requests": self.professor_onboarding_requests,
                "publications": self.publications,
                "research_projects": self.research_projects,
                "project_interests": self.project_interests,
                "research_requests": self.research_requests,
                "request_status_history": self.request_status_history,
                "request_messages": self.request_messages,
                "documents": self.documents,
                "paper_summaries": self.paper_summaries,
                "ai_conversations": self.ai_conversations,
                "ai_messages": self.ai_messages,
                "notifications": self.notifications,
                "audit_logs": self.audit_logs,
            }
            with open(PERSISTENCE_FILE, "w", encoding="utf-8") as f:
                json.dump(state, f, default=str, indent=2)
        except Exception as e:
            logger.warning(f"Failed to persist database state to disk: {e}")

    def _load_from_disk(self):
        if "pytest" in sys.modules or os.environ.get("PYTEST_CURRENT_TEST"):
            return
        if not PERSISTENCE_FILE.exists():
            return
        try:
            with open(PERSISTENCE_FILE, "r", encoding="utf-8") as f:
                state = json.load(f)
            for k, v in state.items():
                if hasattr(self, k) and isinstance(v, (dict, list)):
                    if isinstance(v, dict):
                        getattr(self, k).update(v)
                    elif isinstance(v, list):
                        target_list = getattr(self, k)
                        id_to_idx = {item.get("id"): idx for idx, item in enumerate(target_list) if isinstance(item, dict) and "id" in item}
                        for item in v:
                            if isinstance(item, dict) and "id" in item and item.get("id") in id_to_idx:
                                target_list[id_to_idx[item.get("id")]] = item
                            else:
                                target_list.append(item)
            logger.info(f"Loaded persistent database state from {PERSISTENCE_FILE}")
        except Exception as e:
            logger.warning(f"Failed to load database state from disk: {e}")

    def _init_memory_store(self):
        now = datetime.now(timezone.utc).isoformat()
        
        # Seed Institutions
        self.institutions: Dict[str, Dict[str, Any]] = {
            "22222222-2222-2222-2222-222222222201": {
                "id": "22222222-2222-2222-2222-222222222201",
                "name": "Stanford University",
                "slug": "stanford",
                "verified_domains": ["stanford.edu"],
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
            "22222222-2222-2222-2222-222222222202": {
                "id": "22222222-2222-2222-2222-222222222202",
                "name": "SRM University AP",
                "slug": "srmap",
                "verified_domains": ["srmap.edu.in"],
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
            "22222222-2222-2222-2222-222222222203": {
                "id": "22222222-2222-2222-2222-222222222203",
                "name": "Massachusetts Institute of Technology",
                "slug": "mit",
                "verified_domains": ["mit.edu"],
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
        }

        # Seed Departments
        self.departments: Dict[str, Dict[str, Any]] = {
            "33333333-3333-3333-3333-333333333301": {
                "id": "33333333-3333-3333-3333-333333333301",
                "institution_id": "22222222-2222-2222-2222-222222222201",
                "name": "Computer Science",
                "code": "CS",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
            "33333333-3333-3333-3333-333333333304": {
                "id": "33333333-3333-3333-3333-333333333304",
                "institution_id": "22222222-2222-2222-2222-222222222202",
                "name": "Computer Science and Engineering",
                "code": "CSE",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
        }

        # Seed Research Interests
        self.research_interests: Dict[str, Dict[str, Any]] = {
            "11111111-1111-1111-1111-111111111101": {
                "id": "11111111-1111-1111-1111-111111111101",
                "name": "Artificial Intelligence",
                "category": "Computer Science",
            },
            "11111111-1111-1111-1111-111111111102": {
                "id": "11111111-1111-1111-1111-111111111102",
                "name": "Machine Learning",
                "category": "Computer Science",
            },
            "11111111-1111-1111-1111-111111111103": {
                "id": "11111111-1111-1111-1111-111111111103",
                "name": "Natural Language Processing",
                "category": "Computer Science",
            },
            "11111111-1111-1111-1111-111111111104": {
                "id": "11111111-1111-1111-1111-111111111104",
                "name": "Computer Vision",
                "category": "Computer Science",
            },
        }

        # Storage collections
        self.profiles: Dict[str, Dict[str, Any]] = {}
        self.professor_profiles: Dict[str, Dict[str, Any]] = {}
        self.professor_onboarding_requests: Dict[str, Dict[str, Any]] = {}
        self.publications: Dict[str, Dict[str, Any]] = {}
        self.research_projects: Dict[str, Dict[str, Any]] = {}
        self.project_interests: Dict[str, List[str]] = {}
        self.research_requests: Dict[str, Dict[str, Any]] = {}
        self.request_status_history: Dict[str, List[Dict[str, Any]]] = {}
        self.request_messages: Dict[str, Dict[str, Any]] = {}
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.paper_summaries: Dict[str, Dict[str, Any]] = {}
        self.ai_conversations: Dict[str, Dict[str, Any]] = {}
        self.ai_messages: Dict[str, Dict[str, Any]] = {}
        self.notifications: Dict[str, Dict[str, Any]] = {}
        self.audit_logs: List[Dict[str, Any]] = []

        # Default pre-seeded demo entities
        admin_id = "00000000-0000-0000-0000-000000000001"
        prof_id = "00000000-0000-0000-0000-000000000002"
        student_id = "00000000-0000-0000-0000-000000000003"
        student2_id = "00000000-0000-0000-0000-000000000004"
        stanford_id = "22222222-2222-2222-2222-222222222201"
        cs_dept_id = "33333333-3333-3333-3333-333333333301"

        self.profiles[admin_id] = {
            "id": admin_id,
            "email": "admin@researchbridge.edu",
            "full_name": "Dr. Eleanor Vance (Admin)",
            "role": "admin",
            "account_status": "active",
            "institution_id": stanford_id,
            "department_id": cs_dept_id,
            "created_at": now,
            "updated_at": now,
        }

        self.profiles[prof_id] = {
            "id": prof_id,
            "email": "prof.turing@stanford.edu",
            "full_name": "Prof. Alan Turing",
            "role": "professor",
            "account_status": "active",
            "institution_id": stanford_id,
            "department_id": cs_dept_id,
            "bio": "Professor of Computer Science specializing in Artificial Intelligence, Machine Learning, and Theory.",
            "created_at": now,
            "updated_at": now,
        }

        self.professor_profiles[prof_id] = {
            "id": prof_id,
            "academic_title": "Full Professor & Chair",
            "biography": "Leading research in representation learning and foundation models.",
            "research_interests": ["Artificial Intelligence", "Machine Learning", "Natural Language Processing"],
            "is_accepting_students": True,
            "max_student_capacity": 6,
            "advertised_openings_count": 2,
            "preferred_qualifications": "Strong foundation in Linear Algebra, PyTorch, and algorithms.",
            "preferred_weekly_hours": 15,
            "office_location": "Gates Computer Science Building, Room 350",
            "office_hours": "Tuesdays & Thursdays 2:00 PM - 4:00 PM PST",
            "verification_status": "approved",
            "created_at": now,
            "updated_at": now,
        }

        self.profiles[student_id] = {
            "id": student_id,
            "email": "alice.student@stanford.edu",
            "full_name": "Alice Chen",
            "role": "student",
            "account_status": "active",
            "institution_id": stanford_id,
            "department_id": cs_dept_id,
            "degree": "B.S. in Computer Science",
            "year_of_study": 3,
            "academic_interests": ["Artificial Intelligence", "Machine Learning", "Natural Language Processing"],
            "relevant_skills": ["Python", "PyTorch", "Algorithms", "Git"],
            "portfolio_url": "https://alicechen.dev",
            "github_url": "https://github.com/alicechen",
            "weekly_availability_hours": 15,
            "created_at": now,
            "updated_at": now,
        }

        self.profiles[student2_id] = {
            "id": student2_id,
            "email": "bob.student@stanford.edu",
            "full_name": "Bob Williams",
            "role": "student",
            "account_status": "active",
            "institution_id": stanford_id,
            "department_id": cs_dept_id,
            "degree": "B.S. in Computer Science",
            "year_of_study": 2,
            "academic_interests": ["Computer Vision", "Robotics & Autonomous Systems"],
            "relevant_skills": ["C++", "Python", "ROS"],
            "weekly_availability_hours": 10,
            "created_at": now,
            "updated_at": now,
        }

        proj_id = "44444444-4444-4444-4444-444444444401"
        self.research_projects[proj_id] = {
            "id": proj_id,
            "professor_id": prof_id,
            "institution_id": stanford_id,
            "department_id": cs_dept_id,
            "title": "Efficient Latent Reasoning in Multimodal Models",
            "summary": "Investigating compute-optimal reasoning paths in multimodal vision-language architectures.",
            "description": "This project aims to develop lightweight reasoning modules that can dynamically allocate compute based on query complexity.",
            "research_question": "Can adaptive compute scaling reduce latency in vision-language models without accuracy degradation?",
            "methodology": "Empirical benchmarking with PyTorch on multimodal reasoning benchmarks.",
            "prerequisite_skills": ["Python", "PyTorch", "Machine Learning"],
            "expected_duration": "6 months",
            "weekly_hours": 12,
            "arrangement": "remote",
            "compensation_type": "stipend",
            "compensation_details": "$2,500 monthly research stipend",
            "openings_count": 2,
            "status": "open",
            "eligibility_requirements": "Open to undergraduate and master students with machine learning coursework.",
            "created_at": now,
            "updated_at": now,
        }

    # -------------------------------------------------------------------------
    # PROFILES
    # -------------------------------------------------------------------------

    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("profiles").select("*, institutions(name), departments(name)").eq("id", user_id).execute()
                if res.data:
                    data = res.data[0]
                    # Format joins
                    data["institution_name"] = data.get("institutions", {}).get("name") if data.get("institutions") else None
                    data["department_name"] = data.get("departments", {}).get("name") if data.get("departments") else None
                    if data.get("role") == "professor":
                        prof_res = client.table("professor_profiles").select("*").eq("id", user_id).execute()
                        data["professor_profile"] = prof_res.data[0] if prof_res.data else None
                    return data
            except Exception as e:
                logger.warning(f"Supabase error fetching profile: {e}")

        profile = self.profiles.get(str(user_id))
        if not profile:
            return None
        
        # Populate joined fields
        prof_copy = dict(profile)
        inst = self.institutions.get(str(prof_copy.get("institution_id")))
        dept = self.departments.get(str(prof_copy.get("department_id")))
        prof_copy["institution_name"] = inst["name"] if inst else None
        prof_copy["department_name"] = dept["name"] if dept else None
        if prof_copy.get("role") == "professor":
            prof_copy["professor_profile"] = self.professor_profiles.get(str(user_id))
        return prof_copy

    async def create_profile(self, data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = str(data["id"])
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": user_id,
            "email": data["email"],
            "full_name": data.get("full_name", ""),
            "role": data.get("role", "student"),
            "account_status": data.get("account_status", "active"),
            "institution_id": str(data["institution_id"]) if data.get("institution_id") else None,
            "department_id": str(data["department_id"]) if data.get("department_id") else None,
            "avatar_url": data.get("avatar_url"),
            "bio": data.get("bio"),
            "degree": data.get("degree"),
            "year_of_study": data.get("year_of_study"),
            "academic_interests": data.get("academic_interests", []),
            "relevant_skills": data.get("relevant_skills", []),
            "portfolio_url": data.get("portfolio_url"),
            "github_url": data.get("github_url"),
            "weekly_availability_hours": data.get("weekly_availability_hours"),
            "created_at": now,
            "updated_at": now,
        }

        client = get_supabase_client()
        if client:
            try:
                res = client.table("profiles").insert(record).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase error creating profile: {e}")

        self.profiles[user_id] = record
        self._save_to_disk()
        return record

    @staticmethod
    def _clean_payload(d: Dict[str, Any]) -> Dict[str, Any]:
        return {k: str(v) if isinstance(v, UUID) else v for k, v in d.items()}

    async def update_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        user_id = str(user_id)
        now = datetime.now(timezone.utc).isoformat()
        updates["updated_at"] = now

        client = get_supabase_client()
        if client:
            try:
                clean_updates = self._clean_payload(updates)
                res = client.table("profiles").update(clean_updates).eq("id", user_id).execute()
                if res.data:
                    return await self.get_profile(user_id) or res.data[0]
            except Exception as e:
                logger.warning(f"Supabase error updating profile: {e}")

        if user_id in self.profiles:
            self.profiles[user_id].update(updates)
            self._save_to_disk()
            return await self.get_profile(user_id)
        return updates

    # -------------------------------------------------------------------------
    # PROFESSOR PROFILES & DISCOVERY
    # -------------------------------------------------------------------------

    async def get_professor_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("professor_profiles").select("*").eq("id", str(user_id)).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase error getting prof profile: {e}")
        return self.professor_profiles.get(str(user_id))

    async def update_professor_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        user_id = str(user_id)
        now = datetime.now(timezone.utc).isoformat()
        updates["updated_at"] = now

        client = get_supabase_client()
        if client:
            try:
                clean_payload = self._clean_payload({"id": user_id, **updates})
                res = client.table("professor_profiles").upsert(clean_payload).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase error updating prof profile: {e}")

        if user_id not in self.professor_profiles:
            self.professor_profiles[user_id] = {
                "id": user_id,
                "academic_title": "Assistant Professor",
                "biography": None,
                "research_interests": [],
                "is_accepting_students": True,
                "max_student_capacity": 5,
                "advertised_openings_count": 1,
                "preferred_qualifications": None,
                "preferred_weekly_hours": 10,
                "office_location": None,
                "office_hours": None,
                "verification_status": "approved",
                "created_at": now,
                "updated_at": now,
            }
        self.professor_profiles[user_id].update(updates)
        self._save_to_disk()
        return self.professor_profiles[user_id]

    async def list_professors(
        self,
        search: Optional[str] = None,
        institution_id: Optional[str] = None,
        department_id: Optional[str] = None,
        interest: Optional[str] = None,
        is_accepting: Optional[bool] = None,
        page: int = 1,
        limit: int = 20,
    ) -> (List[Dict[str, Any]], int):
        all_professors = []
        for uid, prof in self.profiles.items():
            if prof.get("role") != "professor" or prof.get("account_status") != "active":
                continue
            
            p_ext = self.professor_profiles.get(uid, {})
            # Filter checks
            if institution_id and str(prof.get("institution_id")) != str(institution_id):
                continue
            if department_id and str(prof.get("department_id")) != str(department_id):
                continue
            if is_accepting is not None and p_ext.get("is_accepting_students", True) != is_accepting:
                continue
            if interest:
                interests = [i.lower() for i in p_ext.get("research_interests", [])]
                if not any(interest.lower() in item for item in interests):
                    continue
            if search:
                s = search.lower()
                name_match = s in prof.get("full_name", "").lower()
                bio_match = s in (prof.get("bio") or "").lower() or s in (p_ext.get("biography") or "").lower()
                interest_match = any(s in item.lower() for item in p_ext.get("research_interests", []))
                if not (name_match or bio_match or interest_match):
                    continue

            inst = self.institutions.get(str(prof.get("institution_id")))
            dept = self.departments.get(str(prof.get("department_id")))

            item = {
                "id": uid,
                "full_name": prof.get("full_name"),
                "email": prof.get("email"),
                "avatar_url": prof.get("avatar_url"),
                "bio": prof.get("bio") or p_ext.get("biography"),
                "institution_id": prof.get("institution_id"),
                "institution_name": inst["name"] if inst else None,
                "department_id": prof.get("department_id"),
                "department_name": dept["name"] if dept else None,
                "academic_title": p_ext.get("academic_title", "Assistant Professor"),
                "research_interests": p_ext.get("research_interests", []),
                "is_accepting_students": p_ext.get("is_accepting_students", True),
                "advertised_openings_count": p_ext.get("advertised_openings_count", 1),
                "max_student_capacity": p_ext.get("max_student_capacity", 5),
            }
            all_professors.append(item)

        total = len(all_professors)
        start = (page - 1) * limit
        end = start + limit
        return all_professors[start:end], total

    # -------------------------------------------------------------------------
    # PUBLICATIONS
    # -------------------------------------------------------------------------

    async def list_publications(self, professor_id: str, viewer_id: Optional[str] = None) -> List[Dict[str, Any]]:
        res = []
        for pub in self.publications.values():
            if str(pub.get("professor_id")) == str(professor_id):
                # Check visibility
                if pub.get("visibility") == "private" and str(viewer_id) != str(professor_id):
                    continue
                prof = self.profiles.get(str(professor_id), {})
                pub_copy = dict(pub)
                pub_copy["professor_name"] = prof.get("full_name")
                res.append(pub_copy)
        res.sort(key=lambda x: x.get("year") or 0, reverse=True)
        return res

    async def get_publication(self, pub_id: str) -> Optional[Dict[str, Any]]:
        return self.publications.get(str(pub_id))

    async def create_publication(self, data: Dict[str, Any]) -> Dict[str, Any]:
        pub_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": pub_id,
            "created_at": now,
            "updated_at": now,
            **data,
        }
        self.publications[pub_id] = record
        self._save_to_disk()
        return record

    async def update_publication(self, pub_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pub_id = str(pub_id)
        if pub_id in self.publications:
            updates["updated_at"] = datetime.now(timezone.utc).isoformat()
            self.publications[pub_id].update(updates)
            self._save_to_disk()
            return self.publications[pub_id]
        return None

    async def delete_publication(self, pub_id: str) -> bool:
        pub_id = str(pub_id)
        if pub_id in self.publications:
            del self.publications[pub_id]
            self._save_to_disk()
            return True
        return False

    # -------------------------------------------------------------------------
    # RESEARCH PROJECTS
    # -------------------------------------------------------------------------

    async def list_research_projects(
        self,
        search: Optional[str] = None,
        department_id: Optional[str] = None,
        arrangement: Optional[str] = None,
        status: Optional[str] = "open",
        professor_id: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> (List[Dict[str, Any]], int):
        all_projects = []
        for pid, proj in self.research_projects.items():
            if status and proj.get("status") != status:
                continue
            if professor_id and str(proj.get("professor_id")) != str(professor_id):
                continue
            if department_id and str(proj.get("department_id")) != str(department_id):
                continue
            if arrangement and proj.get("arrangement") != arrangement:
                continue
            if search:
                s = search.lower()
                match = (
                    s in proj.get("title", "").lower()
                    or s in proj.get("summary", "").lower()
                    or s in proj.get("description", "").lower()
                )
                if not match:
                    continue

            proj_copy = dict(proj)
            prof = self.profiles.get(str(proj.get("professor_id")), {})
            inst = self.institutions.get(str(proj.get("institution_id")), {})
            dept = self.departments.get(str(proj.get("department_id")), {})
            proj_copy["professor_name"] = prof.get("full_name")
            proj_copy["institution_name"] = inst.get("name")
            proj_copy["department_name"] = dept.get("name")
            all_projects.append(proj_copy)

        all_projects.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        total = len(all_projects)
        start = (page - 1) * limit
        return all_projects[start:start + limit], total

    async def get_research_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        proj = self.research_projects.get(str(project_id))
        if not proj:
            return None
        proj_copy = dict(proj)
        prof = self.profiles.get(str(proj.get("professor_id")), {})
        inst = self.institutions.get(str(proj.get("institution_id")), {})
        dept = self.departments.get(str(proj.get("department_id")), {})
        proj_copy["professor_name"] = prof.get("full_name")
        proj_copy["institution_name"] = inst.get("name")
        proj_copy["department_name"] = dept.get("name")
        return proj_copy

    async def create_research_project(self, data: Dict[str, Any]) -> Dict[str, Any]:
        proj_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": proj_id,
            "created_at": now,
            "updated_at": now,
            **data,
        }
        self.research_projects[proj_id] = record
        self._save_to_disk()
        return await self.get_research_project(proj_id)

    async def update_research_project(self, project_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        project_id = str(project_id)
        if project_id in self.research_projects:
            updates["updated_at"] = datetime.now(timezone.utc).isoformat()
            self.research_projects[project_id].update(updates)
            self._save_to_disk()
            return await self.get_research_project(project_id)
        return None

    async def delete_research_project(self, project_id: str) -> bool:
        project_id = str(project_id)
        if project_id in self.research_projects:
            del self.research_projects[project_id]
            self._save_to_disk()
            return True
        return False

    # -------------------------------------------------------------------------
    # RESEARCH REQUESTS & MESSAGES
    # -------------------------------------------------------------------------

    async def list_research_requests(self, user_id: str, role: str) -> List[Dict[str, Any]]:
        res = []
        for req in self.research_requests.values():
            if role == "student" and str(req.get("student_id")) == str(user_id):
                res.append(await self.get_research_request(req["id"]))
            elif role in ("professor", "admin") and str(req.get("professor_id")) == str(user_id):
                res.append(await self.get_research_request(req["id"]))
            elif role == "admin":
                res.append(await self.get_research_request(req["id"]))
        res.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        return res

    async def get_research_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        req = self.research_requests.get(str(request_id))
        if not req:
            return None
        req_copy = dict(req)
        student = self.profiles.get(str(req.get("student_id")), {})
        prof = self.profiles.get(str(req.get("professor_id")), {})
        project = self.research_projects.get(str(req.get("project_id")), {}) if req.get("project_id") else None

        req_copy["student_name"] = student.get("full_name")
        req_copy["student_email"] = student.get("email")
        req_copy["professor_name"] = prof.get("full_name")
        req_copy["project_title"] = project.get("title") if project else None
        req_copy["status_history"] = self.request_status_history.get(str(request_id), [])
        return req_copy

    async def create_research_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        req_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": req_id,
            "created_at": now,
            "updated_at": now,
            **data,
        }
        self.research_requests[req_id] = record
        
        # Initial status history record
        self.request_status_history[req_id] = [{
            "id": str(uuid4()),
            "request_id": req_id,
            "old_status": None,
            "new_status": data.get("status", "submitted"),
            "changed_by": data.get("student_id"),
            "changed_by_name": self.profiles.get(str(data.get("student_id")), {}).get("full_name"),
            "notes": "Application submitted",
            "created_at": now,
        }]
        self._save_to_disk()
        return await self.get_research_request(req_id)

    async def update_research_request_status(
        self, request_id: str, new_status: str, changed_by: str, notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        req_id = str(request_id)
        if req_id in self.research_requests:
            now = datetime.now(timezone.utc).isoformat()
            old_status = self.research_requests[req_id].get("status")
            self.research_requests[req_id]["status"] = new_status
            self.research_requests[req_id]["status_notes"] = notes
            self.research_requests[req_id]["updated_at"] = now

            if req_id not in self.request_status_history:
                self.request_status_history[req_id] = []
            
            changer = self.profiles.get(str(changed_by), {})
            self.request_status_history[req_id].append({
                "id": str(uuid4()),
                "request_id": req_id,
                "old_status": old_status,
                "new_status": new_status,
                "changed_by": changed_by,
                "changed_by_name": changer.get("full_name"),
                "notes": notes,
                "created_at": now,
            })
            self._save_to_disk()
            return await self.get_research_request(req_id)
        return None

    async def list_messages(self, request_id: str, page: int = 1, limit: int = 50) -> (List[Dict[str, Any]], int):
        all_msgs = []
        for m in self.request_messages.values():
            if str(m.get("request_id")) == str(request_id):
                m_copy = dict(m)
                sender = self.profiles.get(str(m.get("sender_id")), {})
                m_copy["sender_name"] = sender.get("full_name")
                m_copy["sender_role"] = sender.get("role")
                all_msgs.append(m_copy)
        
        all_msgs.sort(key=lambda x: x.get("created_at") or "")
        total = len(all_msgs)
        start = (page - 1) * limit
        return all_msgs[start:start + limit], total

    async def create_message(self, data: Dict[str, Any]) -> Dict[str, Any]:
        msg_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": msg_id,
            "created_at": now,
            "is_read": False,
            "read_at": None,
            **data,
        }
        self.request_messages[msg_id] = record
        self._save_to_disk()
        
        # Format response
        sender = self.profiles.get(str(data.get("sender_id")), {})
        record["sender_name"] = sender.get("full_name")
        record["sender_role"] = sender.get("role")
        return record

    async def mark_messages_as_read(self, request_id: str, reader_id: str) -> int:
        count = 0
        now = datetime.now(timezone.utc).isoformat()
        for m in self.request_messages.values():
            if str(m.get("request_id")) == str(request_id) and str(m.get("sender_id")) != str(reader_id) and not m.get("is_read"):
                m["is_read"] = True
                m["read_at"] = now
                count += 1
        return count

    # -------------------------------------------------------------------------
    # DOCUMENTS
    # -------------------------------------------------------------------------

    async def create_document(self, data: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = str(data.get("id") or uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": doc_id,
            "created_at": now,
            "updated_at": now,
            **data,
        }
        self.documents[doc_id] = record
        self._save_to_disk()
        owner = self.profiles.get(str(record.get("owner_id")), {})
        record["owner_name"] = owner.get("full_name")
        return record

    async def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        doc = self.documents.get(str(doc_id))
        if not doc:
            return None
        doc_copy = dict(doc)
        owner = self.profiles.get(str(doc.get("owner_id")), {})
        doc_copy["owner_name"] = owner.get("full_name")
        return doc_copy

    async def list_documents(self, user_id: str, institution_id: Optional[str] = None) -> List[Dict[str, Any]]:
        res = []
        for doc in self.documents.values():
            if str(doc.get("owner_id")) == str(user_id) or doc.get("access_scope") == "public":
                res.append(await self.get_document(doc["id"]))
            elif doc.get("access_scope") == "institution" and institution_id and str(doc.get("institution_id")) == str(institution_id):
                res.append(await self.get_document(doc["id"]))
        res.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        return res

    async def delete_document(self, doc_id: str) -> bool:
        doc_id = str(doc_id)
        if doc_id in self.documents:
            del self.documents[doc_id]
            self._save_to_disk()
            return True
        return False

    # -------------------------------------------------------------------------
    # AI PAPER SUMMARIES & CONVERSATIONS
    # -------------------------------------------------------------------------

    async def get_paper_summary(self, doc_id: str, version: str = "v1") -> Optional[Dict[str, Any]]:
        key = f"{doc_id}:{version}"
        return self.paper_summaries.get(key)

    async def create_paper_summary(self, data: Dict[str, Any]) -> Dict[str, Any]:
        summary_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": summary_id,
            "created_at": now,
            "updated_at": now,
            **data,
        }
        key = f"{data['document_id']}:{data.get('prompt_version', 'v1')}"
        self.paper_summaries[key] = record
        self._save_to_disk()
        return record

    async def create_ai_conversation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        conv_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": conv_id,
            "created_at": now,
            "updated_at": now,
            **data,
        }
        self.ai_conversations[conv_id] = record
        self._save_to_disk()
        return record

    async def get_ai_conversation(self, conv_id: str) -> Optional[Dict[str, Any]]:
        conv = self.ai_conversations.get(str(conv_id))
        if not conv:
            return None
        conv_copy = dict(conv)
        if conv.get("document_id"):
            doc = self.documents.get(str(conv["document_id"]))
            conv_copy["document_title"] = doc.get("title") or doc.get("original_filename") if doc else None
        
        # Gather messages
        msgs = [m for m in self.ai_messages.values() if str(m.get("conversation_id")) == str(conv_id)]
        msgs.sort(key=lambda x: x.get("created_at") or "")
        conv_copy["messages"] = msgs
        return conv_copy

    async def list_ai_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        res = []
        for c in self.ai_conversations.values():
            if str(c.get("user_id")) == str(user_id):
                res.append(await self.get_ai_conversation(c["id"]))
        res.sort(key=lambda x: x.get("updated_at") or "", reverse=True)
        return res

    async def create_ai_message(self, data: Dict[str, Any]) -> Dict[str, Any]:
        msg_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": msg_id,
            "created_at": now,
            **data,
        }
        self.ai_messages[msg_id] = record
        
        # update conversation updated_at
        if str(data["conversation_id"]) in self.ai_conversations:
            self.ai_conversations[str(data["conversation_id"])]["updated_at"] = now
        self._save_to_disk()
        return record

    # -------------------------------------------------------------------------
    # NOTIFICATIONS & AUDIT LOGS
    # -------------------------------------------------------------------------

    async def create_notification(self, data: Dict[str, Any]) -> Dict[str, Any]:
        notif_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": notif_id,
            "created_at": now,
            "is_read": False,
            "read_at": None,
            **data,
        }
        self.notifications[notif_id] = record
        self._save_to_disk()
        return record

    async def list_notifications(self, user_id: str) -> List[Dict[str, Any]]:
        res = [n for n in self.notifications.values() if str(n.get("recipient_id")) == str(user_id)]
        res.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        return res

    async def mark_notification_read(self, notif_id: str, user_id: str) -> bool:
        notif = self.notifications.get(str(notif_id))
        if notif and str(notif.get("recipient_id")) == str(user_id):
            notif["is_read"] = True
            notif["read_at"] = datetime.now(timezone.utc).isoformat()
            return True
        return False

    async def mark_all_notifications_read(self, user_id: str) -> int:
        count = 0
        now = datetime.now(timezone.utc).isoformat()
        for notif in self.notifications.values():
            if str(notif.get("recipient_id")) == str(user_id) and not notif.get("is_read"):
                notif["is_read"] = True
                notif["read_at"] = now
                count += 1
        return count

    async def create_audit_log(self, data: Dict[str, Any]) -> Dict[str, Any]:
        log_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": log_id,
            "created_at": now,
            **data,
        }
        self.audit_logs.append(record)
        self._save_to_disk()
        return record

    async def list_audit_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        sorted_logs = sorted(self.audit_logs, key=lambda x: x.get("created_at") or "", reverse=True)
        return sorted_logs[:limit]

    # -------------------------------------------------------------------------
    # ONBOARDING & ADMIN MANAGEMENT
    # -------------------------------------------------------------------------

    async def create_professor_onboarding_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        req_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "id": req_id,
            "status": "pending",
            "created_at": now,
            **data,
        }
        self.professor_onboarding_requests[req_id] = record
        self._save_to_disk()
        return record

    async def list_pending_professor_requests(self) -> List[Dict[str, Any]]:
        res = [r for r in self.professor_onboarding_requests.values() if r.get("status") == "pending"]
        res.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        return res

    async def get_professor_onboarding_request(self, req_id: str) -> Optional[Dict[str, Any]]:
        return self.professor_onboarding_requests.get(str(req_id))

    async def update_professor_onboarding_request(self, req_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        req_id = str(req_id)
        if req_id in self.professor_onboarding_requests:
            self.professor_onboarding_requests[req_id].update(updates)
            self._save_to_disk()
            return self.professor_onboarding_requests[req_id]
        return None


db = DatabaseAdapter()
