"use client";

import { useState, useEffect } from "react";
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
  BellRing,
  Plus,
  Trash2,
  Sparkles,
  Target,
  Clock,
  Smile,
  X
} from "lucide-react";
import { StatCard, QuickLinks, UpcomingEvents, RecentActivity, NoticeBoard, StreakWidget } from "@/components/dashboard/DashboardComponents";

// Motivational quotes list
const MOTIVATIONAL_QUOTES = [
  "Consistency is the key to unlocking your potential.",
  "Small daily progress adds up to massive results.",
  "Your future self will thank you for studying today.",
  "Believe you can and you're halfway there.",
  "Education is the most powerful weapon you can use to change the world.",
  "Every expert was once a beginner. Keep learning!",
  "Make today count. Progress over perfection."
];

interface DashboardClientProps {
  student: any;
  mainCourse: any;
  otherCourses: any[];
  stats: {
    completedCount: number;
    totalLessonsCount: number;
    progressPercentage: number;
    remainingCount: number;
  };
  nextLesson: any;
  upcomingEvents: any[];
  recentActivities: any[];
  notifications: any[];
  streak: number;
  progressHistory: { date: string; count: number }[];
}

export default function DashboardClient({
  student,
  mainCourse,
  otherCourses,
  stats,
  nextLesson,
  upcomingEvents,
  recentActivities,
  notifications,
  streak,
  progressHistory
}: DashboardClientProps) {
  // 1. Accent Theme Settings
  const [accent, setAccent] = useState<"indigo" | "emerald" | "violet" | "orange">("indigo");
  
  // 2. Active Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "planner">("overview");

  // 3. Goal Tracker State
  const [dailyTarget, setDailyTarget] = useState<number>(2);
  const [completedToday, setCompletedToday] = useState<number>(0);

  // 4. Study Tasks Checklist State
  const [tasks, setTasks] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  // 5. Quote of the day state
  const [quote, setQuote] = useState("");

  // Load local settings on mount
  useEffect(() => {
    // Theme Accent
    const savedAccent = localStorage.getItem("vision_dashboard_accent");
    if (savedAccent && ["indigo", "emerald", "violet", "orange"].includes(savedAccent)) {
      setAccent(savedAccent as any);
    }

    // Daily Target
    const savedTarget = localStorage.getItem("vision_dashboard_target");
    if (savedTarget) {
      setDailyTarget(parseInt(savedTarget) || 2);
    }

    // Tasks Checklist
    const savedTasks = localStorage.getItem("vision_dashboard_tasks");
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        // Fallback tasks
        setTasks([
          { id: "1", text: "Watch today's scheduled video lesson", completed: false },
          { id: "2", text: "Review summary notes in Materials section", completed: false },
          { id: "3", text: "Submit outstanding assignment task", completed: false }
        ]);
      }
    } else {
      setTasks([
        { id: "1", text: "Watch today's scheduled video lesson", completed: false },
        { id: "2", text: "Review summary notes in Materials section", completed: false },
        { id: "3", text: "Submit outstanding assignment task", completed: false }
      ]);
    }

    // Randomized Quote
    const randomIdx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIdx]);

    // Calculate completions today from progressHistory
    const todayStr = new Date().toDateString();
    const todayProgress = progressHistory.find(
      p => new Date(p.date).toDateString() === todayStr
    );
    setCompletedToday(todayProgress?.count || 0);

  }, [progressHistory]);

  // Save tasks helper
  const saveTasks = (updatedTasks: typeof tasks) => {
    setTasks(updatedTasks);
    localStorage.setItem("vision_dashboard_tasks", JSON.stringify(updatedTasks));
  };

  // Accent Styles Map
  const accentStyles = {
    indigo: {
      gradient: "from-indigo-600 via-indigo-700 to-purple-700",
      text: "text-indigo-600",
      bgLight: "bg-indigo-50",
      border: "border-indigo-100",
      focusBorder: "focus:border-indigo-500",
      btnBg: "bg-indigo-600 hover:bg-indigo-700",
      btnText: "text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-600 hover:text-white",
      glow: "shadow-indigo-500/20",
      accentDot: "bg-indigo-600",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
      ring: "stroke-indigo-600",
      fillGrad: "url(#indigoGrad)"
    },
    emerald: {
      gradient: "from-emerald-600 via-teal-700 to-cyan-700",
      text: "text-emerald-600",
      bgLight: "bg-emerald-50",
      border: "border-emerald-100",
      focusBorder: "focus:border-emerald-500",
      btnBg: "bg-emerald-600 hover:bg-emerald-700",
      btnText: "text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-600 hover:text-white",
      glow: "shadow-emerald-500/20",
      accentDot: "bg-emerald-600",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
      ring: "stroke-emerald-600",
      fillGrad: "url(#emeraldGrad)"
    },
    violet: {
      gradient: "from-violet-600 via-purple-700 to-fuchsia-700",
      text: "text-violet-600",
      bgLight: "bg-violet-50",
      border: "border-violet-100",
      focusBorder: "focus:border-violet-500",
      btnBg: "bg-violet-600 hover:bg-violet-700",
      btnText: "text-violet-600 bg-violet-50 border-violet-100 hover:bg-violet-600 hover:text-white",
      glow: "shadow-violet-500/20",
      accentDot: "bg-violet-600",
      badge: "bg-violet-50 text-violet-700 border-violet-100",
      ring: "stroke-violet-600",
      fillGrad: "url(#violetGrad)"
    },
    orange: {
      gradient: "from-orange-500 via-red-600 to-amber-600",
      text: "text-orange-600",
      bgLight: "bg-orange-50",
      border: "border-orange-100",
      focusBorder: "focus:border-orange-500",
      btnBg: "bg-orange-500 hover:bg-orange-600",
      btnText: "text-orange-600 bg-orange-50 border-orange-100 hover:bg-orange-500 hover:text-white",
      glow: "shadow-orange-500/20",
      accentDot: "bg-orange-500",
      badge: "bg-orange-50 text-orange-700 border-orange-100",
      ring: "stroke-orange-500",
      fillGrad: "url(#orangeGrad)"
    }
  };

  const style = accentStyles[accent];

  // Handler for accent change
  const handleAccentChange = (newAccent: typeof accent) => {
    setAccent(newAccent);
    localStorage.setItem("vision_dashboard_accent", newAccent);
  };

  // Daily target triggers
  const handleTargetChange = (val: number) => {
    const newVal = Math.max(1, Math.min(10, val));
    setDailyTarget(newVal);
    localStorage.setItem("vision_dashboard_target", newVal.toString());
  };

  // Add study task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    };
    const updated = [...tasks, newTask];
    saveTasks(updated);
    setNewTaskText("");
  };

  // Toggle study task
  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  // Delete study task
  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  // Render SVG chart elements
  const renderAnalyticsChart = () => {
    // Generate dates over last 7 days
    const chartWidth = 500;
    const chartHeight = 220;
    const padding = 40;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;

    // Maximum value calculation for graph scaling
    const maxVal = Math.max(...progressHistory.map(p => p.count), 3);

    // Compute coordinate points
    const points = progressHistory.map((item, idx) => {
      const x = padding + (idx * graphWidth) / (progressHistory.length - 1);
      const y = padding + graphHeight - (item.count * graphHeight) / maxVal;
      return { x, y, ...item };
    });

    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className={style.text} />
              Study Performance History
            </h3>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Lessons completed daily over the past week</p>
          </div>
          
          <div className="flex gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${style.badge}`}>
              <CheckCircle2 size={10} /> Active Week
            </span>
          </div>
        </div>

        <div className="relative w-full aspect-[21/9] min-h-[200px]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal gridlines */}
            {[0, 0.5, 1].map((ratio, index) => {
              const y = padding + ratio * graphHeight;
              const value = Math.round(maxVal - ratio * maxVal);
              return (
                <g key={index} className="opacity-30">
                  <line 
                    x1={padding} 
                    y1={y} 
                    x2={chartWidth - padding} 
                    y2={y} 
                    stroke="#cbd5e1" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                  />
                  <text 
                    x={padding - 10} 
                    y={y + 4} 
                    fill="#94a3b8" 
                    className="text-[9px] font-black text-right" 
                    textAnchor="end"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <path
              d={`
                M ${points[0].x} ${padding + graphHeight}
                ${points.map(p => `L ${p.x} ${p.y}`).join(" ")}
                L ${points[points.length - 1].x} ${padding + graphHeight}
                Z
              `}
              fill={style.fillGrad}
            />

            {/* Vector Line */}
            <path
              d={points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
              fill="none"
              stroke={
                accent === "indigo" ? "#6366f1" : 
                accent === "emerald" ? "#10b981" : 
                accent === "violet" ? "#8b5cf6" : 
                "#f97316"
              }
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {points.map((p, idx) => (
              <g key={idx} className="group/node cursor-pointer">
                {/* Glow ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="7"
                  className={`opacity-0 group-hover/node:opacity-30 transition-all duration-300 fill-current ${
                    accent === "indigo" ? "text-indigo-500" : 
                    accent === "emerald" ? "text-emerald-500" : 
                    accent === "violet" ? "text-violet-500" : 
                    "text-orange-500"
                  }`}
                />
                {/* Core dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="white"
                  stroke={
                    accent === "indigo" ? "#6366f1" : 
                    accent === "emerald" ? "#10b981" : 
                    accent === "violet" ? "#8b5cf6" : 
                    "#f97316"
                  }
                  strokeWidth="2.5"
                />
                
                {/* Floating tooltips (visible on hover) */}
                <g className="opacity-0 hover:opacity-100 group-hover/node:opacity-100 transition-all duration-300 pointer-events-none">
                  <rect
                    x={p.x - 30}
                    y={p.y - 32}
                    width="60"
                    height="20"
                    rx="5"
                    fill="#1e293b"
                    className="shadow-md"
                  />
                  <text
                    x={p.x}
                    y={p.y - 19}
                    fill="white"
                    textAnchor="middle"
                    className="text-[9px] font-black"
                  >
                    {p.count} {p.count === 1 ? 'class' : 'classes'}
                  </text>
                </g>
              </g>
            ))}

            {/* X Axis labels */}
            {points.map((p, idx) => {
              const formattedDate = new Date(p.date).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <text
                  key={idx}
                  x={p.x}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  className="text-[10px] font-black"
                >
                  {formattedDate}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // Calculate percentage of target completed today
  const targetPercent = Math.min(100, Math.round((completedToday / dailyTarget) * 100));

  return (
    <div className="space-y-6">
      
      {/* 1. Glassmorphic Greeting Banner with Theme Chooser */}
      <section className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-slate-100 bg-gradient-to-r ${style.gradient} transition-all duration-700 animate-in fade-in duration-500`}>
        {/* Dynamic moving glow blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full -ml-20 -mb-20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="bg-white/20 text-white font-black text-[9px] tracking-widest uppercase px-2 py-0.5 rounded backdrop-blur-md border border-white/10 flex items-center gap-1">
                <Sparkles size={10} className="animate-spin" /> student hub
              </span>
              {student?.batch && (
                <span className="bg-white/15 text-white font-black text-[9px] tracking-wider uppercase px-2 py-0.5 rounded backdrop-blur-md border border-white/10 flex items-center gap-1">
                  <Users size={10} /> {student.batch}
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-black tracking-tight leading-none">
              Welcome back, {student?.name?.split(" ")[0] || "Learner"}!
            </h1>
            
            <p className="text-sm text-indigo-100 font-medium italic max-w-lg leading-relaxed">
              "{quote}"
            </p>
          </div>

          {/* Quick theme accent configuration */}
          <div className="flex flex-col items-end gap-2.5 bg-black/15 p-4 rounded-2xl border border-white/10 backdrop-blur-md shrink-0 self-start md:self-auto">
            <span className="text-[9px] font-black tracking-wider text-slate-300 uppercase">Personalize theme</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleAccentChange("indigo")}
                className={`w-6 h-6 rounded-full bg-indigo-500 border-2 transition-all duration-300 hover:scale-110 cursor-pointer ${accent === "indigo" ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60"}`}
                title="Royal Indigo"
                aria-label="Set accent theme to Royal Indigo"
              />
              <button
                onClick={() => handleAccentChange("emerald")}
                className={`w-6 h-6 rounded-full bg-emerald-500 border-2 transition-all duration-300 hover:scale-110 cursor-pointer ${accent === "emerald" ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60"}`}
                title="Emerald Green"
                aria-label="Set accent theme to Emerald Green"
              />
              <button
                onClick={() => handleAccentChange("violet")}
                className={`w-6 h-6 rounded-full bg-violet-500 border-2 transition-all duration-300 hover:scale-110 cursor-pointer ${accent === "violet" ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60"}`}
                title="Electric Violet"
                aria-label="Set accent theme to Electric Violet"
              />
              <button
                onClick={() => handleAccentChange("orange")}
                className={`w-6 h-6 rounded-full bg-orange-500 border-2 transition-all duration-300 hover:scale-110 cursor-pointer ${accent === "orange" ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60"}`}
                title="Sunrise Amber"
                aria-label="Set accent theme to Sunrise Amber"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Urgent Notices Section */}
      {notifications && notifications.length > 0 && (
        <NoticeBoard notifications={notifications} />
      )}

      {/* 3. Interactive Navigation Tabs */}
      <div className="flex border-b border-slate-100 p-0.5 gap-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "overview"
              ? `${style.bgLight} ${style.text} shadow-sm border border-slate-100`
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <BookOpen size={14} /> Overview
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "analytics"
              ? `${style.bgLight} ${style.text} shadow-sm border border-slate-100`
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <TrendingUp size={14} /> Performance & Analytics
        </button>
        <button
          onClick={() => setActiveTab("planner")}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "planner"
              ? `${style.bgLight} ${style.text} shadow-sm border border-slate-100`
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Calendar size={14} /> Planner & Tasks
        </button>
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard 
              icon={<CheckCircle2 size={18} />} 
              label="Completed" 
              value={`${stats.completedCount}`} 
              sub="classes"
              color="emerald" 
            />
            <StatCard 
              icon={<BookOpen size={18} />} 
              label="Total" 
              value={`${stats.totalLessonsCount}`} 
              sub="classes"
              color="blue" 
            />
            <StatCard 
              icon={<TrendingUp size={18} />} 
              label="Progress" 
              value={`${stats.progressPercentage}%`} 
              sub="done"
              color="indigo" 
            />
            <StatCard 
              icon={<Flame size={18} />} 
              label="Remaining" 
              value={`${stats.remainingCount}`} 
              sub="to go"
              color="amber" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Course Section */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="relative w-28 h-28 md:w-36 md:h-36 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-slate-100" strokeWidth="3.2" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none"
                      stroke={accent === "indigo" ? "#6366f1" : accent === "emerald" ? "#10b981" : accent === "violet" ? "#8b5cf6" : "#f97316"}
                      className="transition-all duration-1000 ease-out"
                      strokeWidth="3.2"
                      strokeDasharray={`${stats.progressPercentage}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl md:text-3xl font-black text-slate-900 leading-none tabular-nums">{stats.progressPercentage}%</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Complete</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 text-center md:text-left w-full">
                  <div>
                    <span className={`text-[10px] font-black ${style.text} uppercase tracking-[0.2em] mb-1 block`}>Active Course</span>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">
                      {mainCourse?.title || "No active course"}
                    </h2>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-[2px] relative">
                      <div 
                        className={`h-full bg-gradient-to-r ${style.gradient} rounded-full transition-all duration-1000 ease-out`} 
                        style={{ width: `${stats.progressPercentage}%` }} 
                      />
                    </div>
                    <div className="flex justify-between items-center px-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stats.completedCount} / {stats.totalLessonsCount} Classes</span>
                      <span className={`text-[9px] font-black ${style.text} ${style.bgLight} px-2 py-0.5 rounded border ${style.border} uppercase tracking-widest`}>{stats.remainingCount} Left</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                     <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                       <CheckCircle2 size={12} className="text-emerald-500" />
                       <span className="text-[10px] font-bold text-emerald-700">{stats.completedCount} Done</span>
                     </div>
                     <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                       <Award size={12} className="text-amber-500" />
                       <span className="text-[10px] font-bold text-amber-700">VIT-{mainCourse?.course_code || "GEN"}</span>
                     </div>
                  </div>

                  <Link 
                    href="/curriculum"
                    className={`inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 ${style.btnBg} ${style.glow}`}
                  >
                    Continue Learning <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Streak & Profile Card Section */}
            <div className="space-y-6">
              {/* Personal streak info */}
              <StreakWidget streak={streak} />
              
              {/* Tiny Student ID Badge card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white font-black text-base shadow-md`}>
                  {student?.name?.[0] || "U"}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-800 leading-none">{student?.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{student?.student_id}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Next Lesson Banner section */}
          {nextLesson && (
            <section className={`bg-gradient-to-r ${style.gradient} rounded-2xl p-6 text-white relative overflow-hidden shadow-xl ${style.glow}`}>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                      <PlayCircle size={22} />
                    </div>
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 bg-white/20 rounded-md text-[9px] font-black uppercase tracking-widest">Up Next</span>
                      <h2 className="text-lg font-black leading-tight">{nextLesson.title}</h2>
                      <p className="text-indigo-100 text-xs font-medium">Click below to continue learning!</p>
                    </div>
                  </div>
                  <Link 
                    href={`/curriculum?lessonId=${nextLesson.id}`}
                    className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-md active:scale-95 shrink-0 hover:text-indigo-600"
                  >
                    <PlayCircle size={18} /> Start Now
                  </Link>
               </div>
            </section>
          )}

          {/* Quick links */}
          <QuickLinks />

          {/* Other courses section */}
          {otherCourses && otherCourses.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={16} className={style.text} />
                  My Other Courses
                </h3>
                <Link href="/courses" className={`text-[10px] font-black uppercase tracking-widest hover:underline ${style.text}`}>
                  View All
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherCourses.map((enroll: any) => (
                  <div key={enroll.id} className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 ${style.bgLight} ${style.text} rounded-xl flex items-center justify-center transition-all`}>
                        <BookOpen size={16} />
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">Active</span>
                    </div>
                    
                    <h4 className="text-sm font-black text-slate-900 leading-tight mb-3 line-clamp-1">
                      {enroll.courses?.title}
                    </h4>
                    
                    <div className="space-y-1.5 mb-4">
                      <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100 p-[1px] relative">
                        <div 
                          className={`bg-gradient-to-r ${style.gradient} h-full rounded-full transition-all duration-1000`} 
                          style={{ width: `${enroll.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{enroll.progress_percentage}% Complete</span>
                    </div>
                    
                    <Link 
                      href={`/curriculum?course=${enroll.course_id}`}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 border ${style.btnText}`}
                    >
                      Continue Learning <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}

      {/* Tab 2: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Main Performance Chart Widget */}
          {renderAnalyticsChart()}

          {/* Interactive Goal Setter & Spark progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Goal Tracker Ring Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between group">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Target size={16} className={style.text} />
                  Daily Study Goal
                </h4>
                <p className="text-[10px] font-medium text-slate-400">Aim for a specific daily class target</p>
              </div>

              {/* Visual Goal Ring */}
              <div className="my-6 flex justify-center relative items-center">
                <div className="w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-slate-100" strokeWidth="3.5" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none"
                      stroke={accent === "indigo" ? "#6366f1" : accent === "emerald" ? "#10b981" : accent === "violet" ? "#8b5cf6" : "#f97316"}
                      strokeDasharray={`${targetPercent}, 100`}
                      className="transition-all duration-500 ease-out"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-900 tabular-nums">{completedToday}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">/ {dailyTarget} classes</span>
                  </div>
                </div>
              </div>

              {/* Goal adjuster buttons */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600">Daily Target</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleTargetChange(dailyTarget - 1)}
                    className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg flex items-center justify-center font-bold border border-slate-200 cursor-pointer active:scale-95 text-slate-600 text-sm"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-black text-slate-800 tabular-nums">{dailyTarget}</span>
                  <button 
                    onClick={() => handleTargetChange(dailyTarget + 1)}
                    className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg flex items-center justify-center font-bold border border-slate-200 cursor-pointer active:scale-95 text-slate-600 text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Streaks and consistency widgets */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" />
                  Habit Consistency
                </h4>
                <p className="text-[10px] font-medium text-slate-400">Your current study momentum score</p>
              </div>

              <div className="my-4 space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-800">{streak}</span>
                  <span className="text-xs font-bold text-slate-400">Day Streak</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {streak > 0 
                    ? `Great job! You've logged study activity for ${streak} consecutive days. Keep the momentum going.`
                    : "No streak active yet. Complete at least one class today to begin your streak!"}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-50 flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${style.bgLight} ${style.text}`}>
                  <Smile size={14} />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {streak > 3 ? "Super Learner Mode" : "Goal: Study daily"}
                </span>
              </div>
            </div>

            {/* Recent Progress activity panel */}
            <RecentActivity activities={recentActivities} />

          </div>
        </div>
      )}

      {/* Tab 3: PLANNER & TASKS */}
      {activeTab === "planner" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* Interactive Checklist Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={16} className={style.text} />
                  My Study Checklist
                </h3>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${style.badge}`}>
                  {tasks.filter(t => t.completed).length} / {tasks.length} Completed
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400">Create and manage your customized study checklist items</p>
            </div>

            {/* Checklist tasks container */}
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1 py-1">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400 italic font-medium">No tasks on your study checklist yet.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Add tasks below to stay organized!</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:shadow-sm ${
                      task.completed 
                        ? "bg-slate-50 border-slate-100 opacity-60" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <input 
                        type="checkbox" 
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        className={`w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer`}
                      />
                      <span className={`text-xs font-bold truncate ${task.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                        {task.text}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors ml-2 cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add task form */}
            <form onSubmit={handleAddTask} className="flex gap-2 pt-4 border-t border-slate-50">
              <input 
                type="text" 
                placeholder="Add new study goal..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className={`flex-1 text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none transition-all ${style.focusBorder}`}
              />
              <button 
                type="submit" 
                className={`px-4 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${style.btnBg} ${style.glow}`}
              >
                <Plus size={14} /> Add
              </button>
            </form>
          </div>

          {/* Upcoming events schedules list */}
          <UpcomingEvents events={upcomingEvents} />

        </div>
      )}

    </div>
  );
}
