"use client";

import { useState, useMemo } from "react";
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  PlayCircle, 
  FileText, 
  PenTool, 
  Loader2,
  Check,
  Lock,
  Play,
  Zap,
  Award,
  Bookmark,
  MessageSquare,
  Trophy,
  X,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export function CurriculumClient({ 
  initialModules, 
  initialProgress, 
  studentId 
}: { 
  initialModules: any[], 
  initialProgress: string[], 
  studentId: string 
}) {
  const [expandedModules, setExpandedModules] = useState<string[]>(
    initialModules.length > 0 ? [initialModules[0].id] : []
  );
  const [userProgress, setUserProgress] = useState<string[]>(initialProgress);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);

  // Flatten all lessons across all modules to handle locking and sequence
  const allLessons = useMemo(() => {
    return initialModules
      .sort((a, b) => a.order_index - b.order_index)
      .flatMap(m => (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index));
  }, [initialModules]);

  // Calculate overall course progress
  const totalProgress = useMemo(() => {
    if (allLessons.length === 0) return 0;
    return Math.round((userProgress.length / allLessons.length) * 100);
  }, [allLessons, userProgress]);

  // Find the current lesson to resume (first not completed)
  const resumeLesson = useMemo(() => {
    return allLessons.find(l => !userProgress.includes(l.id));
  }, [allLessons, userProgress]);

  async function toggleLessonCompletion(lessonId: string, currentStatus: boolean) {
    setIsUpdating(lessonId);
    try {
      if (!currentStatus) {
        const { error } = await supabase
          .from("user_progress")
          .upsert({ 
            user_id: studentId, 
            lesson_id: lessonId, 
            completed: true,
            last_watched_at: new Date().toISOString()
          }, { onConflict: 'user_id,lesson_id' });

        if (!error) {
          setUserProgress(prev => [...prev, lessonId]);
        }
      } else {
        const { error } = await supabase
          .from("user_progress")
          .delete()
          .eq("user_id", studentId)
          .eq("lesson_id", lessonId);

        if (!error) {
          setUserProgress(prev => prev.filter(id => id !== lessonId));
        }
      }
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
            {/* Animated shimmer effect */}
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
        {initialModules.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
               <BookOpen size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">My Classes Empty</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">No lessons have been published for this course yet. Check back later!</p>
          </div>
        ) : initialModules.sort((a, b) => a.order_index - b.order_index).map((module, mIdx) => {
          const progress = calculateModuleProgress(module.lessons);
          const isExpanded = expandedModules.includes(module.id);
          const lessons = (module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index);

          return (
            <div key={module.id} className={`bg-white rounded-2xl border transition-all duration-500 ${
              isExpanded ? 'border-indigo-100 shadow-xl shadow-indigo-50/50' : 'border-slate-100 shadow-sm hover:border-slate-200'
            }`}>
              {/* Module Header */}
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

              {/* Lessons List */}
              <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[2000px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
                <div className="mx-8 h-[1px] bg-slate-50 mb-6" />
                <div className="px-8 space-y-3">
                  {lessons.map((lesson: any, lIdx: number) => {
                    const isCompleted = userProgress.includes(lesson.id);
                    
                    // Logic for locking:
                    const globalIdx = allLessons.findIndex(al => al.id === lesson.id);
                    const isLocked = globalIdx > 0 && !userProgress.includes(allLessons[globalIdx - 1].id);
                    const isInProgress = !isCompleted && !isLocked && (globalIdx === 0 || userProgress.includes(allLessons[globalIdx - 1].id));

                    return (
                      <div 
                        key={lesson.id} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all group ${
                          isLocked ? 'opacity-60 bg-slate-50/50 border-transparent cursor-not-allowed' :
                          isCompleted ? 'bg-emerald-50/30 border-emerald-100/50' :
                          isInProgress ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-50/30 ring-1 ring-indigo-50' :
                          'bg-white border-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                            isLocked ? 'bg-slate-100 text-slate-300' :
                            isCompleted ? 'bg-emerald-500 text-white' :
                            isInProgress ? 'bg-indigo-600 text-white animate-pulse' :
                            'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                          }`}>
                            {isLocked ? <Lock size={18} /> : 
                             isCompleted ? <Check size={18} /> :
                             lesson.type === 'video' ? <PlayCircle size={18} /> :
                             lesson.type === 'document' ? <FileText size={18} /> :
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
                                {lesson.type} {lesson.duration ? `• ${lesson.duration}m` : ''}
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
                            <>
                              {isUpdating === lesson.id ? (
                                <Loader2 className="animate-spin text-slate-300" size={18} />
                              ) : (
                                <button 
                                  onClick={() => toggleLessonCompletion(lesson.id, isCompleted)}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                                    isCompleted ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white'
                                  }`}
                                  title={isCompleted ? "Mark as Uncomplete" : "Mark as Complete"}
                                >
                                  <Check size={18} />
                                </button>
                              )}
                              
                              <button 
                                onClick={() => openLesson(lesson)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md ${
                                  isCompleted ? 'bg-slate-900 text-white hover:bg-black' :
                                  isInProgress ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' :
                                  'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {isCompleted ? 'Review' : isInProgress ? 'Resume' : 'Start'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Real Quiz Logic could go here later, for now removing the placeholder as requested */}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lesson Viewer Modal */}
      {activeLesson && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-5xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    {activeLesson.type === 'video' ? <PlayCircle size={24} /> : <FileText size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{activeLesson.title}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeLesson.type} • {activeLesson.duration || '0'} Mins</p>
                  </div>
                </div>
                <button onClick={() => setActiveLesson(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 p-8 scrollbar-hide">
                <div className="max-w-4xl mx-auto h-full">
                   {activeLesson.type === 'video' ? (
                     <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                        <iframe 
                          src={activeLesson.content_url?.replace('watch?v=', 'embed/')} 
                          className="w-full h-full" 
                          allowFullScreen 
                        />
                     </div>
                   ) : (
                     <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-200 min-h-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                           <h2 className="text-3xl font-black text-slate-900">{activeLesson.title}</h2>
                           {activeLesson.content_url?.startsWith('http') && (
                             <a 
                               href={activeLesson.content_url} 
                               target="_blank" 
                               className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 shrink-0"
                             >
                                Open in New Tab <ExternalLink size={14} />
                             </a>
                           )}
                        </div>
                        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-lg font-medium whitespace-pre-wrap">
                           {activeLesson.type?.toLowerCase().includes('offline') ? (
                             <div>
                               <p className="text-indigo-600 font-bold mb-4">Offline Class Details:</p>
                               <p>{activeLesson.content_url}</p>
                             </div>
                           ) : (
                             <>
                               {activeLesson.content_url?.startsWith('http') ? (
                                 <>
                                   <p>Please use the button above to view the complete document or material associated with this lesson.</p>
                                   <p className="mt-4 text-slate-400 italic break-all">Link: {activeLesson.content_url}</p>
                                 </>
                               ) : (
                                 <p>{activeLesson.content_url}</p>
                               )}
                             </>
                           )}
                        </div>
                     </div>
                   )}
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
                 <button 
                   onClick={() => setActiveLesson(null)}
                   className="px-8 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                 >
                   Back to My Classes
                 </button>
                 <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400">Finished this lesson?</span>
                    <button 
                      onClick={() => {
                        toggleLessonCompletion(activeLesson.id, userProgress.includes(activeLesson.id));
                        setActiveLesson(null);
                      }}
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-100"
                    >
                      {userProgress.includes(activeLesson.id) ? "Mark as Incomplete" : "Mark as Complete"}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
