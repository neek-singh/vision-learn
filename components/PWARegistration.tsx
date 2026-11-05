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
          // Pre-warm the offline cache with critical student pages
          if ("caches" in window) {
            caches.open("app-pages").then((cache) => {
              cache.addAll([
                "/dashboard",
                "/courses",
                "/attendance",
                "/fees",
                "/tests",
                "/offline"
              ]).catch(() => {});
            });
          }
        })
        .catch(function (err) {
          console.log("Service Worker registration failed: ", err);
        });
    }

    const handleOnline = () => {
      // Broadcast online event so components can revalidate
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("vision_online_reconnected"));
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // Completely removed the "Naya Update Available!" banner UI
  return null;
}
