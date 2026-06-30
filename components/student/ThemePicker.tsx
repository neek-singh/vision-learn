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
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
        <Palette size={20} className="text-indigo-600 animate-pulse" /> Personalize Accent Theme
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        Select your preferred primary accent color to style your dashboard components, buttons, active navigation markers, and layout backgrounds.
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Indigo Option */}
        <button
          onClick={() => handleAccentChange("indigo")}
          className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl border-2 transition-all cursor-pointer ${
            accent === "indigo" 
              ? "border-indigo-600 bg-indigo-50/40 text-indigo-900 font-black scale-[1.02] shadow-md shadow-indigo-100" 
              : "border-slate-100 bg-slate-50 hover:bg-slate-100/70 text-slate-500 hover:text-slate-800"
          }`}
          aria-label="Set accent theme to Royal Indigo"
        >
          <span className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white shadow-md ring-2 ring-indigo-100" />
          <span className="text-xs uppercase font-extrabold tracking-wider">Royal Indigo</span>
        </button>
        
        {/* Emerald Option */}
        <button
          onClick={() => handleAccentChange("emerald")}
          className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl border-2 transition-all cursor-pointer ${
            accent === "emerald" 
              ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 font-black scale-[1.02] shadow-md shadow-emerald-100" 
              : "border-slate-100 bg-slate-50 hover:bg-slate-100/70 text-slate-500 hover:text-slate-800"
          }`}
          aria-label="Set accent theme to Emerald Green"
        >
          <span className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-md ring-2 ring-emerald-100" />
          <span className="text-xs uppercase font-extrabold tracking-wider">Emerald Green</span>
        </button>

        {/* Violet Option */}
        <button
          onClick={() => handleAccentChange("violet")}
          className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl border-2 transition-all cursor-pointer ${
            accent === "violet" 
              ? "border-violet-600 bg-violet-50/40 text-violet-900 font-black scale-[1.02] shadow-md shadow-violet-100" 
              : "border-slate-100 bg-slate-50 hover:bg-slate-100/70 text-slate-500 hover:text-slate-800"
          }`}
          aria-label="Set accent theme to Electric Violet"
        >
          <span className="w-6 h-6 rounded-full bg-violet-600 border-2 border-white shadow-md ring-2 ring-violet-100" />
          <span className="text-xs uppercase font-extrabold tracking-wider">Electric Violet</span>
        </button>

        {/* Orange Option */}
        <button
          onClick={() => handleAccentChange("orange")}
          className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl border-2 transition-all cursor-pointer ${
            accent === "orange" 
              ? "border-orange-600 bg-orange-50/40 text-orange-900 font-black scale-[1.02] shadow-md shadow-orange-100" 
              : "border-slate-100 bg-slate-50 hover:bg-slate-100/70 text-slate-500 hover:text-slate-800"
          }`}
          aria-label="Set accent theme to Sunrise Amber"
        >
          <span className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white shadow-md ring-2 ring-orange-100" />
          <span className="text-xs uppercase font-extrabold tracking-wider">Sunrise Amber</span>
        </button>
      </div>
    </div>
  );
}
