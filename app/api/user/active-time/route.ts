import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("vision_learn_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const secondsToAdd = Number(body.secondsToAdd) || 0;
    if (secondsToAdd <= 0) {
      return NextResponse.json({ success: true, active_seconds: 0 });
    }

    const studentId = payload.id;
    const todayStr = new Date().toISOString().split("T")[0];

    const supabase = createPublicSupabaseClient();

    // 1. Fetch current active_seconds for today (with 6s timeout)
    const selectPromise = supabase
      .from("student_daily_activity")
      .select("active_seconds")
      .eq("student_id", studentId)
      .eq("date", todayStr)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: "DB timeout" } }), 6000)
    );

    const { data, error: selectError } = await Promise.race([selectPromise, timeoutPromise]);

    if (selectError) {
      console.warn("[active-time API] Error or timeout selecting:", selectError.message);
      return NextResponse.json({ success: false, error: selectError.message }, { status: 503 });
    }

    const currentActive = data?.active_seconds || 0;
    const newActive = currentActive + secondsToAdd;

    // 2. Upsert updated value (with 6s timeout)
    const upsertPromise = supabase
      .from("student_daily_activity")
      .upsert(
        {
          student_id: studentId,
          date: todayStr,
          active_seconds: newActive,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,date" }
      );

    const upsertTimeoutPromise = new Promise<{ error: { message: string } | null }>((resolve) =>
      setTimeout(() => resolve({ error: { message: "DB timeout" } }), 6000)
    );

    const { error: upsertError } = await Promise.race([upsertPromise, upsertTimeoutPromise]);

    if (upsertError) {
      console.warn("[active-time API] Error or timeout upserting:", upsertError.message);
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 503 });
    }

    return NextResponse.json({ success: true, active_seconds: newActive });
  } catch (err: any) {
    console.warn("[active-time API] Exception:", err?.message || err);
    return NextResponse.json({ success: false, error: err?.message || "Internal error" }, { status: 503 });
  }
}
