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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Notes & Materials</h1>
          <p className="text-sm text-slate-500 font-medium">Download your module notes and watch tutorial videos.</p>
        </div>
      </section>

      <MaterialsClient 
        initialMaterials={materials || []} 
        schedules={schedules || []} 
        activeBatch={activeBatch}
      />
    </div>
  );
}

