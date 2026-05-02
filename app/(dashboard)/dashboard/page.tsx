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
  ChevronRight
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
      courses(id, title, course_code, thumbnail)
    `)
    .eq("student_id", payload.id);

  const mainEnrollment = enrollments?.[0];
  const course = mainEnrollment?.courses;
  const mainProgress = mainEnrollment?.progress_percentage || 0;

  // 3. Fetch User Progress (Completed Lessons)
  const { data: completedLessons } = await supabase
    .from("user_progress")
    .select("lesson_id")
    .eq("user_id", payload.id) 
    .eq("completed", true);

  const completedIds = completedLessons?.map(p => p.lesson_id) || [];

  // 4. Find Next Lesson
  let nextLesson = null;
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
      
      nextLesson = allLessons.find(l => !completedIds.includes(l.id));
    }
  }

  // 5. Stats
  const totalLessons = 0; // We could fetch this too if needed

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            Welcome back, {student?.name?.split(" ")[0] || "Learner"} 👋
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {course ? `You are learning ${course.title}` : "Welcome to Vision Learn Portal"}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
          <Calendar size={18} className="text-indigo-600" />
          <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Course Card / Progress */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center">
           <div className="relative w-40 h-40 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-50" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                className="stroke-indigo-600 transition-all duration-1000 ease-out"
                strokeWidth="4"
                strokeDasharray={`${mainProgress}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 leading-none">{mainProgress}%</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Overall</span>
            </div>
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1 block">Active Course</span>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {course?.title || "No active course"}
              </h2>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
               <div className="flex items-center gap-2">
                 <CheckCircle2 size={16} className="text-emerald-500" />
                 <span className="text-xs font-bold text-slate-600">{completedIds.length} Lessons Finished</span>
               </div>
               <div className="flex items-center gap-2">
                 <Award size={16} className="text-amber-500" />
                 <span className="text-xs font-bold text-slate-600">VIT-{course?.course_code || "GEN"} Certificate</span>
               </div>
            </div>

            <Link 
              href="/curriculum"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
            >
              Continue Learning <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Profile / Stats */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
           <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl">
                {student?.name?.[0] || "U"}
              </div>
              <div>
                <h3 className="font-black text-slate-900 leading-none">{student?.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{student?.student_id}</p>
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-white border border-slate-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={16} /></div>
                    <span className="text-xs font-bold text-slate-600">Batch Year</span>
                 </div>
                 <span className="text-xs font-black text-slate-900">2026-27</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white border border-slate-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={16} /></div>
                    <span className="text-xs font-bold text-slate-600">Attendance</span>
                 </div>
                 <span className="text-xs font-black text-slate-900">100%</span>
              </div>
           </div>
        </div>

      </div>

      {/* Next Lesson Section */}
      {nextLesson && (
        <section className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">Upcoming Lesson</span>
                <h2 className="text-2xl font-black">{nextLesson.title}</h2>
                <p className="text-indigo-100 text-sm font-medium">Ready for your next topic? Jump back in and keep the momentum going!</p>
              </div>
              <Link 
                href="/curriculum"
                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-indigo-900/20"
              >
                <PlayCircle size={20} /> Start Learning
              </Link>
           </div>
        </section>
      )}

      {/* Quick Links / Announcement Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardLink icon={<BookOpen size={20}/>} title="Materials" href="/materials" color="text-blue-600" bg="bg-blue-50" />
          <DashboardLink icon={<BellRing size={20}/>} title="Notices" href="#" color="text-rose-600" bg="bg-rose-50" />
          <DashboardLink icon={<Calendar size={20}/>} title="Calendar" href="/calendar" color="text-emerald-600" bg="bg-emerald-50" />
          <DashboardLink icon={<Target size={20}/>} title="Assignments" href="/assignments" color="text-amber-600" bg="bg-amber-50" />
      </div>
    </div>
  );
}

function DashboardLink({ icon, title, href, color, bg }: any) {
  return (
    <Link 
      href={href}
      className={`p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center`}
    >
      <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{title}</span>
    </Link>
  );
}

