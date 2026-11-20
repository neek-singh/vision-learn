import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import TestsClient from "@/app/(dashboard)/tests/TestsClient";

export default async function TestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // 1. Get Student Batch & Enrollments
  const [studentRes, enrollmentRes] = await Promise.all([
    supabase.from("students").select("batch").eq("id", payload.id).single(),
    supabase.from("enrollments").select("course_id, batch, courses(title)").eq("student_id", payload.id)
  ]);

  const student = studentRes.data;
  const enrollments: any[] = enrollmentRes.data || [];
  const courseIds = enrollments.map(e => e.course_id).filter(Boolean);
  const activeBatch = (student?.batch || enrollments[0]?.batch || "").trim();

  // 2. Fetch Batches, Modules, and Schedules for these courses in parallel
  const schedulesQuery = courseIds.length > 0
    ? supabase.from("schedules").select("*, courses(title)").or(`course_id.in.(${courseIds.join(",")}),course_id.is.null`).order("date", { ascending: true })
    : supabase.from("schedules").select("*, courses(title)").is("course_id", null).order("date", { ascending: true });

  const [schedulesRes, batchesRes, modulesRes, chaptersRes] = await Promise.all([
    schedulesQuery,
    courseIds.length > 0 ? supabase.from("batches").select("id, title").in("course_id", courseIds) : { data: [] },
    courseIds.length > 0 ? supabase.from("lms_modules").select("id, title, course_id").in("course_id", courseIds) : { data: [] },
    courseIds.length > 0 ? supabase.from("lms_chapters").select("id, title, module_id, course_id").in("course_id", courseIds) : { data: [] }
  ]);

  const rawSchedules = schedulesRes.data || [];
  const batches = batchesRes.data || [];
  const modules = modulesRes.data || [];
  const chapters = chaptersRes.data || [];

  const activeBatchLower = activeBatch.toLowerCase();
  const activeBatchMatch = batches.find((b: any) => {
    const title = b.title?.trim().toLowerCase();
    return title && (title.includes(activeBatchLower) || activeBatchLower.includes(title));
  });
  const activeBatchId = activeBatchMatch?.id || null;

  // Filter schedules by student's active batch or all batches
  const schedules = rawSchedules.filter((s: any) => {
    const sBatch = (s.batch || "").trim().toLowerCase();
    const batchMatch = !sBatch || sBatch === "all batches" || sBatch === "all" || !activeBatchLower || sBatch === activeBatchLower || (activeBatchId && sBatch === activeBatchId.toLowerCase());
    return batchMatch;
  });

  // 3. Fetch Tests (from tests table)
  const rawTests = courseIds.length > 0 ? (await supabase
    .from("tests")
    .select(`
      *,
      courses(title),
      test_questions(id)
    `)
    .in("course_id", courseIds)
    .order("created_at", { ascending: false })).data : [];

  const tests = (rawTests || []).filter(t => {
    // Hide unpublished tests (keep undefined/null as visible so tests are not hidden prematurely)
    if (t.is_published === false) return false;

    // Filter by batches array if defined
    if (Array.isArray(t.batches) && t.batches.length > 0) {
      return t.batches.some((b: string) => {
        const bLower = (b || "").trim().toLowerCase();
        return bLower === activeBatchLower || bLower === "all" || bLower === "all batches" || (activeBatchId && (b === activeBatchId || bLower === activeBatchId.toLowerCase()));
      });
    }

    // Filter by single batch string if defined
    if (t.batch && t.batch !== "All Batches" && t.batch.trim().toLowerCase() !== "all") {
      const tBatchLower = t.batch.trim().toLowerCase();
      return tBatchLower === activeBatchLower || (activeBatchId && (t.batch === activeBatchId || tBatchLower === activeBatchId.toLowerCase()));
    }

    return true;
  });

  // 4. Fetch curriculum quiz lessons (mcq type)
  const rawQuizLessons = courseIds.length > 0 ? (await supabase
    .from("lessons")
    .select("id, title, course_id, module_id, notes_content, lesson_type, type, batches, created_at, courses(title)")
    .in("course_id", courseIds)
    .or("lesson_type.eq.mcq,type.eq.mcq")).data : [];

  // Filter quiz lessons by student's batch
  const quizLessons = (rawQuizLessons || []).filter((ql: any) => {
    if (Array.isArray(ql.batches) && ql.batches.length > 0) {
      const activeBatchLower = activeBatch.toLowerCase();
      return ql.batches.some((b: string) => {
        const bLower = (b || "").trim().toLowerCase();
        return bLower === activeBatchLower || bLower === "all" || bLower === "all batches" || (activeBatchId && b === activeBatchId);
      });
    }
    return true;
  });

  // 5. Fetch Results, Quiz Submissions, and User Progress in parallel
  const [resultsRes, submissionsRes, progressRes] = await Promise.all([
    supabase
      .from("test_results")
      .select("test_id, score, total_questions, completed_at")
      .eq("student_id", payload.id),
    supabase
      .from("submissions")
      .select("lesson_id, score, status, content_url, submitted_at")
      .eq("student_id", payload.id),
    supabase
      .from("user_progress")
      .select("lesson_id")
      .eq("user_id", payload.id)
      .eq("completed", true)
  ]);

  const results = resultsRes.data || [];
  const quizSubmissions = submissionsRes.data || [];
  const completedLessonIds = (progressRes.data || []).map(p => p.lesson_id);

  const courseTitle = enrollments[0]?.courses?.title || "My Course";

  return (
    <TestsClient 
      initialTests={tests || []} 
      modules={modules}
      chapters={chapters}
      schedules={schedules || []}
      activeBatch={activeBatch}
      activeBatchId={activeBatchId}
      studentId={payload.id} 
      initialResults={results} 
      quizLessons={quizLessons || []}
      quizSubmissions={quizSubmissions}
      initialCompletedLessons={completedLessonIds}
      courseTitle={courseTitle}
    />
  );
}
