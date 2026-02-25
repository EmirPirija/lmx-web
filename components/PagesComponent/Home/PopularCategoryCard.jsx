import CustomImage from "@/components/Common/CustomImage";
import { resolveCategoryImage } from "@/utils/categoryImage";

const PopularCategoryCard = ({ item, onSelect, index = 0 }) => {
  const categoryLabel = item?.translated_name || item?.name || "Kategorija";
  const categoryImage = resolveCategoryImage(item, {
    // Prefer backend-provided category image URL.
    // If missing/broken, CustomImage falls back to backend placeholder_image.
    preferUnifiedRootIcon: false,
    useRootFallback: false,
    fallback: "",
  });
  const enterDelay = Math.min(index * 32, 256);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      style={{ animationDelay: `${enterDelay}ms` }}
      className="group flex w-full flex-col gap-2.5 rounded-xl outline-none [will-change:transform] transform-gpu transition-transform duration-200 ease-out motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-reduce:transform-none active:scale-[0.98] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900"
    >
      <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-full border border-slate-200/90 bg-slate-50 shadow-sm transition-all duration-200 ease-out group-hover:border-primary/40 group-hover:bg-primary/[0.07] group-hover:shadow-[0_10px_22px_-16px_rgba(2,6,23,0.55)] group-active:scale-[0.97] dark:border-slate-700/90 dark:bg-slate-900/80 dark:group-hover:border-primary/50 dark:group-hover:bg-primary/15 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]">
        <CustomImage
          src={categoryImage}
          alt={categoryLabel}
          width={72}
          height={72}
          className="h-full w-full object-cover scale-[0.56] transition-transform duration-200 ease-out group-hover:scale-[0.62] group-active:scale-[0.58]"
          loading="eager"
        />
      </div>

      <p className="text-xs sm:text-sm line-clamp-2 font-medium text-center leading-tight transition-colors duration-200 group-hover:text-primary group-focus-visible:text-primary">
        {categoryLabel}
      </p>
    </button>
  );
};

export default PopularCategoryCard;
