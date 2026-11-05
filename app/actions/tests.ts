"use server";

import { createPublicSupabaseClient } from "@/lib/supabase-server";

export async function notifyAdminOnTestComplete(data: {
  studentId: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
}) {
  try {
    const supabase = createPublicSupabaseClient();

    // 1. Fetch student name
    const { data: student } = await supabase
      .from("students")
      .select("name")
      .eq("id", data.studentId)
      .maybeSingle();

    const studentName = student?.name || "Student";
    const percentage = data.totalQuestions > 0 ? Math.round((data.score / data.totalQuestions) * 100) : 0;
    const title = "Naya Test Result 🏆";
    const message = `${studentName} ne "${data.testTitle}" complete kiya (Score: ${data.score}/${data.totalQuestions}, ${percentage}%).`;

    // 2. Insert master notification
    const { data: notification, error: notifErr } = await supabase
      .from("notifications")
      .insert({
        title,
        message,
        type: "test_result",
      })
      .select("id")
      .single();

    if (notifErr || !notification) {
      console.warn("[notifyAdminOnTestComplete] Notification insert error:", notifErr);
      return { success: false };
    }

    // 3. Find admins from profiles
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const userLinks = admins.map((a: { id: string }) => ({
        user_id: a.id,
        notification_id: notification.id,
        is_read: false,
      }));

      await supabase.from("user_notifications").insert(userLinks);
    }

    return { success: true };
  } catch (err) {
    console.error("[notifyAdminOnTestComplete] Error:", err);
    return { success: false };
  }
}

