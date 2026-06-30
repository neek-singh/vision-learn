import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const userId = payload.id;
  const supabase = createPublicSupabaseClient();

  // 1. Fetch Student Info, Enrollments, and Progress Records in parallel
  const [studentRes, enrollmentsRes, progressRes, notificationsRes] = await Promise.all([
    supabase.from("students").select("*").eq("id", userId).single(),
    supabase.from("enrollments").select(`
      id,
      course_id,
      batch,
      progress_percentage,
      courses(id, title, course_code)
    `).eq("student_id", userId),
    supabase.from("user_progress").select("lesson_id, completed_at").eq("user_id", userId).eq("completed", true),
    supabase.from("user_notifications").select(`
      id,
      notifications (title, message)
    `).eq("user_id", userId).eq("is_read", false).order("created_at", { ascending: false }).limit(1)
  ]);

  const student = studentRes.data;
  const enrollments = enrollmentsRes.data || [];
  const progressRecords = progressRes.data || [];
  const notifications = notificationsRes.data || [];

  const mainEnrollment = enrollments[0];
  const mainCourse = mainEnrollment?.courses;
  const otherCourses = enrollments.slice(1);

  // 2. Fetch total lessons for the active course
  let totalLessonsCount = 0;
  if (mainEnrollment?.course_id) {
    const { data: modules } = await supabase
      .from("lms_modules")
      .select("lessons(id)")
      .eq("course_id", mainEnrollment.course_id);
    
    if (modules) {
      totalLessonsCount = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
    }
  }

  const completedCount = progressRecords.length;
  const progressPercentage = mainEnrollment?.progress_percentage || 0;
  const remainingCount = Math.max(0, totalLessonsCount - completedCount);

  // 3. Find next available lesson (scheduled/unscheduled)
  let nextLesson = null;
  let isLessonScheduledToday = false;
  if (mainEnrollment?.course_id) {
    const activeBatch = (student?.batch || mainEnrollment?.batch)?.trim().toLowerCase();
    const [modulesRes, schedulesRes] = await Promise.all([
      supabase.from("lms_modules").select(`id, title, order_index, lessons (id, title, order_index, type)`).eq("course_id", mainEnrollment.course_id).order("order_index"),
      supabase.from("schedules").select("title, batch, type, date, start_time").eq("course_id", mainEnrollment.course_id)
    ]);

    const completedIds = progressRecords.map(p => p.lesson_id);
    const modules = modulesRes.data || [];
    const schedules = schedulesRes.data || [];
    const now = new Date();

    // Get local today string in YYYY-MM-DD format
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

    const allModulesWithLessons = modules.sort((a: any, b: any) => a.order_index - b.order_index);
    const incompleteLessonsWithSchedules: { lesson: any; schedule: any }[] = [];

    for (const module of allModulesWithLessons) {
      const lessons = (module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index);
      for (const lesson of lessons) {
        if (completedIds.includes(lesson.id)) continue;

        const mTitle = normalize(module.title);
        const lTitle = normalize(lesson.title);

        const schedule = schedules.find(s => {
          const sTitle = s.title?.trim();
          if (!sTitle) return false;

          const sBatch = s.batch?.trim().toLowerCase();
          const batchMatch = !sBatch || sBatch === "all batches" || !activeBatch || 
                             sBatch === activeBatch || sBatch.includes(activeBatch) || 
                             activeBatch.includes(sBatch);
          if (!batchMatch) return false;

          const normSTitle = normalize(sTitle);
          return normSTitle.includes(lTitle) && normSTitle.includes(mTitle);
        });

        incompleteLessonsWithSchedules.push({ lesson, schedule });
      }
    }

    // 1. Try to find an incomplete lesson scheduled for TODAY (current day)
    const todayMatch = incompleteLessonsWithSchedules.find(item => {
      if (!item.schedule) return false;
      return item.schedule.date === todayStr;
    });

    if (todayMatch) {
      nextLesson = todayMatch.lesson;
      isLessonScheduledToday = true;
    }

    // 2. If no class today, try to find a lesson scheduled for a past date/time
    if (!nextLesson) {
      const pastMatch = incompleteLessonsWithSchedules.find(item => {
        if (!item.schedule) return false;

        const schedDate = new Date(item.schedule.date);
        const [sh, sm] = (item.schedule.start_time || "00:00").split(':');
        schedDate.setHours(parseInt(sh), parseInt(sm), 0);

        return now >= schedDate;
      });

      if (pastMatch) {
        nextLesson = pastMatch.lesson;
      }
    }

    // 3. Fallback to first incomplete lesson
    if (!nextLesson) {
      const firstIncomplete = incompleteLessonsWithSchedules[0];
      if (firstIncomplete) {
        nextLesson = firstIncomplete.lesson;
      }
    }
  }

  // 4. Fetch upcoming events/schedules
  let upcomingEvents: any[] = [];
  if (mainEnrollment?.course_id) {
    const normalizedBatch = student?.batch?.trim().toLowerCase();
    const todayISO = new Date().toISOString().split('T')[0];
    const [eventsRes, schedulesRes] = await Promise.all([
      supabase.from("events").select("*").gte("event_date", todayISO).order("event_date", { ascending: true }).limit(5),
      supabase.from("schedules").select("*").eq("course_id", mainEnrollment.course_id).gte("date", todayISO).order("date", { ascending: true }).limit(5)
    ]);

    const events = eventsRes.data || [];
    const schedules = (schedulesRes.data || []).filter(s => {
      const sBatch = s.batch?.trim().toLowerCase();
      const batchMatch = !sBatch || sBatch === "all batches" || !normalizedBatch || 
                         sBatch === normalizedBatch || sBatch.includes(normalizedBatch) || 
                         normalizedBatch.includes(sBatch);
      return batchMatch;
    });

    upcomingEvents = [
      ...events.map(e => ({ ...e, event_date: e.event_date, type: e.type || 'event' })),
      ...schedules.map(s => ({ ...s, event_date: s.date, type: s.type || 'class' }))
    ].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }

  // 5. Fetch recent activities
  const { data: recentProgress } = await supabase
    .from("user_progress")
    .select(`
      completed_at,
      lessons (title)
    `)
    .eq("user_id", userId)
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(3);

  const recentActivities = recentProgress?.map((p: any) => ({
    title: p.lessons?.title || "Lesson Completed",
    completed_at: p.completed_at
  })) || [];

  // 6. Calculate Streak count
  const completedDates = Array.from(new Set(
    progressRecords
      .map(p => p.completed_at ? new Date(p.completed_at).toDateString() : null)
      .filter((d): d is string => d !== null)
  ));

  let streak = 0;
  if (completedDates.length > 0) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const lastCompletedDate = new Date(completedDates[0]);
    if (
      lastCompletedDate.toDateString() === today.toDateString() ||
      lastCompletedDate.toDateString() === yesterday.toDateString()
    ) {
      let currentDate = lastCompletedDate;
      for (const dateStr of completedDates) {
        const date = new Date(dateStr);
        const diffTime = Math.abs(currentDate.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          streak++;
          currentDate = date;
        } else {
          break;
        }
      }
    }
  }

  // 7. Calculate last 7 days of completions (history for SVG chart)
  const now = new Date();
  const past7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    return d;
  });

  const progressHistory = past7Days.map(day => {
    const dayStr = day.toDateString();
    const count = progressRecords.filter(r => 
      r.completed_at && new Date(r.completed_at).toDateString() === dayStr
    ).length || 0;
    return {
      date: day.toISOString(),
      count
    };
  });

  return (
    <DashboardClient
      student={student}
      mainCourse={mainCourse}
      otherCourses={otherCourses}
      stats={{
        completedCount,
        totalLessonsCount,
        progressPercentage,
        remainingCount
      }}
      nextLesson={nextLesson}
      isLessonScheduledToday={isLessonScheduledToday}
      upcomingEvents={upcomingEvents}
      recentActivities={recentActivities}
      notifications={notifications}
      streak={streak}
      progressHistory={progressHistory}
    />
  );
}
