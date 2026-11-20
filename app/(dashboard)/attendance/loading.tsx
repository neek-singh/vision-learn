export default function AttendanceLoading() {
  return (
    <div className="space-y-3 sm:space-y-4 animate-pulse pb-16">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 py-1">
        <div className="w-4 h-4 bg-slate-200 rounded" />
        <div className="w-16 h-3 bg-slate-200 rounded" />
        <div className="w-3 h-3 bg-slate-100 rounded" />
        <div className="w-24 h-3 bg-slate-200 rounded" />
      </div>

      {/* Top 4 Metrics Row Skeleton */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-2 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-100 shrink-0" />
            <div className="w-full space-y-1">
              <div className="h-4 w-8 bg-slate-200 rounded mx-auto sm:mx-0" />
              <div className="h-2.5 w-12 bg-slate-100 rounded mx-auto sm:mx-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-Column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Calendar Skeleton (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-28 bg-slate-200 rounded" />
          </div>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div key={d} className="h-3 w-6 bg-slate-100 rounded mx-auto" />
            ))}
          </div>
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {Array.from({ length: 35 }).map((_, idx) => (
              <div key={idx} className="h-9 w-full bg-slate-50 border border-slate-100 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Selected Log Skeleton (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-5 w-16 bg-slate-100 rounded-full" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-40 bg-slate-100 rounded" />
              <div className="h-3 w-28 bg-slate-100 rounded" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
            {[1, 2, 3].map((r) => (
              <div key={r} className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
