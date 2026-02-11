"use client";
import { useEffect, useState } from "react";
import { myPurchasesApi } from "@/utils/api";
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
  MdShoppingBag,
  MdOpenInNew
} from "react-icons/md";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
 
// Format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("bs-BA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
 
// Format price
const formatPrice = (price) => {
  if (!price) return "0 KM";
  return new Intl.NumberFormat("bs-BA").format(price) + " KM";
};
 
// Purchase Card
const PurchaseCard = ({ purchase, onViewReceipt }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="flex gap-4 p-4">
        <div className="relative">
          <CustomImage
            src={purchase?.item?.image}
            alt={purchase?.item?.name}
            width={100}
            height={100}
            className="w-24 h-24 rounded-xl object-cover"
          />
          {purchase?.quantity > 1 && (
            <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
              x{purchase.quantity}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate text-lg">
            {purchase?.item?.name}
          </h3>
          <p className="text-xl font-bold text-primary mt-1">
            {formatPrice(purchase?.total_price)}
          </p>
          
          <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
            <MdStorefront size={16} className="text-slate-400" />
            <span>Od: </span>
            <span className="font-medium text-slate-700">{purchase?.seller?.name}</span>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            <MdCalendarToday size={14} className="text-slate-400" />
            <span>{formatDate(purchase?.created_at)}</span>
          </div>
        </div>
      </div>
 
      {/* Receipt section */}
      <div className="border-t border-slate-100 px-4 py-3 bg-gradient-to-r from-slate-50 to-white">
        {purchase?.receipt_url ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <MdReceipt size={18} />
              <span className="font-medium">Račun dostupan</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onViewReceipt(purchase)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <MdVisibility size={16} />
                Pregledaj
              </button>
              <a
                href={purchase.receipt_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <MdDownload size={16} />
                Preuzmi
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MdReceipt size={18} />
            <span>Račun nije priložen</span>
          </div>
        )}
        
        {purchase?.note && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 font-medium mb-1">Poruka od prodavača:</p>
            <p className="text-sm text-blue-800">{purchase.note}</p>
          </div>
        )}
      </div>
    </div>
  );
};
 
// Loading Skeleton
const PurchaseSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="flex gap-4 p-4">
      <Skeleton className="w-24 h-24 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-7 w-28 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
    <div className="border-t border-slate-100 px-4 py-3">
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);
 
// Receipt Modal
const ReceiptModal = ({ isOpen, onClose, purchase }) => {
  if (!purchase) return null;
  
  const isPdf = purchase?.receipt_url?.toLowerCase().endsWith('.pdf');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MdReceipt className="text-primary" />
            Račun - {purchase?.item?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {isPdf ? (
            <div className="bg-slate-100 rounded-xl p-8 text-center">
              <MdReceipt className="mx-auto text-slate-400 mb-4" size={56} />
              <p className="text-slate-600 mb-4">PDF dokument</p>
              <a
                href={purchase.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <MdOpenInNew size={18} />
                Otvori PDF
              </a>
            </div>
          ) : (
            <img
              src={purchase.receipt_url}
              alt="Račun"
              className="w-full max-h-[50vh] object-contain rounded-xl border border-slate-200"
            />
          )}
          
          {/* Info */}
          <div className="mt-4 p-4 bg-slate-50 rounded-xl">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Prodavač</p>
                <p className="font-semibold text-slate-800">{purchase?.seller?.name}</p>
              </div>
              <div>
                <p className="text-slate-500">Datum</p>
                <p className="font-semibold text-slate-800">{formatDate(purchase?.created_at)}</p>
              </div>
              <div>
                <p className="text-slate-500">Količina</p>
                <p className="font-semibold text-slate-800">{purchase?.quantity}x</p>
              </div>
              <div>
                <p className="text-slate-500">Ukupno</p>
                <p className="font-semibold text-primary">{formatPrice(purchase?.total_price)}</p>
              </div>
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
      console.error("Greška pri dohvatanju kupovina:", error);
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
    <>
      <BreadCrumb title2="Moje kupovine" />
      <div className="container py-6">
        <ProfileNavigation />
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <MdShoppingBag className="text-primary" size={26} />
            </div>
            Moje kupovine
          </h1>
          <p className="text-slate-500 mt-2">
            Pregled artikala koje ste kupili i računa od prodavača
          </p>
        </div>
 
        {/* Content */}
        {isLoading && purchases.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <PurchaseSkeleton key={i} />
            ))}
          </div>
        ) : purchases.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {purchases.map((purchase) => (
                <PurchaseCard
                  key={purchase.id}
                  purchase={purchase}
                  onViewReceipt={handleViewReceipt}
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Učitavanje..." : "Učitaj više"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <CustomImage
              src={NoDataFound}
              alt="Nema kupovina"
              width={200}
              height={200}
              className="opacity-50"
            />
            <h3 className="text-xl font-semibold text-slate-700 mt-6">
              Nemate kupovina
            </h3>
            <p className="text-slate-500 mt-2 text-center max-w-md">
              Artikli koje kupite će se pojaviti ovdje zajedno s računima od prodavača.
            </p>
          </div>
        )}
      </div>
 
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        purchase={selectedPurchase}
      />
    </>
  );
};
 
export default MyPurchases;
