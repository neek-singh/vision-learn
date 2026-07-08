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

  // 1. Fetch Student Fee Record
  const { data: fee } = await supabase
    .from("fees")
    .select(`
      *,
      students (name, student_id),
      courses (title),
      installments (*),
      payments (*)
    `)
    .eq("student_id", payload.id)
    .single();

  if (!fee) {
    return (
      <div className="max-w-3xl p-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm mx-auto">
         <Wallet size={40} className="mx-auto mb-4 text-slate-200" />
         <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial Records Pending</h3>
         <p className="text-slate-500 font-medium">Your course fee structure hasn't been configured by the admin yet.</p>
      </div>
    );
  }

  return <StudentFeesClient fee={fee} />;
}
