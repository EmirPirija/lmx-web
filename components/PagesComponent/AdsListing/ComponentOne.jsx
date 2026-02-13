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
import CustomImage from "@/components/Common/CustomImage";
import CategorySemanticIcon from "@/components/Common/CategorySemanticIcon";

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
      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
        <Icon size={16} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-sm md:text-base">{title}</h3>
        {count !== undefined && (
          <p className="text-[10px] md:text-xs text-gray-500">{count} rezultata</p>
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
      transition-all duration-300 cursor-pointer
    "
  >
    <div className="
      w-7 h-7 rounded-full bg-gray-50 border border-gray-100 
      flex items-center justify-center overflow-hidden shrink-0
      group-hover:scale-110 transition-transform duration-300
    ">
      {isRootCategory(category) ? (
        <CategorySemanticIcon category={category} className="w-4 h-4" />
      ) : (
        <CategorySemanticIcon category={category} className="w-4 h-4" />
      )}
    </div>
    <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-700 whitespace-nowrap max-w-[120px] truncate">
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
        <span className="text-sm md:text-base font-semibold text-gray-800 group-hover:text-blue-700 transition-colors line-clamp-1">
          {category?.search_name || category?.translated_name || category?.name}
        </span>
        
        {showPath && category?.full_path ? (
          <span className="text-[10px] md:text-xs text-gray-400 truncate mt-0.5 block">
            {category.full_path}
          </span>
        ) : (
          <div className="flex items-center gap-2 mt-0.5 md:mt-1">
            {hasChildren && (
              <span className="text-[10px] md:text-xs text-gray-500">
                {category?.subcategories_count} podkategorija
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Side Info & Arrow */}
      <div className="flex items-center gap-3 ml-2 shrink-0">
        {adCount !== null && adCount > 0 && (
          <span className="px-2.5 py-1 bg-gray-100 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-700 text-xs font-medium rounded-full transition-colors">
            {adCount}
          </span>
        )}
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-blue-500 transition-colors">
          <ChevronRight size={16} className="text-gray-400 group-hover:text-white transition-colors" />
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
      "
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
        {user?.profile ? (
          <CustomImage
            src={user.profile}
            alt={user.name}
            height={40}
            width={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <User size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
        <div className="flex items-center gap-2">
          {user?.average_rating && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={10} fill="currentColor" />
              <span className="text-[10px] font-bold text-gray-600">{Number(user.average_rating).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-300" />
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
        bg-white border-2 rounded-xl md:rounded-2xl
        transition-all duration-200
        ${isFocused 
          ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
          : 'border-gray-100 shadow-sm'
        }
      `}>
        <Search 
          size={20} 
          className={`mr-3 transition-colors ${isFocused ? 'text-blue-500' : 'text-gray-400'}`} 
        />
        
        <input
          type="text"
          placeholder="Pretraži kategorije..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 h-full bg-transparent outline-none text-sm md:text-base text-gray-800 placeholder:text-gray-400"
        />

        {value && (
          <button 
            onClick={() => onChange("")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-2"
          >
            <X size={16} className="text-gray-400" />
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
        const token = localStorage.getItem("token");
        if (!token) return [];
        const res = await fetch(`https://admin.lmx.ba/customer/id?search=${encodeURIComponent(query)}`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data?.rows || [];
    } catch { return []; }
  }, []);

  const searchAdsAndCategories = useCallback(async (query) => {
     if (abortAdsRef.current) abortAdsRef.current.abort();
     abortAdsRef.current = new AbortController();
     
     try {
        const response = await fetch(
          `https://admin.lmx.ba/api/get-item?search=${encodeURIComponent(query)}&limit=50`,
          { signal: abortAdsRef.current.signal }
        );
        if(!response.ok) return { cats: [], usersFromAds: [] };
        return { cats: [], usersFromAds: [] }; 
     } catch { return { cats: [], usersFromAds: [] }; }
  }, []);

  const searchLocalCategories = useCallback((query) => {
      if (!fuse || query.length < 2) return [];
      return fuse.search(query).slice(0, 10).map(r => r.item);
  }, [fuse]);

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
      const localCats = searchLocalCategories(q);
      const [users] = await Promise.all([searchUsers(q)]);
      
      setSuggestedCategories(localCats);
      setSuggestedUsers(users.slice(0, 5));
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [search, searchLocalCategories, searchUsers]);


  const showSearchResults = (search || "").trim().length >= 2;

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Search Section */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 pt-2 pb-2 -mx-2 px-2 border-b border-gray-50/50">
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
              <History size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nedavno</span>
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
                 <div key={i} className="h-16 w-full bg-gray-100 rounded-xl animate-pulse" />
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
                <SectionHeader icon={User} title="Prodavci" count={suggestedUsers.length} />
                <div className="flex flex-col gap-2">
                  {suggestedUsers.map((user) => (
                    <UserListItem key={user.id} user={user} onClick={onUserClick || (() => {})} />
                  ))}
                </div>
              </motion.div>
            )}

            {suggestedCategories.length === 0 && suggestedUsers.length === 0 && !isSearching && (
               <div className="text-center py-12">
                  <SearchX size={48} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-500 font-medium">Nema rezultata za "{search}"</p>
               </div>
            )}
          </div>
        ) : (
          /* CATEGORY LIST (DEFAULT) - PURE LIST VIEW */
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-4 px-1">
               <h2 className="text-lg font-bold text-gray-800">Sve kategorije</h2>
               <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
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
                  className="rounded-full px-8 border-gray-300 hover:bg-gray-50 text-gray-600 w-full md:w-auto"
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
