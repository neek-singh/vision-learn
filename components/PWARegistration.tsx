"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import packageJson from "@/package.json";

export function PWARegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    // Check if user is the demo student to bypass the update notification
    fetch("/api/auth/profile")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.student_id === "VIT000STD000") {
          setIsDemoUser(true);
        }
      })
      .catch((err) => console.error("Error checking demo user profile:", err));

    if (process.env.NODE_ENV === 'development') return;

    const registerSW = () => {
      if (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        (window as any).serviceWorkerRegistration === undefined
      ) {
        navigator.serviceWorker
          .register("/sw.js")
          .then(function (registration) {
            console.log("Service Worker registration successful with scope: ", registration.scope);
            (window as any).serviceWorkerRegistration = registration;

            // 1. If there's already a waiting worker, show prompt
            if (registration.waiting) {
              setWaitingWorker(registration.waiting);
              setUpdateAvailable(true);
            }

            // 2. Check for updates on register
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed") {
                    // Only show update prompt if there was a previous active controller (already running version)
                    if (navigator.serviceWorker.controller) {
                      setWaitingWorker(newWorker);
                      setUpdateAvailable(true);
                    }
                  }
                });
              }
            });
          })
          .catch(function (err) {
            console.log("Service Worker registration failed: ", err);
          });
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }

    // 3. Listen to controller change event to reload page
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      window.removeEventListener("load", registerSW);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  };

  // Do not show update banner if update is not available, or if the user is the demo account
  if (!updateAvailable || isDemoUser) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[9999] w-[calc(100%-2rem)] md:w-96 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-slate-800/30 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl shadow-2xl p-4 flex gap-4 items-start">
        {/* Decorative subtle background gradient */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 dark:bg-indigo-500/20 blur-2xl rounded-full pointer-events-none" />
        
        {/* Icon Container */}
        <div className="shrink-0 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/30">
          <RefreshCw size={20} className="animate-spin [animation-duration:6s]" />
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Naya Update Available!</h4>
            <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-900/50">v{packageJson.version}</span>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Naye features aur improvements ko use karne ke liye abhi update karein.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm hover:shadow-indigo-500/20 cursor-pointer"
            >
              <RefreshCw size={12} className="animate-spin [animation-duration:3s]" />
              Update Now
            </button>
            <button
              onClick={() => setUpdateAvailable(false)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors active:scale-95 cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setUpdateAvailable(false)}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Dismiss update notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
