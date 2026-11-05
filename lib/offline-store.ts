import { db } from './db';
import { CacheManager } from './cache-manager';

export const OFFLINE_KEYS = {
  PROFILE: 'vl_offline_profile',
  DASHBOARD: 'vl_offline_dashboard',
  ATTENDANCE: 'vl_offline_attendance',
  FEES: 'vl_offline_fees',
  COURSES: 'vl_offline_courses',
  TESTS: 'vl_offline_tests',
  CURRICULUM_PREFIX: 'vl_offline_curriculum_',
} as const;

/**
 * Synchronous write to LocalStorage with async backup to Dexie (IndexedDB)
 */
export function saveOfflineData(key: string, data: any): void {
  if (typeof window === 'undefined' || !data) return;

  // 1. Fast synchronous write to localStorage for instant hydration
  try {
    const serialized = JSON.stringify({
      data,
      timestamp: Date.now(),
    });
    window.localStorage.setItem(key, serialized);
  } catch (err) {
    // Handle QuotaExceededError or private browsing
    console.warn(`[OfflineStore] localStorage write failed for ${key}:`, err);
  }

  // 2. Durable asynchronous backup to Dexie IndexedDB
  try {
    db.metadata.put({
      key,
      value: {
        data,
        timestamp: Date.now(),
      },
    }).catch((dbErr) => {
      console.warn(`[OfflineStore] Dexie write failed for ${key}:`, dbErr);
    });
  } catch (err) {
    // Ignore Dexie errors if DB is closing/unsupported
  }
}

/**
 * Synchronous read from LocalStorage (0ms latency, zero render flicker)
 */
export function getOfflineData<T>(key: string, fallback: T | null = null): T | null {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed?.data as T) ?? fallback;
  } catch (err) {
    console.warn(`[OfflineStore] localStorage read failed for ${key}:`, err);
    return fallback;
  }
}

/**
 * Asynchronous read: checks LocalStorage first, then falls back to Dexie IndexedDB
 */
export async function getOfflineDataAsync<T>(key: string, fallback: T | null = null): Promise<T | null> {
  // Check localStorage first
  const syncData = getOfflineData<T>(key, null);
  if (syncData !== null) return syncData;

  // Fallback to IndexedDB
  if (typeof window === 'undefined') return fallback;

  try {
    const entry = await db.metadata.get(key);
    if (entry && entry.value && entry.value.data) {
      // Re-populate localStorage for faster subsequent reads
      try {
        window.localStorage.setItem(key, JSON.stringify(entry.value));
      } catch {}
      return entry.value.data as T;
    }
  } catch (err) {
    console.warn(`[OfflineStore] Dexie read failed for ${key}:`, err);
  }

  return fallback;
}

/**
 * Returns true if the browser currently reports online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Auto-sync trigger on reconnection
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineStore] Device came online — triggering background sync');
    CacheManager.syncPending().catch((err) => {
      console.warn('[OfflineStore] Background sync error:', err);
    });
  });
}
