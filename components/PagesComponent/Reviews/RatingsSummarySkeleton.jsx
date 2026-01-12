'use client';
import { Skeleton } from '@/components/ui/skeleton';
 
const RatingsSummarySkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Lijeva strana - Ukupna ocjena skeleton */}
        <div className="flex flex-col items-center justify-center lg:min-w-[200px] lg:border-r lg:border-gray-100 lg:pr-8">
          <Skeleton className="h-16 w-20 rounded-lg mb-3" />
          <div className="flex gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-5 h-5 rounded" />
            ))}
          </div>
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-3 w-16 rounded mt-1" />
        </div>
 
        {/* Desna strana - Progress bars skeleton */}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-4 w-32 rounded mb-4" />
          
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 min-w-[50px]">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="flex-1 h-2.5 rounded-full" />
              <Skeleton className="h-4 w-8 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
 
export default RatingsSummarySkeleton;