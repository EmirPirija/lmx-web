"use client";

import { memo, useMemo, useEffect, useState, useRef, useCallback } from "react";
import Fuse from "fuse.js";
import { MdChevronRight } from "react-icons/md";
import { FaStar, FaUser } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import CustomImage from "@/components/Common/CustomImage";

/* -------------------------------------------------------
   UI atoms
------------------------------------------------------- */
const SectionTitle = ({ children }) => (
  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
    {children}
  </h3>
);

const Pill = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.99] transition"
  >
    {children}
  </button>
);

/* -------------------------------------------------------
   CATEGORY CARD
------------------------------------------------------- */
const CategoryCard = memo(({ category, onClick, showPath = false, adCount = null }) => {
  const hasChildren = Number(category?.subcategories_count || 0) > 0;

  return (
    <button
      type="button"
      onClick={() => onClick(category)}
      className="
        group w-full text-left
        flex items-center gap-3
        rounded-2xl border border-gray-200 bg-white
        px-3 py-3
        hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/30
        transition
      "
    >
      <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
        <CustomImage
          src={category?.image}
          alt={category?.search_name || category?.translated_name || category?.name}
          height={44}
          width={44}
          loading="lazy"
          className="h-10 w-10 object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
            {category?.search_name || category?.translated_name || category?.name}
          </div>

          {adCount !== null && adCount > 0 && (
            <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {adCount.toLocaleString()}
            </span>
          )}
        </div>

        {showPath && category?.full_path ? (
          <div className="mt-0.5 truncate text-xs text-gray-500">{category.full_path}</div>
        ) : hasChildren ? (
          <div className="mt-0.5 text-xs text-gray-500">
            {category?.subcategories_count} podkategorija
          </div>
        ) : (
          <div className="mt-0.5 text-xs text-gray-400">Bez podkategorija</div>
        )}
      </div>

      {hasChildren && !showPath ? (
        <MdChevronRight
          size={22}
          className="rtl:scale-x-[-1] text-gray-400 group-hover:text-blue-600 transition-colors shrink-0"
        />
      ) : (
        <span className="w-5 shrink-0" />
      )}
    </button>
  );
});
CategoryCard.displayName = "CategoryCard";

/* -------------------------------------------------------
   USER CARD
------------------------------------------------------- */
const UserCard = memo(({ user, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(user)}
      className="
        group w-full text-left
        flex items-center gap-3
        rounded-2xl border border-gray-200 bg-white
        px-3 py-3
        hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/30
        transition
      "
    >
      <div className="h-12 w-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
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
          <FaUser className="text-gray-400" size={20} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
          {user?.name}
        </div>

        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
          {user?.average_rating && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-100 text-yellow-700">
              <FaStar size={11} />
              {Number(user.average_rating).toFixed(1)}
            </span>
          )}

          {user?.adCount > 0 && (
            <span className="text-blue-600 font-medium">
              {user.adCount === 1 ? "1 oglas" : `${user.adCount} oglasa`}
            </span>
          )}
        </div>
      </div>

      <MdChevronRight
        size={22}
        className="rtl:scale-x-[-1] text-gray-400 group-hover:text-blue-600 transition-colors shrink-0"
      />
    </button>
  );
});
UserCard.displayName = "UserCard";

/* -------------------------------------------------------
   Skeleton
------------------------------------------------------- */
const CardSkeleton = ({ rows = 9 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 px-3 py-3 rounded-2xl border border-gray-200 bg-white animate-pulse"
      >
        <div className="h-12 w-12 rounded-xl bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2 mt-2" />
        </div>
      </div>
    ))}
  </div>
);

/* -------------------------------------------------------
   Flatten category tree (if present)
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
      result = result.concat(flattenCategories(cat.subcategories, [...parentPath, name], cat.id));
    }
  });

  return result;
};

/* -------------------------------------------------------
   Robust ads extraction (FIX)
------------------------------------------------------- */
const extractAds = (resultJson) => {
  // covers:
  // - result.data.data = []
  // - result.data.data = { data: [] }
  // - result.data.data.data = []
  // - result.data = { data: { data: [] } } (various)
  const d = resultJson?.data;

  const candidates = [
    d?.data,                 // could be [] or paginator object
    d?.data?.data,           // could be [] (paginator.data)
    resultJson?.data?.data,  // same as above but safe
    resultJson?.data?.data?.data,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (c && Array.isArray(c.data)) return c.data;
  }

  return [];
};

/* -------------------------------------------------------
   MAIN
------------------------------------------------------- */
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

  // build index from whatever we have (tree or current level)
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
      // ✅ uzmi token iz ISTOG mjesta gdje ti axios Api već radi
      // prilagodi ključ ako je kod vas drugačiji
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("access_token");
  
      // ✅ ako nema tokena, nema smisla zvat endpoint koji je 401
      if (!token) return [];
  
      const url = `https://admin.lmx.ba/customer/id?search=${encodeURIComponent(query)}`;
  
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`, // ✅ ovo je ključ
        },
      });
  
      if (res.status === 401 || res.status === 403) {
        // ✅ nemoj spamati konzolu svaki put, ali možeš ostaviti 1 log
        // console.warn("[USER SEARCH] Unauthorized", res.status);
        return [];
      }
  
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
  
      // ✅ Ako lokalno imaš kompletno stablo, penjemo se do top-level parenta (preko parent_id iz flattenCategories)
      // ✅ Ako lokalno imaš samo parent kategorije, koristimo parent_category_id koji dolazi iz API-ja (backend fix)
      const resolveSuggestedCategoryId = (leafId, apiParentId) => {
        if (!leafId) return null;
  
        // 1) Ako je leaf u lokalnom indexu, popni se do vrha (root)
        const localLeaf = localIndex.map.get(leafId);
        if (localLeaf) {
          let cur = localLeaf;
          while (cur?.parent_id && localIndex.map.has(cur.parent_id)) {
            cur = localIndex.map.get(cur.parent_id);
          }
          return cur?.id ?? leafId;
        }
  
        // 2) Ako leaf nije lokalno učitan, ali imamo parent_category_id iz API-ja i parent postoji lokalno
        if (apiParentId && localIndex.map.has(apiParentId)) return apiParentId;
  
        // 3) Fallback
        return leafId;
      };
  
      try {
        const response = await fetch(
          `https://admin.lmx.ba/api/get-item?search=${encodeURIComponent(q)}&limit=100`,
          { signal: abortAdsRef.current.signal }
        );
        if (!response.ok) throw new Error("Ads search failed");
  
        const result = await response.json();
  
        // ✅ koristi shared helper (već ga imaš u fajlu)
        const ads = extractAds(result);
  
        if (!ads.length) return { cats: [], usersFromAds: [] };
  
        const categoryCounts = new Map();
        const userMap = new Map();
  
        for (const ad of ads) {
          // leaf category (iz itema)
          const leafId = ad?.category_id ?? ad?.category?.id;
          // parent category (iz eager-load category na backendu)
          const apiParentId = ad?.category?.parent_category_id ?? null;
  
          // ✅ OVO je ključ: umjesto leafId, broji parent/root gdje može
          const suggestedId = resolveSuggestedCategoryId(leafId, apiParentId);
  
          if (suggestedId) {
            categoryCounts.set(
              suggestedId,
              (categoryCounts.get(suggestedId) || 0) + 1
            );
          }
  
          // usersFromAds
          if (ad?.user?.id) {
            const existing = userMap.get(ad.user.id);
            if (existing) existing.adCount += 1;
            else userMap.set(ad.user.id, { ...ad.user, adCount: 1 });
          }
        }
  
        // map suggested category ids -> category objects (lokalno)
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
        if (error?.name !== "AbortError")
          console.error("Ads search error:", error);
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
      // prefer one that has adCount/full_path if exists
      const prev = m.get(c.id);
      if (!prev) m.set(c.id, c);
      else m.set(c.id, { ...prev, ...c, adCount: c.adCount ?? prev.adCount });
    });
    return Array.from(m.values());
  };

  // ✅ Debounced search: run BOTH, do not block categories if users exist
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
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="sticky top-2 z-10 -mx-2 px-2 py-2 bg-white/80 backdrop-blur rounded-2xl">
        <div className="relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Šta želite prodati? (npr. iPhone, Samsung, Golf...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full pl-11 pr-11 py-3
              border border-gray-200 rounded-2xl
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              bg-white transition
            "
          />

          {!!search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-gray-100 transition"
              aria-label="Clear"
            >
              <X size={16} className="text-gray-500" />
            </button>
          )}

          {isSearching && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Recent */}
      {!showSearchResults && recentCategories?.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Nedavno</SectionTitle>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentCategories.slice(0, 8).map((c) => (
              <Pill key={c.id} onClick={() => handleCategoryTabClick(c)}>
                <span className="text-sm font-medium text-gray-800">
                  {c.translated_name || c.name}
                </span>
              </Pill>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {categoriesLoading ? (
        <CardSkeleton rows={9} />
      ) : showSearchResults ? (
        isSearching ? (
          <div className="py-10 text-center text-gray-600">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Pretražujem…
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {suggestedCategories.length > 0 ? (
              <div className="flex flex-col gap-3">
                <SectionTitle>Kategorije</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {suggestedCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onClick={handleCategoryTabClick}
                      showPath={!!category.full_path}
                      adCount={category.adCount ?? null}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Nema pronađenih kategorija za “{search}”
              </div>
            )}

            {suggestedUsers.length > 0 && (
              <div className="flex flex-col gap-3">
                <SectionTitle>Korisnici</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {suggestedUsers.map((user) => (
                    <UserCard key={user.id} user={user} onClick={handleUserClick} />
                  ))}
                </div>
              </div>
            )}

            {suggestedUsers.length === 0 && suggestedCategories.length === 0 && (
              <div className="py-10 text-center">
                <div className="text-5xl mb-3">🔍</div>
                <div className="text-gray-700 font-semibold">
                  Nema rezultata za “{search}”
                </div>
                <div className="text-gray-500 text-sm mt-1">Pokušajte s drugim pojmom.</div>
              </div>
            )}
          </div>
        )
      ) : (
        <>
          <div className="flex items-center justify-between">
            <SectionTitle>Kategorije</SectionTitle>
            <div className="text-xs text-gray-400">{categories?.length || 0} prikazano</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(categories || []).map((category) => (
              <CategoryCard
                key={category.id}
                category={{
                  ...category,
                  search_name: category.translated_name || category.name || "",
                }}
                onClick={handleCategoryTabClick}
              />
            ))}
          </div>

          {!search && lastPage > currentPage && (
            <div className="text-center mt-2">
              <Button
                variant="outline"
                className="text-sm font-semibold px-6 py-2 rounded-xl border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
                disabled={isLoadMoreCat || categoriesLoading}
                onClick={fetchMoreCategory}
              >
                {isLoadMoreCat ? "Učitavanje..." : "Učitaj još"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default memo(ComponentOne);
