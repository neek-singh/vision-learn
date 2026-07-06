import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import AssignmentsClient from "./AssignmentsClient";
import { BookOpen } from "lucide-react";

export default async function AssignmentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // 1. Get Student Batch & Enrolled Course IDs
  const [studentRes, enrollmentRes] = await Promise.all([
    supabase.from("students").select("batch").eq("id", payload.id).single(),
    supabase.from("enrollments").select("course_id, batch").eq("student_id", payload.id)
  ]);

  const student = studentRes.data;
  const enrollments = enrollmentRes.data || [];
  const courseIds = enrollments.map(e => e.course_id).filter(Boolean);
  const activeBatch = (student?.batch || enrollments[0]?.batch || "").trim().toLowerCase();

  // 2. Fetch schedules for these courses (assignment type OR any type with scheduled date)
  const { data: schedulesRaw } = await supabase
    .from("schedules")
    .select("*")
    .in("course_id", courseIds);

  const now = new Date();

  // Filter schedules: batch matches + time has passed (scheduled or live)
  const liveSchedules = (schedulesRaw || []).filter(s => {
    const sBatch = s.batch?.trim().toLowerCase();
    const batchMatch = !sBatch || sBatch === "all batches" || !activeBatch ||
                       sBatch === activeBatch || sBatch.includes(activeBatch) || activeBatch.includes(sBatch);
    if (!batchMatch) return false;
    const timeStr = s.start_time || "00:00:00";
    const sDate = new Date(`${s.date}T${timeStr}`);
    return now >= sDate;
  });

  // Assignment and Project type schedules that are now live
  const liveTaskSchedules = liveSchedules.filter(s => {
    const t = (s.type || "").toLowerCase();
    return t === "assignment" || t === "project";
  });

  // 3. Fetch curriculum lessons that are assignment or project type
  const { data: taskLessons } = await supabase
    .from("lessons")
    .select("id, title, course_id, notes_content, assignment_file, lesson_type, type, created_at")
    .in("course_id", courseIds)
    .or("lesson_type.eq.assignment,type.eq.assignment,lesson_type.eq.project,type.eq.project");

  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  // Match curriculum lessons to live schedules
  const scheduledLessons = (taskLessons || []).filter(lesson => {
    return liveTaskSchedules.some(s =>
      normalize(s.title).includes(normalize(lesson.title)) ||
      normalize(lesson.title).includes(normalize(s.title))
    );
  });

  // 4. Fetch traditional Assignments table entries (published)
  const { data: assignments } = await supabase
    .from("assignments")
    .select("*, courses(title)")
    .in("course_id", courseIds)
    .eq("is_published", true)
    .order("due_date", { ascending: true });

  const filteredTraditionalAssignments = (assignments || []).filter(a => {
    if (!a.batch || a.batch === "All Batches") return true;
    const enrollmentForCourse = enrollments.find(e => e.course_id === a.course_id);
    return enrollmentForCourse && enrollmentForCourse.batch === a.batch;
  });

  // 5. Fetch Submissions
  const { data: submissions } = await supabase
    .from("submissions")
    .select("assignment_id, lesson_id, status, content_url")
    .eq("student_id", payload.id);

  // 6. Find the matching schedule for each lesson to get due date
  const scheduledLessonsWithSchedule = scheduledLessons.map(lesson => {
    const matchedSchedule = liveTaskSchedules.find(s =>
      normalize(s.title).includes(normalize(lesson.title)) ||
      normalize(lesson.title).includes(normalize(s.title))
    );
    const enrollment = enrollments.find(e => e.course_id === lesson.course_id);
    return {
      ...lesson,
      schedule: matchedSchedule,
      enrollmentBatch: enrollment?.batch,
      source: "lesson" as const
    };
  });

  const traditionalWithSource = filteredTraditionalAssignments.map(a => ({
    ...a,
    source: "assignment" as const
  }));

  const allAssignments = [...scheduledLessonsWithSchedule, ...traditionalWithSource];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Assignments</h1>
        <p className="text-sm text-slate-500 font-medium">Keep track of your tasks and submission deadlines.</p>
      </section>

      {allAssignments.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <p className="text-slate-400 font-bold">No assignments available yet. Check back when assignments are scheduled.</p>
        </div>
      ) : (
        <AssignmentsClient
          initialAssignments={allAssignments}
          initialSubmissions={submissions || []}
          studentId={payload.id}
        />
      )}
    </div>
  );
}
