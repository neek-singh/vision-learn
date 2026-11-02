import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import StudentAttendanceClient from "@/app/(dashboard)/attendance/StudentAttendanceClient";
import { AttendanceSkeleton } from "@/components/dashboard/DashboardSkeletons";

export default async function StudentAttendancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  return (
    <Suspense fallback={<AttendanceSkeleton />}>
      <AttendanceContent userId={payload.id} />
    </Suspense>
  );
}

async function AttendanceContent({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();

  // Fetch Attendance Records, Student and Enrollments in parallel
  const [studentRes, enrollmentRes, attendanceRes, batchesRes] = await Promise.all([
    supabase.from("students").select("id, name, batch").eq("id", userId).single(),
    supabase.from("enrollments").select("course_id, batch, courses(title)").eq("student_id", userId),
    supabase.from("attendance").select("*, courses(title)").eq("student_id", userId).order("date", { ascending: false }),
    supabase.from("batches").select("*")
  ]);

  const student = studentRes.data;
  const enrollments: any[] = enrollmentRes.data || [];
  const attendance = attendanceRes.data || [];
  const batches: any[] = batchesRes.data || [];

  const courseTitle = enrollments[0]?.courses?.title || "Web Development";
  const activeBatch = student?.batch || enrollments[0]?.batch || "WD-2026";
  const matchedBatch = batches.find((b: any) => 
    b.title?.trim().toLowerCase() === activeBatch?.trim().toLowerCase()
  );

  return (
    <StudentAttendanceClient 
      initialRecords={attendance} 
      courseTitle={courseTitle}
      batchName={activeBatch}
      batchTiming={matchedBatch?.timing || "10:00 AM - 11:00 AM"}
      facultyName={matchedBatch?.faculty_name || "Neeraj Sir"}
    />
  );
}
