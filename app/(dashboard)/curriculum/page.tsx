import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import { CurriculumClient } from "@/components/student/CurriculumClient";
import { CurriculumSkeleton } from "@/components/dashboard/DashboardSkeletons";

export default async function CurriculumPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Suspense fallback={<CurriculumSkeleton />}>
        <CurriculumContent userId={payload.id} />
      </Suspense>
    </div>
  );
}

async function CurriculumContent({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();

  // 1. Fetch Student & Enrollments in parallel
  const [studentRes, enrollmentRes] = await Promise.all([
    supabase.from("students").select("batch").eq("id", userId).single(),
    supabase.from("enrollments").select("course_id, batch").eq("student_id", userId).limit(1)
  ]);

  const student = studentRes.data;
  const enrollmentData = enrollmentRes.data;

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
  const activeBatch = student?.batch || enrollmentData[0].batch;

  // 2. Fetch Modules, Progress, Schedules, Tests, and Materials in parallel
  const [modulesRes, progressRes, schedulesRes, testsRes, materialsRes] = await Promise.all([
    supabase.from("lms_modules").select(`id, title, order_index, lessons (*)`).eq("course_id", courseId).order("order_index"),
    supabase.from("user_progress").select("lesson_id").eq("user_id", userId).eq("completed", true),
    supabase.from("schedules").select("title, batch, type, date, start_time").eq("course_id", courseId),
    supabase.from("tests").select("*").eq("course_id", courseId).eq("is_published", true),
    supabase.from("materials").select("*").eq("course_id", courseId).eq("is_published", true)
  ]);

  const modulesData = modulesRes.data || [];
  const initialProgress = progressRes.data?.map(p => p.lesson_id) || [];
  const rawSchedules = schedulesRes.data || [];
  const testsData = testsRes.data || [];
  const materialsData = materialsRes.data || [];

  // Filter schedules in JS
  const normalizedActiveBatch = activeBatch?.trim().toLowerCase();
  const scheduledItems = rawSchedules.filter(s => {
    const sBatch = s.batch?.trim().toLowerCase();
    return !sBatch || sBatch === "all batches" || sBatch === normalizedActiveBatch;
  });

  return (
    <>
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
        initialModules={modulesData} 
        initialProgress={initialProgress} 
        studentId={userId} 
        initialSchedules={scheduledItems}
        initialTests={testsData}
        initialMaterials={materialsData}
        initialBatch={activeBatch}
        initialCourseId={courseId}
      />
    </>
  );
}
