"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { userSignUpData } from "@/redux/reducer/authSlice";
import {
  membershipApi,
  getNotificationList,
  getMyItemsApi,
  getMyReviewsApi,
  sellerSettingsApi,
  chatListApi,
  savedCollectionsApi,
} from "@/utils/api";

import {
  FiPlusCircle,
  FiLayers,
  FiMessageSquare,
  FiSettings,
  FiTrendingUp,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
  FiEye,
  FiUsers,
  FiClock,
  FiBarChart2,
  FiActivity,
  FiAward,
  FiZap,
  FiBookmark,
  FiTarget,
  FiTrendingDown,
} from "react-icons/fi";

// ==================== HELPER FUNKCIJE ====================

const getApiData = (res) => res?.data?.data ?? null;

const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractTotal = (payload) => {
  if (!payload) return 0;
  if (typeof payload?.total === "number") return payload.total;
  if (typeof payload?.meta?.total === "number") return payload.meta.total;
  if (typeof payload?.pagination?.total === "number") return payload.pagination.total;
  if (typeof payload?.meta?.pagination?.total === "number") return payload.meta.pagination.total;
  return 0;
};

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toRating = (v) => {
  const n = toNum(v);
  return n === null ? "0.0" : n.toFixed(1);
};

const formatNum = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num?.toString() || "0";
};

// ==================== UI KOMPONENTE ====================

// Kartica sa animacijom
function AnimatedCard({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Glavni stat sa velikim brojem
function HeroStat({ icon: Icon, label, value, sublabel, trend, trendValue, color = "primary" }) {
  const colorClasses = {
    primary: "from-primary/10 to-primary/5 text-primary border-primary/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-500/20",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-500/20",
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-500/20",
    slate: "from-slate-500/10 to-slate-500/5 text-slate-600 border-slate-500/20",
  };

  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-slate-500";

  return (
    <div className="relative bg-white rounded-3xl border border-slate-200/70 p-6 sm:p-7 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Background gradient */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-full blur-3xl opacity-30 -mr-16 -mt-16 group-hover:opacity-50 transition-opacity",
        colorClasses[color]
      )} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center border",
            colorClasses[color]
          )}>
            <Icon size={24} strokeWidth={2.5} />
          </div>

          {trend && trendValue && (
            <div className={cn("flex items-center gap-1 text-sm font-bold", trendColor)}>
              {trend === "up" ? "↑" : "↓"}
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {value}
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {label}
          </div>
          {sublabel && (
            <div className="text-xs text-slate-500 mt-1">
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Kompaktni stat
function CompactStat({ icon: Icon, label, value, action, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Icon size={18} className="text-slate-700" />
        </div>
        {trend && (
          <div className={cn(
            "text-xs font-bold",
            trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-600" : "text-slate-500"
          )}>
            {trend > 0 ? "+" : ""}{trend}%
          </div>
        )}
      </div>

      <div className="text-2xl font-extrabold text-slate-900 mb-1">
        {value}
      </div>
      <div className="text-xs font-semibold text-slate-600 mb-3">
        {label}
      </div>

      {action && (
        <CustomLink
          href={action.href}
          className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1"
        >
          {action.label}
          <FiTrendingUp size={12} />
        </CustomLink>
      )}
    </div>
  );
}

// Progress bar komponenta
function ProgressIndicator({ value, label, sublabel, color = "primary" }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  
  const colorClasses = {
    primary: "bg-primary",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-900">{label}</span>
        <span className="font-bold text-slate-700">{v}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", colorClasses[color])}
        />
      </div>
      {sublabel && (
        <p className="text-xs text-slate-500">{sublabel}</p>
      )}
    </div>
  );
}

// Action card komponenta
function ActionCard({ icon: Icon, title, description, href, badge, variant = "default" }) {
  const variantClasses = {
    default: "border-slate-200/70 hover:border-primary/30 hover:bg-primary/5",
    primary: "border-primary/20 bg-primary/5 hover:bg-primary/10",
    success: "border-emerald-200/70 bg-emerald-50/50 hover:bg-emerald-50",
  };

  return (
    <CustomLink
      href={href}
      className={cn(
        "group relative bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all",
        variantClasses[variant]
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Icon size={20} className="text-slate-700" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 line-clamp-2">{description}</p>
        </div>

        <FiTrendingUp className="text-slate-300 group-hover:text-primary transition-colors" size={16} />
      </div>
    </CustomLink>
  );
}

// Badge komponenta
function StatusBadge({ children, variant = "default" }) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    pro: "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-sm",
    shop: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400 shadow-sm",
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-extrabold border",
      variants[variant]
    )}>
      {children}
    </span>
  );
}

// Alert komponenta
function Alert({ type = "info", title, children, action }) {
  const types = {
    info: {
      bg: "bg-blue-50/50 border-blue-200/70",
      icon: "text-blue-600",
      title: "text-blue-900",
      text: "text-blue-800",
    },
    warning: {
      bg: "bg-amber-50/50 border-amber-200/70",
      icon: "text-amber-600",
      title: "text-amber-900",
      text: "text-amber-800",
    },
    success: {
      bg: "bg-emerald-50/50 border-emerald-200/70",
      icon: "text-emerald-600",
      title: "text-emerald-900",
      text: "text-emerald-800",
    },
  };

  const style = types[type];
  const Icon = type === "success" ? FiCheckCircle : type === "warning" ? FiAlertCircle : FiAlertCircle;

  return (
    <div className={cn("rounded-2xl border p-5", style.bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 shrink-0", style.icon)} size={20} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn("text-sm font-bold mb-1", style.title)}>{title}</h4>
          )}
          <div className={cn("text-sm", style.text)}>
            {children}
          </div>
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== GLAVNI DASHBOARD ====================

export default function SellerDashboard() {
  const userData = useSelector(userSignUpData);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    membershipTier: "free",
    activeAds: 0,
    totalViews: 0,
    unreadNotifications: 0,
    unreadMessages: 0,
    rating: "0.0",
    savedCount: 0,
    reviewCount: 0,
  });

  const [seller, setSeller] = useState(null);
  const [collections, setCollections] = useState([]);

  // Fetch svih podataka
  const fetchAll = useCallback(async () => {
    if (!userData) return;

    setLoading(true);

    try {
      const results = await Promise.allSettled([
        membershipApi.getUserMembership({}),
        getNotificationList.getNotification({ page: 1 }),
        getMyItemsApi.getMyItems({
          status: "approved",
          user_id: userData?.id,
          offset: 0,
          limit: 1,
        }),
        getMyReviewsApi.getMyReviews({ page: 1 }),
        sellerSettingsApi.getSettings(),
        Promise.all([
          chatListApi.chatList({ type: "buyer", page: 1 }),
          chatListApi.chatList({ type: "seller", page: 1 }),
        ]),
        savedCollectionsApi.lists(),
      ]);

      const [membershipRes, notifRes, adsRes, reviewsRes, sellerRes, chatRes, collectionsRes] = results;

      // Membership
      let membershipTier = String(userData?.membership_tier || "free").toLowerCase();
      if (membershipRes.status === "fulfilled") {
        const membershipData = getApiData(membershipRes.value);
        membershipTier = String(membershipData?.tier || membershipData?.membership_tier || membershipTier).toLowerCase();
      }

      // Notifications
      let unreadNotifications = 0;
      if (notifRes.status === "fulfilled") {
        const payload = getApiData(notifRes.value);
        const list = extractList(payload);
        unreadNotifications = list.filter((n) => !n?.read_at && !n?.is_read).length;
      }

      // Ads
      let activeAds = 0;
      let totalViews = 0;
      if (adsRes.status === "fulfilled") {
        const payload = getApiData(adsRes.value);
        activeAds = extractTotal(payload) || payload?.total || 0;
        
        const adsList = extractList(payload);
        totalViews = adsList.reduce((sum, ad) => sum + (Number(ad?.total_clicks) || 0), 0);
      }

      // Rating
      let ratingFromReviews = null;
      let reviewCount = 0;
      if (reviewsRes.status === "fulfilled") {
        const payload = getApiData(reviewsRes.value);
        const reviews = extractList(payload);
        reviewCount = reviews.length;
        
        if (reviews.length > 0) {
          const validRatings = reviews
            .map((r) => toNum(r?.ratings))
            .filter((n) => n !== null);
          if (validRatings.length > 0) {
            const avg = validRatings.reduce((a, b) => a + b, 0) / validRatings.length;
            ratingFromReviews = avg;
          }
        }
      }

      // Messages
      let unreadMessages = 0;
      if (chatRes.status === "fulfilled") {
        const [buyerChats, sellerChats] = chatRes.value;
        const buyerData = getApiData(buyerChats);
        const sellerData = getApiData(sellerChats);
        const buyerList = extractList(buyerData);
        const sellerList = extractList(sellerData);
        unreadMessages = [...buyerList, ...sellerList].filter(
          (c) => c?.unseen_messages_count > 0 || c?.unread_count > 0
        ).length;
      }

      // Seller settings
      let sellerData = null;
      if (sellerRes.status === "fulfilled") {
        sellerData = getApiData(sellerRes.value) || null;
        setSeller(sellerData);
      }

      // Collections
      let collectionsData = [];
      if (collectionsRes.status === "fulfilled") {
        const data = getApiData(collectionsRes.value);
        collectionsData = extractList(data);
        setCollections(collectionsData);
      }

      const finalRating = ratingFromReviews !== null
        ? toRating(ratingFromReviews)
        : userData?.average_rating
        ? toRating(userData.average_rating)
        : "0.0";

      setStats({
        membershipTier,
        activeAds,
        totalViews,
        unreadNotifications,
        unreadMessages,
        rating: finalRating,
        savedCount: collectionsData.reduce((sum, c) => sum + (c?.items_count || 0), 0),
        reviewCount,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Greška pri učitavanju podataka");
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Izračun seller profila completeness
  const sellerSummary = useMemo(() => {
    if (!seller) {
      return {
        percent: 0,
        missing: {
          display: true,
          desc: true,
          location: true,
          contact: true,
        },
        business: false,
        vacation: false,
      };
    }

    const checks = {
      display: Boolean(seller?.display_name?.trim()),
      desc: Boolean(seller?.description?.trim()),
      location: Boolean(seller?.city || seller?.state || seller?.country),
      contact: Boolean(seller?.phone || seller?.whatsapp || seller?.viber),
    };

    const filledCount = Object.values(checks).filter(Boolean).length;
    const percent = Math.round((filledCount / 4) * 100);

    return {
      percent,
      missing: {
        display: !checks.display,
        desc: !checks.desc,
        location: !checks.location,
        contact: !checks.contact,
      },
      business: Boolean(seller?.is_business),
      vacation: Boolean(seller?.vacation_mode),
    };
  }, [seller]);

  const isPro = stats.membershipTier === "pro";
  const isShop = stats.membershipTier === "shop";
  const isPremium = isPro || isShop;

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Učitavam dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <AnimatedCard delay={0}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
                Dashboard prodavača
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Dobrodošao nazad, <span className="font-semibold text-slate-900">{userData?.name}</span>! 
                Ovdje je pregled tvoje prodaje i aktivnosti.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isPremium && (
                <StatusBadge variant={isShop ? "shop" : "pro"}>
                  {isShop ? "🏪 SHOP" : "⭐ PRO"} paket
                </StatusBadge>
              )}
              
              <CustomLink
                href="/profile/seller-settings"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:border-primary hover:text-primary transition-all shadow-sm hover:shadow-md"
              >
                <FiSettings size={16} />
                Postavke
              </CustomLink>

              <CustomLink
                href="/ad-listing"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/90 rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                <FiPlusCircle size={16} />
                Novi oglas
              </CustomLink>
            </div>
          </div>
        </AnimatedCard>

        {/* Hero Stats - Glavni brojevi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedCard delay={0.1}>
            <HeroStat
              icon={FiLayers}
              label="Aktivnih oglasa"
              value={formatNum(stats.activeAds)}
              sublabel="Trenutno objavljeno"
              color="primary"
            />
          </AnimatedCard>

          <AnimatedCard delay={0.15}>
            <HeroStat
              icon={FiEye}
              label="Ukupno pregleda"
              value={formatNum(stats.totalViews)}
              sublabel="Svi aktivni oglasi"
              trend="up"
              trendValue="+12%"
              color="blue"
            />
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <HeroStat
              icon={FiStar}
              label="Prosječna ocjena"
              value={stats.rating}
              sublabel={`${stats.reviewCount} recenzija`}
              color="amber"
            />
          </AnimatedCard>

          <AnimatedCard delay={0.25}>
            <HeroStat
              icon={FiBookmark}
              label="Sačuvanih kontakata"
              value={formatNum(stats.savedCount)}
              sublabel={`${collections.length} kolekcija`}
              color="emerald"
            />
          </AnimatedCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - 2/3 širine */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Membership Status */}
            {!isPremium && (
              <AnimatedCard delay={0.3}>
                <Alert
                  type="info"
                  title="Nadogradi na Pro paket"
                  action={
                    <CustomLink
                      href="/user-subscription"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
                    >
                      Pogledaj pakete
                      <FiZap size={14} />
                    </CustomLink>
                  }
                >
                  <ul className="space-y-2 text-sm mt-2">
                    <li className="flex items-center gap-2">
                      <FiCheckCircle className="text-emerald-600 shrink-0" size={16} />
                      Veće povjerenje i bolji profil prodavača
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheckCircle className="text-emerald-600 shrink-0" size={16} />
                      Oglasi se prikazuju na boljim pozicijama
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheckCircle className="text-emerald-600 shrink-0" size={16} />
                      Više prodaje i brža komunikacija sa kupcima
                    </li>
                  </ul>
                </Alert>
              </AnimatedCard>
            )}

            {/* Quick Stats Grid */}
            <AnimatedCard delay={0.35}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <CompactStat
                  icon={FiMessageSquare}
                  label="Nepročitane poruke"
                  value={stats.unreadMessages}
                  action={{ label: "Otvori chat", href: "/chat" }}
                  trend={stats.unreadMessages > 0 ? -5 : 0}
                />
                
                <CompactStat
                  icon={FiAlertCircle}
                  label="Obavijesti"
                  value={stats.unreadNotifications}
                  action={{ label: "Pogledaj", href: "/notifications" }}
                />

                <CompactStat
                  icon={FiUsers}
                  label="Sačuvani selleri"
                  value={stats.savedCount}
                  action={{ label: "Upravljaj", href: "/saved-sellers" }}
                  trend={8}
                />
              </div>
            </AnimatedCard>

            {/* Brze akcije */}
            <AnimatedCard delay={0.4}>
              <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-4">Brze akcije</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ActionCard
                    icon={FiLayers}
                    title="Moji oglasi"
                    description="Upravljaj svim svojim objavama i statistikama"
                    href="/my-ads"
                    badge={stats.activeAds}
                  />

                  <ActionCard
                    icon={FiMessageSquare}
                    title="Poruke"
                    description="Odgovori na upite kupaca i zatvori prodaje"
                    href="/chat"
                    badge={stats.unreadMessages > 0 ? stats.unreadMessages : null}
                    variant={stats.unreadMessages > 0 ? "primary" : "default"}
                  />

                  <ActionCard
                    icon={FiBookmark}
                    title="Sačuvani kontakti"
                    description="Upravljaj kolekcijama i bilješkama"
                    href="/saved-sellers"
                  />

                  <ActionCard
                    icon={FiBarChart2}
                    title="Statistika"
                    description="Detaljni uvid u preformanse oglasa"
                    href="/my-ads?tab=stats"
                  />
                </div>
              </div>
            </AnimatedCard>

            {/* Seller completeness - ako nije 100% */}
            {sellerSummary.percent < 100 && (
              <AnimatedCard delay={0.45}>
                <Alert
                  type="warning"
                  title="Dovrši profil prodavača"
                  action={
                    <CustomLink
                      href="/profile/seller-settings"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all"
                    >
                      Uredi profil
                      <FiSettings size={14} />
                    </CustomLink>
                  }
                >
                  <div className="space-y-3 mt-3">
                    <ProgressIndicator
                      value={sellerSummary.percent}
                      label="Popunjenost profila"
                      sublabel="Što kompletiraniji profil, to više prodaje"
                      color="amber"
                    />

                    <div className="space-y-2 text-sm">
                      {sellerSummary.missing.display && (
                        <div className="flex items-center gap-2 text-amber-800">
                          <FiAlertCircle size={14} />
                          <span>Dodaj <strong>naziv prikaza</strong></span>
                        </div>
                      )}
                      {sellerSummary.missing.desc && (
                        <div className="flex items-center gap-2 text-amber-800">
                          <FiAlertCircle size={14} />
                          <span>Napiši <strong>opis</strong> o sebi</span>
                        </div>
                      )}
                      {sellerSummary.missing.location && (
                        <div className="flex items-center gap-2 text-amber-800">
                          <FiAlertCircle size={14} />
                          <span>Postavi <strong>lokaciju</strong></span>
                        </div>
                      )}
                      {sellerSummary.missing.contact && (
                        <div className="flex items-center gap-2 text-amber-800">
                          <FiAlertCircle size={14} />
                          <span>Dodaj <strong>kontakt brojeve</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              </AnimatedCard>
            )}
          </div>

          {/* RIGHT COLUMN - 1/3 širine */}
          <div className="space-y-6">
            
            {/* Status Summary */}
            <AnimatedCard delay={0.5}>
              <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-5">Tvoj status</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-600">Tip naloga</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {sellerSummary.business ? "Biznis" : "Privatno"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-600">Paket</span>
                    <StatusBadge variant={isShop ? "shop" : isPro ? "pro" : "default"}>
                      {isShop ? "Shop" : isPro ? "Pro" : "Free"}
                    </StatusBadge>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-600">Odmor</span>
                    <StatusBadge variant={sellerSummary.vacation ? "warning" : "success"}>
                      {sellerSummary.vacation ? "Uključeno" : "Isključeno"}
                    </StatusBadge>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-semibold text-slate-600">Profil</span>
                    <StatusBadge variant={sellerSummary.percent >= 85 ? "success" : "warning"}>
                      {sellerSummary.percent}%
                    </StatusBadge>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            {/* Kolekcije preview */}
            {collections.length > 0 && (
              <AnimatedCard delay={0.55}>
                <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-900">Kolekcije</h3>
                    <CustomLink
                      href="/saved-sellers"
                      className="text-xs font-bold text-primary hover:text-primary/80"
                    >
                      Pogledaj sve →
                    </CustomLink>
                  </div>

                  <div className="space-y-2">
                    {collections.slice(0, 3).map((collection) => (
                      <div
                        key={collection.id}
                        className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {collection.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {collection.items_count || 0} kontakta
                          </div>
                        </div>
                        <FiBookmark className="text-slate-300" size={16} />
                      </div>
                    ))}
                  </div>

                  {collections.length > 3 && (
                    <div className="mt-3 text-center">
                      <CustomLink
                        href="/saved-sellers"
                        className="text-xs font-bold text-slate-500 hover:text-primary"
                      >
                        +{collections.length - 3} više
                      </CustomLink>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            )}

            {/* Savjeti */}
            <AnimatedCard delay={0.6}>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-3xl border border-emerald-200/70 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                    <FiTarget size={18} />
                  </div>
                  <h3 className="text-lg font-black text-emerald-900">Pro savjeti</h3>
                </div>

                <ul className="space-y-3 text-sm text-emerald-800">
                  <li className="flex items-start gap-2">
                    <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={16} />
                    <span>Odgovori na poruke u roku od <strong>1-2 sata</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={16} />
                    <span>Drži profil prodavača <strong>ažurnim</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={16} />
                    <span>Koristi <strong>kvalitetne slike</strong> u oglasima</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={16} />
                    <span>Sačuvaj kontakte kupaca u <strong>kolekcije</strong></span>
                  </li>
                </ul>
              </div>
            </AnimatedCard>

            {/* Quick Links */}
            <AnimatedCard delay={0.65}>
              <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-4">Korisni linkovi</h3>
                
                <div className="space-y-2">
                  <CustomLink
                    href="/help"
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <FiShield className="text-slate-400 group-hover:text-primary" size={18} />
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                        Pomoć i podrška
                      </span>
                    </div>
                    <FiTrendingUp className="text-slate-300 group-hover:text-primary" size={14} />
                  </CustomLink>

                  <CustomLink
                    href="/user-subscription"
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <FiAward className="text-slate-400 group-hover:text-primary" size={18} />
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                        Paketi i cijene
                      </span>
                    </div>
                    <FiTrendingUp className="text-slate-300 group-hover:text-primary" size={14} />
                  </CustomLink>

                  <CustomLink
                    href="/reviews"
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <FiStar className="text-slate-400 group-hover:text-primary" size={18} />
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                        Moje recenzije
                      </span>
                    </div>
                    <FiTrendingUp className="text-slate-300 group-hover:text-primary" size={14} />
                  </CustomLink>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </div>
  );
}