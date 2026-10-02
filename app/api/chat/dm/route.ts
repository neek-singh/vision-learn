import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";

// Simple UUID regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const { target_user_id } = await req.json();
    if (!target_user_id || !UUID_REGEX.test(target_user_id)) {
      return NextResponse.json({ error: "Invalid target_user_id" }, { status: 400 });
    }

    const cookieStore = await cookies();
    let currentUserId: string | null = null;

    // 1. Check custom session token (students)
    const token = cookieStore.get("vision_learn_session")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload?.id && UUID_REGEX.test(payload.id)) {
        currentUserId = payload.id;
      }
    }

    // 2. Check Supabase auth (admins / staff)
    if (!currentUserId) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id && UUID_REGEX.test(user.id)) {
        currentUserId = user.id;
      }
    }

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUserId === target_user_id) {
      return NextResponse.json({ error: "Cannot create DM with yourself" }, { status: 400 });
    }

    const supabase = createPublicSupabaseClient();

    // Call DB function to get or create DM room
    const { data, error } = await supabase.rpc("get_or_create_dm_room", {
      user1: currentUserId,
      user2: target_user_id,
    });

    if (error) {
      console.error("get_or_create_dm_room error:", error);
      throw error;
    }

    return NextResponse.json({ room_id: data });
  } catch (err: any) {
    console.error("DM API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create DM" }, { status: 500 });
  }
}
