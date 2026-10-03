"use client";

import { useState, useMemo } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  Sparkles,
  Layers,
  ChevronDown
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "late" | "absent";
  courses?: {
    title?: string;
  };
}

export default function StudentAttendanceClient({ initialRecords = [] }: { initialRecords: AttendanceRecord[] }) {
  const [filter, setFilter] = useState<"all" | "present" | "late" | "absent">("all");
  const [displayCount, setDisplayCount] = useState<number>(20);

  const stats = useMemo(() => {
    if (initialRecords.length === 0) {
      return { percentage: 0, present: 0, absent: 0, late: 0, total: 0 };
    }
    
    const present = initialRecords.filter(r => r.status === "present").length;
    const late = initialRecords.filter(r => r.status === "late").length;
    const absent = initialRecords.filter(r => r.status === "absent").length;
    const total = initialRecords.length;
    
    // Late counts as 0.5 present for percentage calculation
    const percentage = Math.round(((present + (late * 0.5)) / total) * 100);
    
    return { percentage, present, absent, late, total };
  }, [initialRecords]);

  const filteredRecords = useMemo(() => {
    if (filter === "all") return initialRecords;
    return initialRecords.filter(r => r.status === filter);
  }, [initialRecords, filter]);

  const visibleRecords = useMemo(() => {
    return filteredRecords.slice(0, displayCount);
  }, [filteredRecords, displayCount]);

  const formatDateParts = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return { month: "---", day: "--", full: dateString };
    }
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate();
    const full = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return { month, day, full };
  };

  // Status helper configuration
  const getStatusBadge = (status: "present" | "late" | "absent") => {
    switch (status) {
      case "present":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>Present</span>
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock size={12} className="text-amber-500" />
            <span>Late</span>
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            <XCircle size={12} className="text-rose-500" />
            <span>Absent</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-3.5">
      {/* ── Compact Unified Overview Card ── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        {/* Top Tier: Percentage + Circular Ring + Consistency Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Overall Attendance
              </span>
              {stats.percentage >= 75 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Consistent Learner
                </span>
              ) : stats.percentage >= 50 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Average
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Needs Attention
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {stats.percentage}%
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                ({stats.present + stats.late} of {stats.total} sessions)
              </span>
            </div>
          </div>

          {/* Mini Circular Progress Ring */}
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={
                  stats.percentage >= 75
                    ? "text-emerald-500"
                    : stats.percentage >= 50
                    ? "text-amber-500"
                    : "text-rose-500"
                }
                strokeDasharray={`${stats.percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <Sparkles size={14} className="absolute text-slate-400" />
          </div>
        </div>

        {/* Visual Progress Bar (Proportional breakdown) */}
        {stats.total > 0 && (
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {stats.present > 0 && (
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${(stats.present / stats.total) * 100}%` }}
                title={`Present: ${stats.present}`}
              />
            )}
            {stats.late > 0 && (
              <div 
                className="bg-amber-400 h-full transition-all duration-500" 
                style={{ width: `${(stats.late / stats.total) * 100}%` }}
                title={`Late: ${stats.late}`}
              />
            )}
            {stats.absent > 0 && (
              <div 
                className="bg-rose-500 h-full transition-all duration-500" 
                style={{ width: `${(stats.absent / stats.total) * 100}%` }}
                title={`Absent: ${stats.absent}`}
              />
            )}
          </div>
        )}

        {/* Micro 4-Column Metric Strip */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 bg-slate-50/70 rounded-xl border border-slate-200/60 py-2 px-1 text-center">
          <div className="px-1 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Present
            </span>
            <span className="text-sm font-black text-slate-900 mt-0.5">{stats.present}</span>
          </div>

          <div className="px-1 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Late
            </span>
            <span className="text-sm font-black text-slate-900 mt-0.5">{stats.late}</span>
          </div>

          <div className="px-1 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              Absent
            </span>
            <span className="text-sm font-black text-slate-900 mt-0.5">{stats.absent}</span>
          </div>

          <div className="px-1 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
              Total
            </span>
            <span className="text-sm font-black text-slate-900 mt-0.5">{stats.total}</span>
          </div>
        </div>
      </div>

      {/* ── Attendance Records Section ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Header with Compact Filter Tabs */}
        <div className="p-3 sm:px-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Records History</h3>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredRecords.length}
            </span>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                filter === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter("present")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                filter === "present"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              Present ({stats.present})
            </button>
            <button
              onClick={() => setFilter("late")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                filter === "late"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
              }`}
            >
              Late ({stats.late})
            </button>
            <button
              onClick={() => setFilter("absent")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                filter === "absent"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
              }`}
            >
              Absent ({stats.absent})
            </button>
          </div>
        </div>

        {/* Unified List View (Mobile & Desktop) */}
        {visibleRecords.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Calendar size={18} />
            </div>
            <p className="text-xs font-bold text-slate-600">No attendance records found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {filter !== "all" ? `No records with status "${filter}"` : "You have no logged sessions yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleRecords.map((record) => {
              const { month, day, full } = formatDateParts(record.date);
              return (
                <div
                  key={record.id}
                  className="px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Compact Date Box */}
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/50 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[8px] font-black uppercase tracking-tight text-slate-400 leading-none">
                        {month}
                      </span>
                      <span className="text-xs font-black text-slate-800 leading-none mt-0.5">
                        {day}
                      </span>
                    </div>

                    {/* Record Details */}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {full}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium truncate">
                        {record.courses?.title || "General Batch"}
                      </p>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="shrink-0">
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button if Records > displayCount */}
        {filteredRecords.length > displayCount && (
          <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50">
            <button
              onClick={() => setDisplayCount((prev) => prev + 20)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 py-1 px-3 rounded-lg hover:bg-indigo-50/80 transition-all"
            >
              <span>Show More ({filteredRecords.length - displayCount} remaining)</span>
              <ChevronDown size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
