"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard section error caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
        <AlertTriangle size={30} />
      </div>

      <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Section Failed to Load</h2>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        An error occurred while loading this section of the dashboard. Your other tabs and offline data remain safe.
      </p>

      {error?.digest && (
        <p className="text-[11px] font-mono text-slate-400 bg-slate-100 py-1 px-3 rounded-lg border border-slate-200 mb-6">
          Digest: {error.digest}
        </p>
      )}

      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer"
      >
        <RefreshCw size={16} />
        Retry Loading
      </button>
    </div>
  );
}
