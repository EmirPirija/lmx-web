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
import { gamificationApi } from "@/utils/api";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";

import {
  Search,
  Users,
  LayoutGrid,
  LayoutList,
  SlidersHorizontal,
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

const UserCard = ({ user, view, onClick }) => {
  const isPro = user?.is_pro || user?.membership?.tier?.includes("pro");
  const isShop = user?.is_shop || user?.membership?.tier?.includes("shop");
  const sellerSettings = user?.seller_settings || user?.sellerSettings || null;

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

  // Store all users for client-side filtering
  const [allUsers, setAllUsers] = useState([]);

  // Fetch users from leaderboard
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await gamificationApi.getLeaderboard({
        period,
        page: currentPage,
      });

      if (response?.data?.error === false) {
        const data = response.data.data;
        const usersList = data?.users || data?.data || [];
        
        setAllUsers(usersList);
        setTotalPages(Math.ceil((data?.total || usersList.length) / (data?.per_page || 20)));
        setTotalUsers(data?.total || usersList.length);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setAllUsers([]);
      setTotalUsers(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, period]);

  // Apply client-side filters
  useEffect(() => {
    let filteredUsers = [...allUsers];
    
    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by verified
    if (filters.verified === "1") {
      filteredUsers = filteredUsers.filter(user => 
        user?.is_verified || user?.verified || user?.verification_status === "verified"
      );
    }
    
    // Filter by online
    if (filters.online === "1") {
      filteredUsers = filteredUsers.filter(user => 
        user?.is_online || user?.online
      );
    }
    
    setUsers(filteredUsers);
  }, [allUsers, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, CurrentLanguage?.id]);

  // Update URL
  const updateUrl = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [searchParams]);

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
