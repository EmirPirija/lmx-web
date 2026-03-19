"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@/components/Common/UnifiedIconPack";
import {
  SlidersHorizontal,
  Search,
  Tag,
  DollarSign,
  Video,
  BadgePercent,
  Star,
  X,
} from "@/components/Common/UnifiedIconPack";
import { allItemApi } from "@/utils/api";
import ProductHorizontalCardSkeleton from "@/components/Common/ProductHorizontalCardSkeleton";
import ProductCardSkeleton from "@/components/Common/ProductCardSkeleton";
import ProductCard from "@/components/Common/ProductCard";
import ProductHorizontalCard from "@/components/Common/ProductHorizontalCard";
import NoData from "@/components/EmptyStates/NoData";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import { normalizeSellerCardPreferences } from "@/lib/seller-settings-engine";

const SellerLsitings = ({
  id,
  filterStatus,
  emptyLabel,
  sellerSettings,
  isProSeller = false,
  isShopSeller = false,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "grid";
  const sortBy = searchParams.get("sort") || "new-to-old";

  const CurrentLanguage = useSelector(CurrentLanguageData);

  const [isSellerItemsLoading, setIsSellerItemsLoading] = useState(false);
  const [sellerItems, setSellerItems] = useState([]);
  const [isSellerItemLoadMore, setIsSellerItemLoadMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [categorySearchText, setCategorySearchText] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [onlyVideo, setOnlyVideo] = useState(false);
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [activeFilterPanel, setActiveFilterPanel] = useState(null);
  const [isMobileFilterMenuOpen, setIsMobileFilterMenuOpen] = useState(false);

  const buyerFilterPreferences = useMemo(
    () => normalizeSellerCardPreferences(sellerSettings?.card_preferences),
    [sellerSettings?.card_preferences],
  );

  const hasProOrShop = useMemo(
    () => Boolean(isProSeller || isShopSeller),
    [isProSeller, isShopSeller],
  );

  const canUseBuyerFilters = useMemo(
    () => hasProOrShop && buyerFilterPreferences.enable_buyer_filters,
    [hasProOrShop, buyerFilterPreferences.enable_buyer_filters],
  );

  const categoryOptions = useMemo(() => {
    const map = new Map();
    (sellerItems || []).forEach((item) => {
      const categoryId = item?.category_id ?? item?.category?.id;
      if (!categoryId) return;

      const categoryName =
        item?.category?.translated_name ||
        item?.category?.name ||
        item?.translated_category?.name ||
        `Kategorija #${categoryId}`;

      if (!map.has(String(categoryId))) {
        map.set(String(categoryId), {
          id: String(categoryId),
          name: categoryName,
          count: 0,
        });
      }

      const current = map.get(String(categoryId));
      current.count += 1;
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.name).localeCompare(String(b.name), "bs", {
        sensitivity: "base",
      }),
    );
  }, [sellerItems]);

  const visibleCategoryOptions = useMemo(() => {
    const term = categorySearchText.trim().toLowerCase();
    if (!term) return categoryOptions;
    return categoryOptions.filter((category) =>
      String(category.name).toLowerCase().includes(term),
    );
  }, [categoryOptions, categorySearchText]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    getSellerItems(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortBy,
    CurrentLanguage?.id,
    id,
    filterStatus,
    canUseBuyerFilters,
    buyerFilterPreferences.buyer_filters_show_search,
    buyerFilterPreferences.buyer_filters_show_category,
    buyerFilterPreferences.buyer_filters_show_price,
    buyerFilterPreferences.buyer_filters_show_video,
    debouncedSearchText,
    selectedCategoryId,
    priceMin,
    priceMax,
    onlyVideo,
  ]);

  const getSellerItems = async (page) => {
    try {
      if (page === 1) {
        setIsSellerItemsLoading(true);
      }

      const params = {
        user_id: id,
        sort_by: sortBy,
        page,
        limit: 20,
      };

      if (canUseBuyerFilters) {
        if (
          buyerFilterPreferences.buyer_filters_show_search &&
          debouncedSearchText
        ) {
          params.search = debouncedSearchText;
        }

        if (
          buyerFilterPreferences.buyer_filters_show_category &&
          selectedCategoryId !== "all"
        ) {
          params.category_id = selectedCategoryId;
        }

        if (buyerFilterPreferences.buyer_filters_show_video && onlyVideo) {
          params.has_video = 1;
        }

        if (buyerFilterPreferences.buyer_filters_show_price) {
          const hasMin = String(priceMin).trim() !== "";
          const hasMax = String(priceMax).trim() !== "";
          const parsedMin = hasMin ? Number(priceMin) : NaN;
          const parsedMax = hasMax ? Number(priceMax) : NaN;

          if (hasMin && !Number.isNaN(parsedMin) && parsedMin >= 0) {
            params.min_price = parsedMin;
          }

          if (hasMax && !Number.isNaN(parsedMax) && parsedMax >= 0) {
            params.max_price = parsedMax;
          }
        }
      }

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
    } finally {
      setIsSellerItemsLoading(false);
      setIsSellerItemLoadMore(false);
    }
  };

  const handleLike = useCallback((itemId) => {
    setSellerItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_liked: !item.is_liked } : item,
      ),
    );
  }, []);

  const handleLoadMore = () => {
    setIsSellerItemLoadMore(true);
    getSellerItems(currentPage + 1);
  };

  const updateSearchParam = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set(key, value);
      const queryString = params.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
      window.history.pushState(null, "", nextUrl);
    },
    [pathname, searchParams],
  );

  const toggleView = (newView) => {
    updateSearchParam("view", newView);
  };

  const handleSortBy = (value) => {
    updateSearchParam("sort", value);
  };

  const preventSheetAutoFocusScroll = useCallback((event) => {
    event.preventDefault();
  }, []);

  const hasActiveBuyerFilters = useMemo(() => {
    if (!canUseBuyerFilters) return false;

    return Boolean(
      (buyerFilterPreferences.buyer_filters_show_search && searchText.trim()) ||
      (buyerFilterPreferences.buyer_filters_show_category &&
        selectedCategoryId !== "all") ||
      (buyerFilterPreferences.buyer_filters_show_price &&
        (priceMin !== "" || priceMax !== "")) ||
      (buyerFilterPreferences.buyer_filters_show_video && onlyVideo) ||
      (buyerFilterPreferences.buyer_filters_show_on_sale && onlyOnSale) ||
      (buyerFilterPreferences.buyer_filters_show_featured && onlyFeatured),
    );
  }, [
    canUseBuyerFilters,
    buyerFilterPreferences.buyer_filters_show_search,
    buyerFilterPreferences.buyer_filters_show_category,
    buyerFilterPreferences.buyer_filters_show_price,
    buyerFilterPreferences.buyer_filters_show_video,
    buyerFilterPreferences.buyer_filters_show_on_sale,
    buyerFilterPreferences.buyer_filters_show_featured,
    searchText,
    selectedCategoryId,
    priceMin,
    priceMax,
    onlyVideo,
    onlyOnSale,
    onlyFeatured,
  ]);

  const resetBuyerFilters = () => {
    setSearchText("");
    setSelectedCategoryId("all");
    setCategorySearchText("");
    setPriceMin("");
    setPriceMax("");
    setOnlyVideo(false);
    setOnlyOnSale(false);
    setOnlyFeatured(false);
  };

  const filteredSellerItems = useMemo(() => {
    if (!canUseBuyerFilters) return sellerItems;

    return (sellerItems || []).filter((item) => {
      if (
        buyerFilterPreferences.buyer_filters_show_category &&
        selectedCategoryId !== "all"
      ) {
        const itemCategoryId = String(
          item?.category_id ?? item?.category?.id ?? "",
        );
        if (itemCategoryId !== String(selectedCategoryId)) {
          return false;
        }
      }

      if (
        buyerFilterPreferences.buyer_filters_show_on_sale &&
        onlyOnSale &&
        !(item?.is_on_sale === true || item?.is_on_sale === 1)
      ) {
        return false;
      }

      if (
        buyerFilterPreferences.buyer_filters_show_featured &&
        onlyFeatured &&
        !(
          item?.is_feature === true ||
          item?.is_feature === 1 ||
          String(item?.status || "").toLowerCase() === "featured"
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    sellerItems,
    canUseBuyerFilters,
    buyerFilterPreferences.buyer_filters_show_category,
    buyerFilterPreferences.buyer_filters_show_on_sale,
    buyerFilterPreferences.buyer_filters_show_featured,
    selectedCategoryId,
    onlyOnSale,
    onlyFeatured,
  ]);

  const showEmptyLabel =
    emptyLabel ||
    (filterStatus === "sold out"
      ? "Ovaj prodavač još nema prodanih oglasa."
      : "Ovaj prodavač trenutno nema aktivnih oglasa.");

  const emptyStateTitle = hasActiveBuyerFilters
    ? "Nema oglasa za odabrane filtere."
    : showEmptyLabel;

  const emptyStateName = hasActiveBuyerFilters
    ? "oglasa za odabrane filtere"
    : filterStatus === "sold out"
      ? "prodanih oglasa"
      : "aktivnih oglasa";

  useEffect(() => {
    if (!canUseBuyerFilters) {
      setActiveFilterPanel(null);
      setIsMobileFilterMenuOpen(false);
      return;
    }

    if (
      activeFilterPanel === "search" &&
      !buyerFilterPreferences.buyer_filters_show_search
    ) {
      setActiveFilterPanel(null);
    }

    if (
      activeFilterPanel === "category" &&
      !buyerFilterPreferences.buyer_filters_show_category
    ) {
      setActiveFilterPanel(null);
    }

    if (
      activeFilterPanel === "price" &&
      !buyerFilterPreferences.buyer_filters_show_price
    ) {
      setActiveFilterPanel(null);
    }
  }, [
    activeFilterPanel,
    canUseBuyerFilters,
    buyerFilterPreferences.buyer_filters_show_search,
    buyerFilterPreferences.buyer_filters_show_category,
    buyerFilterPreferences.buyer_filters_show_price,
  ]);

  const FilterPill = ({ icon: Icon, label, count, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold outline-none transition-all duration-200 active:scale-[0.98] sm:text-sm",
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0 transition-colors",
          active
            ? "text-primary"
            : "text-slate-500 group-hover:text-slate-700 dark:text-slate-300 dark:group-hover:text-slate-100",
        )}
      />
      <span>{label}</span>
      {count > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );

  const searchFilterCount =
    buyerFilterPreferences.buyer_filters_show_search && searchText.trim()
      ? 1
      : 0;
  const categoryFilterCount =
    buyerFilterPreferences.buyer_filters_show_category &&
    selectedCategoryId !== "all"
      ? 1
      : 0;
  const priceFilterCount =
    buyerFilterPreferences.buyer_filters_show_price &&
    (String(priceMin).trim() !== "" || String(priceMax).trim() !== "")
      ? 1
      : 0;
  const videoFilterCount =
    buyerFilterPreferences.buyer_filters_show_video && onlyVideo ? 1 : 0;
  const saleFilterCount =
    buyerFilterPreferences.buyer_filters_show_on_sale && onlyOnSale ? 1 : 0;
  const featuredFilterCount =
    buyerFilterPreferences.buyer_filters_show_featured && onlyFeatured ? 1 : 0;
  const activeFilterCount =
    searchFilterCount +
    categoryFilterCount +
    priceFilterCount +
    videoFilterCount +
    saleFilterCount +
    featuredFilterCount;
  const hasExpandableFilterPanel =
    (activeFilterPanel === "search" &&
      buyerFilterPreferences.buyer_filters_show_search) ||
    (activeFilterPanel === "category" &&
      buyerFilterPreferences.buyer_filters_show_category) ||
    (activeFilterPanel === "price" &&
      buyerFilterPreferences.buyer_filters_show_price);

  const renderActiveFilterPanel = () => (
    <>
      {activeFilterPanel === "search" &&
        buyerFilterPreferences.buyer_filters_show_search && (
          <Input
            className="h-10 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            placeholder="Pretraga oglasa prodavača..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        )}

      {activeFilterPanel === "category" &&
        buyerFilterPreferences.buyer_filters_show_category && (
          <div className="space-y-3">
            <Input
              className="h-10 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              placeholder="Pretraži kategorije..."
              value={categorySearchText}
              onChange={(e) => setCategorySearchText(e.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                  selectedCategoryId === "all"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600",
                )}
              >
                Sve kategorije
              </button>

              {visibleCategoryOptions.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                    selectedCategoryId === category.id
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600",
                  )}
                >
                  <span className="max-w-[170px] truncate">
                    {category.name}
                  </span>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>

            {visibleCategoryOptions.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nema kategorija za traženi unos.
              </p>
            )}
          </div>
        )}

      {activeFilterPanel === "price" &&
        buyerFilterPreferences.buyer_filters_show_price && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              type="number"
              min="0"
              className="h-10 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              placeholder="Min cijena"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
            />
            <Input
              type="number"
              min="0"
              className="h-10 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              placeholder="Max cijena"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
            />
          </div>
        )}
    </>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
              {isSellerItemsLoading
                ? "Učitavanje oglasa..."
                : `${filteredSellerItems?.length || 0} oglasa`}
            </h3>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
            <Select value={sortBy} onValueChange={handleSortBy}>
              <SelectTrigger className="h-10 w-full min-w-[190px] border-slate-200 bg-white font-medium focus:ring-1 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 [&>svg]:hidden">
                <div className="mr-1 inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <IconArrowsSort className="h-4 w-4" stroke={1.7} />
                  <span className="text-xs font-semibold sm:text-sm">
                    Sortiraj
                  </span>
                </div>
                <SelectValue placeholder="Sortiraj po" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900">
                <SelectGroup>
                  <SelectItem
                    value="new-to-old"
                    className="pl-3 pr-9 [&>span]:!left-auto [&>span]:!right-3"
                  >
                    <span className="flex items-center gap-2">
                      <IconClock className="h-4 w-4" stroke={1.7} />
                      <span>Najnovije prvo</span>
                    </span>
                  </SelectItem>
                  <SelectItem
                    value="old-to-new"
                    className="pl-3 pr-9 [&>span]:!left-auto [&>span]:!right-3"
                  >
                    <span className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 rotate-180" stroke={1.7} />
                      <span>Najstarije prvo</span>
                    </span>
                  </SelectItem>
                  <SelectItem
                    value="price-high-to-low"
                    className="pl-3 pr-9 [&>span]:!left-auto [&>span]:!right-3"
                  >
                    <span className="flex items-center gap-2">
                      <IconArrowDown className="h-4 w-4" stroke={1.7} />
                      <span>Cijena: viša ka nižoj</span>
                    </span>
                  </SelectItem>
                  <SelectItem
                    value="price-low-to-high"
                    className="pl-3 pr-9 [&>span]:!left-auto [&>span]:!right-3"
                  >
                    <span className="flex items-center gap-2">
                      <IconArrowUp className="h-4 w-4" stroke={1.7} />
                      <span>Cijena: niža ka višoj</span>
                    </span>
                  </SelectItem>
                  <SelectItem
                    value="popular_items"
                    className="pl-3 pr-9 [&>span]:!left-auto [&>span]:!right-3"
                  >
                    <span className="flex items-center gap-2">
                      <IconFlame className="h-4 w-4" stroke={1.7} />
                      <span>Popularno</span>
                    </span>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <div className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800 sm:w-auto">
              <button
                type="button"
                onClick={() => toggleView("list")}
                className={cn(
                  "inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition-all sm:flex-none sm:px-3",
                  view === "list"
                    ? "bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-primary"
                    : "text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700",
                )}
                aria-label="Listni prikaz"
              >
                <IconListDetails className="h-4 w-4" stroke={1.7} />
                <span>Lista</span>
              </button>
              <button
                type="button"
                onClick={() => toggleView("grid")}
                className={cn(
                  "inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition-all sm:flex-none sm:px-3",
                  view === "grid"
                    ? "bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-primary"
                    : "text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700",
                )}
                aria-label="Mrežni prikaz"
              >
                <IconLayoutGrid className="h-4 w-4" stroke={1.7} />
                <span>Mreža</span>
              </button>
            </div>
          </div>
        </div>

        {canUseBuyerFilters && (
          <div className="mt-3 pt-2">
            <div className="flex items-center gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => setIsMobileFilterMenuOpen(true)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filteri
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-2 hidden flex-wrap items-center gap-2 sm:flex">
              {buyerFilterPreferences.buyer_filters_show_search && (
                <FilterPill
                  icon={Search}
                  label="Pretraga"
                  count={searchFilterCount}
                  active={
                    searchFilterCount > 0 || activeFilterPanel === "search"
                  }
                  onClick={() =>
                    setActiveFilterPanel((prev) =>
                      prev === "search" ? null : "search",
                    )
                  }
                />
              )}

              {buyerFilterPreferences.buyer_filters_show_category && (
                <FilterPill
                  icon={Tag}
                  label="Kategorija"
                  count={categoryFilterCount}
                  active={
                    categoryFilterCount > 0 || activeFilterPanel === "category"
                  }
                  onClick={() =>
                    setActiveFilterPanel((prev) =>
                      prev === "category" ? null : "category",
                    )
                  }
                />
              )}

              {buyerFilterPreferences.buyer_filters_show_price && (
                <FilterPill
                  icon={DollarSign}
                  label="Cijena"
                  count={priceFilterCount}
                  active={priceFilterCount > 0 || activeFilterPanel === "price"}
                  onClick={() =>
                    setActiveFilterPanel((prev) =>
                      prev === "price" ? null : "price",
                    )
                  }
                />
              )}

              {buyerFilterPreferences.buyer_filters_show_video && (
                <FilterPill
                  icon={Video}
                  label="Video"
                  count={videoFilterCount}
                  active={onlyVideo}
                  onClick={() => setOnlyVideo((prev) => !prev)}
                />
              )}

              {buyerFilterPreferences.buyer_filters_show_on_sale && (
                <FilterPill
                  icon={BadgePercent}
                  label="Akcija"
                  count={saleFilterCount}
                  active={onlyOnSale}
                  onClick={() => setOnlyOnSale((prev) => !prev)}
                />
              )}

              {buyerFilterPreferences.buyer_filters_show_featured && (
                <FilterPill
                  icon={Star}
                  label="Izdvojeni"
                  count={featuredFilterCount}
                  active={onlyFeatured}
                  onClick={() => setOnlyFeatured((prev) => !prev)}
                />
              )}

              {hasActiveBuyerFilters && (
                <button
                  type="button"
                  onClick={resetBuyerFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-all hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"
                >
                  <X className="h-4 w-4" />
                  Resetuj
                </button>
              )}
            </div>

            {hasExpandableFilterPanel && (
              <div className="mt-3 hidden rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40 sm:block sm:p-4">
                {renderActiveFilterPanel()}
              </div>
            )}
          </div>
        )}
      </div>

      <Sheet
        open={isMobileFilterMenuOpen}
        onOpenChange={setIsMobileFilterMenuOpen}
      >
        <SheetContent
          side="bottom"
          onOpenAutoFocus={preventSheetAutoFocusScroll}
          onCloseAutoFocus={preventSheetAutoFocusScroll}
          overlayClassName="bg-slate-950/70"
          className="max-h-[78vh] w-screen max-w-none overflow-hidden rounded-t-2xl border-x-0 border-b-0 border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-900 [&>button]:hidden"
        >
          <div className="flex flex-col bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Filteri
              </p>
              <button
                type="button"
                onClick={() => setIsMobileFilterMenuOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Zatvori filter meni"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {buyerFilterPreferences.buyer_filters_show_search && (
                  <FilterPill
                    icon={Search}
                    label="Pretraga"
                    count={searchFilterCount}
                    active={
                      searchFilterCount > 0 || activeFilterPanel === "search"
                    }
                    onClick={() =>
                      setActiveFilterPanel((prev) =>
                        prev === "search" ? null : "search",
                      )
                    }
                  />
                )}

                {buyerFilterPreferences.buyer_filters_show_category && (
                  <FilterPill
                    icon={Tag}
                    label="Kategorija"
                    count={categoryFilterCount}
                    active={
                      categoryFilterCount > 0 ||
                      activeFilterPanel === "category"
                    }
                    onClick={() =>
                      setActiveFilterPanel((prev) =>
                        prev === "category" ? null : "category",
                      )
                    }
                  />
                )}

                {buyerFilterPreferences.buyer_filters_show_price && (
                  <FilterPill
                    icon={DollarSign}
                    label="Cijena"
                    count={priceFilterCount}
                    active={
                      priceFilterCount > 0 || activeFilterPanel === "price"
                    }
                    onClick={() =>
                      setActiveFilterPanel((prev) =>
                        prev === "price" ? null : "price",
                      )
                    }
                  />
                )}

                {buyerFilterPreferences.buyer_filters_show_video && (
                  <FilterPill
                    icon={Video}
                    label="Video"
                    count={videoFilterCount}
                    active={onlyVideo}
                    onClick={() => setOnlyVideo((prev) => !prev)}
                  />
                )}

                {buyerFilterPreferences.buyer_filters_show_on_sale && (
                  <FilterPill
                    icon={BadgePercent}
                    label="Akcija"
                    count={saleFilterCount}
                    active={onlyOnSale}
                    onClick={() => setOnlyOnSale((prev) => !prev)}
                  />
                )}

                {buyerFilterPreferences.buyer_filters_show_featured && (
                  <FilterPill
                    icon={Star}
                    label="Izdvojeni"
                    count={featuredFilterCount}
                    active={onlyFeatured}
                    onClick={() => setOnlyFeatured((prev) => !prev)}
                  />
                )}
              </div>

              {hasExpandableFilterPanel && (
                <div className="mt-3 rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40">
                  {renderActiveFilterPanel()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-3 dark:border-slate-800">
              {hasActiveBuyerFilters && (
                <button
                  type="button"
                  onClick={resetBuyerFilters}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-red-50 px-3 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-300"
                >
                  Resetuj
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFilterMenuOpen(false)}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Zatvori
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Lista oglasa */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4">
        {isSellerItemsLoading ? (
          Array.from({ length: 8 }).map((_, index) =>
            view === "list" ? (
              <div className="col-span-12" key={index}>
                <ProductHorizontalCardSkeleton />
              </div>
            ) : (
              <div
                key={index}
                className="col-span-6 md:col-span-4 2xl:col-span-3"
              >
                <ProductCardSkeleton />
              </div>
            ),
          )
        ) : filteredSellerItems && filteredSellerItems.length > 0 ? (
          filteredSellerItems.map((item, index) =>
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
                className="col-span-6 md:col-span-4 2xl:col-span-3"
                key={item.id || index}
              >
                <ProductCard
                  item={item}
                  handleLike={handleLike}
                  trackingParams={{ ref: "seller" }}
                />
              </div>
            ),
          )
        ) : (
          <div className="col-span-12 rounded-2xl bg-white p-2 dark:bg-slate-900 sm:p-4">
            <NoData
              name={emptyStateName}
              title={emptyStateTitle}
            />
          </div>
        )}
      </div>

      {/* Load more */}
      {sellerItems && sellerItems.length > 0 && hasMore && (
        <div className="mt-2 flex justify-center pt-2">
          <Button
            variant="outline"
            className="h-11 min-w-[220px] rounded-xl text-sm font-semibold sm:text-base"
            disabled={isSellerItemsLoading || isSellerItemLoadMore}
            onClick={handleLoadMore}
          >
            {isSellerItemLoadMore ? "Učitavanje..." : "Učitaj više"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SellerLsitings;
