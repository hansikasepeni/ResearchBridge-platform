import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.core.logging import logger
from app.repositories.db_adapter import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    
    # Initialize demo seed accounts in memory store for local evaluation & testing
    admin_id = "00000000-0000-0000-0000-000000000001"
    prof_id = "00000000-0000-0000-0000-000000000002"
    student_id = "00000000-0000-0000-0000-000000000003"
    student2_id = "00000000-0000-0000-0000-000000000004"
    stanford_id = "22222222-2222-2222-2222-222222222201"
    cs_dept_id = "33333333-3333-3333-3333-333333333301"

    # Seed Admin
    if admin_id not in db.profiles:
        await db.create_profile({
            "id": admin_id,
            "email": "admin@researchbridge.edu",
            "full_name": "Dr. Eleanor Vance (Admin)",
            "role": "admin",
            "account_status": "active",
            "institution_id": stanford_id,
            "department_id": cs_dept_id,
        })

    # Seed Professor
    if prof_id not in db.profiles:
        await db.create_profile({
            "id": prof_id,
            "email": "prof.turing@stanford.edu",
            "full_name": "Prof. Alan Turing",
            "role": "professor",
            "account_status": "active",
            "institution_id": stanford_id,
            "department_id": cs_dept_id,
            "bio": "Professor of Computer Science specializing in Artificial Intelligence, Machine Learning, and Theory.",
        })
        await db.update_professor_profile(prof_id, {
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
        })
        # Seed Publication
        await db.create_publication({
            "professor_id": prof_id,
            "professor_name": "Prof. Alan Turing",
            "title": "On Modular Representation Learning in Deep Architectures",
            "abstract": "We explore structural modularity in modern neural network representations to improve sample efficiency.",
            "authors": ["Alan Turing", "Alonzo Church"],
            "venue": "NeurIPS 2025",
            "year": 2025,
            "doi": "10.1145/3318464.3389700",
            "visibility": "public",
        })
        # Seed Project
        await db.create_research_project({
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
        })

    # Seed Student
    if student_id not in db.profiles:
        await db.create_profile({
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
        })

    # Seed Second Student
    if student2_id not in db.profiles:
        await db.create_profile({
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
        })

    yield
    logger.info("Shutting down ResearchBridge API")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-grade backend for ResearchBridge — connecting university students "
        "with supervising professors, research publications, openings, and Gemini AI research assistant."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Register centralized exception handlers
register_error_handlers(app)

# Configure Restrictive CORS
origins = list(set(settings.ALLOWED_ORIGINS + [settings.FRONTEND_ORIGIN]))
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if settings.ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

# Health & Readiness Endpoints (Section 7)
@app.get("/health", tags=["Health"], status_code=status.HTTP_200_OK)
async def health_check():
    """
    Health check endpoint. Returns operational status without revealing sensitive secrets.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/ready", tags=["Health"], status_code=status.HTTP_200_OK)
async def readiness_check():
    """
    Readiness probe for Railway or deployment container orchestrator.
    """
    return {
        "ready": True,
        "database": "connected" if settings.is_supabase_configured else "in_memory_ready",
        "gemini": "configured" if settings.is_gemini_configured else "fallback_ready",
    }


# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)
