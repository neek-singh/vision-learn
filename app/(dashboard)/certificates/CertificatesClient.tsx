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
  Sparkles
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
  issuedDate: string; // "10 Oct 2026"
  issuedDateRaw: string; // YYYY-MM-DD
  iconType: "blue_cert" | "excel" | "rose_trophy" | "purple_trophy" | "amber_code" | "emerald_code";
  skills?: string[];
  grade?: string;
}

const INITIAL_CERTIFICATES: CertificateItem[] = [
  {
    id: "cert-1",
    certCode: "VL-2026-WD-0982",
    title: "Web Development Certificate",
    subtitle: "Completed Web Development Course",
    description: "HTML, CSS, JavaScript, Responsive Design",
    type: "Course",
    issuedDate: "10 Oct 2026",
    issuedDateRaw: "2026-10-10",
    iconType: "blue_cert",
    skills: ["HTML5", "CSS3", "JavaScript ES6+", "Responsive Design", "Flexbox & Grid"],
    grade: "Grade A+"
  },
  {
    id: "cert-2",
    certCode: "VL-2026-MSO-0412",
    title: "MS Office Certificate",
    subtitle: "Completed MS Office Course",
    description: "Word, Excel, PowerPoint",
    type: "Course",
    issuedDate: "25 Sep 2026",
    issuedDateRaw: "2026-09-25",
    iconType: "excel",
    skills: ["MS Word Advanced", "Excel Formulas & Pivot Tables", "PowerPoint Presentations"],
    grade: "Grade A"
  },
  {
    id: "cert-3",
    certCode: "VL-2026-TST-0731",
    title: "HTML Basics Test Certificate",
    subtitle: "Scored 90% in HTML Basics Test",
    description: "20 Questions | 18 Correct",
    type: "Test",
    issuedDate: "18 Sep 2026",
    issuedDateRaw: "2026-09-18",
    iconType: "rose_trophy",
    skills: ["Semantic HTML", "Forms & Tables", "Audio & Video Integration"],
    grade: "Score: 18/20 (90%)"
  },
  {
    id: "cert-4",
    certCode: "VL-2026-TST-0814",
    title: "CSS Fundamentals Test Certificate",
    subtitle: "Scored 85% in CSS Fundamentals Test",
    description: "25 Questions | 21 Correct",
    type: "Test",
    issuedDate: "12 Sep 2026",
    issuedDateRaw: "2026-09-12",
    iconType: "purple_trophy",
    skills: ["Selectors & Specificity", "Box Model", "Flexbox Layout", "CSS Animations"],
    grade: "Score: 21/25 (85%)"
  },
  {
    id: "cert-5",
    certCode: "VL-2026-PRJ-0199",
    title: "Portfolio Project Certificate",
    subtitle: "Completed Personal Portfolio Project",
    description: "HTML, CSS, JavaScript (Live Project)",
    type: "Project",
    issuedDate: "05 Sep 2026",
    issuedDateRaw: "2026-09-05",
    iconType: "amber_code",
    skills: ["Responsive UI", "Interactive DOM", "GitHub Pages Deployment"],
    grade: "Verified Project"
  },
  {
    id: "cert-6",
    certCode: "VL-2026-PY-0518",
    title: "Python Basics Certificate",
    subtitle: "Completed Python Basics Course",
    description: "Python Fundamentals and Practice",
    type: "Course",
    issuedDate: "28 Aug 2026",
    issuedDateRaw: "2026-08-28",
    iconType: "emerald_code",
    skills: ["Data Types & Variables", "Control Structures", "Functions & Modules"],
    grade: "Grade A"
  }
];

export default function CertificatesClient({
  studentName = "Neeraj Singh",
  studentId = "WD-2026",
  courseTitle = "Web Development"
}: {
  studentName?: string;
  studentId?: string;
  courseTitle?: string;
}) {
  const [activeTab, setActiveTab] = useState<string>("all"); // "all", "Course", "Test", "Project"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // Modals state
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateItem | null>(null);
  const [sharingCertificate, setSharingCertificate] = useState<CertificateItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const total = INITIAL_CERTIFICATES.length;
    const coursesCount = INITIAL_CERTIFICATES.filter(c => c.type === "Course").length;
    const testsCount = INITIAL_CERTIFICATES.filter(c => c.type === "Test").length;
    const projectsCount = INITIAL_CERTIFICATES.filter(c => c.type === "Project").length;

    return {
      total,
      coursesCount,
      testsCount,
      projectsCount
    };
  }, []);

  // Filtered certificates list
  const filteredCertificates = useMemo(() => {
    return INITIAL_CERTIFICATES.filter(item => {
      // 1. Tab filter
      if (activeTab !== "all" && item.type.toLowerCase() !== activeTab.toLowerCase()) {
        return false;
      }

      // 2. Type dropdown filter
      if (selectedType !== "all" && item.type.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSubtitle = item.subtitle.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCode = item.certCode.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubtitle && !matchesDesc && !matchesCode) {
          return false;
        }
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
  }, [activeTab, selectedType, searchQuery, sortOrder]);

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
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Breadcrumbs Navigation */}
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
        <span className="text-slate-800 font-semibold">Certificates</span>
      </div>

      {/* 2. Hero Banner */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-purple-50/30 rounded-2xl border border-blue-100/70 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden shadow-2xs">
        {/* Left: Icon + Title + Feature Badges */}
        <div className="flex items-start sm:items-center gap-3.5 z-10">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-100/90 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Award size={28} className="stroke-[1.9]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              My Certificates
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              Earn certificates by completing your courses, tests and projects.
            </p>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2.5 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1 text-[11px] text-slate-600">
                <ShieldCheck size={13} className="text-blue-600" />
                <span>Verified Certificates</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-600">
                <Download size={13} className="text-blue-600" />
                <span>Digital Download</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-600">
                <QrCode size={13} className="text-blue-600" />
                <span>QR Code Verification</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-600">
                <LinkedinIcon size={13} className="text-blue-600" />
                <span>Share on LinkedIn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Graphic: Illustrated Certificate Document + Plant + Cap */}
        <div className="hidden lg:flex items-center opacity-90 pr-2 z-10 shrink-0">
          <svg className="w-32 h-20" viewBox="0 0 140 85" fill="none">
            {/* Certificate Paper */}
            <rect x="25" y="12" width="65" height="58" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.8" />
            <rect x="29" y="16" width="57" height="50" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="3 3" />
            
            {/* Header in Certificate */}
            <text x="36" y="27" fill="#3B82F6" fontSize="5.5" fontWeight="bold">CERTIFICATE EARNED</text>
            
            {/* Placeholder Lines */}
            <line x1="36" y1="36" x2="78" y2="36" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="36" y1="43" x2="68" y2="43" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="36" y1="50" x2="55" y2="50" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />

            {/* Gold Ribbon Seal */}
            <circle cx="74" cy="54" r="5.5" fill="#FDE047" stroke="#EAB308" strokeWidth="1.2" />
            <path d="M72 58L70 65L74 63L78 65L76 58" fill="#EAB308" />

            {/* Graduation Cap perched on top right */}
            <path d="M96 22L116 14L136 22L116 30L96 22Z" fill="#1E3A8A" />
            <path d="M104 25.5V36C104 39 128 39 128 36V25.5" fill="#1E3A8A" opacity="0.9" />
            <path d="M136 22V32" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="136" cy="33" r="1.5" fill="#EAB308" />

            {/* Potted Green Plant */}
            <path d="M116 52C116 52 119 40 124 40C129 40 132 52 132 52" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M124 40V56" stroke="#059669" strokeWidth="2" />
            <path d="M118 56H130L128 67H120L118 56Z" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* 3. Top 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Certificates Earned */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <FileText size={20} className="stroke-[1.9]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
              {stats.total}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1">Certificates Earned</div>
            <div className="text-[10px] text-slate-400 mt-0.5">From courses, tests & projects</div>
          </div>
        </div>

        {/* Card 2: Course Certificates */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="stroke-[1.9]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
              {stats.coursesCount}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1">Course Certificates</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Completed courses</div>
          </div>
        </div>

        {/* Card 3: Test Certificates */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <Trophy size={20} className="stroke-[1.9]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
              {stats.testsCount}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1">Test Certificates</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Performance based</div>
          </div>
        </div>

        {/* Card 4: Project Certificate */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <Layers size={20} className="stroke-[1.9]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
              {stats.projectsCount}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1">Project Certificate</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Practical project work</div>
          </div>
        </div>
      </div>

      {/* 4. Filter Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2.5 px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === "all"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          All Certificates ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab("Course")}
          className={`pb-2.5 px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === "Course"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Course ({stats.coursesCount})
        </button>
        <button
          onClick={() => setActiveTab("Test")}
          className={`pb-2.5 px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === "Test"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Test ({stats.testsCount})
        </button>
        <button
          onClick={() => setActiveTab("Project")}
          className={`pb-2.5 px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === "Project"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Project ({stats.projectsCount})
        </button>
      </div>

      {/* 5. Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[220px] max-w-lg">
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
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Right: Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Filter: All Types */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="appearance-none bg-white text-xs font-medium text-slate-700 py-2 pl-3 pr-7 rounded-xl border border-slate-200/80 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Course">Course</option>
              <option value="Test">Test</option>
              <option value="Project">Project</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
      </div>

      {/* 6. Certificate Cards List */}
      <div className="space-y-2">
        {filteredCertificates.map((cert) => {
          // Dynamic icon and colors
          let iconBg = "bg-blue-50 text-blue-600 border-blue-100";
          let IconComponent = Award;

          if (cert.iconType === "excel") {
            iconBg = "bg-emerald-50 text-emerald-600 border-emerald-100";
            IconComponent = FileSpreadsheet;
          } else if (cert.iconType === "rose_trophy") {
            iconBg = "bg-rose-50 text-rose-600 border-rose-100";
            IconComponent = Trophy;
          } else if (cert.iconType === "purple_trophy") {
            iconBg = "bg-purple-50 text-purple-600 border-purple-100";
            IconComponent = Trophy;
          } else if (cert.iconType === "amber_code") {
            iconBg = "bg-amber-50 text-amber-600 border-amber-100";
            IconComponent = Code2;
          } else if (cert.iconType === "emerald_code") {
            iconBg = "bg-emerald-50 text-emerald-600 border-emerald-100";
            IconComponent = Terminal;
          }

          // Type pill styling
          let pillBg = "bg-blue-50 text-blue-600 border-blue-100";
          if (cert.type === "Test") {
            pillBg = "bg-purple-50 text-purple-700 border-purple-100";
          } else if (cert.type === "Project") {
            pillBg = "bg-amber-50 text-amber-700 border-amber-100";
          }

          return (
            <div
              key={cert.id}
              className="bg-white rounded-xl border border-slate-200/80 py-2.5 px-3.5 sm:px-4 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3"
            >
              {/* Left Column: Icon + Title + Type Badge */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 border ${iconBg}`}>
                  <IconComponent size={16} className="stroke-[1.8]" />
                </div>

                <div className="min-w-0 flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-normal text-slate-800 truncate">
                    {cert.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-normal border ${pillBg} shrink-0`}>
                    {cert.type}
                  </span>
                </div>
              </div>

              {/* Middle Column: Issued Date Block */}
              <div className="flex md:flex-col items-center md:items-start gap-0.5 text-[11px] text-slate-500 shrink-0 border-t md:border-t-0 pt-1.5 md:pt-0 border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 font-normal text-[10px]">
                  <Calendar size={11} />
                  <span>Issued On</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 font-normal text-[11px]">
                  <Award size={11} className="text-blue-600" />
                  <span>{cert.issuedDate}</span>
                </div>
              </div>

              {/* Right Column: Download & Share Buttons + Menu */}
              <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 pt-1.5 md:pt-0 border-t md:border-t-0 border-slate-100">
                {/* Download Button */}
                <button
                  onClick={() => setSelectedCertificate(cert)}
                  className="px-3 py-1 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-normal transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={12} />
                  <span>Download</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => setSharingCertificate(cert)}
                  className="px-3 py-1 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-normal transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 size={12} />
                  <span>Share</span>
                </button>

                {/* Three dots options */}
                <button
                  onClick={() => setSelectedCertificate(cert)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors cursor-pointer"
                  title="More details"
                >
                  <MoreVertical size={15} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredCertificates.length === 0 && (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <Award className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-slate-700 font-bold text-sm">No certificates found</p>
            <p className="text-slate-400 text-xs mt-1">Try adjusting your search query or active filter.</p>
          </div>
        )}
      </div>

      {/* 7. Certificate Printable / Preview Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 p-5 sm:p-6 print:p-0 print:border-none print:shadow-none">
            {/* Modal Top Control Bar (Hidden when printing) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-800">Verified Certificate #{selectedCertificate.certCode}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintCertificate}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Printer size={13} />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Official Certificate Visual Canvas */}
            <div 
              id="printable-certificate"
              className="relative bg-gradient-to-b from-amber-50/40 via-white to-blue-50/20 border-8 border-double border-amber-300/80 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm"
            >
              {/* Corner Ornaments */}
              <div className="absolute top-2 left-2 text-amber-500/60 font-serif text-lg">❖</div>
              <div className="absolute top-2 right-2 text-amber-500/60 font-serif text-lg">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-500/60 font-serif text-lg">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-500/60 font-serif text-lg">❖</div>

              {/* Institution Header */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm mb-1">
                  VL
                </div>
                <h4 className="text-base font-black tracking-wider text-slate-900 uppercase">
                  Vision Learn Institute
                </h4>
                <p className="text-[10px] text-slate-400 tracking-widest uppercase font-semibold">
                  Accredited Technical Education & Certification
                </p>
              </div>

              {/* Certificate Title */}
              <div className="pt-2">
                <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-800 uppercase tracking-widest">
                  Certificate of Achievement
                </h2>
                <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-1" />
              </div>

              {/* Recipient */}
              <div className="space-y-1 pt-1">
                <p className="text-xs text-slate-500 italic font-serif">This is proudly presented to</p>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 underline decoration-amber-400 decoration-1 underline-offset-4">
                  {studentName}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium pt-0.5">
                  Student ID: <span className="text-slate-700 font-semibold">{studentId}</span>
                </p>
              </div>

              {/* Achievement description */}
              <div className="max-w-md mx-auto text-xs text-slate-600 leading-relaxed font-sans pt-1">
                has successfully fulfilled all curriculum requirements, assessments, and projects for
                <div className="font-bold text-slate-900 text-sm mt-1 text-blue-700">
                  {selectedCertificate.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {selectedCertificate.subtitle} — {selectedCertificate.description}
                </div>
              </div>

              {/* Skills tags */}
              {selectedCertificate.skills && selectedCertificate.skills.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {selectedCertificate.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer: Seal, QR Code, Verification and Signature */}
              <div className="grid grid-cols-3 items-end pt-5 border-t border-slate-200/80 text-left">
                {/* Left: Issued date and cert ID */}
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Issue Date</p>
                  <p className="text-xs font-bold text-slate-800">{selectedCertificate.issuedDate}</p>
                  <p className="text-[9px] text-slate-400 font-mono pt-1">ID: {selectedCertificate.certCode}</p>
                </div>

                {/* Center: Gold Seal */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-2 border-amber-600 flex items-center justify-center shadow-md shadow-amber-200 text-amber-950 font-black text-[9px] text-center leading-tight uppercase relative">
                    <Sparkles size={12} className="absolute top-1 text-amber-900" />
                    <span>Official<br/>Certified<br/>Seal</span>
                  </div>
                </div>

                {/* Right: Signature */}
                <div className="text-right space-y-1">
                  <div className="font-serif italic text-sm font-bold text-slate-800 leading-none">
                    Neeraj Sir
                  </div>
                  <div className="w-24 h-[1px] bg-slate-400 ml-auto my-1" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Academic Director</p>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Mobile */}
            <div className="flex items-center gap-2 pt-1 print:hidden">
              <button
                onClick={() => {
                  setSharingCertificate(selectedCertificate);
                  setSelectedCertificate(null);
                }}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 size={13} />
                <span>Share Certificate</span>
              </button>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Share Modal */}
      {sharingCertificate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Share Certificate</h3>
                <p className="text-xs text-slate-500">{sharingCertificate.title}</p>
              </div>
              <button
                onClick={() => setSharingCertificate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
            <div className="grid grid-cols-2 gap-2 pt-2">
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
              onClick={() => setSharingCertificate(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer mt-2"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
