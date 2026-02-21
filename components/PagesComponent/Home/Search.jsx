"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { usePathname } from "next/navigation";
import { useNavigate } from "@/components/Common/useNavigate";
import useGetCategories from "@/components/Layout/useGetCategories";
import CustomImage from "@/components/Common/CustomImage";
import { useSelector } from "react-redux";
import { settingsData } from "@/redux/reducer/settingSlice";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useSearchTracking } from "@/hooks/useItemTracking";
import { Switch } from "@/components/ui/switch";

import {
  IconSearch,
  IconLoader2,
  IconUser,
  IconFolder,
  IconClock,
  IconX,
  IconChevronRight,
  IconWorld,
  IconStarFilled,
} from "@/components/Common/UnifiedIconPack";

const SEARCH_HISTORY_KEY = "lmx_search_history";
const SEARCH_HISTORY_ENABLED_KEY = "lmx_search_history_enabled";
const MAX_HISTORY_ITEMS = 8;
const SEARCH_RESULT_CACHE_TTL_MS = 45 * 1000;

const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else
        dp[i][j] =
          1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

const findSimilarTermsFromPool = (query, pool, maxSuggestions = 3) => {
  if (!query || query.trim().length < 2) return [];
  const queryLower = query.toLowerCase().trim();

  const candidates = (pool || [])
    .map((x) => (x ?? "").toString().trim())
    .filter(Boolean);

  const uniq = Array.from(new Set(candidates.map((s) => s.toLowerCase()))).map(
    (lower) => candidates.find((c) => c.toLowerCase() === lower) || lower
  );

  const suggestions = [];
  for (const term of uniq) {
    const termLower = term.toLowerCase();
    if (termLower === queryLower) continue;

    if (termLower.startsWith(queryLower)) {
      suggestions.push({ term, distance: 0 });
      continue;
    }

    if (queryLower.startsWith(termLower)) continue;

    if (Math.abs(termLower.length - queryLower.length) <= 3) {
      const distance = levenshteinDistance(queryLower, termLower);
      if (distance <= Math.max(2, Math.floor(queryLower.length / 3))) {
        suggestions.push({ term, distance });
      }
    }
  }

  suggestions.sort((a, b) =>
    a.distance !== b.distance
      ? a.distance - b.distance
      : a.term.localeCompare(b.term)
  );

  return suggestions.slice(0, maxSuggestions).map((s) => s.term);
};

const formatAdCount = (n) => {
  const num = Number(n) || 0;
  return num === 1 ? "1 oglas" : `${num} oglasa`;
};

const formatSavedSearchSubtitle = (qs) => {
  const params = new URLSearchParams((qs || "").replace(/^\?/, ""));

  const parts = [];

  const q = params.get("query");
  const category = params.get("category");

  const min = params.get("min_price");
  const max = params.get("max_price");

  const city = params.get("city");
  const state = params.get("state");
  const country = params.get("country");
  const km = params.get("km_range");

  if (q) parts.push(`Pretraga: ${q}`);
  if (category) parts.push(`Kategorija: ${category}`);

  if (min || max) {
    if (min && max) parts.push(`Cijena: ${min}–${max} KM`);
    else if (max) parts.push(`Cijena: do ${max} KM`);
    else parts.push(`Cijena: od ${min} KM`);
  }

  if (city || state || country) {
    parts.push(`Lokacija: ${[city, state, country].filter(Boolean).join(", ")}`);
  }

  if (km) parts.push(`U blizini: ${km} km`);

  const known = new Set([
    "query",
    "category",
    "min_price",
    "max_price",
    "city",
    "state",
    "country",
    "km_range",
    "lang",
    "sort_by",
    "page",
    "featured_section",
    "lat",
    "lng",
    "area",
    "areaId",
  ]);

  let extraCount = 0;
  for (const [k] of params.entries()) if (!known.has(k)) extraCount++;
  if (extraCount) parts.push(`+ ${extraCount} filtera`);

  if (!parts.length) return "Svi oglasi (bez filtera)";
  return parts.slice(0, 3).join(" • ");
};

const Search = ({
  hideBrand = false,
  compact = false,
  minimal = false,
  onInputFocusChange,
}) => {
  const historySwitchId = useId();
  const {
    cateData,
    getCategories,
    isCatLoadMore,
    catLastPage,
    catCurrentPage,
  } = useGetCategories();

  const pathname = usePathname();
  const { navigate } = useNavigate();
  const { savedSearches, markUsed } = useSavedSearches();
  const settings = useSelector(settingsData);
  const { trackSearchImpressions, getSearchId } = useSearchTracking();

  const categoryList = [
    { slug: "all-categories", translated_name: "Sve kategorije" },
    ...cateData,
  ];

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("all-categories");
  const selectedItem = categoryList.find((item) => item.slug === value);

  const hasMoreCats = catCurrentPage < catLastPage;
  const { ref, inView } = useInView();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isHistoryEnabled, setIsHistoryEnabled] = useState(true);
  const [didYouMean, setDidYouMean] = useState([]);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const searchResultCacheRef = useRef(new Map());
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownId = "lmx-search-dropdown";

  useEffect(() => {
    try {
      const historyEnabledRaw = localStorage.getItem(SEARCH_HISTORY_ENABLED_KEY);
      const historyEnabled =
        historyEnabledRaw === null ? true : historyEnabledRaw === "true";

      setIsHistoryEnabled(historyEnabled);

      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!history) return;

      const parsedHistory = JSON.parse(history);
      if (Array.isArray(parsedHistory)) {
        setSearchHistory(parsedHistory.filter(Boolean).slice(0, MAX_HISTORY_ITEMS));
      }
    } catch (e) {
      console.error("Failed to load search history:", e);
    }
  }, []);

  const saveToHistory = useCallback((query) => {
    if (!isHistoryEnabled) return;
    if (!query || query.length < 2) return;
    try {
      const history = JSON.parse(
        localStorage.getItem(SEARCH_HISTORY_KEY) || "[]"
      );
      const filtered = history.filter(
        (item) => item.toLowerCase() !== query.toLowerCase()
      );
      const newHistory = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } catch (e) {
      console.error("Failed to save search history:", e);
    }
  }, [isHistoryEnabled]);

  const removeFromHistory = useCallback((query, e) => {
    e.stopPropagation();
    try {
      const history = JSON.parse(
        localStorage.getItem(SEARCH_HISTORY_KEY) || "[]"
      );
      const newHistory = history.filter((item) => item !== query);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } catch (err) {
      console.error("Failed to remove from history:", err);
    }
  }, []);

  const clearAllHistory = useCallback(() => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      setSearchHistory([]);
    } catch (e) {
      console.error("Failed to clear history:", e);
    }
  }, []);

  const handleHistoryToggle = useCallback((checked) => {
    const enabled = Boolean(checked);
    setIsHistoryEnabled(enabled);

    try {
      localStorage.setItem(SEARCH_HISTORY_ENABLED_KEY, String(enabled));
      if (!enabled) return;

      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!history) return;
      const parsedHistory = JSON.parse(history);
      if (Array.isArray(parsedHistory)) {
        setSearchHistory(parsedHistory.filter(Boolean).slice(0, MAX_HISTORY_ITEMS));
      }
    } catch (e) {
      console.error("Failed to update history preference:", e);
    }
  }, []);

  useEffect(() => {
    if (open && inView && hasMoreCats && !isCatLoadMore) {
      getCategories(catCurrentPage + 1);
    }
  }, [hasMoreCats, inView, isCatLoadMore, open, catCurrentPage, getCategories]);

  const flattenCategories = useCallback((categories, parentPath = []) => {
    let result = [];
    categories.forEach((cat) => {
      const name = cat.translated_name || cat.name || "";
      const current = {
        ...cat,
        search_name: name,
        full_path: [...parentPath, name].join(" > "),
      };
      result.push(current);
      if (cat.subcategories?.length) {
        result = result.concat(
          flattenCategories(cat.subcategories, [...parentPath, name])
        );
      }
    });
    return result;
  }, []);

  const trackAutocompleteImpressions = useCallback(
    async (ads, query) => {
      if (!ads?.length || !query) return;

      const itemIds = ads.map((a) => a.id).filter(Boolean);
      const filters = {
        category:
          selectedItem?.slug && selectedItem.slug !== "all-categories"
            ? selectedItem.slug
            : null,
        search_type: "autocomplete",
      };
      const searchContext = {
        search_query: query,
        category_slug: filters.category,
        filters,
      };

      getSearchId(searchContext);
      await trackSearchImpressions(itemIds, {
        ...searchContext,
        page: 1,
        results_count: ads.length,
      });
    },
    [selectedItem?.slug, trackSearchImpressions, getSearchId]
  );

  const performSearch = useCallback(
    async (query) => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        setSuggestedCategories([]);
        setSuggestedUsers([]);
        setDidYouMean([]);
        return;
      }

      const cacheKey = query.trim().toLowerCase();
      const cachedSearch = searchResultCacheRef.current.get(cacheKey);
      if (cachedSearch && Date.now() - cachedSearch.ts <= SEARCH_RESULT_CACHE_TTL_MS) {
        setSuggestions(cachedSearch.payload.suggestions);
        setSuggestedCategories(cachedSearch.payload.suggestedCategories);
        setSuggestedUsers(cachedSearch.payload.suggestedUsers);
        setDidYouMean(cachedSearch.payload.didYouMean);
        setIsSearching(false);
        return;
      }
      if (cachedSearch) {
        searchResultCacheRef.current.delete(cacheKey);
      }

      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      setIsSearching(true);

      try {
        const response = await fetch(
          `https://admin.lmx.ba/api/get-item?search=${encodeURIComponent(
            query
          )}&per_page=50`,
          { signal: abortControllerRef.current.signal }
        );

        if (!response.ok) throw new Error("Search failed");

        const result = await response.json();
        const ads = result?.data?.data || result?.data?.data?.data || [];

        if (!ads || ads.length === 0) {
          const flatCats = flattenCategories(cateData);
          const pool = [
            ...flatCats.map((c) => c.search_name).filter(Boolean),
            ...searchHistory,
          ];
          const similar = findSimilarTermsFromPool(query, pool, 3);

          const emptyResultPayload = {
            suggestions: [],
            suggestedCategories: [],
            suggestedUsers: [],
            didYouMean: similar,
          };
          setDidYouMean(emptyResultPayload.didYouMean);
          setSuggestions(emptyResultPayload.suggestions);
          setSuggestedCategories(emptyResultPayload.suggestedCategories);
          setSuggestedUsers(emptyResultPayload.suggestedUsers);
          searchResultCacheRef.current.set(cacheKey, {
            ts: Date.now(),
            payload: emptyResultPayload,
          });
          return;
        }

        await trackAutocompleteImpressions(ads, query);

        const titleWords = new Set();
        const queryLower = query.toLowerCase();

        ads.forEach((ad) => {
          const title = ad.translated_name || ad.name || "";
          if (title.toLowerCase().includes(queryLower)) titleWords.add(title);

          const words = title.split(/\s+/);
          for (let i = 0; i < words.length; i++) {
            if (words[i].toLowerCase().includes(queryLower)) {
              const phrase = words.slice(i, i + 3).join(" ");
              if (phrase.length > query.length) titleWords.add(phrase);
            }
          }
        });

        const searchSuggestions = Array.from(titleWords)
          .filter((s) => s.toLowerCase() !== queryLower)
          .slice(0, 5);

        const categoryMap = new Map();
        const flatCats = flattenCategories(cateData);
        const catById = new Map(flatCats.map((c) => [String(c.id), c]));
        const catBySlug = new Map(
          flatCats
            .filter((c) => c?.slug)
            .map((c) => [String(c.slug).toLowerCase(), c])
        );

        ads.forEach((ad) => {
          const adCategory = ad?.category || null;
          const adCategoryId = ad?.category_id ?? adCategory?.id ?? null;
          const adCategorySlug = adCategory?.slug ?? null;

          const localMatchById =
            adCategoryId != null ? catById.get(String(adCategoryId)) : null;
          const localMatchBySlug = adCategorySlug
            ? catBySlug.get(String(adCategorySlug).toLowerCase())
            : null;
          const resolvedCategory = localMatchById || localMatchBySlug || adCategory;

          const slug = resolvedCategory?.slug || adCategorySlug;
          if (!slug) return;

          const key = String(slug).toLowerCase();
          const searchName =
            resolvedCategory?.search_name ||
            resolvedCategory?.translated_name ||
            resolvedCategory?.name ||
            adCategory?.translated_name ||
            adCategory?.name ||
            slug;

          const nextCategory = {
            ...(resolvedCategory || {}),
            slug,
            id: resolvedCategory?.id ?? adCategoryId ?? key,
            search_name: searchName,
            full_path: resolvedCategory?.full_path || searchName,
          };

          const existing = categoryMap.get(key);
          if (existing) existing.count += 1;
          else categoryMap.set(key, { ...nextCategory, count: 1 });
        });

        const catResults = Array.from(categoryMap.values()).sort(
          (a, b) => (b.count || 0) - (a.count || 0)
        );

        const userMap = new Map();
        ads.forEach((ad) => {
          if (ad.user) {
            const existing = userMap.get(ad.user.id);
            if (existing) existing.adCount += 1;
            else userMap.set(ad.user.id, { ...ad.user, adCount: 1 });
          }
        });

        const userResults = Array.from(userMap.values())
          .sort((a, b) => (b.adCount || 0) - (a.adCount || 0))
          .slice(0, 3);
        const searchResultPayload = {
          suggestions: searchSuggestions,
          suggestedCategories: catResults,
          suggestedUsers: userResults,
          didYouMean: [],
        };
        setSuggestions(searchResultPayload.suggestions);
        setSuggestedCategories(searchResultPayload.suggestedCategories);
        setSuggestedUsers(searchResultPayload.suggestedUsers);
        searchResultCacheRef.current.set(cacheKey, {
          ts: Date.now(),
          payload: searchResultPayload,
        });
      } catch (error) {
        if (error.name !== "AbortError") console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [cateData, flattenCategories, trackAutocompleteImpressions, searchHistory]
  );

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery || searchQuery.length < 2) {
      setIsSearching(false);
      setSuggestions([]);
      setSuggestedCategories([]);
      setSuggestedUsers([]);
      setDidYouMean([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => performSearch(searchQuery), 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        if (!searchQuery) setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleSearchNav = useCallback(
    (e, customQuery = null) => {
      e && e.preventDefault();
      const raw = customQuery ?? searchQuery;
      const query = (raw || "").trim();

      if (!query) {
        setShowSuggestions(false);
        setIsSearchFocused(false);

        const url =
          selectedItem?.slug && selectedItem.slug !== "all-categories"
            ? `/ads?category=${selectedItem.slug}`
            : "/ads";

        if (pathname === "/ads") {
          window.history.pushState(null, "", url);
          window.dispatchEvent(new Event("popstate"));
        } else {
          navigate(url);
        }
        return;
      }

      if (query.length < 2) return;

      saveToHistory(query);

      const encodedQuery = encodeURIComponent(query);
      const baseUrl = `/ads?query=${encodedQuery}`;
      const url =
        selectedItem?.slug === "all-categories"
          ? baseUrl
          : `/ads?category=${selectedItem?.slug}&query=${encodedQuery}`;

      setShowSuggestions(false);

      if (pathname === "/ads") {
        window.history.pushState(null, "", url);
        window.dispatchEvent(new Event("popstate"));
      } else {
        navigate(url);
      }
    },
    [searchQuery, selectedItem, pathname, navigate, saveToHistory]
  );

  const handleSuggestionClick = useCallback(
    (suggestion) => {
      setSearchQuery(suggestion);
      saveToHistory(suggestion);
      handleSearchNav(null, suggestion);
    },
    [saveToHistory, handleSearchNav]
  );

  const handleCategoryClick = useCallback(
    (category) => {
      setShowSuggestions(false);
      const url = searchQuery
        ? `/ads?category=${category.slug}&query=${encodeURIComponent(searchQuery)}`
        : `/ads?category=${category.slug}`;
      navigate(url);
    },
    [navigate, searchQuery]
  );

  const handleViewAllCategories = useCallback(
    (e) => {
      e.stopPropagation();
      setShowSuggestions(false);
      navigate(`/ads?query=${encodeURIComponent(searchQuery)}`);
    },
    [navigate, searchQuery]
  );

  const handleUserClick = useCallback(
    (user) => {
      setShowSuggestions(false);
      navigate(`/seller/${user.id}`);
    },
    [navigate]
  );

  const handleHistoryClick = useCallback(
    (query) => {
      setSearchQuery(query);
      handleSearchNav(null, query);
    },
    [handleSearchNav]
  );

  const handleDidYouMeanClick = useCallback(
    (term) => {
      setSearchQuery(term);
      saveToHistory(term);
      performSearch(term);
    },
    [saveToHistory, performSearch]
  );

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    setShowSuggestions(true);
    setIsSearchFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
  }, []);

  const hasResults =
    suggestions.length > 0 ||
    suggestedCategories.length > 0 ||
    suggestedUsers.length > 0;

  const showHistoryPanel = searchQuery.length < 2;
  const showNoResults =
    searchQuery.length >= 2 &&
    !isSearching &&
    !hasResults &&
    didYouMean.length === 0;
  const showDidYouMean =
    searchQuery.length >= 2 &&
    !isSearching &&
    !hasResults &&
    didYouMean.length > 0;

  const shouldShowDropdown =
    showSuggestions &&
    (showHistoryPanel || isSearching || hasResults || showDidYouMean || showNoResults);

  useEffect(() => {
    if (!isInputFocused && !shouldShowDropdown && !searchQuery) {
      setIsSearchFocused(false);
    }
  }, [isInputFocused, shouldShowDropdown, searchQuery]);

  useEffect(() => {
    onInputFocusChange?.(isInputFocused || shouldShowDropdown);
  }, [isInputFocused, shouldShowDropdown, onInputFocusChange]);

  useEffect(() => {
    return () => {
      onInputFocusChange?.(false);
    };
  }, [onInputFocusChange]);

  const isSearchActive = isSearchFocused || !!searchQuery || showSuggestions;

  return (
    <div className={cn("relative z-40 flex w-full items-center", compact ? "gap-2" : "gap-2.5 sm:gap-3")}>
      {settings?.header_logo && !hideBrand && (
        <div
          className={cn(
            // USPORENO: logo transition kada je search aktivan
            "flex-shrink-0 transition-all duration-300 ease-out",
            isSearchActive
              ? "xl:w-[90px] xl:opacity-100 w-0 opacity-0"
              : "w-[40px] sm:w-[90px] opacity-100"
          )}
        >
          <Link href="/" className="block cursor-pointer" aria-label="Početna">
            <CustomImage
              src={settings.header_logo}
              width={195}
              height={52}
              alt="lmx logo"
              className={cn(
                "w-full object-contain ltr:object-left rtl:object-right",
                compact ? "h-[34px] sm:h-[42px]" : "h-[42px] sm:h-[70px]"
              )}
            />
          </Link>
        </div>
      )}

      <div className="hidden xl:flex items-center flex-shrink-0 overflow-hidden">
        <div className="h-6 w-px bg-slate-200 flex-shrink-0" />
        <div
          className={cn(
            // USPORENO: animacija teksta kada input dobije focus / search aktivan
            // Napomena: explicit transition properties da width/opacity/transform budu glatki
            "text-xs text-slate-500 whitespace-nowrap transition-[width,margin,opacity,transform] duration-300 ease-out dark:text-slate-400",
            isSearchActive
              ? "w-0 ml-0 opacity-0 -translate-x-4"
              : "w-auto ml-3 opacity-100 translate-x-0"
          )}
        >
          Nešto domaće. Nešto drugačije. Nešto naše.
        </div>
      </div>

      <div ref={searchContainerRef} className="relative flex-1 z-[9]">
        <form
          onSubmit={handleSearchNav}
          className={cn(
            "w-full flex items-center gap-2 rounded-2xl transition-all duration-200",
            minimal
              ? "bg-white/95 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.34)] dark:bg-slate-900/90"
              : "border border-slate-200/90 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90",
            compact ? "px-2.5 py-1.5" : "px-3 py-1.5 sm:py-2",
            isSearchActive
              ? minimal
                ? "shadow-[0_14px_30px_-18px_rgba(13,148,136,0.34)]"
                : "border-primary/50 ring-2 ring-primary/20"
              : minimal
                ? "hover:shadow-[0_12px_26px_-19px_rgba(15,23,42,0.4)]"
                : "hover:border-slate-300 dark:hover:border-slate-600"
          )}
          role="search"
        >
          <IconWorld
            stroke={1.7}
            className="min-w-4 min-h-4 text-slate-500"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id="lmx-search-input"
            type="text"
            placeholder={"Pretraži oglase"}
            className={cn(
              "w-full border-none bg-transparent text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500",
              compact ? "text-[13px]" : "text-sm"
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={shouldShowDropdown}
            aria-controls={shouldShowDropdown ? dropdownId : undefined}
          />

          {!isSearching && searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
                setSuggestedCategories([]);
                setSuggestedUsers([]);
                setDidYouMean([]);
                setShowSuggestions(true);
                inputRef.current && inputRef.current.focus();
              }}
              className="p-1 rounded-full hover:bg-muted transition-colors duration-150"
              aria-label="Obriši pretragu"
            >
              <IconX className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
          )}

          {isSearching ? (
            <div className="p-2" aria-label="Pretraživanje" aria-busy="true">
              <IconLoader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          ) : (
            <button
              className={cn(
                "flex items-center gap-2 rounded-xl bg-primary text-white transition-all duration-200 hover:bg-primary/90 hover:scale-[1.03] active:scale-95",
                compact ? "p-1.5" : "p-2"
              )}
              type="submit"
              aria-label="Pretraži oglase"
            >
              <IconSearch size={compact ? 15 : 16} className="text-white" />
            </button>
          )}
        </form>

        {shouldShowDropdown && (
          <div
            id={dropdownId}
            className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-[min(70vh,34rem)] overflow-y-auto overscroll-contain scrollbar-lmx border border-slate-200 bg-white shadow-[0_24px_44px_-30px_rgba(15,23,42,0.55)] animate-in fade-in-0 slide-in-from-top-2 duration-200 dark:border-slate-700 dark:bg-slate-900"
            role="listbox"
            aria-label="Prijedlozi pretrage"
          >
            {searchQuery.length >= 2 && (
              <button
                type="button"
                onClick={() => handleSearchNav(null, searchQuery)}
                className="w-full flex items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-sm transition-all duration-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
                role="option"
              >
                <span className="flex items-center gap-2">
                  <IconSearch className="w-4 h-4 text-primary" />
                  <span>
                    Pretraži oglase za{" "}
                    <span className="font-medium">"{searchQuery}"</span>
                  </span>
                </span>
              </button>
            )}

            {suggestedCategories.length > 0 && (
              <div className="border-b border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <IconFolder className="w-3 h-3" />
                    Kategorije za pronađene oglase
                  </div>
                  <button
                    type="button"
                    onClick={handleViewAllCategories}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-all duration-200 hover:gap-2 group"
                  >
                    <span>Pogledaj sve</span>
                    <IconChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>

                <ul className="space-y-1.5">
                  {suggestedCategories.map((category) => (
                    <li
                      key={category.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2.5 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      onClick={() => handleCategoryClick(category)}
                      role="option"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <IconFolder className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="truncate text-sm text-slate-800 dark:text-slate-100">
                          {category.search_name ||
                            category.translated_name ||
                            category.name}
                        </span>
                      </div>

                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                        {formatAdCount(category.count)}
                      </span>
                    </li>
                  ))}
                </ul>

                {hasMoreCats && <div ref={ref} className="h-4 w-full" />}
              </div>
            )}

            {searchQuery.length < 2 && savedSearches?.length > 0 && (
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Sačuvane pretrage
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/profile/saved-searches")}
                    className="text-xs text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    Uredi
                  </button>
                </div>

                <div className="space-y-1">
                  {savedSearches.slice(0, 5).map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        markUsed(s.id);
                        setShowSuggestions(false);
                        navigate(
                          s.queryString ? `/ads?${s.queryString}` : "/ads"
                        );
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <IconStarFilled size={16} className="text-slate-700 dark:text-slate-200" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {s.naziv}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {formatSavedSearchSubtitle(
                            s.queryString || s.query_string || ""
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showHistoryPanel && (
              <div className="border-b border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <IconClock className="w-3 h-3" />
                      Nedavne pretrage
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      {isHistoryEnabled
                        ? "Pamćenje pretrage je uključeno"
                        : "Pamćenje pretrage je isključeno"}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/85 px-2 py-1.5 dark:bg-slate-800/85">
                    <label
                      htmlFor={historySwitchId}
                      className="cursor-pointer select-none text-[11px] font-medium text-slate-500 dark:text-slate-400"
                    >
                      Pamti
                    </label>
                    <Switch
                      id={historySwitchId}
                      checked={isHistoryEnabled}
                      onCheckedChange={handleHistoryToggle}
                      aria-label="Pamti historiju pretrage"
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-300"
                    />
                  </div>
                </div>

                {isHistoryEnabled ? (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {searchHistory.length > 0
                          ? `${searchHistory.length} sačuvanih pojmova`
                          : "Još nema sačuvane historije"}
                      </p>
                      <button
                        type="button"
                        onClick={clearAllHistory}
                        className="text-xs text-slate-400 transition-colors duration-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-500"
                        disabled={searchHistory.length === 0}
                      >
                        Obriši sve
                      </button>
                    </div>

                    {searchHistory.length > 0 && (
                      <ul className="space-y-1">
                        {searchHistory.map((query, index) => (
                          <li
                            key={index}
                            className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                            onClick={() => handleHistoryClick(query)}
                            role="option"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <IconClock className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                              <span className="truncate text-sm text-slate-700 dark:text-slate-200">{query}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => removeFromHistory(query, e)}
                              className="rounded p-1 transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                              aria-label="Obriši iz historije"
                            >
                              <IconX className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                    Isključeno. Novi pojmovi se neće spremati u historiju.
                  </div>
                )}
              </div>
            )}

            {isSearching && searchQuery.length >= 2 && !hasResults && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">Tražim...</span>
                </div>
              </div>
            )}

            {showDidYouMean && (
              <div className="p-4">
                <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                  Nema rezultata za{" "}
                  <span className="font-medium">"{searchQuery}"</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Jeste li mislili: </span>
                  {didYouMean.map((term, index) => (
                    <span key={term}>
                      <button
                        type="button"
                        onClick={() => handleDidYouMeanClick(term)}
                        className="text-primary font-medium hover:underline"
                        role="option"
                      >
                        {term}
                      </button>
                      {index < didYouMean.length - 1 && (
                        <span className="text-slate-400 dark:text-slate-500">, </span>
                      )}
                    </span>
                  ))}
                  <span className="text-slate-500 dark:text-slate-400">?</span>
                </div>
              </div>
            )}

            {showNoResults && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <IconSearch className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nema rezultata za{" "}
                  <span className="font-medium">"{searchQuery}"</span>
                </p>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="border-b border-slate-100 p-3 dark:border-slate-800">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <IconSearch className="w-3 h-3" />
                  Prijedlozi pretrage
                </div>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      onClick={() => handleSuggestionClick(suggestion)}
                      role="option"
                    >
                      <IconSearch className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="truncate text-sm text-slate-700 dark:text-slate-200">
                        {suggestion}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {suggestedUsers.length > 0 && (
              <div className="p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <IconUser className="w-3 h-3" />
                  Korisnici
                </div>
                <ul className="space-y-1">
                  {suggestedUsers.map((user) => (
                    <li
                      key={user.id}
                      className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      onClick={() => handleUserClick(user)}
                      role="option"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600">
                          {user.profile ? (
                            <img
                              src={user.profile}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IconUser className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700 dark:text-slate-200">
                            {user.name}
                          </span>
                          {user.average_rating && (
                            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                              <IconStarFilled className="w-2.5 h-2.5 text-yellow-400" />
                              {Number(user.average_rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {user.adCount}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
