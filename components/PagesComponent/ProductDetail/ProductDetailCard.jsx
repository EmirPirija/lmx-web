"use client";
import { useState, useRef, useEffect, useMemo, useId } from "react";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { 
  Box,
  CalendarDays,
  CheckCircle2,
  GitCompare,
  MapPin,
  MdFavorite, 
  MdFavoriteBorder, 
  MdStar,
  MdTrendingDown,
  MdTrendingUp,
  MdHistory,
  MdInfoOutline
} from "@/components/Common/UnifiedIconPack";
import { IoClose } from "@/components/Common/UnifiedIconPack";
import { toast } from "@/utils/toastBs";
import { cn } from "@/lib/utils";
import { getIsLoggedIn } from "@/redux/reducer/authSlice";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { getLocationApi, manageFavouriteApi } from "@/utils/api";
import ShareDropdown from "@/components/Common/ShareDropdown";
import { createPortal } from "react-dom";
import { getScarcityCopy, getScarcityState } from "@/utils/scarcity";
import { resolveRealEstateDisplayPricing } from "@/utils/realEstatePricing";

// ============================================
// HELPER FUNKCIJE
// ============================================
const formatCurrencyValue = (price) =>
  new Intl.NumberFormat('bs-BA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' KM';

const formatBosnianPrice = (price) => {
  if (!price || Number(price) === 0) return "Na upit";
  return formatCurrencyValue(price);
};

const toPriceNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed > 0 ? parsed : null;
};

const formatSignedPriceDelta = (value) => {
  if (!Number.isFinite(value) || value === 0) return "0 KM";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatCurrencyValue(Math.abs(value))}`;
};

const pluralizeBosnian = (count, one, few, many) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

const formatTimeAgoBs = (value) => {
  if (!value) return "nije dostupno";

  const date = typeof value === "number" ? new Date(value) : new Date(String(value));
  if (isNaN(date.getTime())) return "nije dostupno";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "upravo sada";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `prije ${minutes} ${pluralizeBosnian(minutes, "minute", "minute", "minuta")}`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `prije ${hours} ${pluralizeBosnian(hours, "sat", "sata", "sati")}`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `prije ${days} ${pluralizeBosnian(days, "dan", "dana", "dana")}`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `prije ${weeks} ${pluralizeBosnian(weeks, "sedmicu", "sedmice", "sedmica")}`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `prije ${months} ${pluralizeBosnian(months, "mjesec", "mjeseca", "mjeseci")}`;
  }

  const years = Math.floor(days / 365);
  return `prije ${years} ${pluralizeBosnian(years, "godinu", "godine", "godina")}`;
};

const buildPriceHistoryInsights = (priceHistory, currentPrice) => {
  const rawHistory = Array.isArray(priceHistory) ? priceHistory : [];
  const timeline = rawHistory
    .map((entry, index) => {
      const price = toPriceNumber(entry?.price ?? entry?.old_price ?? entry?.value ?? entry?.amount);
      if (price === null) return null;

      const dateValue =
        entry?.created_at ??
        entry?.updated_at ??
        entry?.date ??
        entry?.changed_at ??
        entry?.changedAt ??
        null;

      const timestamp = dateValue ? new Date(dateValue).getTime() : NaN;
      return {
        key: entry?.id ? `history-${entry.id}` : `history-${index}`,
        price,
        dateValue,
        timestamp: Number.isFinite(timestamp) ? timestamp : null,
        index,
        synthetic: false,
      };
    })
    .filter(Boolean);

  timeline.sort((a, b) => {
    if (a.timestamp !== null && b.timestamp !== null) return a.timestamp - b.timestamp;
    return a.index - b.index;
  });

  const currentPriceNumber = toPriceNumber(currentPrice);
  const latestPoint = timeline[timeline.length - 1];
  if (currentPriceNumber !== null) {
    if (!latestPoint || latestPoint.price !== currentPriceNumber) {
      timeline.push({
        key: "history-current",
        price: currentPriceNumber,
        dateValue: latestPoint?.dateValue || new Date().toISOString(),
        timestamp: Date.now(),
        index: timeline.length,
        synthetic: true,
      });
    }
  }

  if (!timeline.length) {
    return {
      hasAnyPrice: false,
      points: [],
      timelineDesc: [],
      initialPrice: null,
      latestPrice: null,
      totalChange: 0,
      changeCount: 0,
      increaseCount: 0,
      decreaseCount: 0,
      trend: "stable",
      isCurrentLowest: false,
      summaryText: "Cijena nije mijenjana",
      totalText: "Ukupna promjena: 0 KM",
      lastChangeText: "Zadnja promjena: nije bilo promjena",
      lastChangeAt: null,
      badges: [{ key: "stable", tone: "neutral", label: "Stabilna cijena" }],
    };
  }

  let increaseCount = 0;
  let decreaseCount = 0;
  let lastChangeAt = null;

  for (let i = 1; i < timeline.length; i += 1) {
    const diff = timeline[i].price - timeline[i - 1].price;
    if (diff > 0) increaseCount += 1;
    if (diff < 0) decreaseCount += 1;
    if (diff !== 0) {
      lastChangeAt = timeline[i].timestamp || timeline[i].dateValue || null;
    }
  }

  const changeCount = increaseCount + decreaseCount;
  const initialPrice = timeline[0].price;
  const latestPrice = timeline[timeline.length - 1].price;
  const totalChange = latestPrice - initialPrice;
  const allPrices = timeline.map((point) => point.price);
  const lowestPrice = Math.min(...allPrices);
  const isCurrentLowest = latestPrice === lowestPrice && changeCount > 0;

  let trend = "stable";
  if (totalChange < 0) trend = "down";
  else if (totalChange > 0) trend = "up";
  else if (changeCount > 0) trend = "mixed";

  let summaryText = "Cijena nije mijenjana";
  if (decreaseCount > 0 && increaseCount === 0) {
    summaryText = `Cijena snižena ${decreaseCount} ${pluralizeBosnian(decreaseCount, "put", "puta", "puta")}`;
  } else if (increaseCount > 0 && decreaseCount === 0) {
    summaryText = `Cijena povećana ${increaseCount} ${pluralizeBosnian(increaseCount, "put", "puta", "puta")}`;
  } else if (changeCount > 0) {
    summaryText = `Cijena korigovana ${changeCount} ${pluralizeBosnian(changeCount, "put", "puta", "puta")}`;
  }

  const totalText =
    totalChange < 0
      ? `Ukupno sniženje: ${formatSignedPriceDelta(totalChange)}`
      : totalChange > 0
      ? `Ukupno povećanje: ${formatSignedPriceDelta(totalChange)}`
      : "Ukupna promjena: 0 KM";

  const badges = [];
  if (changeCount === 0) {
    badges.push({ key: "stable", tone: "neutral", label: "Stabilna cijena" });
  } else if (trend === "down") {
    badges.push({ key: "down", tone: "positive", label: "Cijena snižena" });
  } else if (trend === "up") {
    badges.push({ key: "up", tone: "negative", label: "Cijena povećana" });
  } else {
    badges.push({ key: "mixed", tone: "neutral", label: "Promjenjiva cijena" });
  }

  if (isCurrentLowest) {
    badges.push({ key: "lowest", tone: "highlight", label: "Najniža cijena do sada" });
  }

  const timelineDesc = [...timeline]
    .reverse()
    .map((point, index, list) => {
      const olderPoint = list[index + 1];
      const delta = olderPoint ? point.price - olderPoint.price : 0;
      return {
        ...point,
        delta,
        isCurrent: index === 0,
      };
    });

  return {
    hasAnyPrice: true,
    points: timeline,
    timelineDesc,
    initialPrice,
    latestPrice,
    totalChange,
    changeCount,
    increaseCount,
    decreaseCount,
    trend,
    isCurrentLowest,
    summaryText,
    totalText,
    lastChangeText: lastChangeAt ? `Zadnja promjena: ${formatTimeAgoBs(lastChangeAt)}` : "Zadnja promjena: nije bilo promjena",
    lastChangeAt,
    badges,
  };
};

const formatBosnianSalary = (min, max) => {
  if (!min && !max) return "Po dogovoru";
  const formatNum = (num) => new Intl.NumberFormat('bs-BA').format(num);
  if (min && max) return `${formatNum(min)} - ${formatNum(max)} KM`;
  if (min) return `Od ${formatNum(min)} KM`;
  return `Do ${formatNum(max)} KM`;
};

const formatShortDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = date.getDate();
  const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return `${day}. ${months[date.getMonth()]} ${date.getFullYear()}.`;
};

const formatDateTimeEu = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy}. ${hh}:${min}`;
};

const parseJsonSafe = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
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

const readBooleanFromCandidates = (candidates = []) => {
  for (const candidate of candidates) {
    const parsed = toBoolean(candidate);
    if (parsed !== null) return parsed;
  }
  return null;
};

const readBooleanFromCustomFields = (customFieldsValue, keys = []) => {
  const keysSet = new Set(keys);
  const parsedCustomFields = parseJsonSafe(customFieldsValue);
  if (!parsedCustomFields || typeof parsedCustomFields !== "object") return null;

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

  return walk(parsedCustomFields);
};

const getTranslatedCustomFields = (item = {}) => {
  const merged = [];
  if (Array.isArray(item?.all_translated_custom_fields)) {
    merged.push(...item.all_translated_custom_fields);
  }
  if (Array.isArray(item?.translated_custom_fields)) {
    merged.push(...item.translated_custom_fields);
  }
  return merged;
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
  const translatedFields = getTranslatedCustomFields(item);
  if (!translatedFields.length) return null;

  for (const field of translatedFields) {
    const fieldName = normalizeText(field?.translated_name || field?.name || "");
    if (!fieldName) continue;

    if (!hints.some((hint) => fieldName.includes(hint))) continue;

    const value = readBooleanFromCandidates(extractTranslatedFieldValues(field));
    if (value !== null) return value;
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
    item?.translated_item?.dostupno_odmah,
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

  return null;
};

const AutoMarqueeText = ({ text, className }) => {
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const [metrics, setMetrics] = useState({
    isOverflowing: false,
    distance: 0,
    duration: 0,
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const measure = () => {
      const distance = Math.max(0, content.scrollWidth - viewport.clientWidth);
      const isOverflowing = distance > 1;
      const duration = Math.max(7, Number((distance / 22).toFixed(2)));

      setMetrics((prev) => {
        if (
          prev.isOverflowing === isOverflowing &&
          Math.abs(prev.distance - distance) < 1 &&
          Math.abs(prev.duration - duration) < 0.1
        ) {
          return prev;
        }

        return { isOverflowing, distance, duration };
      });
    };

    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(viewport);
    observer?.observe(content);
    window.addEventListener("resize", measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [text]);

  return (
    <span className={cn("block min-w-0 overflow-hidden whitespace-nowrap", className)} ref={viewportRef} title={text}>
      <span
        ref={contentRef}
        className={cn("inline-block whitespace-nowrap", metrics.isOverflowing && "product-detail-pill-marquee")}
        style={
          metrics.isOverflowing
            ? {
                "--marquee-distance": `${metrics.distance}px`,
                "--marquee-duration": `${metrics.duration}s`,
              }
            : undefined
        }
      >
        {text}
      </span>
    </span>
  );
};

const DetailInfoPill = ({ icon: Icon, label, value, tone = "default", className, valueTitle }) => {
  const isBadgeTone = tone !== "default";
  const isExchangeIcon = Icon === GitCompare;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 px-2.5 py-2",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className={cn(
            "relative inline-flex h-[18px] w-[18px] items-center justify-center",
            isExchangeIcon && "text-slate-500 dark:text-slate-300"
          )}
        >
          <Icon className="h-full w-full text-primary dark:text-primary" />
        </span>
        <span className="shrink-0 text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">
          {label}:
        </span>
      </div>
      <p
        className={cn(
          "min-w-0 text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100",
          isBadgeTone ? "flex-none" : "flex-1"
        )}
        title={valueTitle || String(value || "")}
      >
        {isBadgeTone ? (
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold",
              tone === "positive" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
              tone === "negative" && "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
              tone === "neutral" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {value}
          </span>
        ) : (
          <AutoMarqueeText text={String(value || "")} />
        )}
      </p>
    </div>
  );
};

const HISTORY_BADGE_STYLES = {
  positive:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300",
  negative:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-300",
  neutral:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-300",
  highlight:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200",
};

const PriceHistoryBadge = ({ badge }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
      HISTORY_BADGE_STYLES[badge?.tone] || HISTORY_BADGE_STYLES.neutral
    )}
  >
    {badge?.label}
  </span>
);

const PriceHistorySparkline = ({ points = [], trend = "stable" }) => {
  const gradientId = useId().replace(/:/g, "");

  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }

  const width = 260;
  const height = 72;
  const paddingX = 8;
  const paddingY = 8;

  const values = points.map((point) => point.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = points.length > 1 ? (width - paddingX * 2) / (points.length - 1) : 0;

  const coordinates = points.map((point, index) => {
    const x = paddingX + step * index;
    const normalized = (point.price - min) / range;
    const y = height - paddingY - normalized * (height - paddingY * 2);
    return { x, y };
  });

  const linePath = coordinates.map((coord) => `${coord.x},${coord.y}`).join(" ");
  const areaPath = `M ${coordinates[0].x} ${height - paddingY} L ${coordinates
    .map((coord) => `${coord.x} ${coord.y}`)
    .join(" L ")} L ${coordinates[coordinates.length - 1].x} ${height - paddingY} Z`;

  const palette =
    trend === "down"
      ? { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.16)" }
      : trend === "up"
      ? { stroke: "#f43f5e", fill: "rgba(244, 63, 94, 0.16)" }
      : trend === "mixed"
      ? { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.14)" }
      : { stroke: "#64748b", fill: "rgba(100, 116, 139, 0.14)" };

  const last = coordinates[coordinates.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[72px] w-full" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.fill} />
          <stop offset="100%" stopColor="rgba(15, 23, 42, 0.02)" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        fill="none"
        stroke={palette.stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePath}
      />
      <circle cx={last.x} cy={last.y} r="4.2" fill={palette.stroke} />
      <circle cx={last.x} cy={last.y} r="6.8" fill={palette.fill} />
    </svg>
  );
};

// ============================================
// MODAL ZA HISTORIJU CIJENA (Desktop & Mobile)
// ============================================
const PriceHistoryModal = ({ isOpen, onClose, insights }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !insights?.hasAnyPrice) return null;
  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        ref={modalRef}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-3 duration-300 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-primary dark:border-slate-700 dark:bg-slate-800">
              <MdHistory className="text-lg" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">Historija cijene</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mini trend, ključne promjene i vremenski slijed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Zatvori historiju cijene"
          >
            <IoClose size={20} />
          </button>
        </div>

        <div className="max-h-[78vh] space-y-4 overflow-y-auto p-4 sm:p-5">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/30 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Trenutna cijena: <span className="text-primary">{formatBosnianPrice(insights.latestPrice)}</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {insights.badges.map((badge) => (
                  <PriceHistoryBadge key={badge.key} badge={badge} />
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-900/70">
              <PriceHistorySparkline points={insights.points} trend={insights.trend} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              <p>Početna cijena: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatBosnianPrice(insights.initialPrice)}</span></p>
              <p>{insights.totalText}</p>
              <p>{insights.summaryText}</p>
              <p>{insights.lastChangeText}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900/40 sm:p-3">
            <div className="mb-2 px-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Hronologija promjena
              </p>
            </div>

            {insights.timelineDesc.map((point) => {
              const isUp = point.delta > 0;
              const isDown = point.delta < 0;
              const deltaLabel = point.delta === 0 ? "0 KM" : formatSignedPriceDelta(point.delta);

              return (
                <div
                  key={point.key}
                  className="group flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg border",
                        isDown
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-700/50 dark:bg-emerald-900/25 dark:text-emerald-300"
                          : isUp
                          ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-700/50 dark:bg-rose-900/25 dark:text-rose-300"
                          : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {isDown ? <MdTrendingDown size={16} /> : isUp ? <MdTrendingUp size={16} /> : <MdHistory size={16} />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatBosnianPrice(point.price)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {point.dateValue ? formatShortDate(point.dateValue) : "Datum nije dostupan"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {point.isCurrent ? (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary dark:bg-primary/20">
                        Trenutna
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-[11px] font-semibold",
                          isDown
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : isUp
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        )}
                      >
                        {deltaLabel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {insights.changeCount === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Cijena nije mijenjana. Oglas ima stabilnu cijenu.
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================
// GLAVNA KOMPONENTA
// ============================================
const ProductDetailCard = ({
  productDetails,
  setProductDetails,
  onFavoriteToggle,
  onShareClick,
  onPriceHistoryView,
}) => {
  const dispatch = useDispatch();
  const path = usePathname();
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${path}`;
  const isLoggedIn = useSelector(getIsLoggedIn);
  const CompanyName = useSelector(getCompanyName);
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [resolvedLocationByPin, setResolvedLocationByPin] = useState("");

  const translated_item = productDetails?.translated_item;
  const productName = translated_item?.name || productDetails?.name;
  const FbTitle = `${productName} | ${CompanyName}`;
  const headline = `🚀 Pogledaj ovu odličnu ponudu! "${productName}" na ${CompanyName}.`;
  
  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;
  const normalizedPriceHistory = useMemo(() => {
    const candidates = [
      productDetails?.price_history,
      productDetails?.price_histories,
      productDetails?.priceHistory,
      productDetails?.price_changes,
      productDetails?.priceChanges,
      productDetails?.history?.price_history,
      productDetails?.history?.prices,
    ];
    const raw = candidates.find((entry) => {
      if (entry == null) return false;
      if (Array.isArray(entry)) return entry.length > 0;
      if (typeof entry === "string") return entry.trim().length > 0;
      return true;
    }) ?? [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    }
    if (raw && typeof raw === "object" && Array.isArray(raw?.data)) {
      return raw.data.filter(Boolean);
    }
    return [];
  }, [productDetails]);
  // Statusi
  const isReserved = productDetails?.status === 'reserved' || productDetails?.reservation_status === 'reserved';
  const isSoldOut = productDetails?.status === 'sold out';
  const isFeatured = productDetails?.is_feature === 1;

  // Cijene i Akcije
  const isOnSale = productDetails?.is_on_sale === true || productDetails?.is_on_sale === 1;
  const oldPrice = productDetails?.old_price;
  const currentPrice = productDetails?.price;
  const oldPriceNumber = Number(oldPrice);
  const currentPriceNumber = Number(currentPrice);
  const historyInsights = useMemo(
    () => buildPriceHistoryInsights(normalizedPriceHistory, currentPrice),
    [normalizedPriceHistory, currentPrice]
  );
  const showHistorySection = !isJobCategory && historyInsights.hasAnyPrice;
  const renewalSourceDate =
    productDetails?.last_renewed_at ||
    productDetails?.renewed_at;
  const renewalDateTime = formatDateTimeEu(renewalSourceDate);
  const preciseLat = Number(productDetails?.latitude);
  const preciseLng = Number(productDetails?.longitude);
  const hasPreciseCoordinates =
    Number.isFinite(preciseLat) && Number.isFinite(preciseLng);

  useEffect(() => {
    let cancelled = false;

    const resolveLocationByPin = async () => {
      if (!hasPreciseCoordinates) {
        setResolvedLocationByPin("");
        return;
      }

      try {
        const response = await getLocationApi.getLocation({
          lat: preciseLat,
          lng: preciseLng,
          lang: "bs",
        });

        if (cancelled || response?.data?.error === true) return;

        const payload = response?.data?.data;
        const result = Array.isArray(payload) ? payload[0] || {} : payload || {};
        const locationLabel = [
          result?.area_translation || result?.area,
          result?.city_translation || result?.city,
          result?.state_translation || result?.state,
          result?.country_translation || result?.country,
        ]
          .filter(Boolean)
          .join(", ");

        setResolvedLocationByPin(locationLabel);
      } catch {
        if (!cancelled) setResolvedLocationByPin("");
      }
    };

    resolveLocationByPin();

    return () => {
      cancelled = true;
    };
  }, [hasPreciseCoordinates, preciseLat, preciseLng, productDetails?.id]);
  const areaName = productDetails?.area?.translated_name || productDetails?.area?.name;
  const textualLocationLine =
    productDetails?.address ||
    productDetails?.formatted_address ||
    productDetails?.address_translated ||
    productDetails?.translated_address ||
    productDetails?.translated_item?.address ||
    [areaName, productDetails?.city, productDetails?.state].filter(Boolean).join(", ");
  const locationLine =
    resolvedLocationByPin ||
    textualLocationLine ||
    (hasPreciseCoordinates ? "Lokacija označena na mapi" : "Lokacija nije navedena");
  const availableNow = readAvailableNow(productDetails);
  const exchangePossible = readExchangePossible(productDetails);
  const availableNowLabel = availableNow === true ? "Da" : availableNow === false ? "Ne" : "Nije navedeno";
  const exchangeLabel = exchangePossible === true ? "Da" : exchangePossible === false ? "Ne" : "Nije navedeno";
  const availableNowTone = availableNow === true ? "positive" : availableNow === false ? "negative" : "neutral";
  const exchangeTone = exchangePossible === true ? "positive" : exchangePossible === false ? "negative" : "neutral";
  const renewalInfoValue = renewalDateTime || "Nije obnovljen";
  const renewalInfoTitle = renewalDateTime
    ? `Zadnja obnova: ${renewalDateTime}`
    : "Oglas još nije obnovljen.";
  const realEstatePricing = useMemo(
    () => resolveRealEstateDisplayPricing(productDetails),
    [productDetails]
  );
  const unitPriceNumber = realEstatePricing?.isRealEstate
    ? Number(realEstatePricing?.perM2Value)
    : Number(productDetails?.price_per_unit);
  const minOrderQty = Math.max(1, Number(productDetails?.minimum_order_quantity || 1));
  const hasUnitPrice = !isJobCategory && Number.isFinite(unitPriceNumber) && unitPriceNumber > 0;
  const unitPriceLabel = hasUnitPrice
    ? realEstatePricing?.isRealEstate
      ? `${formatBosnianPrice(unitPriceNumber)} / m²`
      : `${formatBosnianPrice(unitPriceNumber)} / kom`
    : null;
  const realEstateAreaLabel =
    realEstatePricing?.isRealEstate && Number(realEstatePricing?.areaM2) > 0
      ? Number(realEstatePricing.areaM2).toLocaleString("bs-BA", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : null;
  const hasDiscount = isOnSale && Number.isFinite(oldPriceNumber) && Number.isFinite(currentPriceNumber) && oldPriceNumber > currentPriceNumber && currentPriceNumber > 0;
  const displayPrice = isJobCategory
    ? formatBosnianSalary(productDetails?.min_salary, productDetails?.max_salary)
    : formatBosnianPrice(productDetails?.price);
  const scarcityState = useMemo(() => getScarcityState(productDetails), [productDetails]);
  const scarcityCopy = useMemo(() => getScarcityCopy(scarcityState), [scarcityState]);
  const showScarcityUi = Boolean(scarcityState?.isEligible && !isSoldOut && !isReserved);
  const showOutOfStockUi = Boolean(!isSoldOut && scarcityState?.isOutOfStock);
  const showPopularityHint = showScarcityUi && scarcityState?.popularity?.hasSignal;

  const handleOpenHistoryModal = () => {
    setShowHistoryModal(true);
    onPriceHistoryView?.();
  };

  const handleLikeItem = async () => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }
    try {
      const response = await manageFavouriteApi.manageFavouriteApi({ item_id: productDetails?.id });
      if (response?.data?.error === false) {
        setProductDetails((prev) => ({ ...prev, is_liked: !productDetails?.is_liked }));
        toast.success(productDetails?.is_liked ? "Uklonjeno iz omiljenih" : "Dodano u omiljene");
        if (onFavoriteToggle) onFavoriteToggle(!productDetails?.is_liked);
      }
    } catch (error) {
      console.log(error);
      toast.error("Greška pri ažuriranju omiljenih");
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-4 sm:p-6">
          
          {/* BADGES ROW */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
          {productDetails?.category?.name && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                {productDetails.category.name}
              </span>
            )}
            {isSoldOut && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-200 dark:border-rose-900/50">
                <MdInfoOutline className="text-sm" /> PRODANO
              </span>
            )}
            {isReserved && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-900/50">
                <MdInfoOutline className="text-sm" /> REZERVISANO
              </span>
            )}
            {/* {!isReserved && !isSoldOut && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-900/50">
                <CheckCircle2 className="h-3.5 w-3.5" /> Dostupno
              </span>
            )} */}
            {isFeatured && !isReserved && !isSoldOut && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-sm">
                <MdStar className="text-sm" /> Istaknuto
              </span>
            )}
            {showScarcityUi && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/60">
                <MdInfoOutline className="text-sm" /> Do isteka zaliha
              </span>
            )}
            {showOutOfStockUi && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider border border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/60">
                <MdInfoOutline className="text-sm" /> Rasprodano
              </span>
            )}
          </div>

          {/* TITLE, ACTIONS & PRICE */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight break-words">
                  {productName}
                </h1>

              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <ShareDropdown
                  url={currentUrl}
                  title={FbTitle}
                  headline={headline}
                  companyName={CompanyName}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                  triggerTitle="Podijeli oglas"
                  triggerAriaLabel="Podijeli oglas"
                  onShare={(platform) => onShareClick?.(platform)}
                />
                <button
                  type="button"
                  onClick={handleLikeItem}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 border",
                    productDetails?.is_liked
                      ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400"
                  )}
                  title={productDetails?.is_liked ? "Ukloni iz omiljenih" : "Sačuvaj oglas"}
                  aria-label={productDetails?.is_liked ? "Ukloni iz omiljenih" : "Sačuvaj oglas"}
                >
                  {productDetails?.is_liked ? <MdFavorite size={20} /> : <MdFavoriteBorder size={20} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 sm:p-5 bg-gradient-to-br from-slate-50/80 dark:from-slate-900/50 to-white dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {isJobCategory ? "Plata" : "Cijena"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                    {hasDiscount ? (
                      <>
                        <span className="text-sm font-medium text-slate-400 dark:text-slate-500 line-through">
                          {formatBosnianPrice(oldPriceNumber)}
                        </span>
                        <span className="text-3xl font-black text-red-600 dark:text-red-500 tracking-tight break-words">
                          {formatBosnianPrice(currentPriceNumber)}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold">
                          AKCIJA
                        </span>
                      </>
                    ) : (
                      <p className="text-3xl font-black text-primary tracking-tight break-words">{displayPrice}</p>
                    )}

                    {showHistorySection && (
                      <button
                        type="button"
                        onClick={handleOpenHistoryModal}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 ml-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm active:scale-95"
                        title="Historija cijena"
                        aria-label="Prikaži historiju cijena"
                      >
                        <MdHistory className="text-base text-slate-400 dark:text-slate-400" />
                        <span className="hidden sm:inline">Historija</span>
                      </button>
                    )}
                  </div>
                  {hasUnitPrice ? (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <Box className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                      {unitPriceLabel}
                      {realEstatePricing?.isRealEstate
                        ? realEstateAreaLabel
                          ? ` • ${realEstateAreaLabel} m²`
                          : ""
                        : minOrderQty > 1
                        ? ` • min ${minOrderQty} kom`
                        : ""}
                    </div>
                  ) : null}

                  {showScarcityUi ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 p-3 dark:border-amber-700/50 dark:bg-amber-900/20">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                        {scarcityCopy?.priceHint || "Cijena važi do isteka zaliha"}
                      </p>
                      <p className="mt-1 text-sm font-bold text-amber-900 dark:text-amber-100">
                        {scarcityCopy?.quantity}
                      </p>
                      {showPopularityHint ? (
                        <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                          Popularno: ovaj oglas trenutno ima iznadprosječan interes kupaca.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {showOutOfStockUi ? (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3 dark:border-rose-700/50 dark:bg-rose-900/20">
                      <p className="text-sm font-bold text-rose-800 dark:text-rose-200">Rasprodano</p>
                      <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                        Artikal trenutno nije dostupan. Nakon dopune zalihe, status se automatski ažurira.
                      </p>
                    </div>
                  ) : null}

                </div>

              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <DetailInfoPill
                icon={CheckCircle2}
                label="Dostupno odmah"
                value={availableNowLabel}
                tone={availableNowTone}
                className="sm:w-auto sm:flex-none"
              />
              <DetailInfoPill
                icon={GitCompare}
                label="Zamjena"
                value={exchangeLabel}
                tone={exchangeTone}
                className="sm:w-auto sm:flex-none"
              />
              <DetailInfoPill
                icon={MapPin}
                label="Lokacija"
                value={locationLine}
                valueTitle={locationLine}
                className="sm:min-w-0 sm:flex-1"
              />
              <DetailInfoPill
                icon={CalendarDays}
                label="Zadnja obnova"
                value={renewalInfoValue}
                valueTitle={renewalInfoTitle}
                className="sm:w-auto sm:flex-none"
              />
            </div>
          </div>

        </div>
      </div>

      {/* MODAL */}
      <PriceHistoryModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
        insights={historyInsights}
      />
      <style jsx global>{`
        @keyframes product-detail-pill-marquee-keyframes {
          0%,
          15% {
            transform: translateX(0);
          }
          85%,
          100% {
            transform: translateX(calc(-1 * var(--marquee-distance, 0px)));
          }
        }

        .product-detail-pill-marquee {
          animation-name: product-detail-pill-marquee-keyframes;
          animation-duration: var(--marquee-duration, 8s);
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .product-detail-pill-marquee {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default ProductDetailCard;
