"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * LeaderboardCardSkeleton — tačno prati strukturu LeaderboardCard:
 *  rank mark | avatar | name + pills | points
 */
const LeaderboardCardSkeleton = ({ className }) => (
  <div
    className={cn(
      "w-full rounded-3xl border p-4",
      "border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-900/60",
      className,
    )}
  >
    <div className="flex items-center gap-3 sm:gap-4">
      {/* rank mark */}
      <div className="flex w-11 flex-shrink-0 justify-center">
        <Skeleton className="h-6 w-8 rounded-lg" />
      </div>

      {/* avatar */}
      <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />

      {/* name + pills */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28 rounded-lg" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      </div>

      {/* points */}
      <div className="text-right space-y-1">
        <Skeleton className="h-7 w-16 rounded-lg ml-auto" />
        <Skeleton className="h-3 w-10 rounded-md ml-auto" />
      </div>
    </div>
  </div>
);

/**
 * HeroBadgeSkeleton — prati strukturu HeroBadge kartica u headeru
 */
export const HeroBadgeSkeleton = () => (
  <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/60 p-4">
    <div className="flex items-center gap-2">
      <Skeleton className="h-7 w-7 rounded-lg flex-shrink-0" />
      <Skeleton className="h-3 w-24 rounded-md" />
    </div>
    <Skeleton className="mt-2 h-8 w-20 rounded-lg" />
  </div>
);

export default LeaderboardCardSkeleton;
