"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  LogIn,
  UserPlus,
  X,
  PhoneCall,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  ChevronRight,
  School,
  Sparkle,
} from "lucide-react";

export function WelcomeOnboarding() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "admission">("menu");

  // Prevent background scrolling when bottom sheet modal is open
  useEffect(() => {
    if (isSheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setActiveTab("menu");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSheetOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSheetOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 text-slate-800 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* ─────────────────────────────────────────────────────────────
          1. BACKGROUND FLOATING STUDY-RELATED ICONS & AMBIENT AURA
      ───────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden select-none"
        aria-hidden="true"
      >
        {/* Ambient Gradient Spheres */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-violet-200/30 blur-3xl" />

        {/* Floating Study Icon 1: GraduationCap (Top Left) */}
        <div className="absolute top-8 left-6 sm:top-14 sm:left-16 text-indigo-400/35 animate-float-slow">
          <GraduationCap className="w-10 h-10 sm:w-14 sm:h-14 transform -rotate-12" />
        </div>

        {/* Floating Study Icon 2: BookOpen (Top Right) */}
        <div className="absolute top-10 right-6 sm:top-16 sm:right-16 text-blue-400/35 animate-float-medium">
          <BookOpen className="w-9 h-9 sm:w-12 sm:h-12 transform rotate-12" />
        </div>

        {/* Floating Study Icon 3: Laptop (Upper Left) */}
        <div className="absolute top-28 left-20 sm:top-36 sm:left-40 text-sky-400/30 animate-float-fast">
          <Laptop className="w-7 h-7 sm:w-10 sm:h-10 transform -rotate-6" />
        </div>

        {/* Floating Study Icon 4: Sparkles (Upper Right) */}
        <div className="absolute top-32 right-16 sm:top-40 sm:right-36 text-amber-400/45 animate-float-slow">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 transform rotate-12" />
        </div>

        {/* Floating Study Icon 5: Brain (Middle Left) */}
        <div className="absolute top-1/2 -translate-y-28 left-4 sm:left-14 text-violet-400/30 animate-float-medium">
          <Brain className="w-9 h-9 sm:w-12 sm:h-12 transform -rotate-12" />
        </div>

        {/* Floating Study Icon 6: Lightbulb (Middle Right) */}
        <div className="absolute top-1/2 -translate-y-20 right-5 sm:right-16 text-amber-400/40 animate-float-slow">
          <Lightbulb className="w-9 h-9 sm:w-11 sm:h-11 transform rotate-6" />
        </div>

        {/* Floating Study Icon 7: Pencil (Lower Middle Left) */}
        <div className="absolute bottom-56 left-6 sm:bottom-64 sm:left-24 text-emerald-400/35 animate-float-fast">
          <Pencil className="w-8 h-8 sm:w-10 sm:h-10 transform -rotate-45" />
        </div>

        {/* Floating Study Icon 8: Award (Lower Middle Right) */}
        <div className="absolute bottom-52 right-8 sm:bottom-60 sm:right-28 text-indigo-400/35 animate-float-medium">
          <Award className="w-9 h-9 sm:w-12 sm:h-12 transform rotate-12" />
        </div>

        {/* Floating Study Icon 9: Bookmark (Bottom Left) */}
        <div className="absolute bottom-20 left-8 sm:bottom-28 sm:left-20 text-rose-400/30 animate-float-slow">
          <Bookmark className="w-7 h-7 sm:w-9 sm:h-9 transform rotate-6" />
        </div>

        {/* Floating Study Icon 10: FileText (Bottom Right) */}
        <div className="absolute bottom-20 right-6 sm:bottom-28 sm:right-20 text-cyan-500/35 animate-float-fast">
          <FileText className="w-8 h-8 sm:w-10 sm:h-10 transform -rotate-12" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TOP HEADER BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="relative z-10 w-full max-w-xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-300">
            <School size={16} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Vision IT Institute
          </span>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/60 transition-all active:scale-95 touch-manipulation"
        >
          <LogIn size={13} />
          <span>Login</span>
        </Link>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          3. CENTER HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-6 sm:py-10 max-w-lg mx-auto text-center">
        {/* App Logo with Soft Glowing Aura */}
        <div className="relative mb-6 sm:mb-8 flex items-center justify-center">
          {/* Soft Glowing Aura */}
          <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-indigo-500/25 blur-2xl animate-pulse pointer-events-none" />
          <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-sky-400/20 blur-xl animate-float-slow pointer-events-none" />

          {/* Squircle Logo Container */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[1.75rem] bg-white p-3.5 shadow-2xl shadow-indigo-600/20 border border-indigo-100 flex items-center justify-center transition-transform hover:scale-105 duration-300">
            <img
              src="/icons/icon-512.png"
              alt="Vision Learn Logo"
              className="w-full h-full object-contain drop-shadow-sm select-none"
              loading="eager"
              decoding="sync"
            />
          </div>

          {/* Mini Sparkle Accent Badge */}
          <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-950 flex items-center justify-center shadow-md animate-bounce duration-1000">
            <Sparkle size={14} className="fill-amber-950" />
          </div>
        </div>

        {/* Institute Sub-Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/70 border border-indigo-200/80 text-indigo-700 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
          <Sparkles size={12} className="text-indigo-600" />
          <span>Smart Learning Portal</span>
        </div>

        {/* Prominent Header */}
        <h1 className="text-3xl sm:text-4xl md:text-[2.65rem] font-black tracking-tight text-slate-900 leading-[1.18] mb-3">
          Hello Dear, <br className="hidden xs:inline" />
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
            Let&apos;s Study! 🚀
          </span>
        </h1>

        {/* Welcoming Subtext */}
        <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-sm sm:max-w-md mx-auto mb-6 sm:mb-8">
          Welcome to Vision Learn — your personalized digital classroom for scheduled tests, video lectures, batch notes, and academic success.
        </p>

        {/* Feature Pills (360px-768px friendly) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-sm">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-full shadow-xs backdrop-blur-xs">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Scheduled Exams
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-full shadow-xs backdrop-blur-xs">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Class Notes & PDF
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-full shadow-xs backdrop-blur-xs">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Progress Analytics
          </span>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. PRIMARY CALL TO ACTION
        ───────────────────────────────────────────────────────────── */}
        <div className="w-full max-w-xs sm:max-w-sm space-y-3">
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="w-full min-h-[52px] sm:min-h-[56px] px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-600 hover:from-indigo-500 hover:to-indigo-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 touch-manipulation group cursor-pointer"
          >
            <span>Get Started / Start Learning</span>
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>

          <p className="text-[11px] text-slate-400 font-medium">
            Already enrolled? Tap above to jump into your portal
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full max-w-xl mx-auto px-6 py-4 text-center">
        <p className="text-[11px] text-slate-400 font-medium tracking-tight">
          Vision IT Computer Institute • Empowering Digital Skills
        </p>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          6. BOTTOM-SHEET MODAL / SLIDE TRANSITION
      ───────────────────────────────────────────────────────────── */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsSheetOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Container (Bottom-sheet on mobile, centered modal on desktop) */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative z-10 w-full sm:max-w-md bg-white rounded-t-[2.25rem] sm:rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-300 ease-out"
          >
            {/* Sheet Handle Bar (Mobile Drag Cue) */}
            <div className="sm:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsSheetOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors touch-manipulation cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            {activeTab === "menu" ? (
              <>
                {/* Header inside Sheet */}
                <div className="mb-6 pr-8">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                    <Sparkles size={14} />
                    <span>Choose an Option</span>
                  </div>
                  <h2
                    id="modal-title"
                    className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
                  >
                    Welcome to Vision Learn
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    Select how you would like to proceed today:
                  </p>
                </div>

                {/* Option 1: Student Login */}
                <div className="space-y-3.5">
                  <Link
                    href="/login"
                    onClick={() => setIsSheetOpen(false)}
                    className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-indigo-50/50 to-white border-2 border-indigo-200/80 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-100 transition-all group flex items-center justify-between touch-manipulation active:scale-[0.98] block"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-300 shrink-0 group-hover:scale-105 transition-transform">
                        <GraduationCap size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                            Student Login
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            Enrolled
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Login with your Student ID (VIT-...) &amp; Password
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 flex items-center justify-center transition-colors shrink-0 shadow-xs">
                      <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>

                  {/* Option 2: Sign Up / New Admission */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("admission")}
                    className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white border-2 border-emerald-200/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-100 transition-all group flex items-center justify-between touch-manipulation active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-300 shrink-0 group-hover:scale-105 transition-transform">
                        <UserPlus size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                            Sign Up / New Admission
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            New Students
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Explore courses, fee structures &amp; get admitted
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 flex items-center justify-center transition-colors shrink-0 shadow-xs">
                      <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </div>

                {/* Direct quick action */}
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Need instant help?</span>
                  <a
                    href="tel:+918103170595"
                    className="font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 touch-manipulation"
                  >
                    <PhoneCall size={12} />
                    <span>+91 81031 70595</span>
                  </a>
                </div>
              </>
            ) : (
              /* New Admission / Sign Up Sub-View */
              <div>
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-4 touch-manipulation cursor-pointer"
                >
                  <span>← Back to options</span>
                </button>

                <div className="mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                    <UserPlus size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    New Admission &amp; Enrollment
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Admissions are managed through Vision IT Computer Institute. Connect with our admission desk directly:
                  </p>
                </div>

                <div className="space-y-3">
                  {/* WhatsApp Quick Chat */}
                  <a
                    href="https://wa.me/918103170595?text=Hello%20Vision%20IT,%20I%20would%20like%20to%20inquire%20about%20New%20Admission%20and%20Courses%20at%20Vision%20IT."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-between shadow-md shadow-emerald-200 transition-all touch-manipulation active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageCircle size={18} />
                      <span>Chat on WhatsApp</span>
                    </div>
                    <ExternalLink size={15} />
                  </a>

                  {/* Phone Helpline Call */}
                  <a
                    href="tel:+918103170595"
                    className="w-full p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-between shadow-md shadow-slate-200 transition-all touch-manipulation active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2.5">
                      <PhoneCall size={18} />
                      <span>Call Admission Helpline</span>
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-300">+91 81031 70595</span>
                  </a>

                  {/* Visit Official Website Inquiry */}
                  <a
                    href="https://visionitinstitute.com/inquiry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-sm flex items-center justify-between transition-all touch-manipulation active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2.5">
                      <School size={18} className="text-indigo-600" />
                      <span>Online Admission Form</span>
                    </div>
                    <ExternalLink size={15} className="text-slate-400" />
                  </a>
                </div>

                <div className="mt-5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900">
                  <p className="font-semibold">Already received your Student ID?</p>
                  <p className="text-indigo-700/80 mt-0.5">
                    Your login credentials are provided upon admission confirmation.
                  </p>
                  <Link
                    href="/login"
                    onClick={() => setIsSheetOpen(false)}
                    className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:underline mt-2 touch-manipulation"
                  >
                    <span>Go to Student Login →</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
