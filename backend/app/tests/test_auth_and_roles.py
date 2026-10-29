import pytest


@pytest.mark.asyncio
async def test_missing_token_returns_401(async_client):
    response = await async_client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_invalid_token_returns_401(async_client):
    response = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer gibberish.token.format"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_valid_student_auth(async_client, student_token):
    response = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "student"
    assert data["email"] == "alice.student@stanford.edu"


@pytest.mark.asyncio
async def test_attempted_role_escalation_blocked(async_client, student_token):
    # Attempting to PATCH /profiles/me to become admin or professor must be ignored or rejected
    response = await async_client.patch(
        "/api/v1/profiles/me",
        json={"role": "admin"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200
    # Role MUST remain student
    assert response.json()["role"] == "student"


@pytest.mark.asyncio
async def test_student_cannot_access_admin_endpoints(async_client, student_token):
    response = await async_client.get(
        "/api/v1/admin/audit-logs",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_student_cannot_access_professor_dashboard(async_client, student_token):
    response = await async_client.get(
        "/api/v1/professors/me/dashboard",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_professor_can_access_dashboard(async_client, prof_token):
    response = await async_client.get(
        "/api/v1/professors/me/dashboard",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_received_requests" in data
    assert "active_projects_count" in data


@pytest.mark.asyncio
async def test_admin_can_access_admin_endpoints(async_client, admin_token):
    response = await async_client.get(
        "/api/v1/admin/audit-logs",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
