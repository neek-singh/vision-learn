import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import { getStudentById, updateStudentProfile } from "@/lib/students-store";

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
    let student: any = null;

    const { data: dbStudent } = await supabase
      .from("students")
      .select("*")
      .eq("id", payload.id)
      .maybeSingle();

    if (dbStudent) {
      student = dbStudent;
    } else {
      student = await getStudentById(payload.id);
    }

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check enrollments count
    let enrollmentsCount = 0;
    try {
      const { count } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("student_id", payload.id);
      enrollmentsCount = count || 0;
    } catch (e) {
      console.warn("Could not fetch enrollments count:", e);
    }

    const isUnadmitted =
      enrollmentsCount === 0 ||
      student?.admission_status === "unadmitted" ||
      student?.admission_status === "pending" ||
      student?.status === "unadmitted" ||
      student?.status === "pending";

    return NextResponse.json({
      id: student.id,
      name: student.name,
      photo_url: student.photo_url || null,
      student_id: student.student_id,
      status: student.status,
      admission_status: student.admission_status,
      is_unadmitted: isUnadmitted,
      enrollments_count: enrollmentsCount,
    });
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
    const { name, full_name, phone, gender, bio, dob, email, interests, photo_url, course, education, qualification } = body;

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
    if (dob !== undefined) {
      updateData.dob = dob;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (interests !== undefined) {
      updateData.interests = interests;
    }
    if (photo_url !== undefined) {
      updateData.photo_url = photo_url;
    }
    if (course !== undefined) {
      updateData.course = course;
    }
    if (education !== undefined) {
      updateData.education = education;
    }
    if (qualification !== undefined) {
      updateData.qualification = qualification;
    }

    const updatedStudent = await updateStudentProfile(payload.id, updateData);

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
