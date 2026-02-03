"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import CustomImage from "@/components/Common/CustomImage";
import { cn } from "@/lib/utils";
import { formatDate, t, truncate } from "@/utils";
import axios from "axios";

import {
  Search,
  Users,
  Package,
  Star,
  Mail,
  Phone,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Eye,
  MessageCircle,
  BadgeCheck,
  Clock,
  Filter,
  X,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin.lmx.ba";

/* =====================================================
   ANIMACIJE
===================================================== */

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

/* =====================================================
   UI KOMPONENTE
===================================================== */

const GlassCard = ({ children, className, onClick, ...props }) => (
  <motion.div
    variants={fadeInUp}
    onClick={onClick}
    className={cn(
      "relative overflow-hidden rounded-2xl",
      "bg-white dark:bg-slate-900",
      "border border-slate-200/60 dark:border-slate-700/60",
      "shadow-sm hover:shadow-md",
      "transition-all duration-300",
      onClick && "cursor-pointer hover:-translate-y-1",
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);

const Spinner = () => (
  <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
);

/* =====================================================
   AVATAR KOMPONENTA
===================================================== */

const UserAvatar = ({ user, size = "md" }) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };

  const profileImage = user?.profile || user?.profile_image || user?.avatar;

  return (
    <div
      className={cn(
        sizeClasses[size],
        "rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0"
      )}
    >
      {profileImage ? (
        <CustomImage
          src={profileImage}
          alt={user?.name || "Korisnik"}
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
          <span className="text-slate-600 dark:text-slate-300 font-bold text-lg">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
      )}
    </div>
  );
};

/* =====================================================
   USER CARD KOMPONENTA
===================================================== */

const UserCard = ({ user, onClick }) => {
  const memberSince = user?.created_at ? formatDate(user.created_at) : null;
  const isOnline = user?.is_online || user?.online || false;
  const lastSeen = user?.last_active_at || user?.last_seen;
  
  const activeAdsCount = user?.active_ads_count ?? user?.active_ads ?? user?.items_count ?? 0;
  const totalAdsCount = user?.total_ads_count ?? user?.total_ads ?? user?.all_items_count ?? 0;

  return (
    <GlassCard onClick={onClick} className="group">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative">
            <UserAvatar user={user} size="md" />
            {/* Online indikator */}
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm group-hover:text-primary transition-colors">
                {user?.name || "Nepoznat korisnik"}
              </h3>
              {user?.is_verified && (
                <BadgeCheck className="w-4 h-4 text-sky-500 flex-shrink-0" />
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mt-1">
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Online
                </span>
              ) : lastSeen ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Viđen {formatDate(lastSeen)}
                </span>
              ) : null}
            </div>

            {/* Email */}
            {user?.email && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Mail className="w-3 h-3" />
                <span className="truncate">{truncate(user.email, 25)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <Package className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{activeAdsCount}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Aktivnih</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <Star className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{totalAdsCount}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Ukupno</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {memberSince && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>Član {memberSince}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Pogledaj profil</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

/* =====================================================
   SKELETON KOMPONENTE
===================================================== */

const UserCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 mt-4">
      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
    </div>
  </div>
);

/* =====================================================
   MAIN PAGE COMPONENT
===================================================== */

const SviKorisniciPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/users`, {
        params: {
          page: currentPage,
          per_page: 12,
          search: debouncedSearch || undefined,
          role: filterRole !== "all" ? filterRole : undefined,
        },
      });

      if (response.data.success) {
        setUsers(response.data.data || []);
        setTotalPages(response.data.last_page || 1);
        setCurrentPage(response.data.current_page || 1);
        setTotalUsers(response.data.total || 0);
      } else {
        setError("Greška pri učitavanju korisnika");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Greška pri učitavanju korisnika. Provjerite konekciju.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const goToUserProfile = (userId) => {
    router.push(`/seller/${userId}`);
  };

  return (
    <Layout>
      <BreadCrumb title2="Svi korisnici" />

      <div className="container py-6 lg:py-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
              Svi korisnici
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Pronađi i poveži se sa korisnicima na platformi
            </p>
          </div>

          {totalUsers > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {totalUsers}
              </span>
              <span className="text-sm text-slate-500">korisnika</span>
            </div>
          )}
        </div>

        {/* Search & Filter */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Pretraži po imenu ili emailu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full pl-12 pr-10 py-3 rounded-xl",
                  "bg-slate-50 dark:bg-slate-800",
                  "border border-slate-200 dark:border-slate-700",
                  "text-slate-900 dark:text-white placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                  "transition-all duration-200"
                )}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Filter */}
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
              className={cn(
                "px-4 py-3 rounded-xl min-w-[160px]",
                "bg-slate-50 dark:bg-slate-800",
                "border border-slate-200 dark:border-slate-700",
                "text-slate-900 dark:text-white text-sm font-medium",
                "focus:outline-none focus:ring-2 focus:ring-primary/30",
                "transition-all duration-200"
              )}
            >
              <option value="all">Svi korisnici</option>
              <option value="user">Obični korisnici</option>
              <option value="admin">Administratori</option>
            </select>

            {/* Refresh button */}
            <button
              onClick={fetchUsers}
              disabled={loading}
              className={cn(
                "px-4 py-3 rounded-xl",
                "bg-primary text-white font-semibold",
                "hover:bg-primary/90 disabled:opacity-50",
                "transition-all duration-200",
                "flex items-center justify-center gap-2"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span className="hidden sm:inline">Osvježi</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading && users.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Greška
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchUsers}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Pokušaj ponovo
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Nema rezultata
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Pokušajte sa drugačijim parametrima pretrage
            </p>
          </div>
        ) : (
          <>
            {/* Users Grid */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onClick={() => goToUserProfile(user.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Stranica{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currentPage}
                  </span>{" "}
                  od{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {totalPages}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
                      "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                      "text-slate-700 dark:text-slate-200",
                      "hover:bg-slate-50 dark:hover:bg-slate-700",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all duration-200"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prethodna
                  </button>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
                      "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                      "text-slate-700 dark:text-slate-200",
                      "hover:bg-slate-50 dark:hover:bg-slate-700",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all duration-200"
                    )}
                  >
                    Sljedeća
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default SviKorisniciPage;
