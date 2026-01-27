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
  Sparkles,
  Clock,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  Loader2,
  SearchX,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import CustomImage from "@/components/Common/CustomImage";

// ═══════════════════════════════════════════════════════════════════
// LMX BRAND COLORS
// ═══════════════════════════════════════════════════════════════════
const BRAND = {
  blue: "#1A4B8C",
  orange: "#F7941D",
  teal: "#00A19B",
};

// ═══════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ═══════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════
const SectionHeader = ({ icon: Icon, title, count, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2.5">
      <div className="p-2 bg-gradient-to-br from-[#1A4B8C]/10 to-[#00A19B]/10 rounded-xl">
        <Icon size={18} className="text-[#1A4B8C]" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {count !== undefined && (
          <p className="text-xs text-gray-500">{count} dostupno</p>
        )}
      </div>
    </div>
    {action}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// RECENT CATEGORY PILL
// ═══════════════════════════════════════════════════════════════════
const RecentPill = memo(({ category, onClick, index }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.03, y: -2 }}
    whileTap={{ scale: 0.97 }}
    type="button"
    onClick={() => onClick(category)}
    className="
      shrink-0 inline-flex items-center gap-2 px-4 py-2.5
      rounded-full border-2 border-gray-100 bg-white
      hover:border-[#1A4B8C]/30 hover:bg-[#1A4B8C]/5
      shadow-sm hover:shadow-md
      transition-all duration-200
    "
  >
    {category?.image && (
      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
        <CustomImage
          src={category.image}
          alt=""
          width={24}
          height={24}
          className="w-full h-full object-cover"
        />
      </div>
    )}
    <span className="text-sm font-medium text-gray-700">
      {category.translated_name || category.name}
    </span>
  </motion.button>
));
RecentPill.displayName = "RecentPill";

// ═══════════════════════════════════════════════════════════════════
// CATEGORY CARD - REDESIGNED
// ═══════════════════════════════════════════════════════════════════
const CategoryCard = memo(({ category, onClick, showPath = false, adCount = null, index = 0 }) => {
  const hasChildren = Number(category?.subcategories_count || 0) > 0;
  const isPopular = adCount && adCount > 50;

  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={() => onClick(category)}
      className="
        group relative w-full text-left
        rounded-2xl border-2 border-gray-100 bg-white
        p-4 overflow-hidden
        hover:border-[#1A4B8C]/30 hover:shadow-xl hover:shadow-[#1A4B8C]/5
        transition-all duration-300
      "
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A4B8C]/5 via-transparent to-[#00A19B]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute top-2 right-2">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#F7941D] to-[#F7941D]/80 text-white text-[10px] font-bold rounded-full">
            <Zap size={10} />
            Popular
          </span>
        </div>
      )}

      <div className="relative flex items-center gap-4">
        {/* Icon container with gradient border */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A4B8C] to-[#00A19B] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-100 group-hover:border-white flex items-center justify-center overflow-hidden transition-all duration-300">
            <CustomImage
              src={category?.image}
              alt={category?.search_name || category?.translated_name || category?.name}
              height={48}
              width={48}
              loading="lazy"
              className="h-11 w-11 object-contain group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="truncate font-semibold text-gray-800 group-hover:text-[#1A4B8C] transition-colors">
              {category?.search_name || category?.translated_name || category?.name}
            </span>
          </div>

          {showPath && category?.full_path ? (
            <p className="truncate text-xs text-gray-500">
              {category.full_path}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              {hasChildren && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Layers size={12} />
                  {category?.subcategories_count} podkategorija
                </span>
              )}
              {adCount !== null && adCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1A4B8C]/10 text-[#1A4B8C] text-[11px] font-semibold">
                  <Package size={10} />
                  {adCount.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-[#1A4B8C] flex items-center justify-center transition-all duration-300">
            <ChevronRight
              size={18}
              className="text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </motion.button>
  );
});
CategoryCard.displayName = "CategoryCard";

// ═══════════════════════════════════════════════════════════════════
// USER CARD - REDESIGNED
// ═══════════════════════════════════════════════════════════════════
const UserCard = memo(({ user, onClick }) => {
  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={() => onClick(user)}
      className="
        group relative w-full text-left
        rounded-2xl border-2 border-gray-100 bg-white
        p-4 overflow-hidden
        hover:border-[#00A19B]/30 hover:shadow-xl hover:shadow-[#00A19B]/5
        transition-all duration-300
      "
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00A19B]/5 via-transparent to-[#1A4B8C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00A19B] to-[#1A4B8C] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-100 group-hover:border-white flex items-center justify-center overflow-hidden transition-all duration-300">
            {user?.profile ? (
              <CustomImage
                src={user.profile}
                alt={user.name}
                height={56}
                width={56}
                loading="lazy"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="text-gray-400 group-hover:text-[#00A19B] transition-colors" size={24} />
            )}
          </div>
          
          {/* Online indicator (optional) */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-gray-800 group-hover:text-[#00A19B] transition-colors">
            {user?.name}
          </span>

          <div className="flex items-center gap-2 mt-1">
            {user?.average_rating && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                {Number(user.average_rating).toFixed(1)}
              </span>
            )}

            {user?.adCount > 0 && (
              <span className="text-xs text-[#1A4B8C] font-medium">
                {user.adCount === 1 ? "1 oglas" : `${user.adCount} oglasa`}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-[#00A19B] flex items-center justify-center transition-all duration-300">
            <ArrowRight
              size={16}
              className="text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </motion.button>
  );
});
UserCard.displayName = "UserCard";

// ═══════════════════════════════════════════════════════════════════
// SKELETON LOADER
// ═══════════════════════════════════════════════════════════════════
const CardSkeleton = ({ rows = 9 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 bg-white animate-pulse"
      >
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
        </div>
        <div className="w-8 h-8 rounded-xl bg-gray-100" />
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════
const EmptyState = ({ search }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="py-16 text-center"
  >
    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
      <SearchX size={36} className="text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-1">
      Nema rezultata za "{search}"
    </h3>
    <p className="text-gray-500 text-sm max-w-xs mx-auto">
      Pokušajte s drugim pojmom ili pregledajte kategorije ispod
    </p>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════
// SEARCH BAR - REDESIGNED
// ═══════════════════════════════════════════════════════════════════
const SearchBar = ({ value, onChange, isSearching }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      animate={{ scale: isFocused ? 1.01 : 1 }}
      transition={{ duration: 0.2 }}
      className="sticky top-2 z-10"
    >
      <div
        className={`
          relative rounded-2xl transition-all duration-300
          ${isFocused
            ? "shadow-xl shadow-[#1A4B8C]/10"
            : "shadow-lg shadow-gray-200/50"
          }
        `}
      >
        {/* Gradient border effect when focused */}
        <div
          className={`
            absolute inset-0 rounded-2xl bg-gradient-to-r from-[#1A4B8C] via-[#00A19B] to-[#F7941D]
            transition-opacity duration-300
            ${isFocused ? "opacity-100" : "opacity-0"}
          `}
          style={{ padding: "2px" }}
        >
          <div className="w-full h-full bg-white rounded-[14px]" />
        </div>

        <div className="relative">
          {/* Search icon */}
          <div
            className={`
              absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-300
              ${isFocused ? "bg-[#1A4B8C]/10" : "bg-gray-100"}
            `}
          >
            <Search
              size={18}
              className={`transition-colors duration-300 ${isFocused ? "text-[#1A4B8C]" : "text-gray-400"}`}
            />
          </div>

          <input
            type="text"
            placeholder="Šta želite prodati? (npr. iPhone, Golf, Stan...)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              w-full pl-14 pr-14 py-4
              border-2 rounded-2xl
              focus:outline-none
              bg-white transition-all duration-300
              text-gray-800 placeholder:text-gray-400
              ${isFocused ? "border-transparent" : "border-gray-100"}
            `}
          />

          {/* Clear button */}
          <AnimatePresence>
            {value && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={() => onChange("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gray-100 hover:bg-red-100 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Loading spinner */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-14 top-1/2 -translate-y-1/2"
              >
                <Loader2 size={18} className="text-[#1A4B8C] animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search suggestions hint */}
      <AnimatePresence>
        {isFocused && !value && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-xl border border-gray-100 shadow-lg"
          >
            <p className="text-xs text-gray-500 mb-2">Popularni pojmovi:</p>
            <div className="flex flex-wrap gap-2">
              {["iPhone", "Auto", "Stan", "Laptop", "Namještaj"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onChange(term)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-[#1A4B8C]/10 hover:text-[#1A4B8C] text-gray-600 text-xs font-medium rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
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

const extractAds = (resultJson) => {
  const d = resultJson?.data;
  const candidates = [d?.data, d?.data?.data, resultJson?.data?.data, resultJson?.data?.data?.data];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (c && Array.isArray(c.data)) return c.data;
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

  // Build index
  const localIndex = useMemo(() => {
    const flattened = flattenCategories(categories || []);
    const map = new Map();
    flattened.forEach((c) => map.set(c.id, c));
    return { flattened, map };
  }, [categories]);

  const fuse = useMemo(() => {
    if (!localIndex.flattened.length) return null;
    if (localIndex.flattened.length > 8000) return null;
    return new Fuse(localIndex.flattened, {
      keys: [
        { name: "search_name", weight: 0.75 },
        { name: "slug", weight: 0.25 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [localIndex.flattened]);

  const searchUsers = useCallback(async (query) => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("access_token");
      if (!token) return [];

      const url = `https://admin.lmx.ba/customer/id?search=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) return [];
      if (!res.ok) return [];

      const data = await res.json();
      return data?.rows || [];
    } catch (e) {
      console.error("User search error", e);
      return [];
    }
  }, []);

  const searchAdsAndCategories = useCallback(
    async (query) => {
      const q = (query || "").trim();
      if (!q || q.length < 2) return { cats: [], usersFromAds: [] };

      if (abortAdsRef.current) abortAdsRef.current.abort();
      abortAdsRef.current = new AbortController();

      const resolveSuggestedCategoryId = (leafId, apiParentId) => {
        if (!leafId) return null;
        const localLeaf = localIndex.map.get(leafId);
        if (localLeaf) {
          let cur = localLeaf;
          while (cur?.parent_id && localIndex.map.has(cur.parent_id)) {
            cur = localIndex.map.get(cur.parent_id);
          }
          return cur?.id ?? leafId;
        }
        if (apiParentId && localIndex.map.has(apiParentId)) return apiParentId;
        return leafId;
      };

      try {
        const response = await fetch(
          `https://admin.lmx.ba/api/get-item?search=${encodeURIComponent(q)}&limit=100`,
          { signal: abortAdsRef.current.signal }
        );
        if (!response.ok) throw new Error("Ads search failed");

        const result = await response.json();
        const ads = extractAds(result);

        if (!ads.length) return { cats: [], usersFromAds: [] };

        const categoryCounts = new Map();
        const userMap = new Map();

        for (const ad of ads) {
          const leafId = ad?.category_id ?? ad?.category?.id;
          const apiParentId = ad?.category?.parent_category_id ?? null;
          const suggestedId = resolveSuggestedCategoryId(leafId, apiParentId);

          if (suggestedId) {
            categoryCounts.set(suggestedId, (categoryCounts.get(suggestedId) || 0) + 1);
          }

          if (ad?.user?.id) {
            const existing = userMap.get(ad.user.id);
            if (existing) existing.adCount += 1;
            else userMap.set(ad.user.id, { ...ad.user, adCount: 1 });
          }
        }

        const cats = [];
        categoryCounts.forEach((count, cid) => {
          const cat = localIndex.map.get(cid);
          if (cat) cats.push({ ...cat, adCount: count });
        });

        cats.sort((a, b) => (b.adCount || 0) - (a.adCount || 0));

        return {
          cats: cats.slice(0, 12),
          usersFromAds: Array.from(userMap.values())
            .sort((a, b) => (b.adCount || 0) - (a.adCount || 0))
            .slice(0, 6),
        };
      } catch (error) {
        if (error?.name !== "AbortError") console.error("Ads search error:", error);
        return { cats: [], usersFromAds: [] };
      }
    },
    [localIndex.map]
  );

  const searchLocalCategories = useCallback(
    (query) => {
      const q = (query || "").trim();
      if (q.length < 2) return [];

      if (fuse) {
        return fuse.search(q).slice(0, 12).map((r) => r.item);
      }

      const lc = q.toLowerCase();
      return (categories || [])
        .map((c) => ({ ...c, search_name: c.translated_name || c.name || "" }))
        .filter((c) => {
          const name = (c.search_name || "").toLowerCase();
          const slug = (c.slug || "").toLowerCase();
          return name.includes(lc) || slug.includes(lc);
        })
        .slice(0, 12);
    },
    [fuse, categories]
  );

  const mergeUniqueCats = (a = [], b = []) => {
    const m = new Map();
    [...a, ...b].forEach((c) => {
      if (!c?.id) return;
      const prev = m.get(c.id);
      if (!prev) m.set(c.id, c);
      else m.set(c.id, { ...prev, ...c, adCount: c.adCount ?? prev.adCount });
    });
    return Array.from(m.values());
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const q = (search || "").trim();
    if (q.length < 2) {
      setSuggestedCategories([]);
      setSuggestedUsers([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      const [users, adsPack] = await Promise.all([
        searchUsers(q),
        searchAdsAndCategories(q),
      ]);

      const usersFinal = (users?.length ? users : adsPack.usersFromAds || []).map((u) => ({
        ...u,
        adCount: u.items_count || u.adCount || 0,
      }));

      const localCats = searchLocalCategories(q);
      const catsFinal = mergeUniqueCats(adsPack.cats || [], localCats);

      setSuggestedUsers(usersFinal.slice(0, 6));
      setSuggestedCategories(catsFinal.slice(0, 12));
      setIsSearching(false);
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search, searchUsers, searchAdsAndCategories, searchLocalCategories]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortAdsRef.current) abortAdsRef.current.abort();
    };
  }, []);

  const handleUserClick = useCallback(
    (user) => {
      if (onUserClick) onUserClick(user);
      else window.location.href = `/seller/${user.id}`;
    },
    [onUserClick]
  );

  const showSearchResults = (search || "").trim().length >= 2;

  return (
    <div className="flex flex-col gap-6">
      {/* Search Bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        isSearching={isSearching}
      />

      {/* Recent Categories */}
      <AnimatePresence>
        {!showSearchResults && recentCategories?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SectionHeader
              icon={Clock}
              title="Nedavno korištene"
            />
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
              {recentCategories.slice(0, 8).map((c, index) => (
                <RecentPill
                  key={c.id}
                  category={c}
                  onClick={handleCategoryTabClick}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {categoriesLoading ? (
        <CardSkeleton rows={9} />
      ) : showSearchResults ? (
        isSearching ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1A4B8C]/10 to-[#00A19B]/10 flex items-center justify-center">
              <Loader2 size={28} className="text-[#1A4B8C] animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Pretražujem...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Categories Results */}
            {suggestedCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <SectionHeader
                  icon={Layers}
                  title="Kategorije"
                  count={suggestedCategories.length}
                />
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {suggestedCategories.map((category, index) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onClick={handleCategoryTabClick}
                      showPath={!!category.full_path}
                      adCount={category.adCount ?? null}
                      index={index}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Users Results */}
            {suggestedUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <SectionHeader
                  icon={User}
                  title="Prodavci"
                  count={suggestedUsers.length}
                />
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {suggestedUsers.map((user) => (
                    <UserCard key={user.id} user={user} onClick={handleUserClick} />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Empty State */}
            {suggestedUsers.length === 0 && suggestedCategories.length === 0 && (
              <EmptyState search={search} />
            )}
          </div>
        )
      ) : (
        /* Default Categories List */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <SectionHeader
            icon={Sparkles}
            title="Sve kategorije"
            count={categories?.length || 0}
            action={
              <span className="text-xs text-gray-400">
                Odaberite kategoriju za vaš oglas
              </span>
            }
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {(categories || []).map((category, index) => (
              <CategoryCard
                key={category.id}
                category={{
                  ...category,
                  search_name: category.translated_name || category.name || "",
                }}
                onClick={handleCategoryTabClick}
                index={index}
              />
            ))}
          </motion.div>

          {/* Load More */}
          {!search && lastPage > currentPage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-6"
            >
              <Button
                variant="outline"
                className="
                  px-8 py-3 rounded-xl
                  border-2 border-gray-200 hover:border-[#1A4B8C]
                  hover:bg-[#1A4B8C]/5 hover:text-[#1A4B8C]
                  font-semibold transition-all duration-300
                "
                disabled={isLoadMoreCat || categoriesLoading}
                onClick={fetchMoreCategory}
              >
                {isLoadMoreCat ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Učitavam...
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} className="mr-2" />
                    Učitaj još kategorija
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default memo(ComponentOne);