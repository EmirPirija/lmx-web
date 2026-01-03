"use client";

import { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import Fuse from "fuse.js";
import { MdChevronRight } from "react-icons/md";
import { FaStar, FaUser, FaSearch } from "react-icons/fa";
import { BiPlanet } from "react-icons/bi";
import CustomImage from "@/components/Common/CustomImage";
import { Button } from "@/components/ui/button";
import { t } from "@/utils";

/* -------------------------------------------------------
   CATEGORY ITEM
------------------------------------------------------- */
const CategoryItem = memo(({ category, onClick, showPath = false, adCount }) => (
  <div
    className="flex justify-between items-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
    onClick={() => onClick(category)}
  >
    <div className="flex items-center gap-2">
      <CustomImage
        src={category.image}
        alt={category.search_name}
        height={48}
        width={48}
        className="h-12 w-12 rounded-full object-cover"
      />
      <div className="flex flex-col">
        <span className="font-medium">{category.search_name}</span>
        {showPath && category.full_path && (
          <span className="text-xs text-gray-500">{category.full_path}</span>
        )}
      </div>
    </div>

    <div className="flex items-center gap-2">
      {adCount > 0 && (
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          {adCount}
        </span>
      )}
      <MdChevronRight className="text-gray-400" size={22} />
    </div>
  </div>
));

/* -------------------------------------------------------
   USER ITEM
------------------------------------------------------- */
const UserItem = memo(({ user, onClick }) => (
  <div
    className="flex justify-between items-center cursor-pointer p-3 rounded-lg border hover:bg-gray-50"
    onClick={() => onClick(user)}
  >
    <div className="flex items-center gap-3">
      {user.profile ? (
        <CustomImage
          src={user.profile}
          alt={user.name}
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover"
        />
      ) : (
        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
          <FaUser className="text-gray-400" />
        </div>
      )}

      <div>
        <div className="font-medium">{user.name}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {user.average_rating && (
            <span className="flex items-center gap-1">
              <FaStar className="text-yellow-400" />
              {user.average_rating.toFixed(1)}
            </span>
          )}
          {user.reviews_count > 0 && (
            <span>({user.reviews_count} recenzija)</span>
          )}
          <span className="text-primary">{user.adCount} oglasa</span>
        </div>
      </div>
    </div>

    <MdChevronRight className="text-gray-400" size={22} />
  </div>
));

/* -------------------------------------------------------
   MAIN SEARCH COMPONENT
------------------------------------------------------- */
const SearchComponent = ({ categories, onCategoryClick }) => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [categoriesResult, setCategoriesResult] = useState([]);
  const [usersResult, setUsersResult] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const timeoutRef = useRef(null);
  const abortRef = useRef(null);

  /* -------------------------------------------------------
     FLATTEN CATEGORIES
  ------------------------------------------------------- */
  const flattenedCategories = useMemo(() => {
    const result = [];

    const walk = (cats, path = []) => {
      cats.forEach((cat) => {
        const name = cat.translated_name || cat.name;
        result.push({
          ...cat,
          search_name: name,
          full_path: [...path, name].join(" > "),
        });
        if (cat.subcategories) {
          walk(cat.subcategories, [...path, name]);
        }
      });
    };

    walk(categories || []);
    return result;
  }, [categories]);

  const categoryMap = useMemo(() => {
    const map = new Map();
    flattenedCategories.forEach((c) => map.set(c.id, c));
    return map;
  }, [flattenedCategories]);

  const fuse = useMemo(
    () =>
      new Fuse(flattenedCategories, {
        keys: ["search_name", "slug"],
        threshold: 0.3,
      }),
    [flattenedCategories]
  );

  /* -------------------------------------------------------
     SEARCH FUNCTION
  ------------------------------------------------------- */
  const runSearch = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setCategoriesResult([]);
      setUsersResult([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsSearching(true);

    try {
      const res = await fetch(
        `https://admin.lmx.ba/api/get-item?search=${encodeURIComponent(
          query
        )}&per_page=50`,
        { signal: abortRef.current.signal }
      );

      const data = await res.json();
      const ads = data?.data?.data || [];

      /* Suggestions */
      const suggSet = new Set();
      ads.forEach((a) => {
        if (a.title?.toLowerCase().includes(query.toLowerCase())) {
          suggSet.add(a.title);
        }
      });
      setSuggestions([...suggSet].slice(0, 5));

      /* Categories */
      const catCount = new Map();
      ads.forEach((ad) => {
        if (ad.category_id) {
          catCount.set(
            ad.category_id,
            (catCount.get(ad.category_id) || 0) + 1
          );
        }
      });

      const catResults = [];
      catCount.forEach((count, id) => {
        const cat = categoryMap.get(id);
        if (cat) catResults.push({ ...cat, adCount: count });
      });

      setCategoriesResult(catResults.slice(0, 6));

      /* Users */
      const userMap = new Map();
      ads.forEach((ad) => {
        if (ad.user) {
          const u = userMap.get(ad.user.id) || {
            ...ad.user,
            adCount: 0,
          };
          u.adCount += 1;
          userMap.set(ad.user.id, u);
        }
      });

      setUsersResult([...userMap.values()].slice(0, 6));
    } catch (e) {
      if (e.name !== "AbortError") {
        setCategoriesResult(
          fuse.search(query).map((r) => r.item).slice(0, 5)
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  /* -------------------------------------------------------
     DEBOUNCE
  ------------------------------------------------------- */
  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => runSearch(search), 400);
    return () => clearTimeout(timeoutRef.current);
  }, [search]);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */
  return (
    <div>
      {/* SEARCH INPUT */}
      <div className="relative mb-6">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
          <BiPlanet />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Šta tražite?"
            className="w-full outline-none"
          />
          <FaSearch />
        </div>
      </div>

      {/* SUGGESTIONS */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <div className="font-medium text-sm mb-2">Prijedlozi pretrage</div>
          <ul className="border rounded-lg divide-y">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50"
                onClick={() => setSearch(s)}
              >
                <FaSearch className="text-gray-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CATEGORIES */}
      {categoriesResult.length > 0 && (
        <div className="mb-10">
          <div className="text-sm text-gray-500 mb-3">
            Kategorije za "{search}"
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoriesResult.map((c) => (
              <CategoryItem
                key={c.id}
                category={c}
                adCount={c.adCount}
                showPath
                onClick={onCategoryClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* USERS */}
      {usersResult.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold">Korisnici</h3>
          <p className="text-sm text-gray-500 mb-4">
            Prodavači koji prodaju "{search}"
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usersResult.map((u) => (
              <UserItem
                key={u.id}
                user={u}
                onClick={() => (window.location.href = `/seller/${u.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SearchComponent);
