import { FileText, Trophy, Clock } from "lucide-react";

export default function TestsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Course Filter Skeleton */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-28 bg-slate-100 rounded-xl shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-slate-100 rounded-xl" />
              <div className="h-5 w-20 bg-slate-50 rounded-full" />
            </div>

            <div className="space-y-2">
              <div className="h-3 w-16 bg-slate-100 rounded" />
              <div className="h-6 w-full bg-slate-200 rounded" />
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-50 rounded" />
                <div className="h-3 w-12 bg-slate-50 rounded" />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-4 w-16 bg-slate-50 rounded" />
              <div className="h-4 w-16 bg-slate-50 rounded" />
            </div>

            <div className="h-12 w-full bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
