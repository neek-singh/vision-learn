'use client';

import { useSyncStatus } from '@/hooks/use-sync-status';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SyncStatus() {
  const { isOnline, pendingCount, isSyncing } = useSyncStatus();

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-1.5">
        {isOnline ? (
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Wifi size={14} className="text-emerald-500" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest hidden sm:inline">Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <WifiOff size={14} className="text-rose-500" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest hidden sm:inline">Offline</span>
          </div>
        )}
      </div>

      <div className="w-px h-3 bg-slate-100" />

      <div className="flex items-center gap-1.5">
        {isSyncing ? (
          <div className="flex items-center gap-1.5 text-indigo-600">
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Syncing {pendingCount}</span>
          </div>
        ) : pendingCount > 0 ? (
          <div className="flex items-center gap-1.5 text-amber-500">
            <RefreshCw size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{pendingCount} Pending</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Synced</span>
          </div>
        )}
      </div>
    </div>
  );
}
