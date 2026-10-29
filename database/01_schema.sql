-- =============================================================================
-- RESEARCHBRIDGE DATABASE SCHEMA (01_schema.sql)
-- Complete PostgreSQL schema for Supabase
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'professor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('pending', 'active', 'rejected', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE publication_visibility AS ENUM ('public', 'institution', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'open', 'closed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_arrangement AS ENUM ('on_site', 'remote', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE compensation_type AS ENUM ('unpaid', 'stipend', 'hourly', 'credit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM (
        'submitted',
        'under_review',
        'accepted',
        'rejected',
        'needs_information',
        'withdrawn'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_scope AS ENUM ('private', 'shared_request', 'institution', 'public');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('pending', 'processed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_sender AS ENUM ('user', 'assistant', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'request_submitted',
        'status_changed',
        'new_message',
        'information_requested',
        'professor_approved',
        'professor_rejected',
        'system'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. INSTITUTIONS & DEPARTMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    verified_domains TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_institutions_updated_at
BEFORE UPDATE ON institutions
FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institution_id, name)
);

CREATE TRIGGER trg_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. USER PROFILES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    account_status account_status NOT NULL DEFAULT 'active',
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    avatar_url TEXT,
    bio TEXT,
    
    -- Student specific fields
    degree TEXT,
    year_of_study INTEGER,
    academic_interests TEXT[] NOT NULL DEFAULT '{}',
    relevant_skills TEXT[] NOT NULL DEFAULT '{}',
    portfolio_url TEXT,
    github_url TEXT,
    weekly_availability_hours INTEGER,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- Professor Profile Extension
CREATE TABLE IF NOT EXISTS professor_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    academic_title TEXT NOT NULL DEFAULT 'Assistant Professor',
    biography TEXT,
    research_interests TEXT[] NOT NULL DEFAULT '{}',
    is_accepting_students BOOLEAN NOT NULL DEFAULT true,
    max_student_capacity INTEGER NOT NULL DEFAULT 5,
    advertised_openings_count INTEGER NOT NULL DEFAULT 1,
    preferred_qualifications TEXT,
    preferred_weekly_hours INTEGER DEFAULT 10,
    office_location TEXT,
    office_hours TEXT,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_professor_profiles_updated_at
BEFORE UPDATE ON professor_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- Professor Onboarding / Access Requests
CREATE TABLE IF NOT EXISTS professor_onboarding_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    academic_title TEXT NOT NULL,
    institutional_email TEXT NOT NULL,
    verification_notes TEXT,
    verification_document_url TEXT,
    status verification_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. RESEARCH INTERESTS TAXONOMY
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS research_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_research_interests (
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES research_interests(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, interest_id)
);

-- -----------------------------------------------------------------------------
-- 4. DOCUMENTS & RESEARCH PAPERS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    file_size INTEGER NOT NULL,
    sha256_hash TEXT NOT NULL,
    title TEXT,
    description TEXT,
    access_scope document_scope NOT NULL DEFAULT 'private',
    associated_request_id UUID,
    associated_publication_id UUID,
    processing_status document_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. PUBLICATIONS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    abstract TEXT,
    authors TEXT[] NOT NULL DEFAULT '{}',
    venue TEXT,
    year INTEGER,
    doi TEXT,
    external_url TEXT,
    pdf_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    visibility publication_visibility NOT NULL DEFAULT 'public',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_publications_updated_at
BEFORE UPDATE ON publications
FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- Add publication foreign key back to documents table
DO $$ BEGIN
    ALTER TABLE documents 
    ADD CONSTRAINT fk_documents_publication 
    FOREIGN KEY (associated_publication_id) REFERENCES publications(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 6. RESEARCH PROJECTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    description TEXT NOT NULL,
    research_question TEXT,
    methodology TEXT,
    prerequisite_skills TEXT[] NOT NULL DEFAULT '{}',
    expected_duration TEXT,
    weekly_hours INTEGER DEFAULT 10,
    arrangement project_arrangement NOT NULL DEFAULT 'remote',
    compensation_type compensation_type NOT NULL DEFAULT 'unpaid',
    compensation_details TEXT,
    application_deadline TIMESTAMPTZ,
    openings_count INTEGER NOT NULL DEFAULT 1,
    status project_status NOT NULL DEFAULT 'open',
    eligibility_requirements TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_research_projects_updated_at
BEFORE UPDATE ON research_projects
FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

CREATE TABLE IF NOT EXISTS project_research_interests (
    project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES research_interests(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, interest_id)
);

-- -----------------------------------------------------------------------------
-- 7. RESEARCH REQUESTS (COLLABORATION APPLICATIONS)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS research_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES research_projects(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    motivation_statement TEXT NOT NULL,
    student_skills TEXT[] NOT NULL DEFAULT '{}',
    proposed_availability_hours INTEGER NOT NULL DEFAULT 10,
    supporting_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    status request_status NOT NULL DEFAULT 'submitted',
    status_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_research_requests_updated_at
BEFORE UPDATE ON research_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- Add request foreign key back to documents table
DO $$ BEGIN
    ALTER TABLE documents 
    ADD CONSTRAINT fk_documents_request 
    FOREIGN KEY (associated_request_id) REFERENCES research_requests(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enforce: No duplicate active applications for same student, professor, and project
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_research_request 
ON research_requests (student_id, professor_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid))
WHERE status IN ('submitted', 'under_review', 'accepted', 'needs_information');

-- Request Status Audit History
CREATE TABLE IF NOT EXISTS research_request_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES research_requests(id) ON DELETE CASCADE,
    old_status request_status,
    new_status request_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. REQUEST MESSAGING (CONVERSATIONS)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS request_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES research_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message_body TEXT NOT NULL,
    attachment_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. AI PAPER SUMMARIES & CONVERSATIONS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS paper_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    document_hash TEXT NOT NULL,
    model_used TEXT NOT NULL,
    prompt_version TEXT NOT NULL DEFAULT 'v1',
    title TEXT,
    plain_language_overview TEXT NOT NULL,
    research_problem TEXT NOT NULL,
    research_question TEXT,
    motivation_significance TEXT NOT NULL,
    methodology TEXT NOT NULL,
    findings_contributions TEXT NOT NULL,
    techniques_models TEXT NOT NULL,
    limitations_author TEXT NOT NULL,
    limitations_assumptions TEXT NOT NULL,
    key_terminology JSONB NOT NULL DEFAULT '[]'::jsonb,
    prerequisite_knowledge TEXT[] NOT NULL DEFAULT '{}',
    open_questions TEXT[] NOT NULL DEFAULT '{}',
    next_steps TEXT[] NOT NULL DEFAULT '{}',
    discussion_questions TEXT[] NOT NULL DEFAULT '{}',
    raw_summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(document_id, prompt_version)
);

CREATE TRIGGER trg_paper_summaries_updated_at
BEFORE UPDATE ON paper_summaries
FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Research Discussion',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_ai_conversations_updated_at
BEFORE UPDATE ON ai_conversations
FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    sender_type ai_sender NOT NULL,
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    token_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. NOTIFICATIONS & AUDIT LOGS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    safe_metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE & SEARCH
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_departments_institution ON departments(institution_id);
CREATE INDEX IF NOT EXISTS idx_profiles_institution ON profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_professor_profiles_accepting ON professor_profiles(is_accepting_students);
CREATE INDEX IF NOT EXISTS idx_professor_profiles_status ON professor_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_publications_professor ON publications(professor_id);
CREATE INDEX IF NOT EXISTS idx_publications_year ON publications(year DESC);
CREATE INDEX IF NOT EXISTS idx_research_projects_prof ON research_projects(professor_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_inst ON research_projects(institution_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_status ON research_projects(status);
CREATE INDEX IF NOT EXISTS idx_research_requests_student ON research_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_research_requests_professor ON research_requests(professor_id);
CREATE INDEX IF NOT EXISTS idx_research_requests_project ON research_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_research_requests_status ON research_requests(status);
CREATE INDEX IF NOT EXISTS idx_request_messages_request ON request_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_request_messages_created ON request_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_paper_summaries_doc ON paper_summaries(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- SUPABASE AUTH AUTO-PROFILE TRIGGER
-- Automatically creates a profile record when a user signs up via Supabase Auth
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        account_status
    )
    VALUES (
        new.id,
        COALESCE(new.email, ''),
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        'student',
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
