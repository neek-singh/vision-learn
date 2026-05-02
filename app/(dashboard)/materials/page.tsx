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

  // 1. Get Enrolled Course IDs
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", payload.id);

  const courseIds = enrollments?.map(e => e.course_id) || [];

  // 2. Fetch Materials for these courses
  const { data: materials } = await supabase
    .from("materials")
    .select(`
      *,
      courses(title)
    `)
    .in("course_id", courseIds)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Notes & Materials</h1>
          <p className="text-sm text-slate-500 font-medium">Download your module notes and watch tutorial videos.</p>
        </div>
      </section>

      {!materials || materials.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <p className="text-slate-400 font-bold">No materials available for your current modules.</p>
        </div>
      ) : (
        <MaterialsClient initialMaterials={materials} />
      )}
    </div>
  );
}

