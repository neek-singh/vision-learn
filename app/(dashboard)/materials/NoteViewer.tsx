"use client";

import { ArrowLeft, X } from "lucide-react";

interface NoteViewerProps {
  item: any;
  onClose: () => void;
}

export default function NoteViewer({ item, onClose }: NoteViewerProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in duration-300" role="dialog" aria-modal="true">
      {/* Simple Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            aria-label="Back to materials list"
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500 hover:text-slate-900 active:scale-90"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">{item.title}</h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">
              {item.courses?.title} • {item.duration || 'Reading Material'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            aria-label="Close note viewer"
            className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Simple Reading Area */}
      <div className="flex-1 overflow-y-auto bg-white scrollbar-hide py-12 px-6">
        <article className="max-w-3xl mx-auto">
          <div 
            className="prose prose-slate prose-lg max-w-none 
              prose-headings:font-black prose-headings:text-slate-900 prose-headings:tracking-tight
              prose-p:text-slate-600 prose-p:leading-relaxed prose-p:font-medium
              prose-strong:text-slate-900 prose-strong:font-black
              prose-img:rounded-[2rem] prose-img:shadow-xl
              prose-li:font-medium prose-li:text-slate-600"
            dangerouslySetInnerHTML={{ __html: item.code_content }}
          />
        </article>
      </div>
    </div>
  );
}
