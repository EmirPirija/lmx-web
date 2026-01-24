"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { allItemApi, getMyItemsApi, setItemTotalClickApi, deleteItemApi } from "@/utils/api";
import ProductFeature from "./ProductFeature";
import { getSellerApi, gamificationApi } from "@/utils/api";
import ProductDescription from "./ProductDescription";
import ProductDetailCard from "./ProductDetailCard";
import SellerDetailCard from "./SellerDetailCard";
import ProductLocation from "./ProductLocation";
import AdsReportCard from "./AdsReportCard";
import SimilarProducts from "./SimilarProducts";
import MyAdsListingDetailCard from "./MyAdsListingDetailCard";
import AdsStatusChangeCards from "./AdsStatusChangeCards";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Layout from "@/components/Layout/Layout";
import ProductQuestions from "./ProductQuestions";
import ProductGallery from "./ProductGallery";
import AdStatisticsSection from "@/components/PagesComponent/MyAds/AdStatisticsSection";
import ItemStatisticsDashboard from "@/components/PagesComponent/MyAds/ItemStatisticsDashboard";
import {
  getFilteredCustomFields,
  getYouTubeVideoId,
  truncate,
  t
} from "@/utils";
import OpenInAppDrawer from "@/components/Common/OpenInAppDrawer";
import { useDispatch, useSelector } from "react-redux";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import { setBreadcrumbPath } from "@/redux/reducer/breadCrumbSlice";
import MakeFeaturedAd from "./MakeFeaturedAd";
import RenewAd from "./RenewAd";
import AdEditedByAdmin from "./AdEditedByAdmin";
import NoData from "@/components/EmptyStates/NoData";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import { toast } from "sonner";
import Link from "next/link";
import { 
  MdSyncAlt,
  MdRocketLaunch,
} from "react-icons/md";

import { 
  MdHistory, 
  MdClose, 
  MdTrendingDown, 
  MdTrendingUp,
  MdExpandMore,
  MdExpandLess,
  MdPhone, 
  MdChat, 
  MdVisibility,
  MdEdit,
  MdDelete,
  MdLocalOffer, 
} from "react-icons/md";

import { IoStatsChart } from "react-icons/io5";

// ============================================
// TRACKING IMPORTS
// ============================================
import { 
  useItemTracking, 
  useContactTracking, 
  useEngagementTracking 
} from "@/hooks/useItemTracking";

// ============================================
// GLOBALNI HELPERI
// ============================================

// Formatiranje cijene
const formatPrice = (price) => {
  if (!price || price === 0) return "Na upit";
  return new Intl.NumberFormat('bs-BA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' KM';
};



// Formatiranje datuma
const formatDate = (dateString) => {
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

const StatisticsModal = ({ isOpen, onClose, itemId, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <IoStatsChart className="text-blue-500" />
              Statistika oglasa
            </h2>
            {itemName && (
              <p className="text-sm text-slate-500 mt-0.5 truncate max-w-md">
                {itemName}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <MdClose size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {/* ✅ koristi komponentu koju već imaš importovanu */}
          <AdStatisticsSection itemId={itemId} />
        </div>
      </div>
    </div>
  );
};



// ============================================
// KOMPONENTA: HISTORIJA CIJENA
// ============================================
const PriceHistory = ({ priceHistory = [], currentPrice }) => {
  const [isExpanded, setIsExpanded] = useState(false);
 
  if (!priceHistory || priceHistory.length === 0) {
    return null;
  }

 
  // Sortiraj po datumu (najnoviji prvi)
  const sortedHistory = [...priceHistory].sort((a, b) => 
    new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
  );
 
  // Izračunaj ukupnu promjenu cijene
  const oldestPrice = sortedHistory[sortedHistory.length - 1]?.price || currentPrice;
  const priceChange = currentPrice - oldestPrice;
  const percentChange = oldestPrice > 0 ? ((priceChange / oldestPrice) * 100).toFixed(1) : 0;
  const isPriceDown = priceChange < 0;
  const isPriceUp = priceChange > 0;
  
  // ============================================
// STATISTIKA MODAL
// ============================================
 
  // Prikaži samo prve 3 ako nije prošireno
  const displayedHistory = isExpanded ? sortedHistory : sortedHistory.slice(0, 3);
  const hasMore = sortedHistory.length > 3;
 
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Zaglavlje */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <MdHistory className="text-slate-600 text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Historija cijena</h3>
              <p className="text-xs text-slate-500">{sortedHistory.length} {sortedHistory.length === 1 ? 'promjena' : sortedHistory.length < 5 ? 'promjene' : 'promjena'}</p>
            </div>
          </div>

          
          
          {/* Oznaka za ukupnu promjenu */}
          {(isPriceDown || isPriceUp) && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
              isPriceDown 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isPriceDown ? (
                <MdTrendingDown className="text-lg" />
              ) : (
                <MdTrendingUp className="text-lg" />
              )}
              <span>{Math.abs(percentChange)}%</span>
            </div>
          )}
        </div>
      </div>
 
      {/* Lista promjena */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Trenutna cijena */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-600">Trenutna cijena</span>
            </div>
            <span className="font-bold text-primary text-lg">{formatPrice(currentPrice)}</span>
          </div>
 
          {/* Historija */}
          {displayedHistory.map((item, index) => {
            const itemPrice = item.price || item.old_price;
            const itemDate = item.created_at || item.date;
            const prevPrice = index < displayedHistory.length - 1 
              ? (displayedHistory[index + 1]?.price || displayedHistory[index + 1]?.old_price)
              : itemPrice;
            
            const itemChange = index === 0 ? currentPrice - itemPrice : itemPrice - prevPrice;
            const isDown = itemChange < 0;
            const isUp = itemChange > 0;
 
            return (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDown ? 'bg-green-100' : isUp ? 'bg-red-100' : 'bg-slate-200'
                  }`}>
                    {isDown ? (
                      <MdTrendingDown className="text-green-600" />
                    ) : isUp ? (
                      <MdTrendingUp className="text-red-600" />
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">{formatPrice(itemPrice)}</span>
                    <p className="text-xs text-slate-400">{formatDate(itemDate)}</p>
                  </div>
                </div>
                
                {(isDown || isUp) && (
                  <span className={`text-xs font-bold ${isDown ? 'text-green-600' : 'text-red-600'}`}>
                    {isDown ? '' : '+'}{formatPrice(Math.abs(itemChange))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
 
        {/* Dugme za proširenje */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all"
          >
            {isExpanded ? (
              <>
                <MdExpandLess className="text-lg" />
                Prikaži manje
              </>
            ) : (
              <>
                <MdExpandMore className="text-lg" />
                Prikaži sve (još {sortedHistory.length - 3})
              </>
            )}
          </button>
        )}
      </div>
 
      {/* Informacija u podnožju */}
      {isPriceDown && (
        <div className="px-5 py-3 bg-green-50 border-t border-green-100">
          <p className="text-xs text-green-700 text-center font-medium">
            Cijena je snižena za {formatPrice(Math.abs(priceChange))} od prvog oglašavanja
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// DESKTOP: TEASER KARTICA (BOČNA TRAKA)
// ============================================
const PriceHistoryTeaser = ({ priceHistory, currentPrice, onClick }) => {
    const sortedHistory = [...priceHistory].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
    const oldestPrice = sortedHistory[sortedHistory.length - 1]?.price || currentPrice;
    const priceChange = currentPrice - oldestPrice;
    const percentChange = oldestPrice > 0 ? ((priceChange / oldestPrice) * 100).toFixed(1) : 0;
    const isPriceDown = priceChange < 0;
};

// ============================================
// DESKTOP: MODAL (Iskočni prozor)
// ============================================
const DesktopPriceHistoryModal = ({ isOpen, onClose, priceHistory, currentPrice }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 transition-opacity" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-800">Historija kretanja cijene</h3>
                    <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                        <MdClose size={20} />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <PriceHistory priceHistory={priceHistory} currentPrice={currentPrice} />
                </div>
            </div>
        </div>
    );
};

// ============================================
// SKELETON UČITAVANJE
// ============================================
const ProductDetailsSkeleton = () => {
  return (
    <div className="container mt-4 lg:mt-8">
      <div className="flex gap-2 mb-4 lg:mb-6 animate-pulse">
        <div className="h-4 w-16 bg-slate-200 rounded-md" />
        <div className="h-4 w-3 bg-slate-200 rounded-md" />
        <div className="h-4 w-32 bg-slate-200 rounded-md" />
      </div>
      <div className="lg:hidden mb-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
          <div className="h-5 w-24 bg-slate-200 rounded-md mb-3" />
          <div className="h-7 w-4/5 bg-slate-200 rounded-md mb-2" />
          <div className="h-6 w-2/5 bg-slate-200 rounded-md mb-4" />
          <div className="h-9 w-36 bg-slate-200 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7">
        <div className="col-span-1 lg:col-span-8">
          <div className="flex flex-col gap-5 lg:gap-7">
            
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="w-full aspect-[4/3] lg:aspect-[870/500] bg-gradient-to-br from-slate-100 to-slate-200" />
              <div className="p-3 lg:p-4">
                <div className="flex gap-2 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 bg-slate-200 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 animate-pulse">
              <div className="h-6 w-36 bg-slate-200 rounded-md mb-5" />
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-11 w-11 bg-slate-200 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 animate-pulse">
              <div className="h-6 w-24 bg-slate-200 rounded-md mb-5" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-200 rounded" style={{ width: `${100 - i * 12}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col col-span-1 lg:col-span-4 gap-5 lg:gap-7">
          <div className="hidden lg:block bg-white p-6 rounded-2xl border border-slate-100 animate-pulse">
            <div className="h-5 w-20 bg-slate-200 rounded-md mb-3" />
            <div className="h-8 w-4/5 bg-slate-200 rounded-md mb-2" />
            <div className="h-10 w-2/5 bg-slate-200 rounded-md mb-5" />
            <div className="h-px w-full bg-slate-100 mb-5" />
            <div className="flex justify-between">
              <div className="h-8 w-32 bg-slate-200 rounded-lg" />
              <div className="flex gap-2">
                <div className="h-10 w-10 bg-slate-200 rounded-full" />
                <div className="h-10 w-10 bg-slate-200 rounded-full" />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 animate-pulse">
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 bg-slate-200 rounded-full mb-3" />
              <div className="h-5 w-32 bg-slate-200 rounded-md mb-2" />
              <div className="h-4 w-24 bg-slate-200 rounded-md mb-4" />
            </div>
            <div className="space-y-3 mt-4">
              <div className="h-12 w-full bg-slate-200 rounded-xl" />
              <div className="h-12 w-full bg-slate-200 rounded-xl" />
            </div>
          </div>
          <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 animate-pulse">
            <div className="h-5 w-28 bg-slate-200 rounded-md mb-4" />
            <div className="h-4 w-full bg-slate-200 rounded mb-3" />
            <div className="h-44 w-full bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
 
// ============================================
// MOBILNA KARTICA ZA NASLOV I CIJENU
// ============================================
const MobileProductHeader = ({ productDetails, isMyListing }) => {
  const translated_item = productDetails?.translated_item;
  const productName = translated_item?.name || productDetails?.name;
  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;
 
  const formatSalary = (min, max) => {
    if (!min && !max) return "Po dogovoru";
    const formatNum = (num) => new Intl.NumberFormat('bs-BA').format(num);
    if (min && max) return `${formatNum(min)} - ${formatNum(max)} KM`;
    if (min) return `Od ${formatNum(min)} KM`;
    return `Do ${formatNum(max)} KM`;
  };
 
  return (
    <div className="lg:hidden mb-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
        {productDetails?.category?.name && (
          <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            {productDetails?.category?.name}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-2 break-words">
          {productName}
        </h1>
        <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight mb-3">
          {isJobCategory
            ? formatSalary(productDetails?.min_salary, productDetails?.max_salary)
            : formatPrice(productDetails?.price)}
        </div>
        {productDetails?.is_feature === 1 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-sm">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Istaknuti oglas
          </span>
        )}
        {isMyListing && productDetails?.status && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500">Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  productDetails.status === 'approved' ? 'bg-green-100 text-green-700' :
                  productDetails.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                  productDetails.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  productDetails.status === 'sold out' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {productDetails.status === 'approved' ? 'Aktivan' :
                   productDetails.status === 'review' ? 'Na pregledu' :
                   productDetails.status === 'scheduled' ? 'Zakazano' :
                   productDetails.status === 'sold out' ? 'Prodano' :
                   productDetails.status}
                </span>
              {/* Rezervisano badge - prikaži zasebno ako je rezervisano */}
              {productDetails?.reservation_status === 'reserved' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                  🔒 Rezervisano
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
 
// ============================================
// GLAVNA KOMPONENTA
// ============================================
const ProductDetails = ({ slug }) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const dispatch = useDispatch();
  const pathName = usePathname();
  const router = useRouter(); 
  const searchParams = useSearchParams();
  const isShare = searchParams.get("share") == "true" ? true : false;
  const isMyListing = pathName?.startsWith("/my-listing") ? true : false;
  const [productDetails, setProductDetails] = useState(null);
  const [badges, setBadges] = useState([]);
  const [sellerSettings, setSellerSettings] = useState(null);

const fetchSellerBadges = async (sellerId) => {
  try {
    const res = await gamificationApi.getUserBadges({ user_id: sellerId });
    if (!res?.data?.error) {
      setBadges(res?.data?.data?.badges || []);
    }
  } catch (e) {
    console.error("Error fetching seller badges:", e);
  }
};

useEffect(() => {
  const sellerId =
    productDetails?.seller?.id ??
    productDetails?.user?.id ??
    productDetails?.user_id ??
    productDetails?.seller_id;

  if (sellerId) fetchSellerBadges(sellerId);
}, [productDetails]);

  const isAvailableNow =
  productDetails &&
  (
    productDetails.available_now === 1 ||
    productDetails.available_now === "1" ||
    productDetails.available_now === true
  );
  const [galleryImages, setGalleryImages] = useState([]);
  const [status, setStatus] = useState("");
  const [videoData, setVideoData] = useState({ url: "", thumbnail: "" });
  const [directVideo, setDirectVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenInApp, setIsOpenInApp] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  
  // Stanja za historiju cijena
  const [showMobilePriceHistory, setShowMobilePriceHistory] = useState(false);
  const [showDesktopPriceHistory, setShowDesktopPriceHistory] = useState(false);
  const priceHistoryDrawerRef = useRef(null);
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);
  const statusDrawerRef = useRef(null);

  // Stanja za brisanje
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showFeaturedDrawer, setShowFeaturedDrawer] = useState(false);
  const featuredDrawerRef = useRef(null);

  // Provjera da li je bilo koji popup/drawer/modal otvoren
  // Koristi se za skrivanje donje trake
  const [hideBottomBar, setHideBottomBar] = useState(false);
  
  // Pratimo sve popup stanja i ažuriramo hideBottomBar sa malim delay-om
  useEffect(() => {
    const isAnyOpen = showStatsModal || 
                      showMobilePriceHistory || 
                      showStatusDrawer || 
                      showFeaturedDrawer || 
                      isDeleteOpen || 
                      isOpenInApp;
    
    if (isAnyOpen) {
      // Odmah sakrij kada se otvori popup
      setHideBottomBar(true);
    } else {
      // Mali delay prije nego se ponovo prikaže (da animacija bude glatka)
      const timer = setTimeout(() => {
        setHideBottomBar(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showStatsModal, showMobilePriceHistory, showStatusDrawer, showFeaturedDrawer, isDeleteOpen, isOpenInApp]);

  // ============================================
  // TRACKING HOOKS
  // ============================================
  const [itemId, setItemId] = useState(null);
  
  // Glavni tracking - prati view, share, favorite
  const { 
    trackView, 
    trackShare, 
    trackFavorite,
    trackEngagement,
    trackTimeOnPage,
  } = useItemTracking(itemId, { 
    autoTrackView: false, // Ručno pozivamo nakon što dobijemo podatke
  });
  
  // Contact tracking
  const { 
    trackPhoneReveal, 
    trackPhoneClick, 
    trackWhatsApp, 
    trackViber,
    trackMessage,
    trackEmail,
  } = useContactTracking(itemId);
  
  // Engagement tracking
  const {
    trackGalleryOpen,
    trackImageView,
    trackImageZoom,
    trackVideoPlay,
    trackDescriptionExpand,
    trackMapOpen,
    trackSellerProfileClick,
    trackPriceHistoryView,
    trackSimilarItemsClick,
  } = useEngagementTracking(itemId);

  // ============================================
  // TRACK VIEW KADA SE UČITA OGLAS
  // ============================================
  useEffect(() => {
    if (itemId && !isMyListing) {
      // Dohvati source iz URL parametara
      const source = searchParams.get("ref") || "direct";
      const sourceDetail = searchParams.get("query") || searchParams.get("category") || null;
      trackView(source, sourceDetail);
    }
  }, [itemId, isMyListing, trackView, searchParams]);

  useEffect(() => {
    const fetchSellerSettings = async () => {
      if (productDetails?.user?.id) {
        try {
          const response = await getSellerApi.getSeller({ id: productDetails.user.id });
          if (response?.data?.error === false) {
            setSellerSettings(response.data.data?.seller_settings);
          }
        } catch (error) {
          console.error("Error fetching seller settings:", error);
        }
      }
    };
    
    fetchSellerSettings();
  }, [productDetails?.user?.id]);
  
  const IsShowFeaturedAd = isMyListing && !productDetails?.is_feature && productDetails?.status === "approved";
  const isMyAdExpired = isMyListing && productDetails?.status === "expired";
  const isEditedByAdmin = isMyListing && productDetails?.is_edited_by_admin === 1;
  const isEditable = isMyListing && productDetails?.status && !["permanent rejected", "inactive", "sold out", "expired"].includes(productDetails.status);
 
  useEffect(() => { fetchProductDetails(); }, [CurrentLanguage?.id]);
 
  useEffect(() => {
    if (window.innerWidth <= 768 && !isMyListing && isShare) {
      setIsOpenInApp(true);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        priceHistoryDrawerRef.current &&
        !priceHistoryDrawerRef.current.contains(event.target)
      ) {
        setShowMobilePriceHistory(false);
      }
      if (
        featuredDrawerRef.current &&
        !featuredDrawerRef.current.contains(event.target)
      ) {
        setShowFeaturedDrawer(false);
      }
      
      if (
        statusDrawerRef.current &&
        !statusDrawerRef.current.contains(event.target)
      ) {
        setShowStatusDrawer(false);
      }
    };
  
    const anyOpen = showMobilePriceHistory || showStatusDrawer;
  
    if (anyOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [showDesktopPriceHistory, showMobilePriceHistory, showStatusDrawer, showFeaturedDrawer]);
  
  
  useEffect(() => {
    if (showDesktopPriceHistory) {
        document.body.style.overflow = 'hidden';
    } else if (!showMobilePriceHistory && !showStatusDrawer) {
        document.body.style.overflow = 'unset';
    }
  }, [showDesktopPriceHistory, showMobilePriceHistory, showStatusDrawer]);
  
 
  useEffect(() => {
    if (productDetails && !isLoading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [productDetails, isLoading]);

  const handleDeleteAd = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteItemApi.deleteItem({ item_id: productDetails?.id });
      if (res?.data?.error === false) {
        toast.success("Oglas je uspješno obrisan");
        router.push("/my-ads");
      } else {
        toast.error(res?.data?.message || "Greška prilikom brisanja");
      }
    } catch (error) {
      console.log(error);
      toast.error("Došlo je do greške");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };
 
  const fetchMyListingDetails = async (slug) => {
    const response = await getMyItemsApi.getMyItems({ slug });
    const product = response?.data?.data?.data?.[0];
    if (!product) throw new Error("Oglas nije pronađen");
    setProductDetails(product);
    setItemId(product.id); // Set item ID for tracking (ali nećemo track-ati view za vlastite oglase)
    
    const videoLink = product?.video_link;
    if (videoLink) {
      const videoId = getYouTubeVideoId(videoLink);
      const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";
      setVideoData((prev) => ({ ...prev, url: videoLink, thumbnail }));
    }
    if (product?.video) setDirectVideo(product.video);
    else setDirectVideo(null);
 
    const galleryImages = product?.gallery_images?.map((image) => image?.image) || [];
    setGalleryImages([product?.image, ...galleryImages]);
    setStatus(product?.status);
    dispatch(setBreadcrumbPath([{ name: "Moji oglasi", slug: "/my-ads" }, { name: truncate(product?.translated_item?.name || product?.name, 80) }]));
    console.log("📊 FULL RESPONSE:", response.data);
    console.log("📊 PRODUCT:", response?.data?.data?.data?.[0]);
  };
 
  const incrementViews = async (item_id) => {
    try { if (!item_id) return; await setItemTotalClickApi.setItemTotalClick({ item_id }); } catch (error) { console.error(error); }
  };
 
  const fetchPublicListingDetails = async (slug) => {
    const response = await allItemApi.getItems({ slug });
    const product = response?.data?.data?.data?.[0];
    if (!product) throw new Error("Oglas nije pronađen");
    setProductDetails(product);
    setItemId(product.id); // ITEM ID ZA TRACKING
    
    const videoLink = product?.video_link;
    if (videoLink) {
      setVideoData((prev) => ({ ...prev, url: videoLink }));
      const videoId = getYouTubeVideoId(videoLink);
      const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";
      setVideoData((prev) => ({ ...prev, thumbnail }));
    }
    if (product?.video) setDirectVideo(product.video);
    else setDirectVideo(null);
 
    const galleryImages = product?.gallery_images?.map((image) => image?.image) || [];
    setGalleryImages([product?.image, ...galleryImages]);
    await incrementViews(product?.id);
  };
 
  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      setIsVisible(false);
      setVideoData({ url: "", thumbnail: "" });
      setDirectVideo(null);
      if (isMyListing) await fetchMyListingDetails(slug);
      else await fetchPublicListingDetails(slug);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  // ============================================
  // TRACKING HANDLER FUNKCIJE
  // ============================================
  
  // Handler za otvaranje historije cijena
  const handleOpenPriceHistory = useCallback(() => {
    setShowMobilePriceHistory(true);
    trackPriceHistoryView();
  }, [trackPriceHistoryView]);

  const handleOpenDesktopPriceHistory = useCallback(() => {
    setShowDesktopPriceHistory(true);
    trackPriceHistoryView();
  }, [trackPriceHistoryView]);

  // Handler za klik na mapu
  const handleMapOpen = useCallback(() => {
    trackMapOpen();
  }, [trackMapOpen]);
 
  const filteredFields = getFilteredCustomFields(productDetails?.all_translated_custom_fields, CurrentLanguage?.id);
  const getAnimationClass = () => `transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`;
  const getStaggerDelay = (index) => ({ transitionDelay: `${index * 80}ms` });
 
  return (
    <Layout>
      {isLoading ? (
        <ProductDetailsSkeleton />
      ) : productDetails ? (
        <>
          <div className={getAnimationClass()} style={getStaggerDelay(0)}>
            {isMyListing ? <BreadCrumb /> : <BreadCrumb title2={truncate(productDetails?.translated_item?.name || productDetails?.name, 80)} />}
          </div>
 
          <div className="container mt-4 lg:mt-8 pb-8 lg:pb-12">
           {isMyListing && (
              <div className={getAnimationClass()} style={getStaggerDelay(1)}>
                <MobileProductHeader productDetails={productDetails} isMyListing={isMyListing} />
              </div>
            )}
 
            {/* Banner za zakazane oglase */}
            {isMyListing && productDetails?.status === 'scheduled' && productDetails?.scheduled_at && (
              <div className={`${getAnimationClass()} mb-4`} style={getStaggerDelay(1.5)}>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-800 mb-1">Oglas je zakazan</h4>
                      <p className="text-sm text-blue-600">
                        Vaš oglas će biti automatski objavljen{' '}
                        <span className="font-bold">
                          {new Date(productDetails.scheduled_at).toLocaleString('bs-BA', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7">
              {/* LIJEVA KOLONA */}
              <div className="col-span-1 lg:col-span-8">
                <div className="flex flex-col gap-5 lg:gap-7">
                  <div className={getAnimationClass()} style={getStaggerDelay(2)}>
                    <ProductGallery 
                      galleryImages={galleryImages} 
                      videoData={videoData} 
                      directVideo={directVideo}
                      productDetails={productDetails}
                      onGalleryOpen={trackGalleryOpen}
                      onImageView={trackImageView}
                      onImageZoom={trackImageZoom}
                      onVideoPlay={trackVideoPlay}
                    />
                  </div>
                  <ProductDetailCard
                        productDetails={productDetails}
                        setProductDetails={setProductDetails}
                        onFavoriteToggle={trackFavorite}
                        onShareClick={trackShare}
                      />
                  {IsShowFeaturedAd && (
                    <div
                      className={`hidden lg:block ${getAnimationClass()}`}
                      style={getStaggerDelay(3)}
                    >
                      <MakeFeaturedAd item_id={productDetails?.id} setProductDetails={setProductDetails} />
                    </div>
                  )}

                  {filteredFields.length > 0 && (
                    <div className={getAnimationClass()} style={getStaggerDelay(4)}>
                      <ProductFeature filteredFields={filteredFields} productDetails={productDetails} />
                    </div>
                  )}
                  <div className={getAnimationClass()} style={getStaggerDelay(5)}>
                    <ProductDescription 
                      productDetails={productDetails}
                      onDescriptionExpand={trackDescriptionExpand}
                    />
                  </div>

                  {/* JAVNA PITANJA */}
                <div className={getAnimationClass()} style={getStaggerDelay(6)}>
                  <ProductQuestions 
                    productDetails={productDetails}
                    isSeller={isMyListing}
                  />
                </div>

                </div>
              </div>
 
              {/* DESNA KOLONA - FIKSIRANA */}
              <div className="flex flex-col col-span-1 lg:col-span-4 gap-5 lg:gap-7">
                <div className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-5 lg:gap-7">
                  
                  {/* GLAVNA KARTICA S DETALJIMA */}
                  <div className={`hidden lg:block ${getAnimationClass()}`} style={getStaggerDelay(6)}>
                    {isMyListing ? (
                      <MyAdsListingDetailCard productDetails={productDetails} />
                    ) : null}
                  </div>

 
                  {/* TEASER ZA HISTORIJU CIJENA - VIDLJIV SVIMA (ako ima historije) */}
                  {productDetails?.price_history && productDetails.price_history.length > 0 && (
                    <div className={`hidden lg:block ${getAnimationClass()}`} style={getStaggerDelay(6.5)}>
                        <PriceHistoryTeaser 
                          priceHistory={productDetails.price_history} 
                          currentPrice={productDetails.price} 
                          onClick={handleOpenDesktopPriceHistory} 
                        />
                    </div>
                  )}
 
                  {!isMyListing && (
                    <div className={getAnimationClass()} style={getStaggerDelay(7)} data-seller-card>
                    <SellerDetailCard 
                      productDetails={productDetails} 
                      setProductDetails={setProductDetails}
                      badges={badges}
                      sellerSettings={sellerSettings}
                      onPhoneReveal={trackPhoneReveal}
                      onPhoneClick={trackPhoneClick}
                      onWhatsAppClick={trackWhatsApp}
                      onViberClick={trackViber}
                      onMessageClick={trackMessage}
                      onEmailClick={trackEmail}
                      onProfileClick={trackSellerProfileClick}
                    />

                    </div>
                  )}

{isMyListing && (
  <div className={getAnimationClass()} style={getStaggerDelay(7.5)}>
    <button
      onClick={() => setShowStatsModal(true)}
      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
    >
      <IoStatsChart size={22} />
      <span>Pogledaj statistiku oglasa</span>
    </button>
  </div>
)}
 
{/* Statistics Modal */}
<StatisticsModal
  isOpen={showStatsModal}
  onClose={() => setShowStatsModal(false)}
  itemId={productDetails?.id}
  itemName={productDetails?.translated_item?.name || productDetails?.name}
/>
                  {isMyListing && (
                    <div
                      className={`hidden lg:block ${getAnimationClass()}`}
                      style={getStaggerDelay(8)}
                    >
                      <AdsStatusChangeCards
                        productDetails={productDetails}
                        setProductDetails={setProductDetails}
                        status={status}
                        setStatus={setStatus}
                      />
                    </div>
                  )}

                  {isEditedByAdmin && (
                    <div className={getAnimationClass()} style={getStaggerDelay(9)}>
                      <AdEditedByAdmin admin_edit_reason={productDetails?.admin_edit_reason} />
                    </div>
                  )}
                  {isMyAdExpired && (
                    <div className={getAnimationClass()} style={getStaggerDelay(10)}>
                      <RenewAd item_id={productDetails?.id} setProductDetails={setProductDetails} currentLanguageId={CurrentLanguage?.id} setStatus={setStatus} />
                    </div>
                  )}
                  <div className={getAnimationClass()} style={getStaggerDelay(11)}>
                    <ProductLocation 
                      productDetails={productDetails}
                      onMapOpen={handleMapOpen}
                    />
                  </div>
                  {!isMyListing && !productDetails?.is_already_reported && (
                    <div className={getAnimationClass()} style={getStaggerDelay(12)}>
                      <AdsReportCard productDetails={productDetails} setProductDetails={setProductDetails} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
 
            {!isMyListing && (
              <div className={`mt-8 lg:mt-12 ${getAnimationClass()}`} style={getStaggerDelay(13)}>
                <SimilarProducts 
                  productDetails={productDetails} 
                  key={`similar-products-${CurrentLanguage?.id}`}
                  onItemClick={trackSimilarItemsClick}
                />
              </div>
            )}
            
            {/* DESKTOP MODAL */}
            {productDetails?.price_history && productDetails.price_history.length > 0 && (
                <DesktopPriceHistoryModal 
                  isOpen={showDesktopPriceHistory} 
                  onClose={() => setShowDesktopPriceHistory(false)} 
                  priceHistory={productDetails.price_history} 
                  currentPrice={productDetails.price} 
                />
            )}

            {/* MOBILNI DRAWER ZA HISTORIJU CIJENA */}
            {productDetails?.price_history && productDetails.price_history.length > 0 && (
                <>
                    <div className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 lg:hidden ${showMobilePriceHistory ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setShowMobilePriceHistory(false)} />
                    <div ref={priceHistoryDrawerRef} className={`fixed bottom-12 left-0 right-0 z-[61] bg-white rounded-t-3x transition-transform duration-300 ease-out transform lg:hidden flex flex-col max-h-[85vh] ${showMobilePriceHistory ? "translate-y-0" : "translate-y-full"}`}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h3 className="font-bold text-lg text-slate-800">Historija cijena</h3>
                            <button onClick={() => setShowMobilePriceHistory(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                                <MdClose className="text-xl text-slate-600" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 pb-8">
                            <PriceHistory priceHistory={productDetails.price_history} currentPrice={productDetails.price} />
                        </div>
                    </div>
                </>
            )}
 
            <OpenInAppDrawer isOpenInApp={isOpenInApp} setIsOpenInApp={setIsOpenInApp} />
            
            <ReusableAlertDialog
                open={isDeleteOpen}
                onCancel={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteAd}
                title="Jeste li sigurni?"
                description="Želite li obrisati ovaj oglas?"
                cancelText="Odustani"
                confirmText="Da, obriši"
                confirmDisabled={isDeleting}
            />
          </div>
          

          {/* ======================================================== */}
          {/* FIKSIRANE TRAKE NA DNU - IZVAN KONTEJNERA               */}
          {/* ======================================================== */}
          
          {/* TRAKA ZA KUPCA (JAVNI OGLAS) */}
          {!isMyListing && (
            <div 
              className={`lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-3 safe-area-bottom transition-all duration-300 ease-out ${
                hideBottomBar 
                  ? "translate-y-full opacity-0 pointer-events-none" 
                  : "translate-y-0 opacity-100"
              }`}
            >
              <div className="container flex items-center gap-3">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-medium">Cijena</p>
                      <p className="text-lg font-black text-primary truncate">
                      {Number(productDetails?.price) === 0
                        ? "Na upit"
                        : `${new Intl.NumberFormat("bs-BA").format(Number(productDetails?.price))} KM`}
                      </p>
                  </div>
                  {productDetails?.price_history && productDetails.price_history.length > 0 && (
                      <button onClick={handleOpenPriceHistory} className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
                          <MdHistory className="text-2xl" />
                      </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="w-11 h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all active:scale-95" 
                    onClick={() => {
                      trackPhoneReveal(); // ✅ TRACK
                      document.querySelector('[data-seller-card]')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <MdPhone className="text-2xl" />
                  </button>
                  <button 
                    className="w-11 h-11 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-slate-900/20" 
                    onClick={() => {
                      trackMessage(); // ✅ TRACK
                      document.querySelector('[data-chat-button]') 
                        ? document.querySelector('[data-chat-button]').click() 
                        : document.querySelector('[data-seller-card]')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <MdChat className="text-2xl" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TRAKA ZA PRODAVAČA (MOJ OGLAS) */}
          {isMyListing && (
            <div 
              className={`lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-3 safe-area-bottom transition-all duration-300 ease-out ${
                hideBottomBar 
                  ? "translate-y-full opacity-0 pointer-events-none" 
                  : "translate-y-0 opacity-100"
              }`}
            >
              <div className="container flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 font-medium">Status</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold truncate ${
                  productDetails?.status === "approved" ? "text-green-600" :
                  productDetails?.status === "pending" ? "text-yellow-600" :
                  productDetails?.status === "scheduled" ? "text-blue-600" :
                  productDetails?.status === "sold out" ? "text-blue-600" :
                  "text-slate-700"
                }`}
                >
                  {productDetails?.status === "approved" ? "Aktivan" :
                   productDetails?.status === "pending" ? "Na čekanju" :
                   productDetails?.status === "scheduled" ? `Zakazano za ${new Date(productDetails?.scheduled_at).toLocaleString('bs-BA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` :
                   productDetails?.status === "sold out" ? "Prodano" :
                   productDetails?.status}
                </p>
                    {/* Rezervisano badge - prikaži zasebno */}
                    {productDetails?.reservation_status === 'reserved' && (
                      <span className="text-xs font-bold text-amber-600">🔒</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditable && (
                    <>
                      {/* 1️⃣ STATUS - promjena statusa */}
                      <button
                        className="w-11 h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all active:scale-95"
                        aria-label="Promijeni status"
                        onClick={() => setShowStatusDrawer(true)}
                      >
                        <MdSyncAlt className="text-2xl" />
                      </button>

                      {/* 2️⃣ ISTAKNI OGLAS - raketa 🚀 */}
                      {IsShowFeaturedAd && (
                        <button
                          className="w-11 h-11 flex items-center justify-center bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl transition-all active:scale-95"
                          aria-label="Istakni oglas"
                          onClick={() => setShowFeaturedDrawer(true)}
                        >
                          <MdRocketLaunch className="text-2xl" />
                        </button>
                      )}

                      {/* 3️⃣ UREDI */}
                      <Link
                        href={`/edit-listing/${productDetails?.id}`}
                        className="w-11 h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all active:scale-95"
                        aria-label="Uredi"
                      >
                        <MdEdit className="text-2xl" />
                      </Link>
                    </>
                  )}

                  {/* OBRIŠI */}
                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="w-11 h-11 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
                    aria-label="Obriši"
                  >
                    <MdDelete className="text-2xl" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MOBILNI DRAWER ZA PROMJENU STATUSA */}
          {isMyListing && isEditable && (
            <>
              <div
                className={`fixed inset-0 bg-black/50 z-[101] transition-opacity duration-300 lg:hidden ${
                  showStatusDrawer
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setShowStatusDrawer(false)}
              />
              <div
                ref={statusDrawerRef}
                className={`fixed bottom-0 left-0 right-0 z-[102] bg-white rounded-t-3xl transition-transform duration-300 ease-out transform lg:hidden flex flex-col max-h-[85vh] ${
                  showStatusDrawer ? "translate-y-0" : "translate-y-full"
                }`}
              >
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-lg text-slate-800">
                    Promijeni status
                  </h3>
                  <button
                    onClick={() => setShowStatusDrawer(false)}
                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <MdClose className="text-xl text-slate-600" />
                  </button>
                </div>
                <div className="overflow-y-auto p-4 pb-8">
                  <AdsStatusChangeCards
                    productDetails={productDetails}
                    setProductDetails={setProductDetails}
                    status={status}
                    setStatus={setStatus}
                  />
                </div>
              </div>
            </>
          )}

          {/* MOBILNI DRAWER ZA ISTICANJE OGLASA */}
          {isMyListing && IsShowFeaturedAd && (
            <>
              <div
                className={`fixed inset-0 bg-black/50 z-[101] transition-opacity duration-300 lg:hidden ${
                  showFeaturedDrawer
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setShowFeaturedDrawer(false)}
              />
              <div
                ref={featuredDrawerRef}
                className={`fixed bottom-0 left-0 right-0 z-[102] bg-white rounded-t-3xl transition-transform duration-300 ease-out transform lg:hidden flex flex-col max-h-[85vh] ${
                  showFeaturedDrawer ? "translate-y-0" : "translate-y-full"
                }`}
              >
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-lg text-slate-800">
                    Istakni oglas
                  </h3>
                  <button
                    onClick={() => setShowFeaturedDrawer(false)}
                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <MdClose className="text-xl text-slate-600" />
                  </button>
                </div>
                <div className="overflow-y-auto p-4 pb-8">
                  <MakeFeaturedAd
                    item_id={productDetails?.id}
                    setProductDetails={setProductDetails}
                  />
                </div>
              </div>
            </>
          )}

        </>
      ) : (
        <div className="container mt-8 min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Oglas nije pronađen</h2>
            <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all">
              Nazad na početnu
            </a>
          </div>
        </div>
      )}
    </Layout>
  );
};

 
export default ProductDetails;