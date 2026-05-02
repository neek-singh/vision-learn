
-- 1. Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'pdf', -- 'pdf', 'video', 'link'
    content_url TEXT NOT NULL,
    file_size TEXT,
    duration TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Student Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    content_url TEXT,
    status TEXT DEFAULT 'submitted', -- 'submitted', 'graded'
    score TEXT,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- 4. Calendar Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    type TEXT DEFAULT 'class', -- 'class', 'test', 'holiday', 'event'
    location TEXT DEFAULT 'Online',
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tests/Quizzes
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    correct_option_index INTEGER NOT NULL,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(test_id, student_id)
);

-- RLS Enable
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin all" ON public.materials FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON public.assignments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON public.submissions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON public.events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON public.tests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON public.test_questions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON public.test_results FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Student select" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Student select" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Student select" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Student select" ON public.events FOR SELECT USING (true);
CREATE POLICY "Student select" ON public.tests FOR SELECT USING (true);
CREATE POLICY "Student select" ON public.test_questions FOR SELECT USING (true);
CREATE POLICY "Student select" ON public.test_results FOR SELECT USING (true);

CREATE POLICY "Student insert" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Student insert" ON public.test_results FOR INSERT WITH CHECK (true);
