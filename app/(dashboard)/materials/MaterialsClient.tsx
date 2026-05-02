"use client";

import { useState } from "react";
import { 
  FileText, 
  Video, 
  Download, 
  ExternalLink,
  BookOpen,
  Copy,
  Check,
  X
} from "lucide-react";

export default function MaterialsClient({ initialMaterials }: { initialMaterials: any[] }) {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [viewingCode, setViewingCode] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const coursesList = Array.from(new Set(initialMaterials.map(m => m.courses?.title))).filter(Boolean);
  const filteredMaterials = selectedCourse === "all" 
    ? initialMaterials 
    : initialMaterials.filter(m => m.courses?.title === selectedCourse);

  return (
    <div className="space-y-8">
      {/* Course Filter */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setSelectedCourse("all")}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
            selectedCourse === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
          }`}
        >
          All Courses
        </button>
        {coursesList.map((courseName: any) => (
          <button 
            key={courseName}
            onClick={() => setSelectedCourse(courseName)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              selectedCourse === courseName ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
            }`}
          >
            {courseName}
          </button>
        ))}
      </div>

      {!filteredMaterials || filteredMaterials.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <p className="text-slate-400 font-bold">No materials found for this course.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                  <th className="px-6 py-4">Material Name</th>
                  <th className="px-6 py-4">Module / Course</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMaterials.map((item: any) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.type === 'pdf' ? 'bg-red-50 text-red-600' : 
                          item.type === 'video' ? 'bg-blue-50 text-blue-600' : 
                          (item.type === 'note' || item.type === 'code') ? 'bg-amber-50 text-amber-600' :
                          'bg-indigo-50 text-indigo-600'
                        }`}>
                          {item.type === 'pdf' ? <FileText size={18} /> : 
                           item.type === 'video' ? <Video size={18} /> : 
                           (item.type === 'note' || item.type === 'code') ? <BookOpen size={18} /> :
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
                      <span className="text-xs font-bold text-slate-500">{item.courses?.title}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-bold text-slate-400">
                         {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(item.type === 'note' || item.type === 'code') ? (
                        <button 
                          onClick={() => setViewingCode(item)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white transition-all"
                        >
                          <BookOpen size={12} />
                          Read Note
                        </button>
                      ) : (
                        <a 
                          href={item.content_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                          item.type === 'pdf' 
                            ? 'bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}>
                          {item.type === 'pdf' ? (
                            <>
                              <Download size={12} />
                              Download
                            </>
                          ) : (
                            <>
                              <ExternalLink size={12} />
                              Open
                            </>
                          )}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Note Viewer Modal */}
      {viewingCode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <BookOpen size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 leading-none mb-1">{viewingCode.title}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {viewingCode.duration || 'Reading Material'} • {viewingCode.courses?.title}
                    </p>
                 </div>
              </div>
              <button onClick={() => setViewingCode(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <div className="p-10 overflow-y-auto bg-white flex-1 scrollbar-hide">
              <div className="max-w-3xl mx-auto">
                <div 
                  className="prose prose-slate max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{ __html: viewingCode.code_content }}
                />
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button 
                 onClick={() => setViewingCode(null)}
                 className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-50 transition-all"
               >
                 Close Viewer
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
