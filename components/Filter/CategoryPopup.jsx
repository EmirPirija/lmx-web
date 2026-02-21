"use client";

import {
  X,
  Search,
  ChevronRight,
  LayoutGrid,
  ArrowRight,
  CornerDownRight,
  Loader2,
} from "@/components/Common/UnifiedIconPack";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useNavigate } from "../Common/useNavigate";
import useGetCategories from "../Layout/useGetCategories";
import { categoryApi } from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const RECENT_CATEGORY_STORAGE_KEY = "lmx:ads:recent-categories:v1";
const RECENT_CATEGORY_LIMIT = 8;
const MIN_SEARCH_LENGTH = 2;

const normalizeSearchText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const formatAdCount = (count) => {
  const num = Number(count) || 0;
  if (num === 0) return "0 oglasa";
  const mod10 = num % 10;
  const mod100 = num % 100;
  if (mod10 === 1 && mod100 !== 11) return `${num} oglas`;
  return `${num} oglasa`;
};

const formatSubcategoryCount = (count) => {
  const num = Number(count) || 0;
  if (num <= 0) return "Bez podkategorija";
  const mod10 = num % 10;
  const mod100 = num % 100;
  if (mod10 === 1 && mod100 !== 11) return "1 podkategorija";
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${num} podkategorije`;
  }
  return `${num} podkategorija`;
};

const getDisplayCount = (category) =>
  Number(category?.adCount ?? category?.all_items_count ?? category?.items_count ?? 0) || 0;

const getCategoryIdentifier = (category) =>
  category?.slug ? String(category.slug) : category?.id ? String(category.id) : "";

const flattenForLookup = (categories = []) => {
  const map = new Map();

  const walk = (nodes = [], parentPath = []) => {
    nodes.forEach((node) => {
      if (!node) return;
      const label = node?.translated_name || node?.name || "";
      const nextPath = label ? [...parentPath, label] : parentPath;
      const withPath = {
        ...node,
        __path: nextPath.join(" > "),
      };

      if (node?.id) map.set(node.id, withPath);
      const slug = node?.slug ? String(node.slug) : null;
      if (slug) map.set(slug, withPath);

      if (Array.isArray(node?.subcategories) && node.subcategories.length > 0) {
        walk(node.subcategories, nextPath);
      }
    });
  };

  walk(categories);
  return map;
};

const flattenForSearch = (categories = []) => {
  const results = [];

  const walk = (nodes = [], parentPath = []) => {
    nodes.forEach((node) => {
      if (!node) return;
      const label = node?.translated_name || node?.name || "";
      const nextPath = label ? [...parentPath, label] : parentPath;
      results.push({
        ...node,
        __path: nextPath.join(" > "),
        __label: label,
      });

      if (Array.isArray(node?.subcategories) && node.subcategories.length > 0) {
        walk(node.subcategories, nextPath);
      }
    });
  };

  walk(categories);
  return results;
};

const readRecentCategorySlugs = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_CATEGORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .slice(0, RECENT_CATEGORY_LIMIT);
  } catch {
    return [];
  }
};

const persistRecentCategorySlugs = (slugs = []) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      RECENT_CATEGORY_STORAGE_KEY,
      JSON.stringify(slugs.slice(0, RECENT_CATEGORY_LIMIT))
    );
  } catch {
    // no-op
  }
};

const CategorySkeleton = () => (
  <div className="space-y-3 p-2">
    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-3 dark:border-slate-700/70 dark:bg-slate-900"
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 bg-slate-200/80 dark:bg-slate-700/70" />
          <Skeleton className="h-3 w-20 bg-slate-200/70 dark:bg-slate-700/60" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full bg-slate-200/80 dark:bg-slate-700/70" />
      </div>
    ))}
  </div>
);

const CategoryPopup = ({ onClose, extraDetails }) => {
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParent, setSelectedParent] = useState(null);
  const [isLoadingSubsFor, setIsLoadingSubsFor] = useState(null);
  const [subcategoriesByParent, setSubcategoriesByParent] = useState(() => new Map());
  const [recentCategorySlugs, setRecentCategorySlugs] = useState([]);
  const [onlyWithAds, setOnlyWithAds] = useState(true);

  const subcategoryRequestsRef = useRef(new Set());
  const { cateData, isCatLoading, getCategories } = useGetCategories();

  const categoriesCount = Array.isArray(cateData) ? cateData.length : 0;
  const selectedCategorySlug = searchParams.get("category") || "";
  const trimmedSearchTerm = searchTerm.trim();
  const showSearchResults = trimmedSearchTerm.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    if (categoriesCount > 0) return;
    getCategories(1);
  }, [categoriesCount, getCategories]);

  useEffect(() => {
    setRecentCategorySlugs(readRecentCategorySlugs());
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const categoryLookup = useMemo(() => flattenForLookup(cateData || []), [cateData]);
  const categorySearchIndex = useMemo(() => flattenForSearch(cateData || []), [cateData]);
  const selectedCategory = useMemo(() => {
    if (!selectedCategorySlug) return null;
    return categoryLookup.get(selectedCategorySlug) || null;
  }, [selectedCategorySlug, categoryLookup]);
  const selectedCategoryLabel =
    selectedCategory?.translated_name || selectedCategory?.name || "Sve kategorije";
  const selectedCategoryPath = selectedCategory?.__path || null;

  const rootCategories = useMemo(() => {
    const source = Array.isArray(cateData) ? cateData : [];
    const filtered = onlyWithAds
      ? source.filter((category) => getDisplayCount(category) > 0 || Number(category?.subcategories_count) > 0)
      : source;
    return filtered;
  }, [cateData, onlyWithAds]);

  const popularCategories = useMemo(
    () =>
      [...rootCategories]
        .sort((a, b) => getDisplayCount(b) - getDisplayCount(a))
        .slice(0, 8),
    [rootCategories]
  );

  const recentCategories = useMemo(() => {
    if (!recentCategorySlugs.length) return [];
    return recentCategorySlugs
      .map((slug) => categoryLookup.get(slug))
      .filter(Boolean)
      .slice(0, RECENT_CATEGORY_LIMIT);
  }, [recentCategorySlugs, categoryLookup]);

  const filteredSearchResults = useMemo(() => {
    if (!showSearchResults) return [];
    const normalizedQuery = normalizeSearchText(trimmedSearchTerm);
    if (!normalizedQuery) return [];

    return categorySearchIndex
      .map((category) => {
        const label = normalizeSearchText(category?.translated_name || category?.name || "");
        const slug = normalizeSearchText(category?.slug || "");
        const path = normalizeSearchText(category?.__path || "");
        const count = getDisplayCount(category);
        if (onlyWithAds && count <= 0) return null;

        const exact = label === normalizedQuery;
        const startsWith = label.startsWith(normalizedQuery);
        const inLabel = label.includes(normalizedQuery);
        const inPath = path.includes(normalizedQuery);
        const inSlug = slug.includes(normalizedQuery);
        if (!exact && !startsWith && !inLabel && !inPath && !inSlug) return null;

        let score = 0;
        if (exact) score += 120;
        else if (startsWith) score += 90;
        else if (inLabel) score += 70;
        if (inPath) score += 30;
        if (inSlug) score += 10;
        score += Math.min(20, Math.log10(Math.max(count, 1)) * 10);

        return {
          ...category,
          adCount: count,
          search_name: category?.translated_name || category?.name || "Kategorija",
          _score: score,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b._score - a._score || getDisplayCount(b) - getDisplayCount(a))
      .slice(0, 60);
  }, [showSearchResults, trimmedSearchTerm, categorySearchIndex, onlyWithAds]);

  const selectedSubcategories = useMemo(() => {
    if (!selectedParent?.id) return [];
    const cached = subcategoriesByParent.get(selectedParent.id) || [];
    if (!onlyWithAds) return cached;
    return cached.filter((category) => getDisplayCount(category) > 0 || Number(category?.subcategories_count) > 0);
  }, [selectedParent, subcategoriesByParent, onlyWithAds]);

  const saveRecentCategory = useCallback((slug) => {
    const normalized = String(slug || "").trim();
    if (!normalized) return;
    setRecentCategorySlugs((previous) => {
      const next = [normalized, ...previous.filter((item) => item !== normalized)].slice(
        0,
        RECENT_CATEGORY_LIMIT
      );
      persistRecentCategorySlugs(next);
      return next;
    });
  }, []);

  const selectCategory = useCallback(
    (category) => {
      const identifier = getCategoryIdentifier(category);
      const newSearchParams = new URLSearchParams(searchParams);

      if (identifier) newSearchParams.set("category", identifier);
      else newSearchParams.delete("category");

      Object.keys(extraDetails || {}).forEach((key) => newSearchParams.delete(key));
      if (category?.slug) saveRecentCategory(category.slug);

      const nextQuery = newSearchParams.toString();
      const nextUrl = `/ads${nextQuery ? `?${nextQuery}` : ""}`;
      if (pathname?.startsWith("/ads")) {
        window.history.pushState(null, "", nextUrl);
      } else {
        navigate(nextUrl);
      }
      onClose?.();
    },
    [searchParams, extraDetails, pathname, navigate, onClose, saveRecentCategory]
  );

  const handleResetCategory = useCallback(() => {
    selectCategory({ slug: null });
  }, [selectCategory]);

  const fetchSubcategories = useCallback(
    async (parentCategory) => {
      const parentId = Number(parentCategory?.id);
      if (!Number.isFinite(parentId) || parentId <= 0) return;
      if (subcategoriesByParent.has(parentId)) return;
      if (subcategoryRequestsRef.current.has(parentId)) return;

      subcategoryRequestsRef.current.add(parentId);
      setIsLoadingSubsFor(parentId);
      try {
        const response = await categoryApi.getCategory({
          category_id: parentId,
          page: 1,
          per_page: 120,
        });
        const loaded = response?.data?.data?.data || [];
        setSubcategoriesByParent((previous) => {
          const next = new Map(previous);
          next.set(parentId, loaded);
          return next;
        });
      } catch (error) {
        console.error("Greška pri učitavanju podkategorija:", error);
      } finally {
        subcategoryRequestsRef.current.delete(parentId);
        setIsLoadingSubsFor((previous) => (previous === parentId ? null : previous));
      }
    },
    [subcategoriesByParent]
  );

  const handleBrowseClick = useCallback(
    async (category) => {
      const hasChildren = Number(category?.subcategories_count) > 0;
      if (!hasChildren) {
        selectCategory(category);
        return;
      }

      if (selectedParent?.id === category.id) {
        setSelectedParent(null);
        return;
      }

      setSelectedParent(category);
      await fetchSubcategories(category);
    },
    [selectCategory, selectedParent?.id, fetchSubcategories]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-[0_30px_70px_-35px_rgba(2,6,23,0.75)] sm:max-h-[88vh] sm:max-w-4xl sm:rounded-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-20 space-y-3 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-5 md:px-6 dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kategorija</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {showSearchResults
                  ? `Rezultati pretrage za "${trimmedSearchTerm}"`
                  : "Brzi izbor i pregled svih kategorija"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Zatvori kategorije"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200/85 bg-slate-50/90 px-3 py-2.5 dark:border-slate-700/80 dark:bg-slate-800/60">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                Trenutno odabrano
              </p>
              {selectedCategorySlug ? (
                <button
                  type="button"
                  onClick={handleResetCategory}
                  className="text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Prikaži sve
                </button>
              ) : (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-900/20 dark:text-emerald-300">
                  Bez filtera
                </span>
              )}
            </div>
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {selectedCategoryLabel}
            </p>
            {selectedCategorySlug && selectedCategoryPath ? (
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{selectedCategoryPath}</p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trenutno su prikazane sve dostupne kategorije.
              </p>
            )}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pretraži kategorije (npr. vozila, stan, laptop)"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <Switch checked={onlyWithAds} onCheckedChange={setOnlyWithAds} />
              Samo kategorije sa oglasima
            </label>
            {trimmedSearchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="self-end text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline sm:self-auto dark:text-slate-400 dark:hover:text-slate-200"
              >
                Očisti pretragu
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 scrollbar-lmx sm:px-4 md:px-5">
          {!showSearchResults ? (
            <div className="mb-4 space-y-2">
              <div className="mb-1 flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  Brzi izbor
                </p>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {rootCategories.length} kategorija
                </span>
              </div>
              <button
                type="button"
                onClick={() => selectCategory({ slug: null })}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  !selectedCategorySlug
                    ? "border-primary/35 bg-primary/10 text-primary"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg",
                    !selectedCategorySlug
                      ? "bg-primary/20 text-primary"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Sve kategorije</p>
                  <p className="text-xs opacity-75">Prikaži oglase bez ograničenja po kategoriji</p>
                </div>
              </button>

              {recentCategories.length > 0 ? (
                <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 dark:border-slate-700/70 dark:bg-slate-900">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Nedavno korištene
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentCategories.map((category) => (
                      <button
                        key={`recent-${getCategoryIdentifier(category)}`}
                        type="button"
                        onClick={() => selectCategory(category)}
                        className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <span className="truncate">{category?.translated_name || category?.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {popularCategories.length > 0 ? (
                <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 dark:border-slate-700/70 dark:bg-slate-900">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Popularno
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {popularCategories.map((category) => (
                      <button
                        key={`popular-${category.id}`}
                        type="button"
                        onClick={() => handleBrowseClick(category)}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                      >
                        <span className="truncate">{category?.translated_name || category?.name}</span>
                        <span className="opacity-70">({getDisplayCount(category)})</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {isCatLoading && categoriesCount === 0 ? (
            <CategorySkeleton />
          ) : showSearchResults ? (
            filteredSearchResults.length > 0 ? (
              <div className="space-y-2">
                {filteredSearchResults.map((category) => {
                  const identifier = getCategoryIdentifier(category);
                  const isSelected = selectedCategorySlug === identifier;
                  return (
                    <button
                      key={`search-${category.id}-${identifier}`}
                      type="button"
                      onClick={() => selectCategory(category)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                        isSelected
                          ? "border-primary/35 bg-primary/10"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          <Search className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm font-semibold",
                              isSelected ? "text-primary" : "text-slate-800 dark:text-slate-100"
                            )}
                          >
                            {category.search_name}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {category.__path || category.search_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pl-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {formatAdCount(getDisplayCount(category))}
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <Search className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nema rezultata za "{trimmedSearchTerm}"
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Pokušajte drugi naziv kategorije.
                </p>
              </div>
            )
          ) : (
              <div className="space-y-2">
                <div className="mb-1 flex items-center justify-between px-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                    Sve kategorije
                  </p>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {rootCategories.length}
                  </span>
                </div>
                {rootCategories.map((category) => {
                const identifier = getCategoryIdentifier(category);
                const isSelected = selectedCategorySlug === identifier;
                const isExpanded = selectedParent?.id === category.id;
                const hasChildren = Number(category?.subcategories_count) > 0;
                const isLoadingChildren = isLoadingSubsFor === category.id;
                const categoryMeta = `${formatAdCount(getDisplayCount(category))} • ${formatSubcategoryCount(
                  category?.subcategories_count
                )}`;

                return (
                  <div
                    key={`root-${category.id}`}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700/70 dark:bg-slate-900"
                  >
                    <button
                      type="button"
                      onClick={() => handleBrowseClick(category)}
                      onMouseEnter={() => {
                        if (hasChildren) fetchSubcategories(category);
                      }}
                      onFocus={() => {
                        if (hasChildren) fetchSubcategories(category);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors sm:px-3.5",
                        isSelected
                          ? "bg-primary/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/80"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-semibold",
                            isSelected ? "text-primary" : "text-slate-800 dark:text-slate-100"
                          )}
                        >
                          {category?.translated_name || category?.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {categoryMeta}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLoadingChildren ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : hasChildren ? (
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-slate-400 transition-transform",
                              isExpanded ? "rotate-90 text-primary" : ""
                            )}
                          />
                        ) : null}
                      </div>
                    </button>

                    {isExpanded ? (
                      <div className="border-t border-slate-200/80 bg-slate-50/70 px-2 py-2 dark:border-slate-700/70 dark:bg-slate-800/40">
                        {selectedSubcategories.length > 0 ? (
                          <div className="max-h-60 space-y-1 overflow-y-auto overscroll-contain pr-1 scrollbar-lmx">
                            {selectedSubcategories.map((subcategory) => {
                              const subIdentifier = getCategoryIdentifier(subcategory);
                              const isSubSelected = selectedCategorySlug === subIdentifier;
                              return (
                                <button
                                  key={`sub-${subcategory.id}`}
                                  type="button"
                                  onClick={() => selectCategory(subcategory)}
                                  className={cn(
                                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                                    isSubSelected
                                      ? "bg-primary/10 text-primary"
                                      : "hover:bg-white dark:hover:bg-slate-800"
                                  )}
                                >
                                  <span className="min-w-0 flex items-center gap-2">
                                    <CornerDownRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
                                    <span className="truncate text-sm font-medium">
                                      {subcategory?.translated_name || subcategory?.name}
                                    </span>
                                  </span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {formatAdCount(getDisplayCount(subcategory))}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="px-2 py-2 text-xs text-slate-500 dark:text-slate-400">
                            Nema dostupnih podkategorija.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPopup;
