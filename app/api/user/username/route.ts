import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/user/username?check=xyz
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkVal = (searchParams.get("check") || "").trim().toLowerCase();

    if (!checkVal || checkVal.length < 3 || checkVal.length > 20 || !/^[a-z0-9_]+$/.test(checkVal)) {
      return NextResponse.json({ available: false, error: "Invalid format" });
    }

    const cookieStore = await cookies();
    let currentUserId: string | null = null;
    const token = cookieStore.get("vision_learn_session")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload?.id && UUID_REGEX.test(payload.id)) {
        currentUserId = payload.id;
      }
    }

    const supabase = createPublicSupabaseClient();

    let query = supabase
      .from("students")
      .select("id")
      .ilike("username", checkVal);

    if (currentUserId) {
      query = query.neq("id", currentUserId);
    }

    const { data } = await query.maybeSingle();
    return NextResponse.json({ available: !data });
  } catch (err: any) {
    console.error("Username check error:", err);
    return NextResponse.json({ available: null, error: err.message }, { status: 500 });
  }
}

// POST /api/user/username { username: "xyz" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUsername = body?.username;

    if (!rawUsername || typeof rawUsername !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    let currentUserId: string | null = null;

    // 1. Check custom student session token
    const token = cookieStore.get("vision_learn_session")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload?.id && UUID_REGEX.test(payload.id)) {
        currentUserId = payload.id;
      }
    }

    // 2. Check Supabase auth (for staff)
    if (!currentUserId) {
      const supabaseServer = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
      );
      const { data: { user } } = await supabaseServer.auth.getUser();
      if (user?.id && UUID_REGEX.test(user.id)) {
        currentUserId = user.id;
      }
    }

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
    }

    const supabase = createPublicSupabaseClient();

    // Call database function with elevated definer privileges
    const { data, error } = await supabase.rpc("update_username", {
      target_user_id: currentUserId,
      new_username: rawUsername.trim().toLowerCase(),
    });

    if (error) {
      console.error("update_username RPC error:", error);
      return NextResponse.json({ error: error.message || "Failed to update username" }, { status: 500 });
    }

    if (!data?.success) {
      return NextResponse.json({ error: data?.error || "Failed to save username" }, { status: 400 });
    }

    return NextResponse.json({ success: true, username: data.username });
  } catch (err: any) {
    console.error("Username update error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
