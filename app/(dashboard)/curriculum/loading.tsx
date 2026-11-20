export default function CurriculumLoading() {
  return (
    <div className="space-y-3 sm:space-y-4 animate-pulse pb-16">
      {/* Course Banner Skeleton */}
      <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/50 rounded-2xl border border-blue-100/70 p-3.5 sm:p-5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-4 sm:h-5 w-44 bg-blue-200/80 rounded" />
            <div className="h-3 w-28 bg-blue-100 rounded" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((t) => (
          <div key={t} className="h-7 w-20 bg-slate-100 rounded-lg shrink-0" />
        ))}
      </div>

      {/* Modules List Skeleton */}
      <div className="space-y-2.5 sm:space-y-3">
        {[1, 2, 3, 4].map((m) => (
          <div key={m} className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 shrink-0" />
                <div className="h-4 w-36 bg-slate-200 rounded" />
              </div>
              <div className="h-4 w-12 bg-slate-100 rounded" />
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
