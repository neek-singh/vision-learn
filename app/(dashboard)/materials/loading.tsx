import { FileText, BookOpen, Clock } from "lucide-react";

export default function MaterialsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Course Filter Skeleton */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-24 bg-slate-100 rounded-xl shrink-0" />
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4"><div className="h-3 w-20 bg-slate-200 rounded" /></th>
                <th className="px-6 py-4"><div className="h-3 w-20 bg-slate-200 rounded" /></th>
                <th className="px-6 py-4"><div className="h-3 w-20 bg-slate-200 rounded" /></th>
                <th className="px-6 py-4 text-right"><div className="h-3 w-10 bg-slate-200 rounded ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                      <div className="h-4 w-48 bg-slate-100 rounded" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-3 w-32 bg-slate-50 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-3 w-24 bg-slate-50 rounded" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-8 w-20 bg-slate-100 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
