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

  // 1. Fetch Student Info, Enrollments, Progress Records, Attendance, Test Results, and Modules in parallel
  const [studentRes, enrollmentsRes, progressRes, notificationsRes, attendanceRes, testResultsRes, allModulesRes] = await Promise.all([
    supabase.from("students").select("*").eq("id", userId).single(),
    supabase.from("enrollments").select(`
      id,
      course_id,
      batch,
      progress_percentage,
      courses(id, title, course_code)
    `).eq("student_id", userId),
    supabase.from("user_progress").select("lesson_id, last_watched_at").eq("user_id", userId).eq("completed", true),
    supabase.from("user_notifications").select(`
      id,
      notifications (title, message)
    `).eq("user_id", userId).eq("is_read", false).order("created_at", { ascending: false }).limit(1),
    supabase.from("attendance").select("status, date").eq("student_id", userId),
    supabase.from("test_results").select("id, score, passed, created_at, tests(title)").eq("student_id", userId),
    supabase.from("lms_modules").select(`id, course_id, title, order_index, batches, lessons (id, title, order_index, type, lesson_type, batches)`).order("order_index")
  ]);

  const student = studentRes.data;
  const enrollments = enrollmentsRes.data || [];
  const progressRecords = progressRes.data || [];
  const notifications = notificationsRes.data || [];
  const attendanceRows = attendanceRes.data || [];
  const testResultsRows = testResultsRes.data || [];
  const allFetchedModules = allModulesRes.data || [];

  const completedLessonIds = new Set(progressRecords.map((p: any) => p.lesson_id));

  // Map module lessons per course
  const courseLessonsMap: Record<string, any[]> = {};
  const courseLessonIdsMap: Record<string, string[]> = {};
  allFetchedModules.forEach((m: any) => {
    if (m.course_id) {
      if (!courseLessonsMap[m.course_id]) courseLessonsMap[m.course_id] = [];
      if (!courseLessonIdsMap[m.course_id]) courseLessonIdsMap[m.course_id] = [];
      (m.lessons || []).forEach((l: any) => {
        courseLessonsMap[m.course_id].push(l);
        courseLessonIdsMap[m.course_id].push(l.id);
      });
    }
  });

  // Real enrolled courses list with live calculated progress
  const enrolledCourses = enrollments.map((e: any) => {
    const lessonIds = courseLessonIdsMap[e.course_id] || [];
    const total = lessonIds.length;
    const completed = lessonIds.filter(id => completedLessonIds.has(id)).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : (e.progress_percentage || 0);
    return {
      id: e.courses?.id || e.course_id,
      title: e.courses?.title || "Enrolled Course",
      code: e.courses?.course_code || "",
      totalLessons: total,
      completedLessons: completed,
      progress: Math.min(100, Math.max(0, progress))
    };
  });

  // Compute real attendance metrics
  const totalAttendance = attendanceRows.length;
  const presentAttendance = attendanceRows.filter((r: any) => {
    const s = (r.status || "").toLowerCase();
    return s === "present" || s === "late";
  }).length;
  const attendancePercentage = totalAttendance > 0
    ? Math.round((presentAttendance / totalAttendance) * 100)
    : 0;

  // Compute real certificates count (courses >= 100% or tests passed >= 70%)
  const completedCourseCertificates = enrolledCourses.filter((c: any) => c.progress >= 100).length;
  const passedTestsCertificates = testResultsRows.filter((r: any) => (r.score || 0) >= 70 || r.passed).length;
  const certificatesCount = completedCourseCertificates + passedTestsCertificates;

  const mainEnrollment = enrollments[0];
  const mainCourse = mainEnrollment?.courses;
  const otherCourses = enrollments.slice(1);

  // 2. Fetch all lessons and other data inside active course
  let allLessons: any[] = [];
  let classLessons: any[] = [];
  let quizLessons: any[] = [];
  let assignmentLessons: any[] = [];
  let projectLessons: any[] = [];
  let completedClasses: any[] = [];
  let completedQuizzes: any[] = [];
  let completedAssignments: any[] = [];
  let completedProjects: any[] = [];
  let totalProjectsCount = 0;
  let completedProjectsCount = 0;
  let completedCount = 0;
  let totalLessonsCount = 0;
  let progressPercentage = 0;
  let remainingCount = 0;
  let recentAssignments: any[] = [];

  // 3. Find next available lesson (scheduled/unscheduled)
  let nextLesson: any = null;
  let isLessonScheduledToday = false;
  let nextScheduledClass: { lesson: any; schedule: any } | null = null;
  let isNextLessonLocked = false;
  let batchTiming: string | null = null;

  if (mainEnrollment?.course_id) {
    const activeBatch = (student?.batch || mainEnrollment?.batch)?.trim().toLowerCase();
    let activeBatchId: string | null = null;
    const courseIds = enrollments.map(e => e.course_id).filter(Boolean);
    const [schedulesRes, batchesRes, assignmentsRes, submissionsRes] = await Promise.all([
      supabase.from("schedules").select("title, batch, type, date, start_time").eq("course_id", mainEnrollment.course_id),
      supabase.from("batches").select("id, title, timing").eq("course_id", mainEnrollment.course_id),
      supabase.from("assignments").select("*, assignment_courses!inner(course_id)").in("assignment_courses.course_id", courseIds).eq("is_published", true),
      supabase.from("submissions").select("assignment_id, status").eq("student_id", userId).eq("status", "submitted")
    ]);

    const modules = allFetchedModules.filter((m: any) => m.course_id === mainEnrollment.course_id);
    const schedules = schedulesRes.data || [];
    const batches = batchesRes.data || [];
    const rawAssignments = assignmentsRes.data || [];
    const rawSubmissions = submissionsRes.data || [];

    const mainCourseLessons = courseLessonsMap[mainEnrollment.course_id] || [];

    const getFormatType = (l: any) => {
      return (l.lesson_type || l.type || 'video').toLowerCase();
    };

    classLessons = mainCourseLessons.filter(l => {
      const t = getFormatType(l);
      return t === 'video' || t === 'notes' || t === 'article' || t === 'document';
    });
    quizLessons = mainCourseLessons.filter(l => getFormatType(l) === 'mcq' || getFormatType(l) === 'quiz');
    assignmentLessons = mainCourseLessons.filter(l => getFormatType(l) === 'assignment');
    projectLessons = mainCourseLessons.filter(l => getFormatType(l) === 'project');

    completedClasses = classLessons.filter(l => completedLessonIds.has(l.id));
    completedQuizzes = quizLessons.filter(l => completedLessonIds.has(l.id));
    completedAssignments = assignmentLessons.filter(l => completedLessonIds.has(l.id));
    completedProjects = projectLessons.filter(l => completedLessonIds.has(l.id));

    // Dynamic, verified progress calculation for active course
    const activeCourseLessonList = classLessons.length > 0 ? classLessons : mainCourseLessons;
    const activeCompletedList = classLessons.length > 0 ? completedClasses : mainCourseLessons.filter(l => completedLessonIds.has(l.id));

    completedCount = activeCompletedList.length;
    totalLessonsCount = activeCourseLessonList.length;
    progressPercentage = totalLessonsCount > 0
      ? Math.round((completedCount / totalLessonsCount) * 100)
      : 0;
    remainingCount = Math.max(0, totalLessonsCount - completedCount);
    if (activeBatch) {
      const match = batches.find((b: any) => {
        const title = b.title?.trim().toLowerCase();
        return title && (title.includes(activeBatch) || activeBatch.includes(title));
      });
      if (match) {
        batchTiming = match.timing;
        activeBatchId = match.id;
      }
    }

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const isScheduleTypeMatch = (s: any, l: any) => {
      const sType = (s.type || 'class').toLowerCase();
      const lType = (l.lesson_type || l.type || 'video').toLowerCase();
      if (lType === 'mcq') return sType === 'quiz';
      if (lType === 'assignment') return sType === 'assignment';
      if (lType === 'project') return sType === 'project';
      return sType === 'class' || sType === 'lecture' || sType === 'event';
    };
    const normalizedActiveBatch = activeBatch?.trim().toLowerCase();

    // Calculate traditional project counts from assignments table
    const filteredTraditionalAssignments = (rawAssignments || []).filter((a: any) => {
      if (a.batches && a.batches.length > 0) {
        const activeBatchLower = activeBatch ? activeBatch.toLowerCase() : "";
        return a.batches.some((b: string) => {
          const bLower = b.trim().toLowerCase();
          return bLower === activeBatchLower || bLower === "all" || bLower === "all batches";
        });
      }
      if (a.batch && a.batch !== "All Batches" && a.batch.trim().toLowerCase() !== "all") {
        const enrollmentForCourse = enrollments.find(e => e.course_id === a.course_id);
        return enrollmentForCourse && enrollmentForCourse.batch === a.batch;
      }
      return false;
    });

    totalProjectsCount = filteredTraditionalAssignments.length;
    const submittedTraditionalIds = (rawSubmissions || []).map((s: any) => s.assignment_id);
    completedProjectsCount = filteredTraditionalAssignments.filter((a: any) => submittedTraditionalIds.includes(a.id)).length;

    recentAssignments = filteredTraditionalAssignments.slice(0, 4).map((a: any) => {
      const isSubmitted = submittedTraditionalIds.includes(a.id);
      return {
        id: a.id,
        title: a.title,
        module: a.assignment_courses?.[0]?.courses?.title || "Assignment",
        status: isSubmitted ? "submitted" : "pending",
        dueDate: a.due_date || a.end_date || a.deadline || null
      };
    });

    const now = new Date();

    // Get local today string in YYYY-MM-DD format
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const filteredModules = modules.map((module: any) => {
      const isModuleAssigned = !module.batches || module.batches.length === 0 || (activeBatchId && module.batches.includes(activeBatchId));
      if (!isModuleAssigned) return null;

      const visibleLessons = (module.lessons || []).filter((l: any) => {
        const isLessonAssignedByBatch = !l.batches || l.batches.length === 0 || (activeBatchId && l.batches.includes(activeBatchId));
        if (!isLessonAssignedByBatch) return false;

        const lTitle = normalize(l.title || '');
        const lessonSchedules = schedules.filter((s: any) => {
          const sTitle = s.title || '';
          const parts = sTitle.split(':');
          const lessonPart = parts[parts.length - 1].trim();
          return normalize(lessonPart) === lTitle && isScheduleTypeMatch(s, l);
        });

        return lessonSchedules.some((s: any) => {
          const sBatch = s.batch?.trim().toLowerCase();
          return !sBatch || sBatch === "all batches" || sBatch === "all" || !normalizedActiveBatch || sBatch === normalizedActiveBatch;
        });
      });

      return {
        ...module,
        lessons: visibleLessons
      };
    }).filter(Boolean);

    const allModulesWithLessons = filteredModules.sort((a: any, b: any) => a.order_index - b.order_index);
    const incompleteLessonsWithSchedules: { lesson: any; schedule: any }[] = [];

    for (const module of allModulesWithLessons) {
      const lessons = (module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index);
      for (const lesson of lessons) {
        if (completedLessonIds.has(lesson.id)) continue;

        const mTitle = normalize(module.title);
        const lTitle = normalize(lesson.title);

        const schedule = schedules.find(s => {
          const sTitle = s.title?.trim();
          if (!sTitle) return false;

          const sBatch = s.batch?.trim().toLowerCase();
          const cleanActive = activeBatch?.trim().toLowerCase();
          const batchMatch = !sBatch || sBatch === "all batches" || sBatch === "all" || !cleanActive || sBatch === cleanActive;
          if (!batchMatch) return false;

          const parts = sTitle.split(':');
          const lessonPart = parts[parts.length - 1].trim();
          return normalize(lessonPart) === lTitle && isScheduleTypeMatch(s, lesson);
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

      // Find the next upcoming class: any incomplete lesson with a schedule date AFTER today
      // Sort all candidates by date to pick the earliest upcoming one
      const futureCandidates = incompleteLessonsWithSchedules
        .filter(item => item.schedule && item.schedule.date > todayStr)
        .sort((a, b) => {
          const dateA = a.schedule.date + (a.schedule.start_time || "00:00");
          const dateB = b.schedule.date + (b.schedule.start_time || "00:00");
          return dateA.localeCompare(dateB);
        });

      if (futureCandidates.length > 0) {
        nextScheduledClass = futureCandidates[0];
      }
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

    // Determine lock status for nextLesson
    if (nextLesson) {
      const match = incompleteLessonsWithSchedules.find(item => item.lesson.id === nextLesson.id);
      if (match) {
        const { schedule } = match;
        if (schedule) {
          const schedDate = new Date(schedule.date);
          const [sh, sm] = (schedule.start_time || "00:00").split(':');
          schedDate.setHours(parseInt(sh), parseInt(sm), 0);
          isNextLessonLocked = now < schedDate;
        } else {
          isNextLessonLocked = true; // No schedule = locked
        }
      } else {
        isNextLessonLocked = true; // No schedule info = locked
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
      const batchMatch = !sBatch || sBatch === "all batches" || sBatch === "all" || !normalizedBatch || sBatch === normalizedBatch;
      return batchMatch;
    });

    const courseIds = enrollments.map(e => e.course_id);
    const filteredEvents = events.filter(e => !e.course_id || courseIds.includes(e.course_id));

    upcomingEvents = [
      ...filteredEvents.map(e => ({ ...e, event_date: e.event_date, type: e.type || 'event' })),
      ...schedules.map(s => ({ ...s, event_date: s.date, type: s.type || 'class' }))
    ].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }

  // 5. Fetch recent activities
  const { data: recentProgress } = await supabase
    .from("user_progress")
    .select(`
      last_watched_at,
      lessons (title)
    `)
    .eq("user_id", userId)
    .eq("completed", true)
    .order("last_watched_at", { ascending: false })
    .limit(3);

  const recentActivities = recentProgress?.map((p: any) => ({
    title: p.lessons?.title || "Lesson Completed",
    completed_at: p.last_watched_at
  })) || [];

  // 6. Calculate Streak count
  const completedDates = Array.from(new Set(
    progressRecords
      .map(p => p.last_watched_at ? new Date(p.last_watched_at).toDateString() : null)
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
      r.last_watched_at && new Date(r.last_watched_at).toDateString() === dayStr
    ).length || 0;
    return {
      date: day.toISOString(),
      count
    };
  });

  // Fetch daily activity records from Supabase
  const { data: activityRecords } = await supabase
    .from("student_daily_activity")
    .select("date, active_seconds")
    .eq("student_id", userId);

  return (
    <DashboardClient
      student={student ? { ...student, batchTiming } : null}
      mainCourse={mainCourse}
      otherCourses={otherCourses}
      enrolledCourses={enrolledCourses}
      recentAssignments={recentAssignments}
      attendanceStats={{
        total: totalAttendance,
        present: presentAttendance,
        percentage: attendancePercentage
      }}
      certificatesCount={certificatesCount}
      stats={{
        completedCount,
        totalLessonsCount,
        progressPercentage,
        remainingCount,
        completedClasses: completedClasses.length,
        totalClasses: classLessons.length,
        completedQuizzes: completedQuizzes.length,
        totalQuizzes: quizLessons.length,
        completedAssignments: completedAssignments.length,
        totalAssignments: assignmentLessons.length,
        completedProjects: completedProjectsCount,
        totalProjects: totalProjectsCount,
      }}
      nextLesson={nextLesson}
      isLessonScheduledToday={isLessonScheduledToday}
      isNextLessonLocked={isNextLessonLocked}
      nextScheduledClass={nextScheduledClass}
      upcomingEvents={upcomingEvents}
      recentActivities={recentActivities}
      notifications={notifications}
      streak={streak}
      progressHistory={progressHistory}
      activityHistory={activityRecords || []}
    />
  );
}
