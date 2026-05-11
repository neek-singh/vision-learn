"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
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

    return () => {
      window.removeEventListener("load", registerSW);
    };
  }, []);


  return null;
}
