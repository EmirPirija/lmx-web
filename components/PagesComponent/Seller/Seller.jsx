"use client";
 
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { cn } from "@/lib/utils";

import {
  Package,
  ShoppingBag,
  Star,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
 
const Seller = ({ id, searchParams }) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
 
  const [activeTab, setActiveTab] = useState("live");
  const [isNoUserFound, setIsNoUserFound] = useState(false);
 
  const [seller, setSeller] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [badges, setBadges] = useState([]);
  const [isSellerDataLoading, setIsSellerDataLoading] = useState(false);
  
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
        
        const settings = res?.data?.data?.seller_settings || sellerData?.seller_settings || null;
        setSellerSettings(settings);
        
        let proStatus = res?.data?.data?.is_pro || sellerData?.is_pro || false;
        let shopStatus = res?.data?.data?.is_shop || sellerData?.is_shop || false;
        
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
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl shadow-red-500/20">
              <AlertCircle size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Prodavač nije pronađen</h2>
            <p className="text-slate-500 dark:text-slate-400">Ovaj korisnik ne postoji ili je obrisan.</p>
          </motion.div>
        </div>
      </Layout>
    );
  }
 
  const reviewCount = ratings?.total ?? ratings?.meta?.total ?? ratings?.data?.length ?? 0;
  const liveCount = seller?.live_ads_count ?? seller?.live_count ?? seller?.active_ads_count ?? 0;
  const soldCount = seller?.sold_ads_count ?? seller?.sold_count ?? seller?.completed_ads_count ?? 0;
 
  const tabs = [
    { key: "live", label: "Aktivni oglasi", icon: Package, count: liveCount, color: "from-blue-500 to-indigo-600" },
    { key: "sold", label: "Prodano", icon: ShoppingBag, count: soldCount, color: "from-green-500 to-emerald-600" },
    { key: "reviews", label: "Recenzije", icon: Star, count: reviewCount, color: "from-amber-500 to-orange-600" },
  ];
 
  return (
    <Layout>
      {isSellerDataLoading && !seller ? (
        <SellerSkeleton steps={activeTab} />
      ) : (
        <>
          <BreadCrumb title2={seller?.name} />
          
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="container mx-auto px-4 py-8 space-y-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Seller Card - Left Side */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="col-span-12 lg:col-span-4 lg:sticky lg:top-6 h-fit"
                >
                  <SellerDetailCard 
                    seller={seller} 
                    ratings={ratings} 
                    badges={badges}
                    sellerSettings={sellerSettings}
                    isPro={isPro}
                    isShop={isShop}
                  />
                </motion.div>
 
                {/* Main Content - Right Side */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="col-span-12 lg:col-span-8 space-y-6"
                >
                  {/* Tabs */}
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.key;
                      return (
                        <motion.button
                          key={tab.key}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setActiveTab(tab.key)}
                          className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all duration-300",
                            isActive
                              ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-primary/50"
                          )}
                        >
                          <Icon size={18} />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-bold",
                            isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                          )}>
                            {tab.count}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
 
                  {/* Tab Content */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 md:p-8"
                  >
                    <AnimatePresence mode="wait">
                      {activeTab === "live" && (
                        <motion.div
                          key="live"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <SellerLsitings id={id} emptyLabel="Ovaj prodavač trenutno nema aktivnih oglasa." />
                        </motion.div>
                      )}
                      {activeTab === "sold" && (
                        <motion.div
                          key="sold"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <SellerLsitings id={id} filterStatus="sold out" emptyLabel="Ovaj prodavač još nema prodanih oglasa." />
                        </motion.div>
                      )}
                      {activeTab === "reviews" && (
                        <motion.div
                          key="reviews"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <SellerRating
                            ratingsData={ratings}
                            seller={seller}
                            isLoadMoreReview={isLoadMoreReview}
                            reviewHasMore={reviewHasMore}
                            reviewCurrentPage={reviewCurrentPage}
                            getSeller={getSeller}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
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