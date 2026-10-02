import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  IdCard, 
  BookOpen, 
  Calendar,
  Shield,
  MapPin,
  Users,
  Baby,
  Dna,
  LogOut
} from "lucide-react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";
import { ProfilePageSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { ThemePicker } from "@/components/student/ThemePicker";
import { ProfilePhotoViewer } from "@/components/student/ProfilePhotoViewer";
import { UsernameCard } from "@/components/student/UsernameCard";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  return (
    <div className="space-y-6">
      <Suspense fallback={<ProfilePageSkeleton />}>
        <ProfileContent userId={payload.id} />
      </Suspense>
    </div>
  );
}

async function ProfileContent({ userId }: { userId: string }) {
  const supabase = createPublicSupabaseClient();

  // Fetch Student Profile and Enrollments in parallel
  const [studentRes, enrollmentRes] = await Promise.all([
    supabase.from("students").select("*").eq("id", userId).single(),
    supabase.from("enrollments").select("batch, course_id").eq("student_id", userId).limit(1)
  ]);

  const student = studentRes.data;
  const mainBatch = enrollmentRes.data?.[0]?.batch || "Not Assigned";
  const courseId = enrollmentRes.data?.[0]?.course_id;

  let batchTiming = null;
  if (student && courseId && mainBatch !== "Not Assigned") {
    const { data: batchesData } = await supabase
      .from("batches")
      .select("title, timing")
      .eq("course_id", courseId);

    if (batchesData) {
      const activeBatch = mainBatch.trim().toLowerCase();
      const match = batchesData.find((b: any) => {
        const title = b.title?.trim().toLowerCase();
        return title && (title.includes(activeBatch) || activeBatch.includes(title));
      });
      if (match) {
        batchTiming = match.timing;
      }
    }
  }

  if (!student) {
    return <div className="p-10 bg-white rounded-3xl border border-slate-100 text-center font-bold text-slate-500">Student profile not found.</div>;
  }

  return (
    <div className="max-w-4xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300 pb-10">
      {/* Header / Profile Card */}
      <section className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        {student.photo_url ? (
          <ProfilePhotoViewer photoUrl={student.photo_url} name={student.name || "Student"} />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600 border-2 border-white shadow-sm ring-1 ring-slate-200/80 overflow-hidden flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {student.name?.charAt(0) || "S"}
          </div>
        )}
        
        <div className="flex-1 text-center sm:text-left space-y-1">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Student Profile</p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{student.name}</h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
            <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-slate-200/70">
              ID: {student.student_id}
            </span>
            <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-emerald-200/60 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Student
            </span>
            {student.course && (
              <span className="bg-indigo-50/70 text-indigo-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-indigo-100 hidden sm:inline-block">
                {student.course}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Information */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <User size={15} className="text-indigo-600" /> Contact Information
          </h3>
          
          <div className="space-y-3">
            <ProfileInfo icon={<Mail size={14}/>} label="Email Address" value={student.email} />
            <ProfileInfo icon={<Phone size={14}/>} label="Phone Number" value={student.phone} />
            <ProfileInfo icon={<MapPin size={14}/>} label="Residential Address" value={student.address || "Address not provided"} />
          </div>
        </div>

        {/* Family & Personal Details */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <Users size={15} className="text-indigo-600" /> Family & Personal
          </h3>
          
          <div className="space-y-3">
            <ProfileInfo icon={<Users size={14}/>} label="Father's Name" value={student.father_name} />
            <ProfileInfo icon={<Baby size={14}/>} label="Mother's Name" value={student.mother_name} />
            
            <div className="grid grid-cols-2 gap-3 pt-0.5">
               <ProfileInfo icon={<Calendar size={14}/>} label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString() : "—"} />
               <ProfileInfo icon={<Dna size={14}/>} label="Gender" value={student.gender} className="capitalize" />
            </div>
          </div>
        </div>

        {/* Academic Profile */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <Shield size={15} className="text-indigo-600" /> Academic Details
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <ProfileInfo icon={<BookOpen size={14}/>} label="Primary Course" value={student.course} />
            <ProfileInfo icon={<IdCard size={14}/>} label="Student ID" value={student.student_id} />
            <ProfileInfo icon={<Users size={14}/>} label="Assigned Batch" value={batchTiming ? `${mainBatch} (${batchTiming})` : mainBatch} />
            <ProfileInfo icon={<Calendar size={14}/>} label="Admission Date" value={student.admission_date ? new Date(student.admission_date).toLocaleDateString() : "—"} />
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
             <div className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Highest Education</span>
                <span className="text-xs font-bold text-slate-700">{student.education || "Undergraduate"}</span>
             </div>
             <div className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Student Category</span>
                <span className="text-xs font-bold text-slate-700">{student.category || "General"}</span>
             </div>
          </div>
        </div>

        {/* Username / Chat Handle */}
        <UsernameCard userId={userId} initialUsername={student?.username || ""} />

        {/* Theme Settings Section */}
        <div className="md:col-span-2">
          <ThemePicker />
        </div>
      </div>

      {/* Logout Section at the Bottom */}
      <div className="pt-4 flex justify-center">
        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <LogOut size={14} />
            Logout from Account
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileInfo({ icon, label, value, className = "" }: any) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className={`text-xs sm:text-sm font-semibold text-slate-800 break-words ${className}`}>{value || "—"}</p>
      </div>
    </div>
  );
}
