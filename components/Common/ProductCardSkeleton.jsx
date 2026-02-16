import { Skeleton } from "../ui/skeleton";

const ProductCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <Skeleton className="w-full aspect-[16/10]" />
      <div className="p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Skeleton className="w-16 h-3" />
          <Skeleton className="w-12 h-3" />
        </div>
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-2/3 h-3" />
        <div className="flex gap-1">
          <Skeleton className="w-12 h-4 rounded" />
          <Skeleton className="w-10 h-4 rounded" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
