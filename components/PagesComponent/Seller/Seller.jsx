"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import {
  AlertCircle,
  ChevronDown,
  Package,
  ShoppingBag,
  Star,
  X,
} from "@/components/Common/UnifiedIconPack";

import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import OpenInAppDrawer from "@/components/Common/OpenInAppDrawer";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import SellerLsitings from "./SellerLsitings";
import SellerDetailCard from "./SellerDetailCard";
import SellerRating from "./SellerRating";
import SellerSkeleton from "./SellerSkeleton";

import { getSellerApi, gamificationApi } from "@/utils/api";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { resolveMembership } from "@/lib/membership";
import { cn } from "@/lib/utils";

// ============================================
// HELPERS
// ============================================
const getMembershipFlags = (data) => resolveMembership(data, data?.membership);

const normalizeRatingsPagination = (ratings) => {
  const current = Number(
    ratings?.current_page || ratings?.meta?.current_page || 1,
  );
  const last = Number(ratings?.last_page || ratings?.meta?.last_page || 1);
  return { currentPage: current, hasMore: current < last };
};

// ============================================
// UI
// ============================================
const TabButton = ({
  active,
  icon: Icon,
  label,
  count,
  onClick,
  compact = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group flex w-full items-center gap-3 rounded-xl border px-3 text-left transition-colors",
      compact ? "py-2.5" : "py-3 sm:flex-1",
      active
        ? "border-primary/30 bg-primary/[0.08] text-primary"
        : "border-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70",
    )}
  >
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        active
          ? "bg-primary/10 text-primary"
          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
      {label}
    </span>
    <span
      className={cn(
        "ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
        active
          ? "bg-primary/15 text-primary"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      {count}
    </span>
  </button>
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
  const [isMobileTabMenuOpen, setIsMobileTabMenuOpen] = useState(false);
  const isShare = searchParams?.share === "true";

  // Open app drawer on mobile when accessed through share link.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768 && isShare)
      setIsOpenInApp(true);
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
        const settings =
          payload?.data?.seller_settings || sellerData?.seller_settings || null;
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
        const { currentPage, hasMore } =
          normalizeRatingsPagination(ratingsData);
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
    [id, fetchSellerBadges],
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
    return (
      seller?.live_ads_count ??
      seller?.live_count ??
      seller?.active_ads_count ??
      0
    );
  }, [seller]);

  const soldCount = useMemo(() => {
    return (
      seller?.sold_ads_count ??
      seller?.sold_count ??
      seller?.completed_ads_count ??
      0
    );
  }, [seller]);

  const tabs = useMemo(
    () => [
      { key: "live", label: "Aktivni oglasi", icon: Package, count: liveCount },
      { key: "sold", label: "Prodano", icon: ShoppingBag, count: soldCount },
      { key: "reviews", label: "Recenzije", icon: Star, count: reviewCount },
    ],
    [liveCount, soldCount, reviewCount],
  );

  const activeTabMeta = useMemo(
    () => tabs.find((tab) => tab.key === activeTab) || tabs[0],
    [tabs, activeTab],
  );
  const ActiveTabIcon = activeTabMeta?.icon || Package;

  const preventSheetAutoFocusScroll = useCallback((event) => {
    event.preventDefault();
  }, []);

  useEffect(() => {
    setIsMobileTabMenuOpen(false);
  }, [activeTab]);

  if (isNoUserFound) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full px-4"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Prodavač nije pronađen
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Ovaj korisnik ne postoji ili je obrisan.
              </p>
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
            <div className="mx-auto w-full max-w-[1680px] space-y-6 px-3 py-5 sm:px-4 sm:py-7">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                {/* LEFT: Seller card */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="col-span-12 h-fit xl:col-span-3 xl:sticky xl:top-6"
                >
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
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
                  className="col-span-12 space-y-4 xl:col-span-9"
                >
                  {/* Tabs */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="sm:hidden">
                      <button
                        type="button"
                        onClick={() => setIsMobileTabMenuOpen((prev) => !prev)}
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        aria-label="Otvori meni sekcija prodavača"
                        aria-expanded={isMobileTabMenuOpen}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <ActiveTabIcon className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-300" />
                          <span className="truncate">
                            {activeTabMeta?.label}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-bold text-primary">
                            {activeTabMeta?.count ?? 0}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-slate-500 transition-transform dark:text-slate-400",
                              isMobileTabMenuOpen ? "rotate-180" : "",
                            )}
                          />
                        </span>
                      </button>
                    </div>

                    <div className="hidden gap-2 sm:flex">
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
                  </div>

                  <Sheet
                    open={isMobileTabMenuOpen}
                    onOpenChange={setIsMobileTabMenuOpen}
                  >
                    <SheetContent
                      side="bottom"
                      onOpenAutoFocus={preventSheetAutoFocusScroll}
                      onCloseAutoFocus={preventSheetAutoFocusScroll}
                      overlayClassName="bg-transparent backdrop-blur-none"
                      className="z-[128] h-auto max-h-[min(72dvh,420px)] overflow-hidden rounded-t-[1.25rem] border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-900 [&>button]:hidden"
                    >
                      <div className="flex flex-col bg-white dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Prodavači
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsMobileTabMenuOpen(false)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            aria-label="Zatvori sekcije"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 py-3">
                          <div className="flex flex-col gap-2">
                            {tabs.map((t) => (
                              <TabButton
                                key={t.key}
                                active={activeTab === t.key}
                                icon={t.icon}
                                label={t.label}
                                count={t.count}
                                compact
                                onClick={() => {
                                  setActiveTab(t.key);
                                  setIsMobileTabMenuOpen(false);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Content Card */}
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
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

      <OpenInAppDrawer
        isOpenInApp={isOpenInApp}
        setIsOpenInApp={setIsOpenInApp}
      />
    </Layout>
  );
};

export default Seller;
