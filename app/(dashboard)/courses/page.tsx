import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import { CoursesClient } from "@/components/student/CoursesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CoursesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // 1. Fetch Student Enrollments with course details and batch
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      course_id,
      batch,
      progress_percentage,
      enrolled_at,
      courses (*)
    `)
    .eq("student_id", payload.id);

  // Fetch student's completed lessons for live progress calculation
  const { data: userProgress } = await supabase
    .from("user_progress")
    .select("lesson_id")
    .eq("user_id", payload.id)
    .eq("completed", true);

  const completedLessonIds = new Set((userProgress || []).map(p => p.lesson_id));

  // 2. Fetch all available courses for catalog
  const { data: allCourses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  // 3. Fetch module and lesson counts for courses
  const { data: modules } = await supabase
    .from("lms_modules")
    .select("id, course_id, lessons(id)");

  const modulesCountMap: Record<string, number> = {};
  const lessonsCountMap: Record<string, number> = {};
  const courseLessonsMap: Record<string, string[]> = {};

  (modules || []).forEach((m: any) => {
    if (m.course_id) {
      modulesCountMap[m.course_id] = (modulesCountMap[m.course_id] || 0) + 1;
      const lessonList = m.lessons || [];
      lessonsCountMap[m.course_id] = (lessonsCountMap[m.course_id] || 0) + lessonList.length;
      if (!courseLessonsMap[m.course_id]) {
        courseLessonsMap[m.course_id] = [];
      }
      lessonList.forEach((l: any) => courseLessonsMap[m.course_id].push(l.id));
    }
  });

  // Calculate accurate progress for each enrollment
  const enrichedEnrollments = (enrollments || []).map((e: any) => {
    const courseId = e.course_id;
    const lessonIds = courseLessonsMap[courseId] || [];
    let progress = typeof e.progress_percentage === "number" ? e.progress_percentage : 0;
    if (lessonIds.length > 0) {
      const completedCount = lessonIds.filter(id => completedLessonIds.has(id)).length;
      progress = Math.round((completedCount / lessonIds.length) * 100);
    }
    return {
      ...e,
      progress_percentage: progress
    };
  });

  return (
    <CoursesClient
      initialEnrollments={enrichedEnrollments || []}
      allCourses={allCourses || []}
      modulesCountMap={modulesCountMap}
      lessonsCountMap={lessonsCountMap}
      studentId={payload.id}
    />
  );
}

