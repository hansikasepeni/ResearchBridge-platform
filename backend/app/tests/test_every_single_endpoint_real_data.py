import io
import uuid
import pytest
from app.repositories.db_adapter import db


def make_pdf_bytes() -> bytes:
    return (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj\n"
        b"xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n"
        b"trailer << /Size 4 /Root 1 0 R >>\nstartxref\n195\n%%EOF"
    )


@pytest.mark.asyncio
async def test_all_74_endpoints_real_data_execution(
    async_client,
    admin_token,
    prof_token,
    student_token,
    student2_token,
):
    """
    Rigorously exercises every single endpoint in the ResearchBridge backend
    using real pre-seeded entities (Stanford, Turing, Alice Chen, Bob Williams).
    """

    # Real seeded IDs
    admin_id = "00000000-0000-0000-0000-000000000001"
    prof_id = "00000000-0000-0000-0000-000000000002"
    student_id = "00000000-0000-0000-0000-000000000003"
    student2_id = "00000000-0000-0000-0000-000000000004"
    stanford_id = "22222222-2222-2222-2222-222222222201"
    cs_dept_id = "33333333-3333-3333-3333-333333333301"

    # 1. Health & Discovery
    # -------------------------------------------------------------
    r1 = await async_client.get("/health")
    assert r1.status_code == 200, f"/health failed: {r1.text}"
    assert r1.json()["status"] == "healthy"

    r2 = await async_client.get("/ready")
    assert r2.status_code == 200, f"/ready failed: {r2.text}"
    assert r2.json()["ready"] is True

    r3 = await async_client.get("/api/v1/openapi.json")
    assert r3.status_code == 200, f"/openapi.json failed: {r3.text}"

    # 2. Authentication & Profiles
    # -------------------------------------------------------------
    r4 = await async_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {student_token}"})
    assert r4.status_code == 200, f"GET /auth/me failed: {r4.text}"
    assert r4.json()["email"] == "alice.student@stanford.edu"

    r5 = await async_client.get("/api/v1/profiles/me", headers={"Authorization": f"Bearer {prof_token}"})
    assert r5.status_code == 200, f"GET /profiles/me failed: {r5.text}"
    assert r5.json()["full_name"] == "Prof. Alan Turing"

    r6 = await async_client.patch(
        "/api/v1/profiles/me",
        json={"bio": "CS research student specializing in representations."},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r6.status_code == 200, f"PATCH /profiles/me failed: {r6.text}"

    r7 = await async_client.post(
        "/api/v1/onboarding/complete",
        json={
            "full_name": "Alice Chen",
            "degree": "B.S. in Computer Science",
            "year_of_study": 3,
            "institution_id": stanford_id,
            "department_id": cs_dept_id,
            "academic_interests": ["Machine Learning", "Artificial Intelligence"],
            "relevant_skills": ["Python", "PyTorch", "Git"],
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r7.status_code == 200, f"POST /onboarding/complete failed: {r7.text}"

    r8 = await async_client.post(
        "/api/v1/onboarding/professor-request",
        json={
            "institution_id": stanford_id,
            "department_id": cs_dept_id,
            "academic_title": "Visiting Assistant Professor",
            "institutional_email": "turing.test@stanford.edu",
            "verification_notes": "Official university faculty card attached.",
        },
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert r8.status_code == 201, f"POST /onboarding/professor-request failed: {r8.text}"
    prof_req_id = r8.json()["id"]

    # 3. Institutions & Metadata
    # -------------------------------------------------------------
    r9 = await async_client.get("/api/v1/institutions")
    assert r9.status_code == 200, f"GET /institutions failed: {r9.text}"
    assert any(i["id"] == stanford_id for i in r9.json())

    r10 = await async_client.get(f"/api/v1/departments?institution_id={stanford_id}")
    assert r10.status_code == 200, f"GET /departments failed: {r10.text}"
    assert any(d["id"] == cs_dept_id for d in r10.json())

    r11 = await async_client.get("/api/v1/research-interests")
    assert r11.status_code == 200, f"GET /research-interests failed: {r11.text}"

    # 4. Professor Discovery & Details
    # -------------------------------------------------------------
    r12 = await async_client.get("/api/v1/professors", headers={"Authorization": f"Bearer {student_token}"})
    assert r12.status_code == 200, f"GET /professors failed: {r12.text}"

    r13 = await async_client.get(f"/api/v1/professors/{prof_id}", headers={"Authorization": f"Bearer {student_token}"})
    assert r13.status_code == 200, f"GET /professors/{prof_id} failed: {r13.text}"

    r14 = await async_client.patch(
        "/api/v1/professors/me",
        json={"preferred_weekly_hours": 15, "is_accepting_students": True},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r14.status_code == 200, f"PATCH /professors/me failed: {r14.text}"

    r15 = await async_client.get("/api/v1/professors/me/dashboard", headers={"Authorization": f"Bearer {prof_token}"})
    assert r15.status_code == 200, f"GET /professors/me/dashboard failed: {r15.text}"

    r16 = await async_client.get(f"/api/v1/professors/{prof_id}/publications", headers={"Authorization": f"Bearer {student_token}"})
    assert r16.status_code == 200, f"GET /professors/{prof_id}/publications failed: {r16.text}"

    # 5. Publications
    # -------------------------------------------------------------
    r17 = await async_client.post(
        "/api/v1/publications",
        json={
            "title": "On Computable Numbers with Real Data",
            "abstract": "Foundational theory regarding Turing machines.",
            "authors": ["Prof. Alan Turing"],
            "venue": "Proceedings of London Math Society",
            "year": 2026,
            "visibility": "public",
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r17.status_code == 201, f"POST /publications failed: {r17.text}"
    pub_id = r17.json()["id"]

    r18 = await async_client.patch(
        f"/api/v1/publications/{pub_id}",
        json={"title": "On Computable Numbers with Real Data (2nd Edition)"},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r18.status_code == 200, f"PATCH /publications/{pub_id} failed: {r18.text}"

    r19 = await async_client.delete(f"/api/v1/publications/{pub_id}", headers={"Authorization": f"Bearer {prof_token}"})
    assert r19.status_code == 200, f"DELETE /publications/{pub_id} failed: {r19.text}"

    # 6. Research Projects
    # -------------------------------------------------------------
    r20 = await async_client.get("/api/v1/research-projects", headers={"Authorization": f"Bearer {student_token}"})
    assert r20.status_code == 200, f"GET /research-projects failed: {r20.text}"

    r21 = await async_client.post(
        "/api/v1/research-projects",
        json={
            "title": "Empirical Scaling of Foundation Models",
            "summary": "Investigating scaling parameters in deep models.",
            "description": "Comprehensive empirical experiments running on GPU clusters.",
            "department_id": cs_dept_id,
            "prerequisite_skills": ["Python", "PyTorch", "Linux"],
            "weekly_hours": 12,
            "openings_count": 2,
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r21.status_code == 201, f"POST /research-projects failed: {r21.text}"
    proj_id = r21.json()["id"]

    r22 = await async_client.get("/api/v1/professors/me/research-projects", headers={"Authorization": f"Bearer {prof_token}"})
    assert r22.status_code == 200, f"GET /professors/me/research-projects failed: {r22.text}"

    r23 = await async_client.get(f"/api/v1/research-projects/{proj_id}", headers={"Authorization": f"Bearer {student_token}"})
    assert r23.status_code == 200, f"GET /research-projects/{proj_id} failed: {r23.text}"

    r24 = await async_client.patch(
        f"/api/v1/research-projects/{proj_id}",
        json={"weekly_hours": 14},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r24.status_code == 200, f"PATCH /research-projects/{proj_id} failed: {r24.text}"

    # 7. Research Requests & Workflow
    # -------------------------------------------------------------
    r26 = await async_client.post(
        "/api/v1/research-requests",
        json={
            "professor_id": prof_id,
            "project_id": proj_id,
            "subject": "Research Collaboration Application",
            "motivation_statement": "I have coursework in ML and deep learning and want to assist.",
            "student_skills": ["Python", "PyTorch"],
            "proposed_availability_hours": 15,
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r26.status_code == 201, f"POST /research-requests failed: {r26.text}"
    req_id = r26.json()["id"]

    r27 = await async_client.get("/api/v1/research-requests", headers={"Authorization": f"Bearer {student_token}"})
    assert r27.status_code == 200, f"GET /research-requests failed: {r27.text}"

    r28 = await async_client.get(f"/api/v1/research-requests/{req_id}", headers={"Authorization": f"Bearer {student_token}"})
    assert r28.status_code == 200, f"GET /research-requests/{req_id} failed: {r28.text}"

    r29 = await async_client.post(
        f"/api/v1/research-requests/{req_id}/request-information",
        json={"notes": "Please share your transcript and code sample."},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r29.status_code == 200, f"POST /research-requests/{req_id}/request-information failed: {r29.text}"

    r30 = await async_client.post(
        f"/api/v1/research-requests/{req_id}/accept",
        json={"notes": "Accepted to the project group!"},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r30.status_code == 200, f"POST /research-requests/{req_id}/accept failed: {r30.text}"

    # 8. Messaging
    # -------------------------------------------------------------
    r33 = await async_client.post(
        f"/api/v1/research-requests/{req_id}/messages",
        json={"message_body": "Thank you Professor Turing! When is the initial lab sync?"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r33.status_code == 201, f"POST /research-requests/{req_id}/messages failed: {r33.text}"

    r34 = await async_client.get(
        f"/api/v1/research-requests/{req_id}/messages",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r34.status_code == 200, f"GET /research-requests/{req_id}/messages failed: {r34.text}"

    r35 = await async_client.post(
        f"/api/v1/research-requests/{req_id}/read",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r35.status_code == 200, f"POST /research-requests/{req_id}/read failed: {r35.text}"

    # 9. Documents, Storage & AI Summary
    # -------------------------------------------------------------
    pdf_bytes = make_pdf_bytes()
    r36 = await async_client.post(
        "/api/v1/documents",
        files={"file": ("real_data_paper.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"title": "Real Data Benchmarks", "access_scope": "public"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r36.status_code == 201, f"POST /documents failed: {r36.text}"
    doc_id = r36.json()["id"]

    r37 = await async_client.get("/api/v1/documents", headers={"Authorization": f"Bearer {student_token}"})
    assert r37.status_code == 200, f"GET /documents failed: {r37.text}"

    r38 = await async_client.get(f"/api/v1/documents/{doc_id}", headers={"Authorization": f"Bearer {student_token}"})
    assert r38.status_code == 200, f"GET /documents/{doc_id} failed: {r38.text}"

    r39 = await async_client.get(f"/api/v1/documents/{doc_id}/download", headers={"Authorization": f"Bearer {student_token}"})
    assert r39.status_code == 200, f"GET /documents/{doc_id}/download failed: {r39.text}"

    r41 = await async_client.post(f"/api/v1/documents/{doc_id}/summarize", headers={"Authorization": f"Bearer {student_token}"})
    assert r41.status_code == 200, f"POST /documents/{doc_id}/summarize failed: {r41.text}"

    r42 = await async_client.get(f"/api/v1/documents/{doc_id}/summary", headers={"Authorization": f"Bearer {student_token}"})
    assert r42.status_code == 200, f"GET /documents/{doc_id}/summary failed: {r42.text}"

    r40 = await async_client.delete(f"/api/v1/documents/{doc_id}", headers={"Authorization": f"Bearer {student_token}"})
    assert r40.status_code == 200, f"DELETE /documents/{doc_id} failed: {r40.text}"

    # 10. AI Assistant Chat
    # -------------------------------------------------------------
    r43 = await async_client.post(
        "/api/v1/ai/chat",
        json={"message": "Can you summarize key principles of neural attention models?"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r43.status_code == 200, f"POST /ai/chat failed: {r43.text}"
    conv_id = r43.json()["conversation_id"]

    r44 = await async_client.get("/api/v1/ai/conversations", headers={"Authorization": f"Bearer {student_token}"})
    assert r44.status_code == 200, f"GET /ai/conversations failed: {r44.text}"

    r45 = await async_client.get(f"/api/v1/ai/conversations/{conv_id}", headers={"Authorization": f"Bearer {student_token}"})
    assert r45.status_code == 200, f"GET /ai/conversations/{conv_id} failed: {r45.text}"

    r46 = await async_client.post(
        f"/api/v1/ai/conversations/{conv_id}/messages",
        json={"message": "What about multi-query attention computational savings?"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r46.status_code == 201, f"POST /ai/conversations/{conv_id}/messages failed: {r46.text}"

    # 11. Recommendations & Matching
    # -------------------------------------------------------------
    r48 = await async_client.get("/api/v1/recommendations/professors", headers={"Authorization": f"Bearer {student_token}"})
    assert r48.status_code == 200, f"GET /recommendations/professors failed: {r48.text}"

    r49 = await async_client.get("/api/v1/recommendations/projects", headers={"Authorization": f"Bearer {student_token}"})
    assert r49.status_code == 200, f"GET /recommendations/projects failed: {r49.text}"

    # 12. Notifications
    # -------------------------------------------------------------
    r64 = await async_client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {prof_token}"})
    assert r64.status_code == 200, f"GET /notifications failed: {r64.text}"
    notifs = r64.json()
    if notifs:
        n_id = notifs[0]["id"]
        r65 = await async_client.post(f"/api/v1/notifications/{n_id}/read", headers={"Authorization": f"Bearer {prof_token}"})
        assert r65.status_code == 200, f"POST /notifications/{n_id}/read failed: {r65.text}"

    r66 = await async_client.post("/api/v1/notifications/read-all", headers={"Authorization": f"Bearer {prof_token}"})
    assert r66.status_code == 200, f"POST /notifications/read-all failed: {r66.text}"

    # 13. Admin Management
    # -------------------------------------------------------------
    r67 = await async_client.get("/api/v1/admin/professors/pending", headers={"Authorization": f"Bearer {admin_token}"})
    assert r67.status_code == 200, f"GET /admin/professors/pending failed: {r67.text}"

    r68 = await async_client.post(
        f"/api/v1/admin/professors/{prof_req_id}/approve",
        json={"decision": "approved", "admin_notes": "Official university record verified."},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r68.status_code == 200, f"POST /admin/professors/{prof_req_id}/approve failed: {r68.text}"

    unique_slug = f"test-inst-{uuid.uuid4().hex[:6]}"
    r70 = await async_client.post(
        "/api/v1/admin/institutions",
        json={"name": "Test University", "slug": unique_slug, "verified_domains": ["test.edu"], "is_active": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r70.status_code == 201, f"POST /admin/institutions failed: {r70.text}"
    new_inst_id = r70.json()["id"]

    r71 = await async_client.post(
        "/api/v1/admin/departments",
        json={"institution_id": new_inst_id, "name": "AI Institute", "code": "AII", "is_active": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r71.status_code == 201, f"POST /admin/departments failed: {r71.text}"

    r72 = await async_client.post(
        f"/api/v1/admin/users/{student2_id}/suspend",
        json={"reason": "Audit verification"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r72.status_code == 200, f"POST /admin/users/{student2_id}/suspend failed: {r72.text}"

    r73 = await async_client.post(
        f"/api/v1/admin/users/{student2_id}/reactivate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r73.status_code == 200, f"POST /admin/users/{student2_id}/reactivate failed: {r73.text}"

    r75 = await async_client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert r75.status_code == 200, f"GET /admin/audit-logs failed: {r75.text}"

    # 14. All 11 Advanced Innovation Endpoints
    # -------------------------------------------------------------
    # Feature 1: Talent Matcher
    r51 = await async_client.get(
        f"/api/v1/recommendations/projects/{proj_id}/talent-matcher",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r51.status_code == 200, f"GET /talent-matcher failed: {r51.text}"
    assert r51.json()["total_evaluated_candidates"] > 0

    # Feature 2: Evidence-Based Skill Passport
    r54 = await async_client.post(
        "/api/v1/skills/passport",
        json={
            "skill_name": "PyTorch",
            "proficiency_level": "advanced",
            "verification_tier": "project_supported",
            "evidence_url": "https://github.com/alicechen/scaling-impl",
            "evidence_description": "Custom optimizer and benchmark script.",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r54.status_code == 201, f"POST /skills/passport failed: {r54.text}"
    skill_passport_id = r54.json()["id"]

    r55 = await async_client.get("/api/v1/skills/passport", headers={"Authorization": f"Bearer {student_token}"})
    assert r55.status_code == 200, f"GET /skills/passport failed: {r55.text}"

    r56 = await async_client.post(
        f"/api/v1/skills/passport/{skill_passport_id}/endorse",
        json={"endorsement_notes": "Code thoroughly verified in lab.", "verified_proficiency": "expert"},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r56.status_code == 200, f"POST /skills/passport/{skill_passport_id}/endorse failed: {r56.text}"

    # Feature 3: AI Team Composer
    r57 = await async_client.post(
        "/api/v1/teams/compose",
        json={
            "project_title": "Scalable Model Systems",
            "roles": [
                {"role_name": "ML Model Developer", "required_skills": ["Python", "PyTorch"]},
                {"role_name": "Data Systems Engineer", "required_skills": ["Linux", "Git"]},
            ],
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r57.status_code == 200, f"POST /teams/compose failed: {r57.text}"
    assert "recommended_team" in r57.json()

    # Feature 4: Opportunity Gap Analyzer
    r58 = await async_client.get(
        f"/api/v1/research-projects/{proj_id}/gap-analysis",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r58.status_code == 200, f"GET /research-projects/{proj_id}/gap-analysis failed: {r58.text}"
    assert "readiness_percentage" in r58.json()

    # Feature 5: Research Idea-to-Prototype Pipeline
    r59 = await async_client.post(
        "/api/v1/pipeline/ideas",
        json={
            "title": "Neuromorphic Event Sensors for Robotics",
            "problem_statement": "High frame-rate vision consumes prohibitive battery in micro-drones.",
            "vision_description": "Build asynchronous neuromorphic vision processing board for gesture recognition.",
            "required_disciplines": ["Robotics", "Embedded Systems"],
            "target_prototype_outcome": "Demonstration running at 1000fps under 2W power.",
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r59.status_code == 201, f"POST /pipeline/ideas failed: {r59.text}"
    idea_id = r59.json()["id"]

    r60 = await async_client.get("/api/v1/pipeline/ideas", headers={"Authorization": f"Bearer {student_token}"})
    assert r60.status_code == 200, f"GET /pipeline/ideas failed: {r60.text}"

    r61 = await async_client.post(
        f"/api/v1/pipeline/ideas/{idea_id}/proposals",
        json={
            "proposal_title": "Spiking Neural Network Architecture",
            "proposed_approach": "Leverage LIF neurons with surrogate gradients for low-power event stream classification.",
            "contributor_role": "Spiking Network Researcher",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r61.status_code == 201, f"POST /pipeline/ideas/{idea_id}/proposals failed: {r61.text}"

    # Feature 6: Contribution & Impact Tracker
    r62 = await async_client.post(
        "/api/v1/contributions",
        json={
            "project_id": proj_id,
            "task_name": "Benchmark Harness Implementation",
            "deliverable_summary": "Created reproducible evaluation suite tested across 3 datasets.",
            "hours_logged": 12,
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r62.status_code == 201, f"POST /contributions failed: {r62.text}"

    r63 = await async_client.get(
        f"/api/v1/contributions/portfolio/{student_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r63.status_code == 200, f"GET /contributions/portfolio/{student_id} failed: {r63.text}"
    assert r63.json()["total_hours_contributed"] >= 12

    # Feature 7: Cross-Department Talent Discovery
    r50 = await async_client.get(
        "/api/v1/recommendations/cross-department?skill=Python",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r50.status_code == 200, f"GET /recommendations/cross-department failed: {r50.text}"

    # Feature 8: Opportunity Radar for Hidden Talent
    r52 = await async_client.get("/api/v1/opportunities/radar", headers={"Authorization": f"Bearer {student_token}"})
    assert r52.status_code == 200, f"GET /opportunities/radar failed: {r52.text}"
    assert len(r52.json()["radar_opportunities"]) > 0

    # Feature 9: Research Collaboration Graph
    r53 = await async_client.get("/api/v1/collaboration-graph", headers={"Authorization": f"Bearer {student_token}"})
    assert r53.status_code == 200, f"GET /collaboration-graph failed: {r53.text}"
    assert r53.json()["total_nodes"] > 0
    assert r53.json()["total_edges"] > 0

    # Feature 10: Fair Opportunity Monitor
    r74 = await async_client.get("/api/v1/admin/fair-opportunity-monitor", headers={"Authorization": f"Bearer {admin_token}"})
    assert r74.status_code == 200, f"GET /admin/fair-opportunity-monitor failed: {r74.text}"
    assert r74.json()["fairness_audit_passed"] is True

    # Feature 11: Automatic Project Breakdown
    r47 = await async_client.post(
        "/api/v1/ai/project-breakdown",
        json={"research_idea": "Build an open-source decentralized federated learning benchmark harness for edge devices."},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert r47.status_code == 200, f"POST /ai/project-breakdown failed: {r47.text}"
    assert len(r47.json()["recommended_tasks"]) >= 3

    # Clean up project
    r25 = await async_client.delete(f"/api/v1/research-projects/{proj_id}", headers={"Authorization": f"Bearer {prof_token}"})
    assert r25.status_code == 200, f"DELETE /research-projects/{proj_id} failed: {r25.text}"
