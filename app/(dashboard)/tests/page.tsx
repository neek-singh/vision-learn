"use client";

import { useState } from "react";
import { 
  FileText, 
  Clock, 
  HelpCircle, 
  Play, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Trophy,
  AlertCircle
} from "lucide-react";

export default function TestsPage() {
  const [activeTest, setActiveTest] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const tests = [
    { id: 1, title: "HTML Basics Test", course: "Web Design", questions: 20, duration: "30 mins", status: "Not Attempted" },
    { id: 2, title: "CSS Flexbox Challenge", course: "Web Design", questions: 15, duration: "20 mins", status: "In Progress" },
    { id: 3, title: "JavaScript Logic Quiz", course: "Frontend Dev", questions: 25, duration: "45 mins", status: "Completed", score: "22/25" },
  ];

  const questions = [
    { id: 1, text: "Which tag is used for the largest heading in HTML?", options: ["<h6>", "<h1>", "<header>", "<head>"] },
    { id: 2, text: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Multi Language", "Hyper Transfer Main Logic", "Home Tool Markup Language"] },
    { id: 3, text: "Which element is used to create an unordered list?", options: ["<ol>", "<li>", "<ul>", "<list>"] },
  ];

  const handleStartTest = (test: any) => {
    setActiveTest(test);
    setTestCompleted(false);
    setCurrentQuestion(0);
    setAnswers({});
  };

  const handleAnswer = (optionIndex: number) => {
    setAnswers({ ...answers, [currentQuestion]: optionIndex });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setTestCompleted(true);
    }
  };

  if (activeTest) {
    if (testCompleted) {
      const score = Object.keys(answers).length;
      return (
        <div className="max-w-xl mx-auto py-8 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-100">
            <Trophy size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">Test Completed!</h2>
          <p className="text-sm text-slate-500 font-medium mb-6">You have successfully submitted the {activeTest.title}</p>
          
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Your Score</p>
                <p className="text-3xl font-black text-indigo-600">{score}/{questions.length}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Percentage</p>
                <p className="text-3xl font-black text-emerald-600">{Math.round((score/questions.length) * 100)}%</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-50">
              <span className="bg-emerald-50 text-emerald-700 font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest border border-emerald-100">
                Status: Passed
              </span>
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{activeTest.course}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Time Remaining</p>
              <p className="text-xs font-black text-red-500 leading-none mt-0.5">24:55</p>
            </div>
            <Clock className="text-red-400" size={20} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full ${idx === currentQuestion ? 'bg-indigo-600' : 'bg-slate-100'}`} 
                />
              ))}
            </div>
          </div>

          <h2 className="text-xl font-black text-slate-900 mb-8 leading-tight">
            {questions[currentQuestion].text}
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {questions[currentQuestion].options.map((option, idx) => (
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
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Online Tests</h1>
        <p className="text-sm text-slate-500 font-medium">Evaluate your progress and master your skills.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <div key={test.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                test.status === 'Completed' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : test.status === 'In Progress'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-slate-50 text-slate-400 border-slate-100'
              }`}>
                {test.status}
              </span>
            </div>

            <div className="space-y-0.5 mb-6">
              <h3 className="text-lg font-black text-slate-900 line-clamp-1">{test.title}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{test.course}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 text-slate-500">
                <HelpCircle size={12} className="text-indigo-400" />
                <span className="text-[10px] font-bold">{test.questions} Qs</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Clock size={12} className="text-amber-400" />
                <span className="text-[10px] font-bold">{test.duration}</span>
              </div>
            </div>

            {test.status === 'Completed' ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Your Score</p>
                  <p className="text-base font-black text-indigo-600 leading-none">{test.score}</p>
                </div>
                <button className="text-[10px] font-black text-indigo-600 hover:underline">View Details</button>
              </div>
            ) : (
              <button 
                onClick={() => handleStartTest(test)}
                className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-100"
              >
                <Play size={14} fill="currentColor" />
                {test.status === 'In Progress' ? 'Resume Test' : 'Start Test'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
