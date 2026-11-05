"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Home, 
  ChevronRight, 
  Award, 
  FileText, 
  CheckCircle2, 
  Trophy, 
  Layers, 
  Search, 
  X, 
  ChevronDown, 
  Download, 
  Share2, 
  MoreVertical, 
  Calendar, 
  ShieldCheck, 
  QrCode, 
  Printer, 
  Check, 
  ExternalLink,
  Copy,
  Code2,
  FileSpreadsheet,
  Terminal,
  Sparkles,
  ArrowRight,
  BookOpen,
  Lock
} from "lucide-react";

const LinkedinIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export interface CertificateItem {
  id: string;
  certCode: string;
  title: string;
  subtitle: string;
  description: string;
  type: "Course" | "Test" | "Project";
  issuedDate: string;
  issuedDateRaw: string;
  iconType: "blue_cert" | "excel" | "rose_trophy" | "purple_trophy" | "amber_code" | "emerald_code";
  skills?: string[];
  grade?: string;
}

export interface CourseProgressInfo {
  courseId: string;
  title: string;
  courseCode: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  enrolledAt?: string;
  isCompleted: boolean;
}

export default function CertificatesClient({
  studentName = "Student",
  studentId = "VL-2026",
  courseTitle = "My Course",
  coursesProgress = [],
  testResults = []
}: {
  studentName?: string;
  studentId?: string;
  courseTitle?: string;
  coursesProgress?: CourseProgressInfo[];
  testResults?: any[];
}) {
  const [activeTab, setActiveTab] = useState<string>("all"); // "all", "Course", "Test"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // Modals state
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateItem | null>(null);
  const [sharingCertificate, setSharingCertificate] = useState<CertificateItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Generate 100% Real Unlocked Certificates from real course completions & passed test results
  const unlockedCertificates = useMemo<CertificateItem[]>(() => {
    const list: CertificateItem[] = [];

    // Course Certificates (from completed courses)
    coursesProgress.forEach((c) => {
      if (c.isCompleted) {
        const rawDate = c.enrolledAt ? new Date(c.enrolledAt) : new Date();
        const formattedDate = rawDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });

        list.push({
          id: `cert-crs-${c.courseId}`,
          certCode: `VL-2026-${c.courseCode || "CRS"}-${studentId.replace(/[^a-zA-Z0-9]/g, "")}`,
          title: `${c.title} Certificate`,
          subtitle: `Completed ${c.title} Program`,
          description: `All ${c.totalLessons} curriculum lessons and practical assessments fulfilled`,
          type: "Course",
          issuedDate: formattedDate,
          issuedDateRaw: rawDate.toISOString(),
          iconType: "blue_cert",
          skills: ["Curriculum Mastery", "Practical Projects", "Technical Assessment"],
          grade: c.progress >= 95 ? "Grade A+" : "Grade A"
        });
      }
    });

    // Test Certificates (from test results with passing score >= 70%)
    (testResults || []).forEach((t: any) => {
      const totalQ = t.total_questions || 20;
      const score = t.score || 0;
      const scorePct = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0;

      if (scorePct >= 70) {
        const rawDate = t.completed_at ? new Date(t.completed_at) : new Date();
        const formattedDate = rawDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
        const testTitle = t.tests?.title || "Curriculum Assessment";

        list.push({
          id: `cert-tst-${t.test_id}`,
          certCode: `VL-2026-TST-${(t.test_id || "0000").substring(0, 4).toUpperCase()}`,
          title: `${testTitle} Certificate`,
          subtitle: `Scored ${scorePct}% in Assessment`,
          description: `${totalQ} Questions | ${score} Correct (${scorePct}% Accuracy)`,
          type: "Test",
          issuedDate: formattedDate,
          issuedDateRaw: rawDate.toISOString(),
          iconType: scorePct >= 85 ? "rose_trophy" : "purple_trophy",
          skills: ["Timed Evaluation", "Knowledge Assessment", "Conceptual Understanding"],
          grade: `Score: ${score}/${totalQ} (${scorePct}%)`
        });
      }
    });

    return list;
  }, [coursesProgress, testResults, studentId]);

  // Courses that are still in progress towards unlocking their certificates
  const inProgressCourses = useMemo(() => {
    return coursesProgress.filter(c => !c.isCompleted);
  }, [coursesProgress]);

  // Dynamic Statistics computed strictly from real data
  const stats = useMemo(() => {
    const total = unlockedCertificates.length;
    const coursesCount = unlockedCertificates.filter(c => c.type === "Course").length;
    const testsCount = unlockedCertificates.filter(c => c.type === "Test").length;
    const inProgressCount = inProgressCourses.length;

    return {
      total,
      coursesCount,
      testsCount,
      inProgressCount
    };
  }, [unlockedCertificates, inProgressCourses]);

  // Filtered certificates list
  const filteredCertificates = useMemo(() => {
    return unlockedCertificates.filter(item => {
      // 1. Tab filter
      if (activeTab !== "all" && item.type.toLowerCase() !== activeTab.toLowerCase()) {
        return false;
      }

      // 2. Type dropdown filter
      if (selectedType !== "all" && item.type.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSubtitle = item.subtitle.toLowerCase().includes(q);
        const matchCode = item.certCode.toLowerCase().includes(q);
        if (!matchTitle && !matchSubtitle && !matchCode) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.issuedDateRaw).getTime() - new Date(a.issuedDateRaw).getTime();
      }
      if (sortOrder === "oldest") {
        return new Date(a.issuedDateRaw).getTime() - new Date(b.issuedDateRaw).getTime();
      }
      return 0;
    });
  }, [unlockedCertificates, activeTab, selectedType, searchQuery, sortOrder]);

  const handleCopyShareLink = (cert: CertificateItem) => {
    const shareUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/certificates/verify?id=${cert.certCode}`
      : `https://visionlearn.edu/verify?id=${cert.certCode}`;
    
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-300 pb-12">
      {/* 1. Breadcrumbs Navigation */}
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
        <span className="text-slate-800 font-semibold">Certificates</span>
      </div>

      {/* 2. Hero Banner */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/40 rounded-2xl border border-blue-100/70 p-4 sm:p-5 flex items-center justify-between gap-4 relative overflow-hidden shadow-2xs">
        <div className="flex items-center gap-3 sm:gap-3.5 z-10 min-w-0">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-blue-100/90 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Award size={24} className="stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-slate-900 leading-tight">
              My Verified Certificates
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-normal truncate">
              Earn accredited certificates by completing courses and passing test evaluations
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-600 font-medium">
              <span className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md border border-blue-100">
                <ShieldCheck size={11} className="text-blue-600" />
                Verified Credentials
              </span>
              <span className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md border border-blue-100">
                <Download size={11} className="text-blue-600" />
                Instant PDF Export
              </span>
            </div>
          </div>
        </div>

        {/* Right Graphic */}
        <div className="hidden sm:flex items-center pr-2 shrink-0 opacity-90">
          <div className="w-12 h-12 rounded-2xl bg-white/80 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <Sparkles size={24} />
          </div>
        </div>
      </div>

      {/* 3. Top 4 Metric Summary Cards (2x2 on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Total Certificates */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Award size={18} className="stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
              {stats.total}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Earned</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Unlocked credentials</div>
          </div>
        </div>

        {/* Card 2: Course Certificates */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} className="stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
              {stats.coursesCount}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Courses</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Full programs</div>
          </div>
        </div>

        {/* Card 3: Test Certificates */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <Trophy size={18} className="stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
              {stats.testsCount}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Tests</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Scored ≥70%</div>
          </div>
        </div>

        {/* Card 4: In Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Layers size={18} className="stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
              {stats.inProgressCount}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">In Progress</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">To be unlocked</div>
          </div>
        </div>
      </div>

      {/* 4. Filter Tabs Bar */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto text-xs font-semibold scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`pb-2 px-2.5 sm:px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === "all"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          All Certificates ({stats.total})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("Course")}
          className={`pb-2 px-2.5 sm:px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === "Course"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Course ({stats.coursesCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("Test")}
          className={`pb-2 px-2.5 sm:px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === "Test"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Test ({stats.testsCount})
        </button>
      </div>

      {/* 5. Search & Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search certificates..."
            className="w-full pl-8.5 pr-8 py-2 text-xs bg-white rounded-xl border border-slate-200/80 focus:outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400 shadow-2xs"
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter: Sort */}
        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="appearance-none bg-white text-xs font-medium text-slate-700 py-2 pl-3 pr-7 rounded-xl border border-slate-200/80 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* 6. Unlocked Certificates List */}
      <div className="space-y-2.5 sm:space-y-3">
        {filteredCertificates.map((cert) => {
          let iconBg = "bg-blue-50 text-blue-600 border-blue-100";
          let IconComponent = FileText;
          let pillBg = "bg-blue-50 text-blue-700 border-blue-100";

          if (cert.iconType === "rose_trophy") {
            iconBg = "bg-rose-50 text-rose-600 border-rose-100";
            IconComponent = Trophy;
            pillBg = "bg-rose-50 text-rose-700 border-rose-100";
          } else if (cert.iconType === "purple_trophy") {
            iconBg = "bg-purple-50 text-purple-600 border-purple-100";
            IconComponent = Trophy;
            pillBg = "bg-purple-50 text-purple-700 border-purple-100";
          }

          return (
            <div
              key={cert.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4"
            >
              {/* Left Column: Icon + Title + Type Badge */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border ${iconBg}`}>
                  <IconComponent size={18} className="stroke-[1.9]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {cert.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${pillBg} shrink-0`}>
                      {cert.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {cert.subtitle} • {cert.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] text-slate-500">#{cert.certCode}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Calendar size={11} className="text-slate-400" />
                      Issued: {cert.issuedDate}
                    </span>
                    {cert.grade && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-[10px]">
                          {cert.grade}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Download & Share Buttons */}
              <div className="flex items-center justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCertificate(cert)}
                  className="flex-1 md:flex-initial min-h-[38px] px-3.5 py-1.5 rounded-xl border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Preview / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSharingCertificate(cert)}
                  className="flex-1 md:flex-initial min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredCertificates.length === 0 && (
          <div className="p-8 sm:p-10 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <Award className="mx-auto text-slate-300" size={36} />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">No Unlocked Certificates Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-normal">
              You haven't completed any course program or scored 70%+ on a test yet. Review your courses below to track your progress towards unlocking your certificate!
            </p>
          </div>
        )}
      </div>

      {/* 7. Real "Certificates in Progress" Section */}
      {inProgressCourses.length > 0 && (
        <div className="pt-2 space-y-3">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-amber-600" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              Certificates in Progress ({inProgressCourses.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inProgressCourses.map((c) => {
              const remaining = Math.max(0, c.totalLessons - c.completedLessons);

              return (
                <div
                  key={c.courseId}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {c.title} Certificate
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          Course Program • {c.totalLessons} Lessons
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        {c.progress}%
                      </span>
                    </div>

                    {/* Live Progress Bar */}
                    <div className="mt-3 space-y-1.5">
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{c.completedLessons} of {c.totalLessons} lessons completed</span>
                        <span className="font-semibold text-slate-700">{remaining} remaining</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-amber-500" />
                      Unlocks at 100%
                    </span>
                    <Link
                      href="/curriculum"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
                    >
                      Continue Learning <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Certificate Printable / Preview Modal (Fully Responsive on Mobile) */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 max-w-2xl w-full max-h-[94vh] overflow-y-auto shadow-2xl space-y-3.5 sm:space-y-4 animate-in zoom-in-95 duration-200 p-4 sm:p-6 print:p-0 print:border-none print:shadow-none">
            {/* Modal Top Control Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 print:hidden">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">
                  Verified #{selectedCertificate.certCode}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Printer size={13} />
                  <span>Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCertificate(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Official Certificate Visual Canvas (Responsive, no screen overflow) */}
            <div 
              id="printable-certificate"
              className="relative bg-gradient-to-b from-amber-50/40 via-white to-blue-50/20 border-4 sm:border-8 border-double border-amber-300/80 rounded-2xl p-4 sm:p-8 text-center space-y-3 sm:space-y-4 shadow-sm max-w-full overflow-hidden"
            >
              {/* Corner Ornaments */}
              <div className="absolute top-2 left-2 text-amber-500/60 font-serif text-base sm:text-lg">❖</div>
              <div className="absolute top-2 right-2 text-amber-500/60 font-serif text-base sm:text-lg">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-500/60 font-serif text-base sm:text-lg">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-500/60 font-serif text-base sm:text-lg">❖</div>

              {/* Institution Header */}
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm sm:text-base shadow-sm mb-1">
                  VL
                </div>
                <h4 className="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase">
                  Vision Learn Institute
                </h4>
                <p className="text-[9px] sm:text-[10px] text-slate-400 tracking-widest uppercase font-semibold">
                  Accredited Technical Education & Certification
                </p>
              </div>

              {/* Certificate Title */}
              <div className="pt-1">
                <h2 className="text-base sm:text-2xl font-serif font-black text-amber-800 uppercase tracking-wider sm:tracking-widest">
                  Certificate of Achievement
                </h2>
                <div className="w-20 sm:w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-1" />
              </div>

              {/* Recipient */}
              <div className="space-y-0.5 sm:space-y-1 pt-1">
                <p className="text-[11px] sm:text-xs text-slate-500 italic font-serif">This is proudly presented to</p>
                <h3 className="text-xl sm:text-3xl font-serif font-bold text-slate-900 underline decoration-amber-400 decoration-1 underline-offset-4">
                  {studentName}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium pt-0.5">
                  Student ID: <span className="text-slate-700 font-semibold">{studentId}</span>
                </p>
              </div>

              {/* Achievement description */}
              <div className="max-w-md mx-auto text-xs text-slate-600 leading-relaxed font-sans pt-1 px-2">
                has successfully fulfilled all curriculum requirements, assessments, and projects for
                <div className="font-bold text-slate-900 text-xs sm:text-sm mt-1 text-blue-700">
                  {selectedCertificate.title}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                  {selectedCertificate.subtitle}
                </div>
              </div>

              {/* Skills tags */}
              {selectedCertificate.skills && selectedCertificate.skills.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
                  {selectedCertificate.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[9px] sm:text-[10px] font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer: Seal, QR Code, Verification and Signature */}
              <div className="grid grid-cols-3 items-end pt-4 sm:pt-5 border-t border-slate-200/80 text-left gap-2">
                {/* Left: Issued date and cert ID */}
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Issue Date</p>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800">{selectedCertificate.issuedDate}</p>
                  <p className="text-[8px] sm:text-[9px] text-slate-400 font-mono truncate">ID: {selectedCertificate.certCode}</p>
                </div>

                {/* Center: Gold Seal */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-2 border-amber-600 flex items-center justify-center shadow-md shadow-amber-200 text-amber-950 font-black text-[8px] sm:text-[9px] text-center leading-tight uppercase relative">
                    <Sparkles size={11} className="absolute top-1 text-amber-900" />
                    <span>Official<br/>Certified<br/>Seal</span>
                  </div>
                </div>

                {/* Right: Signature */}
                <div className="text-right space-y-0.5 sm:space-y-1">
                  <div className="font-serif italic text-xs sm:text-sm font-bold text-slate-800 leading-none">
                    Director
                  </div>
                  <div className="w-16 sm:w-24 h-[1px] bg-slate-400 ml-auto my-1" />
                  <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Academic Board</p>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Mobile */}
            <div className="flex items-center gap-2 pt-1 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setSharingCertificate(selectedCertificate);
                  setSelectedCertificate(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 size={13} />
                <span>Share</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCertificate(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Share Modal */}
      {sharingCertificate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Share Certificate</h3>
                <p className="text-xs text-slate-500 truncate">{sharingCertificate.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSharingCertificate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Copy link input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Direct Verification Link
              </label>
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <input
                  type="text"
                  readOnly
                  value={`https://visionlearn.edu/verify?id=${sharingCertificate.certCode}`}
                  className="bg-transparent text-xs text-slate-700 flex-1 outline-none font-mono truncate"
                />
                <button
                  type="button"
                  onClick={() => handleCopyShareLink(sharingCertificate)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://visionlearn.edu/verify?id=${sharingCertificate.certCode}`)}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-blue-200/60"
              >
                <LinkedinIcon size={14} />
                <span>LinkedIn</span>
              </a>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my verified ${sharingCertificate.title} from Vision Learn: https://visionlearn.edu/verify?id=${sharingCertificate.certCode}`)}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-200/60"
              >
                <Share2 size={14} />
                <span>WhatsApp</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setSharingCertificate(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer mt-2"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
