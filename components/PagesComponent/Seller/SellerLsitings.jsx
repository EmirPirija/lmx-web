"use client";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TbTransferVertical } from "react-icons/tb";
import { IoGrid } from "react-icons/io5";
import { MdViewStream } from "react-icons/md";
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
import { t } from "@/utils";

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

  useEffect(() => {
    getSellerItems(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, CurrentLanguage.id, id, filterStatus]);

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

      setCurrentPage(res?.data?.data?.current_page || 1);
      const last = res?.data?.data?.last_page || 1;
      setHasMore((res?.data?.data?.current_page || 1) < last);
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
      ? t("noSoldAds") || "Ovaj prodavač još nema prodanih oglasa."
      : t("ads"));

  return (
    <div className="space-y-5">
      {/* Top bar: sortiranje + view toggles */}
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TbTransferVertical className="h-4 w-4" />
            <span className="whitespace-nowrap">{t("sortBy")}</span>
          </div>

          <Select value={sortBy} onValueChange={handleSortBy}>
            <SelectTrigger className="h-9 w-[210px] bg-white shadow-sm">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectGroup>
                <SelectItem value="new-to-old">
                  {t("newestToOldest")}
                </SelectItem>
                <SelectItem value="old-to-new">
                  {t("oldestToNewest")}
                </SelectItem>
                <SelectItem value="price-high-to-low">
                  {t("priceHighToLow")}
                </SelectItem>
                <SelectItem value="price-low-to-high">
                  {t("priceLowToHigh")}
                </SelectItem>
                <SelectItem value="popular_items">
                  {t("popular")}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => toggleView("grid")}
            className={`flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors sm:size-9 ${
              view === "grid"
                ? "bg-primary text-white shadow-sm"
                : "hover:bg-muted hover:text-foreground"
            }`}
            aria-label="Grid view"
          >
            <IoGrid className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            onClick={() => toggleView("list")}
            className={`flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors sm:size-9 ${
              view === "list"
                ? "bg-primary text-white shadow-sm"
                : "hover:bg-muted hover:text-foreground"
            }`}
            aria-label="List view"
          >
            <MdViewStream className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* Lista oglasa */}
      <div className="grid grid-cols-12 gap-4">
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
                <ProductHorizontalCard item={item} handleLike={handleLike} />
              </div>
            ) : (
              <div
                className="col-span-6 sm:col-span-4 xl:col-span-3"
                key={item.id || index}
              >
                <ProductCard item={item} handleLike={handleLike} />
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
            {isSellerItemLoadMore ? t("loading") : t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SellerLsitings;
