"use client";

import { useState } from "react";
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  PlayCircle, 
  FileText, 
  PenTool, 
  CheckCircle2,
  Lock
} from "lucide-react";

const modules = [
  {
    id: 1,
    title: "Module 1: HTML Basics",
    progress: 100,
    lessons: [
      { id: 1, title: "Introduction to HTML", type: "video", completed: true },
      { id: 2, title: "HTML Tags & Elements", type: "notes", completed: true },
      { id: 3, title: "Creating your first page", type: "assignment", completed: true },
    ]
  },
  {
    id: 2,
    title: "Module 2: CSS Styling",
    progress: 60,
    lessons: [
      { id: 4, title: "CSS Selectors", type: "video", completed: true },
      { id: 5, title: "The Box Model", type: "notes", completed: true },
      { id: 6, title: "Layouts with Flexbox", type: "video", completed: false },
      { id: 7, title: "Styling Forms", type: "assignment", completed: false },
    ]
  },
  {
    id: 3,
    title: "Module 3: Advanced JavaScript",
    progress: 0,
    locked: true,
    lessons: [
      { id: 8, title: "Promises & Async/Await", type: "video", completed: false },
      { id: 9, title: "ES6 Classes", type: "notes", completed: false },
      { id: 10, title: "API Fetching", type: "video", completed: false },
    ]
  },
];

export default function CurriculumPage() {
  const [expandedModules, setExpandedModules] = useState<number[]>([1, 2]);

  const toggleModule = (id: number) => {
    if (expandedModules.includes(id)) {
      setExpandedModules(expandedModules.filter(m => m !== id));
    } else {
      setExpandedModules([...expandedModules, id]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Course Curriculum</h1>
        <p className="text-sm text-slate-500 font-medium">Follow your structured learning path to mastery.</p>
      </section>

      <div className="max-w-4xl space-y-3">
        {modules.map((module) => (
          <div key={module.id} className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 ${module.locked ? 'opacity-70' : ''}`}>
            {/* Module Header */}
            <button 
              onClick={() => !module.locked && toggleModule(module.id)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${module.locked ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white shadow-md shadow-indigo-100'}`}>
                  {module.locked ? <Lock size={18} /> : <BookOpen size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">{module.title}</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{module.lessons.length} Lessons</p>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${module.progress}%` }} />
                      </div>
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">{module.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
              {!module.locked && (
                <div className="p-1 text-slate-400">
                  {expandedModules.includes(module.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              )}
            </button>

            {/* Lessons List */}
            {expandedModules.includes(module.id) && !module.locked && (
              <div className="px-6 pb-6 space-y-1 animate-in slide-in-from-top-2 duration-300">
                <div className="w-full h-[1px] bg-slate-50 mb-4" />
                {module.lessons.map((lesson) => (
                  <div 
                    key={lesson.id} 
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        lesson.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {lesson.type === 'video' && <PlayCircle size={16} />}
                        {lesson.type === 'notes' && <FileText size={16} />}
                        {lesson.type === 'assignment' && <PenTool size={16} />}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${lesson.completed ? 'text-slate-500' : 'text-slate-900'}`}>
                          {lesson.title}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                          {lesson.type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {lesson.completed ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          Start
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
