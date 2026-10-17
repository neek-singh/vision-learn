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

  // 1. Fetch Student Enrollments with course details
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      course_id,
      progress_percentage,
      enrolled_at,
      courses (*)
    `)
    .eq("student_id", payload.id);

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

  (modules || []).forEach((m: any) => {
    if (m.course_id) {
      modulesCountMap[m.course_id] = (modulesCountMap[m.course_id] || 0) + 1;
      const lessonCount = m.lessons?.length || 0;
      lessonsCountMap[m.course_id] = (lessonsCountMap[m.course_id] || 0) + lessonCount;
    }
  });

  return (
    <CoursesClient
      initialEnrollments={enrollments || []}
      allCourses={allCourses || []}
      modulesCountMap={modulesCountMap}
      lessonsCountMap={lessonsCountMap}
      studentId={payload.id}
    />
  );
}

