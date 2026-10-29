-- =============================================================================
-- RESEARCHBRIDGE ADVANCED INNOVATION SUITE (05_advanced_features.sql)
-- Features 1 to 11: Skill Passport, Idea Pipeline, Contribution Tracker,
-- Team Composition, Opportunity Radar, and Fair Opportunity Monitor.
-- =============================================================================

-- 1. Evidence-Based Skill Passport Table
CREATE TABLE IF NOT EXISTS public.skill_passports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    proficiency_level TEXT NOT NULL DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    verification_tier TEXT NOT NULL DEFAULT 'self_reported' CHECK (verification_tier IN ('self_reported', 'project_supported', 'faculty_endorsed')),
    evidence_url TEXT,
    evidence_description TEXT,
    supporting_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    endorsed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    endorsement_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_skill_passports_student ON public.skill_passports(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_passports_skill ON public.skill_passports(skill_name);

-- 2. Research Idea-to-Prototype Pipeline
CREATE TABLE IF NOT EXISTS public.research_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    vision_description TEXT NOT NULL,
    required_disciplines TEXT[] DEFAULT ARRAY[]::TEXT[],
    stage TEXT NOT NULL DEFAULT 'ideation' CHECK (stage IN ('ideation', 'proposal_review', 'team_formation', 'active_milestones', 'prototype_delivered', 'completed')),
    target_prototype_outcome TEXT,
    is_interdisciplinary BOOLEAN NOT NULL DEFAULT true,
    is_beginner_friendly BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.idea_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES public.research_ideas(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    proposal_title TEXT NOT NULL,
    proposed_approach TEXT NOT NULL,
    contributor_role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'declined')),
    faculty_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_idea_proposal UNIQUE(idea_id, student_id)
);

-- 3. Project Tasks, Milestones & Contribution Tracking
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES public.research_ideas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.student_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
    task_name TEXT NOT NULL,
    deliverable_summary TEXT NOT NULL,
    deliverable_url TEXT,
    hours_logged INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved')),
    faculty_feedback TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_student_contributions_student ON public.student_contributions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_contributions_project ON public.student_contributions(project_id);

-- 4. Opportunity Radar & Match Auditing
CREATE TABLE IF NOT EXISTS public.opportunity_radar_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    radar_score NUMERIC(5,2) NOT NULL,
    potential_reason TEXT NOT NULL,
    is_beginner_opportunity BOOLEAN NOT NULL DEFAULT false,
    viewed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_opportunity_radar_student ON public.opportunity_radar_alerts(student_id);

-- 0. Helper function for checking current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role::text INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Row-Level Security Policies for Advanced Innovation Tables
ALTER TABLE public.skill_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_radar_alerts ENABLE ROW LEVEL SECURITY;

-- Skill Passports: Public read, owners insert/update, faculty endorse
DROP POLICY IF EXISTS "Anyone can view skill passports" ON public.skill_passports;
CREATE POLICY "Anyone can view skill passports" ON public.skill_passports
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Students manage own skills" ON public.skill_passports;
CREATE POLICY "Students manage own skills" ON public.skill_passports
    FOR ALL TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Professors can endorse skills" ON public.skill_passports;
CREATE POLICY "Professors can endorse skills" ON public.skill_passports
    FOR UPDATE TO authenticated USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'professor' AND account_status = 'active'
        )
    );

-- Research Ideas: All view, professors create/manage
DROP POLICY IF EXISTS "Anyone can view research ideas" ON public.research_ideas;
CREATE POLICY "Anyone can view research ideas" ON public.research_ideas
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Professors manage own research ideas" ON public.research_ideas;
CREATE POLICY "Professors manage own research ideas" ON public.research_ideas
    FOR ALL TO authenticated USING (professor_id = auth.uid() OR public.is_admin());

-- Proposals: Authors and Idea owners view
DROP POLICY IF EXISTS "Proposals viewable by author or idea professor" ON public.idea_proposals;
CREATE POLICY "Proposals viewable by author or idea professor" ON public.idea_proposals
    FOR SELECT TO authenticated USING (
        student_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.research_ideas i WHERE i.id = idea_id AND i.professor_id = auth.uid())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Students submit proposals" ON public.idea_proposals;
CREATE POLICY "Students submit proposals" ON public.idea_proposals
    FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- Contributions: Viewable by student & professor
DROP POLICY IF EXISTS "Contributions viewable by participants" ON public.student_contributions;
CREATE POLICY "Contributions viewable by participants" ON public.student_contributions
    FOR SELECT TO authenticated USING (
        student_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.research_projects p WHERE p.id = project_id AND p.professor_id = auth.uid())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Students insert own contributions" ON public.student_contributions;
CREATE POLICY "Students insert own contributions" ON public.student_contributions
    FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- Opportunity Radar Alerts: Student only
DROP POLICY IF EXISTS "Students view own radar alerts" ON public.opportunity_radar_alerts;
CREATE POLICY "Students view own radar alerts" ON public.opportunity_radar_alerts
    FOR ALL TO authenticated USING (student_id = auth.uid());
