"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  allItemApi,
  getMyItemsApi,
  setItemTotalClickApi,
  deleteItemApi,
  getSellerApi, 
  gamificationApi
} from "@/utils/api";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/utils/toastBs";
import Link from "next/link";
import { cn } from "@/lib/utils";

import ProductSellerDetailCard from "@/components/PagesComponent/ProductDetail/ProductSellerDetailCard";


// Icons
import {
  MdClose,
  MdPhone,
  MdChat,
  MdEdit,
  MdDelete,
  MdSyncAlt,
  MdRocketLaunch
} from "@/components/Common/UnifiedIconPack";
import { IoStatsChart } from "@/components/Common/UnifiedIconPack";

// Components
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import ProductGallery from "./ProductGallery";
import ProductDetailCard from "./ProductDetailCard";
import SellerDetailCard from "./ProductSellerDetailCard";
import ProductFeature from "./ProductFeature";
import ProductDescription from "./ProductDescription";
import ProductQuestions from "./ProductQuestions";
import ProductLocation from "./ProductLocation";
import SellerOtherAds from "./SellerOtherAds";
import SimilarProducts from "./SimilarProducts";
import AdsReportCard from "./AdsReportCard";
import MyAdsListingDetailCard from "./MyAdsListingDetailCard";
import AdsStatusChangeCards from "./AdsStatusChangeCards";
import MakeFeaturedAd from "./MakeFeaturedAd";
import RenewAd from "./RenewAd";
import AdEditedByAdmin from "./AdEditedByAdmin";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import OpenInAppDrawer from "@/components/Common/OpenInAppDrawer";
import AdStatisticsSection from "@/components/PagesComponent/MyAds/AdStatisticsSection";
import GiveReview from "@/components/PagesComponent/Chat/GiveReview";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// Redux
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { setBreadcrumbPath } from "@/redux/reducer/breadCrumbSlice";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { setHideMobileBottomNav } from "@/redux/reducer/globalStateSlice";

// Utils & Hooks
import { getFilteredCustomFields, getYouTubeVideoId, truncate } from "@/utils";
import {
  useItemTracking,
  useContactTracking,
  useEngagementTracking,
} from "@/hooks/useItemTracking";
import { getFeaturedMeta } from "@/utils/featuredPlacement";
import { getScarcityState } from "@/utils/scarcity";
import { resolveRealEstateDisplayPricing } from "@/utils/realEstatePricing";

// ============================================
// HELPER COMPONENTS
// ============================================

const MobileStickyBar = ({ 
  isMyListing, 
  productDetails, 
  hide, 
  onPhoneClick, 
  onChatClick, 
  onDeleteClick, 
  onStatusClick,
  disableContactActions = false,
  contactBlockedMessage = "",
}) => {
  if (!productDetails) return null;
  const realEstatePricing = resolveRealEstateDisplayPricing(productDetails);
  const showRealEstatePerM2 = !isMyListing && realEstatePricing?.showPerM2;
  const formattedPerM2 = showRealEstatePerM2
    ? `${new Intl.NumberFormat("bs-BA", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
        Number(realEstatePricing?.perM2Value)
      )} KM / m²`
    : null;
  const formattedAreaM2 =
    showRealEstatePerM2 && Number(realEstatePricing?.areaM2) > 0
      ? new Intl.NumberFormat("bs-BA", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(Number(realEstatePricing.areaM2))
      : null;

  return (
    <div
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-3 safe-area-bottom z-[40] transition-all duration-300 ease-out",
        hide ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      )}
    >
      <div className="container flex items-center gap-3">
        {/* Lijeva strana (Info) */}
        <div className="flex-1 min-w-0">
          {isMyListing ? (
            <>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Status oglasa</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  productDetails.status === 'approved' ? "bg-green-500" : 
                  productDetails.status === 'pending' ? "bg-yellow-500" : "bg-slate-400"
                )} />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {productDetails.status === 'approved' ? "Aktivan" : 
                   productDetails.status === 'pending' ? "Na čekanju" : 
                   productDetails.status}
                </p>
              </div>
            </>
          ) : (
            <>
              {disableContactActions ? (
                <>
                  <p className="text-[10px] text-rose-500 dark:text-rose-300 font-bold uppercase tracking-wide">Status</p>
                  <p className="text-base font-black text-rose-600 dark:text-rose-300 truncate">Rasprodano</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Cijena</p>
                  <p className="text-lg font-black text-primary truncate">
                    {Number(productDetails.price) === 0 ? "Na upit" :
                     new Intl.NumberFormat("bs-BA", { minimumFractionDigits: 0 }).format(productDetails.price) + " KM"}
                  </p>
                  {formattedPerM2 ? (
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                      {formattedPerM2}
                      {formattedAreaM2 ? ` • ${formattedAreaM2} m²` : ""}
                    </p>
                  ) : Number(productDetails?.price_per_unit) > 0 ? (
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                      {new Intl.NumberFormat("bs-BA", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
                        Number(productDetails.price_per_unit)
                      )}{" "}
                      KM / kom
                    </p>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>

        {/* Desna strana (Akcije) */}
        <div className="flex items-center gap-2">
          {isMyListing ? (
            <>
              {/* UREDI */}
              <Link href={`/edit-listing/${productDetails.id}`} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl active:scale-95 transition-all">
                <MdEdit size={20} />
              </Link>
              
              {/* DELETE */}
              <button onClick={onDeleteClick} className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl active:scale-95 transition-all">
                <MdDelete size={20} />
              </button>

              {/* MORE ACTIONS */}
              <button onClick={onStatusClick} className="px-4 h-10 flex items-center justify-center bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 rounded-xl font-bold text-sm active:scale-95 shadow-lg shadow-slate-900/20 dark:shadow-none border border-transparent dark:border-slate-700">
                Opcije
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={onPhoneClick}
                disabled={disableContactActions}
                className="w-11 h-11 flex items-center justify-center bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30 rounded-xl active:scale-95 transition-all"
              >
                <MdPhone size={22} />
              </button>
              <button 
                onClick={onChatClick}
                disabled={disableContactActions}
                className="flex-1 px-5 h-11 flex items-center justify-center gap-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <MdChat size={20} />
                <span>Poruka</span>
              </button>
            </>
          )}
        </div>
      </div>
      {!isMyListing && disableContactActions ? (
        <p className="container mt-1 text-center text-[11px] text-rose-600 dark:text-rose-300">
          {contactBlockedMessage || "Oglas je rasprodan i kontakt je privremeno onemogućen."}
        </p>
      ) : null}
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="container mt-6 lg:mt-10">
    <Skeleton className="mb-6 h-4 w-32 rounded-md" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 h-40 rounded-2xl p-6 space-y-3">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-6 w-1/4 rounded-lg" />
        </div>
      </div>
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 h-64 rounded-2xl p-4">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 h-40 rounded-2xl p-4">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

const FeaturedAdTriggerCard = ({
  onOpen,
  compact = false,
  isFeatured = false,
  featuredMeta = null,
}) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
      compact ? "p-4" : "p-5"
    )}
  >
    <div
      className={cn(
        "flex gap-3",
        compact
          ? "items-center justify-between"
          : "flex-col sm:flex-row sm:items-center sm:justify-between"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <MdRocketLaunch size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
            Izdvajanje oglasa
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isFeatured
              ? `Aktivno: ${featuredMeta?.placementLabel || "Izdvojeno"}`
              : "Povećaj vidljivost na kategoriji i naslovnoj."}
          </p>
          {isFeatured ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {featuredMeta?.isUnlimited
                ? "Trajanje bez isteka."
                : `Preostalo do isteka: ${featuredMeta?.remainingLabel || "-"}.`}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
      >
        <MdRocketLaunch size={16} />
        {isFeatured ? "Uredi izdvajanje" : "Izdvoji oglas"}
      </button>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const ProductDetails = ({ slug }) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const currentUser = useSelector(userSignUpData);
  const dispatch = useDispatch();
  const pathName = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Flags
  const isShare = searchParams.get("share") === "true";
  const isMyListingPath = pathName?.startsWith("/my-listing");

  // State
  const [productDetails, setProductDetails] = useState(null);
  const [badges, setBadges] = useState([]);
  const [sellerSettings, setSellerSettings] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [videoData, setVideoData] = useState({ url: "", thumbnail: "" });
  const [directVideo, setDirectVideo] = useState(null);
  const [status, setStatus] = useState("");
  const latestProductFetchRef = useRef(0);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpenInApp, setIsOpenInApp] = useState(false);
  const [showProductReviewDialog, setShowProductReviewDialog] = useState(false);
  
  // Mobile Drawers
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);
  const [showFeaturedDrawer, setShowFeaturedDrawer] = useState(false);

  // Tracking Hooks
  const [itemId, setItemId] = useState(null);
  const { trackView, trackShare, trackFavorite, trackTimeOnPage } = useItemTracking(itemId, { autoTrackView: false });
  const { trackPhoneReveal, trackPhoneClick, trackWhatsApp, trackViber, trackMessage, trackEmail } = useContactTracking(itemId);
  const { trackGalleryOpen, trackImageView, trackImageZoom, trackVideoPlay, trackDescriptionExpand, trackMapOpen, trackSellerProfileClick, trackPriceHistoryView, trackSimilarItemsClick } = useEngagementTracking(itemId);

  // 1. Fetch Logic
  const fetchProductDetails = async () => {
    const fetchToken = latestProductFetchRef.current + 1;
    latestProductFetchRef.current = fetchToken;
    try {
      setIsLoading(true);
      setVideoData({ url: "", thumbnail: "" });
      setDirectVideo(null);
      setGalleryImages([]);

      // Use path-based check for API call since we don't have product data yet
      const apiCall = isMyListingPath ? getMyItemsApi.getMyItems : allItemApi.getItems;
      const res = await apiCall({ slug });
      let product = res?.data?.data?.data?.[0];

      if (!product && !isMyListingPath) {
        const soldRes = await allItemApi.getItems({ slug, status: "sold out" });
        product = soldRes?.data?.data?.data?.[0];
      }

      if (!product) throw new Error("Oglas nije pronađen");
      if (latestProductFetchRef.current !== fetchToken) return;

      // Setup Data
      setProductDetails(product);
      setItemId(product.id);
      setStatus(product.status);

      // Video Setup
      if (product.video_link) {
        const vidId = getYouTubeVideoId(product.video_link);
        setVideoData({
          url: product.video_link,
          thumbnail: vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : ""
        });
      }
      if (product.video) setDirectVideo(product.video);

      // Gallery Setup
      const extraImages = product.gallery_images?.map(img => img?.image) || [];
      setGalleryImages([product.image, ...extraImages]);

      // Check if current user is the owner (for view tracking)
      const productOwnerId = product?.user?.id || product?.user?.user_id || product?.user_id;
      const isProductOwner = currentUser?.id && String(currentUser.id) === String(productOwnerId);

      // Views - don't track if owner or accessed via my-listing
      if (!isMyListingPath && !isProductOwner) {
        await setItemTotalClickApi.setItemTotalClick({ item_id: product.id });
      }

      // Breadcrumb
      if (isMyListingPath) {
        dispatch(setBreadcrumbPath([{ name: "Moji oglasi", slug: "/my-ads" }, { name: truncate(product.name, 40) }]));
      }

    } catch (error) {
      console.error(error);
    } finally {
      if (latestProductFetchRef.current === fetchToken) {
        setIsLoading(false);
      }
    }
  };

  // Check if current user is the owner of this product
  const isOwner = Boolean(
    currentUser?.id && 
    productDetails?.user && 
    (String(currentUser.id) === String(productDetails.user.id) || 
     String(currentUser.id) === String(productDetails.user.user_id) ||
     String(currentUser.id) === String(productDetails.user_id))
  );
  
  // isMyListing = true if accessed via /my-listing OR if the logged-in user is the owner
  const isMyListing = isMyListingPath || isOwner;
  const itemReviews = Array.isArray(productDetails?.review)
    ? productDetails.review
    : productDetails?.review
    ? [productDetails.review]
    : [];
  const isSoldToCurrentUser = Boolean(
    currentUser?.id &&
      Number(productDetails?.sold_to) === Number(currentUser.id)
  );
  const hasCurrentUserReview = Boolean(
    currentUser?.id &&
      itemReviews.some((review) => Number(review?.buyer_id) === Number(currentUser.id))
  );
  const canLeaveProductReview = Boolean(
    !isMyListing &&
      productDetails?.status === "sold out" &&
      isSoldToCurrentUser &&
      !hasCurrentUserReview
  );

  // 2. Fetch Seller Info
  useEffect(() => {
    const sellerId = productDetails?.user?.id;
    if (sellerId) {
      gamificationApi.getUserBadges({ user_id: sellerId }).then(res => !res?.data?.error && setBadges(res?.data?.data?.badges || []));
      getSellerApi.getSeller({ id: sellerId }).then(res => !res?.data?.error && setSellerSettings(res.data.data?.seller_settings));
    }
  }, [productDetails?.user?.id]);

  // 3. Effects
  useEffect(() => { fetchProductDetails(); }, [slug, CurrentLanguage?.id]);

  useEffect(() => {
    dispatch(setHideMobileBottomNav(true));
    return () => {
      dispatch(setHideMobileBottomNav(false));
    };
  }, [dispatch]);
  useEffect(() => {
    if (!itemId || isMyListing || isOwner) return;

    const searchId = searchParams.get("search_id");
    const ref = searchParams.get("ref");
    const sourceDetail = searchParams.get("source_detail");
    const sourceMap = {
      search: "search",
      category: "category",
      featured: "featured",
      scarcity: "featured_section",
      similar: "similar",
      seller: "seller",
      favorites: "favorites",
      notification: "notification",
      chat: "chat",
      home: "direct",
    };
    const source = sourceMap[ref] || null;

    trackView({ searchId, source, source_detail: sourceDetail });
  }, [itemId, isMyListing, isOwner, trackView, searchParams]);
  useEffect(() => { if (window.innerWidth <= 768 && !isMyListing && !isOwner && isShare) setIsOpenInApp(true); }, [isMyListing, isOwner]);

  // Handlers
  const handleDeleteAd = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteItemApi.deleteItem({ item_id: productDetails?.id });
      if (!res?.data?.error) {
        toast.success("Oglas obrisan");
        router.push("/my-ads");
      } else toast.error(res?.data?.message);
    } catch { toast.error("Greška"); }
    finally { setIsDeleting(false); setIsDeleteOpen(false); }
  };

  // Helper consts
  const filteredFields = getFilteredCustomFields(productDetails?.all_translated_custom_fields, CurrentLanguage?.id);
  const featuredMeta = useMemo(() => getFeaturedMeta(productDetails), [productDetails]);
  const normalizedProductStatus = String(productDetails?.status || "").toLowerCase();
  const scarcityState = useMemo(() => getScarcityState(productDetails), [productDetails]);
  const isInventoryOutOfStock = Boolean(scarcityState?.isOutOfStock || normalizedProductStatus === "sold out");
  const canManageFeaturedAd = Boolean(
    isMyListing && ["approved", "featured"].includes(normalizedProductStatus)
  );
  const hideBottomBar = showStatsModal || showStatusDrawer || showFeaturedDrawer || isDeleteOpen || isOpenInApp;

  const openFeaturedModal = useCallback(() => {
    if (!canManageFeaturedAd || !productDetails?.id) {
      toast.error("Izdvajanje trenutno nije dostupno za ovaj oglas.");
      return;
    }

    setShowStatusDrawer(false);
    setShowFeaturedDrawer(true);
  }, [canManageFeaturedAd, productDetails?.id]);

  // Loading State
  if (isLoading) return <Layout><SkeletonLoader /></Layout>;

  // Not Found State
  if (!productDetails) return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Oglas nije pronađen</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Moguće je da je oglas obrisan ili je istekao.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all">
          Nazad na početnu
        </Link>
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* HEADER / BREADCRUMB */}
      <div className="container mt-4 lg:mt-8">
        {isMyListing ? <BreadCrumb /> : <BreadCrumb title2={truncate(productDetails?.name, 60)} />}
      </div>

      <div className="container mt-4 lg:mt-8 pb-24 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* --- LIJEVA KOLONA (Sadržaj) --- */}
          <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
            
            {/* 1. GALERIJA */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
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

            {/* 2. GLAVNA KARTICA (Naslov, Cijena, Akcije) */}
            <ProductDetailCard
              productDetails={productDetails}
              setProductDetails={setProductDetails}
              onFavoriteToggle={trackFavorite}
              onShareClick={trackShare}
              onPriceHistoryView={trackPriceHistoryView}
            />

            {!isMyListing && productDetails?.status === "sold out" && isSoldToCurrentUser && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Kupovina je završena.
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Podijelite iskustvo i pomozite drugim kupcima.
                    </p>
                  </div>
                  {canLeaveProductReview ? (
                    <button
                      type="button"
                      onClick={() => setShowProductReviewDialog(true)}
                      className="inline-flex items-center justify-center rounded-xl bg-[#0ab6af] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0a9f99]"
                    >
                      Ostavi dojam
                    </button>
                  ) : (
                    <span className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/25 dark:text-emerald-300">
                      Već ste ostavili dojam
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 3. OPCIJE PRODAVAČA (Samo za moje oglase) */}
            {canManageFeaturedAd && (
              <div className="hidden lg:block animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                <FeaturedAdTriggerCard
                  onOpen={openFeaturedModal}
                  isFeatured={Boolean(productDetails?.is_feature)}
                  featuredMeta={featuredMeta}
                />
              </div>
            )}

            {/* 4. KARAKTERISTIKE */}
            {filteredFields.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                <ProductFeature filteredFields={filteredFields} productDetails={productDetails} />
              </div>
            )}

            {/* 5. OPIS */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <ProductDescription productDetails={productDetails} onDescriptionExpand={trackDescriptionExpand} />
            </div>

            {/* 6. PITANJA */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
              <ProductQuestions productDetails={productDetails} isSeller={isMyListing} />
            </div>

            
              {/* LOKACIJA */}
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-300">
                <ProductLocation productDetails={productDetails} onMapOpen={trackMapOpen} />
              </div>
          </div>

          {/* --- DESNA KOLONA (Sidebar) --- */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
            <div className="lg:sticky lg:top-5 lg:self-start flex flex-col gap-6">
              
              {/* MY ADS SIDEBAR */}
              {isMyListing && (
                <div className="hidden lg:block animate-in fade-in slide-in-from-right-4 duration-500">
                  <MyAdsListingDetailCard
                    productDetails={productDetails}
                    onMakeFeatured={openFeaturedModal}
                  />
                </div>
              )}

              {/* SELLER INFO (Za kupce) */}
              {!isMyListing && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-100" data-seller-card>
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
                    disableContactActions={isInventoryOutOfStock}
                    contactBlockedMessage="Oglas je rasprodan. Kontakt opcije su trenutno onemogućene dok prodavač ne dopuni zalihu."
                  />
                </div>
              )}

              {/* STATISTIKA (Za prodavače) */}
              {/* {isMyListing && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-150">
                  <button
                    onClick={() => setShowStatsModal(true)}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                  >
                    <IoStatsChart size={24} className="text-white/80" />
                    <span>Statistika oglasa</span>
                  </button>
                </div>
              )} */}

              {/* STATUS CHANGE (Desktop) */}
              {isMyListing && (
                <div className="hidden lg:block animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
                  <AdsStatusChangeCards
                    productDetails={productDetails}
                    setProductDetails={setProductDetails}
                    status={status}
                    setStatus={setStatus}
                  />
                </div>
              )}

              {/* PRIJAVA OGLASA */}
              {!isMyListing && !productDetails?.is_already_reported && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-400">
                  <AdsReportCard productDetails={productDetails} setProductDetails={setProductDetails} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OSTALI OGLASI ISTOG PRODAVAČA */}
        {!isMyListing && (
          <div className="mt-12 lg:mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <SellerOtherAds
              productDetails={productDetails}
              onItemClick={trackSimilarItemsClick}
            />
          </div>
        )}

        {/* SLIČNI OGLASI */}
        {!isMyListing && (
          <div className="mt-10 lg:mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <SimilarProducts productDetails={productDetails} onItemClick={trackSimilarItemsClick} />
          </div>
        )}
      </div>

      {/* --- MODALS & DRAWERS --- */}

      {/* Statistika Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowStatsModal(false)} />
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <IoStatsChart className="text-blue-500" /> Statistika
              </h3>
              <button onClick={() => setShowStatsModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
                <MdClose size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex-1 bg-white dark:bg-slate-900">
              <AdStatisticsSection itemId={productDetails.id} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Status Drawer */}
      {isMyListing && (
        <>
          <div className={cn("fixed inset-0 bg-black/60 z-[100] transition-opacity", showStatusDrawer ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")} onClick={() => setShowStatusDrawer(false)} />
          <div className={cn("fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-slate-900 rounded-t-3xl transition-transform duration-300 flex flex-col max-h-[85vh]", showStatusDrawer ? "translate-y-0" : "translate-y-full")}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Upravljanje oglasom</h3>
              <button onClick={() => setShowStatusDrawer(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"><MdClose /></button>
            </div>
            <div className="p-5 overflow-y-auto pb-8">
              <AdsStatusChangeCards productDetails={productDetails} setProductDetails={setProductDetails} status={status} setStatus={setStatus} />
              {canManageFeaturedAd && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <FeaturedAdTriggerCard
                    onOpen={openFeaturedModal}
                    compact
                    isFeatured={Boolean(productDetails?.is_feature)}
                    featuredMeta={featuredMeta}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Featured Modal (triggered from MyAdsListingDetailCard) */}
      {isMyListing && canManageFeaturedAd && (
        <MakeFeaturedAd
          item_id={productDetails?.id}
          setProductDetails={setProductDetails}
          open={showFeaturedDrawer}
          onOpenChange={setShowFeaturedDrawer}
          initialPlacement={featuredMeta?.placement || "category_home"}
          initialDuration={featuredMeta?.durationDays || 30}
          isAlreadyFeatured={Boolean(productDetails?.is_feature)}
          hideTrigger
        />
      )}

      {/* Delete Confirmation */}
      <ReusableAlertDialog
        open={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteAd}
        title="Obriši oglas?"
        description="Ova akcija je nepovratna. Da li ste sigurni?"
        confirmText={isDeleting ? "Brisanje..." : "Da, obriši"}
        confirmDisabled={isDeleting}
      />

      {/* In-App Browser Drawer */}
      <OpenInAppDrawer isOpenInApp={isOpenInApp} setIsOpenInApp={setIsOpenInApp} />

      <Dialog
        open={showProductReviewDialog && canLeaveProductReview}
        onOpenChange={(open) => setShowProductReviewDialog(open)}
      >
        <DialogContent className="w-[min(92vw,760px)] max-w-[760px] border-none bg-transparent p-0 shadow-none sm:max-w-[760px] [&>button]:hidden">
          <GiveReview
            itemId={productDetails?.id}
            sellerId={productDetails?.user?.id || productDetails?.user_id}
            onClose={() => setShowProductReviewDialog(false)}
            onSuccess={(newReview) => {
              setProductDetails((prev) => {
                const currentReviews = Array.isArray(prev?.review)
                  ? prev.review
                  : prev?.review
                  ? [prev.review]
                  : [];
                const cleaned = currentReviews.filter(
                  (review) => Number(review?.id) !== Number(newReview?.id)
                );
                return { ...prev, review: [newReview, ...cleaned] };
              });
              setShowProductReviewDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* MOBILE STICKY BAR */}
      <MobileStickyBar 
        isMyListing={isMyListing}
        productDetails={productDetails}
        hide={hideBottomBar}
        onPhoneClick={() => { trackPhoneReveal(); document.querySelector("[data-seller-card]")?.scrollIntoView({ behavior: "smooth" }); }}
        onChatClick={() => { trackMessage(); document.querySelector("[data-chat-button]") ? document.querySelector("[data-chat-button]").click() : document.querySelector("[data-seller-card]")?.scrollIntoView({ behavior: "smooth" }); }}
        onDeleteClick={() => setIsDeleteOpen(true)}
        onStatusClick={() => setShowStatusDrawer(true)}
        disableContactActions={isInventoryOutOfStock}
        contactBlockedMessage="Oglas je rasprodan. Kontakt opcije su trenutno onemogućene dok prodavač ne dopuni zalihu."
      />

    </Layout>
  );
};

export default ProductDetails;
