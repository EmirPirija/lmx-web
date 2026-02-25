import CustomImage from "@/components/Common/CustomImage";
import { resolveCategoryImage } from "@/utils/categoryImage";

const PopularCategoryCard = ({ item, onSelect }) => {
  const categoryLabel = item?.translated_name || item?.name || "Kategorija";
  const categoryImage = resolveCategoryImage(item, {
    // Prefer backend-provided category image URL.
    // If missing/broken, CustomImage falls back to backend placeholder_image.
    preferUnifiedRootIcon: false,
    useRootFallback: false,
    fallback: "",
  });

  return (
    <button type="button" onClick={() => onSelect?.(item)} className="flex w-full flex-col gap-2.5">
      <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-full border border-slate-200/90 bg-slate-50 shadow-sm sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]">
        <CustomImage
          src={categoryImage}
          alt={categoryLabel}
          width={72}
          height={72}
          className="h-full w-full object-cover scale-[0.56]"
          loading="eager"
        />
      </div>

      <p className="text-xs sm:text-sm line-clamp-2 font-medium text-center leading-tight">
        {categoryLabel}
      </p>
    </button>
  );
};

export default PopularCategoryCard;
