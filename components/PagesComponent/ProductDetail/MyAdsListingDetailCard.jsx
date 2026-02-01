"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit,
  Trash2,
  History,
  TrendingDown,
  TrendingUp,
  Calendar,
  Briefcase,
  Eye,
  X,
  BarChart3,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Users,
  FileText,
  Shield,
  ExternalLink,
  ChevronRight,
  Download,
  Filter
} from "lucide-react";
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
  const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];
  return `${day}. ${months[date.getMonth()]} ${date.getFullYear()}.`;
};

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
};

// Modal za historiju (Portal)
const DesktopHistoryModal = ({ isOpen, onClose, priceHistory, currentPrice }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !priceHistory) return null;
  if (typeof window === "undefined") return null;

  const sortedHistory = [...priceHistory].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black backdrop-blur-sm"
              onClick={onClose}
            />
            
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-xl">
                    <History className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Historija cijena</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{sortedHistory.length} promjena</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-thin">
                {sortedHistory.map((item, index) => {
                  const itemPrice = item.price || item.old_price;
                  const prevPrice = index < sortedHistory.length - 1 
                    ? (sortedHistory[index + 1]?.price || sortedHistory[index + 1]?.old_price) 
                    : itemPrice;
                  const itemChange = index === 0 ? currentPrice - itemPrice : itemPrice - prevPrice;
                  const isDown = itemChange < 0;
                  const isUp = itemChange > 0;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
                          isDown ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400" :
                          isUp ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400" :
                          "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                        )}>
                          {isDown ? <TrendingDown className="w-5 h-5" /> : isUp ? <TrendingUp className="w-5 h-5" /> : <History className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{formatBosnianPrice(itemPrice)}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{formatShortDate(item.created_at || item.date)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {(isDown || isUp) && index > 0 && (
                          <span className={cn(
                            "text-sm font-bold px-3 py-1 rounded-lg transition-colors",
                            isDown ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : 
                            "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          )}>
                            {isDown ? "" : "+"}{formatBosnianPrice(Math.abs(itemChange))}
                          </span>
                        )}
                        {index === 0 && (
                          <span className="text-xs font-bold text-primary bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-lg">
                            Trenutna
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  Historija prikazuje sve promjene cijene od objavljivanja
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
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
  const [showStatsModal, setShowStatsModal] = useState(false);

  const productName = productDetails?.translated_item?.name || productDetails?.name;
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ad-details/${productDetails?.slug}`;
  const FbTitle = productName + " | " + CompanyName;
  const headline = `Pogledaj moj oglas "${productName}" na ${CompanyName}.`;
  
  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;
  const isScheduled = productDetails?.status === 'scheduled';
  const hasHistory = !isJobCategory && productDetails?.price_history && productDetails.price_history.length > 0;
  const isEditable = productDetails?.status && !["permanent rejected", "inactive", "sold out", "expired"].includes(productDetails.status);
  const showJobApps = isJobCategory && ["approved", "featured", "sold out"].includes(productDetails?.status);
  const isFeatured = productDetails?.is_feature === 1;
  const isReserved = productDetails?.status === 'reserved' || productDetails?.reservation_status === 'reserved';

  const deleteAd = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteItemApi.deleteItem({ item_id: productDetails?.id });
      if (!res?.data?.error) {
        toast.success("Oglas uspješno obrisan");
        navigate("/my-ads");
      } else toast.error(res?.data?.message || "Došlo je do greške");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Greška prilikom brisanja");
    } finally { 
      setIsDeleting(false); 
      setIsDeleteOpen(false); 
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'scheduled': return 'bg-blue-500';
      case 'reserved': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Aktivan';
      case 'pending': return 'Na čekanju';
      case 'rejected': return 'Odbijen';
      case 'scheduled': return 'Zakazano';
      case 'reserved': return 'Rezervisano';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'reserved': return <Shield className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
      >
        <div className="p-6 lg:p-8">
          {/* Header sa naslovom i share dugmetom */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {isReserved && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold">
                    <Shield className="w-3 h-3" />
                    Rezervisano
                  </span>
                )}
                {isFeatured && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold">
                    <Star className="w-3 h-3" />
                    Istaknuto
                  </span>
                )}
                {isScheduled && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold">
                    <Calendar className="w-3 h-3" />
                    Zakazano
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-3">{productName}</h1>
              
              {/* Status i ID */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", getStatusColor(productDetails?.status))} />
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    {getStatusText(productDetails?.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
                  <FileText className="w-4 h-4" />
                  <span>ID: #{productDetails?.id}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>{formatShortDate(productDetails?.created_at)}</span>
                </div>
              </div>
            </div>
            
            {productDetails?.status === "approved" && (
              <ShareDropdown 
                url={currentUrl} 
                title={FbTitle} 
                headline={headline} 
                companyName={CompanyName}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-primary transition-all"
                iconClass="w-5 h-5"
              />
            )}
          </div>

          {/* Scheduled Banner */}
          {isScheduled && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-xl">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-800 dark:text-blue-300">Zakazano objavljivanje</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {new Date(productDetails.scheduled_at).toLocaleDateString('bs-BA', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Price & History */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Cijena</p>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-3xl lg:text-4xl font-black text-primary">
                    {formatBosnianPrice(productDetails?.price)}
                  </h2>
                </div>
              </div>

              {hasHistory && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowHistoryModal(true)}
                  className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 transition-all shadow-sm"
                >
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Historija cijena</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Pregledi</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatNumber(productDetails?.clicks || 0)}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Omiljeno</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatNumber(productDetails?.favourites_count || 0)}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Poruke</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatNumber(productDetails?.total_messages || 0)}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Prijave</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatNumber(productDetails?.job_applications_count || 0)}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-8"></div>

          {/* Statistika Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/my-ads/${productDetails?.slug}/statistics`)}
            className="w-full mb-6 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Detaljna statistika</span>
          </motion.button>

          {/* Action Buttons - Desktop */}
          <div className="hidden lg:flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
                Obriši
              </motion.button>

              {isEditable && (
                <Link
                  href={`/edit-listing/${productDetails?.id}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Uredi
                </Link>
              )}
            </div>

            {showJobApps && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowJobsModal(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
              >
                <Briefcase className="w-5 h-5" />
                <span>Pregled prijava za posao ({productDetails?.job_applications_count || 0})</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </motion.button>
            )}
          </div>

          {/* Mobile Action Buttons */}
          <div className="lg:hidden flex flex-col gap-3 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium rounded-xl"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
                Obriši
              </motion.button>

              {isEditable && (
                <Link
                  href={`/edit-listing/${productDetails?.id}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-medium rounded-xl"
                >
                  <Edit className="w-4 h-4" />
                  Uredi
                </Link>
              )}
            </div>

            {showJobApps && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowJobsModal(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white font-medium rounded-xl"
              >
                <Briefcase className="w-5 h-5" />
                <span>Prijave za posao</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

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
        description="Ova akcija je nepovratna. Da li ste sigurni da želite obrisati ovaj oglas?"
        cancelText="Odustani"
        confirmText={isDeleting ? "Brisanje..." : "Da, obriši"}
        confirmDisabled={isDeleting}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </>
  );
};

export default MyAdsListingDetailCard;