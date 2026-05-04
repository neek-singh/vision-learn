import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, 
  Award, 
  Calendar, 
  Clock, 
  PlayCircle, 
  ArrowRight, 
  BellRing, 
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Zap,
  Target,
  ChevronRight,
  Flame,
  GraduationCap
} from "lucide-react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // 1. Fetch Student Profile
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", payload.id)
    .single();

  // 2. Fetch Enrollments & Courses
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      course_id,
      progress_percentage,
      courses(id, title, course_code, image_url)
    `)
    .eq("student_id", payload.id);

  const mainEnrollment = enrollments?.[0];
  const course = mainEnrollment?.courses as any;
  const mainProgress = mainEnrollment?.progress_percentage || 0;

  // 3. Fetch User Progress (Completed Lessons)
  const { data: completedLessons } = await supabase
    .from("user_progress")
    .select("lesson_id")
    .eq("user_id", payload.id) 
    .eq("completed", true);

  const completedIds = completedLessons?.map(p => p.lesson_id) || [];

  // 4. Find Next Lesson & Total Lessons
  let nextLesson = null;
  let totalLessonsCount = 0;
  if (course) {
    const { data: modules } = await supabase
      .from("lms_modules")
      .select(`
        id,
        order_index,
        lessons (id, title, order_index, type)
      `)
      .eq("course_id", course.id)
      .order("order_index");

    if (modules) {
      // Flatten all lessons in order
      const allLessons = modules.flatMap(m => 
        (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
      );
      
      totalLessonsCount = allLessons.length;
      nextLesson = allLessons.find(l => !completedIds.includes(l.id));
    }
  }

  // Determine greeting based on current time
  const hour = new Date().getHours();
  let greeting = "Welcome back";
  if (hour >= 5 && hour < 12) greeting = "Good morning";
  else if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17 && hour < 21) greeting = "Good evening";
  else greeting = "Welcome back";

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            {greeting}, {student?.name?.split(" ")[0] || "Learner"} 👋
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {course ? `You are learning ${course.title}` : "Welcome to Vision Learn Portal"}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
          <Calendar size={16} className="text-indigo-600" />
          <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </span>
        </div>
      </section>

      {/* Stats Row */}
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
          value={`${mainProgress}%`} 
          sub="done"
          color="indigo" 
        />
        <StatCard 
          icon={<Flame size={18} />} 
          label="Remaining" 
          value={`${totalLessonsCount - completedIds.length}`} 
          sub="to go"
          color="amber" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Course Card / Progress */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Circular Progress */}
            <div className="relative w-36 h-36 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-slate-100" strokeWidth="3" />
                {/* Gradient Progress Arc */}
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
                  strokeDasharray={`${mainProgress}, 100`}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 leading-none tabular-nums">{mainProgress}%</span>
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
              
              {/* Mini progress bar */}
              <div className="space-y-2">
                <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-[2px] relative">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out relative z-10" 
                    style={{ width: `${mainProgress}%`, boxShadow: '0 0 12px rgba(99, 102, 241, 0.35)' }} 
                  />
                  <div className="absolute inset-y-0 left-0 w-full animate-shimmer pointer-events-none opacity-20 bg-gradient-to-r from-transparent via-white to-transparent" style={{ backgroundSize: '200% 100%' }} />
                </div>
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{completedIds.length} / {totalLessonsCount} Lessons</span>
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest">{totalLessonsCount - completedIds.length} Left</span>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                 <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                   <CheckCircle2 size={12} className="text-emerald-500" />
                   <span className="text-[10px] font-bold text-emerald-700">{completedIds.length} Done</span>
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

        {/* Profile / Stats */}
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
              <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                 <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={14} /></div>
                    <span className="text-xs font-bold text-slate-600">Joined</span>
                 </div>
                 <span className="text-xs font-black text-slate-900 tabular-nums">
                    {student?.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
                 </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                 <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={14} /></div>
                    <span className="text-xs font-bold text-slate-600">Status</span>
                 </div>
                 <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">Active</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                 <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><GraduationCap size={14} /></div>
                    <span className="text-xs font-bold text-slate-600">Course</span>
                 </div>
                 <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase tracking-widest truncate max-w-[90px]">{course?.course_code || "GEN"}</span>
              </div>
           </div>
        </div>

      </div>

      {/* Other Courses Section */}
      {enrollments && enrollments.length > 1 && (
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
                
                {/* Enhanced progress bar */}
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
      )}

      {/* Next Lesson Section */}
      {nextLesson && (
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
                href="/curriculum"
                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-indigo-900/20 active:scale-95 shrink-0"
              >
                <PlayCircle size={18} /> Start Now
              </Link>
           </div>
        </section>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DashboardLink icon={<BookOpen size={18}/>} title="Materials" href="/materials" color="text-blue-600" bg="bg-blue-50" borderColor="border-blue-100" />
          <DashboardLink icon={<BellRing size={18}/>} title="Notices" href="#" color="text-rose-600" bg="bg-rose-50" borderColor="border-rose-100" />
          <DashboardLink icon={<Calendar size={18}/>} title="Calendar" href="/calendar" color="text-emerald-600" bg="bg-emerald-50" borderColor="border-emerald-100" />
          <DashboardLink icon={<Target size={18}/>} title="Tasks" href="/assignments" color="text-amber-600" bg="bg-amber-50" borderColor="border-amber-100" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    emerald: { bg: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-100", iconBg: "bg-emerald-100 text-emerald-600" },
    blue: { bg: "bg-blue-50/50", text: "text-blue-700", border: "border-blue-100", iconBg: "bg-blue-100 text-blue-600" },
    indigo: { bg: "bg-indigo-50/50", text: "text-indigo-700", border: "border-indigo-100", iconBg: "bg-indigo-100 text-indigo-600" },
    amber: { bg: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100", iconBg: "bg-amber-100 text-amber-600" },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className={`${c.bg} p-4 rounded-xl border ${c.border} flex items-center gap-3 group hover:shadow-sm transition-all`}>
      <div className={`w-9 h-9 ${c.iconBg} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black text-slate-900 leading-none tabular-nums">{value} <span className={`text-xs font-bold ${c.text} opacity-70`}>{sub}</span></p>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function DashboardLink({ icon, title, href, color, bg, borderColor }: any) {
  return (
    <Link 
      href={href}
      className={`p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:${borderColor} transition-all group flex items-center gap-3 active:scale-95`}
    >
      <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
        {icon}
      </div>
      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{title}</span>
    </Link>
  );
}
