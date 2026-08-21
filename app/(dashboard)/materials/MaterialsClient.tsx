"use client";

import { useState, useMemo } from "react";
import { 
  FileText, 
  Video, 
  Download, 
  ExternalLink,
  BookOpen,
  X,
  ArrowLeft
} from "lucide-react";
import dynamic from "next/dynamic";

const NoteViewer = dynamic(() => import("./NoteViewer"), {
  loading: () => <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center animate-pulse">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Opening Note...</p>
    </div>
  </div>
});

export default function MaterialsClient({ 
  initialMaterials, 
  schedules, 
  activeBatch 
}: { 
  initialMaterials: any[], 
  schedules: any[], 
  activeBatch: string 
}) {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [viewingCode, setViewingCode] = useState<any>(null);

  const now = new Date();
  
  // 1. Filter by Schedule
  const scheduledTitles = useMemo(() => {
    const nowTime = now.getTime();
    const scheduledMaterials = schedules.filter(s => {
      const sBatch = s.batch?.trim().toLowerCase();
      const cleanActive = activeBatch?.trim().toLowerCase();
      const batchMatch = !sBatch || sBatch === "all batches" || sBatch === "all" || !cleanActive || sBatch === cleanActive;
      if (!batchMatch) return false;

      const timeStr = s.start_time?.includes(':') ? s.start_time : '00:00:00';
      const sDate = new Date(`${s.date}T${timeStr}`).getTime();
      return nowTime >= sDate;
    });
    return scheduledMaterials.map(s => s.title.toLowerCase());
  }, [schedules, activeBatch, now]);

  // 2. Apply Schedule Filter to initialMaterials
  const currentlyAvailableMaterials = useMemo(() => {
    return initialMaterials.filter((m: any) => {
      if (m.is_published === false) return false;

      // Check batches array
      if (m.batches && m.batches.length > 0) {
        const cleanActive = activeBatch ? activeBatch.toLowerCase().trim() : "";
        return m.batches.some((b: any) => {
          const bLower = b.trim().toLowerCase();
          return bLower === cleanActive || bLower === "all" || bLower === "all batches";
        });
      }

      // Check legacy batch column
      if (m.batch && m.batch !== "All Batches" && m.batch.trim().toLowerCase() !== "all") {
        const mBatch = m.batch.trim().toLowerCase();
        const cleanActive = activeBatch ? activeBatch.toLowerCase().trim() : "";
        return mBatch.includes(cleanActive) || cleanActive.includes(mBatch);
      }

      return true;
    });
  }, [initialMaterials, activeBatch]);



  const coursesList = useMemo(() => 
    Array.from(new Set(currentlyAvailableMaterials.map((m: any) => m.courses?.title))).filter(Boolean),
    [currentlyAvailableMaterials]
  );
  
  const filteredMaterials = useMemo(() => 
    selectedCourse === "all" 
      ? currentlyAvailableMaterials 
      : currentlyAvailableMaterials.filter((m: any) => m.courses?.title === selectedCourse),
    [selectedCourse, currentlyAvailableMaterials]
  );

  return (
    <div className="space-y-8">


      {!filteredMaterials || filteredMaterials.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <p className="text-slate-400 font-bold">No materials available for your current modules.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                  <th className="px-6 py-4">Material Name</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMaterials.map((item: any) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          item.type === 'pdf' ? 'bg-rose-50 text-rose-600 border-rose-100/50' : 
                          item.type === 'video' ? 'bg-indigo-50 text-indigo-650 border-indigo-100/50' : 
                          item.type === 'word' ? 'bg-blue-50 text-blue-600 border-blue-100/50' : 
                          item.type === 'excel' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 
                          item.type === 'powerpoint' ? 'bg-orange-50 text-orange-600 border-orange-100/50' : 
                          item.type === 'onenote' ? 'bg-purple-50 text-purple-600 border-purple-100/50' : 
                          item.type === 'canva' ? 'bg-pink-50 text-pink-600 border-pink-100/50' : 
                          item.type === 'notion' ? 'bg-slate-100 text-slate-750 border-slate-200/50' : 
                          item.type === 'windows' ? 'bg-sky-50 text-sky-600 border-sky-100/50' : 
                          (item.type === 'note' || item.type === 'notes' || item.type === 'code') ? 'bg-amber-50 text-amber-600 border-amber-100/50' :
                          'bg-slate-50 text-slate-500 border-slate-100/50'
                        }`}>
                          {item.type === 'pdf' ? <FileText size={18} /> : 
                           item.type === 'video' ? <Video size={18} /> : 
                           item.type === 'word' ? <FileText size={18} /> : 
                           item.type === 'excel' ? <FileText size={18} /> : 
                           item.type === 'powerpoint' ? <FileText size={18} /> : 
                           item.type === 'onenote' ? <FileText size={18} /> : 
                           item.type === 'canva' ? <FileText size={18} /> : 
                           item.type === 'notion' ? <FileText size={18} /> : 
                           item.type === 'windows' ? <FileText size={18} /> : 
                           (item.type === 'note' || item.type === 'notes' || item.type === 'code') ? <BookOpen size={18} /> :
                           <ExternalLink size={18} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{item.title}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                           {item.file_size || item.duration || (item.type !== 'note' && item.type !== 'code' ? item.type.toUpperCase() : '')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-bold text-slate-400">
                         {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(item.type === 'note' || item.type === 'notes' || item.type === 'code') && item.code_content ? (
                        <button 
                          onClick={() => setViewingCode(item)}
                          aria-label={`Read note: ${item.title}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                        >
                          <BookOpen size={12} />
                          Read Note
                        </button>
                      ) : (
                        <a 
                          href={item.content_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          aria-label={`${item.type === 'pdf' ? 'Download' : 'Open'} ${item.title}`}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all shadow-sm ${
                          item.type === 'pdf' 
                            ? 'bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}>
                          {item.type === 'pdf' ? <Download size={12} /> : <ExternalLink size={12} />}
                          {item.type === 'pdf' ? 'Download' : 'Open'}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-50">
            {filteredMaterials.map((item: any) => (
              <div key={item.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      item.type === 'pdf' ? 'bg-rose-50 text-rose-600 border-rose-100/50' : 
                      item.type === 'video' ? 'bg-indigo-50 text-indigo-650 border-indigo-100/50' : 
                      item.type === 'word' ? 'bg-blue-50 text-blue-600 border-blue-100/50' : 
                      item.type === 'excel' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 
                      item.type === 'powerpoint' ? 'bg-orange-50 text-orange-600 border-orange-100/50' : 
                      item.type === 'onenote' ? 'bg-purple-50 text-purple-600 border-purple-100/50' : 
                      item.type === 'canva' ? 'bg-pink-50 text-pink-600 border-pink-100/50' : 
                      item.type === 'notion' ? 'bg-slate-100 text-slate-750 border-slate-200/50' : 
                      item.type === 'windows' ? 'bg-sky-50 text-sky-600 border-sky-100/50' : 
                      (item.type === 'note' || item.type === 'notes' || item.type === 'code') ? 'bg-amber-50 text-amber-600 border-amber-100/50' :
                      'bg-slate-50 text-slate-500 border-slate-100/50'
                    }`}>
                      {item.type === 'pdf' ? <FileText size={18} /> : 
                       item.type === 'video' ? <Video size={18} /> : 
                       item.type === 'word' ? <FileText size={18} /> : 
                       item.type === 'excel' ? <FileText size={18} /> : 
                       item.type === 'powerpoint' ? <FileText size={18} /> : 
                       item.type === 'onenote' ? <FileText size={18} /> : 
                       item.type === 'canva' ? <FileText size={18} /> : 
                       item.type === 'notion' ? <FileText size={18} /> : 
                       item.type === 'windows' ? <FileText size={18} /> : 
                       (item.type === 'note' || item.type === 'notes' || item.type === 'code') ? <BookOpen size={18} /> :
                       <ExternalLink size={18} />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm leading-tight">{item.title}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {(item.type === 'note' || item.type === 'notes' || item.type === 'code') && item.code_content ? (
                      <button 
                        onClick={() => setViewingCode(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl active:scale-95 transition-all text-xs font-bold border border-amber-200/50"
                        aria-label="Read Note"
                      >
                        <BookOpen size={12} />
                        <span>Read</span>
                      </button>
                    ) : (
                      <a 
                        href={item.content_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl active:scale-95 transition-all text-xs font-bold border ${
                          item.type === 'pdf' 
                            ? 'bg-slate-100 text-slate-700 border-slate-200/55' 
                            : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700 shadow-sm shadow-blue-105'
                        }`}
                        aria-label="Open Material"
                      >
                        {item.type === 'pdf' ? <Download size={12} /> : <ExternalLink size={12} />}
                        <span>{item.type === 'pdf' ? 'Get' : 'Open'}</span>
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                   <span className="text-[10px] font-bold text-slate-400">
                     {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                   </span>
                   <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
                     {item.file_size || item.duration || (item.type !== 'note' && item.type !== 'code' ? item.type.toUpperCase() : 'NOTE')}
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Screen Note Viewer */}
      {viewingCode && (
        <NoteViewer 
          item={viewingCode} 
          onClose={() => setViewingCode(null)} 
        />
      )}
    </div>
  );
}
