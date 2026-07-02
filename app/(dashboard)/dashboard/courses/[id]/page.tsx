import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { verifyToken } from "@/lib/auth-custom";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import CurriculumTracker from "./CurriculumTracker";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = await createServerSupabaseClient();

  // Fetch Enrollment & Course
  const [enrollmentRes, progressRes] = await Promise.all([
    supabase
      .from("enrollments")
      .select(`
        id,
        progress_percentage,
        course_id,
        courses(title, course_code, curriculum)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("user_progress")
      .select("lesson_id")
      .eq("user_id", payload.id)
      .eq("completed", true)
  ]);

  const enrollment = enrollmentRes.data;

  if (!enrollment) {
    redirect("/dashboard");
  }

  const completedLessons = progressRes.data?.map(p => p.lesson_id) || [];
  const course = enrollment.courses as any;
  
  // Normalize curriculum
  let curriculum = course?.curriculum;
  if (typeof curriculum === 'string') {
    try {
      curriculum = JSON.parse(curriculum);
    } catch {
      curriculum = [];
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0f1d] text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-6 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
              {course?.course_code || "LMS"}
            </span>
            <h1 className="text-3xl font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {course?.title || "Course"}
            </h1>
          </div>
          
          <div className="w-full md:w-64 bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Overall Progress</span>
              <span className="font-semibold text-blue-400">{enrollment.progress_percentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${enrollment.progress_percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-slate-200">Course Curriculum</h2>
          </div>

          <CurriculumTracker 
            enrollmentId={enrollment.id}
            curriculum={curriculum}
            initialCompleted={completedLessons}
          />
        </div>

      </div>
    </main>
  );
}
