"use client";
 
import { useEffect, useState } from "react";
import SellerLsitings from "./SellerLsitings";
import SellerDetailCard from "./SellerDetailCard";
import { getSellerApi, gamificationApi } from "@/utils/api";
import SellerRating from "./SellerRating";
import SellerSkeleton from "./SellerSkeleton";
import NoData from "@/components/EmptyStates/NoData";
import Layout from "@/components/Layout/Layout";
import OpenInAppDrawer from "@/components/Common/OpenInAppDrawer";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import { useSelector } from "react-redux";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
 
const Seller = ({ id, searchParams }) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
 
  const [activeTab, setActiveTab] = useState("live");
  const [isNoUserFound, setIsNoUserFound] = useState(false);
 
  const [seller, setSeller] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [badges, setBadges] = useState([]);
  const [isSellerDataLoading, setIsSellerDataLoading] = useState(false);
  
  // Seller settings i membership status
  const [sellerSettings, setSellerSettings] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [isShop, setIsShop] = useState(false);
 
  const [isLoadMoreReview, setIsLoadMoreReview] = useState(false);
  const [reviewHasMore, setReviewHasMore] = useState(false);
  const [reviewCurrentPage, setReviewCurrentPage] = useState(1);
 
  const [isOpenInApp, setIsOpenInApp] = useState(false);
  const isShare = searchParams?.share === "true";
 
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768 && isShare) {
      setIsOpenInApp(true);
    }
  }, [isShare]);
 
  useEffect(() => {
    getSeller(reviewCurrentPage);
  }, [CurrentLanguage?.id, id]);
 
  useEffect(() => {
    if (seller?.id) {
      fetchSellerBadges();
    }
  }, [seller?.id]);
 
  const fetchSellerBadges = async () => {
    try {
      const res = await gamificationApi.getUserBadges({ user_id: seller?.id });
      if (!res.data.error) {
        setBadges(res.data.data.badges || []);
      }
    } catch (error) {
      console.error("Error fetching seller badges:", error);
    }
  };
 
  const getSeller = async (page) => {
    if (page === 1) {
      setIsSellerDataLoading(true);
    }
    try {
      const res = await getSellerApi.getSeller({ id: Number(id), page });
      
      if (res?.data.error && res?.data?.code === 103) {
        setIsNoUserFound(true);
      } else {
        const sellerRatings = res?.data?.data?.ratings;
        if (page === 1) {
          setRatings(sellerRatings);
        } else {
          setRatings((prev) => ({
            ...prev,
            data: [...(prev?.data || []), ...(sellerRatings?.data || [])],
          }));
        }
        
        const sellerData = res?.data?.data?.seller;
        setSeller(sellerData);
        
        // Dohvati seller settings iz API odgovora
        const settings = res?.data?.data?.seller_settings || sellerData?.seller_settings || null;
        setSellerSettings(settings);
        
        // Odredi Pro/Shop status
        // Prvo provjeri direktne flagove iz API-ja
        let proStatus = res?.data?.data?.is_pro || sellerData?.is_pro || false;
        let shopStatus = res?.data?.data?.is_shop || sellerData?.is_shop || false;
        
        // Ako ima membership info, koristi to
        const membership = res?.data?.data?.membership || sellerData?.membership;
        if (membership) {
          const tier = (membership.tier || membership.tier_name || membership.plan || '').toLowerCase();
          const status = (membership.status || '').toLowerCase();
          
          if (status === 'active') {
            if (tier.includes('shop') || tier.includes('business')) {
              proStatus = true;
              shopStatus = true;
            } else if (tier.includes('pro') || tier.includes('premium')) {
              proStatus = true;
              shopStatus = false;
            }
          }
        }
        
        setIsPro(proStatus);
        setIsShop(shopStatus);
        
        setReviewCurrentPage(sellerRatings?.current_page || 1);
        setReviewHasMore(sellerRatings?.current_page < sellerRatings?.last_page);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsSellerDataLoading(false);
      setIsLoadMoreReview(false);
    }
  };
 
  if (isNoUserFound) {
    return <NoData name="Nismo pronašli ovog prodavača." />;
  }
 
  const reviewCount = ratings?.total ?? ratings?.meta?.total ?? ratings?.data?.length ?? 0;
  const liveCount = seller?.live_ads_count ?? seller?.live_count ?? seller?.active_ads_count ?? 0;
  const soldCount = seller?.sold_ads_count ?? seller?.sold_count ?? seller?.completed_ads_count ?? 0;
 
  const tabs = [
    { key: "live", label: "Aktivni", count: liveCount },
    { key: "sold", label: "Prodano", count: soldCount },
    { key: "reviews", label: "Recenzije", count: reviewCount },
  ];
 
  return (
    <Layout>
      {isSellerDataLoading && !seller ? (
        <SellerSkeleton steps={activeTab} />
      ) : (
        <>
          <BreadCrumb title2={seller?.name} />
          <div className="container mx-auto mt-6 mb-10 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="col-span-12 lg:col-span-4">
                <SellerDetailCard 
                  seller={seller} 
                  ratings={ratings} 
                  badges={badges}
                  sellerSettings={sellerSettings}
                  isPro={isPro}
                  isShop={isShop}
                />
              </div>
 
              <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
                <div className="flex w-full justify-start">
                  <div className="grid grid-cols-3 w-full rounded-full border bg-slate-100/80 p-1 shadow-sm backdrop-blur">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveTab(tab.key)}
                          className={`
                            relative inline-flex items-center justify-center gap-1.5 w-full
                            rounded-full px-1.5 py-1 text-[12px] sm:px-4 sm:py-1.5 sm:text-sm
                            font-medium whitespace-nowrap transition-all duration-200 ease-out text-center
                            ${isActive
                              ? "bg-primary text-white shadow-md scale-[1.01]"
                              : "bg-transparent text-slate-700 hover:bg-white hover:text-slate-900"
                            }
                          `}
                        >
                          <span>{tab.label}</span>
                          <span className={`
                            inline-flex items-center justify-center h-4 min-w-[1.2rem] 
                            rounded-full text-[10px] font-semibold transition-all duration-200
                            ${isActive ? "bg-white/90 text-primary" : "bg-slate-200 text-slate-700"}
                          `}>
                            {tab.count}
                          </span>
                          {isActive && (
                            <span className="pointer-events-none absolute inset-x-2 -bottom-[2px] h-[3px] rounded-full bg-primary/40 blur-[3px]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
 
                <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-sm">
                  {activeTab === "live" && (
                    <SellerLsitings id={id} emptyLabel="Ovaj prodavač trenutno nema aktivnih oglasa." />
                  )}
                  {activeTab === "sold" && (
                    <SellerLsitings id={id} filterStatus="sold out" emptyLabel="Ovaj prodavač još nema prodanih oglasa." />
                  )}
                  {activeTab === "reviews" && (
                    <SellerRating
                      ratingsData={ratings}
                      seller={seller}
                      isLoadMoreReview={isLoadMoreReview}
                      reviewHasMore={reviewHasMore}
                      reviewCurrentPage={reviewCurrentPage}
                      getSeller={getSeller}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <OpenInAppDrawer isOpenInApp={isOpenInApp} setIsOpenInApp={setIsOpenInApp} />
    </Layout>
  );
};
 
export default Seller;