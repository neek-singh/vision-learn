"use client";

import React from "react";
import { WifiOff, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 p-8 flex justify-center">
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm animate-pulse">
            <WifiOff className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You're Offline</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Oops! It seems you've lost your connection. Don't worry, some of your learning content may still be available offline.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
            
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Vision Learn • Offline Mode
          </p>
        </div>
      </div>
    </div>
  );
}
