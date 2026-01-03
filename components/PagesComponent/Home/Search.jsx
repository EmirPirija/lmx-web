"use client";

import { Check, ChevronsUpDown, Loader2, Search as SearchIcon, User, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
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
  
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (open && inView && hasMore && !isCatLoadMore) {
      getCategories(catCurrentPage + 1);
    }
  }, [hasMore, inView, isCatLoadMore, open]);

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
        result = result.concat(flattenCategories(cat.subcategories, [...parentPath, name]));
      }
    });
    return result;
  }, []);

  // Search API
  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setSuggestedCategories([]);
      setSuggestedUsers([]);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://admin.lmx.ba/api/get-item?search=${encodeURIComponent(query)}&per_page=50`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) throw new Error("Search failed");

      const result = await response.json();
      const ads = result.data?.data || [];

      // Extract unique search suggestions from ad titles
      const titleWords = new Set();
      const queryLower = query.toLowerCase();
      
      ads.forEach((ad) => {
        const title = ad.translated_name || ad.name || "";
        // Add full title as suggestion if it contains the query
        if (title.toLowerCase().includes(queryLower)) {
          titleWords.add(title);
        }
        // Also extract meaningful phrases
        const words = title.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
          if (words[i].toLowerCase().includes(queryLower)) {
            // Add the word and next 1-2 words as suggestion
            const phrase = words.slice(i, i + 3).join(" ");
            if (phrase.length > query.length) {
              titleWords.add(phrase);
            }
          }
        }
      });

      // Convert to array and limit
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
  }, [cateData, flattenCategories]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setSuggestedCategories([]);
      setSuggestedUsers([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
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
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleSearchNav = (e, customQuery = null) => {
    e?.preventDefault();
    const query = encodeURIComponent(customQuery || searchQuery);
    
    if (!query) return;

    const baseUrl = `/ads?query=${query}`;
    const url = selectedItem?.slug === "all-categories"
      ? baseUrl
      : `/ads?category=${selectedItem?.slug}&query=${query}`;

    setShowSuggestions(false);

    if (pathname === "/ads") {
      window.history.pushState(null, "", url);
      window.dispatchEvent(new Event("popstate"));
    } else {
      navigate(url);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearchNav(null, suggestion);
  };

  const handleCategoryClick = (category) => {
    setShowSuggestions(false);
    navigate(`/ads?category=${category.slug}`);
  };

  const handleUserClick = (user) => {
    setShowSuggestions(false);
    navigate(`/seller/${user.id}`);
  };

  const hasResults = suggestions.length > 0 || suggestedCategories.length > 0 || suggestedUsers.length > 0;

  return (
    <>
      {/* Category Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-[125px] max-w-[125px] sm:min-w-[156px] sm:max-w-[156px] py-1 px-1.5 sm:py-2 sm:px-3 justify-between border-none hover:bg-transparent font-normal"
          >
            <span className="truncate">
              {selectedItem?.translated_name || t("selectCat")}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder={t("searchACategory")} />
            <CommandList>
              <CommandEmpty>{t("noCategoryFound")}</CommandEmpty>
              <CommandGroup>
                {categoryList.map((category, index) => {
                  const isLast = open && index === categoryList.length - 1;
                  return (
                    <CommandItem
                      key={category?.slug}
                      value={category?.slug}
                      onSelect={(currentValue) => {
                        setValue(currentValue);
                        setOpen(false);
                      }}
                      ref={isLast ? ref : null}
                    >
                      {category.translated_name || category?.name}
                      <Check
                        className={cn(
                          "ml-auto",
                          value === category.slug ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {isCatLoadMore && (
                <div className="flex justify-center items-center pb-2 text-muted-foreground">
                  <Loader2 className="animate-spin" />
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Search Input with Autocomplete */}
      <div ref={searchContainerRef} className="relative w-full">
        <form
          onSubmit={handleSearchNav}
          className="w-full flex items-center gap-2 ltr:border-l rtl:border-r py-1 px-1.5 sm:py-2 sm:px-3"
        >
          <BiPlanet color="#595B6C" className="min-w-4 min-h-4" />
          <input
            type="text"
            placeholder={t("searchAd")}
            className="text-sm outline-none w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
          />
          {isSearching ? (
            <div className="p-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          ) : (
            <button
              className="flex items-center gap-2 bg-primary text-white p-2 rounded"
              type="submit"
            >
              <FaSearch size={14} />
            </button>
          )}
        </form>

        {/* Autocomplete Dropdown */}
        {showSuggestions && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
            
            {isSearching && !hasResults ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-gray-500">Tražim...</span>
              </div>
            ) : !hasResults ? (
              <div className="py-4 text-center text-sm text-gray-500">
                Nema rezultata za "{searchQuery}"
              </div>
            ) : (
              <>
                {/* Search Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-3 border-b border-gray-100">
                    <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                      <SearchIcon className="w-3 h-3" />
                      Prijedlozi pretrage
                    </div>
                    <ul className="space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer transition-colors"
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
                  <div className="p-3 border-b border-gray-100">
                    <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                      <Folder className="w-3 h-3" />
                      Kategorije
                    </div>
                    <ul className="space-y-1">
                      {suggestedCategories.map((category) => (
                        <li
                          key={category.id}
                          className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleCategoryClick(category)}
                        >
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {category.search_name || category.translated_name || category.name}
                            </span>
                          </div>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {category.count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Users */}
                {suggestedUsers.length > 0 && (
                  <div className="p-3">
                    <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                      <User className="w-3 h-3" />
                      Korisnici
                    </div>
                    <ul className="space-y-1">
                      {suggestedUsers.map((user) => (
                        <li
                          key={user.id}
                          className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleUserClick(user)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {user.profile ? (
                                <img
                                  src={user.profile}
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-3 h-3 text-gray-400" />
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
                          <span className="text-xs text-gray-400">
                            {user.adCount} oglasa
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Search;
