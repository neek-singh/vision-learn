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

  // Fetch student and enrollments in parallel
  const [studentRes, enrollmentsRes] = await Promise.all([
    supabase.from("students").select("id, name, student_id, batch").eq("id", payload.id).single(),
    supabase.from("enrollments").select("course_id, batch, courses(title)").eq("student_id", payload.id)
  ]);

  const student = studentRes.data;
  const enrollments: any[] = enrollmentsRes.data || [];
  const courseTitle = enrollments[0]?.courses?.title || "Web Development";
  const studentName = student?.name || payload.name || "Neeraj Singh";
  const studentId = student?.student_id || "WD-2026";

  return (
    <CertificatesClient 
      studentName={studentName}
      studentId={studentId}
      courseTitle={courseTitle}
    />
  );
}
