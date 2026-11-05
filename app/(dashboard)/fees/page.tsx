import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import { StudentFeesClient } from "@/components/student/StudentFeesClient";

export default async function StudentFeesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // 1. Fetch Student Fee Record (ordered by latest)
  const { data: fees } = await supabase
    .from("fees")
    .select(`
      *,
      students (name, student_id, phone, email),
      courses (title),
      installments (*),
      payments (*)
    `)
    .eq("student_id", payload.id)
    .order("created_at", { ascending: false });

  const fee = fees && fees.length > 0 ? fees[0] : null;

  if (!fee) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
         <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
           <Wallet size={28} />
         </div>
         <h3 className="text-lg font-bold text-slate-900 tracking-tight">Financial Records Pending</h3>
         <p className="text-xs text-slate-500 font-medium mt-1">Your course fee structure hasn't been configured by the institute admin yet. Please check back later or contact the accounts office.</p>
      </div>
    );
  }

  return <StudentFeesClient fee={fee} />;
}
