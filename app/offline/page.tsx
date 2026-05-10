'use client';

import React from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Illustration Area */}
        <div className="relative flex justify-center">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
            <WifiOff className="w-12 h-12 text-indigo-600" />
          </div>
          <div className="absolute top-0 right-1/4 w-4 h-4 bg-red-400 rounded-full animate-bounce" />
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            You're Offline
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            It looks like you've lost your connection. Don't worry, your progress is safe. Check your network and try again.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all active:scale-95"
          >
            <Home className="w-5 h-5" />
            Home
          </Link>
        </div>

        {/* Subtle Hint */}
        <p className="text-sm text-gray-400 italic">
          Tip: You can still access previously viewed lessons while offline!
        </p>
      </div>
    </div>
  );
}
