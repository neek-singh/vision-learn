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

export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { name, full_name, phone, gender, bio } = body;

    const updateData: Record<string, any> = {};
    const updatedName = name ?? full_name;
    if (updatedName !== undefined) {
      updateData.name = updatedName;
    }
    if (phone !== undefined) {
      updateData.phone = phone;
    }
    if (gender !== undefined) {
      updateData.gender = gender;
    }
    if (bio !== undefined) {
      updateData.bio = bio;
    }

    const supabase = createPublicSupabaseClient();
    const { data: updatedStudent, error } = await supabase
      .from("students")
      .update(updateData)
      .eq("id", payload.id)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      profile: updatedStudent,
      student: updatedStudent,
      success: true 
    });
  } catch (error: any) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
