"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Laptop,
  Award,
  Pencil,
  Brain,
  Lightbulb,
  Sparkles,
  Bookmark,
  FileText,
  Compass,
  Calculator,
} from "lucide-react";

export function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const alreadySeen = sessionStorage.getItem("vision_learn_splash_seen");
      if (alreadySeen) {
        setMounted(false);
        return;
      }

      // Smooth staged progress loading line
      const t1 = setTimeout(() => setProgress(45), 250);
      const t2 = setTimeout(() => setProgress(78), 650);
      const t3 = setTimeout(() => setProgress(100), 1050);

      // Trigger fade out after 1.25s
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
        sessionStorage.setItem("vision_learn_splash_seen", "true");
      }, 1250);

      // Unmount after fade completes
      const unmountTimer = setTimeout(() => {
        setMounted(false);
      }, 1650);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    } catch {
      setMounted(false);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div
      id="vision-learn-splash"
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between py-12 px-6 select-none bg-white overflow-hidden transition-all duration-400 ease-out ${
        isFading ? "opacity-0 scale-[1.02] pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* ── Background Floating Study-Related Icons ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-Left: Graduation Cap */}
        <div className="absolute top-10 left-6 sm:top-14 sm:left-14 text-indigo-400/25 animate-float-slow">
          <GraduationCap size={38} className="sm:w-12 sm:h-12" />
        </div>

        {/* Top-Right: Book Open */}
        <div className="absolute top-12 right-8 sm:top-16 sm:right-16 text-blue-400/25 animate-float-medium">
          <BookOpen size={36} className="sm:w-11 sm:h-11" />
        </div>

        {/* Upper-Center-Left: Laptop */}
        <div className="absolute top-28 left-20 sm:top-32 sm:left-36 text-sky-400/20 animate-float-fast">
          <Laptop size={28} className="sm:w-8 sm:h-8" />
        </div>

        {/* Upper-Right Accent: Sparkles */}
        <div className="absolute top-36 right-20 sm:top-40 sm:right-32 text-amber-400/30 animate-float-slow">
          <Sparkles size={24} className="sm:w-7 sm:h-7" />
        </div>

        {/* Middle-Left: Brain & Ideas */}
        <div className="absolute top-1/2 -translate-y-24 left-4 sm:left-12 text-violet-400/25 animate-float-medium">
          <Brain size={34} className="sm:w-10 sm:h-10" />
        </div>

        {/* Middle-Right: Lightbulb */}
        <div className="absolute top-1/2 -translate-y-20 right-5 sm:right-14 text-amber-400/30 animate-float-slow">
          <Lightbulb size={32} className="sm:w-9 sm:h-9" />
        </div>

        {/* Lower-Middle-Left: Pencil */}
        <div className="absolute bottom-48 left-8 sm:bottom-52 sm:left-24 text-emerald-400/25 animate-float-fast">
          <Pencil size={26} className="sm:w-8 sm:h-8" />
        </div>

        {/* Lower-Middle-Right: Award & Badge */}
        <div className="absolute bottom-44 right-8 sm:bottom-48 sm:right-24 text-indigo-400/25 animate-float-medium">
          <Award size={34} className="sm:w-10 sm:h-10" />
        </div>

        {/* Bottom-Left: Bookmark */}
        <div className="absolute bottom-16 left-6 sm:bottom-20 sm:left-16 text-blue-400/20 animate-float-slow">
          <Bookmark size={30} className="sm:w-8 sm:h-8" />
        </div>

        {/* Bottom-Center-Left: Calculator */}
        <div className="absolute bottom-24 left-1/3 text-slate-300/30 animate-float-fast hidden sm:block">
          <Calculator size={26} />
        </div>

        {/* Bottom-Center-Right: Compass */}
        <div className="absolute bottom-24 right-1/3 text-indigo-300/25 animate-float-slow hidden sm:block">
          <Compass size={28} />
        </div>

        {/* Bottom-Right: FileText */}
        <div className="absolute bottom-14 right-7 sm:bottom-20 sm:right-16 text-sky-400/25 animate-float-medium">
          <FileText size={32} className="sm:w-9 sm:h-9" />
        </div>

        {/* Subtle Ambient Radial Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-tr from-indigo-100/40 via-sky-100/30 to-transparent blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gradient-to-br from-violet-100/30 via-indigo-50/20 to-transparent blur-3xl" />
      </div>

      {/* Top spacer to balance vertical layout */}
      <div className="w-full h-4 relative z-10" />

      {/* ── Center Hero Section: App Icon + Branding ── */}
      <div className="relative z-10 flex flex-col items-center justify-center animate-splash-pop">
        {/* Soft Glowing Aura */}
        <div className="absolute w-44 h-44 rounded-full bg-indigo-500/10 blur-2xl animate-pulse pointer-events-none" />

        {/* App Squircle Icon Container */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-3 shadow-2xl shadow-indigo-600/15 border border-slate-100/90 flex items-center justify-center overflow-hidden animate-splash-pulse">
          <img
            src="/icons/icon-512.png"
            alt="Vision Learn Logo"
            className="w-full h-full object-contain drop-shadow-xs"
            loading="eager"
            decoding="sync"
          />
        </div>

        {/* App Title */}
        <div className="mt-5 text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
            Vision Learn
          </h1>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-[0.22em] uppercase leading-none">
            Institute of Excellence
          </p>
        </div>
      </div>

      {/* ── Bottom Section: Progress Line & Status ── */}
      <div className="relative z-10 w-full max-w-xs flex flex-col items-center justify-center space-y-3 pb-6">
        {/* Sleek Progress Line Bar */}
        <div className="w-48 sm:w-56 h-1.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Subtitle status label */}
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block" />
          <span>Setting up your learning workspace...</span>
        </div>
      </div>
    </div>
  );
}
