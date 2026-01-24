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

// Tabler icons
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

// =========================
// TRACKING HELPERS (FIXED)
// =========================
const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") + "/api"
    : "/api") || "/api";

const getVisitorId = () => {
  if (typeof window === "undefined") return null;
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId =
      "v_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now();
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
};

const getDeviceType = () => {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
};

const getUTMParams = () => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
  };
};

const getReferrer = () => {
  if (typeof window === "undefined") return null;
  return document.referrer || null;
};

// Uses same endpoints as your api.js publicTrackingApi:
// POST /track/search-impressions
const postForm = async (endpoint, data) => {
  try {
    const form = new FormData();
    const baseData = {
      ...data,
      visitor_id: getVisitorId(),
      device_type: getDeviceType(),
      ...getUTMParams(),
      referrer_url: getReferrer(),
      timestamp: new Date().toISOString(),
    };

    Object.entries(baseData).forEach(([k, v]) => {
      if (v === undefined || v === null) return;

      // If object/array, stringify
      if (typeof v === "object") form.append(k, JSON.stringify(v));
      else form.append(k, String(v));
    });

    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: "POST",
      body: form,
      keepalive: true,
    });

    return res.ok;
  } catch (e) {
    console.error("Tracking error:", endpoint, e);
    return false;
  }
};

// =========================
// SEARCH HISTORY
// =========================
const SEARCH_HISTORY_KEY = "lmx_search_history";
const MAX_HISTORY_ITEMS = 8;

// =========================
// DID YOU MEAN (NO COMMON_TERMS)
// =========================
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
  const settings = useSelector(settingsData);

  const categoryList = [
    { slug: "all-categories", translated_name: t("allCategories") },
    ...cateData,
  ];

  // kept from original (if you have category selector elsewhere)
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("all-categories");
  const selectedItem = categoryList.find((item) => item.slug === value);

  const hasMoreCats = catCurrentPage < catLastPage;
  const { ref, inView } = useInView();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [didYouMean, setDidYouMean] = useState([]);

  // Keyboard navigation state
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // animacija logo / search
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownId = "lmx-search-dropdown";

  // Load search history from localStorage
  useEffect(() => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) setSearchHistory(JSON.parse(history));
    } catch (e) {
      console.error("Failed to load search history:", e);
    }
  }, []);

  // Save to search history
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

  // Flatten categories
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

  // TRACK: search impressions (public endpoint)
  const trackSearchImpressions = useCallback(
    async (ads, query) => {
      if (!ads?.length || !query) return;

      const impressionId =
        "imp_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now();

      const itemIds = ads.map((a) => a.id).filter(Boolean);

      const filters = {
        category:
          selectedItem?.slug && selectedItem.slug !== "all-categories"
            ? selectedItem.slug
            : null,
      };

      await postForm("track/search-impressions", {
        impression_id: impressionId,
        item_ids: itemIds,
        search_query: query,
        search_type: "autocomplete",
        page: 1,
        results_total: ads.length,
        filters,
      });
    },
    [selectedItem?.slug]
  );

  // Search API
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
          // ✅ DID YOU MEAN bez COMMON_TERMS: pool = kategorije + historija
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

        // ✅ TRACK impressions for returned results
        await trackSearchImpressions(ads, query);

        // Extract unique search suggestions from ad titles
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

        // ✅ KATEGORIJE ZA PRONAĐENE OGLASE + COUNT
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

        // Extract users
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
    [cateData, flattenCategories, trackSearchImpressions, searchHistory]
  );

  // Debounced search
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

  // Close suggestions on click outside
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

  // Cleanup
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
    <>
      <div className="w-full flex items-center gap-3">
        {settings?.header_logo && (
          <div
            className={cn(
              "transition-all duration-300 ease-in-out overflow-hidden",
              isSearchActive
                ? "w-0 opacity-0 -translate-x-2"
                : "w-[40px] sm:w-[90px] opacity-100 translate-x-0"
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

        <div
          ref={searchContainerRef}
          className={cn(
            "relative flex-1 transition-transform duration-300 ease-out z-[9]",
            isSearchActive ? "scale-[1.02]" : "scale-100"
          )}
        >
          <form
            onSubmit={handleSearchNav}
            className="w-full flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1.5 sm:py-2 border-2 border-primary/40 hover:border-primary transition-all duration-200"
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

              {/* ✅ KATEGORIJE ZA PRONAĐENE OGLASE (UMJESTO "RELEVANTNI OGLASI") */}
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
    </>
  );
};

export default Search;
