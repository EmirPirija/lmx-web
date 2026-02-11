import { Skeleton } from "../ui/skeleton";

const ProductHorizontalCardSkeleton = () => {
  return (
    <div className="relative flex w-full overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="aspect-square w-[140px] shrink-0 sm:w-[200px] md:w-[230px]" />

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
};

export default ProductHorizontalCardSkeleton;
