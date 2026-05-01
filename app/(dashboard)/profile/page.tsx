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

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="flex flex-col md:flex-row items-center gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 opacity-50" />
        
        <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-indigo-200 relative z-10 shrink-0">
          {student?.name?.charAt(0) || "S"}
        </div>
        
        <div className="relative z-10 text-center md:text-left space-y-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">{student?.name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-1">
            <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-indigo-100">
              {student?.student_id}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <User size={18} className="text-indigo-600" /> Personal Details
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Email Address</p>
                <p className="text-xs font-bold text-slate-700">{student?.email || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                <Phone size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Phone Number</p>
                <p className="text-xs font-bold text-slate-700">{student?.phone || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Join Date</p>
                <p className="text-xs font-bold text-slate-700">
                  {student?.created_at ? new Date(student.created_at).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Shield size={18} className="text-indigo-600" /> Academic Details
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                <BookOpen size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Active Course</p>
                <p className="text-xs font-bold text-slate-700">{student?.course}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                <IdCard size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Student Portal ID</p>
                <p className="text-xs font-bold text-slate-700">{student?.student_id}</p>
              </div>
            </div>

            <button className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black rounded-xl transition-all border border-slate-100 text-xs">
              <Settings size={16} />
              Account Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
