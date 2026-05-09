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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Attendance</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">Monitor your presence and track your learning consistency.</p>
      </div>

      <Suspense fallback={<AttendanceSkeleton />}>
        <AttendanceContent userId={payload.id} />
      </Suspense>
    </div>
  );
}

async function AttendanceContent({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();

  // Fetch Attendance Records for the logged-in student
  const { data: attendance } = await supabase
    .from("attendance")
    .select(`
      *,
      courses(title)
    `)
    .eq("student_id", userId)
    .order("date", { ascending: false });

  return <StudentAttendanceClient initialRecords={attendance || []} />;
}
