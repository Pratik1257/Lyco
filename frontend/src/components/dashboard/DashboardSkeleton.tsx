import { Skeleton } from '../ui/Skeleton';

export default function DashboardSkeleton() {
  return (
    <div className="relative space-y-4 animate-fade-in">
      {/* FxWelcome Skeleton */}
      <div className="h-44 rounded-2xl bg-slate-100 border border-slate-200 p-6 flex flex-col md:flex-row justify-between gap-6 overflow-hidden relative">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-24 w-36 rounded-xl" />
          <Skeleton className="h-24 w-36 rounded-xl" />
        </div>
      </div>

      {/* FxGlobalFilters Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton className="h-12 w-80 rounded-2xl" />
        <div className="flex gap-3">
          <Skeleton className="h-12 w-32 rounded-2xl" />
          <Skeleton className="h-12 w-40 rounded-2xl" />
        </div>
      </div>

      {/* FxStatsGrid Skeleton */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>

      {/* FxCharts Skeleton */}
      <div className="flex flex-col xl:flex-row gap-4">
        <Skeleton className="flex-[3] h-[300px] rounded-2xl" />
        <Skeleton className="flex-[2] h-[300px] rounded-2xl" />
      </div>

      {/* FxMiddleRow Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-[340px] rounded-2xl" />
        <Skeleton className="h-[340px] rounded-2xl" />
        <Skeleton className="h-[340px] rounded-2xl" />
      </div>

      {/* FxBottomRow Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[280px] rounded-2xl" />
        <Skeleton className="h-[280px] rounded-2xl" />
      </div>
    </div>
  );
}
