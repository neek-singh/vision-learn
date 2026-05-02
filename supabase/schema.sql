-- 0. Extensions setup
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tables Creation (If not exists)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    instructor TEXT,
    price NUMERIC DEFAULT 0,
    category TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix for existing tables: Add missing columns
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor TEXT;

CREATE TABLE IF NOT EXISTS public.lms_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.lms_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'video', 
    content_url TEXT,
    duration TEXT, 
    is_free BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    last_watched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 2. RLS Enable
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 3. Policies setup (Clean slate)
DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON public.courses;
CREATE POLICY "Public courses are viewable by everyone" ON public.courses
    FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Users can view modules" ON public.lms_modules;
CREATE POLICY "Users can view modules" ON public.lms_modules
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view lessons" ON public.lessons;
CREATE POLICY "Users can view lessons" ON public.lessons
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
CREATE POLICY "Users can view own progress" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress" ON public.user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can edit own progress" ON public.user_progress;
CREATE POLICY "Users can edit own progress" ON public.user_progress
    FOR UPDATE USING (auth.uid() = user_id);
