"use client";

import { useState, useMemo, memo } from "react";
import { 
  Bell, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Clock, 
  Check, 
  Trash2, 
  MailOpen, 
  Loader2,
  CheckCheck
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

interface UserNotification {
  id: string;
  is_read: boolean;
  created_at: string;
  notifications?: any;
}

export default function StudentNotificationsClient({
  initialData = [],
  studentId,
}: {
  initialData: any[];
  studentId: string;
}) {
  const [notifications, setNotifications] = useState<UserNotification[]>(initialData);
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const supabase = createClient();

  const markAsRead = async (id: string) => {
    setLoading(id);
    const { error } = await supabase
      .from("user_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
    setLoading(null);
  };

  const deleteNotification = async (id: string) => {
    if (!confirm("Remove this notification from your inbox?")) return;
    setLoading(id);
    const { error } = await supabase
      .from("user_notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
    setLoading(null);
  };

  const markAllRead = async () => {
    setLoading("all");
    const { error } = await supabase
      .from("user_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", studentId)
      .eq("is_read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
    setLoading(null);
  };

  const NOTIF_STYLES: Record<string, { color: string; bg: string; icon: any; border: string }> = {
    info: { color: "text-blue-600", bg: "bg-blue-50", icon: Info, border: "border-blue-100" },
    success: { color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle, border: "border-emerald-100" },
    warning: { color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle, border: "border-amber-100" },
    alert: { color: "text-rose-600", bg: "bg-rose-50", icon: AlertCircle, border: "border-rose-100" },
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.is_read);
    }
    return notifications;
  }, [notifications, filter]);

  const formatTimestamp = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString([], { month: "numeric", day: "numeric", year: "numeric" });
    return `${time}, ${date}`;
  };

  return (
    <div className="space-y-3.5">
      {/* ── Compact Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Notification Inbox
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200/60 animate-pulse">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Official messages and updates from Vision Institute
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={loading === "all"}
            aria-label="Mark all notifications as read"
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 hover:bg-indigo-100 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            {loading === "all" ? (
              <Loader2 className="animate-spin" size={13} />
            ) : (
              <CheckCheck size={14} />
            )}
            <span className="hidden sm:inline">Mark all read</span>
            <span className="sm:hidden">All Read</span>
          </button>
        )}
      </div>

      {/* ── Filter Strip ── */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            filter === "all"
              ? "bg-slate-900 text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            filter === "unread"
              ? "bg-indigo-600 text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* ── Compact Notification List ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Bell size={18} />
            </div>
            <p className="text-xs font-bold text-slate-700">
              {filter === "unread" ? "No unread notifications" : "Inbox is empty"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {filter === "unread"
                ? "You are all caught up!"
                : "We'll notify you when an update or announcement is posted."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((un) => {
              const notif = Array.isArray(un.notifications) ? un.notifications[0] : un.notifications;
              const notifType = (notif?.type || "info").toLowerCase();
              const style = NOTIF_STYLES[notifType] || NOTIF_STYLES.info;
              const Icon = style.icon;
              const isLoading = loading === un.id;

              return (
                <div
                  key={un.id}
                  className={`p-3.5 sm:px-4 sm:py-3.5 flex items-start gap-3 transition-colors ${
                    !un.is_read
                      ? "bg-indigo-50/25 hover:bg-indigo-50/40"
                      : "hover:bg-slate-50/70"
                  }`}
                >
                  {/* Compact Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg ${style.bg} ${style.color} border ${style.border} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon size={15} />
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider ${style.color}`}
                        >
                          {notif?.type || "Info"}
                        </span>
                        {!un.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block shrink-0" />
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatTimestamp(un.created_at)}
                        </span>
                      </div>

                      {/* Top Right Quick Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!un.is_read ? (
                          <button
                            onClick={() => markAsRead(un.id)}
                            disabled={isLoading}
                            title="Mark as read"
                            aria-label="Mark as read"
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/70 active:scale-90 transition-all"
                          >
                            {isLoading ? (
                              <Loader2 size={13} className="animate-spin text-indigo-600" />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>
                        ) : (
                          <span
                            title="Opened"
                            className="text-slate-300 p-1"
                          >
                            <MailOpen size={13} />
                          </span>
                        )}
                        <button
                          onClick={() => deleteNotification(un.id)}
                          disabled={isLoading}
                          title="Delete notification"
                          aria-label="Delete notification"
                          className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Notification Title */}
                    <h3
                      className={`text-xs sm:text-sm font-bold mt-1 ${
                        !un.is_read ? "text-slate-900" : "text-slate-700"
                      }`}
                    >
                      {notif?.title || "Notification"}
                    </h3>

                    {/* Notification Message */}
                    <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                      {notif?.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
