import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import CalendarClient from "@/app/(dashboard)/calendar/CalendarClient";

export default async function CalendarPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // 1. Get Student Info & Enrolled Course IDs
  const { data: student } = await supabase
    .from("students")
    .select("batch")
    .eq("id", payload.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, batch")
    .eq("student_id", payload.id);

  const courseIds = enrollments?.map(e => e.course_id) || [];
  
  // Create a map of course_id -> batch for filtering, fallback to global student batch
  const studentCourseBatches: Record<string, string | null> = {};
  enrollments?.forEach(e => {
    studentCourseBatches[e.course_id] = e.batch || student?.batch || null;
  });
  
  const { data: events } = await supabase
    .from("events")
    .select("*, courses(title)")
    .order("event_date", { ascending: true });

  const activeBatch = student?.batch || enrollments?.[0]?.batch;

  // 4. Fetch ALL Schedules for this course (Classes, Tests, Assignments)
  const { data: rawSchedules } = await supabase
    .from("schedules")
    .select("*, courses(title)")
    .in("course_id", courseIds);

  // Filter in JS for robustness (trimmed, case-insensitive, handling "All Batches")
  const normalizedActiveBatch = activeBatch?.trim().toLowerCase();
  
  const filteredSchedules = (rawSchedules || []).filter(s => {
    const sBatch = s.batch?.trim().toLowerCase();
    return !sBatch || 
           sBatch === "all batches" || 
           sBatch === normalizedActiveBatch;
  });

  // Filter specifically for "class" types to unlock curriculum lessons
  const scheduledLessons = filteredSchedules
    .filter(s => s.type === "class")
    .map(s => s.title);

  // Normalize date field for calendar client
  const allEvents = [
    ...(events || []).map(e => ({ ...e, type: e.type || 'event', event_date: e.event_date })),
    ...filteredSchedules.map(s => ({ ...s, event_date: s.date, type: s.type || 'class' }))
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Learning Calendar</h1>
          <p className="text-sm text-slate-500 font-medium">Track your upcoming classes, tests, and deadlines.</p>
        </div>
      </div>

      <CalendarClient initialEvents={allEvents} />
    </div>
  );
}
