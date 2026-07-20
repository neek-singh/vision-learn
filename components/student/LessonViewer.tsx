"use client";

import { useState, useRef, useEffect } from "react";
import { X, Video, ExternalLink, FileText, BookOpen, Clock, Tv, CheckCircle2, HelpCircle, XCircle, Award, RotateCcw, Upload, Loader2, FileUp, Check } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

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
  studentId: string;
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
  now,
  studentId
}: LessonViewerProps) {
  
  const [theaterMode, setTheaterMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const [submission, setSubmission] = useState<any>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subUrl, setSubUrl] = useState("");

  useEffect(() => {
    setSelectedAnswers({});
  }, [lesson?.id]);

  // Prevent background scrolling on mount and restore on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Live Active Time Tracker: tracks active seconds while student is viewing the lesson
  useEffect(() => {
    if (!lesson?.id) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const todayStr = new Date().toISOString().split('T')[0];
        const key = `vision_active_seconds_${studentId || 'default'}`;
        const currentTotal = parseInt(localStorage.getItem(key) || '0', 10);
        const newTotal = currentTotal + 1;
        localStorage.setItem(key, String(newTotal));

        const dailyKey = `vision_daily_active_${studentId || 'default'}`;
        let dailyMap: Record<string, number> = {};
        try {
          dailyMap = JSON.parse(localStorage.getItem(dailyKey) || '{}');
        } catch (e) {
          dailyMap = {};
        }
        dailyMap[todayStr] = (dailyMap[todayStr] || 0) + 1;
        localStorage.setItem(dailyKey, JSON.stringify(dailyMap));

        window.dispatchEvent(new CustomEvent("vision_active_time_tick", {
          detail: { totalSeconds: newTotal, todaySeconds: dailyMap[todayStr] }
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lesson?.id, studentId]);

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

  useEffect(() => {
    setSelectedAnswers({});
    setSubUrl("");
    setSubmission(null);
  }, [lesson?.id]);

  // Fetch existing submission for the lesson
  useEffect(() => {
    if (!studentId || !lesson?.id) return;
    const fetchSubmission = async () => {
      setLoadingSubmission(true);
      try {
        const { data, error } = await supabase
          .from("submissions")
          .select("*")
          .eq("student_id", studentId)
          .eq("lesson_id", lesson.id)
          .maybeSingle();
        if (data) {
          setSubmission(data);
          setSubUrl(data.content_url || "");
        }
      } catch (err) {
        console.error("Error fetching submission:", err);
      } finally {
        setLoadingSubmission(false);
      }
    };
    fetchSubmission();
  }, [lesson?.id, studentId]);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subUrl.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("submissions")
        .upsert([{
          lesson_id: lesson.id,
          student_id: studentId,
          content_url: subUrl.trim(),
          status: 'submitted'
        }], { onConflict: 'lesson_id,student_id' })
        .select()
        .single();
      if (error) throw error;
      setSubmission(data || {
        lesson_id: lesson.id,
        student_id: studentId,
        content_url: subUrl.trim(),
        status: 'submitted',
        submitted_at: new Date().toISOString()
      });
      // Auto complete the lesson
      if (!isCompleted) {
        toggleCompletion(lesson.id, false);
      }
      alert("Solution submitted successfully!");
    } catch (err) {
      console.error("Error submitting solution:", err);
      alert("Failed to submit solution");
    } finally {
      setSubmitting(false);
    }
  };

  const submitQuizResult = async () => {
    if (submitting) return;
    setSubmitting(true);
    const correctCount = questions.filter(q => selectedAnswers[q.id] === q.correctIndex).length;
    const scoreStr = `${correctCount}/${questions.length}`;
    try {
      const { data, error } = await supabase
        .from("submissions")
        .upsert([{
          lesson_id: lesson.id,
          student_id: studentId,
          content_url: `Completed Quiz: Score ${scoreStr}`,
          status: 'submitted',
          score: scoreStr
        }], { onConflict: 'lesson_id,student_id' })
        .select()
        .single();
      if (error) throw error;
      setSubmission(data || {
        lesson_id: lesson.id,
        student_id: studentId,
        content_url: `Completed Quiz: Score ${scoreStr}`,
        score: scoreStr,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      });
      // Auto complete the lesson
      if (!isCompleted) {
        toggleCompletion(lesson.id, false);
      }
      alert("Quiz score submitted successfully!");
    } catch (err) {
      console.error("Error submitting quiz:", err);
      alert("Failed to submit quiz score");
    } finally {
      setSubmitting(false);
    }
  };

  // Extract MCQ questions
  const getQuestions = (): MCQQuestion[] => {
    const content = lesson.notes_content || "";
    const match = content.match(/<!-- MCQ_QUESTIONS_JSON:(.*?) -->/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error("Error parsing MCQ questions in viewer:", e);
      }
    }
    return [];
  };

  const questions = getQuestions();
  const lessonType = (lesson.lesson_type || lesson.type || 'video').toLowerCase();

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
      <div className={`bg-white shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col relative transition-all duration-500 ease-in-out overflow-hidden ${
        isFullScreen 
          ? 'w-full h-full rounded-none' 
          : 'w-full max-w-5xl rounded-[3rem] max-h-[95vh]'
      }`}>
        
        {/* Sticky Top Scroll Progress Indicator */}
        <div 
          className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-150 absolute top-0 left-0 z-50"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className={`px-8 py-6 flex items-center justify-between bg-white border-b border-slate-50 shrink-0 ${isFullScreen ? 'rounded-none' : 'rounded-t-[3rem]'}`}>
          <div className="flex flex-col">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{lesson.title}</h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{lessonType === 'mcq' ? 'Interactive Quiz' : (lesson.lesson_type || lesson.type)} • {lesson.duration || '0'} Mins</p>
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
          className={`flex-1 overflow-y-auto bg-white scrollbar-hide relative min-h-0 ${isFullScreen ? 'p-6 md:p-16' : 'p-8'}`}
        >
          <div className="max-w-4xl mx-auto">
             {lessonType === 'video' ? (
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
             ) : lessonType === 'mcq' ? (
                <div className="space-y-8 mb-10 animate-in fade-in duration-300">
                  {submission ? (
                    <div className="p-8 bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-3xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 animate-in zoom-in-95 duration-500">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-500/20 text-indigo-300 rounded-2xl flex items-center justify-center shadow-inner">
                          <Award size={32} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black tracking-tight">Quiz Completed & Submitted!</h4>
                          <p className="text-xs text-indigo-200 mt-1 font-semibold">
                            Your submitted score is {submission.score || 'recorded'}.
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">
                            Submitted on {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end">
                        {submission.score && submission.score.includes('/') && (
                          <div className="text-right">
                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block">Accuracy</span>
                            <p className="text-3xl font-black text-white">
                              {(() => {
                                const parts = submission.score.split('/');
                                const correct = parseInt(parts[0]);
                                const total = parseInt(parts[1]);
                                return total > 0 ? Math.round((correct / total) * 100) : 0;
                              })()}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Quiz Introduction Banner */}
                      <div className="p-8 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-3xl border border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 bg-white text-indigo-600 rounded-2xl shadow-sm border border-indigo-50">
                            <HelpCircle size={28} className="animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">Practice Quiz</h4>
                            <p className="text-xs font-semibold text-slate-550 mt-1">
                              Test your understanding. Select the best answer for each question.
                            </p>
                          </div>
                        </div>
                        {questions.length > 0 && (
                          <div className="px-5 py-2.5 bg-white border border-indigo-100 rounded-2xl text-xs font-black uppercase tracking-widest text-indigo-600 shadow-sm self-stretch sm:self-auto flex items-center justify-center">
                            {Object.keys(selectedAnswers).length} of {questions.length} Answered
                          </div>
                        )}
                      </div>

                      {/* Questions List */}
                      <div className="space-y-6">
                        {questions.length === 0 ? (
                          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                            <HelpCircle size={32} className="mx-auto text-slate-350 mb-3" />
                            <p className="text-sm font-semibold text-slate-500">No questions found for this quiz.</p>
                          </div>
                        ) : (
                          <>
                            {questions.map((q, idx) => {
                              const answerSelected = selectedAnswers[q.id] !== undefined;
                              const userAns = selectedAnswers[q.id];

                              return (
                                <div 
                                  key={q.id}
                                  className={`p-6 md:p-8 bg-white border rounded-3xl flex flex-col gap-6 shadow-sm transition-all duration-300 ${
                                    answerSelected 
                                      ? userAns === q.correctIndex
                                        ? 'border-emerald-200 shadow-emerald-500/5 bg-emerald-50/10'
                                        : 'border-rose-200 shadow-rose-500/5 bg-rose-50/10'
                                      : 'border-slate-100 hover:border-indigo-200 hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-4">
                                    <p className="text-base font-extrabold text-slate-900 leading-snug">
                                      <span className="text-indigo-600 font-black mr-2">Q{idx + 1}.</span> 
                                      {q.question}
                                    </p>
                                    {answerSelected && (
                                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                                        userAns === q.correctIndex 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                          : 'bg-rose-50 text-rose-700 border-rose-200'
                                      }`}>
                                        {userAns === q.correctIndex ? 'Correct' : 'Incorrect'}
                                      </span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 gap-3">
                                    {q.options.map((opt, optIdx) => {
                                      const letter = ['A', 'B', 'C', 'D'][optIdx];
                                      const isCorrect = optIdx === q.correctIndex;
                                      const isSelected = userAns === optIdx;

                                      let optStyle = "bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-slate-700 hover:text-slate-900";
                                      let Icon = null;

                                      if (answerSelected) {
                                        if (isCorrect) {
                                          optStyle = "bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-sm";
                                          Icon = <CheckCircle2 size={16} className="text-white shrink-0" />;
                                        } else if (isSelected) {
                                          optStyle = "bg-rose-600 text-white border-rose-600 font-extrabold shadow-sm";
                                          Icon = <XCircle size={16} className="text-white shrink-0" />;
                                        } else {
                                          optStyle = "bg-slate-50/40 border-slate-100 text-slate-400 opacity-60";
                                        }
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          disabled={answerSelected}
                                          onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                          className={`px-5 py-4 border rounded-2xl text-sm font-semibold flex items-center justify-between transition-all gap-4 text-left ${optStyle} ${!answerSelected ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-sm' : ''}`}
                                        >
                                          <div className="flex items-center gap-4">
                                            <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-black ${
                                              answerSelected && (isCorrect || isSelected)
                                                ? 'bg-white/20 text-white'
                                                : 'bg-white text-slate-650 border border-slate-200 shadow-sm'
                                            }`}>
                                              {letter}
                                            </span>
                                            <span>{opt}</span>
                                          </div>
                                          {Icon}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {answerSelected && (
                                    <div className={`p-5 rounded-2xl border text-xs leading-relaxed animate-in fade-in duration-300 ${
                                      userAns === q.correctIndex 
                                        ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
                                        : 'bg-rose-50/50 border-rose-100 text-rose-800'
                                    }`}>
                                      <p className="font-extrabold text-sm mb-1.5">
                                        {userAns === q.correctIndex 
                                          ? "🎉 Correct Answer!" 
                                          : `❌ Incorrect. The correct option is ${['A', 'B', 'C', 'D'][q.correctIndex]}.`
                                        }
                                      </p>
                                      {q.explanation && (
                                        <p className="mt-2 font-medium"><span className="font-black uppercase tracking-wider text-[10px]">Explanation:</span> {q.explanation}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Score Summary Block */}
                            {Object.keys(selectedAnswers).length === questions.length && (
                              <div className="p-8 bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-3xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 animate-in zoom-in-95 duration-500">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-indigo-500/20 text-indigo-300 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Award size={32} />
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-black tracking-tight">Quiz Completed!</h4>
                                    <p className="text-xs text-indigo-200 mt-1 font-semibold">
                                      You scored {questions.filter(q => selectedAnswers[q.id] === q.correctIndex).length} out of {questions.length} questions.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end">
                                  <div className="text-right">
                                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block">Accuracy</span>
                                    <p className="text-3xl font-black text-white">
                                      {Math.round((questions.filter(q => selectedAnswers[q.id] === q.correctIndex).length / questions.length) * 100)}%
                                    </p>
                                  </div>
                                  {!submission && (
                                    <button
                                      onClick={submitQuizResult}
                                      disabled={submitting}
                                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-md border border-indigo-500 disabled:opacity-50"
                                    >
                                      {submitting ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                      Submit Score
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
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

                {/* Submission Form Card for Assignment & Project */}
                {(lessonType === 'assignment' || lessonType === 'project') && (
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4 my-8">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                      <FileUp size={16} className="text-indigo-600" />
                      Submission Panel
                    </h4>
                    
                    {loadingSubmission ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                        <Loader2 className="animate-spin" size={14} /> Loading submission status...
                      </div>
                    ) : submission ? (
                      <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100/80 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100/50 w-fit">
                          <CheckCircle2 size={14} /> Submitted Successfully!
                        </div>
                        <div className="text-xs font-bold text-slate-600 space-y-2 pt-2">
                          <p>
                            <span className="font-black uppercase tracking-wider text-[10px] text-slate-400 mr-2">Link:</span>
                            <a href={submission.content_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                              {submission.content_url}
                            </a>
                          </p>
                          <p>
                            <span className="font-black uppercase tracking-wider text-[10px] text-slate-400 mr-2">Date:</span>
                            {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                          {submission.score && (
                            <p>
                              <span className="font-black uppercase tracking-wider text-[10px] text-slate-400 mr-2">Grade:</span>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-black">{submission.score}</span>
                            </p>
                          )}
                          {submission.feedback && (
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-slate-700 italic mt-2">
                              <span className="font-black uppercase tracking-wider text-[9px] text-amber-800 block not-italic mb-1">Feedback:</span>
                              "{submission.feedback}"
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleUrlSubmit} className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100/80 shadow-sm">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            Solution URL / Link (Google Drive, GitHub, Loom, etc.)
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              required
                              type="url"
                              value={subUrl}
                              onChange={(e) => setSubUrl(e.target.value)}
                              placeholder="https://github.com/... or Google Drive URL"
                              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white text-sm font-semibold text-slate-800"
                            />
                            <button
                              type="submit"
                              disabled={submitting}
                              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                            >
                              {submitting ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : (
                                <Upload size={12} />
                              )}
                              Submit Solution
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {!isCompleted && (
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        toggleCompletion(lesson.id, isCompleted);
                        onClose();
                      }}
                      className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
                    >
                      Mark as Complete
                    </button>
                    
                    <button 
                      onClick={onClose}
                      className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
                    >
                      Skip for now
                    </button>
                  </div>
                )}

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
