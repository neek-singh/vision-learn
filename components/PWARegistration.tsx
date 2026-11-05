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
          // Resilient pre-warming of critical student pages (independent caching so one failure doesn't abort others)
          if ("caches" in window && navigator.onLine) {
            caches.open("app-pages").then((cache) => {
              const pagesToWarm = [
                "/dashboard",
                "/courses",
                "/attendance",
                "/fees",
                "/tests",
                "/curriculum",
                "/offline"
              ];
              pagesToWarm.forEach((url) => {
                fetch(url, { credentials: "same-origin" })
                  .then((response) => {
                    if (response.ok) {
                      cache.put(url, response);
                    }
                  })
                  .catch(() => {});
              });
            });
          }
        })
        .catch(function (err) {
          console.log("Service Worker registration failed: ", err);
        });
    }

    // Check for Service Worker updates whenever app is brought to foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && "serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update().catch(() => {});
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleOnline = () => {
      // Broadcast online event so components can revalidate
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("vision_online_reconnected"));
      }
    };
    window.addEventListener("online", handleOnline);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Completely removed the "Naya Update Available!" banner UI
  return null;
}
