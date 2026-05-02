import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import { CurriculumClient } from "@/components/student/CurriculumClient";

export default async function CurriculumPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // 1. Fetch Enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", payload.id)
    .limit(1);

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Course Curriculum</h1>
          <p className="text-sm text-slate-500 font-medium">No active courses found.</p>
        </section>
      </div>
    );
  }

  const courseId = enrollments[0].course_id;

  // 2. Fetch Modules & Lessons
  const { data: modulesData } = await supabase
    .from("lms_modules")
    .select(`
      id,
      title,
      order_index,
      lessons (*)
    `)
    .eq("course_id", courseId)
    .order("order_index");

  // 3. Fetch Progress
  const { data: progressData } = await supabase
    .from("user_progress")
    .select("lesson_id")
    .eq("user_id", payload.id)
    .eq("completed", true);

  const initialProgress = progressData?.map(p => p.lesson_id) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Course Curriculum</h1>
        <p className="text-sm text-slate-500 font-medium">Follow your structured learning path to mastery.</p>
      </section>

      <CurriculumClient 
        initialModules={modulesData || []} 
        initialProgress={initialProgress} 
        studentId={payload.id} 
      />
    </div>
  );
}


