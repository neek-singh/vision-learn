import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import CalendarClient from "@/app/(dashboard)/calendar/CalendarClient";
import { CalendarSkeleton } from "@/components/dashboard/DashboardSkeletons";

export default async function CalendarPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Learning Calendar</h1>
          <p className="text-sm text-slate-500 font-medium">Track your upcoming classes, tests, and deadlines.</p>
        </div>
      </div>

      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarContent userId={payload.id} />
      </Suspense>
    </div>
  );
}

async function CalendarContent({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();

  // 1. Fetch Student & Enrollments in parallel
  const [studentRes, enrollmentRes] = await Promise.all([
    supabase.from("students").select("batch").eq("id", userId).single(),
    supabase.from("enrollments").select("course_id, batch").eq("student_id", userId)
  ]);

  const student = studentRes.data;
  const enrollments = enrollmentRes.data || [];
  const courseIds = enrollments.map(e => e.course_id);
  const activeBatch = student?.batch || enrollments[0]?.batch;

  // 2. Fetch Events and Schedules in parallel
  const [eventsRes, schedulesRes] = await Promise.all([
    supabase.from("events").select("*, courses(title)").order("event_date", { ascending: true }),
    supabase.from("schedules").select("*, courses(title)").in("course_id", courseIds)
  ]);

  const events = eventsRes.data || [];
  const rawSchedules = schedulesRes.data || [];

  // 3. Filter and normalize in JS
  const normalizedActiveBatch = activeBatch?.trim().toLowerCase();
  
  const filteredSchedules = rawSchedules.filter(s => {
    const sBatch = s.batch?.trim().toLowerCase();
    const batchMatch = !sBatch || sBatch === "all batches" || sBatch === "all" || !normalizedActiveBatch || sBatch === normalizedActiveBatch;
    return batchMatch;
  });

  // Filter events: only show if course_id is null (public/holiday) or if it matches the student's courseIds
  const filteredEvents = events.filter(e => !e.course_id || courseIds.includes(e.course_id));

  const allEvents = [
    ...filteredEvents.map(e => ({ ...e, type: e.type || 'event', event_date: e.event_date })),
    ...filteredSchedules.map(s => ({ ...s, event_date: s.date, type: s.type || 'class' }))
  ];

  return <CalendarClient initialEvents={allEvents} />;
}
