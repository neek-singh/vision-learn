"use client";

import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  Filter,
  BarChart3,
  Award
} from "lucide-react";
import { useMemo } from "react";

export default function StudentAttendanceClient({ initialRecords }: { initialRecords: any[] }) {
  
  const stats = useMemo(() => {
    if (initialRecords.length === 0) return { percentage: 0, present: 0, absent: 0, late: 0 };
    
    const present = initialRecords.filter(r => r.status === 'present').length;
    const late = initialRecords.filter(r => r.status === 'late').length;
    const absent = initialRecords.filter(r => r.status === 'absent').length;
    
    // Late counts as 0.5 present for percentage calculation (custom logic)
    const percentage = Math.round(((present + (late * 0.5)) / initialRecords.length) * 100);
    
    return { percentage, present, absent, late };
  }, [initialRecords]);

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 flex items-center justify-between overflow-hidden relative group">
           <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Award size={160} />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em] mb-2">Total Attendance</p>
              <h2 className="text-5xl font-black">{stats.percentage}%</h2>
              <div className="mt-4 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 <span className="text-xs font-bold text-indigo-50">Consistent Learner</span>
              </div>
           </div>
           <div className="relative z-10 hidden sm:block">
              <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center">
                 <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                    <CheckCircle2 size={32} />
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-center gap-3">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Present</span>
              </div>
              <span className="text-lg font-black text-slate-900">{stats.present}</span>
           </div>
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Late</span>
              </div>
              <span className="text-lg font-black text-slate-900">{stats.late}</span>
           </div>
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-rose-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absent</span>
              </div>
              <span className="text-lg font-black text-slate-900">{stats.absent}</span>
           </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group">
           <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
              <BarChart3 size={24} />
           </div>
           <p className="text-2xl font-black text-slate-900">{initialRecords.length}</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessions Tracked</p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-lg font-black text-slate-900">Attendance History</h3>
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latest Records</span>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Course / Batch</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {initialRecords.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold">
                    No attendance records found yet.
                  </td>
                </tr>
              ) : initialRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                          <Calendar size={16} />
                       </div>
                       <p className="font-bold text-slate-900 text-sm">
                          {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                       </p>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm font-bold text-slate-600">{record.courses?.title || 'General'}</p>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex justify-center">
                       {record.status === 'present' && (
                         <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={12} /> Present
                         </div>
                       )}
                       {record.status === 'absent' && (
                         <div className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <XCircle size={12} /> Absent
                         </div>
                       )}
                       {record.status === 'late' && (
                         <div className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} /> Late
                         </div>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
