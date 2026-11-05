'use client';

import React from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useSyncStatus } from '@/hooks/use-sync-status';

export function SyncStatus() {
  const { isOnline, justReconnected, pendingCount, isSyncing } = useSyncStatus();

  // If online and not just reconnected and not actively syncing, render nothing
  if (isOnline && !justReconnected && !isSyncing) {
    return null;
  }

  return (
    <aside
      aria-label="Network and synchronization status"
      className="sticky top-13 z-20 w-full px-3 py-1.5 transition-all duration-300 animate-in fade-in slide-in-from-top-1"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        {!isOnline ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs font-semibold backdrop-blur-md shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <WifiOff size={13} className="text-amber-700 shrink-0" />
            <span>Offline Mode — Viewing saved records</span>
            {pendingCount > 0 && (
              <span className="text-[11px] font-normal text-amber-700/90 pl-1 border-l border-amber-300/60">
                {pendingCount} action{pendingCount > 1 ? 's' : ''} saved locally
              </span>
            )}
          </div>
        ) : isSyncing ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-900 text-xs font-semibold backdrop-blur-md shadow-xs">
            <RefreshCw size={13} className="animate-spin text-blue-600 shrink-0" />
            <span>Syncing offline updates to cloud...</span>
          </div>
        ) : justReconnected ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 text-xs font-semibold backdrop-blur-md shadow-xs">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <span>Back Online — Everything up to date</span>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
