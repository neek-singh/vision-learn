"use client";

import { useState, useRef, useEffect } from "react";
import { X, Video, ExternalLink, FileText, BookOpen, Clock, Tv, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface LessonViewerProps {
  lesson: any;
  isFullScreen: boolean;
  onClose: () => void;
  userProgress: string[];
  toggleCompletion: (id: string, status: boolean) => void;
  initialTests: any[];
  initialMaterials: any[];
  currentSchedules: any[];
  now: Date;
}

export default function LessonViewer({ 
  lesson, 
  isFullScreen, 
  onClose, 
  userProgress, 
  toggleCompletion,
  initialTests,
  initialMaterials,
  currentSchedules,
  now
}: LessonViewerProps) {
  
  const [theaterMode, setTheaterMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const totalScroll = scrollHeight - clientHeight;
      if (totalScroll > 0) {
        setScrollProgress((scrollTop / totalScroll) * 100);
      } else {
        setScrollProgress(0);
      }
    }
  };

  const isCompleted = userProgress.includes(lesson.id);

  // Add Copy buttons to code blocks
  useEffect(() => {
    const timer = setTimeout(() => {
      const preBlocks = document.querySelectorAll('.rich-content pre');
      preBlocks.forEach((el) => {
        const pre = el as HTMLElement;
        if (pre.querySelector('.copy-button')) return;
        
        pre.style.position = 'relative';
        const button = document.createElement('button');
        button.innerHTML = 'Copy';
        button.className = 'copy-button absolute top-3 right-3 px-3 py-1 bg-slate-800 text-slate-400 hover:text-white rounded text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100';
        
        pre.classList.add('group');
        
        button.onclick = () => {
          const codeElement = pre.querySelector('code') as HTMLElement;
          const code = codeElement?.innerText || pre.innerText;
          navigator.clipboard.writeText(code);
          button.innerHTML = 'Copied!';
          setTimeout(() => button.innerHTML = 'Copy', 2000);
        };
        
        pre.appendChild(button);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [lesson.notes_content]);

  return (
    <div className={`fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center animate-in fade-in duration-300 ${isFullScreen ? 'p-0' : 'p-4'}`} role="dialog" aria-modal="true">
      <div className={`bg-white shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col relative transition-all duration-500 ease-in-out ${
        isFullScreen 
          ? 'w-full h-full rounded-none' 
          : 'w-full max-w-5xl rounded-[3rem] max-h-[95vh]'
      }`}>
        
        {/* Sticky Top Scroll Progress Indicator */}
        <div 
          className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-150 absolute top-0 left-0 z-50"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className={`px-8 py-6 flex items-center justify-between bg-white border-b border-slate-50 ${isFullScreen ? 'rounded-none' : 'rounded-t-[3rem]'}`}>
          <div className="flex flex-col">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{lesson.title}</h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{(lesson.lesson_type || lesson.type)} • {lesson.duration || '0'} Mins</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              aria-label="Close lesson viewer"
              className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto bg-white scrollbar-hide relative ${isFullScreen ? 'p-6 md:p-16' : 'p-8'}`}
        >
          <div className="max-w-4xl mx-auto">
             {(lesson.lesson_type || lesson.type) === 'video' ? (
               <div className="space-y-4 mb-10">
                 <div className="flex justify-end">
                   <button 
                     onClick={() => setTheaterMode(!theaterMode)}
                     className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                       theaterMode 
                         ? 'bg-indigo-600 text-white shadow-md' 
                         : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                     }`}
                   >
                     <Tv size={14} /> {theaterMode ? 'Default View' : 'Theater Mode'}
                   </button>
                 </div>
                 
                 <div className={`w-full bg-black rounded-2xl overflow-hidden shadow-xl transition-all duration-500 ${
                   theaterMode 
                     ? 'aspect-video md:max-w-none max-w-full ring-4 ring-indigo-950/20' 
                     : 'aspect-video max-w-3xl mx-auto'
                 }`}>
                    {lesson.content_url ? (
                      <iframe 
                        src={
                          lesson.content_url?.includes('youtu.be') 
                            ? `https://www.youtube.com/embed/${lesson.content_url.split('/').pop()}` 
                            : lesson.content_url?.includes('vimeo.com')
                              ? `https://player.vimeo.com/video/${lesson.content_url.split('/').pop()}`
                              : lesson.content_url?.replace('watch?v=', 'embed/')
                        } 
                        className="w-full h-full border-0" 
                        allowFullScreen 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900 gap-4">
                        <Video size={48} className="opacity-20" />
                        <p className="text-sm font-medium">Video content not available</p>
                      </div>
                    )}
                 </div>
               </div>
             ) : (
               <div className="mb-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-10">
                     {lesson.content_url?.startsWith('http') && (
                       <a 
                         href={lesson.content_url} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md shrink-0 cursor-pointer"
                       >
                          Start Material <ExternalLink size={14} />
                       </a>
                     )}
                  </div>
                  <article className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-base">
                     {lesson.notes_content ? (
                       <div 
                         dangerouslySetInnerHTML={{ __html: lesson.notes_content }} 
                         className="rich-content"
                       />
                     ) : (lesson.lesson_type || lesson.type)?.toLowerCase().includes('offline') ? (
                       <div>
                          <p className="text-indigo-600 font-bold mb-4">Offline Class Details:</p>
                          <p className="font-semibold text-slate-700">{lesson.content_url}</p>
                       </div>
                     ) : (
                       <>
                          {lesson.content_url?.startsWith('http') ? (
                            <div className="space-y-4">
                              <p className="font-semibold">Use the button above to view the associated material.</p>
                              <p className="text-slate-400 italic text-xs break-all">Source: {lesson.content_url}</p>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap font-medium">{lesson.content_url}</p>
                          )}
                       </>
                     )}
                  </article>
               </div>
             )}

             <div className="mt-16 pt-10 border-t border-slate-100 space-y-10">
                {initialTests.filter(t => {
                   const hasTitle = t.title.toLowerCase().includes(lesson.title.toLowerCase());
                   if (!hasTitle) return false;
                   const sched = currentSchedules.find(s => s.type === 'test' && s.title.toLowerCase().includes(t.title.toLowerCase()));
                   if (!sched) return false;
                   const sDate = new Date(sched.date);
                   const [h, mins] = (sched.start_time || "00:00").split(':');
                   sDate.setHours(parseInt(h), parseInt(mins), 0);
                   return now >= sDate;
                 }).length > 0 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Homework Assignments</h3>
                      <p className="text-xs text-slate-500 font-medium">Complete these tests to validate and master your knowledge:</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {initialTests
                        .filter(t => t.title.toLowerCase().includes(lesson.title.toLowerCase()))
                        .map(test => (
                          <Link 
                            key={test.id}
                            href={`/test/${test.id}`}
                            className="group flex items-center justify-between p-5 bg-gradient-to-br from-slate-50 to-white hover:from-rose-50/40 hover:to-rose-50/10 rounded-2xl transition-all border border-slate-100 hover:border-rose-100/50 hover:shadow-lg hover:shadow-rose-500/5 hover:-translate-y-0.5"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm group-hover:scale-110 transition-transform">
                                <FileText size={24} />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors text-sm">{test.title}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{test.duration_minutes} Mins • {test.type || 'Daily Test'}</p>
                              </div>
                            </div>
                            <div className="px-4 py-2 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm group-hover:bg-rose-500 group-hover:text-white transition-all cursor-pointer border border-slate-100">
                              Start Homework
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}

                {initialMaterials.filter(m => {
                   const hasTitle = m.title.toLowerCase().includes(lesson.title.toLowerCase());
                   if (!hasTitle) return false;
                   const sched = currentSchedules.find(s => s.type === 'assignment' && s.title.toLowerCase().includes(m.title.toLowerCase()));
                   if (!sched) return false;
                   const sDate = new Date(sched.date);
                   const [h, mins] = (sched.start_time || "00:00").split(':');
                   sDate.setHours(parseInt(h), parseInt(mins), 0);
                   return now >= sDate;
                 }).length > 0 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Study Materials</h3>
                      <p className="text-xs text-slate-500 font-medium">Handy references, notes, and study guides for this class:</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {initialMaterials
                        .filter(m => m.title.toLowerCase().includes(lesson.title.toLowerCase()))
                        .map(material => (
                          <a 
                            key={material.id}
                            href={material.content_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col p-5 bg-gradient-to-br from-slate-50 to-white hover:from-blue-50/40 hover:to-blue-50/10 rounded-2xl border border-slate-100 hover:border-blue-100/50 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all"
                          >
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                              <BookOpen size={20} />
                            </div>
                            <h4 className="font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors text-sm">{material.title}</h4>
                            <div className="mt-auto flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{material.type} • {material.file_size || material.duration || 'Article'}</span>
                              <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500" />
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      toggleCompletion(lesson.id, isCompleted);
                      onClose();
                    }}
                    className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer ${
                      isCompleted 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 shadow-slate-100/50' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                    }`}
                  >
                    {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                  </button>
                  
                  <button 
                    onClick={onClose}
                    className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
                  >
                    Skip for now
                  </button>
                </div>

                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100/50 mt-10">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-amber-600" /> Tips for Success
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    This is a learning journey. You can study and review materials multiple times to master the concepts.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
