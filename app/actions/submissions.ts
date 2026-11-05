"use server";

import { createPublicSupabaseClient } from "@/lib/supabase-server";

export async function notifyAdminOnSubmission(data: {
  studentId: string;
  assignmentTitle: string;
  assignmentId?: string;
  lessonId?: string;
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
    const title = "Nayi Assignment Submission 📥";
    const message = `${studentName} ne "${data.assignmentTitle}" submit kiya.`;

    // 2. Insert master notification
    const { data: notification, error: notifErr } = await supabase
      .from("notifications")
      .insert({
        title,
        message,
        type: "assignment_submission",
      })
      .select("id")
      .single();

    if (notifErr || !notification) {
      console.warn("[notifyAdminOnSubmission] Notification insert skipped or error:", notifErr);
      return { success: false };
    }

    // 3. Find all admins from profiles
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
    console.error("[notifyAdminOnSubmission] Error:", err);
    return { success: false };
  }
}

