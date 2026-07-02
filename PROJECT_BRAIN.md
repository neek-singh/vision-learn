# Vision Learn - Project Brain

This document is the **Single Source of Truth** for the Vision Learn codebase, its architecture, database schemas, offline-first caching mechanism, authentication flows, and development guidelines. 

> [!IMPORTANT]
> **Any developer or AI agent modifying this project MUST read, follow, and update this project brain file to log changes and maintain consistency.**

---

## 1. Project Architecture Overview

Vision Learn is a premium, offline-capable Learning Management System (LMS) designed for students of the Vision IT Computer Institute. 

```mermaid
graph TD
    subgraph Client (PWA / Browser)
        App[Next.js App / Client components] <--> Cache[CacheManager]
        Cache <--> Dexie[(Dexie IndexedDB)]
        SW[Service Worker sw.js] <--> PublicAssets[Static / Offline Pages]
    end
    subgraph Server & Cloud
        API[Next.js API Routes] <--> SupabaseServer[Supabase Server Client]
        Cache -- Online Upsert / Sync -- > SupabaseClient[Supabase client]
        SupabaseClient <--> SupabaseDB[(Supabase PostgreSQL)]
    end
```

### Key Architectural Pillars:
1. **Frontend Core**: Built with [Next.js 16.2.4](file:///c:/Users/as007/vision-learn/package.json) (using React 19.2.4). Webpack is explicitly enabled in dev/build scripts via `--webpack`.
2. **Styling**: Tailwind CSS v4 styled with `@tailwindcss/postcss`. Responsive layout for mobile and desktop screens.
3. **Database & Backend**: [Supabase](file:///c:/Users/as007/vision-learn/supabase/schema.sql) serves as the primary PostgreSQL backend.
4. **Authentication**: Customized JWT-based session security. Sessions are verified against the custom `students` table, bypass standard Supabase Auth logins, and are stored in a cookie.
5. **Offline Capability (PWA)**: Uses `next-pwa` to register service workers ([sw.js](file:///c:/Users/as007/vision-learn/public/sw.js) and [sw-push.js](file:///c:/Users/as007/vision-learn/public/sw-push.js)) for caching static files, [Dexie.js](file:///c:/Users/as007/vision-learn/lib/db.ts) (IndexedDB wrapper) for storing local data, and a custom stale-while-revalidate [CacheManager](file:///c:/Users/as007/vision-learn/lib/cache-manager.ts).

---

## 2. Database Schema (Supabase)

Vision Learn uses three main SQL migration/setup files:
* [schema.sql](file:///c:/Users/as007/vision-learn/supabase/schema.sql) - Core LMS structural tables (courses, modules, lessons, user progress)
* [lms_management.sql](file:///c:/Users/as007/vision-learn/supabase/lms_management.sql) - Supplementary modules (materials, assignments, events, tests, submissions)
* [fix_rls.sql](file:///c:/Users/as007/vision-learn/supabase/fix_rls.sql) - Student profile tables and custom schema configurations

### Table Definitions

| Table Name | Primary Key | Columns & Descriptions | Relations / Constraints |
| :--- | :--- | :--- | :--- |
| **`students`** | `id` (UUID) | `student_id` (TEXT, unique), `name` (TEXT), `email` (TEXT, unique), `phone` (TEXT), `course` (TEXT), `password` (TEXT, hashed), `status` (TEXT), `admission_id` (UUID), `created_at` (TIMESTAMPTZ) | Custom user directory. Hashed passwords verified during login. |
| **`courses`** | `id` (UUID) | `title` (TEXT), `description` (TEXT), `thumbnail` (TEXT), `instructor` (TEXT), `price` (NUMERIC), `category` (TEXT), `is_published` (BOOLEAN), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ) | Available study programs/subjects. |
| **`lms_modules`** | `id` (UUID) | `course_id` (UUID), `title` (TEXT), `order_index` (INTEGER), `created_at` (TIMESTAMPTZ) | Course content grouped into sub-units. Foreign key to `courses.id`. |
| **`lessons`** | `id` (UUID) | `module_id` (UUID), `title` (TEXT), `type` (TEXT), `content_url` (TEXT), `duration` (TEXT), `is_free` (BOOLEAN), `order_index` (INTEGER), `created_at` (TIMESTAMPTZ) | Video/text lessons within modules. Foreign key to `lms_modules.id`. |
| **`user_progress`**| `id` (UUID) | `user_id` (UUID), `lesson_id` (UUID), `completed` (BOOLEAN), `last_watched_at` (TIMESTAMPTZ) | Lesson watch history. FK to `auth.users.id` & `lessons.id`. Unique constraint on `(user_id, lesson_id)`. |
| **`materials`** | `id` (UUID) | `course_id` (UUID), `title` (TEXT), `type` (TEXT - pdf/video/link), `content_url` (TEXT), `file_size` (TEXT), `duration` (TEXT), `created_at` (TIMESTAMPTZ) | Course notes/downloads. FK to `courses.id`. |
| **`assignments`** | `id` (UUID) | `course_id` (UUID), `title` (TEXT), `description` (TEXT), `due_date` (TIMESTAMPTZ), `is_published` (BOOLEAN), `created_at` (TIMESTAMPTZ) | Homework & student assignments. FK to `courses.id`. |
| **`submissions`** | `id` (UUID) | `assignment_id` (UUID), `student_id` (UUID), `content_url` (TEXT), `status` (TEXT), `score` (TEXT), `feedback` (TEXT), `submitted_at` (TIMESTAMPTZ) | Student submission answers. FK to `assignments.id`, `students.id`. |
| **`events`** | `id` (UUID) | `title` (TEXT), `description` (TEXT), `event_date` (DATE), `start_time` (TIME), `end_time` (TIME), `type` (TEXT), `location` (TEXT), `course_id` (UUID), `created_at` (TIMESTAMPTZ) | Calendar entries (classes, tests, holidays). FK to `courses.id`. |
| **`tests`** | `id` (UUID) | `course_id` (UUID), `title` (TEXT), `type` (TEXT), `duration_minutes` (INTEGER), `is_published` (BOOLEAN), `created_at` (TIMESTAMPTZ) | Interactive exams/quizzes. FK to `courses.id`. |
| **`test_questions`**| `id` (UUID) | `test_id` (UUID), `question_text` (TEXT), `options` (JSONB), `correct_option_index` (INTEGER), `order_index` (INTEGER) | Multiple-choice questions. FK to `tests.id`. |
| **`test_results`** | `id` (UUID) | `test_id` (UUID), `student_id` (UUID), `score` (INTEGER), `total_questions` (INTEGER), `completed_at` (TIMESTAMPTZ) | Result sheets for exams. FK to `tests.id`, `students.id`. |
| **`enrollments`** | `id` (UUID) | `student_id` (UUID), `course_id` (UUID), `progress_percentage` (INTEGER), `created_at` (TIMESTAMPTZ) | Binds student to active courses. FK to `students.id`, `courses.id`. |

### Row Level Security (RLS) Configuration:
* **Students, Enrollments, Admissions**: Allowed full select/insert/update/delete for authenticated admin logins (`auth.role() = 'authenticated'`). Admissions table allows public `INSERT` so potential students can apply.
* **Materials, Assignments, Submissions, Events, Tests**: Full access allowed for Admins. Free read selection allowed for students (`true`). Student can insert custom records on `submissions` and `test_results`.
* **Courses**: Viewable by everyone if `is_published = true`.
* **User Progress**: Read, insert, and update operations are strictly constrained to owners (`auth.uid() = user_id`).

---

## 3. Caching & Offline-First Mechanism

Vision Learn ensures reliability under poor network connections by running a dual caching system.

### A. IndexedDB Local Tables
Client-side storage is managed inside [db.ts](file:///c:/Users/as007/vision-learn/lib/db.ts) using the Dexie package:
* `courses`: Primary index `id`, key `course_code`.
* `lessons`: Primary index `id`, keys `module_id`, `order_index`.
* `notes`: Primary index `id`, keys `course_id`, `user_id`.
* `quizzes`: Primary index `id`, key `course_id`.
* `progress`: Primary index `id`, keys `user_id`, `lesson_id`, `is_synced`.
* `sync_queue`: Auto-incrementing primary key `id`, keys `table`, `timestamp`.
* `metadata`: Dynamic cache tracker keyed by `key`.

### B. CacheManager Logic
Implementation in [cache-manager.ts](file:///c:/Users/as007/vision-learn/lib/cache-manager.ts) executes these operations:
1. **Stale-While-Revalidate (`fetchWithCache`)**:
   * Inspects local IndexedDB table for the requested key.
   * If record is found and not expired (TTL = 1 hour by default), returns the cached record immediately.
   * If expired or missing, triggers a background fetch to Supabase, updates local DB, and prints background updates to console.
2. **Offline Writing Queue (`saveProgress` / `syncPending`)**:
   * Updates progress status locally immediately inside IndexedDB (`progress` store with `is_synced: false`).
   * Attempts API upsert to Supabase.
   * If success: Marks `is_synced: true`.
   * If failure (Offline): Keeps `is_synced: false` and queues the update payload in `sync_queue` table.
   * Runs `syncPending` manually to push all queued changes to Supabase as soon as network is restored.

---

## 4. Authentication Flow

Authentication does not use Supabase's native auth module. Instead, it uses custom JWT sessions.

1. **Submit Login Request**:
   * User enters Student ID and password inside [LoginPage](file:///c:/Users/as007/vision-learn/app/(auth)/login/page.tsx).
   * Request sent to API handler `/api/auth/login` ([route.ts](file:///c:/Users/as007/vision-learn/app/api/auth/login/route.ts)).
2. **Credential Authentication & Token Generation**:
   * The API matches `student_id` in database table `students`.
   * Hashed password is verified via `bcryptjs.compare`.
   * A payload containing user details is signed with a HS256 JWT algorithm ([auth-custom.ts](file:///c:/Users/as007/vision-learn/lib/auth-custom.ts)) using `JWT_SECRET` (defaulting to a fallback secret key).
   * Token is sent back in an HTTP-only secure cookie `vision_learn_session` (lasting 7 days).
3. **Session Verification**:
   * Pages fetch user details via `/api/auth/profile` ([route.ts](file:///c:/Users/as007/vision-learn/app/api/auth/profile/route.ts)) on component mount.
   * Verification decodes `vision_learn_session` via `verifyToken`, and loads profile info (`id, name, photo_url, student_id`).
4. **Session Termination**:
   * Post request to `/api/logout` ([route.ts](file:///c:/Users/as007/vision-learn/app/api/logout/route.ts)) deletes `vision_learn_session` cookie and redirects user to `/login`.

---

## 5. Codebase Routing & Directory Structure

```
├── app/
│   ├── (auth)/
│   │   └── login/                 # User Login Form
│   ├── (dashboard)/               # Main student workspace container
│   │   ├── assignments/           # View course homework assignments
│   │   ├── attendance/            # View daily attendance history
│   │   ├── calendar/              # View events timeline
│   │   ├── courses/               # Enrolled courses viewer
│   │   ├── curriculum/            # Syllabus module details
│   │   ├── dashboard/             # Main welcome view and status overview
│   │   ├── fees/                  # Payments and billing status
│   │   ├── materials/             # Study guides and downloads
│   │   ├── notifications/         # Realtime push notification list
│   │   ├── profile/               # Student metadata settings
│   │   ├── results/               # Test and submission scores
│   │   ├── tests/                 # Interactive exam center
│   │   └── layout.tsx             # Sidebar layout & realtime notifications
│   ├── api/                       # REST handlers
│   │   ├── auth/                  # login and profile controllers
│   │   ├── logout/                # clears session cookie
│   │   └── progress/              # handles updates for offline sync
│   ├── globals.css                # Base stylesheet
│   ├── layout.tsx                 # Root metadata provider
│   ├── offline/                   # PWA fallback disconnect page
│   └── page.tsx                   # Redirects to login
├── components/                    # General re-usable UI
│   ├── dashboard/                 # Student metrics and skeletons
│   ├── student/                   # Client-heavy elements (LessonViewer, StudentFeesClient)
│   ├── SyncStatus.tsx             # Offline status detector badge
│   ├── GlobalSearch.tsx           # Global project indexing
│   ├── DownloadButton.tsx         # Asset downloader
│   ├── InstallButton.tsx          # PWA add-to-home-screen trigger
│   └── PWARegistration.tsx        # Service worker registrar
├── hooks/                         # React custom logic hooks
├── lib/                           # Core engines, database, utilities
├── public/                        # PWA assets, icons, SW configurations
└── supabase/                      # Database build files
```

---

## 6. Codebase Rules & Developer Guidelines

When editing this project, you **MUST** strictly adhere to the following:

### A. Next.js & React Conventions
* **App Router Compliance**: Always locate page views inside nested app subdirectories (`app/`).
* **Deprecations Check**: This is Next.js v16.2.4. Pay attention to signature changes, specifically:
  * `cookies()` from `next/headers` is asynchronous and must be awaited: `const cookieStore = await cookies();`.
  * Avoid synchronous API reads for cookies, headers, or request params on Next.js server components.
* **Client Components**: Always write `"use client";` at the very top of components using state, hooks, or client-only properties.

### B. Offline & Cache Constraints
* **Always Read through Cache**: Never fetch courses, lessons, materials, or profile stats directly from Supabase client components. Use custom hooks (`use-cached-curriculum`, `use-offline-data`) or invoke `CacheManager.fetchWithCache` to ensure offline caching support.
* **Offline Writes**: Save student milestones (such as lesson progress completion) using `CacheManager.saveProgress` rather than sending direct SQL modifications.

### C. Database & Security
* **RLS Policies**: Do not create or run queries that bypass Row Level Security. Ensure all queries pass authenticating metadata or matching user checks (`auth.uid() = user_id`).
* **Authentication Table**: Hashed passwords and login attempts use the `public.students` table, NOT standard Supabase Auth users. Be careful to check the correct table when dealing with user operations.

### D. CSS & Styling
* **Tailwind CSS v4**: Build styles inline where possible. Avoid custom external style sheets unless modifying [globals.css](file:///c:/Users/as007/vision-learn/app/globals.css).

---

## 7. Change Log & History

Use this section to record all changes made to the codebase. When introducing features or fixing bugs, add a new row to the table.

| Date (YYYY-MM-DD) | Author / Agent | Files Modified | Description of Changes |
| :--- | :--- | :--- | :--- |
| 2026-06-30 | Antigravity | [PROJECT_BRAIN.md](file:///c:/Users/as007/vision-learn/PROJECT_BRAIN.md) | Created the initial complete project brain file detailing schema, caching mechanism, custom auth, and developer guidelines. |
| 2026-06-30 | Antigravity | [DashboardClient.tsx](file:///c:/Users/as007/vision-learn/components/dashboard/DashboardClient.tsx), [page.tsx](file:///c:/Users/as007/vision-learn/app/(dashboard)/profile/page.tsx), [ThemePicker.tsx](file:///c:/Users/as007/vision-learn/components/student/ThemePicker.tsx) | Shifted Personalize Theme switcher from Dashboard greeting banner to Profile settings section. |
| 2026-06-30 | Antigravity | [DashboardClient.tsx](file:///c:/Users/as007/vision-learn/components/dashboard/DashboardClient.tsx) | Fixed Student Hub Sparkles icon by removing `animate-spin` class. |
| 2026-06-30 | Antigravity | [page.tsx](file:///c:/Users/as007/vision-learn/app/(dashboard)/dashboard/page.tsx) | Fixed schedule matching algorithm on the student dashboard by implementing robust title normalization matching matching lesson and module names. |
| 2026-06-30 | Antigravity | [page.tsx](file:///c:/Users/as007/vision-learn/app/(dashboard)/dashboard/page.tsx) | Prioritized today's scheduled class in the dashboard's "Up Next" recommend card before past scheduled classes and default fallbacks. |
| 2026-06-30 | Antigravity | [CurriculumClient.tsx](file:///c:/Users/as007/vision-learn/components/student/CurriculumClient.tsx) | Fixed modal close issue by stripping the `lessonId` query parameter from the URL in the `onClose` handler, avoiding infinite state reopen. |
| 2026-06-30 | Antigravity | [page.tsx](file:///c:/Users/as007/vision-learn/app/(dashboard)/dashboard/page.tsx), [DashboardClient.tsx](file:///c:/Users/as007/vision-learn/components/dashboard/DashboardClient.tsx) | Added 'Today, no any class' banner rendering on the dashboard when no class is scheduled for today, offering a Self Study option. Resolved scope resolution for `todayMatch`. |
| 2026-06-30 | Antigravity | [CurriculumClient.tsx](file:///c:/Users/as007/vision-learn/components/student/CurriculumClient.tsx) | Prioritized today's scheduled class in the "NEXT UP CLASS" recommendation banner on the curriculum page. |
| 2026-06-30 | Antigravity | [DashboardClient.tsx](file:///c:/Users/as007/vision-learn/components/dashboard/DashboardClient.tsx) | Replaced static "Welcome back" with dynamic, time-based greetings ("Good morning", "Good afternoon", "Good evening"). |
| 2026-06-30 | Antigravity | [CurriculumClient.tsx](file:///c:/Users/as007/vision-learn/components/student/CurriculumClient.tsx) | Fixed console TypeError (Failed to fetch) by replacing Next.js router.replace with vanilla window.history.replaceState on modal close. Used lastClosedLessonId state guard. |
| 2026-06-30 | Antigravity | [DashboardClient.tsx](file:///c:/Users/as007/vision-learn/components/dashboard/DashboardClient.tsx) | Removed the "Self Study" button from the "Today, no any class" banner on the dashboard. |
| 2026-06-30 | Antigravity | [page.tsx](file:///c:/Users/as007/vision-learn/app/(dashboard)/dashboard/page.tsx), [DashboardClient.tsx](file:///c:/Users/as007/vision-learn/components/dashboard/DashboardClient.tsx) | When a class is scheduled today, now also shows a "Next Class" preview card below the active class banner, displaying the next future-scheduled lesson with its date, time, and a Preview link. |
| 2026-06-30 | Antigravity | [CurriculumClient.tsx](file:///c:/Users/as007/vision-learn/components/student/CurriculumClient.tsx) | In My Classes, the first incomplete locked lesson after completed classes is now shown prominently (full opacity, amber lock icon, "Coming Next" badge). All other locked classes remain dimmed (opacity-40). |
| 2026-07-02 | Antigravity | [layout.tsx](file:///c:/Users/as007/vision-learn/app/layout.tsx) | Added `suppressHydrationWarning` to the `html` tag to prevent hydration mismatches caused by browser extensions. |
| 2026-07-02 | Antigravity | [cache-manager.ts](file:///c:/Users/as007/vision-learn/lib/cache-manager.ts), [route.ts](file:///c:/Users/as007/vision-learn/app/api/progress/route.ts), [page.tsx](file:///c:/Users/as007/vision-learn/app/(dashboard)/dashboard/courses/[id]/page.tsx) | Fixed student progress sync by correcting the column name from `updated_at` to `last_watched_at` in the cache manager, adding legacy queue item healing/mapping in `syncPending`, rewriting the progress API endpoint, and pulling completed lessons from `user_progress` on the course detail page. |
| 2026-07-02 | Antigravity | [page.tsx](file:///c:/Users/as007/vision-learn/app/(dashboard)/dashboard/page.tsx) | Fixed dashboard showing 0 completed classes — replaced all references to non-existent `completed_at` column with `last_watched_at` in the dashboard server page (progress query, recent activity, streak calculation, and chart history). |
| 2026-07-02 | Antigravity | [page.tsx](file:///c:/Users/as007/vision-learn/app/(dashboard)/dashboard/page.tsx) | Fixed progress circle showing 0% on dashboard — replaced stale `enrollments.progress_percentage` with a live calculation from `completedCount / totalLessonsCount`. |

