import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("vision_learn_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const supabase = createPublicSupabaseClient();
    const { data: student, error } = await supabase
      .from("students")
      .select("id, name, photo_url, student_id")
      .eq("id", payload.id)
      .single();

    if (error || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
