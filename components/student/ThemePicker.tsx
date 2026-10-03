"use client";

import { useState, useEffect } from "react";
import { Palette, Check } from "lucide-react";

const ACCENT_OPTIONS = [
  { id: "indigo", name: "Royal Indigo", bgClass: "bg-indigo-600", ringClass: "ring-indigo-600" },
  { id: "emerald", name: "Emerald Green", bgClass: "bg-emerald-600", ringClass: "ring-emerald-600" },
  { id: "violet", name: "Electric Violet", bgClass: "bg-violet-600", ringClass: "ring-violet-600" },
  { id: "orange", name: "Sunrise Amber", bgClass: "bg-orange-500", ringClass: "ring-orange-500" },
] as const;

type AccentType = (typeof ACCENT_OPTIONS)[number]["id"];

export function ThemePicker() {
  const [accent, setAccent] = useState<AccentType>("indigo");

  useEffect(() => {
    const savedAccent = localStorage.getItem("vision_dashboard_accent") as AccentType;
    if (savedAccent && ACCENT_OPTIONS.some((o) => o.id === savedAccent)) {
      setAccent(savedAccent);
    }
  }, []);

  const handleAccentChange = (newAccent: AccentType) => {
    setAccent(newAccent);
    localStorage.setItem("vision_dashboard_accent", newAccent);
    window.dispatchEvent(new Event("vision_theme_change"));
  };

  const activeOption = ACCENT_OPTIONS.find((o) => o.id === accent) || ACCENT_OPTIONS[0];

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-center">
      <div className="flex items-center justify-between gap-3">
        {/* Left Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Palette size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900">Dashboard Accent</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              Active: <span className="font-semibold text-slate-600">{activeOption.name}</span>
            </p>
          </div>
        </div>

        {/* Right Color Swatches */}
        <div className="flex items-center gap-2 shrink-0">
          {ACCENT_OPTIONS.map((opt) => {
            const isActive = accent === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleAccentChange(opt.id)}
                title={opt.name}
                aria-label={`Set theme to ${opt.name}`}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${opt.bgClass} flex items-center justify-center transition-all cursor-pointer active:scale-90 hover:scale-105 ${
                  isActive
                    ? `ring-2 ring-offset-2 ring-slate-800 scale-105 shadow-xs`
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                {isActive && (
                  <Check size={13} className="text-white" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ThemePicker;
