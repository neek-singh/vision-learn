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
  Sparkles
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

export function CurriculumClient({ 
  initialModules, 
  initialProgress, 
  studentId,
  initialSchedules = [],
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

  const [expandedModules, setExpandedModules] = useState<string[]>(
    initialModules.length > 0 ? [initialModules[0].id] : []
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
  const [activeBatch] = useState<string | null>(initialBatch);
  const [now, setNow] = useState(new Date());

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonIdParam = searchParams.get('lessonId');

  // Use cached modules if available, otherwise fallback to initial
  const displayModules = cachedModules && cachedModules.length > 0 ? cachedModules : initialModules;

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
        const normalizedActiveBatch = activeBatch?.trim().toLowerCase();
        const filtered = rawSchedules
          .filter(s => {
            const sBatch = s.batch?.trim().toLowerCase();
            const batchMatch = !sBatch || sBatch === "all batches" || !normalizedActiveBatch || 
                               sBatch === normalizedActiveBatch || sBatch.includes(normalizedActiveBatch) || 
                               normalizedActiveBatch.includes(sBatch);
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
    return [...displayModules]
      .sort((a, b) => a.order_index - b.order_index)
      .flatMap(m => (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index));
  }, [displayModules]);

  const totalProgress = useMemo(() => {
    if (allLessons.length === 0) return 0;
    return Math.round((userProgress.length / allLessons.length) * 100);
  }, [allLessons, userProgress]);

  const totalHours = useMemo(() => {
    const totalMins = allLessons
      .filter(l => userProgress.includes(l.id))
      .reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
    return (totalMins / 60).toFixed(1);
  }, [allLessons, userProgress]);

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
        const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const sTitle = normalize(st.title);
        const lTitle = normalize(lesson.title);
        return sTitle.includes(lTitle);
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

  // Filter displayModules down to matching search/filter constraints
  const filteredModules = useMemo(() => {
    return displayModules.map((module: any) => {
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
          const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
          const sTitle = normalize(st.title);
          const lTitle = normalize(lesson.title);
          return sTitle.includes(lTitle);
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
  }, [displayModules, searchTerm, filterType, filterStatus, userProgress, currentSchedules, now]);

  // Auto-open lesson if lessonId is in URL
  useEffect(() => {
    if (lessonIdParam && allLessons.length > 0 && !activeLesson && lessonIdParam !== lastClosedLessonId) {
      const lessonToOpen = allLessons.find(l => l.id === lessonIdParam);
      if (lessonToOpen) {
        // Check if locked before auto-opening
        const schedule = currentSchedules.find((st: any) => {
          const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
          const sTitle = normalize(st.title);
          const lTitle = normalize(lessonToOpen.title);
          return sTitle.includes(lTitle);
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Course Header & Progress */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
           <Award size={180} />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Classes</h1>
            <p className="text-slate-500 font-medium">Follow your structured learning path to mastery.</p>
            <div className="pt-2">
              <DownloadButton courseId={courseId || ""} courseTitle="My Course" />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Your Progress</p>
              <p className="text-2xl font-black text-indigo-600">{totalProgress}% <span className="text-slate-300 text-sm">/ 100%</span></p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50">
               <Zap size={24} fill="currentColor" />
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-end px-1">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Overall Completion</p>
              <p className="text-xl font-black text-slate-900 tracking-tight">{totalProgress}% <span className="text-slate-300 font-medium">Finished</span></p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-widest inline-block">
                {userProgress.length} / {allLessons.length} Classes
              </p>
            </div>
          </div>
          <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1 relative">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(79,70,229,0.3)] relative z-10" 
              style={{ width: `${totalProgress}%` }} 
            />
            <div className="absolute inset-y-0 left-0 w-full animate-shimmer pointer-events-none opacity-30 bg-gradient-to-r from-transparent via-white to-transparent" style={{ backgroundSize: '200% 100%' }} />
          </div>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">Total Classes</p>
            <p className="text-lg font-black text-slate-900">{allLessons.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">Completed</p>
            <p className="text-lg font-black text-slate-900">{userProgress.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">Hours Learnt</p>
            <p className="text-lg font-black text-slate-900">{totalHours}h</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">Upcoming</p>
            <p className="text-lg font-black text-slate-900">{upcomingCount}</p>
          </div>
        </div>
      </div>

      {/* Next Up Lesson Section */}
      {nextUpLesson && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-100 border border-indigo-900/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shrink-0 text-indigo-300">
              <Sparkles className="animate-pulse" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-400/20 uppercase tracking-widest">Next Up Class</span>
                <span className="text-[9px] font-bold text-white/50">• {nextUpLesson.duration ? `${nextUpLesson.duration} Mins` : 'Self-paced'}</span>
              </div>
              <h4 className="text-base font-black tracking-tight line-clamp-1">{nextUpLesson.title}</h4>
              <p className="text-xs text-white/60 line-clamp-1 mt-0.5">Start this lesson to continue your learning journey.</p>
            </div>
          </div>
          <button 
            onClick={() => openLesson(nextUpLesson)}
            className="px-8 py-3 bg-white text-indigo-950 hover:bg-indigo-50 rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-black/20 relative z-10 shrink-0 uppercase tracking-wider flex items-center gap-2 hover:gap-3"
          >
            Start Learning <Play size={12} fill="currentColor" />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input 
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold text-slate-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter Status Selector */}
            <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-100 text-xs font-bold text-slate-500">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === 'all' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === 'completed' ? 'bg-white text-emerald-600 shadow-sm font-black' : 'hover:text-slate-900'}`}
              >
                Completed
              </button>
              <button 
                onClick={() => setFilterStatus('in_progress')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === 'in_progress' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'}`}
              >
                In Progress
              </button>
              <button 
                onClick={() => setFilterStatus('locked')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === 'locked' ? 'bg-white text-rose-600 shadow-sm font-black' : 'hover:text-slate-900'}`}
              >
                Locked
              </button>
            </div>

            {/* Filter Type Selector */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-slate-600 cursor-pointer"
            >
              <option value="all">All Formats</option>
              <option value="video">Videos</option>
              <option value="article">Articles</option>
              <option value="document">Documents</option>
              <option value="offline">Offline / Assignments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {filteredModules.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
               <BookOpen size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No Classes Found</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">Try adjusting your search terms or filters to find what you are looking for.</p>
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
          />
        ))}
      </div>

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
        />
      )}
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
  chapters
}: any) {
  const lessons = useMemo(() => 
    (module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index),
    [module.lessons]
  );

  const moduleChapters = useMemo(() => {
    const relevantChapters = chapters.filter((c: any) => c.module_id === module.id).sort((a: any, b: any) => a.order_index - b.order_index);
    return relevantChapters.map((chapter: any) => ({
      ...chapter,
      lessons: lessons.filter((l: any) => l.chapter_id === chapter.id)
    }));
  }, [chapters, lessons, module.id]);

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
    <div className={`bg-white rounded-2xl border transition-all duration-500 ${
      isExpanded ? 'border-indigo-100 shadow-xl shadow-indigo-50/50' : 'border-slate-100 shadow-sm hover:border-slate-200'
    }`}>
      <button 
        onClick={() => toggleModule(module.id)}
        className="w-full px-6 py-5 flex items-center justify-between text-left group cursor-pointer"
      >
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            isExpanded ? 'bg-indigo-600 text-white rotate-6 scale-110' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
          }`}>
            <div className="font-black text-xl leading-none">{mIdx + 1}</div>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">{module.title}</h3>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen size={12} /> {lessons.length} Classes
              </span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-[1px]">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(79,70,229,0.4)]" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <span className="text-[10px] font-black text-indigo-600 tabular-nums tracking-tight">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          isExpanded ? 'bg-indigo-50 text-indigo-600 rotate-180' : 'bg-slate-50 text-slate-300'
        }`}>
          <ChevronDown size={20} />
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[5000px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
        <div className="mx-8 h-[1px] bg-slate-50 mb-6" />
        <div className="px-6 space-y-6">
          {/* Categorized Chapters */}
          {moduleChapters.map((chapter: any, cIdx: number) => (
            <div key={chapter.id} className="space-y-4">
              <button 
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all border border-slate-100 group/chapter cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/chapter:text-indigo-600 transition-colors">
                    <Layers size={18} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{chapter.title}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{chapter.lessons.length} Classes</p>
                  </div>
                </div>
                <div className={`transition-transform duration-300 ${expandedChapters.includes(chapter.id) ? 'rotate-180 text-indigo-600' : 'text-slate-300'}`}>
                   <ChevronDown size={16} />
                </div>
              </button>

              {expandedChapters.includes(chapter.id) && (
                <div className="pl-4 space-y-3">
                  {chapter.lessons.map((lesson: any, lIdx: number) => (
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
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Uncategorized Lessons */}
          {uncategorizedLessons.length > 0 && (
            <div className="space-y-4">
               <div className="flex items-center gap-3 px-3">
                  <div className="h-[1px] flex-1 bg-slate-100" />
                  <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">Uncategorized Classes</h4>
                  <div className="h-[1px] flex-1 bg-slate-100" />
               </div>
               <div className="pl-4 space-y-3">
                 {uncategorizedLessons.map((lesson: any, lIdx: number) => (
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
                   />
                 ))}
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
  availableBatches
}: any) {
  const isCompleted = userProgress.includes(lesson.id);
  
  const schedule = currentSchedules.find((st: any) => {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const sTitle = normalize(st.title);
    const lTitle = normalize(lesson.title);
    return sTitle.includes(lTitle);
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

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all group ${
      isLocked ? 'opacity-60 bg-slate-50/50 border-transparent cursor-not-allowed' :
      isCompleted ? 'bg-emerald-50/30 border-emerald-100/50 hover:border-emerald-200' :
      isInProgress ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-50/30 ring-1 ring-indigo-50' :
      'bg-white border-slate-50 hover:border-slate-200'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
          isLocked ? 'bg-slate-100 text-slate-300' :
          isCompleted ? 'bg-emerald-500 text-white' :
          isInProgress ? 'bg-indigo-600 text-white animate-pulse' :
          'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
        }`}>
          {isLocked ? <Lock size={18} /> : 
           (lesson.lesson_type || lesson.type)?.toLowerCase() === 'video' ? <PlayCircle size={18} /> :
           (lesson.lesson_type || lesson.type)?.toLowerCase() === 'article' ? <BookOpen size={18} /> :
           (lesson.lesson_type || lesson.type)?.toLowerCase() === 'document' ? <FileText size={18} /> :
           <PenTool size={18} />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h5 className={`font-bold text-sm truncate ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
              Class {lIdx + 1}: {lesson.title}
            </h5>
            {isCompleted && <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-emerald-100">Completed</span>}
            {isInProgress && <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-indigo-100">In Progress</span>}
            {lesson.batches && lesson.batches.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {lesson.batches.map((bid: string) => {
                  const b = availableBatches.find((x: any) => x.id === bid);
                  if (!b) return null;
                  return (
                    <span key={bid} className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-blue-100">
                      {b.type}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              {(lesson.lesson_type || lesson.type || 'Class')?.toUpperCase()} {lesson.duration ? `• ${lesson.duration}m` : ''}
              {schedule && (
                <span className="ml-2 text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1.5">
                  <Calendar size={10} /> 
                  <span className="whitespace-nowrap">
                    {new Date(schedule.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {schedule.start_time ? ` • ${formatTime(schedule.start_time)}` : ''}
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 sm:mt-0 ml-14 sm:ml-0">
        {isLocked ? (
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
             <Lock size={12} /> Locked
          </div>
        ) : (
            <button 
              onClick={() => openLesson(lesson)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md cursor-pointer ${
                isCompleted ? 'bg-slate-900 text-white hover:bg-black shadow-slate-100' :
                isInProgress ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' :
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

