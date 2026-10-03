"use client";

import { useState, useMemo } from "react";
import { 
  FileText, 
  Video, 
  Download, 
  ExternalLink,
  BookOpen,
  Search,
  X,
  FileSpreadsheet,
  Presentation,
  Filter
} from "lucide-react";
import dynamic from "next/dynamic";

const NoteViewer = dynamic(() => import("./NoteViewer"), {
  loading: () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">Opening Note...</p>
      </div>
    </div>
  )
});

function getTypeConfig(type: string = "") {
  const t = type.toLowerCase().trim();
  switch (t) {
    case "excel":
    case "sheets":
    case "sheet":
      return {
        label: "EXCEL",
        Icon: FileSpreadsheet,
        badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
        iconCls: "bg-emerald-50 text-emerald-600 border-emerald-200/70",
      };
    case "word":
    case "doc":
    case "docx":
      return {
        label: "WORD",
        Icon: FileText,
        badgeCls: "bg-blue-50 text-blue-700 border-blue-200/70",
        iconCls: "bg-blue-50 text-blue-600 border-blue-200/70",
      };
    case "powerpoint":
    case "ppt":
    case "pptx":
      return {
        label: "PPT",
        Icon: Presentation,
        badgeCls: "bg-orange-50 text-orange-700 border-orange-200/70",
        iconCls: "bg-orange-50 text-orange-600 border-orange-200/70",
      };
    case "pdf":
      return {
        label: "PDF",
        Icon: FileText,
        badgeCls: "bg-rose-50 text-rose-700 border-rose-200/70",
        iconCls: "bg-rose-50 text-rose-600 border-rose-200/70",
      };
    case "video":
      return {
        label: "VIDEO",
        Icon: Video,
        badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
        iconCls: "bg-indigo-50 text-indigo-600 border-indigo-200/70",
      };
    case "onenote":
      return {
        label: "ONENOTE",
        Icon: BookOpen,
        badgeCls: "bg-purple-50 text-purple-700 border-purple-200/70",
        iconCls: "bg-purple-50 text-purple-600 border-purple-200/70",
      };
    case "canva":
      return {
        label: "CANVA",
        Icon: FileText,
        badgeCls: "bg-pink-50 text-pink-700 border-pink-200/70",
        iconCls: "bg-pink-50 text-pink-600 border-pink-200/70",
      };
    case "windows":
      return {
        label: "WINDOWS",
        Icon: FileText,
        badgeCls: "bg-sky-50 text-sky-700 border-sky-200/70",
        iconCls: "bg-sky-50 text-sky-600 border-sky-200/70",
      };
    case "note":
    case "notes":
    case "code":
      return {
        label: "NOTES",
        Icon: BookOpen,
        badgeCls: "bg-amber-50 text-amber-800 border-amber-200/70",
        iconCls: "bg-amber-50 text-amber-600 border-amber-200/70",
      };
    default:
      return {
        label: t.toUpperCase() || "DOC",
        Icon: FileText,
        badgeCls: "bg-slate-100 text-slate-700 border-slate-200/70",
        iconCls: "bg-slate-100 text-slate-600 border-slate-200/70",
      };
  }
}

export default function MaterialsClient({ 
  initialMaterials, 
  schedules, 
  activeBatch 
}: { 
  initialMaterials: any[], 
  schedules: any[], 
  activeBatch: string 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [viewingCode, setViewingCode] = useState<any>(null);

  // Filter available materials
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

  // Unique types present in materials for quick filter pills
  const availableTypes = useMemo(() => {
    const typesMap = new Map<string, number>();
    currentlyAvailableMaterials.forEach((m: any) => {
      const typeKey = (m.type || "other").toLowerCase().trim();
      const cfg = getTypeConfig(typeKey);
      typesMap.set(cfg.label, (typesMap.get(cfg.label) || 0) + 1);
    });
    return Array.from(typesMap.entries());
  }, [currentlyAvailableMaterials]);

  // Combined search & type filter
  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return currentlyAvailableMaterials.filter((m: any) => {
      const cfg = getTypeConfig(m.type);
      if (selectedType !== "all" && cfg.label !== selectedType) {
        return false;
      }
      if (!q) return true;
      const titleMatch = (m.title || "").toLowerCase().includes(q);
      const courseMatch = (m.courses?.title || "").toLowerCase().includes(q);
      const typeMatch = cfg.label.toLowerCase().includes(q);
      return titleMatch || courseMatch || typeMatch;
    });
  }, [currentlyAvailableMaterials, selectedType, searchQuery]);

  const handleCardClick = (item: any) => {
    const isCodeNote = (item.type === 'note' || item.type === 'notes' || item.type === 'code') && item.code_content;
    if (isCodeNote) {
      setViewingCode(item);
    } else if (item.content_url) {
      window.open(item.content_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-3">
      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, shortcuts, formulas..."
            className="w-full pl-8.5 pr-8 py-2 text-xs bg-white rounded-xl border border-slate-200/80 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        {availableTypes.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            <button
              onClick={() => setSelectedType("all")}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                selectedType === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70"
              }`}
            >
              All ({currentlyAvailableMaterials.length})
            </button>
            {availableTypes.map(([label, count]) => (
              <button
                key={label}
                onClick={() => setSelectedType(label)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedType === label
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
          <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-2.5 border border-slate-100">
            <BookOpen size={20} />
          </div>
          <p className="text-xs font-bold text-slate-700">No materials found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {searchQuery ? "Try searching with different keywords" : "No materials available for your current modules."}
          </p>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSelectedType("all"); }}
              className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {filteredMaterials.map((item: any) => {
            const config = getTypeConfig(item.type);
            const { Icon } = config;
            const isCodeNote = (item.type === 'note' || item.type === 'notes' || item.type === 'code') && item.code_content;
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : "";

            return (
              <div 
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="w-full min-w-0 bg-white rounded-xl border border-slate-200/75 hover:border-indigo-300 hover:shadow-2xs active:scale-[0.99] transition-all p-2.5 sm:p-3 flex items-center justify-between gap-2.5 cursor-pointer group"
              >
                {/* Left: Compact Icon */}
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border transition-transform group-hover:scale-105 ${config.iconCls}`}>
                  <Icon size={16} />
                </div>

                {/* Middle: Title & Metadata */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-800 truncate leading-snug group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-medium leading-none">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border leading-none ${config.badgeCls}`}>
                      {config.label}
                    </span>
                    {dateStr && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{dateStr}</span>
                      </>
                    )}
                    {item.courses?.title && (
                      <>
                        <span className="text-slate-300 hidden sm:inline">•</span>
                        <span className="hidden sm:inline truncate max-w-[140px] text-slate-500">
                          {item.courses.title}
                        </span>
                      </>
                    )}
                    {item.file_size && (
                      <>
                        <span className="text-slate-300 hidden sm:inline">•</span>
                        <span className="hidden sm:inline text-slate-400">
                          {item.file_size}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Straight Vertical Aligned Button */}
                <div 
                  className="w-[58px] sm:w-[64px] shrink-0 flex justify-end items-center" 
                  onClick={(e) => e.stopPropagation()}
                >
                  {isCodeNote ? (
                    <button
                      onClick={() => setViewingCode(item)}
                      className="h-7 w-full rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1 active:scale-95 transition-all shadow-2xs"
                      aria-label={`Read note: ${item.title}`}
                    >
                      <BookOpen size={11} />
                      <span>Read</span>
                    </button>
                  ) : (
                    <a
                      href={item.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`h-7 w-full rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-2xs ${
                        item.type === 'pdf'
                          ? 'bg-slate-800 hover:bg-slate-900 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                      aria-label={`${item.type === 'pdf' ? 'Download' : 'Open'} ${item.title}`}
                    >
                      {item.type === 'pdf' ? <Download size={11} /> : <ExternalLink size={11} />}
                      <span>{item.type === 'pdf' ? 'Get' : 'Open'}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
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
