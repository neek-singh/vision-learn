import { NextResponse } from "next/server";
import { registerStudent } from "@/lib/students-store";
import { createToken } from "@/lib/auth-custom";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, studying, interests } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "A valid 10-digit mobile number is required." },
        { status: 400 }
      );
    }

    const { student, student_id, isExisting } = await registerStudent({
      name: name.trim(),
      phone: cleanPhone,
      studying: studying || "School Student",
      interests: Array.isArray(interests) ? interests : [],
    });

    // Generate JWT token so user can optionally proceed to dashboard seamlessly
    const token = await createToken({
      id: student.id,
      student_id: student.student_id,
      name: student.name,
    });

    const response = NextResponse.json({
      success: true,
      isExisting: Boolean(isExisting),
      student: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        phone: student.phone,
        education: student.education,
        qualification: student.qualification,
      },
    });

    // Set auth cookie
    response.cookies.set({
      name: "vision_learn_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Registration API error:", err);
    return NextResponse.json(
      { error: err.message || "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
