import React, { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  GitCompare,
  Heart,
  Rocket,
  Store,
  TransferHorizontalLine,
  Youtube,
} from "@/components/Common/UnifiedIconPack";
import { toast } from "@/utils/toastBs";
import { formatPriceAbbreviated, formatSalaryRange, t } from "@/utils";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { addToCompare, removeFromCompare, selectCompareList } from "@/redux/reducer/compareSlice";
import { itemStatisticsApi, manageFavouriteApi } from "@/utils/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { resolveMembership } from "@/lib/membership";

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";

  const now = new Date();
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return "Upravo sada";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return diffInMinutes === 1 ? "Prije 1 minut" : `Prije ${diffInMinutes} minuta`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return diffInHours === 1 ? "Prije 1 sat" : `Prije ${diffInHours} sati`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return diffInDays === 1 ? "Prije 1 dan" : `Prije ${diffInDays} dana`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return diffInMonths === 1 ? "Prije 1 mjesec" : `Prije ${diffInMonths} mjeseci`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return diffInYears === 1 ? "Prije 1 godina" : `Prije ${diffInYears} godina`;
};

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
  if (total <= 3) return Array.from({ length: total }, (_, i) => i);

  if (current === 0) return [0, 1, 2];
  if (current === total - 1) return [total - 3, total - 2, total - 1];
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

const OverlayPill = ({ icon: Icon, className, children }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold",
      "bg-white/90 text-slate-700 backdrop-blur-sm",
      className
    )}
  >
    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
    {children}
  </div>
);

const formatPriceOrInquiry = (price) => {
  if (price === null || price === undefined) return "Na upit";
  if (typeof price === "string" && price.trim() === "") return "Na upit";
  if (Number(price) === 0) return "Na upit";
  return formatPriceAbbreviated(Number(price));
};

const ProductHorizontalCard = ({ item, handleLike, onClick, trackingParams }) => {
  const dispatch = useDispatch();
  const userData = useSelector(userSignUpData);
  const compareList = useSelector(selectCompareList);
  const isInCompare = compareList?.some((i) => i.id === item?.id);

  const translatedItem = item?.translated_item;
  const isJobCategory = Number(item?.category?.is_job_category) === 1;
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
  const hasVideo = Boolean(item?.video_link && String(item?.video_link).trim() !== "");
  const exchangePossible = readExchangePossible(item);
  const isReserved = item?.status === "reserved" || item?.reservation_status === "reserved";

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const isOnSale = item?.is_on_sale === true || item?.is_on_sale === 1;
  const oldPrice = item?.old_price;
  const currentPrice = item?.price;
  const discountPercentage = useMemo(() => {
    const explicit = Number(item?.discount_percentage || 0);
    if (explicit > 0) return explicit;
    if (!isOnSale) return 0;

    const oldN = Number(oldPrice);
    const currentN = Number(currentPrice);
    if (!Number.isFinite(oldN) || !Number.isFinite(currentN) || oldN <= currentN) return 0;

    return Math.round(((oldN - currentN) / oldN) * 100);
  }, [item?.discount_percentage, isOnSale, oldPrice, currentPrice]);

  const slides = useMemo(() => {
    const s = [];
    const seen = new Set();

    const pushImage = (src) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      s.push({ type: "image", src });
    };

    pushImage(item?.image);

    if (Array.isArray(item?.gallery_images) && item.gallery_images.length) {
      item.gallery_images.forEach((img) => pushImage(img?.image || img));
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

  const isHidePrice = isJobCategory
    ? [item?.min_salary, item?.max_salary].every(
        (val) => val === null || val === undefined || (typeof val === "string" && val.trim() === "")
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

        try {
          await itemStatisticsApi.trackFavorite({
            item_id: item?.id,
            added: !item?.is_liked,
          });
        } catch (trackingError) {
          console.warn("Praćenje favorita nije uspjelo.", trackingError);
        }
      } else {
        toast.error(t("failedToLike"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("failedToLike"));
    }
  };

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCompare) {
      dispatch(removeFromCompare(item.id));
      return;
    }

    dispatch(addToCompare(item));
  };

  const handlePrevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSlide > 0) setCurrentSlide((prev) => prev - 1);
  };

  const handleNextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSlide < totalSlides - 1) setCurrentSlide((prev) => prev + 1);
  };

  const goToSlide = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(index);
  };

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

  return (
    <CustomLink
      href={productLink}
      onClick={onClick}
      className={cn(
        "group flex w-full overflow-hidden rounded-2xl border border-slate-100 bg-white",
        "transition-colors duration-200 hover:border-slate-200",
        "dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative w-[120px] shrink-0 self-stretch sm:w-[200px] md:w-[230px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-full min-h-[120px] bg-slate-50 dark:bg-slate-950 sm:min-h-[200px] md:min-h-[230px]">
          {slides.map((slide, index) => (
            <div
              key={`${slide.type}-${index}`}
              className={cn(
                "absolute inset-0 transition-all duration-300 ease-out",
                index === currentSlide ? "z-10 scale-100 opacity-100" : "z-0 scale-105 opacity-0"
              )}
            >
              {slide.type === "image" ? (
                <CustomImage
                  src={slide.src}
                  width={420}
                  height={420}
                  alt={translatedItem?.name || item?.name || "listing"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/5 p-4 text-center">
                  <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                    Otvori oglas
                  </div>
                </div>
              )}
            </div>
          ))}

          {!isViewMoreSlide ? (
            <div className="absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-black/45 to-transparent" />
          ) : null}

          {!isViewMoreSlide ? (
            <>
              <div className="absolute left-2 top-2 z-30 flex items-center gap-1">
                {isShopSeller ? (
                  <OverlayPill
                    icon={Store}
                    className="border-indigo-200 bg-indigo-100/95 text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-900/55 dark:text-indigo-200"
                  />
                ) : null}

                {isReserved ? (
                  <OverlayPill
                    icon={Clock}
                    className="border-blue-200 bg-blue-100/95 text-blue-700"
                  >
                    Rezervisano
                  </OverlayPill>
                ) : null}
              </div>

              <div className="absolute right-2 top-2 z-30 flex items-center gap-1">
                {isHovered ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCompare}
                    className={cn(
                      "h-8 w-8 rounded-full border-slate-200 bg-white/90 shadow-none backdrop-blur-sm transition-all",
                      "hover:border-blue-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-blue-400",
                      isInCompare && "border-blue-200 bg-blue-50/90 text-blue-600 dark:border-blue-400/40 dark:bg-blue-500/15"
                    )}
                    title={isInCompare ? "Ukloni iz usporedbe" : "Dodaj u usporedbu"}
                    aria-label={isInCompare ? "Ukloni iz usporedbe" : "Dodaj u usporedbu"}
                  >
                    <GitCompare className="h-4 w-4" />
                  </Button>
                ) : null}

                {isHovered ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleLikeItem}
                    className={cn(
                      "h-8 w-8 rounded-full border-slate-200 bg-white/90 shadow-none backdrop-blur-sm transition-all",
                      "hover:border-rose-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-rose-400",
                      item?.is_liked &&
                        "border-rose-200 bg-rose-50/90 text-rose-600 dark:border-rose-400/40 dark:bg-rose-500/15"
                    )}
                    title={item?.is_liked ? "Ukloni iz sačuvanih" : "Sačuvaj oglas"}
                    aria-label={item?.is_liked ? "Ukloni iz sačuvanih" : "Sačuvaj oglas"}
                  >
                    <Heart className={cn("h-4 w-4", item?.is_liked && "fill-rose-500")} />
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}

          {!isViewMoreSlide ? (
            <div className="absolute bottom-2 left-2 z-30 flex items-center gap-1.5">
              {hasVideo ? (
                <OverlayPill icon={Youtube} className="border-red-200 bg-red-100/90 text-red-700">
                  Video
                </OverlayPill>
              ) : null}
            </div>
          ) : null}

          {totalSlides > 1 ? (
            <div
              className={cn(
                "absolute bottom-2 right-2 z-30 hidden items-center gap-1.5 transition-all duration-200 sm:flex",
                isHovered ? "opacity-100" : "pointer-events-none translate-y-1 opacity-0"
              )}
            >
              {threeDots.map((index) => {
                const isActive = index === currentSlide;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => goToSlide(e, index)}
                    aria-label={`Slide ${index + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      isActive ? "w-6 bg-white" : "w-1.5 bg-white/70 hover:bg-white"
                    )}
                  />
                );
              })}
            </div>
          ) : null}

          {totalSlides > 1 ? (
            <>
              {currentSlide > 0 ? (
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className={cn(
                    "absolute left-2 top-1/2 z-30 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full",
                    "border border-slate-200 bg-white/90 text-slate-700 backdrop-blur-sm transition-all duration-200",
                    "dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200",
                    isHovered ? "opacity-100" : "pointer-events-none opacity-0 -translate-x-2",
                    "sm:flex"
                  )}
                  aria-label="Prethodna slika"
                >
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                </button>
              ) : null}

              {currentSlide < totalSlides - 1 ? (
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className={cn(
                    "absolute right-2 top-1/2 z-30 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full",
                    "border border-slate-200 bg-white/90 text-slate-700 backdrop-blur-sm transition-all duration-200",
                    "dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200",
                    isHovered ? "opacity-100" : "pointer-events-none opacity-0 translate-x-2",
                    "sm:flex"
                  )}
                  aria-label="Sljedeća slika"
                >
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3
              className="line-clamp-2 min-w-0 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-primary dark:text-slate-100"
              title={item?.is_feature ? "Istaknuti oglas" : undefined}
            >
              {translatedItem?.name || item?.name}
              {item?.is_feature ? (
                <Rocket
                  className="ml-1 inline-block h-4 w-4 align-[-1px] text-amber-500 dark:text-amber-300"
                  aria-label="Istaknuti oglas"
                />
              ) : null}
            </h3>
          </div>

          
        </div>

        {Array.isArray(keyAttributes) && keyAttributes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {keyAttributes.map((attr, index) => (
              <span
                key={`${attr}-${index}`}
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                  "border-slate-100 bg-slate-50 text-slate-700",
                  "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                )}
              >
                {attr}
              </span>
            ))}
          </div>
        ) : null}

        {conditionLabel || availableNow ? (
          <div className="flex">
            <div className="inline-flex max-w-full flex-wrap items-center justify-end gap-1.5">
              {conditionLabel ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1",
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
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1",
                    "text-[10px] font-semibold leading-none",
                    "border-emerald-300 bg-emerald-100/95 text-emerald-800 shadow-sm",
                    "dark:border-emerald-700/70 dark:bg-emerald-900/40 dark:text-emerald-200"
                  )}
                >
                  Dostupno odmah
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
          
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatRelativeTime(item?.created_at)}</span>
          </div>

          

          {!isHidePrice ? (
            <div className="flex items-center gap-2">
              {exchangePossible ? (
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full",
                  )}
                  title="Zamjena moguća"
                  aria-label="Zamjena moguća"
                >
                  <TransferHorizontalLine className="h-4 w-4" />
                </span>
              ) : null}

              <div className="flex flex-col items-end leading-none">
                {isOnSale && Number(oldPrice) > 0 && discountPercentage > 0 ? (
                  <span className="text-[11px] font-semibold text-slate-400 line-through tabular-nums">
                    {formatPriceAbbreviated(Number(oldPrice))}
                  </span>
                ) : null}

                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    isOnSale && discountPercentage > 0 && Number(currentPrice) > 0
                      ? "text-rose-600"
                      : "text-slate-900 dark:text-slate-100"
                  )}
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
            </div>
          ) : null}
        </div>
      </div>
    </CustomLink>
  );
};

export default ProductHorizontalCard;
