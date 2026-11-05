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
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarContent userId={payload.id} />
    </Suspense>
  );
}

async function CalendarContent({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();

  // 1. Fetch Student & Enrollments in parallel
  const [studentRes, enrollmentRes] = await Promise.all([
    supabase.from("students").select("batch").eq("id", userId).single(),
    supabase.from("enrollments").select("course_id, batch, courses(title)").eq("student_id", userId)
  ]);

  const student = studentRes.data;
  const enrollments: any[] = enrollmentRes.data || [];
  const courseIds = enrollments.map(e => e.course_id);
  const activeBatch = student?.batch || enrollments[0]?.batch;
  const courseTitle = enrollments[0]?.courses?.title || "Web Development";

  // 2. Fetch Events and Schedules in parallel
  let schedulesQuery = supabase
    .from("schedules")
    .select("*, courses(title)")
    .order("date", { ascending: true });

  if (courseIds.length > 0) {
    schedulesQuery = schedulesQuery.in("course_id", courseIds);
  }

  const [eventsRes, schedulesRes] = await Promise.all([
    supabase.from("events").select("*, courses(title)").order("event_date", { ascending: true }),
    schedulesQuery
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

  return <CalendarClient initialEvents={allEvents} courseTitle={courseTitle} />;
}
