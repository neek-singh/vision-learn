import { createPublicSupabaseClient } from "../lib/supabase-server";

async function test() {
  const supabase = createPublicSupabaseClient();
  const studentId = "VIT-2026BASIC0002"; // This is student_id string, not UUID
  
  // First find the UUID
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("student_id", studentId)
    .single();
    
  console.log("Student UUID:", student?.id);

  if (student) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("*, courses(*)")
      .eq("student_id", student.id);
      
    console.log("Enrollments found:", enrollments?.length);
    console.log("Enrollment details:", JSON.stringify(enrollments, null, 2));
  }
}

test();
