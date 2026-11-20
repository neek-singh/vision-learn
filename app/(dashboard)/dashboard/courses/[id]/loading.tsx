export default function CourseDetailLoading() {
  return (
    <div className="space-y-4 animate-pulse pb-16">
      {/* Top Header Skeleton */}
      <div className="flex items-center gap-3 py-2">
        <div className="w-8 h-8 bg-slate-200 rounded-xl" />
        <div className="space-y-1.5 flex-1">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-28 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Progress Card Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-5 w-16 bg-blue-100 rounded-full" />
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full" />
      </div>

      {/* Modules Tracker Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((m) => (
          <div key={m} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-12 bg-slate-100 rounded" />
            </div>
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map((l) => (
                <div key={l} className="h-9 w-full bg-slate-50 border border-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
