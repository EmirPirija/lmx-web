"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "@/components/Common/UnifiedIconPack";
import { useSelector } from "react-redux";
import { allItemApi } from "@/utils/api";
import ProductCard from "@/components/Common/ProductCard";
import ProductCardSkeleton from "@/components/Common/ProductCardSkeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getIsRtl } from "@/redux/reducer/languageSlice";

const MAX_ITEMS = 10;
const FETCH_LIMIT = 24;

const SellerOtherAds = ({ productDetails, onItemClick }) => {
  const isRTL = useSelector(getIsRtl);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileLink, setShowProfileLink] = useState(false);

  const sellerId =
    productDetails?.user?.id ||
    productDetails?.user?.user_id ||
    productDetails?.user_id;
  const currentItemId = productDetails?.id;

  useEffect(() => {
    if (!sellerId || !currentItemId) {
      setItems([]);
      setShowProfileLink(false);
      return;
    }

    let isActive = true;

    const fetchSellerOtherAds = async () => {
      try {
        setIsLoading(true);

        const res = await allItemApi.getItems({
          user_id: sellerId,
          page: 1,
          limit: FETCH_LIMIT,
          sort_by: "new-to-old",
        });

        const payload = res?.data?.data;
        const rawList = Array.isArray(payload?.data) ? payload.data : [];
        const filtered = rawList.filter(
          (item) => String(item?.id) !== String(currentItemId)
        );

        const total = Number(payload?.total);
        const otherCount = Number.isFinite(total)
          ? Math.max(0, total - 1)
          : filtered.length;

        if (!isActive) return;

        setItems(filtered.slice(0, MAX_ITEMS));
        setShowProfileLink(otherCount > MAX_ITEMS);
      } catch (error) {
        console.error("Greška pri učitavanju oglasa prodavača:", error);
        if (isActive) {
          setItems([]);
          setShowProfileLink(false);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    fetchSellerOtherAds();

    return () => {
      isActive = false;
    };
  }, [sellerId, currentItemId]);

  const handleLike = (itemId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_liked: !item.is_liked } : item
      )
    );
  };

  if (!sellerId) return null;
  if (!isLoading && items.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Ostali oglasi ovog prodavača
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Prikazujemo do {MAX_ITEMS} najnovijih oglasa.
          </p>
        </div>

        {showProfileLink && (
          <Link
            href={`/seller/${sellerId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
          >
            Pogledaj sve na profilu
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        )}
      </div>

      <Carousel
        key={isRTL ? `seller-other-rtl-${sellerId}` : `seller-other-ltr-${sellerId}`}
        opts={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        <CarouselContent>
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <CarouselItem
                  key={`seller-other-skeleton-${index}`}
                  className="basis-2/3 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <ProductCardSkeleton />
                </CarouselItem>
              ))
            : items.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="basis-2/3 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <ProductCard
                    item={item}
                    handleLike={handleLike}
                    onClick={onItemClick}
                    trackingParams={{ ref: "seller" }}
                  />
                </CarouselItem>
              ))}
        </CarouselContent>

        {!isLoading && items.length > 3 && (
          <>
            <CarouselPrevious className="hidden md:flex absolute top-1/2 ltr:left-2 rtl:right-2 rtl:scale-x-[-1] -translate-y-1/2 bg-primary text-white rounded-full" />
            <CarouselNext className="hidden md:flex absolute top-1/2 ltr:right-2 rtl:left-2 rtl:scale-x-[-1] -translate-y-1/2 bg-primary text-white rounded-full" />
          </>
        )}
      </Carousel>
    </section>
  );
};

export default SellerOtherAds;
