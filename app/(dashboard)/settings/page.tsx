import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import SettingsClient from "@/components/settings/SettingsClient";
import { ProfilePageSkeleton } from "@/components/dashboard/DashboardSkeletons";

export const metadata = {
  title: "Settings - Vision Learn",
  description: "Manage your account, preferences and learning experience."
};

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const userId = payload.id;
  const supabase = createPublicSupabaseClient();

  // Fetch Student Profile and Enrollments
  const [studentRes, enrollmentRes] = await Promise.all([
    supabase.from("students").select("*").eq("id", userId).single(),
    supabase.from("enrollments").select(`
      id,
      batch,
      course_id,
      progress_percentage,
      courses(id, title, course_code)
    `).eq("student_id", userId)
  ]);

  const student = studentRes.data;
  const enrollments = enrollmentRes.data || [];
  const mainCourse = enrollments[0]?.courses;

  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <SettingsClient 
        student={student} 
        enrollments={enrollments} 
        course={mainCourse} 
      />
    </Suspense>
  );
}
