import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import StudentNotificationsClient from "./NotificationsClient";

export default async function StudentNotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // Fetch user specific notifications
  const { data: userNotifications } = await supabase
    .from("user_notifications")
    .select(`
      id,
      is_read,
      created_at,
      notifications (
        title,
        message,
        type
      )
    `)
    .eq("user_id", payload.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <StudentNotificationsClient 
        initialData={userNotifications || []} 
        studentId={payload.id} 
      />
    </div>
  );
}
