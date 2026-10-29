# ResearchBridge Backend API

ResearchBridge is a university research collaboration platform connecting undergraduate and graduate students with supervising professors, published research projects, faculty openings, and a Google Gemini-powered contextual AI research assistant.

The backend is built with **FastAPI**, **Pydantic v2**, **Supabase Auth & PostgreSQL**, and the official **Google GenAI Python SDK (`google-genai`)**.

---

## 1. Architecture Overview

- **Business Logic Layer**: FastAPI with asynchronous route handlers and centralized exception handling.
- **Identity & Session Management**: Supabase Auth (Bearer JWT validation with asymmetric JWKS or HMAC secret).
- **Persistent Data Store**: Supabase PostgreSQL with strict Row Level Security (RLS) on all exposed tables.
- **Blob Storage**: Supabase Storage (`research-documents` private bucket) with signed expiring download URLs and magic-byte PDF validation.
- **Realtime Collaboration**: Supabase Realtime pub/sub on `request_messages` and `notifications`.
- **AI Intelligence**: Google Gemini API (`gemini-2.5-flash` or `gemini-1.5-flash`) via the official `google-genai` SDK for 15-part structured scientific paper summarization and contextual research advising.

---

## 2. Directory Structure

```
backend/
├── app/
│   ├── main.py                       # FastAPI application entrypoint & lifespan
│   ├── core/
│   │   ├── config.py                 # Pydantic Settings configuration
│   │   ├── security.py               # Supabase JWT decoding, SHA-256 hashing
│   │   ├── logging.py                # Structured privacy-conscious logging
│   │   └── errors.py                 # Centralized exception classes & handlers
│   ├── api/
│   │   ├── dependencies.py           # Auth Bearer token, role guards, rate limiters
│   │   └── v1/
│   │       ├── router.py             # V1 endpoint aggregator
│   │       ├── auth.py               # /auth/me, /profiles/me, /onboarding
│   │       ├── institutions.py       # /institutions, /departments, /research-interests
│   │       ├── professors.py         # /professors, /professors/{id}, dashboard
│   │       ├── publications.py       # /publications (CRUD + ownership)
│   │       ├── research_projects.py  # /research-projects (openings, prerequisites)
│   │       ├── research_requests.py  # /research-requests (status lifecycle transitions)
│   │       ├── messages.py           # /messages (request conversation threads)
│   │       ├── documents.py          # /documents (PDF validation, upload, signed URL)
│   │       ├── ai.py                 # /ai/chat, /ai/conversations, /summarize
│   │       ├── recommendations.py    # /recommendations (explainable matching)
│   │       ├── notifications.py      # /notifications (read receipts)
│   │       └── admin.py              # /admin (faculty verification, audit logs)
│   ├── schemas/                      # Pydantic v2 data transfer schemas
│   ├── services/                     # Business logic (Gemini, matching, requests)
│   ├── repositories/                 # Unified Supabase PostgREST & local fallback
│   ├── utils/                        # PDF validation & extraction helpers
│   └── tests/                        # Pytest automated test suite (25 test cases)
├── database/                         # Database migrations for Supabase SQL Editor
│   ├── 01_schema.sql                 # Tables, enums, triggers, indexes
│   ├── 02_rls_policies.sql           # Row Level Security policies
│   ├── 03_storage.sql                # Supabase Storage & Realtime config
│   ├── 04_seed.sql                   # Universities, departments, topics seed
│   └── schema.sql                    # Single combined SQL file for 1-click execution
├── openapi.json                      # Exported OpenAPI 3.1 specification for frontend
├── test_endpoints.sh                 # Rigorous curl automated test suite (48 tests)
├── requirements.txt                  # Python dependencies
├── Dockerfile                        # Production container image
├── railway.json                      # Railway deployment configuration
├── .env.example                      # Environment variables template
└── .env                              # Active configuration
```

---

## 3. Database Setup in Supabase

All database schema scripts are organized under the `database/` directory.

### Quick Setup (One-Click)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to your project -> **SQL Editor** -> **New query**.
3. Copy the entire contents of [`database/schema.sql`](../database/schema.sql) and click **Run**.

### Step-by-Step Breakdown
- **[`database/01_schema.sql`](../database/01_schema.sql)**: Creates custom ENUMs, updated_at triggers, institutions, departments, profiles, professor profiles, publications, projects, collaboration requests, messages, paper summaries, AI messages, notifications, and performance indexes. Also attaches `handle_new_user()` to `auth.users` for automatic profile provisioning.
- **[`database/02_rls_policies.sql`](../database/02_rls_policies.sql)**: Implements database-level security policies enforcing student, professor, and administrator authorization.
- **[`database/03_storage.sql`](../database/03_storage.sql)**: Configures the private `research-documents` bucket (20MB limit, PDF only) and enables Realtime publication on `request_messages` and `notifications`.
- **[`database/04_seed.sql`](../database/04_seed.sql)**: Populates verified institutions (Stanford, MIT, SRM AP), departments, and academic research taxonomy.

---

## 4. Environment Variables Configuration

Copy `.env.example` to `.env` or populate `secrets.txt`:

```env
# Application Settings
ENVIRONMENT=development
PORT=8000
FRONTEND_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000

# Supabase Credentials (Project Settings -> API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

---

## 5. Running the Backend Locally

```bash
# 1. Activate virtual environment
source backend/.venv/bin/activate

# 2. Run the development server
uvicorn app.main:app --reload --port 8000
```

- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- Redoc Interface: `http://127.0.0.1:8000/redoc`
- Health Endpoint: `http://127.0.0.1:8000/health`
- Readiness Endpoint: `http://127.0.0.1:8000/ready`

---

## 6. Running Automated Tests

### Pytest Test Suite (25 Tests)
```bash
PYTHONPATH=backend pytest backend/app/tests -v
```
All 25 test cases cover:
- Authentication & Bearer token decoding
- Attempted role escalation prevention
- Student vs. Professor vs. Administrator route permissions
- Professor ownership of publications and projects
- Research request lifecycle transitions & duplicate application prevention
- Messaging participant isolation & read receipts
- PDF magic-byte validation & signed download authorization
- Gemini 15-part paper summarization & contextual AI chat
- Notification ownership
- Explainable recommendation algorithms

### Comprehensive Curl Test Suite (48 Endpoints)
With the server running, execute:
```bash
./backend/test_endpoints.sh 8000
```
This script exercises all 48 endpoints using `curl` and verifies status codes and payloads.

---

## 7. Pre-Seeded Development Tokens

For local testing, the backend accepts deterministic development tokens:
- **Administrator**: `Bearer test-token-00000000-0000-0000-0000-000000000001` (Dr. Eleanor Vance)
- **Professor**: `Bearer test-token-00000000-0000-0000-0000-000000000002` (Prof. Alan Turing)
- **Student 1**: `Bearer test-token-00000000-0000-0000-0000-000000000003` (Alice Chen)
- **Student 2**: `Bearer test-token-00000000-0000-0000-0000-000000000004` (Bob Williams)

In production, frontend clients provide live tokens obtained from `supabase.auth.signInWithPassword()` or OAuth.

---

## 8. Deploying to Railway

1. Push this repository to GitHub.
2. In Railway, click **New Project** -> **Deploy from GitHub repo**.
3. Select this repository and set the Root Directory to `backend/`.
4. Railway will automatically detect `backend/Dockerfile` and `backend/railway.json`.
5. Add the environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `GEMINI_API_KEY`, etc.) in Railway's Variables tab.
6. Deployment is live on Railway with automatic `/health` checks.
