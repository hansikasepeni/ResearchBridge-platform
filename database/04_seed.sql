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
