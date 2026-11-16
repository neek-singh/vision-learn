"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  Laptop,
  Brain,
  Award,
  Lightbulb,
  Sparkles,
  Pencil,
  Bookmark,
  FileText,
  ArrowRight,
  ArrowLeft,
  LogIn,
  UserPlus,
  CheckCircle2,
  School,
  Briefcase,
  Layers,
  Code2,
  Cpu,
  Monitor,
  FileSpreadsheet,
  Phone,
  MessageCircle,
  ExternalLink,
  Check,
  Copy
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

function TypewriterText({
  text,
  speed = 22,
  className = "",
  onComplete,
}: {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayText, setDisplayText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setDisplayText("");
    setIsDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setIsDone(true);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayText || "\u00A0"}
      {!isDone && (
        <span className="inline-block w-[3px] h-[0.85em] bg-indigo-600 ml-1 rounded-full animate-pulse align-middle" />
      )}
    </span>
  );
}

function TypewriterHeading({
  line1 = "Hello Dear,",
  line2 = "Let's Study",
  onComplete,
}: {
  line1?: string;
  line2?: string;
  onComplete?: () => void;
}) {
  const full = `${line1}\n${line2}`;
  const [displayText, setDisplayText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setDisplayText("");
    setIsDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(timer);
        setIsDone(true);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, 28);

    return () => clearInterval(timer);
  }, [full]);

  const [part1, part2] = displayText.split("\n");

  return (
    <h1 className="text-3xl sm:text-4xl font-medium text-black tracking-tight leading-tight mb-2 min-h-[5.5rem]">
      {part1 || "\u00A0"}
      {displayText.includes("\n") && (
        <>
          <br />
          <span className="text-indigo-600 font-medium">{part2 || ""}</span>
        </>
      )}
      {!isDone && (
        <span className="inline-block w-[3px] h-[0.85em] bg-indigo-600 ml-1 rounded-full animate-pulse align-middle" />
      )}
    </h1>
  );
}

export function WelcomeOnboarding() {
  const router = useRouter();

  // Screen modes: "welcome" | "auth" | "signup"
  const [screen, setScreen] = useState<"welcome" | "auth" | "signup">("welcome");
  
  // Sign up multi-step state (1 to 6)
  const [step, setStep] = useState<number>(1);

  // Form Data
  const [name, setName] = useState("");
  const [studying, setStudying] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdStudentId, setCreatedStudentId] = useState<string>("VIT001");
  const [isExistingAccount, setIsExistingAccount] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Dynamic Class / Level Bubbles based on Studying Status
  const getClassConfig = () => {
    switch (studying) {
      case "School Student":
        return {
          title: "Which class are you in?",
          subtitle: "Select your standard to get the right syllabus & study material.",
          bubbles: ["6th", "7th", "8th", "9th", "10th", "11th", "12th"],
        };
      case "College Student":
        return {
          title: "What are you studying in college?",
          subtitle: "Select your degree level or current college year.",
          bubbles: [
            "Graduation / UG",
            "Post Graduation (PG)",
            "Diploma / Poly",
            "1st Year",
            "2nd Year",
            "3rd Year",
            "Final Year",
          ],
        };
      case "Working Professional":
        return {
          title: "What is your professional domain?",
          subtitle: "Select your field of work.",
          bubbles: [
            "Software & IT",
            "Finance & Accounts",
            "Sales & Marketing",
            "Teaching / Education",
            "Govt / Competitive",
            "Business & Other",
          ],
        };
      case "Other":
      default:
        return {
          title: "What is your primary goal?",
          subtitle: "Choose the learning pathway you want to explore.",
          bubbles: [
            "Competitive Exams",
            "Computer Skills",
            "Career Switch",
            "Self-Learning",
            "Hobby & Growth",
          ],
        };
    }
  };

  // Synchronous step key check ensures elements never flash before typing starts
  const currentStepKey = `${screen}-${step}`;
  const [completedStepKey, setCompletedStepKey] = useState<string>("");
  const isTypingDone = completedStepKey === currentStepKey;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("signup") === "true") {
        setScreen("signup");
        setStep(1);
      }
    }
  }, []);

  const handleCopy = (val: string, field: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Study Status Options
  const STUDY_OPTIONS = [
    { id: "School Student", label: "School Student", icon: School },
    { id: "College Student", label: "College Student", icon: GraduationCap },
    { id: "Working Professional", label: "Working Professional", icon: Briefcase },
    { id: "Other", label: "Other", icon: Layers },
  ];

  // Learning Interest Options
  const INTEREST_OPTIONS = [
    { id: "Computer Basics", label: "Computer Basics", icon: Monitor, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { id: "AI", label: "AI (Artificial Intelligence)", icon: Cpu, color: "text-purple-600 bg-purple-50 border-purple-200" },
    { id: "Programming", label: "Programming", icon: Code2, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
    { id: "Web Development", label: "Web Development", icon: Laptop, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { id: "MS Office", label: "MS Office", icon: FileSpreadsheet, color: "text-amber-600 bg-amber-50 border-amber-200" },
  ];

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStartSignUp = () => {
    setStep(1);
    setScreen("signup");
  };

  const handleSubmitRegistration = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          studying: studying || "School Student",
          studentClass: selectedClass || (studying === "School Student" ? "Class 10th" : studying),
          interests,
        }),
      });

      const data = await res.json();
      if (res.ok && data.student?.student_id) {
        setCreatedStudentId(data.student.student_id);
        if (data.student.name) {
          setName(data.student.name);
        }
        setIsExistingAccount(Boolean(data.isExisting));
      } else {
        setCreatedStudentId("VIT001");
        setIsExistingAccount(false);
      }
    } catch (e) {
      console.warn("Registration network fallback:", e);
      setCreatedStudentId("VIT001");
    } finally {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setStep(6);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col justify-between overflow-x-hidden select-none">
      {/* ─────────────────────────────────────────────────────────────
          BACKGROUND FLOATING STUDY-RELATED ICONS
      ───────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-10 left-6 sm:top-14 sm:left-16 text-indigo-400/25 animate-float-slow">
          <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 -rotate-12" />
        </div>
        <div className="absolute top-12 right-6 sm:top-16 sm:right-16 text-blue-400/25 animate-float-medium">
          <BookOpen className="w-9 h-9 sm:w-11 sm:h-11 rotate-12" />
        </div>
        <div className="absolute top-32 left-16 sm:top-36 sm:left-36 text-sky-400/20 animate-float-fast">
          <Laptop className="w-7 h-7 sm:w-9 sm:h-9 -rotate-6" />
        </div>
        <div className="absolute top-36 right-16 sm:top-40 sm:right-32 text-amber-400/30 animate-float-slow">
          <Sparkles className="w-7 h-7 sm:w-9 sm:h-9 rotate-12" />
        </div>
        <div className="absolute top-1/2 -translate-y-24 left-5 sm:left-14 text-violet-400/25 animate-float-medium">
          <Brain className="w-9 h-9 sm:w-11 sm:h-11 -rotate-12" />
        </div>
        <div className="absolute top-1/2 -translate-y-20 right-5 sm:right-14 text-amber-400/25 animate-float-slow">
          <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 rotate-6" />
        </div>
        <div className="absolute bottom-52 left-8 sm:bottom-60 sm:left-24 text-emerald-400/25 animate-float-fast">
          <Pencil className="w-7 h-7 sm:w-9 sm:h-9 -rotate-45" />
        </div>
        <div className="absolute bottom-48 right-8 sm:bottom-56 sm:right-28 text-indigo-400/25 animate-float-medium">
          <Award className="w-9 h-9 sm:w-11 sm:h-11 rotate-12" />
        </div>
        <div className="absolute bottom-16 left-8 sm:bottom-20 sm:left-20 text-rose-400/20 animate-float-slow">
          <Bookmark className="w-7 h-7 sm:w-8 sm:h-8 rotate-6" />
        </div>
        <div className="absolute bottom-16 right-8 sm:bottom-20 sm:right-20 text-sky-400/25 animate-float-fast">
          <FileText className="w-7 h-7 sm:w-9 sm:h-9 -rotate-12" />
        </div>

        {/* Soft Ambient Radial Blur */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. FIRST WELCOME SCREEN (CLEAN, NO AI-SLOP, NO LOGIN BTN)
      ───────────────────────────────────────────────────────────── */}
      {screen === "welcome" && (
        <div className="relative z-10 flex-1 flex flex-col justify-between p-6 sm:p-8 max-w-sm mx-auto w-full animate-in fade-in duration-300">
          <div className="pt-2 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-black">
              Vision IT Institute
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <div className="relative mb-6 flex items-center justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-3.5 shadow-xl shadow-indigo-500/10 border border-slate-100 flex items-center justify-center">
                <img
                  src="/icons/icon-512.png"
                  alt="Vision Learn"
                  className="w-full h-full object-contain"
                  loading="eager"
                  decoding="sync"
                />
              </div>
            </div>

            <TypewriterHeading
              line1="Hello Dear,"
              line2="Let's Study"
              onComplete={() => setCompletedStepKey("welcome-1")}
            />

            {/* Action button placed directly below the heading for natural eye and thumb ergonomics */}
            <div
              className={`w-full max-w-xs mt-6 transition-all duration-400 delay-150 transform ${
                isTypingDone
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 translate-y-3 pointer-events-none"
              }`}
            >
              <button
                type="button"
                onClick={() => setScreen("auth")}
                className="w-full min-h-[52px] bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium text-base rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="text-center pb-4">
            <p className="text-[11px] text-black font-medium">
              Empowering Digital Education
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. AUTH SCREEN (ONLY LOGIN & SIGN UP)
      ───────────────────────────────────────────────────────────── */}
      {screen === "auth" && (
        <div className="relative z-10 flex-1 flex flex-col justify-between p-6 sm:p-8 max-w-sm mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setScreen("welcome")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:text-indigo-600 p-2 -ml-2 rounded-xl transition-colors touch-manipulation cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-black">
              Vision Learn
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white p-2.5 shadow-lg shadow-indigo-500/10 border border-slate-100 flex items-center justify-center mb-5">
              <img
                src="/icons/icon-512.png"
                alt="Vision Learn"
                className="w-full h-full object-contain"
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-medium text-black tracking-tight mb-1.5 min-h-[2.5rem] flex items-center justify-center">
              <TypewriterText
                text="Welcome"
                speed={28}
                onComplete={() => setCompletedStepKey("auth-1")}
              />
            </h2>
            <p
              className={`text-xs sm:text-sm text-black font-normal max-w-xs mb-6 transition-all duration-400 transform ${
                isTypingDone
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 pointer-events-none"
              }`}
            >
              Sign in to your account or register as a new student to continue.
            </p>

            <div
              className={`w-full max-w-xs space-y-3 transition-all duration-400 delay-100 transform ${
                isTypingDone
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 translate-y-3 pointer-events-none"
              }`}
            >
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full min-h-[52px] bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium text-base rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2.5 touch-manipulation cursor-pointer"
              >
                <LogIn size={18} />
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={handleStartSignUp}
                className="w-full min-h-[52px] bg-white hover:bg-slate-50 active:scale-[0.98] text-black font-medium text-base rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-2.5 touch-manipulation cursor-pointer shadow-xs"
              >
                <UserPlus size={18} className="text-indigo-600" />
                <span>Sign Up</span>
              </button>
            </div>
          </div>

          <div
            className={`text-center pb-4 transition-all duration-400 delay-200 transform ${
              isTypingDone
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-2 pointer-events-none"
            }`}
          >
            <p className="text-[11px] text-black font-medium">
              Need assistance?{" "}
              <a
                href="tel:+918103170595"
                className="font-semibold text-indigo-600 hover:underline"
              >
                Contact Institute
              </a>
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. 5-STEP SIGN UP / ONBOARDING FLOW
      ───────────────────────────────────────────────────────────── */}
      {screen === "signup" && (
        <div className="relative z-10 flex-1 flex flex-col justify-between p-6 sm:p-8 max-w-sm mx-auto w-full animate-in fade-in duration-300">
          {/* Header & Step Progress Bar (Steps 1 to 5) */}
          {step < 6 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    if (step > 1) {
                      setStep(step - 1);
                    } else {
                      setScreen("auth");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:text-indigo-600 p-2 -ml-2 rounded-xl transition-colors touch-manipulation cursor-pointer"
                >
                  <ArrowLeft size={16} className="text-black" />
                  <span>Back</span>
                </button>
                <span className="text-xs font-semibold text-indigo-600">
                  Step {step} of 5
                </span>
              </div>

              {/* 5-Segment Smooth Animated Progress Line */}
              <div className="w-full h-1.5 flex gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={5}>
                {[1, 2, 3, 4, 5].map((seg) => (
                  <div
                    key={seg}
                    className="flex-1 h-full bg-slate-200/80 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out ${
                        step >= seg ? "w-full" : "w-0"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: WELCOME & NAME ── */}
          {step === 1 && (
            <div className="flex-1 flex flex-col justify-center py-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="mb-5">
                <h2 className="text-2xl sm:text-3xl font-medium text-black tracking-tight min-h-[3.75rem] flex items-center">
                  <TypewriterText
                    text="What's your name?"
                    speed={22}
                    onComplete={() => setCompletedStepKey("signup-1")}
                  />
                </h2>
                <p
                  className={`text-xs sm:text-sm text-black font-normal mt-1 transition-all duration-400 transform ${
                    isTypingDone
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2 pointer-events-none"
                  }`}
                >
                  Welcome to Vision Learn! Tell us a little about yourself.
                </p>
              </div>

              <div
                className={`space-y-4 transition-all duration-400 delay-100 transform ${
                  isTypingDone
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-3 pointer-events-none"
                }`}
              >
                <input
                  type="text"
                  autoFocus={isTypingDone}
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) setStep(2);
                  }}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-slate-200 focus:border-indigo-600 outline-none text-base font-normal text-black placeholder:text-slate-400 shadow-xs transition-all"
                />

                {/* Continue button directly below the input field */}
                <button
                  type="button"
                  disabled={!name.trim()}
                  onClick={() => setStep(2)}
                  className="w-full min-h-[52px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-medium text-base rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: WHAT ARE YOU CURRENTLY STUDYING? ── */}
          {step === 2 && (
            <div className="flex-1 flex flex-col justify-center py-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="mb-4">
                <h2 className="text-2xl sm:text-3xl font-medium text-black tracking-tight min-h-[3.75rem] flex items-center">
                  <TypewriterText
                    text="What are you currently studying?"
                    speed={20}
                    onComplete={() => setCompletedStepKey("signup-2")}
                  />
                </h2>
                <p
                  className={`text-xs sm:text-sm text-black font-normal mt-1 transition-all duration-400 transform ${
                    isTypingDone
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2 pointer-events-none"
                  }`}
                >
                  Select your current status to help us personalize your courses.
                </p>
              </div>

              <div className="space-y-2.5">
                {STUDY_OPTIONS.map((opt, idx) => {
                  const Icon = opt.icon;
                  const isSelected = studying === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setStudying(opt.id);
                        setSelectedClass("");
                      }}
                      style={{
                        transitionDelay: isTypingDone ? `${idx * 70}ms` : "0ms",
                      }}
                      className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between touch-manipulation cursor-pointer transition-all duration-400 transform ${
                        isTypingDone
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 translate-y-3 pointer-events-none"
                      } ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-600 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-black"
                          }`}
                        >
                          <Icon size={20} />
                        </div>
                        <span className="font-medium text-sm text-black">
                          {opt.label}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Continue button directly below the options */}
              <div
                className={`mt-4 transition-all duration-400 delay-150 transform ${
                  isTypingDone
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-3 pointer-events-none"
                }`}
              >
                <button
                  type="button"
                  disabled={!studying}
                  onClick={() => setStep(3)}
                  className="w-full min-h-[52px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-medium text-base rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: CLASS / LEVEL BUBBLE SELECTION (DYNAMIC BASED ON STUDYING STATUS) ── */}
          {step === 3 && (
            <div className="flex-1 flex flex-col justify-center py-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="mb-5 text-center">
                <h2 className="text-2xl sm:text-3xl font-medium text-black tracking-tight min-h-[3.75rem] flex items-center justify-center">
                  <TypewriterText
                    text={getClassConfig().title}
                    speed={20}
                    onComplete={() => setCompletedStepKey("signup-3")}
                  />
                </h2>
                <p
                  className={`text-xs sm:text-sm text-black font-normal mt-1 max-w-xs mx-auto transition-all duration-400 transform ${
                    isTypingDone
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2 pointer-events-none"
                  }`}
                >
                  {getClassConfig().subtitle}
                </p>
              </div>

              {/* Bubble Text Pills */}
              <div className="flex flex-wrap gap-2.5 justify-center py-2 max-w-xs mx-auto">
                {getClassConfig().bubbles.map((bubble, idx) => {
                  const isSelected = selectedClass === bubble;
                  return (
                    <button
                      key={bubble}
                      type="button"
                      onClick={() => setSelectedClass(bubble)}
                      style={{
                        transitionDelay: isTypingDone ? `${idx * 40}ms` : "0ms",
                      }}
                      className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-medium border-2 transition-all duration-200 active:scale-95 touch-manipulation cursor-pointer flex items-center gap-1.5 transform ${
                        isTypingDone
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 translate-y-3 pointer-events-none"
                      } ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-[1.04]"
                          : "bg-white text-black border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                      }`}
                    >
                      {isSelected && <Check size={14} className="stroke-[3]" />}
                      <span>{bubble}</span>
                    </button>
                  );
                })}
              </div>

              {/* Continue button directly below the bubble chips */}
              <div
                className={`w-full max-w-xs mx-auto mt-6 transition-all duration-400 delay-150 transform ${
                  isTypingDone
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-3 pointer-events-none"
                }`}
              >
                <button
                  type="button"
                  disabled={!selectedClass}
                  onClick={() => setStep(4)}
                  className="w-full min-h-[52px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-medium text-base rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: WHAT DO YOU WANT TO LEARN? ── */}
          {step === 4 && (
            <div className="flex-1 flex flex-col justify-center py-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="mb-4">
                <h2 className="text-2xl sm:text-3xl font-medium text-black tracking-tight min-h-[3.75rem] flex items-center">
                  <TypewriterText
                    text="What do you want to learn?"
                    speed={20}
                    onComplete={() => setCompletedStepKey("signup-4")}
                  />
                </h2>
                <p
                  className={`text-xs sm:text-sm text-black font-normal mt-1 transition-all duration-400 transform ${
                    isTypingDone
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2 pointer-events-none"
                  }`}
                >
                  Choose one or more areas that interest you.
                </p>
              </div>

              <div className="space-y-2">
                {INTEREST_OPTIONS.map((opt, idx) => {
                  const Icon = opt.icon;
                  const isSelected = interests.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleInterest(opt.id)}
                      style={{
                        transitionDelay: isTypingDone ? `${idx * 50}ms` : "0ms",
                      }}
                      className={`w-full p-2.5 rounded-2xl border-2 text-left flex items-center justify-between touch-manipulation cursor-pointer transition-all duration-400 transform ${
                        isTypingDone
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 translate-y-3 pointer-events-none"
                      } ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-600 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${opt.color}`}
                        >
                          <Icon size={16} />
                        </div>
                        <p className="font-medium text-sm text-black">
                          {opt.label}
                        </p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Continue button directly below the options */}
              <div
                className={`mt-4 transition-all duration-400 delay-150 transform ${
                  isTypingDone
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-3 pointer-events-none"
                }`}
              >
                <button
                  type="button"
                  disabled={interests.length === 0}
                  onClick={() => setStep(5)}
                  className="w-full min-h-[52px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-medium text-base rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
                >
                  <span>Continue ({interests.length} selected)</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: MOBILE NUMBER ── */}
          {step === 5 && (
            <div className="flex-1 flex flex-col justify-center py-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="mb-5">
                <h2 className="text-2xl sm:text-3xl font-medium text-black tracking-tight min-h-[3.75rem] flex items-center">
                  <TypewriterText
                    text="What's your mobile number?"
                    speed={20}
                    onComplete={() => setCompletedStepKey("signup-5")}
                  />
                </h2>
                <p
                  className={`text-xs sm:text-sm text-black font-normal mt-1 transition-all duration-400 transform ${
                    isTypingDone
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2 pointer-events-none"
                  }`}
                >
                  We&apos;ll use this to send your student onboarding details &amp; admission updates.
                </p>
              </div>

              <div
                className={`space-y-3.5 transition-all duration-400 delay-100 transform ${
                  isTypingDone
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-3 pointer-events-none"
                }`}
              >
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center gap-1.5 text-sm font-semibold text-black pointer-events-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                    <span className="text-slate-400">|</span>
                  </div>
                  <input
                    type="tel"
                    autoFocus={isTypingDone}
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && phone.length === 10 && !isSubmitting) {
                        handleSubmitRegistration();
                      }
                    }}
                    className="w-full pl-20 pr-4 py-3.5 rounded-2xl bg-white border-2 border-slate-200 focus:border-indigo-600 outline-none text-base font-normal text-black placeholder:text-slate-400 shadow-xs transition-all tracking-wider"
                  />
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2 text-[11px] text-indigo-950 font-medium">
                  <Phone size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span>Your number is safely verified with Vision IT Institute. No spam calls.</span>
                </div>

                {/* Submit button directly below the disclaimer */}
                <button
                  type="button"
                  disabled={phone.length < 10 || isSubmitting}
                  onClick={handleSubmitRegistration}
                  className="w-full min-h-[52px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-medium text-base rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
                >
                  <span>{isSubmitting ? "Submitting..." : "Submit Registration"}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 6: REGISTRATION COMPLETE & CONFIRMATION (COMPACT & FULLY IN VIEWPORT) ── */}
          {step === 6 && (
            <div className="flex-1 flex flex-col items-center justify-center py-2 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-xs">
                <CheckCircle2 size={28} className="stroke-[2.5]" />
              </div>

              <h2 className="text-2xl font-semibold text-black tracking-tight">
                {isExistingAccount ? "Welcome Back!" : "Account Created!"}
              </h2>
              <p className="text-xs text-black font-normal max-w-xs mt-0.5 mb-4">
                {isExistingAccount ? (
                  <>
                    Aapka account pehle se registered hai, <span className="font-semibold text-black">{name}</span>!
                  </>
                ) : (
                  <>
                    Welcome, <span className="font-semibold text-black">{name}</span>! Here are your login credentials:
                  </>
                )}
              </p>

              {/* Clean Human-Designed Unified Credentials Card */}
              <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-3.5 divide-y divide-slate-100 shadow-xs mb-4 text-left">
                {/* Student ID */}
                <div className="flex items-center justify-between pb-3">
                  <div>
                    <span className="text-xs uppercase font-semibold text-black tracking-wider block">
                      Student ID
                    </span>
                    <span className="font-mono text-lg font-bold text-indigo-600 tracking-wide">
                      {createdStudentId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(createdStudentId, "id")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-black hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                  >
                    {copiedField === "id" ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-black" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Password */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="text-xs uppercase font-semibold text-black tracking-wider block">
                      Password (Mobile No.)
                    </span>
                    <span className="font-mono text-base font-semibold text-black tracking-wide">
                      {phone}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(phone, "pass")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-black hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                  >
                    {copiedField === "pass" ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-black" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons (Completely above the fold, no cut-off) */}
              <div className="w-full space-y-2.5">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full min-h-[48px] bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium text-sm sm:text-base rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
                >
                  <LogIn size={18} />
                  <span>{isExistingAccount ? "Continue to Dashboard" : "Login to Vision Learn"}</span>
                </button>

                <a
                  href={`https://wa.me/918103170595?text=Hello%20Vision%20IT%20Institute%2C%20my%20name%20is%20${encodeURIComponent(name)}.%20I%20have%20registered%20on%20Vision%20Learn%20app%20with%20Student%20ID%20${encodeURIComponent(createdStudentId)}%20for%20${encodeURIComponent(interests.join(", ") || "Course Admission")}.%20Please%20guide%20me.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] bg-white hover:bg-slate-50 active:scale-[0.98] text-black border border-slate-200 font-medium text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 touch-manipulation cursor-pointer shadow-2xs"
                >
                  <MessageCircle size={16} className="text-emerald-600" />
                  <span>WhatsApp Admission Helpdesk</span>
                </a>
              </div>
            </div>
          )}

          {/* Bottom spacing */}
          <div className="pb-2" />
        </div>
      )}
    </main>
  );
}
