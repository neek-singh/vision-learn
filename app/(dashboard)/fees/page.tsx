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

  return <StudentFeesClient fee={fee} />;
}
