"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import NoData from "@/components/EmptyStates/NoData";
import { MinimalSellerCard } from "@/components/PagesComponent/Seller/MinimalSellerCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usersApi } from "@/utils/api";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";

import {
  Search,
  Users,
  LayoutGrid,
  LayoutList,
  SlidersHorizontal,
  BadgeCheck,
  TrendingUp,
  Crown,
  Store,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";

/* =====================================================
   SKELETON KOMPONENTA
===================================================== */

const UserCardSkeleton = ({ view }) => {
  if (view === "list") {
    return (
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse">
        <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="hidden sm:flex gap-4">
          <div className="h-10 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-10 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-700 mb-3" />
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   USER CARD KOMPONENTA
===================================================== */

const normalizeBadgeKey = (badge) =>
  String(
    badge?.slug ||
      badge?.key ||
      badge?.code ||
      badge?.type ||
      badge?.name ||
      badge?.title ||
      badge?.label ||
      ""
  )
    .trim()
    .toLowerCase();

const getMembershipTier = (user) => {
  const tierValue =
    user?.membership?.tier?.slug ||
    user?.membership?.tier?.name ||
    user?.membership?.tier?.title ||
    user?.membership?.tier ||
    user?.membership?.plan ||
    user?.membership?.slug ||
    user?.membership_tier ||
    user?.membershipTier ||
    user?.plan ||
    "";
  return String(tierValue).toLowerCase();
};

const hasBadgeMatch = (user, matchers = []) => {
  const badgeList = Array.isArray(user?.badges) ? user.badges : [];
  if (!badgeList.length) return false;
  return badgeList.some((badge) => {
    const key = normalizeBadgeKey(badge);
    return matchers.some((matcher) =>
      typeof matcher === "string" ? key.includes(matcher) : matcher(key)
    );
  });
};

const isProUser = (user) =>
  Boolean(
    user?.is_pro ||
      user?.isPro ||
      user?.membership?.is_pro ||
      user?.membership?.tier === "pro" ||
      getMembershipTier(user).includes("pro") ||
      getMembershipTier(user).includes("premium") ||
      hasBadgeMatch(user, ["pro", "premium"])
  );

const isShopUser = (user) =>
  Boolean(
    user?.is_shop ||
      user?.isShop ||
      user?.membership?.is_shop ||
      user?.membership?.tier === "shop" ||
      getMembershipTier(user).includes("shop") ||
      getMembershipTier(user).includes("business") ||
      hasBadgeMatch(user, ["shop", "business", "store"])
  );

const isVerifiedUser = (user) =>
  Boolean(
    user?.is_verified ||
      user?.verified ||
      user?.isVerified ||
      user?.verification_status === "verified" ||
      user?.verification_status === "approved" ||
      hasBadgeMatch(user, ["verified"])
  );

const isOnlineUser = (user) =>
  Boolean(
    user?.is_online ||
      user?.online ||
      user?.isOnline ||
      user?.online_status === "online"
  );

const UserCard = ({ user, view, onClick }) => {
  const isPro = isProUser(user);
  const isShop = isShopUser(user);
  const sellerSettings = user?.seller_settings || user?.sellerSettings || {
    card_preferences: {
      show_ratings: true,
      show_badges: true,
      show_member_since: true,
      show_response_time: true,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
    >
      <div className="p-4">
        <MinimalSellerCard
          seller={user}
          sellerSettings={sellerSettings}
          badges={user?.badges || []}
          ratings={{ total: user?.reviews_count ?? user?.total_reviews ?? user?.ratings_count ?? 0 }}
          isPro={isPro}
          isShop={isShop}
          showProfileLink
          variant={view === "list" ? "default" : "compact"}
        />
      </div>
    </motion.div>
  );
};

/* =====================================================
   FILTER SIDEBAR
===================================================== */

const FilterSidebar = ({
  filters,
  setFilters,
  isOpen,
  onClose,
  totalUsers,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    membership: true,
    verification: true,
    status: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const FilterSection = ({ title, section, children }) => (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <button
        onClick={() => toggleSection(section)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="font-semibold text-slate-900 dark:text-white text-sm">
          {title}
        </span>
        {expandedSections[section] ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {expandedSections[section] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const FilterOption = ({ label, checked, onChange, icon: Icon }) => (
    <label className="flex items-center gap-3 py-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
      />
      <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        {label}
      </span>
    </label>
  );

  const content = (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-900 dark:text-white">Filteri</h3>
          </div>
          {totalUsers > 0 && (
            <span className="text-xs text-slate-500">{totalUsers} korisnika</span>
          )}
        </div>
      </div>

      {/* Sections */}
      <FilterSection title="Tip članstva" section="membership">
        <div className="space-y-1">
          <FilterOption
            label="Pro korisnici"
            icon={Crown}
            checked={filters.membership === "pro"}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                membership: e.target.checked ? "pro" : "",
              }))
            }
          />
          <FilterOption
            label="Shop / Trgovine"
            icon={Store}
            checked={filters.shop === "1"}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                shop: e.target.checked ? "1" : "",
              }))
            }
          />
        </div>
      </FilterSection>

      <FilterSection title="Verifikacija" section="verification">
        <FilterOption
          label="Samo verificirani"
          icon={BadgeCheck}
          checked={filters.verified === "1"}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              verified: e.target.checked ? "1" : "",
            }))
          }
        />
      </FilterSection>

      <FilterSection title="Status" section="status">
        <FilterOption
          label="Trenutno online"
          checked={filters.online === "1"}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              online: e.target.checked ? "1" : "",
            }))
          }
        />
      </FilterSection>

      {/* Reset */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            setFilters({
              search: "",
              membership: "",
              shop: "",
              verified: "",
              online: "",
            })
          }
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Resetiraj filtere
        </Button>
      </div>
    </div>
  );

  // Mobile overlay
  if (isOpen !== undefined) {
    return (
      <>
        {/* Desktop */}
        <div className="hidden lg:block w-72 flex-shrink-0">{content}</div>

        {/* Mobile overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
              onClick={onClose}
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                className="absolute left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white dark:bg-slate-900 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">Filteri</h3>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {content}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return <div className="w-72 flex-shrink-0">{content}</div>;
};

/* =====================================================
   MAIN PAGE
===================================================== */

const SviKorisniciPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const CurrentLanguage = useSelector(CurrentLanguageData);

  // State
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [view, setView] = useState(searchParams.get("view") || "grid");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    membership: searchParams.get("membership") || "",
    shop: searchParams.get("shop") || "",
    verified: searchParams.get("verified") || "",
    online: searchParams.get("online") || "",
  });

  const [searchInput, setSearchInput] = useState(filters.search);
  const [period, setPeriod] = useState(searchParams.get("period") || "all-time");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [allUsers, setAllUsers] = useState([]);

  const sortUsers = useCallback((list) => {
    const usersCopy = [...list];
    if (sortBy === "newest") {
      return usersCopy.sort((a, b) => {
        const aDate = new Date(a?.created_at || a?.createdAt || 0).getTime();
        const bDate = new Date(b?.created_at || b?.createdAt || 0).getTime();
        return bDate - aDate;
      });
    }
    if (sortBy === "oldest") {
      return usersCopy.sort((a, b) => {
        const aDate = new Date(a?.created_at || a?.createdAt || 0).getTime();
        const bDate = new Date(b?.created_at || b?.createdAt || 0).getTime();
        return aDate - bDate;
      });
    }
    if (sortBy === "most_ads") {
      return usersCopy.sort((a, b) => {
        const aCount = Number(a?.ads_count || a?.listings_count || a?.items_count || 0);
        const bCount = Number(b?.ads_count || b?.listings_count || b?.items_count || 0);
        return bCount - aCount;
      });
    }
    if (sortBy === "top_rated") {
      return usersCopy.sort((a, b) => {
        const aRating = Number(a?.rating || a?.average_rating || a?.rating_avg || 0);
        const bRating = Number(b?.rating || b?.average_rating || b?.rating_avg || 0);
        return bRating - aRating;
      });
    }
    return usersCopy;
  }, [sortBy]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await usersApi.getAllUsers({
        page: currentPage,
        per_page: 24,
        search: filters.search || undefined,
        membership: filters.membership || undefined,
        shop: filters.shop || undefined,
      });

      if (response?.data?.error === false || response?.data?.error == null) {
        const data = response.data.data;
        const usersList =
          data?.users?.data ||
          data?.users ||
          data?.data ||
          data?.items ||
          data ||
          [];
        
        setAllUsers(usersList);
        setTotalPages(
          Math.ceil(
            (data?.total || data?.meta?.total || usersList.length) /
              (data?.per_page || data?.meta?.per_page || 24)
          )
        );
        setTotalUsers(data?.total || data?.meta?.total || usersList.length);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setAllUsers([]);
      setTotalUsers(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters.membership, filters.search, filters.shop]);

  const filteredUsers = useMemo(() => {
    let filtered = [...allUsers];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((user) => {
        const haystack = [
          user?.name,
          user?.full_name,
          user?.username,
          user?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchLower);
      });
    }

    if (filters.verified === "1") {
      filtered = filtered.filter((user) => isVerifiedUser(user));
    }

    if (filters.membership === "pro") {
      filtered = filtered.filter((user) => isProUser(user));
    }

    if (filters.shop === "1") {
      filtered = filtered.filter((user) => isShopUser(user));
    }

    if (filters.online === "1") {
      filtered = filtered.filter((user) => isOnlineUser(user));
    }

    if (period !== "all-time") {
      const days = period === "weekly" ? 7 : 30;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      filtered = filtered.filter((user) => {
        const dateValue = user?.last_active_at || user?.created_at || user?.createdAt || 0;
        const timestamp = new Date(dateValue).getTime();
        return Number.isFinite(timestamp) && timestamp >= cutoff;
      });
    }

    return sortUsers(filtered);
  }, [
    allUsers,
    filters.membership,
    filters.online,
    filters.search,
    filters.shop,
    filters.verified,
    period,
    sortUsers,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, CurrentLanguage?.id]);

  useEffect(() => {
    setUsers(filteredUsers);
  }, [filteredUsers]);

  // Update URL
  const updateUrl = useCallback((key, value) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, []);

  const handleViewChange = (newView) => {
    setView(newView);
    updateUrl("view", newView);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    updateUrl("sort", newSort);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setCurrentPage(1);
    updateUrl("period", newPeriod);
  };

  useEffect(() => {
    setCurrentPage(1);
    updateUrl("membership", filters.membership);
    updateUrl("shop", filters.shop);
    updateUrl("verified", filters.verified);
    updateUrl("online", filters.online);
    updateUrl("search", filters.search);
  }, [
    filters.membership,
    filters.online,
    filters.search,
    filters.shop,
    filters.verified,
    updateUrl,
  ]);

  const goToUserProfile = (userId) => {
    router.push(`/seller/${userId}`);
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return [filters.membership, filters.shop, filters.verified, filters.online].filter(Boolean).length;
  }, [filters]);

  return (
    <Layout>
      <BreadCrumb title2="Svi korisnici" />

      <div className="container py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            Svi korisnici
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Pronađi prodavače, kupce i trgovine na platformi
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            totalUsers={totalUsers}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pretraži korisnike..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>

                {/* Period */}
                <Select value={period} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-full sm:w-40 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <TrendingUp className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="weekly">Sedmično</SelectItem>
                      <SelectItem value="monthly">Mjesečno</SelectItem>
                      <SelectItem value="all-time">Ukupno</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-full sm:w-48 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Sortiraj" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="newest">Najnoviji</SelectItem>
                      <SelectItem value="oldest">Najstariji</SelectItem>
                      <SelectItem value="most_ads">Najviše oglasa</SelectItem>
                      <SelectItem value="top_rated">Najbolje ocijenjeni</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* View toggle */}
                <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <button
                    onClick={() => handleViewChange("grid")}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      view === "grid"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewChange("list")}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      view === "list"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile filter button */}
                <Button
                  variant="outline"
                  className="lg:hidden"
                  onClick={() => setIsFilterOpen(true)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filteri
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Users Grid/List */}
            {isLoading ? (
              <div className={cn(
                view === "list"
                  ? "space-y-4"
                  : "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4"
              )}>
                {[...Array(12)].map((_, i) => (
                  <UserCardSkeleton key={i} view={view} />
                ))}
              </div>
            ) : users.length === 0 ? (
              <NoData name="Nema korisnika koji odgovaraju pretrazi" />
            ) : (
              <div className={cn(
                view === "list"
                  ? "space-y-4"
                  : "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4"
              )}>
                <AnimatePresence mode="popLayout">
                  {users.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      view={view}
                      onClick={() => goToUserProfile(user.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Prethodna
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages || isLoading}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Sljedeća
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SviKorisniciPage;
