import React, { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPriceAbbreviated, formatSalaryRange } from "@/utils";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { useDispatch, useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { addToCompare, removeFromCompare, selectCompareList } from "@/redux/reducer/compareSlice";
import { itemStatisticsApi, manageFavouriteApi } from "@/utils/api";
import { toast } from "@/utils/toastBs";

import {
  Heart,
  Images,
  MapPin,
  Clock,
  Rocket,
  Youtube,
  ChevronLeft,
  ChevronRight,
  GitCompare,
} from "@/components/Common/UnifiedIconPack";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================
// POMOĆNE FUNKCIJE
// ============================================

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return "Upravo sada";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60)
    return diffInMinutes === 1 ? "Prije 1 minut" : `Prije ${diffInMinutes} minuta`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return diffInHours === 1 ? "Prije 1 sat" : `Prije ${diffInHours} sati`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30)
    return diffInDays === 1 ? "Prije 1 dan" : `Prije ${diffInDays} dana`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12)
    return diffInMonths === 1 ? "Prije 1 mjesec" : `Prije ${diffInMonths} mjeseci`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return diffInYears === 1 ? "Prije 1 godina" : `Prije ${diffInYears} godina`;
};

const getKeyAttributes = (item) => {
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
};

const getThreeDots = (total, current) => {
  if (total <= 3) {
    return Array.from({ length: total }, (_, i) => i);
  }

  if (current === 0) {
    return [0, 1, 2];
  }

  if (current === total - 1) {
    return [total - 3, total - 2, total - 1];
  }

  return [current - 1, current, current + 1];
};

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const toBoolean = (value) => {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;

  const normalized = normalizeText(value);
  if (!normalized) return null;

  if (
    [
      "true",
      "yes",
      "da",
      "moguce",
      "moguca",
      "moze",
      "ukljuceno",
      "enabled",
      "on",
      "active",
      "aktivan",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "no",
      "ne",
      "nemoguce",
      "nemoguca",
      "ne moze",
      "iskljuceno",
      "disabled",
      "off",
      "inactive",
      "neaktivan",
    ].includes(normalized)
  ) {
    return false;
  }

  return null;
};

const parseJsonSafe = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const readBooleanFromCustomFields = (customFieldsValue, keys = []) => {
  const keysSet = new Set(keys);
  const customFields = parseJsonSafe(customFieldsValue);
  if (!customFields || typeof customFields !== "object") return null;

  const walk = (node) => {
    if (!node || typeof node !== "object") return null;

    for (const [key, value] of Object.entries(node)) {
      if (keysSet.has(key)) {
        const parsed = toBoolean(value);
        if (parsed !== null) return parsed;
      }

      if (value && typeof value === "object") {
        const nested = walk(value);
        if (nested !== null) return nested;
      }
    }

    return null;
  };

  return walk(customFields);
};

const readExchangeFromTranslatedFields = (item = {}) => {
  const fields = [
    ...(Array.isArray(item?.translated_custom_fields) ? item.translated_custom_fields : []),
    ...(Array.isArray(item?.all_translated_custom_fields) ? item.all_translated_custom_fields : []),
  ];

  for (const field of fields) {
    const fieldName = normalizeText(field?.translated_name || field?.name || "");
    if (!fieldName) continue;
    if (!["zamjen", "zamena", "exchange", "trade", "swap"].some((hint) => fieldName.includes(hint))) {
      continue;
    }

    const values = [
      field?.translated_selected_values,
      field?.selected_values,
      field?.value,
      field?.translated_value,
      field?.selected_value,
      field?.translated_selected_value,
    ];

    for (const candidate of values) {
      if (Array.isArray(candidate)) {
        for (const nested of candidate) {
          const parsedNested = toBoolean(nested);
          if (parsedNested !== null) return parsedNested;
        }
      } else {
        const parsed = toBoolean(candidate);
        if (parsed !== null) return parsed;
      }
    }
  }

  return null;
};

const readExchangePossible = (item = {}) => {
  const directCandidates = [
    item?.exchange_possible,
    item?.is_exchange,
    item?.is_exchange_possible,
    item?.allow_exchange,
    item?.exchange,
    item?.zamjena,
    item?.zamena,
    item?.translated_item?.exchange_possible,
    item?.translated_item?.is_exchange,
    item?.translated_item?.allow_exchange,
    item?.translated_item?.zamjena,
  ];

  for (const candidate of directCandidates) {
    const parsed = toBoolean(candidate);
    if (parsed !== null) return parsed;
  }

  const fromCustomFields = readBooleanFromCustomFields(item?.custom_fields, [
    "exchange_possible",
    "is_exchange",
    "is_exchange_possible",
    "allow_exchange",
    "exchange",
    "zamjena",
    "zamena",
    "trade",
    "swap",
  ]);
  if (fromCustomFields !== null) return fromCustomFields;

  const fromTranslatedFields = readExchangeFromTranslatedFields(item);
  if (fromTranslatedFields !== null) return fromTranslatedFields;

  return false;
};

// ============================================
// UI KOMPONENTE
// ============================================

const OverlayPill = ({ icon: Icon, children, className }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5",
      "px-2 py-1 rounded-lg border text-[11px] font-semibold",
      "bg-white/90 backdrop-blur-sm",
      "shadow-sm",
      className
    )}
  >
    {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
    {children}
  </div>
);

// ============================================
// KARTICA
// ============================================

const ProductCard = ({ item, handleLike, isLoading, onClick, trackingParams }) => {
  const dispatch = useDispatch();
  const userData = useSelector(userSignUpData);
  const compareList = useSelector(selectCompareList);
  const isInCompare = compareList?.some((i) => i.id === item?.id);

  const isJobCategory = Number(item?.category?.is_job_category) === 1;
  const translated_item = item?.translated_item;

  const keyAttributes = getKeyAttributes(item);
  const displayCity = item?.translated_city || item?.city || "";

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Refovi za dodir/klizanje
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const isOnSale = item?.is_on_sale === true || item?.is_on_sale === 1;
  const oldPrice = item?.old_price;
  const currentPrice = item?.price;
  const discountPercentage = useMemo(() => {
    const explicit = Number(item?.discount_percentage || 0);
    if (explicit > 0) return explicit;

    if (!isOnSale) return 0;
    if (!oldPrice || !currentPrice) return 0;

    const oldN = Number(oldPrice);
    const curN = Number(currentPrice);
    if (!Number.isFinite(oldN) || !Number.isFinite(curN) || oldN <= curN) return 0;

    return Math.round(((oldN - curN) / oldN) * 100);
  }, [item?.discount_percentage, isOnSale, oldPrice, currentPrice]);

  const hasVideo = !!(item?.video_link && String(item?.video_link).trim() !== "");
  const exchangePossible = readExchangePossible(item);
  const isReserved =
    item?.status === "reserved" || item?.reservation_status === "reserved";

  // Priprema slajdova
  const slides = useMemo(() => {
    const s = [];
    const seen = new Set();

    const pushImage = (src) => {
      if (!src) return;
      if (seen.has(src)) return;
      seen.add(src);
      s.push({ type: "image", src });
    };

    pushImage(item?.image);

    if (Array.isArray(item?.gallery_images) && item.gallery_images.length) {
      item.gallery_images.forEach((img) => {
        const src = img?.image || img;
        pushImage(src);
      });
    }

    s.push({ type: "viewMore" });
    return s;
  }, [item?.image, item?.gallery_images]);

  const totalSlides = slides.length;
  const totalImages = Math.max(0, totalSlides - 1);
  const isViewMoreSlide = slides[currentSlide]?.type === "viewMore";

  const threeDots = useMemo(
    () => getThreeDots(totalSlides, currentSlide),
    [totalSlides, currentSlide]
  );

  // Kontrole za slajder
  const handlePrevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleNextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const goToSlide = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(index);
  };

  // Logika za dodir
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX || 0;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches?.[0]?.clientX || 0;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    if (Math.abs(swipeDistance) <= 50) return;

    if (swipeDistance > 0 && currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else if (swipeDistance < 0 && currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

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
        const nextLiked = !item?.is_liked;
        try {
          await itemStatisticsApi.trackFavorite({ item_id: item?.id, added: nextLiked });
        } catch (trackingError) {
          console.warn("Praćenje favorita nije uspjelo.", trackingError);
        }
      } else {
        toast.error("Greška pri dodavanju u favorite");
      }
    } catch (error) {
      console.log(error);
      toast.error("Greška pri dodavanju u favorite");
    }
  };

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCompare) {
      dispatch(removeFromCompare(item.id));
    } else {
      dispatch(addToCompare(item));
    }
  };

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

  const productLinkBase =
    userData?.id === item?.user_id
      ? `/my-listing/${item?.slug}`
      : `/ad-details/${item?.slug}`;
  const productLink = trackingParams
    ? `${productLinkBase}?${new URLSearchParams(trackingParams).toString()}`
    : productLinkBase;

  if (isLoading) {
    return <ProductCardSkeleton />;
  }

  return (
    <CustomLink
      href={productLink}
      className={cn(
        "group relative flex flex-col h-full overflow-hidden",
        "bg-white rounded-xl border border-slate-100",
        "transition-all duration-200",
        "hover:shadow-sm",
        "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* MEDIJ */}
      <div
        className={cn("relative overflow-hidden", "rounded-t-xl", "touch-pan-y")}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative aspect-square bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {slides[currentSlide].type === "image" ? (
                <CustomImage
                  src={slides[currentSlide].src}
                  width={420}
                  height={420}
                  className="w-full h-full object-cover"
                  alt={translated_item?.name || item?.name || "listing"}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-primary/5">
                  <motion.div
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/15"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </motion.div>
                  <p className="text-sm font-semibold text-slate-900 text-center">Detalji</p>
                  <p className="text-xs text-slate-500 text-center mt-1">Otvori oglas</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Status gore-lijevo */}
          {!isViewMoreSlide ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute left-2 top-2 z-20 flex items-center gap-2"
            >
              {item?.is_feature ? (
                <OverlayPill
                  icon={Rocket}
                  className="border-amber-200 bg-amber-100/95 text-amber-700"
                />
              ) : null}
              {/* {isReserved ? (
                <OverlayPill
                  // icon={Clock}
                  className="border-blue-200 bg-blue-100/95 text-blue-700"
                >
                  Rezervisano
                </OverlayPill>
              ) : null} */}
            </motion.div>
          ) : null}

          {/* Dugmad za akcije gore-desno */}
          <div className="absolute top-2 right-2 z-30 flex items-center gap-1">
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCompare}
                    className={cn(
                      "h-8 w-8 rounded-full",
                      "bg-white/90 backdrop-blur-sm",
                      "border-slate-200 shadow-sm",
                      "hover:bg-white hover:border-primary/30",
                      isInCompare && "text-blue-600 border-blue-200 bg-blue-50/90"
                    )}
                    title={isInCompare ? "Ukloni iz usporedbe" : "Dodaj u usporedbu"}
                    aria-label={isInCompare ? "Ukloni iz usporedbe" : "Dodaj u usporedbu"}
                  >
                    <GitCompare className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleLikeItem}
                    className={cn(
                      "h-8 w-8 rounded-full",
                      "bg-white/90 backdrop-blur-sm",
                      "border-slate-200 shadow-sm",
                      "hover:bg-white hover:border-rose-300",
                      item?.is_liked && "text-rose-600 border-rose-200 bg-rose-50/90"
                    )}
                    title={item?.is_liked ? "Ukloni iz sačuvanih" : "Sačuvaj oglas"}
                    aria-label={item?.is_liked ? "Ukloni iz sačuvanih" : "Sačuvaj oglas"}
                  >
                    <Heart
                      className={cn("w-4 h-4", item?.is_liked && "fill-rose-500")}
                    />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Meta informacije dolje-lijevo */}
          {!isViewMoreSlide && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-2 left-2 z-20 flex items-center gap-2"
            >
              {hasVideo ? (
                <OverlayPill icon={Youtube} className="text-red-700 bg-red-100/90 border-red-200">
                  Video
                </OverlayPill>
              ) : null}

              {totalImages > 1 ? (
                <OverlayPill icon={Images} className="text-slate-700 bg-white/90 border-slate-200">
                  {totalImages}
                </OverlayPill>
              ) : null}
            </motion.div>
          )}

          {/* Tačkice */}
          {totalSlides > 1 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "absolute bottom-2 right-2 z-20 hidden sm:flex items-center gap-1.5 transition-all duration-200",
                isHovered ? "opacity-100" : "pointer-events-none translate-y-1 opacity-0"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  "px-2 py-1 rounded-full",
                  "bg-black/20 backdrop-blur-sm",
                  "border border-white/15"
                )}
              >
                {threeDots.map((index) => {
                  const isActive = index === currentSlide;
                  return (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={(e) => goToSlide(e, index)}
                      className={cn(
                        "h-1.5 rounded-full",
                        isActive ? "bg-white" : "bg-white/70"
                      )}
                      aria-label={`Slide ${index + 1}`}
                      initial={false}
                      animate={{
                        width: isActive ? 24 : 6
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  );
                })}
              </div>
            </motion.div>
          ) : null}

          {/* Strelice za prethodnu/sljedeću sliku */}
          {totalSlides > 1 && (
            <>
              {currentSlide > 0 && (
                <motion.button
                  type="button"
                  onClick={handlePrevSlide}
                  className={cn(
                    "absolute ltr:left-2 rtl:right-2 top-1/2 -translate-y-1/2 z-20",
                    "hidden sm:flex items-center justify-center",
                    "w-8 h-8 rounded-full",
                    "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm",
                    "transition-all duration-200",
                    isHovered
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 ltr:-translate-x-3 rtl:translate-x-3"
                  )}
                  aria-label="Prethodna slika"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    x: isHovered ? 0 : -20
                  }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-4 h-4 text-slate-700 rtl:rotate-180" />
                </motion.button>
              )}

              {currentSlide < totalSlides - 1 && (
                <motion.button
                  type="button"
                  onClick={handleNextSlide}
                  className={cn(
                    "absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 z-20",
                    "hidden sm:flex items-center justify-center",
                    "w-8 h-8 rounded-full",
                    "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm",
                    "transition-all duration-200",
                    isHovered
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 ltr:translate-x-3 rtl:-translate-x-3"
                  )}
                  aria-label="Sljedeća slika"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    x: isHovered ? 0 : 20
                  }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-4 h-4 text-slate-700 rtl:rotate-180" />
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>

      {/* SADRŽAJ */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <motion.h3 
            whileHover={{ color: "hsl(var(--primary))" }}
            className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors"
          >
            {translated_item?.name || item?.name}
          </motion.h3>
          {exchangePossible ? (
            <span
              className="mt-0.5 inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center text-slate-500 dark:text-slate-300"
              title="Zamjena moguća"
              aria-label="Zamjena moguća"
            >
              
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" id="Transfer-3-Fill--Streamline-Mingcute-Fill" height="16" width="16">
              <g fill="none" fill-rule="nonzero">
                <path d="M16 0v16H0V0h16ZM8.395333333333333 15.505333333333333l-0.007333333333333332 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023333333333333334c-0.006666666666666666 -0.0026666666666666666 -0.012666666666666666 -0.0006666666666666666 -0.016 0.003333333333333333l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.011333333333333334 -0.011999999999999999Zm0.17666666666666667 -0.07533333333333334 -0.008666666666666666 0.0013333333333333333 -0.12333333333333332 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.004666666666666666 0.134 0.062c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.0026666666666666666 -0.007333333333333332 0.011333333333333334 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z" stroke-width="0.6667"></path>
                <path fill="#0ab6af" d="M5.706666666666667 7.933333333333334a1 1 0 0 1 0 1.4133333333333333l-0.6493333333333333 0.6506666666666666H10.666666666666666a1 1 0 0 1 0 2H5.057333333333333l0.6499999999999999 0.6493333333333333a1 1 0 1 1 -1.4146666666666665 1.4146666666666665l-2.3566666666666665 -2.357333333333333a1 1 0 0 1 0 -1.414l2.3566666666666665 -2.357333333333333a1 1 0 0 1 1.4146666666666665 0Zm4.586666666666666 -6a1 1 0 0 1 1.338 -0.06933333333333333l0.076 0.06866666666666665 2.3566666666666665 2.357333333333333a1 1 0 0 1 0.06866666666666665 1.338l-0.06866666666666665 0.076 -2.3566666666666665 2.357333333333333a1 1 0 0 1 -1.4833333333333334 -1.3386666666666667l0.06866666666666665 -0.076 0.6499999999999999 -0.6493333333333333H5.333333333333333a1 1 0 0 1 -0.09599999999999999 -1.996L5.333333333333333 3.9973333333333336h5.609333333333333l-0.6499999999999999 -0.6499999999999999a1 1 0 0 1 0 -1.4146666666666665Z" stroke-width="0.6667"></path>
              </g>
            </svg>
            </span>
          ) : null}
        </div>

        {/* Lokacija */}
        {/* <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{displayCity}</span>
        </div> */}

        {Array.isArray(keyAttributes) && keyAttributes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {keyAttributes.map((attr, index) => (
              <motion.span
                key={`${attr}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "inline-flex items-center",
                  "px-2 py-0.5 rounded-md border",
                  "bg-slate-50 text-slate-700 border-slate-100",
                  "text-[10px] font-semibold"
                )}
              >
                {attr}
              </motion.span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-2 border-t border-slate-100 flex flex-col gap-4 items-center md:flex-row md:justify-between md:gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRelativeTime(item?.created_at)}</span>
            </div>
          </div>

          {!isHidePrice ? (
            isJobCategory ? (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-bold text-slate-900"
              >
                {formatSalaryRange(item?.min_salary, item?.max_salary)}
              </motion.span>
            ) : isOnSale && oldPrice && currentPrice && Number(oldPrice) > Number(currentPrice) ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-end leading-none"
              >
                <span className="text-[11px] font-semibold text-slate-400 line-through tabular-nums">
                  {formatPriceAbbreviated(oldPrice)}
                </span>
                <span className="text-sm font-bold text-rose-600 tabular-nums">
                  {formatPriceAbbreviated(currentPrice)}
                </span>
              </motion.div>
            ) : (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-bold text-slate-900 tabular-nums"
              >
                {formatPriceAbbreviated(item?.price)}
              </motion.span>
            )
          ) : null}
        </div>
      </div>
    </CustomLink>
  );
};

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

export default ProductCard;
