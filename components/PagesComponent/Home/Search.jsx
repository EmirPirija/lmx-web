"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { t } from "@/utils";
import { usePathname } from "next/navigation";
import { useNavigate } from "@/components/Common/useNavigate";
import useGetCategories from "@/components/Layout/useGetCategories";
import CustomImage from "@/components/Common/CustomImage";
import { useSelector } from "react-redux";
import { settingsData } from "@/redux/reducer/settingSlice";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useSearchTracking } from "@/hooks/useItemTracking";

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
} from "@tabler/icons-react";

const SEARCH_HISTORY_KEY = "lmx_search_history";
const MAX_HISTORY_ITEMS = 8;

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

  if (q) parts.push(`Upit: ${q}`);
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

const Search = () => {
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
    { slug: "all-categories", translated_name: t("allCategories") },
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
  const [didYouMean, setDidYouMean] = useState([]);

  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownId = "lmx-search-dropdown";

  useEffect(() => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) setSearchHistory(JSON.parse(history));
    } catch (e) {
      console.error("Failed to load search history:", e);
    }
  }, []);

  const saveToHistory = useCallback((query) => {
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
  }, []);

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

          setDidYouMean(similar);
          setSuggestions([]);
          setSuggestedCategories([]);
          setSuggestedUsers([]);
          return;
        }

        setDidYouMean([]);

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
        setSuggestions(searchSuggestions);

        const categoryMap = new Map();
        const flatCats = flattenCategories(cateData);
        const catLookup = new Map(flatCats.map((c) => [c.id, c]));

        ads.forEach((ad) => {
          const catId = ad.category_id ?? ad.category?.id ?? null;
          if (!catId) return;

          const cat = catLookup.get(catId);
          if (!cat) return;

          const existing = categoryMap.get(cat.id);
          if (existing) existing.count += 1;
          else categoryMap.set(cat.id, { ...cat, count: 1 });
        });

        const catResults = Array.from(categoryMap.values())
          .sort((a, b) => (b.count || 0) - (a.count || 0))
          .slice(0, 6);
        setSuggestedCategories(catResults);

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
        setSuggestedUsers(userResults);
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
    setSelectedIndex(-1);

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
        setSelectedIndex(-1);
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
        setSelectedIndex(-1);
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
      setSelectedIndex(-1);

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
      setSelectedIndex(-1);
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
      setSelectedIndex(-1);
      navigate(`/ads?query=${encodeURIComponent(searchQuery)}`);
    },
    [navigate, searchQuery]
  );

  const handleUserClick = useCallback(
    (user) => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
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
    setShowSuggestions(true);
    setSelectedIndex(-1);
    setIsSearchFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    if (!searchQuery) setIsSearchFocused(false);
  }, [searchQuery]);

  const hasResults =
    suggestions.length > 0 ||
    suggestedCategories.length > 0 ||
    suggestedUsers.length > 0;

  const showHistory = searchQuery.length < 2 && searchHistory.length > 0;
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
    (showHistory || isSearching || hasResults || showDidYouMean || showNoResults);

  const isSearchActive = isSearchFocused || !!searchQuery || showSuggestions;

  return (
    <div className="w-full flex items-center gap-3 z-[9999]">
      {settings?.header_logo && (
        <div
          className={cn(
            // USPORENO: logo transition kada je search aktivan
            "flex-shrink-0 transition-all duration-[1800ms] ease-out",
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
              className="w-full h-[42px] sm:h-[70px] object-contain ltr:object-left rtl:object-right"
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
            "text-xs text-slate-500 whitespace-nowrap transition-[width,margin,opacity,transform] duration-[4200ms] ease-out",
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
            "w-full flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1.5 sm:py-2 border-2 transition-all duration-2000",
            isSearchActive
              ? "border-primary shadow-sm"
              : "border-primary/40 hover:border-primary"
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
            placeholder={t("searchAd")}
            className="text-sm outline-none border-none w-full bg-transparent"
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
              aria-label={t("clearSearch") || "Obriši pretragu"}
            >
              <IconX className="w-4 h-4 text-slate-500" />
            </button>
          )}

          {isSearching ? (
            <div className="p-2" aria-label="Pretraživanje" aria-busy="true">
              <IconLoader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          ) : (
            <button
              className="flex items-center gap-2 bg-primary text-white p-2 rounded-full transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95"
              type="submit"
              aria-label={t("searchAd") || "Pretraži oglase"}
            >
              <IconSearch size={16} className="text-white" />
            </button>
          )}
        </form>

        {shouldShowDropdown && (
          <div
            id={dropdownId}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[420px] overflow-y-auto animate-in fade-in-0 slide-in-from-top-2 duration-200 z-[9999]"
            role="listbox"
            aria-label="Prijedlozi pretrage"
          >
            {searchQuery.length >= 2 && (
              <button
                type="button"
                onClick={() => handleSearchNav(null, searchQuery)}
                className="w-full flex items-center justify-between px-3 py-2 border-b border-gray-100 text-left text-sm transition-all duration-200 hover:bg-gray-50"
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
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
                    <IconFolder className="w-3 h-3" />
                    Kategorije za pronađene oglase
                  </div>
                  <button
                    onClick={handleViewAllCategories}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-all duration-200 hover:gap-2 group"
                  >
                    <span>Pogledaj sve</span>
                    <IconChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>

                <ul className="space-y-1">
                  {suggestedCategories.map((category) => (
                    <li
                      key={category.id}
                      className="flex items-center justify-between px-2 py-2 rounded cursor-pointer transition-all duration-200 hover:bg-gray-50"
                      onClick={() => handleCategoryClick(category)}
                      role="option"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <IconFolder className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-gray-800 truncate">
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
              <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Spašene pretrage
                  </p>
                  <button
                    onClick={() => navigate("/profile/saved-searches")}
                    className="text-xs text-gray-700 hover:text-black"
                  >
                    Uredi
                  </button>
                </div>

                <div className="space-y-1">
                  {savedSearches.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        markUsed(s.id);
                        setShowSuggestions(false);
                        navigate(
                          s.queryString ? `/ads?${s.queryString}` : "/ads"
                        );
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <IconStarFilled size={16} className="text-gray-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {s.naziv}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
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

            {showHistory && (
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
                    <IconClock className="w-3 h-3" />
                    Nedavne pretrage
                  </div>
                  <button
                    onClick={clearAllHistory}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors duration-200"
                  >
                    Obriši sve
                  </button>
                </div>
                <ul className="space-y-1">
                  {searchHistory.map((query, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-200 hover:bg-gray-50"
                      onClick={() => handleHistoryClick(query)}
                      role="option"
                    >
                      <div className="flex items-center gap-2">
                        <IconClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{query}</span>
                      </div>
                      <button
                        onClick={(e) => removeFromHistory(query, e)}
                        className="p-1 hover:bg-gray-200 rounded transition-all duration-200"
                        aria-label="Obriši iz historije"
                      >
                        <IconX className="w-3 h-3 text-gray-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isSearching && searchQuery.length >= 2 && !hasResults && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm text-gray-500">Tražim...</span>
                </div>
              </div>
            )}

            {showDidYouMean && (
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-2">
                  Nema rezultata za{" "}
                  <span className="font-medium">"{searchQuery}"</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Da li ste mislili: </span>
                  {didYouMean.map((term, index) => (
                    <span key={term}>
                      <button
                        onClick={() => handleDidYouMeanClick(term)}
                        className="text-primary font-medium hover:underline"
                        role="option"
                      >
                        {term}
                      </button>
                      {index < didYouMean.length - 1 && (
                        <span className="text-gray-400">, </span>
                      )}
                    </span>
                  ))}
                  <span className="text-gray-500">?</span>
                </div>
              </div>
            )}

            {showNoResults && (
              <div className="py-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <IconSearch className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  Nema rezultata za{" "}
                  <span className="font-medium">"{searchQuery}"</span>
                </p>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <IconSearch className="w-3 h-3" />
                  Prijedlozi pretrage
                </div>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all duration-200 hover:bg-gray-50"
                      onClick={() => handleSuggestionClick(suggestion)}
                      role="option"
                    >
                      <IconSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">
                        {suggestion}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {suggestedUsers.length > 0 && (
              <div className="p-3">
                <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <IconUser className="w-3 h-3" />
                  Korisnici
                </div>
                <ul className="space-y-1">
                  {suggestedUsers.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-200 hover:bg-gray-50"
                      onClick={() => handleUserClick(user)}
                      role="option"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                          {user.profile ? (
                            <img
                              src={user.profile}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IconUser className="w-3.5 h-3.5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700">
                            {user.name}
                          </span>
                          {user.average_rating && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
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
