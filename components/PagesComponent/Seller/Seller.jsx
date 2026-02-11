"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import { AlertCircle, Package, ShoppingBag, Star } from "lucide-react";

import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import OpenInAppDrawer from "@/components/Common/OpenInAppDrawer";

import SellerLsitings from "./SellerLsitings";
import SellerDetailCard from "./SellerDetailCard";
import SellerRating from "./SellerRating";
import SellerSkeleton from "./SellerSkeleton";

import { getSellerApi, gamificationApi } from "@/utils/api";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { cn } from "@/lib/utils";

// ============================================
// HELPERS
// ============================================
const getMembershipFlags = (data) => {
  const resolveFlags = (raw) => {
    const isShop = Boolean(raw?.is_shop);
    if (isShop) return { isPro: false, isShop: true };
    return { isPro: Boolean(raw?.is_pro), isShop: false };
  };

  const membership = data?.membership;
  if (!membership) return resolveFlags(data);

  const tier = String(membership.tier || membership.tier_name || membership.plan || "").toLowerCase();
  const status = String(membership.status || "").toLowerCase();

  // Only treat as active when membership status is active.
  if (status !== "active") return resolveFlags(data);

  // Heuristics based on existing backend naming.
  if (tier.includes("shop") || tier.includes("business")) return { isPro: false, isShop: true };
  if (tier.includes("pro") || tier.includes("premium")) return { isPro: true, isShop: false };
  return resolveFlags(data);
};

const normalizeRatingsPagination = (ratings) => {
  const current = Number(ratings?.current_page || ratings?.meta?.current_page || 1);
  const last = Number(ratings?.last_page || ratings?.meta?.last_page || 1);
  return { currentPage: current, hasMore: current < last };
};

// ============================================
// UI
// ============================================
const TabButton = ({ active, icon: Icon, label, count, onClick }) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
      active
        ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/60"
    )}
  >
    <Icon className={cn("w-4 h-4", active ? "text-primary" : "text-slate-400")} />
    <span className="hidden sm:inline whitespace-nowrap">{label}</span>
    <span
      className={cn(
        "ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
        active ? "bg-primary/15 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
      )}
    >
      {count}
    </span>
  </motion.button>
);

// ============================================
// PAGE
// ============================================
const Seller = ({ id, searchParams }) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);

  const [activeTab, setActiveTab] = useState("live");
  const [isNoUserFound, setIsNoUserFound] = useState(false);

  const [seller, setSeller] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [badges, setBadges] = useState([]);
  const [sellerSettings, setSellerSettings] = useState(null);

  const [isSellerDataLoading, setIsSellerDataLoading] = useState(false);
  const [isLoadMoreReview, setIsLoadMoreReview] = useState(false);
  const [reviewHasMore, setReviewHasMore] = useState(false);
  const [reviewCurrentPage, setReviewCurrentPage] = useState(1);

  const [isPro, setIsPro] = useState(false);
  const [isShop, setIsShop] = useState(false);

  const [isOpenInApp, setIsOpenInApp] = useState(false);
  const isShare = searchParams?.share === "true";

  // Open app drawer on mobile when accessed through share link.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768 && isShare) setIsOpenInApp(true);
  }, [isShare]);

  const fetchSellerBadges = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await gamificationApi.getUserBadges({ user_id: userId });
      if (!res?.data?.error) setBadges(res?.data?.data?.badges || []);
    } catch (error) {
      console.error("Error fetching seller badges:", error);
    }
  }, []);

  const getSeller = useCallback(
    async (page = 1) => {
      if (page === 1) setIsSellerDataLoading(true);
      if (page > 1) setIsLoadMoreReview(true);

      try {
        const res = await getSellerApi.getSeller({ id: Number(id), page });
        const payload = res?.data;

        if (payload?.error && payload?.code === 103) {
          setIsNoUserFound(true);
          return;
        }

        const sellerData = payload?.data?.seller;
        const ratingsData = payload?.data?.ratings;

        // Ratings
        if (page === 1) {
          setRatings(ratingsData);
        } else {
          setRatings((prev) => ({
            ...prev,
            ...ratingsData,
            data: [...(prev?.data || []), ...(ratingsData?.data || [])],
          }));
        }

        // Seller
        setSeller(sellerData || null);

        // Settings can come either nested under seller or on the root of the response.
        const settings = payload?.data?.seller_settings || sellerData?.seller_settings || null;
        setSellerSettings(settings);

        // Membership flags
        const mergedForMembership = {
          ...sellerData,
          membership: payload?.data?.membership || sellerData?.membership,
          is_pro: payload?.data?.is_pro ?? sellerData?.is_pro,
          is_shop: payload?.data?.is_shop ?? sellerData?.is_shop,
        };
        const flags = getMembershipFlags(mergedForMembership);
        setIsPro(flags.isPro);
        setIsShop(flags.isShop);

        // Pagination
        const { currentPage, hasMore } = normalizeRatingsPagination(ratingsData);
        setReviewCurrentPage(currentPage);
        setReviewHasMore(hasMore);

        // Badges
        if (sellerData?.id) fetchSellerBadges(sellerData.id);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSellerDataLoading(false);
        setIsLoadMoreReview(false);
      }
    },
    [id, fetchSellerBadges]
  );

  // Reload seller data when language or seller id changes.
  useEffect(() => {
    setIsNoUserFound(false);
    setSeller(null);
    setRatings(null);
    setBadges([]);
    setSellerSettings(null);
    setReviewCurrentPage(1);
    setReviewHasMore(false);
    getSeller(1);
  }, [CurrentLanguage?.id, id, getSeller]);

  const reviewCount = useMemo(() => {
    return ratings?.total ?? ratings?.meta?.total ?? ratings?.data?.length ?? 0;
  }, [ratings]);

  const liveCount = useMemo(() => {
    return seller?.live_ads_count ?? seller?.live_count ?? seller?.active_ads_count ?? 0;
  }, [seller]);

  const soldCount = useMemo(() => {
    return seller?.sold_ads_count ?? seller?.sold_count ?? seller?.completed_ads_count ?? 0;
  }, [seller]);

  const tabs = useMemo(
    () => [
      { key: "live", label: "Aktivni oglasi", icon: Package, count: liveCount },
      { key: "sold", label: "Prodano", icon: ShoppingBag, count: soldCount },
      { key: "reviews", label: "Recenzije", icon: Star, count: reviewCount },
    ],
    [liveCount, soldCount, reviewCount]
  );

  if (isNoUserFound) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full px-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Prodavač nije pronađen</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ovaj korisnik ne postoji ili je obrisan.</p>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {isSellerDataLoading && !seller ? (
        <SellerSkeleton steps={activeTab} />
      ) : (
        <>
          <BreadCrumb title2={seller?.name} />

          <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="container mx-auto px-4 py-8 space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* LEFT: Seller card */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="col-span-12 lg:col-span-4 lg:sticky lg:top-6 h-fit"
                >
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <SellerDetailCard
                      seller={seller}
                      ratings={ratings}
                      badges={badges}
                      sellerSettings={sellerSettings}
                      isPro={isPro}
                      isShop={isShop}
                    />
                  </div>
                </motion.div>

                {/* RIGHT: Content */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="col-span-12 lg:col-span-8 space-y-4"
                >
                  {/* Tabs */}
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((t) => (
                      <TabButton
                        key={t.key}
                        active={activeTab === t.key}
                        icon={t.icon}
                        label={t.label}
                        count={t.count}
                        onClick={() => setActiveTab(t.key)}
                      />
                    ))}
                  </div>

                  {/* Content Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6">
                      <AnimatePresence mode="wait" initial={false}>
                        {activeTab === "live" && (
                          <motion.div
                            key="tab-live"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                          >
                            <SellerLsitings
                              id={id}
                              filterStatus="approved"
                              emptyLabel="Ovaj prodavač trenutno nema aktivnih oglasa."
                              sellerSettings={sellerSettings}
                              isProSeller={isPro}
                              isShopSeller={isShop}
                            />
                          </motion.div>
                        )}

                        {activeTab === "sold" && (
                          <motion.div
                            key="tab-sold"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                          >
                            <SellerLsitings
                              id={id}
                              filterStatus="sold out"
                              emptyLabel="Ovaj prodavač još nema prodanih oglasa."
                              sellerSettings={sellerSettings}
                              isProSeller={isPro}
                              isShopSeller={isShop}
                            />
                          </motion.div>
                        )}

                        {activeTab === "reviews" && (
                          <motion.div
                            key="tab-reviews"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
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
                    </div>
                  </div>
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
