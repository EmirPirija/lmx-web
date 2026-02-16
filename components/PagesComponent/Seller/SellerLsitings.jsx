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
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { useSelector } from "react-redux";

const defaultBuyerFilterPreferences = {
  enable_buyer_filters: true,
  buyer_filters_show_search: true,
  buyer_filters_show_category: true,
  buyer_filters_show_price: true,
  buyer_filters_show_video: true,
  buyer_filters_show_on_sale: true,
  buyer_filters_show_featured: true,
};

const toBool = (value, fallback = false) => {
  if (value == null) return fallback;
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes"].includes(normalized)) return true;
    if (["0", "false", "no"].includes(normalized)) return false;
  }
  return Boolean(value);
};

const normalizeBuyerFilterPreferences = (raw) => {
  let source = raw;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = {};
    }
  }

  if (!source || typeof source !== "object") source = {};

  return {
    enable_buyer_filters: toBool(
      source.enable_buyer_filters,
      defaultBuyerFilterPreferences.enable_buyer_filters
    ),
    buyer_filters_show_search: toBool(
      source.buyer_filters_show_search,
      defaultBuyerFilterPreferences.buyer_filters_show_search
    ),
    buyer_filters_show_category: toBool(
      source.buyer_filters_show_category,
      defaultBuyerFilterPreferences.buyer_filters_show_category
    ),
    buyer_filters_show_price: toBool(
      source.buyer_filters_show_price,
      defaultBuyerFilterPreferences.buyer_filters_show_price
    ),
    buyer_filters_show_video: toBool(
      source.buyer_filters_show_video,
      defaultBuyerFilterPreferences.buyer_filters_show_video
    ),
    buyer_filters_show_on_sale: toBool(
      source.buyer_filters_show_on_sale,
      defaultBuyerFilterPreferences.buyer_filters_show_on_sale
    ),
    buyer_filters_show_featured: toBool(
      source.buyer_filters_show_featured,
      defaultBuyerFilterPreferences.buyer_filters_show_featured
    ),
  };
};

const SellerLsitings = ({
  id,
  filterStatus,
  emptyLabel,
  sellerSettings,
  isProSeller = false,
  isShopSeller = false,
}) => {
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

  const buyerFilterPreferences = useMemo(
    () => normalizeBuyerFilterPreferences(sellerSettings?.card_preferences),
    [sellerSettings?.card_preferences]
  );

  const hasProOrShop = useMemo(
    () => Boolean(isProSeller || isShopSeller),
    [isProSeller, isShopSeller]
  );

  const canUseBuyerFilters = useMemo(
    () => hasProOrShop && buyerFilterPreferences.enable_buyer_filters,
    [hasProOrShop, buyerFilterPreferences.enable_buyer_filters]
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
      String(a.name).localeCompare(String(b.name), "bs", { sensitivity: "base" })
    );
  }, [sellerItems]);

  const visibleCategoryOptions = useMemo(() => {
    const term = categorySearchText.trim().toLowerCase();
    if (!term) return categoryOptions;
    return categoryOptions.filter((category) =>
      String(category.name).toLowerCase().includes(term)
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

        if (
          buyerFilterPreferences.buyer_filters_show_video &&
          onlyVideo
        ) {
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
      console.log(error);
    } finally {
      setIsSellerItemsLoading(false);
      setIsSellerItemLoadMore(false);
    }
  };

  const handleLike = useCallback((itemId) => {
    setSellerItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_liked: !item.is_liked } : item
      )
    );
  }, []);

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
        (buyerFilterPreferences.buyer_filters_show_featured && onlyFeatured)
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
        const itemCategoryId = String(item?.category_id ?? item?.category?.id ?? "");
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
      : "Ovaj prodavač trenutno nema oglasa.");

  const emptyStateLabel = hasActiveBuyerFilters
    ? "Nema oglasa za odabrane filtere."
    : showEmptyLabel;

  useEffect(() => {
    if (!canUseBuyerFilters) {
      setActiveFilterPanel(null);
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
      className={`group flex items-center gap-2 rounded-full border px-3 py-2 whitespace-nowrap outline-none select-none transition-all duration-200 active:scale-95 ${
        active
          ? "border-blue-500 bg-blue-50/80 text-blue-700 shadow-sm ring-2 ring-blue-100 ring-offset-0 dark:border-blue-400 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/30"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      }`}
    >
      <Icon
        className={`h-4 w-4 flex-shrink-0 transition-colors ${
          active
            ? "text-blue-600 dark:text-blue-300"
            : "text-gray-500 group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-200"
        }`}
      />
      <span className="hidden text-sm font-medium sm:inline">{label}</span>
      {count > 0 && (
        <span className="min-w-[18px] rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white shadow-sm">
          {count}
        </span>
      )}
    </button>
  );

  const searchFilterCount =
    buyerFilterPreferences.buyer_filters_show_search && searchText.trim() ? 1 : 0;
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

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center gap-2 py-1 pr-2">
              {canUseBuyerFilters && (
                <>
                  <div className="mr-2 flex flex-shrink-0 items-center gap-2 pl-1">
                    <div className="rounded-md bg-gray-100 p-1.5 dark:bg-slate-800">
                      <SlidersHorizontal className="h-4 w-4 text-gray-700 dark:text-slate-200" />
                    </div>
                    <span className="hidden text-sm font-bold text-gray-900 dark:text-slate-100 lg:inline">
                      Filteri
                    </span>
                  </div>

                  <div className="mx-1 hidden h-6 w-px flex-shrink-0 bg-gray-200 dark:bg-slate-700 sm:block" />

                  {buyerFilterPreferences.buyer_filters_show_search && (
                    <FilterPill
                      icon={Search}
                      label="Pretraga"
                      count={searchFilterCount}
                      active={searchFilterCount > 0 || activeFilterPanel === "search"}
                      onClick={() =>
                        setActiveFilterPanel((prev) =>
                          prev === "search" ? null : "search"
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
                          prev === "category" ? null : "category"
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
                          prev === "price" ? null : "price"
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
                      className="ml-1 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Reset filtera</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Select value={sortBy} onValueChange={handleSortBy}>
              <SelectTrigger className="h-10 w-full border-gray-200 bg-white font-medium focus:ring-1 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 sm:w-[170px]">
                <div className="mr-1 inline-flex items-center gap-2 text-gray-600 dark:text-slate-300">
                  <IconArrowsSort className="h-4 w-4" stroke={1.7} />
                  <span className="hidden sm:inline">Sortiraj</span>
                </div>
                <SelectValue placeholder="Sortiraj po" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900">
                <SelectGroup>
                  <SelectItem value="new-to-old">
                    <span className="flex items-center gap-2">
                      <IconClock className="h-4 w-4" stroke={1.7} />
                      <span>Najnovije prvo</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="old-to-new">
                    <span className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 rotate-180" stroke={1.7} />
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

            <div className="inline-flex w-fit items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => toggleView("list")}
                className={`rounded-md p-2 transition-all ${
                  view === "list"
                    ? "bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-primary"
                    : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
                aria-label="Listni prikaz"
              >
                <IconListDetails className="h-4 w-4" stroke={1.7} />
              </button>
              <button
                type="button"
                onClick={() => toggleView("grid")}
                className={`rounded-md p-2 transition-all ${
                  view === "grid"
                    ? "bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-primary"
                    : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
                aria-label="Mrežni prikaz"
              >
                <IconLayoutGrid className="h-4 w-4" stroke={1.7} />
              </button>
            </div>
          </div>
        </div>

        {canUseBuyerFilters &&
          ((activeFilterPanel === "search" &&
            buyerFilterPreferences.buyer_filters_show_search) ||
            (activeFilterPanel === "category" &&
              buyerFilterPreferences.buyer_filters_show_category) ||
            (activeFilterPanel === "price" &&
              buyerFilterPreferences.buyer_filters_show_price)) && (
            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-slate-800">
              {activeFilterPanel === "search" &&
                buyerFilterPreferences.buyer_filters_show_search && (
                  <Input
                    className="h-10 border-gray-200 dark:border-slate-700"
                    placeholder="Pretraga oglasa prodavača..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                )}

              {activeFilterPanel === "category" &&
                buyerFilterPreferences.buyer_filters_show_category && (
                  <div className="space-y-3">
                    <Input
                      className="h-10 border-gray-200 dark:border-slate-700"
                      placeholder="Pretraži kategorije..."
                      value={categorySearchText}
                      onChange={(e) => setCategorySearchText(e.target.value)}
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId("all")}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                          selectedCategoryId === "all"
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-200"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        Sve kategorije
                      </button>

                      {visibleCategoryOptions.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setSelectedCategoryId(category.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                            selectedCategoryId === category.id
                              ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-200"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          <span className="max-w-[170px] truncate">{category.name}</span>
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {category.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {visibleCategoryOptions.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-slate-400">
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
                      className="h-10 border-gray-200 dark:border-slate-700"
                      placeholder="Min cijena"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                    />
                    <Input
                      type="number"
                      min="0"
                      className="h-10 border-gray-200 dark:border-slate-700"
                      placeholder="Max cijena"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                    />
                  </div>
                )}
            </div>
          )}
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
                className="col-span-6 lg:col-span-4 2xl:col-span-3"
                key={item.id || index}
              >
                <ProductCard item={item} handleLike={handleLike} trackingParams={{ ref: "seller" }} />
              </div>
            )
          )
        ) : (
          <div className="col-span-12">
            <NoData name={emptyStateLabel} />
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
  );
};

export default SellerLsitings;
