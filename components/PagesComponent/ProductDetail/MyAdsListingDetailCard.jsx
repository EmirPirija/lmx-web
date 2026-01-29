"use client";
import { useState, useRef, useEffect } from "react";
import {
  MdEdit,
  MdDelete,
  MdHistory,
  MdTrendingDown,
  MdTrendingUp,
  MdSchedule,
  MdOutlineWorkOutline
} from "react-icons/md";
import { IoEyeOutline, IoClose, IoStatsChartOutline } from "react-icons/io5";
import { FaRegHeart, FaRegCommentDots } from "react-icons/fa";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { deleteItemApi } from "@/utils/api";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import JobApplicationModal from "./JobApplicationModal";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import { useNavigate } from "@/components/Common/useNavigate";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

// Helperi
const formatBosnianPrice = (price) => {
  if (price === null || price === undefined || Number(price) === 0) return "Na upit";
  return new Intl.NumberFormat("bs-BA", { minimumFractionDigits: 0 }).format(Number(price)) + " KM";
};
 
const formatShortDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = date.getDate();
  const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return `${day}. ${months[date.getMonth()]} ${date.getFullYear()}.`;
};
 
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
};

// Modal za historiju (Portal)
const DesktopHistoryModal = ({ isOpen, onClose, priceHistory, currentPrice }) => {
  if (!isOpen || !priceHistory) return null;
  const sortedHistory = [...priceHistory].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
 
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Historija cijene</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><IoClose size={20} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin dark:scrollbar-thumb-slate-700">
          {sortedHistory.map((item, index) => {
            const itemPrice = item.price || item.old_price;
            const prevPrice = index < sortedHistory.length - 1 ? (sortedHistory[index + 1]?.price || sortedHistory[index + 1]?.old_price) : itemPrice;
            const itemChange = index === 0 ? currentPrice - itemPrice : itemPrice - prevPrice;
            const isDown = itemChange < 0;
            const isUp = itemChange > 0;
 
            return (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border", isDown ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30" : isUp ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700")}>
                    {isDown ? <MdTrendingDown size={18} /> : isUp ? <MdTrendingUp size={18} /> : <MdHistory size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{formatBosnianPrice(itemPrice)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatShortDate(item.created_at || item.date)}</p>
                  </div>
                </div>
                {(isDown || isUp) && index > 0 && (
                  <span className={cn("text-xs font-bold px-2 py-1 rounded-md", isDown ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400")}>
                    {isDown ? "" : "+"}{formatBosnianPrice(Math.abs(itemChange))}
                  </span>
                )}
                {index === 0 && <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-md">Trenutna</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};
 
// Main Component
const MyAdsListingDetailCard = ({ productDetails }) => {
  const { navigate } = useNavigate();
  const CompanyName = useSelector(getCompanyName);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
 
  const productName = productDetails?.translated_item?.name || productDetails?.name;
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ad-details/${productDetails?.slug}`;
  const FbTitle = productName + " | " + CompanyName;
  const headline = `Pogledaj moj oglas "${productName}" na ${CompanyName}.`;
  
  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;
  const isScheduled = productDetails?.status === 'scheduled';
  const hasHistory = !isJobCategory && productDetails?.price_history && productDetails.price_history.length > 0;
  const isEditable = productDetails?.status && !["permanent rejected", "inactive", "sold out", "expired"].includes(productDetails.status);
  const showJobApps = isJobCategory && ["approved", "featured", "sold out"].includes(productDetails?.status);
 
  const deleteAd = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteItemApi.deleteItem({ item_id: productDetails?.id });
      if (!res?.data?.error) {
        toast.success("Oglas uspješno obrisan");
        navigate("/my-ads");
      } else toast.error(res?.data?.message);
    } catch { toast.error("Greška prilikom brisanja"); }
    finally { setIsDeleting(false); setIsDeleteOpen(false); }
  };
 
  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start gap-3 mb-4">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight flex-1">{productName}</h1>
            {productDetails?.status === "approved" && (
              <ShareDropdown 
                url={currentUrl} 
                title={FbTitle} 
                headline={headline} 
                companyName={CompanyName} 
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0" 
              />
            )}
          </div>
 
          {/* Scheduled Banner */}
          {isScheduled && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                <MdSchedule size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Zakazano</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                  {new Date(productDetails.scheduled_at).toLocaleDateString('bs-BA')}
                </p>
              </div>
            </div>
          )}
          
          {/* Price & History */}
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {formatBosnianPrice(productDetails?.price)}
            </h2>
            {hasHistory && (
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Historija cijena"
              >
                <MdHistory size={18} />
              </button>
            )}
          </div>
 
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5" title="Pregledi">
              <IoEyeOutline className="text-blue-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatNumber(productDetails?.clicks || 0)}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Favoriti">
              <FaRegHeart className="text-red-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatNumber(productDetails?.favourites_count || 0)}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Poruke">
              <FaRegCommentDots className="text-green-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatNumber(productDetails?.total_messages || 0)}</span>
            </div>
          </div>
 
          <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-5"></div>
 
          {/* Statistics Button */}
          <button 
            onClick={() => navigate(`/my-ads/${productDetails?.slug}/statistics`)}
            className="w-full mb-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all group"
          >
            <IoStatsChartOutline size={18} className="group-hover:scale-110 transition-transform" />
            <span>Detaljna statistika</span>
          </button>
 
          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            <button 
              className="py-2.5 px-4 flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm" 
              onClick={() => setIsDeleteOpen(true)}
            >
              Obriši
            </button>
 
            {isEditable && (
              <Link 
                href={`/edit-listing/${productDetails?.id}`} 
                className="py-2.5 px-4 flex-1 rounded-xl bg-primary text-white font-medium text-center hover:bg-primary/90 transition-colors text-sm"
              >
                Uredi
              </Link>
            )}
 
            {showJobApps && (
              <button 
                onClick={() => setShowJobsModal(true)} 
                className="py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                title="Prijave za posao"
              >
                <MdOutlineWorkOutline size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
 
      {/* Modals */}
      <JobApplicationModal 
        IsShowJobApplications={showJobsModal} 
        setIsShowJobApplications={setShowJobsModal} 
        listingId={productDetails?.id} 
        isJobFilled={productDetails?.status === "sold out"} 
      />
      
      <DesktopHistoryModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
        priceHistory={productDetails?.price_history} 
        currentPrice={productDetails?.price} 
      />
 
      <ReusableAlertDialog
        open={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={deleteAd}
        title="Obriši oglas?"
        description="Ova akcija je nepovratna. Da li ste sigurni?"
        cancelText="Odustani"
        confirmText={isDeleting ? "Brisanje..." : "Da, obriši"}
        confirmDisabled={isDeleting}
      />
    </>
  );
};
 
export default MyAdsListingDetailCard;