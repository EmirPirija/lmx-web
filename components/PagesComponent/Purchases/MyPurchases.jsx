"use client";
import { useEffect, useState } from "react";
import { myPurchasesApi } from "@/utils/api";
import { t, formatPriceAbbreviated } from "@/utils";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import ProfileNavigation from "@/components/Profile/ProfileNavigation";
import CustomImage from "@/components/Common/CustomImage";
import NoDataFound from "@/public/assets/no_data_found_illustrator.svg";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MdReceipt, 
  MdDownload, 
  MdVisibility,
  MdStorefront,
  MdCalendarToday,
  MdInventory,
  MdClose
} from "react-icons/md";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("bs-BA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Purchase Card Component
const PurchaseCard = ({ purchase, onViewReceipt }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Product Image & Info */}
      <div className="flex gap-4 p-4">
        <div className="relative">
          <CustomImage
            src={purchase?.item?.image}
            alt={purchase?.item?.name}
            width={100}
            height={100}
            className="w-24 h-24 rounded-lg object-cover"
          />
          {purchase?.quantity_sold > 1 && (
            <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              x{purchase.quantity_sold}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">
            {purchase?.item?.name}
          </h3>
          <p className="text-lg font-bold text-primary mt-1">
            {formatPriceAbbreviated(purchase?.total_price || purchase?.item?.price)}
          </p>
          
          {/* Seller info */}
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <MdStorefront size={16} />
            <span>{t("purchasedFrom")}: </span>
            <span className="font-medium text-slate-700">{purchase?.seller?.name}</span>
          </div>
          
          {/* Date */}
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            <MdCalendarToday size={14} />
            <span>{formatDate(purchase?.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Receipt section */}
      <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
        {purchase?.receipt_url ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <MdReceipt size={18} />
              <span className="font-medium">{t("receiptAvailable") || "Račun dostupan"}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onViewReceipt(purchase)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <MdVisibility size={16} />
                {t("viewReceipt")}
              </button>
              <a
                href={purchase.receipt_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <MdDownload size={16} />
                {t("download")}
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MdReceipt size={18} />
            <span>{t("noReceiptAvailable")}</span>
          </div>
        )}
        
        {/* Sale note if exists */}
        {purchase?.sale_note && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">{t("noteFromSeller") || "Poruka od prodavača"}:</p>
            <p className="text-sm text-slate-700">{purchase.sale_note}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Loading Skeleton
const PurchaseSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div className="flex gap-4 p-4">
      <Skeleton className="w-24 h-24 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-6 w-24 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
      <Skeleton className="h-8 w-full" />
    </div>
  </div>
);

// Receipt Preview Modal
const ReceiptPreviewModal = ({ isOpen, onClose, purchase }) => {
  if (!purchase) return null;
  
  const isPdf = purchase?.receipt_url?.toLowerCase().endsWith('.pdf');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MdReceipt className="text-primary" />
            {t("viewReceipt")} - {purchase?.item?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {isPdf ? (
            <div className="bg-slate-100 rounded-lg p-8 text-center">
              <MdReceipt className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-slate-600 mb-4">PDF dokument</p>
              <a
                href={purchase.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <MdVisibility size={18} />
                {t("openInNewTab") || "Otvori u novom tabu"}
              </a>
            </div>
          ) : (
            <div className="relative">
              <img
                src={purchase.receipt_url}
                alt="Receipt"
                className="w-full max-h-[60vh] object-contain rounded-lg border border-slate-200"
              />
            </div>
          )}
          
          {/* Purchase details */}
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">{t("purchasedFrom")}</p>
                <p className="font-medium text-slate-800">{purchase?.seller?.name}</p>
              </div>
              <div>
                <p className="text-slate-500">{t("purchaseDate")}</p>
                <p className="font-medium text-slate-800">{formatDate(purchase?.created_at)}</p>
              </div>
              <div>
                <p className="text-slate-500">{t("price")}</p>
                <p className="font-medium text-slate-800">
                  {formatPriceAbbreviated(purchase?.total_price || purchase?.item?.price)}
                </p>
              </div>
              {purchase?.quantity_sold > 1 && (
                <div>
                  <p className="text-slate-500">{t("quantity")}</p>
                  <p className="font-medium text-slate-800">{purchase?.quantity_sold}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
const MyPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const res = await myPurchasesApi.getPurchases({ page: pageNum });
      
      if (res?.data?.error === false) {
        const data = res?.data?.data?.data || res?.data?.data || [];
        
        if (pageNum === 1) {
          setPurchases(data);
        } else {
          setPurchases(prev => [...prev, ...data]);
        }
        
        setHasMore(res?.data?.data?.current_page < res?.data?.data?.last_page);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
      // For demo, set empty array
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchPurchases(page + 1);
    }
  };

  const handleViewReceipt = (purchase) => {
    setSelectedPurchase(purchase);
    setShowReceiptModal(true);
  };

  return (
    <Layout>
      <BreadCrumb title2={t("myPurchases")} />
      <div className="container py-6">
        <ProfileNavigation />
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MdInventory className="text-primary" size={24} />
            </div>
            {t("myPurchases")}
          </h1>
          <p className="text-slate-500 mt-1">
            {t("purchaseHistoryDescription") || "Pregled artikala koje ste kupili i računa od prodavača"}
          </p>
        </div>

        {/* Content */}
        {isLoading && purchases.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <PurchaseSkeleton key={i} />
            ))}
          </div>
        ) : purchases.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchases.map((purchase) => (
                <PurchaseCard
                  key={purchase.id}
                  purchase={purchase}
                  onViewReceipt={handleViewReceipt}
                />
              ))}
            </div>
            
            {/* Load more */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {isLoading ? t("loading") : t("loadMore")}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <CustomImage
              src={NoDataFound}
              alt="No purchases"
              width={200}
              height={200}
              className="opacity-60"
            />
            <h3 className="text-xl font-semibold text-slate-700 mt-6">
              {t("noPurchasesFound")}
            </h3>
            <p className="text-slate-500 mt-2 text-center max-w-md">
              {t("noPurchasesDescription")}
            </p>
          </div>
        )}
      </div>

      {/* Receipt Preview Modal */}
      <ReceiptPreviewModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        purchase={selectedPurchase}
      />
    </Layout>
  );
};

export default MyPurchases;
