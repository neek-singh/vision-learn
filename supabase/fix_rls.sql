
-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    course TEXT,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    admission_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    course_id UUID REFERENCES public.courses(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

-- 3. Policies for Admins (Assuming only admins can login to Supabase for these tables or we check profiles)
-- For now, allow authenticated users to perform all actions on these tables 
-- In a real prod environment, we would join with the profiles table to check for 'admin' role.

DROP POLICY IF EXISTS "Enable all for authenticated" ON public.students;
CREATE POLICY "Enable all for authenticated" ON public.students
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated" ON public.enrollments;
CREATE POLICY "Enable all for authenticated" ON public.enrollments
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated" ON public.admissions;
CREATE POLICY "Enable all for authenticated" ON public.admissions
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Public access for admissions (to allow students to apply)
DROP POLICY IF EXISTS "Public can insert admissions" ON public.admissions;
CREATE POLICY "Public can insert admissions" ON public.admissions
    FOR INSERT WITH CHECK (true);
