import { 
  BookOpen, 
  Award, 
  Calendar, 
  CheckCircle2,
  TrendingUp,
  Flame,
  Users
} from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-slate-100 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
      </section>

      {/* Stats Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-200 rounded-lg" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-16 bg-slate-200 rounded" />
              <div className="h-3 w-12 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Card Skeleton */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-36 h-36 rounded-full bg-slate-100 border-4 border-slate-50" />
            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-6 w-3/4 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full" />
              <div className="flex gap-3">
                <div className="h-6 w-20 bg-slate-100 rounded-lg" />
                <div className="h-6 w-20 bg-slate-100 rounded-lg" />
              </div>
              <div className="h-10 w-40 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Profile Card Skeleton */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-11 h-11 bg-slate-200 rounded-xl" />
            <div className="space-y-1">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-xl border border-slate-50" />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-white rounded-xl border border-slate-100" />
        ))}
      </div>
    </div>
  );
}
