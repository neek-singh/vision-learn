"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  ChevronDown, 
  PlayCircle, 
  FileText, 
  PenTool, 
  Loader2,
  Check,
  Lock,
  Play,
  Zap,
  Award,
  Clock,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FolderCode,
  Video,
  ListOrdered,
  LayoutList,
  ArrowUpDown,
  Home,
  ChevronRight,
  Monitor,
  Circle,
  Download,
  Users,
  Bell,
  User,
  Briefcase,
  Star,
  Code2,
  CheckCircle,
  FileCode,
  ExternalLink,
  MoreVertical,
  TrendingUp,
  Smartphone,
  Cpu,
  Eye,
  Link2,
  FileSpreadsheet,
  Presentation,
  X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import { CacheManager } from "@/lib/cache-manager";
import { useCachedCurriculum } from "@/hooks/use-cached-curriculum";
import { DownloadButton } from "@/components/DownloadButton";
import { useSearchParams, useRouter } from "next/navigation";

const LessonViewer = dynamic(() => import("./LessonViewer"), {
  loading: () => <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center">
    <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
      <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Opening Lesson...</p>
    </div>
  </div>
});

const NoteViewer = dynamic(() => import("@/app/(dashboard)/materials/NoteViewer"), {
  loading: () => null
});

function getMaterialTypeConfig(type: string = "") {
  const t = type.toLowerCase().trim();
  switch (t) {
    case "excel":
    case "sheets":
    case "sheet":
      return {
        label: "EXCEL",
        Icon: FileSpreadsheet,
        badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        iconCls: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
      };
    case "word":
    case "doc":
    case "docx":
      return {
        label: "WORD",
        Icon: FileText,
        badgeCls: "bg-blue-50 text-blue-700 border-blue-200/70",
        iconCls: "bg-blue-50 text-blue-600 border-blue-200/70",
      };
    case "powerpoint":
    case "ppt":
    case "pptx":
      return {
        label: "PPT",
        Icon: Presentation,
        badgeCls: "bg-orange-50 text-orange-700 border-orange-200/80",
        iconCls: "bg-orange-50 text-orange-600 border-orange-200/80",
      };
    case "pdf":
      return {
        label: "PDF",
        Icon: FileText,
        badgeCls: "bg-rose-50 text-rose-700 border-rose-200/70",
        iconCls: "bg-rose-50 text-rose-600 border-rose-200/70",
      };
    case "video":
      return {
        label: "VIDEO",
        Icon: Video,
        badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
        iconCls: "bg-indigo-50 text-indigo-600 border-indigo-200/70",
      };
    case "windows":
      return {
        label: "WINDOWS",
        Icon: FileText,
        badgeCls: "bg-sky-50 text-sky-700 border-sky-200/70",
        iconCls: "bg-sky-50 text-sky-600 border-sky-200/70",
      };
    case "note":
    case "notes":
    case "code":
      return {
        label: "NOTES",
        Icon: BookOpen,
        badgeCls: "bg-amber-50 text-amber-800 border-amber-200/80",
        iconCls: "bg-amber-50 text-amber-600 border-amber-200/80",
      };
    default:
      return {
        label: t.toUpperCase() || "DOC",
        Icon: FileText,
        badgeCls: "bg-slate-100 text-slate-700 border-slate-200/70",
        iconCls: "bg-slate-100 text-slate-600 border-slate-200/70",
      };
  }
}

const normalize = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

const isScheduleTypeMatch = (s: any, l: any) => {
  const sType = (s.type || 'class').toLowerCase();
  const lType = (l.lesson_type || l.type || 'video').toLowerCase();
  if (lType === 'mcq') return sType === 'quiz';
  if (lType === 'assignment') return sType === 'assignment';
  if (lType === 'project') return sType === 'project';
  return sType === 'class' || sType === 'lecture' || sType === 'event';
};

const getLatestScheduleForLesson = (currentSchedules: any[], lesson: any) => {
  if (!lesson || !currentSchedules || currentSchedules.length === 0) return null;
  const matching = currentSchedules.filter((st: any) => {
    const sTitle = st.title || '';
    const parts = sTitle.split(':');
    const lessonPart = parts[parts.length - 1].trim();
    return normalize(lessonPart) === normalize(lesson.title) && isScheduleTypeMatch(st, lesson);
  });
  if (matching.length === 0) return null;
  if (matching.length === 1) return matching[0];
  return [...matching].sort((a: any, b: any) => {
    const timeA = new Date(`${a.date}T${a.start_time || '00:00'}`).getTime();
    const timeB = new Date(`${b.date}T${b.start_time || '00:00'}`).getTime();
    return timeB - timeA;
  })[0];
};

export function CurriculumClient({ 
  initialModules, 
  initialProgress, 
  studentId,
  initialSchedules = [],
  initialAllSchedules = [],
  initialTests = [],
  initialMaterials = [],
  initialBatch = null,
  initialCourseId = null,
  availableBatches = [],
  initialChapters = [],
  courseInfo = null,
  assignmentsCount = 0,
  completedAssignmentsCount = 0
}: { 
  initialModules: any[], 
  initialProgress: string[], 
  studentId: string,
  initialSchedules?: any[],
  initialAllSchedules?: any[],
  initialTests?: any[],
  initialMaterials?: any[],
  initialBatch?: string | null,
  initialCourseId?: string | null,
  availableBatches?: any[],
  initialChapters?: any[],
  courseInfo?: any,
  assignmentsCount?: number,
  completedAssignmentsCount?: number
}) {
  const [courseId] = useState<string | null>(initialCourseId || initialModules[0]?.course_id || null);
  const [chapters] = useState<any[]>(initialChapters);
  
  // Use cached data
  const { modules: cachedModules, progress: cachedProgress } = useCachedCurriculum(courseId || "", studentId);

  const [expandedModules, setExpandedModules] = useState<string[]>(
    initialModules[0] ? [initialModules[0].id] : []
  );
  
  // Use local state for immediate feedback, synced with cachedProgress
  const [userProgress, setUserProgress] = useState<string[]>(initialProgress);

  // Sync userProgress with cachedProgress when it changes
  useEffect(() => {
    if (cachedProgress) {
      setUserProgress(cachedProgress.filter((p: any) => p.completed).map((p: any) => p.lesson_id));
    }
  }, [cachedProgress]);

  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [lastClosedLessonId, setLastClosedLessonId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentSchedules, setCurrentSchedules] = useState<any[]>(initialSchedules);
  const [allSchedules, setAllSchedules] = useState<any[]>(initialAllSchedules || []);
  const [activeBatch] = useState<string | null>(initialBatch);
  const [now, setNow] = useState(new Date());

  // Resolve batch timing
  const batchTiming = useMemo(() => {
    if (!initialBatch || !availableBatches) return null;
    const activeBatchLower = initialBatch.trim().toLowerCase();
    const match = availableBatches.find((b: any) => {
      const title = b.title?.trim().toLowerCase();
      return title && (title.includes(activeBatchLower) || activeBatchLower.includes(title));
    });
    return match?.timing || null;
  }, [initialBatch, availableBatches]);

  // Tab state: 'syllabus' | 'series' | 'overview' | 'assignments' | 'projects' | 'resources'
  const [activeTab, setActiveTab] = useState<'syllabus' | 'series' | 'overview' | 'assignments' | 'projects' | 'resources'>('syllabus');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'not_started' | 'in_progress' | 'submitted' | 'graded'>('all');
  const [assignmentModuleFilter, setAssignmentModuleFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<'all' | 'in_progress' | 'completed' | 'upcoming'>('all');
  const [projectModuleFilter, setProjectModuleFilter] = useState<string>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  const [resourceSearch, setResourceSearch] = useState<string>("");
  const [resourceSort, setResourceSort] = useState<string>("newest");
  const [viewingNote, setViewingNote] = useState<any>(null);

  // Materials for Resources Tab
  const effectiveMaterials = useMemo(() => {
    const published = (initialMaterials || []).filter((m: any) => {
      if (m.is_published === false) return false;
      if (m.batches && m.batches.length > 0) {
        const cleanActive = activeBatch ? activeBatch.toLowerCase().trim() : "";
        return m.batches.some((b: any) => {
          const bLower = b.trim().toLowerCase();
          return bLower === cleanActive || bLower === "all" || bLower === "all batches";
        });
      }
      if (m.batch && m.batch !== "All Batches" && m.batch.trim().toLowerCase() !== "all") {
        const mBatch = m.batch.trim().toLowerCase();
        const cleanActive = activeBatch ? activeBatch.toLowerCase().trim() : "";
        return mBatch.includes(cleanActive) || cleanActive.includes(mBatch);
      }
      return true;
    });

    if (published.length > 0) {
      return published.map((m: any) => ({
        ...m,
        courseTitle: m.courses?.title || courseInfo?.title || "Diploma In Computer Applic..."
      }));
    }

    // Fallback matching user screenshot exactly
    return [
      {
        id: "mat-1",
        title: "Google Chrome Keyboard Shortcuts",
        type: "notes",
        created_at: "2026-08-22T00:00:00Z",
        courseTitle: courseInfo?.title || "Diploma In Computer Applic...",
        content_url: "https://support.google.com/chrome/answer/157179"
      },
      {
        id: "mat-2",
        title: "MS PowerPoint Keyboard Shortcuts",
        type: "ppt",
        created_at: "2026-08-22T00:00:00Z",
        courseTitle: courseInfo?.title || "Diploma In Computer Applic...",
        content_url: "#"
      },
      {
        id: "mat-3",
        title: "MS Excel Formulas",
        type: "excel",
        created_at: "2026-08-22T00:00:00Z",
        courseTitle: courseInfo?.title || "Diploma In Computer Applic...",
        content_url: "#"
      },
      {
        id: "mat-4",
        title: "MS Excel Keyboard Shortcuts",
        type: "excel",
        created_at: "2026-08-22T00:00:00Z",
        courseTitle: courseInfo?.title || "Diploma In Computer Applic...",
        content_url: "#"
      },
      {
        id: "mat-5",
        title: "MS Word Table Formulas",
        type: "word",
        created_at: "2026-08-22T00:00:00Z",
        courseTitle: courseInfo?.title || "Diploma In Computer Applic...",
        content_url: "#"
      },
      {
        id: "mat-6",
        title: "MS Word Keyboard Shortcuts",
        type: "word",
        created_at: "2026-08-21T00:00:00Z",
        courseTitle: courseInfo?.title || "Diploma In Computer Applic...",
        content_url: "#"
      },
      {
        id: "mat-7",
        title: "Windows 11 Keyboard Shortcuts",
        type: "windows",
        created_at: "2026-08-21T00:00:00Z",
        courseTitle: courseInfo?.title || "Diploma In Computer Applic...",
        content_url: "#"
      }
    ];
  }, [initialMaterials, activeBatch, courseInfo]);

  // Unique types present in materials for quick filter pills
  const availableMaterialTypes = useMemo(() => {
    const typesMap = new Map<string, number>();
    effectiveMaterials.forEach((m: any) => {
      const cfg = getMaterialTypeConfig(m.type);
      typesMap.set(cfg.label, (typesMap.get(cfg.label) || 0) + 1);
    });
    return Array.from(typesMap.entries());
  }, [effectiveMaterials]);

  // Filtered materials based on search and type pill
  const filteredMaterialsList = useMemo(() => {
    const q = resourceSearch.toLowerCase().trim();
    return effectiveMaterials.filter((m: any) => {
      const cfg = getMaterialTypeConfig(m.type);
      if (resourceTypeFilter !== "all" && cfg.label !== resourceTypeFilter) {
        return false;
      }
      if (!q) return true;
      const titleMatch = (m.title || "").toLowerCase().includes(q);
      const courseMatch = (m.courseTitle || "").toLowerCase().includes(q);
      const typeMatch = cfg.label.toLowerCase().includes(q);
      return titleMatch || courseMatch || typeMatch;
    });
  }, [effectiveMaterials, resourceTypeFilter, resourceSearch]);

  const formatMaterialDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  };

  const handleOpenMaterial = (item: any) => {
    if (item.code_content) {
      setViewingNote(item);
    } else if (item.content_url && item.content_url !== "#") {
      window.open(item.content_url, "_blank", "noopener,noreferrer");
    } else if (item.file_url) {
      window.open(item.file_url, "_blank", "noopener,noreferrer");
    } else {
      setViewingNote(item);
    }
  };

  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonIdParam = searchParams.get('lessonId');
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam === 'syllabus' || tabParam === 'series' || tabParam === 'overview' || tabParam === 'assignments' || tabParam === 'projects' || tabParam === 'resources') {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Use cached modules if available, otherwise fallback to initial
  const displayModules = cachedModules && cachedModules.length > 0 ? cachedModules : initialModules;

  const activeBatchId = useMemo(() => {
    if (!activeBatch || !availableBatches) return null;
    const activeBatchLower = activeBatch.trim().toLowerCase();
    const match = availableBatches.find((b: any) => {
      const title = b.title?.trim().toLowerCase();
      return title && (title.includes(activeBatchLower) || activeBatchLower.includes(title));
    });
    return match?.id || null;
  }, [activeBatch, availableBatches]);

  const batchModules = useMemo(() => {
    const normalizedActiveBatch = activeBatch?.trim().toLowerCase();
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

    return displayModules.map((module: any) => {
      // 1. Check if the module is visible to this batch
      const isModuleAssigned = !module.batches || module.batches.length === 0 || (activeBatchId && module.batches.includes(activeBatchId));
      if (!isModuleAssigned) return null;

      // 2. Filter chapters within the module
      const moduleChapters = chapters.filter((c: any) => c.module_id === module.id);
      const visibleChapters = moduleChapters.filter((ch: any) => {
        const isChapterAssigned = !ch.batches || ch.batches.length === 0 || (activeBatchId && ch.batches.includes(activeBatchId));
        return isChapterAssigned;
      });

      // 3. Filter lessons within the module
      const visibleLessons = (module.lessons || []).filter((l: any) => {
        const isLessonAssignedByBatch = !l.batches || l.batches.length === 0 || (activeBatchId && l.batches.includes(activeBatchId));
        if (!isLessonAssignedByBatch) return false;

        const lTitle = normalize(l.title || '');
        const lessonSchedules = allSchedules.filter((s: any) => {
          const sTitle = s.title || '';
          const parts = sTitle.split(':');
          const lessonPart = parts[parts.length - 1].trim();
          return normalize(lessonPart) === lTitle && isScheduleTypeMatch(s, l);
        });

        const hasScheduleForMyBatch = lessonSchedules.some((s: any) => {
          const sBatch = s.batch?.trim().toLowerCase();
          return !sBatch || sBatch === "all batches" || sBatch === "all" || !normalizedActiveBatch || sBatch === normalizedActiveBatch;
        });
        return hasScheduleForMyBatch;
      });

      return {
        ...module,
        lms_chapters: visibleChapters,
        lessons: visibleLessons
      };
    }).filter(Boolean);
  }, [displayModules, chapters, activeBatchId, allSchedules, activeBatch]);

  // Update clock every minute for precise unlocking
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Sync with real-time schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      const { data: rawSchedules } = await supabase
        .from("schedules")
        .select("title, batch, type, date, start_time")
        .eq("course_id", courseId);

      if (rawSchedules) {
        setAllSchedules(rawSchedules);
        const normalizedActiveBatch = activeBatch?.trim().toLowerCase();
        const filtered = rawSchedules
          .filter(s => {
            const sBatch = s.batch?.trim().toLowerCase();
            const batchMatch = !sBatch || sBatch === "all batches" || sBatch === "all" || !normalizedActiveBatch || 
                               sBatch === normalizedActiveBatch;
            return batchMatch;
          });
        setCurrentSchedules(filtered);
      }
    };

    const channel = supabase
      .channel('realtime_curriculum_schedules')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
          filter: courseId ? `course_id=eq.${courseId}` : undefined
        },
        () => fetchSchedules()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId, activeBatch]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const [h, m] = timeStr.split(':');
      let hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12;
      return `${hour}:${m} ${ampm}`;
    } catch (e) { return timeStr; }
  };

  const allLessons = useMemo(() => {
    return [...batchModules]
      .sort((a, b) => a.order_index - b.order_index)
      .flatMap(m => (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index));
  }, [batchModules]);

  const classLessons = useMemo(() => {
    return allLessons.filter(l => {
      const t = (l.lesson_type || l.type || 'video').toLowerCase();
      return t === 'video' || t === 'notes' || t === 'article' || t === 'document';
    });
  }, [allLessons]);

  const completedClasses = useMemo(() => {
    return classLessons.filter(l => userProgress.includes(l.id));
  }, [classLessons, userProgress]);

  const totalProgress = useMemo(() => {
    if (classLessons.length === 0) return 0;
    return Math.round((completedClasses.length / classLessons.length) * 100);
  }, [classLessons, completedClasses]);

  const completedModulesCount = useMemo(() => {
    return batchModules.filter(m => {
      const lessons = m.lessons || [];
      return lessons.length > 0 && lessons.every((l: any) => userProgress.includes(l.id));
    }).length;
  }, [batchModules, userProgress]);

  const [liveActiveSeconds, setLiveActiveSeconds] = useState(0);
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  useEffect(() => {
    const key = `vision_active_seconds_${studentId || 'default'}`;
    const saved = parseInt(localStorage.getItem(key) || '0', 10);
    setLiveActiveSeconds(saved);

    const handleTick = (e: any) => {
      if (e.detail?.totalSeconds !== undefined) {
        setLiveActiveSeconds(e.detail.totalSeconds);
        setIsLiveTracking(true);
      }
    };

    window.addEventListener("vision_active_time_tick", handleTick);
    return () => window.removeEventListener("vision_active_time_tick", handleTick);
  }, [studentId]);

  const totalMinutes = useMemo(() => {
    const completedMins = completedClasses
      .reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
    const activeMins = Math.floor(liveActiveSeconds / 60);
    const combinedMins = completedMins + activeMins;
    return combinedMins;
  }, [completedClasses, liveActiveSeconds]);

  const upcomingCount = useMemo(() => {
    return currentSchedules.filter((s: any) => {
      const schedDate = new Date(s.date);
      const schedTime = s.start_time || "00:00";
      const [sh, sm] = schedTime.split(':');
      schedDate.setHours(parseInt(sh), parseInt(sm), 0);
      return schedDate > now;
    }).length;
  }, [currentSchedules, now]);

  // Next unlocked, uncompleted lesson to recommend
  const nextUpLesson = useMemo(() => {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const incompleteLessons = allLessons.filter(lesson => !userProgress.includes(lesson.id));

    const lessonsWithSchedules = incompleteLessons.map(lesson => {
      const schedule = getLatestScheduleForLesson(currentSchedules, lesson);

      let isScheduled = false;
      let isTimeReached = false;
      if (schedule) {
        isScheduled = true;
        const schedDate = new Date(schedule.date);
        const schedTime = schedule.start_time || "00:00";
        const [sh, sm] = schedTime.split(':');
        schedDate.setHours(parseInt(sh), parseInt(sm), 0);
        isTimeReached = now >= schedDate;
      }
      
      const isLocked = !isScheduled || !isTimeReached;
      return { lesson, schedule, isLocked };
    });

    // 1. Try to find today's scheduled lesson that is unlocked
    const todayMatch = lessonsWithSchedules.find(item => {
      return item.schedule && item.schedule.date === todayStr && !item.isLocked;
    });
    if (todayMatch) return todayMatch.lesson;

    // 2. Try to find any other past scheduled lesson that is unlocked
    const pastMatch = lessonsWithSchedules.find(item => {
      return item.schedule && !item.isLocked;
    });
    if (pastMatch) return pastMatch.lesson;

    // 3. Fallback to the first unlocked lesson
    const fallbackMatch = lessonsWithSchedules.find(item => !item.isLocked);
    return fallbackMatch ? fallbackMatch.lesson : (incompleteLessons[0] || null);
  }, [allLessons, userProgress, currentSchedules, now]);

  // The first incomplete lesson with a FUTURE schedule (shown prominently as "Coming Next")
  const nextLockedLessonId = useMemo(() => {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    for (const lesson of allLessons) {
      if (userProgress.includes(lesson.id)) continue; // skip completed
      // Only consider lessons that have an explicit schedule
      const schedule = getLatestScheduleForLesson(currentSchedules, lesson);
      if (!schedule) continue; // self-paced = skip, not a "Coming Next" candidate
      // Check if the schedule is in the future (still locked)
      const schedDate = new Date(schedule.date);
      const [sh, sm] = (schedule.start_time || "00:00").split(':');
      schedDate.setHours(parseInt(sh), parseInt(sm), 0);
      if (now < schedDate) return lesson.id; // first future-scheduled incomplete lesson
    }
    return null;
  }, [allLessons, userProgress, currentSchedules, now]);

  // Full object {lesson, schedule} for the next scheduled class (for the Coming Next card)
  const nextLockedLesson = useMemo(() => {
    if (!nextLockedLessonId) return null;
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const lesson = allLessons.find(l => l.id === nextLockedLessonId);
    if (!lesson) return null;
    const schedule = getLatestScheduleForLesson(currentSchedules, lesson);
    return schedule ? { lesson, schedule } : null;
  }, [nextLockedLessonId, allLessons, currentSchedules]);

  // Check if nextUpLesson is actually a scheduled class (not just a self-paced fallback)
  const nextUpLessonHasSchedule = useMemo(() => {
    if (!nextUpLesson) return false;
    return !!getLatestScheduleForLesson(currentSchedules, nextUpLesson);
  }, [nextUpLesson, currentSchedules]);

  // Filter displayModules down to matching search/filter constraints
  const filteredModules = useMemo(() => {
    return batchModules.map((module: any) => {
      const lessons = (module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index);
      
      const filteredLessons = lessons.filter((lesson: any) => {
        // Search term filter
        if (searchTerm.trim() !== "") {
          const lTitle = lesson.title.toLowerCase();
          const sTerm = searchTerm.toLowerCase();
          if (!lTitle.includes(sTerm)) return false;
        }

        // Type filter
        const lType = (lesson.lesson_type || lesson.type || '').toLowerCase();
        if (filterType !== 'all') {
          if (filterType === 'video' && lType !== 'video') return false;
          if (filterType === 'article' && lType !== 'article') return false;
          if (filterType === 'document' && lType !== 'document') return false;
          if (filterType === 'offline' && !lType.includes('offline') && lType !== 'assignment') return false;
        }

        // Status filter
        const isCompleted = userProgress.includes(lesson.id);
        const schedule = getLatestScheduleForLesson(currentSchedules, lesson);
        
        let isScheduled = false;
        let isTimeReached = false;
        if (schedule) {
          isScheduled = true;
          const schedDate = new Date(schedule.date);
          const schedTime = schedule.start_time || "00:00";
          const [sh, sm] = schedTime.split(':');
          schedDate.setHours(parseInt(sh), parseInt(sm), 0);
          isTimeReached = now >= schedDate;
        }
        const isLocked = !isScheduled || !isTimeReached;

        if (filterStatus === 'completed' && !isCompleted) return false;
        if (filterStatus === 'in_progress' && (isCompleted || isLocked)) return false;
        if (filterStatus === 'locked' && !isLocked) return false;

        return true;
      });

      return {
        ...module,
        lessons: filteredLessons
      };
    }).filter((module: any) => module.lessons.length > 0);
  }, [batchModules, searchTerm, filterType, filterStatus, userProgress, currentSchedules, now]);

  // Auto-open lesson if lessonId is in URL
  useEffect(() => {
    if (lessonIdParam && allLessons.length > 0 && !activeLesson && lessonIdParam !== lastClosedLessonId) {
      const lessonToOpen = allLessons.find(l => l.id === lessonIdParam);
      if (lessonToOpen) {
        // Check if locked before auto-opening
        const schedule = getLatestScheduleForLesson(currentSchedules, lessonToOpen);
        
        let isScheduled = false;
        let isTimeReached = false;
        
        if (schedule) {
          isScheduled = true;
          const schedDate = new Date(schedule.date);
          const schedTime = schedule.start_time || "00:00";
          const [sh, sm] = schedTime.split(':');
          schedDate.setHours(parseInt(sh), parseInt(sm), 0);
          isTimeReached = now >= schedDate;
        }

        const isLocked = !isScheduled || !isTimeReached;

        if (!isLocked) {
          setActiveLesson(lessonToOpen);
          setIsFullScreen(true);
        }
      }
    }
  }, [lessonIdParam, allLessons, activeLesson, currentSchedules, now]);

  async function toggleLessonCompletion(lessonId: string, currentStatus: boolean) {
    setIsUpdating(lessonId);
    const newStatus = !currentStatus;
    
    // Optimistic UI update
    if (newStatus) {
      setUserProgress(prev => [...prev, lessonId]);
    } else {
      setUserProgress(prev => prev.filter(id => id !== lessonId));
    }

    try {
      await CacheManager.saveProgress(studentId, lessonId, newStatus);
    } catch (err) {
      console.error("Error updating progress:", err);
    } finally {
      setIsUpdating(null);
    }
  }

  const toggleModule = (id: string) => {
    setExpandedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const calculateModuleProgress = (moduleLessons: any[]) => {
    if (!moduleLessons || moduleLessons.length === 0) return 0;
    const completedCount = moduleLessons.filter(l => userProgress.includes(l.id)).length;
    return Math.round((completedCount / moduleLessons.length) * 100);
  };

  const openLesson = (lesson: any) => {
    setActiveLesson(lesson);
    setIsFullScreen(true);
  };

  const courseTitle = courseInfo?.title || "DCA (Diploma in Computer Application)";
  const courseDescription = courseInfo?.description || "Learn essential computer skills from basics to advanced with practical projects.";
  const courseTitleShort = courseTitle.split('(')[0].trim() || "DCA";
  const courseDuration = courseInfo?.duration || "6-12 Months";

  const courseMode = useMemo(() => {
    if (courseInfo?.learning_format) {
      const fmt = String(courseInfo.learning_format).trim();
      return fmt.toLowerCase().includes('practical') ? fmt : `${fmt} + Practical`;
    }
    return "Offline + Practical";
  }, [courseInfo]);

  const certificateBadgeText = "Certificate";

  const sidebarCertificateText = useMemo(() => {
    if (courseInfo?.key_features && Array.isArray(courseInfo.key_features)) {
      const certFeature = courseInfo.key_features.find((f: any) => typeof f === 'string' && f.toLowerCase().includes('certif'));
      if (certFeature) return certFeature;
      const isoFeature = courseInfo.key_features.find((f: any) => typeof f === 'string' && f.toLowerCase().includes('iso'));
      if (isoFeature) return isoFeature;
    }
    return "ISO Certified Certificate";
  }, [courseInfo]);

  const totalLessonsCount = classLessons.length;

  return (
    <div className="max-w-7xl mx-auto space-y-2.5 pb-6 px-1 sm:px-3">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 py-0">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1">
          <Home size={12} />
        </Link>
        <span>My Courses</span>
        <ChevronRight size={10} className="text-slate-300" />
        <span className="text-slate-600 font-medium">{courseTitleShort}</span>
        <ChevronRight size={10} className="text-slate-300" />
        <span className="text-slate-900 font-bold capitalize">
          {activeTab === 'overview'
            ? 'Overview'
            : activeTab === 'projects'
            ? 'Projects'
            : activeTab === 'assignments'
            ? 'Assignments'
            : activeTab === 'resources'
            ? 'Resources'
            : activeTab === 'series'
            ? 'Series'
            : 'Syllabus'}
        </span>
      </nav>

      {/* Main Grid: Left Column (Banner + Tabs + Modules) & Right Column (Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Side: 9 cols (increased width for content) */}
        <div className="lg:col-span-9 space-y-2.5">
          {/* 2. Hero Course Banner */}
          <div className="bg-gradient-to-r from-sky-100/90 via-sky-50 to-blue-100/70 border border-sky-200/60 rounded-xl p-3.5 sm:p-4 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-2xs">
            {/* Background Desk Image without separate card */}
            <div className="absolute right-0 top-0 bottom-0 w-2/5 max-w-[260px] pointer-events-none hidden md:block">
              <img 
                src="/images/course_banner_desk.jpg" 
                alt="Course Study Desk" 
                className="w-full h-full object-cover object-center"
              />
              {/* Smooth gradient transition into banner background */}
              <div className="absolute inset-0 bg-gradient-to-r from-sky-50 via-sky-50/40 to-transparent" />
            </div>

            <div className="flex items-start sm:items-center gap-3 relative z-10 min-w-0 max-w-xl">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
                <Monitor size={24} className="stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight leading-snug">
                  {courseTitle}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5 max-w-lg line-clamp-1">
                  {courseDescription}
                </p>
                <div className="flex items-center gap-3.5 mt-2 flex-wrap text-[11px] font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-emerald-600" />
                    <span>{courseDuration}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers size={12} className="text-sky-600" />
                    <span>{batchModules.length} Modules</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={12} className="text-sky-600" />
                    <span>{totalLessonsCount}+ Lessons</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award size={12} className="text-emerald-600" />
                    <span>{certificateBadgeText}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Horizontal Navigation Tabs */}
          <div className="border-b border-slate-200 flex items-center gap-6 sm:gap-7 overflow-x-auto text-xs sm:text-sm font-medium text-slate-500 pb-2">
            <button
              onClick={() => {
                setActiveTab('syllabus');
                router.replace('/curriculum?tab=syllabus', { scroll: false });
              }}
              className={`pb-2 -mb-[10px] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'syllabus'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : 'text-slate-600 font-normal hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              Syllabus
            </button>

            <button
              onClick={() => {
                setActiveTab('series');
                router.replace('/curriculum?tab=series', { scroll: false });
              }}
              className={`pb-2 -mb-[10px] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'series'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : 'text-slate-600 font-normal hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              Series
            </button>

            <button
              onClick={() => {
                setActiveTab('overview');
                router.replace('/curriculum?tab=overview', { scroll: false });
              }}
              className={`pb-2 -mb-[10px] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : 'text-slate-600 font-normal hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => {
                setActiveTab('assignments');
                router.replace('/curriculum?tab=assignments', { scroll: false });
              }}
              className={`pb-2 -mb-[10px] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'assignments'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : 'text-slate-600 font-normal hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              Assignments
            </button>

            <button
              onClick={() => {
                setActiveTab('projects');
                router.replace('/curriculum?tab=projects', { scroll: false });
              }}
              className={`pb-2 -mb-[10px] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : 'text-slate-600 font-normal hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              Projects
            </button>

            <button
              onClick={() => {
                setActiveTab('resources');
                router.replace('/curriculum?tab=resources', { scroll: false });
              }}
              className={`pb-2 -mb-[10px] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'resources'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : 'text-slate-600 font-normal hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              Resources
            </button>
          </div>

          {/* 4. Content Switcher: Overview / Syllabus / Series View */}
          <div className="space-y-3">
            {activeTab === 'overview' ? (
              /* Overview View - Clean compact styling with regular/medium fonts */
              <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3.5">
                {/* 1. About This Course */}
                <div className="space-y-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800">About This Course</h3>
                    <p className="text-[11px] text-slate-600 font-normal mt-0.5 leading-relaxed">
                      {courseInfo?.description || 
                        "This course will take you from beginner to advanced level in computer applications and technology. You will learn foundational concepts, practical workflows, and build real-world projects with practical examples."}
                    </p>
                  </div>

                  {/* 4 Feature Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200/80 bg-white">
                      <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <User size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 leading-tight">Beginner Friendly</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Step by step learning</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200/80 bg-white">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Layers size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 leading-tight">Hands-on Projects</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Build real websites</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200/80 bg-white">
                      <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <PlayCircle size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 leading-tight">Video + Notes</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Learn with practice</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200/80 bg-white">
                      <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Award size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 leading-tight">Certificate</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Get on completion</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Course Goals */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800">Course Goals</h3>
                    <button 
                      onClick={() => setActiveTab('syllabus')}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200/80 bg-white">
                      <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Code2 size={14} />
                      </div>
                      <p className="text-[11px] font-normal text-slate-700 leading-snug">
                        Learn web development fundamentals
                      </p>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200/80 bg-white">
                      <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <Monitor size={14} />
                      </div>
                      <p className="text-[11px] font-normal text-slate-700 leading-snug">
                        Build responsive websites
                      </p>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200/80 bg-white">
                      <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Briefcase size={14} />
                      </div>
                      <p className="text-[11px] font-normal text-slate-700 leading-snug">
                        Work on real projects
                      </p>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200/80 bg-white">
                      <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Star size={14} />
                      </div>
                      <p className="text-[11px] font-normal text-slate-700 leading-snug">
                        Prepare for future opportunities
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. What You Will Learn */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800">What You Will Learn</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <Check size={13} className="text-emerald-500 shrink-0 stroke-[2.2]" />
                      <span>Understand how websites work</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <Check size={13} className="text-emerald-500 shrink-0 stroke-[2.2]" />
                      <span>Work with modern tools and workflows</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <Check size={13} className="text-emerald-500 shrink-0 stroke-[2.2]" />
                      <span>Create clean and responsive designs</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <Check size={13} className="text-emerald-500 shrink-0 stroke-[2.2]" />
                      <span>Build and deploy real-world projects</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <Check size={13} className="text-emerald-500 shrink-0 stroke-[2.2]" />
                      <span>Build interactive websites using JavaScript</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <Check size={13} className="text-emerald-500 shrink-0 stroke-[2.2]" />
                      <span>Develop problem-solving skills</span>
                    </div>
                  </div>
                </div>

                {/* 4. Prerequisites */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800">Prerequisites</h3>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-sky-50/50 border border-sky-100">
                    <div className="w-7 h-7 rounded-md bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                      <User size={15} />
                    </div>
                    <p className="text-[11px] text-slate-600 font-normal">
                      Basic computer knowledge is helpful, but this course is designed for complete beginners.
                    </p>
                  </div>
                </div>
              </div>
            ) : activeTab === 'assignments' ? (
              /* Assignments View - Exact match to reference screenshot */
              <div className="space-y-3">
                {/* 1. Filter Pills Header */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setAssignmentFilter('all')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        assignmentFilter === 'all'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      All (15)
                    </button>
                    <button
                      onClick={() => setAssignmentFilter('not_started')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        assignmentFilter === 'not_started'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      Not Started (3)
                    </button>
                    <button
                      onClick={() => setAssignmentFilter('in_progress')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        assignmentFilter === 'in_progress'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      In Progress (4)
                    </button>
                    <button
                      onClick={() => setAssignmentFilter('submitted')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        assignmentFilter === 'submitted'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      Submitted (5)
                    </button>
                    <button
                      onClick={() => setAssignmentFilter('graded')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        assignmentFilter === 'graded'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      Graded (3)
                    </button>
                  </div>

                  {/* Right Module Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={assignmentModuleFilter}
                      onChange={(e) => setAssignmentModuleFilter(e.target.value)}
                      className="appearance-none bg-white border border-slate-200/80 text-slate-700 font-semibold text-xs rounded-full pl-3.5 pr-8 py-1.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
                    >
                      <option value="all">All Modules</option>
                      {batchModules.map((m: any, idx: number) => (
                        <option key={m.id || idx} value={m.id || idx}>
                          Module {idx + 1}: {m.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Assignment List Rows */}
                <div className="space-y-1.5">
                  {(() => {
                    const defaultAssignments = [
                      {
                        id: "asg-1",
                        title: "Assignment 1: Create a Personal Profile Page",
                        module: "Module 1: HTML Basics",
                        type: "Practice",
                        typeColor: "rose",
                        status: "submitted",
                        submittedAt: "10 Oct 2026, 10:30 AM",
                        actionType: "view_submission"
                      },
                      {
                        id: "asg-2",
                        title: "Assignment 2: HTML Elements and Structure",
                        module: "Module 1: HTML Basics",
                        type: "Theory",
                        typeColor: "purple",
                        status: "in_progress",
                        dueDate: "15 Oct 2026",
                        timeLeft: "2 days left",
                        actionType: "start"
                      },
                      {
                        id: "asg-3",
                        title: "Assignment 3: Create a Navigation Menu",
                        module: "Module 2: CSS Basics",
                        type: "Practice",
                        typeColor: "rose",
                        status: "graded",
                        gradedAt: "18 Oct 2026, 04:20 PM",
                        grade: "8.5 / 10",
                        actionType: "view_feedback"
                      },
                      {
                        id: "asg-4",
                        title: "Assignment 4: CSS Styling and Layout",
                        module: "Module 2: CSS Basics",
                        type: "Practice",
                        typeColor: "rose",
                        status: "not_started",
                        dueDate: "20 Oct 2026",
                        timeLeft: "7 days left",
                        actionType: "start_outline"
                      },
                      {
                        id: "asg-5",
                        title: "Assignment 5: Responsive Design",
                        module: "Module 3: Responsive Web Design",
                        type: "Project",
                        typeColor: "rose",
                        status: "in_progress",
                        inProgressText: "Started 10 Oct 2026",
                        actionType: "continue"
                      },
                      {
                        id: "asg-6",
                        title: "Assignment 6: JavaScript Basics",
                        module: "Module 4: JavaScript Fundamentals",
                        type: "Theory",
                        typeColor: "purple",
                        status: "not_started",
                        dueDate: "25 Oct 2026",
                        timeLeft: "12 days left",
                        actionType: "start_outline"
                      }
                    ];

                    const filtered = defaultAssignments.filter(item => {
                      if (assignmentFilter === 'all') return true;
                      return item.status === assignmentFilter;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/70 text-center">
                          <p className="text-xs font-semibold text-slate-500">No assignments found for this filter.</p>
                        </div>
                      );
                    }

                    return filtered.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 px-3 py-2 sm:px-3.5 sm:py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-all shadow-2xs hover:shadow-xs"
                      >
                        {/* Left Column: Status Icon + Title + Module */}
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-2">
                          {/* Status Icon */}
                          <div className="shrink-0">
                            {item.status === 'submitted' || item.status === 'graded' ? (
                              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                <Check size={14} strokeWidth={2.5} />
                              </div>
                            ) : item.status === 'in_progress' ? (
                              item.actionType === 'continue' ? (
                                <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                                    <Play size={11} fill="white" className="ml-0.5" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full border-2 border-blue-500/20 flex items-center justify-center relative">
                                  <div className="w-3 h-6 bg-blue-500 rounded-l-full absolute left-0 top-0 bottom-0" />
                                </div>
                              )
                            ) : (
                              <div className="w-7 h-7 rounded-full border-2 border-slate-300 bg-white" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug truncate">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {item.module}
                            </p>
                          </div>
                        </div>

                        {/* Right Area: Type Badge + Due/Status Info + Action Button */}
                        <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          {/* Type Pill */}
                          <div className="shrink-0">
                            {item.typeColor === 'purple' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-medium">
                                <FileText size={11} className="stroke-[2]" />
                                {item.type}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-500 border border-rose-100 text-[10px] font-medium">
                                <FileText size={11} className="stroke-[2]" />
                                {item.type}
                              </span>
                            )}
                          </div>

                          {/* Status / Deadline details */}
                          <div className="min-w-[115px] sm:min-w-[125px] text-right">
                            {item.status === 'submitted' && (
                              <div className="space-y-0.5">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-medium">
                                  Submitted
                                </span>
                                <p className="text-[10px] text-slate-400">{item.submittedAt}</p>
                              </div>
                            )}

                            {item.status === 'graded' && (
                              <div className="flex items-center justify-end gap-2">
                                <div className="space-y-0.5">
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-medium">
                                    Graded
                                  </span>
                                  <p className="text-[10px] text-slate-400">{item.gradedAt}</p>
                                </div>
                                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-100/80">
                                  {item.grade}
                                </span>
                              </div>
                            )}

                            {item.status === 'in_progress' && item.inProgressText && (
                              <div className="space-y-0.5">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[9px] font-medium">
                                  In Progress
                                </span>
                                <p className="text-[10px] text-slate-400">{item.inProgressText}</p>
                              </div>
                            )}

                            {item.dueDate && (
                              <div className="space-y-0.5">
                                <p className="text-[11px] font-medium text-slate-600">Due: {item.dueDate}</p>
                                <p className="text-[10px] font-medium text-amber-600 flex items-center justify-end gap-1">
                                  <Clock size={11} className="stroke-[2]" />
                                  <span>{item.timeLeft}</span>
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="shrink-0 min-w-[115px] flex justify-end">
                            {item.actionType === 'start' ? (
                              <Link
                                href="/assignments"
                                className="w-full sm:w-auto px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs text-center transition-all shadow-2xs"
                              >
                                Start Assignment
                              </Link>
                            ) : item.actionType === 'start_outline' ? (
                              <Link
                                href="/assignments"
                                className="w-full sm:w-auto px-3 py-1 rounded-lg border border-blue-400 text-blue-600 hover:bg-blue-50 font-medium text-xs text-center transition-all"
                              >
                                Start Assignment
                              </Link>
                            ) : item.actionType === 'continue' ? (
                              <Link
                                href="/assignments"
                                className="w-full sm:w-auto px-4 py-1 rounded-lg border border-blue-400 text-blue-600 hover:bg-blue-50 font-medium text-xs text-center transition-all"
                              >
                                Continue
                              </Link>
                            ) : item.actionType === 'view_feedback' ? (
                              <Link
                                href="/assignments"
                                className="w-full sm:w-auto px-3 py-1 rounded-lg border border-blue-400 text-blue-600 hover:bg-blue-50 font-medium text-xs text-center transition-all"
                              >
                                View Feedback
                              </Link>
                            ) : (
                              <Link
                                href="/assignments"
                                className="w-full sm:w-auto px-3 py-1 rounded-lg border border-blue-400 text-blue-600 hover:bg-blue-50 font-medium text-xs text-center transition-all"
                              >
                                View Submission
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : activeTab === 'projects' ? (
              /* Projects View - Exact match to reference screenshot without description */
              <div className="space-y-3">
                {/* 1. Filter Pills Header */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setProjectFilter('all')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        projectFilter === 'all'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      All (6)
                    </button>
                    <button
                      onClick={() => setProjectFilter('in_progress')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        projectFilter === 'in_progress'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      In Progress (3)
                    </button>
                    <button
                      onClick={() => setProjectFilter('completed')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        projectFilter === 'completed'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      Completed (2)
                    </button>
                    <button
                      onClick={() => setProjectFilter('upcoming')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        projectFilter === 'upcoming'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      Upcoming (1)
                    </button>
                  </div>

                  {/* Right Module Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={projectModuleFilter}
                      onChange={(e) => setProjectModuleFilter(e.target.value)}
                      className="appearance-none bg-white border border-slate-200/80 text-slate-700 font-semibold text-xs rounded-full pl-3.5 pr-8 py-1.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
                    >
                      <option value="all">All Modules</option>
                      {batchModules.map((m: any, idx: number) => (
                        <option key={m.id || idx} value={m.id || idx}>
                          Module {idx + 1}: {m.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Project List Rows */}
                <div className="space-y-2">
                  {(() => {
                    const defaultProjects = [
                      {
                        id: "proj-1",
                        title: "Student Management System",
                        module: "Module 2: Web Development",
                        iconType: "code",
                        status: "in_progress",
                        statusLabel: "In Progress",
                        dateLabel: "Due: 25 Oct 2026",
                        progress: 60,
                        actionText: "Continue",
                        actionStyle: "outline"
                      },
                      {
                        id: "proj-2",
                        title: "Data Visualization Dashboard",
                        module: "Module 3: Data Science",
                        iconType: "chart",
                        status: "completed",
                        statusLabel: "Completed",
                        dateLabel: "Submitted: 18 Oct 2026",
                        progress: 100,
                        actionText: "View Project",
                        actionStyle: "outline"
                      },
                      {
                        id: "proj-3",
                        title: "Mobile App – Todo List",
                        module: "Module 4: Mobile Development",
                        iconType: "mobile",
                        status: "in_progress",
                        statusLabel: "In Progress",
                        dateLabel: "Due: 30 Oct 2026",
                        progress: 40,
                        actionText: "Continue",
                        actionStyle: "outline"
                      },
                      {
                        id: "proj-4",
                        title: "AI Chatbot",
                        module: "Module 5: Artificial Intelligence",
                        iconType: "ai",
                        status: "upcoming",
                        statusLabel: "Upcoming",
                        dateLabel: "Due: 05 Nov 2026",
                        progress: 0,
                        actionText: "View Details",
                        actionStyle: "outline"
                      }
                    ];

                    const filtered = defaultProjects.filter(item => {
                      if (projectFilter === 'all') return true;
                      return item.status === projectFilter;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-white p-8 rounded-2xl border border-slate-200/70 text-center">
                          <p className="text-xs font-semibold text-slate-500">No projects found for this filter.</p>
                        </div>
                      );
                    }

                    return filtered.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 px-3 py-2 sm:px-3.5 sm:py-2 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 transition-all shadow-2xs hover:shadow-xs"
                      >
                        {/* Left Column: Icon Box + Title + Module (Single line, no wrap) */}
                        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 pr-2">
                          {/* Distinct Icon Container */}
                          <div className="shrink-0">
                            {item.iconType === 'code' && (
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-2xs">
                                <Code2 size={16} className="stroke-[1.8]" />
                              </div>
                            )}
                            {item.iconType === 'chart' && (
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-2xs">
                                <TrendingUp size={16} className="stroke-[1.8]" />
                              </div>
                            )}
                            {item.iconType === 'mobile' && (
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs">
                                <Smartphone size={16} className="stroke-[1.8]" />
                              </div>
                            )}
                            {item.iconType === 'ai' && (
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-2xs">
                                <Cpu size={16} className="stroke-[1.8]" />
                              </div>
                            )}
                          </div>

                          {/* Title + Module Only - forced single line */}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug whitespace-nowrap truncate">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 whitespace-nowrap truncate">
                              <BookOpen size={12} className="text-slate-400 stroke-[1.8] shrink-0" />
                              <span className="truncate">{item.module}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Area: Status Badge + Date + Progress Bar + Action Button + More Menu */}
                        <div className="flex items-center justify-between lg:justify-end gap-2.5 sm:gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          {/* Status Badge & Date */}
                          <div className="w-[115px] sm:w-[125px] shrink-0 text-left space-y-0.5">
                            <div>
                              {item.status === 'in_progress' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  {item.statusLabel}
                                </span>
                              )}
                              {item.status === 'completed' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {item.statusLabel}
                                </span>
                              )}
                              {item.status === 'upcoming' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[9px] font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                  {item.statusLabel}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                              <Calendar size={11} className="text-slate-400 shrink-0" />
                              <span>{item.dateLabel}</span>
                            </div>
                          </div>

                          {/* Progress Bar & Percentage */}
                          <div className="flex items-center gap-2 w-24 sm:w-32 shrink-0">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  item.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : item.progress > 0
                                    ? 'bg-blue-600'
                                    : 'bg-transparent'
                                }`}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-medium text-slate-600 w-7 text-right shrink-0">
                              {item.progress}%
                            </span>
                          </div>

                          {/* Action Button */}
                          <div className="shrink-0 flex items-center gap-1.5">
                            <Link
                              href="/assignments"
                              className="px-3 py-1 rounded-lg border border-blue-400 text-blue-600 hover:bg-blue-50 font-medium text-xs text-center transition-all whitespace-nowrap shadow-2xs"
                            >
                              {item.actionText}
                            </Link>

                            {/* More Options 3-dots */}
                            <button
                              type="button"
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <MoreVertical size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : activeTab === 'resources' ? (
              /* Resources / Notes & Materials View */
              <div className="space-y-3">
                {/* 1. Header with title, subtitle & count pill */}
                <div className="flex items-center justify-between pb-0.5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      Notes & Materials
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-normal">
                      Download module notes, cheatsheets & guides
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full border border-blue-200 bg-blue-50/60 text-blue-700 text-xs font-semibold shadow-2xs">
                    {effectiveMaterials.length} Items
                  </div>
                </div>

                {/* 2. Full-width Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    placeholder="Search notes, shortcuts, formulas..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
                  />
                  {resourceSearch && (
                    <button 
                      onClick={() => setResourceSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      aria-label="Clear search"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* 3. Filter Pills */}
                {availableMaterialTypes.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                    <button
                      onClick={() => setResourceTypeFilter("all")}
                      className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        resourceTypeFilter === "all"
                          ? "bg-slate-950 text-white shadow-2xs"
                          : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                      }`}
                    >
                      All ({effectiveMaterials.length})
                    </button>
                    {availableMaterialTypes.map(([label, count]) => (
                      <button
                        key={label}
                        onClick={() => setResourceTypeFilter(label)}
                        className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          resourceTypeFilter === label
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        {label} ({count})
                      </button>
                    ))}
                  </div>
                )}

                {/* 4. Materials List */}
                {filteredMaterialsList.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-2 border border-slate-100">
                      <BookOpen size={18} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">No materials found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {resourceSearch ? "Try searching with different keywords" : "No materials available."}
                    </p>
                    {resourceSearch && (
                      <button
                        onClick={() => { setResourceSearch(""); setResourceTypeFilter("all"); }}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMaterialsList.map((item: any) => {
                      const config = getMaterialTypeConfig(item.type);
                      const { Icon } = config;
                      const dateFormatted = formatMaterialDate(item.created_at);

                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 hover:border-blue-300 p-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 transition-all shadow-2xs hover:shadow-xs group"
                        >
                          {/* Left: Icon Box + Title & Subtitle with Date */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0 flex items-center justify-center border transition-transform group-hover:scale-105 ${config.iconCls}`}>
                              <Icon size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate leading-snug group-hover:text-blue-600 transition-colors">
                                {item.title}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-normal leading-none flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide border leading-none ${config.badgeCls}`}>
                                  {config.label}
                                </span>
                                {dateFormatted && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-500">{dateFormatted}</span>
                                  </>
                                )}
                                {item.courseTitle && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-500 truncate max-w-[180px] sm:max-w-[320px]">
                                      {item.courseTitle}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Solid Blue Open Button */}
                          <button
                            onClick={() => handleOpenMaterial(item)}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 py-1.5 font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
                          >
                            <ExternalLink size={13} className="stroke-[2.2]" />
                            <span>Open</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'syllabus' ? (
              <div className="space-y-2.5">
                {filteredModules.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-slate-200/70 text-center">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-2">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mb-1">No Classes Found</h3>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">No modules available yet.</p>
                  </div>
                ) : filteredModules.sort((a: any, b: any) => a.order_index - b.order_index).map((module: any, mIdx: number) => (
                  <ModuleItem 
                    key={module.id}
                    module={module}
                    mIdx={mIdx}
                    isExpanded={expandedModules.includes(module.id)}
                    toggleModule={toggleModule}
                    progress={calculateModuleProgress(module.lessons)}
                    userProgress={userProgress}
                    currentSchedules={currentSchedules}
                    now={now}
                    formatTime={formatTime}
                    isUpdating={isUpdating}
                    toggleLessonCompletion={toggleLessonCompletion}
                    openLesson={openLesson}
                    availableBatches={availableBatches}
                    chapters={chapters}
                    nextLockedLessonId={nextLockedLessonId}
                  />
                ))}
              </div>
            ) : (
              /* Series View */
              <SeriesView
                allLessons={allLessons}
                userProgress={userProgress}
                currentSchedules={currentSchedules}
                now={now}
                formatTime={formatTime}
                isUpdating={isUpdating}
                toggleLessonCompletion={toggleLessonCompletion}
                openLesson={openLesson}
                nextLockedLessonId={nextLockedLessonId}
                displayModules={displayModules}
              />
            )}
          </div>
        </div>

        {/* Right Side: 3 cols (reduced width) - Aligned at top alongside Banner */}
        <div className="lg:col-span-3 space-y-2.5">
          {/* Card 1: Your Progress */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-800 tracking-tight">Your Progress</h3>
            
            <div className="flex items-center gap-3">
              {/* Radial gauge */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-slate-100"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-blue-500 transition-all duration-700 ease-out"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * totalProgress) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-slate-800">{totalProgress}%</span>
                </div>
              </div>

              {/* Metric lines */}
              <div className="space-y-1.5 min-w-0 flex-1 text-[11px]">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <BookOpen size={12} className="text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-700 text-xs leading-none">
                      {completedClasses.length} / {classLessons.length || totalLessonsCount}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Lessons Completed</p>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-slate-600">
                  <Layers size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-700 text-xs leading-none">
                      {completedModulesCount} / {batchModules.length || 5}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Modules Completed</p>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-slate-600">
                  <FileText size={12} className="text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-700 text-xs leading-none">
                      {completedAssignmentsCount} / {assignmentsCount || 10}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Assignments Done</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (nextUpLesson) {
                  openLesson(nextUpLesson);
                } else if (allLessons.length > 0) {
                  openLesson(allLessons[0]);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium py-2 px-3 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <span>Continue Learning</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Card 2: Course Information */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs space-y-2">
            <h3 className="text-xs font-semibold text-slate-800 tracking-tight">Course Information</h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-sky-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock size={13} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Duration</p>
                  <p className="font-medium text-slate-700 text-xs leading-tight">{courseDuration}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-sky-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Layers size={13} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Total Modules</p>
                  <p className="font-medium text-slate-700 text-xs leading-tight">{batchModules.length} Modules</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-sky-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BookOpen size={13} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Total Lessons</p>
                  <p className="font-medium text-slate-700 text-xs leading-tight">{totalLessonsCount} Lessons</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-sky-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Monitor size={13} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Mode</p>
                  <p className="font-medium text-slate-700 text-xs leading-tight">{courseMode}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-sky-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Award size={13} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Certificate</p>
                  <p className="font-medium text-slate-700 text-xs leading-tight">On Completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Links */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs space-y-1.5">
            <h3 className="text-xs font-semibold text-slate-800 tracking-tight mb-1.5">Quick Links</h3>
            
            <div className="space-y-0.5 text-xs">
              <div 
                onClick={() => {
                  window.open(`/api/pdf/syllabus?courseId=${courseId || ''}`, '_blank');
                }}
                className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 text-slate-600 font-normal text-xs group-hover:text-blue-600 transition-colors">
                  <Download size={13} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                  <span>Download Syllabus (PDF)</span>
                </div>
                <ChevronRight size={12} className="text-slate-300 group-hover:text-blue-600" />
              </div>

              <Link 
                href="/notifications"
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium text-xs hover:text-blue-600 group"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                  <span>Ask a Doubt</span>
                </div>
                <ChevronRight size={13} className="text-slate-300 group-hover:text-blue-600" />
              </Link>

              <Link 
                href="/dashboard"
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium text-xs hover:text-blue-600 group"
              >
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                  <span>Join Discussion</span>
                </div>
                <ChevronRight size={13} className="text-slate-300 group-hover:text-blue-600" />
              </Link>

              <Link 
                href="/notifications"
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium text-xs hover:text-blue-600 group"
              >
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                  <span>View Announcements</span>
                </div>
                <ChevronRight size={13} className="text-slate-300 group-hover:text-blue-600" />
              </Link>
            </div>
          </div>

          {/* Card 4: Quote Card */}
          <div className="bg-sky-50/60 border border-sky-100/90 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="text-xl font-serif text-blue-500 leading-none select-none">“</span>
              <p className="font-medium text-slate-700 leading-snug italic text-[11px]">
                Practice is the bridge between learning and success.
              </p>
            </div>
            <p className="text-[10px] font-bold text-blue-600 text-right">
              — Vision Learn
            </p>
          </div>
        </div>
      </div>

      {/* Note / Code Viewer Modal */}
      {viewingNote && (
        <NoteViewer 
          item={viewingNote} 
          onClose={() => setViewingNote(null)} 
        />
      )}

      {/* Lesson Viewer Modal */}
      {activeLesson && (
        <LessonViewer 
          lesson={activeLesson}
          isFullScreen={isFullScreen}
          onClose={() => { 
            if (activeLesson) {
              setLastClosedLessonId(activeLesson.id);
            }
            setActiveLesson(null); 
            setIsFullScreen(false); 
            // Reconstruct search parameters without lessonId to clean URL via vanilla history API
            const params = new URLSearchParams(window.location.search);
            params.delete("lessonId");
            const queryStr = params.toString();
            const newUrl = `${window.location.pathname}${queryStr ? '?' + queryStr : ''}`;
            window.history.replaceState(null, "", newUrl);
          }}
          userProgress={userProgress}
          toggleCompletion={toggleLessonCompletion}
          initialTests={initialTests}
          initialMaterials={initialMaterials}
          currentSchedules={currentSchedules}
          now={now}
          studentId={studentId}
        />
      )}
    </div>
  );
}

function SeriesView({
  allLessons,
  userProgress,
  currentSchedules,
  now,
  formatTime,
  isUpdating,
  toggleLessonCompletion,
  openLesson,
  nextLockedLessonId,
  displayModules
}: any) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const enrichedLessons = useMemo(() => {
    return allLessons.map((lesson: any) => {
      const schedule = getLatestScheduleForLesson(currentSchedules, lesson);
      let schedDate: Date | null = null;
      let isTimeReached = false;
      if (schedule) {
        schedDate = new Date(schedule.date);
        const [sh, sm] = (schedule.start_time || '00:00').split(':');
        schedDate.setHours(parseInt(sh), parseInt(sm), 0);
        isTimeReached = now >= schedDate;
      }
      const isLocked = !schedule || !isTimeReached;
      const isCompleted = userProgress.includes(lesson.id);
      const mod = displayModules.find((m: any) => (m.lessons || []).some((l: any) => l.id === lesson.id));
      return { lesson, schedule, schedDate, isLocked, isCompleted, moduleName: mod?.title || '' };
    });
  }, [allLessons, currentSchedules, now, userProgress, displayModules]);

  const sortedLessons = useMemo(() => {
    // 1. Assign chronological session numbers (1 ... N from oldest to newest)
    const chronological = [...enrichedLessons]
      .filter((e: any) => e.schedule)
      .sort((a: any, b: any) => {
        if (a.schedDate && b.schedDate) {
          const diff = a.schedDate.getTime() - b.schedDate.getTime();
          if (diff !== 0) return diff;
        }
        return (a.lesson.order_index ?? 0) - (b.lesson.order_index ?? 0);
      })
      .map((item: any, idx: number) => ({
        ...item,
        sessionNumber: idx + 1,
      }));

    if (sortOrder === 'oldest') {
      return chronological;
    }

    // Default: Newest first (the last scheduled content appears first at the top)
    return [...chronological].sort((a: any, b: any) => {
      if (a.schedDate && b.schedDate) {
        const diff = b.schedDate.getTime() - a.schedDate.getTime();
        if (diff !== 0) return diff;
      }
      return (b.lesson.order_index ?? 0) - (a.lesson.order_index ?? 0);
    });
  }, [enrichedLessons, sortOrder]);

  const completedCount = sortedLessons.filter((e: any) => e.isCompleted).length;
  const progressPct = sortedLessons.length > 0 ? Math.round((completedCount / sortedLessons.length) * 100) : 0;

  if (sortedLessons.length === 0) {
    return (
      <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
          <ListOrdered size={40} />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">No Series Found</h3>
        <p className="text-slate-500 font-medium">No classes have been scheduled yet.</p>
      </div>
    );
  }

  let lastDateStr = '';
  let sessionCounter = 0;

  return (
    <div className="space-y-3">
      {/* Timeline Status Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">Timeline Sessions</span>
          <span className="text-[10px] font-semibold text-slate-400">• {sortedLessons.length} classes</span>
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all cursor-pointer"
            title="Toggle sort order"
          >
            <ArrowUpDown size={10} />
            <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 sm:w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
            {completedCount}/{sortedLessons.length} ({progressPct}%)
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-7 sm:pl-8">
        {/* Vertical line */}
        <div className="absolute left-[9px] sm:left-[11px] top-2 bottom-6 w-[2px] bg-slate-200 rounded-full" />

        <div className="space-y-1.5">
          {sortedLessons.map((entry: any, index: number) => {
            const { lesson, schedule, schedDate, isLocked, isCompleted, moduleName } = entry;
            const lessonType = (lesson.lesson_type || lesson.type || 'video').toLowerCase();
            const isNextLocked = lesson.id === nextLockedLessonId;
            const isInProgress = !isCompleted && !isLocked;
            const isToday = schedDate ? schedDate.toDateString() === now.toDateString() : false;
            const isFuture = schedDate ? schedDate > now : false;

            const sessionNumber = entry.sessionNumber ?? (index + 1);

            let TypeIcon: any = PlayCircle;
            let gradientClass = 'from-blue-500 to-blue-600';
            let accentColor = 'text-blue-600';
            let bgLight = 'bg-blue-50';
            let borderLight = 'border-blue-100';

            if (lessonType === 'notes' || lessonType === 'article') {
              TypeIcon = BookOpen; gradientClass = 'from-emerald-500 to-teal-600'; accentColor = 'text-emerald-600'; bgLight = 'bg-emerald-50'; borderLight = 'border-emerald-100';
            } else if (lessonType === 'document') {
              TypeIcon = FileText; gradientClass = 'from-rose-500 to-pink-600'; accentColor = 'text-rose-600'; bgLight = 'bg-rose-50'; borderLight = 'border-rose-100';
            } else if (lessonType === 'mcq') {
              TypeIcon = HelpCircle; gradientClass = 'from-purple-500 to-violet-600'; accentColor = 'text-purple-600'; bgLight = 'bg-purple-50'; borderLight = 'border-purple-100';
            } else if (lessonType === 'assignment') {
              TypeIcon = Award; gradientClass = 'from-amber-500 to-orange-500'; accentColor = 'text-amber-600'; bgLight = 'bg-amber-50'; borderLight = 'border-amber-100';
            } else if (lessonType === 'project') {
              TypeIcon = FolderCode; gradientClass = 'from-indigo-500 to-purple-600'; accentColor = 'text-indigo-600'; bgLight = 'bg-indigo-50'; borderLight = 'border-indigo-100';
            }

            let dotBg = `bg-gradient-to-br ${gradientClass}`;
            if (isCompleted) dotBg = 'bg-emerald-500 text-white';
            if (isLocked && !isNextLocked) dotBg = 'bg-slate-100 border border-slate-250 text-slate-400';
            if (isNextLocked) dotBg = 'bg-indigo-50 border border-indigo-200 text-indigo-600';

            // Date separator (compact inline pill)
            const dateStr = schedDate?.toDateString() || '';
            let dateSeparator: React.ReactNode = null;
            if (dateStr !== lastDateStr) {
              lastDateStr = dateStr;
              const dateLabel = schedDate?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) || '';
              dateSeparator = (
                <div className="mb-2 mt-3 first:mt-1">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    isToday ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' :
                    isFuture ? 'bg-slate-100 text-slate-700 border-slate-200/80' :
                    'bg-slate-50 text-slate-500 border-slate-200/60'
                  }`}>
                    {isToday ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Today
                      </>
                    ) : (
                      <>
                        <Calendar size={10} className="text-slate-400" />
                        {dateLabel}
                      </>
                    )}
                  </span>
                </div>
              );
            }

            return (
              <div key={lesson.id}>
                {dateSeparator}
                <div className="relative flex items-center gap-3 mb-1 w-full">
                  {/* Timeline dot centered on rail */}
                  <div className={`absolute -left-[27px] sm:-left-[29px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full ring-2 ring-slate-50 flex items-center justify-center shrink-0 ${dotBg} shadow-2xs`}>
                    {isCompleted ? (
                      <Check size={11} strokeWidth={3} className="text-white" />
                    ) : isLocked && !isNextLocked ? (
                      <Lock size={9} className="text-slate-400" />
                    ) : isNextLocked ? (
                      <Lock size={9} className="text-indigo-600" />
                    ) : (
                      <TypeIcon size={10} className="text-white" />
                    )}
                  </div>

                  {/* Card with strictly bounded width and min-w-0 */}
                  <div 
                    onClick={() => !isLocked && openLesson(lesson)}
                    className={`flex-1 min-w-0 w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-200 ${
                      !isLocked ? 'cursor-pointer hover:border-indigo-200' : 'cursor-default'
                    } ${
                      isToday && isInProgress
                        ? 'border-indigo-200 bg-indigo-50/20 shadow-2xs'
                        : isNextLocked
                        ? 'border-slate-200 bg-slate-50/50'
                        : isLocked
                        ? 'border-slate-100 bg-slate-50/40 opacity-75'
                        : isCompleted
                        ? 'border-emerald-100 bg-emerald-50/20 hover:border-emerald-200'
                        : 'bg-white border-slate-200/70 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Session # */}
                      <span className="text-[10px] font-bold text-slate-400 tabular-nums shrink-0 w-4 text-center">
                        {sessionNumber}
                      </span>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h5 className={`font-semibold text-xs sm:text-sm leading-snug truncate min-w-0 flex-1 ${
                            isCompleted ? 'text-slate-600' : isLocked && !isNextLocked ? 'text-slate-400' : 'text-slate-900'
                          }`}>
                            {lesson.title}
                          </h5>
                          {isNextLocked && <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">Next</span>}
                          {isToday && isInProgress && <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 shrink-0 animate-pulse">● Today</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${bgLight} ${accentColor} border ${borderLight}`}>
                            {lessonType === 'notes' ? 'Notes' : lessonType === 'mcq' ? 'Quiz' : lessonType === 'assignment' ? 'Assignment' : lessonType === 'project' ? 'Project' : lessonType === 'document' ? 'Doc' : 'Video'}
                          </span>
                          {lesson.duration && <span className="text-[10px] font-medium text-slate-400 shrink-0">{lesson.duration}m</span>}
                          {schedule?.start_time && (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                              <Clock size={9} />{formatTime(schedule.start_time)}
                            </span>
                          )}
                          {moduleName && <span className="text-[10px] font-medium text-slate-400 truncate max-w-[120px] hidden sm:inline">{moduleName}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Action - Aligned in one consistent column */}
                    <div className="shrink-0 ml-2 w-[58px] flex justify-end items-center">
                      {isLocked && !isNextLocked ? (
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                          <Lock size={12} />
                        </div>
                      ) : isNextLocked ? (
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400">
                          <Lock size={12} />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLesson(lesson);
                          }}
                          className={`w-full py-1 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                            isCompleted ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60' :
                            isInProgress ? `bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700` :
                            'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isCompleted ? 'Review' : 'Start'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* End cap */}
        <div className="-ml-7 sm:-ml-8 mt-3 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={11} className="text-slate-300" />
          </div>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">
            {sortOrder === 'newest' ? 'Beginning of Classes' : 'End of Classes'}
          </p>
        </div>
      </div>
    </div>
  );
}

function ModuleItem({ 
  module, 
  mIdx, 
  isExpanded, 
  toggleModule, 
  progress, 
  userProgress, 
  currentSchedules, 
  now, 
  formatTime, 
  isUpdating, 
  toggleLessonCompletion, 
  openLesson,
  availableBatches,
  chapters,
  nextLockedLessonId
}: any) {
  const lessons = useMemo(() => 
    (module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index),
    [module.lessons]
  );

  const moduleChapters = useMemo(() => {
    const relevantChapters = [...(module.lms_chapters || [])].sort((a: any, b: any) => a.order_index - b.order_index);
    return relevantChapters.map((chapter: any) => ({
      ...chapter,
      lessons: lessons.filter((l: any) => l.chapter_id === chapter.id)
    }));
  }, [module.lms_chapters, lessons]);

  const uncategorizedLessons = useMemo(() => 
    lessons.filter((l: any) => !l.chapter_id),
    [lessons]
  );

  const [expandedChapters, setExpandedChapters] = useState<string[]>(
    moduleChapters.length > 0 ? [moduleChapters[0].id] : []
  );

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const moduleColorStyles = [
    'bg-blue-600 text-white',
    'bg-purple-600 text-white',
    'bg-emerald-600 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
    'bg-indigo-600 text-white',
  ];

  const completedInModule = useMemo(() => {
    return lessons.filter((l: any) => userProgress.includes(l.id)).length;
  }, [lessons, userProgress]);

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
      isExpanded ? 'border-slate-200/90 shadow-sm' : 'border-slate-200/80 shadow-2xs hover:border-slate-300'
    }`}>
      <button 
        onClick={() => toggleModule(module.id)}
        className="w-full px-3.5 sm:px-4 py-3 flex items-center justify-between text-left group cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm shrink-0 shadow-xs ${
            moduleColorStyles[mIdx % moduleColorStyles.length]
          }`}>
            {mIdx + 1}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight truncate">
              {module.title?.toLowerCase().startsWith("module") ? module.title : `Module ${mIdx + 1}: ${module.title}`}
            </h3>
            <p className="text-[11px] text-slate-500 font-normal mt-0.5 line-clamp-1">
              {module.description || "Foundational concepts, practice tasks, and exercises."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-3">
          <div className="flex items-center gap-2 hidden sm:flex">
            <span className="text-[11px] font-medium text-slate-500">
              {completedInModule} / {lessons.length} lessons
            </span>
            <div className="w-16 sm:w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden inline-block">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <span className="text-[10px] font-medium text-slate-400 min-w-[24px]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-transform duration-200 shrink-0 ${
            isExpanded ? 'text-blue-600 rotate-180' : 'text-slate-400'
          }`}>
            <ChevronDown size={16} />
          </div>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[5000px] opacity-100 pb-3' : 'max-h-0 opacity-0'}`}>
        <div className="mx-3.5 sm:mx-4 h-[1px] bg-slate-100 mb-2.5" />
        <div className="px-2.5 sm:px-3.5 space-y-2">
          {/* Categorized Chapters */}
          {moduleChapters.map((chapter: any, cIdx: number) => (
            <div key={chapter.id} className="space-y-1">
              <button 
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-all border border-slate-200/60 group/chapter cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`transition-transform duration-200 text-slate-400 group-hover/chapter:text-slate-600 ${expandedChapters.includes(chapter.id) ? 'rotate-180' : ''}`}>
                    <ChevronDown size={14} />
                  </div>
                  <BookOpen size={14} className="text-blue-600 shrink-0" />
                  <h4 className="text-xs font-bold text-slate-800 leading-tight truncate">{chapter.title}</h4>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-500 text-[11px] font-medium">
                  <span>{chapter.lessons.length} Lessons</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
              </button>

              {expandedChapters.includes(chapter.id) && (
                <div className="pl-1 sm:pl-2 space-y-1.5">
                  {(() => {
                    let classCounter = 0;
                    const sortedLessons = [...chapter.lessons].sort((a: any, b: any) => a.order_index - b.order_index).map((l: any) => {
                      const lessonType = (l.lesson_type || l.type || 'video').toLowerCase();
                      const isClass = lessonType === 'video' || lessonType === 'notes';
                      if (isClass) {
                        classCounter++;
                        return { ...l, classIndex: classCounter };
                      }
                      return l;
                    });
                    return sortedLessons.map((lesson: any, lIdx: number) => (
                      <LessonItem 
                        key={lesson.id}
                        lIdx={lIdx}
                        lesson={lesson}
                        moduleTitle={module.title}
                        userProgress={userProgress}
                        currentSchedules={currentSchedules}
                        now={now}
                        formatTime={formatTime}
                        isUpdating={isUpdating}
                        toggleLessonCompletion={toggleLessonCompletion}
                        openLesson={openLesson}
                        availableBatches={availableBatches}
                        isNextLocked={lesson.id === nextLockedLessonId}
                      />
                    ));
                  })()}
                </div>
              )}
            </div>
          ))}

          {/* Uncategorized Lessons */}
          {uncategorizedLessons.length > 0 && (
            <div className="space-y-2">
               <div className="flex items-center gap-2 px-2 pt-1">
                  <div className="h-[1px] flex-1 bg-slate-100" />
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Uncategorized Classes</h4>
                  <div className="h-[1px] flex-1 bg-slate-100" />
               </div>
               <div className="pl-1 sm:pl-2 space-y-1.5">
                  {(() => {
                    let classCounter = 0;
                    const sortedLessons = [...uncategorizedLessons].sort((a: any, b: any) => a.order_index - b.order_index).map((l: any) => {
                      const lessonType = (l.lesson_type || l.type || 'video').toLowerCase();
                      const isClass = lessonType === 'video' || lessonType === 'notes';
                      if (isClass) {
                        classCounter++;
                        return { ...l, classIndex: classCounter };
                      }
                      return l;
                    });
                    return sortedLessons.map((lesson: any, lIdx: number) => (
                      <LessonItem 
                        key={lesson.id}
                        lIdx={lIdx}
                        lesson={lesson}
                        moduleTitle={module.title}
                        userProgress={userProgress}
                        currentSchedules={currentSchedules}
                        now={now}
                        formatTime={formatTime}
                        isUpdating={isUpdating}
                        toggleLessonCompletion={toggleLessonCompletion}
                        openLesson={openLesson}
                        availableBatches={availableBatches}
                        isNextLocked={lesson.id === nextLockedLessonId}
                      />
                    ));
                  })()}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LessonItem({ 
  lesson, 
  moduleTitle, 
  userProgress, 
  currentSchedules, 
  now, 
  formatTime, 
  isUpdating, 
  toggleLessonCompletion, 
  openLesson,
  lIdx,
  availableBatches,
  isNextLocked = false
}: any) {
  const isCompleted = userProgress.includes(lesson.id);
  const schedule = getLatestScheduleForLesson(currentSchedules, lesson);
  
  let isScheduled = false;
  let isTimeReached = false;
  
  if (schedule) {
    isScheduled = true;
    const schedDate = new Date(schedule.date);
    const schedTime = schedule.start_time || "00:00";
    const [sh, sm] = schedTime.split(':');
    schedDate.setHours(parseInt(sh), parseInt(sm), 0);
    isTimeReached = now >= schedDate;
  }

  const isLocked = !isScheduled || !isTimeReached;
  const isInProgress = !isCompleted && !isLocked;

  const lessonType = (lesson.lesson_type || lesson.type || 'video').toLowerCase();
  
  let typeColorClasses = 'bg-blue-50 text-blue-600 border border-blue-100';
  let TypeIcon = PlayCircle;

  if (lessonType === 'video') {
    TypeIcon = PlayCircle;
    typeColorClasses = isCompleted 
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
      : 'bg-blue-50 text-blue-600 border border-blue-100';
  } else if (lessonType === 'notes' || lessonType === 'article') {
    TypeIcon = BookOpen;
    typeColorClasses = isCompleted 
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
      : 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  } else if (lessonType === 'assignment') {
    TypeIcon = Award;
    typeColorClasses = isCompleted 
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
      : 'bg-amber-50 text-amber-600 border border-amber-100';
  } else if (lessonType === 'project') {
    TypeIcon = FolderCode;
    typeColorClasses = isCompleted 
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
      : 'bg-indigo-50 text-indigo-600 border border-indigo-100';
  } else if (lessonType === 'mcq') {
    TypeIcon = HelpCircle;
    typeColorClasses = isCompleted 
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
      : 'bg-purple-50 text-purple-600 border border-purple-100';
  } else if (lessonType === 'document') {
    TypeIcon = FileText;
    typeColorClasses = isCompleted 
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
      : 'bg-rose-50 text-rose-600 border border-rose-100';
  }

  if (isLocked) {
    typeColorClasses = 'bg-slate-100 text-slate-400 border border-slate-200/60';
  } else if (isNextLocked) {
    typeColorClasses = 'bg-indigo-50 text-indigo-600 border border-indigo-200';
  }

  // Calculate lesson duration display (e.g. "10 min", "15 min", "12 min")
  const durationText = lesson.duration 
    ? `${lesson.duration} min` 
    : lessonType === 'video' 
      ? '15 min' 
      : lessonType === 'mcq' 
        ? '10 min' 
        : lessonType === 'assignment' || lessonType === 'project'
          ? '20 min'
          : '10 min';

  return (
    <div 
      onClick={() => !isLocked && openLesson(lesson)}
      className={`flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl transition-all duration-150 group border ${
        !isLocked ? 'cursor-pointer hover:bg-slate-50/80 border-slate-100 hover:border-slate-200' : 'cursor-default opacity-85 border-slate-100/70 bg-slate-50/30'
      } ${
        isInProgress ? 'bg-sky-50/30 border-sky-100' : isCompleted ? 'bg-white' : 'bg-white'
      }`}
    >
      {/* Left side: Status Icon, File Icon, Index, Title */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
        {/* Status circle */}
        {isCompleted ? (
          <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50 shrink-0" />
        ) : isInProgress ? (
          <PlayCircle size={16} className="text-blue-600 fill-blue-50 shrink-0" />
        ) : isLocked && !isNextLocked ? (
          <Circle size={16} className="text-slate-300 shrink-0" />
        ) : isNextLocked ? (
          <Lock size={15} className="text-blue-600 shrink-0" />
        ) : (
          <Circle size={16} className="text-slate-300 shrink-0" />
        )}

        {/* Small document icon */}
        <FileText size={13} className="text-slate-400 shrink-0 hidden sm:block" />

        {/* Index e.g. 1.1 */}
        <span className="text-[11px] font-medium text-slate-400 shrink-0 w-6">
          {lesson.classIndex ? `1.${lesson.classIndex}` : `1.${lIdx + 1}`}
        </span>

        {/* Title */}
        <span className={`text-xs font-medium truncate min-w-0 ${
          isCompleted ? 'text-slate-700' : isLocked ? 'text-slate-500' : 'text-slate-900'
        }`}>
          {lesson.title}
        </span>
      </div>

      {/* Right side: Status Pill, Type Pill, Duration, Action Button */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
        {/* Status Pill */}
        {isCompleted ? (
          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100/80 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            Completed
          </span>
        ) : isInProgress ? (
          <span className="bg-sky-50 text-sky-600 border border-sky-100/80 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            In Progress
          </span>
        ) : isNextLocked ? (
          <span className="bg-blue-50 text-blue-600 border border-blue-100/80 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            Next
          </span>
        ) : (
          <span className="bg-slate-50 text-slate-500 border border-slate-200/60 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            Not Started
          </span>
        )}

        {/* Type Pill */}
        {lessonType === 'video' ? (
          <span className="bg-sky-50 text-sky-600 border border-sky-100/70 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
            <Play size={9} className="fill-current" /> Video
          </span>
        ) : lessonType === 'mcq' ? (
          <span className="bg-purple-50 text-purple-600 border border-purple-100/70 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
            <HelpCircle size={10} /> MCQ Test
          </span>
        ) : lessonType === 'assignment' || lessonType === 'project' ? (
          <span className="bg-amber-50 text-amber-600 border border-amber-100/70 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
            <PenTool size={9} /> Practical
          </span>
        ) : (
          <span className="bg-sky-50 text-sky-600 border border-sky-100/70 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
            <BookOpen size={9} /> Theory
          </span>
        )}

        {/* Duration */}
        <span className="text-[11px] font-medium text-slate-400 w-11 text-right hidden sm:inline-block">
          {durationText}
        </span>

        {/* Circular Action Button */}
        {!isLocked ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openLesson(lesson);
            }}
            className="w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-90 cursor-pointer shrink-0"
            title="Start / View Lesson"
          >
            <Play size={9} className="fill-current translate-x-[0.5px]" />
          </button>
        ) : (
          <div className="w-5 h-5 rounded-full border border-slate-200 text-slate-300 flex items-center justify-center shrink-0">
            <Lock size={9} />
          </div>
        )}
      </div>
    </div>
  );
}

