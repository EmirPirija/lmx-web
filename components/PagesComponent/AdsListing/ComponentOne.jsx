"use client";

import { memo, useMemo, useEffect, useState, useRef, useCallback } from "react";
import Fuse from "fuse.js";
import { MdChevronRight } from "react-icons/md";
import { FaStar, FaUser } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";

/* -------------------------------------------------------
   CATEGORY ITEM
------------------------------------------------------- */
const CategoryItem = memo(({ category, onClick, showPath = false, adCount = null }) => {
  return (
    <div
      className="flex justify-between items-center cursor-pointer p-4 rounded-xl hover:bg-blue-50 transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:shadow-md group"
      onClick={() => onClick(category)}
    >
      <div className="flex items-center gap-3">
        <CustomImage
          src={category?.image}
          alt={category?.search_name}
          height={56}
          width={56}
          loading="lazy"
          className="h-14 w-14 rounded-xl object-cover border-2 border-gray-100 group-hover:border-blue-300 transition-all"
        />
        <div className="flex flex-col">
          <span className="break-all font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
            {category?.search_name}
          </span>
          {showPath && category?.full_path && (
            <span className="text-xs text-gray-500 mt-0.5">{category.full_path}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {adCount !== null && adCount > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-semibold">
            {adCount.toLocaleString()}
          </span>
        )}
        {category?.subcategories_count > 0 && !showPath && (
          <MdChevronRight 
            size={24} 
            className="rtl:scale-x-[-1] flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors" 
          />
        )}
      </div>
    </div>
  );
});

CategoryItem.displayName = "CategoryItem";

/* -------------------------------------------------------
   USER ITEM
------------------------------------------------------- */
const UserItem = memo(({ user, onClick }) => {
  return (
    <div
      className="flex justify-between items-center cursor-pointer p-4 rounded-xl hover:bg-blue-50 transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:shadow-md group"
      onClick={() => onClick(user)}
    >
      <div className="flex items-center gap-4">
        {user?.profile ? (
          <CustomImage
            src={user.profile}
            alt={user.name}
            height={56}
            width={56}
            loading="lazy"
            className="h-14 w-14 rounded-full object-cover border-2 border-gray-100 group-hover:border-blue-300 transition-all"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 group-hover:border-blue-300 transition-all">
            <FaUser className="text-gray-400" size={24} />
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
            {user?.name}
          </span>

          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            {user?.average_rating && (
              <span className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                <FaStar className="text-yellow-500" size={12} />
                <span className="font-semibold text-yellow-700">{user.average_rating.toFixed(1)}</span>
              </span>
            )}

            {user?.adCount > 0 && (
              <span className="text-blue-600 font-medium">
                {user.adCount === 1
                  ? "1 oglas"
                  : `${user.adCount} oglasa`}
              </span>
            )}
          </div>
        </div>
      </div>

      <MdChevronRight 
        size={24} 
        className="rtl:scale-x-[-1] flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors" 
      />
    </div>
  );
});

UserItem.displayName = "UserItem";

/* -------------------------------------------------------
   SKELETON
------------------------------------------------------- */
const CategorySkeleton = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-4 animate-pulse border border-gray-100 rounded-xl">
        <div className="h-14 w-14 rounded-xl bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    ))}
  </>
);

const UserSkeleton = () => (
  <>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 animate-pulse border border-gray-100 rounded-xl">
        <div className="h-14 w-14 rounded-full bg-gray-200" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-5 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
      </div>
    ))}
  </>
);

/* -------------------------------------------------------
   FLATTEN CATEGORY TREE & BUILD LOOKUP MAP
------------------------------------------------------- */
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
      result = result.concat(
        flattenCategories(cat.subcategories, [...parentPath, name], cat.id)
      );
    }
  });

  return result;
};

/* -------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------- */
const ComponentOne = ({
  categories,
  categoriesLoading,
  fetchMoreCategory,
  lastPage,
  currentPage,
  isLoadMoreCat,
  handleCategoryTabClick,
  onUserClick,
}) => {
  const [search, setSearch] = useState("");
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Flatten all categories and create lookup map
  const { flattenedCategories, categoryMap } = useMemo(() => {
    if (!categories?.length) return { flattenedCategories: [], categoryMap: new Map() };

    const flattened = flattenCategories(categories);
    const map = new Map();
    flattened.forEach((cat) => map.set(cat.id, cat));

    return { flattenedCategories: flattened, categoryMap: map };
  }, [categories]);

  // Fuse for fallback name-based search
  const fuse = useMemo(() => {
    if (!flattenedCategories.length) return null;
    return new Fuse(flattenedCategories, {
      keys: [
        { name: "search_name", weight: 0.6 },
        { name: "slug", weight: 0.4 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [flattenedCategories]);

  // Get all parent categories for a given category
  const getParentChain = useCallback(
    (categoryId) => {
      const chain = [];
      let current = categoryMap.get(categoryId);

      while (current) {
        chain.unshift(current);
        current = current.parent_id ? categoryMap.get(current.parent_id) : null;
      }

      return chain;
    },
    [categoryMap]
  );

  // Search ads and extract categories + users
  const searchAdCategories = useCallback(
    async (query) => {
      if (!query || query.length < 2 || !categoryMap.size) return;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsSearching(true);

      try {
        // Search ads API
        const response = await fetch(
          `https://admin.lmx.ba/api/get-item?search=${encodeURIComponent(query)}&per_page=100`,
          { signal: abortControllerRef.current.signal }
        );

        if (!response.ok) throw new Error("Search failed");

        const result = await response.json();
        const ads = result.data?.data || [];

        if (!ads.length) {
          // No ads found - fallback to Fuse.js
          if (fuse) {
            const fuseResults = fuse.search(query).slice(0, 10).map((r) => r.item);
            setSuggestedCategories(fuseResults);
          } else {
            setSuggestedCategories([]);
          }
          setSuggestedUsers([]);
          return;
        }

        // Count ads per category (including parent categories)
        const categoryCounts = new Map();
        // Track unique users and their ad counts
        const userMap = new Map();

        ads.forEach((ad) => {
          const categoryId = ad.category_id;
          
          // Process categories
          if (categoryId) {
            const category = categoryMap.get(categoryId);
            if (category) {
              const current = categoryCounts.get(categoryId) || { count: 0 };
              categoryCounts.set(categoryId, {
                count: current.count + 1,
              });
            }
          }
          
          // Process users
          if (ad.user) {
            const existingUser = userMap.get(ad.user.id);
            if (existingUser) {
              existingUser.adCount += 1;
            } else {
              userMap.set(ad.user.id, {
                ...ad.user,
                adCount: 1,
              });
            }
          }
        });

        // Convert categories to array with full category data
        const categoryResults = [];
        categoryCounts.forEach((data, categoryId) => {
          const category = categoryMap.get(categoryId);
          if (category) {
            categoryResults.push({
              ...category,
              adCount: data.count,
              isLeaf: data.isLeaf,
            });
          }
        });

        // Sort categories: leaf categories first, then by ad count
        categoryResults.sort((a, b) => {
          if (a.isLeaf && !b.isLeaf) return -1;
          if (!a.isLeaf && b.isLeaf) return 1;
          return b.adCount - a.adCount;
        });

        // Convert users to array and sort by ad count
        const userResults = Array.from(userMap.values()).sort(
          (a, b) => b.adCount - a.adCount
        );

        if (categoryResults.length > 0) {
          setSuggestedCategories(categoryResults.slice(0, 10));
        } else {
          // Fallback to Fuse.js
          if (fuse) {
            const fuseResults = fuse.search(query).slice(0, 10).map((r) => r.item);
            setSuggestedCategories(fuseResults);
          } else {
            setSuggestedCategories([]);
          }
        }

        // Set users (max 5)
        setSuggestedUsers(userResults.slice(0, 5));

      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Search error:", error);
          // Fallback to Fuse.js on error
          if (fuse) {
            const fuseResults = fuse.search(query).slice(0, 10).map((r) => r.item);
            setSuggestedCategories(fuseResults);
          }
          setSuggestedUsers([]);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [categoryMap, fuse, getParentChain]
  );

  const searchUsers = useCallback(async (query) => {
    try {
      const res = await fetch(
        `https://admin.lmx.ba/customer/id?search=${encodeURIComponent(query)}`
      );
  
      if (!res.ok) return [];
  
      const data = await res.json();
      return data.rows || [];
    } catch (e) {
      console.error("User search error", e);
      return [];
    }
  }, []);
  
  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  
    if (!search || search.length < 2) {
      setSuggestedCategories([]);
      setSuggestedUsers([]);
      return;
    }
  
    setIsSearching(true);
  
    searchTimeoutRef.current = setTimeout(async () => {
      // 1️⃣ prvo traži korisnike
      const users = await searchUsers(search);
  
      if (users.length > 0) {
        // Ako ima korisnika → NE TRAŽI OGLASE
        setSuggestedUsers(
          users.map(u => ({
            ...u,
            adCount: u.items_count || 0,
          }))
        );
        setSuggestedCategories([]);
        setIsSearching(false);
        return;
      }
  
      // 2️⃣ ako nema korisnika → traži oglase/kategorije
      await searchAdCategories(search);
    }, 400);
  
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, searchUsers, searchAdCategories]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle user click - navigate to user profile
  const handleUserClick = useCallback((user) => {
    if (onUserClick) {
      onUserClick(user);
    } else {
      // Default behavior - navigate to user profile
      window.location.href = `/seller/${user.id}`;
    }
  }, [onUserClick]);

  const showSearchResults = search && search.length >= 2;
  const hasResults = suggestedCategories.length > 0 || suggestedUsers.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 🔍 SEARCH */}
      <div className="relative">
        <div className="relative">
          <IoSearchOutline 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
            size={22} 
          />
          <input
            type="text"
            placeholder="Šta želite prodati? (npr. iPhone, Samsung, Golf...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* 📦 CATEGORY LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoriesLoading ? (
          <CategorySkeleton />
        ) : showSearchResults ? (
          isSearching ? (
            <div className="col-span-full text-center py-12">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Pretražujem...</p>
            </div>
          ) : hasResults ? (
            <>
              {/* Categories Section */}
              {suggestedCategories.length > 0 && (
                <>
                  <div className="col-span-full mb-2">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Kategorije za "{search}"
                    </h3>
                  </div>
                  {suggestedCategories.map((category) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      onClick={handleCategoryTabClick}
                      showPath
                      adCount={category.adCount}
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-600 font-medium text-lg">
                Nema pronađenih kategorija za "{search}"
              </p>
              <p className="text-gray-500 text-sm mt-2">Pokušajte sa drugim pojmom</p>
            </div>
          )
        ) : (
          categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={{
                ...category,
                search_name: category.translated_name || category.name || "",
              }}
              onClick={handleCategoryTabClick}
            />
          ))
        )}
      </div>

      {/* 👥 USERS SECTION */}
      {showSearchResults && !isSearching && suggestedUsers.length > 0 && (
        <div className="mt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Korisnici</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedUsers.map((user) => (
              <UserItem
                key={user.id}
                user={user}
                onClick={handleUserClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* LOAD MORE */}
      {!search && lastPage > currentPage && (
        <div className="text-center mt-4">
          <Button
            variant="outline"
            className="text-base text-primary font-semibold px-8 py-3 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
            disabled={isLoadMoreCat || categoriesLoading}
            onClick={fetchMoreCategory}
          >
            {isLoadMoreCat ? "Učitavanje..." : "Učitaj još"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(ComponentOne);