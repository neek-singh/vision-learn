import { db } from './db';
import { supabase } from './supabase';

export class CacheManager {
  /**
   * Generic fetcher with Stale-While-Revalidate logic
   */
  static async fetchWithCache<T>(
    key: string,
    table: { get: (key: string) => Promise<any>, bulkPut: (data: any[]) => Promise<any>, put: (data: any) => Promise<any>, name: string },
    supabaseQuery: () => Promise<{ data: any; error: any }>,
    options: { forceRefresh?: boolean; ttl?: number } = {}
  ): Promise<T | null> {
    const { forceRefresh = false, ttl = 3600000 } = options; // Default 1 hour TTL

    // 1. Check local cache
    const cached = await table.get(key);
    const now = Date.now();

    const isStale = !cached || (now - (cached.last_fetched || 0) > ttl);

    // 2. If forced refresh or stale, trigger background fetch
    if (forceRefresh || isStale) {
      this.triggerBackgroundFetch(key, table, supabaseQuery);
    }

    // 3. Return cached version immediately if available
    return cached as T;
  }

  private static async triggerBackgroundFetch(
    key: string,
    table: { bulkPut: (data: any[]) => Promise<any>, put: (data: any) => Promise<any>, name: string },
    supabaseQuery: () => Promise<{ data: any; error: any }>
  ) {
    try {
      const { data, error } = await supabaseQuery();
      if (error) throw error;

      if (data) {
        const dataToSave = Array.isArray(data) 
          ? data.map((item: any) => ({ ...item, last_fetched: Date.now() }))
          : { ...data, last_fetched: Date.now() };

        if (Array.isArray(dataToSave)) {
          await table.bulkPut(dataToSave);
        } else {
          await table.put(dataToSave);
        }
        
        console.log(`[CacheManager] Updated ${table.name} in background`);
      }
    } catch (err) {
      console.warn(`[CacheManager] Background fetch failed for ${key}:`, err);
    }
  }

  /**
   * Save progress with offline queueing
   */
  static async saveProgress(userId: string, lessonId: string, completed: boolean) {
    const id = `${userId}_${lessonId}`;
    const progressData = {
      id,
      user_id: userId,
      lesson_id: lessonId,
      completed,
      last_updated: new Date().toISOString(),
      is_synced: false
    };

    // 1. Save locally first
    await db.progress.put(progressData);

    // 2. Try to sync with Supabase
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          completed,
          last_watched_at: progressData.last_updated
        });

      if (error) throw error;

      // 3. If successful, mark as synced
      await db.progress.update(id, { is_synced: true });
    } catch (err) {
      // 4. If failed (offline), it stays is_synced: false
      console.warn('[CacheManager] Offline: Progress saved locally, will sync later.');
      await db.sync_queue.add({
        table: 'user_progress',
        action: 'UPSERT',
        data: { user_id: userId, lesson_id: lessonId, completed, last_watched_at: progressData.last_updated },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Manual sync trigger
   */
  static async syncPending() {
    const pending = await db.sync_queue.toArray();
    if (pending.length === 0) return;

    console.log(`[CacheManager] Syncing ${pending.length} pending items...`);

    for (const item of pending) {
      try {
        let error;
        if (item.table === 'user_progress') {
          const syncData = { ...item.data };
          if ('updated_at' in syncData) {
            syncData.last_watched_at = syncData.updated_at;
            delete syncData.updated_at;
          }
          const res = await supabase.from('user_progress').upsert(syncData);
          error = res.error;
        }

        if (!error) {
          await db.sync_queue.delete(item.id!);
          // If it was progress, also update the local table to mark as synced
          if (item.table === 'user_progress') {
            const id = `${item.data.user_id}_${item.data.lesson_id}`;
            await db.progress.update(id, { is_synced: true });
          }
        }
      } catch (err) {
        console.error('[CacheManager] Sync failed for item:', item, err);
        break; // Stop syncing if we hit a network error
      }
    }
  }
}
