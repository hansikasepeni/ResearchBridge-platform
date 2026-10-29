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


# ============================================================================
# 1. HEALTH & SYSTEM METADATA ENDPOINTS
# ============================================================================

@pytest.mark.asyncio
async def test_health_endpoint_contract(async_client):
    res = await async_client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "service" in data
    assert "environment" in data


@pytest.mark.asyncio
async def test_readiness_endpoint_contract(async_client):
    res = await async_client.get("/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["ready"] is True
    assert "database" in data
    assert "gemini" in data


@pytest.mark.asyncio
async def test_openapi_specification_endpoint(async_client):
    res = await async_client.get("/api/v1/openapi.json")
    assert res.status_code == 200
    schema = res.json()
    assert "openapi" in schema
    assert "paths" in schema
    assert "/api/v1/auth/me" in schema["paths"]
    assert "/api/v1/professors" in schema["paths"]
    assert "/api/v1/documents" in schema["paths"]


# ============================================================================
# 2. AUTHENTICATION & ONBOARDING ENDPOINTS
# ============================================================================

@pytest.mark.asyncio
async def test_auth_me_profiles_me_endpoints(async_client, student_token, prof_token, admin_token):
    # GET /api/v1/auth/me
    res = await async_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    assert res.json()["role"] == "student"

    # GET /api/v1/profiles/me
    res2 = await async_client.get("/api/v1/profiles/me", headers={"Authorization": f"Bearer {prof_token}"})
    assert res2.status_code == 200
    assert res2.json()["role"] == "professor"

    # PATCH /api/v1/profiles/me safe update
    patch_res = await async_client.patch(
        "/api/v1/profiles/me",
        json={"bio": "Updated bio text for testing", "portfolio_url": "https://portfolio.test"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["bio"] == "Updated bio text for testing"


@pytest.mark.asyncio
async def test_onboarding_complete_endpoint(async_client, student_token):
    inst_res = await async_client.get("/api/v1/institutions")
    inst_id = inst_res.json()[0]["id"]
    dept_res = await async_client.get("/api/v1/departments")
    dept_id = dept_res.json()[0]["id"]

    res = await async_client.post(
        "/api/v1/onboarding/complete",
        json={
            "full_name": "Alice Chen (Updated)",
            "degree": "M.S. in Computer Science",
            "year_of_study": 1,
            "academic_interests": ["Deep Learning", "Systems"],
            "relevant_skills": ["Python", "C++", "CUDA"],
            "institution_id": inst_id,
            "department_id": dept_id,
            "weekly_availability_hours": 20,
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["full_name"] == "Alice Chen (Updated)"
    assert data["degree"] == "M.S. in Computer Science"
    assert data["year_of_study"] == 1


# ============================================================================
# 3. INSTITUTIONS & METADATA ENDPOINTS
# ============================================================================

@pytest.mark.asyncio
async def test_institutions_departments_research_interests(async_client):
    # GET /api/v1/institutions
    inst_res = await async_client.get("/api/v1/institutions")
    assert inst_res.status_code == 200
    institutions = inst_res.json()
    assert len(institutions) > 0
    first_inst = institutions[0]
    assert "name" in first_inst
    assert "slug" in first_inst
    assert "departments" in first_inst
    inst_id = first_inst["id"]

    # GET /api/v1/departments without filter
    dept_res = await async_client.get("/api/v1/departments")
    assert dept_res.status_code == 200
    assert len(dept_res.json()) > 0

    # GET /api/v1/departments with institution_id filter
    filtered_dept = await async_client.get(f"/api/v1/departments?institution_id={inst_id}")
    assert filtered_dept.status_code == 200
    for d in filtered_dept.json():
        assert d["institution_id"] == inst_id

    # GET /api/v1/departments with non-existent institution_id
    empty_dept = await async_client.get(f"/api/v1/departments?institution_id={uuid.uuid4()}")
    assert empty_dept.status_code == 200
    assert len(empty_dept.json()) == 0

    # GET /api/v1/research-interests
    tax_res = await async_client.get("/api/v1/research-interests")
    assert tax_res.status_code == 200
    assert len(tax_res.json()) > 0


# ============================================================================
# 4. PROFESSOR DISCOVERY & PROFILE ENDPOINTS
# ============================================================================

@pytest.mark.asyncio
async def test_professors_filtering_and_details(async_client, student_token, prof_token):
    prof_id = "00000000-0000-0000-0000-000000000002"

    # GET /api/v1/professors with query params
    res = await async_client.get(
        "/api/v1/professors?search=Turing&page=1&limit=10",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    assert any(p["id"] == prof_id for p in body["items"])

    # GET /api/v1/professors/{professor_id} valid
    detail_res = await async_client.get(
        f"/api/v1/professors/{prof_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == prof_id
    assert "publications_count" in detail
    assert "active_projects_count" in detail

    # GET /api/v1/professors/{professor_id} not found
    fake_id = str(uuid.uuid4())
    nf_res = await async_client.get(
        f"/api/v1/professors/{fake_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert nf_res.status_code == 404

    # PATCH /api/v1/professors/me as student -> 403
    stud_patch = await async_client.patch(
        "/api/v1/professors/me",
        json={"preferred_weekly_hours": 15},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert stud_patch.status_code == 403

    # PATCH /api/v1/professors/me as professor -> 200
    prof_patch = await async_client.patch(
        "/api/v1/professors/me",
        json={"preferred_weekly_hours": 14, "max_student_capacity": 8},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert prof_patch.status_code == 200
    assert prof_patch.json()["preferred_weekly_hours"] == 14


# ============================================================================
# 5. PUBLICATIONS CRUD ENDPOINTS
# ============================================================================

@pytest.mark.asyncio
async def test_publications_full_lifecycle(async_client, prof_token, student_token, admin_token):
    prof_id = "00000000-0000-0000-0000-000000000002"

    # GET /api/v1/professors/{id}/publications
    list_res = await async_client.get(
        f"/api/v1/professors/{prof_id}/publications",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert list_res.status_code == 200
    assert isinstance(list_res.json(), list)

    # POST /api/v1/publications - validation error missing title
    val_err = await async_client.post(
        "/api/v1/publications",
        json={"venue": "NeurIPS"},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert val_err.status_code == 422

    # POST /api/v1/publications - successful creation
    create_res = await async_client.post(
        "/api/v1/publications",
        json={
            "title": "Rigorous Empirical Benchmarks in Neural Architectures",
            "abstract": "Analysis of neural convergence under adaptive optimizers.",
            "authors": ["Alan Turing", "Ada Lovelace"],
            "venue": "Nature Machine Intelligence",
            "year": 2026,
            "visibility": "public",
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert create_res.status_code == 201
    pub_id = create_res.json()["id"]

    # PATCH /api/v1/publications/{id} not found
    fake_pub_id = str(uuid.uuid4())
    nf_patch = await async_client.patch(
        f"/api/v1/publications/{fake_pub_id}",
        json={"title": "Doesn't exist"},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert nf_patch.status_code == 404

    # PATCH /api/v1/publications/{id} as owner
    good_patch = await async_client.patch(
        f"/api/v1/publications/{pub_id}",
        json={"title": "Rigorous Empirical Benchmarks in Neural Architectures (Updated)"},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert good_patch.status_code == 200
    assert good_patch.json()["title"] == "Rigorous Empirical Benchmarks in Neural Architectures (Updated)"

    # DELETE /api/v1/publications/{id} as student -> 403
    bad_del = await async_client.delete(
        f"/api/v1/publications/{pub_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert bad_del.status_code == 403

    # DELETE /api/v1/publications/{id} as author -> 200
    good_del = await async_client.delete(
        f"/api/v1/publications/{pub_id}",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert good_del.status_code == 200

    # DELETE again -> 404
    nf_del = await async_client.delete(
        f"/api/v1/publications/{pub_id}",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert nf_del.status_code == 404


# ============================================================================
# 6. RESEARCH PROJECTS CRUD ENDPOINTS
# ============================================================================

@pytest.mark.asyncio
async def test_research_projects_lifecycle_and_filters(async_client, prof_token, student_token):
    prof_id = "00000000-0000-0000-0000-000000000002"

    # GET /api/v1/research-projects
    list_res = await async_client.get(
        "/api/v1/research-projects?page=1&limit=20&status=open",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # GET /api/v1/professors/me/research-projects as student -> 403
    stud_my_proj = await async_client.get(
        "/api/v1/professors/me/research-projects",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert stud_my_proj.status_code == 403

    # GET /api/v1/professors/me/research-projects as professor -> 200
    prof_my_proj = await async_client.get(
        "/api/v1/professors/me/research-projects",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert prof_my_proj.status_code == 200
    assert isinstance(prof_my_proj.json(), list)

    # POST /api/v1/research-projects as student -> 403
    stud_create = await async_client.post(
        "/api/v1/research-projects",
        json={"title": "Student Proj", "summary": "Bad", "description": "Long desc here"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert stud_create.status_code == 403

    # POST /api/v1/research-projects as professor
    create_res = await async_client.post(
        "/api/v1/research-projects",
        json={
            "title": "Quantum Geometric Deep Learning",
            "summary": "Geometric invariance in quantum neural networks.",
            "description": "Investigating how gauge equivariance improves parameter efficiency.",
            "prerequisite_skills": ["Python", "Quantum Mechanics", "PyTorch"],
            "arrangement": "remote",
            "weekly_hours": 12,
            "openings_count": 2,
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert create_res.status_code == 201
    proj_id = create_res.json()["id"]

    # GET /api/v1/research-projects/{id}
    get_res = await async_client.get(
        f"/api/v1/research-projects/{proj_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Quantum Geometric Deep Learning"

    # GET /api/v1/research-projects/{fake_id} -> 404
    fake_proj_id = str(uuid.uuid4())
    nf_proj = await async_client.get(
        f"/api/v1/research-projects/{fake_proj_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert nf_proj.status_code == 404

    # PATCH /api/v1/research-projects/{id} as student -> 403
    stud_patch = await async_client.patch(
        f"/api/v1/research-projects/{proj_id}",
        json={"weekly_hours": 15},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert stud_patch.status_code == 403

    # PATCH /api/v1/research-projects/{id} as supervising professor
    prof_patch = await async_client.patch(
        f"/api/v1/research-projects/{proj_id}",
        json={"weekly_hours": 14, "openings_count": 3},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert prof_patch.status_code == 200
    assert prof_patch.json()["weekly_hours"] == 14

    # DELETE /api/v1/research-projects/{id}
    del_res = await async_client.delete(
        f"/api/v1/research-projects/{proj_id}",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert del_res.status_code == 200

    # DELETE non-existent project -> 404
    nf_del = await async_client.delete(
        f"/api/v1/research-projects/{proj_id}",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert nf_del.status_code == 404


# ============================================================================
# 7. RESEARCH REQUESTS & COLLABORATION WORKFLOW
# ============================================================================

@pytest.mark.asyncio
async def test_research_requests_state_machine_and_actions(async_client, student_token, student2_token, prof_token):
    prof_id = "00000000-0000-0000-0000-000000000002"
    
    # Create project first for valid association
    proj_res = await async_client.post(
        "/api/v1/research-projects",
        json={
            "title": "Multimodal Speech Reasoning",
            "summary": "Audio-visual perception models.",
            "description": "Analyzing end-to-end multimodal perception.",
            "weekly_hours": 10,
            "openings_count": 1,
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    proj_id = proj_res.json()["id"]

    # Student 2 submits application to project
    req_res = await async_client.post(
        "/api/v1/research-requests",
        json={
            "professor_id": prof_id,
            "project_id": proj_id,
            "subject": "Application for Speech Reasoning",
            "motivation_statement": "Deeply interested in audio representations.",
            "student_skills": ["Python", "PyTorch", "Audio Processing"],
            "proposed_availability_hours": 12,
        },
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert req_res.status_code == 201
    req_id = req_res.json()["id"]

    # GET /api/v1/research-requests as student2
    stud_list = await async_client.get(
        "/api/v1/research-requests",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert stud_list.status_code == 200
    assert any(r["id"] == req_id for r in stud_list.json())

    # GET /api/v1/research-requests as professor
    prof_list = await async_client.get(
        "/api/v1/research-requests",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert prof_list.status_code == 200
    assert any(r["id"] == req_id for r in prof_list.json())

    # GET /api/v1/research-requests/{id} for non-participant student1 -> 403
    stud1_get = await async_client.get(
        f"/api/v1/research-requests/{req_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert stud1_get.status_code == 403

    # POST /api/v1/research-requests/{id}/request-information as student2 -> 403 (only professor/admin)
    stud_req_info = await async_client.post(
        f"/api/v1/research-requests/{req_id}/request-information",
        json={"notes": "Can I request info?"},
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert stud_req_info.status_code == 403

    # POST /api/v1/research-requests/{id}/request-information as professor -> 200
    prof_req_info = await async_client.post(
        f"/api/v1/research-requests/{req_id}/request-information",
        json={"notes": "Please provide GitHub repository link."},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert prof_req_info.status_code == 200
    assert prof_req_info.json()["status"] == "needs_information"

    # POST /api/v1/research-requests/{id}/reject as professor -> 200
    prof_reject = await async_client.post(
        f"/api/v1/research-requests/{req_id}/reject",
        json={"notes": "Position filled."},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert prof_reject.status_code == 200
    assert prof_reject.json()["status"] == "rejected"

    # Test withdraw on a fresh request
    fresh_req = await async_client.post(
        "/api/v1/research-requests",
        json={
            "professor_id": prof_id,
            "subject": "Second Application to Withdraw",
            "motivation_statement": "Testing withdrawal functionality.",
        },
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    fresh_id = fresh_req.json()["id"]

    # Student 1 cannot withdraw Student 2's request -> 403
    bad_withdraw = await async_client.post(
        f"/api/v1/research-requests/{fresh_id}/withdraw",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert bad_withdraw.status_code == 403

    # Student 2 withdraws own request -> 200
    good_withdraw = await async_client.post(
        f"/api/v1/research-requests/{fresh_id}/withdraw",
        json={"notes": "Accepted another offer."},
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert good_withdraw.status_code == 200
    assert good_withdraw.json()["status"] == "withdrawn"


# ============================================================================
# 8. MESSAGING THREAD & READ RECEIPTS
# ============================================================================

@pytest.mark.asyncio
async def test_messaging_workflow_and_security(async_client, student_token, student2_token, prof_token):
    prof_id = "00000000-0000-0000-0000-000000000002"

    # Create active request
    req_res = await async_client.post(
        "/api/v1/research-requests",
        json={
            "professor_id": prof_id,
            "subject": "Messaging Test Request",
            "motivation_statement": "Testing thread messaging and authorization.",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    req_id = req_res.json()["id"]

    # Student sends message
    send_res = await async_client.post(
        f"/api/v1/research-requests/{req_id}/messages",
        json={"message_body": "Hello Professor Turing, eager to discuss this project."},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert send_res.status_code == 201
    assert send_res.json()["message_body"] == "Hello Professor Turing, eager to discuss this project."

    # Professor replies
    reply_res = await async_client.post(
        f"/api/v1/research-requests/{req_id}/messages",
        json={"message_body": "Glad to meet you Alice, let's schedule an intro call."},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert reply_res.status_code == 201

    # Unauthorized student 2 cannot send message -> 403
    unauth_send = await async_client.post(
        f"/api/v1/research-requests/{req_id}/messages",
        json={"message_body": "Intruder message"},
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert unauth_send.status_code == 403

    # List messages
    msgs_res = await async_client.get(
        f"/api/v1/research-requests/{req_id}/messages?page=1&limit=20",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert msgs_res.status_code == 200
    assert msgs_res.json()["total"] >= 2

    # Unauthorized student 2 cannot view messages -> 403
    unauth_list = await async_client.get(
        f"/api/v1/research-requests/{req_id}/messages",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert unauth_list.status_code == 403

    # Mark thread read
    read_res = await async_client.post(
        f"/api/v1/research-requests/{req_id}/read",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert read_res.status_code == 200

    # Unauthorized student 2 cannot mark read -> 403
    unauth_read = await async_client.post(
        f"/api/v1/research-requests/{req_id}/read",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert unauth_read.status_code == 403


# ============================================================================
# 9. DOCUMENTS, DOWNLOADS & SUMMARY ENDPOINTS
# ============================================================================

@pytest.mark.asyncio
async def test_documents_lifecycle_and_security(async_client, student_token, student2_token):
    pdf_bytes = make_pdf_bytes()

    # Upload document
    upload_res = await async_client.post(
        "/api/v1/documents",
        files={"file": ("neural_geometry.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"title": "Neural Geometry", "description": "Study on Riemannian optimization.", "access_scope": "private"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # GET /api/v1/documents
    list_res = await async_client.get(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert list_res.status_code == 200
    assert any(d["id"] == doc_id for d in list_res.json())

    # GET /api/v1/documents/{id} as owner
    get_res = await async_client.get(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Neural Geometry"

    # GET /api/v1/documents/{id} as unauthorized student 2 -> 403
    unauth_get = await async_client.get(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert unauth_get.status_code == 403

    # GET /api/v1/documents/{id}/download as owner -> 200
    dl_res = await async_client.get(
        f"/api/v1/documents/{doc_id}/download",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert dl_res.status_code == 200
    assert "download_url" in dl_res.json()

    # GET /api/v1/documents/{id}/summary before summarizing -> 404
    no_sum = await async_client.get(
        f"/api/v1/documents/{doc_id}/summary",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert no_sum.status_code == 404

    # POST /api/v1/documents/{id}/summarize as student 2 (unauthorized) -> 403
    unauth_sum = await async_client.post(
        f"/api/v1/documents/{doc_id}/summarize",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert unauth_sum.status_code == 403

    # POST /api/v1/documents/{id}/summarize as owner -> 200
    sum_res = await async_client.post(
        f"/api/v1/documents/{doc_id}/summarize",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert sum_res.status_code == 200
    assert "plain_language_overview" in sum_res.json()
    assert "findings_contributions" in sum_res.json()

    # GET /api/v1/documents/{id}/summary as owner after generation -> 200
    sum_check = await async_client.get(
        f"/api/v1/documents/{doc_id}/summary",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert sum_check.status_code == 200
    assert sum_check.json()["document_id"] == doc_id

    # DELETE /api/v1/documents/{id} as student 2 -> 403
    unauth_del = await async_client.delete(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert unauth_del.status_code == 403

    # DELETE /api/v1/documents/{id} as owner -> 200
    del_res = await async_client.delete(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert del_res.status_code == 200

    # DELETE /api/v1/documents/{id} again -> 404
    nf_del = await async_client.delete(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert nf_del.status_code == 404


# ============================================================================
# 10. AI RESEARCH ASSISTANT ENDPOINTS
# ============================================================================

@pytest.mark.asyncio
async def test_ai_conversations_and_chat(async_client, student_token, student2_token):
    # POST /api/v1/ai/chat (creates new conversation)
    chat_res = await async_client.post(
        "/api/v1/ai/chat",
        json={"message": "What are foundational approaches to sample-efficient reinforcement learning?"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert chat_res.status_code == 200
    data = chat_res.json()
    assert "conversation_id" in data
    assert "message" in data
    assert data["sender_type"] == "assistant"
    conv_id = data["conversation_id"]

    # GET /api/v1/ai/conversations
    convs_res = await async_client.get(
        "/api/v1/ai/conversations",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert convs_res.status_code == 200
    assert any(c["id"] == conv_id for c in convs_res.json())

    # GET /api/v1/ai/conversations/{id} as owner
    get_conv = await async_client.get(
        f"/api/v1/ai/conversations/{conv_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert get_conv.status_code == 200
    assert get_conv.json()["id"] == conv_id
    assert len(get_conv.json()["messages"]) >= 2

    # GET /api/v1/ai/conversations/{id} as student 2 -> 403
    unauth_conv = await async_client.get(
        f"/api/v1/ai/conversations/{conv_id}",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert unauth_conv.status_code == 403

    # POST /api/v1/ai/conversations/{id}/messages append turn
    append_res = await async_client.post(
        f"/api/v1/ai/conversations/{conv_id}/messages",
        json={"message": "How does model-based RL compare to model-free in this context?"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert append_res.status_code == 201
    assert "message" in append_res.json()

    # POST /api/v1/ai/conversations/{id}/messages as student 2 -> 403
    unauth_append = await async_client.post(
        f"/api/v1/ai/conversations/{conv_id}/messages",
        json={"message": "Intruder question"},
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert unauth_append.status_code == 403


# ============================================================================
# 11. NOTIFICATIONS ENDPOINTS
# ============================================================================

@pytest.mark.asyncio
async def test_notifications_full_flow(async_client, prof_token, student_token):
    # GET /api/v1/notifications
    res = await async_client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert res.status_code == 200
    notifs = res.json()
    assert isinstance(notifs, list)

    # POST /api/v1/notifications/read-all
    read_all = await async_client.post(
        "/api/v1/notifications/read-all",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert read_all.status_code == 200

    # POST /api/v1/notifications/{fake_id}/read -> 404
    fake_notif = str(uuid.uuid4())
    nf_read = await async_client.post(
        f"/api/v1/notifications/{fake_notif}/read",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert nf_read.status_code == 404


# ============================================================================
# 12. ADMINISTRATION ENDPOINTS
# ============================================================================

@pytest.mark.asyncio
async def test_admin_institutions_and_departments_management(async_client, admin_token, student_token):
    # POST /api/v1/admin/institutions as student -> 403
    stud_inst = await async_client.post(
        "/api/v1/admin/institutions",
        json={"name": "MIT", "slug": "mit", "verified_domains": ["mit.edu"]},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert stud_inst.status_code == 403

    # POST /api/v1/admin/institutions as admin
    unique_slug = f"univ-{uuid.uuid4().hex[:6]}"
    admin_inst = await async_client.post(
        "/api/v1/admin/institutions",
        json={
            "name": "California Institute of Technology",
            "slug": unique_slug,
            "verified_domains": ["caltech.edu"],
            "is_active": True,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_inst.status_code == 201
    new_inst_id = admin_inst.json()["id"]

    # Duplicate slug -> 409 Conflict
    dup_inst = await async_client.post(
        "/api/v1/admin/institutions",
        json={
            "name": "Duplicate Caltech",
            "slug": unique_slug,
            "verified_domains": ["caltech.edu"],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert dup_inst.status_code == 409

    # POST /api/v1/admin/departments as admin
    dept_res = await async_client.post(
        "/api/v1/admin/departments",
        json={
            "institution_id": new_inst_id,
            "name": "Computation & Neural Systems",
            "code": "CNS",
            "is_active": True,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert dept_res.status_code == 201
    assert dept_res.json()["institution_id"] == new_inst_id

    # POST /api/v1/admin/departments with fake institution_id -> 404
    fake_inst = str(uuid.uuid4())
    nf_dept = await async_client.post(
        "/api/v1/admin/departments",
        json={
            "institution_id": fake_inst,
            "name": "Invalid Dept",
            "code": "INV",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert nf_dept.status_code == 404


@pytest.mark.asyncio
async def test_admin_professor_rejection_and_suspension_cycle(async_client, admin_token, student_token, student2_token):
    admin_id = "00000000-0000-0000-0000-000000000001"
    student2_id = "00000000-0000-0000-0000-000000000004"

    # 1. Professor Onboarding Rejection
    inst_res = await async_client.get("/api/v1/institutions")
    inst_id = inst_res.json()[0]["id"]

    prof_req = await async_client.post(
        "/api/v1/onboarding/professor-request",
        json={
            "institution_id": inst_id,
            "academic_title": "Visiting Scholar",
            "institutional_email": "scholar@stanford.edu",
        },
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    req_id = prof_req.json()["id"]

    # Admin rejects
    reject_res = await async_client.post(
        f"/api/v1/admin/professors/{req_id}/reject",
        json={"admin_notes": "Unable to verify academic affiliation."},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "rejected"

    # 2. Cannot suspend admin account -> 409
    suspend_admin = await async_client.post(
        f"/api/v1/admin/users/{admin_id}/suspend",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert suspend_admin.status_code == 409

    # 3. Suspend student 2
    suspend_res = await async_client.post(
        f"/api/v1/admin/users/{student2_id}/suspend",
        json={"reason": "Terms of service violation test"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert suspend_res.status_code == 200

    # 4. Suspended student 2 tries to access authenticated endpoint -> 403 Forbidden
    suspended_req = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert suspended_req.status_code == 403
    assert "suspended" in suspended_req.json()["error"]["message"].lower()

    # 5. Reactivate student 2
    reactivate_res = await async_client.post(
        f"/api/v1/admin/users/{student2_id}/reactivate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reactivate_res.status_code == 200

    # 6. Reactivated student 2 can now access authenticated endpoint -> 200
    reactivated_req = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert reactivated_req.status_code == 200
    assert reactivated_req.json()["account_status"] == "active"
