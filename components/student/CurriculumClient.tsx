"use client";

import { useState } from "react";
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  PlayCircle, 
  FileText, 
  PenTool, 
  Loader2,
  Check
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
  const [modules, setModules] = useState<any[]>(initialModules);
  const [expandedModules, setExpandedModules] = useState<string[]>(
    initialModules.length > 0 ? [initialModules[0].id] : []
  );
  const [userProgress, setUserProgress] = useState<string[]>(initialProgress);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  async function toggleLessonCompletion(lessonId: string, currentStatus: boolean) {
    setIsUpdating(lessonId);
    try {
      if (!currentStatus) {
        // Mark as completed
        const { error } = await supabase
          .from("user_progress")
          .upsert({ 
            user_id: studentId, 
            lesson_id: lessonId, 
            completed: true,
            last_watched_at: new Date().toISOString()
          }, { onConflict: 'user_id,lesson_id' });

        if (!error) {
          setUserProgress([...userProgress, lessonId]);
        }
      } else {
        // Mark as incomplete
        const { error } = await supabase
          .from("user_progress")
          .delete()
          .eq("user_id", studentId)
          .eq("lesson_id", lessonId);

        if (!error) {
          setUserProgress(userProgress.filter(id => id !== lessonId));
        }
      }
    } catch (err) {
      console.error("Error updating progress:", err);
    } finally {
      setIsUpdating(null);
    }
  }

  const toggleModule = (id: string) => {
    if (expandedModules.includes(id)) {
      setExpandedModules(expandedModules.filter(m => m !== id));
    } else {
      setExpandedModules([...expandedModules, id]);
    }
  };

  const calculateProgress = (moduleLessons: any[]) => {
    if (!moduleLessons || moduleLessons.length === 0) return 0;
    const completedCount = moduleLessons.filter(l => userProgress.includes(l.id)).length;
    return Math.round((completedCount / moduleLessons.length) * 100);
  };

  return (
    <div className="max-w-4xl space-y-3">
      {modules.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
             <BookOpen size={32} />
          </div>
          <p className="text-slate-500 font-medium">No curriculum content available for this course yet.</p>
        </div>
      ) : modules.map((module) => {
        const progress = calculateProgress(module.lessons);
        const isExpanded = expandedModules.includes(module.id);

        return (
          <div key={module.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
            {/* Module Header */}
            <button 
              onClick={() => toggleModule(module.id)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-md shadow-indigo-100">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">{module.title}</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{module.lessons?.length || 0} Lessons</p>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">{progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-1 text-slate-400">
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {/* Lessons List */}
            {isExpanded && (
              <div className="px-6 pb-6 space-y-1 animate-in slide-in-from-top-2 duration-300">
                <div className="w-full h-[1px] bg-slate-50 mb-4" />
                {(module.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index).map((lesson: any) => {
                  const isCompleted = userProgress.includes(lesson.id);
                  return (
                    <div 
                      key={lesson.id} 
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {lesson.type === 'video' && <PlayCircle size={16} />}
                          {lesson.type === 'document' && <FileText size={16} />}
                          {lesson.type === 'assignment' && <PenTool size={16} />}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isCompleted ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>
                            {lesson.title}
                          </p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            {lesson.type} {lesson.duration ? `• ${lesson.duration}m` : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {isUpdating === lesson.id ? (
                          <Loader2 size={16} className="animate-spin text-slate-300" />
                        ) : isCompleted ? (
                          <button 
                            onClick={() => toggleLessonCompletion(lesson.id, true)}
                            className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-100"
                          >
                            <Check size={16} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => toggleLessonCompletion(lesson.id, false)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-[9px] font-black text-slate-400 uppercase tracking-widest rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
