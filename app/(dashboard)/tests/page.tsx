import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { 
  FileText, 
  Trophy,
  BookOpen
} from "lucide-react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import TestsClient from "@/app/(dashboard)/tests/TestsClient";

export default async function TestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // 1. Get Student Batch & Enrollments
  const { data: student } = await supabase
    .from("students")
    .select("batch")
    .eq("id", payload.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, batch")
    .eq("student_id", payload.id);

  const activeBatch = (student?.batch || enrollments?.[0]?.batch || "").trim().toLowerCase();
  const courseIds = enrollments?.map(e => e.course_id).filter(Boolean) || [];

  // 2. Fetch ALL Schedules for these courses (to filter on client)
  const { data: schedules } = await supabase
    .from("schedules")
    .select("*")
    .in("course_id", courseIds);

  // 3. Fetch Tests
  const { data: tests } = await supabase
    .from("tests")
    .select(`
      *,
      courses(title),
      test_questions(id)
    `)
    .in("course_id", courseIds)
    .order("created_at", { ascending: false });

  // 4. Fetch Results
  const { data: results } = await supabase
    .from("test_results")
    .select("test_id, score, total_questions")
    .eq("student_id", payload.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Online Tests</h1>
        <p className="text-sm text-slate-500 font-medium">Evaluate your progress and master your skills.</p>
      </section>

      <TestsClient 
        initialTests={tests || []} 
        schedules={schedules || []}
        activeBatch={activeBatch}
        studentId={payload.id} 
        initialResults={results || []} 
      />
    </div>
  );
}
