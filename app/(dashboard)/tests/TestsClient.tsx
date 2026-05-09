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
  initialResults 
}: { 
  initialTests: any[], 
  schedules: any[],
  activeBatch: string,
  studentId: string, 
  initialResults: any[] 
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

  const now = new Date();

  // 1. Filter by Schedule
  const scheduledTitles = useMemo(() => {
    const nowTime = now.getTime();
    const scheduledTests = schedules.filter(s => {
      const sBatch = s.batch?.trim().toLowerCase();
      const batchMatch = !sBatch || sBatch === "all batches" || sBatch.includes(activeBatch) || activeBatch.includes(sBatch);
      if (!batchMatch) return false;

      const timeStr = s.start_time?.includes(':') ? s.start_time : '00:00:00';
      const sDate = new Date(`${s.date}T${timeStr}`).getTime();
      return nowTime >= sDate;
    });
    return scheduledTests.map(s => s.title.toLowerCase());
  }, [schedules, activeBatch, now]);

  // 2. Apply Schedule Filter to initialTests
  const currentlyAvailableTests = useMemo(() => {
    return initialTests.filter((t) => {
      // First check if it's scheduled
      const isScheduled = scheduledTitles.some((st: string) => {
        const normalize = (txt: string) => {
          return txt.toLowerCase()
            .replace(/^(test|note|assignment|class|lecture|event):/i, '')
            .trim();
        };
        const cleanST = normalize(st);
        const cleanTT = normalize(t.title);
        return cleanST.includes(cleanTT) || cleanTT.includes(cleanST);
      });
      if (!isScheduled) return false;

      // Batch check from test column (as fallback)
      if (!t.batch || t.batch === "All Batches") return true;
      const tBatch = t.batch.trim().toLowerCase();
      return tBatch.includes(activeBatch) || activeBatch.includes(tBatch);
    });
  }, [initialTests, scheduledTitles, activeBatch]);

  const coursesList = useMemo(() => 
    Array.from(new Set(currentlyAvailableTests.map((t: any) => t.courses?.title))).filter(Boolean),
    [currentlyAvailableTests]
  );
  
  const filteredTests = useMemo(() => 
    selectedCourse === "all" 
      ? currentlyAvailableTests 
      : currentlyAvailableTests.filter((t: any) => t.courses?.title === selectedCourse),
    [selectedCourse, currentlyAvailableTests]
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
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Online tests for your enrolled courses will be available here soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test: any) => (
            <TestCard 
              key={test.id} 
              test={test} 
              result={results.find((r: any) => r.test_id === test.id)}
              onStart={handleStartTest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Memoized Test Card for better performance
const TestCard = memo(({ test, result, onStart }: { test: any, result: any, onStart: (t: any) => void }) => (
  <div key={test.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 group">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
        <FileText size={20} />
      </div>
      {result && (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <CheckCircle2 size={12} />
          Completed
        </span>
      )}
    </div>

    <div className="space-y-0.5 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
          test.type === 'monthly' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
          test.type === 'weekly' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
          'bg-emerald-50 text-emerald-700 border-emerald-100'
        }`}>
          {test.type || 'daily'}
        </span>
      </div>
      <h3 className="text-lg font-black text-slate-900 line-clamp-1">{test.title}</h3>
      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{test.courses?.title}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {new Date(test.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2 text-slate-500">
        <Clock size={12} className="text-amber-400" />
        <span className="text-[10px] font-bold">{test.duration_minutes}m</span>
      </div>
      {result && (
        <div className="flex items-center gap-2 text-emerald-600">
          <Trophy size={12} />
          <span className="text-[10px] font-black">Score: {result.score}/{result.total_questions}</span>
        </div>
      )}
    </div>

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
  </div>
));
