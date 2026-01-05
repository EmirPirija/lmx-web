import {
  formatPriceAbbreviated,
  formatSalaryRange,
  t,
} from "@/utils";
import { useState } from "react";
import { BiBadgeCheck } from "react-icons/bi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { HiOutlineArrowRight } from "react-icons/hi";
import { manageFavouriteApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import CustomLink from "@/components/Common/CustomLink";
import { toast } from "sonner";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import CustomImage from "./CustomImage";

// Helper function to format relative time
const formatRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return t("justNow") || "Upravo";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    if (diffInMinutes === 1) return `${t("before") || "Prije"} 1 ${t("minute") || "minutu"}`;
    if (diffInMinutes < 5) return `${t("before") || "Prije"} ${diffInMinutes} ${t("minutes") || "minute"}`;
    return `${t("before") || "Prije"} ${diffInMinutes} ${t("minutesPlural") || "minuta"}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    if (diffInHours === 1) return `${t("before") || "Prije"} 1 ${t("hour") || "sat"}`;
    if (diffInHours < 5) return `${t("before") || "Prije"} ${diffInHours} ${t("hours") || "sata"}`;
    return `${t("before") || "Prije"} ${diffInHours} ${t("hoursPlural") || "sati"}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    if (diffInDays === 1) return `${t("before") || "Prije"} 1 ${t("day") || "dan"}`;
    return `${t("before") || "Prije"} ${diffInDays} ${t("days") || "dana"}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    if (diffInMonths === 1) return `${t("before") || "Prije"} 1 ${t("month") || "mjesec"}`;
    if (diffInMonths < 5) return `${t("before") || "Prije"} ${diffInMonths} ${t("months") || "mjeseca"}`;
    return `${t("before") || "Prije"} ${diffInMonths} ${t("monthsPlural") || "mjeseci"}`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  if (diffInYears === 1) return `${t("before") || "Prije"} 1 ${t("year") || "godinu"}`;
  return `${t("before") || "Prije"} ${diffInYears} ${t("years") || "godina"}`;
};

// Helper function to get condition from custom fields
const getCondition = (item) => {
  const conditionField = item?.translated_custom_fields?.find(
    (field) => field.name?.toLowerCase() === "stanje" || field.translated_name?.toLowerCase() === "stanje"
  );
  
  if (conditionField?.translated_selected_values?.[0]) {
    return conditionField.translated_selected_values[0];
  }
  if (conditionField?.value?.[0]) {
    return conditionField.value[0];
  }
  return null;
};

// Helper function to get condition badge styles
const getConditionStyles = (condition) => {
  const conditionLower = condition?.toLowerCase();
  
  if (conditionLower === "novo") {
    return "bg-emerald-500 text-white";
  }
  if (conditionLower === "korišteno" || conditionLower === "koristeno") {
    return "bg-amber-500 text-white";
  }
  if (conditionLower === "oštećeno" || conditionLower === "osteceno") {
    return "bg-red-500 text-white";
  }
  return "bg-slate-500 text-white";
};

const ProductCard = ({ item, handleLike }) => {
  const userData = useSelector(userSignUpData);
  const isJobCategory = Number(item?.category?.is_job_category) === 1;
  const translated_item = item.translated_item;
  const condition = getCondition(item);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Build slides array: main image + gallery images + "view ad" card
  const allImages = [
    { type: "image", src: item?.image },
    ...(item?.gallery_images?.map((img) => ({ 
      type: "image", 
      src: img?.image || img 
    })) || []),
    { type: "viewMore" }
  ];

  const totalSlides = allImages.length;

  const isHidePrice = isJobCategory
    ? [item?.min_salary, item?.max_salary].every(
        (val) =>
          val === null ||
          val === undefined ||
          (typeof val === "string" && val.trim() === "")
      )
    : item?.price === null ||
      item?.price === undefined ||
      (typeof item?.price === "string" && item?.price.trim() === "");

  const productLink =
    userData?.id === item?.user_id
      ? `/my-listing/${item?.slug}`
      : `/ad-details/${item.slug}`;

  const handleLikeItem = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!userData) {
        setIsLoginOpen(true);
        return;
      }
      const response = await manageFavouriteApi.manageFavouriteApi({
        item_id: item?.id,
      });
      if (response?.data?.error === false) {
        toast.success(response?.data?.message);
        handleLike(item?.id);
      } else {
        toast.error(t("failedToLike"));
      }
    } catch (error) {
      console.log(error);
      toast.error(t("failedToLike"));
    }
  };

  const handlePrevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  // Get city only
  const displayCity = item?.translated_city || item?.city || "";

  const currentSlideData = allImages[currentSlide];

  return (
    <CustomLink
      href={productLink}
      className="group border border-gray-200 p-2 rounded-2xl flex flex-col gap-2 h-full transition-all duration-200 hover:shadow-md hover:border-gray-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Slider Container */}
      <div className="relative overflow-hidden rounded-xl">
        {/* Slides */}
        <div className="relative aspect-square">
          {currentSlideData.type === "image" ? (
            <CustomImage
              src={currentSlideData.src}
              width={288}
              height={288}
              className="w-full h-full rounded-xl object-cover"
              alt={translated_item?.name || item?.name || "Product"}
            />
          ) : (
            // "View Full Ad" Card
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary/90 to-primary flex flex-col items-center justify-center text-white p-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <HiOutlineArrowRight size={32} />
              </div>
              <p className="text-lg font-semibold text-center mb-2">
                {t("viewFullAd") || "Pogledaj cijeli oglas"}
              </p>
              <p className="text-sm text-white/80 text-center">
                {t("clickToSeeMore") || "Klikni za više detalja"}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Arrows - Show on hover when more than 1 slide */}
        {totalSlides > 1 && isHovered && (
          <>
            <button
              onClick={handlePrevSlide}
              className="absolute ltr:left-1 rtl:right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md transition-all hover:bg-white hover:scale-110 z-10"
            >
              <FiChevronLeft size={18} className="rtl:rotate-180" />
            </button>
            <button
              onClick={handleNextSlide}
              className="absolute ltr:right-1 rtl:left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md transition-all hover:bg-white hover:scale-110 z-10"
            >
              <FiChevronRight size={18} className="rtl:rotate-180" />
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {totalSlides > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentSlide(index);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentSlide 
                    ? "w-4 bg-white" 
                    : "w-1.5 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}

        {/* Featured Badge - Top Left */}
        {item?.is_feature && currentSlideData.type === "image" && (
          <div className="flex items-center gap-1 rounded-br-lg py-1 px-2 bg-primary absolute top-0 ltr:left-0 rtl:right-0 z-10">
            <BiBadgeCheck size={14} color="white" />
            <span className="text-white text-xs font-medium">{t("featured")}</span>
          </div>
        )}

        {/* Condition Badge - Bottom Left */}
        {condition && currentSlideData.type === "image" && (
          <span className={`absolute bottom-8 ltr:left-2 rtl:right-2 px-2 py-0.5 rounded-md text-xs font-medium z-10 ${getConditionStyles(condition)}`}>
            {condition}
          </span>
        )}

        {/* Like Button - Top Right */}
        <button
          onClick={handleLikeItem}
          className="absolute h-9 w-9 ltr:right-2 rtl:left-2 top-2 bg-white/90 backdrop-blur-sm p-2 rounded-full flex items-center justify-center text-primary shadow-sm transition-transform duration-200 hover:scale-110 active:scale-95 z-10"
        >
          {item?.is_liked ? (
            <FaHeart size={18} className="text-red-500" />
          ) : (
            <FaRegHeart size={18} />
          )}
        </button>

        {/* Image Counter */}
        {totalSlides > 1 && currentSlideData.type === "image" && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full z-10">
            {currentSlide + 1} / {totalSlides - 1}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 flex-grow px-1">
        {/* Price */}
        {!isHidePrice && (
          <p
            className="text-base sm:text-lg font-bold text-primary line-clamp-1"
            title={
              isJobCategory
                ? formatSalaryRange(item?.min_salary, item?.max_salary)
                : formatPriceAbbreviated(item?.price)
            }
          >
            {isJobCategory
              ? formatSalaryRange(item?.min_salary, item?.max_salary)
              : formatPriceAbbreviated(item?.price)}
          </p>
        )}

        {/* Title */}
        <p className="text-sm sm:text-base font-medium line-clamp-2 leading-snug">
          {translated_item?.name || item?.name}
        </p>

        {/* Location & Time - Bottom */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <div className="flex items-center gap-1 text-gray-500 min-w-0">
            <IoLocationOutline size={14} className="flex-shrink-0" />
            <span className="text-xs truncate">{displayCity}</span>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {formatRelativeTime(item?.created_at)}
          </span>
        </div>
      </div>
    </CustomLink>
  );
};

export default ProductCard;