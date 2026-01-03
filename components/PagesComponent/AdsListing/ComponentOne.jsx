"use client";

import { memo, useMemo, useEffect, useState, useRef, useCallback } from "react";
import Fuse from "fuse.js";
import { MdChevronRight } from "react-icons/md";
import { FaStar, FaUser } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";

/* -------------------------------------------------------
   CATEGORY ITEM
------------------------------------------------------- */
const CategoryItem = memo(({ category, onClick, showPath = false, adCount = null }) => {
  return (
    <div
      className="flex justify-between items-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
      onClick={() => onClick(category)}
    >
      <div className="flex items-center gap-2">
        <CustomImage
          src={category?.image}
          alt={category?.search_name}
          height={48}
          width={48}
          loading="lazy"
          className="h-12 w-12 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <span className="break-all font-medium">{category?.search_name}</span>
          {showPath && category?.full_path && (
            <span className="text-xs text-gray-500">{category.full_path}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {adCount !== null && adCount > 0 && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
            {adCount.toLocaleString()}
          </span>
        )}
        {category?.subcategories_count > 0 && !showPath && (
          <MdChevronRight size={24} className="rtl:scale-x-[-1] flex-shrink-0" />
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
      className="flex justify-between items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
      onClick={() => onClick(user)}
    >
      <div className="flex items-center gap-3">
        {user?.profile ? (
          <CustomImage
            src={user.profile}
            alt={user.name}
            height={48}
            width={48}
            loading="lazy"
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
            <FaUser className="text-gray-400" size={20} />
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-medium">{user?.name}</span>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {user?.average_rating && (
              <span className="flex items-center gap-1">
                <FaStar className="text-yellow-400" size={12} />
                {user.average_rating.toFixed(1)}
              </span>
            )}
            {user?.reviews_count > 0 && (
              <span>({user.reviews_count} recenzija)</span>
            )}
            {user?.adCount > 0 && (
              <span className="text-primary">{user.adCount} oglasa</span>
            )}
          </div>
        </div>
      </div>

      <MdChevronRight size={24} className="rtl:scale-x-[-1] flex-shrink-0 text-gray-400" />
    </div>
  );
});

UserItem.displayName = "UserItem";

/* -------------------------------------------------------
   SKELETON
------------------------------------------------------- */
const CategorySkeleton = () => (
  <>
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className="flex items-center gap-2 p-2 animate-pulse">
        <div className="h-12 w-12 rounded-full bg-gray-200" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
    ))}
  </>
);

const UserSkeleton = () => (
  <>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 animate-pulse border border-gray-100 rounded-lg">
        <div className="h-12 w-12 rounded-full bg-gray-200" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
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
  onUserClick, // New prop for user click handling
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
    <>
      {/* 🔍 SEARCH */}
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Šta želite prodati? (npr. iPhone, Samsung, Golf...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 📦 CATEGORY LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categoriesLoading ? (
          <CategorySkeleton />
        ) : showSearchResults ? (
          isSearching ? (
            <div className="col-span-full text-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Pretražujem...</p>
            </div>
          ) : hasResults ? (
            <>
              {/* Categories Section */}
              {suggestedCategories.length > 0 && (
                <>
                  <div className="col-span-full mb-2">
                    <span className="text-sm text-gray-500 font-medium">
                      Kategorije za "{search}"
                    </span>
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
            <p className="text-gray-500 col-span-full text-center">
              Nema pronađenih kategorija za "{search}"
            </p>
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
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Korisnici</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="text-center mt-6">
          <Button
            variant="outline"
            className="text-sm sm:text-base text-primary w-[256px]"
            disabled={isLoadMoreCat || categoriesLoading}
            onClick={fetchMoreCategory}
          >
            {isLoadMoreCat ? t("loading") : t("loadMore")}
          </Button>
        </div>
      )}
    </>
  );
};

export default memo(ComponentOne);