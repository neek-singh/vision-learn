import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { 
  PenTool, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileUp,
  BookOpen
} from "lucide-react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import AssignmentsClient from "./AssignmentsClient";

export default async function AssignmentsPage() {
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

  // 2. Fetch Assignments
  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      *,
      courses(title)
    `)
    .in("course_id", courseIds)
    .eq("is_published", true)
    .order("due_date", { ascending: true });

  // 3. Fetch Submissions
  const { data: submissions } = await supabase
    .from("submissions")
    .select("assignment_id, status")
    .eq("student_id", payload.id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Assignments</h1>
        <p className="text-sm text-slate-500 font-medium">Keep track of your tasks and submission deadlines.</p>
      </section>

      {!assignments || assignments.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <p className="text-slate-400 font-bold">No assignments available yet.</p>
        </div>
      ) : (
        <AssignmentsClient initialAssignments={assignments} initialSubmissions={submissions || []} studentId={payload.id} />
      )}
    </div>
  );
}

