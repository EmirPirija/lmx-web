"use client";
import { useEffect, useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconArrowsSort,
  IconLayoutGrid,
  IconListDetails,
  IconClock,
  IconArrowDown,
  IconArrowUp,
  IconFlame,
} from "@tabler/icons-react";
import { allItemApi } from "@/utils/api";
import ProductHorizontalCardSkeleton from "@/components/Common/ProductHorizontalCardSkeleton";
import ProductCardSkeleton from "@/components/Common/ProductCardSkeleton";
import ProductCard from "@/components/Common/ProductCard";
import ProductHorizontalCard from "@/components/Common/ProductHorizontalCard";
import NoData from "@/components/EmptyStates/NoData";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { useSelector } from "react-redux";

const SellerLsitings = ({ id, filterStatus, emptyLabel }) => {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "grid";
  const sortBy = searchParams.get("sort") || "new-to-old";

  const CurrentLanguage = useSelector(CurrentLanguageData);

  const [isSellerItemsLoading, setIsSellerItemsLoading] = useState(false);
  const [sellerItems, setSellerItems] = useState([]);
  const [isSellerItemLoadMore, setIsSellerItemLoadMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // mobilni bottom bar + sheet
  const [isBottomBarVisible, setIsBottomBarVisible] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    getSellerItems(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, CurrentLanguage?.id, id, filterStatus]);

  const getSellerItems = async (page) => {
    try {
      if (page === 1) {
        setIsSellerItemsLoading(true);
      }

      const params = {
        user_id: id,
        sort_by: sortBy,
        page,
      };

      if (filterStatus) {
        params.status = filterStatus; // npr. "sold out"
      }

      const res = await allItemApi.getItems(params);

      const list = res?.data?.data?.data || [];

      if (page > 1) {
        setSellerItems((prev) => [...prev, ...list]);
      } else {
        setSellerItems(list);
      }

      const current = res?.data?.data?.current_page || 1;
      const last = res?.data?.data?.last_page || 1;

      setCurrentPage(current);
      setHasMore(current < last);
    } catch (error) {
      console.log(error);
    } finally {
      setIsSellerItemsLoading(false);
      setIsSellerItemLoadMore(false);
    }
  };

  const handleLike = (itemId) => {
    setSellerItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_liked: !item.is_liked } : item
      )
    );
  };

  const handleLoadMore = () => {
    setIsSellerItemLoadMore(true);
    getSellerItems(currentPage + 1);
  };

  const updateSearchParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    window.history.pushState(null, "", `?${params.toString()}`);
  };

  const toggleView = (newView) => {
    updateSearchParam("view", newView);
  };

  const handleSortBy = (value) => {
    updateSearchParam("sort", value);
  };

  const showEmptyLabel =
    emptyLabel ||
    (filterStatus === "sold out"
      ? "Ovaj prodavač još nema prodanih oglasa."
      : "Ovaj prodavač trenutno nema oglasa.");

  // slide down / up bottom bar na scroll (mobitel)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      if (!isSheetOpen) {
        if (diff > 8 && currentY > 80) {
          // scroll dole → sakrij bar
          setIsBottomBarVisible(false);
        } else if (diff < -8) {
          // scroll gore → pokaži bar
          setIsBottomBarVisible(true);
        }
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSheetOpen]);

  const openSheet = () => {
    setIsSheetOpen(true);
    setIsBottomBarVisible(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
  };

  return (
    <div className="relative">
      <div className="space-y-5">
        {/* DESKTOP: top bar (sortiranje + view) */}
        <div className="hidden sm:flex flex-col gap-3 rounded-xl border bg-white/90 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <IconArrowsSort className="h-4 w-4" stroke={1.7} />
              <span className="whitespace-nowrap">Sortiraj po</span>
            </div>

            <Select value={sortBy} onValueChange={handleSortBy}>
              <SelectTrigger className="h-9 w-[210px] bg-white shadow-sm">
                <SelectValue placeholder="Sortiraj po" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectGroup>
                  <SelectItem value="new-to-old">
                    <span className="flex items-center gap-2">
                      <IconClock className="h-4 w-4" stroke={1.7} />
                      <span>Najnovije prvo</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="old-to-new">
                    <span className="flex items-center gap-2">
                      <IconClock
                        className="h-4 w-4 rotate-180"
                        stroke={1.7}
                      />
                      <span>Najstarije prvo</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="price-high-to-low">
                    <span className="flex items-center gap-2">
                      <IconArrowDown className="h-4 w-4" stroke={1.7} />
                      <span>Cijena: viša ka nižoj</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="price-low-to-high">
                    <span className="flex items-center gap-2">
                      <IconArrowUp className="h-4 w-4" stroke={1.7} />
                      <span>Cijena: niža ka višoj</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="popular_items">
                    <span className="flex items-center gap-2">
                      <IconFlame className="h-4 w-4" stroke={1.7} />
                      <span>Popularno</span>
                    </span>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => toggleView("grid")}
              className={`flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors ${
                view === "grid"
                  ? "bg-slate-900 text-white"
                  : "hover:bg-slate-100 hover:text-slate-900"
              }`}
              aria-label="Mrežni prikaz"
            >
              <IconLayoutGrid className="h-4 w-4" stroke={1.7} />
            </button>
            <button
              type="button"
              onClick={() => toggleView("list")}
              className={`flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors ${
                view === "list"
                  ? "bg-slate-900 text-white"
                  : "hover:bg-slate-100 hover:text-slate-900"
              }`}
              aria-label="Listni prikaz"
            >
              <IconListDetails className="h-4 w-4" stroke={1.7} />
            </button>
          </div>
        </div>

        {/* Lista oglasa */}
        <div className="grid grid-cols-12 gap-4 pb-20 sm:pb-0">
          {isSellerItemsLoading ? (
            Array.from({ length: 8 }).map((_, index) =>
              view === "list" ? (
                <div className="col-span-12" key={index}>
                  <ProductHorizontalCardSkeleton />
                </div>
              ) : (
                <div key={index} className="col-span-6 lg:col-span-4">
                  <ProductCardSkeleton />
                </div>
              )
            )
          ) : sellerItems && sellerItems.length > 0 ? (
            sellerItems.map((item, index) =>
              view === "list" ? (
                <div className="col-span-12" key={item.id || index}>
                  <ProductHorizontalCard
                    item={item}
                    handleLike={handleLike}
                    trackingParams={{ ref: "seller" }}
                  />
                </div>
              ) : (
                <div
                  className="col-span-6 sm:col-span-4 xl:col-span-3"
                  key={item.id || index}
                >
                  <ProductCard item={item} handleLike={handleLike} trackingParams={{ ref: "seller" }} />
                </div>
              )
            )
          ) : (
            <div className="col-span-12">
              <NoData name={showEmptyLabel} />
            </div>
          )}
        </div>

        {/* Load more */}
        {sellerItems && sellerItems.length > 0 && hasMore && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              className="w-[240px] text-sm sm:text-base"
              disabled={isSellerItemsLoading || isSellerItemLoadMore}
              onClick={handleLoadMore}
            >
              {isSellerItemLoadMore ? "Učitavanje..." : "Učitaj više"}
            </Button>
          </div>
        )}
      </div>

      {/* MOBILE: plutajući bottom bar (centriran, ~70% širine) */}
      <div
        className={`
          sm:hidden
          fixed left-1/2 bottom-4 z-40
          w-[70%] max-w-sm -translate-x-1/2
          transition-all duration-300 ease-out
          ${
            isBottomBarVisible
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-[120%] opacity-0 pointer-events-none"
          }
        `}
      >
        <button
          type="button"
          onClick={openSheet}
          className="
            flex w-full items-center justify-between
            rounded-full border bg-white/95 px-4 py-2
            text-xs font-medium text-slate-700 shadow-lg
          "
        >
          <span className="flex items-center gap-2">
            <IconArrowsSort className="h-4 w-4" stroke={1.7} />
            <span>Sortiranje i prikaz</span>
          </span>
          <span className="text-[10px] text-slate-500">
            Dodirni za podešavanje
          </span>
        </button>
      </div>

      {/* MOBILE: bottom sheet */}
      <div
        className={`
          sm:hidden
          fixed inset-0 z-50
          transition-opacity duration-300
          ${
            isSheetOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
        onClick={closeSheet}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Panel */}
        <div
          className={`
            absolute left-0 right-0 bottom-0
            rounded-t-2xl bg-white p-4 shadow-2xl
            transition-transform duration-300 ease-out
            ${isSheetOpen ? "translate-y-0" : "translate-y-full"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="mb-3 flex justify-center">
            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Sortiranje i prikaz</h2>
            <button
              type="button"
              onClick={closeSheet}
              className="text-xs text-muted-foreground"
            >
              Zatvori
            </button>
          </div>

          {/* Sortiranje */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Sortiraj po
            </span>

            <Select value={sortBy} onValueChange={handleSortBy}>
              <SelectTrigger className="h-9 w-full bg:white shadow-sm">
                <SelectValue placeholder="Sortiraj po" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectGroup>
                  <SelectItem value="new-to-old">
                    <span className="flex items-center gap-2">
                      <IconClock className="h-4 w-4" stroke={1.7} />
                      <span>Najnovije prvo</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="old-to-new">
                    <span className="flex items-center gap-2">
                      <IconClock
                        className="h-4 w-4 rotate-180"
                        stroke={1.7}
                      />
                      <span>Najstarije prvo</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="price-high-to-low">
                    <span className="flex items-center gap-2">
                      <IconArrowDown className="h-4 w-4" stroke={1.7} />
                      <span>Cijena: viša ka nižoj</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="price-low-to-high">
                    <span className="flex items-center gap-2">
                      <IconArrowUp className="h-4 w-4" stroke={1.7} />
                      <span>Cijena: niža ka višoj</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="popular_items">
                    <span className="flex items-center gap-2">
                      <IconFlame className="h-4 w-4" stroke={1.7} />
                      <span>Popularno</span>
                    </span>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* View mod (grid / list) */}
          <div className="mt-4 space-y-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Način prikaza
            </span>

            <div className="inline-flex w-full items-center gap-1 rounded-full bg-slate-50 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => toggleView("grid")}
                className={`flex flex-1 items-center justify-center rounded-full text-[11px] py-1.5 transition-colors ${
                  view === "grid"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <IconLayoutGrid className="mr-1 h-3.5 w-3.5" stroke={1.7} />
                Mreža
              </button>
              <button
                type="button"
                onClick={() => toggleView("list")}
                className={`flex flex-1 items-center justify-center rounded-full text-[11px] py-1.5 transition-colors ${
                  view === "list"
                    ? "bg-slate-900 text:white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <IconListDetails
                  className="mr-1 h-3.5 w-3.5"
                  stroke={1.7}
                />
                Lista
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerLsitings;