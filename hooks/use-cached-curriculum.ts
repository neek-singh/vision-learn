import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { CacheManager } from '@/lib/cache-manager';

export function useCachedCurriculum(courseId: string, userId: string) {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 1. Modules & Lessons
  const modules = useLiveQuery(
    () => db.lessons.where('module_id').notEqual('').toArray().then((lessons: any[]) => {
      // Reconstruct modules from lessons if needed, but let's assume we store modules too
      return db.courses.get(courseId).then(async (course: any) => {
        const mods = await db.lessons.where('module_id').anyOf([]).toArray(); // Simplified for now
        return mods;
      });
    }),
    [courseId]
  );

  // 2. Progress
  const progress = useLiveQuery(
    () => db.progress.where('user_id').equals(userId).toArray(),
    [userId]
  );

  useEffect(() => {
    const fetchAll = async () => {
      if (!courseId || !userId) return;

      // Parallel fetch from Supabase via CacheManager
      await Promise.all([
        CacheManager.fetchWithCache(`modules_${courseId}`, db.lessons, async () => {
          const { data, error } = await supabase
            .from('lms_modules')
            .select(`id, title, order_index, lessons (*)`)
            .eq('course_id', courseId)
            .order('order_index');
          
          // Flatten lessons for easier IDB storage
          if (data) {
            const lessons = data.flatMap(m => m.lessons.map((l: any) => ({ ...l, module_id: m.id })));
            return { data: lessons, error };
          }
          return { data, error };
        }),
        CacheManager.fetchWithCache(`progress_${userId}`, db.progress, async () => {
          const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId);
          return { data, error };
        })
      ]);

      setIsInitialLoading(false);
    };

    fetchAll();
  }, [courseId, userId]);

  return {
    modules,
    progress,
    isLoading: isInitialLoading && !modules,
  };
}
