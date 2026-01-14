"use client";

import {
  Check,
  ChevronsUpDown,
  Loader2,
  Search as SearchIcon,
  User,
  Folder,
  Clock,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { t } from "@/utils";
import { BiPlanet } from "react-icons/bi";
import { FaSearch, FaStar } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useNavigate } from "@/components/Common/useNavigate";
import useGetCategories from "@/components/Layout/useGetCategories";
import CustomImage from "@/components/Common/CustomImage";
import { useSelector } from "react-redux";
import { settingsData } from "@/redux/reducer/settingSlice";

// Constants
const SEARCH_HISTORY_KEY = "lmx_search_history";
const MAX_HISTORY_ITEMS = 8;

// Common search terms for autocorrect suggestions (Bosnian + English)
const COMMON_TERMS = [
  "iphone",
  "samsung",
  "xiaomi",
  "huawei",
  "macbook",
  "laptop",
  "telefon",
  "mobitel",
  "playstation",
  "xbox",
  "nintendo",
  "golf",
  "audi",
  "bmw",
  "mercedes",
  "volkswagen",
  "passat",
  "polo",
  "arteon",
  "tiguan",
  "touareg",
  "skoda",
  "seat",
  "opel",
  "peugeot",
  "renault",
  "fiat",
  "ford",
  "toyota",
  "honda",
  "mazda",
  "hyundai",
  "kia",
  "volvo",
  "stan",
  "kuća",
  "kuca",
  "apartman",
  "garsonjera",
  "namještaj",
  "namjestaj",
  "kauč",
  "kauc",
  "sto",
  "stolica",
  "ormar",
  "krevet",
  "madrac",
  "tepih",
  "zavjese",
  "lusteri",
  "bicikl",
  "biciklo",
  "motor",
  "skuter",
  "auto",
  "automobil",
  "vozilo",
  "dijelovi",
  "gume",
  "felge",
  "branici",
  "farovi",
  "retrovizor",
  "mjenjač",
  "mjenjac",
  "tv",
  "televizor",
  "monitor",
  "računar",
  "racunar",
  "kompjuter",
  "tablet",
  "sat",
  "nakit",
  "odjeća",
  "odjeca",
  "jakna",
  "hlače",
  "hlace",
  "majica",
  "cipele",
  "patike",
  "tenisice",
  "torba",
  "ranac",
  "novčanik",
  "novcanik",
  "sunčane",
  "suncane",
  "naočale",
  "naocale",
  "frižider",
  "frizider",
  "veš mašina",
  "ves masina",
  "šporet",
  "sporet",
  "peć",
  "pec",
  "klima",
  "bojler",
  "usisivač",
  "usisivac",
  "mikser",
  "blender",
  "toster",
  "kuhalo",
  "gitara",
  "klavir",
  "violina",
  "bubnjevi",
  "mikrofon",
  "zvučnik",
  "zvucnik",
  "slušalice",
  "slusalice",
  "knjiga",
  "udžbenik",
  "udzbenika",
  "skripta",
  "rječnik",
  "rjecnik",
  "pas",
  "mačka",
  "macka",
  "papagaj",
  "hrčak",
  "hrcak",
  "akvarijum",
  "terarijum",
  "alat",
  "bušilica",
  "busilica",
  "brusilica",
  "šrafciger",
  "srafciger",
  "ključ",
  "kljuc",
  "sarajevo",
  "mostar",
  "banja luka",
  "tuzla",
  "zenica",
  "bihać",
  "bihac",
  "travnik",
];

// Calculate Levenshtein distance for autocorrect
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
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
};

// Find similar terms for "Did you mean?"
const findSimilarTerms = (query, maxSuggestions = 3) => {
  if (!query || query.length < 2) return [];

  const queryLower = query.toLowerCase().trim();
  const suggestions = [];

  for (const term of COMMON_TERMS) {
    if (term === queryLower) continue;

    if (term.startsWith(queryLower)) {
      suggestions.push({ term, distance: 0, type: "startsWith" });
      continue;
    }

    if (queryLower.startsWith(term)) {
      continue;
    }

    if (Math.abs(term.length - queryLower.length) <= 3) {
      const distance = levenshteinDistance(queryLower, term);
      if (distance <= Math.max(2, Math.floor(queryLower.length / 3))) {
        suggestions.push({ term, distance, type: "similar" });
      }
    }
  }

  suggestions.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.term.localeCompare(b.term);
  });

  return suggestions.slice(0, maxSuggestions).map((s) => s.term);
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

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("all-categories");
  const selectedItem = categoryList.find((item) => item.slug === value);
  const hasMore = catCurrentPage < catLastPage;
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

  // Load search history from localStorage
  useEffect(() => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
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

  // Remove single item from history
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

  // Clear all history
  const clearAllHistory = useCallback(() => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      setSearchHistory([]);
    } catch (e) {
      console.error("Failed to clear history:", e);
    }
  }, []);

  useEffect(() => {
    if (open && inView && hasMore && !isCatLoadMore) {
      getCategories(catCurrentPage + 1);
    }
  }, [hasMore, inView, isCatLoadMore, open, catCurrentPage, getCategories]);

  // Flatten categories for search
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

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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
        const ads = result.data?.data || [];

        // If no results, find similar terms for "Did you mean?"
        if (ads.length === 0) {
          const similar = findSimilarTerms(query);
          setDidYouMean(similar);
          setSuggestions([]);
          setSuggestedCategories([]);
          setSuggestedUsers([]);
          return;
        }

        // Clear "did you mean" if we have results
        setDidYouMean([]);

        // Extract unique search suggestions from ad titles
        const titleWords = new Set();
        const queryLower = query.toLowerCase();

        ads.forEach((ad) => {
          const title = ad.translated_name || ad.name || "";
          if (title.toLowerCase().includes(queryLower)) {
            titleWords.add(title);
          }
          const words = title.split(/\s+/);
          for (let i = 0; i < words.length; i++) {
            if (words[i].toLowerCase().includes(queryLower)) {
              const phrase = words.slice(i, i + 3).join(" ");
              if (phrase.length > query.length) {
                titleWords.add(phrase);
              }
            }
          }
        });

        const searchSuggestions = Array.from(titleWords)
          .filter((s) => s.toLowerCase() !== queryLower)
          .slice(0, 5);

        setSuggestions(searchSuggestions);

        // Extract categories
        const categoryMap = new Map();
        const flatCats = flattenCategories(cateData);
        const catLookup = new Map(flatCats.map((c) => [c.id, c]));

        ads.forEach((ad) => {
          if (ad.category_id && catLookup.has(ad.category_id)) {
            const cat = catLookup.get(ad.category_id);
            const existing = categoryMap.get(cat.id);
            if (existing) {
              existing.count += 1;
            } else {
              categoryMap.set(cat.id, { ...cat, count: 1 });
            }
          }
        });

        const catResults = Array.from(categoryMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);

        setSuggestedCategories(catResults);

        // Extract users
        const userMap = new Map();
        ads.forEach((ad) => {
          if (ad.user) {
            const existing = userMap.get(ad.user.id);
            if (existing) {
              existing.adCount += 1;
            } else {
              userMap.set(ad.user.id, { ...ad.user, adCount: 1 });
            }
          }
        });

        const userResults = Array.from(userMap.values())
          .sort((a, b) => b.adCount - a.adCount)
          .slice(0, 3);

        setSuggestedUsers(userResults);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Search error:", error);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [cateData, flattenCategories]
  );

  // Debounced search + fix loader kad je prazno
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

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

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
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

        if (!searchQuery) {
          setIsSearchFocused(false);
        }
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

  const getAllNavigableItems = useCallback(() => {
    const items = [];

    if (searchQuery.length < 2) {
      searchHistory.forEach((h) =>
        items.push({ type: "history", value: h, label: h })
      );
    } else {
      didYouMean.forEach((term) =>
        items.push({ type: "didYouMean", value: term, label: term })
      );

      suggestions.forEach((s) =>
        items.push({ type: "suggestion", value: s, label: s })
      );

      suggestedCategories.forEach((c) =>
        items.push({
          type: "category",
          value: c,
          label: c.search_name || c.translated_name || c.name,
        })
      );

      suggestedUsers.forEach((u) =>
        items.push({ type: "user", value: u, label: u.name })
      );
    }

    return items;
  }, [
    searchQuery,
    searchHistory,
    didYouMean,
    suggestions,
    suggestedCategories,
    suggestedUsers,
  ]);

  const isItemSelected = useCallback(
    (type, itemIndex) => {
      const items = getAllNavigableItems();
      let typeIndex = 0;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type === type) {
          if (typeIndex === itemIndex && i === selectedIndex) {
            return true;
          }
          typeIndex++;
        }
      }

      return false;
    },
    [getAllNavigableItems, selectedIndex]
  );

  // MAIN: submit search (klik na dugme / enter)
  const handleSearchNav = useCallback(
    (e, customQuery = null) => {
      e?.preventDefault();
      const raw = customQuery ?? searchQuery;
      const query = (raw || "").trim();

      // ako je prazno → idi na sve oglase
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
        ? `/ads?category=${category.slug}&query=${encodeURIComponent(
            searchQuery
          )}`
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
    if (!searchQuery) {
      setIsSearchFocused(false);
    }
  }, [searchQuery]);

  const handleItemSelect = useCallback(
    (item) => {
      switch (item.type) {
        case "history":
        case "suggestion":
        case "didYouMean":
          setSearchQuery(item.value);
          saveToHistory(item.value);
          handleSearchNav(null, item.value);
          break;

        case "category":
          handleCategoryClick(item.value);
          break;

        case "user":
          handleUserClick(item.value);
          break;

        default:
          break;
      }
    },
    [saveToHistory, handleSearchNav, handleCategoryClick, handleUserClick]
  );

  const handleKeyDown = useCallback(
    (e) => {
      const items = getAllNavigableItems();

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setShowSuggestions(true);
          setSelectedIndex((prev) =>
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setShowSuggestions(true);
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;

        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            const item = items[selectedIndex];
            handleItemSelect(item);
          } else {
            handleSearchNav(e);
          }
          break;

        case "Escape":
          e.preventDefault();
          setShowSuggestions(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;

        case "Tab":
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;

        default:
          break;
      }
    },
    [getAllNavigableItems, selectedIndex, handleItemSelect, handleSearchNav]
  );

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

  // aktivno stanje za animaciju (kad treba da logo nestane)
  const isSearchActive =
    isSearchFocused || !!searchQuery || showSuggestions;

  return (
    <>
      {/* RED: logo + search */}
      <div className="w-full flex items-center gap-3">
        {/* LOGO zauzima dio širine, skuplja se na focus */}
        {settings?.header_logo && (
          <div
            className={cn(
              "transition-all duration-300 ease-in-out overflow-hidden",
              isSearchActive
                ? "w-0 opacity-0 -translate-x-2"
                : "w-[40px] sm:w-[160px] opacity-100 translate-x-0"
            )}
          >
<Link href="/" className="block cursor-pointer">
  <CustomImage
    src={settings.header_logo}
    width={195}
    height={52}
    alt="lmx logo"
    className="w-full h-[42px] sm:h-[40px] object-contain ltr:object-left rtl:object-right"
  />
</Link>
          </div>
        )}

        {/* SEARCH – uvijek flex-1, kad logo nestane → zauzme full širinu */}
        <div
          ref={searchContainerRef}
          className={cn(
            "relative flex-1 transition-transform duration-300 ease-out",
            isSearchActive ? "scale-[1.02]" : "scale-100"
          )}
        >
          <form
            onSubmit={handleSearchNav}
            className="w-full flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1.5 sm:py-2
           border-2 border-primary/40 hover:border-primary transition-all duration-200"

          >
            <BiPlanet color="#595B6C" className="min-w-4 min-h-4" />
            <input
              ref={inputRef}
              type="text"
              placeholder={t("searchAd")}
              className="text-sm outline-none w-full bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            {isSearching ? (
              <div className="p-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            ) : (
              <button
                className="flex items-center gap-2 bg-primary text-white p-2 rounded-full transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95"
                type="submit"
              >
                <FaSearch size={14} />
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto animate-in fade-in-0 slide-in-from-top-2 duration-200 z-[9999]">
              {/* Search History (when no query) */}
              {showHistory && (
                <div className="p-3 border-b border-gray-100 animate-in fade-in-0 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
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
                        style={{ animationDelay: `${index * 50}ms` }}
                        className={cn(
                          "flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-200 animate-in fade-in-0 slide-in-from-left-2",
                          isItemSelected("history", index)
                            ? "bg-primary/10 scale-[1.02]"
                            : "hover:bg-gray-50 hover:translate-x-1"
                        )}
                        onClick={() => handleHistoryClick(query)}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {query}
                          </span>
                        </div>
                        <button
                          onClick={(e) => removeFromHistory(query, e)}
                          className="p-1 hover:bg-gray-200 rounded transition-all duration-200 hover:rotate-90"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Loading state */}
              {isSearching && searchQuery.length >= 2 && !hasResults && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <div className="absolute inset-0 w-8 h-8 border-2 border-primary/20 rounded-full animate-ping" />
                    </div>
                    <span className="text-sm text-gray-500 animate-pulse">
                      Tražim...
                    </span>
                  </div>
                </div>
              )}

              {/* Did you mean? */}
              {showDidYouMean && (
                <div className="p-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
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
                          className={cn(
                            "text-primary font-medium transition-all duration-200 hover:underline hover:text-primary/80",
                            isItemSelected("didYouMean", index) &&
                              "underline bg-primary/10 px-1 rounded"
                          )}
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

              {/* No results */}
              {showNoResults && (
                <div className="py-8 text-center animate-in fade-in-0 zoom-in-95 duration-300">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <SearchIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Nema rezultata za{" "}
                    <span className="font-medium">"{searchQuery}"</span>
                  </p>
                </div>
              )}

              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-3 border-b border-gray-100 animate-in fade-in-0 duration-300">
                  <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <SearchIcon className="w-3 h-3" />
                    Prijedlozi pretrage
                  </div>
                  <ul className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all duration-200 animate-in fade-in-0 slide-in-from-left-2",
                          isItemSelected("suggestion", index)
                            ? "bg-primary/10 scale-[1.02]"
                            : "hover:bg-gray-50 hover:translate-x-1"
                        )}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <SearchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">
                          {suggestion}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Categories */}
              {suggestedCategories.length > 0 && (
                <div className="p-3 border-b border-gray-100 animate-in fade-in-0 duration-300 delay-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
                      <Folder className="w-3 h-3" />
                      Kategorije
                    </div>
                    <button
                      onClick={handleViewAllCategories}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-all duration-200 hover:gap-2 group"
                    >
                      <span>Pogledaj sve</span>
                      <ChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {suggestedCategories.map((category, index) => (
                      <li
                        key={category.id}
                        style={{
                          animationDelay: `${
                            (index + suggestions.length) * 50
                          }ms`,
                        }}
                        className={cn(
                          "flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-200 animate-in fade-in-0 slide-in-from-left-2",
                          isItemSelected("category", index)
                            ? "bg-primary/10 scale-[1.02]"
                            : "hover:bg-gray-50 hover:translate-x-1"
                        )}
                        onClick={() => handleCategoryClick(category)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Folder className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">
                            {category.search_name ||
                              category.translated_name ||
                              category.name}
                          </span>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                          {category.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Users */}
              {suggestedUsers.length > 0 && (
                <div className="p-3 animate-in fade-in-0 duration-300 delay-150">
                  <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Korisnici
                  </div>
                  <ul className="space-y-1">
                    {suggestedUsers.map((user, index) => (
                      <li
                        key={user.id}
                        style={{
                          animationDelay: `${
                            (index +
                              suggestions.length +
                              suggestedCategories.length) *
                            50
                          }ms`,
                        }}
                        className={cn(
                          "flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-200 animate-in fade-in-0 slide-in-from-left-2",
                          isItemSelected("user", index)
                            ? "bg-primary/10 scale-[1.02]"
                            : "hover:bg-gray-50 hover:translate-x-1"
                        )}
                        onClick={() => handleUserClick(user)}
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
                              <User className="w-3.5 h-3.5 text-gray-500" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-700">
                              {user.name}
                            </span>
                            {user.average_rating && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <FaStar className="w-2.5 h-2.5 text-yellow-400" />
                                {user.average_rating.toFixed(1)}
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
