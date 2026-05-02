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

  // 1. Get Enrolled Course IDs
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", payload.id);

  const courseIds = enrollments?.map(e => e.course_id) || [];

  // 2. Fetch Tests
  const { data: tests } = await supabase
    .from("tests")
    .select(`
      *,
      courses(title),
      test_questions(id)
    `)
    .in("course_id", courseIds)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // 3. Fetch Results
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

      {!tests || tests.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
            <Trophy size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Tests Coming Soon</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Online tests for your enrolled courses will be available here soon.</p>
        </div>
      ) : (
        <TestsClient initialTests={tests} studentId={payload.id} initialResults={results || []} />
      )}
    </div>
  );
}

