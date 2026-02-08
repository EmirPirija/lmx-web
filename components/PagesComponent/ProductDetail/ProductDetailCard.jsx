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
  MdInfoOutline
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
        className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            {productDetails?.category?.name && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                {productDetails.category.name}
              </span>
            )}
          </div>

          {/* TITLE & ACTIONS ROW */}
          <div className="flex justify-between items-start gap-4 mb-6">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight break-words">
              {productName}
            </h1>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <ShareDropdown
                url={currentUrl}
                title={FbTitle}
                headline={headline}
                companyName={CompanyName}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary transition-all active:scale-95 border border-slate-100 dark:border-slate-700"
              />
              <button
                onClick={handleLikeItem}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 border",
                  productDetails?.is_liked 
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40" 
                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400"
                )}
                title={productDetails?.is_liked ? "Ukloni iz omiljenih" : "Sačuvaj oglas"}
              >
                {productDetails?.is_liked ? <MdFavorite size={20} /> : <MdFavoriteBorder size={20} />}
              </button>
            </div>
          </div>

          {/* PRICE SECTION */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
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
                <span className="text-3xl font-black text-primary tracking-tight">
                  {isJobCategory 
                    ? formatBosnianSalary(productDetails?.min_salary, productDetails?.max_salary)
                    : formatBosnianPrice(productDetails?.price)
                  }
                </span>
              )}
            </div>

            {hasHistory && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm active:scale-95"
              >
                <MdHistory className="text-lg text-slate-400 dark:text-slate-400" />
                Historija cijene
              </button>
            )}
          </div>

          {/* DATE INFO */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 px-1">
            <span>Objavljeno: {formatShortDate(productDetails?.created_at)}</span>
            <span>ID: {productDetails?.id}</span>
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
    </>
  );
};

export default ProductDetailCard;
