"use client";

import { useState, useEffect } from "react";
import { Palette } from "lucide-react";

export function ThemePicker() {
  const [accent, setAccent] = useState<"indigo" | "emerald" | "violet" | "orange">("indigo");

  useEffect(() => {
    const savedAccent = localStorage.getItem("vision_dashboard_accent");
    if (savedAccent && ["indigo", "emerald", "violet", "orange"].includes(savedAccent)) {
      setAccent(savedAccent as any);
    }
  }, []);

  const handleAccentChange = (newAccent: "indigo" | "emerald" | "violet" | "orange") => {
    setAccent(newAccent);
    localStorage.setItem("vision_dashboard_accent", newAccent);
    
    // Dispatch a custom event to notify other components instantly (if mounted on the same page)
    window.dispatchEvent(new Event("vision_theme_change"));
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
        <Palette size={15} className="text-indigo-600" /> Dashboard Accent Color
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        Choose your preferred accent color for active navigation tabs, buttons, and highlights across the portal.
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Indigo Option */}
        <button
          onClick={() => handleAccentChange("indigo")}
          className={`flex items-center sm:flex-col justify-center gap-2 py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
            accent === "indigo" 
              ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold shadow-xs" 
              : "border-slate-200/70 bg-slate-50/60 hover:bg-slate-100/70 text-slate-600"
          }`}
          aria-label="Set accent theme to Royal Indigo"
        >
          <span className="w-4 h-4 rounded-full bg-indigo-600 border border-white shadow-xs ring-1 ring-indigo-200 shrink-0" />
          <span className="text-[11px] font-semibold">Royal Indigo</span>
        </button>
        
        {/* Emerald Option */}
        <button
          onClick={() => handleAccentChange("emerald")}
          className={`flex items-center sm:flex-col justify-center gap-2 py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
            accent === "emerald" 
              ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold shadow-xs" 
              : "border-slate-200/70 bg-slate-50/60 hover:bg-slate-100/70 text-slate-600"
          }`}
          aria-label="Set accent theme to Emerald Green"
        >
          <span className="w-4 h-4 rounded-full bg-emerald-600 border border-white shadow-xs ring-1 ring-emerald-200 shrink-0" />
          <span className="text-[11px] font-semibold">Emerald Green</span>
        </button>

        {/* Violet Option */}
        <button
          onClick={() => handleAccentChange("violet")}
          className={`flex items-center sm:flex-col justify-center gap-2 py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
            accent === "violet" 
              ? "border-violet-600 bg-violet-50/50 text-violet-900 font-bold shadow-xs" 
              : "border-slate-200/70 bg-slate-50/60 hover:bg-slate-100/70 text-slate-600"
          }`}
          aria-label="Set accent theme to Electric Violet"
        >
          <span className="w-4 h-4 rounded-full bg-violet-600 border border-white shadow-xs ring-1 ring-violet-200 shrink-0" />
          <span className="text-[11px] font-semibold">Electric Violet</span>
        </button>

        {/* Orange Option */}
        <button
          onClick={() => handleAccentChange("orange")}
          className={`flex items-center sm:flex-col justify-center gap-2 py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
            accent === "orange" 
              ? "border-orange-500 bg-orange-50/50 text-orange-900 font-bold shadow-xs" 
              : "border-slate-200/70 bg-slate-50/60 hover:bg-slate-100/70 text-slate-600"
          }`}
          aria-label="Set accent theme to Sunrise Amber"
        >
          <span className="w-4 h-4 rounded-full bg-orange-500 border border-white shadow-xs ring-1 ring-orange-200 shrink-0" />
          <span className="text-[11px] font-semibold">Sunrise Amber</span>
        </button>
      </div>
    </div>
  );
}
