"use client";

import { useState, useMemo, useEffect } from "react";
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
  LayoutList
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

const normalize = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

const isScheduleTypeMatch = (s: any, l: any) => {
  const sType = (s.type || 'class').toLowerCase();
  const lType = (l.lesson_type || l.type || 'video').toLowerCase();
  if (lType === 'mcq') return sType === 'quiz';
  if (lType === 'assignment') return sType === 'assignment';
  if (lType === 'project') return sType === 'project';
  return sType === 'class' || sType === 'lecture' || sType === 'event';
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
  initialChapters = []
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
  initialChapters?: any[]
}) {
  const [courseId] = useState<string | null>(initialCourseId || initialModules[0]?.course_id || null);
  const [chapters] = useState<any[]>(initialChapters);
  
  // Use cached data
  const { modules: cachedModules, progress: cachedProgress } = useCachedCurriculum(courseId || "", studentId);

  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  
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

  // Tab state: 'syllabus' | 'series'
  const [activeTab, setActiveTab] = useState<'syllabus' | 'series'>('series');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonIdParam = searchParams.get('lessonId');

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
      const schedule = currentSchedules.find((st: any) => {
        const sTitle = st.title || '';
        const parts = sTitle.split(':');
        const lessonPart = parts[parts.length - 1].trim();
        return normalize(lessonPart) === normalize(lesson.title) && isScheduleTypeMatch(st, lesson);
      });

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
      const schedule = currentSchedules.find((st: any) => {
        const sTitle = st.title || '';
        const parts = sTitle.split(':');
        const lessonPart = parts[parts.length - 1].trim();
        return normalize(lessonPart) === normalize(lesson.title) && isScheduleTypeMatch(st, lesson);
      });
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
    const schedule = currentSchedules.find((st: any) => {
      const sTitle = st.title || '';
      const parts = sTitle.split(':');
      const lessonPart = parts[parts.length - 1].trim();
      return normalize(lessonPart) === normalize(lesson.title) && isScheduleTypeMatch(st, lesson);
    });
    return schedule ? { lesson, schedule } : null;
  }, [nextLockedLessonId, allLessons, currentSchedules]);

  // Check if nextUpLesson is actually a scheduled class (not just a self-paced fallback)
  const nextUpLessonHasSchedule = useMemo(() => {
    if (!nextUpLesson) return false;
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    return currentSchedules.some((st: any) => {
      const sTitle = st.title || '';
      const parts = sTitle.split(':');
      const lessonPart = parts[parts.length - 1].trim();
      return normalize(lessonPart) === normalize(nextUpLesson.title) && isScheduleTypeMatch(st, nextUpLesson);
    });
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
        const schedule = currentSchedules.find((st: any) => {
          const sTitle = st.title || '';
          const parts = sTitle.split(':');
          const lessonPart = parts[parts.length - 1].trim();
          return normalize(lessonPart) === normalize(lesson.title) && isScheduleTypeMatch(st, lesson);
        });
        
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
        const schedule = currentSchedules.find((st: any) => {
          const sTitle = st.title || '';
          const parts = sTitle.split(':');
          const lessonPart = parts[parts.length - 1].trim();
          return normalize(lessonPart) === normalize(lessonToOpen.title) && isScheduleTypeMatch(st, lessonToOpen);
        });
        
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

  return (
    <div className="max-w-4xl mx-auto space-y-3 pb-20">
      {/* Sleek Minimal Header Card */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs space-y-3">
        {/* Top: Title & Completion Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">My Classes</h1>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold text-slate-700">
              {completedClasses.length}/{classLessons.length}
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {totalProgress}%
            </span>
          </div>
        </div>

        {/* Clean, Thin Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out" 
            style={{ width: `${totalProgress}%` }} 
          />
        </div>

        {/* Minimal 4-Stats Bar (Single Row) */}
        <div className="grid grid-cols-4 divide-x divide-slate-150 bg-slate-50/70 rounded-xl border border-slate-200/60 py-2 px-1 text-center">
          <div className="px-1 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <BookOpen size={11} className="text-indigo-500" />
              <span>Total</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 leading-none">{classLessons.length}</p>
          </div>

          <div className="px-1 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <CheckCircle2 size={11} className="text-emerald-500" />
              <span>Done</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5 leading-none">{completedClasses.length}</p>
          </div>

          <div className="px-1 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <Clock size={11} className="text-amber-500" />
              <span>Learnt</span>
              {isLiveTracking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 leading-none">{totalMinutes}m</p>
          </div>

          <div className="px-1 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <Calendar size={11} className="text-purple-500" />
              <span>Upcoming</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 leading-none">{upcomingCount}</p>
          </div>
        </div>
      </div>

      {/* Sleek Minimal Tab Switcher */}
      <div className="bg-slate-100/90 p-1 rounded-xl flex gap-1 border border-slate-200/50">
        <button
          onClick={() => setActiveTab('series')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'series'
              ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListOrdered size={14} />
          <span>Series (Timeline)</span>
        </button>
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'syllabus'
              ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutList size={14} />
          <span>Syllabus (Modules)</span>
        </button>
      </div>

      {activeTab === 'syllabus' ? (
        <>
          {/* Search and Filters Bar */}
          <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
              <div className="relative w-full sm:flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search size={14} />
                </div>
                <input 
                  type="text"
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto pb-0.5 sm:pb-0">
                {/* Filter Status Selector */}
                <div className="flex rounded-lg bg-slate-50 p-0.5 border border-slate-200/60 text-[11px] font-semibold text-slate-500 shrink-0">
                  <button 
                    onClick={() => setFilterStatus('all')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${filterStatus === 'all' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'hover:text-slate-900'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilterStatus('completed')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${filterStatus === 'completed' ? 'bg-white text-emerald-600 shadow-2xs font-bold' : 'hover:text-slate-900'}`}
                  >
                    Completed
                  </button>
                  <button 
                    onClick={() => setFilterStatus('in_progress')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${filterStatus === 'in_progress' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'hover:text-slate-900'}`}
                  >
                    In Progress
                  </button>
                  <button 
                    onClick={() => setFilterStatus('locked')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${filterStatus === 'locked' ? 'bg-white text-rose-600 shadow-2xs font-bold' : 'hover:text-slate-900'}`}
                  >
                    Locked
                  </button>
                </div>

                {/* Filter Type Selector */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-[11px] font-semibold text-slate-600 cursor-pointer shrink-0"
                >
                  <option value="all">All Types</option>
                  <option value="video">Videos</option>
                  <option value="article">Articles</option>
                  <option value="document">Documents</option>
                  <option value="offline">Assignments</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modules List */}
          <div className="space-y-2.5">
            {filteredModules.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200/70 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-3">
                   <BookOpen size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">No Classes Found</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Try adjusting your search terms or filters to find what you are looking for.</p>
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
        </>
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
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  const enrichedLessons = useMemo(() => {
    return allLessons.map((lesson: any) => {
      const schedule = currentSchedules.find((st: any) => {
        const sTitle = st.title || '';
        const parts = sTitle.split(':');
        const lessonPart = parts[parts.length - 1].trim();
        return normalize(lessonPart) === normalize(lesson.title) && isScheduleTypeMatch(st, lesson);
      });
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
    // 1. Assign canonical chronological sequence number (1, 2, ... N)
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

    // 2. Sort so Newest date is at the top (first), and Oldest date is at the bottom (last)
    return chronological.sort((a: any, b: any) => {
      if (a.schedDate && b.schedDate) {
        // Compare calendar day (descending)
        const aDay = new Date(a.schedDate.getFullYear(), a.schedDate.getMonth(), a.schedDate.getDate()).getTime();
        const bDay = new Date(b.schedDate.getFullYear(), b.schedDate.getMonth(), b.schedDate.getDate()).getTime();
        if (bDay !== aDay) {
          return bDay - aDay; // Newest date first, oldest date last
        }
        // Within the same day: keep chronological session order (morning to evening, notes then quiz)
        const timeDiff = a.schedDate.getTime() - b.schedDate.getTime();
        if (timeDiff !== 0) return timeDiff;
      }
      return (a.lesson.order_index ?? 0) - (b.lesson.order_index ?? 0);
    });
  }, [enrichedLessons]);

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
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800">Timeline Sessions</span>
          <span className="text-[10px] font-semibold text-slate-400">• {sortedLessons.length} classes</span>
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
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">End of Classes</p>
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

  return (
    <div className={`bg-white rounded-xl border transition-all duration-300 ${
      isExpanded ? 'border-indigo-200 shadow-2xs' : 'border-slate-200/80 shadow-2xs hover:border-slate-300'
    }`}>
      <button 
        onClick={() => toggleModule(module.id)}
        className="w-full px-3.5 py-3 flex items-center justify-between text-left group cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
            isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
          }`}>
            {mIdx + 1}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">{module.title}</h3>
            <div className="flex items-center gap-2.5 mt-0.5">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                <BookOpen size={11} /> {lessons.length} Classes
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-14 sm:w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <span className="text-[10px] font-bold text-indigo-600">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-transform duration-200 shrink-0 ${
          isExpanded ? 'text-indigo-600 rotate-180' : 'text-slate-400'
        }`}>
          <ChevronDown size={15} />
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[5000px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        <div className="mx-4 h-[1px] bg-slate-100 mb-3" />
        <div className="px-3 sm:px-4 space-y-2">
          {/* Categorized Chapters */}
          {moduleChapters.map((chapter: any, cIdx: number) => (
            <div key={chapter.id} className="space-y-1.5">
              <button 
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-all border border-slate-150 group/chapter cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-white border border-slate-200/60 flex items-center justify-center text-slate-500 group-hover/chapter:text-indigo-600 transition-colors">
                    <Layers size={14} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">{chapter.title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{chapter.lessons.length} Classes</p>
                  </div>
                </div>
                <div className={`transition-transform duration-200 ${expandedChapters.includes(chapter.id) ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}>
                   <ChevronDown size={14} />
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
  
  const schedule = currentSchedules.find((st: any) => {
    const sTitle = st.title || '';
    const parts = sTitle.split(':');
    const lessonPart = parts[parts.length - 1].trim();
    return normalize(lessonPart) === normalize(lesson.title) && isScheduleTypeMatch(st, lesson);
  });
  
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

  return (
    <div 
      onClick={() => !isLocked && openLesson(lesson)}
      className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all duration-200 group ${
        !isLocked ? 'cursor-pointer hover:border-indigo-200' : 'cursor-default'
      } ${
        isNextLocked
          ? 'bg-white border-indigo-200 shadow-2xs'
          : isLocked ? 'bg-slate-50/50 border-slate-100 opacity-80' :
            isCompleted ? 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200' :
            isInProgress ? 'bg-white border-indigo-100 shadow-2xs' :
            'bg-white border-slate-200/70 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${typeColorClasses}`}>
          {(isLocked || isNextLocked) ? <Lock size={12} /> : <TypeIcon size={13} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h5 className={`font-semibold text-xs sm:text-sm leading-snug truncate min-w-0 flex-1 ${isCompleted ? 'text-slate-600' : 'text-slate-900'}`}>
              {lesson.classIndex ? `Class ${lesson.classIndex}: ${lesson.title}` :
               (lesson.lesson_type || lesson.type)?.toLowerCase() === 'mcq' ? `Quiz: ${lesson.title}` :
               (lesson.lesson_type || lesson.type)?.toLowerCase() === 'assignment' ? `Assignment: ${lesson.title}` :
               (lesson.lesson_type || lesson.type)?.toLowerCase() === 'project' ? `Project: ${lesson.title}` :
               `${lesson.title}`}
            </h5>
            {isInProgress && (
              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                In Progress
              </span>
            )}
            {isNextLocked && <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">Next</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              {(lesson.lesson_type || lesson.type || 'Class')} {lesson.duration ? `• ${lesson.duration}m` : ''}
            </span>
            {schedule && (
              <span className="text-[9px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60 flex items-center gap-1 shrink-0">
                <Calendar size={9} /> 
                <span>
                  {new Date(schedule.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {schedule.start_time ? ` • ${formatTime(schedule.start_time)}` : ''}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 ml-2 w-[58px] flex justify-end items-center">
        {isNextLocked ? (
          <div className="w-7 h-7 rounded-lg bg-indigo-50/80 border border-indigo-150 flex items-center justify-center text-indigo-500">
            <Lock size={12} />
          </div>
        ) : isLocked ? (
          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400">
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
              isInProgress ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs' :
              'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isCompleted ? 'Review' : 'Start'}
          </button>
        )}
      </div>
    </div>
  );
}

