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

  useEffect(() => {
    if (initialUsername) {
      setUsername(initialUsername);
    } else {
      fetch("/api/auth/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
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
    if (!/^[a-z0-9_]+$/.test(val)) return "Only lowercase letters, numbers & underscore allowed";
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
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs transition-all flex flex-col justify-center">
      {/* View Mode (Compact Inline Header) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <AtSign size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900">Chat Username</h3>
              {saved && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 flex items-center gap-1">
                  <Check size={10} /> Saved
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {username ? (
                <span>
                  <strong className="text-indigo-600 font-bold">@{username}</strong> · Searchable in LMS Chat
                </span>
              ) : (
                "Set a username to receive chat messages"
              )}
            </p>
          </div>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200/70 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95"
          >
            <Pencil size={11} />
            <span>{username ? "Change" : "Set"}</span>
          </button>
        )}
      </div>

      {/* Edit Mode (Expands Inline) */}
      {editing && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-xs pointer-events-none">
                @
              </span>
              <input
                type="text"
                value={editVal}
                onChange={(e) => {
                  setEditVal(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                  setError(null);
                  setAvailable(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") cancelEdit();
                }}
                placeholder="username"
                maxLength={20}
                autoFocus
                className={`w-full pl-7 pr-8 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold outline-none transition-all ${
                  error
                    ? "border-rose-300 bg-rose-50/50 text-rose-700"
                    : available === true
                    ? "border-emerald-300 bg-emerald-50/50 text-slate-800"
                    : available === false
                    ? "border-rose-300 bg-rose-50/50 text-slate-800"
                    : "border-slate-200 bg-slate-50/70 text-slate-800 focus:border-indigo-400 focus:bg-white"
                }`}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {checking && <Loader2 size={12} className="animate-spin text-slate-400" />}
                {!checking && available === true && <Check size={13} className="text-emerald-500 stroke-[3]" />}
                {!checking && available === false && <X size={13} className="text-rose-500 stroke-[3]" />}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || available === false || editVal.trim().length < 3}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shrink-0"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <div>
              {error ? (
                <p className="text-[10px] font-semibold text-rose-500">{error}</p>
              ) : available === true ? (
                <p className="text-[10px] font-semibold text-emerald-600">✓ @{editVal} is available</p>
              ) : available === false ? (
                <p className="text-[10px] font-semibold text-rose-500">✗ @{editVal} is taken</p>
              ) : editVal.length >= 3 ? (
                <p className="text-[10px] text-slate-400">Checking availability...</p>
              ) : (
                <p className="text-[10px] text-slate-400">3–20 chars · lowercase letters, numbers, _</p>
              )}
            </div>
            <span className="text-[10px] font-semibold text-slate-400">{editVal.length}/20</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsernameCard;
