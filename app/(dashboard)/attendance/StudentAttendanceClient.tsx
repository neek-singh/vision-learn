"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Home, 
  ChevronRight, 
  ChevronLeft, 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  BarChart3, 
  Lightbulb, 
  Building, 
  MapPin, 
  GraduationCap, 
  Calendar as CalendarIcon,
  ShieldCheck,
  CheckSquare
} from "lucide-react";

export interface AttendanceRecord {
  id?: string;
  date: string;
  status: "present" | "late" | "absent" | "leave" | "not_held";
  topic?: string;
  module?: string;
  mode?: string;
  classroom?: string;
  teacher?: string;
  time?: string;
}

export default function StudentAttendanceClient({
  initialRecords = [],
  courseTitle = "My Course",
  batchName = "My Batch",
  batchTiming = "10:00 AM - 11:00 AM",
  facultyName = "Instructor"
}: {
  initialRecords: any[];
  courseTitle?: string;
  batchName?: string;
  batchTiming?: string;
  facultyName?: string;
}) {
  const router = useRouter();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // 1. Build 100% pure real attendance map from DB records
  const attendanceMap: Record<string, AttendanceRecord> = useMemo(() => {
    const map: Record<string, AttendanceRecord> = {};

    (initialRecords || []).forEach((r: any) => {
      const d = r.date ? r.date.split("T")[0] : "";
      if (d) {
        const rawStatus = (r.status || "present").toLowerCase().trim();
        let status: AttendanceRecord["status"] = "present";
        if (rawStatus === "absent") status = "absent";
        else if (rawStatus === "leave") status = "leave";
        else if (rawStatus === "late") status = "late";
        else if (rawStatus === "not_held") status = "not_held";

        map[d] = {
          id: r.id,
          date: d,
          status,
          topic: r.topic || r.remarks || "Class Lecture",
          module: r.courses?.title || courseTitle || "Module",
          mode: r.mode || "Offline",
          classroom: r.classroom || "Lab 1",
          teacher: r.teacher || facultyName,
          time: r.check_in_time || batchTiming
        };
      }
    });

    return map;
  }, [initialRecords, courseTitle, facultyName, batchTiming]);

  // Selected date state - default to latest real record in database or today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialRecords.length > 0 && initialRecords[0]?.date) {
      return initialRecords[0].date.split("T")[0];
    }
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  // 2. Pure dynamic statistics computed strictly from real records for the active month
  const stats = useMemo(() => {
    const recordsInMonth = Object.values(attendanceMap).filter(r => r.date.startsWith(monthPrefix));
    const present = recordsInMonth.filter(r => r.status === "present").length;
    const late = recordsInMonth.filter(r => r.status === "late").length;
    const absent = recordsInMonth.filter(r => r.status === "absent").length;
    const leave = recordsInMonth.filter(r => r.status === "leave").length;
    
    // Total classes held for this month
    const total = present + late + absent + leave;

    // Credit full attendance for present, and 0.5 for late
    const effectivePresent = present + (late * 0.5);
    const presentPct = total > 0 ? Math.round((effectivePresent / total) * 100) : 0;
    const absentPct = total > 0 ? Math.round((absent / total) * 100) : 0;
    const leavePct = total > 0 ? Math.round((leave / total) * 100) : 0;

    // All-time totals across all records
    const allRecords = Object.values(attendanceMap);
    const allTotal = allRecords.length;
    const allPresent = allRecords.filter(r => r.status === "present" || r.status === "late").length;
    const allTimePct = allTotal > 0 ? Math.round((allPresent / allTotal) * 100) : 0;

    return {
      present,
      late,
      absent,
      leave,
      total,
      presentPct,
      absentPct,
      leavePct,
      allTotal,
      allPresent,
      allTimePct
    };
  }, [attendanceMap, monthPrefix]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Calendar cells matrix calculation (5 weeks = 35 cells)
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      cells.push({
        dayNumber: d,
        dateStr: "",
        isCurrentMonth: false,
        status: null
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dayStr = String(d).padStart(2, "0");
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${dayStr}`;
      const rec = attendanceMap[dateStr];
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        status: rec ? rec.status : null
      });
    }

    // Next month padding (up to 35 or 42 cells)
    const targetLength = cells.length > 35 ? 42 : 35;
    const remaining = targetLength - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        dayNumber: d,
        dateStr: "",
        isCurrentMonth: false,
        status: null
      });
    }

    return cells;
  }, [currentYear, currentMonth, attendanceMap]);

  // Details for currently selected date (null if no class/record)
  const selectedRecord = useMemo<AttendanceRecord | null>(() => {
    return attendanceMap[selectedDate] || null;
  }, [attendanceMap, selectedDate]);

  // Formatted header for selected date, e.g. "21 Oct 2026 (Wed)"
  const formattedSelectedDateHeader = useMemo(() => {
    try {
      const d = new Date(selectedDate + "T00:00:00");
      const day = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const year = d.getFullYear();
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      return `${day} ${month} ${year} (${weekday})`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // 3. Real recent attendance table rows derived dynamically from database records
  const recentAttendanceRows = useMemo(() => {
    return (initialRecords || [])
      .slice(0, 8)
      .map((r: any) => {
        const dStr = r.date ? r.date.split("T")[0] : "";
        const d = dStr ? new Date(dStr + "T00:00:00") : new Date();
        const dateFormatted = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const dayOfWeek = d.toLocaleDateString("en-IN", { weekday: "short" });
        const rawStatus = (r.status || "present").toLowerCase();

        return {
          id: r.id || dStr,
          dateFormatted,
          dateStr: dStr,
          dayOfWeek,
          topic: r.topic || r.remarks || "Class Lecture",
          status: rawStatus === "late" ? "Late" : rawStatus === "absent" ? "Absent" : rawStatus === "leave" ? "Leave" : "Present",
          statusType: rawStatus,
          mode: r.mode || "Offline"
        };
      });
  }, [initialRecords]);

  // 4. Real course/subject-wise attendance breakdown
  const subjectAttendance = useMemo(() => {
    const groups: Record<string, { present: number; total: number }> = {};

    (initialRecords || []).forEach((r: any) => {
      const key = r.courses?.title || r.module || courseTitle || "General Curriculum";
      if (!groups[key]) groups[key] = { present: 0, total: 0 };
      groups[key].total++;
      const s = (r.status || "present").toLowerCase();
      if (s === "present" || s === "late") groups[key].present++;
    });

    return Object.entries(groups).map(([name, data]) => ({
      name,
      percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
      count: `${data.present} / ${data.total}`
    }));
  }, [initialRecords, courseTitle]);

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-300 pb-12">
      {/* 1. Breadcrumb navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/dashboard" className="hover:text-slate-800 flex items-center gap-1">
          <Home size={13} className="text-slate-400" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <Link href="/curriculum" className="hover:text-slate-800 truncate max-w-[140px] sm:max-w-none">
          <span>{courseTitle}</span>
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <span className="text-slate-800 font-semibold">Attendance</span>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        {/* Left Column (8 of 12 cols): Banner + 4 Metric Cards + Calendar & Day Details + Recent Attendance */}
        <div className="lg:col-span-8 space-y-3.5 sm:space-y-4">
          {/* 2. Hero Banner */}
          <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-blue-50/40 rounded-2xl border border-emerald-100/70 p-4 sm:p-5 flex items-center justify-between gap-4 relative overflow-hidden shadow-2xs">
            <div className="flex items-center gap-3 sm:gap-3.5 z-10 min-w-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-emerald-100/90 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <CalendarCheck size={22} className="stroke-[1.9]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 leading-tight">
                  Attendance Tracker
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-normal truncate">
                  Batch: <span className="font-semibold text-slate-700">{batchName}</span> • Timing: <span className="font-semibold text-slate-700">{batchTiming}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-600 font-medium">
                  <span className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Real Attendance Log
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md border border-emerald-100">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    Overall {stats.allTimePct}% Attendance
                  </span>
                </div>
              </div>
            </div>

            {/* Right Graphic */}
            <div className="hidden sm:flex items-center pr-2 shrink-0 opacity-90">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                <CalendarIcon size={24} />
              </div>
            </div>
          </div>

          {/* 3. Top 4 Metric Cards (2x2 grid on mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: Present */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
                <svg className="w-10 h-10 sm:w-11 sm:h-11 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-500 transition-all duration-500" strokeDasharray={`${stats.presentPct}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute text-[10px] sm:text-[11px] font-bold text-slate-800">{stats.presentPct}%</span>
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
                  {stats.present}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Present</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">of {stats.total} this month</div>
              </div>
            </div>

            {/* Card 2: Absent */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
                <svg className="w-10 h-10 sm:w-11 sm:h-11 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-rose-500 transition-all duration-500" strokeDasharray={`${stats.absentPct}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute text-[10px] sm:text-[11px] font-bold text-slate-800">{stats.absentPct}%</span>
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
                  {stats.absent}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Absent</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">missed classes</div>
              </div>
            </div>

            {/* Card 3: Leave / Late */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
                <svg className="w-10 h-10 sm:w-11 sm:h-11 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-amber-500 transition-all duration-500" strokeDasharray={`${stats.leavePct}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute text-[10px] sm:text-[11px] font-bold text-slate-800">{stats.leavePct}%</span>
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
                  {stats.leave}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Leave</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">approved leaves</div>
              </div>
            </div>

            {/* Card 4: Total Classes */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <FileText size={17} className="stroke-[1.9]" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
                  {stats.total}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Classes Held</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{monthNames[currentMonth]} {currentYear}</div>
              </div>
            </div>
          </div>

          {/* Monthly Attendance Grid (left) + Day Detail Card (right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
            {/* Card A: Monthly Attendance Calendar (7 cols on desktop) */}
            <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div>
                {/* Header: Monthly Attendance + Month Navigator */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <BarChart3 size={14} className="text-blue-600" />
                    <span>Monthly Attendance</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      title="Previous Month"
                      aria-label="Previous Month"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-800 px-1">
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      title="Next Month"
                      aria-label="Next Month"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Status Indicator Legend */}
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 py-2 text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Late</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Leave</span>
                  </div>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 text-center text-[10px] sm:text-[11px] font-semibold text-slate-400 py-1.5 border-b border-slate-100">
                  {dayNames.map(d => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                {/* Calendar Days Matrix (Compact on mobile) */}
                <div className="grid grid-cols-7 text-center pt-1 gap-y-0.5">
                  {calendarDays.map((cell, idx) => {
                    const isSelected = cell.dateStr === selectedDate;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (cell.isCurrentMonth && cell.dateStr) {
                            setSelectedDate(cell.dateStr);
                          }
                        }}
                        className={`h-9 sm:h-10 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer m-0.5 ${
                          cell.isCurrentMonth
                            ? isSelected
                              ? "bg-blue-50 border border-blue-300 text-blue-700 font-bold shadow-2xs"
                              : "hover:bg-slate-50 text-slate-700"
                            : "text-slate-300 pointer-events-none"
                        }`}
                      >
                        <span className="text-[11px] sm:text-xs leading-none">{cell.dayNumber}</span>
                        {/* Dot Indicator */}
                        {cell.isCurrentMonth && (
                          <div className="h-2 flex items-center justify-center mt-0.5">
                            {cell.status === "present" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                            {cell.status === "late" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            )}
                            {cell.status === "absent" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            )}
                            {cell.status === "leave" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card B: Selected Day Details Card (5 cols on desktop) */}
            <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                {/* Header: Date + Status Badge */}
                <div className="flex items-start justify-between pb-2.5 border-b border-slate-100 gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Selected Date
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                      {formattedSelectedDateHeader}
                    </div>
                  </div>

                  {selectedRecord ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      selectedRecord.status === "present"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                        : selectedRecord.status === "late"
                        ? "bg-amber-50 text-amber-700 border border-amber-200/70"
                        : selectedRecord.status === "absent"
                        ? "bg-rose-50 text-rose-700 border border-rose-200/70"
                        : selectedRecord.status === "leave"
                        ? "bg-blue-50 text-blue-700 border border-blue-200/70"
                        : "bg-slate-50 text-slate-600 border border-slate-200/70"
                    }`}>
                      {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-400 border border-slate-200/60 shrink-0">
                      No Record
                    </span>
                  )}
                </div>

                {selectedRecord ? (
                  <>
                    {/* Class Timing & Title */}
                    <div className="pt-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold">
                        <Clock size={12} />
                        <span>{selectedRecord.time || batchTiming}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 leading-snug">
                        {selectedRecord.topic}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {selectedRecord.module}
                      </p>
                    </div>

                    {/* Class Details List */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Session Details
                      </h5>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                            <Building size={12} /> Mode
                          </span>
                          <span className="font-medium text-slate-800 text-[11px]">{selectedRecord.mode || "Offline"}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                            <MapPin size={12} /> Classroom
                          </span>
                          <span className="font-medium text-slate-800 text-[11px]">{selectedRecord.classroom || "Lab 1"}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                            <GraduationCap size={12} /> Teacher
                          </span>
                          <span className="font-medium text-slate-800 text-[11px]">{selectedRecord.teacher || facultyName}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center space-y-1.5">
                    <CalendarCheck size={28} className="mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold text-slate-700">No Class Logged</p>
                    <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                      No attendance record was recorded for this date.
                    </p>
                  </div>
                )}
              </div>

              {/* Class Notes Button at bottom */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <FileText size={14} className="text-blue-600" />
                  <span>Module Notes</span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/materials")}
                  className="px-3 py-1 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-medium transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  View Notes
                </button>
              </div>
            </div>
          </div>

          {/* Card C: Recent Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                <CalendarIcon size={15} className="text-blue-600" />
                <span>Recent Attendance Logs</span>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {initialRecords.length} Total Records
              </span>
            </div>

            {recentAttendanceRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                      <th className="py-2.5 font-medium">Date</th>
                      <th className="py-2.5 font-medium">Day</th>
                      <th className="py-2.5 font-medium">Topic / Remarks</th>
                      <th className="py-2.5 font-medium">Status</th>
                      <th className="py-2.5 font-medium text-right">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentAttendanceRows.map((row, idx) => (
                      <tr 
                        key={idx}
                        onClick={() => setSelectedDate(row.dateStr)}
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer group ${
                          row.dateStr === selectedDate ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <td className="py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                          {row.dateFormatted}
                        </td>
                        <td className="py-2.5 text-slate-400 font-medium">
                          {row.dayOfWeek}
                        </td>
                        <td className="py-2.5 font-medium text-slate-800 truncate max-w-[180px] sm:max-w-[280px]">
                          {row.topic}
                        </td>
                        <td className="py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.statusType === "present"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                              : row.statusType === "late"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/70"
                              : row.statusType === "leave"
                              ? "bg-blue-50 text-blue-700 border border-blue-200/70"
                              : "bg-rose-50 text-rose-700 border border-rose-200/70"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-slate-500 font-medium">
                          {row.mode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No attendance logs found for this student.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (4 of 12 cols): Summary, Subject-wise, Tip Card */}
        <div className="lg:col-span-4 space-y-3.5 sm:space-y-4">
          {/* Card 1: Attendance Summary (100% Real) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
              <BarChart3 size={15} className="text-blue-600" />
              <span>Attendance Summary</span>
            </div>

            {/* Large Gauge & Main Count */}
            <div className="flex items-center gap-4 py-1">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path 
                    className="text-emerald-500 transition-all duration-500" 
                    strokeDasharray={`${stats.presentPct}, 100`} 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    stroke="currentColor" 
                    fill="none" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-slate-900">{stats.presentPct}%</span>
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
                  {stats.present} / {stats.total}
                </div>
                <div className="text-xs text-slate-400 mt-1">Classes Attended this Month</div>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 font-medium">Present</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">{stats.present}</span>
                  <span className="text-slate-400 w-8 text-right font-medium">{stats.presentPct}%</span>
                </div>
              </div>

              {stats.late > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-slate-600 font-medium">Late</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">{stats.late}</span>
                    <span className="text-slate-400 w-8 text-right font-medium">
                      {stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-slate-600 font-medium">Absent</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">{stats.absent}</span>
                  <span className="text-slate-400 w-8 text-right font-medium">{stats.absentPct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-slate-600 font-medium">Leave</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">{stats.leave}</span>
                  <span className="text-slate-400 w-8 text-right font-medium">{stats.leavePct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Real Subject-wise Attendance */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
              <BarChart3 size={15} className="text-blue-600" />
              <span>Subject Attendance</span>
            </div>

            {subjectAttendance.length > 0 ? (
              <div className="space-y-3">
                {subjectAttendance.map((subj, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate pr-2">{subj.name}</span>
                      <div className="flex items-center gap-2 font-medium shrink-0">
                        <span className="text-blue-600 font-bold">{subj.percentage}%</span>
                        <span className="text-slate-400 text-[11px]">{subj.count}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${subj.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2 text-center">
                No subject breakdown available yet.
              </p>
            )}
          </div>

          {/* Card 3: Attendance Guidance Tip */}
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 shadow-2xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Lightbulb size={16} className="stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Attendance Requirement
              </h4>
              <p className="text-[11px] text-amber-900/80 mt-0.5 leading-relaxed">
                Maintain at least 75% attendance to remain eligible for practical certificates and final module examinations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
