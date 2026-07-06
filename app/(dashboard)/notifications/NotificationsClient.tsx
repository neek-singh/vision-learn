"use client";

import { useState, useCallback, useMemo, memo } from "react";
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
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function StudentNotificationsClient({ initialData, studentId }: { initialData: any[], studentId: string }) {
  const [notifications, setNotifications] = useState(initialData);
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const markAsRead = async (id: string) => {
    setLoading(id);
    const { error } = await supabase
      .from("user_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
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
      setNotifications(prev => prev.filter(n => n.id !== id));
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
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
    setLoading(null);
  };

  const NOTIF_STYLES: any = {
    info: { color: "text-blue-700", bg: "bg-blue-50", icon: Info, border: "border-blue-100" },
    success: { color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle, border: "border-emerald-100" },
    warning: { color: "text-amber-700", bg: "bg-amber-50", icon: AlertTriangle, border: "border-amber-100" },
    alert: { color: "text-rose-700", bg: "bg-rose-50", icon: AlertCircle, border: "border-rose-100" },
  };

  // Memoized Notification Item for better performance and reduced re-renders
  const NotificationItem = memo(({ un, style, onRead, onDelete, isLoading }: any) => {
    const Icon = style.icon;
    return (
      <div 
        className={`group bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 relative overflow-hidden ${
          !un.is_read 
          ? "border-indigo-100 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-50" 
          : "border-slate-100 shadow-sm grayscale-[0.5] opacity-80 hover:grayscale-0 hover:opacity-100"
        }`}
      >
         <div className="flex gap-3 sm:gap-4">
            <div className={`w-11 h-11 sm:w-14 sm:h-14 ${style.bg} ${style.color} rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
              <Icon size={18} className="shrink-0" />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${style.color}`}>
                      {un.notifications?.type}
                    </span>
                    {!un.is_read && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0">
                         New Message
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                    <Clock size={10} className="shrink-0" />
                    <span>
                      {new Date(un.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(un.created_at).toLocaleDateString()}
                    </span>
                  </span>
               </div>
               
               <h4 className={`text-lg sm:text-xl font-black leading-tight ${!un.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                  {un.notifications?.title}
               </h4>
               <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  {un.notifications?.message}
               </p>

               <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-50">
                  <div className="flex gap-2">
                    {!un.is_read && (
                      <button 
                        onClick={() => onRead(un.id)}
                        disabled={isLoading}
                        aria-label="Mark notification as read"
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={12}/> : <Check size={12}/>}
                        Mark Read
                      </button>
                    )}
                    {un.is_read && (
                       <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                          <MailOpen size={12} className="shrink-0" /> Opened
                       </span>
                    )}
                  </div>
                  <button 
                    onClick={() => onDelete(un.id)}
                    aria-label="Delete notification"
                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                    title="Delete notification"
                  >
                    <Trash2 size={16} className="shrink-0" />
                  </button>
               </div>
            </div>
         </div>
      </div>
    );
  });

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Notification Inbox
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-rose-600 text-white text-xs font-black rounded-full shadow-sm">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Official messages and updates from Vision Institute.</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              disabled={loading === "all"}
              aria-label="Mark all notifications as read"
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100 active:scale-95"
            >
              {loading === "all" ? <Loader2 className="animate-spin" size={14}/> : <MailOpen size={14}/>}
              Mark all as Read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="p-24 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={40} className="text-slate-200" />
             </div>
             <h3 className="text-lg font-black text-slate-900">Your inbox is empty</h3>
             <p className="text-sm text-slate-500 max-w-xs mx-auto">No notifications found. We'll let you know when something comes up!</p>
          </div>
        ) : (
          notifications.map((un: any) => {
            const style = NOTIF_STYLES[un.notifications?.type] || NOTIF_STYLES.info;
            return (
              <NotificationItem 
                key={un.id} 
                un={un} 
                style={style} 
                onRead={markAsRead} 
                onDelete={deleteNotification}
                isLoading={loading === un.id}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
