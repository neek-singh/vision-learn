import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Play } from "lucide-react";
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
      course_id,
      progress_percentage,
      enrolled_at,
      courses(title, course_code, description)
    `)
    .eq("student_id", payload.id);

  return (
    <div className="max-w-4xl mx-auto space-y-3 animate-in fade-in duration-300 pb-16">
      {/* Compact Header */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">My Courses</h1>
          <p className="text-xs text-slate-500 font-medium">Manage enrolled courses & track learning progress</p>
        </div>
        <div className="shrink-0">
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-full">
            {enrollments?.length || 0} {enrollments?.length === 1 ? "Course" : "Courses"}
          </span>
        </div>
      </div>

      {!enrollments || enrollments.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-2.5 border border-slate-100">
            <BookOpen size={20} />
          </div>
          <h2 className="text-xs font-bold text-slate-700">No courses assigned yet</h2>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
            Please contact the administration to assign your course modules.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {enrollments.map((enrollment: any) => {
            const course = enrollment.courses as any;
            const progress = enrollment.progress_percentage || 0;
            const enrolledDate = enrollment.enrolled_at 
              ? new Date(enrollment.enrolled_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : null;

            return (
              <div 
                key={enrollment.id} 
                className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-2xs transition-all p-3.5 sm:p-4 space-y-2.5"
              >
                {/* Top Row: Icon + Course Code + Title + Active Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <BookOpen size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50/70 border border-indigo-100/50 px-1.5 py-0.2 rounded truncate max-w-[180px] sm:max-w-none">
                          {course?.course_code || "COURSE"}
                        </span>
                        {enrolledDate && (
                          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                            • Enrolled {enrolledDate}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-snug group-hover:text-indigo-600 transition-colors mt-0.5">
                        {course?.title || "Enrolled Course"}
                      </h3>
                    </div>
                  </div>

                  <span className="shrink-0 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Active
                  </span>
                </div>

                {/* Bottom Row: Progress Bar + Action Button */}
                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                      <span className="uppercase tracking-wider">Progress</span>
                      <span className="font-bold text-indigo-600">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link 
                      href="/curriculum"
                      className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <Play size={11} fill="currentColor" />
                      <span>{progress > 0 ? "Continue" : "Start Learn"}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
