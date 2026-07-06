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
    purple: { bg: "bg-purple-50/50", text: "text-purple-700", border: "border-purple-100", iconBg: "bg-purple-100 text-purple-600" },
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
      <DashboardLink icon={<BellRing size={18}/>} title="Notices" href="/notifications" color="text-rose-600" bg="bg-rose-50" borderColor="border-rose-100" />
      <DashboardLink icon={<Calendar size={18}/>} title="Calendar" href="/calendar" color="text-emerald-600" bg="bg-emerald-50" borderColor="border-emerald-100" />
      <DashboardLink icon={<FileText size={18}/>} title="Notes" href="/materials" color="text-amber-600" bg="bg-amber-50" borderColor="border-amber-100" />
    </div>
  );
}

export function UpcomingEvents({ events }: { events: any[] }) {
  if (events.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={16} className="text-indigo-600" />
          Upcoming Schedule
        </h3>
        <Link href="/calendar" className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {events.slice(0, 3).map((event, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all">
            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${
              event.type === 'test' ? 'bg-rose-50 text-rose-600' : 
              event.type === 'assignment' ? 'bg-amber-50 text-amber-600' :
              event.type === 'holiday' ? 'bg-rose-50 text-rose-600' :
              event.type === 'event' ? 'bg-purple-50 text-purple-600' :
              'bg-indigo-50 text-indigo-600'
            }`}>
              <span className="text-[10px] font-black uppercase">{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="text-sm font-black leading-none">{new Date(event.event_date).getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{event.title}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                {event.type === 'test' ? 'Exam' : 
                 event.type === 'assignment' ? 'Note' : 
                 event.type === 'holiday' ? 'Holiday' :
                 event.type === 'event' ? 'Event' : 'Class'}
                {event.type !== 'holiday' && event.type !== 'event' && ` • ${event.start_time || 'Full Day'}`}
              </p>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentActivity({ activities }: { activities: any[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
        <TrendingUp size={16} className="text-emerald-600" />
        Recent Progress
      </h3>
      <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium italic text-center py-4">No recent activity yet.</p>
        ) : activities.map((activity, i) => (
          <div key={i} className="relative pl-8 group">
            <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center z-10 shadow-sm group-hover:scale-110 transition-transform">
              <CheckCircle2 size={12} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight mb-0.5">{activity.title}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Completed on {new Date(activity.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export function NoticeBoard({ notifications }: { notifications: any[] }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-100 overflow-hidden relative group animate-in slide-in-from-top-4 duration-500">
       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <BellRing size={80} />
       </div>
       <div className="relative z-10 flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/10">
             <BellRing size={20} className="animate-bounce" />
          </div>
          <div className="min-w-0 flex-1">
             <div className="flex items-center gap-2 mb-0.5">
               <span className="px-1.5 py-0.5 bg-white text-indigo-600 rounded text-[8px] font-black uppercase tracking-widest">Notice</span>
               <h4 className="text-sm font-bold truncate">{notifications[0].notifications?.title}</h4>
             </div>
             <p className="text-xs text-indigo-100 truncate opacity-90">{notifications[0].notifications?.message}</p>
          </div>
          <Link 
            href="/notifications" 
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-sm border border-white/10 shrink-0"
          >
            View All
          </Link>
       </div>
    </div>
  );
}

export function StreakWidget({ streak }: { streak: number }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all">
       <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Streak</p>
          <div className="flex items-baseline gap-2">
             <h4 className="text-3xl font-black text-slate-900 tabular-nums">{streak}</h4>
             <span className="text-xs font-bold text-slate-500">Days</span>
          </div>
       </div>
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
         streak > 0 ? 'bg-orange-50 text-orange-500 rotate-6 scale-110 shadow-lg shadow-orange-100' : 'bg-slate-50 text-slate-300'
       }`}>
          <Flame size={28} fill={streak > 0 ? "currentColor" : "none"} className={streak > 0 ? "animate-pulse" : ""} />
       </div>
    </div>
  );
}
