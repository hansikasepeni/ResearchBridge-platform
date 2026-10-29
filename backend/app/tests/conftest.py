import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.repositories.db_adapter import db


@pytest.fixture(scope="module", autouse=True)
def reset_db_state():
    """Ensure clean data state before tests in each module."""
    db._init_memory_store()


@pytest.fixture
def admin_token():
    return "test-token-00000000-0000-0000-0000-000000000001"


@pytest.fixture
def prof_token():
    return "test-token-00000000-0000-0000-0000-000000000002"


@pytest.fixture
def student_token():
    return "test-token-00000000-0000-0000-0000-000000000003"


@pytest.fixture
def student2_token():
    return "test-token-00000000-0000-0000-0000-000000000004"


@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
