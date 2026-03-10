import React, { memo, useMemo, useState, useRef } from "react";
import { formatPriceAbbreviated, formatSalaryRange } from "@/utils";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { resolveRealEstateDisplayPricing } from "@/utils/realEstatePricing";
import { formatRelativeTimeBs } from "@/utils/timeBosnian";

import {
  Youtube,
  Store,
  ChevronLeft,
  ChevronRight,
} from "@/components/Common/UnifiedIconPack";
import { resolveMembership } from "@/lib/membership";
import { resolveListingCampaignBadge } from "@/lib/listingCampaignBadges";

import { cn } from "@/lib/utils";

// ============================================
// POMOĆNE FUNKCIJE
// ============================================

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
  return "";
};

const getOfferModeFromValue = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  if (
    normalized.includes("iznajmlj") ||
    normalized.includes("rent") ||
    normalized.includes("lease")
  ) {
    return "Iznajmljivanje";
  }

  if (
    normalized.includes("prodaj") ||
    normalized.includes("sale") ||
    normalized === "sell" ||
    normalized.includes("kupovina")
  ) {
    return "Prodaja";
  }

  return null;
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

const getListingStatusMeta = (item = {}, availableNow = null) => {
  const status = normalizeText(
    item?.status || item?.translated_item?.status || "",
  );
  const reservationStatus = normalizeText(
    item?.reservation_status || item?.translated_item?.reservation_status || "",
  );
  const hasReservedUser = Boolean(item?.reserved_for_user_id);

  const isSold = [
    "soldout",
    "sold out",
    "sold",
    "prodano",
    "rasprodano",
  ].includes(status);
  const isReserved =
    ["reserved", "rezervisano"].includes(status) ||
    ["reserved", "rezervisano"].includes(reservationStatus) ||
    hasReservedUser;

  if (isSold) {
    return {
      label: "Prodano",
      className:
        "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-700/70 dark:bg-rose-900/40 dark:text-rose-200",
    };
  }

  if (isReserved) {
    return {
      label: "Rezervisano",
      className:
        "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-600/70 dark:bg-amber-900/40 dark:text-amber-200",
    };
  }

  if (
    availableNow === false &&
    status &&
    !["approved", "active", "featured"].includes(status)
  ) {
    return {
      label: "Rezervisano",
      className:
        "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-600/70 dark:bg-amber-900/40 dark:text-amber-200",
    };
  }

  return {
    label: "Dostupno",
    className:
      "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700/70 dark:bg-emerald-900/40 dark:text-emerald-200",
  };
};

const getPrimaryStatusBadgeMeta = (conditionLabel = "", fallbackMeta) => {
  const normalizedCondition = normalizeText(conditionLabel);
  if (normalizedCondition === "novo") {
    return {
      label: "Novo",
      className:
        "border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-700/70 dark:bg-sky-900/40 dark:text-sky-200",
    };
  }

  return fallbackMeta;
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
      "dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-200",
      "shadow-sm",
      className,
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

const META_CHIP_CLASS =
  "inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold leading-none text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200";
const STATUS_CHIP_BASE_CLASS =
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none";

// ============================================
// KARTICA
// ============================================

const ProductCard = ({ item, isLoading, onClick, trackingParams }) => {
  const userData = useSelector(userSignUpData);
  const isDemoItem = Boolean(item?.is_demo_item || item?.is_seeded_home_item);

  const isJobCategory = Number(item?.category?.is_job_category) === 1;
  const translated_item = item?.translated_item;
  const realEstatePricing = useMemo(
    () => resolveRealEstateDisplayPricing(item),
    [item],
  );
  const showRealEstatePerM2 = !isJobCategory && realEstatePricing?.showPerM2;
  const publishedAgo = useMemo(
    () =>
      formatRelativeTimeBs(
        item?.published_at || item?.created_at || translated_item?.created_at,
        { capitalize: true, nowLabel: "Upravo sada" },
      ),
    [item?.published_at, item?.created_at, translated_item?.created_at],
  );

  const keyAttributes = useMemo(() => getKeyAttributes(item), [item]);
  const conditionLabel = useMemo(() => getConditionLabel(item), [item]);
  const availableNow = useMemo(() => readAvailableNow(item), [item]);
  const statusMeta = useMemo(
    () => getListingStatusMeta(item, availableNow),
    [item, availableNow],
  );
  const topStatusMeta = useMemo(
    () => getPrimaryStatusBadgeMeta(conditionLabel, statusMeta),
    [conditionLabel, statusMeta],
  );
  const campaignBadge = useMemo(() => resolveListingCampaignBadge(item), [item]);
  const campaignBadgeStyle = useMemo(() => {
    if (!campaignBadge) return undefined;
    if (!campaignBadge.bgColor) return undefined;
    return {
      backgroundColor: campaignBadge.bgColor,
      borderColor: campaignBadge.bgColor,
      color: campaignBadge.textColor || "#FFFFFF",
    };
  }, [campaignBadge]);
  const isShopSeller = useMemo(
    () =>
      resolveMembership(
        item,
        item?.membership,
        item?.user,
        item?.user?.membership,
        item?.seller,
        item?.seller_settings,
      ).isShop,
    [item],
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Refovi za dodir/klizanje
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const isOnSale = item?.is_on_sale === true || item?.is_on_sale === 1;
  const oldPrice = item?.old_price;
  const currentPrice = item?.price;
  const metaValues = useMemo(() => {
    const values = Array.isArray(keyAttributes) ? [...keyAttributes] : [];
    const withoutOfferMode = values.filter(
      (entry) => !getOfferModeFromValue(entry),
    );
    if (conditionLabel) {
      const normalizedCondition = normalizeText(conditionLabel);
      const withoutCondition = withoutOfferMode.filter(
        (entry) => normalizeText(entry) !== normalizedCondition,
      );
      if (normalizedCondition === "novo") {
        return withoutCondition;
      }
      return [conditionLabel, ...withoutCondition];
    }
    return withoutOfferMode;
  }, [keyAttributes, conditionLabel]);
  const discountPercentage = useMemo(() => {
    const explicit = Number(item?.discount_percentage || 0);
    if (explicit > 0) return explicit;

    if (!isOnSale) return 0;
    if (!oldPrice || !currentPrice) return 0;

    const oldN = Number(oldPrice);
    const curN = Number(currentPrice);
    if (!Number.isFinite(oldN) || !Number.isFinite(curN) || oldN <= curN)
      return 0;

    return Math.round(((oldN - curN) / oldN) * 100);
  }, [item?.discount_percentage, isOnSale, oldPrice, currentPrice]);

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
  const hasImageSlides = slides.some((slide) => slide.type === "image");
  const isViewMoreSlide = slides[currentSlide]?.type === "viewMore";

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

  // Logika za dodir
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

  const isHidePrice = isJobCategory
    ? [item?.min_salary, item?.max_salary].every(
        (val) =>
          val === null ||
          val === undefined ||
          (typeof val === "string" && val.trim() === ""),
      )
    : false;

  const productLinkBase = isDemoItem
    ? "/oglasi"
    : userData?.id === item?.user_id
      ? `/my-listing/${item?.slug}`
      : `/oglas/${item?.slug}`;
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
        "group relative flex h-full w-full flex-col overflow-hidden",
        "bg-white rounded-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800",
        "transition-all duration-200",
        "hover:shadow-sm",
        "cursor-pointer",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* MEDIJ */}
      <div
        className={cn(
          "relative overflow-visible",
          "rounded-t-xl",
          "touch-pan-y",
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div className="relative aspect-[4/3] bg-slate-50 dark:bg-slate-950">
          <div className="absolute inset-0 w-full h-full">
            {slides[currentSlide].type === "image" ? (
              <CustomImage
                src={slides[currentSlide].src}
                width={420}
                height={420}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="w-full h-full object-cover"
                alt={translated_item?.name || item?.name || "listing"}
              />
            ) : (
              !hasImageSlides ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 bg-slate-100/80 dark:bg-slate-900/70">
                  <CustomImage
                    src="/assets/lmx-watermark.png"
                    width={320}
                    height={140}
                    className="h-auto w-[52%] max-w-[180px] min-w-[90px] opacity-50 select-none pointer-events-none"
                    alt="LMX logo"
                  />
                  <p className="max-w-[80%] text-center text-sm leading-tight text-slate-500">
                    Oglas bez slike
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-primary/5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/15">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                  <p className="text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Detalji
                  </p>
                  <p className="text-xs text-slate-500 text-center mt-1">
                    Otvori oglas
                  </p>
                </div>
              )
            )}
          </div>

          {/* Status gore-lijevo */}
          {!isViewMoreSlide ? (
            <div className="absolute right-2 top-2 z-20 flex items-center gap-2">
              {hasVideo ? (
                <span className="inline-flex items-center justify-center rounded bg-white/80 p-0.5 backdrop-blur-[1px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    id="Youtube-Fill--Streamline-Mingcute-Fill"
                    height="16"
                    width="16"
                  >
                    <g fill="none" fillRule="evenodd">
                      <path
                        d="M16 0v16H0V0h16ZM8.395333333333333 15.505333333333333l-0.007333333333333332 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023333333333333334c-0.006666666666666666 -0.0026666666666666666 -0.012666666666666666 -0.0006666666666666666 -0.016 0.003333333333333333l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.011333333333333334 -0.011999999999999999Zm0.17666666666666667 -0.07533333333333334 -0.008666666666666666 0.0013333333333333333 -0.12333333333333332 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.004666666666666666 0.134 0.062c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.0026666666666666666 -0.007333333333333332 0.011333333333333334 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z"
                        strokeWidth="0.6667"
                      ></path>
                      <path
                        fill="#0ab6af"
                        d="M8 2.6666666666666665c0.57 0 1.1546666666666665 0.014666666666666665 1.7213333333333332 0.03866666666666667l0.6693333333333333 0.032 0.6406666666666666 0.038 0.6 0.04066666666666666 0.5479999999999999 0.042666666666666665a2.5346666666666664 2.5346666666666664 0 0 1 2.3293333333333335 2.282l0.026666666666666665 0.2833333333333333 0.049999999999999996 0.6066666666666667c0.04666666666666667 0.6286666666666666 0.08133333333333333 1.314 0.08133333333333333 1.9693333333333334 0 0.6553333333333333 -0.034666666666666665 1.3406666666666667 -0.08133333333333333 1.9693333333333334l-0.049999999999999996 0.6066666666666667c-0.008666666666666666 0.09733333333333333 -0.017333333333333333 0.1913333333333333 -0.026666666666666665 0.2833333333333333a2.5346666666666664 2.5346666666666664 0 0 1 -2.33 2.282l-0.5466666666666666 0.041999999999999996 -0.6 0.04133333333333333 -0.6413333333333333 0.038 -0.6693333333333333 0.032c-0.5666666666666667 0.023999999999999997 -1.1513333333333333 0.03866666666666667 -1.7213333333333332 0.03866666666666667 -0.57 0 -1.1546666666666665 -0.014666666666666665 -1.7213333333333332 -0.03866666666666667l-0.6693333333333333 -0.032 -0.6406666666666666 -0.038 -0.6 -0.04133333333333333 -0.5479999999999999 -0.041999999999999996a2.5346666666666664 2.5346666666666664 0 0 1 -2.3293333333333335 -2.282l-0.026666666666666665 -0.2833333333333333 -0.049999999999999996 -0.6066666666666667A27.107999999999997 27.107999999999997 0 0 1 1.3333333333333333 8c0 -0.6553333333333333 0.034666666666666665 -1.3406666666666667 0.08133333333333333 -1.9693333333333334l0.049999999999999996 -0.6066666666666667c0.008666666666666666 -0.09733333333333333 0.017333333333333333 -0.1913333333333333 0.026666666666666665 -0.2833333333333333A2.5346666666666664 2.5346666666666664 0 0 1 3.8200000000000003 2.8586666666666667l0.5473333333333332 -0.042666666666666665 0.6 -0.04066666666666666 0.6413333333333333 -0.038 0.6693333333333333 -0.032C6.8453333333333335 2.6813333333333333 7.43 2.6666666666666665 8 2.6666666666666665Zm-1.3333333333333333 3.716666666666667v3.233333333333333c0 0.308 0.3333333333333333 0.5 0.6 0.3466666666666667l2.8 -1.6166666666666665a0.39999999999999997 0.39999999999999997 0 0 0 0 -0.6933333333333334l-2.8 -1.6159999999999999a0.39999999999999997 0.39999999999999997 0 0 0 -0.6 0.3466666666666667Z"
                        strokeWidth="0.6667"
                      ></path>
                    </g>
                  </svg>
                </span>
              ) : null}
              {isShopSeller ? (
                <OverlayPill
                  icon={Store}
                  iconClassName="h-3 w-3"
                  className="text-[9px] bg-gray-100 border border-gray-200 w-fit dark:border-indigo-800/70 dark:bg-indigo-900/55 dark:text-indigo-200"
                >
                  LMX Shop
                </OverlayPill>
              ) : null}
            </div>
          ) : null}

          {/* Primarni status (Dostupno/Rezervisano/Prodano) + Izdvojeno na prelomu slike i sadržaja */}
          {!isViewMoreSlide ? (
            <div className="pointer-events-none absolute left-2 right-2 -bottom-3 z-30 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(STATUS_CHIP_BASE_CLASS, topStatusMeta.className)}
              >
                {topStatusMeta.label}
              </span>
              {item?.is_feature ? (
                <span
                  className={cn(
                    STATUS_CHIP_BASE_CLASS,
                    "border-amber-300 bg-amber-100 text-amber-800",
                    "dark:border-amber-600/70 dark:bg-amber-900/40 dark:text-amber-200",
                  )}
                  title="Istaknuti oglas"
                  aria-label="Istaknuti oglas"
                >
                  Izdvojeno
                </span>
              ) : null}
              {campaignBadge ? (
                <span
                  className={cn(
                    STATUS_CHIP_BASE_CLASS,
                    "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800",
                    "dark:border-fuchsia-600/70 dark:bg-fuchsia-900/40 dark:text-fuchsia-100",
                  )}
                  style={campaignBadgeStyle}
                  title={`Sezonska oznaka: ${campaignBadge.label}`}
                  aria-label={`Sezonska oznaka: ${campaignBadge.label}`}
                >
                  {campaignBadge.label}
                </span>
              ) : null}
            </div>
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
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className={cn(
                    "absolute ltr:left-2 rtl:right-2 top-1/2 -translate-y-1/2 z-20",
                    "hidden sm:flex items-center justify-center",
                    "w-8 h-8 rounded-full",
                    "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm",
                    "dark:border-slate-700 dark:bg-slate-900/90",
                    "transition-all duration-200",
                    isHovered
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 ltr:-translate-x-3 rtl:translate-x-3",
                  )}
                  aria-label="Prethodna slika"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-200 rtl:rotate-180" />
                </button>
              )}

              {currentSlide < totalSlides - 1 && (
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className={cn(
                    "absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 z-20",
                    "hidden sm:flex items-center justify-center",
                    "w-8 h-8 rounded-full",
                    "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm",
                    "dark:border-slate-700 dark:bg-slate-900/90",
                    "transition-all duration-200",
                    isHovered
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 ltr:translate-x-3 rtl:-translate-x-3",
                  )}
                  aria-label="Sljedeća slika"
                >
                  <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-200 rtl:rotate-180" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* SADRŽAJ */}
      <div
        className={cn(
          "flex flex-col gap-2 p-3 flex-1",
          !isViewMoreSlide ? "pt-5" : null,
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-primary dark:text-slate-100">
            {translated_item?.name || item?.name}
          </h3>
        </div>

        {Array.isArray(metaValues) && metaValues.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {metaValues.map((attr, index) => (
              <span key={`${attr}-${index}`} className={META_CHIP_CLASS}>
                {attr}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col-reverse justify-between gap-2 pt-2 sm:flex-row">
          {publishedAgo ? (
            <div className="flex min-w-0 items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate">{publishedAgo}</span>
            </div>
          ) : !isHidePrice ? (
            <span className="w-px" aria-hidden="true" />
          ) : null}

          {!isHidePrice ? (
            isJobCategory ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formatSalaryRange(item?.min_salary, item?.max_salary)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center leading-none sm:items-end">
                  {isOnSale &&
                  Number(oldPrice) > 0 &&
                  Number(currentPrice) > 0 &&
                  Number(oldPrice) > Number(currentPrice) ? (
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
                        : "text-slate-900 dark:text-slate-100",
                    )}
                    title={formatPriceOrInquiry(item?.price)}
                  >
                    {formatPriceOrInquiry(item?.price)}
                  </span>
                  {/* {showRealEstatePerM2 ? (
                    <span className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                      {formatPriceAbbreviated(Number(realEstatePricing.perM2Value))} / m²
                    </span>
                  ) : null} */}
                </div>
              </div>
            )
          ) : null}
        </div>
      </div>
    </CustomLink>
  );
};
ProductCard.displayName = "ProductCard";

// Skeleton Loading Component
export const ProductCardSkeleton = () => {
  return (
    <div className="lmx-product-skeleton-card">
      <div className="lmx-product-skeleton-block relative aspect-[4/3] w-full rounded-none" />
      <div className="p-2 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="lmx-product-skeleton-block h-3 w-16 rounded-md" />
          <div className="lmx-product-skeleton-block h-3 w-12 rounded-md" />
        </div>
        <div className="lmx-product-skeleton-block h-4 w-3/4 rounded-md" />
        <div className="lmx-product-skeleton-block h-3 w-2/3 rounded-md" />
        <div className="flex gap-1.5 pt-0.5">
          <div className="lmx-product-skeleton-block h-4 w-12 rounded-lg" />
          <div className="lmx-product-skeleton-block h-4 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default memo(ProductCard);
