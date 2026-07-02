import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth-custom";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("vision_learn_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId, completed } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // 1. Upsert into user_progress
    const { error: upsertError } = await supabase
      .from("user_progress")
      .upsert({
        user_id: payload.id,
        lesson_id: lessonId,
        completed,
        last_watched_at: new Date().toISOString()
      });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // 2. Fetch course_id from lesson and module to locate enrollment
    let progressPercentage = 0;
    const { data: lesson } = await supabase
      .from("lessons")
      .select("module_id")
      .eq("id", lessonId)
      .single();

    if (lesson?.module_id) {
      const { data: moduleData } = await supabase
        .from("lms_modules")
        .select("course_id")
        .eq("id", lesson.module_id)
        .single();

      if (moduleData?.course_id) {
        // 3. Fetch progress_percentage updated by DB trigger
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("progress_percentage")
          .eq("student_id", payload.id)
          .eq("course_id", moduleData.course_id)
          .single();

        if (enrollment) {
          progressPercentage = enrollment.progress_percentage;
        }
      }
    }

    return NextResponse.json({
      success: true,
      progress_percentage: progressPercentage
    });

  } catch (error: any) {
    console.error("Progress API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

