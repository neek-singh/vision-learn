import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  IdCard, 
  BookOpen, 
  Calendar,
  Settings,
  Shield,
  MapPin,
  Users,
  Baby,
  Dna,
  LogOut
} from "lucide-react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // Fetch Student Profile
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", payload.id)
    .single();

  // Fetch Enrollments to get Batch
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("batch")
    .eq("student_id", payload.id);
    
  const mainBatch = enrollments?.[0]?.batch || "Not Assigned";

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header / Profile Card */}
      <section className="flex flex-col md:flex-row items-center gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50" />
        
        <div className="w-28 h-28 rounded-3xl bg-indigo-600 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center text-white text-4xl font-black relative z-10 shrink-0">
          {student?.photo_url ? (
            <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            student?.name?.charAt(0) || "S"
          )}
        </div>
        
        <div className="relative z-10 text-center md:text-left space-y-1.5">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Student Profile</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{student?.name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-1">
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border border-indigo-100">
              ID: {student?.student_id}
            </span>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border border-emerald-100">
              Active Student
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact & Bio */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
            <User size={20} className="text-indigo-600" /> Contact Information
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            <ProfileInfo icon={<Mail size={16}/>} label="Email Address" value={student?.email} />
            <ProfileInfo icon={<Phone size={16}/>} label="Phone Number" value={student?.phone} />
            <ProfileInfo icon={<MapPin size={16}/>} label="Residential Address" value={student?.address || "Address not provided"} />
          </div>
        </div>

        {/* Family & Personal Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
            <Users size={20} className="text-indigo-600" /> Family & Personal
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            <ProfileInfo icon={<Users size={16}/>} label="Father's Name" value={student?.father_name} />
            <ProfileInfo icon={<Baby size={16}/>} label="Mother's Name" value={student?.mother_name} />
            
            <div className="grid grid-cols-2 gap-4">
               <ProfileInfo icon={<Calendar size={16}/>} label="Date of Birth" value={student?.dob ? new Date(student.dob).toLocaleDateString() : "—"} />
               <ProfileInfo icon={<Dna size={16}/>} label="Gender" value={student?.gender} className="capitalize" />
            </div>
          </div>
        </div>

        {/* Academic Profile */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 md:col-span-2">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
            <Shield size={20} className="text-indigo-600" /> Academic Profile
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProfileInfo icon={<BookOpen size={16}/>} label="Primary Course" value={student?.course} />
            <ProfileInfo icon={<IdCard size={16}/>} label="Official Student ID" value={student?.student_id} />
            <ProfileInfo icon={<Users size={16}/>} label="Assigned Batch" value={mainBatch} />
            <ProfileInfo icon={<Calendar size={16}/>} label="Admission Date" value={student?.admission_date ? new Date(student.admission_date).toLocaleDateString() : "—"} />
          </div>

          <div className="pt-4 border-t border-slate-50 flex flex-col md:flex-row gap-4">
             <div className="flex-1 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-50">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Highest Education</p>
                <p className="text-sm font-black text-indigo-700">{student?.education || "Undergraduate"}</p>
             </div>
             <div className="flex-1 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-50">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Student Category</p>
                <p className="text-sm font-black text-emerald-700">{student?.category || "General"}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Logout Section at the Bottom */}
      <div className="pt-8 flex justify-center">
        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-3 px-10 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 shadow-sm"
          >
            <LogOut size={20} />
            Logout from Account
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileInfo({ icon, label, value, className = "" }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1.5">{label}</p>
        <p className={`text-sm font-bold text-slate-700 ${className}`}>{value || "—"}</p>
      </div>
    </div>
  );
}
