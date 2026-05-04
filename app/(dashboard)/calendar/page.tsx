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

  // 1. Get Enrolled Course IDs
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", payload.id);

  const courseIds = enrollments?.map(e => e.course_id) || [];

  // 2. Fetch Public/Course Events
  const { data: events } = await supabase
    .from("events")
    .select("*, courses(title)")
    .or(`course_id.in.(${courseIds.join(',')}),course_id.is.null`)
    .order("event_date", { ascending: true });

  // 3. Fetch Academic Schedules (Classes, Tests, Assignments)
  const { data: schedules } = await supabase
    .from("schedules")
    .select("*, courses(title)")
    .in("course_id", courseIds)
    .order("date", { ascending: true });

  // Merge them for the client — normalize date field to `event_date`
  const allEvents = [
    ...(events || []).map(e => ({ ...e, type: e.type || 'event', event_date: e.event_date })),
    ...(schedules || []).map(s => ({ ...s, event_date: s.date, type: s.type || 'class' }))
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
