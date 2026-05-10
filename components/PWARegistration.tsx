"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;

    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      (window as any).serivceWorkerRegistration === undefined
    ) {
      window.addEventListener("load", function () {
        navigator.serviceWorker
          .register("/sw.js")
          .then(function (registration) {
            console.log("Service Worker registration successful with scope: ", registration.scope);
          })
          .catch(function (err) {
            console.log("Service Worker registration failed: ", err);
          });
      });
    }
  }, []);


  return null;
}
