"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Award,
  Calendar,
  CheckCircle2,
  PlayCircle,
  FileText,
  BarChart3,
  Clock,
  ChevronRight,
  LayoutGrid,
  Laptop,
  Layers,
  Building,
  Trophy,
  FileCheck,
  CheckSquare,
  Sparkles,
  Quote,
  Box,
  Monitor
} from "lucide-react";

interface DashboardClientProps {
  student: any;
  mainCourse: any;
  otherCourses: any[];
  enrolledCourses?: { id: string; title: string; code?: string; progress: number; totalLessons?: number; completedLessons?: number }[];
  recentAssignments?: { id: string; title: string; module?: string; status: string; dueDate?: string }[];
  attendanceStats?: { total: number; present: number; percentage: number };
  certificatesCount?: number;
  stats: {
    completedCount: number;
    totalLessonsCount: number;
    progressPercentage: number;
    remainingCount: number;
    completedClasses?: number;
    totalClasses?: number;
    completedQuizzes?: number;
    totalQuizzes?: number;
    completedAssignments?: number;
    totalAssignments?: number;
    completedProjects?: number;
    totalProjects?: number;
  };
  nextLesson?: any;
  isLessonScheduledToday?: boolean;
  isNextLessonLocked?: boolean;
  nextScheduledClass?: { lesson: any; schedule: any } | null;
  upcomingEvents?: any[];
  recentActivities?: any[];
  notifications?: any[];
  streak?: number;
  progressHistory?: { date: string; count: number }[];
  activityHistory?: { date: string; active_seconds: number }[];
}

export default function DashboardClient({
  student,
  mainCourse,
  otherCourses = [],
  enrolledCourses = [],
  recentAssignments = [],
  attendanceStats = { total: 0, present: 0, percentage: 0 },
  certificatesCount = 0,
  stats,
  nextLesson,
  nextScheduledClass,
  upcomingEvents = [],
  recentActivities = []
}: DashboardClientProps) {
  const studentName = student?.name || "Student";

  // Pure real metrics calculated 100% from Supabase (zero mock / benchmark overrides)
  const totalCourses = enrolledCourses && enrolledCourses.length > 0
    ? enrolledCourses.length
    : (mainCourse ? otherCourses.length + 1 : 0);
  const completedLessons = stats?.completedCount || 0;
  const totalLessons = stats?.totalLessonsCount || 0;
  const totalAssignments = stats?.totalAssignments || 0;
  const submittedAssignments = stats?.completedAssignments || 0;
  const totalTests = stats?.totalQuizzes || 0;
  const completedTests = stats?.completedQuizzes || 0;
  const certificatesEarned = certificatesCount || 0;
  const attendancePct = attendanceStats?.percentage || 0;
  const attendancePresent = attendanceStats?.present || 0;
  const attendanceTotal = attendanceStats?.total || 0;

  // Filter real upcoming classes & upcoming tests from upcomingEvents
  const upcomingClasses = (upcomingEvents || []).filter((e: any) => {
    const t = (e.type || "").toLowerCase();
    return t === "class" || t === "lecture" || t === "video";
  }).slice(0, 3);

  const upcomingTests = (upcomingEvents || []).filter((e: any) => {
    const t = (e.type || "").toLowerCase();
    return t === "quiz" || t === "test" || t === "mcq";
  }).slice(0, 3);

  const overallProgressPct = Math.min(100, Math.max(0, stats?.progressPercentage || 0));
  const remainingLessonsCount = stats?.remainingCount || Math.max(0, totalLessons - completedLessons);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-12">
      {/* 1. Welcome Banner Card */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/30 rounded-2xl border border-blue-100/70 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xs">
        {/* Left Side: Welcome Greeting */}
        <div className="z-10 max-w-lg">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">
            Welcome back, <br className="hidden sm:inline" />
            <span className="text-slate-900">{studentName}!</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5 leading-relaxed">
            Keep learning, keep practicing and move closer to your goals.
          </p>
        </div>

        {/* Center Illustration: Student with laptop & ideas */}
        <div className="hidden lg:flex items-center justify-center shrink-0 opacity-95">
          <svg className="w-52 h-32" viewBox="0 0 220 120" fill="none">
            {/* Soft backdrop glow */}
            <circle cx="110" cy="65" r="50" fill="#EEF2FF" />

            {/* Lightbulb & Ideas floating */}
            <g transform="translate(85, 15)">
              <circle cx="10" cy="10" r="9" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.2" />
              <path d="M7 14H13" stroke="#D97706" strokeWidth="1.2" />
              <path d="M10 2V5" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M4 5L6 7" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M16 5L14 7" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
            </g>

            {/* Small Analytics Chart Floating */}
            <g transform="translate(155, 20)">
              <rect x="0" y="0" width="26" height="20" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
              <rect x="5" y="11" width="3.5" height="5" rx="1" fill="#3B82F6" />
              <rect x="11" y="7" width="3.5" height="9" rx="1" fill="#10B981" />
              <rect x="17" y="4" width="3.5" height="12" rx="1" fill="#6366F1" />
            </g>

            {/* Potted Plant on left */}
            <path d="M52 82C48 72 54 62 60 62C66 62 70 72 68 82" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
            <path d="M60 62V92" stroke="#059669" strokeWidth="2.5" />
            <path d="M54 92H66L64 105H56L54 92Z" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />

            {/* Student Avatar */}
            {/* Hair */}
            <path d="M96 46C96 35 106 32 116 32C126 32 134 36 134 46C134 50 131 52 131 52L100 52C100 52 96 49 96 46Z" fill="#1E293B" />
            {/* Face */}
            <circle cx="115" cy="50" r="14" fill="#FCD34D" />
            {/* Blue Shirt Body */}
            <path d="M92 105C92 82 101 74 115 74C129 74 138 82 138 105H92Z" fill="#2563EB" />

            {/* Laptop */}
            <rect x="96" y="84" width="38" height="24" rx="3" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
            <circle cx="115" cy="96" r="2.5" fill="#60A5FA" />
            <rect x="88" y="106" width="54" height="4" rx="2" fill="#94A3B8" />
          </svg>
        </div>

        {/* Right Floating Card: Motivational Quote */}
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl border border-slate-200/80 p-4 shadow-sm w-full md:w-auto md:min-w-[240px] max-w-[270px] relative shrink-0">
          <div className="text-blue-600 text-2xl font-serif font-black leading-none mb-1">
            “
          </div>
          <p className="text-xs font-semibold text-slate-800 leading-snug">
            “Small daily progress leads to big results.”
          </p>
          {/* Slider indicator pill at bottom right */}
          <div className="flex justify-end mt-3">
            <div className="w-8 h-1 bg-blue-600 rounded-full" />
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards Row (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Enrolled Courses */}
        <Link
          href="/courses"
          className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-100/80 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <BookOpen size={19} className="stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
              {totalCourses}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1 truncate">Enrolled Courses</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Keep Learning</div>
          </div>
        </Link>

        {/* Card 2: Lessons Completed */}
        <Link
          href="/curriculum"
          className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-11 h-11 rounded-full bg-blue-100/90 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <PlayCircle size={20} className="stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
              {completedLessons}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1 truncate">Lessons Completed</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">of {totalLessons} lessons</div>
          </div>
        </Link>

        {/* Card 3: Assignments */}
        <Link
          href="/assignments"
          className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-11 h-11 rounded-xl bg-purple-100/80 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
            <FileText size={19} className="stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
              {totalAssignments}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1 truncate">Assignments</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">{submittedAssignments} submitted</div>
          </div>
        </Link>

        {/* Card 4: Tests */}
        <Link
          href="/tests"
          className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-11 h-11 rounded-xl bg-rose-100/80 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
            <CheckSquare size={19} className="stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
              {totalTests}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1 truncate">Tests</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">{completedTests} completed</div>
          </div>
        </Link>

        {/* Card 5: Certificates */}
        <Link
          href="/certificates"
          className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-100/80 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Trophy size={19} className="stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
              {certificatesEarned}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1 truncate">Certificates</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">{certificatesEarned > 0 ? "Earned" : "In Progress"}</div>
          </div>
        </Link>

        {/* Card 6: Attendance */}
        <Link
          href="/attendance"
          className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-100/80 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <Calendar size={19} className="stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
              {attendancePct}%
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1 truncate">Attendance</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">{attendancePresent} / {attendanceTotal} classes</div>
          </div>
        </Link>
      </div>

      {/* 3. Main 3-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Column 1 (4 of 12 cols): My Courses + Recent Assignments */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card A: My Courses */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                <BookOpen size={16} className="text-blue-600" />
                <span>My Courses</span>
              </div>
              <Link
                href="/courses"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {enrolledCourses && enrolledCourses.length > 0 ? (
                enrolledCourses.slice(0, 3).map((c, idx) => (
                  <div key={c.id || idx} className={`flex items-center justify-between gap-3 p-1 ${idx > 0 ? "border-t border-slate-100 pt-2.5" : ""}`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-blue-600 flex items-center justify-center shrink-0 border border-sky-100 relative">
                        <BookOpen size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {c.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {c.code || "Course Curriculum"}
                        </p>
                        {/* Progress Bar */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                            {c.totalLessons ? `${c.completedLessons || 0}/${c.totalLessons} • ` : ""}{c.progress}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/curriculum"
                      className="px-3 py-1 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-medium transition-all shadow-2xs active:scale-95 shrink-0"
                    >
                      Continue
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-700">No active course enrollments</p>
                  <p className="text-[11px] text-slate-400">Enroll in a course to start your learning journey.</p>
                </div>
              )}
            </div>
          </div>

          {/* Card B: Recent Assignments */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                <FileText size={16} className="text-blue-600" />
                <span>Recent Assignments</span>
              </div>
              <Link
                href="/assignments"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {recentAssignments && recentAssignments.length > 0 ? (
                recentAssignments.slice(0, 3).map((a, idx) => (
                  <div key={a.id || idx} className={`flex items-center justify-between gap-2 p-1 ${idx > 0 ? "border-t border-slate-100 pt-2.5" : ""}`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {a.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {a.module}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${a.status === "submitted"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                        {a.status === "submitted" ? "Submitted" : "Pending"}
                      </span>
                      {a.dueDate && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Due: {a.dueDate}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-700">No active assignments</p>
                  <p className="text-[11px] text-slate-400">Assignments given by teachers will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 2 (4 of 12 cols): Upcoming Classes + Upcoming Tests */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card C: Upcoming Classes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                <Calendar size={16} className="text-blue-600" />
                <span>Upcoming Classes</span>
              </div>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingClasses.length > 0 ? (
                upcomingClasses.map((item: any, idx: number) => {
                  let monthStr = "CLASS";
                  let dayStr = "";
                  try {
                    const dt = new Date(item.event_date || item.date);
                    monthStr = dt.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                    dayStr = String(dt.getDate());
                  } catch { }

                  return (
                    <div key={item.id || idx} className={`flex items-center justify-between gap-2.5 p-1 ${idx > 0 ? "border-t border-slate-100 pt-2.5" : ""}`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Date badge */}
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center text-center shrink-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">{monthStr}</span>
                          <span className="text-sm font-bold text-slate-900 leading-none mt-0.5">{dayStr}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-blue-600" />
                            <span>{item.start_time || "10:00 AM"}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.module || item.courses?.title || "Scheduled Session"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Link
                          href="/curriculum"
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all shadow-2xs active:scale-95"
                        >
                          Join Class
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-700">No upcoming classes scheduled</p>
                  <p className="text-[11px] text-slate-400">Check the calendar for future classes.</p>
                </div>
              )}
            </div>
          </div>

          {/* Card D: Upcoming Tests */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                <Clock size={16} className="text-blue-600" />
                <span>Upcoming Tests</span>
              </div>
              <Link
                href="/tests"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingTests.length > 0 ? (
                upcomingTests.map((t: any, idx: number) => (
                  <Link
                    key={t.id || idx}
                    href="/tests"
                    className={`flex items-center justify-between gap-2 p-1 ${idx > 0 ? "border-t border-slate-100 pt-2.5" : ""} hover:bg-slate-50/70 rounded-xl transition-all group`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                        <CheckSquare size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {t.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {t.event_date || t.date || "Scheduled"} • {t.module || "Assessment"}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      Upcoming
                    </span>
                  </Link>
                ))
              ) : (
                <div className="py-6 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-700">No upcoming tests</p>
                  <p className="text-[11px] text-slate-400">All tests and quizzes are up to date.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3 (4 of 12 cols): Learning Progress + Quick Links */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card E: Learning Progress */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                <BarChart3 size={16} className="text-blue-600" />
                <span>Learning Progress</span>
              </div>
              <Link
                href="/curriculum"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>

            {/* Circular Donut Gauge & Legend */}
            <div className="flex items-center gap-4 py-1">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {overallProgressPct > 0 && (
                    <path
                      className="text-blue-600 transition-all duration-500"
                      stroke="currentColor"
                      strokeDasharray={`${overallProgressPct}, 100`}
                      strokeDashoffset="0"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                <div className="absolute text-center flex flex-col items-center justify-center">
                  <span className="text-base font-black text-slate-900 leading-none">{overallProgressPct}%</span>
                  <span className="text-[7.5px] font-medium text-slate-500 leading-tight mt-0.5">Overall</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-[11px] font-medium">Completed</span>
                  </div>
                  <span className="font-bold text-slate-900 text-[11px]">{completedLessons}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[11px] font-medium">Remaining</span>
                  </div>
                  <span className="font-bold text-slate-900 text-[11px]">{remainingLessonsCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-[11px] font-medium">Total Lessons</span>
                  </div>
                  <span className="font-bold text-slate-900 text-[11px]">{totalLessons}</span>
                </div>
              </div>
            </div>

            {/* Subject-wise Progress Bars */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <h5 className="text-[11px] font-bold text-slate-900">Enrolled Courses Progress</h5>
              {enrolledCourses && enrolledCourses.length > 0 ? (
                enrolledCourses.map((c, idx) => (
                  <div key={c.id || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 text-[11px] truncate">{c.title}</span>
                      <span className="font-bold text-slate-800 text-[11px] shrink-0">
                        {c.totalLessons ? <span className="text-[10px] font-normal text-slate-400 mr-1.5">{c.completedLessons || 0}/{c.totalLessons}</span> : null}
                        {c.progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 py-2 text-center">No enrolled courses logged yet</p>
              )}
            </div>
          </div>

          {/* Card F: Quick Links */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
              <LayoutGrid size={16} className="text-blue-600" />
              <span>Quick Links</span>
            </div>

            {/* Grid of 6 Quick Actions matching screenshot background hues */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {/* 1. My Classes */}
              <Link
                href="/curriculum"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50/40 hover:bg-blue-50 border border-blue-100/60 text-center transition-all group shadow-2xs active:scale-95"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
                  <PlayCircle size={18} fill="currentColor" className="text-blue-600 fill-white" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-700">
                  My Classes
                </span>
              </Link>

              {/* 2. Assignments */}
              <Link
                href="/assignments"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/70 text-center transition-all group shadow-2xs active:scale-95"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <FileText size={18} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-emerald-700">
                  Assignments
                </span>
              </Link>

              {/* 3. Tests */}
              <Link
                href="/tests"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100/70 text-center transition-all group shadow-2xs active:scale-95"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <CheckSquare size={18} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-purple-700">
                  Tests
                </span>
              </Link>

              {/* 4. Notes & Materials */}
              <Link
                href="/curriculum?tab=resources"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50/60 hover:bg-amber-50 border border-amber-100/70 text-center transition-all group shadow-2xs active:scale-95"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <BookOpen size={18} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-amber-700">
                  Notes & Materials
                </span>
              </Link>

              {/* 5. Projects */}
              <Link
                href="/curriculum"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-50/50 hover:bg-rose-50 border border-rose-100/70 text-center transition-all group shadow-2xs active:scale-95"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Box size={18} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-rose-700">
                  Projects
                </span>
              </Link>

              {/* 6. Certificates */}
              <Link
                href="/certificates"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-50/50 hover:bg-sky-50 border border-sky-100/70 text-center transition-all group shadow-2xs active:scale-95"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100/80 text-sky-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Trophy size={18} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-sky-700">
                  Certificates
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
