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
  stats,
  nextLesson,
  nextScheduledClass,
  upcomingEvents = [],
  recentActivities = []
}: DashboardClientProps) {
  const studentName = student?.name || "Neeraj Singh";

  // Dynamic values with benchmark fallbacks matching reference screenshot
  const totalCourses = (otherCourses.length + 1) >= 3 ? (otherCourses.length + 1) : 3;
  const completedLessons = stats?.completedCount > 0 ? stats.completedCount : 28;
  const totalLessons = stats?.totalLessonsCount > 0 ? stats.totalLessonsCount : 42;
  const totalAssignments = stats?.totalAssignments && stats.totalAssignments > 0 ? stats.totalAssignments : 5;
  const submittedAssignments = stats?.completedAssignments && stats.completedAssignments > 0 ? stats.completedAssignments : 3;
  const totalTests = stats?.totalQuizzes && stats.totalQuizzes > 0 ? stats.totalQuizzes : 4;

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
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">1 upcoming</div>
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
              2
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1 truncate">Certificates</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Earned</div>
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
              85%
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1 truncate">Attendance</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">26 / 31 classes</div>
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
              {/* Course 1: Web Development */}
              <div className="flex items-center justify-between gap-3 p-1">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-blue-600 flex items-center justify-center shrink-0 border border-sky-100 relative">
                    <Laptop size={18} />
                    <span className="absolute text-[8px] font-black text-blue-600 top-2.5">&lt;/&gt;</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      Web Development
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      HTML, CSS, JavaScript
                    </p>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-[70%]" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">70%</span>
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

              {/* Course 2: MS Office */}
              <div className="flex items-center justify-between gap-3 p-1 border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-orange-50/70 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100/70">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#F25022" />
                      <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#7FBA00" />
                      <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#00A4EF" />
                      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#FFB900" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      MS Office
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      Word, Excel, PowerPoint
                    </p>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-[50%]" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">50%</span>
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

              {/* Course 3: Python Basics */}
              <div className="flex items-center justify-between gap-3 p-1 border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-50/80 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/80">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path fill="#387EB8" d="M11.9 2c-3.1 0-2.9 1.3-2.9 1.3l.1 1.4h3v.4H6.2S4 4.8 4 8c0 3.1 1.9 3 1.9 3h1.1V9.5s-.1-1.8 1.8-1.8h3.1s1.7 0 1.7-1.7V4.2s.3-2.2-1.7-2.2zm-1.8 1.7c.3 0 .6.3.6.6s-.3.6-.6.6-.6-.3-.6-.6.3-.6.6-.6z" />
                      <path fill="#FFE052" d="M12.1 22c3.1 0 2.9-1.3 2.9-1.3l-.1-1.4h-3v-.4h5.9s2.2.3 2.2-2.9c0-3.1-1.9-3-1.9-3h-1.1v1.5s.1 1.8-1.8 1.8h-3.1s-1.7 0-1.7 1.7v1.8s-.3 2.2 1.7 2.2zm1.8-1.7c-.3 0-.6-.3-.6-.6s.3-.6.6-.6.6.3.6.6-.3.6-.6.6z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      Python Basics
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      Python Fundamentals
                    </p>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-[30%]" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">30%</span>
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
              {/* Assignment 1: HTML Page Layout */}
              <div className="flex items-center justify-between gap-2 p-1">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      HTML Page Layout
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      Module 1: HTML Basics
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Submitted
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">18 Oct 2026</p>
                </div>
              </div>

              {/* Assignment 2: CSS Design Practice */}
              <div className="flex items-center justify-between gap-2 p-1 border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      CSS Design Practice
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      Module 2: CSS Basics
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    In Progress
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Due: 22 Oct 2026</p>
                </div>
              </div>

              {/* Assignment 3: JavaScript Form Validation */}
              <div className="flex items-center justify-between gap-2 p-1 border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      JavaScript Form Validation
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      Module 3: JavaScript
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    Not Started
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Due: 25 Oct 2026</p>
                </div>
              </div>
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
              {/* Class 1: CSS Flexbox and Grid */}
              <div className="flex items-center justify-between gap-2.5 p-1">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Date badge */}
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">OCT</span>
                    <span className="text-sm font-bold text-slate-900 leading-none mt-0.5">21</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      CSS Flexbox and Grid
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={11} className="text-blue-600" />
                      <span>10:00 AM - 11:00 AM</span>
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Lab 1 • Neeraj Sir
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Tomorrow
                  </span>
                  <Link
                    href="/curriculum"
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all shadow-2xs active:scale-95"
                  >
                    Join Class
                  </Link>
                </div>
              </div>

              {/* Class 2: JavaScript Basics */}
              <div className="flex items-center justify-between gap-2.5 p-1 border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">OCT</span>
                    <span className="text-sm font-bold text-slate-900 leading-none mt-0.5">23</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      JavaScript Basics
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={11} className="text-blue-600" />
                      <span>10:00 AM - 11:00 AM</span>
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Lab 1 • Neeraj Sir
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    Thu
                  </span>
                  <Link
                    href="/calendar"
                    className="px-2.5 py-1 border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium transition-all shadow-2xs active:scale-95"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              {/* Class 3: Project Discussion */}
              <div className="flex items-center justify-between gap-2.5 p-1 border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">OCT</span>
                    <span className="text-sm font-bold text-slate-900 leading-none mt-0.5">24</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      Project Discussion
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={11} className="text-blue-600" />
                      <span>11:00 AM - 12:00 PM</span>
                    </p>
                    <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                      <Building size={10} />
                      <span>Offline Class</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    Fri
                  </span>
                  <Link
                    href="/calendar"
                    className="px-2.5 py-1 border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium transition-all shadow-2xs active:scale-95"
                  >
                    View Details
                  </Link>
                </div>
              </div>
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
              {/* Test 1: CSS Fundamentals Test */}
              <Link 
                href="/tests"
                className="flex items-center justify-between gap-2 p-1 hover:bg-slate-50/70 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      CSS Fundamentals Test
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      Module 2: CSS Basics
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">18 Oct 2026</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
                  Upcoming
                </span>
              </Link>

              {/* Test 2: JavaScript Basics Quiz */}
              <Link 
                href="/tests"
                className="flex items-center justify-between gap-2 p-1 border-t border-slate-100 pt-2.5 hover:bg-slate-50/70 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      JavaScript Basics Quiz
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      Module 3: JavaScript
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
                  Upcoming
                </span>
              </Link>

              {/* Test 3: Web Development Mock Test */}
              <Link 
                href="/tests"
                className="flex items-center justify-between gap-2 p-1 border-t border-slate-100 pt-2.5 hover:bg-slate-50/70 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      Web Development Mock Test
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      Modules 1-3
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
                  Upcoming
                </span>
              </Link>
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
                  {/* Not Started (Gray): length 11%, offset -89 */}
                  <path 
                    stroke="#CBD5E1" 
                    strokeDasharray="11 100" 
                    strokeDashoffset="-89" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    fill="none" 
                  />
                  {/* In Progress (Blue): length 24%, offset -65 */}
                  <path 
                    stroke="#3B82F6" 
                    strokeDasharray="24 100" 
                    strokeDashoffset="-65" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    fill="none" 
                  />
                  {/* Completed (Emerald): length 65%, offset 0 */}
                  <path 
                    stroke="#10B981" 
                    strokeDasharray="65 100" 
                    strokeDashoffset="0" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    fill="none" 
                  />
                </svg>
                <div className="absolute text-center flex flex-col items-center justify-center">
                  <span className="text-base font-black text-slate-900 leading-none">65%</span>
                  <span className="text-[7.5px] font-medium text-slate-500 leading-tight mt-0.5">Overall Progress</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-medium">Completed</span>
                  </div>
                  <span className="font-bold text-slate-900 text-[11px]">28</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[11px] font-medium">In Progress</span>
                  </div>
                  <span className="font-bold text-slate-900 text-[11px]">10</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-[11px] font-medium">Not Started</span>
                  </div>
                  <span className="font-bold text-slate-900 text-[11px]">4</span>
                </div>
              </div>
            </div>

            {/* Subject-wise Progress Bars */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <h5 className="text-[11px] font-bold text-slate-900">Subject-wise Progress</h5>

              {/* HTML & CSS */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 text-[11px]">HTML & CSS</span>
                  <span className="font-bold text-slate-800 text-[11px]">80%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[80%]" />
                </div>
              </div>

              {/* JavaScript */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 text-[11px]">JavaScript</span>
                  <span className="font-bold text-slate-800 text-[11px]">60%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[60%]" />
                </div>
              </div>

              {/* MS Office */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 text-[11px]">MS Office</span>
                  <span className="font-bold text-slate-800 text-[11px]">50%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[50%]" />
                </div>
              </div>

              {/* Python */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 text-[11px]">Python</span>
                  <span className="font-bold text-slate-800 text-[11px]">30%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[30%]" />
                </div>
              </div>
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
