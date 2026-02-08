import {
  formatPriceAbbreviated,
  formatSalaryRange,
  t,
} from "@/utils";
import { useState, useMemo, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BiBadgeCheck } from "react-icons/bi";
import { FaHeart, FaRegHeart, FaYoutube } from "react-icons/fa";
import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { HiOutlineArrowRight } from "react-icons/hi";
import { MdLocalOffer } from "react-icons/md";
import { itemStatisticsApi, manageFavouriteApi } from "@/utils/api";
import { useSelector, useDispatch } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import CustomLink from "@/components/Common/CustomLink";
import { toast } from "sonner";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import CustomImage from "./CustomImage";
import { IconRocket, IconRosetteDiscount } from "@tabler/icons-react";

import { addToCompare, removeFromCompare, selectCompareList } from "@/redux/reducer/compareSlice";
import { IoGitCompareOutline } from "react-icons/io5";

// Skeleton Loading Component
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="relative aspect-square bg-gray-100" />
      <div className="p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-gray-100 rounded" />
          <div className="h-3 w-12 bg-gray-100 rounded" />
        </div>
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-3 w-2/3 bg-gray-100 rounded" />
        <div className="flex gap-1">
          <div className="h-4 w-12 bg-gray-100 rounded" />
          <div className="h-4 w-10 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const buildDotItems = (count, current, maxDots = 7) => {
  const last = Math.max(0, count - 1);
  if (count <= maxDots) {
    return Array.from({ length: count }, (_, index) => ({ type: "dot", index, key: `d-${index}` }));
  }

  let windowLen = Math.max(1, maxDots - 2);

  // Iteratively adjust windowLen based on whether we need ellipses.
  for (let i = 0; i < 3; i++) {
    let start = current - Math.floor(windowLen / 2);
    let end = start + windowLen - 1;

    if (start < 1) {
      start = 1;
      end = start + windowLen - 1;
    }
    if (end > last - 1) {
      end = last - 1;
      start = end - windowLen + 1;
      if (start < 1) start = 1;
    }

    const needLeftEllipsis = start > 1;
    const needRightEllipsis = end < last - 1;

    const nextWindowLen = Math.max(
      1,
      (maxDots - 2) - (needLeftEllipsis ? 1 : 0) - (needRightEllipsis ? 1 : 0)
    );

    if (nextWindowLen === windowLen) break;
    windowLen = nextWindowLen;
  }

  let start = current - Math.floor(windowLen / 2);
  let end = start + windowLen - 1;

  if (start < 1) {
    start = 1;
    end = start + windowLen - 1;
  }
  if (end > last - 1) {
    end = last - 1;
    start = end - windowLen + 1;
    if (start < 1) start = 1;
  }

  const items = [];
  items.push({ type: "dot", index: 0, key: "d-0" });

  if (start > 1) items.push({ type: "ellipsis", key: "e-left" });

  for (let index = start; index <= end; index++) {
    items.push({ type: "dot", index, key: `d-${index}` });
  }

  if (end < last - 1) items.push({ type: "ellipsis", key: "e-right" });

  items.push({ type: "dot", index: last, key: `d-${last}` });

  return items;
};

const ProductCard = ({ item, handleLike, isLoading, onClick, trackingParams }) => {
  const userData = useSelector(userSignUpData);

  const isJobCategory = Number(item?.category?.is_job_category) === 1;
  const translated_item = item?.translated_item;

  const keyAttributes = getKeyAttributes(item);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const dispatch = useDispatch();
  const compareList = useSelector(selectCompareList);
  const isInCompare = compareList?.some((i) => i.id === item?.id);

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCompare) {
      dispatch(removeFromCompare(item.id));
    } else {
      dispatch(addToCompare(item));
    }
  };

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
  const lastSlideIndex = Math.max(0, totalSlides - 1);

  // ✅ Clamp ako se broj slideova promijeni (npr. item se promijeni)
  useEffect(() => {
    setCurrentSlide((s) => clamp(s, 0, lastSlideIndex));
  }, [lastSlideIndex]);

  // ✅ Granice za prev/next (bez wrap-around)
  const canPrev = currentSlide > 0;
  const canNext = currentSlide < lastSlideIndex;

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

  const productLinkBase =
    userData?.id === item?.user_id
      ? `/my-listing/${item?.slug}`
      : `/ad-details/${item?.slug}`;
  const productLink = trackingParams
    ? `${productLinkBase}?${new URLSearchParams(trackingParams).toString()}`
    : productLinkBase;

  const handleLikeItem = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!userData) {
        dispatch(setIsLoginOpen(true));
        return;
      }
      const response = await manageFavouriteApi.manageFavouriteApi({
        item_id: item?.id,
      });
      if (response?.data?.error === false) {
        toast.success(response?.data?.message);
        handleLike?.(item?.id);
        await itemStatisticsApi.trackFavorite({ item_id: item?.id, added: !item?.is_liked });
      } else {
        toast.error("Greška pri dodavanju u favorite");
      }
    } catch (error) {
      console.log(error);
      toast.error("Greška pri dodavanju u favorite");
    }
  };

  // ✅ Prev/Next bez wrap-around
  const handlePrevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const handleNextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => Math.min(lastSlideIndex, prev + 1));
  };

  const goToSlide = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(clamp(index, 0, lastSlideIndex));
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  // ✅ Swipe poštuje granice (nema wrap-around)
  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) <= minSwipeDistance) return;

    if (swipeDistance > 0) {
      // swipe left -> next
      setCurrentSlide((prev) => Math.min(lastSlideIndex, prev + 1));
    } else {
      // swipe right -> prev
      setCurrentSlide((prev) => Math.max(0, prev - 1));
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
            {/* ✅ PREV: render only if canPrev */}
            {canPrev && (
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
            )}

            {/* ✅ NEXT: render only if canNext */}
            {canNext && (
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
            )}
          </>
        )}

        {/* Dot Indicators (high-end, max 7 + ellipsis) */}
        {totalSlides > 1 && (
          <motion.div
            initial={false}
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 4,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 ${
              isHovered ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            {buildDotItems(totalSlides, currentSlide, 7).map((d) => {
              if (d.type === "ellipsis") {
                return (
                  <span
                    key={d.key}
                    className="text-white/80 text-[11px] leading-none px-0.5 select-none"
                    aria-hidden="true"
                  >
                    …
                  </span>
                );
              }

              const active = d.index === currentSlide;

              return (
                <button
                  key={d.key}
                  onClick={(e) => goToSlide(e, d.index)}
                  className="rounded-full"
                  aria-label={`Slide ${d.index + 1}`}
                >
                  {active ? (
                    <motion.span
                      layout
                      className="block w-5 h-1.5 bg-white rounded-full shadow-sm"
                      transition={{ type: "spring", stiffness: 520, damping: 34 }}
                    />
                  ) : (
                    <motion.span
                      layout
                      whileHover={{ scale: 1.25 }}
                      className="block w-1.5 h-1.5 bg-white/60 rounded-full"
                      transition={{ type: "spring", stiffness: 520, damping: 34 }}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Action Buttons (row-reverse; compare always in far corner) */}
        {!isViewMoreSlide && (
          <div className="absolute top-2 ltr:right-2 rtl:left-2 z-20 flex flex-row-reverse items-center gap-2">
            <AnimatePresence initial={false}>
              {(isHovered || isInCompare) && (
                <motion.button
                  key="compare"
                  onClick={handleCompare}
                  initial={{ opacity: 0, y: -8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 520, damping: 34 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className={`h-8 w-8 bg-white/95 rounded-full flex items-center justify-center shadow-md transition-colors ${
                    isInCompare ? "text-blue-600 ring-2 ring-blue-100" : "text-gray-500 hover:text-blue-600"
                  }`}
                  title="Usporedi"
                >
                  <IoGitCompareOutline size={16} />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {(isHovered || item?.is_liked) && (
                <motion.button
                  key="like"
                  onClick={handleLikeItem}
                  initial={{ opacity: 0, y: -8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 520, damping: 34 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="h-8 w-8 bg-white/95 rounded-full flex items-center justify-center shadow-md transition-colors"
                  title="Favorit"
                >
                  {item?.is_liked ? (
                    <motion.span
                      animate={{ scale: [1, 1.18, 1] }}
                      transition={{ duration: 0.35 }}
                      className="inline-flex"
                    >
                      <FaHeart size={14} className="text-red-500 transition-transform duration-300" />
                    </motion.span>
                  ) : (
                    <FaRegHeart size={14} className="text-gray-500 transition-all duration-300 hover:text-red-400" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* STATUS BADGES (Sale + Featured) */}
        {!isViewMoreSlide && (
          <div className="absolute top-2 ltr:left-2 rtl:right-2 z-20 flex items-center gap-1.5">
            {/* FEATURED */}
            {item?.is_feature && (
              <div className="flex items-center justify-center bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-400 rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm">
                <IconRocket size={18} stroke={2} className="text-white" />
              </div>
            )}

            {/* SALE */}
            {isOnSale && discountPercentage > 0 && (
              <div className="flex items-center justify-center bg-red-600 rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm">
                <IconRosetteDiscount size={18} stroke={2} className="text-white" />
              </div>
            )}
          </div>
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
              <div className="bg-black/50 backdrop-blur-md text-white text-[12px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
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
      <div className="flex flex-col gap-1.5 p-2 flex-grow relative">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
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

        <div className="flex-1" />

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <IoTimeOutline size={12} />
            <span>{formatTimeAgo(item?.created_at)}</span>
          </div>

          {!isHidePrice && (
            <div className="flex items-center gap-1">
              {isOnSale && oldPrice && Number(oldPrice) > Number(currentPrice) ? (
                <span className="text-xs text-gray-400 line-through">
                  {formatPriceAbbreviated(oldPrice)}
                </span>
              ) : null}

              <span className="text-sm font-semibold text-foreground">
                {isJobCategory
                  ? formatSalaryRange(item?.min_salary, item?.max_salary)
                  : formatPriceAbbreviated(currentPrice)}
              </span>
            </div>
          )}
        </div>
      </div>
    </CustomLink>
  );
};

export default ProductCard;

// --------------------
// HELPERS iz tvog file-a
// --------------------

function formatTimeAgo(createdAt) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now - date;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Upravo sada";
  if (minutes < 60) return `${minutes} min`;
  if (hours < 24) return `${hours} h`;
  return `${days} d`;
}

function getKeyAttributes(item) {
  const attributes = [];
  const customFields = item?.translated_custom_fields || [];

  const findValue = (keys) => {
    const field = customFields.find((f) => {
      const name = (f?.translated_name || f?.name || "").toLowerCase();
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

  // fallback
  if (attributes.length === 0) {
    const tags = [];
    const skipFields = ["stanje", "condition", "opis", "description", "naslov", "title"];
    for (const field of customFields) {
      if (tags.length >= 3) break;
      const fieldName = (field?.name || field?.translated_name || "").toLowerCase();
      if (skipFields.some((skip) => fieldName.includes(skip))) continue;
      const value = field?.translated_selected_values?.[0] || field?.value?.[0];
      if (value && typeof value === "string" && value.length < 25) tags.push(value);
    }
    return tags;
  }

  return attributes;
}