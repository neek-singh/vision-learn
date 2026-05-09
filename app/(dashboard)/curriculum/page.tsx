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

  // 1. Fetch Student & Enrollments
  const { data: student } = await supabase
    .from("students")
    .select("batch")
    .eq("id", payload.id)
    .single();

  const { data: enrollmentData } = await supabase
    .from("enrollments")
    .select("course_id, batch")
    .eq("student_id", payload.id)
    .limit(1);

  if (!enrollmentData || enrollmentData.length === 0) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">My Classes</h1>
          <p className="text-sm text-slate-500 font-medium">No active courses found.</p>
        </section>
      </div>
    );
  }

  const courseId = enrollmentData[0].course_id;
  // Prioritize global student batch, fallback to enrollment batch
  const activeBatch = student?.batch || enrollmentData[0].batch;

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

  // 4. Fetch Schedules (unlock lessons)
  const { data: rawSchedules } = await supabase
    .from("schedules")
    .select("title, batch, type, date, start_time")
    .eq("course_id", courseId);

  // Filter in JS for maximum robustness
  const normalizedActiveBatch = activeBatch?.trim().toLowerCase();
  const scheduledItems = (rawSchedules || [])
    .filter(s => {
      if (s.type !== "class") return false;
      const sBatch = s.batch?.trim().toLowerCase();
      return !sBatch || sBatch === "all batches" || sBatch === normalizedActiveBatch;
    });

  // 5. Fetch Tests (Homework)
  const { data: testsData } = await supabase
    .from("tests")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true);

  // 6. Fetch Materials (Notes)
  const { data: materialsData } = await supabase
    .from("materials")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">My Classes</h1>
        <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
          Learning Path 
          {activeBatch && (
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 text-[10px] font-black uppercase tracking-wider">
              {activeBatch}
            </span>
          )}
        </p>
      </section>

      <CurriculumClient 
        initialModules={modulesData || []} 
        initialProgress={initialProgress} 
        studentId={payload.id} 
        initialSchedules={scheduledItems}
        initialTests={testsData || []}
        initialMaterials={materialsData || []}
      />
    </div>
  );
}


