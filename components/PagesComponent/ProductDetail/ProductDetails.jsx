"use client";
import { useEffect, useState } from "react";
import { allItemApi, getMyItemsApi, setItemTotalClickApi } from "@/utils/api";
import ProductFeature from "./ProductFeature";
import ProductDescription from "./ProductDescription";
import ProductDetailCard from "./ProductDetailCard";
import SellerDetailCard from "./SellerDetailCard";
import ProductLocation from "./ProductLocation";
import AdsReportCard from "./AdsReportCard";
import SimilarProducts from "./SimilarProducts";
import MyAdsListingDetailCard from "./MyAdsListingDetailCard";
import AdsStatusChangeCards from "./AdsStatusChangeCards";
import { usePathname, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout/Layout";
import ProductGallery from "./ProductGallery";
import {
  getFilteredCustomFields,
  getYouTubeVideoId,
  truncate,
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
import PriceHistory from "../../PagesComponent/ProductDetail/PriceHistory";

// ============================================
// SKELETON LOADING COMPONENT - Poboljšana verzija
// ============================================
const ProductDetailsSkeleton = () => {
  return (
    <div className="container mt-4 lg:mt-8">
      {/* Breadcrumb Skeleton */}
      <div className="flex gap-2 mb-4 lg:mb-6 animate-pulse">
        <div className="h-4 w-16 bg-slate-200 rounded-md" />
        <div className="h-4 w-3 bg-slate-200 rounded-md" />
        <div className="h-4 w-32 bg-slate-200 rounded-md" />
      </div>

      {/* Mobile: Naslov iznad galerije */}
      <div className="lg:hidden mb-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
          <div className="h-5 w-24 bg-slate-200 rounded-md mb-3" />
          <div className="h-7 w-4/5 bg-slate-200 rounded-md mb-2" />
          <div className="h-6 w-2/5 bg-slate-200 rounded-md mb-4" />
          <div className="h-9 w-36 bg-slate-200 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7">
        {/* Lijeva kolona */}
        <div className="col-span-1 lg:col-span-8">
          <div className="flex flex-col gap-5 lg:gap-7">
            {/* Galerija Skeleton */}
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

            {/* Karakteristike Skeleton */}
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

            {/* Opis Skeleton */}
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

        {/* Desna kolona */}
        <div className="flex flex-col col-span-1 lg:col-span-4 gap-5 lg:gap-7">
          {/* Desktop: Cijena kartica Skeleton */}
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

          {/* Prodavač Skeleton */}
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

          {/* Lokacija Skeleton */}
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

  // Formatiranje cijene
  const formatPrice = (price) => {
    if (!price || price === 0) return "Besplatno";
    return new Intl.NumberFormat('bs-BA', {
      style: 'currency',
      currency: 'BAM',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price).replace('BAM', 'KM');
  };

  // Formatiranje plate za poslove
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
        {/* Kategorija Badge */}
        {productDetails?.category?.name && (
          <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            {productDetails?.category?.name}
          </span>
        )}

        {/* Naslov proizvoda */}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-2 break-words">
          {productName}
        </h1>

        {/* Cijena */}
        <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight mb-3">
          {isJobCategory
            ? formatSalary(productDetails?.min_salary, productDetails?.max_salary)
            : formatPrice(productDetails?.price)}
        </div>

        {/* Featured badge */}
        {productDetails?.is_feature === 1 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-sm">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Istaknuti oglas
          </span>
        )}

        {/* Status za moje oglase */}
        {isMyListing && productDetails?.status && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                productDetails.status === 'approved' ? 'bg-green-100 text-green-700' :
                productDetails.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                productDetails.status === 'rejected' ? 'bg-red-100 text-red-700' :
                productDetails.status === 'expired' ? 'bg-slate-100 text-slate-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {productDetails.status === 'approved' ? 'Aktivan' :
                 productDetails.status === 'review' ? 'Na pregledu' :
                 productDetails.status === 'rejected' ? 'Odbijen' :
                 productDetails.status === 'expired' ? 'Istekao' :
                 productDetails.status}
              </span>
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
  const searchParams = useSearchParams();
  const isShare = searchParams.get("share") == "true" ? true : false;
  const isMyListing = pathName?.startsWith("/my-listing") ? true : false;
  const [productDetails, setProductDetails] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [status, setStatus] = useState("");
  
  // YouTube video podaci
  const [videoData, setVideoData] = useState({
    url: "",
    thumbnail: "",
  });
  
  // Direktni video (uploadovan)
  const [directVideo, setDirectVideo] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenInApp, setIsOpenInApp] = useState(false);

  // Stanja za animacije
  const [isVisible, setIsVisible] = useState(false);

  const IsShowFeaturedAd =
    isMyListing &&
    !productDetails?.is_feature &&
    productDetails?.status === "approved";

  const isMyAdExpired = isMyListing && productDetails?.status === "expired";
  const isEditedByAdmin =
    isMyListing && productDetails?.is_edited_by_admin === 1;

  useEffect(() => {
    fetchProductDetails();
  }, [CurrentLanguage?.id]);

  useEffect(() => {
    if (window.innerWidth <= 768 && !isMyListing && isShare) {
      setIsOpenInApp(true);
    }
  }, []);

  // Pokretanje animacija nakon učitavanja podataka
  useEffect(() => {
    if (productDetails && !isLoading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [productDetails, isLoading]);

  const fetchMyListingDetails = async (slug) => {
    const response = await getMyItemsApi.getMyItems({ slug });
    const product = response?.data?.data?.data?.[0];
    if (!product) throw new Error("Oglas nije pronađen");
    setProductDetails(product);
    
    // YouTube video link
    const videoLink = product?.video_link;
    if (videoLink) {
      const videoId = getYouTubeVideoId(videoLink);
      const thumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : "";
      setVideoData((prev) => ({ ...prev, url: videoLink, thumbnail }));
    }

    // Direktni video (uploadovan)
    if (product?.video) {
      setDirectVideo(product.video);
    } else {
      setDirectVideo(null);
    }

    const galleryImages =
      product?.gallery_images?.map((image) => image?.image) || [];
    setGalleryImages([product?.image, ...galleryImages]);
    setStatus(product?.status);
    dispatch(
      setBreadcrumbPath([
        {
          name: "Moji oglasi",
          slug: "/my-ads",
        },
        {
          name: truncate(product?.translated_item?.name || product?.name, 80),
        },
      ])
    );
  };

  const incrementViews = async (item_id) => {
    try {
      if (!item_id) {
        console.error("Nevažeći item_id za incrementViews");
        return;
      }
      const res = await setItemTotalClickApi.setItemTotalClick({ item_id });
    } catch (error) {
      console.error("Greška pri povećanju pregleda:", error);
    }
  };

  const fetchPublicListingDetails = async (slug) => {
    const response = await allItemApi.getItems({ slug });
    const product = response?.data?.data?.data?.[0];

    if (!product) throw new Error("Oglas nije pronađen");
    setProductDetails(product);
    
    // YouTube video link
    const videoLink = product?.video_link;
    if (videoLink) {
      setVideoData((prev) => ({ ...prev, url: videoLink }));
      const videoId = getYouTubeVideoId(videoLink);
      const thumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : "";
      setVideoData((prev) => ({ ...prev, thumbnail }));
    }

    // Direktni video (uploadovan)
    if (product?.video) {
      setDirectVideo(product.video);
    } else {
      setDirectVideo(null);
    }

    const galleryImages =
      product?.gallery_images?.map((image) => image?.image) || [];
    setGalleryImages([product?.image, ...galleryImages]);
    await incrementViews(product?.id);
  };

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      setIsVisible(false);
      // Resetuj video stanja
      setVideoData({ url: "", thumbnail: "" });
      setDirectVideo(null);
      
      if (isMyListing) {
        await fetchMyListingDetails(slug);
      } else {
        await fetchPublicListingDetails(slug);
      }
    } catch (error) {
      console.error("Greška pri dohvatanju detalja oglasa:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFields = getFilteredCustomFields(
    productDetails?.all_translated_custom_fields,
    CurrentLanguage?.id
  );

  // Klase za animacije
  const getAnimationClass = (delay = 0) => {
    return `transition-all duration-500 ease-out ${
      isVisible
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-6"
    }`;
  };

  const getStaggerDelay = (index) => {
    return { transitionDelay: `${index * 80}ms` };
  };

  return (
    <Layout>
      {isLoading ? (
        <ProductDetailsSkeleton />
      ) : productDetails ? (
        <>
          {/* Breadcrumb sa animacijom */}
          <div
            className={getAnimationClass()}
            style={getStaggerDelay(0)}
          >
            {isMyListing ? (
              <BreadCrumb />
            ) : (
              <BreadCrumb
                title2={truncate(
                  productDetails?.translated_item?.name || productDetails?.name,
                  80
                )}
              />
            )}
          </div>

          <div className="container mt-4 lg:mt-8 pb-8 lg:pb-12">
            
            {/* MOBILNI HEADER - Naslov i cijena IZNAD galerije */}
            <div
              className={getAnimationClass()}
              style={getStaggerDelay(1)}
            >
              <MobileProductHeader 
                productDetails={productDetails} 
                isMyListing={isMyListing}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7">
              {/* LIJEVA KOLONA - Glavni sadržaj */}
              <div className="col-span-1 lg:col-span-8">
                <div className="flex flex-col gap-5 lg:gap-7">
                  
                  {/* Galerija sa animacijom */}
                  <div
                    className={getAnimationClass()}
                    style={getStaggerDelay(2)}
                  >
                    <ProductGallery
                      galleryImages={galleryImages}
                      videoData={videoData}
                      directVideo={directVideo}
                    />
                  </div>

                  {/* Kartica za istaknuti oglas */}
                  {IsShowFeaturedAd && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(3)}
                    >
                      <MakeFeaturedAd
                        item_id={productDetails?.id}
                        setProductDetails={setProductDetails}
                      />
                    </div>
                  )}

                  {/* Karakteristike proizvoda */}
                  {filteredFields.length > 0 && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(4)}
                    >
                      <ProductFeature 
                        filteredFields={filteredFields}
                        productDetails={productDetails}
                      />
                    </div>
                  )}

                  {/* Opis proizvoda */}
                  <div
                    className={getAnimationClass()}
                    style={getStaggerDelay(5)}
                  >
                    <ProductDescription productDetails={productDetails} />
                  </div>
                </div>
              </div>

              {/* DESNA KOLONA - Sticky bočna traka */}
              <div className="flex flex-col col-span-1 lg:col-span-4 gap-5 lg:gap-7">
                {/* Sticky omotač za desktop */}
                <div className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-5 lg:gap-7">
                  
                  {/* Kartica detalja proizvoda - SAMO NA DESKTOPU */}
                  <div
                    className={`hidden lg:block ${getAnimationClass()}`}
                    style={getStaggerDelay(6)}
                  >
                    {isMyListing ? (
                      <MyAdsListingDetailCard productDetails={productDetails} />
                    ) : (
                      <ProductDetailCard
                        productDetails={productDetails}
                        setProductDetails={setProductDetails}
                      />
                    )}
                  </div>

                  {/* HISTORIJA CIJENA */}
                  {productDetails?.price_history && productDetails.price_history.length > 0 && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(6.5)}
                    >
                      <PriceHistory 
                        priceHistory={productDetails.price_history} 
                        currentPrice={productDetails.price}
                      />
                    </div>
                  )}

                  {/* Kartica prodavača */}
                  {!isMyListing && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(7)}
                    >
                      <SellerDetailCard
                        productDetails={productDetails}
                        setProductDetails={setProductDetails}
                      />
                    </div>
                  )}

                  {/* Kartice za promjenu statusa */}
                  {isMyListing && (
                    <div
                      className={getAnimationClass()}
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

                  {/* Obavijest o admin izmjeni */}
                  {isEditedByAdmin && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(9)}
                    >
                      <AdEditedByAdmin
                        admin_edit_reason={productDetails?.admin_edit_reason}
                      />
                    </div>
                  )}

                  {/* Obnovi oglas */}
                  {isMyAdExpired && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(10)}
                    >
                      <RenewAd
                        item_id={productDetails?.id}
                        setProductDetails={setProductDetails}
                        currentLanguageId={CurrentLanguage?.id}
                        setStatus={setStatus}
                      />
                    </div>
                  )}

                  {/* Lokacija proizvoda */}
                  <div
                    className={getAnimationClass()}
                    style={getStaggerDelay(11)}
                  >
                    <ProductLocation productDetails={productDetails} />
                  </div>

                  {/* Kartica za prijavu */}
                  {!isMyListing && !productDetails?.is_already_reported && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(12)}
                    >
                      <AdsReportCard
                        productDetails={productDetails}
                        setProductDetails={setProductDetails}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Slični proizvodi */}
            {!isMyListing && (
              <div
                className={`mt-8 lg:mt-12 ${getAnimationClass()}`}
                style={getStaggerDelay(13)}
              >
                <SimilarProducts
                  productDetails={productDetails}
                  key={`similar-products-${CurrentLanguage?.id}`}
                />
              </div>
            )}

            {/* Fiksirana akciona traka za mobitel */}
            {!isMyListing && (
              <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-3 safe-area-bottom">
                <div className="container flex items-center gap-3">
                  {/* Cijena - lijevo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Cijena</p>
                    <p className="text-lg font-black text-primary truncate">
                      {productDetails?.price === 0 
                        ? "Besplatno" 
                        : `${new Intl.NumberFormat('bs-BA').format(productDetails?.price)} KM`}
                    </p>
                  </div>
                  
                  {/* Dugmad - desno */}
                  <div className="flex gap-2">
                    <button 
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95 text-sm"
                      onClick={() => {
                        const phoneSection = document.querySelector('[data-seller-card]');
                        if (phoneSection) {
                          phoneSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      Pozovi
                    </button>
                    <button 
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-95 text-sm shadow-lg"
                      onClick={() => {
                        const chatButton = document.querySelector('[data-chat-button]');
                        if (chatButton) {
                          chatButton.click();
                        } else {
                          const sellerSection = document.querySelector('[data-seller-card]');
                          if (sellerSection) {
                            sellerSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                    >
                      Pošalji poruku
                    </button>
                  </div>
                </div>
              </div>
            )}

            <OpenInAppDrawer
              isOpenInApp={isOpenInApp}
              setIsOpenInApp={setIsOpenInApp}
            />
          </div>
        </>
      ) : (
        <div className="container mt-8 min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Oglas nije pronađen</h2>
            <p className="text-slate-500 mb-6">Ovaj oglas više nije dostupan ili je uklonjen.</p>
            <a 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Nazad na početnu
            </a>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProductDetails;
