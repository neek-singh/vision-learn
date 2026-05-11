'use client';

import { useState } from 'react';
import { Download, Check, Loader2, CloudDownload } from 'lucide-react';
import { CacheManager } from '@/lib/cache-manager';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface DownloadButtonProps {
  courseId: string;
  courseTitle: string;
}

export function DownloadButton({ courseId, courseTitle }: DownloadButtonProps) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    setStatus('downloading');
    setProgress(10);

    try {
      // 1. Fetch all modules and lessons
      const { data: modules, error } = await supabase
        .from('lms_modules')
        .select(`id, title, lessons (*)`)
        .eq('course_id', courseId);

      if (error) throw error;
      setProgress(40);

      // 2. Save to Dexie
      if (modules) {
        const lessons = modules.flatMap(m => m.lessons.map((l: any) => ({ ...l, module_id: m.id, last_fetched: Date.now() })));
        await db.lessons.bulkPut(lessons);
        
        await db.courses.put({
          id: courseId,
          title: courseTitle,
          course_code: '', // Can be improved
          description: '',
          last_fetched: Date.now()
        });
      }
      setProgress(70);

      // 3. Pre-fetch assets (Thumbnails, PDFs etc.)
      // In a real app, you'd find URLs in lesson content and fetch them
      // For now, let's simulate pre-fetching
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProgress(100);
      setStatus('completed');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Download failed:', err);
      setStatus('error');
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={status === 'downloading'}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300
        ${status === 'idle' ? 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600' : ''}
        ${status === 'downloading' ? 'bg-indigo-50 text-indigo-600 cursor-wait' : ''}
        ${status === 'completed' ? 'bg-emerald-50 text-emerald-600' : ''}
        ${status === 'error' ? 'bg-rose-50 text-rose-600' : ''}
      `}
    >
      {status === 'idle' && (
        <>
          <CloudDownload size={14} />
          Offline Access
        </>
      )}
      {status === 'downloading' && (
        <>
          <Loader2 size={14} className="animate-spin" />
          Downloading {progress}%
        </>
      )}
      {status === 'completed' && (
        <>
          <Check size={14} />
          Saved Offline
        </>
      )}
      {status === 'error' && (
        <>
          <CloudDownload size={14} />
          Retry
        </>
      )}

      {status === 'downloading' && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-600 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
      )}
    </button>
  );
}
