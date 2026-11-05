"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  FileText, 
  FolderCode, 
  HelpCircle, 
  CircleDot, 
  Home, 
  MoreVertical,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  X,
  Download,
  Sparkles,
  BookOpen
} from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  type: "class" | "assignment" | "test" | "project" | "other" | string;
  event_date: string; // YYYY-MM-DD
  start_time?: string;
  end_time?: string;
  module?: string;
  description?: string;
  link?: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; dotClass: string; badgeClass: string; iconBg: string; textColor: string }> = {
  class: {
    label: "Live Class",
    dotClass: "bg-blue-600",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/80",
    iconBg: "bg-blue-50 text-blue-600 border-blue-200/70",
    textColor: "text-blue-600",
  },
  assignment: {
    label: "Assignment",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200/70",
    textColor: "text-emerald-600",
  },
  test: {
    label: "Test",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
    iconBg: "bg-amber-50 text-amber-600 border-amber-200/70",
    textColor: "text-amber-600",
  },
  project: {
    label: "Project",
    dotClass: "bg-purple-600",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80",
    iconBg: "bg-purple-50 text-purple-600 border-purple-200/70",
    textColor: "text-purple-600",
  },
  holiday: {
    label: "Holiday",
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
    iconBg: "bg-rose-50 text-rose-600 border-rose-200/70",
    textColor: "text-rose-600",
  },
  other: {
    label: "Other",
    dotClass: "bg-slate-400",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200/80",
    iconBg: "bg-slate-50 text-slate-600 border-slate-200/70",
    textColor: "text-slate-600",
  },
};

function formatDisplayTime(timeStr?: string): string {
  if (!timeStr) return "";
  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeStr;
}

function getCategoryConfig(type: string = "") {
  const t = type.toLowerCase().trim();
  if (t === "live class" || t === "class" || t === "lecture" || t === "video") return CATEGORY_CONFIG.class;
  if (t === "assignment" || t === "practical") return CATEGORY_CONFIG.assignment;
  if (t === "test" || t === "quiz" || t === "mcq") return CATEGORY_CONFIG.test;
  if (t === "project") return CATEGORY_CONFIG.project;
  if (t === "holiday" || t === "vacation" || t === "break") return CATEGORY_CONFIG.holiday;
  return CATEGORY_CONFIG.other;
}

export default function CalendarClient({ 
  initialEvents = [], 
  courseTitle = "Web Development" 
}: { 
  initialEvents: any[]; 
  courseTitle?: string; 
}) {
  const router = useRouter();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  
  // Interactive Modals
  const [activeJoinModal, setActiveJoinModal] = useState<any>(null);
  const [activeViewModal, setActiveViewModal] = useState<any>(null);
  const [showViewAllSchedule, setShowViewAllSchedule] = useState(false);
  const [showCalendarExportMenu, setShowCalendarExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Format today's date string
  const todayStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [now]);

  // Selected date state - default to today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Dynamic Events parsed 100% from real database initialEvents
  const allEvents = useMemo(() => {
    if (!initialEvents || initialEvents.length === 0) {
      return [];
    }

    return initialEvents.map((e, idx) => ({
      id: e.id || `dbev-${idx}`,
      title: e.title || "Scheduled Session",
      type: (e.type || "class").toLowerCase().trim(),
      event_date: e.event_date || e.date || todayStr,
      start_time: e.start_time ? formatDisplayTime(e.start_time) : "10:00 AM",
      end_time: e.end_time ? formatDisplayTime(e.end_time) : "11:00 AM",
      module: e.courses?.title || e.module || e.description || "Course Schedule",
      description: e.description || ""
    }));
  }, [initialEvents, todayStr]);

  // Filtered by Category
  const filteredEvents = useMemo(() => {
    if (activeCategoryFilter === "all") return allEvents;
    return allEvents.filter(e => {
      const cfg = getCategoryConfig(e.type);
      return cfg.label.toLowerCase().includes(activeCategoryFilter.toLowerCase());
    });
  }, [allEvents, activeCategoryFilter]);

  // Calendar cells matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        events: filteredEvents.filter(e => e.event_date === dateStr)
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        events: filteredEvents.filter(e => e.event_date === dateStr)
      });
    }

    // Next month days
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        events: filteredEvents.filter(e => e.event_date === dateStr)
      });
    }

    return cells;
  }, [currentYear, currentMonth, filteredEvents]);

  // Selected Day Timeline Events (pure dynamic based on selectedDate)
  const selectedDayEvents = useMemo(() => {
    return allEvents.filter(e => e.event_date === selectedDate);
  }, [allEvents, selectedDate]);

  // Selected week days for Week View
  const selectedWeekDays = useMemo(() => {
    const sel = new Date(selectedDate + "T00:00:00");
    const dayOfWeek = sel.getDay(); // 0 is Sunday
    const sunday = new Date(sel);
    sunday.setDate(sel.getDate() - dayOfWeek);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      week.push({
        dateObj: d,
        dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        events: filteredEvents.filter(e => e.event_date === dateStr)
      });
    }
    return week;
  }, [selectedDate, filteredEvents, todayStr]);

  // Next 7 Days Schedule from selected date or current date
  const next7DaysSchedule = useMemo(() => {
    const baseDate = new Date(selectedDate + "T00:00:00");
    const scheduleItems: any[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayMatches = allEvents.filter(e => e.event_date === dateStr);

      dayMatches.forEach(ev => {
        scheduleItems.push({
          id: ev.id,
          dateFormatted: `${d.getDate()} ${monthNames[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`,
          dayOfWeek: dayNames[d.getDay()],
          timeFormatted: `${ev.start_time || "10:00 AM"}${ev.end_time ? ` - ${ev.end_time}` : ""}`,
          type: ev.type,
          title: ev.title,
          module: ev.module || "Module 2",
          action: ev.type === "class" ? "Join" : "View",
          originalEvent: ev
        });
      });
    }

    return scheduleItems;
  }, [selectedDate, allEvents, monthNames, dayNames]);

  // Upcoming Events list on right card (derived 100% from real database events from today onwards)
  const upcomingEventsList = useMemo(() => {
    return allEvents
      .filter((ev) => ev.event_date >= todayStr)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .slice(0, 6)
      .map((ev) => {
        let dateFormatted = ev.event_date;
        try {
          const [y, m, d] = ev.event_date.split("-").map(Number);
          const dt = new Date(y, m - 1, d);
          dateFormatted = dt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
        } catch {}

        return {
          id: ev.id,
          dateStr: ev.event_date,
          dateFormatted,
          timeFormatted: ev.start_time || "10:00 AM",
          title: ev.title,
          type: ev.type,
          module: ev.module
        };
      });
  }, [allEvents, todayStr]);

  // Handlers for month navigation
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

  const handleGoToToday = () => {
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDate(todayStr);
    setToastMessage(`Jumped to today: ${todayStr}`);
  };

  const formattedSelectedDateHeader = useMemo(() => {
    try {
      const d = new Date(selectedDate + "T00:00:00");
      return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "Thu, 15 Oct 2026";
    }
  }, [selectedDate]);

  // Google Calendar Link / .ICS Download
  const handleDownloadIcs = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Vision Learn//Student Calendar//EN\n";
    allEvents.forEach((ev) => {
      const cleanDate = ev.event_date.replace(/-/g, "");
      icsContent += `BEGIN:VEVENT\nSUMMARY:${ev.title}\nDESCRIPTION:${ev.module || "Vision Learn"}\nDTSTART:${cleanDate}T100000Z\nDTEND:${cleanDate}T110000Z\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `vision-learn-schedule-${monthNames[currentMonth].toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowCalendarExportMenu(false);
    setToastMessage("Calendar (.ics) downloaded successfully!");
  };

  const handleOpenGoogleWebCalendar = () => {
    const title = encodeURIComponent("Vision Learn Class Schedule");
    const details = encodeURIComponent("Check your classes and deadlines on Vision Learn");
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(googleUrl, "_blank", "noopener,noreferrer");
    setShowCalendarExportMenu(false);
  };

  // Action Click Handler
  const handleActionClick = (item: any) => {
    if (item.action === "Join" || item.type === "class") {
      setActiveJoinModal({
        title: item.title,
        module: item.module,
        time: item.timeFormatted || "10:00 AM - 11:00 AM",
        date: item.dateFormatted || formattedSelectedDateHeader
      });
    } else {
      setActiveViewModal({
        title: item.title,
        module: item.module,
        type: item.type,
        time: item.timeFormatted || "11:00 AM",
        date: item.dateFormatted || formattedSelectedDateHeader
      });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[120] bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Breadcrumb navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-slate-800 flex items-center gap-1">
          <Home size={13} className="text-slate-400" />
          <span>My Courses</span>
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <Link href="/curriculum" className="hover:text-slate-800">
          <span>{courseTitle}</span>
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <span className="text-slate-800 font-semibold">Calendar</span>
      </div>

      {/* 2. Learning Calendar Hero Banner */}
      <div className="bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-blue-50/40 rounded-2xl border border-purple-100/70 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden shadow-2xs">
        {/* Left: Icon + Text */}
        <div className="flex items-start sm:items-center gap-3.5 z-10">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-purple-100/90 border border-purple-200/80 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CalendarIcon size={26} className="stroke-[1.9]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              Learning Calendar
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Your class schedule, live sessions, tests, assignments and important dates.
            </p>

            {/* Interactive Category Dots Legend */}
            <div className="flex items-center gap-2 sm:gap-2.5 mt-2.5 text-xs text-slate-600 font-medium overflow-x-auto no-scrollbar py-0.5 max-w-full">
              <button
                onClick={() => setActiveCategoryFilter("all")}
                className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === "all" ? "bg-slate-900 text-white font-semibold shadow-2xs" : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200/70"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveCategoryFilter(activeCategoryFilter === "class" ? "all" : "class")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === "class" ? "bg-blue-600 text-white font-semibold shadow-2xs" : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200/70"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeCategoryFilter === "class" ? "bg-white" : "bg-blue-600"} shrink-0`} />
                <span>Live Class</span>
              </button>
              <button
                onClick={() => setActiveCategoryFilter(activeCategoryFilter === "assignment" ? "all" : "assignment")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === "assignment" ? "bg-emerald-600 text-white font-semibold shadow-2xs" : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200/70"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeCategoryFilter === "assignment" ? "bg-white" : "bg-emerald-500"} shrink-0`} />
                <span>Assignment</span>
              </button>
              <button
                onClick={() => setActiveCategoryFilter(activeCategoryFilter === "test" ? "all" : "test")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === "test" ? "bg-amber-600 text-white font-semibold shadow-2xs" : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200/70"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeCategoryFilter === "test" ? "bg-white" : "bg-amber-500"} shrink-0`} />
                <span>Test</span>
              </button>
              <button
                onClick={() => setActiveCategoryFilter(activeCategoryFilter === "holiday" ? "all" : "holiday")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === "holiday" ? "bg-rose-600 text-white font-semibold shadow-2xs" : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200/70"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeCategoryFilter === "holiday" ? "bg-white" : "bg-rose-500"} shrink-0`} />
                <span>Holiday</span>
              </button>
              <button
                onClick={() => setActiveCategoryFilter(activeCategoryFilter === "project" ? "all" : "project")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === "project" ? "bg-purple-600 text-white font-semibold shadow-2xs" : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200/70"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeCategoryFilter === "project" ? "bg-white" : "bg-purple-600"} shrink-0`} />
                <span>Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Graphic & Add to Google Calendar Action */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-end z-10 shrink-0 relative">
          {/* Subtle calendar illustration */}
          <div className="hidden lg:flex items-center opacity-85 pr-2">
            <svg className="w-24 h-14" viewBox="0 0 120 70" fill="none">
              <rect x="20" y="8" width="50" height="44" rx="7" fill="#EEF2FF" stroke="#818CF8" strokeWidth="1.8" />
              <rect x="20" y="8" width="50" height="12" rx="5" fill="#6366F1" />
              <circle cx="28" cy="14" r="1.8" fill="white" />
              <circle cx="36" cy="14" r="1.8" fill="white" />
              <circle cx="62" cy="14" r="1.8" fill="white" />
              <circle cx="32" cy="30" r="2.2" fill="#6366F1" />
              <circle cx="45" cy="30" r="2.2" fill="#A5B4FC" />
              <circle cx="58" cy="30" r="2.2" fill="#A5B4FC" />
              <circle cx="32" cy="40" r="2.2" fill="#A5B4FC" />
              <circle cx="45" cy="40" r="2.2" fill="#10B981" />
              <circle cx="58" cy="40" r="2.2" fill="#F59E0B" />
              <circle cx="12" cy="38" r="9" fill="#FFFFFF" stroke="#6366F1" strokeWidth="1.6" />
              <path d="M12 32V38L15 40" stroke="#6366F1" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M82 40C82 40 85 32 89 32C93 32 96 40 96 40" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M89 32V44" stroke="#059669" strokeWidth="1.8" />
              <path d="M84 44H94L92 52H86L84 44Z" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.4" />
            </svg>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowCalendarExportMenu(!showCalendarExportMenu)}
              className="bg-white hover:bg-slate-50 border border-blue-400 text-blue-600 rounded-xl px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <CalendarIcon size={14} className="text-blue-600" />
              <span>Add to Google Calendar</span>
              <ChevronDown size={12} className="text-blue-500" />
            </button>

            {/* Dropdown Menu */}
            {showCalendarExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={handleOpenGoogleWebCalendar}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ExternalLink size={13} className="text-blue-600" />
                  <span>Open in Google Calendar</span>
                </button>
                <button
                  onClick={handleDownloadIcs}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                >
                  <Download size={13} className="text-emerald-600" />
                  <span>Download .ICS (Apple/Outlook)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 of 12 cols): Month Calendar & Next 7 Days Schedule */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card A: Calendar View */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            {/* Header: < Month Year > | [Month] [Week] [Day] | [Today] */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>

                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {monthNames[currentMonth]} {currentYear}
                </h2>

                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* View Switcher & Today button */}
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-slate-200/80 bg-white p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => setViewMode("month")}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      viewMode === "month"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode("week")}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      viewMode === "week"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setViewMode("day")}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      viewMode === "day"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Day
                  </button>
                </div>

                <button
                  onClick={handleGoToToday}
                  className="px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  Today
                </button>
              </div>
            </div>

            {/* MONTH VIEW */}
            {viewMode === "month" && (
              <>
                {/* Weekday labels */}
                <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500 py-2.5 border-b border-slate-100">
                  {dayNames.map((day) => (
                    <div key={day} className="py-0.5">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Cells Matrix */}
                <div className="grid grid-cols-7 border-l border-t border-slate-100">
                  {calendarDays.map((cell, idx) => {
                    const isSelected = cell.dateStr === selectedDate;
                    const isToday = cell.dateStr === todayStr;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (cell.isCurrentMonth) {
                            setSelectedDate(cell.dateStr);
                          }
                        }}
                        className={`min-h-[52px] sm:min-h-[85px] p-1 sm:p-2 border-r border-b border-slate-100 transition-all flex flex-col justify-between ${
                          cell.isCurrentMonth
                            ? isSelected
                              ? "bg-blue-50/40 ring-2 ring-inset ring-blue-500/80 cursor-pointer z-10"
                              : "bg-white hover:bg-slate-50/70 cursor-pointer"
                            : "bg-slate-50/40 text-slate-300 pointer-events-none"
                        }`}
                      >
                        {/* Top Row: Date Number */}
                        <div className="flex items-center justify-between">
                          {isSelected ? (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center shadow-2xs">
                              {cell.dayNumber}
                            </div>
                          ) : isToday ? (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-900 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center shadow-2xs">
                              {cell.dayNumber}
                            </div>
                          ) : (
                            <span className={`text-[11px] sm:text-xs font-medium ${cell.isCurrentMonth ? "text-slate-700" : "text-slate-300"}`}>
                              {cell.dayNumber}
                            </span>
                          )}
                        </div>

                        {/* Events list in cell */}
                        <div className="space-y-1 mt-0.5 sm:mt-1">
                          {/* Desktop / tablet badges */}
                          <div className="hidden sm:block space-y-1">
                            {cell.events.slice(0, 2).map((ev) => {
                              const cfg = getCategoryConfig(ev.type);
                              return (
                                <div
                                  key={ev.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDate(cell.dateStr);
                                    handleActionClick({
                                      title: ev.title,
                                      module: ev.module,
                                      type: ev.type,
                                      action: ev.type === "class" ? "Join" : "View"
                                    });
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 truncate cursor-pointer hover:brightness-95 transition-all ${cfg.badgeClass}`}
                                  title={`${ev.title} (${cfg.label})`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass}`} />
                                  <span className="truncate">{ev.title}</span>
                                </div>
                              );
                            })}
                            {cell.events.length > 2 && (
                              <span className="text-[9px] font-semibold text-slate-400 block px-1">
                                +{cell.events.length - 2} more
                              </span>
                            )}
                          </div>

                          {/* Mobile-only compact dots */}
                          <div className="flex sm:hidden items-center justify-center gap-1 py-1 flex-wrap">
                            {cell.events.slice(0, 3).map((ev) => {
                              const cfg = getCategoryConfig(ev.type);
                              return (
                                <span
                                  key={ev.id}
                                  className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`}
                                  title={ev.title}
                                />
                              );
                            })}
                            {cell.events.length > 3 && (
                              <span className="text-[8px] font-bold text-slate-400">
                                +{cell.events.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* WEEK VIEW */}
            {viewMode === "week" && (
              <div className="pt-3 overflow-x-auto no-scrollbar">
                <div className="grid grid-cols-7 gap-2 min-w-[560px] sm:min-w-0">
                  {selectedWeekDays.map((col, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(col.dateStr)}
                      className={`min-h-[220px] rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer ${
                        col.isSelected 
                          ? "border-blue-500 bg-blue-50/20 shadow-xs ring-1 ring-blue-500" 
                          : "border-slate-200/80 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="border-b border-slate-100 pb-2 text-center">
                        <div className="text-[11px] font-medium text-slate-400">{col.dayName}</div>
                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs mt-0.5 ${
                          col.isSelected ? "bg-blue-600 text-white" : col.isToday ? "bg-slate-900 text-white" : "text-slate-800"
                        }`}>
                          {col.dayNumber}
                        </div>
                      </div>

                      <div className="space-y-1.5 my-2 flex-1">
                        {col.events.map((ev) => {
                          const cfg = getCategoryConfig(ev.type);
                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick({
                                  title: ev.title,
                                  module: ev.module,
                                  type: ev.type,
                                  action: ev.type === "class" ? "Join" : "View"
                                });
                              }}
                              className={`p-1.5 rounded-lg border text-[10px] font-medium leading-tight ${cfg.badgeClass}`}
                            >
                              <div className="font-semibold truncate">{ev.title}</div>
                              <div className="text-[9px] text-slate-500 mt-0.5">{ev.start_time}</div>
                            </div>
                          );
                        })}
                        {col.events.length === 0 && (
                          <div className="text-[10px] text-slate-300 text-center py-6">No events</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DAY VIEW */}
            {viewMode === "day" && (
              <div className="pt-3 divide-y divide-slate-100">
                <div className="py-2 flex items-center justify-between text-xs font-semibold text-slate-600 pb-3">
                  <span>Day Schedule for {formattedSelectedDateHeader}</span>
                  <span className="text-[11px] text-blue-600">{selectedDayEvents.length} events scheduled</span>
                </div>
                {["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "04:00 PM", "05:00 PM"].map((slot) => {
                  const slotEvents = selectedDayEvents.filter(e => (e.start_time || "").includes(slot.slice(0, 5)));
                  return (
                    <div key={slot} className="py-3 flex items-start gap-4">
                      <div className="w-16 shrink-0 text-xs font-semibold text-slate-400 pt-1">{slot}</div>
                      <div className="flex-1 space-y-2">
                        {slotEvents.map(ev => {
                          const cfg = getCategoryConfig(ev.type);
                          return (
                            <div key={ev.id} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${cfg.badgeClass}`}>
                              <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider block ${cfg.textColor}`}>
                                  {cfg.label}
                                </span>
                                <h4 className="text-xs sm:text-sm font-semibold text-slate-800">{ev.title}</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">{ev.module || "Course Module"}</p>
                              </div>
                              <button
                                onClick={() => handleActionClick({
                                  title: ev.title,
                                  module: ev.module,
                                  type: ev.type,
                                  action: ev.type === "class" ? "Join" : "View"
                                })}
                                className="px-3.5 py-1 rounded-lg border border-blue-500 bg-white text-blue-600 hover:bg-blue-50 text-xs font-medium shadow-2xs cursor-pointer"
                              >
                                {ev.type === "class" ? "Join" : "View"}
                              </button>
                            </div>
                          );
                        })}
                        {slotEvents.length === 0 && (
                          <div className="text-xs text-slate-300 italic py-1">Available / Free Time</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card B: Your Schedule (Next 7 Days) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Your Schedule (Next 7 Days)
              </h3>
              <button 
                onClick={() => setShowViewAllSchedule(true)}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {next7DaysSchedule.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {next7DaysSchedule.map((item, idx) => {
                  const cfg = getCategoryConfig(item.type);
                  return (
                    <div 
                      key={idx} 
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/50 rounded-xl px-2 transition-colors"
                    >
                      {/* Date, Day & Time */}
                      <div className="flex items-center gap-2.5 sm:w-56 shrink-0 text-xs">
                        <span className="font-semibold text-slate-900 whitespace-nowrap">{item.dateFormatted}</span>
                        <span className="text-slate-400 font-medium whitespace-nowrap">{item.dayOfWeek}</span>
                        <span className="text-slate-600 font-medium whitespace-nowrap ml-auto sm:ml-0">{item.timeFormatted}</span>
                      </div>

                      {/* Badge */}
                      <div className="shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass}`} />
                          <span>{cfg.label}</span>
                        </span>
                      </div>

                      {/* Title & Module */}
                      <div className="min-w-0 flex-1 px-1">
                        <span className="text-xs font-semibold text-slate-800 truncate block">
                          {item.title}
                        </span>
                      </div>

                      <div className="shrink-0 text-xs text-slate-400">
                        <span>{item.module}</span>
                      </div>

                      {/* Action button */}
                      <div className="shrink-0">
                        <button
                          onClick={() => handleActionClick(item)}
                          className="px-4 py-1 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-medium transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          {item.action}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
                  <CalendarIcon size={20} />
                </div>
                <p className="text-xs font-semibold text-slate-700">No classes or events in the next 7 days</p>
                <p className="text-[11px] text-slate-400">All caught up! Check back soon or select a date on the calendar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 of 12 cols): Selected Day Timeline & Upcoming Events */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Selected Day Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            {/* Header: Date + Event Count */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {formattedSelectedDateHeader}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                {selectedDayEvents.length} Events
              </span>
            </div>

            {/* Timeline items */}
            {selectedDayEvents.length > 0 ? (
              <div className="space-y-4 relative">
                {selectedDayEvents.map((ev, idx) => {
                  const cfg = getCategoryConfig(ev.type);
                  const isLast = idx === selectedDayEvents.length - 1;

                  return (
                    <div key={ev.id} className="relative flex items-start gap-3">
                      {/* Time Column */}
                      <div className="w-14 shrink-0 text-right text-[10px] font-medium text-slate-400 pt-1 leading-tight">
                        <div>{ev.start_time || "10:00 AM"}</div>
                        <div className="text-slate-300 mt-0.5">{ev.end_time || "11:00 AM"}</div>
                      </div>

                      {/* Vertical line + dot indicator */}
                      <div className="relative flex flex-col items-center self-stretch shrink-0 pt-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass} shadow-2xs`} />
                        {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
                      </div>

                      {/* Event Card Content */}
                      <div className="flex-1 min-w-0 bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-200/70 p-3 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {/* Icon Box */}
                            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${cfg.iconBg}`}>
                              {ev.type === "class" ? (
                                <Video size={14} />
                              ) : ev.type === "assignment" ? (
                                <FileText size={14} />
                              ) : (
                                <FolderCode size={14} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider block ${cfg.textColor}`}>
                                {cfg.label}
                              </span>
                              <h4 className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                                {ev.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {ev.module || "Course Module"}
                              </p>
                            </div>
                          </div>

                          {/* More Menu */}
                          <button 
                            onClick={() => handleActionClick({
                              title: ev.title,
                              module: ev.module,
                              type: ev.type,
                              action: ev.type === "class" ? "Join" : "View"
                            })}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            aria-label="More options"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>

                        {/* Join Class button for live classes */}
                        {ev.type === "class" && (
                          <button
                            onClick={() => handleActionClick({
                              title: ev.title,
                              module: ev.module,
                              type: ev.type,
                              action: "Join"
                            })}
                            className="w-full mt-2.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-medium transition-colors text-center shadow-2xs active:scale-98 cursor-pointer"
                          >
                            Join Class
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center space-y-2">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto border border-slate-100">
                  <CalendarIcon size={22} />
                </div>
                <p className="text-xs font-semibold text-slate-700">No events on this day</p>
                <p className="text-[11px] text-slate-400">Enjoy your free time or revise previous course modules.</p>
              </div>
            )}
          </div>

          {/* Card 2: Upcoming Events */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-slate-900">
                Upcoming Events
              </h3>
              <button 
                onClick={() => setShowViewAllSchedule(true)}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {upcomingEventsList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcomingEventsList.map((item, idx) => {
                  const cfg = getCategoryConfig(item.type);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDate(item.dateStr);
                        setToastMessage(`Selected date: ${item.dateFormatted}`);
                      }}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-1.5 transition-colors cursor-pointer group"
                    >
                      {/* Left: Icon Box + Details */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border transition-transform group-hover:scale-105 ${cfg.iconBg}`}>
                          {item.type === "class" ? (
                            <Video size={14} />
                          ) : item.type === "test" ? (
                            <HelpCircle size={14} />
                          ) : item.type === "assignment" ? (
                            <FileText size={14} />
                          ) : (
                            <FolderCode size={14} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-slate-400 font-medium">
                            {item.dateFormatted}  {item.timeFormatted}
                          </div>
                          <h4 className="text-xs font-semibold text-slate-800 truncate leading-snug group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h4>
                        </div>
                      </div>

                      {/* Right: Chevron */}
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center space-y-1.5">
                <p className="text-xs font-semibold text-slate-700">No upcoming events</p>
                <p className="text-[11px] text-slate-400">All scheduled sessions are up to date.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Live Class Join Interactive Modal */}
      {activeJoinModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                  <Video size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Live Class Session</h3>
                  <p className="text-[11px] text-blue-100">{activeJoinModal.module || "Web Development"}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveJoinModal(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-base">{activeJoinModal.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                  <div className="flex items-center gap-1">
                    <CalendarIcon size={13} className="text-blue-600" />
                    <span>{activeJoinModal.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={13} className="text-blue-600" />
                    <span>{activeJoinModal.time}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                <p className="font-semibold">Class Instructions:</p>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Make sure your microphone and camera are tested. Have your code editor ready for live practical coding.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setActiveJoinModal(null);
                    setToastMessage("Redirecting to Live Classroom session...");
                    router.push("/curriculum");
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-98"
                >
                  Enter Classroom
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + "/curriculum");
                    setToastMessage("Classroom link copied to clipboard!");
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: View Details Modal (Tests / Assignments / Projects) */}
      {activeViewModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  activeViewModal.type === "test" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                }`}>
                  {activeViewModal.type === "test" ? <HelpCircle size={18} /> : <FileText size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{activeViewModal.title}</h3>
                  <p className="text-[11px] text-slate-400">{activeViewModal.module}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveViewModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Scheduled Timing</span>
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <CalendarIcon size={14} className="text-slate-400" />
                  <span>{activeViewModal.date} at {activeViewModal.time}</span>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800 mb-0.5">Details & Requirements:</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Complete and submit before deadline. Results and teacher feedback will be available immediately following submission.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setActiveViewModal(null);
                    if (activeViewModal.type === "test") {
                      router.push("/tests");
                    } else {
                      router.push("/curriculum?tab=assignments");
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-98"
                >
                  {activeViewModal.type === "test" ? "Start Test Assessment" : "Open Assignment Workspace"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: View All Schedule Modal */}
      {showViewAllSchedule && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Complete Monthly Schedule</h3>
                <p className="text-xs text-slate-500 mt-0.5">{monthNames[currentMonth]} {currentYear} • {allEvents.length} total events</p>
              </div>
              <button 
                onClick={() => setShowViewAllSchedule(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto divide-y divide-slate-100 space-y-2">
              {allEvents.length > 0 ? (
                allEvents.map((item, idx) => {
                  const cfg = getCategoryConfig(item.type);
                  return (
                    <div key={idx} className="pt-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${cfg.iconBg}`}>
                          {item.type === "class" ? <Video size={14} /> : item.type === "test" ? <HelpCircle size={14} /> : <FileText size={14} />}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800">{item.title}</h4>
                          <p className="text-[10px] text-slate-400">{item.event_date} • {item.start_time || "10:00 AM"} • {item.module}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowViewAllSchedule(false);
                          handleActionClick({
                            title: item.title,
                            module: item.module,
                            type: item.type,
                            action: item.type === "class" ? "Join" : "View"
                          });
                        }}
                        className="px-3 py-1 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-medium"
                      >
                        {item.type === "class" ? "Join" : "View"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center space-y-2">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto border border-slate-100">
                    <CalendarIcon size={22} />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">No events found for this month</p>
                  <p className="text-[11px] text-slate-400">Classes and events will appear here once scheduled by the institute.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
