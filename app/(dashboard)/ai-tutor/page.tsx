import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import AITutorClient from "./AITutorClient";

export default async function AITutorPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // Run student profile and enrollments queries concurrently
  const [studentRes, enrollmentsRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, batch, course")
      .eq("id", payload.id)
      .single(),
    supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", payload.id),
  ]);

  const student = studentRes.data;
  const courseIds = enrollmentsRes.data?.map((e) => e.course_id).filter(Boolean) || [];

  // Run courses and materials queries concurrently
  let courses: any[] = [];
  let materials: any[] = [];

  if (courseIds.length > 0) {
    const [coursesRes, materialsRes] = await Promise.all([
      supabase
        .from("courses")
        .select("id, title, description, category, instructor")
        .in("id", courseIds)
        .eq("is_published", true),
      supabase
        .from("materials")
        .select("id, course_id, title, type, content_url")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    courses = coursesRes.data || [];
    materials = materialsRes.data || [];
  }

  return (
    <AITutorClient
      studentId={payload.id}
      studentName={student?.name || payload.name || "Student"}
      courses={courses || []}
      materials={materials || []}
    />
  );
}
