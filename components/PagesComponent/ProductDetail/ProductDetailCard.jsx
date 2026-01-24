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
  if (!price || price === 0) return "Na upit";
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
 
const formatBosnianDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  const day = date.getDate();
  const months = [
    "januar", "februar", "mart", "april", "maj", "juni",
    "juli", "august", "septembar", "oktobar", "novembar", "decembar"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}. ${month} ${year}`;
};
 
const formatShortDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  const day = date.getDate();
  const months = [
    "jan", "feb", "mar", "apr", "maj", "jun",
    "jul", "aug", "sep", "okt", "nov", "dec"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}. ${month} ${year}`;
};
 
 
// ============================================
// DESKTOP MODAL ZA HISTORIJU (PORTAL + ANIMACIJA, BEZ OVERLAY/BLUR)
// ============================================
const DesktopPriceHistoryModal = ({ isOpen, onClose, priceHistory, currentPrice }) => {
  const modalRef = useRef(null);
 
  const sortedHistory = useMemo(() => {
    if (!priceHistory) return [];
    return [...priceHistory].sort(
      (a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
    );
  }, [priceHistory]);
 
  // ESC zatvaranje + fokus
  useEffect(() => {
    if (!isOpen) return;
 
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
 
    window.addEventListener("keydown", onKeyDown);
    // fokus nakon mounta
    setTimeout(() => modalRef.current?.focus(), 0);
 
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);
 
  // ništa ne prikazuj ako nema historije
  if (!priceHistory) return null;
 
  // PORTAL: renderuj uvijek u body, ne u parent container
  if (typeof window === "undefined") return null;
 
  return createPortal(
    // "wrapper" postoji uvijek (za smooth exit animaciju), ali klikovi samo kad je otvoren
    <div
      className={cn(
        "fixed inset-0 z-[100] hidden lg:flex items-center justify-center p-4",
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!isOpen}
    >
      {/* NEMA OVERLAYA - samo modal "pluta" */}
 
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden",
          "transition-all duration-300 ease-out will-change-transform",
          isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-[0.98]"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Historija cijene</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <IoClose size={20} />
          </button>
        </div>
 
        <div className="p-0 max-h-[60vh] overflow-y-auto">
          {sortedHistory.map((item, index) => {
            const itemPrice = item.price || item.old_price;
            const itemDate = item.created_at || item.date;
 
            const prevPrice =
              index < sortedHistory.length - 1
                ? sortedHistory[index + 1]?.price || sortedHistory[index + 1]?.old_price
                : itemPrice;
 
            const itemChange = index === 0 ? currentPrice - itemPrice : itemPrice - prevPrice;
            const isChangeDown = itemChange < 0;
            const isChangeUp = itemChange > 0;
 
            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center",
                      isChangeDown && "bg-green-50 text-green-600",
                      isChangeUp && "bg-red-50 text-red-600",
                      !isChangeDown && !isChangeUp && "bg-slate-50 text-slate-400"
                    )}
                  >
                    {isChangeDown ? (
                      <MdTrendingDown size={18} />
                    ) : isChangeUp ? (
                      <MdTrendingUp size={18} />
                    ) : (
                      <MdHistory size={18} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{formatBosnianPrice(itemPrice)}</p>
                    <p className="text-xs text-slate-400">{formatShortDate(itemDate)}</p>
                  </div>
                </div>
 
                {(isChangeDown || isChangeUp) && index > 0 && (
                  <div
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-bold",
                      isChangeDown ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}
                  >
                    {isChangeDown ? "" : "+"}
                    {formatBosnianPrice(Math.abs(itemChange))}
                  </div>
                )}
 
                {index === 0 && (
                  <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">
                    Trenutna
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};
 
 
// ============================================
// GLAVNA KOMPONENTA
// ============================================
const ProductDetailCard = ({ productDetails, setProductDetails }) => {
  const dispatch = useDispatch();
  const path = usePathname();
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${path}`;
  const translated_item = productDetails?.translated_item;
  const isLoggedIn = useSelector(getIsLoggedIn);
  const CompanyName = useSelector(getCompanyName);
  
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showDesktopHistory, setShowDesktopHistory] = useState(false);
  const historyDrawerRef = useRef(null);
 
  const productName = translated_item?.name || productDetails?.name;
  const FbTitle = productName + " | " + CompanyName;
  const headline = `🚀 Pogledaj ovu odličnu ponudu! "${productName}" na ${CompanyName}.`;
  
  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;
  const hasHistory = !isJobCategory && productDetails?.price_history && productDetails.price_history.length > 0;
  
  // Check if item is reserved
  const isReserved = productDetails?.status === 'reserved' || 
                     productDetails?.reservation_status === 'reserved';
 
  // Sale/Akcija logika
  const isOnSale = productDetails?.is_on_sale === true || productDetails?.is_on_sale === 1;
  const oldPrice = productDetails?.old_price;
  const currentPrice = productDetails?.price;
  const discountPercentage = productDetails?.discount_percentage || (
    isOnSale && oldPrice && currentPrice && Number(oldPrice) > Number(currentPrice)
      ? Math.round(((Number(oldPrice) - Number(currentPrice)) / Number(oldPrice)) * 100)
      : 0
  );
  const savings = isOnSale && oldPrice && currentPrice ? Math.max(0, Number(oldPrice) - Number(currentPrice)) : 0;
 
  const handleHistoryClick = () => {
    if (window.innerWidth >= 1024) {
      setShowDesktopHistory(true);
    } else {
      setShowHistoryDrawer(true);
    }
  };
 
  const handleLikeItem = async () => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }
    try {
      const response = await manageFavouriteApi.manageFavouriteApi({
        item_id: productDetails?.id,
      });
      if (response?.data?.error === false) {
        setProductDetails((prev) => ({
          ...prev,
          is_liked: !productDetails?.is_liked,
        }));
        
        if (!productDetails?.is_liked) {
          toast.success("Dodano u omiljene");
        } else {
          toast.success("Uklonjeno iz omiljenih");
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Greška pri ažuriranju omiljenih");
    }
  };
 
  // Close drawer on outside click (mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (historyDrawerRef.current && !historyDrawerRef.current.contains(event.target)) {
        setShowHistoryDrawer(false);
      }
    };
    if (showHistoryDrawer) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showHistoryDrawer]);
 
  // Lock scroll for desktop modal
  useEffect(() => {
    if (showDesktopHistory) {
      document.body.style.overflow = 'hidden';
    } else if (!showHistoryDrawer) {
      document.body.style.overflow = 'unset';
    }
  }, [showDesktopHistory]);
 
  return (
    <>
      <div className="overflow-hidden">
        <div className="p-5 lg:p-6">
          {/* Reserved badge - Prominent warning */}
          {isReserved && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-300 text-sm font-bold px-3 py-1.5 rounded-lg mb-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              REZERVISANO
            </div>
          )}
          
          {/* Featured badge - Manji i minimalističkiji */}
          {productDetails?.is_feature === 1 && !isReserved && (
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-md mb-3">
              <MdStar className="text-sm" />
              Istaknut
            </div>
          )}
 
          {/* Naslov */}
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 mb-3 leading-tight">
            {productName}
          </h1>
 
          {/* CIJENA SA AKCIJOM */}
          <div className="mb-4">
            {isOnSale && oldPrice && discountPercentage > 0 ? (
              <div className="space-y-2">
                
                {/* Cijene */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-slate-400 line-through text-lg">{formatBosnianPrice(oldPrice)}</span>
                  <h2 className="text-3xl font-black text-red-600">{formatBosnianPrice(currentPrice)}</h2>
                  
                  {/* History button */}
                  {hasHistory && (
                    <button 
                      onClick={handleHistoryClick}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                      title="Historija cijena"
                    >
                      <MdHistory size={18} />
                    </button>
                  )}
                </div>
                
 
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-slate-900">
                  {isJobCategory
                    ? formatBosnianSalary(productDetails?.min_salary, productDetails?.max_salary)
                    : formatBosnianPrice(productDetails?.price)}
                </h2>
                
                {/* History button */}
                {hasHistory && (
                  <button 
                    onClick={handleHistoryClick}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    title="Historija cijena"
                  >
                    <MdHistory size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
 
 
          {/* RAZDJELNIK */}
          {/* <div className="h-px w-full bg-slate-200 my-4"></div> */}
 
          {/* AKCIJE - Minimalističke */}
          <div className="flex items-center justify-between">
 
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <ShareDropdown
                url={currentUrl}
                title={FbTitle}
                headline={headline}
                companyName={CompanyName}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              />
 
              <button
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
                  productDetails?.is_liked 
                    ? "bg-red-50 text-red-600 hover:bg-red-100" 
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-red-600"
                )}
                onClick={handleLikeItem}
                title={productDetails?.is_liked ? "Ukloni iz omiljenih" : "Dodaj u omiljene"}
              >
                {productDetails?.is_liked === true ? (
                  <MdFavorite size={20} />
                ) : (
                  <MdFavoriteBorder size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
 
      {/* DESKTOP MODAL */}
      <DesktopPriceHistoryModal 
        isOpen={showDesktopHistory} 
        onClose={() => setShowDesktopHistory(false)} 
        priceHistory={productDetails?.price_history} 
        currentPrice={productDetails?.price} 
      />
 
      {/* MOBILE DRAWER */}
      {hasHistory && (
        <>
          <div className={`fixed inset-0 z-[60] transition-opacity duration-300 lg:hidden ${showHistoryDrawer ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setShowHistoryDrawer(false)} />
          <div ref={historyDrawerRef} className={`fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ease-out lg:hidden flex flex-col max-h-[85vh] ${showHistoryDrawer ? "translate-y-0" : "translate-y-full"}`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Historija cijena</h3>
              <button onClick={() => setShowHistoryDrawer(false)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <IoClose size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 pb-8">
              <div className="space-y-2.5">
                {[...productDetails.price_history]
                  .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
                  .map((item, index, arr) => {
                    const itemPrice = item.price || item.old_price;
                    const itemDate = item.created_at || item.date;
                    const prevPrice = index < arr.length - 1 
                      ? (arr[index + 1]?.price || arr[index + 1]?.old_price)
                      : itemPrice;
                    const itemChange = index === 0 ? productDetails.price - itemPrice : itemPrice - prevPrice;
                    const isChangeDown = itemChange < 0;
                    const isChangeUp = itemChange > 0;
 
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            isChangeDown && "bg-green-50 text-green-600",
                            isChangeUp && "bg-red-50 text-red-600",
                            !isChangeDown && !isChangeUp && "bg-white text-slate-400"
                          )}>
                            {isChangeDown ? <MdTrendingDown size={16} /> : isChangeUp ? <MdTrendingUp size={16} /> : <MdHistory size={16} />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">{formatBosnianPrice(itemPrice)}</p>
                            <p className="text-xs text-slate-400">{formatShortDate(itemDate)}</p>
                          </div>
                        </div>
                        {(isChangeDown || isChangeUp) && index > 0 && (
                          <span className={cn(
                            "text-xs font-bold",
                            isChangeDown ? "text-green-600" : "text-red-600"
                          )}>
                            {isChangeDown ? "" : "+"}{formatBosnianPrice(Math.abs(itemChange))}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
 
export default ProductDetailCard;