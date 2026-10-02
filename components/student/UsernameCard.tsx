"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Check, X, Loader2, Pencil } from "lucide-react";

interface UsernameCardProps {
  userId?: string;
  initialUsername?: string;
}

export function UsernameCard({ initialUsername = "" }: UsernameCardProps) {
  const router = useRouter();
  const [username, setUsername] = useState<string>(initialUsername);
  const [editVal, setEditVal] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // If initialUsername wasn't provided or changed, update state
  useEffect(() => {
    if (initialUsername) {
      setUsername(initialUsername);
    } else {
      // Fetch from profile API if not passed from server
      fetch("/api/auth/profile")
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data?.username) setUsername(data.username);
        })
        .catch(() => {});
    }
  }, [initialUsername]);

  // Real-time availability check
  useEffect(() => {
    const trimmed = editVal.trim().toLowerCase();
    if (!editing || !trimmed || trimmed === username.toLowerCase()) {
      setAvailable(null);
      return;
    }
    if (trimmed.length < 3) {
      setAvailable(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await fetch(`/api/user/username?check=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setAvailable(data.available === true);
        } else {
          setAvailable(null);
        }
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [editVal, editing, username]);

  const validateUsername = (val: string) => {
    if (val.length < 3) return "Min 3 characters required";
    if (val.length > 20) return "Max 20 characters allowed";
    if (!/^[a-z0-9_]+$/.test(val)) return "Only lowercase letters, numbers, and underscore allowed";
    return null;
  };

  const handleSave = async () => {
    const val = editVal.trim().toLowerCase();
    const err = validateUsername(val);
    if (err) { setError(err); return; }
    if (available === false) { setError("Username already taken"); return; }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: val }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save username");
      } else {
        setUsername(data.username);
        setEditing(false);
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e: any) {
      setError(e.message || "Failed to save username. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setEditVal(username);
    setEditing(true);
    setError(null);
    setAvailable(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditVal(username);
    setError(null);
    setAvailable(null);
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs md:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <AtSign size={15} className="text-indigo-600" /> Chat Username
        </h3>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
            <Check size={12} /> Saved!
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
        Set your unique <span className="font-semibold text-indigo-600">@username</span> so classmates and teachers can search and message you in LMS Chat.
      </p>

      {!editing ? (
        <div className="flex items-center gap-2.5">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl">
            <AtSign size={14} className="text-indigo-500 shrink-0" />
            <span className={`text-xs sm:text-sm font-semibold ${username ? "text-slate-800" : "text-slate-400 italic"}`}>
              {username ? `@${username}` : "No username set yet"}
            </span>
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95"
          >
            <Pencil size={12} />
            {username ? "Change" : "Set"}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-indigo-500 font-bold text-xs">
              <AtSign size={14} />
            </div>
            <input
              type="text"
              value={editVal}
              onChange={e => {
                setEditVal(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                setError(null);
                setAvailable(null);
              }}
              onKeyDown={e => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") cancelEdit();
              }}
              placeholder="e.g. surekha_26"
              maxLength={20}
              autoFocus
              className={`w-full pl-8 pr-10 py-2 rounded-xl border text-xs sm:text-sm font-semibold outline-none transition-all ${
                error
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : available === true
                  ? "border-emerald-300 bg-emerald-50 text-slate-800"
                  : available === false
                  ? "border-rose-300 bg-rose-50 text-slate-800"
                  : "border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-400 focus:bg-white"
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checking && <Loader2 size={13} className="animate-spin text-slate-400" />}
              {!checking && available === true && <Check size={14} className="text-emerald-500 stroke-[3]" />}
              {!checking && available === false && <X size={14} className="text-rose-500 stroke-[3]" />}
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div>
              {error ? (
                <p className="text-[10px] font-semibold text-rose-500">{error}</p>
              ) : available === true ? (
                <p className="text-[10px] font-semibold text-emerald-600">✓ @{editVal} is available!</p>
              ) : available === false ? (
                <p className="text-[10px] font-semibold text-rose-500">✗ @{editVal} is already taken</p>
              ) : editVal.length >= 3 ? (
                <p className="text-[10px] text-slate-400">Checking availability...</p>
              ) : (
                <p className="text-[10px] text-slate-400">3–20 chars · lowercase letters, numbers, underscore</p>
              )}
            </div>
            <span className="text-[10px] font-semibold text-slate-400">{editVal.length}/20</span>
          </div>

          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || available === false || editVal.trim().length < 3}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all active:scale-95"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Save Username
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {username && !editing && (
        <p className="text-[10px] text-slate-400 mt-2.5 px-0.5">
          💡 Other users can find and message you in Chat by searching <span className="font-semibold text-indigo-600">@{username}</span>
        </p>
      )}
    </div>
  );
}

export default UsernameCard;
