"use client";

import { X, Search, ChevronRight, LayoutGrid, ArrowRight, CornerDownRight, Loader2 } from "@/components/Common/UnifiedIconPack";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useNavigate } from "../Common/useNavigate"; 
import useGetCategories from "../Layout/useGetCategories"; 
import { categoryApi } from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";

// --- HELPERI ---
const formatAdCount = (count) => {
  const num = parseInt(count, 10);
  if (isNaN(num) || num === 0) return "0 oglasa";
  const mod10 = num % 10;
  const mod100 = num % 100;
  if (mod10 === 1 && mod100 !== 11) return `${num} oglas`;
  return `${num} oglasa`;
};

// Rekurzivna funkcija za ravnanje stabla (za Lookup mapu)
const flattenForLookup = (categories = []) => {
  let map = new Map();
  categories.forEach((cat) => {
    map.set(cat.id, cat); // Mapiramo ID -> Cijeli objekt kategorije (gdje je slug ispravan)
    if (cat.subcategories?.length) {
      const subMap = flattenForLookup(cat.subcategories);
      map = new Map([...map, ...subMap]);
    }
  });
  return map;
};

// --- SKELETON ---
const CategorySkeleton = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    ))}
  </div>
);

const CategoryPopup = ({ onClose, extraDetails }) => {
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedParent, setSelectedParent] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const { cateData, isCatLoading } = useGetCategories();

  // 1. KREIRAMO LOOKUP MAPU IZ GLAVNIH PODATAKA
  // Ovo nam služi da "popravimo" podatke iz pretrage ako im fali slug
  const categoryLookup = useMemo(() => {
    if (!cateData) return new Map();
    return flattenForLookup(cateData);
  }, [cateData]);

  // --- SEARCH LOGIKA ---
  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `https://admin.lmx.ba/api/get-item?search=${encodeURIComponent(query)}&per_page=50`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) throw new Error("Search failed");
      const result = await response.json();
      const ads = result.data?.data || [];

      const categoryMap = new Map();

      ads.forEach((ad) => {
        if (ad.category) {
          const catId = ad.category.id;
          
          // OVDJE JE FIX: 
          // Pokušaj naći kategoriju u našem 'categoryLookup' (gdje sigurno imamo slug)
          // Ako ne nađemo, koristi ono što je API vratio (fallback)
          const originalCat = categoryLookup.get(catId);
          
          const categoryData = {
            ...ad.category, // Podaci iz pretrage (možda fali slug)
            ...(originalCat || {}), // Prepiši podacima iz stabla (siguran slug)
            search_name: ad.category.translated_name || ad.category.name,
          };

          const existing = categoryMap.get(catId);
          if (existing) {
            existing.adCount += 1;
          } else {
            categoryMap.set(catId, {
              ...categoryData,
              adCount: 1,
            });
          }
        }
      });

      const resultsArray = Array.from(categoryMap.values()).sort((a, b) => b.adCount - a.adCount);
      setSearchResults(resultsArray);

    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Search error:", error);
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, [categoryLookup]); // Dodali smo categoryLookup u dependency

  // --- DEBOUNCE ---
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchTerm.length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchTerm);
      }, 400);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, performSearch]);


  // --- SELECT LOGIKA ---
  const selectCategory = (category) => {
    // FIX: Primamo cijeli objekt 'category' umjesto samo sluga da možemo provjeriti
    const slug = category?.slug || category?.id; // Fallback na ID ako baš nema sluga

    const newSearchParams = new URLSearchParams(searchParams);
    
    if (slug) {
      newSearchParams.set("category", slug);
    } else {
      // Ako i dalje nema ničega, tek onda brišemo (ovo sprječava onaj bug "prikaži sve")
      console.warn("Kategorija nema slug ni ID:", category);
      newSearchParams.delete("category");
    }

    Object.keys(extraDetails || {}).forEach((key) => newSearchParams.delete(key));

    const url = `/ads?${newSearchParams.toString()}`;
    if (pathname.startsWith("/ads")) window.history.pushState(null, "", url);
    else navigate(url);
    
    onClose();
  };

  const handleBrowseClick = async (category) => {
    if (category.subcategories_count > 0) {
      if (selectedParent?.id === category.id) {
        setSelectedParent(null);
        return;
      }
      setIsLoadingSubs(true);
      setSelectedParent(category);
      try {
        const response = await categoryApi.getCategory({ category_id: category.id, page: 1 });
        setSubcategories(response.data.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSubs(false);
      }
    } else {
      selectCategory(category);
    }
  };

  const currentCategorySlug = searchParams.get("category");
  const showSearchResults = searchTerm.length >= 2;

  const getDisplayCount = (cat) => {
    if (cat.adCount !== undefined) return cat.adCount;
    return cat.all_items_count ?? cat.items_count ?? 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300" onClick={(e) => e.stopPropagation()}>
        
        <div className="px-6 py-5 border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Kategorije</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {showSearchResults ? `Rezultati za "${searchTerm}"` : "Odaberi kategoriju"}
              </p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Traži (npr. Golf, Stan, iPhone...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {isSearching && (
               <div className="absolute right-3 top-1/2 -translate-y-1/2">
                 <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
               </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-200">
          {!showSearchResults && (
            <button onClick={() => selectCategory({ slug: null })} className={`w-full p-4 mb-2 rounded-xl flex items-center gap-3 transition-all border border-transparent ${!currentCategorySlug ? "bg-blue-50 border-blue-200 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"}`}>
              <div className={`p-2 rounded-lg ${!currentCategorySlug ? "bg-blue-100" : "bg-gray-100"}`}>
                 <LayoutGrid className="w-5 h-5" />
              </div>
              <span>Sve kategorije</span>
            </button>
          )}

          {isCatLoading && !showSearchResults ? (
            <CategorySkeleton />
          ) : (
            <div className="space-y-1">
              {showSearchResults ? (
                // --- SEARCH RESULT MODE ---
                searchResults.length > 0 ? (
                  searchResults.map((cat) => {
                     // Koristimo slug ako postoji, ako ne ID za usporedbu (fallback)
                     const catIdentifier = cat.slug || cat.id;
                     const isSelected = currentCategorySlug === catIdentifier?.toString();
                     
                     return (
                      <button 
                        key={cat.id} 
                        // FIX: Šaljemo cijeli objekt selectCategory funkciji
                        onClick={() => selectCategory(cat)} 
                        className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors border border-transparent ${isSelected ? "bg-blue-50 border-blue-100" : "hover:bg-gray-50 hover:border-gray-100"}`}
                      >
                        <div className={`mt-0.5 p-1.5 rounded-lg ${isSelected ? "bg-blue-200 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                          <Search className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                           <div className={`text-sm ${isSelected ? "font-bold text-blue-800" : "font-semibold text-gray-800"}`}>
                             {cat.search_name}
                           </div>
                           <div className="text-xs text-gray-500 mt-0.5">
                             Pronađeno: {formatAdCount(getDisplayCount(cat))}
                           </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 self-center" />
                      </button>
                    );
                  })
                ) : (
                  !isSearching && (
                    <div className="text-center py-10 flex flex-col items-center">
                      <div className="bg-gray-50 p-4 rounded-full mb-3">
                         <Search className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">Nema rezultata za "{searchTerm}"</p>
                    </div>
                  )
                )
              ) : (
                // --- BROWSE MODE ---
                cateData.map((cat) => {
                  const isExpanded = selectedParent?.id === cat.id;
                  const isActive = currentCategorySlug === cat.slug;
                  const hasChildren = cat.subcategories_count > 0;

                  return (
                    <div key={cat.id} className="group overflow-hidden rounded-xl transition-all select-none">
                      <div onClick={() => handleBrowseClick(cat)} className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isActive ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                        <div className="flex-1 flex items-center gap-3">
                           <div className="flex flex-col">
                             <span className={`text-sm ${isActive ? "font-bold text-blue-700" : "font-semibold text-gray-700"}`}>{cat.translated_name || cat.name}</span>
                             <span className="text-xs text-gray-400 font-medium">{formatAdCount(getDisplayCount(cat))}</span>
                           </div>
                        </div>
                        {hasChildren ? (
                          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-90 text-blue-600" : ""}`} />
                        ) : (
                          isActive && <div className="w-2 h-2 rounded-full bg-blue-600 mr-2"></div>
                        )}
                      </div>

                      <div className={`grid transition-[grid-template-rows] duration-300 ease-out pl-4 ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                          <div className="pl-3 border-l-2 border-gray-100 my-1 py-1 space-y-1">
                            {isLoadingSubs ? (
                               <div className="flex items-center gap-2 py-2 px-2 text-xs text-gray-400">
                                 <Loader2 className="w-3 h-3 animate-spin" /> Učitavanje...
                               </div>
                            ) : (
                              subcategories.map((sub) => {
                                 const isSubActive = currentCategorySlug === sub.slug;
                                 return (
                                  <button key={sub.id} onClick={(e) => { e.stopPropagation(); selectCategory(sub); }} className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors text-left ${isSubActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                                    <div className="flex items-center gap-2">
                                        <CornerDownRight className="w-4 h-4 text-gray-300" />
                                        <span>{sub.translated_name || sub.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{formatAdCount(getDisplayCount(sub))}</span>
                                  </button>
                                 )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPopup;
