"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { 
  MdFavorite, 
  MdFavoriteBorder, 
  MdStar,
  MdTrendingDown,
  MdTrendingUp,
  MdHistory,
  MdInfoOutline,
  MdOutlineLocationOn,
  MdVerifiedUser
} from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { toast } from "sonner";
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

const formatCount = (count) =>
  new Intl.NumberFormat("bs-BA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(count) || 0);

const parseJsonSafe = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const toBoolean = (value) =>
  value === true || value === 1 || value === "1" || value === "true";

const readAvailableNow = (item = {}) => {
  const directCandidates = [
    item?.available_now,
    item?.is_available,
    item?.is_avaible,
    item?.isAvailable,
    item?.availableNow,
    item?.translated_item?.available_now,
    item?.translated_item?.is_available,
    item?.translated_item?.is_avaible,
    item?.translated_item?.isAvailable,
  ];

  for (const candidate of directCandidates) {
    if (candidate !== undefined && candidate !== null) {
      return toBoolean(candidate);
    }
  }

  const keys = ["available_now", "is_available", "is_avaible", "isAvailable", "availableNow"];
  const customFields = parseJsonSafe(item?.custom_fields);

  const pickFromObject = (obj) => {
    if (!obj || typeof obj !== "object") return undefined;
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        return toBoolean(obj[key]);
      }
    }
    return undefined;
  };

  const topLevel = pickFromObject(customFields);
  if (topLevel !== undefined) return topLevel;

  if (customFields && typeof customFields === "object") {
    for (const nested of Object.values(customFields)) {
      const nestedValue = pickFromObject(nested);
      if (nestedValue !== undefined) return nestedValue;
    }
  }

  const translatedFields = item?.all_translated_custom_fields;
  if (Array.isArray(translatedFields)) {
    const availabilityField = translatedFields.find((field) => {
      const name = String(field?.translated_name || field?.name || "")
        .toLowerCase()
        .trim();
      return (
        name.includes("dostup") ||
        name.includes("available") ||
        name.includes("isporuk")
      );
    });

    if (availabilityField) {
      const rawValue =
        availabilityField?.translated_selected_values?.[0] ??
        availabilityField?.value?.[0] ??
        availabilityField?.value ??
        availabilityField?.translated_value;

      if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
        const normalized = String(rawValue).toLowerCase().trim();
        if (
          ["da", "yes", "true", "1", "odmah", "dostupno", "dostupan"].includes(
            normalized
          )
        ) {
          return true;
        }
        if (
          ["ne", "no", "false", "0", "nije", "nedostupno", "nedostupan"].includes(
            normalized
          )
        ) {
          return false;
        }
      }
    }
  }

  return null;
};

const getStatusLabel = (status, isReserved) => {
  if (isReserved) return "Rezervisano";

  const key = String(status || "").toLowerCase();
  switch (key) {
    case "approved":
      return "Aktivan";
    case "featured":
      return "Izdvojen";
    case "inactive":
      return "Skriven";
    case "sold out":
      return "Prodan";
    case "expired":
      return "Istekao";
    case "pending":
      return "Na čekanju";
    default:
      return "Aktivan";
  }
};

const parseDateSafe = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  if (typeof value === "string" && value.includes(" ")) {
    const normalized = new Date(value.replace(" ", "T"));
    if (!Number.isNaN(normalized.getTime())) return normalized;
  }
  return null;
};

const DetailStatPill = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 px-3 py-2">
    <div className="flex items-center gap-2">
      <Icon className="text-slate-400 dark:text-slate-500" />
      <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
    </div>
    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100 break-words">{value}</p>
  </div>
);

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
  const isFeatured = productDetails?.is_feature === 1;

  // Cijene i Akcije
  const isOnSale = productDetails?.is_on_sale === true || productDetails?.is_on_sale === 1;
  const oldPrice = productDetails?.old_price;
  const currentPrice = productDetails?.price;
  const publishedAt = formatShortDate(productDetails?.created_at) || "Nije dostupno";
  const renewedAt = formatShortDate(productDetails?.last_renewed_at) || "Nije osvježeno";
  const areaName = productDetails?.area?.translated_name || productDetails?.area?.name;
  const locationLine = [areaName, productDetails?.city, productDetails?.state].filter(Boolean).join(", ") || "Lokacija nije navedena";
  const viewsCount = Number(
    productDetails?.total_clicks ??
      productDetails?.clicks ??
      productDetails?.views ??
      0
  );
  const sellerResponseAvg = Number(productDetails?.user?.response_time_avg ?? 0);
  const sellerResponseLabel =
    Number.isFinite(sellerResponseAvg) && sellerResponseAvg > 0
      ? `~${formatCount(sellerResponseAvg)} min`
      : "Nema podataka";
  const availableNow = readAvailableNow(productDetails);
  const availableNowLabel = availableNow === true ? "Da" : "Ne";
  const availabilityLabel = getStatusLabel(productDetails?.status, isReserved);
  const featuredLabel = isFeatured ? "Da, istaknuto" : "Standardan prikaz";
  const hasVideoAttached = Boolean(
    productDetails?.video || (productDetails?.video_link && String(productDetails?.video_link).trim())
  );
  const videoStatusLabel = hasVideoAttached ? "Aktivan video" : "Bez videa";
  const storyPublishLabel = Boolean(
    productDetails?.add_video_to_story || productDetails?.publish_to_story
  )
    ? "Uključeno"
    : "Isključeno";
  const baseRenewDate = parseDateSafe(productDetails?.last_renewed_at) || parseDateSafe(productDetails?.created_at);
  const daysToFreeRenew = (() => {
    if (!baseRenewDate) return null;
    const renewAfter = new Date(baseRenewDate.getTime() + 15 * 24 * 60 * 60 * 1000);
    const diffMs = renewAfter.getTime() - Date.now();
    return diffMs <= 0 ? 0 : Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  })();
  const renewHintLabel =
    daysToFreeRenew === null
      ? "Nije dostupno"
      : daysToFreeRenew === 0
      ? "Moguća odmah"
      : `Za ${daysToFreeRenew} dana`;
  
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
        <div className="p-6">
          
          {/* BADGES ROW */}
          <div className="flex flex-wrap gap-2 mb-4">
            {isReserved && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-900/50">
                <MdInfoOutline className="text-sm" /> Rezervisano
              </span>
            )}
            {isFeatured && !isReserved && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-sm">
                <MdStar className="text-sm" /> Istaknuto
              </span>
            )}
            {/* {productDetails?.category?.name && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                {productDetails.category.name}
              </span>
            )} */}
          </div>

          {/* TITLE & ACTIONS ROW */}
          <div className="flex justify-between items-start gap-4 mb-6">

            {/* Parent Container: Flex kolona sa razmakom */}
<div className="flex flex-col gap-4 w-full">
  
  {/* NASLOV */}
  <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight break-words">
    {productName}
  </h1>

  {/* PRICE SECTION */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-br from-slate-50/50 dark:from-slate-900/50 to-white dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
    <div>
      {isOnSale && oldPrice && Number(oldPrice) > Number(currentPrice) ? (
        <div className="flex flex-col">
          <span className="text-slate-400 dark:text-slate-500 line-through text-sm font-medium">
            {formatBosnianPrice(oldPrice)}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-red-600 dark:text-red-500 tracking-tight">
              {formatBosnianPrice(currentPrice)}
            </span>
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded-md">
              Akcija
            </span>
          </div>
        </div>
      ) : (
        <span className="flex items-center gap-3 text-3xl font-black text-primary tracking-tight">
          {isJobCategory
            ? formatBosnianSalary(productDetails?.min_salary, productDetails?.max_salary)
            : formatBosnianPrice(productDetails?.price)}
          {hasHistory && (
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm active:scale-95"
            >
              <MdHistory className="text-lg text-slate-400 dark:text-slate-400" />
            </button>
          )}
        </span>
      )}
    </div>
  </div>

  {/* BRZE INFO KARTICE */}
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
    <DetailStatPill icon={MdHistory} label="Objavljeno" value={publishedAt} />
    <DetailStatPill icon={MdOutlineLocationOn} label="Lokacija" value={locationLine} />
    <DetailStatPill icon={MdTrendingUp} label="Pregleda" value={formatCount(viewsCount)} />
  </div>

  {/* KORISNI BLOK ZA KUPCA / PRODAVAČA */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Za kupca</p>
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">Status oglasa</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{availabilityLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">Dostupno odmah</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{availableNowLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">Istaknut oglas</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{featuredLabel}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
          <MdVerifiedUser className="text-emerald-500 dark:text-emerald-400" />
          <span className="text-sm text-slate-600 dark:text-slate-300">Savjet: prije kupovine potvrdi stanje i detalje kroz poruke.</span>
        </div>
      </div>
    </div>

    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Za prodavača</p>
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">Posljednje osvježenje</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{renewedAt}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">Besplatna obnova</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{renewHintLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">Prosječan odgovor</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{sellerResponseLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">Video u oglasu</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{videoStatusLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">Video na story</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{storyPublishLabel}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
          <MdInfoOutline className="text-primary" />
          <span className="text-sm text-slate-600 dark:text-slate-300">Savjet: brzi odgovor i ažuran oglas povećavaju šansu za prodaju.</span>
        </div>
      </div>
    </div>
  </div>

</div>
            
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <ShareDropdown
                url={currentUrl}
                title={FbTitle}
                headline={headline}
                companyName={CompanyName}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                onShare={(platform) => onShareClick?.(platform)}
              />
              <button
                onClick={handleLikeItem}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 border",
                  productDetails?.is_liked 
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400"
                )}
                title={productDetails?.is_liked ? "Ukloni iz omiljenih" : "Sačuvaj oglas"}
              >
                {productDetails?.is_liked ? <MdFavorite size={20} /> : <MdFavoriteBorder size={20} />}
              </button>
            </div>
          </div>

          {/* DATE INFO */}
          {/* <div className="mt-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 px-1">
            <span>Objavljeno: {formatShortDate(productDetails?.created_at)}</span>
            <span>ID: #{productDetails?.id}</span>
          </div> */}

        </div>
      </div>

      {/* MODAL */}
      <PriceHistoryModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
        priceHistory={productDetails?.price_history} 
        currentPrice={productDetails?.price} 
      />
    </>
  );
};

export default ProductDetailCard;
