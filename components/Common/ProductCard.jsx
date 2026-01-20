import {
  formatPriceAbbreviated,
  formatSalaryRange,
  t,
} from "@/utils";
import { useState, useMemo, useRef } from "react";
import { BiBadgeCheck } from "react-icons/bi";
import { FaHeart, FaRegHeart, FaYoutube } from "react-icons/fa";
import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { HiOutlineArrowRight } from "react-icons/hi";
import { MdLocalOffer } from "react-icons/md";
import { manageFavouriteApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import CustomLink from "@/components/Common/CustomLink";
import { toast } from "sonner";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import CustomImage from "./CustomImage";
import { IconRocket, IconRosetteDiscount } from "@tabler/icons-react";

// Skeleton Loading Component
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl flex flex-col h-full animate-pulse">
      <div className="relative aspect-square rounded-t-2xl bg-gray-200" />
      <div className="flex flex-col gap-2 p-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-1">
          <div className="h-4 w-14 bg-gray-200 rounded-full" />
          <div className="h-4 w-10 bg-gray-200 rounded-full" />
        </div>
        <div className="border-t border-gray-100 mt-1" />
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-14" />
        </div>
      </div>
    </div>
  );
};

// Helper function to format relative time
const formatRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Upravo sada";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    if (diffInMinutes === 1) return "Prije 1 min";
    return `Prije ${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    if (diffInHours === 1) return "Prije 1 sat";
    return `Prije ${diffInHours} sati`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    if (diffInDays === 1) return "Prije 1 dan";
    return `Prije ${diffInDays} dana`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    if (diffInMonths === 1) return "Prije 1 mj";
    return `Prije ${diffInMonths} mj`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  if (diffInYears === 1) return "Prije 1 god";
  return `Prije ${diffInYears} god`;
};

// Izvlači Godište, Gorivo, Mjenjač, Pogon i Stanje
const getKeyAttributes = (item) => {
  const attributes = [];
  const customFields = item?.translated_custom_fields || [];

  const findValue = (keys) => {
    const field = customFields.find((f) => {
      const name = (f.translated_name || f.name || "").toLowerCase();
      return keys.includes(name);
    });
    return field?.translated_selected_values?.[0] || field?.value?.[0];
  };

  const condition = findValue(["stanje oglasa", "stanje"]);
  if (condition) attributes.push(condition);

  const year = findValue(["godište", "godiste"]);
  if (year) attributes.push(year);

  const fuel = findValue(["gorivo"]);
  if (fuel) attributes.push(fuel);

  const transmission = findValue(["mjenjač", "mjenjac"]);
  if (transmission) attributes.push(transmission);

  if (attributes.length === 0) {
    return getSmartTagsFallback(item);
  }

  return attributes;
};

// Fallback funkcija
const getSmartTagsFallback = (item) => {
  const tags = [];
  const skipFields = ["stanje", "condition", "opis", "description", "naslov", "title"];
  const customFields = item?.translated_custom_fields || [];

  for (const field of customFields) {
    if (tags.length >= 3) break;
    const fieldName = (field.name || field.translated_name || "").toLowerCase();
    if (skipFields.some((skip) => fieldName.includes(skip))) continue;
    const value = field.translated_selected_values?.[0] || field.value?.[0];
    if (value && typeof value === "string" && value.length < 25 && value.length > 0) {
      tags.push(value);
    }
  }
  return tags;
};

const formatPriceOrInquiry = (price) => {
  if (price === null || price === undefined) return "Na upit";
  if (typeof price === "string" && price.trim() === "") return "Na upit";
  if (Number(price) === 0) return "Na upit";
  return formatPriceAbbreviated(Number(price));
};


const ProductCard = ({ item, handleLike, isLoading, onClick }) => {
  const userData = useSelector(userSignUpData);
  const isJobCategory = Number(item?.category?.is_job_category) === 1;
  const translated_item = item?.translated_item;

  const keyAttributes = getKeyAttributes(item);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Touch/Swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // 🔥 AKCIJA/SALE Logic
  const isOnSale = item?.is_on_sale === true || item?.is_on_sale === 1;
  const oldPrice = item?.old_price;
  const currentPrice = item?.price;
  const discountPercentage =
    item?.discount_percentage ||
    (isOnSale &&
    oldPrice &&
    currentPrice &&
    Number(oldPrice) > Number(currentPrice)
      ? Math.round(
          ((Number(oldPrice) - Number(currentPrice)) / Number(oldPrice)) * 100
        )
      : 0);

  const allSlides = useMemo(() => {
    const slides = [];
    if (item?.image) {
      slides.push({ type: "image", src: item.image });
    }
    if (item?.gallery_images?.length) {
      item.gallery_images.forEach((img) => {
        const src = img?.image || img;
        if (src) slides.push({ type: "image", src });
      });
    }
    slides.push({ type: "viewMore" });
    return slides;
  }, [item?.image, item?.gallery_images]);

  const totalSlides = allSlides.length;
  const totalImages = totalSlides - 1;
  const hasVideo = item?.video_link && item?.video_link !== "";

  if (isLoading) {
    return <ProductCardSkeleton />;
  }

  const isHidePrice = isJobCategory
  ? [item?.min_salary, item?.max_salary].every(
      (val) =>
        val === null ||
        val === undefined ||
        (typeof val === "string" && val.trim() === "")
    )
  : false;


  const productLink =
    userData?.id === item?.user_id
      ? `/my-listing/${item?.slug}`
      : `/ad-details/${item?.slug}`;

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
        toast.error("Greška pri dodavanju u favorite");
      }
    } catch (error) {
      console.log(error);
      toast.error("Greška pri dodavanju u favorite");
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

  const goToSlide = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(index);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
      } else {
        setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
      }
    }
  };

  const displayCity = item?.translated_city || item?.city || "";
  const currentSlideData = allSlides[currentSlide];
  const isViewMoreSlide = currentSlideData?.type === "viewMore";

  return (
    <CustomLink
      href={productLink}
      className="bg-white border border-gray-100 rounded-2xl flex flex-col h-full group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Image Slider Container */}
      <div
        className="relative overflow-hidden rounded-t-2xl touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative aspect-square">
          {allSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                index === currentSlide
                  ? "opacity-100 z-[1] scale-100"
                  : "opacity-0 z-0 scale-105"
              }`}
            >
              {slide.type === "image" ? (
                <CustomImage
                  src={slide.src}
                  width={288}
                  height={288}
                  className="w-full h-full object-cover"
                  alt={translated_item?.name || item?.name || "Product"}
                />
              ) : (
                <div className="w-full h-full bg-[#76b6b0] flex flex-col items-center justify-center text-white p-6">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 animate-pulse">
                    <HiOutlineArrowRight size={30} />
                  </div>
                  <p className="text-lg font-semibold text-center mb-1">
                    Pogledaj
                  </p>
                </div>
              )}
            </div>
          ))}

          {!isViewMoreSlide && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-[2]" />
          )}
        </div>

        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={handlePrevSlide}
              className={`absolute ltr:left-2 rtl:right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/95 rounded-full items-center justify-center shadow-lg z-20 hidden sm:flex transition-all duration-300 ease-out hover:bg-white hover:scale-110 active:scale-95
              ${
                isHovered
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 ltr:-translate-x-4 rtl:translate-x-4 pointer-events-none"
              }`}
            >
              <FiChevronLeft size={16} className="text-gray-700 rtl:rotate-180" />
            </button>
            <button
              onClick={handleNextSlide}
              className={`absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/95 rounded-full items-center justify-center shadow-lg z-20 hidden sm:flex transition-all duration-300 ease-out hover:bg-white hover:scale-110 active:scale-95
              ${
                isHovered
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 ltr:translate-x-4 rtl:-translate-x-4 pointer-events-none"
              }`}
            >
              <FiChevronRight size={16} className="text-gray-700 rtl:rotate-180" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {totalSlides > 1 && (
          <div
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            {allSlides.map((_, index) => {
              const diff = Math.abs(index - currentSlide);
              const isVisible =
                diff === 0 ||
                diff === 1 ||
                (currentSlide === 0 && index === totalSlides - 1) ||
                (currentSlide === totalSlides - 1 && index === 0);

              if (!isVisible) return null;

              return (
                <button
                  key={index}
                  onClick={(e) => goToSlide(e, index)}
                  className={`rounded-full transition-all duration-300 ease-out ${
                    index === currentSlide
                      ? "w-5 h-1.5 bg-white shadow-sm"
                      : "w-1.5 h-1.5 bg-white/60 hover:bg-white hover:scale-125"
                  }`}
                />
              );
            })}
          </div>
        )}

          {/* sTATUS / ICON BADGES (Sale + Featured) */}
{/* 🔥 STATUS BADGES — top-left stacked */}
{!isViewMoreSlide && (
  <div className="absolute top-2 ltr:left-2 rtl:right-2 z-20 flex items-center gap-1.5">
    {/* ⭐ FEATURED / PREMIUM */}
    {item?.is_feature && (
      <div className="flex items-center justify-center bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-400 rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm">
        <IconRocket size={18} stroke={2} className="text-white" />
      </div>
    )}

    {/* 🔥 SALE / AKCIJA */}
    {isOnSale && discountPercentage > 0 && (
      <div className="flex items-center justify-center bg-red-600 rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm">
        <IconRosetteDiscount size={18} stroke={2} className="text-white" />
      </div>
    )}
  </div>
)}



        {/* Like Button */}
        {!isViewMoreSlide && (
          <button
            onClick={handleLikeItem}
            className={`absolute h-8 w-8 ltr:right-2 rtl:left-2 top-2 bg-white/95 rounded-full flex items-center justify-center shadow-md z-20 transition-all duration-300 ease-out hover:scale-110 active:scale-90
            ${
              isHovered || item?.is_liked
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2"
            }`}
          >
            {item?.is_liked ? (
              <FaHeart
                size={14}
                className="text-red-500 transition-transform duration-300"
              />
            ) : (
              <FaRegHeart
                size={14}
                className="text-gray-500 transition-all duration-300 hover:text-red-400"
              />
            )}
          </button>
        )}

        {/* COUNTERS (Images/Video) */}
        {!isViewMoreSlide && (
          <div className="absolute bottom-2 ltr:right-2 rtl:left-2 z-10 flex items-center gap-1.5">
            {hasVideo && (
              <div className="bg-red-600/90 backdrop-blur-md text-white px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                <FaYoutube size={12} />
              </div>
            )}
            {totalImages > 1 && (
              <div className="bg-black/50 backdrop-blur-md text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {totalImages}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-2 flex-grow">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
          {translated_item?.name || item?.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <IoLocationOutline size={12} />
          <span className="truncate max-w-[150px]">{displayCity}</span>
        </div>

        {/* KEY ATTRIBUTES */}
        {keyAttributes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {keyAttributes.map((attr, index) => (
              <span
                key={index}
                className="inline-flex px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px] font-medium border border-gray-100"
              >
                {attr}
              </span>
            ))}
          </div>
        )}

        <div className="flex-grow" />
        <div className="border-t border-gray-100 mt-1.5" />

        {/* 🔥 PRICE SECTION WITH AKCIJA SUPPORT */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-1 text-gray-400">
            <IoTimeOutline size={12} />
            <span className="text-[10px]">
              {formatRelativeTime(item?.created_at)}
            </span>
          </div>

          {!isHidePrice && (
            <div className="flex flex-col items-center">
              {/* Stara cijena prekrižena */}
              {isOnSale && Number(oldPrice) > 0 && discountPercentage > 0 && (
                <span className="text-[10px] text-gray-400 line-through decoration-red-400">
                  {formatPriceAbbreviated(Number(oldPrice))}
                </span>
              )}


              {/* Trenutna cijena */}
              <span
                className={`text-sm font-bold ${
                  isOnSale && discountPercentage > 0 && Number(currentPrice) > 0
                    ? "text-red-600"
                    : "text-gray-900"
                }`}

                              >
                {isJobCategory
                  ? formatSalaryRange(item?.min_salary, item?.max_salary)
                  : formatPriceOrInquiry(item?.price)}

              </span>
            </div>
          )}
        </div>
      </div>
    </CustomLink>
  );
};

export default ProductCard;
