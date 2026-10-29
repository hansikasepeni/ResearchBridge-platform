import pytest


@pytest.mark.asyncio
async def test_student_submit_request_and_duplicate_prevention(async_client, student_token, prof_token):
    prof_id = "00000000-0000-0000-0000-000000000002"
    
    # Create a unique project to isolate this test's application cycle
    proj_res = await async_client.post(
        "/api/v1/research-projects",
        json={
            "title": "Quantum Error Correction Project",
            "summary": "Surface codes research.",
            "description": "Fault-tolerant quantum computing testing.",
            "weekly_hours": 10,
            "openings_count": 2,
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    # Submit first request
    res = await async_client.post(
        "/api/v1/research-requests",
        json={
            "professor_id": prof_id,
            "project_id": proj_id,
            "subject": "Research Internship Inquiry",
            "motivation_statement": "I have completed machine learning coursework and want to contribute to the lab.",
            "student_skills": ["Python", "PyTorch"],
            "proposed_availability_hours": 15,
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 201
    req_id = res.json()["id"]

    # Attempting duplicate active request must be rejected with 409 Conflict
    dup_res = await async_client.post(
        "/api/v1/research-requests",
        json={
            "professor_id": prof_id,
            "project_id": proj_id,
            "subject": "Duplicate Request",
            "motivation_statement": "Trying to apply again while another application is active.",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert dup_res.status_code == 409


@pytest.mark.asyncio
async def test_unauthorized_user_cannot_access_request(async_client, student2_token, prof_token, student_token):
    # Student 1 has a request with Professor
    prof_id = "00000000-0000-0000-0000-000000000002"
    req_list = await async_client.get(
        "/api/v1/research-requests",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    reqs = req_list.json()
    if not reqs:
        create_res = await async_client.post(
            "/api/v1/research-requests",
            json={
                "professor_id": prof_id,
                "subject": "Test Request",
                "motivation_statement": "Testing privacy isolation.",
            },
            headers={"Authorization": f"Bearer {student_token}"},
        )
        req_id = create_res.json()["id"]
    else:
        req_id = reqs[0]["id"]

    # Student 2 (unrelated party) attempts to read request
    unauthorized_res = await async_client.get(
        f"/api/v1/research-requests/{req_id}",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert unauthorized_res.status_code == 403


@pytest.mark.asyncio
async def test_status_transitions_and_role_rules(async_client, student_token, prof_token):
    req_list = await async_client.get(
        "/api/v1/research-requests",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    req_id = req_list.json()[0]["id"]

    # Student CANNOT accept their own request
    bad_accept = await async_client.post(
        f"/api/v1/research-requests/{req_id}/accept",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert bad_accept.status_code == 403

    # Professor CAN accept the request
    good_accept = await async_client.post(
        f"/api/v1/research-requests/{req_id}/accept",
        json={"notes": "Welcome to the research group!"},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert good_accept.status_code == 200
    assert good_accept.json()["status"] == "accepted"


@pytest.mark.asyncio
async def test_messaging_participant_isolation(async_client, student_token, prof_token, student2_token):
    req_list = await async_client.get(
        "/api/v1/research-requests",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    req_id = req_list.json()[0]["id"]

    # Student sends message
    msg_res = await async_client.post(
        f"/api/v1/research-requests/{req_id}/messages",
        json={"message_body": "Thank you Professor Turing! When can we meet?"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert msg_res.status_code == 201

    # Professor reads messages
    prof_msgs = await async_client.get(
        f"/api/v1/research-requests/{req_id}/messages",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert prof_msgs.status_code == 200
    assert prof_msgs.json()["total"] >= 1

    # Unrelated Student 2 cannot read or post messages to this request
    read_blocked = await async_client.get(
        f"/api/v1/research-requests/{req_id}/messages",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert read_blocked.status_code == 403

    send_blocked = await async_client.post(
        f"/api/v1/research-requests/{req_id}/messages",
        json={"message_body": "Eavesdropping message"},
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert send_blocked.status_code == 403
