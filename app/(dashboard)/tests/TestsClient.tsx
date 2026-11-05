"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getOfflineData, saveOfflineData, OFFLINE_KEYS } from "@/lib/offline-store";
import { supabase } from "@/lib/supabase";
import { notifyAdminOnTestComplete } from "@/app/actions/tests";
import { 
  Home, 
  ChevronRight, 
  ChevronDown,
  FileText, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Trophy,
  AlertCircle,
  Loader2,
  Search,
  X,
  Target,
  BarChart3,
  BarChart2,
  Calendar,
  Layers,
  Sparkles,
  CheckSquare,
  ShieldCheck,
  Check,
  XCircle,
  HelpCircle,
  Award,
  Play,
  RotateCcw,
  PenTool
} from "lucide-react";

export interface TestItem {
  id: string;
  title: string;
  module: string;
  description: string;
  type: string; // "MCQ", "Timed Test", "Mock Test", "Practice Quiz"
  category: "all" | "upcoming" | "completed" | "practice" | "mock";
  questionsCount: number;
  durationMinutes: number;
  totalMarks: number;
  status: "Completed" | "Pending" | "Not Attempted";
  scoreText: string;
  scoreValue: number | null;
  totalQuestions: number;
  dueText: string;
  dueDate?: string;
  iconColor: "blue" | "amber" | "purple" | "emerald" | "rose";
  action: "start_test" | "view_result";
  isDbItem?: boolean;
  isQuizLesson?: boolean;
  notes_content?: string;
  completedAt?: string;
}

/**
 * Extracts real MCQ questions from lesson notes_content
 */
function parseMcqQuestions(notesContent?: string): any[] {
  if (!notesContent) return [];

  // 1. Check if MCQ_QUESTIONS_JSON is serialized in HTML comment
  const match = notesContent.match(/<!--\s*MCQ_QUESTIONS_JSON:\s*(\[[\s\S]*?\])\s*-->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q: any, idx: number) => ({
          id: q.id || `q-${idx}`,
          question_text: q.question || q.question_text || `Question ${idx + 1}`,
          options: Array.isArray(q.options) ? q.options : [],
          correct_option_index: typeof q.correctIndex === "number" ? q.correctIndex : (q.correct_option_index || 0),
          explanation: q.explanation || ""
        }));
      }
    } catch {
      // fallback to html parsing
    }
  }

  // 2. Fallback parser for rendered HTML question cards
  const questions: any[] = [];
  const cardRegex = /<div[^>]*class="[^"]*mcq-question-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*mcq-question-card|$)/g;
  let cardMatch;
  while ((cardMatch = cardRegex.exec(notesContent)) !== null) {
    const cardHtml = cardMatch[1];
    const qTextMatch = cardHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const qText = qTextMatch ? qTextMatch[1].replace(/<[^>]+>/g, "").trim() : `Question ${questions.length + 1}`;
    
    const options: string[] = [];
    const optRegex = /<div[^>]*class="[^"]*mcq-option[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
    let optMatch;
    while ((optMatch = optRegex.exec(cardHtml)) !== null) {
      const optText = optMatch[1].replace(/<[^>]+>/g, "").trim().replace(/^[A-D]\s*/, "");
      if (optText) options.push(optText);
    }

    if (options.length > 0) {
      questions.push({
        id: `q-${questions.length}`,
        question_text: qText,
        options,
        correct_option_index: 0,
        explanation: ""
      });
    }
  }

  return questions;
}

export default function TestsClient({ 
  initialTests: propTests = [], 
  modules: propModules = [],
  schedules: propSchedules = [],
  activeBatch = "",
  activeBatchId = null,
  studentId = "", 
  initialResults: propResults = [],
  quizLessons: propQuizLessons = [],
  quizSubmissions: propQuizSubmissions = [],
  initialCompletedLessons: propCompletedLessons = [],
  courseTitle: propCourseTitle = "My Course"
}: { 
  initialTests: any[], 
  modules?: any[],
  schedules: any[],
  activeBatch?: string,
  activeBatchId?: string | null,
  studentId: string, 
  initialResults: any[],
  quizLessons?: any[],
  quizSubmissions?: any[],
  initialCompletedLessons?: string[],
  courseTitle?: string
}) {
  // Offline cache fallback if initialTests is empty
  const [cachedData] = useState(() => {
    if (!propTests || propTests.length === 0) {
      return getOfflineData<any>(OFFLINE_KEYS.TESTS);
    }
    return null;
  });

  const initialTests = (propTests && propTests.length > 0) ? propTests : (cachedData?.initialTests || []);
  const modules = (propModules && propModules.length > 0) ? propModules : (cachedData?.modules || []);
  const schedules = (propSchedules && propSchedules.length > 0) ? propSchedules : (cachedData?.schedules || []);
  const initialResults = (propResults && propResults.length > 0) ? propResults : (cachedData?.initialResults || []);
  const quizLessons = (propQuizLessons && propQuizLessons.length > 0) ? propQuizLessons : (cachedData?.quizLessons || []);
  const quizSubmissions = (propQuizSubmissions && propQuizSubmissions.length > 0) ? propQuizSubmissions : (cachedData?.quizSubmissions || []);
  const initialCompletedLessons = (propCompletedLessons && propCompletedLessons.length > 0) ? propCompletedLessons : (cachedData?.initialCompletedLessons || []);
  const courseTitle = propCourseTitle !== "My Course" ? propCourseTitle : (cachedData?.courseTitle || propCourseTitle);

  // Auto-cache tests whenever valid data is provided
  useEffect(() => {
    if (propTests && propTests.length > 0) {
      saveOfflineData(OFFLINE_KEYS.TESTS, {
        initialTests: propTests,
        modules: propModules,
        schedules: propSchedules,
        initialResults: propResults,
        quizLessons: propQuizLessons,
        quizSubmissions: propQuizSubmissions,
        initialCompletedLessons: propCompletedLessons,
        courseTitle: propCourseTitle,
      });
    }
  }, [propTests, propModules, propSchedules, propResults, propQuizLessons, propQuizSubmissions, propCompletedLessons, propCourseTitle]);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all"); // all, upcoming, completed, practice, mock
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // Interactive Test Taking States
  const [activeTest, setActiveTest] = useState<TestItem | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<any[]>(initialResults);
  const [submissions, setSubmissions] = useState<any[]>(quizSubmissions);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(initialCompletedLessons);

  // Result View Modal State
  const [viewingResult, setViewingResult] = useState<TestItem | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Module lookup map for clean titles
  const moduleMap = useMemo(() => {
    const map = new Map<string, string>();
    (modules || []).forEach((m: any) => {
      if (m.id && m.title) map.set(m.id, m.title);
    });
    return map;
  }, [modules]);

  // Combine 100% real database tests & curriculum quiz lessons
  const combinedTests = useMemo<TestItem[]>(() => {
    const list: TestItem[] = [];

    // 1. Real official tests from `tests` table
    (initialTests || []).forEach((t: any) => {
      const res = results.find((r: any) => r.test_id === t.id);
      const isCompleted = !!res;
      const isMock = (t.test_type || "").toLowerCase().includes("mock");
      const isPractice = (t.test_type || "").toLowerCase().includes("practice") || (t.test_type || "").toLowerCase().includes("mcq");

      let category: TestItem["category"] = "all";
      if (isCompleted) {
        category = "completed";
      } else if (isMock) {
        category = "mock";
      } else if (isPractice) {
        category = "practice";
      } else {
        category = "upcoming";
      }

      const totalQ = res?.total_questions || t.test_questions?.length || 20;
      const scoreVal = res?.score ?? null;
      const scorePct = isCompleted && totalQ > 0 ? Math.round(((scoreVal || 0) / totalQ) * 100) : 0;

      list.push({
        id: t.id,
        title: t.title || "Course Test",
        module: t.courses?.title || courseTitle || "General",
        description: t.description || "Official course evaluation test",
        type: t.test_type || (isMock ? "Mock Test" : "Timed Test"),
        category,
        questionsCount: totalQ,
        durationMinutes: t.duration_minutes || 30,
        totalMarks: t.total_marks || totalQ,
        status: isCompleted ? "Completed" : "Pending",
        scoreText: isCompleted ? `Score: ${scoreVal}/${totalQ} (${scorePct}%)` : "",
        scoreValue: scoreVal,
        totalQuestions: totalQ,
        dueText: t.due_date ? `Due: ${new Date(t.due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : "",
        dueDate: t.due_date,
        iconColor: isCompleted ? "emerald" : isMock ? "rose" : "amber",
        action: isCompleted ? "view_result" : "start_test",
        isDbItem: true,
        completedAt: res?.completed_at
      });
    });

    // 2. Real MCQ Quiz lessons from `lessons` table
    (quizLessons || []).forEach((ql: any) => {
      const sub = submissions.find((s: any) => s.lesson_id === ql.id);
      const res = results.find((r: any) => r.test_id === ql.id);
      const isCompleted = completedLessonIds.includes(ql.id) || sub?.status === "submitted" || !!res;

      const parsedQuestions = parseMcqQuestions(ql.notes_content);
      const qCount = parsedQuestions.length > 0 ? parsedQuestions.length : 10;

      let scoreVal: number | null = null;
      if (res?.score != null) {
        scoreVal = typeof res.score === "number" ? res.score : parseInt(String(res.score));
      } else if (sub?.score != null) {
        if (typeof sub.score === "number") {
          scoreVal = sub.score;
        } else if (typeof sub.score === "string") {
          const match = sub.score.match(/^(\d+)/);
          scoreVal = match ? parseInt(match[1]) : parseInt(sub.score);
        }
      } else if (isCompleted) {
        scoreVal = qCount;
      }

      const scorePct = isCompleted && qCount > 0 ? Math.round(((scoreVal || 0) / qCount) * 100) : 0;

      const modTitle = ql.module_id && moduleMap.has(ql.module_id)
        ? moduleMap.get(ql.module_id)!
        : ql.courses?.title || "Curriculum Quiz";

      list.push({
        id: ql.id,
        title: ql.title || "Module Quiz",
        module: modTitle,
        description: `Interactive quiz • ${qCount} questions`,
        type: "MCQ Practice",
        category: isCompleted ? "completed" : "practice",
        questionsCount: qCount,
        durationMinutes: Math.max(10, Math.round(qCount * 1.5)),
        totalMarks: qCount,
        status: isCompleted ? "Completed" : "Pending",
        scoreText: isCompleted ? `Score: ${scoreVal ?? 0}/${qCount} (${scorePct}%)` : "",
        scoreValue: scoreVal,
        totalQuestions: qCount,
        dueText: "",
        iconColor: isCompleted ? "emerald" : "purple",
        action: isCompleted ? "view_result" : "start_test",
        isQuizLesson: true,
        notes_content: ql.notes_content,
        completedAt: res?.completed_at || sub?.submitted_at || sub?.created_at
      });
    });

    return list;
  }, [initialTests, quizLessons, results, submissions, completedLessonIds, moduleMap, courseTitle]);

  // Pure dynamic stats computed strictly from real data
  const stats = useMemo(() => {
    const total = combinedTests.length;
    const completedList = combinedTests.filter(t => t.status === "Completed");
    const completed = completedList.length;
    const pendingList = combinedTests.filter(t => t.status === "Pending");
    const pending = pendingList.length;

    let totalPct = 0;
    let highestPct = 0;
    let lowestPct = 100;
    let passedCount = 0;

    completedList.forEach(t => {
      if (t.scoreValue != null && t.totalQuestions > 0) {
        const pct = (t.scoreValue / t.totalQuestions) * 100;
        totalPct += pct;
        if (pct > highestPct) highestPct = pct;
        if (pct < lowestPct) lowestPct = pct;
        if (pct >= 50) passedCount++;
      }
    });

    const avgScore = completed > 0 ? Math.round(totalPct / completed) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      avgScore,
      completionRate,
      highestScore: completed > 0 ? Math.round(highestPct) : null,
      lowestScore: completed > 0 ? Math.round(lowestPct) : null,
      passedCount,
      practiceCount: combinedTests.filter(t => t.type === "MCQ Practice" || t.category === "practice").length,
      mockCount: combinedTests.filter(t => t.type === "Mock Test" || t.category === "mock").length
    };
  }, [combinedTests]);

  // Dynamic modules list for the filter dropdown
  const availableModules = useMemo(() => {
    const set = new Set<string>();
    combinedTests.forEach(t => {
      if (t.module) set.add(t.module);
    });
    return Array.from(set);
  }, [combinedTests]);

  // Filtering based on activeTab, search, module, type, status, and sort
  const filteredTests = useMemo(() => {
    return combinedTests.filter(test => {
      // 1. Tab filter
      if (activeTab === "upcoming") {
        if (test.status !== "Pending") return false;
      } else if (activeTab === "completed") {
        if (test.status !== "Completed") return false;
      } else if (activeTab === "practice") {
        if (test.type !== "MCQ Practice" && test.category !== "practice") return false;
      } else if (activeTab === "mock") {
        if (test.type !== "Mock Test" && test.category !== "mock") return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = test.title.toLowerCase().includes(q);
        const matchesModule = test.module.toLowerCase().includes(q);
        const matchesDesc = test.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesModule && !matchesDesc) return false;
      }

      // 3. Module filter
      if (selectedModule !== "all") {
        if (test.module.toLowerCase() !== selectedModule.toLowerCase()) return false;
      }

      // 4. Type filter
      if (selectedType !== "all") {
        if (selectedType === "MCQ" && test.type !== "MCQ Practice") return false;
        if (selectedType === "Timed Test" && test.type !== "Timed Test") return false;
        if (selectedType === "Mock Test" && test.type !== "Mock Test") return false;
      }

      // 5. Status filter
      if (selectedStatus !== "all") {
        if (test.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      }

      return true;
    }).sort((a, b) => {
      // 1. Tests that are completed ("jo test de diya gya hai") go to the LAST/BOTTOM
      const aDone = a.status === "Completed";
      const bDone = b.status === "Completed";
      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }

      // 2. If both are completed, show recently completed first among the completed section
      if (aDone && bDone && a.completedAt && b.completedAt) {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      }

      // 3. Secondary sort within the same completion group
      if (sortOrder === "marks") return b.totalMarks - a.totalMarks;
      if (sortOrder === "oldest") return a.title.localeCompare(b.title);
      return 0; // newest default
    });
  }, [combinedTests, activeTab, searchQuery, selectedModule, selectedType, selectedStatus, sortOrder]);

  // Start test handler
  const handleStartTest = async (test: TestItem) => {
    setActiveTest(test);
    setTestCompleted(false);
    setCurrentQuestion(0);
    setAnswers({});
    setIsLoading(true);
    setLoadError(null);

    try {
      if (test.isQuizLesson) {
        // Parse from lesson notes_content
        const parsed = parseMcqQuestions(test.notes_content);
        if (parsed.length > 0) {
          setQuestions(parsed);
        } else {
          setLoadError("Questions for this quiz are currently being prepared by the teacher.");
          setQuestions([]);
        }
      } else {
        // Query from Supabase test_questions
        const { data, error } = await supabase
          .from("test_questions")
          .select("*")
          .eq("test_id", test.id)
          .order("order_index", { ascending: true });

        if (error) {
          setLoadError("Could not load questions from the database.");
          setQuestions([]);
        } else if (data && data.length > 0) {
          setQuestions(data);
        } else {
          setLoadError("No questions have been published for this test yet. Please check back later.");
          setQuestions([]);
        }
      }
    } catch {
      setLoadError("An unexpected error occurred while loading questions.");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: optionIndex }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleCompleteTest();
    }
  };

  const handleCompleteTest = async () => {
    if (!activeTest) return;

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct_option_index) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setTestCompleted(true);

    const nowIso = new Date().toISOString();

    // 1. If it's a quiz lesson, update submissions + user_progress + test_results
    if (activeTest.isQuizLesson) {
      try {
        await supabase.from("submissions").upsert({
          student_id: studentId,
          lesson_id: activeTest.id,
          status: "submitted",
          score: correctCount,
          content_url: JSON.stringify(answers),
          submitted_at: nowIso
        }, { onConflict: "student_id,lesson_id" });

        await supabase.from("user_progress").upsert({
          user_id: studentId,
          lesson_id: activeTest.id,
          completed: true,
          last_watched_at: nowIso
        }, { onConflict: "user_id,lesson_id" });

        // Also record in test_results for instant synchronization
        await supabase.from("test_results").upsert({
          test_id: activeTest.id,
          student_id: studentId,
          score: correctCount,
          total_questions: questions.length,
          completed_at: nowIso
        }, { onConflict: "test_id,student_id" });

        // Update local state so UI flips to Completed immediately
        setCompletedLessonIds(prev => Array.from(new Set([...prev, activeTest.id])));
        setSubmissions(prev => [
          ...prev.filter(s => s.lesson_id !== activeTest.id),
          { lesson_id: activeTest.id, status: "submitted", score: `${correctCount}/${questions.length}`, submitted_at: nowIso }
        ]);
        setResults(prev => [
          ...prev.filter(r => r.test_id !== activeTest.id),
          { test_id: activeTest.id, score: correctCount, total_questions: questions.length, completed_at: nowIso }
        ]);

        notifyAdminOnTestComplete({
          studentId,
          testTitle: activeTest.title || "Quiz",
          score: correctCount,
          totalQuestions: questions.length
        }).catch(() => {});
      } catch (err) {
        console.error("Error saving quiz submission:", err);
      }
    } else {
      // 2. Official DB test
      try {
        await supabase.from("test_results").upsert({
          test_id: activeTest.id,
          student_id: studentId,
          score: correctCount,
          total_questions: questions.length,
          completed_at: nowIso
        }, { onConflict: "test_id,student_id" });

        setResults(prev => [
          ...prev.filter(r => r.test_id !== activeTest.id),
          { test_id: activeTest.id, score: correctCount, total_questions: questions.length, completed_at: nowIso }
        ]);

        notifyAdminOnTestComplete({
          studentId,
          testTitle: activeTest.title || "Test",
          score: correctCount,
          totalQuestions: questions.length
        }).catch(() => {});
      } catch (err) {
        console.error("Error saving test result:", err);
      }
    }
  };

  // Next upcoming pending test for the sidebar
  const upcomingTest = useMemo(() => {
    return combinedTests.find(t => t.status === "Pending") || null;
  }, [combinedTests]);

  // Recent test activities for the sidebar
  const recentActivities = useMemo(() => {
    return combinedTests
      .filter(t => t.status === "Completed")
      .slice(0, 4);
  }, [combinedTests]);

  // Test Taking View (Screen overlay / focused mode)
  if (activeTest) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-slate-600 font-semibold text-xs">Loading questions...</p>
        </div>
      );
    }

    if (loadError || questions.length === 0) {
      return (
        <div className="max-w-md mx-auto py-12 px-4 text-center">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Test Not Ready</h2>
            <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
              {loadError || "No questions have been configured for this test yet."}
            </p>
            <button 
              onClick={() => {
                setActiveTest(null);
                setLoadError(null);
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              Back to Tests
            </button>
          </div>
        </div>
      );
    }

    if (testCompleted) {
      const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
      return (
        <div className="max-w-lg mx-auto py-6 sm:py-10 px-3 sm:px-4 animate-in zoom-in-95 duration-300">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-2xs">
              <Trophy size={32} className="stroke-[2]" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Test Completed!</h2>
            <p className="text-xs text-slate-500 font-medium mb-6 truncate">{activeTest.title}</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Your Score</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{score}/{questions.length}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Percentage</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{percentage}%</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button 
                onClick={() => {
                  setActiveTest(null);
                  setTestCompleted(false);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                Back to Tests Dashboard
              </button>
              <button 
                onClick={() => handleStartTest(activeTest)}
                className="w-full py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} /> Retake Test
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 px-2 sm:px-0 animate-in slide-in-from-right-3 duration-300 pb-16">
        {/* Sticky Mobile Header bar */}
        <div className="sticky top-2 z-20 flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate">{activeTest.title}</h3>
          </div>
          <button 
            onClick={() => setActiveTest(null)}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Exit Test"
            aria-label="Exit Test"
          >
            <X size={18} />
          </button>
        </div>

        {/* Question card */}
        {questions.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 sm:space-y-5">
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {currentQuestion + 1}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug flex-1">
                {questions[currentQuestion].question_text}
              </h2>
            </div>

            {/* Options list with touch-friendly targets */}
            <div className="space-y-2 sm:space-y-2.5">
              {(questions[currentQuestion].options || []).map((opt: string, idx: number) => {
                const isSelected = answers[currentQuestion] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full min-h-[48px] flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer active:scale-99 ${
                      isSelected 
                        ? "border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-2xs" 
                        : "border-slate-200/80 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1 leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons (Thumb-friendly on mobile) */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
              <button 
                type="button"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(prev => prev - 1)}
                className="min-h-[44px] px-3.5 py-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer rounded-xl"
              >
                <ArrowLeft size={14} /> Previous
              </button>
              <button 
                type="button"
                onClick={handleNextQuestion}
                className="min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>{currentQuestion === questions.length - 1 ? "Submit Test" : "Next Question"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-300 pb-12">
      {/* 1. Breadcrumbs Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/dashboard" className="hover:text-slate-800 flex items-center gap-1">
          <Home size={13} className="text-slate-400" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <Link href="/curriculum" className="hover:text-slate-800 truncate max-w-[140px] sm:max-w-none">
          <span>{courseTitle}</span>
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <span className="text-slate-800 font-semibold">Tests & Quizzes</span>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        {/* Left Column (8 of 12 cols): Banner + Metrics + Tabs + Filters + Tests */}
        <div className="lg:col-span-8 space-y-3 sm:space-y-4">
          {/* 2. Hero Banner Card */}
          <div className="bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-blue-50/40 rounded-2xl border border-purple-100/70 p-4 sm:p-5 flex items-center justify-between gap-4 relative overflow-hidden shadow-2xs">
            <div className="flex items-center gap-3 sm:gap-3.5 z-10 min-w-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-purple-100/90 border border-purple-200/80 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                <CheckSquare size={22} className="stroke-[1.9]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 leading-tight">
                  Tests & Quizzes
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-normal truncate">
                  Real assessments, chapter quizzes & live score tracking
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-600 font-medium">
                  <span className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md border border-purple-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    Real DB Tests
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md border border-purple-100">
                    <CheckSquare size={11} className="text-purple-600" />
                    Auto Evaluation
                  </span>
                </div>
              </div>
            </div>

            {/* Right Graphic: illustrated badge */}
            <div className="hidden sm:flex items-center pr-2 shrink-0 opacity-90">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs">
                <Award size={26} />
              </div>
            </div>
          </div>

          {/* 3. Top 4 Metric Summary Cards (2x2 grid on mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: Total Tests */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <FileText size={17} className="stroke-[1.9]" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
                  {stats.total}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Total Tests</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">All modules</div>
              </div>
            </div>

            {/* Card 2: Completed */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={17} className="stroke-[1.9]" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
                  {stats.completed}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Completed</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{stats.completionRate}% completion</div>
              </div>
            </div>

            {/* Card 3: Pending */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <Clock size={17} className="stroke-[1.9]" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
                  {stats.pending}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Pending</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">To be taken</div>
              </div>
            </div>

            {/* Card 4: Average Score */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <BarChart3 size={17} className="stroke-[1.9]" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl font-bold text-slate-900 leading-none">
                  {stats.avgScore}%
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Average Score</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {stats.completed > 0 ? `${stats.completed} attempts` : "No attempts"}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Filter Tabs Bar with Dynamic Real Counts */}
          <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto text-xs font-semibold scrollbar-hide">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`pb-2 px-2.5 sm:px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTab === "all"
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              All Tests ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`pb-2 px-2.5 sm:px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTab === "upcoming"
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Upcoming ({stats.pending})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`pb-2 px-2.5 sm:px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTab === "completed"
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Completed ({stats.completed})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("practice")}
              className={`pb-2 px-2.5 sm:px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTab === "practice"
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Practice Quizzes ({stats.practiceCount})
            </button>
            {stats.mockCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("mock")}
                className={`pb-2 px-2.5 sm:px-3 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  activeTab === "mock"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Mock Tests ({stats.mockCount})
              </button>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[160px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tests..."
                className="w-full pl-8.5 pr-8 py-2 text-xs bg-white rounded-xl border border-slate-200/80 focus:outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400 shadow-2xs"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Dynamic Module Filter */}
            {availableModules.length > 0 && (
              <div className="relative">
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="appearance-none bg-white text-xs font-medium text-slate-700 py-2 pl-3 pr-7 rounded-xl border border-slate-200/80 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer max-w-[140px] truncate"
                >
                  <option value="all">All Modules</option>
                  {availableModules.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* Filter: All Status */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-white text-xs font-medium text-slate-700 py-2 pl-3 pr-7 rounded-xl border border-slate-200/80 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Filter: Sort */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="appearance-none bg-white text-xs font-medium text-slate-700 py-2 pl-3 pr-7 rounded-xl border border-slate-200/80 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="marks">Highest Marks</option>
                <option value="oldest">Name (A-Z)</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Test Cards List */}
          <div className="space-y-2.5 sm:space-y-3">
            {filteredTests.length === 0 ? (
              /* Clean Empty State */
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-2xs space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                  <PenTool size={26} />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {activeTab === "all" ? "No Tests or Quizzes Available" : `No ${activeTab} tests found`}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {searchQuery 
                      ? "No test matching your search criteria. Try clearing filters."
                      : "There are currently no assessments scheduled for your batch. Check back soon or continue your course modules."}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/curriculum"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    Go to Curriculum <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ) : (
              filteredTests.map((test) => {
                let iconBg = "bg-blue-50 text-blue-600 border-blue-100";
                let IconComp = FileText;
                if (test.iconColor === "amber") {
                  iconBg = "bg-amber-50 text-amber-600 border-amber-100";
                  IconComp = Clock;
                } else if (test.iconColor === "purple") {
                  iconBg = "bg-purple-50 text-purple-600 border-purple-100";
                  IconComp = HelpCircle;
                } else if (test.iconColor === "emerald") {
                  iconBg = "bg-emerald-50 text-emerald-600 border-emerald-100";
                  IconComp = CheckCircle2;
                } else if (test.iconColor === "rose") {
                  iconBg = "bg-rose-50 text-rose-600 border-rose-100";
                  IconComp = Trophy;
                }

                const isCompleted = test.status === "Completed";

                return (
                  <div
                    key={test.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4"
                  >
                    {/* Left: Icon + Title & Description */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border ${iconBg}`}>
                        <IconComp size={18} className="stroke-[1.9]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {test.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            test.type === "Mock Test" 
                              ? "bg-purple-50 text-purple-700 border-purple-100"
                              : test.type === "MCQ Practice"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                              : "bg-blue-50 text-blue-700 border-blue-100"
                          }`}>
                            {test.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {test.module} • {test.description}
                        </p>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <FileText size={11} className="text-slate-400" />
                            {test.questionsCount} Questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            {test.durationMinutes} min
                          </span>
                          {test.dueText && (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <Calendar size={11} />
                              {test.dueText}
                            </span>
                          )}
                          {isCompleted && test.scoreText && (
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              {test.scoreText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Button (Full width on mobile) */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() => setViewingResult(test)}
                          className="w-full sm:w-auto min-h-[40px] px-4 py-2 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <BarChart2 size={13} /> View Result
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartTest(test)}
                          className="w-full sm:w-auto min-h-[40px] px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Play size={13} className="fill-white" /> Start Test
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (4 of 12 cols): Real Performance + Upcoming Test + Recent Activity */}
        <div className="lg:col-span-4 space-y-3.5 sm:space-y-4">
          {/* Card 1: Your Performance (100% Real DB stats) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
              <BarChart3 size={15} className="text-blue-600" />
              <span>Your Performance</span>
            </div>

            {/* Circular Donut Gauge & Average Score */}
            <div className="flex items-center gap-4 py-1">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path 
                    className="text-emerald-500 transition-all duration-500" 
                    strokeDasharray={`${stats.avgScore}, 100`} 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    stroke="currentColor" 
                    fill="none" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-slate-900">{stats.avgScore}%</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 leading-tight">
                  Average Score
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {stats.completed > 0 ? `Based on ${stats.completed} tests` : "No completed tests"}
                </div>
              </div>
            </div>

            {/* Performance Stats List */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span>Highest Score</span>
                </div>
                <span className="font-bold text-slate-900">
                  {stats.highestScore !== null ? `${stats.highestScore}%` : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <Target size={14} className="text-blue-600" />
                  <span>Lowest Score</span>
                </div>
                <span className="font-bold text-slate-900">
                  {stats.lowestScore !== null ? `${stats.lowestScore}%` : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 size={14} className="text-blue-600" />
                  <span>Tests Passed (≥50%)</span>
                </div>
                <span className="font-bold text-slate-900">
                  {stats.passedCount} / {stats.total}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Upcoming Pending Test (Real) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
              <Calendar size={15} className="text-blue-600" />
              <span>Next Upcoming Test</span>
            </div>

            {upcomingTest ? (
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                      <Clock size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {upcomingTest.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {upcomingTest.module}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 pt-1">
                    <div className="flex items-center gap-1">
                      <FileText size={11} className="text-slate-400" />
                      <span>{upcomingTest.questionsCount} Qs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      <span>{upcomingTest.durationMinutes} min</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartTest(upcomingTest)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  Start Test Now
                </button>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500 font-medium bg-slate-50/70 rounded-xl border border-slate-100">
                <CheckCircle2 size={20} className="mx-auto mb-1.5 text-emerald-500" />
                All caught up! No pending tests.
              </div>
            )}
          </div>

          {/* Card 3: Recent Activity (Real) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
              <Clock size={15} className="text-blue-600" />
              <span>Recent Activity</span>
            </div>

            {recentActivities.length > 0 ? (
              <div className="space-y-3 text-xs">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {act.title}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-medium">
                        {act.scoreText || `Score: ${act.scoreValue}/${act.totalQuestions}`}
                      </div>
                      {act.completedAt && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(act.completedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">
                No recent test attempts yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 6. View Result Modal (Responsive bottom sheet on mobile) */}
      {viewingResult && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 p-5 sm:p-7 max-w-md w-full shadow-xl space-y-4 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Completed
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">
                  {viewingResult.title}
                </h3>
                <p className="text-xs text-slate-500 truncate">{viewingResult.module}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingResult(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Score & Gauge Display */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex items-center justify-around">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Score</span>
                <span className="text-2xl font-black text-slate-900">
                  {viewingResult.scoreValue ?? 0} / {viewingResult.totalQuestions}
                </span>
              </div>
              <div className="h-10 w-[1px] bg-emerald-200/60" />
              <div className="text-center">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Percentage</span>
                <span className="text-2xl font-black text-emerald-700">
                  {viewingResult.totalQuestions > 0 ? Math.round(((viewingResult.scoreValue || 0) / viewingResult.totalQuestions) * 100) : 0}%
                </span>
              </div>
              <div className="h-10 w-[1px] bg-emerald-200/60" />
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                <span className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-1 mt-1">
                  <Check size={14} /> Passed
                </span>
              </div>
            </div>

            {/* Performance Details List */}
            <div className="space-y-2 text-xs border-t border-slate-100 pt-3 text-slate-600">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Questions</span>
                <span className="font-semibold text-slate-900">{viewingResult.totalQuestions} Questions</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-900">{viewingResult.durationMinutes} Minutes</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Evaluation Mode</span>
                <span className="font-semibold text-blue-600">Instant Automated Scoring</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setViewingResult(null);
                  handleStartTest(viewingResult);
                }}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} /> Retake Test
              </button>
              <button
                type="button"
                onClick={() => setViewingResult(null)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
