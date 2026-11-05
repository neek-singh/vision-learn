"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    try {
      // Check if user has already seen splash in current session
      const alreadySeen = sessionStorage.getItem("vision_learn_splash_seen");
      if (alreadySeen) {
        return;
      }

      // Mark as seen for this browser session
      sessionStorage.setItem("vision_learn_splash_seen", "true");
      setMounted(true);

      // Trigger smooth fade out after 1.15 seconds
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, 1150);

      // Completely unmount after fade transition finishes (1.55s total)
      const unmountTimer = setTimeout(() => {
        setMounted(false);
      }, 1550);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    } catch {
      // In case private browsing blocks sessionStorage
      setMounted(false);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between py-14 px-6 select-none bg-white transition-all duration-400 ease-out ${
        isFading ? "opacity-0 scale-[1.03] pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Top spacer to balance vertical alignment */}
      <div className="w-full h-8" />

      {/* Center Animated Logo with Soft Glowing Aura */}
      <div className="relative flex flex-col items-center justify-center animate-splash-pop">
        {/* Ambient glowing radial backdrop */}
        <div className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-indigo-200/60 via-sky-100/40 to-transparent blur-2xl animate-pulse pointer-events-none" />

        {/* Squircle App Icon matching Android PWA */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] bg-white p-3 shadow-2xl shadow-indigo-500/15 border border-slate-100 flex items-center justify-center overflow-hidden animate-splash-pulse">
          <img
            src="/icons/icon-192.png"
            alt="Vision Learn Logo"
            className="w-full h-full object-contain"
            loading="eager"
            decoding="sync"
          />
        </div>
      </div>

      {/* Bottom Branding & Animated Progress Shimmer */}
      <div className="flex flex-col items-center justify-center space-y-2 pb-6">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
          Vision Learn
        </h1>
        <p className="text-[10px] font-bold text-slate-400 tracking-[0.22em] uppercase leading-none mt-1">
          Center for Excellence & Learning
        </p>

        {/* Minimalist 3px Shimmer Progress Indicator */}
        <div className="w-36 h-1 bg-slate-100 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 rounded-full animate-splash-bar" />
        </div>
      </div>
    </div>
  );
}
