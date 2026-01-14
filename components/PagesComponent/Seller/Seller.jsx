"use client";

import { useEffect, useState } from "react";
import SellerLsitings from "./SellerLsitings";
import SellerDetailCard from "./SellerDetailCard";
import { getSellerApi } from "@/utils/api";
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

  // "live" | "sold" | "reviews"
  const [activeTab, setActiveTab] = useState("live");
  const [isNoUserFound, setIsNoUserFound] = useState(false);

  const [seller, setSeller] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [isSellerDataLoading, setIsSellerDataLoading] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CurrentLanguage?.id, id]);

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
        setSeller(res?.data?.data?.seller);
        setReviewCurrentPage(sellerRatings?.current_page || 1);
        if (sellerRatings?.current_page < sellerRatings?.last_page) {
          setReviewHasMore(true);
        } else {
          setReviewHasMore(false);
        }
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

  // Broj recenzija – prilagodi strukturi svog paginatora
  const reviewCount =
    ratings?.total ??
    ratings?.meta?.total ??
    ratings?.data?.length ??
    0;

  // Ako imaš drugačija imena polja, ovdje ih samo promijeni
  const liveCount =
    seller?.live_ads_count ??
    seller?.live_count ??
    seller?.active_ads_count ??
    0;

  const soldCount =
    seller?.sold_ads_count ??
    seller?.sold_count ??
    seller?.completed_ads_count ??
    0;

  const tabs = [
    {
      key: "live",
      label: "Aktivni oglasi",
      count: liveCount,
    },
    {
      key: "sold",
      label: "Prodano",
      count: soldCount,
    },
    {
      key: "reviews",
      label: "Recenzije",
      count: reviewCount,
    },
  ];

  return (
    <Layout>
      {isSellerDataLoading && !seller ? (
        <SellerSkeleton steps={activeTab} />
      ) : (
        <>
          <BreadCrumb title2={seller?.name} />
          <div className="container mx-auto mt-6 mb-10 space-y-6">
            {/* Naslov + opis */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {seller?.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Pregled profila prodavača i njegovih oglasa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Lijeva kolona – detalji prodavača */}
              <div className="col-span-12 lg:col-span-4">
                <SellerDetailCard seller={seller} ratings={ratings} />
              </div>

              {/* Desna kolona – tabovi + sadržaj */}
              <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
                {/* Tabovi */}
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
            relative inline-flex items-center justify-center gap-2 w-full
            rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap
            transition-all duration-200 ease-out text-center
            ${
              isActive
                ? "bg-primary text-white shadow-md scale-[1.01]"
                : "bg-transparent text-slate-700 hover:bg-white hover:text-slate-900"
            }
          `}
        >
          <span>{tab.label}</span>
          <span
            className={`
              inline-flex items-center justify-center
              h-5 min-w-[1.6rem] rounded-full text-[11px] font-semibold
              transition-all duration-200
              ${
                isActive
                  ? "bg-white/95 text-primary"
                  : "bg-slate-200 text-slate-700"
              }
            `}
          >
            {tab.count}
          </span>

          {/* Glow efekat ispod aktivnog taba */}
          {isActive && (
            <span className="pointer-events-none absolute inset-x-2 -bottom-1 h-1 rounded-full bg-primary/40 blur-[4px]" />
          )}
        </button>
      );
    })}
  </div>
</div>


                {/* Sadržaj taba */}
                <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-sm">
                  {activeTab === "live" && (
                    <SellerLsitings
                      id={id}
                      emptyLabel="Ovaj prodavač trenutno nema aktivnih oglasa."
                    />
                  )}

                  {activeTab === "sold" && (
                    <SellerLsitings
                      id={id}
                      filterStatus="sold out"
                      emptyLabel="Ovaj prodavač još nema prodanih oglasa."
                    />
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
      <OpenInAppDrawer
        isOpenInApp={isOpenInApp}
        setIsOpenInApp={setIsOpenInApp}
      />
    </Layout>
  );
};

export default Seller;
