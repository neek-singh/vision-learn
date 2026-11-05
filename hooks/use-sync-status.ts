'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { CacheManager } from '@/lib/cache-manager';

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [justReconnected, setJustReconnected] = useState<boolean>(false);

  // Safely query pending queue count from Dexie
  const pendingCount = useLiveQuery(
    async () => {
      try {
        return await db.sync_queue.count();
      } catch {
        return 0;
      }
    },
    [],
    0
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initial online status
    setIsOnline(navigator.onLine);

    // 2. Event listeners
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      CacheManager.syncPending().catch(() => {});

      // Clear "just reconnected" pill after 4 seconds
      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Periodic sync attempt if online
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        CacheManager.syncPending().catch(() => {});
      }
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    justReconnected,
    pendingCount: pendingCount || 0,
    isSyncing: (pendingCount || 0) > 0 && isOnline,
  };
}
