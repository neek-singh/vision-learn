export default function TestsLoading() {
  return (
    <div className="space-y-3 sm:space-y-4 animate-pulse pb-16">
      {/* Breadcrumbs Skeleton */}
      <div className="flex items-center gap-2 py-1">
        <div className="w-4 h-4 bg-slate-200 rounded" />
        <div className="w-20 h-3 bg-slate-200 rounded" />
        <div className="w-3 h-3 bg-slate-100 rounded" />
        <div className="w-24 h-3 bg-slate-200 rounded" />
      </div>

      {/* Top 4 Metrics Row Skeleton (Matches 4-col compact grid) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-2 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-100 shrink-0" />
            <div className="w-full space-y-1">
              <div className="h-4 w-8 bg-slate-200 rounded mx-auto sm:mx-0" />
              <div className="h-2.5 w-10 bg-slate-100 rounded mx-auto sm:mx-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Bar Skeleton */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto">
        {[1, 2, 3, 4].map((t) => (
          <div key={t} className="h-7 w-20 bg-slate-100 rounded-lg shrink-0" />
        ))}
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="h-9 w-full bg-slate-100 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
          <div className="h-9 w-24 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Test Cards List Skeleton */}
      <div className="space-y-2.5 sm:space-y-3">
        {[1, 2, 3, 4].map((c) => (
          <div key={c} className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-44 bg-slate-200 rounded" />
                <div className="h-3 w-28 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-8 w-24 bg-blue-100/70 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
