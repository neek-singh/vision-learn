"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Trophy,
  AlertCircle,
  Loader2,
  Check,
  Search,
  X,
  Target
} from "lucide-react";

export default function TestsClient({ 
  initialTests, 
  schedules,
  activeBatch,
  activeBatchId,
  studentId, 
  initialResults,
  quizLessons = [],
  quizSubmissions = []
}: { 
  initialTests: any[], 
  schedules: any[],
  activeBatch: string,
  activeBatchId: string | null,
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
  const [searchQuery, setSearchQuery] = useState("");
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

      // Filter by batches array (if populated)
      if (t.batches && t.batches.length > 0) {
        return activeBatchId && t.batches.includes(activeBatchId);
      }

      // Legacy string match
      if (!t.batch || t.batch === "All Batches" || t.batch.trim().toLowerCase() === "all") return true;
      const tBatch = t.batch.trim().toLowerCase();
      const cleanActive = activeBatch?.trim().toLowerCase();
      return tBatch === cleanActive;
    });
  }, [initialTests, scheduledTitles, activeBatch, activeBatchId]);

  // 3. Live quiz-type schedules -> match with curriculum lesson quizzes
  const liveQuizSchedules = useMemo(() => liveSchedules.filter(s => (s.type || "").toLowerCase() === "quiz"), [liveSchedules]);

  const scheduledQuizLessons = useMemo(() => {
    return quizLessons.filter(lesson => {
      if (lesson.batches && lesson.batches.length > 0) {
        if (!activeBatchId || !lesson.batches.includes(activeBatchId)) return false;
      }

      return liveQuizSchedules.some(s => {
        const sTitle = s.title || '';
        const parts = sTitle.split(':');
        const lessonPart = parts[parts.length - 1].trim();
        return normalize(lessonPart) === normalize(lesson.title);
      });
    }).map(lesson => {
      const matchedSchedule = liveQuizSchedules.find(s => {
        const sTitle = s.title || '';
        const parts = sTitle.split(':');
        const lessonPart = parts[parts.length - 1].trim();
        return normalize(lessonPart) === normalize(lesson.title);
      });
      return { 
        ...lesson, 
        source: "lesson" as const,
        created_at: matchedSchedule?.date || lesson.created_at
      };
    });
  }, [quizLessons, liveQuizSchedules, activeBatchId]);

  // Merge and sort ascending by date
  const allAvailableTests = useMemo(() => {
    const list = [
      ...currentlyAvailableTests.map(t => ({ ...t, source: "test" as const })),
      ...scheduledQuizLessons
    ];
    return list.sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
  }, [currentlyAvailableTests, scheduledQuizLessons]);

  // Summary Metrics
  const stats = useMemo(() => {
    let completed = 0;
    let totalScorePct = 0;
    let scoredCount = 0;

    allAvailableTests.forEach((t: any) => {
      const isLesson = t.source === "lesson";
      const res = isLesson
        ? quizSubmissions.find((s: any) => s.lesson_id === t.id)
        : results.find((r: any) => r.test_id === t.id);

      if (res) {
        completed++;
        if (typeof res.score === 'number' && res.total_questions) {
          totalScorePct += (res.score / res.total_questions) * 100;
          scoredCount++;
        } else if (typeof res.score === 'string' && res.score.includes('/')) {
          const parts = res.score.split('/');
          const sc = parseFloat(parts[0]);
          const tot = parseFloat(parts[1]);
          if (!isNaN(sc) && !isNaN(tot) && tot > 0) {
            totalScorePct += (sc / tot) * 100;
            scoredCount++;
          }
        }
      }
    });

    const avgScore = scoredCount > 0 ? Math.round(totalScorePct / scoredCount) : 0;
    return {
      total: allAvailableTests.length,
      completed,
      avgScore
    };
  }, [allAvailableTests, quizSubmissions, results]);

  const coursesList = useMemo(() => 
    Array.from(new Set(allAvailableTests.map((t: any) => t.courses?.title || "My Course"))).filter(Boolean),
    [allAvailableTests]
  );
  
  const filteredTests = useMemo(() => {
    let list = allAvailableTests;
    if (selectedCourse !== "all") {
      list = list.filter((t: any) => (t.courses?.title || "My Course") === selectedCourse);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t: any) => {
        const titleMatch = (t.title || "").toLowerCase().includes(q);
        const courseMatch = (t.courses?.title || "").toLowerCase().includes(q);
        return titleMatch || courseMatch;
      });
    }
    return list;
  }, [selectedCourse, searchQuery, allAvailableTests]);

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

    try {
      await supabase.from("test_results").upsert({
        test_id: activeTest.id,
        student_id: studentId,
        score: correctCount,
        total_questions: questions.length
      });
      
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

  const handleCardClick = (test: any) => {
    const isLesson = test.source === "lesson";
    if (isLesson) {
      window.location.href = `/curriculum?lessonId=${test.id}`;
    } else {
      handleStartTest(test);
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs animate-pulse">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading Tests...</p>
      </div>
    );
  }

  if (activeTest) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-slate-600 font-bold text-xs">Loading questions...</p>
        </div>
      );
    }

    if (testCompleted) {
      return (
        <div className="max-w-md mx-auto py-6 text-center animate-in zoom-in-95 duration-300">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-100">
            <Trophy size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Test Completed!</h2>
          <p className="text-xs text-slate-500 font-medium mb-5">{activeTest.title}</p>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs mb-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Your Score</p>
                <p className="text-2xl font-black text-indigo-600">{score}/{questions.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Percentage</p>
                <p className="text-2xl font-black text-emerald-600">
                  {questions.length > 0 ? Math.round((score/questions.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setActiveTest(null)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-2xs"
          >
            Back to All Tests
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto space-y-4 animate-in slide-in-from-right-4 duration-300">
        <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="min-w-0 flex-1 mr-3">
            <h3 className="text-sm font-bold text-slate-900 truncate leading-snug">{activeTest.title}</h3>
            <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{activeTest.courses?.title}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 bg-red-50 text-red-600 px-2 py-1 rounded-lg border border-red-100/60">
            <Clock size={13} />
            <span className="text-xs font-bold">{activeTest.duration_minutes}m</span>
          </div>
        </div>

        {questions.length > 0 ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-900 mb-5 leading-snug">
              {questions[currentQuestion].question_text}
            </h2>

            <div className="grid grid-cols-1 gap-2">
              {questions[currentQuestion].options.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left font-medium text-xs ${
                    answers[currentQuestion] === idx 
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs font-semibold" 
                      : "border-slate-200/80 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    answers[currentQuestion] === idx ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1">{option}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-5 pt-4 border-t border-slate-100">
              <button 
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-0 transition-all"
              >
                <ArrowLeft size={14} /> Previous
              </button>
              <button 
                onClick={handleNext}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <span>{currentQuestion === questions.length - 1 ? "Submit Test" : "Next"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <AlertCircle className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-slate-600 font-bold text-xs">No questions found for this test.</p>
            <button onClick={() => setActiveTest(null)} className="mt-3 text-indigo-600 font-bold text-xs underline">Go Back</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 3-Column Compact Stat Bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/60 flex items-center justify-center shrink-0">
            <Target size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Total</p>
            <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Completed</p>
            <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight mt-0.5">{stats.completed}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100/60 flex items-center justify-center shrink-0">
            <Trophy size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Avg Score</p>
            <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight mt-0.5">
              {stats.avgScore > 0 ? `${stats.avgScore}%` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Course Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tests and quizzes..."
            className="w-full pl-8.5 pr-8 py-2 text-xs bg-white rounded-xl border border-slate-200/80 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {coursesList.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            <button
              onClick={() => setSelectedCourse("all")}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                selectedCourse === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70"
              }`}
            >
              All Courses
            </button>
            {coursesList.map((course: string) => (
              <button
                key={course}
                onClick={() => setSelectedCourse(course)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedCourse === course
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70"
                }`}
              >
                {course}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tests Timeline List */}
      {filteredTests.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
          <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-2.5 border border-slate-100">
            <Trophy size={20} />
          </div>
          <p className="text-xs font-bold text-slate-700">No tests available</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {searchQuery ? "Try searching with different keywords" : "Online tests and quizzes will appear here once scheduled."}
          </p>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSelectedCourse("all"); }}
              className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-7 sm:pl-8 space-y-1.5 sm:space-y-2 pt-1">
          {/* Vertical connecting rail line */}
          <div className="absolute left-2.5 sm:left-3 top-3 bottom-4 w-[2px] bg-slate-200/80 rounded-full" />

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
                const isToday = testDate.toDateString() === new Date().toDateString();
                const dateLabel = testDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                });
                dateSeparator = (
                  <div className="mb-1 mt-3 first:mt-0 -ml-7 sm:-ml-8 pl-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      isToday 
                        ? 'bg-amber-500 text-white border-amber-600' 
                        : 'bg-slate-100 text-slate-600 border-slate-200/80'
                    }`}>
                      {isToday ? 'Today' : dateLabel}
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
                  displayScore = "Done";
                }
              }

              return (
                <div key={test.id} className="relative">
                  {dateSeparator}
                  
                  <div className="relative flex items-center">
                    {/* Timeline dot */}
                    <div className={`absolute -left-7 sm:-left-8 w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 shadow-2xs transition-all ${
                      result 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}>
                      {result ? (
                        <Check size={10} strokeWidth={3} className="text-white" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      )}
                    </div>

                    {/* Timeline Card */}
                    <div 
                      onClick={() => handleCardClick(test)}
                      className="w-full min-w-0 bg-white rounded-xl border border-slate-200/75 hover:border-indigo-300 hover:shadow-2xs active:scale-[0.99] transition-all p-2.5 sm:p-3 flex items-center justify-between gap-2.5 cursor-pointer group"
                    >
                      {/* Index Number */}
                      <span className="text-[11px] font-bold text-slate-400 w-4 shrink-0 text-center select-none">
                        {testCounter}
                      </span>

                      {/* Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 truncate leading-snug group-hover:text-indigo-600 transition-colors">
                            {test.title}
                          </h3>
                          {result && (
                            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/70 shrink-0">
                              <Check size={8} strokeWidth={3} />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-medium leading-none">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border leading-none ${
                            isLesson
                              ? 'bg-purple-50 text-purple-700 border-purple-200/60'
                              : 'bg-blue-50 text-blue-700 border-blue-200/60'
                          }`}>
                            {isLesson ? 'Quiz' : 'Test'}
                          </span>

                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-0.5 text-slate-500">
                            <Clock size={9} /> {timeLabel}
                          </span>

                          {result && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="font-bold text-emerald-600">
                                Score: {displayScore}
                              </span>
                            </>
                          )}

                          {test.courses?.title && (
                            <>
                              <span className="text-slate-300 hidden sm:inline">•</span>
                              <span className="hidden sm:inline truncate max-w-[130px] text-slate-500">
                                {test.courses.title}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Straight Vertical Aligned Button */}
                      <div 
                        className="w-[58px] sm:w-[64px] shrink-0 flex justify-end items-center" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isLesson ? (
                          <a
                            href={`/curriculum?lessonId=${test.id}`}
                            className={`h-7 w-full rounded-lg text-[11px] font-bold flex items-center justify-center active:scale-95 transition-all shadow-2xs ${
                              result 
                                ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            {result ? 'Review' : 'Start'}
                          </a>
                        ) : (
                          <button 
                            onClick={() => handleStartTest(test)}
                            className={`h-7 w-full rounded-lg text-[11px] font-bold flex items-center justify-center active:scale-95 transition-all shadow-2xs ${
                              result 
                                ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
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
