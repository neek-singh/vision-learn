import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import CertificatesClient from "./CertificatesClient";

export default async function CertificatesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // Fetch student, enrollments, user progress, modules, and test results in parallel
  const [studentRes, enrollmentsRes, progressRes, modulesRes, testResultsRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, student_id, batch, created_at")
      .eq("id", payload.id)
      .single(),
    supabase
      .from("enrollments")
      .select(`
        id,
        course_id,
        batch,
        progress_percentage,
        enrolled_at,
        courses (id, title, course_code, curriculum)
      `)
      .eq("student_id", payload.id),
    supabase
      .from("user_progress")
      .select("lesson_id")
      .eq("user_id", payload.id)
      .eq("completed", true),
    supabase
      .from("lms_modules")
      .select("id, course_id, lessons(id)"),
    supabase
      .from("test_results")
      .select("test_id, score, total_questions, completed_at, tests(title)")
      .eq("student_id", payload.id)
  ]);

  const student = studentRes.data;
  const enrollments: any[] = enrollmentsRes.data || [];
  const progressRecords = progressRes.data || [];
  const modules = modulesRes.data || [];
  const testResults = testResultsRes.data || [];

  const completedLessonIds = new Set(progressRecords.map((p: any) => p.lesson_id));

  // Map module lessons per course
  const courseLessonsMap: Record<string, string[]> = {};
  modules.forEach((m: any) => {
    if (m.course_id) {
      if (!courseLessonsMap[m.course_id]) courseLessonsMap[m.course_id] = [];
      (m.lessons || []).forEach((l: any) => courseLessonsMap[m.course_id].push(l.id));
    }
  });

  // Calculate live course progress
  const coursesProgress = enrollments.map((e: any) => {
    const course = e.courses || {};
    const lessonIds = courseLessonsMap[e.course_id] || [];
    const totalLessons = lessonIds.length;
    const completedCount = lessonIds.filter(id => completedLessonIds.has(id)).length;
    const progress = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : (typeof e.progress_percentage === "number" ? e.progress_percentage : 0);

    return {
      courseId: e.course_id,
      title: course.title || "Course",
      courseCode: course.course_code || "CRS",
      progress,
      completedLessons: completedCount,
      totalLessons,
      enrolledAt: e.enrolled_at || student?.created_at,
      isCompleted: progress >= 100
    };
  });

  const studentName = student?.name || payload.name || "Student";
  const studentId = student?.student_id || "VL-2026";
  const mainCourseTitle = enrollments[0]?.courses?.title || "My Course";

  return (
    <CertificatesClient 
      studentName={studentName}
      studentId={studentId}
      courseTitle={mainCourseTitle}
      coursesProgress={coursesProgress}
      testResults={testResults}
    />
  );
}
