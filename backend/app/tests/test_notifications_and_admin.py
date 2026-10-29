import pytest


@pytest.mark.asyncio
async def test_notification_ownership(async_client, student_token, student2_token):
    # Fetch notifications for student 1
    res = await async_client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 200
    notifs = res.json()
    if notifs:
        notif_id = notifs[0]["id"]
        # Student 2 cannot mark Student 1's notification as read
        unauth = await async_client.post(
            f"/api/v1/notifications/{notif_id}/read",
            headers={"Authorization": f"Bearer {student2_token}"},
        )
        assert unauth.status_code == 404

        # Student 1 can mark it as read
        auth = await async_client.post(
            f"/api/v1/notifications/{notif_id}/read",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert auth.status_code == 200


@pytest.mark.asyncio
async def test_pagination_and_invalid_inputs(async_client, student_token):
    # Invalid page number (< 1) must fail with 422
    bad_page = await async_client.get(
        "/api/v1/professors?page=0",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert bad_page.status_code == 422

    # Limit exceeding 100 must fail with 422
    bad_limit = await async_client.get(
        "/api/v1/professors?limit=500",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert bad_limit.status_code == 422


@pytest.mark.asyncio
async def test_explainable_recommendations(async_client, student_token):
    prof_rec = await async_client.get(
        "/api/v1/recommendations/professors",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert prof_rec.status_code == 200
    items = prof_rec.json()
    assert len(items) > 0
    assert "match_score" in items[0]
    assert "match_reasons" in items[0]
    assert len(items[0]["match_reasons"]) > 0

    proj_rec = await async_client.get(
        "/api/v1/recommendations/projects",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert proj_rec.status_code == 200
    assert isinstance(proj_rec.json(), list)


@pytest.mark.asyncio
async def test_admin_professor_onboarding_approval(async_client, student2_token, admin_token):
    # Student 2 requests professor verification
    inst_res = await async_client.get("/api/v1/institutions")
    inst_id = inst_res.json()[0]["id"]

    req_res = await async_client.post(
        "/api/v1/onboarding/professor-request",
        json={
            "institution_id": inst_id,
            "academic_title": "Associate Professor",
            "institutional_email": "bob.faculty@stanford.edu",
            "verification_notes": "Tenure-track faculty member.",
        },
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert req_res.status_code == 201
    request_id = req_res.json()["id"]

    # Admin lists pending requests
    pending = await async_client.get(
        "/api/v1/admin/professors/pending",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert pending.status_code == 200
    assert any(p["id"] == request_id for p in pending.json())

    # Admin approves request
    approval = await async_client.post(
        f"/api/v1/admin/professors/{request_id}/approve",
        json={"decision": "approved", "admin_notes": "Official faculty verified."},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert approval.status_code == 200
    assert approval.json()["status"] == "approved"

    # User 2 profile should now reflect professor role
    session_res = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert session_res.json()["role"] == "professor"
