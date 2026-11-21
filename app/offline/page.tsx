"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  WifiOff,
  Wifi,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Calendar,
  FileText,
  User,
  ArrowRight,
  Sparkles,
  X,
  Clock,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Layers,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { getOfflineData, OFFLINE_KEYS } from "@/lib/offline-store";
import { renderHighlightedHtml, enhanceCodeBlocks } from "@/lib/codeHighlighter";

export default function OfflinePage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "curriculum" | "attendance" | "tests">("dashboard");
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [activeOfflineLesson, setActiveOfflineLesson] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(16);

  // Read saved offline data
  const [offlineData, setOfflineData] = useState<{
    profile: any;
    dashboard: any;
    attendance: any;
    tests: any;
    curriculum: any;
  }>({
    profile: null,
    dashboard: null,
    attendance: null,
    tests: null,
    curriculum: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Profile
    const profile = getOfflineData<any>(OFFLINE_KEYS.PROFILE);

    // 2. Dashboard
    const dashboard = getOfflineData<any>(OFFLINE_KEYS.DASHBOARD);

    // 3. Attendance
    const attendance = getOfflineData<any>(OFFLINE_KEYS.ATTENDANCE);

    // 4. Tests
    const tests = getOfflineData<any>(OFFLINE_KEYS.TESTS);

    // 5. Curriculum (Check direct courseId or search keys)
    let curriculum = null;
    const courseId =
      dashboard?.mainCourse?.id ||
      dashboard?.enrolledCourses?.[0]?.course_id ||
      dashboard?.enrolledCourses?.[0]?.id;

    if (courseId) {
      curriculum = getOfflineData<any>(OFFLINE_KEYS.CURRICULUM_PREFIX + courseId);
    }

    if (!curriculum) {
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(OFFLINE_KEYS.CURRICULUM_PREFIX)) {
            curriculum = getOfflineData<any>(key);
            if (curriculum) break;
          }
        }
      } catch {}
    }

    setOfflineData({
      profile,
      dashboard,
      attendance,
      tests,
      curriculum,
    });

    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsReconnecting(true);
    if (navigator.onLine) {
      window.location.href = "/dashboard";
    } else {
      setTimeout(() => {
        setIsReconnecting(false);
      }, 1200);
    }
  };

  const student = offlineData.dashboard?.student || offlineData.profile;
  const attendanceStats = offlineData.dashboard?.attendanceStats || {
    percentage: offlineData.attendance?.stats?.percentage || 0,
    total: offlineData.attendance?.stats?.total || 0,
    present: offlineData.attendance?.stats?.present || 0,
  };
  const mainCourse = offlineData.dashboard?.mainCourse || offlineData.curriculum?.courseInfo;
  const modules = offlineData.curriculum?.modules || [];
  const attendanceRecords = offlineData.attendance?.records || [];
  const savedTests = offlineData.tests?.tests || [];

  const hasAnyOfflineData = Boolean(student || mainCourse || modules.length > 0 || attendanceRecords.length > 0);

  // Lesson note highlighted HTML
  const lessonHtml = useMemo(() => {
    if (!activeOfflineLesson?.notes_content) return "";
    return renderHighlightedHtml(activeOfflineLesson.notes_content);
  }, [activeOfflineLesson?.notes_content]);

  useEffect(() => {
    if (activeOfflineLesson) {
      const t = setTimeout(() => enhanceCodeBlocks(), 100);
      return () => clearTimeout(t);
    }
  }, [activeOfflineLesson]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Offline Mode Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isOnline ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
              {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-slate-900 tracking-tight truncate">
                  Vision Learn
                </h1>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${isOnline ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-amber-50 text-amber-700 border-amber-300 animate-pulse"}`}>
                  {isOnline ? "Online Restored" : "Offline Mode"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold truncate">
                {student?.name ? `${student.name} (${student.student_id || student.batch || "Student"})` : "Viewing Saved Learning Data"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOnline ? (
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                Go Online <ArrowRight size={14} />
              </Link>
            ) : (
              <button
                onClick={handleRetry}
                disabled={isReconnecting}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RotateCcw size={13} className={isReconnecting ? "animate-spin" : ""} />
                {isReconnecting ? "Checking..." : "Reconnect"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {!hasAnyOfflineData ? (
          /* Empty State if student never logged in */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto my-12 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto">
              <WifiOff size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              No Offline Data Found
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Please connect to the internet once and sign in to download your courses, notes, and attendance for offline study.
            </p>
            <button
              onClick={handleRetry}
              className="w-full py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={15} /> Check Connection
            </button>
          </div>
        ) : (
          <>
            {/* Student Info Card */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-white/10 px-2 py-0.5 rounded-md">
                  Offline Learning Hub
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {student?.name || "Student"}
                </h2>
                <p className="text-xs text-indigo-200 font-medium">
                  {mainCourse?.title || "Enrolled Course"} • Batch: {student?.batch || "Active"}
                </p>
              </div>

              <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/15 flex-1 sm:flex-initial text-center sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 block">Attendance</span>
                  <span className="text-xl font-black text-white">{attendanceStats.percentage}%</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/15 flex-1 sm:flex-initial text-center sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 block">Saved Modules</span>
                  <span className="text-xl font-black text-white">{modules.length || "1"}</span>
                </div>
              </div>
            </div>

            {/* Offline Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === "dashboard"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles size={14} /> Overview
              </button>
              <button
                onClick={() => setActiveTab("curriculum")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === "curriculum"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BookOpen size={14} /> Lessons & Notes ({modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)})
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === "attendance"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 size={14} /> Attendance ({attendanceRecords.length})
              </button>
              <button
                onClick={() => setActiveTab("tests")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === "tests"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText size={14} /> Tests ({savedTests.length})
              </button>
            </div>

            {/* TAB CONTENT */}

            {/* 1. Dashboard Overview */}
            {activeTab === "dashboard" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Classes</span>
                    <p className="text-2xl font-black text-slate-900">{attendanceStats.total || attendanceRecords.length || 0}</p>
                    <p className="text-[11px] font-semibold text-emerald-600">{attendanceStats.present || 0} Attended</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course Progress</span>
                    <p className="text-2xl font-black text-slate-900">
                      {offlineData.dashboard?.stats?.courseProgress || 0}%
                    </p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${offlineData.dashboard?.stats?.courseProgress || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Offline Status</span>
                    <p className="text-2xl font-black text-amber-600 flex items-center gap-1.5">
                      Ready ✓
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400">Notes & History Saved Locally</p>
                  </div>
                </div>

                {/* Quick Action: Start Learning */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950">Read Course Lessons Offline</h3>
                    <p className="text-xs text-indigo-700/80 font-medium">All course theory and practical notes are available without internet.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("curriculum")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
                  >
                    Open Saved Lessons
                  </button>
                </div>
              </div>
            )}

            {/* 2. Lessons & Notes Tab */}
            {activeTab === "curriculum" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {modules.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 space-y-2">
                    <BookOpen size={28} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No course modules cached yet.</p>
                    <p className="text-[11px] text-slate-400">Visit "My Courses" while connected to save lesson notes.</p>
                  </div>
                ) : (
                  modules.map((mod: any, modIdx: number) => (
                    <div key={mod.id || modIdx} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          <span className="text-indigo-600 mr-2">Module {modIdx + 1}:</span>
                          {mod.title}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                          {mod.lessons?.length || 0} Lessons
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {(mod.lessons || []).map((les: any, lesIdx: number) => (
                          <div
                            key={les.id || lesIdx}
                            onClick={() => setActiveOfflineLesson(les)}
                            className="p-3 sm:p-4 hover:bg-indigo-50/40 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                <BookOpen size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                  {les.title}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                                  <span>{les.lesson_type || les.type || "Theory"}</span>
                                  {les.duration && <span>• {les.duration} Mins</span>}
                                </p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white text-[10px] font-bold transition-all shrink-0">
                              Read Notes
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. Attendance Tab */}
            {activeTab === "attendance" && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden animate-in fade-in duration-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Cached Attendance History</h3>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                    {attendanceStats.percentage}% Present
                  </span>
                </div>
                {attendanceRecords.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400">No attendance records found in offline cache.</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                    {attendanceRecords.map((rec: any, idx: number) => {
                      const isPresent = (rec.status || "").toLowerCase() === "present";
                      const isLeave = (rec.status || "").toLowerCase() === "leave";
                      return (
                        <div key={rec.id || idx} className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">
                              {rec.date ? new Date(rec.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : `Class #${idx + 1}`}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{rec.courses?.title || offlineData.attendance?.courseTitle || "Course Session"}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isPresent
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isLeave
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            {rec.status || "Present"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. Tests Tab */}
            {activeTab === "tests" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                {savedTests.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 space-y-2">
                    <FileText size={28} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No tests cached yet.</p>
                    <p className="text-[11px] text-slate-400">Open Tests while online to enable offline practice.</p>
                  </div>
                ) : (
                  savedTests.map((t: any, idx: number) => (
                    <div key={t.id || idx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{t.title}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                          {t.duration_minutes || t.duration || 10} Mins • {t.questions?.length || 10} Questions
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        Offline Ready
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* OFFLINE LESSON VIEWER MODAL */}
      {activeOfflineLesson && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="min-w-0 pr-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Offline Lesson Notes
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900 truncate mt-1">
                  {activeOfflineLesson.title}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(12, z - 2))}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[10px] font-bold text-slate-400 min-w-[28px] text-center">
                  {Math.round((zoomLevel / 16) * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(26, z + 2))}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => setActiveOfflineLesson(null)}
                  className="p-2 ml-1 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Reading Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
              <article
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                style={{ fontSize: `${zoomLevel}px` }}
              >
                {lessonHtml ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: lessonHtml }}
                    className="rich-content"
                  />
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <BookOpen size={32} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No written notes found for this lesson.</p>
                    <p className="text-[11px]">This lesson may be an interactive video or practical session.</p>
                  </div>
                )}
              </article>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="text-[11px] flex items-center gap-1">
                <Clock size={12} /> {activeOfflineLesson.duration || 5} Mins Reading
              </span>
              <button
                onClick={() => setActiveOfflineLesson(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
