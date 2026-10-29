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
