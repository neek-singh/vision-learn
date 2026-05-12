import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { 
  BookOpen, 
  Award, 
  Calendar, 
  PlayCircle, 
  ArrowRight, 
  TrendingUp,
  CheckCircle2,
  Flame,
  Users,
  GraduationCap,
  ChevronRight
} from "lucide-react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import { 
  HeaderSkeleton, 
  StatsSkeleton, 
  CourseCardSkeleton, 
  ProfileSkeleton, 
  NextLessonSkeleton
} from "@/components/dashboard/DashboardSkeletons";
import { StatCard, QuickLinks, UpcomingEvents, RecentActivity, NoticeBoard, StreakWidget } from "@/components/dashboard/DashboardComponents";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader userId={payload.id} />
      </Suspense>

      <Suspense fallback={null}>
        <NoticeBoardSection userId={payload.id} />
      </Suspense>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats userId={payload.id} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Suspense fallback={<CourseCardSkeleton />}>
          <ActiveCourseSection userId={payload.id} />
        </Suspense>

        <Suspense fallback={<ProfileSkeleton />}>
          <div className="space-y-6">
            <ProfileSection userId={payload.id} />
            <Suspense fallback={<div className="h-28 bg-white rounded-2xl animate-pulse" />}>
              <StreakSection userId={payload.id} />
            </Suspense>
          </div>
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Suspense fallback={<div className="lg:col-span-2 h-48 bg-white rounded-2xl animate-pulse" />}>
          <UpcomingEventsSection userId={payload.id} />
        </Suspense>
        
        <Suspense fallback={<div className="h-48 bg-white rounded-2xl animate-pulse" />}>
          <RecentActivitySection userId={payload.id} />
        </Suspense>
      </div>

      <Suspense fallback={<div />}>
        <OtherCoursesSection userId={payload.id} />
      </Suspense>

      <Suspense fallback={<NextLessonSkeleton />}>
        <NextLessonBanner userId={payload.id} />
      </Suspense>

      <QuickLinks />
    </div>
  );
}

async function DashboardHeader({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();
  const { data: student } = await supabase
    .from("students")
    .select("name, batch")
    .eq("id", userId)
    .single();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("courses(title)")
    .eq("student_id", userId)
    .limit(1)
    .single();

  const courseTitle = (enrollment?.courses as any)?.title;

  // Determine greeting based on current time (IST)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hour = istTime.getUTCHours();
  
  let greeting = "Welcome back";
  if (hour >= 5 && hour < 12) greeting = "Good morning";
  else if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17 && hour < 21) greeting = "Good evening";

  return (
    <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          {greeting}, {student?.name?.split(" ")[0] || "Learner"}
        </h1>
        <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
          {courseTitle ? `You are learning ${courseTitle}` : "Welcome to Vision Learn Portal"}
          {student?.batch && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-100 text-[10px] font-black uppercase tracking-wider shadow-sm">
              <Users size={10} /> {student.batch}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
        <Calendar size={16} className="text-indigo-600" />
        <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </span>
      </div>
    </section>
  );
}

async function DashboardStats({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();
  
  // Fetch all stats data in parallel
  const [enrollmentsRes, completedRes] = await Promise.all([
    supabase.from("enrollments").select("course_id, progress_percentage").eq("student_id", userId),
    supabase.from("user_progress").select("lesson_id").eq("user_id", userId).eq("completed", true)
  ]);

  const enrollments = enrollmentsRes.data || [];
  const completedIds = completedRes.data || [];
  const mainEnrollment = enrollments[0];
  const progress = mainEnrollment?.progress_percentage || 0;

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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard 
        icon={<CheckCircle2 size={18} />} 
        label="Completed" 
        value={`${completedIds.length}`} 
        sub="lessons"
        color="emerald" 
      />
      <StatCard 
        icon={<BookOpen size={18} />} 
        label="Total" 
        value={`${totalLessonsCount}`} 
        sub="lessons"
        color="blue" 
      />
      <StatCard 
        icon={<TrendingUp size={18} />} 
        label="Progress" 
        value={`${progress}%`} 
        sub="done"
        color="indigo" 
      />
      <StatCard 
        icon={<Flame size={18} />} 
        label="Remaining" 
        value={`${Math.max(0, totalLessonsCount - completedIds.length)}`} 
        sub="to go"
        color="amber" 
      />
    </div>
  );
}

async function ActiveCourseSection({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();
  
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      course_id,
      progress_percentage,
      courses(id, title, course_code)
    `)
    .eq("student_id", userId)
    .limit(1);

  const mainEnrollment = enrollments?.[0];
  if (!mainEnrollment) return null;

  const course = mainEnrollment.courses as any;
  const progress = mainEnrollment.progress_percentage || 0;

  // Fetch lessons count
  const { data: modules } = await supabase
    .from("lms_modules")
    .select("lessons(id)")
    .eq("course_id", course.id);
  
  const totalLessonsCount = modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

  const { count: completedCount } = await supabase
    .from("user_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("completed", true);

  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative w-28 h-28 md:w-36 md:h-36 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-slate-100" strokeWidth="3" />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <circle
              cx="18" cy="18" r="15.5" fill="none"
              stroke="url(#progressGradient)"
              className="transition-all duration-1000 ease-out"
              strokeWidth="3"
              strokeDasharray={`${progress}, 100`}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl md:text-3xl font-black text-slate-900 leading-none tabular-nums">{progress}%</span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Complete</span>
          </div>
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1 block">Active Course</span>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {course?.title || "No active course"}
            </h2>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-[2px] relative">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out relative z-10" 
                style={{ width: `${progress}%`, boxShadow: '0 0 12px rgba(99, 102, 241, 0.35)' }} 
              />
              <div className="absolute inset-y-0 left-0 w-full animate-shimmer pointer-events-none opacity-20 bg-gradient-to-r from-transparent via-white to-transparent" style={{ backgroundSize: '200% 100%' }} />
            </div>
            <div className="flex justify-between items-center px-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{completedCount || 0} / {totalLessonsCount} Lessons</span>
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest">{Math.max(0, totalLessonsCount - (completedCount || 0))} Left</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
             <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
               <CheckCircle2 size={12} className="text-emerald-500" />
               <span className="text-[10px] font-bold text-emerald-700">{completedCount || 0} Done</span>
             </div>
             <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
               <Award size={12} className="text-amber-500" />
               <span className="text-[10px] font-bold text-amber-700">VIT-{course?.course_code || "GEN"}</span>
             </div>
          </div>

          <Link 
            href="/curriculum"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            Continue Learning <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

async function ProfileSection({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("courses(course_code)")
    .eq("student_id", userId)
    .limit(1)
    .single();

  const courseCode = (enrollment?.courses as any)?.course_code;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
       <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-200">
            {student?.name?.[0] || "U"}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm leading-none">{student?.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{student?.student_id}</p>
          </div>
       </div>

       <div className="space-y-2">
          <ProfileItem icon={<Calendar size={14} />} label="Joined" value={student?.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'} iconBg="bg-blue-50 text-blue-600" />
          <ProfileItem icon={<CheckCircle2 size={14} />} label="Status" value="Active" iconBg="bg-emerald-50 text-emerald-600" isBadge badgeColor="emerald" />
          <ProfileItem icon={<GraduationCap size={14} />} label="Course" value={courseCode || "GEN"} iconBg="bg-purple-50 text-purple-600" isBadge badgeColor="purple" />
          <ProfileItem icon={<Users size={14} />} label="Batch" value={student?.batch || "Not Assigned"} iconBg="bg-amber-50 text-amber-600" isBadge badgeColor="amber" />
       </div>
    </div>
  );
}

function ProfileItem({ icon, label, value, iconBg, isBadge, badgeColor }: any) {
  return (
    <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 ${iconBg} rounded-lg`}>{icon}</div>
        <span className="text-xs font-bold text-slate-600">{label}</span>
      </div>
      {isBadge ? (
        <span className={`text-[10px] font-black text-${badgeColor}-600 bg-${badgeColor}-50 px-2 py-0.5 rounded border border-${badgeColor}-100 uppercase tracking-widest truncate max-w-[90px]`}>
          {value}
        </span>
      ) : (
        <span className="text-xs font-black text-slate-900 tabular-nums">{value}</span>
      )}
    </div>
  );
}

async function OtherCoursesSection({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      course_id,
      progress_percentage,
      courses(title)
    `)
    .eq("student_id", userId);

  if (!enrollments || enrollments.length <= 1) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <BookOpen size={20} className="text-indigo-600" />
          My Other Courses
        </h3>
        <Link href="/courses" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
          View All
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enrollments.slice(1).map((enroll: any) => (
          <div key={enroll.id} className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                <BookOpen size={20} />
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">Active</span>
            </div>
            
            <h4 className="text-base font-black text-slate-900 leading-tight mb-3 line-clamp-1">
              {enroll.courses?.title}
            </h4>
            
            <div className="space-y-1.5 mb-4">
              <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100 p-[1px] relative">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 h-full rounded-full transition-all duration-1000 relative z-10" 
                  style={{ width: `${enroll.progress_percentage}%`, boxShadow: '0 0 8px rgba(99, 102, 241, 0.3)' }}
                />
                <div className="absolute inset-y-0 left-0 w-full animate-shimmer pointer-events-none opacity-20 bg-gradient-to-r from-transparent via-white to-transparent" style={{ backgroundSize: '200% 100%' }} />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{enroll.progress_percentage}% Complete</span>
            </div>
            
            <Link 
              href={`/curriculum?course=${enroll.course_id}`}
              className="w-full py-2.5 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-100 hover:border-indigo-600"
            >
              Continue Learning <ChevronRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

async function NextLessonBanner({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();
  
  // 1. Fetch main enrollment and student batch
  const [enrollmentRes, studentRes] = await Promise.all([
    supabase.from("enrollments").select("course_id, batch").eq("student_id", userId).limit(1).single(),
    supabase.from("students").select("batch").eq("id", userId).single()
  ]);
  
  const enrollment = enrollmentRes.data;
  const student = studentRes.data;

  if (!enrollment) return null;

  const activeBatch = (student?.batch || enrollment?.batch)?.trim().toLowerCase();

  // 2. Fetch progress, modules, and schedules in parallel
  const [progressRes, modulesRes, schedulesRes] = await Promise.all([
    supabase.from("user_progress").select("lesson_id").eq("user_id", userId).eq("completed", true),
    supabase.from("lms_modules").select(`id, title, order_index, lessons (id, title, order_index, type)`).eq("course_id", enrollment.course_id).order("order_index"),
    supabase.from("schedules").select("title, batch, type, date, start_time").eq("course_id", enrollment.course_id)
  ]);

  const completedIds = progressRes.data?.map(p => p.lesson_id) || [];
  const modules = modulesRes.data || [];
  const schedules = schedulesRes.data || [];
  const now = new Date();

  // 3. Find next AVAILABLE lesson
  let nextLesson = null;
  
  // Flatten modules to lessons
  const allModulesWithLessons = modules.sort((a: any, b: any) => a.order_index - b.order_index);
  
  for (const module of allModulesWithLessons) {
    const lessons = (module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index);
    for (const lesson of lessons) {
      if (completedIds.includes(lesson.id)) continue;

      // Check if lesson is unlocked by schedule
      const fullLessonTitle = `${module.title}: ${lesson.title}`.trim();
      const schedule = schedules.find(s => {
        const sTitle = s.title?.trim();
        const sBatch = s.batch?.trim().toLowerCase();
        const batchMatch = !sBatch || sBatch === "all batches" || !activeBatch || 
                           sBatch === activeBatch || sBatch.includes(activeBatch) || 
                           activeBatch.includes(sBatch);
        return sTitle === fullLessonTitle && batchMatch;
      });

      if (schedule) {
        const schedDate = new Date(schedule.date);
        const [sh, sm] = (schedule.start_time || "00:00").split(':');
        schedDate.setHours(parseInt(sh), parseInt(sm), 0);
        
        if (now >= schedDate) {
          nextLesson = lesson;
          break;
        }
      }
    }
    if (nextLesson) break;
  }

  // 4. Fallback: Find first incomplete lesson if no scheduled lesson found
  if (!nextLesson) {
    for (const module of allModulesWithLessons) {
      const lessons = (module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index);
      const firstIncomplete = lessons.find(l => !completedIds.includes(l.id));
      if (firstIncomplete) {
        nextLesson = firstIncomplete;
        break;
      }
    }
  }

  if (!nextLesson) return null;

  return (
    <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
       <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
       <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mb-20 blur-2xl" />
       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <PlayCircle size={22} />
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 bg-white/20 rounded-md text-[9px] font-black uppercase tracking-widest">Up Next</span>
              <h2 className="text-lg font-black leading-tight">{nextLesson.title}</h2>
              <p className="text-indigo-200 text-xs font-medium">Continue your learning journey!</p>
            </div>
          </div>
          <Link 
            href={`/curriculum?lessonId=${nextLesson.id}`}
            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-indigo-900/20 active:scale-95 shrink-0"
          >
            <PlayCircle size={18} /> Start Now
          </Link>
       </div>
    </section>
  );
}
async function UpcomingEventsSection({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();
  
  // 1. Get student batch
  const { data: student } = await supabase.from("students").select("batch").eq("id", userId).single();
  const { data: enrollment } = await supabase.from("enrollments").select("course_id").eq("student_id", userId).limit(1).single();
  
  if (!enrollment) return null;

  const normalizedBatch = student?.batch?.trim().toLowerCase();

  // 2. Fetch events and schedules
  const [eventsRes, schedulesRes] = await Promise.all([
    supabase.from("events").select("*").gte("event_date", new Date().toISOString().split('T')[0]).order("event_date", { ascending: true }).limit(5),
    supabase.from("schedules").select("*").eq("course_id", enrollment.course_id).gte("date", new Date().toISOString().split('T')[0]).order("date", { ascending: true }).limit(5)
  ]);

  const events = eventsRes.data || [];
  const schedules = (schedulesRes.data || []).filter(s => {
    const sBatch = s.batch?.trim().toLowerCase();
    const batchMatch = !sBatch || sBatch === "all batches" || !normalizedBatch || 
                       sBatch === normalizedBatch || sBatch.includes(normalizedBatch) || 
                       normalizedBatch.includes(sBatch);
    return batchMatch;
  });

  const combinedEvents = [
    ...events.map(e => ({ ...e, event_date: e.event_date, type: e.type || 'event' })),
    ...schedules.map(s => ({ ...s, event_date: s.date, type: s.type || 'class' }))
  ].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  return (
    <div className="lg:col-span-2">
      <UpcomingEvents events={combinedEvents} />
    </div>
  );
}

async function RecentActivitySection({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();
  
  const { data: progress } = await supabase
    .from("user_progress")
    .select(`
      completed_at,
      lessons (title)
    `)
    .eq("user_id", userId)
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(3);

  const activities = progress?.map((p: any) => ({
    title: p.lessons?.title || "Lesson Completed",
    completed_at: p.completed_at
  })) || [];

  return <RecentActivity activities={activities} />;
}
async function NoticeBoardSection({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();
  
  const { data: notifications } = await supabase
    .from("user_notifications")
    .select(`
      id,
      notifications (title, message)
    `)
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(1);

  return <NoticeBoard notifications={notifications || []} />;
}

async function StreakSection({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();
  
  const { data: progress } = await supabase
    .from("user_progress")
    .select("completed_at")
    .eq("user_id", userId)
    .eq("completed", true)
    .order("completed_at", { ascending: false });

  if (!progress || progress.length === 0) return <StreakWidget streak={0} />;

  // Calculate streak
  const completedDates = Array.from(new Set(progress.map(p => new Date(p.completed_at!).toDateString())));
  let streak = 0;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const lastCompletedDate = new Date(completedDates[0]);
  
  // If last completion was not today or yesterday, streak is 0
  if (lastCompletedDate.toDateString() !== today.toDateString() && 
      lastCompletedDate.toDateString() !== yesterday.toDateString()) {
    return <StreakWidget streak={0} />;
  }

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

  return <StreakWidget streak={streak} />;
}
