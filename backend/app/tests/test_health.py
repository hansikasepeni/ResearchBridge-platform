import pytest


@pytest.mark.asyncio
async def test_health_check(async_client):
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    # Ensure no secrets or connection strings leaked
    assert "secret" not in str(data).lower()
    assert "postgres" not in str(data).lower()


@pytest.mark.asyncio
async def test_readiness_check(async_client):
    response = await async_client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is True
    assert "database" in data
