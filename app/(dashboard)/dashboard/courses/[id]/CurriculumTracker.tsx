"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

type Lesson = string | { id: string; title: string };

type Module = {
  module_title?: string;
  lessons?: Lesson[];
};

export default function CurriculumTracker({
  enrollmentId,
  curriculum,
  initialCompleted = [],
}: {
  enrollmentId: string;
  curriculum: any;
  initialCompleted: string[];
}) {
  const [completedLessons, setCompletedLessons] = useState<string[]>(initialCompleted);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Normalize curriculum to array of modules
  let modules: Module[] = [];
  if (Array.isArray(curriculum)) {
    if (curriculum.length > 0 && typeof curriculum[0] === 'string') {
      modules = [{ module_title: "General", lessons: curriculum }];
    } else {
      modules = curriculum;
    }
  }

  const toggleLesson = async (lessonId: string) => {
    setLoadingId(lessonId);
    const isCompleted = completedLessons.includes(lessonId);
    const newCompleted = isCompleted
      ? completedLessons.filter((id) => id !== lessonId)
      : [...completedLessons, lessonId];

    // Optimistic Update
    setCompletedLessons(newCompleted);

    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          lessonId,
          completed: !isCompleted,
        }),
      });

      if (!res.ok) {
        setCompletedLessons(completedLessons);
        alert("Failed to update progress. Please try again.");
      } else {
        // Optionally reload to update the server-side progress percentage
        window.location.reload();
      }
    } catch (error) {
      setCompletedLessons(completedLessons);
      alert("Network error occurred.");
    } finally {
      setLoadingId(null);
    }
  };

  if (!modules || modules.length === 0) {
    return <p className="text-slate-500 text-center py-8">No curriculum available for this course.</p>;
  }

  return (
    <div className="space-y-8">
      {modules.map((mod, modIdx) => {
        const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
        const modTitle = mod.module_title || `Module ${modIdx + 1}`;

        return (
          <div key={modIdx} className="border border-slate-800/50 bg-slate-900/20 rounded-2xl overflow-hidden">
            <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-800/50">
              <h3 className="font-semibold text-slate-300">{modTitle}</h3>
            </div>
            
            <div className="divide-y divide-slate-800/30">
              {lessons.map((lesson, lessonIdx) => {
                const lessonId = typeof lesson === 'string' ? lesson : lesson.id || `${modIdx}-${lessonIdx}`;
                const lessonTitle = typeof lesson === 'string' ? lesson : lesson.title || `Lesson ${lessonIdx + 1}`;
                const isDone = completedLessons.includes(lessonId);
                const isLoading = loadingId === lessonId;

                return (
                  <div 
                    key={lessonIdx}
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.01] transition-colors"
                  >
                    <span className={`text-sm ${isDone ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                      {lessonTitle}
                    </span>

                    <button
                      onClick={() => toggleLesson(lessonId)}
                      disabled={isLoading}
                      className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      ) : isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
