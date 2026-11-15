"use client";

import React, { useState } from "react";
import {
  Clock,
  MessageCircle,
  Phone
} from "lucide-react";

interface CourseItem {
  id: string;
  course_code?: string;
  title: string;
  duration?: string;
  category?: string;
  course_level?: string;
  description?: string;
}

interface UnadmittedDashboardProps {
  student: {
    id?: string;
    student_id: string;
    name: string;
    phone?: string;
    education?: string | null;
    qualification?: string | null;
    category?: string | null;
  };
  courses: CourseItem[];
}

const DEFAULT_COURSES: CourseItem[] = [
  {
    id: "adca",
    title: "Advanced Diploma in Computer Applications (ADCA)",
    duration: "12 Months",
    category: "Diploma",
    description: "1-year professional diploma covering office tools, accounting with Tally, C programming, and web design.",
  },
  {
    id: "dca",
    title: "Diploma in Computer Applications (DCA)",
    duration: "6 Months",
    category: "Diploma",
    description: "Practical computer training covering office automation, accounting, internet tools, and data entry.",
  },
  {
    id: "ai-tools",
    title: "AI Tools & Productivity",
    duration: "1.5 Months",
    category: "Short Term",
    description: "Practical workflows using ChatGPT, Gemini, and Claude for research, content creation, and office automation.",
  },
  {
    id: "web-dev",
    title: "Web Development",
    duration: "3 Months",
    category: "Short Term",
    description: "Build responsive websites using modern HTML5, CSS3, Flexbox, and core web fundamentals.",
  },
  {
    id: "tally-gst",
    title: "Tally Prime with GST",
    duration: "2 Months",
    category: "Accounting",
    description: "Hands-on business accounting with GST billing, invoicing, vouchers, and financial reports.",
  },
  {
    id: "bcc",
    title: "Basic Computer Course (BCC)",
    duration: "3 Months",
    category: "Certificate",
    description: "Fundamentals of computers, typing speed, MS Office (Word, Excel, PowerPoint), and internet browsing.",
  },
];

export function UnadmittedDashboard({ student, courses = [] }: UnadmittedDashboardProps) {
  const studentName = student?.name || "Student";
  const studentId = student?.student_id || "VIT001";
  const qualification = student?.education || student?.qualification || "";

  const [activeTab, setActiveTab] = useState<string>("recommended");

  const allCourses: CourseItem[] = courses && courses.length > 0 ? courses : DEFAULT_COURSES;

  const TABS = [
    { id: "recommended", label: "Recommended" },
    { id: "all", label: "All Courses" },
    { id: "Diploma", label: "Diploma" },
    { id: "Short Term", label: "Short Term" },
  ];

  const getFilteredCourses = () => {
    if (activeTab === "all") return allCourses;

    if (activeTab === "recommended") {
      const lowerQual = qualification.toLowerCase();
      if (lowerQual.includes("working") || lowerQual.includes("professional")) {
        return allCourses.filter((c) => {
          const t = (c.title + " " + (c.category || "")).toLowerCase();
          return t.includes("ai") || t.includes("tally") || t.includes("diploma") || t.includes("web") || t.includes("workspace");
        });
      }
      if (lowerQual.includes("school")) {
        return allCourses.filter((c) => {
          const t = (c.title + " " + (c.category || "")).toLowerCase();
          return t.includes("basic") || t.includes("bcc") || t.includes("ai") || t.includes("web");
        });
      }
      return allCourses.slice(0, 6);
    }

    return allCourses.filter((c) => {
      const cat = (c.category || "").toLowerCase();
      const title = c.title.toLowerCase();
      if (activeTab === "Diploma") return cat.includes("diploma") || title.includes("diploma") || title.includes("adca") || title.includes("dca");
      if (activeTab === "Short Term") return !cat.includes("diploma") && !title.includes("diploma");
      return cat.includes(activeTab.toLowerCase());
    });
  };

  const displayedCourses = getFilteredCourses();
  const safeCourses = displayedCourses.length > 0 ? displayedCourses : allCourses;

  const handleApply = (courseTitle: string) => {
    const text = `Hello Vision IT Institute, my name is ${studentName} (Student ID: ${studentId}). I want to enroll in ${courseTitle}. Please share batch timings and details.`;
    window.open(`https://wa.me/918103170595?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Welcome, {studentName} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Select a course below to enroll and start learning.
        </p>
      </div>

      {/* 2. Course Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Available Courses
          </h2>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer touch-manipulation ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeCourses.map((course) => (
          <div
            key={course.id || course.title}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {course.category || "Course"}
                </span>
                {course.duration && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Clock size={12} className="text-slate-400" />
                    <span>{course.duration}</span>
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {course.title}
              </h3>

              {course.description && (
                <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleApply(course.title)}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle size={15} />
                <span>Apply on WhatsApp</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Help Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold">Need help choosing a course?</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect with our academic counselors for batch timings and fee details.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="https://wa.me/918103170595?text=Hello%20Vision%20IT%20Institute%2C%20I%20need%20guidance%20for%20admission."
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all active:scale-95"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </a>
          <a
            href="tel:+918103170595"
            className="h-9 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg border border-white/10 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Phone size={14} />
            <span>Call Desk</span>
          </a>
        </div>
      </div>
    </div>
  );
}
