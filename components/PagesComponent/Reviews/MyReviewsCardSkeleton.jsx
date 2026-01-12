'use client';
import { Skeleton } from '@/components/ui/skeleton';
 
const ReviewCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Avatar skeleton */}
          <div className="relative flex-shrink-0">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full" />
          </div>
 
          {/* Info skeleton */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-4 w-48 rounded" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
 
            {/* Rating i datum skeleton */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="w-4 h-4 rounded" />
                ))}
              </div>
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
        </div>
 
        {/* Tekst recenzije skeleton */}
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
 
        {/* Slike skeleton */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
 
const MyReviewsCardSkeleton = ({ count = 4 }) => {
  return (
    <div className="space-y-4">
      {/* Filter skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-14 rounded-full" />
            ))}
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>
 
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40 rounded" />
      </div>
 
      {/* Cards skeleton */}
      <div className="grid gap-4">
        {[...Array(count)].map((_, index) => (
          <ReviewCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};
 
export default MyReviewsCardSkeleton;