"use client";

import { X, Video, ExternalLink, FileText, BookOpen, Clock } from "lucide-react";
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

  const isCompleted = userProgress.includes(lesson.id);

  return (
    <div className={`fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center animate-in fade-in duration-300 ${isFullScreen ? 'p-0' : 'p-4'}`} role="dialog" aria-modal="true">
      <div className={`bg-white shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col transition-all duration-500 ease-in-out ${
        isFullScreen 
          ? 'w-full h-full rounded-none' 
          : 'w-full max-w-5xl rounded-[3rem] max-h-[95vh]'
      }`}>
        <div className={`px-8 py-6 flex items-center justify-between bg-white ${isFullScreen ? 'rounded-none' : 'rounded-t-[3rem]'}`}>
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{lesson.title}</h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">{(lesson.lesson_type || lesson.type)} • {lesson.duration || '0'} Mins</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              aria-label="Close lesson viewer"
              className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-900"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto bg-white scrollbar-hide ${isFullScreen ? 'p-6 md:p-16' : 'p-8'}`}>
          <div className="max-w-4xl mx-auto">
             {(lesson.lesson_type || lesson.type) === 'video' ? (
               <div className="w-full bg-black rounded-xl overflow-hidden shadow-sm aspect-video mb-10">
                  {lesson.content_url ? (
                    <iframe 
                      src={
                        lesson.content_url?.includes('youtu.be') 
                          ? `https://www.youtube.com/embed/${lesson.content_url.split('/').pop()}` 
                          : lesson.content_url?.includes('vimeo.com')
                            ? `https://player.vimeo.com/video/${lesson.content_url.split('/').pop()}`
                            : lesson.content_url?.replace('watch?v=', 'embed/')
                      } 
                      className="w-full h-full" 
                      allowFullScreen 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900 gap-4">
                      <Video size={48} className="opacity-20" />
                      <p className="text-sm font-medium">Video content not available</p>
                    </div>
                  )}
               </div>
             ) : (
               <div className="mb-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-10">
                     <h2 className="text-3xl font-bold text-slate-900">{lesson.title}</h2>
                     {lesson.content_url?.startsWith('http') && (
                       <a 
                         href={lesson.content_url} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="px-6 py-2.5 bg-[#2196F3] text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-600 transition-all shadow-sm shrink-0"
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
                     ) : lesson.type?.toLowerCase().includes('offline') ? (
                       <div>
                         <p className="text-blue-600 font-bold mb-4">Offline Class Details:</p>
                         <p>{lesson.content_url}</p>
                       </div>
                     ) : (
                       <>
                         {lesson.content_url?.startsWith('http') ? (
                           <div className="space-y-4">
                             <p>Use the button above to view the associated material.</p>
                             <p className="text-slate-400 italic text-sm break-all">Source: {lesson.content_url}</p>
                           </div>
                         ) : (
                           <p className="whitespace-pre-wrap">{lesson.content_url}</p>
                         )}
                       </>
                     )}
                  </article>
               </div>
             )}

             {/* Resources Section */}
             <div className="mt-16 pt-10 border-t border-slate-100 space-y-10">
                {/* Homework Section (Tests) */}
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
                      <h3 className="text-2xl font-bold text-slate-900">Homework</h3>
                      <p className="text-sm text-slate-500 font-medium">Complete these tests to master this lesson:</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {initialTests
                        .filter(t => t.title.toLowerCase().includes(lesson.title.toLowerCase()))
                        .map(test => (
                          <Link 
                            key={test.id}
                            href={`/test/${test.id}`}
                            className="group flex items-center justify-between p-6 bg-slate-50 hover:bg-rose-50 rounded-2xl transition-all border border-slate-100 hover:border-rose-100"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm group-hover:scale-110 transition-transform">
                                <FileText size={24} />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{test.title}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{test.duration_minutes} Mins • {test.type || 'Daily Test'}</p>
                              </div>
                            </div>
                            <div className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-sm group-hover:bg-rose-500 group-hover:text-white transition-all">
                              Start Homework
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}

                {/* Study Material Section (Notes) */}
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
                      <h3 className="text-2xl font-bold text-slate-900">Study Materials</h3>
                      <p className="text-sm text-slate-500 font-medium">Handy resources and notes for your reference:</p>
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
                            className="group flex flex-col p-6 bg-white rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all"
                          >
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                              <BookOpen size={20} />
                            </div>
                            <h4 className="font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{material.title}</h4>
                            <div className="mt-auto flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{material.type} • {material.file_size || material.duration || 'Article'}</span>
                              <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500" />
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => {
                      toggleCompletion(lesson.id, isCompleted);
                      onClose();
                    }}
                    className={`px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-sm active:scale-95 ${
                      isCompleted 
                        ? 'bg-slate-100 text-slate-600' 
                        : 'bg-[#00A86B] text-white hover:bg-emerald-600 shadow-emerald-100'
                    }`}
                  >
                    {isCompleted ? "Mark as Incomplete" : "Mark as Complete »"}
                  </button>
                  
                  <button 
                    onClick={onClose}
                    className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-all"
                  >
                    Skip for now
                  </button>
                </div>

                <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100/50 mt-10">
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Note</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
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
