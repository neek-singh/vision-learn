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
  Calendar
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import { CacheManager } from "@/lib/cache-manager";
import { useCachedCurriculum } from "@/hooks/use-cached-curriculum";
import { DownloadButton } from "@/components/DownloadButton";
import { useSearchParams } from "next/navigation";

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
  initialCourseId = null
}: { 
  initialModules: any[], 
  initialProgress: string[], 
  studentId: string,
  initialSchedules?: any[],
  initialTests?: any[],
  initialMaterials?: any[],
  initialBatch?: string | null,
  initialCourseId?: string | null
}) {
  const [courseId] = useState<string | null>(initialCourseId || initialModules[0]?.course_id || null);
  
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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentSchedules, setCurrentSchedules] = useState<any[]>(initialSchedules);
  const [activeBatch] = useState<string | null>(initialBatch);
  const [now, setNow] = useState(new Date());

  const searchParams = useSearchParams();
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

  // Auto-open lesson if lessonId is in URL
  useEffect(() => {
    if (lessonIdParam && allLessons.length > 0 && !activeLesson) {
      const lessonToOpen = allLessons.find(l => l.id === lessonIdParam);
      if (lessonToOpen) {
        setActiveLesson(lessonToOpen);
        setIsFullScreen(true);
      }
    }
  }, [lessonIdParam, allLessons, activeLesson]);

  const resumeLesson = useMemo(() => {
    return allLessons.find(l => !userProgress.includes(l.id));
  }, [allLessons, userProgress]);

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
      // Revert if totally failed? No, CacheManager handles offline.
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
                {userProgress.length} / {allLessons.length} Lessons
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

      {/* Resume Learning Section */}
      {resumeLesson && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-indigo-100 animate-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
              <Play size={20} fill="white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-0.5">Resume Learning</p>
              <h4 className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{resumeLesson.title}</h4>
            </div>
          </div>
          <button 
            onClick={() => openLesson(resumeLesson)}
            className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-xs hover:bg-indigo-50 transition-all active:scale-95 shadow-lg"
          >
            Continue Learning
          </button>
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-4">
        {displayModules.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
               <BookOpen size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">My Classes Empty</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">No lessons have been published for this course yet. Check back later!</p>
          </div>
        ) : displayModules.sort((a: any, b: any) => a.order_index - b.order_index).map((module: any, mIdx: number) => (
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
          />
        ))}
      </div>

      {/* Lesson Viewer Modal */}
      {activeLesson && (
        <LessonViewer 
          lesson={activeLesson}
          isFullScreen={isFullScreen}
          onClose={() => { setActiveLesson(null); setIsFullScreen(false); }}
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
  openLesson 
}: any) {
  const lessons = useMemo(() => 
    (module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index),
    [module.lessons]
  );

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-500 ${
      isExpanded ? 'border-indigo-100 shadow-xl shadow-indigo-50/50' : 'border-slate-100 shadow-sm hover:border-slate-200'
    }`}>
      <button 
        onClick={() => toggleModule(module.id)}
        className="w-full px-6 py-5 flex items-center justify-between text-left group"
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
                <BookOpen size={12} /> {lessons.length} Lessons
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

      <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[2000px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
        <div className="mx-8 h-[1px] bg-slate-50 mb-6" />
        <div className="px-8 space-y-3">
          {lessons.map((lesson: any) => (
            <LessonItem 
              key={lesson.id}
              lesson={lesson}
              moduleTitle={module.title}
              userProgress={userProgress}
              currentSchedules={currentSchedules}
              now={now}
              formatTime={formatTime}
              isUpdating={isUpdating}
              toggleLessonCompletion={toggleLessonCompletion}
              openLesson={openLesson}
            />
          ))}
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
  openLesson 
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

  const isLocked = isScheduled && !isTimeReached;
  const isInProgress = !isCompleted && !isLocked;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all group ${
      isLocked ? 'opacity-60 bg-slate-50/50 border-transparent cursor-not-allowed' :
      isCompleted ? 'bg-emerald-50/30 border-emerald-100/50' :
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
          <div className="flex items-center gap-2 mb-0.5">
            <h5 className={`font-bold text-sm truncate ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
              {lesson.title}
            </h5>
            {isCompleted && <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-emerald-100">Completed</span>}
            {isInProgress && <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-indigo-100">In Progress</span>}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              {(lesson.lesson_type || lesson.type || 'Lesson')?.toUpperCase()} {lesson.duration ? `• ${lesson.duration}m` : ''}
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
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md ${
                isCompleted ? 'bg-slate-900 text-white hover:bg-black' :
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
