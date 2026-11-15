import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { createPublicSupabaseClient } from "./supabase-server";

export interface StudentRecord {
  id: string;
  student_id: string;
  name: string;
  phone: string;
  email?: string | null;
  education?: string | null;
  qualification?: string | null;
  course?: string | null;
  category?: string | null;
  address?: string | null;
  password_hash: string;
  status: string;
  admission_status?: string;
  is_blocked?: boolean;
  is_deleted?: boolean;
  created_at: string;
}

const DATA_FILE = path.join(process.cwd(), "data", "unadmitted-students.json");

function readLocalStudents(): StudentRecord[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content || "[]");
  } catch (err) {
    console.error("Error reading local students file:", err);
    return [];
  }
}

function writeLocalStudents(students: StudentRecord[]): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local students file:", err);
  }
}

export async function generateNextStudentId(): Promise<string> {
  const supabase = createPublicSupabaseClient();
  const existingIds = new Set<string>();

  // 1. Fetch existing student IDs from Supabase students table
  try {
    const { data: dbStudents } = await supabase
      .from("students")
      .select("student_id");
    if (dbStudents && Array.isArray(dbStudents)) {
      dbStudents.forEach((s: any) => {
        if (s.student_id) existingIds.add(String(s.student_id).trim().toUpperCase());
      });
    }
  } catch (err) {
    console.warn("Could not fetch db students for ID generation:", err);
  }

  // 2. Fetch from local store
  const localStudents = readLocalStudents();
  localStudents.forEach((s) => {
    if (s.student_id) existingIds.add(s.student_id.trim().toUpperCase());
  });

  // 3. Scan for highest VITxxx number (format VIT001, VIT002, etc.)
  let maxSeq = 0;
  for (const id of existingIds) {
    // Strictly match VIT followed by 3 or more digits (VIT001, VIT002, etc.)
    const match = id.match(/^VIT(\d{3,})$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const nextId = `VIT${String(nextSeq).padStart(3, "0")}`;
  return nextId;
}

export async function registerStudent(params: {
  name: string;
  phone: string;
  studying?: string;
  studentClass?: string;
  interests?: string[];
}): Promise<{
  student: StudentRecord;
  student_id: string;
  isExisting: boolean;
}> {
  const { name, phone, studying = "School Student", studentClass = "", interests = [] } = params;
  const cleanDigits = phone.trim().replace(/\D/g, "");
  const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

  // 1. Check if a student with the same 10-digit mobile number already exists
  const localStudents = readLocalStudents();
  let existingStudent = localStudents.find((s) => {
    if (!s.phone) return false;
    const sDigits = s.phone.replace(/\D/g, "");
    const sLast10 = sDigits.length >= 10 ? sDigits.slice(-10) : sDigits;
    return sLast10 === last10;
  });

  if (!existingStudent) {
    try {
      const supabase = createPublicSupabaseClient();
      const { data } = await supabase
        .from("students")
        .select("*")
        .ilike("phone", `%${last10}%`)
        .maybeSingle();
      if (data) {
        existingStudent = data as StudentRecord;
      }
    } catch (err) {
      console.warn("Could not query students by phone:", err);
    }
  }

  // If already registered, return existing student with isExisting = true
  if (existingStudent) {
    return {
      student: existingStudent,
      student_id: existingStudent.student_id,
      isExisting: true,
    };
  }

  // 2. Otherwise create a brand new student
  const student_id = await generateNextStudentId();
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(last10, salt);

  const formattedClass = studentClass
    ? (studentClass.startsWith("Class ")
      ? studentClass
      : (studying === "School Student" ? `Class ${studentClass}` : studentClass))
    : studying;

  const studentRecord: StudentRecord = {
    id: crypto.randomUUID(),
    student_id,
    name: name.trim(),
    phone: last10,
    education: formattedClass ? `${studying} (${formattedClass})` : studying,
    qualification: formattedClass,
    course: interests.join(", ") || "General Computer Studies",
    category: studying,
    address: interests.join(", "),
    password_hash,
    status: "active",
    admission_status: "unadmitted",
    is_blocked: false,
    is_deleted: false,
    created_at: new Date().toISOString(),
  };

  // Save to local persistent store
  const updated = localStudents.filter((s) => s.student_id !== student_id);
  updated.push(studentRecord);
  writeLocalStudents(updated);

  // Best-effort write to Supabase students table
  try {
    const supabase = createPublicSupabaseClient();
    await supabase.from("students").insert([
      {
        id: studentRecord.id,
        student_id: studentRecord.student_id,
        name: studentRecord.name,
        phone: studentRecord.phone,
        education: studentRecord.education,
        category: studentRecord.category,
        address: studentRecord.address,
        password_hash: studentRecord.password_hash,
        status: "active",
      },
    ]);
  } catch (err) {
    // Non-blocking if RLS restricts anon inserts
  }

  // Best-effort write to Supabase admissions table
  try {
    const supabase = createPublicSupabaseClient();
    await supabase.from("admissions").insert([
      {
        student_name: studentRecord.name,
        phone: studentRecord.phone,
        qualification: studying,
        message: `Student ID: ${student_id} | Interests: ${interests.join(", ")}`,
        status: "pending",
      },
    ]);
  } catch (err) {
    // Non-blocking
  }

  return {
    student: studentRecord,
    student_id,
    isExisting: false,
  };
}

export async function getStudentForAuth(studentId: string): Promise<StudentRecord | null> {
  const cleanId = studentId.trim();
  const supabase = createPublicSupabaseClient();

  // 1. Try Supabase get_student_for_auth RPC
  try {
    const { data: students, error } = await supabase.rpc(
      "get_student_for_auth",
      { p_student_id: cleanId }
    );
    if (!error && students && students.length > 0) {
      return students[0] as StudentRecord;
    }
  } catch (err) {
    console.warn("RPC get_student_for_auth error:", err);
  }

  // 2. Fallback to local store (case-insensitive)
  const localStudents = readLocalStudents();
  const found = localStudents.find(
    (s) => s.student_id.toUpperCase() === cleanId.toUpperCase()
  );

  return found || null;
}

export async function getStudentById(id: string): Promise<StudentRecord | null> {
  const supabase = createPublicSupabaseClient();

  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) {
      return data as StudentRecord;
    }
  } catch (err) {
    console.warn("Supabase get student by ID error:", err);
  }

  // 2. Fallback to local store
  const localStudents = readLocalStudents();
  const found = localStudents.find((s) => s.id === id || s.student_id === id);
  return found || null;
}

export async function updateStudentProfile(
  id: string,
  updates: Record<string, any>
): Promise<StudentRecord | null> {
  const supabase = createPublicSupabaseClient();
  let updated: StudentRecord | null = null;

  try {
    const { data, error } = await supabase
      .from("students")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (!error && data) {
      updated = data as StudentRecord;
    }
  } catch (err) {
    console.warn("Supabase update error:", err);
  }

  // Update local store as well
  const localStudents = readLocalStudents();
  const index = localStudents.findIndex((s) => s.id === id || s.student_id === id);
  if (index !== -1) {
    localStudents[index] = {
      ...localStudents[index],
      ...updates,
    };
    writeLocalStudents(localStudents);
    if (!updated) {
      updated = localStudents[index];
    }
  }

  return updated;
}

export async function updateStudentPassword(
  id: string,
  oldPass: string,
  newPass: string
): Promise<{ success: boolean; error?: string }> {
  const student = await getStudentById(id);
  if (!student) {
    return { success: false, error: "Student not found" };
  }

  // Verify old password if hash exists
  if (student.password_hash) {
    const match = await bcrypt.compare(oldPass, student.password_hash);
    if (!match) {
      return { success: false, error: "Incorrect current password" };
    }
  }

  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(newPass, salt);

  const supabase = createPublicSupabaseClient();
  try {
    await supabase
      .from("students")
      .update({ password_hash: newHash })
      .eq("id", id);
  } catch (e) {
    console.warn("Could not update Supabase password:", e);
  }

  const localStudents = readLocalStudents();
  const index = localStudents.findIndex((s) => s.id === id || s.student_id === id);
  if (index !== -1) {
    localStudents[index].password_hash = newHash;
    writeLocalStudents(localStudents);
  }

  return { success: true };
}
