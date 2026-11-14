"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application runtime error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased text-slate-800">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
            <AlertTriangle size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Application Error</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              An unexpected system error occurred. We have logged the incident and our team is investigating.
            </p>
            {error?.digest && (
              <p className="text-[11px] font-mono text-slate-400 bg-slate-50 py-1 px-2 rounded-lg border border-slate-100 inline-block">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <RefreshCw size={16} />
              Reload Page
            </button>
            <a
              href="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Home size={16} />
              Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
