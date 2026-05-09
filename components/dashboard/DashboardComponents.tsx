import Link from "next/link";
import { 
  BookOpen, 
  Award, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  Flame, 
  Users,
  PlayCircle,
  ArrowRight,
  ChevronRight,
  GraduationCap,
  FileText,
  BellRing
} from "lucide-react";

export function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    emerald: { bg: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-100", iconBg: "bg-emerald-100 text-emerald-600" },
    blue: { bg: "bg-blue-50/50", text: "text-blue-700", border: "border-blue-100", iconBg: "bg-blue-100 text-blue-600" },
    indigo: { bg: "bg-indigo-50/50", text: "text-indigo-700", border: "border-indigo-100", iconBg: "bg-indigo-100 text-indigo-600" },
    amber: { bg: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100", iconBg: "bg-amber-100 text-amber-600" },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className={`${c.bg} p-4 rounded-xl border ${c.border} flex items-center gap-3 group hover:shadow-sm transition-all`}>
      <div className={`w-9 h-9 ${c.iconBg} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black text-slate-900 leading-none tabular-nums">{value} <span className={`text-xs font-bold ${c.text} opacity-70`}>{sub}</span></p>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function DashboardLink({ icon, title, href, color, bg, borderColor }: any) {
  return (
    <Link 
      href={href}
      className={`p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:${borderColor} transition-all group flex items-center gap-3 active:scale-95`}
    >
      <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
        {icon}
      </div>
      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{title}</span>
    </Link>
  );
}

export function QuickLinks() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <DashboardLink icon={<BookOpen size={18}/>} title="Materials" href="/materials" color="text-blue-600" bg="bg-blue-50" borderColor="border-blue-100" />
      <DashboardLink icon={<BellRing size={18}/>} title="Notices" href="#" color="text-rose-600" bg="bg-rose-50" borderColor="border-rose-100" />
      <DashboardLink icon={<Calendar size={18}/>} title="Calendar" href="/calendar" color="text-emerald-600" bg="bg-emerald-50" borderColor="border-emerald-100" />
      <DashboardLink icon={<FileText size={18}/>} title="Notes" href="/materials" color="text-amber-600" bg="bg-amber-50" borderColor="border-amber-100" />
    </div>
  );
}
