import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * ChatListCardSkeleton Component - Enhanced
 * 
 * Features:
 * ✅ Smooth shimmer animation
 * ✅ Matches actual ChatListCard layout
 * ✅ Better visual hierarchy
 */

const ChatListCardSkeleton = () => {
  return (
    <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/90 animate-pulse">
      <div className="flex items-center gap-4">
        {/* Avatar skeleton with online indicator placeholder */}
        <div className="relative flex-shrink-0">
          <Skeleton className="w-[56px] h-[56px] rounded-full" />
          {/* Item thumbnail skeleton */}
          <Skeleton className="w-[28px] h-[28px] rounded-full absolute -bottom-1 -right-1" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Name and time row */}
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-[40%] rounded-md" />
            <Skeleton className="h-3 w-[15%] rounded-md" />
          </div>

          {/* Last message and badge row */}
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-[70%] rounded-md" />
            <Skeleton className="h-[22px] w-[22px] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Advanced skeleton with staggered animation
 * Use this for a more polished loading experience
 */
export const ChatListCardSkeletonAdvanced = ({ delay = 0 }) => {
  return (
    <div 
      className="p-4 border-b"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar skeleton */}
        <div className="relative flex-shrink-0">
          <Skeleton 
            className={cn(
              "w-[56px] h-[56px] rounded-full",
              "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
              "bg-[length:200%_100%] animate-shimmer"
            )} 
          />
          {/* Item thumbnail skeleton */}
          <Skeleton 
            className={cn(
              "w-[28px] h-[28px] rounded-full absolute -bottom-1 -right-1",
              "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
              "bg-[length:200%_100%] animate-shimmer"
            )}
            style={{ animationDelay: '100ms' }}
          />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Name and time row */}
          <div className="flex items-center justify-between gap-2">
            <Skeleton 
              className={cn(
                "h-4 w-[40%] rounded-md",
                "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
                "bg-[length:200%_100%] animate-shimmer"
              )}
              style={{ animationDelay: '200ms' }}
            />
            <Skeleton 
              className={cn(
                "h-3 w-[15%] rounded-md",
                "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
                "bg-[length:200%_100%] animate-shimmer"
              )}
              style={{ animationDelay: '250ms' }}
            />
          </div>

          {/* Last message and badge row */}
          <div className="flex items-center justify-between gap-2">
            <Skeleton 
              className={cn(
                "h-3 w-[70%] rounded-md",
                "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
                "bg-[length:200%_100%] animate-shimmer"
              )}
              style={{ animationDelay: '300ms' }}
            />
            <Skeleton 
              className={cn(
                "h-[22px] w-[22px] rounded-full",
                "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
                "bg-[length:200%_100%] animate-shimmer"
              )}
              style={{ animationDelay: '350ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatListCardSkeleton;
