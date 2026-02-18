"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "@/utils/toastBs";

import CustomLink from "@/components/Common/CustomLink";
import MembershipBadge from "@/components/Common/MembershipBadge";
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
  itemStatisticsApi,
} from "@/utils/api";

import {
  PlusCircle,
  Layers,
  MessageSquare,
  Settings,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle,
  Star,
  Eye,
  Users,
  Clock,
  BarChart3,
  Activity,
  Award,
  Zap,
  Bookmark,
  Target,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Package,
  ChevronRight,
} from "@/components/Common/UnifiedIconPack";

// ==================== HELPER FUNKCIJE ====================

const unwrapPayload = (res) => {
  if (!res) return null;
  const root = res?.data ?? res;
  if (root === null || root === undefined) return null;
  if (typeof root !== "object") return root;
  if (root?.data !== undefined && root?.data !== null) return root.data;
  return root;
};

const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.data,
    payload?.items,
    payload?.rows,
    payload?.results,
    payload?.list,
    payload?.notifications,
    payload?.collections,
    payload?.chats,
    payload?.reviews,
    payload?.records,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  if (payload?.data && typeof payload.data === "object") {
    const nested = extractList(payload.data);
    if (nested.length > 0) return nested;
  }

  return [];
};

const extractTotal = (payload) => {
  if (!payload || typeof payload !== "object") return 0;

  const candidates = [
    payload?.total,
    payload?.count,
    payload?.total_count,
    payload?.meta?.total,
    payload?.pagination?.total,
    payload?.meta?.pagination?.total,
    payload?.data?.total,
    payload?.data?.count,
    payload?.data?.meta?.total,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) return parsed;
  }

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

// Animirana kartica
function AnimatedCard({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stat kartica
function StatCard({ icon: Icon, label, value, sublabel, color = "slate", trend, trendValue }) {
  const colorStyles = {
    slate: "bg-slate-50 text-slate-600 border-slate-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border", colorStyles[color])}>
          <Icon size={20} strokeWidth={2} />
        </div>
        {trend && trendValue && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
              trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}
          >
            {trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trendValue}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
        <div className="text-sm font-medium text-slate-700">{label}</div>
        {sublabel && <div className="text-xs text-slate-500">{sublabel}</div>}
      </div>
    </div>
  );
}

// Akcijska kartica
function ActionCard({ icon: Icon, title, description, href, badge, variant = "default" }) {
  const variants = {
    default: "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50",
    primary: "border-slate-900/10 bg-slate-900/[0.02] hover:bg-slate-900/[0.04]",
    success: "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/50",
  };

  return (
    <CustomLink
      href={href}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl border bg-white transition-all duration-200 hover:shadow-sm",
        variants[variant]
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
        <Icon size={18} className="text-slate-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">{description}</p>
      </div>

      <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
    </CustomLink>
  );
}

// Status badge
function StatusBadge({ children, variant = "default" }) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    pro: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200",
    shop: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold", variants[variant])}>
      {children}
    </span>
  );
}

// Progress bar
function ProgressBar({ value, label, sublabel, color = "slate" }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));

  const colorStyles = {
    slate: "bg-slate-900",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{v}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", colorStyles[color])}
        />
      </div>
      {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
    </div>
  );
}

// Alert
function Alert({ type = "info", title, children, action }) {
  const styles = {
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: "text-blue-600",
      title: "text-blue-900",
      text: "text-blue-800",
    },
    warning: {
      bg: "bg-amber-50 border-amber-200",
      icon: "text-amber-600",
      title: "text-amber-900",
      text: "text-amber-800",
    },
    success: {
      bg: "bg-emerald-50 border-emerald-200",
      icon: "text-emerald-600",
      title: "text-emerald-900",
      text: "text-emerald-800",
    },
  };

  const style = styles[type];
  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <div className={cn("rounded-xl border p-4", style.bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 shrink-0", style.icon)} size={18} />
        <div className="flex-1 min-w-0">
          {title && <h4 className={cn("text-sm font-semibold mb-1", style.title)}>{title}</h4>}
          <div className={cn("text-sm", style.text)}>{children}</div>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}

// ==================== GLAVNI DASHBOARD ====================

export default function SellerDashboard() {
  const userData = useSelector(userSignUpData);

  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef(0);
  const DASHBOARD_FETCH_COOLDOWN_MS = 15000;
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
  const fetchAll = useCallback(async ({ force = false, showLoader = true } = {}) => {
    if (!userData) return;
    const now = Date.now();
    if (!force && now - lastFetchRef.current < DASHBOARD_FETCH_COOLDOWN_MS) {
      return;
    }
    lastFetchRef.current = now;

    if (showLoader) {
      setLoading(true);
    }

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
        itemStatisticsApi.getSellerOverview({ period: 30, top: 8 }),
      ]);

      const [membershipRes, notifRes, adsRes, reviewsRes, sellerRes, chatRes, collectionsRes, overviewRes] = results;

      const getCountSafe = (...values) => {
        for (const value of values) {
          const parsed = toNum(value);
          if (parsed !== null) return parsed;
        }
        return 0;
      };

      // Membership
      let membershipTier = String(userData?.membership_tier || "free").toLowerCase();
      if (membershipRes.status === "fulfilled") {
        const membershipData = unwrapPayload(membershipRes.value);
        membershipTier = String(
          membershipData?.tier || membershipData?.membership_tier || membershipTier
        ).toLowerCase();
      }

      // Seller overview (optional endpoint)
      let overviewSummary = null;
      if (overviewRes.status === "fulfilled") {
        const overviewPayload = unwrapPayload(overviewRes.value);
        overviewSummary = overviewPayload?.summary || overviewPayload || null;
      }

      // Notifications
      let unreadNotifications = 0;
      if (notifRes.status === "fulfilled") {
        const payload = unwrapPayload(notifRes.value);
        const list = extractList(payload);
        unreadNotifications = getCountSafe(
          payload?.unread_count,
          payload?.meta?.unread_count,
          payload?.data?.unread_count,
          list.filter((n) => !n?.read_at && !n?.is_read).length
        );
      }

      // Ads
      let activeAds = 0;
      let totalViews = 0;
      if (adsRes.status === "fulfilled") {
        const payload = unwrapPayload(adsRes.value);
        activeAds = getCountSafe(extractTotal(payload), payload?.total);

        const adsList = extractList(payload);
        totalViews = getCountSafe(
          overviewSummary?.views,
          overviewSummary?.total_views,
          payload?.totals?.views,
          payload?.summary?.views,
          adsList.reduce(
            (sum, ad) =>
              sum +
              getCountSafe(
                ad?.total_clicks,
                ad?.views,
                ad?.total_views
              ),
            0
          )
        );
      }

      // ako overview vrati preciznije brojke, koristi njih
      if (overviewSummary) {
        activeAds = getCountSafe(
          overviewSummary?.active_ads,
          overviewSummary?.active_items,
          overviewSummary?.ads_active,
          activeAds
        );
        totalViews = getCountSafe(
          overviewSummary?.views,
          overviewSummary?.total_views,
          totalViews
        );
      }

      // Rating
      let ratingFromReviews = null;
      let reviewCount = 0;
      if (reviewsRes.status === "fulfilled") {
        const payload = unwrapPayload(reviewsRes.value);
        const reviews = extractList(payload);
        reviewCount = getCountSafe(extractTotal(payload), reviews.length);

        const averageFromPayload = toNum(
          payload?.average_rating ?? payload?.avg_rating ?? payload?.summary?.average_rating
        );
        if (averageFromPayload !== null) {
          ratingFromReviews = averageFromPayload;
        }

        if (ratingFromReviews === null && reviews.length > 0) {
          const validRatings = reviews.map((r) => toNum(r?.ratings)).filter((n) => n !== null);
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
        const buyerData = unwrapPayload(buyerChats);
        const sellerData = unwrapPayload(sellerChats);
        const buyerList = extractList(buyerData);
        const sellerList = extractList(sellerData);

        unreadMessages = getCountSafe(
          buyerData?.unread_count,
          buyerData?.meta?.unread_count,
          0
        ) + getCountSafe(
          sellerData?.unread_count,
          sellerData?.meta?.unread_count,
          0
        );

        if (unreadMessages === 0) {
          unreadMessages = [...buyerList, ...sellerList].reduce(
            (sum, chat) =>
              sum +
              getCountSafe(chat?.unseen_messages_count, chat?.unread_count, 0),
            0
          );
        }
      }

      // Seller settings
      let sellerData = null;
      if (sellerRes.status === "fulfilled") {
        sellerData = unwrapPayload(sellerRes.value) || null;
        setSeller(sellerData);
      }

      // Collections
      let collectionsData = [];
      if (collectionsRes.status === "fulfilled") {
        const data = unwrapPayload(collectionsRes.value);
        collectionsData = extractList(data);
        setCollections(collectionsData);
      }

      const finalRating =
        ratingFromReviews !== null
          ? toRating(ratingFromReviews)
          : userData?.average_rating
          ? toRating(userData.average_rating)
          : "0.0";

      setStats({
        membershipTier,
        activeAds: getCountSafe(activeAds, 0),
        totalViews: getCountSafe(totalViews, 0),
        unreadNotifications: getCountSafe(unreadNotifications, 0),
        unreadMessages: getCountSafe(unreadMessages, 0),
        rating: finalRating,
        savedCount: collectionsData.reduce((sum, c) => sum + getCountSafe(c?.items_count, 0), 0),
        reviewCount: getCountSafe(reviewCount, 0),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Greška pri učitavanju podataka");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [userData, DASHBOARD_FETCH_COOLDOWN_MS]);

  useEffect(() => {
    if (!userData) {
      setLoading(false);
      return;
    }
    fetchAll({ force: true, showLoader: true });
  }, [fetchAll, userData]);

  useEffect(() => {
    if (!userData) return;

    const handleRealtimeRefresh = (event) => {
      const detail = event?.detail;
      if (!detail) return;
      if (detail?.category === "notification" || detail?.category === "chat" || detail?.category === "system") {
        fetchAll({ showLoader: false });
      }
    };

    window.addEventListener("lmx:realtime-event", handleRealtimeRefresh);
    return () => window.removeEventListener("lmx:realtime-event", handleRealtimeRefresh);
  }, [userData, fetchAll]);

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Učitavam dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatedCard delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard prodavača</h1>
            <p className="text-slate-500 text-sm mt-1">
              Dobrodošao nazad, <span className="font-medium text-slate-700">{userData?.name}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPremium && (
              <MembershipBadge
                tier={isShop ? "shop" : "pro"}
                size="sm"
                uppercase
              />
            )}

            <CustomLink href="/profile/seller-settings">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings size={16} />
                Postavke
              </Button>
            </CustomLink>

            {userData?.id ? (
              <CustomLink href={`/seller/${userData.id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowRight size={16} />
                  Javni profil
                </Button>
              </CustomLink>
            ) : null}

            <CustomLink href="/ad-listing">
              <Button size="sm" className="gap-2 bg-slate-900 hover:bg-slate-800">
                <PlusCircle size={16} />
                Novi oglas
              </Button>
            </CustomLink>
          </div>
        </div>
      </AnimatedCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCard delay={0.05}>
          <StatCard
            icon={Layers}
            label="Aktivnih oglasa"
            value={formatNum(stats.activeAds)}
            sublabel="Trenutno objavljeno"
            color="blue"
          />
        </AnimatedCard>

        <AnimatedCard delay={0.1}>
          <StatCard
            icon={Eye}
            label="Ukupno pregleda"
            value={formatNum(stats.totalViews)}
            sublabel="Svi aktivni oglasi"
            color="purple"
            trend="up"
            trendValue="+12%"
          />
        </AnimatedCard>

        <AnimatedCard delay={0.15}>
          <StatCard
            icon={Star}
            label="Prosječna ocjena"
            value={stats.rating}
            sublabel={`${stats.reviewCount} recenzija`}
            color="amber"
          />
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <StatCard
            icon={Bookmark}
            label="Sačuvanih kontakata"
            value={formatNum(stats.savedCount)}
            sublabel={`${collections.length} kolekcija`}
            color="emerald"
          />
        </AnimatedCard>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upgrade CTA */}
          {!isPremium && (
            <AnimatedCard delay={0.25}>
              <Alert
                type="info"
                title="Nadogradi na Pro paket"
                action={
                  <CustomLink href="/user-subscription">
                    <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                      Pogledaj pakete
                      <Zap size={14} />
                    </Button>
                  </CustomLink>
                }
              >
                <ul className="space-y-1.5 text-sm mt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-blue-600 shrink-0" size={14} />
                    Veće povjerenje i bolji profil prodavača
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-blue-600 shrink-0" size={14} />
                    Oglasi se prikazuju na boljim pozicijama
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-blue-600 shrink-0" size={14} />
                    Više prodaje i brža komunikacija
                  </li>
                </ul>
              </Alert>
            </AnimatedCard>
          )}

          {/* Quick Stats */}
          <AnimatedCard delay={0.3}>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 text-center">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <MessageSquare size={18} className="text-slate-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.unreadMessages}</div>
                <div className="text-xs text-slate-500">Nepročitane poruke</div>
                <CustomLink
                  href="/chat"
                  className="text-xs font-medium text-slate-900 hover:underline mt-2 inline-block"
                >
                  Otvori chat →
                </CustomLink>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 text-center">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <AlertCircle size={18} className="text-slate-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.unreadNotifications}</div>
                <div className="text-xs text-slate-500">Obavijesti</div>
                <CustomLink
                  href="/notifications"
                  className="text-xs font-medium text-slate-900 hover:underline mt-2 inline-block"
                >
                  Pogledaj →
                </CustomLink>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 text-center">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <Users size={18} className="text-slate-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.savedCount}</div>
                <div className="text-xs text-slate-500">Sačuvani prodavači</div>
                <CustomLink
                  href="/profile/saved"
                  className="text-xs font-medium text-slate-900 hover:underline mt-2 inline-block"
                >
                  Upravljaj →
                </CustomLink>
              </div>
            </div>
          </AnimatedCard>

          {/* Quick Actions */}
          <AnimatedCard delay={0.35}>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Brze akcije</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ActionCard
                  icon={Layers}
                  title="Moji oglasi"
                  description="Upravljaj svim objavama"
                  href="/my-ads"
                  badge={stats.activeAds > 0 ? stats.activeAds : null}
                />

                <ActionCard
                  icon={MessageSquare}
                  title="Poruke"
                  description="Odgovori kupcima"
                  href="/chat"
                  badge={stats.unreadMessages > 0 ? stats.unreadMessages : null}
                  variant={stats.unreadMessages > 0 ? "primary" : "default"}
                />

                <ActionCard
                  icon={Bookmark}
                  title="Sačuvani kontakti"
                  description="Kolekcije i bilješke"
                  href="/profile/saved"
                />

                <ActionCard
                  icon={BarChart3}
                  title="Statistika"
                  description="Preformanse oglasa"
                  href="/my-ads?tab=stats"
                />
              </div>
            </div>
          </AnimatedCard>

          {/* Profile Completeness */}
          {/* {sellerSummary.percent < 100 && (
            <AnimatedCard delay={0.4}>
              <Alert
                type="warning"
                title="Dovrši profil prodavača"
                action={
                  <CustomLink href="/profile/seller-settings">
                    <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700">
                      Uredi profil
                      <Settings size={14} />
                    </Button>
                  </CustomLink>
                }
              >
                <div className="space-y-3 mt-2">
                  <ProgressBar
                    value={sellerSummary.percent}
                    label="Popunjenost profila"
                    sublabel="Kompletniji profil = više prodaje"
                    color="amber"
                  />

                  <div className="space-y-1.5 text-sm">
                    {sellerSummary.missing.display && (
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle size={14} />
                        <span>
                          Dodaj <strong>naziv prikaza</strong>
                        </span>
                      </div>
                    )}
                    {sellerSummary.missing.desc && (
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle size={14} />
                        <span>
                          Napiši <strong>opis</strong> o sebi
                        </span>
                      </div>
                    )}
                    {sellerSummary.missing.location && (
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle size={14} />
                        <span>
                          Postavi <strong>lokaciju</strong>
                        </span>
                      </div>
                    )}
                    {sellerSummary.missing.contact && (
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle size={14} />
                        <span>
                          Dodaj <strong>kontakt brojeve</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            </AnimatedCard>
          )} */}
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Status Summary */}
          <AnimatedCard delay={0.45}>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Tvoj status</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Tip naloga</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {sellerSummary.business ? "Biznis" : "Privatno"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Paket</span>
                  {isPremium ? (
                    <MembershipBadge
                      tier={isShop ? "shop" : "pro"}
                      size="xs"
                      uppercase
                    />
                  ) : (
                    <StatusBadge variant="default">Free</StatusBadge>
                  )}
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Odmor</span>
                  <StatusBadge variant={sellerSummary.vacation ? "warning" : "success"}>
                    {sellerSummary.vacation ? "Uključeno" : "Isključeno"}
                  </StatusBadge>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-slate-600">Profil</span>
                  <StatusBadge variant={sellerSummary.percent >= 85 ? "success" : "warning"}>
                    {sellerSummary.percent}%
                  </StatusBadge>
                </div>
              </div>
            </div>
          </AnimatedCard>

          {/* Collections Preview */}
          {collections.length > 0 && (
            <AnimatedCard delay={0.5}>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-900">Kolekcije</h3>
                  <CustomLink
                    href="/profile/saved"
                    className="text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    Sve →
                  </CustomLink>
                </div>

                <div className="space-y-2">
                  {collections.slice(0, 3).map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{collection.name}</div>
                        <div className="text-xs text-slate-500">{collection.items_count || 0} kontakta</div>
                      </div>
                      <Bookmark size={16} className="text-slate-300" />
                    </div>
                  ))}
                </div>

                {collections.length > 3 && (
                  <div className="mt-3 text-center">
                    <CustomLink
                      href="/profile/saved"
                      className="text-xs font-medium text-slate-500 hover:text-slate-900"
                    >
                      +{collections.length - 3} više
                    </CustomLink>
                  </div>
                )}
              </div>
            </AnimatedCard>
          )}

          {/* Tips */}
          <AnimatedCard delay={0.55}>
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="text-emerald-600" />
                <h3 className="text-base font-semibold text-emerald-900">Pro savjeti</h3>
              </div>

              <ul className="space-y-2 text-sm text-emerald-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={14} />
                  <span>
                    Odgovori na poruke u roku od <strong>1-2 sata</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={14} />
                  <span>
                    Drži profil prodavača <strong>ažurnim</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={14} />
                  <span>
                    Koristi <strong>kvalitetne slike</strong> u oglasima
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={14} />
                  <span>
                    Sačuvaj kontakte kupaca u <strong>kolekcije</strong>
                  </span>
                </li>
              </ul>
            </div>
          </AnimatedCard>

          {/* Quick Links */}
          {/* <AnimatedCard delay={0.6}>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Korisni linkovi</h3>

              <div className="space-y-1">
                <CustomLink
                  href="/faqs"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-slate-400 group-hover:text-slate-600" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      Pomoć i podrška
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                </CustomLink>

                <CustomLink
                  href="/user-subscription"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Award size={18} className="text-slate-400 group-hover:text-slate-600" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      Paketi i cijene
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                </CustomLink>

                <CustomLink
                  href="/reviews"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Star size={18} className="text-slate-400 group-hover:text-slate-600" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      Moje recenzije
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                </CustomLink>
              </div>
            </div>
          </AnimatedCard> */}
        </div>
      </div>
    </div>
  );
}
