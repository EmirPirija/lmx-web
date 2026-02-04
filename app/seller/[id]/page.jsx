"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "sonner";

import ProfileLayout from "@/components/Profile/ProfileLayout";
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
  PlusCircle,
  Layers,
  MessageSquare,
  Settings,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Star,
  Eye,
  Users,
  BarChart3,
  Award,
  Zap,
  Bookmark,
  Target,
  ChevronRight,
  Sparkles,
  Package,
  Crown,
  Store,
  ArrowUpRight,
  Loader2,
  Calendar,
  Clock,
} from "lucide-react";

// ============================================
// HELPERS
// ============================================

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
  return 0;
};
const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const toRating = (v) => { const n = toNum(v); return n === null ? "0.0" : n.toFixed(1); };
const formatNum = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num?.toString() || "0";
};

// ============================================
// COMPONENTS
// ============================================

function BigStatCard({ icon: Icon, label, value, sublabel, color, trend, trendValue }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50"
    >
      <div className={cn("absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 opacity-20", `bg-gradient-to-br ${color}`)} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg", `bg-gradient-to-br ${color}`)}>
            <Icon size={32} className="text-white" />
          </div>
          {trend && trendValue && (
            <div className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold",
              trend === "up" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700"
            )}>
              <TrendingUp size={14} className={trend === "up" ? "" : "rotate-180"} />
              {trendValue}
            </div>
          )}
        </div>

        <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{value}</div>
        <div className="text-base font-semibold text-slate-700 dark:text-slate-300 mt-2">{label}</div>
        {sublabel && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{sublabel}</div>}
      </div>
    </motion.div>
  );
}

function QuickActionCard({ icon: Icon, title, description, href, badge, color = "from-slate-600 to-slate-800" }) {
  return (
    <CustomLink href={href}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-200/50 dark:border-slate-700/50 h-full"
      >
        <div className="flex items-start gap-4">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0", `bg-gradient-to-br ${color}`)}>
            <Icon size={28} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white">{title}</h4>
              {badge && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          </div>
          <ChevronRight size={20} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </motion.div>
    </CustomLink>
  );
}

function MembershipCard({ tier, onUpgrade }) {
  const isPro = tier === "pro";
  const isShop = tier === "shop";
  const isPremium = isPro || isShop;

  if (isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-[2rem] p-6 shadow-xl",
          isShop 
            ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700" 
            : "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
        )}
      >
        <div className="absolute inset-0 bg-[url('/assets/pattern.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-3 mb-4">
            {isShop ? <Store size={32} /> : <Crown size={32} />}
            <div>
              <div className="text-2xl font-black">{isShop ? "SHOP" : "PRO"} Paket</div>
              <div className="text-white/70 text-sm">Premium članstvo aktivno</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">∞</div>
              <div className="text-xs text-white/70">Oglasa</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">VIP</div>
              <div className="text-xs text-white/70">Podrška</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] p-6 border-2 border-dashed border-primary/30"
    >
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <Zap size={32} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nadogradi na PRO</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Otključaj sve premium funkcije</p>
        
        <ul className="text-left space-y-3 mb-6">
          {["Neograničen broj oglasa", "Prioritetni prikaz", "VIP podrška", "Napredna statistika"].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <CheckCircle size={16} className="text-green-500" />
              {item}
            </li>
          ))}
        </ul>
        
        <CustomLink href="/user-subscription">
          <Button className="w-full bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 shadow-lg shadow-primary/20">
            <Sparkles size={18} className="mr-2" />
            Pogledaj pakete
          </Button>
        </CustomLink>
      </div>
    </motion.div>
  );
}

function TipsCard() {
  const tips = [
    { icon: Clock, text: "Odgovori brzo na poruke", color: "text-blue-500" },
    { icon: Eye, text: "Koristi kvalitetne slike", color: "text-purple-500" },
    { icon: Target, text: "Postavi konkurentne cijene", color: "text-green-500" },
    { icon: Star, text: "Zatraži recenzije od kupaca", color: "text-amber-500" },
  ];

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-[2rem] p-6 border border-emerald-200 dark:border-emerald-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Target size={20} className="text-white" />
        </div>
        <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Pro savjeti</h3>
      </div>
      
      <div className="space-y-3">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl">
            <tip.icon size={18} className={tip.color} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{tip.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionsPreview({ collections }) {
  if (!collections?.length) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">Sačuvani kontakti</h3>
        <CustomLink href="/profile/saved" className="text-sm font-semibold text-primary hover:underline">
          Sve →
        </CustomLink>
      </div>
      
      <div className="space-y-2">
        {collections.slice(0, 3).map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm">{c.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{c.items_count || 0} kontakata</div>
            </div>
            <Bookmark size={16} className="text-slate-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function SellerDashboardPage() {
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

  const fetchAll = useCallback(async () => {
    if (!userData) return;
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        membershipApi.getUserMembership({}),
        getNotificationList.getNotification({ page: 1 }),
        getMyItemsApi.getMyItems({ status: "approved", user_id: userData?.id, offset: 0, limit: 1 }),
        getMyReviewsApi.getMyReviews({ page: 1 }),
        sellerSettingsApi.getSettings(),
        Promise.all([chatListApi.chatList({ type: "buyer", page: 1 }), chatListApi.chatList({ type: "seller", page: 1 })]),
        savedCollectionsApi.lists(),
      ]);

      const [membershipRes, notifRes, adsRes, reviewsRes, sellerRes, chatRes, collectionsRes] = results;

      let membershipTier = String(userData?.membership_tier || "free").toLowerCase();
      if (membershipRes.status === "fulfilled") {
        const data = getApiData(membershipRes.value);
        membershipTier = String(data?.tier || data?.membership_tier || membershipTier).toLowerCase();
      }

      let unreadNotifications = 0;
      if (notifRes.status === "fulfilled") {
        const list = extractList(getApiData(notifRes.value));
        unreadNotifications = list.filter((n) => !n?.read_at && !n?.is_read).length;
      }

      let activeAds = 0, totalViews = 0;
      if (adsRes.status === "fulfilled") {
        const payload = getApiData(adsRes.value);
        activeAds = extractTotal(payload) || payload?.total || 0;
        totalViews = extractList(payload).reduce((sum, ad) => sum + (Number(ad?.total_clicks) || 0), 0);
      }

      let reviewCount = 0, ratingFromReviews = null;
      if (reviewsRes.status === "fulfilled") {
        const reviews = extractList(getApiData(reviewsRes.value));
        reviewCount = reviews.length;
        if (reviews.length > 0) {
          const validRatings = reviews.map((r) => toNum(r?.ratings)).filter((n) => n !== null);
          if (validRatings.length) ratingFromReviews = validRatings.reduce((a, b) => a + b, 0) / validRatings.length;
        }
      }

      let unreadMessages = 0;
      if (chatRes.status === "fulfilled") {
        const [buyer, seller] = chatRes.value;
        const all = [...extractList(getApiData(buyer)), ...extractList(getApiData(seller))];
        unreadMessages = all.filter((c) => c?.unseen_messages_count > 0 || c?.unread_count > 0).length;
      }

      if (sellerRes.status === "fulfilled") setSeller(getApiData(sellerRes.value));

      let collectionsData = [];
      if (collectionsRes.status === "fulfilled") {
        collectionsData = extractList(getApiData(collectionsRes.value));
        setCollections(collectionsData);
      }

      setStats({
        membershipTier,
        activeAds,
        totalViews,
        unreadNotifications,
        unreadMessages,
        rating: ratingFromReviews !== null ? toRating(ratingFromReviews) : toRating(userData?.average_rating),
        savedCount: collectionsData.reduce((sum, c) => sum + (c?.items_count || 0), 0),
        reviewCount,
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Greška pri učitavanju podataka");
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const isPremium = stats.membershipTier === "pro" || stats.membershipTier === "shop";

  if (loading) {
    return (
      <ProfileLayout title="Seller Dashboard">
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 size={48} className="animate-spin text-primary" />
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout 
      title="Seller Dashboard" 
      subtitle={`Dobrodošao nazad, ${userData?.name || "Korisnik"}!`}
      badges={{ messages: stats.unreadMessages, notifications: stats.unreadNotifications }}
    >
      <div className="space-y-8">
        {/* Quick Actions Header */}
        <div className="flex flex-wrap items-center gap-3">
          <CustomLink href="/ad-listing">
            <Button className="gap-2 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 shadow-lg shadow-primary/20 rounded-xl h-12 px-6">
              <PlusCircle size={20} />
              Novi oglas
            </Button>
          </CustomLink>
          <CustomLink href="/profile/seller-settings">
            <Button variant="outline" className="gap-2 rounded-xl h-12 px-6 border-2">
              <Settings size={20} />
              Postavke
            </Button>
          </CustomLink>
        </div>

        {/* Big Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <BigStatCard
            icon={Layers}
            label="Aktivnih oglasa"
            value={formatNum(stats.activeAds)}
            sublabel="Trenutno objavljeno"
            color="from-blue-500 to-indigo-600"
          />
          <BigStatCard
            icon={Eye}
            label="Ukupno pregleda"
            value={formatNum(stats.totalViews)}
            sublabel="Svi aktivni oglasi"
            color="from-purple-500 to-violet-600"
            trend="up"
            trendValue="+12%"
          />
          <BigStatCard
            icon={Star}
            label="Prosječna ocjena"
            value={stats.rating}
            sublabel={`${stats.reviewCount} recenzija`}
            color="from-amber-500 to-orange-600"
          />
          <BigStatCard
            icon={MessageSquare}
            label="Nepročitane poruke"
            value={formatNum(stats.unreadMessages)}
            sublabel="Čekaju odgovor"
            color="from-green-500 to-emerald-600"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Brze akcije</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickActionCard
                  icon={Package}
                  title="Moji oglasi"
                  description="Upravljaj svim objavama"
                  href="/my-ads"
                  badge={stats.activeAds > 0 ? stats.activeAds : null}
                  color="from-blue-500 to-indigo-600"
                />
                <QuickActionCard
                  icon={MessageSquare}
                  title="Poruke"
                  description="Odgovori kupcima"
                  href="/chat"
                  badge={stats.unreadMessages > 0 ? stats.unreadMessages : null}
                  color="from-green-500 to-emerald-600"
                />
                <QuickActionCard
                  icon={Bookmark}
                  title="Sačuvani kontakti"
                  description="Kolekcije i bilješke"
                  href="/profile/saved"
                  color="from-purple-500 to-violet-600"
                />
                <QuickActionCard
                  icon={BarChart3}
                  title="Statistika"
                  description="Detaljni uvid u preformanse"
                  href="/my-ads"
                  color="from-amber-500 to-orange-600"
                />
              </div>
            </div>

            {/* Collections Preview */}
            <CollectionsPreview collections={collections} />
          </div>

          {/* Right 1/3 */}
          <div className="space-y-6">
            <MembershipCard tier={stats.membershipTier} />
            <TipsCard />
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}