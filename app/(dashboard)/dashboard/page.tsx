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
  Target
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

  // Fetch Student Profile
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("student_id", payload.id)
    .single();

  // Fetch Enrollments with Course Data
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      progress_percentage,
      courses(title, course_code)
    `)
    .eq("student_id", payload.id);

  const mainProgress = enrollments?.[0]?.progress_percentage || 0;

  // Mock Weekly Data for Chart
  const weeklyActivity = [
    { day: "Mon", hours: 2, height: "40%" },
    { day: "Tue", hours: 4, height: "80%" },
    { day: "Wed", hours: 3, height: "60%" },
    { day: "Thu", hours: 5, height: "100%" },
    { day: "Fri", hours: 2, height: "40%" },
    { day: "Sat", hours: 1, height: "20%" },
    { day: "Sun", hours: 0, height: "5%" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header with Quick Stats */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            Welcome back, {student?.name?.split(" ")[0] || "Learner"} 👋
          </h1>
          <p className="text-sm text-slate-500 font-medium">You've completed <span className="text-indigo-600 font-bold">{mainProgress}%</span> of your current module.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
          <Zap size={18} className="text-indigo-600 fill-indigo-600" />
          <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">4 Day Streak!</span>
        </div>
      </section>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                <BarChart3 size={18} />
              </div>
              <h2 className="text-base font-black text-slate-900">Weekly Activity</h2>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <TrendingUp size={10} /> +12% this week
            </div>
          </div>

          <div className="flex items-end justify-between h-40 gap-2 px-2">
            {weeklyActivity.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="relative w-full flex justify-center">
                   {/* Tooltip on Hover */}
                   <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                     {data.hours} hrs
                   </div>
                   <div 
                    className="w-full max-w-[32px] bg-slate-100 group-hover:bg-indigo-600 rounded-lg transition-all duration-500 ease-out cursor-pointer relative overflow-hidden"
                    style={{ height: data.height }}
                   >
                     <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100" />
                   </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{data.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Goal Doughnut (SVG) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <h2 className="text-base font-black text-slate-900 mb-6 w-full text-left flex items-center gap-2">
            <Target size={18} className="text-indigo-600" /> Course Progress
          </h2>
          
          <div className="relative w-36 h-36 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-slate-100"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-indigo-600 transition-all duration-1000 ease-out"
                strokeWidth="3.5"
                strokeDasharray={`${mainProgress}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 leading-none">{mainProgress}%</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Complete</span>
            </div>
          </div>
          
          <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-[180px]">
            Keep it up! You're only <span className="text-indigo-600">{100 - mainProgress}%</span> away from your certificate.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning & Skills */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Skill Mastery Progress Bars */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
              <Award size={18} className="text-indigo-600" /> Skill Mastery
            </h2>
            <div className="space-y-5">
              {[
                { name: "HTML5 Structure", progress: 95, color: "bg-orange-500" },
                { name: "CSS3 & Flexbox", progress: 70, color: "bg-blue-500" },
                { name: "JavaScript Logic", progress: 45, color: "bg-amber-500" },
              ].map((skill, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-600">{skill.name}</span>
                    <span className="text-slate-900">{skill.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${skill.color} transition-all duration-1000`} 
                      style={{ width: `${skill.progress}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Learning Card */}
          {enrollments && enrollments.length > 0 && (
            <div className="group bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-slate-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                    Next Lesson
                  </span>
                  <h3 className="text-xl font-black leading-tight">Advanced CSS Layouts & Grid</h3>
                  <p className="text-xs text-slate-400 font-medium max-w-sm">Continue where you left off in Module 2. Learn how to build complex responsive layouts.</p>
                </div>
                <Link 
                  href="/curriculum" 
                  className="bg-white text-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-white/10"
                >
                  <PlayCircle size={24} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Announcements & Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <BellRing size={18} className="text-indigo-600" /> Announcements
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-indigo-600 uppercase mb-1">New Event</p>
                <p className="text-xs font-bold text-slate-700 leading-tight">Live Q&A Session with Mentors tomorrow at 5 PM.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Exam Cell</p>
                <p className="text-xs font-bold text-slate-700 leading-tight">Registration for Final Exams is now open.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 mx-auto mb-2">
                <Calendar size={18} />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Joined</p>
              <p className="text-xs font-black text-slate-900">{student?.created_at ? new Date(student.created_at).getFullYear() : "2026"}</p>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mx-auto mb-2">
                <CheckCircle2 size={18} />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Certificates</p>
              <p className="text-xs font-black text-slate-900">0 Earned</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
