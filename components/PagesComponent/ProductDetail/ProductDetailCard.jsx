"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { 
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
import { manageFavouriteApi } from "@/utils/api";
import ShareDropdown from "@/components/Common/ShareDropdown";
import { createPortal } from "react-dom";

// ============================================
// HELPER FUNKCIJE
// ============================================
const formatBosnianPrice = (price) => {
  if (!price || Number(price) === 0) return "Na upit";
  return new Intl.NumberFormat('bs-BA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' KM';
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

// ============================================
// MODAL ZA HISTORIJU CIJENA (Desktop & Mobile)
// ============================================
const PriceHistoryModal = ({ isOpen, onClose, priceHistory, currentPrice }) => {
  const modalRef = useRef(null);

  const sortedHistory = useMemo(() => {
    if (!priceHistory) return [];
    return [...priceHistory].sort(
      (a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
    );
  }, [priceHistory]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !priceHistory) return null;
  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Content */}
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-white dark:to-slate-900">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
              <MdHistory className="text-primary text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Historija cijena</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pregled promjena vrijednosti</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <IoClose size={22} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin dark:scrollbar-thumb-slate-700">
          {sortedHistory.length > 0 ? (
            sortedHistory.map((item, index) => {
              const itemPrice = item.price || item.old_price;
              const itemDate = item.created_at || item.date;
              const prevPrice = index < sortedHistory.length - 1
                  ? sortedHistory[index + 1]?.price || sortedHistory[index + 1]?.old_price
                  : itemPrice;
              const itemChange = index === 0 ? currentPrice - itemPrice : itemPrice - prevPrice;
              const isChangeDown = itemChange < 0;
              const isChangeUp = itemChange > 0;

              return (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                      isChangeDown ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400" :
                      isChangeUp ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400" :
                      "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                    )}>
                      {isChangeDown ? <MdTrendingDown size={20} /> : isChangeUp ? <MdTrendingUp size={20} /> : <MdHistory size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{formatBosnianPrice(itemPrice)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatShortDate(itemDate)}</p>
                    </div>
                  </div>

                  {(isChangeDown || isChangeUp) && index > 0 && (
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-md",
                      isChangeDown ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    )}>
                      {isChangeDown ? "" : "+"}{formatBosnianPrice(Math.abs(itemChange))}
                    </span>
                  )}
                  {index === 0 && (
                    <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-md">
                      Trenutna
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">Nema zabilježenih promjena cijena.</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================
// GLAVNA KOMPONENTA
// ============================================
const ProductDetailCard = ({ productDetails, setProductDetails, onFavoriteToggle, onShareClick }) => {
  const dispatch = useDispatch();
  const path = usePathname();
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${path}`;
  const isLoggedIn = useSelector(getIsLoggedIn);
  const CompanyName = useSelector(getCompanyName);
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const translated_item = productDetails?.translated_item;
  const productName = translated_item?.name || productDetails?.name;
  const FbTitle = `${productName} | ${CompanyName}`;
  const headline = `🚀 Pogledaj ovu odličnu ponudu! "${productName}" na ${CompanyName}.`;
  
  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;
  const hasHistory = !isJobCategory && productDetails?.price_history && productDetails.price_history.length > 0;
  
  // Statusi
  const isReserved = productDetails?.status === 'reserved' || productDetails?.reservation_status === 'reserved';
  const isSoldOut = productDetails?.status === 'sold out';
  const isFeatured = productDetails?.is_feature === 1;

  // Cijene i Akcije
  const isOnSale = productDetails?.is_on_sale === true || productDetails?.is_on_sale === 1;
  const oldPrice = productDetails?.old_price;
  const currentPrice = productDetails?.price;
  const renewalSourceDate =
    productDetails?.last_renewed_at ||
    productDetails?.renewed_at ||
    productDetails?.updated_at;
  const renewalDateTime = formatDateTimeEu(renewalSourceDate);
  const areaName = productDetails?.area?.translated_name || productDetails?.area?.name;
  const locationLine = [areaName, productDetails?.city, productDetails?.state].filter(Boolean).join(", ") || "Lokacija nije navedena";
  const availableNow = readAvailableNow(productDetails);
  const exchangePossible = readExchangePossible(productDetails);
  const availableNowLabel = availableNow === true ? "Da" : availableNow === false ? "Ne" : "Nije navedeno";
  const exchangeLabel = exchangePossible === true ? "Da" : exchangePossible === false ? "Ne" : "Nije navedeno";
  const availableNowTone = availableNow === true ? "positive" : availableNow === false ? "negative" : "neutral";
  const exchangeTone = exchangePossible === true ? "positive" : exchangePossible === false ? "negative" : "neutral";
  const renewalInfoValue = renewalDateTime || "Datum nije dostupan";
  const renewalInfoTitle = renewalDateTime
    ? `Zadnja obnova: ${renewalDateTime}`
    : "Datum zadnje obnove nije dostupan.";
  const productIdLabel = productDetails?.id ? `#${productDetails.id}` : "-";
  const oldPriceNumber = Number(oldPrice);
  const currentPriceNumber = Number(currentPrice);
  const hasDiscount = isOnSale && Number.isFinite(oldPriceNumber) && Number.isFinite(currentPriceNumber) && oldPriceNumber > currentPriceNumber && currentPriceNumber > 0;
  const discountPercent = hasDiscount ? Math.round(((oldPriceNumber - currentPriceNumber) / oldPriceNumber) * 100) : 0;
  const displayPrice = isJobCategory
    ? formatBosnianSalary(productDetails?.min_salary, productDetails?.max_salary)
    : formatBosnianPrice(productDetails?.price);
  
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
                  {hasDiscount ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-sm font-medium text-slate-400 dark:text-slate-500 line-through">
                        {formatBosnianPrice(oldPriceNumber)}
                      </span>
                      <span className="text-3xl font-black text-red-600 dark:text-red-500 tracking-tight break-words">
                        {formatBosnianPrice(currentPriceNumber)}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold">
                        AKCIJA
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-3xl font-black text-primary tracking-tight break-words">{displayPrice}</p>
                  )}
                </div>

                {hasHistory && (
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm active:scale-95"
                    title="Historija cijena"
                    aria-label="Prikaži historiju cijena"
                  >
                    <MdHistory className="text-base text-slate-400 dark:text-slate-400" />
                    Historija cijena
                  </button>
                )}
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
        priceHistory={productDetails?.price_history} 
        currentPrice={productDetails?.price} 
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
