"use client";

import React, { useState, useEffect, useMemo, memo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  FileText, 
  Clock, 
  Play, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Trophy,
  AlertCircle,
  Loader2,
  Check
} from "lucide-react";

export default function TestsClient({ 
  initialTests, 
  schedules,
  activeBatch,
  studentId, 
  initialResults,
  quizLessons = [],
  quizSubmissions = []
}: { 
  initialTests: any[], 
  schedules: any[],
  activeBatch: string,
  studentId: string, 
  initialResults: any[],
  quizLessons?: any[],
  quizSubmissions?: any[]
}) {
  const [activeTest, setActiveTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [results, setResults] = useState<any[]>(initialResults);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const now = useMemo(() => new Date(), []);

  const normalize = (txt: string) => txt.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  // 1. Filter live schedules for this batch (strictly)
  const liveSchedules = useMemo(() => {
    const nowTime = now.getTime();
    return schedules.filter(s => {
      const sBatch = s.batch?.trim().toLowerCase();
      const cleanActive = activeBatch?.trim().toLowerCase();
      const batchMatch = !sBatch || sBatch === "all batches" || sBatch === "all" || !cleanActive || sBatch === cleanActive;
      if (!batchMatch) return false;
      const timeStr = s.start_time?.includes(':') ? s.start_time : '00:00:00';
      const sDate = new Date(`${s.date}T${timeStr}`).getTime();
      return nowTime >= sDate;
    });
  }, [schedules, activeBatch, now]);

  const scheduledTitles = useMemo(() => liveSchedules.map(s => s.title.toLowerCase()), [liveSchedules]);

  // 2. Apply Schedule Filter to initialTests (strictly)
  const currentlyAvailableTests = useMemo(() => {
    return initialTests.filter((t) => {
      const isScheduled = scheduledTitles.some((st: string) => {
        const cleanST = normalize(st.replace(/^(test|note|assignment|class|lecture|event):/i, ""));
        const cleanTT = normalize(t.title);
        return cleanST.includes(cleanTT) || cleanTT.includes(cleanST);
      });
      if (!isScheduled) return false;
      if (!t.batch || t.batch === "All Batches" || t.batch.trim().toLowerCase() === "all") return true;
      const tBatch = t.batch.trim().toLowerCase();
      const cleanActive = activeBatch?.trim().toLowerCase();
      return tBatch === cleanActive;
    });
  }, [initialTests, scheduledTitles, activeBatch]);

  // 3. Live quiz-type schedules → match with curriculum lesson quizzes
  const liveQuizSchedules = useMemo(() => liveSchedules.filter(s => (s.type || "").toLowerCase() === "quiz"), [liveSchedules]);

  const scheduledQuizLessons = useMemo(() => {
    return quizLessons.filter(lesson =>
      liveQuizSchedules.some(s =>
        normalize(s.title).includes(normalize(lesson.title)) ||
        normalize(lesson.title).includes(normalize(s.title))
      )
    ).map(lesson => {
      const matchedSchedule = liveQuizSchedules.find(s =>
        normalize(s.title).includes(normalize(lesson.title)) ||
        normalize(lesson.title).includes(normalize(s.title))
      );
      return { 
        ...lesson, 
        source: "lesson" as const,
        created_at: matchedSchedule?.date || lesson.created_at
      };
    });
  }, [quizLessons, liveQuizSchedules]);

  // Merge and sort ascending by date: traditional tests + scheduled curriculum quizzes
  const allAvailableTests = useMemo(() => {
    const list = [
      ...currentlyAvailableTests.map(t => ({ ...t, source: "test" as const })),
      ...scheduledQuizLessons
    ];
    return list.sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
  }, [currentlyAvailableTests, scheduledQuizLessons]);

  const coursesList = useMemo(() => 
    Array.from(new Set(allAvailableTests.map((t: any) => t.courses?.title || "My Course"))).filter(Boolean),
    [allAvailableTests]
  );
  
  const filteredTests = useMemo(() => 
    selectedCourse === "all" 
      ? allAvailableTests
      : allAvailableTests.filter((t: any) => (t.courses?.title || "My Course") === selectedCourse),
    [selectedCourse, allAvailableTests]
  );

  const fetchQuestions = async (testId: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from("test_questions")
      .select("*")
      .eq("test_id", testId)
      .order("order_index", { ascending: true });
    
    setQuestions(data || []);
    setIsLoading(false);
  };

  const handleStartTest = (test: any) => {
    setActiveTest(test);
    setTestCompleted(false);
    setCurrentQuestion(0);
    setAnswers({});
    fetchQuestions(test.id);
  };

  const handleAnswer = (optionIndex: number) => {
    setAnswers({ ...answers, [currentQuestion]: optionIndex });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeTest();
    }
  };

  const completeTest = async () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct_option_index) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setTestCompleted(true);

    // Save result
    try {
      await supabase.from("test_results").upsert({
        test_id: activeTest.id,
        student_id: studentId,
        score: correctCount,
        total_questions: questions.length
      });
      
      // Update local results state
      setResults((prev: any[]) => [
        ...prev.filter((r: any) => r.test_id !== activeTest.id),
        {
          test_id: activeTest.id,
          score: correctCount,
          total_questions: questions.length
        }
      ]);
    } catch (err) {
      console.error("Error saving test result:", err);
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Loading Tests...</p>
      </div>
    );
  }

  if (activeTest) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-slate-500 font-bold">Loading questions...</p>
        </div>
      );
    }

    if (testCompleted) {
      return (
        <div className="max-w-xl mx-auto py-8 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-100">
            <Trophy size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">Test Completed!</h2>
          <p className="text-sm text-slate-500 font-medium mb-6">You have successfully submitted {activeTest.title}</p>
          
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Your Score</p>
                <p className="text-3xl font-black text-indigo-600">{score}/{questions.length}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Percentage</p>
                <p className="text-3xl font-black text-emerald-600">
                  {questions.length > 0 ? Math.round((score/questions.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setActiveTest(null)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-all shadow-md"
          >
            Back to All Tests
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-500">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">{activeTest.title}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{activeTest.courses?.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="text-red-400" size={20} />
            <span className="text-sm font-black text-slate-900">{activeTest.duration_minutes}m</span>
          </div>
        </div>

        {questions.length > 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-8 leading-tight">
              {questions[currentQuestion].question_text}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {questions[currentQuestion].options.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left font-bold text-sm ${
                    answers[currentQuestion] === idx 
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                      : "border-slate-50 bg-slate-50 hover:border-slate-200 text-slate-600"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    answers[currentQuestion] === idx ? "bg-indigo-600 text-white" : "bg-white text-slate-400"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  {option}
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-slate-50">
              <button 
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all"
              >
                <ArrowLeft size={16} /> Previous
              </button>
              <button 
                onClick={handleNext}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-md"
              >
                {currentQuestion === questions.length - 1 ? "Submit Test" : "Next Question"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-100">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={40} />
            <p className="text-slate-500 font-bold">No questions found for this test.</p>
            <button onClick={() => setActiveTest(null)} className="mt-4 text-indigo-600 font-black text-xs uppercase underline">Go Back</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {filteredTests.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
            <Trophy size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Tests Coming Soon</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Online tests and quizzes will appear here once they are scheduled.</p>
        </div>
      ) : (
        <div className="relative pl-9 space-y-2">
          {/* Vertical connecting line */}
          <div className="absolute left-3 top-1 bottom-6 w-[2px] bg-orange-300 rounded-full" />

          {(() => {
            let lastDateStr = "";
            let testCounter = 0;

            return filteredTests.map((test: any) => {
              const isLesson = test.source === "lesson";
              const result = isLesson
                ? quizSubmissions.find((s: any) => s.lesson_id === test.id)
                : results.find((r: any) => r.test_id === test.id);

              const testDate = new Date(test.created_at || 0);
              const dateStr = testDate.toDateString();
              
              let dateSeparator: React.ReactNode = null;
              if (dateStr !== lastDateStr) {
                lastDateStr = dateStr;
                const dateLabel = testDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                });
                dateSeparator = (
                  <div className="mb-1.5 mt-4 first:mt-0">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-slate-50 text-slate-900 border-slate-200">
                      {dateLabel}
                    </span>
                  </div>
                );
              }

              testCounter++;

              const timeLabel = testDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });

              // Display Score calculation
              let displayScore = "—";
              if (result) {
                if (typeof result.score === 'string') {
                  displayScore = result.score.replace(/\/-$/, '');
                } else if (result.score !== undefined && result.score !== null) {
                  displayScore = `${result.score}/${result.total_questions || '?'}`;
                } else {
                  displayScore = "Completed";
                }
              }

              return (
                <div key={test.id}>
                  {dateSeparator}
                  <div className="relative flex items-center gap-3 mb-1">
                    {/* Timeline dot */}
                    <div className={`absolute -left-9 w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 ${
                      result 
                        ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white' 
                        : 'bg-white border border-slate-200 text-slate-400'
                    }`}>
                      {result ? (
                        <Check size={11} strokeWidth={3} className="text-white" />
                      ) : (
                        <FileText size={10} />
                      )}
                    </div>

                    {/* Timeline Card */}
                    <div className="flex-1 flex items-center justify-between p-4 bg-white rounded-2xl border border-orange-100/80 shadow-sm transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center gap-3">
                        {/* Index Counter */}
                        <span className="text-slate-400 font-bold text-xs select-none min-w-[12px]">
                          {testCounter}
                        </span>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-black text-slate-800 leading-tight">
                              {test.title}
                            </h3>
                            {result && (
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-50 text-orange-500 border border-orange-100">
                                <Check size={8} strokeWidth={4} />
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                              isLesson
                                ? 'bg-purple-50 text-purple-600 border-purple-100'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                              {isLesson ? 'Quiz' : 'Test'}
                            </span>
                            
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-orange-50 text-orange-600 border-orange-100 flex items-center gap-1">
                              <Clock size={9} /> {timeLabel}
                            </span>

                            {result && (
                              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-600 border-emerald-100">
                                Score: {displayScore}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isLesson ? (
                          <a
                            href={`/curriculum?lessonId=${test.id}`}
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            {result ? 'Review' : 'Start'}
                          </a>
                        ) : (
                          <button 
                            onClick={() => handleStartTest(test)}
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            {result ? 'Review' : 'Start'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
