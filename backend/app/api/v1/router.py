from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.professors import router as professors_router
from app.api.v1.publications import router as publications_router
from app.api.v1.research_projects import router as research_projects_router
from app.api.v1.research_requests import router as research_requests_router
from app.api.v1.messages import router as messages_router
from app.api.v1.documents import router as documents_router
from app.api.v1.ai import router as ai_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.institutions import router as institutions_router
from app.api.v1.admin import router as admin_router
from app.api.v1.innovation import router as innovation_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(institutions_router)
api_router.include_router(professors_router)
api_router.include_router(publications_router)
api_router.include_router(research_projects_router)
api_router.include_router(research_requests_router)
api_router.include_router(messages_router)
api_router.include_router(documents_router)
api_router.include_router(ai_router)
api_router.include_router(recommendations_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)
api_router.include_router(innovation_router)
