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
  t,
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

// ============================================
// SKELETON LOADING COMPONENT
// ============================================
const ProductDetailsSkeleton = () => {
  return (
    <div className="container mt-8">
      {/* Breadcrumb Skeleton */}
      <div className="flex gap-2 mb-6 animate-pulse">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="h-4 w-40 bg-gray-200 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 mt-6">
        {/* Left Column */}
        <div className="col-span-1 lg:col-span-8">
          <div className="flex flex-col gap-7">
            {/* Gallery Skeleton */}
            <div className="bg-white rounded-lg border overflow-hidden animate-pulse">
              <div className="w-full h-[400px] bg-gray-200" />
              <div className="p-4">
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            </div>

            {/* Features Skeleton */}
            <div className="bg-white p-6 rounded-lg border animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded" />
                    <div className="flex-1">
                      <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="bg-white p-6 rounded-lg border animate-pulse">
              <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${100 - i * 10}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col col-span-1 lg:col-span-4 gap-7">
          {/* Price Card Skeleton */}
          <div className="bg-white p-6 rounded-lg border animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
            <div className="h-6 w-20 bg-gray-200 rounded mb-6" />
            <div className="space-y-3">
              <div className="h-12 w-full bg-gray-200 rounded" />
              <div className="h-12 w-full bg-gray-200 rounded" />
            </div>
          </div>

          {/* Seller Card Skeleton */}
          <div className="bg-white p-6 rounded-lg border animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-full bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-200 rounded" />
            </div>
          </div>

          {/* Location Card Skeleton */}
          <div className="bg-white p-6 rounded-lg border animate-pulse">
            <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
            <div className="h-48 w-full bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
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
  const [videoData, setVideoData] = useState({
    url: "",
    thumbnail: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenInApp, setIsOpenInApp] = useState(false);

  // Animation states
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

  // Trigger animations after data loads
  useEffect(() => {
    if (productDetails && !isLoading) {
      // Small delay for better visual effect
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [productDetails, isLoading]);

  const fetchMyListingDetails = async (slug) => {
    const response = await getMyItemsApi.getMyItems({ slug });
    const product = response?.data?.data?.data?.[0];
    if (!product) throw new Error("My listing product not found");
    setProductDetails(product);
    const videoLink = product?.video_link;
    if (videoLink) {
      const videoId = getYouTubeVideoId(videoLink);
      const thumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : "";
      setVideoData((prev) => ({ ...prev, url: videoLink, thumbnail }));
    }

    const galleryImages =
      product?.gallery_images?.map((image) => image?.image) || [];
    setGalleryImages([product?.image, ...galleryImages]);
    setStatus(product?.status);
    dispatch(
      setBreadcrumbPath([
        {
          name: t("myAds"),
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
        console.error("Invalid item_id for incrementViews");
        return;
      }
      const res = await setItemTotalClickApi.setItemTotalClick({ item_id });
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const fetchPublicListingDetails = async (slug) => {
    const response = await allItemApi.getItems({ slug });
    const product = response?.data?.data?.data?.[0];

    if (!product) throw new Error("Public listing product not found");
    setProductDetails(product);
    const videoLink = product?.video_link;
    if (videoLink) {
      setVideoData((prev) => ({ ...prev, url: videoLink }));
      const videoId = getYouTubeVideoId(videoLink);
      const thumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : "";
      setVideoData((prev) => ({ ...prev, thumbnail }));
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
      if (isMyListing) {
        await fetchMyListingDetails(slug);
      } else {
        await fetchPublicListingDetails(slug);
      }
    } catch (error) {
      console.error("Failed to fetch product details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFields = getFilteredCustomFields(
    productDetails?.all_translated_custom_fields,
    CurrentLanguage?.id
  );

  // Animation classes
  const getAnimationClass = (delay = 0) => {
    return `transition-all duration-700 ease-out ${
      isVisible
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-8"
    }`;
  };

  const getStaggerDelay = (index) => {
    return { transitionDelay: `${index * 100}ms` };
  };

  return (
    <Layout>
      {isLoading ? (
        <ProductDetailsSkeleton />
      ) : productDetails ? (
        <>
          {/* Breadcrumb with fade animation */}
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

          <div className="container mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 mt-6">
              {/* LEFT COLUMN - Main Content */}
              <div className="col-span-1 lg:col-span-8">
                <div className="flex flex-col gap-7">
                  {/* Gallery with animation */}
                  <div
                    className={getAnimationClass()}
                    style={getStaggerDelay(1)}
                  >
                    <ProductGallery
                      galleryImages={galleryImages}
                      videoData={videoData}
                    />
                  </div>

                  {/* Featured Ad Card */}
                  {IsShowFeaturedAd && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(2)}
                    >
                      <MakeFeaturedAd
                        item_id={productDetails?.id}
                        setProductDetails={setProductDetails}
                      />
                    </div>
                  )}

                  {/* Product Features */}
                  {filteredFields.length > 0 && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(3)}
                    >
                      <ProductFeature 
                      filteredFields={filteredFields}
                      productDetails={productDetails}
                    />
                    </div>
                  )}

                  {/* Product Description */}
                  <div
                    className={getAnimationClass()}
                    style={getStaggerDelay(4)}
                  >
                    <ProductDescription productDetails={productDetails} />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Sticky Sidebar */}
              <div className="flex flex-col col-span-1 lg:col-span-4 gap-7">
                {/* Sticky wrapper for desktop */}
                <div className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-7">
                  {/* Product Detail Card */}
                  <div
                    className={getAnimationClass()}
                    style={getStaggerDelay(5)}
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

                  {/* Seller Detail Card */}
                  {!isMyListing && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(6)}
                    >
                      <SellerDetailCard
                        productDetails={productDetails}
                        setProductDetails={setProductDetails}
                      />
                    </div>
                  )}

                  {/* Status Change Cards */}
                  {isMyListing && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(7)}
                    >
                      <AdsStatusChangeCards
                        productDetails={productDetails}
                        setProductDetails={setProductDetails}
                        status={status}
                        setStatus={setStatus}
                      />
                    </div>
                  )}

                  {/* Admin Edit Notice */}
                  {isEditedByAdmin && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(8)}
                    >
                      <AdEditedByAdmin
                        admin_edit_reason={productDetails?.admin_edit_reason}
                      />
                    </div>
                  )}

                  {/* Renew Ad */}
                  {isMyAdExpired && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(9)}
                    >
                      <RenewAd
                        item_id={productDetails?.id}
                        setProductDetails={setProductDetails}
                        currentLanguageId={CurrentLanguage?.id}
                        setStatus={setStatus}
                      />
                    </div>
                  )}

                  {/* Product Location */}
                  <div
                    className={getAnimationClass()}
                    style={getStaggerDelay(10)}
                  >
                    <ProductLocation productDetails={productDetails} />
                  </div>

                  {/* Report Card */}
                  {!isMyListing && !productDetails?.is_already_reported && (
                    <div
                      className={getAnimationClass()}
                      style={getStaggerDelay(11)}
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

            {/* Similar Products */}
            {!isMyListing && (
              <div
                className={getAnimationClass()}
                style={getStaggerDelay(12)}
              >
                <SimilarProducts
                  productDetails={productDetails}
                  key={`similar-products-${CurrentLanguage?.id}`}
                />
              </div>
            )}

            <OpenInAppDrawer
              isOpenInApp={isOpenInApp}
              setIsOpenInApp={setIsOpenInApp}
            />
          </div>
        </>
      ) : (
        <div className="container mt-8">
          <NoData name={t("oneAdvertisement")} />
        </div>
      )}
    </Layout>
  );
};

export default ProductDetails;