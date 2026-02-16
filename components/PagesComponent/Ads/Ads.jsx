"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";
import Filter from "../../Filter/Filter";
import {
  allItemApi,
  FeaturedSectionApi,
  categoryApi,
  getCustomFieldsApi,
  getParentCategoriesApi,
} from "@/utils/api";
import ProductCard from "@/components/Common/ProductCard";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TbTransferVertical } from "@/components/Common/UnifiedIconPack";
import ProductHorizontalCard from "@/components/Common/ProductHorizontalCard";
import ProductCardSkeleton from "@/components/Common/ProductCardSkeleton";
import ProductHorizontalCardSkeleton from "@/components/Common/ProductHorizontalCardSkeleton";
import NoData from "@/components/EmptyStates/NoData";
import { IoGrid } from "@/components/Common/UnifiedIconPack";
import { CiGrid2H } from "@/components/Common/UnifiedIconPack";
import { Badge } from "@/components/ui/badge";
import { IoMdClose } from "@/components/Common/UnifiedIconPack";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import Layout from "@/components/Layout/Layout";
import { useAdaptiveMobileDock } from "@/components/Layout/AdaptiveMobileDock";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import {
  BreadcrumbPathData,
  setBreadcrumbPath,
} from "@/redux/reducer/breadCrumbSlice";
import { t, updateMetadata } from "@/utils";
import { getSelectedLocation, setHideMobileBottomNav } from "@/redux/reducer/globalStateSlice";
import { resolveMembership } from "@/lib/membership";
import { isSellerVerified } from "@/lib/seller-verification";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  List,
  LayoutGrid,
} from "@/components/Common/UnifiedIconPack";

// ✅ NOVO: Saved searches controls
import SavedSearchControls from "./SavedSearchControls";

// ============================================
// TRACKING IMPORT
// ============================================
import { useSearchTracking } from "@/hooks/useItemTracking";

const buildQuickNavigationCategories = (items = [], categorySlugById = new Map()) => {
  const categoryMap = new Map();

  (items || []).forEach((item) => {
    const category = item?.category || null;
    const categoryId = Number(category?.id || item?.category_id);
    const slugFromId = Number.isFinite(categoryId) ? categorySlugById.get(categoryId) : null;
    const slug = category?.slug || item?.category_slug || slugFromId || null;
    if (!slug) return;

    const key = String(slug).toLowerCase();
    const label =
      category?.translated_name ||
      category?.name ||
      item?.translated_category_name ||
      item?.category_name ||
      String(slug).replace(/-/g, " ");

    const existing = categoryMap.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }

    categoryMap.set(key, {
      slug,
      label,
      count: 1,
    });
  });

  return Array.from(categoryMap.values()).sort((a, b) => {
    if ((b.count || 0) !== (a.count || 0)) return (b.count || 0) - (a.count || 0);
    return String(a.label || "").localeCompare(String(b.label || ""));
  });
};

const Ads = () => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const mobileDock = useAdaptiveMobileDock();
  const newSearchParams = new URLSearchParams(searchParams);
  const BreadcrumbPath = useSelector(BreadcrumbPathData);

  // ============================================
  // SEARCH TRACKING HOOK
  // ============================================
  const { trackSearchImpressions, trackSearchClick, getSearchId, getLastImpressionId } = useSearchTracking();
  const lastImpressionIdRef = useRef(null);
  const searchIdRef = useRef(null);

  const [view, setView] = useState("grid");
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [isMobileHeaderHidden, setIsMobileHeaderHidden] = useState(false);
  const filterRailRef = useRef(null);
  const hideHeaderRef = useRef(false);
  const filterTriggerTopRef = useRef(0);
  const filterTriggerBottomRef = useRef(0);
  const lastEmittedMobileHeaderRef = useRef(null);
  const latestItemsRequestRef = useRef(0);
  const [advertisements, setAdvertisements] = useState({
    data: [],
    currentPage: 1,
    hasMore: false,
    isLoading: false,
    isLoadMore: false,
  });
  const [featuredTitle, setFeaturedTitle] = useState("");
  const [categorySlugById, setCategorySlugById] = useState(() => new Map());
  const [searchQuickCategories, setSearchQuickCategories] = useState([]);
  const [isQuickCategoryLoading, setIsQuickCategoryLoading] = useState(false);

  const selectedLocation = useSelector(getSelectedLocation);

  const rawQuery =
    searchParams.get("query") ||
    searchParams.get("search") ||
    searchParams.get("q") ||
    "";
  const query = String(rawQuery).trim();
  const slug = searchParams.get("category") || "";
  const country = searchParams.get("country") || "";
  const state = searchParams.get("state") || "";
  const city = searchParams.get("city") || "";
  const area = searchParams.get("area") || "";
  const areaId = Number(searchParams.get("areaId")) || "";
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const lat = latParam === null || latParam === "" ? null : Number(latParam);
  const lng = lngParam === null || lngParam === "" ? null : Number(lngParam);
  const min_price = searchParams.get("min_price")
    ? Number(searchParams.get("min_price"))
    : "";
  const max_price = searchParams.get("max_price")
    ? Number(searchParams.get("max_price"))
    : "";
  const date_posted = searchParams.get("date_posted") || "";
  const km_range = searchParams.get("km_range") || "";
  const sortBy = searchParams.get("sort_by") || "new-to-old";
  const langCode = searchParams.get("lang");
  const featured_section = searchParams.get("featured_section") || "";
  const sellerType = (searchParams.get("seller_type") || "").toLowerCase();
  const sellerVerified = searchParams.get("seller_verified") === "1";

  const isMinPrice =
    min_price !== "" &&
    min_price !== null &&
    min_price !== undefined &&
    min_price >= 0;

  const knownParams = [
    "country",
    "state",
    "city",
    "area",
    "areaId",
    "lat",
    "lng",
    "min_price",
    "max_price",
    "date_posted",
    "km_range",
    "sort_by",
    "category",
    "query",
    "search",
    "q",
    "lang",
    "featured_section",
    "seller_type",
    "seller_verified",
    "location",
    "page",
    "view",
    "ref",
    "search_id",
  ];

  const title = useMemo(() => {
    if (BreadcrumbPath.length === 2) {
      return BreadcrumbPath[1]?.name;
    }

    if (BreadcrumbPath.length > 2) {
      const last = BreadcrumbPath[BreadcrumbPath.length - 1]?.name;
      const secondLast = BreadcrumbPath[BreadcrumbPath.length - 2]?.name;
      return `${last} ${t("in")} ${secondLast}`;
    }

    return t("ads");
  }, [BreadcrumbPath, t]);

  const category =
    BreadcrumbPath.length > 1 &&
    BreadcrumbPath[BreadcrumbPath.length - 1]?.name;

  const [customFields, setCustomFields] = useState([]);

  const initialExtraDetails = useMemo(() => {
    const temprorayExtraDet = {};
    Array.from(searchParams.entries() || []).forEach(([key, value]) => {
      const isCustomFieldKey = /^\d+$/.test(String(key));
      if (!knownParams?.includes(key) && isCustomFieldKey) {
        temprorayExtraDet[key] = value?.includes(",")
          ? value?.split(",")
          : value;
      }
    });
    return temprorayExtraDet;
  }, [
    JSON.stringify(
      Array.from(searchParams.entries()).filter(
        ([key]) => !knownParams.includes(key)
      )
    ),
  ]);

  const [extraDetails, setExtraDetails] = useState(initialExtraDetails);
  const hasSellerTypeFilter = Boolean(sellerType && sellerType !== "all");
  const hasSellerVerifiedFilter = sellerVerified;

  const getSellerTypeLabel = () => {
    if (sellerType === "shop") return "Samo SHOP";
    if (sellerType === "pro") return "Samo PRO";
    if (sellerType === "free") return "Samo obični korisnici";
    if (sellerType === "premium") return "PRO + SHOP";
    return "";
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (country || state || city || areaId) count++;
    if (km_range) count++;
    if (category) count++;
    if (featured_section) count++;
    if (hasSellerTypeFilter) count++;
    if (hasSellerVerifiedFilter) count++;
    if (query) count++;
    if (date_posted) count++;
    if (isMinPrice && max_price) count++;
    if (initialExtraDetails && Object.keys(initialExtraDetails).length > 0) {
      count += Object.keys(initialExtraDetails).length;
    }
    return count;
  };

  const activeFilterCount = getActiveFilterCount();
  const quickNavigationCategories = useMemo(() => {
    if (!query) return [];
    if (isQuickCategoryLoading) return searchQuickCategories;
    if (searchQuickCategories.length > 0) return searchQuickCategories;
    return buildQuickNavigationCategories(advertisements?.data || [], categorySlugById);
  }, [query, isQuickCategoryLoading, searchQuickCategories, advertisements?.data, categorySlugById]);
  const isToolbarActionSheetOpen = isSortSheetOpen || isViewSheetOpen;
  const selectedLocationLabel =
    selectedLocation?.translated_name ||
    selectedLocation?.name ||
    [area, city, state, country].filter(Boolean).join(", ");

  useEffect(() => {
    if (!mobileDock) return undefined;
    const suspendKey = "ads-mobile-floating-utility";
    const shouldSuspendDock = Boolean(isMobile && isMobileHeaderHidden);
    mobileDock.setSuspended?.(suspendKey, shouldSuspendDock);

    return () => {
      mobileDock.clearSuspended?.(suspendKey);
    };
  }, [mobileDock, isMobile, isMobileHeaderHidden]);

  useEffect(() => {
    let cancelled = false;

    const mapCategoryTree = (nodes = [], map = new Map()) => {
      (nodes || []).forEach((node) => {
        const id = Number(node?.id);
        const slug = node?.slug;
        if (Number.isFinite(id) && slug) {
          map.set(id, slug);
        }
        if (Array.isArray(node?.subcategories) && node.subcategories.length > 0) {
          mapCategoryTree(node.subcategories, map);
        }
      });
      return map;
    };

    const loadCategorySlugMap = async () => {
      try {
        const response = await categoryApi.getCategory({ page: 1, per_page: 100 });
        const roots = response?.data?.data?.data || [];
        const slugMap = mapCategoryTree(roots, new Map());
        if (!cancelled) {
          setCategorySlugById(slugMap);
        }
      } catch (error) {
        if (!cancelled) {
          setCategorySlugById(new Map());
        }
      }
    };

    loadCategorySlugMap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const shouldHideBottomNav = Boolean(isMobile && isMobileHeaderHidden);
    dispatch(setHideMobileBottomNav(shouldHideBottomNav));
  }, [dispatch, isMobile, isMobileHeaderHidden]);

  useEffect(() => {
    return () => {
      dispatch(setHideMobileBottomNav(false));
    };
  }, [dispatch]);

  const emitMobileHeaderState = useCallback((payload) => {
    if (typeof window === "undefined") return;

    const nextDetail = {
      enabled: true,
      hideHeader: !!payload.hideHeader,
      searchIconMode: !!payload.searchIconMode,
      compactActions: !!payload.compactActions,
      sortBy,
      view,
    };

    const prevDetail = lastEmittedMobileHeaderRef.current;
    if (
      prevDetail &&
      prevDetail.enabled === nextDetail.enabled &&
      prevDetail.hideHeader === nextDetail.hideHeader &&
      prevDetail.searchIconMode === nextDetail.searchIconMode &&
      prevDetail.compactActions === nextDetail.compactActions &&
      prevDetail.sortBy === nextDetail.sortBy &&
      prevDetail.view === nextDetail.view
    ) {
      return;
    }

    lastEmittedMobileHeaderRef.current = nextDetail;
    window.dispatchEvent(
      new CustomEvent("lmx:ads-mobile-header-state", {
        detail: nextDetail,
      })
    );
  }, [sortBy, view]);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileHeaderHidden(false);
      hideHeaderRef.current = false;
      filterTriggerTopRef.current = 0;
      filterTriggerBottomRef.current = 0;
      if (typeof window !== "undefined") {
        lastEmittedMobileHeaderRef.current = null;
        window.dispatchEvent(
          new CustomEvent("lmx:ads-mobile-header-state", {
            detail: { enabled: false, hideHeader: false, searchIconMode: false },
          })
        );
      }
      return undefined;
    }

    if (typeof window === "undefined") return undefined;

    let ticking = false;
    hideHeaderRef.current = isMobileHeaderHidden;

    const measureFilterTriggerTop = () => {
      const rail = filterRailRef.current;
      if (!rail) {
        filterTriggerTopRef.current = 0;
        filterTriggerBottomRef.current = 0;
        return;
      }

      const railRect = rail.getBoundingClientRect();
      const railTop = Math.max(0, Math.round(railRect.top + window.scrollY));
      const railHeight = Math.max(0, Math.round(railRect.height || 0));

      filterTriggerTopRef.current = railTop;
      filterTriggerBottomRef.current = railTop + railHeight;
    };

    const commitMobileUi = (nextHideHeader) => {
      if (nextHideHeader !== hideHeaderRef.current) {
        hideHeaderRef.current = nextHideHeader;
        setIsMobileHeaderHidden(nextHideHeader);
      }

      emitMobileHeaderState({
        hideHeader: nextHideHeader,
        searchIconMode: false,
        compactActions: false,
      });
    };

    const updateMobileUi = () => {
      const currentScrollY = window.scrollY || 0;

      const stickyStartPoint = filterTriggerBottomRef.current || filterTriggerTopRef.current;
      const triggerY = Math.max(0, stickyStartPoint - 14);
      const resetY = Math.max(0, filterTriggerTopRef.current - 88);

      let nextHideHeader = hideHeaderRef.current;

      if (isToolbarActionSheetOpen) {
        nextHideHeader = false;
      } else if (currentScrollY >= triggerY) {
        nextHideHeader = true;
      } else if (currentScrollY <= resetY) {
        nextHideHeader = false;
      }
      commitMobileUi(nextHideHeader);
    };

    measureFilterTriggerTop();
    updateMobileUi();
    const postLayoutMeasurementId = window.requestAnimationFrame(() => {
      measureFilterTriggerTop();
      updateMobileUi();
    });

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateMobileUi();
        ticking = false;
      });
    };
    const onResize = () => {
      measureFilterTriggerTop();
      updateMobileUi();
    };

    const onForceHeaderReset = () => {
      hideHeaderRef.current = false;
      setIsMobileHeaderHidden(false);
      measureFilterTriggerTop();
      emitMobileHeaderState({
        hideHeader: false,
        searchIconMode: false,
        compactActions: false,
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("lmx:ads-mobile-toolbar-reset", onForceHeaderReset);

    return () => {
      window.cancelAnimationFrame(postLayoutMeasurementId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("lmx:ads-mobile-toolbar-reset", onForceHeaderReset);
      lastEmittedMobileHeaderRef.current = null;
      filterTriggerTopRef.current = 0;
      filterTriggerBottomRef.current = 0;
      window.dispatchEvent(
        new CustomEvent("lmx:ads-mobile-header-state", {
          detail: { enabled: false, hideHeader: false, searchIconMode: false },
        })
      );
    };
  }, [emitMobileHeaderState, isMobile, isToolbarActionSheetOpen]);

  useEffect(() => {
    const fetchFeaturedSectionData = async () => {
      try {
        const response = await FeaturedSectionApi.getFeaturedSections({
          slug: featured_section,
        });
        if (response?.data?.error === false) {
          setFeaturedTitle(
            response?.data?.data?.[0]?.translated_name ||
              response?.data?.data?.[0]?.title
          );
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    if (featured_section) {
      fetchFeaturedSectionData();
    }
  }, [langCode, featured_section]);

  useEffect(() => {
    if (slug) {
      constructBreadcrumbPath();
    } else {
      dispatch(
        setBreadcrumbPath([
          {
            name: t("allCategories"),
            key: "all-categories",
            slug: "/ads",
            isAllCategories: true,
          },
        ])
      );
      setCustomFields([]);
      setExtraDetails({});
    }
  }, [slug, langCode]);

  const getCustomFieldsData = async (categoryIds) => {
    try {
      const res = await getCustomFieldsApi.getCustomFields({
        category_ids: categoryIds,
        filter: true,
      });
      const data = res?.data?.data;
      setCustomFields(data);
      const isShowCustomfieldFilter =
        data.length > 0 &&
        data.some(
          (field) =>
            field.type === "checkbox" ||
            field.type === "radio" ||
            field.type === "dropdown"
        );

      if (isShowCustomfieldFilter) {
        const initialExtraDetails = {};
        data.forEach((field) => {
          const value = searchParams.get(field.id);
          if (value) {
            initialExtraDetails[field.id] =
              field.type === "checkbox" ? value.split(",") : value;
          }
        });
        setExtraDetails(initialExtraDetails);
      } else {
        setExtraDetails({});
      }
    } catch (error) {
      console.log(error);
    }
  };

  const constructBreadcrumbPath = async () => {
    try {
      const res = await getParentCategoriesApi.getPaymentCategories({
        slug,
        tree: 0,
      });
      const data = res?.data?.data || [];
      const selectedCategory = data?.at(-1);

      if (selectedCategory) {
        updateMetadata({
          title: selectedCategory.translated_name,
          description: selectedCategory.translated_description,
        });
      }
      const breadcrumbArray = [
        {
          name: t("allCategories"),
          key: "all-categories",
          slug: "/ads",
          isAllCategories: true,
        },
        ...data.map((item) => ({
          name: item.translated_name,
          key: item.slug,
          slug: `/ads?category=${item.slug}`,
        })),
      ];
      dispatch(setBreadcrumbPath(breadcrumbArray));
      const categoryIds = data.map((category) => category.id).join(",");
      await getCustomFieldsData(categoryIds);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSingleCatItem(1);
  }, [
    lat,
    lng,
    areaId,
    city,
    state,
    country,
    min_price,
    max_price,
    date_posted,
    km_range,
    sortBy,
    initialExtraDetails,
    slug,
    query,
    langCode,
    featured_section,
    sellerType,
    sellerVerified,
  ]);

  const matchSellerType = useCallback((membership) => {
    if (!hasSellerTypeFilter) return true;
    if (sellerType === "shop") return membership.isShop;
    if (sellerType === "pro") return membership.isPro && !membership.isShop;
    if (sellerType === "free") return !membership.isPro && !membership.isShop;
    if (sellerType === "premium") return membership.isPro || membership.isShop;
    return true;
  }, [hasSellerTypeFilter, sellerType]);

  const applySellerFilters = useCallback((items = []) => {
    if (!hasSellerTypeFilter && !hasSellerVerifiedFilter) return items;
    return items.filter((item) => {
      const membership = resolveMembership(
        item,
        item?.membership,
        item?.user,
        item?.user?.membership
      );
      const typeMatch = matchSellerType(membership);
      if (!typeMatch) return false;
      if (!hasSellerVerifiedFilter) return true;
      return isSellerVerified(item, item?.user, item?.seller);
    });
  }, [hasSellerTypeFilter, hasSellerVerifiedFilter, matchSellerType]);

  useEffect(() => {
    const normalizedQuery = String(query || "").trim();
    if (normalizedQuery.length < 2) {
      setSearchQuickCategories([]);
      setIsQuickCategoryLoading(false);
      return;
    }

    // Fast path: derive quick categories from already loaded cards
    // instead of triggering a second network request.
    setIsQuickCategoryLoading(false);
    const categories = buildQuickNavigationCategories(advertisements?.data || [], categorySlugById).slice(0, 8);
    setSearchQuickCategories(categories);
  }, [query, advertisements?.data, categorySlugById]);

  const getSingleCatItem = async (page) => {
    const requestId = ++latestItemsRequestRef.current;
    try {
      const parameters = { page, limit: 12 };
      if (sortBy) parameters.sort_by = sortBy;
      if (isMinPrice) parameters.min_price = min_price;
      if (max_price) parameters.max_price = max_price;
      if (date_posted) parameters.posted_since = date_posted;
      if (slug) parameters.category_slug = slug;
      if (extraDetails) parameters.custom_fields = extraDetails;
      if (featured_section) parameters.featured_section_slug = featured_section;
      if (hasSellerTypeFilter) {
        parameters.seller_type = sellerType;
        if (sellerType === "shop") {
          parameters.is_shop = 1;
          parameters.shop = 1;
        } else if (sellerType === "pro") {
          parameters.is_pro = 1;
          parameters.membership = "pro";
        } else if (sellerType === "free") {
          parameters.is_free = 1;
        } else if (sellerType === "premium") {
          parameters.is_premium = 1;
        }
      }
      if (hasSellerVerifiedFilter) {
        parameters.seller_verified = 1;
        parameters.verified = 1;
      }

      const hasValidCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
      if (Number(km_range) > 0 && hasValidCoordinates) {
        parameters.latitude = lat;
        parameters.longitude = lng;
        parameters.radius = km_range;
      } else {
        if (areaId) {
          parameters.area_id = areaId;
        } else if (city) {
          parameters.city = city;
        } else if (state) {
          parameters.state = state;
        } else if (country) {
          parameters.country = country;
        }
      }
      if (query) {
        parameters.search = query;
      }
      page === 1
        ? setAdvertisements((prev) => ({ ...prev, isLoading: !prev?.data?.length }))
        : setAdvertisements((prev) => ({ ...prev, isLoadMore: true }));

      const res = await allItemApi.getItems(parameters);
      if (requestId !== latestItemsRequestRef.current) return;
      const data = res?.data;

      if (data.error === false) {
        const rawItems = data?.data?.data || [];
        const items = applySellerFilters(rawItems);

        page > 1
          ? setAdvertisements((prev) => ({
              ...prev,
              data: [...prev.data, ...items],
              currentPage: data?.data?.current_page,
              hasMore: data?.data?.last_page > data?.data?.current_page,
            }))
          : setAdvertisements((prev) => ({
              ...prev,
              data: items,
              currentPage: data?.data?.current_page,
              hasMore: data?.data?.last_page > data?.data?.current_page,
            }));

        // ✅ TRACK SEARCH IMPRESSIONS
        if (items.length > 0) {
          const itemIds = items.map((item) => item.id);
          const filters = {
            min_price: isMinPrice ? min_price : null,
            max_price: max_price || null,
            location: city || state || country || null,
            extra: extraDetails || null,
          };
          const searchContext = {
            search_query: query || null,
            category_slug: slug || null,
            sort_by: sortBy,
            featured_section: featured_section || null,
            seller_type: sellerType || null,
            seller_verified: hasSellerVerifiedFilter ? 1 : null,
            filters,
          };
          const searchId = getSearchId(searchContext);
          searchIdRef.current = searchId;

          // Do not block cards rendering on tracking endpoint latency.
          void trackSearchImpressions(itemIds, {
            ...searchContext,
            results_count: items.length,
            page,
          }).then(() => {
            lastImpressionIdRef.current = getLastImpressionId();
          });
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      if (requestId !== latestItemsRequestRef.current) return;
      setAdvertisements((prev) => ({
        ...prev,
        isLoading: false,
        isLoadMore: false,
      }));
    }
  };

  const handleProdLoadMore = async () => {
    setAdvertisements((prev) => ({ ...prev, isLoadMore: true }));
    await getSingleCatItem(advertisements.currentPage + 1);
  };

  const handleSortBy = (value) => {
    newSearchParams.set("sort_by", value);
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const sortOptions = [
    { value: "new-to-old", label: "Najnoviji prvo" },
    { value: "old-to-new", label: "Najstariji prvo" },
    { value: "price-high-to-low", label: "Cijena: od više ka nižoj" },
    { value: "price-low-to-high", label: "Cijena: od niže ka višoj" },
    { value: "popular_items", label: "Najpopularniji" },
  ];

  const activeSortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label || "Poredaj oglase";

  const contentSectionTransition = {
    type: "spring",
    stiffness: 280,
    damping: 30,
    mass: 0.9,
  };

  const cardAnimation = {
    hidden: { opacity: 0, y: 14, scale: 0.992 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: Math.min(index, 7) * 0.028,
        duration: 0.26,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  const handleLike = (id) => {
    const updatedItems = advertisements.data.map((item) => {
      if (item.id === id) {
        return { ...item, is_liked: !item.is_liked };
      }
      return item;
    });
    setAdvertisements((prev) => ({ ...prev, data: updatedItems }));
  };

  // ✅ HANDLE ITEM CLICK - Track search click
  const handleItemClick = (itemId, position) => {
    trackSearchClick(itemId, (position || 0) + 1, lastImpressionIdRef.current, {
      search_id: searchIdRef.current || null,
      search_query: query || null,
      page: advertisements.currentPage || 1,
    });
  };

  const handleClearLocation = () => {
    newSearchParams.delete("country");
    newSearchParams.delete("state");
    newSearchParams.delete("city");
    newSearchParams.delete("area");
    newSearchParams.delete("areaId");
    newSearchParams.delete("lat");
    newSearchParams.delete("lng");
    newSearchParams.delete("km_range");
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleClearRange = () => {
    newSearchParams.delete("km_range");
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleClearDatePosted = () => {
    newSearchParams.delete("date_posted");
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleClearBudget = () => {
    newSearchParams.delete("min_price");
    newSearchParams.delete("max_price");
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleClearFeaturedSection = () => {
    newSearchParams.delete("featured_section");
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleClearCategory = () => {
    newSearchParams.delete("category");
    Object.keys(extraDetails || {})?.forEach((key) => {
      newSearchParams.delete(key);
    });
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleClearExtraDetail = (keyToRemove) => {
    const updatedExtraDetails = { ...extraDetails };
    delete updatedExtraDetails[keyToRemove];
    setExtraDetails(updatedExtraDetails);
    newSearchParams.delete(keyToRemove);
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleClearAll = () => {
    newSearchParams.delete("country");
    newSearchParams.delete("state");
    newSearchParams.delete("city");
    newSearchParams.delete("area");
    newSearchParams.delete("areaId");
    newSearchParams.delete("lat");
    newSearchParams.delete("lng");
    newSearchParams.delete("km_range");
    newSearchParams.delete("date_posted");
    newSearchParams.delete("min_price");
    newSearchParams.delete("max_price");
    newSearchParams.delete("category");
    newSearchParams.delete("query");
    newSearchParams.delete("search");
    newSearchParams.delete("q");
    newSearchParams.delete("featured_section");
    newSearchParams.delete("seller_type");
    newSearchParams.delete("seller_verified");
    Object.keys(initialExtraDetails || {})?.forEach((key) => {
      newSearchParams.delete(key);
    });
    setExtraDetails({});
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleClearQuery = () => {
    newSearchParams.delete("query");
    newSearchParams.delete("search");
    newSearchParams.delete("q");
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleQuickCategoryNavigate = useCallback((categorySlug) => {
    const params = new URLSearchParams(window.location.search);
    if (categorySlug) {
      params.set("category", categorySlug);
    } else {
      params.delete("category");
    }
    params.delete("page");
    window.history.pushState(null, "", `/ads?${params.toString()}`);
    window.dispatchEvent(new Event("popstate"));
  }, []);

  const handleClearSellerType = () => {
    newSearchParams.delete("seller_type");
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const handleClearSellerVerified = () => {
    newSearchParams.delete("seller_verified");
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const postedSince =
    date_posted === "all-time"
      ? "Svi oglasi"
      : date_posted === "today"
      ? "Danas"
      : date_posted === "within-1-week"
      ? "U proteklih 7 dana"
      : date_posted === "within-2-week"
      ? "U proteklih 14 dana"
      : date_posted === "within-1-month"
      ? "U proteklih 30 dana"
      : date_posted === "within-3-month"
      ? "U protekla 3 mjeseca"
      : "";

  const FilterTag = ({ label, onClear }) => (
    <Badge
      variant="secondary"
      className="px-3 py-1.5 h-auto text-sm font-medium flex items-center gap-2 rounded-lg bg-primary/10 text-primary border border-primary/10 transition-all hover:bg-primary/20 hover:border-primary/20 cursor-default"
    >
      <span className="truncate max-w-[200px]">{label}</span>
      <IoMdClose
        size={16}
        className="cursor-pointer text-primary/70 hover:text-primary transition-colors shrink-0"
        onClick={onClear}
      />
    </Badge>
  );

  const MobileActionButton = ({
    icon: Icon,
    label,
    active = false,
    badge,
    onClick,
    iconClassName = "",
  }) => (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      onClick={onClick}
      className={`relative grid h-11 w-11 place-items-center rounded-full border border-slate-200/80 bg-white/80 p-1 transition-all duration-200 hover:scale-105 dark:border-slate-700 dark:bg-slate-900/75 ${
        active
          ? "border-primary/45 bg-primary/10 text-primary shadow-[0_8px_20px_-12px_rgba(15,118,110,0.45)] dark:border-primary/50 dark:bg-primary/20"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
      aria-label={label}
      title={label}
    >
      <Icon size={18} className={iconClassName} />
      {badge ? (
        <span className="absolute -right-1 -top-1 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-white text-[9px] font-semibold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
          {badge}
        </span>
      ) : null}
    </motion.button>
  );

  const MobileActionSheet = ({ open, onClose, title, children }) => {
    const openedAtRef = useRef(0);

    useEffect(() => {
      if (!open) return;
      openedAtRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();
    }, [open]);

    const handleBackdropClick = () => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (now - openedAtRef.current < 220) return;
      onClose();
    };

    return (
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Zatvori"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleBackdropClick}
              className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-[3px] md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
              className="fixed inset-x-0 bottom-0 z-[71] md:hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="rounded-t-[1.75rem] border border-slate-200 bg-white/95 px-4 pb-5 pt-3 shadow-[0_-20px_50px_-28px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_-20px_50px_-28px_rgba(2,6,23,0.85)]">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 px-1 pb-2 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Zatvori"
                  >
                    <IoMdClose size={16} />
                  </button>
                </div>
                {children}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    );
  };

  const renderMobileToolbar = (compact = false) => (
    <motion.div
      layout
      initial={false}
      animate={{
        scale: compact ? 0.985 : 1,
        y: compact ? 0 : 0,
      }}
      className={`inline-flex w-fit max-w-full items-center gap-2 rounded-[1.35rem] border px-3 py-2 ${
        compact
          ? "border-slate-200/85 bg-white/92 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700/85 dark:bg-slate-900/92 dark:shadow-[0_14px_28px_-24px_rgba(2,6,23,0.85)]"
          : "border-slate-200/90 bg-white/90 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
      }`}
      transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.85 }}
    >
      <SavedSearchControls iconOnly />
      <MobileActionButton
        icon={ArrowUpDown}
        label="Poredaj oglase"
        active={sortBy !== "new-to-old"}
        onClick={() => setIsSortSheetOpen(true)}
      />
      <MobileActionButton
        icon={view === "grid" ? LayoutGrid : List}
        label={view === "grid" ? "Mrežni prikaz" : "Prikaz liste"}
        active={view === "grid"}
        onClick={() => setIsViewSheetOpen(true)}
      />
    </motion.div>
  );

  return (
    <Layout>
      <BreadCrumb />

      <Filter
        railRef={filterRailRef}
        customFields={customFields}
        extraDetails={extraDetails}
        setExtraDetails={setExtraDetails}
        newSearchParams={newSearchParams}
        country={country}
        state={state}
        city={city}
        area={area}
        mobileCompact={isMobile && isMobileHeaderHidden}
        mobileStickyActive={!isMobile || isMobileHeaderHidden}
        mobileUtilityRenderer={isMobile ? renderMobileToolbar : null}
        mobileUtilityHidden={!isMobileHeaderHidden || isToolbarActionSheetOpen}
      />

      <motion.div
        layout
        initial={false}
        transition={contentSectionTransition}
        className="container mt-8"
      >
        <div className="flex flex-col gap-6">
          <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100"
          >
            <div className="space-y-1.5">
              {query && (quickNavigationCategories.length > 0 || isQuickCategoryLoading) ? (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm"
                >
                  <span className="font-medium text-slate-500 dark:text-slate-400">
                    Kategorije:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickCategoryNavigate("")}
                    className={`transition-colors ${
                      !slug
                        ? "font-semibold text-primary"
                        : "text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary"
                    }`}
                  >
                    Sve
                  </button>
                  {quickNavigationCategories.slice(0, 8).map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => handleQuickCategoryNavigate(cat.slug)}
                      className={`transition-colors ${
                        slug === cat.slug
                          ? "font-semibold text-primary"
                          : "text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-primary"
                      }`}
                      title={`Otvori kategoriju: ${cat.label}`}
                    >
                      {cat.label}
                      <span className="ml-1 text-[11px] text-slate-400 dark:text-slate-500">
                        ({cat.count})
                      </span>
                    </button>
                  ))}
                  {isQuickCategoryLoading && quickNavigationCategories.length === 0 ? (
                    <span className="text-slate-400 dark:text-slate-500">
                      Tražim kategorije...
                    </span>
                  ) : null}
                </motion.div>
              ) : null}
              <p className="text-sm text-gray-500 mt-1">
                {advertisements?.data?.length || 0}{" "}
                {((advertisements?.data?.length || 0) % 10 === 1 &&
                  (advertisements?.data?.length || 0) % 100 !== 11)
                  ? "rezultat"
                  : "rezultata"}
              </p>
            </div>

            <div className="hidden md:flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 md:justify-end w-full md:w-auto min-w-0">
              <div className="w-full sm:w-auto min-w-0">
                <SavedSearchControls />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <TbTransferVertical
                  className="text-gray-400 hidden sm:block"
                  size={18}
                />
                <Select value={sortBy} onValueChange={handleSortBy}>
                  <SelectTrigger className="w-full sm:w-[170px] h-10 border-gray-200 bg-white focus:ring-1 focus:ring-primary/20 font-medium">
                    <SelectValue placeholder="Poredaj oglase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200 w-fit">
                <button
                  onClick={() => setView("list")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    view === "list"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                  }`}
                  title="Prikaz liste"
                >
                  <CiGrid2H size={20} />
                </button>
                <button
                  onClick={() => setView("grid")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    view === "grid"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                  }`}
                  title="Mrežni prikaz"
                >
                  <IoGrid size={18} />
                </button>
              </div>
            </div>

          </motion.div>

          {activeFilterCount > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="text-sm font-medium text-gray-500 mr-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Filteri:
              </span>

              {category && (
                <motion.div layout>
                  <FilterTag
                    label={`Kategorija: ${category}`}
                    onClear={handleClearCategory}
                  />
                </motion.div>
              )}
              {query && (
                <motion.div layout>
                  <FilterTag
                    label={`Pretraga: ${query}`}
                    onClear={handleClearQuery}
                  />
                </motion.div>
              )}

              {(country || state || city || area) && (
                <motion.div layout>
                  <FilterTag
                    label={`Lokacija: ${selectedLocationLabel}`}
                    onClear={handleClearLocation}
                  />
                </motion.div>
              )}

              {Number(km_range) > 0 && (
                <motion.div layout>
                  <FilterTag
                    label={`U krugu: ${km_range} km`}
                    onClear={handleClearRange}
                  />
                </motion.div>
              )}

              {date_posted && (
                <motion.div layout>
                  <FilterTag
                    label={`Objavljeno: ${postedSince}`}
                    onClear={handleClearDatePosted}
                  />
                </motion.div>
              )}

              {isMinPrice && max_price && (
                <motion.div layout>
                  <FilterTag
                    label={`Budžet: ${min_price}-${max_price} KM`}
                    onClear={handleClearBudget}
                  />
                </motion.div>
              )}

              {featured_section && (
                <motion.div layout>
                  <FilterTag
                    label={`Izdvojena sekcija: ${featuredTitle}`}
                    onClear={handleClearFeaturedSection}
                  />
                </motion.div>
              )}

              {hasSellerTypeFilter && (
                <motion.div layout>
                  <FilterTag
                    label={`Prodavač: ${getSellerTypeLabel()}`}
                    onClear={handleClearSellerType}
                  />
                </motion.div>
              )}

              {hasSellerVerifiedFilter && (
                <motion.div layout>
                  <FilterTag
                    label="Prodavač: Samo verificirani"
                    onClear={handleClearSellerVerified}
                  />
                </motion.div>
              )}

              {initialExtraDetails &&
                Object.entries(initialExtraDetails || {}).map(([key, value]) => {
                  const field = customFields.find(
                    (f) => f.id.toString() === key.toString()
                  );
                  const fieldName = field?.translated_name || field?.name;

                  const getTranslatedValue = (val) => {
                    if (!field?.values || !field?.translated_value) return val;
                    const idx = field.values.indexOf(val);
                    return idx !== -1 ? field.translated_value[idx] : val;
                  };

                  const displayValue = Array.isArray(value)
                    ? value.map((v) => getTranslatedValue(v)).join(", ")
                    : getTranslatedValue(value);

                  return (
                    <motion.div key={key} layout>
                      <FilterTag
                        label={`${fieldName}: ${displayValue}`}
                        onClear={() => handleClearExtraDetail(key)}
                      />
                    </motion.div>
                  );
                })}

              {activeFilterCount > 1 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-500 hover:text-red-700 font-medium underline-offset-4 hover:underline transition-all ml-2"
                >
                  {t("clearAll")}
                </button>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-12 gap-6">
            {advertisements?.isLoading ? (
              Array.from({ length: 12 }).map((_, index) =>
                view === "list" ? (
                  <div className="col-span-12" key={index}>
                    <ProductHorizontalCardSkeleton />
                  </div>
                ) : (
                  <div
                    className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3"
                    key={index}
                  >
                    <ProductCardSkeleton />
                  </div>
                )
              )
            ) : advertisements.data && advertisements.data.length > 0 ? (
              advertisements.data?.map((item, index) =>
                view === "list" ? (
                  <motion.div
                    className="col-span-12"
                    key={item.id || index}
                    variants={cardAnimation}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    layout
                  >
                    <ProductHorizontalCard
                      item={item}
                      handleLike={handleLike}
                      onClick={() => handleItemClick(item.id, index)}
                      trackingParams={
                        searchIdRef.current
                          ? { search_id: searchIdRef.current, ref: "search" }
                          : undefined
                      }
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3"
                    key={item.id || index}
                    variants={cardAnimation}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    layout
                  >
                    <ProductCard
                      item={item}
                      handleLike={handleLike}
                      onClick={() => handleItemClick(item.id, index)}
                      trackingParams={
                        searchIdRef.current
                          ? { search_id: searchIdRef.current, ref: "search" }
                          : undefined
                      }
                    />
                  </motion.div>
                )
              )
            ) : (
              <div className="col-span-12 py-12 flex justify-center">
                <NoData name={t("ads")} />
              </div>
            )}
          </div>

          {advertisements.data &&
            advertisements.data.length > 0 &&
            advertisements.hasMore && (
              <div className="text-center mt-8 pb-12">
                <Button
                  variant="outline"
                  className="min-w-[200px] border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
                  disabled={advertisements.isLoading || advertisements.isLoadMore}
                  onClick={handleProdLoadMore}
                >
                  {advertisements.isLoadMore ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      Učitavanje...
                    </span>
                  ) : (
                    "Učitaj još"
                  )}
                </Button>
              </div>
            )}

          <MobileActionSheet
            open={isSortSheetOpen}
            onClose={() => setIsSortSheetOpen(false)}
            title="Poredaj oglase"
          >
            <div className="grid gap-2">
              {sortOptions.map((option) => {
                const isActive = sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      handleSortBy(option.value);
                      setIsSortSheetOpen(false);
                    }}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary dark:border-primary/50 dark:bg-primary/20"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </MobileActionSheet>

          <MobileActionSheet
            open={isViewSheetOpen}
            onClose={() => setIsViewSheetOpen(false)}
            title="Prikaz oglasa"
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setView("list");
                  setIsViewSheetOpen(false);
                }}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  view === "list"
                    ? "border-primary/40 bg-primary/10 text-primary dark:border-primary/50 dark:bg-primary/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                }`}
              >
                Prikaz liste
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("grid");
                  setIsViewSheetOpen(false);
                }}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  view === "grid"
                    ? "border-primary/40 bg-primary/10 text-primary dark:border-primary/50 dark:bg-primary/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                }`}
              >
                Mrežni prikaz
              </button>
            </div>
          </MobileActionSheet>

        </div>
      </motion.div>
    </Layout>
  );
};

export default Ads;
