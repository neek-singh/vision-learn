import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { 
  FileText, 
  Video, 
  Download, 
  ExternalLink,
  Search,
  BookOpen
} from "lucide-react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import MaterialsClient from "./MaterialsClient";

export default async function MaterialsPage() {
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

  const { data: materials } = await supabase
    .from("materials")
    .select(`
      *,
      courses(title)
    `)
    .in("course_id", courseIds)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-3 animate-in fade-in duration-300 pb-16">
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Notes & Materials</h1>
          <p className="text-xs text-slate-500 font-medium">Download module notes, cheatsheets & guides</p>
        </div>
        <div className="shrink-0">
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-full">
            {materials?.length || 0} Items
          </span>
        </div>
      </div>

      <MaterialsClient 
        initialMaterials={materials || []} 
        schedules={schedules || []} 
        activeBatch={activeBatch}
      />
    </div>
  );
}

