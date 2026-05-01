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

    const { enrollmentId, lessonId, completed } = await request.json();

    if (!enrollmentId || !lessonId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // 1. Fetch current enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .select("completed_lessons, course_id, student_id")
      .eq("id", enrollmentId)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Security check: ensure this enrollment belongs to the student
    if (enrollment.student_id !== payload.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Fetch course curriculum
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("curriculum")
      .eq("id", enrollment.course_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // 3. Update completed lessons array
    let completedLessons = enrollment.completed_lessons;
    if (!Array.isArray(completedLessons)) {
      completedLessons = [];
    }

    if (completed) {
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      }
    } else {
      completedLessons = completedLessons.filter((id: string) => id !== lessonId);
    }

    // 4. Calculate progress percentage
    const totalLessons = countLessons(course.curriculum);
    const progressPercentage = totalLessons > 0 
      ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100)) 
      : 0;

    // 5. Save to DB
    const { error: updateError } = await supabase
      .from("enrollments")
      .update({
        completed_lessons: completedLessons,
        progress_percentage: progressPercentage
      })
      .eq("id", enrollmentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      progress_percentage: progressPercentage,
      completed_lessons: completedLessons
    });

  } catch (error: any) {
    console.error("Progress API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

function countLessons(curriculum: any): number {
  if (!curriculum) return 0;
  
  let parsed = curriculum;
  if (typeof curriculum === 'string') {
    try {
      parsed = JSON.parse(curriculum);
    } catch {
      return 0;
    }
  }

  if (!Array.isArray(parsed)) return 0;
  
  let count = 0;
  for (const item of parsed) {
    if (item && typeof item === 'object') {
      if (Array.isArray(item.lessons)) {
        count += item.lessons.length;
      } else if (item.modules && Array.isArray(item.modules)) {
        for (const mod of item.modules) {
          if (mod.lessons && Array.isArray(mod.lessons)) {
            count += mod.lessons.length;
          }
        }
      } else {
        count++;
      }
    } else if (typeof item === 'string') {
      count++;
    }
  }
  
  return count === 0 ? parsed.length : count;
}
