"use client";

import { useState, useEffect } from "react";
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

export default function TestsClient({ initialTests, studentId }: { initialTests: any[], studentId: string }) {
  const [activeTest, setActiveTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {initialTests.map((test) => (
        <div key={test.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
          </div>

          <div className="space-y-0.5 mb-6">
            <h3 className="text-lg font-black text-slate-900 line-clamp-1">{test.title}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{test.courses?.title}</p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock size={12} className="text-amber-400" />
              <span className="text-[10px] font-bold">{test.duration_minutes}m</span>
            </div>
          </div>

          <button 
            onClick={() => handleStartTest(test)}
            className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-100"
          >
            <Play size={14} fill="currentColor" />
            Start Test
          </button>
        </div>
      ))}
    </div>
  );
}
