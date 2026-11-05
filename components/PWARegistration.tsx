"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;

    // Register service worker immediately during initial parse/mount without waiting for window.load
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      (window as any).serviceWorkerRegistration === undefined
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(function (registration) {
          (window as any).serviceWorkerRegistration = registration;

          // Automatically activate waiting service workers in background without interrupting the user
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                }
              });
            }
          });
        })
        .catch(function (err) {
          console.log("Service Worker registration failed: ", err);
        });
    }
  }, []);

  // Completely removed the "Naya Update Available!" banner UI
  return null;
}
