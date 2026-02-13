"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import NoData from "@/components/EmptyStates/NoData";
import ProductSellerDetailCard from "@/components/PagesComponent/ProductDetail/ProductSellerDetailCard";
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
import { resolveMembership } from "@/lib/membership";
import { isSellerVerified } from "@/lib/seller-verification";
import { usersApi, getSellerApi } from "@/utils/api";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";

import {
  Search,
  LayoutGrid,
  LayoutList,
  SlidersHorizontal,
  BadgeCheck,
  Crown,
  Store,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowUpDown,
} from "@/components/Common/UnifiedIconPack";

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

const UserCard = ({ user, view }) => {
  const membership = resolveMembership(user, user?.membership);
  const isPro = membership.isPro;
  const isShop = membership.isShop;
  const sellerSettings = user?.seller_settings || user?.sellerSettings || {
    card_preferences: {
      show_ratings: true,
      show_badges: true,
      show_member_since: true,
      show_response_time: true,
    },
  };
  const ratingTotal =
    user?.ratings_count ??
    user?.reviews_count ??
    user?.total_reviews ??
    user?.reviews ??
    0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("h-full", view === "list" && "w-full")}
    >
      <ProductSellerDetailCard
        seller={user}
        sellerSettings={sellerSettings}
        badges={Array.isArray(user?.badges) ? user.badges : []}
        ratings={{ total: ratingTotal }}
        isPro={isPro}
        isShop={isShop}
        enableOwnerReelControls={false}
      />
    </motion.article>
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
            label="Shop / Radnje"
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
          label="Samo verificirani korisnici"
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
          Poništi filtere
        </Button>
      </div>
    </div>
  );

  // Mobile overlay
  if (isOpen !== undefined) {
    return (
      <>
        {/* Desktop */}
        <div className="hidden lg:block w-[320px] flex-shrink-0">
          <div className="sticky top-24">{content}</div>
        </div>

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

  return <div className="w-[320px] flex-shrink-0">{content}</div>;
};

/* =====================================================
   MAIN PAGE
===================================================== */

const SviKorisniciPage = () => {
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
  const [sellerDetailsMap, setSellerDetailsMap] = useState({});
  const [isEnriching, setIsEnriching] = useState(false);
  const sellerDetailsRef = useRef({});

  const perPage = 24;
  const apiPerPage = 50;

  useEffect(() => {
    sellerDetailsRef.current = sellerDetailsMap;
  }, [sellerDetailsMap]);

  const isTruthyFlag = (value) => {
    if (value === true || value === 1) return true;
    if (typeof value === "number") return value > 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return false;
      if (["1", "true", "yes", "y", "approved", "verified", "active"].includes(normalized)) {
        return true;
      }
      const numeric = Number(normalized);
      return Number.isFinite(numeric) ? numeric > 0 : false;
    }
    return false;
  };

  const resolveUserAvatar = (user = {}, details = {}) => {
    const seller = details?.seller || {};
    const raw =
      user?.profile ||
      user?.profile_image ||
      user?.profileImage ||
      user?.avatar ||
      user?.avatar_url ||
      user?.image ||
      user?.photo ||
      user?.svg_avatar ||
      seller?.profile ||
      seller?.profile_image ||
      seller?.profileImage ||
      seller?.avatar ||
      seller?.avatar_url ||
      seller?.image ||
      details?.profile ||
      details?.profile_image ||
      details?.avatar ||
      "";
    return String(raw || "").trim() || null;
  };

  const getMembershipFlags = (user, details) =>
    resolveMembership(user, details, details?.membership, details?.seller);

  const isVerifiedUser = (user, details) => {
    const seller = details?.seller || {};
    if (isSellerVerified(user, seller, details)) return true;

    const directFlagCandidates = [
      user?.is_verified,
      user?.verified,
      user?.isVerified,
      user?.seller_verified,
      user?.sellerVerified,
      user?.is_seller_verified,
      seller?.is_verified,
      seller?.verified,
      seller?.seller_verified,
      seller?.sellerVerified,
      details?.is_verified,
      details?.verified,
      details?.seller_verified,
    ];

    if (directFlagCandidates.some((value) => isTruthyFlag(value))) {
      return true;
    }

    const statusCandidates = [
      user?.verification_status,
      user?.verificationStatus,
      user?.verified_status,
      user?.kyc_status,
      seller?.verification_status,
      seller?.verificationStatus,
      seller?.verified_status,
      seller?.kyc_status,
      seller?.verification?.status,
      details?.verification_status,
      details?.verificationStatus,
      details?.status,
    ]
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter(Boolean);

    if (
      statusCandidates.some((status) =>
        ["approved", "verified", "kyc_approved", "kyc_verified", "seller_verified"].includes(status)
      )
    ) {
      return true;
    }

    if (
      statusCandidates.some((status) =>
        ["pending", "in_review", "rejected", "declined", "not applied", "unverified"].includes(status)
      )
    ) {
      return false;
    }

    return false;
  };

  const normalizeUser = (user, details) => {
    if (!user) return user;
    const { isPro, isShop } = getMembershipFlags(user, details);
    const seller = details?.seller || {};
    const verified = isVerifiedUser(user, details);
    const verificationStatus =
      user?.verification_status ??
      user?.verificationStatus ??
      seller?.verification_status ??
      seller?.verificationStatus ??
      seller?.verification?.status ??
      null;
    const derivedReelCount =
      seller?.reels_count ??
      seller?.reel_count ??
      seller?.videos_count ??
      seller?.video_count ??
      user?.reels_count ??
      user?.reel_count ??
      user?.videos_count ??
      user?.video_count ??
      0;

    const resolvedProfile = resolveUserAvatar(user, details);

    const normalized = {
      ...user,
      profile: resolvedProfile,
      profile_image: resolvedProfile,
      is_verified: verified ? 1 : 0,
      verified: verified ? 1 : 0,
      isVerified: verified,
      verification_status: verificationStatus,
      total_ads:
        user?.total_ads ??
        seller?.total_ads ??
        user?.items_count ??
        user?.ads_count ??
        0,
      average_rating:
        seller?.average_rating ??
        user?.average_rating ??
        user?.rating ??
        user?.ratings_avg,
      has_reel:
        user?.has_reel ??
        seller?.has_reel ??
        (Number(derivedReelCount) > 0 ? 1 : 0),
      reel_video:
        user?.reel_video ??
        seller?.reel_video ??
        seller?.video ??
        user?.video ??
        null,
      reels_count: Number(derivedReelCount) || 0,
      ratings_count:
        seller?.reviews_count ??
        user?.ratings_count ??
        user?.reviews_count ??
        user?.reviews ??
        0,
      is_pro: isPro,
      is_shop: isShop,
      membership: details?.membership || user?.membership,
    };
    return normalized;
  };

  const isOnline = (user) => {
    const hasOnlineFlag = isTruthyFlag(user?.is_online) || isTruthyFlag(user?.online);
    if (hasOnlineFlag) return true;

    const lastSeen =
      user?.last_seen ||
      user?.lastSeen ||
      user?.last_activity_at ||
      user?.lastActiveAt ||
      user?.updated_at;
    if (!lastSeen) return false;
    const last = new Date(lastSeen).getTime();
    if (Number.isNaN(last)) return false;
    const diffMs = Date.now() - last;
    return diffMs <= 5 * 60 * 1000;
  };

  const enrichUsers = useCallback(async (usersList) => {
    const missingIds = (usersList || [])
      .map((user) => user?.id)
      .filter((id) => id && !sellerDetailsRef.current[id]);

    if (!missingIds.length) return;

    setIsEnriching(true);
    const updates = {};

    const chunkSize = 6;
    for (let i = 0; i < missingIds.length; i += chunkSize) {
      const chunk = missingIds.slice(i, i + chunkSize);
      const responses = await Promise.allSettled(
        chunk.map((id) => getSellerApi.getSeller({ id }))
      );

      responses.forEach((res, idx) => {
        if (res.status !== "fulfilled") return;
        const data = res.value?.data?.data;
        if (!data?.seller?.id) return;
        updates[chunk[idx]] = {
          seller: data.seller,
          membership: data.membership,
          is_pro: data.is_pro,
          is_shop: data.is_shop,
        };
      });
    }

    if (Object.keys(updates).length > 0) {
      setSellerDetailsMap((prev) => ({ ...prev, ...updates }));
    }
    setIsEnriching(false);
  }, []);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      let page = 1;
      let lastPage = 1;
      const aggregated = [];

      do {
        const response = await usersApi.getUsers({
          page,
          per_page: apiPerPage,
          search: filters.search || "",
        });

        const data = response?.data;

        if (!data?.success) {
          throw new Error(data?.message || "Ne mogu dohvatiti korisnike.");
        }

        const usersList = data?.data || [];
        aggregated.push(...usersList);
        lastPage = data?.last_page || 1;
        page += 1;
      } while (page <= lastPage);

      setAllUsers(aggregated);
      setTotalUsers(aggregated.length);
      setTotalPages(Math.max(1, Math.ceil(aggregated.length / perPage)));
      enrichUsers(aggregated);
    } catch (error) {
      console.error("Error fetching users:", error);
      setAllUsers([]);
      setTotalUsers(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters.search, enrichUsers]);

  // Apply client-side filters
  useEffect(() => {
    const mergedUsers = allUsers.map((user) =>
      normalizeUser(user, sellerDetailsMap[user?.id])
    );
    let filteredUsers = [...mergedUsers];
    
    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter((user) =>
        user?.name?.toLowerCase().includes(searchLower) ||
        user?.email?.toLowerCase().includes(searchLower) ||
        user?.phone?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by verified
    if (filters.verified === "1") {
      filteredUsers = filteredUsers.filter(user => 
        isVerifiedUser(user, sellerDetailsMap[user?.id])
      );
    }

    // Filter by membership (pro)
    if (filters.membership === "pro") {
      filteredUsers = filteredUsers.filter((user) =>
        getMembershipFlags(user, sellerDetailsMap[user?.id]).isPro
      );
    }

    // Filter by shop
    if (filters.shop === "1") {
      filteredUsers = filteredUsers.filter((user) =>
        getMembershipFlags(user, sellerDetailsMap[user?.id]).isShop
      );
    }
    
    // Filter by online
    if (filters.online === "1") {
      filteredUsers = filteredUsers.filter(user =>
        user?.is_online || user?.online || isOnline(user)
      );
    }

    const sorted = [...filteredUsers];
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a?.created_at || 0) - new Date(b?.created_at || 0));
    } else if (sortBy === "most_ads") {
      sorted.sort((a, b) => (b?.total_ads || 0) - (a?.total_ads || 0));
    } else if (sortBy === "top_rated") {
      sorted.sort((a, b) => (b?.average_rating || 0) - (a?.average_rating || 0));
    }
    
    const totalFiltered = sorted.length;
    const newTotalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
    const safePage = currentPage > newTotalPages ? 1 : currentPage;
    const start = (safePage - 1) * perPage;
    const paginated = sorted.slice(start, start + perPage);

    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }

    setUsers(paginated);
    setTotalUsers(totalFiltered);
    setTotalPages(newTotalPages);
  }, [allUsers, filters, sortBy, currentPage, perPage, sellerDetailsMap]);

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

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return [filters.membership, filters.shop, filters.verified, filters.online].filter(Boolean).length;
  }, [filters]);

  const directoryStats = useMemo(() => {
    const mergedUsers = allUsers.map((user) =>
      normalizeUser(user, sellerDetailsMap[user?.id])
    );

    let proCount = 0;
    let shopCount = 0;
    let verifiedCount = 0;
    let onlineCount = 0;

    mergedUsers.forEach((user) => {
      const membership = getMembershipFlags(user, sellerDetailsMap[user?.id]);
      if (membership.isPro) proCount += 1;
      if (membership.isShop) shopCount += 1;
      if (isVerifiedUser(user, sellerDetailsMap[user?.id])) {
        verifiedCount += 1;
      }
      if (user?.is_online || user?.online || isOnline(user)) {
        onlineCount += 1;
      }
    });

    return {
      total: mergedUsers.length,
      pro: proCount,
      shop: shopCount,
      verified: verifiedCount,
      online: onlineCount,
    };
  }, [allUsers, sellerDetailsMap]);

  return (
    <Layout>
      <BreadCrumb title2="Svi korisnici" />

      <div className="container max-w-[1600px] py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            Svi korisnici
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Pronađi prodavače, kupce i trgovine na platformi
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Ukupno</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{directoryStats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Prikazano</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{totalUsers}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Pro</p>
            <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-300">{directoryStats.pro}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Shop</p>
            <p className="mt-1 text-xl font-bold text-indigo-600 dark:text-indigo-300">{directoryStats.shop}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Verificirani</p>
            <p className="mt-1 text-xl font-bold text-sky-600 dark:text-sky-300">{directoryStats.verified}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Online</p>
            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-300">{directoryStats.online}</p>
          </div>
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

                {isEnriching && (
                  <div className="flex items-center text-xs text-slate-500">
                    Učitavam detalje korisnika...
                  </div>
                )}

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
                  : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5"
              )}>
                {[...Array(12)].map((_, i) => (
                  <UserCardSkeleton key={i} view={view} />
                ))}
              </div>
            ) : users.length === 0 ? (
              <NoData name="Nema korisnika koji odgovaraju pretrazi." />
            ) : (
              <div className={cn(
                view === "list"
                  ? "space-y-4"
                  : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5"
              )}>
                <AnimatePresence mode="popLayout">
                  {users.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      view={view}
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
