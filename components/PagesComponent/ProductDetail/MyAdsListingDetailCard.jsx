"use client";
import {
  formatPriceAbbreviated,
  formatSalaryRange,
  t,
} from "@/utils/index";
import { FaBriefcase, FaRegHeart } from "react-icons/fa";
import { IoEyeOutline, IoClose, IoStatsChartOutline } from "react-icons/io5";
import { 
  MdLocalOffer, 
  MdDelete, 
  MdEdit, 
  MdHistory, 
  MdTrendingDown, 
  MdTrendingUp,
  MdSchedule
} from "react-icons/md";
import { FiPercent } from "react-icons/fi";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { deleteItemApi } from "@/utils/api";
import CustomLink from "@/components/Common/CustomLink";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import { useState, useRef, useEffect } from "react";
import JobApplicationModal from "./JobApplicationModal";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import { useNavigate } from "@/components/Common/useNavigate";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================
// HELPER FUNKCIJE
// ============================================
const formatBosnianPrice = (price) => {
  if (price === null || price === undefined) return "Na upit";
  if (Number(price) === 0) return "Na upit"; 
  return new Intl.NumberFormat("bs-BA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(price)) + " KM";
};

const formatShortDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = date.getDate();
  const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
};

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
};
 
const formatScheduledDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString('bs-BA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ============================================
// KOMPONENTA: QUICK STATS PRIKAZ
// ============================================
const QuickStatsDisplay = ({ productDetails }) => {
  const views = productDetails?.clicks || 0;
  const favorites = productDetails?.favourites_count || productDetails?.favourites?.length || 0;
  const messages = productDetails?.total_messages || 0;

  return (
    <div className="flex items-center gap-4 text-sm text-slate-500">
      <div className="flex items-center gap-1.5" title="Pregledi">
        <IoEyeOutline size={16} className="text-blue-500" />
        <span className="font-medium text-slate-700">{formatNumber(views)}</span>
      </div>
      <div className="flex items-center gap-1.5" title="Favoriti">
        <FaRegHeart size={14} className="text-red-400" />
        <span className="font-medium text-slate-700">{formatNumber(favorites)}</span>
      </div>
      {messages > 0 && (
        <div className="flex items-center gap-1.5" title="Poruke">
          <span className="text-slate-400">💬</span>
          <span className="font-medium text-slate-700">{formatNumber(messages)}</span>
        </div>
      )}
    </div>
  );
};

// ============================================
// KOMPONENTA: DESKTOP MODAL ZA HISTORIJU
// ============================================
const DesktopPriceHistoryModal = ({ isOpen, onClose, priceHistory, currentPrice }) => {
  if (!isOpen || !priceHistory) return null;

  const sortedHistory = [...priceHistory].sort((a, b) => 
    new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 hidden lg:flex">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Historija cijene</h3>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <IoClose size={20} />
          </button>
        </div>
        <div className="p-0 max-h-[60vh] overflow-y-auto">
          {sortedHistory.map((item, index) => {
            const itemPrice = item.price || item.old_price;
            const itemDate = item.created_at || item.date;
            const prevPrice = index < sortedHistory.length - 1 
              ? (sortedHistory[index + 1]?.price || sortedHistory[index + 1]?.old_price)
              : itemPrice;
            
            const itemChange = index === 0 ? currentPrice - itemPrice : itemPrice - prevPrice;
            const isChangeDown = itemChange < 0;
            const isChangeUp = itemChange > 0;

            return (
              <div key={index} className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center",
                    isChangeDown && "bg-green-50 text-green-600",
                    isChangeUp && "bg-red-50 text-red-600",
                    !isChangeDown && !isChangeUp && "bg-slate-50 text-slate-400"
                  )}>
                    {isChangeDown ? <MdTrendingDown size={18} /> : isChangeUp ? <MdTrendingUp size={18} /> : <MdHistory size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{formatBosnianPrice(itemPrice)}</p>
                    <p className="text-xs text-slate-400">{formatShortDate(itemDate)}</p>
                  </div>
                </div>
                {(isChangeDown || isChangeUp) && index > 0 && (
                  <div className={cn(
                    "px-2 py-1 rounded-md text-xs font-bold",
                    isChangeDown ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    {isChangeDown ? "" : "+"}{formatBosnianPrice(Math.abs(itemChange))}
                  </div>
                )}
                {index === 0 && <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">Trenutna</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const MyAdsListingDetailCard = ({ productDetails }) => {
  const { navigate } = useNavigate();
  const CompanyName = useSelector(getCompanyName);
 
  const [IsDeleteAccount, setIsDeleteAccount] = useState(false);
  const [IsDeletingAccount, setIsDeletingAccount] = useState(false);
  const [IsShowJobApplications, setIsShowJobApplications] = useState(false);

  const [status, setStatus] = useState(productDetails?.status || "");
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);
  const statusDrawerRef = useRef(null);

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showDesktopHistory, setShowDesktopHistory] = useState(false);
  const historyDrawerRef = useRef(null);
 
  const productName = productDetails?.translated_item?.name || productDetails?.name;
  
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ad-details/${productDetails?.slug}`;
  const FbTitle = productName + " | " + CompanyName;
  const headline = `🚀 Discover the perfect deal! Explore "${productName}" from ${CompanyName}.`;
  
  const isEditable = productDetails?.status && !["permanent rejected", "inactive", "sold out", "expired"].includes(productDetails.status);
  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;
  const isScheduled = productDetails?.status === 'scheduled' && productDetails?.scheduled_at;
  const isShowReceivedJobApplications = isJobCategory && (productDetails?.status === "approved" || productDetails?.status === "featured" || productDetails?.status === "sold out");
 
  // Sale Logic
  const isOnSale = productDetails?.is_on_sale === true || productDetails?.is_on_sale === 1;
  const oldPrice = productDetails?.old_price;
  const currentPrice = productDetails?.price;
  const discountPercentage = productDetails?.discount_percentage || (
    isOnSale && oldPrice && currentPrice && Number(oldPrice) > Number(currentPrice)
      ? Math.round(((Number(oldPrice) - Number(currentPrice)) / Number(oldPrice)) * 100)
      : 0
  );
  const savings = isOnSale && oldPrice && currentPrice ? Math.max(0, Number(oldPrice) - Number(currentPrice)) : 0;
  
  const hasHistory = !isJobCategory && productDetails?.price_history && productDetails.price_history.length > 0;

  // Statistika dostupna za sve aktivne i završene oglase
  const canViewStatistics = productDetails?.status && ["approved", "featured", "sold out"].includes(productDetails.status);

  const handleHistoryClick = () => {
    if (window.innerWidth >= 1024) {
      setShowDesktopHistory(true);
    } else {
      setShowHistoryDrawer(true);
    }
  };

  const handleStatisticsClick = () => {
    navigate(`/my-ads/${productDetails?.slug}/statistics`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDrawerRef.current && !statusDrawerRef.current.contains(event.target)) {
        setShowStatusDrawer(false);
      }
    };
  
    if (showStatusDrawer) {
      document.addEventListener("mousedown", handleClickOutside);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStatusDrawer]);
  
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

  useEffect(() => {
    if (showDesktopHistory) {
      document.body.style.overflow = 'hidden';
    } else if (!showHistoryDrawer) {
      document.body.style.overflow = 'unset';
    }
  }, [showDesktopHistory]);

  const deleteAd = async () => {
    try {
      setIsDeletingAccount(true);
      const res = await deleteItemApi.deleteItem({ item_id: productDetails?.id });
      if (res?.data?.error === false) {
        toast.success(t("adDeleted"));
        navigate("/my-ads");
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsDeletingAccount(false);
    }
  };
 
  const PriceDisplay = () => {
    if (isJobCategory) {
      return (
        <h2 className="text-2xl font-black text-slate-900">
          {formatSalaryRange(productDetails?.min_salary, productDetails?.max_salary)}
        </h2>
      );
    }
    
    if (isOnSale && oldPrice && discountPercentage > 0) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-400 line-through text-lg">{formatBosnianPrice(oldPrice)}</span>
            <h2 className="text-2xl font-black text-red-600">{formatBosnianPrice(currentPrice)}</h2>
          </div>
          {savings > 0 && (
            <p className="text-sm text-green-600 font-semibold">
              Uštedite {formatPriceAbbreviated(savings)}
            </p>
          )}
        </div>
      );
    }
    
    return (
      <h2 className="text-2xl font-black text-slate-900">
        {formatBosnianPrice(productDetails?.price)}
      </h2>
    );
  };
 
  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5">
          {/* HEADER - Naslov + Share */}
          <div className="flex justify-between items-start gap-3 mb-4">
            <h1 className="text-xl font-bold text-slate-900 leading-tight flex-1">{productName}</h1>
            {productDetails?.status === "approved" && (
              <ShareDropdown 
                url={currentUrl} 
                title={FbTitle} 
                headline={headline} 
                companyName={CompanyName} 
                className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors shrink-0" 
              />
            )}
          </div>
 
          {/* SCHEDULED BANNER */}
          {isScheduled && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MdSchedule className="text-blue-600" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-800">Oglas je zakazan</p>
                  <p className="text-xs text-blue-600 truncate">
                    Objava: {formatScheduledDate(productDetails.scheduled_at)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* CIJENA + HISTORY BUTTON */}
          <div className="flex items-center gap-3 mb-4">
            <PriceDisplay />
            {hasHistory && (
              <button 
                onClick={handleHistoryClick}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors shrink-0"
                title="Historija cijena"
              >
                <MdHistory size={18} />
              </button>
            )}
          </div>

          {/* QUICK STATS - prikaži samo ako ima pregleda */}
          {(productDetails?.clicks > 0 || productDetails?.favourites?.length > 0) && (
            <div className="mb-4">
              <QuickStatsDisplay productDetails={productDetails} />
            </div>
          )}
 
          {/* RAZDJELNIK */}
          <div className="h-px w-full bg-slate-200 mb-4"></div>

          {/* STATISTICS BUTTON - Desktop */}
          {canViewStatistics && (
            <button 
              onClick={handleStatisticsClick}
              className="w-full mb-3 py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-700 font-medium flex items-center justify-center gap-2 hover:from-blue-100 hover:to-indigo-100 transition-all group"
            >
              <IoStatsChartOutline size={18} className="group-hover:scale-110 transition-transform" />
              <span>Pogledaj detaljnu statistiku</span>
            </button>
          )}

          {/* DESKTOP ACTIONS */}
          <div className="hidden lg:flex items-center gap-3">
            <button 
              className="py-2 px-4 flex-1 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors" 
              onClick={() => setIsDeleteAccount(true)}
            >
              {t("delete")}
            </button>
 
            {isEditable && (
              <CustomLink 
                href={`/edit-listing/${productDetails?.id}`} 
                className="bg-primary py-2 px-4 flex-1 rounded-md text-white font-medium text-center hover:opacity-90 transition-opacity"
              >
                {t("edit")}
              </CustomLink>
            )}
 
            {isShowReceivedJobApplications && (
              <button 
                onClick={() => setIsShowJobApplications(true)} 
                className="bg-slate-900 py-2 px-4 flex-1 rounded-md text-white font-medium flex items-center gap-2 justify-center hover:bg-slate-800 transition-colors"
              >
                <FaBriefcase size={16} /> {t("jobApplications")}
              </button>
            )}
          </div>
        </div>
      </div>
 
      <JobApplicationModal 
        IsShowJobApplications={IsShowJobApplications} 
        setIsShowJobApplications={setIsShowJobApplications} 
        listingId={productDetails?.id} 
        isJobFilled={productDetails?.status === "sold out"} 
      />
      
      <DesktopPriceHistoryModal 
        isOpen={showDesktopHistory} 
        onClose={() => setShowDesktopHistory(false)} 
        priceHistory={productDetails?.price_history} 
        currentPrice={productDetails?.price} 
      />

      <ReusableAlertDialog
        open={IsDeleteAccount}
        onCancel={() => setIsDeleteAccount(false)}
        onConfirm={deleteAd}
        title={t("areYouSure")}
        description={t("youWantToDeleteThisAd")}
        cancelText={t("cancel")}
        confirmText={t("yes")}
        confirmDisabled={IsDeletingAccount}
      />

      {/* MOBILE HISTORY DRAWER */}
      {hasHistory && (
        <>
          <div className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] transition-opacity duration-300 lg:hidden ${showHistoryDrawer ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setShowHistoryDrawer(false)} />
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
                    const itemChange = index === 0 ? currentPrice - itemPrice : itemPrice - prevPrice;
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

      {/* MOBILE ACTION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] p-3">
        <div className="container flex items-center gap-3">
          
        <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium">Status</p>
              {productDetails?.status === 'scheduled' && (
                <MdSchedule className="text-blue-500" size={12} />
              )}
            <div className="flex items-center gap-2">
              <p className={`text-sm font-bold truncate ${
                productDetails?.status === 'approved' ? 'text-green-600' : 
                productDetails?.status === 'pending' ? 'text-yellow-600' : 
                productDetails?.status === 'scheduled' ? 'text-blue-600' :
                productDetails?.status === 'review' ? 'text-orange-600' :
                productDetails?.status === 'sold out' ? 'text-blue-600' :
                'text-slate-700'
              }`}>
                {productDetails?.status === 'approved' ? 'Aktivan' : 
                 productDetails?.status === 'pending' ? 'Na čekanju' : 
                 productDetails?.status === 'scheduled' ? `Zakazano ${formatScheduledDate(productDetails?.scheduled_at)}` :
                 productDetails?.status === 'review' ? 'Na pregledu' :
                 productDetails?.status === 'sold out' ? 'Prodano' :
                 productDetails?.status === 'expired' ? 'Istekao' :
                 productDetails?.status}
              </p>
              {/* Rezervisano badge - prikaži zasebno */}
              {productDetails?.reservation_status === 'reserved' && (
                <span className="text-xs font-bold text-amber-600">🔒</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* STATISTIKA DUGME - MOBILE */}
            {canViewStatistics && (
              <button
                className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 active:scale-95 transition-all"
                aria-label="Statistika"
                onClick={handleStatisticsClick}
              >
                <IoStatsChartOutline size={20} />
              </button>
            )}

            {isEditable && (
              <>
                <button
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 active:scale-95 transition-all"
                  aria-label="Promijeni status"
                  onClick={() => setShowStatusDrawer(true)}
                >
                  <MdHistory size={20} />
                </button>

                <Link 
                  href={`/edit-listing/${productDetails?.id}`}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 active:scale-95 transition-all"
                  aria-label="Uredi"
                >
                  <MdEdit size={20} />
                </Link>
              </>
            )}

            <button 
              className="w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all"
              aria-label="Obriši"
              onClick={() => setIsDeleteAccount(true)}
            >
              <MdDelete size={20} />
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
 
export default MyAdsListingDetailCard;