import React, { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock2Fill,
  Rocket,
  Store,
  TransferFill,
  Youtube,
} from "@/components/Common/UnifiedIconPack";
import { formatPriceAbbreviated, formatSalaryRange } from "@/utils";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { cn } from "@/lib/utils";
import { resolveMembership } from "@/lib/membership";
import { resolveListingCampaignBadge } from "@/lib/listingCampaignBadges";
import { resolveRealEstateDisplayPricing } from "@/utils/realEstatePricing";
import { formatRelativeTimeBs } from "@/utils/timeBosnian";

const getKeyAttributes = (item) => {
  const attributes = [];
  const customFields = item?.translated_custom_fields || [];
  const realEstatePricing = resolveRealEstateDisplayPricing(item || {});
  const isRealEstate = Boolean(realEstatePricing?.isRealEstate);

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

  const formatAreaNoSpace = (rawValue) => {
    if (rawValue === null || rawValue === undefined || rawValue === "")
      return null;
    const cleaned = String(rawValue)
      .trim()
      .replace(/\s*(m2|m²)$/i, "");
    if (!cleaned) return null;
    return `${cleaned.replace(/\s/g, "")}m2`;
  };

  const formatMileageNoSpace = (rawValue) => {
    if (rawValue === null || rawValue === undefined || rawValue === "")
      return null;
    const cleaned = String(rawValue)
      .trim()
      .replace(/^kilometraza\s*\(km\)\s*[:\-]?\s*/i, "")
      .replace(/^kilometraža\s*\(km\)\s*[:\-]?\s*/i, "")
      .replace(/^mileage\s*[:\-]?\s*/i, "")
      .replace(/\s*(km|kilometraza|kilometraža)$/i, "");
    if (!cleaned) return null;
    return `${cleaned.replace(/\s/g, "")}km`;
  };

  const pushUnique = (value) => {
    if (!value) return;
    const normalized = String(value).trim();
    if (!normalized) return;
    if (
      attributes.some(
        (entry) => normalizeText(entry) === normalizeText(normalized),
      )
    )
      return;
    attributes.push(normalized);
  };

  if (isRealEstate) {
    const listingType = findValue([
      "tip oglasa",
      "tip nekretnine",
      "tip ponude",
      "vrsta ponude",
      "offer type",
      "listing type",
      "type",
    ]);
    const rooms = findValue([
      "broj soba",
      "sobe",
      "broj prostorija",
      "rooms",
      "room count",
    ]);
    const propertyType = findValue([
      "vrsta objekta",
      "tip objekta",
      "objekat",
      "object type",
      "property type",
    ]);
    const areaRaw =
      realEstatePricing?.areaM2 ??
      findValue([
        "kvadratura",
        "kvadratura (m2)",
        "povrsina",
        "površina",
        "m²",
        "quadrature",
        "surface",
        "area",
      ]);
    const area = formatAreaNoSpace(areaRaw);

    pushUnique(listingType);
    pushUnique(rooms);
    pushUnique(propertyType);
    pushUnique(area);

    if (attributes.length > 0) {
      return attributes;
    }
  }

  const year = findValue(["godište", "godiste"]);
  pushUnique(year);

  const fuel = findValue(["gorivo"]);
  pushUnique(fuel);

  const transmission = findValue(["mjenjač", "mjenjac"]);
  pushUnique(transmission);

  const mileageRaw = findValue([
    "kilometraza (km)",
    "kilometraža (km)",
    "kilometraza",
    "kilometraža",
    "predena kilometraza",
    "pređena kilometraža",
    "mileage",
    "km",
  ]);
  pushUnique(formatMileageNoSpace(mileageRaw));

  return attributes;
};

const getConditionLabel = (item) => {
  const customFields = item?.translated_custom_fields || [];
  const field = customFields.find((f) => {
    const name = normalizeText(f?.translated_name || f?.name || "");
    return ["stanje oglasa", "stanje", "condition", "item condition"].includes(
      name,
    );
  });

  const rawValue =
    field?.translated_selected_values?.[0] || field?.value?.[0] || field?.value;
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
    else if (candidate !== undefined && candidate !== null)
      flattened.push(candidate);
  }

  return flattened;
};

const readBooleanFromTranslatedFields = (item = {}, fieldNameHints = []) => {
  const hints = fieldNameHints.map((hint) => normalizeText(hint));
  const fields = [
    ...(Array.isArray(item?.translated_custom_fields)
      ? item.translated_custom_fields
      : []),
    ...(Array.isArray(item?.all_translated_custom_fields)
      ? item.all_translated_custom_fields
      : []),
  ];
  if (!fields.length) return null;

  for (const field of fields) {
    const fieldName = normalizeText(
      field?.translated_name || field?.name || "",
    );
    if (!fieldName) continue;
    if (!hints.some((hint) => fieldName.includes(hint))) continue;

    const parsed = readBooleanFromCandidates(
      extractTranslatedFieldValues(field),
    );
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

const OverlayPill = ({ icon: Icon, className, style, children }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold",
      "bg-white/90 text-slate-700 backdrop-blur-sm",
      "dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-200",
      className,
    )}
    style={style}
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

const ProductHorizontalCard = ({ item, onClick, trackingParams }) => {
  const userData = useSelector(userSignUpData);

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
    item?.seller_settings,
  ).isShop;
  const campaignBadge = useMemo(() => resolveListingCampaignBadge(item), [item]);
  const campaignBadgeStyle = useMemo(() => {
    if (!campaignBadge || !campaignBadge.bgColor) return undefined;
    return {
      backgroundColor: campaignBadge.bgColor,
      borderColor: campaignBadge.bgColor,
      color: campaignBadge.textColor || "#FFFFFF",
    };
  }, [campaignBadge]);
  const hasVideo = useMemo(() => {
    const candidates = [
      item?.video_link,
      item?.video,
      item?.video_url,
      item?.direct_video,
      item?.reel_video,
      item?.translated_item?.video_link,
      item?.translated_item?.video,
    ];
    return candidates.some((value) => {
      if (typeof value === "string") return value.trim() !== "";
      if (value && typeof value === "object") {
        const src = value?.url || value?.src || value?.path || value?.image;
        return typeof src === "string" ? src.trim() !== "" : Boolean(src);
      }
      return Boolean(value);
    });
  }, [item]);
  const exchangePossible = readExchangePossible(item);
  const isReserved =
    item?.status === "reserved" || item?.reservation_status === "reserved";

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
    if (
      !Number.isFinite(oldN) ||
      !Number.isFinite(currentN) ||
      oldN <= currentN
    )
      return 0;

    return Math.round(((oldN - currentN) / oldN) * 100);
  }, [item?.discount_percentage, isOnSale, oldPrice, currentPrice]);
  const realEstatePricing = useMemo(
    () => resolveRealEstateDisplayPricing(item),
    [item],
  );
  const showRealEstatePerM2 = !isJobCategory && realEstatePricing?.showPerM2;

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
  const hasImageSlides = slides.some((slide) => slide.type === "image");
  const isViewMoreSlide = slides[currentSlide]?.type === "viewMore";

  const threeDots = useMemo(
    () => getThreeDots(totalSlides, currentSlide),
    [totalSlides, currentSlide],
  );

  const isHidePrice = isJobCategory
    ? [item?.min_salary, item?.max_salary].every(
        (val) =>
          val === null ||
          val === undefined ||
          (typeof val === "string" && val.trim() === ""),
      )
    : false;

  const productLinkBase =
    userData?.id === item?.user_id
      ? `/my-listing/${item?.slug}`
      : `/ad-details/${item?.slug}`;
  const productLink = trackingParams
    ? `${productLinkBase}?${new URLSearchParams(trackingParams).toString()}`
    : productLinkBase;

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
    const startX = e.touches?.[0]?.clientX || 0;
    touchStartX.current = startX;
    touchEndX.current = startX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches?.[0]?.clientX || 0;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches?.[0]?.clientX;
    if (typeof endX === "number") {
      touchEndX.current = endX;
    }

    const swipeDistance = touchStartX.current - touchEndX.current;
    if (Math.abs(swipeDistance) <= 50) {
      touchStartX.current = 0;
      touchEndX.current = 0;
      return;
    }

    if (swipeDistance > 0 && currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else if (swipeDistance < 0 && currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleTouchCancel = () => {
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <CustomLink
      href={productLink}
      onClick={onClick}
      className={cn(
        "group flex w-full overflow-hidden rounded-2xl border border-slate-100 bg-white",
        "transition-colors duration-200 hover:border-slate-200",
        "dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative w-[120px] shrink-0 self-stretch sm:w-[200px] md:w-[230px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div className="relative h-full min-h-[120px] bg-slate-50 dark:bg-slate-950 sm:min-h-[200px] md:min-h-[230px]">
          {slides.map((slide, index) => (
            <div
              key={`${slide.type}-${index}`}
              className={cn(
                "absolute inset-0 transition-all duration-300 ease-out",
                index === currentSlide
                  ? "z-10 scale-100 opacity-100"
                  : "z-0 scale-105 opacity-0",
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
                !hasImageSlides ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-100/80 p-4 text-center dark:bg-slate-900/70">
                    <CustomImage
                      src="/assets/lmx-watermark.png"
                      width={320}
                      height={140}
                      alt="LMX logo"
                      className="h-auto w-[48%] max-w-[150px] min-w-[72px] opacity-50 select-none pointer-events-none"
                    />
                    <p className="max-w-[80%] text-center text-xs leading-tight text-slate-500 sm:text-sm">
                    Oglas bez slike
                    </p>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/5 p-4 text-center">
                    <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                      Otvori oglas
                    </div>
                  </div>
                )
              )}
            </div>
          ))}

          {!isViewMoreSlide ? (
            <div className="absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-black/45 to-transparent" />
          ) : null}

          {!isViewMoreSlide ? (
            <>
              <div className="absolute right-2 top-2 z-30 flex items-center gap-1">
                {hasVideo ? (
                  <span className="inline-flex items-center justify-center rounded-full bg-white/80 p-0.5 backdrop-blur-[1px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      id="Youtube-Fill--Streamline-Mingcute-Fill"
                      height="16"
                      width="16"
                    >
                      <g fill="none" fill-rule="evenodd">
                        <path
                          d="M16 0v16H0V0h16ZM8.395333333333333 15.505333333333333l-0.007333333333333332 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023333333333333334c-0.006666666666666666 -0.0026666666666666666 -0.012666666666666666 -0.0006666666666666666 -0.016 0.003333333333333333l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.011333333333333334 -0.011999999999999999Zm0.17666666666666667 -0.07533333333333334 -0.008666666666666666 0.0013333333333333333 -0.12333333333333332 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.004666666666666666 0.134 0.062c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.0026666666666666666 -0.007333333333333332 0.011333333333333334 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z"
                          stroke-width="0.6667"
                        ></path>
                        <path
                          fill="#0ab6af"
                          d="M8 2.6666666666666665c0.57 0 1.1546666666666665 0.014666666666666665 1.7213333333333332 0.03866666666666667l0.6693333333333333 0.032 0.6406666666666666 0.038 0.6 0.04066666666666666 0.5479999999999999 0.042666666666666665a2.5346666666666664 2.5346666666666664 0 0 1 2.3293333333333335 2.282l0.026666666666666665 0.2833333333333333 0.049999999999999996 0.6066666666666667c0.04666666666666667 0.6286666666666666 0.08133333333333333 1.314 0.08133333333333333 1.9693333333333334 0 0.6553333333333333 -0.034666666666666665 1.3406666666666667 -0.08133333333333333 1.9693333333333334l-0.049999999999999996 0.6066666666666667c-0.008666666666666666 0.09733333333333333 -0.017333333333333333 0.1913333333333333 -0.026666666666666665 0.2833333333333333a2.5346666666666664 2.5346666666666664 0 0 1 -2.33 2.282l-0.5466666666666666 0.041999999999999996 -0.6 0.04133333333333333 -0.6413333333333333 0.038 -0.6693333333333333 0.032c-0.5666666666666667 0.023999999999999997 -1.1513333333333333 0.03866666666666667 -1.7213333333333332 0.03866666666666667 -0.57 0 -1.1546666666666665 -0.014666666666666665 -1.7213333333333332 -0.03866666666666667l-0.6693333333333333 -0.032 -0.6406666666666666 -0.038 -0.6 -0.04133333333333333 -0.5479999999999999 -0.041999999999999996a2.5346666666666664 2.5346666666666664 0 0 1 -2.3293333333333335 -2.282l-0.026666666666666665 -0.2833333333333333 -0.049999999999999996 -0.6066666666666667A27.107999999999997 27.107999999999997 0 0 1 1.3333333333333333 8c0 -0.6553333333333333 0.034666666666666665 -1.3406666666666667 0.08133333333333333 -1.9693333333333334l0.049999999999999996 -0.6066666666666667c0.008666666666666666 -0.09733333333333333 0.017333333333333333 -0.1913333333333333 0.026666666666666665 -0.2833333333333333A2.5346666666666664 2.5346666666666664 0 0 1 3.8200000000000003 2.8586666666666667l0.5473333333333332 -0.042666666666666665 0.6 -0.04066666666666666 0.6413333333333333 -0.038 0.6693333333333333 -0.032C6.8453333333333335 2.6813333333333333 7.43 2.6666666666666665 8 2.6666666666666665Zm-1.3333333333333333 3.716666666666667v3.233333333333333c0 0.308 0.3333333333333333 0.5 0.6 0.3466666666666667l2.8 -1.6166666666666665a0.39999999999999997 0.39999999999999997 0 0 0 0 -0.6933333333333334l-2.8 -1.6159999999999999a0.39999999999999997 0.39999999999999997 0 0 0 -0.6 0.3466666666666667Z"
                          stroke-width="0.6667"
                        ></path>
                      </g>
                    </svg>
                  </span>
                ) : null}
                {isShopSeller ? (
                  <OverlayPill
                    icon={Store}
                    className="border-indigo-200 bg-indigo-100/95 text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-900/55 dark:text-indigo-200"
                  />
                ) : null}

                {isReserved ? (
                  <OverlayPill
                    icon={Clock}
                    className="border-blue-200 bg-blue-100/95 text-blue-700 dark:border-blue-700/60 dark:bg-blue-900/35 dark:text-blue-300"
                  >
                    Rezervisano
                  </OverlayPill>
                ) : null}
                {campaignBadge ? (
                  <OverlayPill
                    className="border-fuchsia-300 bg-fuchsia-100/95 text-fuchsia-800 dark:border-fuchsia-700/60 dark:bg-fuchsia-900/45 dark:text-fuchsia-100"
                    style={campaignBadgeStyle}
                  >
                    {campaignBadge.label}
                  </OverlayPill>
                ) : null}
              </div>
            </>
          ) : null}

          {totalSlides > 1 ? (
            <div
              className={cn(
                "absolute bottom-2 right-2 z-30 hidden items-center gap-1.5 transition-all duration-200 sm:flex",
                isHovered
                  ? "opacity-100"
                  : "pointer-events-none translate-y-1 opacity-0",
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
                      isActive
                        ? "w-6 bg-white dark:bg-slate-100"
                        : "w-1.5 bg-white/70 hover:bg-white dark:bg-slate-400/60 dark:hover:bg-slate-200",
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
                    isHovered
                      ? "opacity-100"
                      : "pointer-events-none opacity-0 -translate-x-2",
                    "sm:flex",
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
                    isHovered
                      ? "opacity-100"
                      : "pointer-events-none opacity-0 translate-x-2",
                    "sm:flex",
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
              {/* {item?.is_feature ? (
                <Rocket
                  className="ml-1 inline-block h-4 w-4 align-[-1px] text-amber-500 dark:text-amber-300"
                  aria-label="Istaknuti oglas"
                />
              ) : null} */}
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
                  "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
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
                    "dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-200",
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
                    "dark:border-emerald-700/70 dark:bg-emerald-900/40 dark:text-emerald-200",
                  )}
                >
                  Dostupno odmah
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-2 sm:flex-row dark:border-slate-800">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Clock2Fill className="h-3.5 w-3.5 text-primary" />
            <span>
              {formatRelativeTimeBs(item?.created_at, {
                capitalize: true,
                nowLabel: "Upravo sada",
              })}
            </span>
          </div>

          {!isHidePrice ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center leading-none sm:items-end">
                {isOnSale && Number(oldPrice) > 0 && discountPercentage > 0 ? (
                  <span className="text-[11px] font-semibold text-slate-400 line-through tabular-nums">
                    {formatPriceAbbreviated(Number(oldPrice))}
                  </span>
                ) : null}

                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    isOnSale &&
                      discountPercentage > 0 &&
                      Number(currentPrice) > 0
                      ? "text-rose-600"
                      : "text-slate-900 dark:text-slate-100",
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
                {showRealEstatePerM2 ? (
                  <span className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                    {formatPriceAbbreviated(
                      Number(realEstatePricing.perM2Value),
                    )}{" "}
                    / m²
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </CustomLink>
  );
};

export default ProductHorizontalCard;
