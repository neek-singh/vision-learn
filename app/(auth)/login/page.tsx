"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, AlertCircle, Loader2, User, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { clearAllOfflineData } from "@/lib/offline-store";

export default function LoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prefillId = params.get("studentId");
      if (prefillId) {
        setStudentId(prefillId);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid Student ID or Password.");
        setIsLoading(false);
        return;
      }

      // Purge any residual offline data from previous student to prevent data bleed on shared devices
      await clearAllOfflineData();

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Auth error:", err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-50" />
      </div>
      
      <div className="relative w-full max-w-sm">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 z-10">
          {/* Back Action */}
          <div className="mb-3 -mt-1">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:text-indigo-600 -ml-1 py-1 px-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
            >
              <ArrowLeft size={16} className="text-black" />
              <span>Back</span>
            </button>
          </div>

          <div className="mb-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 relative flex items-center justify-center mb-4">
              <Image 
                src="https://res.cloudinary.com/ddiooxxks/image/upload/f_auto,q_auto/logo_unnut8.png" 
                alt="Vision IT Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-semibold text-black tracking-tight mb-1">
              Vision Learn
            </h1>
            <p className="text-xs text-black font-normal">Access Your Learning Dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-3 text-xs bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-black ml-1 block">Student ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-black group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="VIT001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white outline-none transition-all font-normal text-sm text-black placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-black ml-1 block">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-black group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white outline-none transition-all font-normal text-sm text-black placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-black hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-base transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-black font-normal">
              Don&apos;t have an account?{" "}
              <Link
                href="/?signup=true"
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-black text-[11px] font-normal tracking-tight">
              Empowering Digital Skills
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
