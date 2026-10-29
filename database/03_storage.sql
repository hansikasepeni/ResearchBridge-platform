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
