"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { getOfflineData, saveOfflineData, OFFLINE_KEYS } from "@/lib/offline-store";
import { 
  Play, 
  BookOpen, 
  Layers, 
  Clock, 
  MoreVertical, 
  Search, 
  Check, 
  FileText, 
  RotateCcw, 
  ArrowRight,
  GraduationCap,
  Code2,
  FileSpreadsheet,
  Cpu,
  ShieldCheck,
  ShoppingBag
} from "lucide-react";

interface CoursesClientProps {
  initialEnrollments: any[];
  allCourses: any[];
  modulesCountMap: Record<string, number>;
  lessonsCountMap: Record<string, number>;
  studentId: string;
}

export function CoursesClient({
  initialEnrollments: propEnrollments,
  allCourses: propAllCourses,
  modulesCountMap: propModulesCountMap,
  lessonsCountMap: propLessonsCountMap,
  studentId,
}: CoursesClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | "enrolled" | "available">("all");
  const [exploreFilter, setExploreFilter] = useState<"all" | "free" | "paid" | "popular">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Safe offline hydration inside useEffect to prevent React 19 hydration mismatch
  const [cachedData, setCachedData] = useState<any>(null);

  useEffect(() => {
    if (!propEnrollments || propEnrollments.length === 0) {
      const cached = getOfflineData<any>(OFFLINE_KEYS.COURSES);
      if (cached) {
        setCachedData(cached);
      }
    }
  }, [propEnrollments]);

  const initialEnrollments: any[] = (propEnrollments && propEnrollments.length > 0) ? propEnrollments : (cachedData?.initialEnrollments || []);
  const allCourses: any[] = (propAllCourses && propAllCourses.length > 0) ? propAllCourses : (cachedData?.allCourses || []);
  const modulesCountMap = propModulesCountMap || cachedData?.modulesCountMap || {};
  const lessonsCountMap = propLessonsCountMap || cachedData?.lessonsCountMap || {};

  // Auto-cache courses whenever valid server data is provided
  useEffect(() => {
    if (propEnrollments && propEnrollments.length > 0) {
      saveOfflineData(OFFLINE_KEYS.COURSES, {
        initialEnrollments: propEnrollments,
        allCourses: propAllCourses,
        modulesCountMap: propModulesCountMap,
        lessonsCountMap: propLessonsCountMap,
      });
    }
  }, [propEnrollments, propAllCourses, propModulesCountMap, propLessonsCountMap]);

  // Prepare Enrolled Courses data
  const enrolledCourses = useMemo(() => {
    return (initialEnrollments || []).map((enrollment: any) => {
      const course = enrollment.courses || {};
      const courseId = enrollment.course_id;
      const progress = typeof enrollment.progress_percentage === "number"
        ? Math.min(Math.max(enrollment.progress_percentage, 0), 100)
        : 0;
      const isCompleted = progress >= 100;
      
      const modulesCount = modulesCountMap[courseId] ?? (course.curriculum?.length || 0);
      const lessonsCount = lessonsCountMap[courseId] ?? 0;
      const duration = course.duration || "Self-Paced";

      // Custom icon and color based on title/code
      const titleLower = (course.title || "").toLowerCase();
      let icon = <Layers size={22} />;
      let iconBg = "bg-sky-500 text-white";

      if (titleLower.includes("dca") || titleLower.includes("computer")) {
        icon = <Layers size={22} />;
        iconBg = "bg-sky-500 text-white";
      } else if (titleLower.includes("excel") || titleLower.includes("office") || titleLower.includes("tally")) {
        icon = <FileSpreadsheet size={22} />;
        iconBg = "bg-emerald-600 text-white";
      } else if (titleLower.includes("ai") || titleLower.includes("prompt") || titleLower.includes("machine")) {
        icon = <Cpu size={22} />;
        iconBg = "bg-rose-500 text-white";
      } else if (titleLower.includes("python") || titleLower.includes("programming") || titleLower.includes("web") || titleLower.includes("code")) {
        icon = <Code2 size={22} />;
        iconBg = "bg-blue-600 text-white";
      }

      return {
        id: enrollment.id,
        courseId,
        title: course.title || "Course Title",
        subtitle: course.description || "Comprehensive institute verified curriculum",
        batch: enrollment.batch || null,
        progress,
        isCompleted,
        duration,
        modulesCount,
        lessonsCount,
        icon,
        iconBg,
      };
    });
  }, [initialEnrollments, modulesCountMap, lessonsCountMap]);

  // Dynamic Explore courses derived 100% from Supabase courses
  const exploreCoursesCatalog = useMemo(() => {
    const enrolledIds = new Set((initialEnrollments || []).map((e: any) => e.course_id));

    if (!allCourses || allCourses.length === 0) {
      return [];
    }

    return allCourses
      .filter((c: any) => !enrolledIds.has(c.id))
      .map((c: any, idx: number) => {
        const titleLower = (c.title || "").toLowerCase();
        let iconBg = "bg-purple-100 text-purple-600";
        let iconType = "cap";

        if (titleLower.includes("web") || titleLower.includes("html") || titleLower.includes("css")) {
          iconBg = "bg-orange-100 text-orange-600";
          iconType = "html";
        } else if (titleLower.includes("python") || titleLower.includes("programming") || titleLower.includes("code")) {
          iconBg = "bg-sky-100 text-sky-600";
          iconType = "python";
        } else if (titleLower.includes("security") || titleLower.includes("cyber") || titleLower.includes("ethical")) {
          iconBg = "bg-slate-100 text-slate-700";
          iconType = "shield";
        } else if (titleLower.includes("excel") || titleLower.includes("office") || titleLower.includes("tally")) {
          iconBg = "bg-emerald-100 text-emerald-700";
          iconType = "cap";
        }

        // Proper fee calculation from DB columns (fee & discount_fee)
        const fee = typeof c.fee === "number" ? c.fee : (typeof c.price === "number" ? c.price : 0);
        const discountFee = typeof c.discount_fee === "number" ? c.discount_fee : 0;
        
        let priceStr = "Free";
        let origPriceStr = "";
        let discountStr = "";
        const isPaid = (fee > 0 || discountFee > 0);

        if (discountFee > 0 && fee > discountFee) {
          priceStr = `₹${discountFee.toLocaleString("en-IN")}`;
          origPriceStr = `₹${fee.toLocaleString("en-IN")}`;
          discountStr = `${Math.round(((fee - discountFee) / fee) * 100)}% OFF`;
        } else if (fee > 0) {
          priceStr = `₹${fee.toLocaleString("en-IN")}`;
        } else if (discountFee > 0) {
          priceStr = `₹${discountFee.toLocaleString("en-IN")}`;
        }

        const features = (c.key_features && Array.isArray(c.key_features) && c.key_features.length > 0)
          ? c.key_features.slice(0, 3)
          : ["Practical Projects", "Certificate on Completion", "Expert Mentorship"];

        return {
          id: c.id,
          title: c.title || "Course",
          subtitle: c.description || "Comprehensive institute verified curriculum",
          duration: c.duration || "Self-Paced",
          modules: modulesCountMap[c.id] ?? (c.curriculum?.length || 0),
          lessons: lessonsCountMap[c.id] ?? 0,
          price: priceStr,
          originalPrice: origPriceStr,
          discount: discountStr,
          isPopular: Boolean(c.is_featured || idx === 0),
          isNew: idx < 3,
          isPaid,
          features,
          iconBg,
          iconType
        };
      });
  }, [allCourses, initialEnrollments, modulesCountMap, lessonsCountMap]);

  // Filter explore courses
  const filteredExploreCourses = useMemo(() => {
    return exploreCoursesCatalog.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchSub = c.subtitle.toLowerCase().includes(q);
        if (!matchTitle && !matchSub) return false;
      }
      if (exploreFilter === "popular") return c.isPopular;
      if (exploreFilter === "free") return !c.isPaid;
      if (exploreFilter === "paid") return c.isPaid;
      return true;
    });
  }, [exploreCoursesCatalog, searchQuery, exploreFilter]);

  const totalAllCount = enrolledCourses.length + exploreCoursesCatalog.length;

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12 px-2 sm:px-4">
      {/* 1. Page Header & Hero Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Courses
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Continue your learning journey with Vision Learn
          </p>
        </div>

        {/* Small Inspirational Hero Banner */}
        <div className="bg-gradient-to-r from-sky-100/80 via-sky-50 to-blue-100/70 border border-sky-200/60 rounded-xl p-3 sm:px-4 sm:py-2.5 relative overflow-hidden flex items-center justify-between gap-3 shadow-2xs w-full md:w-auto md:min-w-[420px]">
          <div className="relative z-10 min-w-0">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight">
              Learn • Practice • Succeed
            </h2>
            <p className="text-[10px] text-slate-600 font-medium mt-0.5 max-w-xs leading-snug">
              Build your skills with expert designed courses and real-world projects.
            </p>
          </div>

          {/* Background Desk Image smoothly blended */}
          <div className="hidden sm:block relative shrink-0 w-28 h-14 rounded-lg overflow-hidden border border-white/60 shadow-2xs">
            <img 
              src="/images/course_banner_desk.jpg" 
              alt="Study Desk" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-sky-50/50 via-transparent to-transparent" />
          </div>
        </div>
      </div>

      {/* 2. Horizontal Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 sm:gap-7 overflow-x-auto text-xs sm:text-sm font-semibold text-slate-500 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 -mb-[10px] transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "all"
              ? "text-blue-600 font-bold border-b-2 border-blue-600"
              : "text-slate-600 font-medium hover:text-slate-900 border-b-2 border-transparent"
          }`}
        >
          All Courses ({totalAllCount})
        </button>

        <button
          onClick={() => setActiveTab("enrolled")}
          className={`pb-2 -mb-[10px] transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "enrolled"
              ? "text-blue-600 font-bold border-b-2 border-blue-600"
              : "text-slate-600 font-medium hover:text-slate-900 border-b-2 border-transparent"
          }`}
        >
          My Enrolled Courses ({enrolledCourses.length})
        </button>

        <button
          onClick={() => setActiveTab("available")}
          className={`pb-2 -mb-[10px] transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "available"
              ? "text-blue-600 font-bold border-b-2 border-blue-600"
              : "text-slate-600 font-medium hover:text-slate-900 border-b-2 border-transparent"
          }`}
        >
          Available Courses ({exploreCoursesCatalog.length})
        </button>
      </div>

      {/* 3. Section: Your Enrolled Courses */}
      {(activeTab === "enrolled" || activeTab === "all") && (
        <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Your Enrolled Courses</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Courses you have purchased or joined. Continue learning from where you left.
              </p>
            </div>
            <Link
              href="/curriculum"
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg px-2.5 py-1 transition-all flex items-center gap-1 shadow-2xs whitespace-nowrap shrink-0"
            >
              <span>View All My Courses</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* Enrolled Courses Cards Grid or Empty State */}
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
              <BookOpen size={36} className="mx-auto text-slate-300" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-700">No Enrolled Courses Yet</h3>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                You have not been assigned to any course yet. Explore our course catalog below or contact the institute admin to enroll.
              </p>
              <button
                onClick={() => setActiveTab("available")}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <span>Browse Available Courses</span>
                <ArrowRight size={12} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {enrolledCourses.map((course: any) => (
                <div 
                  key={course.id}
                  className="bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 p-3.5 space-y-3 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between"
                >
                  {/* Header: Icon + Title + Status Badge + Dot menu */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs font-bold text-xs ${course.iconBg}`}>
                          {course.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                            {course.title}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                            {course.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {course.batch && (
                          <span 
                            className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded-md truncate max-w-[120px]"
                            title={`Batch: ${course.batch}`}
                          >
                            {course.batch}
                          </span>
                        )}
                        {course.isCompleted ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                            Completed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mr-2">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-700" 
                            style={{ width: `${course.progress}%` }} 
                          />
                        </div>
                        <span className="text-slate-700 text-[10px] shrink-0 min-w-[24px] text-right">
                          {course.progress}%
                        </span>
                      </div>
                    </div>

                    {/* Meta items: Duration, Modules, Lessons */}
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 pt-1 border-t border-slate-100/80">
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-blue-600" />
                        <span>{course.duration}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen size={11} className="text-blue-600" />
                        <span>{course.modulesCount} Modules</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={11} className="text-blue-600" />
                        <span>{course.lessonsCount}+ Lessons</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Continue Learning & View Syllabus */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href={`/curriculum?course=${course.courseId}`}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-1.5 px-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1 shadow-2xs"
                    >
                      {course.isCompleted ? (
                        <>
                          <RotateCcw size={11} />
                          <span>Review Course</span>
                        </>
                      ) : (
                        <>
                          <Play size={10} className="fill-current" />
                          <span>Continue Learning</span>
                        </>
                      )}
                    </Link>

                    <Link
                      href={`/curriculum?course=${course.courseId}&tab=syllabus`}
                      className="w-full bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200/80 font-bold py-1.5 px-2 rounded-lg text-xs transition-all flex items-center justify-center text-center"
                    >
                      <span>View Syllabus</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Section: Available Courses */}
      {(activeTab === "available" || activeTab === "all" || activeTab === "enrolled") && (
        <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Available Courses ({exploreCoursesCatalog.length})
              </h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Explore additional institute courses, syllabus & certifications to expand your skills.
              </p>
            </div>

            {/* Filter pills and mini search */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              {/* Mini Search box */}
              <div className="relative flex-1 sm:w-44">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <button
                  onClick={() => setExploreFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    exploreFilter === "all" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setExploreFilter("free")}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    exploreFilter === "free" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Free
                </button>
                <button
                  onClick={() => setExploreFilter("paid")}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    exploreFilter === "paid" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Paid
                </button>
                <button
                  onClick={() => setExploreFilter("popular")}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    exploreFilter === "popular" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Popular
                </button>
              </div>
            </div>
          </div>

          {/* Explore Courses Cards Grid */}
          {filteredExploreCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {filteredExploreCourses.map((course: any) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 p-3.5 space-y-3 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Top: Icon + Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${course.iconBg}`}>
                        {course.iconType === "cap" && <GraduationCap size={20} />}
                        {course.iconType === "html" && <Code2 size={20} />}
                        {course.iconType === "python" && <Code2 size={20} />}
                        {course.iconType === "shield" && <ShieldCheck size={20} />}
                      </div>

                      <div className="flex items-center gap-1">
                        {course.isPopular && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-1.5 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                        {course.isNew && (
                          <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200/70 px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                          {course.isPaid ? "Paid" : "Free"}
                        </span>
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-2">
                        {course.subtitle}
                      </p>
                    </div>

                    {/* Meta: Duration, Modules, Lessons */}
                    <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 pt-1 border-t border-slate-100/80">
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} className="text-blue-600" />
                        <span>{course.duration}</span>
                      </span>
                      <span className="flex items-center gap-0.5">
                        <BookOpen size={10} className="text-blue-600" />
                        <span>{course.modules} Modules</span>
                      </span>
                      <span className="flex items-center gap-0.5">
                        <FileText size={10} className="text-blue-600" />
                        <span>{course.lessons}+ Lessons</span>
                      </span>
                    </div>

                    {/* Key Features List */}
                    <div className="space-y-1 pt-1">
                      {course.features.map((feat: string, fIdx: number) => (
                        <div key={fIdx} className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                          <Check size={11} className="text-emerald-500 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pricing row */}
                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="text-sm font-black text-slate-900">{course.price}</span>
                      <span className="text-[10px] text-slate-400 line-through font-medium">{course.originalPrice}</span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                        {course.discount}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Buttons: Buy Now & View Details */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100/80">
                    <button 
                      onClick={() => {
                        alert(`Enrollment / Payment inquiry for ${course.title} submitted. Institute admin will verify.`);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-1.5 px-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <ShoppingBag size={11} />
                      <span>Buy Now</span>
                    </button>

                    <Link
                      href={`/curriculum?course=${course.id}&tab=syllabus`}
                      className="w-full bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200/80 font-bold py-1.5 px-2 rounded-lg text-xs transition-all flex items-center justify-center text-center"
                    >
                      <span>View Details</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
                <BookOpen size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-700">No additional courses available</p>
              <p className="text-[11px] text-slate-400">You are enrolled in all available courses or matching your search criteria.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
