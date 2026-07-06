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
  Loader2
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

  // 1. Filter live schedules for this batch
  const liveSchedules = useMemo(() => {
    const nowTime = now.getTime();
    return schedules.filter(s => {
      const sBatch = s.batch?.trim().toLowerCase();
      const batchMatch = !sBatch || sBatch === "all batches" || sBatch.includes(activeBatch) || activeBatch.includes(sBatch);
      if (!batchMatch) return false;
      const timeStr = s.start_time?.includes(':') ? s.start_time : '00:00:00';
      const sDate = new Date(`${s.date}T${timeStr}`).getTime();
      return nowTime >= sDate;
    });
  }, [schedules, activeBatch, now]);

  const scheduledTitles = useMemo(() => liveSchedules.map(s => s.title.toLowerCase()), [liveSchedules]);

  // 2. Apply Schedule Filter to initialTests
  const currentlyAvailableTests = useMemo(() => {
    return initialTests.filter((t) => {
      const isScheduled = scheduledTitles.some((st: string) => {
        const cleanST = normalize(st.replace(/^(test|note|assignment|class|lecture|event):/i, ""));
        const cleanTT = normalize(t.title);
        return cleanST.includes(cleanTT) || cleanTT.includes(cleanST);
      });
      if (!isScheduled) return false;
      if (!t.batch || t.batch === "All Batches") return true;
      const tBatch = t.batch.trim().toLowerCase();
      return tBatch.includes(activeBatch) || activeBatch.includes(tBatch);
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
    ).map(lesson => ({ ...lesson, source: "lesson" as const }));
  }, [quizLessons, liveQuizSchedules]);

  // Merge: traditional tests + scheduled curriculum quizzes
  const allAvailableTests = useMemo(() => [
    ...currentlyAvailableTests.map(t => ({ ...t, source: "test" as const })),
    ...scheduledQuizLessons
  ], [currentlyAvailableTests, scheduledQuizLessons]);

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
      {/* Course Filter */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setSelectedCourse("all")}
          aria-label="Filter by all courses"
          aria-selected={selectedCourse === "all"}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border active:scale-95 ${
            selectedCourse === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
          }`}
        >
          All Courses
        </button>
        {coursesList.map((courseName: any) => (
          <button 
            key={courseName}
            onClick={() => setSelectedCourse(courseName)}
            aria-label={`Filter by ${courseName}`}
            aria-selected={selectedCourse === courseName}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border active:scale-95 ${
              selectedCourse === courseName ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
            }`}
          >
            {courseName}
          </button>
        ))}
      </div>

      {filteredTests.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
            <Trophy size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Tests Coming Soon</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Online tests and quizzes will appear here once they are scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test: any) => (
            <TestCard 
              key={test.id} 
              test={test} 
              result={test.source === "lesson"
                ? quizSubmissions.find((s: any) => s.lesson_id === test.id)
                : results.find((r: any) => r.test_id === test.id)}
              onStart={test.source === "lesson" ? () => {} : handleStartTest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Memoized Test Card for better performance
const TestCard = memo(({ test, result, onStart }: { test: any, result: any, onStart: (t: any) => void }) => {
  const isLesson = test.source === "lesson";

  // Cleanly format the score, preventing double slash issues like "5/5/--"
  const displayScore = useMemo(() => {
    if (!result) return null;
    const rawScore = result.score || (result.content_url?.match(/Score (.+)/)?.[1]);
    if (!rawScore) return "—";
    if (typeof rawScore === 'string' && rawScore.includes('/')) {
      return rawScore;
    }
    return `${rawScore}/${result.total_questions || "—"}`;
  }, [result]);

  return (
  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${isLesson ? "bg-purple-50 text-purple-600" : "bg-indigo-50 text-indigo-600"}`}>
        <FileText size={20} />
      </div>
      {result ? (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <CheckCircle2 size={12} />
          Completed
        </span>
      ) : isLesson ? (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100">
          Quiz
        </span>
      ) : null}
    </div>

    <div className="space-y-0.5 mb-6">
      <div className="flex items-center gap-2 mb-2">
        {!isLesson && (
          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
            test.type === 'monthly' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
            test.type === 'weekly' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
            'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}>
            {test.type || 'daily'}
          </span>
        )}
        {isLesson && (
          <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border bg-purple-50 text-purple-700 border-purple-100">
            Curriculum Quiz
          </span>
        )}
      </div>
      <h3 className="text-lg font-black text-slate-900 line-clamp-1">{test.title}</h3>
      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{test.courses?.title || "My Course"}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {new Date(test.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-4 mb-6">
      {!isLesson && (
        <div className="flex items-center gap-2 text-slate-500">
          <Clock size={12} className="text-amber-400" />
          <span className="text-[10px] font-bold">{test.duration_minutes}m</span>
        </div>
      )}
      {result && (
        <div className="flex items-center gap-2 text-emerald-600">
          <Trophy size={12} className="shrink-0" />
          <span className="text-[10px] font-black">
            Score: {displayScore}
          </span>
        </div>
      )}
    </div>

    {isLesson ? (
      <a
        href={`/curriculum?lessonId=${test.id}`}
        className="w-full py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100"
      >
        {result ? <><CheckCircle2 size={14} /> Open Quiz</> : <><Play size={14} fill="currentColor" /> Start Quiz</>}
      </a>
    ) : (
      <button 
        onClick={() => onStart(test)}
        aria-label={result ? `Retake test: ${test.title}` : `Start test: ${test.title}`}
        className={`w-full py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 ${
          result
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
            : "bg-slate-900 hover:bg-indigo-600 text-white shadow-slate-100"
        }`}
      >
        {result ? (
          <><CheckCircle2 size={14} /> Retake Test</>
        ) : (
          <><Play size={14} fill="currentColor" /> Start Test</>
        )}
      </button>
    )}
  </div>
  );
});
TestCard.displayName = "TestCard";
