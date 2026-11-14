# Vision-Learn Runtime Crash Audit & Resolution Report

**Target**: `vision-learn` Next.js Application (`c:\Users\as007\vision project\vision-learn`)  
**Auditor**: Teamwork Worker (Milestone 1: Crash Audit and Runtime Crash Resolution)  
**Date**: 2026-11-14  
**Audit Status**: COMPLETED & VERIFIED  

---

## 1. Executive Summary

A comprehensive runtime crash audit and stability investigation was conducted across the `vision-learn` codebase. While static type checking initially completed without syntax errors, extensive code path analysis, mobile environment emulation, and state boundary auditing uncovered **10 distinct runtime crash vectors and unhandled exception triggers**.

These crash conditions ranged from fatal root crashes on iOS Safari and mobile WebViews, catastrophic application-wide white screens due to missing Next.js error boundaries, unhandled `RangeError` and `TypeError` exceptions during data parsing, to silent timer loops throwing `SecurityError` every 1,000 milliseconds.

All 10 vulnerabilities have been systematically resolved with resilient, defensive implementations. Next.js App Router error boundaries have been installed at the root, app, and dashboard segment levels. The application now builds cleanly and handles edge cases gracefully without unhandled exceptions.

---

## 2. Identified Crash Triggers, Root Causes, and Applied Fixes

### Finding 1: Uncaught `ReferenceError: Notification is not defined` on Mobile & WebViews
- **Affected File**: `hooks/usePushNotifications.ts`
- **Error Condition**: `ReferenceError: Notification is not defined`
- **Root Cause**: On iOS Safari (versions prior to 16.4 or when PWA is not added to the home screen), Android WebViews, and in-app browsers (e.g. Instagram, Facebook, LinkedIn), the global `Notification` object does not exist on `window`. Line 18 in `usePushNotifications` evaluated `Notification.permission === 'granted'` outside the `window` presence guard. Because `usePushNotifications` is unconditionally invoked in `app/(dashboard)/layout.tsx`, every authenticated dashboard route suffered a fatal mount crash for these mobile users.
- **Applied Fix**:
  - Qualified all `Notification` references via `window.Notification` guarded by `typeof window !== "undefined" && "Notification" in window`.
  - Added safe fallback `try/catch` block inside `requestPermission` and `useEffect`.
  - Gracefully aborts subscription and sets `permission: 'default'` when notifications are unsupported.

---

### Finding 2: Total Absence of Next.js App Router Error Boundaries
- **Missing Boundaries**:
  - `app/global-error.tsx` (Missing root crash boundary)
  - `app/error.tsx` (Missing application-level boundary)
  - `app/(dashboard)/error.tsx` (Missing dashboard section boundary)
- **Error Condition**: Unhandled runtime exceptions in Server Components or during client hydration caused Next.js to unmount the entire component tree, displaying a blank white screen or default unstyled 500 error with no recovery option.
- **Root Cause**: Next.js App Router requires explicit `error.tsx` and `global-error.tsx` boundary files to catch exceptions within route segments. None existed in the project.
- **Applied Fix**:
  - Created `app/global-error.tsx`: Root client boundary rendering custom `<html>` and `<body>` tags with error logging, Error ID digest display, reload trigger (`reset()`), and home navigation link.
  - Created `app/error.tsx`: App-level client error boundary catching unexpected errors across non-dashboard pages.
  - Created `app/(dashboard)/error.tsx`: Dashboard-scoped client error boundary preserving sidebar, top navigation, and student session state while offering a section-level "Retry Loading" action.

---

### Finding 3: Synchronous `RangeError: Invalid time value` in Certificate Generation
- **Affected File**: `app/(dashboard)/certificates/CertificatesClient.tsx`
- **Error Condition**: `RangeError: Invalid time value at Date.toISOString (<anonymous>)`
- **Root Cause**: Course enrollment dates (`c.enrolledAt`) and test completion dates (`t.completed_at`) retrieved from Supabase can be malformed, non-standard timestamp strings, or null. Direct calls to `new Date(input).toISOString()` inside synchronous `useMemo` threw a fatal `RangeError`, instantly crashing the `/certificates` page upon rendering.
- **Applied Fix**:
  - Implemented `safeFormatDate(input: any)` helper that validates `isNaN(d.getTime())`.
  - Invalid timestamps cleanly fall back to `"N/A"` display string and the current timestamp for ISO storage without throwing `RangeError`.

---

### Finding 4: Fatal `TypeError: submission.score.includes is not a function` in Lesson Quiz Submissions
- **Affected File**: `components/student/LessonViewer.tsx`
- **Error Condition**: `TypeError: submission.score.includes is not a function` / `TypeError: submission.score.split is not a function`
- **Root Cause**: `TestsClient.tsx` stores submitted quiz scores as numeric integers (e.g. `score: 5`), whereas `LessonViewer.tsx` assumed `submission.score` was always a formatted ratio string (e.g. `"5/10"`). When evaluating `submission.score.includes('/')`, JavaScript threw an unhandled `TypeError` whenever `score` was a number.
- **Applied Fix**:
  - Implemented universal `parseScore(score: any, totalQuestions?: number)` helper that safely handles:
    - Numeric integers (e.g., `5` -> `{ correct: 5, total: totalQuestions || 5, percentage: ... }`)
    - Ratio strings (e.g., `"5/10"` -> `{ correct: 5, total: 10, percentage: 50 }`)
    - Pure numeric strings (e.g., `"5"` -> `{ correct: 5, total: totalQuestions, percentage: ... }`)
    - Null/undefined/empty values
  - Replaced all direct `.includes('/')` and `.split('/')` operations with `parseScore` calculations.

---

### Finding 5: Non-Existent Route 404 Trigger on Homework Links
- **Affected File**: `components/student/LessonViewer.tsx`
- **Error Condition**: HTTP 404 Route Not Found
- **Root Cause**: The "Start Homework" button on lesson pages linked to `/test/${test.id}`. The Next.js router defines `/tests` (with query parameters or modal taking), but has no dynamic route `/test/[id]`. Clicking "Start Homework" broke the student learning flow with a 404 error page.
- **Applied Fix**:
  - Updated the link target to `/tests?testId=${test.id}`, correctly routing students to the tests taking interface.

---

### Finding 6: Unchecked `.toLowerCase()` on Nullable Title Strings
- **Affected File**: `components/student/LessonViewer.tsx`
- **Error Condition**: `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`
- **Root Cause**: In multiple filter expressions across `initialTests` and `initialMaterials`, `.toLowerCase()` was invoked directly on `t.title`, `lesson.title`, `s.title`, and `m.title` without null checks. If an assessment, material, or schedule had a missing or null title in the database, the curriculum viewer crashed immediately.
- **Applied Fix**:
  - Protected all title casing evaluations with `(item?.title || "").toLowerCase()`.
  - Added safety checks verifying non-empty strings before evaluating `.includes()`.

---

### Finding 7: NaN Division-by-Zero and Out-of-Bounds Indexing in Global Search
- **Affected File**: `components/GlobalSearch.tsx`
- **Error Condition**: `selectedIndex` evaluated to `NaN` via `% 0`, leading to permanent keyboard navigation lockup and `undefined` item access.
- **Root Cause**: Keyboard navigation handlers (`ArrowDown` and `ArrowUp`) executed `(prev + 1) % flatResults.length` without checking if `flatResults.length > 0`. When no results were present, `(prev + 1) % 0` yielded `NaN`. Once `selectedIndex` was `NaN`, all subsequent modulo arithmetic remained `NaN`. Additionally, `selectedIndex` was not reset when the search query changed.
- **Applied Fix**:
  - Guarded ArrowDown and ArrowUp navigation with `if (flatResults.length > 0)`.
  - Added `useEffect` hook to reset `selectedIndex` to `0` whenever `query` changes.
  - Guarded Enter key handler with `flatResults.length > 0 && flatResults[selectedIndex]`.

---

### Finding 8: Unhandled `SecurityError` Flooding in 1-Second Interval Active Tracker
- **Affected File**: `app/(dashboard)/layout.tsx`
- **Error Condition**: `DOMException: Access is denied for this document` / `SecurityError` / `QuotaExceededError`
- **Root Cause**: The study time tracking interval executed every 1,000 milliseconds, reading and writing to `localStorage` without a `try/catch` block. In iOS Safari Private Browsing mode, Brave strict shields, restricted sandboxed iframes, or when storage quota is exceeded, `localStorage.getItem` or `localStorage.setItem` throws `SecurityError`, crashing background scripts and spamming the browser console every second.
- **Applied Fix**:
  - Wrapped all `localStorage.getItem` and `localStorage.setItem` calls inside the 1,000ms interval in defensive `try/catch` blocks.
  - Added safe fallbacks for accumulated study seconds and dispatched custom tick events safely.

---

### Finding 9: PostgREST HTTP 400 Bad Request on Empty `.in()` Query Filter
- **Affected Files**:
  - `app/(dashboard)/materials/page.tsx`
  - `app/(dashboard)/tests/page.tsx`
  - `app/(dashboard)/assignments/page.tsx`
- **Error Condition**: HTTP 400 `Bad Request: {"message":"failed to parse filter (course_id.in.())"}`
- **Root Cause**: When a newly registered student has no course enrollments (`courseIds = []`), calling Supabase PostgREST `.in("course_id", courseIds)` sends the query parameter `course_id=in.()`, which is rejected as invalid syntax by PostgREST.
- **Applied Fix**:
  - Guarded all server-side `.in("course_id", courseIds)` database queries with `courseIds.length > 0 ? (await ...).data : []`.
  - Skips unnecessary network requests when the student has no enrolled courses, returning clean empty arrays without errors.

---

### Finding 10: HTTP 405 Method Not Allowed on Profile Save in Settings
- **Affected File**: `app/api/auth/profile/route.ts`
- **Error Condition**: HTTP 405 Method Not Allowed
- **Root Cause**: The `SettingsClient` component issues a `PATCH` request to `/api/auth/profile` when a student updates their name, phone, gender, or bio. However, `app/api/auth/profile/route.ts` only implemented a `GET` handler, causing Next.js to return HTTP 405 Method Not Allowed.
- **Applied Fix**:
  - Implemented a complete, authenticated `PATCH` handler in `app/api/auth/profile/route.ts`.
  - Verifies session JWT cookie via `verifyToken`.
  - Supports both `name` and `full_name`, `phone`, `gender`, and `bio`.
  - Updates the student record in the Supabase `students` table and returns `{ profile, student, success: true }`.

---

## 3. Verification & Reproduction Procedures

| # | Vulnerability | Reproduction Trigger | Verification Method | Result |
|---|---------------|----------------------|---------------------|--------|
| 1 | Push Notification ReferenceError | Simulate environment without `window.Notification` (`delete window.Notification`) | Mount dashboard layout; hook cleanly falls back to disabled state without throwing | PASSED |
| 2 | Missing Error Boundaries | Force an unhandled error inside server component or client render | Error caught by nearest boundary (`app/(dashboard)/error.tsx` or `app/global-error.tsx`), displaying recovery UI | PASSED |
| 3 | Invalid Date RangeError | Pass non-date string `enrolledAt: "corrupted"` | `safeFormatDate` returns `{ formattedDate: "N/A", isoDate: ... }` without RangeError | PASSED |
| 4 | Score includes TypeError | Supply integer `score: 5` from test submissions | `parseScore(5, 10)` calculates 50% accuracy and renders score cleanly without TypeError | PASSED |
| 5 | Broken Homework Link | Click "Start Homework" from lesson viewer | Navigates to `/tests?testId=${test.id}` instead of dead 404 route | PASSED |
| 6 | Title toLowerCase Crash | Pass curriculum lesson or test with `title: null` | `(title || "").toLowerCase()` evaluates safely without null reference exceptions | PASSED |
| 7 | GlobalSearch NaN / Stuck State | Press ArrowDown on empty search input | Modulo calculation guarded; `selectedIndex` remains 0 and resets on query change | PASSED |
| 8 | localStorage SecurityError | Block storage access via browser privacy settings | 1-second timer continues counting active time without console errors | PASSED |
| 9 | PostgREST Empty Array 400 | Fetch materials/tests/assignments for student with 0 enrollments | `.in()` query skipped; returns `[]` with HTTP 200 | PASSED |
| 10 | Profile Save HTTP 405 | Submit profile update form in `/settings` | `PATCH /api/auth/profile` updates database and returns HTTP 200 | PASSED |

---

## 4. Automated Build & Compilation Verification

1. **TypeScript Typecheck**:
   ```bash
   node ./node_modules/typescript/bin/tsc --noEmit
   ```
   **Output**: Exit Code 0 (0 errors)

2. **Next.js Production Build**:
   ```bash
   npm run build
   ```
   **Output**: Exit Code 0 (All routes compiled, static generation successful)

---

## 5. Conclusion

All 10 identified runtime crash vulnerabilities have been definitively fixed. The application now incorporates comprehensive error boundaries, robust data parsing, and defensive guards across all device and network profiles.
