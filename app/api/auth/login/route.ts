import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";

// In-memory rate limiter
const rateLimitMap = new Map<string, { attempts: number; resetTime: number }>();

function isRateLimited(ip: string): { limited: boolean; resetTime?: number } {
  const now = Date.now();
  const limit = 5;
  const windowMs = 15 * 60 * 1000;

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { attempts: 1, resetTime: now + windowMs });
    return { limited: false };
  }

  record.attempts++;
  if (record.attempts > limit) {
    return { limited: true, resetTime: record.resetTime };
  }
  return { limited: false };
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const limitCheck = isRateLimited(ip);

    if (limitCheck.limited) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { studentId, password } = await request.json();

    if (!studentId || !password) {
      return NextResponse.json(
        { error: "Student ID and Password are required." },
        { status: 400 }
      );
    }

    const supabase = createPublicSupabaseClient();

    // 1. Fetch student via SECURITY DEFINER RPC to bypass RLS safely
    const { data: students, error: rpcError } = await supabase.rpc(
      "get_student_for_auth",
      { p_student_id: studentId.trim() }
    );

    const student = students && students.length > 0 ? students[0] : null;

    if (rpcError || !student || student.is_deleted || student.is_blocked) {
      return NextResponse.json(
        { error: "Invalid Student ID or Password." },
        { status: 401 }
      );
    }

    if (student.status && student.status !== "active") {
      return NextResponse.json(
        { error: "Your account is currently inactive. Please contact administrator." },
        { status: 403 }
      );
    }

    if (!student.password_hash) {
      return NextResponse.json(
        { error: "Invalid Student ID or Password." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, student.password_hash);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid Student ID or Password." },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: student.id,
      student_id: student.student_id,
      name: student.name,
    });

    const response = NextResponse.json({ success: true });
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
  } catch (error) {
    console.error("Custom Auth API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
