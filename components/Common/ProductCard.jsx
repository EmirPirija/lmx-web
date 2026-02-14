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
  Rocket,
  Youtube,
  Store,
  TransferHorizontalLine,
  ChevronLeft,
  ChevronRight,
  GitCompare,
} from "@/components/Common/UnifiedIconPack";
import { resolveMembership } from "@/lib/membership";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================
// POMOĆNE FUNKCIJE
// ============================================

const getKeyAttributes = (item) => {
  const attributes = [];
  const customFields = item?.translated_custom_fields || [];

  const findValue = (keys) => {
    const field = customFields.find((f) => {
      const name = normalizeText(f?.translated_name || f?.name || "");
      return keys.some((key) => name === normalizeText(key));
    });
    return (
      field?.translated_selected_values?.[0] ||
      field?.selected_values?.[0] ||
      field?.value?.[0] ||
      field?.value
    );
  };

  const year = findValue(["godište", "godiste"]);
  if (year) attributes.push(year);

  const fuel = findValue(["gorivo"]);
  if (fuel) attributes.push(fuel);

  const transmission = findValue(["mjenjač", "mjenjac"]);
  if (transmission) attributes.push(transmission);

  return attributes;
};

const getConditionLabel = (item) => {
  const customFields = item?.translated_custom_fields || [];
  const field = customFields.find((f) => {
    const name = normalizeText(f?.translated_name || f?.name || "");
    return ["stanje oglasa", "stanje", "condition", "item condition"].includes(name);
  });

  const rawValue = field?.translated_selected_values?.[0] || field?.value?.[0] || field?.value;
  if (!rawValue) return "";

  const normalized = normalizeText(rawValue);
  if (["novo", "new", "nekoristeno", "unused"].includes(normalized)) {
    return "Novo";
  }
  if (["koristeno", "used", "polovno", "rabljeno"].includes(normalized)) {
    return "Korišteno";
  }

  return String(rawValue).trim();
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
      "odmah",
      "dostupno",
      "dostupan",
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
      "nije",
      "nedostupno",
      "nedostupan",
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

const readBooleanFromCandidates = (candidates = []) => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      for (const nested of candidate) {
        const parsedNested = toBoolean(nested);
        if (parsedNested !== null) return parsedNested;
      }
      continue;
    }

    const parsed = toBoolean(candidate);
    if (parsed !== null) return parsed;
  }

  return null;
};

const readBooleanFromCustomFields = (customFieldsValue, keys = []) => {
  const keysSet = new Set(keys.map((key) => normalizeText(key)));
  const customFields = parseJsonSafe(customFieldsValue);
  if (!customFields || typeof customFields !== "object") return null;

  const walk = (node) => {
    if (!node || typeof node !== "object") return null;

    for (const [key, value] of Object.entries(node)) {
      if (keysSet.has(normalizeText(key))) {
        const parsed = readBooleanFromCandidates([value]);
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

const extractTranslatedFieldValues = (field) => {
  const candidates = [
    field?.translated_selected_values,
    field?.selected_values,
    field?.value,
    field?.translated_value,
    field?.selected_value,
    field?.translated_selected_value,
  ];

  const flattened = [];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) flattened.push(...candidate);
    else if (candidate !== undefined && candidate !== null) flattened.push(candidate);
  }

  return flattened;
};

const readBooleanFromTranslatedFields = (item = {}, fieldNameHints = []) => {
  const hints = fieldNameHints.map((hint) => normalizeText(hint));
  const fields = [
    ...(Array.isArray(item?.translated_custom_fields) ? item.translated_custom_fields : []),
    ...(Array.isArray(item?.all_translated_custom_fields) ? item.all_translated_custom_fields : []),
  ];
  if (!fields.length) return null;

  for (const field of fields) {
    const fieldName = normalizeText(field?.translated_name || field?.name || "");
    if (!fieldName) continue;
    if (!hints.some((hint) => fieldName.includes(hint))) continue;

    const parsed = readBooleanFromCandidates(extractTranslatedFieldValues(field));
    if (parsed !== null) return parsed;
  }

  return null;
};

const readAvailableNow = (item = {}) => {
  const directCandidates = [
    item?.available_now,
    item?.is_available,
    item?.is_avaible,
    item?.isAvailable,
    item?.availableNow,
    item?.dostupno_odmah,
    item?.ready_for_pickup,
    item?.translated_item?.available_now,
    item?.translated_item?.is_available,
    item?.translated_item?.is_avaible,
    item?.translated_item?.isAvailable,
    item?.translated_item?.availableNow,
    item?.translated_item?.dostupno_odmah,
    item?.translated_item?.ready_for_pickup,
  ];

  const direct = readBooleanFromCandidates(directCandidates);
  if (direct !== null) return direct;

  const fromCustomFields = readBooleanFromCustomFields(item?.custom_fields, [
    "available_now",
    "is_available",
    "is_avaible",
    "isAvailable",
    "availableNow",
    "dostupno_odmah",
    "ready_for_pickup",
  ]);
  if (fromCustomFields !== null) return fromCustomFields;

  const fromTranslatedFields = readBooleanFromTranslatedFields(item, [
    "dostup",
    "available",
    "isporuk",
    "odmah",
    "ready",
  ]);
  if (fromTranslatedFields !== null) return fromTranslatedFields;

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

  const direct = readBooleanFromCandidates(directCandidates);
  if (direct !== null) return direct;

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

  const fromTranslatedFields = readBooleanFromTranslatedFields(item, [
    "zamjen",
    "zamena",
    "exchange",
    "trade",
    "swap",
  ]);
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

const formatPriceOrInquiry = (price) => {
  if (price === null || price === undefined) return "Na upit";
  if (typeof price === "string" && price.trim() === "") return "Na upit";
  if (Number(price) === 0) return "Na upit";
  return formatPriceAbbreviated(Number(price));
};

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
  const conditionLabel = getConditionLabel(item);
  const availableNow = readAvailableNow(item);
  const isShopSeller = resolveMembership(
    item,
    item?.membership,
    item?.user,
    item?.user?.membership,
    item?.seller,
    item?.seller_settings
  ).isShop;

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
  const topStatusCount = [Boolean(conditionLabel), Boolean(availableNow)].filter(Boolean).length;

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
    : false;

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
        className={cn("relative overflow-visible", "rounded-t-xl", "touch-pan-y")}
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
              {isShopSeller ? (
                <OverlayPill
                  icon={Store}
                  className="border-indigo-200 bg-indigo-100/95 text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-900/55 dark:text-indigo-200"
                />
              ) : null}
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
              className="absolute bottom-2 right-2 z-10 flex items-center gap-2"
            >
              {hasVideo ? (
                <OverlayPill icon={Youtube} className="text-red-700 bg-red-100/90 border-red-200">
                  Video
                </OverlayPill>
              ) : null}
            </motion.div>
          )}

          {/* Status strip na prijelomu slike i donjeg bijelog dijela */}
          {!isViewMoreSlide && (conditionLabel || availableNow) ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="pointer-events-none absolute left-2 right-2 -bottom-3 z-30 flex flex-wrap items-center gap-1.5"
            >
              {conditionLabel ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1",
                    "text-[10px] font-semibold leading-none",
                    "border-slate-300 bg-white/95 text-slate-700 shadow-sm",
                    "dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-200"
                  )}
                >
                  {conditionLabel}
                </span>
              ) : null}

              {availableNow ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1",
                    "text-[10px] font-semibold leading-none",
                    "border-emerald-300 bg-emerald-100/95 text-emerald-800 shadow-sm",
                    "dark:border-emerald-700/70 dark:bg-emerald-900/40 dark:text-emerald-200"
                  )}
                >
                  Dostupno
                </span>
              ) : null}

            </motion.div>
          ) : null}

          {/* Tačkice */}
          {/* {totalSlides > 1 ? (
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
          ) : null} */}

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
      <div
        className={cn(
          "flex flex-col gap-2 p-3 flex-1",
          topStatusCount >= 2 ? "pt-5" : topStatusCount >= 1 ? "pt-8" : null
        )}
      >

        <div className="flex items-start justify-between gap-2">
          <motion.h3 
            whileHover={{ color: "hsl(var(--primary))" }}
            className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors"
          >
            {translated_item?.name || item?.name}
          </motion.h3>
          {item?.is_feature ? (
            <span
              className="mt-0.5 inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center text-slate-500 dark:text-slate-300"
              title="Istaknuti oglas"
              aria-label="Istaknuti oglas"
            >
              <Rocket className="h-4 w-4 text-amber-500 dark:text-amber-300" />
            </span>
          ) : null}
        </div>

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

        <div
          className={cn(
            "mt-auto pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center",
            exchangePossible && !isHidePrice ? "justify-between" : "justify-end"
          )}
        >
          {exchangePossible && !isHidePrice ? (
            <span
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-full border",
                "border-cyan-300 bg-cyan-100/95 text-cyan-700 shadow-sm",
                "dark:border-cyan-700/70 dark:bg-cyan-900/40 dark:text-cyan-200"
              )}
              title="Zamjena moguća"
              aria-label="Zamjena moguća"
            >
              <TransferHorizontalLine className="h-4 w-4" />
            </span>
          ) : null}
          {!isHidePrice ? (
            isJobCategory ? (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-bold text-slate-900 dark:text-slate-100"
              >
                {formatSalaryRange(item?.min_salary, item?.max_salary)}
              </motion.span>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-end leading-none"
              >
                {isOnSale && Number(oldPrice) > 0 && Number(currentPrice) > 0 && Number(oldPrice) > Number(currentPrice) ? (
                  <span className="text-[11px] font-semibold text-slate-400 line-through tabular-nums">
                    {formatPriceAbbreviated(Number(oldPrice))}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    isOnSale &&
                      Number(oldPrice) > 0 &&
                      Number(currentPrice) > 0 &&
                      Number(oldPrice) > Number(currentPrice)
                      ? "text-rose-600"
                      : "text-slate-900 dark:text-slate-100"
                  )}
                  title={formatPriceOrInquiry(item?.price)}
                >
                  {formatPriceOrInquiry(item?.price)}
                </span>
              </motion.div>
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
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <Skeleton className="relative aspect-square w-full rounded-none border-0 shadow-none" />
      <div className="p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
        <div className="flex gap-1">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-10 rounded" />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
