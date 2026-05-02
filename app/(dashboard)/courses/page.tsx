import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Clock, Users, Play } from "lucide-react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";

export default async function CoursesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // Fetch Enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      progress_percentage,
      enrolled_at,
      courses(title, course_code, description)
    `)
    .eq("student_id", payload.id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">My Courses</h1>
        <p className="text-sm text-slate-500 font-medium">Manage your enrolled courses and track progress.</p>
      </section>

      {!enrollments || enrollments.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">No courses assigned yet</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Please contact the administration to assign your course modules.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrollments.map((enrollment: any) => (
            <div key={enrollment.id} className="group bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-500">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                    <BookOpen size={20} />
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-100">
                    Active
                  </span>
                </div>

                <div className="space-y-1 mb-6">
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                    {(enrollment.courses as any)?.course_code || "LMS"}
                  </p>
                  <h3 className="text-lg font-black text-slate-900 line-clamp-1 leading-tight">
                    {(enrollment.courses as any)?.title}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mt-1">
                    {(enrollment.courses as any)?.description || "Access your course materials, videos, and assignments for this module."}
                  </p>
                </div>

                <div className="flex items-center gap-4 mb-6 py-3 border-y border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold">Self-paced</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                    <span className="text-sm font-black text-indigo-600">{enrollment.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                      style={{ width: `${enrollment.progress_percentage}%` }}
                    />
                  </div>

                  <Link 
                    href="/curriculum"
                    className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
                  >
                    <Play size={14} fill="currentColor" />
                    Start Learn
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
