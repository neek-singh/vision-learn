import { 
  Calendar, 
  CheckCircle2, 
  BookOpen, 
  TrendingUp, 
  Flame, 
  Users,
  PlayCircle
} from "lucide-react";

export function HeaderSkeleton() {
  return (
    <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2" />
        <div className="h-4 w-64 bg-slate-100 rounded-md" />
      </div>
      <div className="h-10 w-32 bg-slate-100 rounded-xl" />
    </section>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-200 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-16 bg-slate-200 rounded" />
            <div className="h-3 w-12 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="w-36 h-36 rounded-full bg-slate-100 border-4 border-slate-50 shrink-0" />
        <div className="flex-1 space-y-4 w-full">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-7 w-3/4 bg-slate-200 rounded" />
          </div>
          <div className="h-3 w-full bg-slate-50 rounded-full border border-slate-100" />
          <div className="flex gap-3">
            <div className="h-6 w-24 bg-slate-50 rounded-lg border border-slate-100" />
            <div className="h-6 w-24 bg-slate-50 rounded-lg border border-slate-100" />
          </div>
          <div className="h-11 w-44 bg-slate-900/10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="w-11 h-11 bg-slate-200 rounded-xl" />
        <div className="space-y-1">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-slate-50/50 rounded-xl border border-slate-100/50" />
        ))}
      </div>
    </div>
  );
}

export function NextLessonSkeleton() {
  return (
    <div className="bg-slate-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
      <div className="flex items-center gap-4 w-full">
        <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-20 bg-slate-200 rounded" />
          <div className="h-6 w-1/2 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="h-12 w-36 bg-slate-200 rounded-xl" />
    </div>
  );
}

export function QuickLinksSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 bg-white rounded-xl border border-slate-100" />
      ))}
    </div>
  );
}

export function CurriculumSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-pulse">
      {/* Course Header Skeleton */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-72 bg-slate-100 rounded-md" />
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block space-y-2">
              <div className="h-3 w-20 bg-slate-100 rounded ml-auto" />
              <div className="h-7 w-24 bg-slate-200 rounded-lg" />
            </div>
            <div className="w-16 h-16 bg-slate-100 rounded-2xl border border-slate-50" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-6 w-36 bg-slate-200 rounded" />
            </div>
            <div className="h-5 w-28 bg-indigo-50 rounded-md border border-indigo-100" />
          </div>
          <div className="h-4 w-full bg-slate-50 rounded-full border border-slate-100" />
        </div>
      </div>

      {/* Resume Learning Skeleton */}
      <div className="h-20 bg-slate-100 rounded-2xl border border-slate-200" />

      {/* Modules Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AttendanceSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats Overview Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 h-44 bg-slate-200 rounded-[2.5rem]" />
        <div className="h-44 bg-white rounded-[2rem] border border-slate-100 p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-3 w-16 bg-slate-100 rounded" />
              <div className="h-5 w-8 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="h-44 bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
          <div className="h-6 w-12 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-100 rounded" />
        </div>
      </div>

      {/* History Table Skeleton */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between">
          <div className="h-6 w-40 bg-slate-200 rounded" />
          <div className="h-4 w-24 bg-slate-100 rounded" />
        </div>
        <div className="p-8 space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-xl" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
              </div>
              <div className="h-4 w-40 bg-slate-100 rounded" />
              <div className="h-8 w-24 bg-slate-50 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="max-w-4xl space-y-6 pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="w-28 h-28 rounded-3xl bg-slate-100" />
        <div className="space-y-3 flex-1">
          <div className="h-3 w-32 bg-slate-100 rounded mx-auto md:mx-0" />
          <div className="h-9 w-64 bg-slate-200 rounded mx-auto md:mx-0" />
          <div className="flex gap-3 justify-center md:justify-start">
            <div className="h-6 w-24 bg-slate-100 rounded-xl" />
            <div className="h-6 w-32 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 space-y-6">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="space-y-6">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-slate-50 rounded" />
                    <div className="h-4 w-40 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 md:col-span-2 space-y-6">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-slate-50 rounded" />
                <div className="h-4 w-32 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-7 w-40 bg-slate-200 rounded" />
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-slate-100 rounded-full" />
              <div className="w-10 h-10 bg-slate-100 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className="h-4 text-center text-[10px] font-black text-slate-300">{d}</div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-50 rounded-2xl border border-slate-100/50" />
            ))}
          </div>
        </div>

        {/* Sidebar Events Skeleton */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <StatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CourseCardSkeleton />
        <ProfileSkeleton />
      </div>
      <NextLessonSkeleton />
      <QuickLinksSkeleton />
    </div>
  );
}
