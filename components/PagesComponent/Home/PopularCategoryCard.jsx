import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { resolveCategoryImage } from "@/utils/categoryImage";

const PopularCategoryCard = ({ item }) => {
  const categoryLabel = item?.translated_name || item?.name || "Kategorija";
  const categoryImage = resolveCategoryImage(item, {
    // Prefer backend-provided category image URL.
    // If missing/broken, CustomImage falls back to backend placeholder_image.
    preferUnifiedRootIcon: false,
    useRootFallback: false,
    fallback: "",
  });

  return (
    <CustomLink
      href={`/ads?category=${item?.slug}`}
      className="flex flex-col gap-4"
    >
      <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border border-slate-200/90 bg-slate-50 shadow-sm sm:h-24 sm:w-24">
        <CustomImage
          src={categoryImage}
          alt={categoryLabel}
          width={96}
          height={96}
          className="h-full w-full object-cover"
          loading="eager"
        />
      </div>

      <p className="text-sm sm:text-base line-clamp-2 font-medium text-center leading-tight">
        {categoryLabel}
      </p>
    </CustomLink>
  );
};

export default PopularCategoryCard;
