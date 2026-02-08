import {
  formatPriceAbbreviated,
  formatSalaryRange,
  t,
} from "@/utils";
import { useMemo, useRef, useState } from "react";
import { FaHeart, FaRegHeart, FaYoutube } from "react-icons/fa";
import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { HiOutlineArrowRight } from "react-icons/hi";
import { manageFavouriteApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { toast } from "sonner";
import CustomLink from "@/components/Common/CustomLink";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import CustomImage from "./CustomImage";
import { IconRocket, IconRosetteDiscount } from "@tabler/icons-react";

// Helper function to format relative time (isti output kao ProductCard)
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

// Tag fallback (isti koncept kao ProductCard)
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

// Key attributes (isti koncept kao ProductCard)
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

  if (attributes.length === 0) return getSmartTagsFallback(item);
  return attributes;
};

const formatPriceOrInquiry = (price) => {
  if (price === null || price === undefined) return "Na upit";
  if (typeof price === "string" && price.trim() === "") return "Na upit";
  if (Number(price) === 0) return "Na upit";
  return formatPriceAbbreviated(Number(price));
};

const ProductHorizontalCard = ({ item, handleLike, onClick, trackingParams }) => {
  const userData = useSelector(userSignUpData);
  const translated_item = item?.translated_item;

  const isJobCategory = Number(item?.category?.is_job_category) === 1;

  // kao ProductCard: job može sakriti ako nema salary; non-job prikazuje "Na upit"
  const isHidePrice = isJobCategory
    ? [item?.min_salary, item?.max_salary].every(
        (val) =>
          val === null ||
          val === undefined ||
          (typeof val === "string" && val.trim() === "")
      )
    : false;

  const productLinkBase =
    userData?.id === item?.user_id
      ? `/my-listing/${item?.slug}`
      : `/ad-details/${item?.slug}`;
  const productLink = trackingParams
    ? `${productLinkBase}?${new URLSearchParams(trackingParams).toString()}`
    : productLinkBase;

  const keyAttributes = getKeyAttributes(item);

  // AKCIJA/SALE
  const isOnSale = item?.is_on_sale === true || item?.is_on_sale === 1;
  const oldPrice = item?.old_price;
  const currentPrice = item?.price;
  const discountPercentage =
    item?.discount_percentage ||
    (isOnSale &&
    oldPrice &&
    currentPrice &&
    Number(oldPrice) > Number(currentPrice)
      ? Math.round(((Number(oldPrice) - Number(currentPrice)) / Number(oldPrice)) * 100)
      : 0);

  // Slider slides (image + gallery + viewMore)
  const allSlides = useMemo(() => {
    const slides = [];
    if (item?.image) slides.push({ type: "image", src: item.image });
    if (item?.gallery_images?.length) {
      item.gallery_images.forEach((img) => {
        const src = img?.image || img;
        if (src) slides.push({ type: "image", src });
      });
    }
    slides.push({ type: "viewMore" });
    return slides;
  }, [item?.image, item?.gallery_images]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Touch/Swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const totalSlides = allSlides.length;
  const totalImages = totalSlides - 1;
  const hasVideo = item?.video_link && item?.video_link !== "";

  const currentSlideData = allSlides[currentSlide];
  const isViewMoreSlide = currentSlideData?.type === "viewMore";

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
  const displayAddress = item?.translated_address || item?.address || "";

  return (
    <CustomLink
      href={productLink}
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex w-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* LEFT: VEĆA slika da popuni whitespace */}
      <div className="relative shrink-0 w-[130px] sm:w-[170px] md:w-[190px]">
        <div
          className="relative overflow-hidden touch-pan-y"
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
                    width={320}
                    height={320}
                    alt={translated_item?.name || item?.name || "Product"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#76b6b0] flex flex-col items-center justify-center text-white p-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 animate-pulse">
                      <HiOutlineArrowRight size={18} />
                    </div>
                    <p className="text-sm font-semibold text-center">Pogledaj</p>
                  </div>
                )}
              </div>
            ))}

            {!isViewMoreSlide && (
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-[2]" />
            )}
          </div>


          {/* Like — prebacen u gornji lijevi da se ne sudara s badge-ovima */}
{/* Like — TOP LEFT */}
{!isViewMoreSlide && (
  <button
    onClick={handleLikeItem}
    className={`absolute h-8 w-8 left-2 top-2 bg-white/95 rounded-full flex items-center justify-center shadow-md z-30 transition-all duration-300 ease-out hover:scale-110 active:scale-90
    ${isHovered || item?.is_liked ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
  >
    {item?.is_liked ? (
      <FaHeart size={14} className="text-red-500" />
    ) : (
      <FaRegHeart size={14} className="text-gray-500 hover:text-red-400" />
    )}
  </button>
)}


          {/* Counters (video + images count) */}
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

          {/* Navigation arrows (desktop, on hover) */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={handlePrevSlide}
                className={`absolute ltr:left-2 rtl:right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/95 rounded-full items-center justify-center shadow-lg z-20 hidden sm:flex transition-all duration-300 ease-out hover:bg-white hover:scale-110 active:scale-95
                ${
                  isHovered
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 ltr:-translate-x-3 rtl:translate-x-3 pointer-events-none"
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
                    : "opacity-0 ltr:translate-x-3 rtl:-translate-x-3 pointer-events-none"
                }`}
              >
                <FiChevronRight size={16} className="text-gray-700 rtl:rotate-180" />
              </button>
            </>
          )}

          {/* Dot indicators (on hover) */}
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
        </div>
      </div>

      {/* RIGHT: content */}
      <div className="flex flex-col gap-1.5 p-3 flex-1 min-w-0">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
          {translated_item?.name || item?.name}
        </h3>

        {(displayCity || displayAddress) && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <IoLocationOutline size={12} />
            <span className="truncate">
              {displayCity || displayAddress}
            </span>
          </div>
        )}

        {displayCity && displayAddress && (
          <div className="text-xs text-gray-400 line-clamp-1">
            {displayAddress}
          </div>
        )}

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


        <div className="flex-grow relative">
        {/* BADGES — TOP RIGHT */}
          {!isViewMoreSlide && (
            <div className="absolute top-2 z-30 flex items-center gap-1.5 initial">
              {item?.is_feature && (
                <div className="flex items-center justify-center bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-400 rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm">
                  <IconRocket size={18} stroke={2} className="text-white" />
                </div>
              )}

              {isOnSale && discountPercentage > 0 && (
                <div className="flex items-center justify-center bg-red-600 rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm">
                  <IconRosetteDiscount size={18} stroke={2} className="text-white" />
                </div>
              )}
            </div>
          )}
                    </div>
        <div className="border-t border-gray-100 mt-1.5" />

        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-1 text-gray-400">
            <IoTimeOutline size={12} />
            <span className="text-[12px]">
              {formatRelativeTime(item?.created_at)}
            </span>
          </div>

          {!isHidePrice && (
            <div className="flex flex-col items-end">
              {isOnSale && Number(oldPrice) > 0 && discountPercentage > 0 && (
                <span className="text-[10px] text-gray-400 line-through decoration-red-400">
                  {formatPriceAbbreviated(Number(oldPrice))}
                </span>
              )}

              <span
                className={`text-sm font-bold ${
                  isOnSale && discountPercentage > 0 && Number(currentPrice) > 0
                    ? "text-red-600"
                    : "text-gray-900"
                }`}
                title={
                  isJobCategory
                    ? formatSalaryRange(item?.min_salary, item?.max_salary)
                    : formatPriceOrInquiry(item?.price)
                }
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

export default ProductHorizontalCard;