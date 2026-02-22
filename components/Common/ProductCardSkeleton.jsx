const ProductCardSkeleton = () => {
  return (
    <div className="lmx-product-skeleton-card">
      <div className="lmx-product-skeleton-block aspect-[16/10] w-full rounded-none" />
      <div className="p-2 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="lmx-product-skeleton-block h-3 w-16 rounded-md" />
          <div className="lmx-product-skeleton-block h-3 w-12 rounded-md" />
        </div>
        <div className="lmx-product-skeleton-block h-4 w-3/4 rounded-md" />
        <div className="lmx-product-skeleton-block h-3 w-2/3 rounded-md" />
        <div className="flex gap-1.5 pt-0.5">
          <div className="lmx-product-skeleton-block h-4 w-12 rounded-lg" />
          <div className="lmx-product-skeleton-block h-4 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
