import { 
  FileText, 
  Video, 
  Download, 
  ExternalLink,
  ChevronRight,
  Search
} from "lucide-react";

export default function MaterialsPage() {
  // Static mock data for now
  const materials: any[] = [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Notes & Materials</h1>
          <p className="text-sm text-slate-500 font-medium">Download your module notes and watch tutorial videos.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search materials..." 
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs w-full md:w-64"
          />
        </div>
      </section>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-6 py-4">Material Name</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {materials.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {item.type === 'pdf' ? <FileText size={18} /> : <Video size={18} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{item.title}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {item.type === 'pdf' ? item.size : item.duration} • {item.type.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500">{item.module}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
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
                          Watch Video
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Empty State Mockup */}
      {materials.length === 0 && (
        <div className="p-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 font-bold">No materials available for your current modules.</p>
        </div>
      )}
    </div>
  );
}
