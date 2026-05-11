import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { CacheManager } from '@/lib/cache-manager';

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(true); // Default to true, will update in useEffect
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  const pendingCount = useLiveQuery(() => db.sync_queue.count()) || 0;

  useEffect(() => {
    // 1. Initial online status
    setIsOnline(navigator.onLine);

    // 2. Event listeners
    const handleOnline = () => {
      setIsOnline(true);
      CacheManager.syncPending();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Periodic sync attempt if online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        CacheManager.syncPending();
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
    pendingCount,
    isSyncing: pendingCount > 0 && isOnline,
  };
}
