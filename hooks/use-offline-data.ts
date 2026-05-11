import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CacheManager } from '@/lib/cache-manager';

export function useOfflineData<T>(
  key: string,
  table: { get: (key: string) => Promise<any>, bulkPut: (data: any[]) => Promise<any>, put: (data: any) => Promise<any>, name: string },
  supabaseQuery: () => Promise<{ data: any; error: any }>,
  options: { ttl?: number; enabled?: boolean } = {}
) {
  const { ttl, enabled = true } = options;
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Live query from IndexedDB
  const cachedData = useLiveQuery(
    async () => {
      if (!enabled) return null;
      return await table.get(key);
    },
    [key, enabled]
  );

  // 2. Trigger fetch on mount/key change
  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      setIsSyncing(true);
      await CacheManager.fetchWithCache(key, table, supabaseQuery, { ttl });
      setIsSyncing(false);
    };

    fetchData();
  }, [key, enabled, ttl]);

  return {
    data: cachedData as T | null,
    isLoading: !cachedData && isSyncing,
    isSyncing,
  };
}
