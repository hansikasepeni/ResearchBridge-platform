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
-- =============================================================================
-- RESEARCHBRIDGE ROW LEVEL SECURITY POLICIES (02_rls_policies.sql)
-- Complete RLS policies for Supabase PostgreSQL
-- =============================================================================

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check current user's institution
CREATE OR REPLACE FUNCTION public.current_user_institution()
RETURNS UUID AS $$
DECLARE
    inst_id UUID;
BEGIN
    SELECT institution_id INTO inst_id FROM public.profiles WHERE id = auth.uid();
    RETURN inst_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 1. INSTITUTIONS & DEPARTMENTS
-- -----------------------------------------------------------------------------

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active institutions and departments
CREATE POLICY "Institutions viewable by authenticated users"
ON institutions FOR SELECT
TO authenticated
USING (is_active = true OR public.is_admin());

CREATE POLICY "Institutions manageable by admins only"
ON institutions FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Departments viewable by authenticated users"
ON departments FOR SELECT
TO authenticated
USING (is_active = true OR public.is_admin());

CREATE POLICY "Departments manageable by admins only"
ON departments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. USER PROFILES
-- -----------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Profiles:
-- Any authenticated user can read public/active profiles
CREATE POLICY "Profiles viewable by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (account_status != 'suspended' OR public.is_admin());

-- Users can only update their own profile; cannot self-promote to admin or professor directly
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid() 
    AND (
        -- Protect role escalation: role cannot be modified by non-admins
        role = (SELECT role FROM profiles WHERE id = auth.uid())
        OR public.is_admin()
    )
);

-- Professor profiles:
-- Authenticated users can read verified/approved professor profiles
CREATE POLICY "Professor profiles viewable by authenticated users"
ON professor_profiles FOR SELECT
TO authenticated
USING (
    verification_status = 'approved' 
    OR id = auth.uid() 
    OR public.is_admin()
);

-- Professors can update their own professor profile
CREATE POLICY "Professors can update own professor profile"
ON professor_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid()
    AND (
        -- Cannot self-approve verification status
        verification_status = (SELECT verification_status FROM professor_profiles WHERE id = auth.uid())
        OR public.is_admin()
    )
);

-- Professor Onboarding Requests:
CREATE POLICY "Users can create their own professor onboarding request"
ON professor_onboarding_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own onboarding requests or admin views all"
ON professor_onboarding_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update professor onboarding requests"
ON professor_onboarding_requests FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. RESEARCH INTERESTS
-- -----------------------------------------------------------------------------

ALTER TABLE research_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_research_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_research_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interests viewable by authenticated users"
ON research_interests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Interests manageable by admins"
ON research_interests FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Profile interests viewable by all"
ON profile_research_interests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users manage own profile interests"
ON profile_research_interests FOR ALL
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Project interests viewable by all"
ON project_research_interests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Professors manage own project interests"
ON project_research_interests FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM research_projects rp
        WHERE rp.id = project_research_interests.project_id AND rp.professor_id = auth.uid()
    ) OR public.is_admin()
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM research_projects rp
        WHERE rp.id = project_research_interests.project_id AND rp.professor_id = auth.uid()
    ) OR public.is_admin()
);

-- -----------------------------------------------------------------------------
-- 4. DOCUMENTS
-- -----------------------------------------------------------------------------

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents viewable by owner, request participants, or admin"
ON documents FOR SELECT
TO authenticated
USING (
    owner_id = auth.uid()
    OR access_scope = 'public'
    OR (access_scope = 'institution' AND institution_id = public.current_user_institution())
    OR (
        access_scope = 'shared_request'
        AND associated_request_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM research_requests rr
            WHERE rr.id = documents.associated_request_id
            AND (rr.student_id = auth.uid() OR rr.professor_id = auth.uid())
        )
    )
    OR public.is_admin()
);

CREATE POLICY "Users can insert own documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own documents"
ON documents FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() OR public.is_admin())
WITH CHECK (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Owners can delete own documents"
ON documents FOR DELETE
TO authenticated
USING (owner_id = auth.uid() OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. PUBLICATIONS
-- -----------------------------------------------------------------------------

ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publications viewable based on visibility"
ON publications FOR SELECT
TO authenticated
USING (
    visibility = 'public'
    OR professor_id = auth.uid()
    OR (
        visibility = 'institution'
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = publications.professor_id
            AND p.institution_id = public.current_user_institution()
        )
    )
    OR public.is_admin()
);

CREATE POLICY "Professors can insert own publications"
ON publications FOR INSERT
TO authenticated
WITH CHECK (
    professor_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professor', 'admin')
    )
);

CREATE POLICY "Professors can update own publications"
ON publications FOR UPDATE
TO authenticated
USING (professor_id = auth.uid() OR public.is_admin())
WITH CHECK (professor_id = auth.uid() OR public.is_admin());

CREATE POLICY "Professors can delete own publications"
ON publications FOR DELETE
TO authenticated
USING (professor_id = auth.uid() OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. RESEARCH PROJECTS
-- -----------------------------------------------------------------------------

ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open projects viewable by institution or public"
ON research_projects FOR SELECT
TO authenticated
USING (
    (status = 'open' AND institution_id = public.current_user_institution())
    OR professor_id = auth.uid()
    OR public.is_admin()
);

CREATE POLICY "Professors can insert projects"
ON research_projects FOR INSERT
TO authenticated
WITH CHECK (
    professor_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professor', 'admin')
    )
);

CREATE POLICY "Professors can update own projects"
ON research_projects FOR UPDATE
TO authenticated
USING (professor_id = auth.uid() OR public.is_admin())
WITH CHECK (professor_id = auth.uid() OR public.is_admin());

CREATE POLICY "Professors can delete own projects"
ON research_projects FOR DELETE
TO authenticated
USING (professor_id = auth.uid() OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. RESEARCH REQUESTS & HISTORY
-- -----------------------------------------------------------------------------

ALTER TABLE research_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_request_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requests viewable by student, professor, or admin"
ON research_requests FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
    OR professor_id = auth.uid()
    OR public.is_admin()
);

CREATE POLICY "Students can create requests"
ON research_requests FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'
    )
);

CREATE POLICY "Participants can update requests according to role"
ON research_requests FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()
    OR professor_id = auth.uid()
    OR public.is_admin()
)
WITH CHECK (
    student_id = auth.uid()
    OR professor_id = auth.uid()
    OR public.is_admin()
);

CREATE POLICY "History viewable by request participants"
ON research_request_status_history FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM research_requests rr
        WHERE rr.id = research_request_status_history.request_id
        AND (rr.student_id = auth.uid() OR rr.professor_id = auth.uid())
    ) OR public.is_admin()
);

CREATE POLICY "History insertable by participants"
ON research_request_status_history FOR INSERT
TO authenticated
WITH CHECK (
    changed_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM research_requests rr
        WHERE rr.id = research_request_status_history.request_id
        AND (rr.student_id = auth.uid() OR rr.professor_id = auth.uid())
    )
);

-- -----------------------------------------------------------------------------
-- 8. REQUEST MESSAGES
-- -----------------------------------------------------------------------------

ALTER TABLE request_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages viewable only by request participants or admin"
ON request_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM research_requests rr
        WHERE rr.id = request_messages.request_id
        AND (rr.student_id = auth.uid() OR rr.professor_id = auth.uid())
    ) OR public.is_admin()
);

CREATE POLICY "Participants can send messages"
ON request_messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM research_requests rr
        WHERE rr.id = request_messages.request_id
        AND (rr.student_id = auth.uid() OR rr.professor_id = auth.uid())
    )
);

CREATE POLICY "Participants can update message read status"
ON request_messages FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM research_requests rr
        WHERE rr.id = request_messages.request_id
        AND (rr.student_id = auth.uid() OR rr.professor_id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM research_requests rr
        WHERE rr.id = request_messages.request_id
        AND (rr.student_id = auth.uid() OR rr.professor_id = auth.uid())
    )
);

-- -----------------------------------------------------------------------------
-- 9. AI PAPER SUMMARIES & CONVERSATIONS
-- -----------------------------------------------------------------------------

ALTER TABLE paper_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Summaries viewable if user has access to document"
ON paper_summaries FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = paper_summaries.document_id
        AND (
            d.owner_id = auth.uid()
            OR d.access_scope = 'public'
            OR (d.access_scope = 'institution' AND d.institution_id = public.current_user_institution())
            OR (
                d.access_scope = 'shared_request'
                AND EXISTS (
                    SELECT 1 FROM research_requests rr
                    WHERE rr.id = d.associated_request_id
                    AND (rr.student_id = auth.uid() OR rr.professor_id = auth.uid())
                )
            )
        )
    ) OR public.is_admin()
);

CREATE POLICY "Conversations viewable only by owner"
ON ai_conversations FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own AI conversations"
ON ai_conversations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own AI conversations"
ON ai_conversations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own AI conversations"
ON ai_conversations FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "AI messages viewable by conversation owner"
ON ai_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM ai_conversations ac
        WHERE ac.id = ai_messages.conversation_id AND ac.user_id = auth.uid()
    ) OR public.is_admin()
);

CREATE POLICY "Users can insert AI messages to own conversation"
ON ai_messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM ai_conversations ac
        WHERE ac.id = ai_messages.conversation_id AND ac.user_id = auth.uid()
    )
);

-- -----------------------------------------------------------------------------
-- 10. NOTIFICATIONS & AUDIT LOGS
-- -----------------------------------------------------------------------------

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read"
ON notifications FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Audit logs viewable by admin only"
ON audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());
-- =============================================================================
-- RESEARCHBRIDGE STORAGE & REALTIME CONFIGURATION (03_storage.sql)
-- =============================================================================

-- 1. Create Private Storage Bucket for Research Documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'research-documents',
    'research-documents',
    false, -- Private bucket! Requires signed URLs or authenticated RLS
    20971520, -- 20 MB limit
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf'];

-- 2. Storage Objects RLS Policies (RLS is already enabled on storage.objects by Supabase)
-- Drop existing policies if re-running migration
DROP POLICY IF EXISTS "Users can upload research documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can read research documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own research documents" ON storage.objects;

-- Allow authenticated users to upload to their own user folder: <user_id>/<filename>
CREATE POLICY "Users can upload research documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'research-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow document owners and authorized users to read files
CREATE POLICY "Authorized users can read research documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'research-documents'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.storage_path = storage.objects.name
            AND (
                d.access_scope = 'public'
                OR (d.access_scope = 'institution' AND d.institution_id = public.current_user_institution())
                OR (
                    d.access_scope = 'shared_request'
                    AND EXISTS (
                        SELECT 1 FROM public.research_requests rr
                        WHERE rr.id = d.associated_request_id
                        AND (rr.student_id = auth.uid() OR rr.professor_id = auth.uid())
                    )
                )
            )
        )
        OR public.is_admin()
    )
);

-- Allow document owners to delete their own uploaded documents
CREATE POLICY "Users can delete own research documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'research-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Enable Supabase Realtime for Realtime messaging and notifications
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.request_messages;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;
-- =============================================================================
-- RESEARCHBRIDGE SEED DATA (04_seed.sql)
-- Safe, idempotent initial taxonomy and sample institutional records
-- =============================================================================

-- 1. Research Interests Taxonomy
INSERT INTO public.research_interests (id, name, category)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Artificial Intelligence', 'Computer Science'),
    ('11111111-1111-1111-1111-111111111102', 'Machine Learning', 'Computer Science'),
    ('11111111-1111-1111-1111-111111111103', 'Natural Language Processing', 'Computer Science'),
    ('11111111-1111-1111-1111-111111111104', 'Computer Vision', 'Computer Science'),
    ('11111111-1111-1111-1111-111111111105', 'Robotics & Autonomous Systems', 'Engineering'),
    ('11111111-1111-1111-1111-111111111106', 'Quantum Information Science', 'Physics'),
    ('11111111-1111-1111-1111-111111111107', 'Computational Biology', 'Bioinformatics'),
    ('11111111-1111-1111-1111-111111111108', 'Cybersecurity & Privacy', 'Computer Science'),
    ('11111111-1111-1111-1111-111111111109', 'Data Science & Big Data', 'Computer Science'),
    ('11111111-1111-1111-1111-111111111110', 'Human-Computer Interaction', 'Design & CS')
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category;

-- 2. Institutions
INSERT INTO public.institutions (id, name, slug, verified_domains, is_active)
VALUES
    (
        '22222222-2222-2222-2222-222222222201',
        'Stanford University',
        'stanford',
        ARRAY['stanford.edu'],
        true
    ),
    (
        '22222222-2222-2222-2222-222222222202',
        'SRM University AP',
        'srmap',
        ARRAY['srmap.edu.in'],
        true
    ),
    (
        '22222222-2222-2222-2222-222222222203',
        'Massachusetts Institute of Technology',
        'mit',
        ARRAY['mit.edu'],
        true
    )
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    verified_domains = EXCLUDED.verified_domains;

-- 3. Departments
INSERT INTO public.departments (id, institution_id, name, code, is_active)
VALUES
    -- Stanford
    ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 'Computer Science', 'CS', true),
    ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', 'Electrical Engineering', 'EE', true),
    ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201', 'Bioengineering', 'BIOE', true),
    
    -- SRM AP
    ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222202', 'Computer Science and Engineering', 'CSE', true),
    ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222202', 'Electronics and Communication', 'ECE', true),
    ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222202', 'Biological Sciences', 'BIO', true),

    -- MIT
    ('33333333-3333-3333-3333-333333333307', '22222222-2222-2222-2222-222222222203', 'Electrical Engineering and Computer Science', 'EECS', true),
    ('33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222203', 'Mechanical Engineering', 'MECHE', true)
ON CONFLICT (institution_id, name) DO NOTHING;
