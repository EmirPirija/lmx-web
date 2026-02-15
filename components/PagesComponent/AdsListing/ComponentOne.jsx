"use client";

import { memo, useMemo, useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import {
  Search,
  X,
  ChevronRight,
  Star,
  User,
  Layers,
  ArrowRight,
  Loader2,
  SearchX,
  History
} from "@/components/Common/UnifiedIconPack";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CustomImage from "@/components/Common/CustomImage";
import CategorySemanticIcon from "@/components/Common/CategorySemanticIcon";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "https://admin.lmx.ba").replace(/\/+$/, "");
const API_ENDPOINT_PREFIX = (process.env.NEXT_PUBLIC_END_POINT || "/api/")
  .replace(/^\/?/, "/")
  .replace(/\/?$/, "/");

const buildApiUrl = (path, params = {}) => {
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  const url = new URL(`${API_BASE_URL}${API_ENDPOINT_PREFIX}${normalizedPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

// ═══════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.02 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

// ═══════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════
const SectionHeader = ({ icon: Icon, title, count, action }) => (
  <div className="flex items-center justify-between mb-3 px-1">
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
        <Icon size={16} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 md:text-base">{title}</h3>
        {count !== undefined && (
          <p className="text-[10px] text-gray-500 dark:text-slate-400 md:text-xs">{count} rezultata</p>
        )}
      </div>
    </div>
    {action}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// RECENT CATEGORY PILL (Redesigned - Compact Chip Style)
// ═══════════════════════════════════════════════════════════════════
const RecentPill = memo(({ category, onClick, index }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    type="button"
    onClick={() => onClick(category)}
    className="
      group shrink-0 flex items-center gap-2.5 pl-1.5 pr-4 py-1.5
      bg-white border border-gray-200 rounded-full shadow-sm
      hover:border-blue-400 hover:shadow-md hover:bg-blue-50/10
      dark:bg-slate-900 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:bg-blue-500/10
      transition-all duration-300 cursor-pointer
    "
  >
    <div className="
      w-7 h-7 rounded-full bg-gray-50 border border-gray-100 
      flex items-center justify-center overflow-hidden shrink-0
      dark:bg-slate-800 dark:border-slate-700
      group-hover:scale-110 transition-transform duration-300
    ">
      {isRootCategory(category) ? (
        <CategorySemanticIcon category={category} className="w-4 h-4" />
      ) : (
        <CategorySemanticIcon category={category} className="w-4 h-4" />
      )}
    </div>
    <span className="max-w-[120px] truncate whitespace-nowrap text-xs font-semibold text-gray-700 group-hover:text-blue-700 dark:text-slate-200 dark:group-hover:text-blue-300">
      {category.translated_name || category.name}
    </span>
  </motion.button>
));
RecentPill.displayName = "RecentPill";

// ═══════════════════════════════════════════════════════════════════
// CATEGORY LIST ITEM (Pure List Style)
// ═══════════════════════════════════════════════════════════════════
const CategoryListItem = memo(({ category, onClick, showPath = false, adCount = null }) => {
  const hasChildren = Number(category?.subcategories_count || 0) > 0;

  return (
    <motion.button
      variants={itemVariants}
      whileTap={{ scale: 0.99 }}
      type="button"
      onClick={() => onClick(category)}
      className="
        group w-full flex items-center p-3 md:p-4 
        bg-white border border-gray-100 rounded-xl md:rounded-2xl
        hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30
        dark:bg-slate-900 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-blue-500/10
        transition-all duration-200
      "
    >
      {/* Icon */}
      <div className="
        shrink-0 mr-4
        w-10 h-10 md:w-12 md:h-12 
        rounded-lg md:rounded-xl 
        bg-gray-50 border border-gray-100 
        flex items-center justify-center 
        dark:bg-slate-800 dark:border-slate-700
        group-hover:bg-white group-hover:border-blue-100 transition-colors
      ">
        {isRootCategory(category) ? (
          <CategorySemanticIcon
            category={category}
            className="w-6 h-6 md:w-7 md:h-7 opacity-90 group-hover:scale-110 transition-transform"
          />
        ) : (
          <CategorySemanticIcon
            category={category}
            className="w-6 h-6 md:w-7 md:h-7 opacity-90 group-hover:scale-110 transition-transform"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <span className="line-clamp-1 text-sm font-semibold text-gray-800 transition-colors group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300 md:text-base">
          {category?.search_name || category?.translated_name || category?.name}
        </span>
        
        {showPath && category?.full_path ? (
          <span className="mt-0.5 block truncate text-[10px] text-gray-400 dark:text-slate-400 md:text-xs">
            {category.full_path}
          </span>
        ) : (
          <div className="flex items-center gap-2 mt-0.5 md:mt-1">
            {hasChildren && (
              <span className="text-[10px] text-gray-500 dark:text-slate-400 md:text-xs">
                {category?.subcategories_count} podkategorija
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Side Info & Arrow */}
      <div className="flex items-center gap-3 ml-2 shrink-0">
        {adCount !== null && adCount > 0 && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-blue-500/20 dark:group-hover:text-blue-300">
            {adCount}
          </span>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 transition-colors group-hover:bg-blue-500 dark:bg-slate-800 dark:group-hover:bg-blue-500">
          <ChevronRight size={16} className="text-gray-400 transition-colors group-hover:text-white dark:text-slate-400" />
        </div>
      </div>
    </motion.button>
  );
});
CategoryListItem.displayName = "CategoryListItem";

// ═══════════════════════════════════════════════════════════════════
// USER CARD (Compact List Style)
// ═══════════════════════════════════════════════════════════════════
const UserListItem = memo(({ user, onClick }) => {
  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(user)}
      className="
        flex items-center gap-3 p-3 w-full text-left
        bg-white border border-gray-100 rounded-xl
        hover:border-blue-200 hover:shadow-md transition-all
        dark:bg-slate-900 dark:border-slate-700 dark:hover:border-blue-500
      "
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
        {user?.profile ? (
          <CustomImage
            src={user.profile}
            alt={user.name}
            height={40}
            width={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-400">
            <User size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{user?.name}</p>
        <div className="flex items-center gap-2">
          {user?.average_rating && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={10} fill="currentColor" />
              <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300">{Number(user.average_rating).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-300 dark:text-slate-500" />
    </motion.button>
  );
});
UserListItem.displayName = "UserListItem";

// ═══════════════════════════════════════════════════════════════════
// SEARCH BAR
// ═══════════════════════════════════════════════════════════════════
const SearchBar = ({ value, onChange, isSearching }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`
      relative transition-all duration-300 z-20
      ${isFocused ? 'scale-[1.01]' : 'scale-100'}
    `}>
      <div className={`
        flex items-center w-full h-12 md:h-14 px-4 
        bg-white border-2 rounded-xl md:rounded-2xl dark:bg-slate-900 dark:border-slate-700
        transition-all duration-200
        ${isFocused 
          ? 'border-blue-500 shadow-lg shadow-blue-500/10 dark:border-blue-500' 
          : 'border-gray-100 shadow-sm dark:border-slate-700'
        }
      `}>
        <Search 
          size={20} 
          className={`mr-3 transition-colors ${isFocused ? 'text-blue-500' : 'text-gray-400 dark:text-slate-400'}`} 
        />
        
        <input
          type="text"
          placeholder="Pretraži kategorije..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 h-full bg-transparent outline-none text-sm md:text-base text-gray-800 placeholder:text-gray-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        />

        {value && (
          <button 
            onClick={() => onChange("")}
            className="ml-2 rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X size={16} className="text-gray-400 dark:text-slate-400" />
          </button>
        )}

        {isSearching && (
          <div className="ml-2">
            <Loader2 size={18} className="text-blue-500 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// LOGIC HELPERS
// ═══════════════════════════════════════════════════════════════════
const flattenCategories = (categories = [], parentPath = [], parentId = null) => {
  let result = [];
  categories.forEach((cat) => {
    const name = cat.translated_name || cat.name || cat.translations?.[0]?.name || "";
    const current = {
      ...cat,
      search_name: name,
      full_path: [...parentPath, name].join(" > "),
      parent_id: parentId,
    };
    result.push(current);
    if (cat.subcategories?.length) {
      result = result.concat(flattenCategories(cat.subcategories, [...parentPath, name], cat.id));
    }
  });
  return result;
};

const isRootCategory = (category) => {
  const parentId = category?.parent_id;
  const hasParentId = parentId !== null && parentId !== undefined && Number(parentId) !== 0;
  const fullPath = String(category?.full_path || "");
  const hasNestedPath = fullPath.includes(" > ");
  return !hasParentId && !hasNestedPath;
};

const normalizeSearchKey = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const extractAds = (resultJson) => {
  const d = resultJson?.data;
  const candidates = [d?.data, d?.data?.data, resultJson?.data?.data];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const ComponentOne = ({
  categories = [],
  categoriesLoading,
  fetchMoreCategory,
  lastPage,
  currentPage,
  isLoadMoreCat,
  handleCategoryTabClick,
  onUserClick,
  recentCategories = [],
}) => {
  const [search, setSearch] = useState("");
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef(null);
  const abortAdsRef = useRef(null);

  const localIndex = useMemo(() => {
    const flattened = flattenCategories(categories || []);
    return { flattened };
  }, [categories]);

  const fuse = useMemo(() => {
    if (!localIndex.flattened.length) return null;
    return new Fuse(localIndex.flattened, {
      keys: [{ name: "search_name", weight: 0.7 }, { name: "slug", weight: 0.3 }],
      threshold: 0.4,
      minMatchCharLength: 2,
    });
  }, [localIndex.flattened]);

  const searchUsers = useCallback(async (query) => {
    try {
      const response = await fetch(
        buildApiUrl("users", {
          search: query,
          per_page: 5,
        }),
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) return [];

      const payload = await response.json();
      const rows = Array.isArray(payload?.data) ? payload.data : [];

      return rows.map((user) => ({
        ...user,
        profile: user?.profile || user?.avatar || user?.svg_avatar || null,
      }));
    } catch {
      return [];
    }
  }, []);

  const searchAdsAndCategories = useCallback(async (query) => {
     if (abortAdsRef.current) abortAdsRef.current.abort();
     abortAdsRef.current = new AbortController();
     
     try {
        const response = await fetch(
          buildApiUrl("get-item", { search: query, per_page: 50 }),
          { signal: abortAdsRef.current.signal }
        );
        if(!response.ok) return { cats: [], usersFromAds: [] };

        const result = await response.json();
        const ads = extractAds(result);
        if (!Array.isArray(ads) || ads.length === 0) return { cats: [], usersFromAds: [] };

        const catById = new Map(
          localIndex.flattened
            .filter((c) => c?.id != null)
            .map((c) => [String(c.id), c])
        );
        const catBySlug = new Map(
          localIndex.flattened
            .filter((c) => c?.slug)
            .map((c) => [String(c.slug).toLowerCase(), c])
        );
        const catByName = new Map(
          localIndex.flattened
            .filter((c) => c?.search_name || c?.translated_name || c?.name)
            .map((c) => [
              normalizeSearchKey(c?.search_name || c?.translated_name || c?.name),
              c,
            ])
        );

        const categoryMap = new Map();
        const userMap = new Map();

        ads.forEach((ad) => {
          const adCategory = ad?.category || null;
          const adCategoryId = ad?.category_id ?? adCategory?.id ?? null;
          const adCategorySlug = adCategory?.slug ?? null;
          const adCategoryName = adCategory?.translated_name || adCategory?.name || "";

          const localMatchById =
            adCategoryId != null ? catById.get(String(adCategoryId)) : null;
          const localMatchBySlug = adCategorySlug
            ? catBySlug.get(String(adCategorySlug).toLowerCase())
            : null;
          const localMatchByName = adCategoryName
            ? catByName.get(normalizeSearchKey(adCategoryName))
            : null;
          const resolvedCategory = localMatchById || localMatchBySlug || localMatchByName || adCategory;

          const slug = resolvedCategory?.slug || adCategorySlug || localMatchByName?.slug;
          const fallbackName =
            resolvedCategory?.search_name ||
            resolvedCategory?.translated_name ||
            resolvedCategory?.name ||
            adCategoryName;
          const key =
            (slug && String(slug).toLowerCase()) ||
            (adCategoryId != null ? `id:${String(adCategoryId)}` : "") ||
            (fallbackName ? `name:${normalizeSearchKey(fallbackName)}` : "");
          if (key) {
            const searchName =
              fallbackName || slug || "Kategorija";

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
          }

          if (ad?.user?.id != null) {
            const userKey = String(ad.user.id);
            const existingUser = userMap.get(userKey);
            if (existingUser) existingUser.adCount = (existingUser.adCount || 0) + 1;
            else userMap.set(userKey, { ...ad.user, adCount: 1 });
          }
        });

        const cats = Array.from(categoryMap.values())
          .sort((a, b) => (b.count || 0) - (a.count || 0))
          .slice(0, 10);

        const usersFromAds = Array.from(userMap.values())
          .sort((a, b) => (b.adCount || 0) - (a.adCount || 0))
          .slice(0, 5);

        return { cats, usersFromAds };
     } catch (error) {
        if (error?.name === "AbortError") return { cats: [], usersFromAds: [] };
        return { cats: [], usersFromAds: [] };
     }
  }, [localIndex.flattened]);

  const searchLocalCategories = useCallback((query) => {
      if (!fuse || query.length < 2) return [];
      return fuse.search(query).slice(0, 10).map(r => r.item);
  }, [fuse]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const q = (search || "").trim();
    
    if (q.length < 2) {
      if (abortAdsRef.current) {
        abortAdsRef.current.abort();
      }
      setSuggestedCategories([]);
      setSuggestedUsers([]);
      setIsSearching(false);
      return;
    }

    let isAlive = true;
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const localCats = searchLocalCategories(q);
      const [adsResult, users] = await Promise.all([
        searchAdsAndCategories(q),
        searchUsers(q),
      ]);
      if (!isAlive) return;

      const mergedCategoryMap = new Map();
      (adsResult?.cats || []).forEach((cat) => {
        const key = String(cat?.slug || cat?.id || "").toLowerCase();
        if (!key || mergedCategoryMap.has(key)) return;
        mergedCategoryMap.set(key, cat);
      });
      localCats.forEach((cat) => {
        const key = String(cat?.slug || cat?.id || "").toLowerCase();
        if (!key || mergedCategoryMap.has(key)) return;
        mergedCategoryMap.set(key, cat);
      });

      const mergedUsersMap = new Map();
      (adsResult?.usersFromAds || []).forEach((user) => {
        const key = String(user?.id || "");
        if (!key || mergedUsersMap.has(key)) return;
        mergedUsersMap.set(key, user);
      });
      (users || []).forEach((user) => {
        const key = String(user?.id || "");
        if (!key || mergedUsersMap.has(key)) return;
        mergedUsersMap.set(key, user);
      });

      setSuggestedCategories(Array.from(mergedCategoryMap.values()).slice(0, 10));
      setSuggestedUsers(Array.from(mergedUsersMap.values()).slice(0, 5));
      setIsSearching(false);
    }, 300);

    return () => {
      isAlive = false;
      clearTimeout(searchTimeoutRef.current);
    };
  }, [search, searchAdsAndCategories, searchLocalCategories, searchUsers]);


  const showSearchResults = (search || "").trim().length >= 2;

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Search Section */}
      <div className="sticky top-0 z-30 -mx-2 border-b border-gray-50/50 bg-white/95 px-2 pb-2 pt-2 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/95">
        <SearchBar value={search} onChange={setSearch} isSearching={isSearching} />
      </div>

      {/* 2. Recent Categories - COMPACT CHIPS */}
      <AnimatePresence>
        {!showSearchResults && recentCategories?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-2 px-1">
              <History size={14} className="text-gray-400 dark:text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Nedavno</span>
            </div>
            {/* Horizontal scroll chips */}
            <div className="flex gap-2 overflow-x-auto pb-4 pt-1 px-1 -mx-2 scrollbar-hide snap-x">
              {recentCategories.slice(0, 8).map((c, index) => (
                <div key={c.id} className="snap-start">
                  <RecentPill category={c} onClick={handleCategoryTabClick} index={index} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Content Area */}
      <div>
        {categoriesLoading ? (
          <div className="flex flex-col gap-3">
             {[1,2,3,4,5,6,7,8].map(i => (
                 <Skeleton key={i} className="h-16 w-full rounded-xl" />
             ))}
          </div>
        ) : showSearchResults ? (
          /* SEARCH RESULTS */
          <div className="space-y-6">
            {suggestedCategories.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <SectionHeader icon={Layers} title="Kategorije" count={suggestedCategories.length} />
                <div className="flex flex-col gap-2">
                  {suggestedCategories.map((category) => (
                    <CategoryListItem 
                        key={category.id} 
                        category={category} 
                        onClick={handleCategoryTabClick} 
                        showPath={true}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {suggestedUsers.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <SectionHeader icon={User} title="Prodavači" count={suggestedUsers.length} />
                <div className="flex flex-col gap-2">
                  {suggestedUsers.map((user) => (
                    <UserListItem key={user.id} user={user} onClick={onUserClick || (() => {})} />
                  ))}
                </div>
              </motion.div>
            )}

            {suggestedCategories.length === 0 && suggestedUsers.length === 0 && !isSearching && (
               <div className="text-center py-12">
                  <SearchX size={48} className="mx-auto mb-3 text-gray-200 dark:text-slate-700" />
                  <p className="font-medium text-gray-500 dark:text-slate-400">Nema rezultata za "{search}"</p>
               </div>
            )}
          </div>
        ) : (
          /* CATEGORY LIST (DEFAULT) - PURE LIST VIEW */
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-4 px-1">
               <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Sve kategorije</h2>
               <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                 {categories?.length}
               </span>
            </div>

            {/* LIST LAYOUT */}
            <div className="flex flex-col gap-2 md:gap-3">
              {(categories || []).map((category) => (
                <CategoryListItem
                  key={category.id}
                  category={category}
                  onClick={handleCategoryTabClick}
                />
              ))}
            </div>

            {/* Load More Button */}
            {!search && lastPage > currentPage && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={fetchMoreCategory}
                  disabled={isLoadMoreCat}
                  className="w-full rounded-full border-gray-300 px-8 text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 md:w-auto"
                >
                  {isLoadMoreCat ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <ArrowRight size={16} className="mr-2" />
                  )}
                  Učitaj još
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default memo(ComponentOne);
