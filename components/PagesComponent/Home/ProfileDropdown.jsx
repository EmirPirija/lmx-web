"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useMediaQuery } from "usehooks-ts";
import { getVerificationStatusApi } from "@/utils/api";

import { userSignUpData } from "@/redux/reducer/authSlice";
import { settingsData } from "@/redux/reducer/settingSlice";
import {
  membershipApi,
  getNotificationList,
  getMyItemsApi,
  getMyReviewsApi,
  sellerSettingsApi, // ✅ added
} from "@/utils/api";

import { useNavigate } from "@/components/Common/useNavigate";
import MembershipBadge from "@/components/Common/MembershipBadge";
import { useAdaptiveMobileDock } from "@/components/Layout/AdaptiveMobileDock";
import { PROMO_BENEFITS, PROMO_HEADLINE, PROMO_SUBHEAD, isPromoFreeAccessEnabled } from "@/lib/promoMode";

// ✅ LMX avatar
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";
import { resolveMembership } from "@/lib/membership";
import { resolveVerificationState } from "@/lib/verification";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// Icons
import {
  IdentificationCard,
  Layers,
  Heart,
  UserList,
  CreditCard,
  Receipt,
  BellRinging,
  Headset,
  IoLogOutOutline,
  IoChevronForward,
  IoClose,
  IoAddCircleOutline,
  IoStarOutline,
  Trophy,
  ShieldCheck,
  Store,
  ShoppingBag,
  Medal,
  IoSparklesOutline,
  Search,
  MessageSquare,
  MessageSquareMore,
} from "@/components/Common/UnifiedIconPack";
import { Sparkles, TrendingUp } from "@/components/Common/UnifiedIconPack";
import { MdVerified } from "@/components/Common/UnifiedIconPack";

// ============================================
// HELPERS
// ============================================
const getApiData = (res) => res?.data?.data ?? null;

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toRating = (v) => {
  const n = toNum(v);
  return n === null ? "0.0" : n.toFixed(1);
};

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

// ============================================
// ✅ AVATAR (same logic as Profile.jsx)
// 1) if customAvatarUrl exists -> show <img>
// 2) else -> LMX svg avatar by avatarId
// ============================================
function UserAvatar({
  customAvatarUrl,
  avatarId,
  size = 36,
  className = "",
  ringClassName = "border-2 border-slate-200",
  showVerified,
  verifiedSize = 10,
  showNotifBadge,
  notifCount = 0,
}) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = Boolean(customAvatarUrl) && !imgErr;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className={[
          "w-full h-full rounded-full overflow-hidden relative bg-gray-100 shadow-sm",
          ringClassName,
          className,
        ].join(" ")}
      >
        {showImg ? (
          <img
            src={customAvatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full bg-white flex items-center justify-center text-primary">
            <LmxAvatarSvg avatarId={avatarId || "lmx-01"} className="w-2/3 h-2/3" />
          </div>
        )}
      </div>

      {showVerified === true && (
        <div
          className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white"
          style={{ width: Math.max(14, Math.round(size * 0.33)), height: Math.max(14, Math.round(size * 0.33)) }}
        >
          <MdVerified className="text-white" size={verifiedSize} />
        </div>
      )}

      {showNotifBadge && notifCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
          {notifCount > 9 ? "9+" : notifCount}
        </span>
      )}
    </div>
  );
}

// ============================================
// MENU ITEM
// ============================================
const MenuItem = ({
  icon: Icon,
  label,
  href,
  onClick,
  badge,
  isNew,
  external,
  danger,
  description,
}) => {
  const content = (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
          : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-white"
      }`}
      title={description || label}
      aria-label={description || label}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
          danger
            ? "bg-red-50 group-hover:bg-red-100 dark:bg-red-500/10 dark:group-hover:bg-red-500/20"
            : "bg-slate-100 group-hover:bg-slate-200/70 dark:bg-slate-800 dark:group-hover:bg-slate-700"
        }`}
      >
        <Icon
          size={18}
          className={danger ? "text-red-500 dark:text-red-300" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"}
        />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block">{label}</span>
        {description && <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">{description}</span>}
      </div>

      {typeof badge === "number" && badge > 0 && (
        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] text-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {isNew && (
        <span className="px-1.5 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[9px] font-bold rounded uppercase tracking-wide shadow-sm shadow-emerald-500/30">
          Novo
        </span>
      )}

      {external && <IoChevronForward size={14} className="text-slate-300" />}
    </div>
  );

  if (href && !onClick) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
};

const MenuSection = ({ title, children }) => (
  <div className="py-1.5">
    {title && (
      <p className="px-3 py-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
        {title}
      </p>
    )}
    <div className="space-y-0.5">{children}</div>
  </div>
);

const MenuDivider = () => <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3 my-1" />;

// ============================================
// QUICK STAT ITEM
// ============================================
const QuickStat = ({ icon: Icon, value, label, color = "blue" }) => {
  const colors = {
    blue: "text-blue-500 bg-blue-50 dark:text-blue-300 dark:bg-blue-500/15",
    green: "text-green-500 bg-green-50 dark:text-green-300 dark:bg-green-500/15",
    amber: "text-amber-500 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/15",
    purple: "text-purple-500 bg-purple-50 dark:text-purple-300 dark:bg-purple-500/15",
  };

  return (
    <div className="flex flex-col items-center gap-1 p-2" title={label} aria-label={label}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{value}</span>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{label}</span>
    </div>
  );
};

// ============================================
// GLAVNA KOMPONENTA
// ============================================
const ProfileDropdown = ({ IsLogout, setIsLogout, dockOpenMode = "staged" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dockPhase, setDockPhase] = useState("idle");
  const { navigate } = useNavigate();
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const mobileDock = useAdaptiveMobileDock();
  const setDockSuspended = mobileDock?.setSuspended;
  const clearDockSuspended = mobileDock?.clearSuspended;
  const transitionTimersRef = useRef({ open: null, close: null });
  const lastStatsFetchRef = useRef(0);
  const dockSuspendKey = "profile-dropdown-sheet";
  const isInstantDockOpen = dockOpenMode === "instant";
  const DOCK_HIDE_BEFORE_OPEN_MS = isInstantDockOpen ? 0 : 120;
  const DOCK_SHOW_AFTER_CLOSE_MS = isInstantDockOpen ? 120 : 180;
  const PROFILE_DROPDOWN_FETCH_COOLDOWN_MS = 15000;

  const userData = useSelector(userSignUpData);
  const settings = useSelector(settingsData);
  const placeholderImage = settings?.placeholder_image;

  const [sellerAvatarId, setSellerAvatarId] = useState("lmx-01");

  

  const [userStats, setUserStats] = useState({
    activeAds: 0,
    totalViews: 0,
    unreadNotifications: 0,
    rating: "0.0",
    membershipTier: "free",
    isVerified: false,
    verificationStatus: "not-applied",
  });

  // ✅ same logic: if profile is placeholder -> treat as no custom image
  const customAvatarUrl = useMemo(() => {
    const p = userData?.profile || "";
    if (!p) return "";
    if (placeholderImage && p === placeholderImage) return "";
    return p;
  }, [userData?.profile, placeholderImage]);

  // ✅ fetch seller avatar id for LMX fallback
  const getSellerSettings = useCallback(async () => {
    try {
      const res = await sellerSettingsApi.getSettings();
      if (res?.data?.error === false && res?.data?.data) {
        setSellerAvatarId(res.data.data.avatar_id || "lmx-01");
      }
    } catch (e) {
      // silent fallback
    }
  }, []);

  const clearTransitionTimers = useCallback(() => {
    if (transitionTimersRef.current.open) {
      window.clearTimeout(transitionTimersRef.current.open);
      transitionTimersRef.current.open = null;
    }
    if (transitionTimersRef.current.close) {
      window.clearTimeout(transitionTimersRef.current.close);
      transitionTimersRef.current.close = null;
    }
  }, []);

  const closeAndRestoreDockImmediately = useCallback(() => {
    clearTransitionTimers();
    setIsOpen(false);
    setDockPhase("idle");
    clearDockSuspended?.(dockSuspendKey);
  }, [clearTransitionTimers, clearDockSuspended]);

  const handleNavigate = useCallback(
    (path) => {
      closeAndRestoreDockImmediately();
      navigate(path);
    },
    [closeAndRestoreDockImmediately, navigate]
  );

  const handleLogout = useCallback(() => {
    closeAndRestoreDockImmediately();
    setIsLogout(true);
  }, [closeAndRestoreDockImmediately, setIsLogout]);

  const resolvedMembership = useMemo(
    () => resolveMembership({ tier: userStats.membershipTier }),
    [userStats.membershipTier]
  );
  const isShop = resolvedMembership.isShop;
  const isPremium = resolvedMembership.isPremium;
  const promoEnabled = isPromoFreeAccessEnabled();

  const fetchAllData = useCallback(async ({ force = false } = {}) => {
    if (!userData) return;
    const now = Date.now();
    if (!force && now - lastStatsFetchRef.current < PROFILE_DROPDOWN_FETCH_COOLDOWN_MS) {
      return;
    }
    lastStatsFetchRef.current = now;

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
        getVerificationStatusApi.getVerificationStatus(),
      ]);

      const [membershipRes, notifRes, adsRes, reviewsRes, verificationRes] = results;

      let membershipTier = resolveMembership(userData).tier;
      if (membershipRes.status === "fulfilled") {
        const membershipData = getApiData(membershipRes.value);
        membershipTier = resolveMembership(userData, membershipData).tier;
      }

      let unreadNotifications = 0;
      if (notifRes.status === "fulfilled") {
        const payload = getApiData(notifRes.value);
        const list = extractList(payload);
        unreadNotifications = list.filter((n) => !n?.read_at && !n?.is_read).length;
      }

      let activeAds = 0;
      if (adsRes.status === "fulfilled") {
        const payload = getApiData(adsRes.value);
        activeAds = extractTotal(payload) || payload?.total || 0;
      }

      let ratingFromReviews = null;
      if (reviewsRes?.status === "fulfilled") {
        const payload = getApiData(reviewsRes.value);
        ratingFromReviews = toNum(payload?.average_rating);
      }

      const ratingFallback =
        toNum(userData?.average_rating) ??
        toNum(userData?.avg_rating) ??
        toNum(userData?.rating);

      const rating = toRating(ratingFromReviews ?? ratingFallback);
      const verificationPayload = verificationRes?.status === "fulfilled" ? verificationRes.value : null;

      setUserStats((prev) => {
        const { verificationStatus, isVerified } = resolveVerificationState({
          verificationResponse: verificationPayload,
          userData,
          previousStatus: prev.verificationStatus,
        });

        return {
          activeAds,
          totalViews: userData?.total_views || userData?.profile_views || 0,
          unreadNotifications,
          rating,
          membershipTier: String(membershipTier).toLowerCase(),
          isVerified,
          verificationStatus,
        };
      });
    } catch (e) {
      console.error("Error fetching user stats:", e);
    }
  }, [userData, PROFILE_DROPDOWN_FETCH_COOLDOWN_MS]);

  useEffect(() => {
    if (!userData) return;
    fetchAllData({ force: true });
    getSellerSettings();
  }, [userData, fetchAllData, getSellerSettings]);

  const handleOpenChange = useCallback(
    (nextOpen) => {
      if (!isMobile) {
        setIsOpen(nextOpen);
        return;
      }

      clearTransitionTimers();

      if (nextOpen) {
        if (dockPhase === "opening" || isOpen) return;
        setDockSuspended?.(dockSuspendKey, true, { keepNavOpen: true });

        if (DOCK_HIDE_BEFORE_OPEN_MS <= 0) {
          setIsOpen(true);
          setDockPhase("idle");
          return;
        }

        setDockPhase("opening");
        transitionTimersRef.current.open = window.setTimeout(() => {
          setIsOpen(true);
          setDockPhase("idle");
          transitionTimersRef.current.open = null;
        }, DOCK_HIDE_BEFORE_OPEN_MS);
        return;
      }

      if (!isOpen && dockPhase !== "opening") {
        setDockPhase("idle");
        clearDockSuspended?.(dockSuspendKey);
        return;
      }

      setIsOpen(false);
      setDockPhase("closing");
      mobileDock?.closeNav?.();
      transitionTimersRef.current.close = window.setTimeout(() => {
        clearDockSuspended?.(dockSuspendKey);
        setDockPhase("idle");
        transitionTimersRef.current.close = null;
      }, DOCK_SHOW_AFTER_CLOSE_MS);
    },
    [
      isMobile,
      clearTransitionTimers,
      setDockSuspended,
      clearDockSuspended,
      dockPhase,
      isOpen,
      DOCK_HIDE_BEFORE_OPEN_MS,
      DOCK_SHOW_AFTER_CLOSE_MS,
      mobileDock,
    ]
  );

  useEffect(() => {
    return () => {
      clearTransitionTimers();
      clearDockSuspended?.(dockSuspendKey);
    };
  }, [clearTransitionTimers, clearDockSuspended]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) return;

    const openDialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
    if (openDialogs.length === 0 && document.body.style.overflow === "hidden") {
      document.body.style.overflow = "";
    }
  }, [isOpen, dockPhase]);

  useEffect(() => {
    if (!isOpen) return;
    fetchAllData();
    // (optional) refresh avatar id when opening
    getSellerSettings();
  }, [isOpen, fetchAllData, getSellerSettings]);

  useEffect(() => {
    if (!userData) return;

    const handleRealtimeRefresh = (event) => {
      const detail = event?.detail;
      if (!detail) return;
      if (detail?.category === "notification" || detail?.category === "system" || detail?.category === "chat") {
        fetchAllData();
      }
    };

    window.addEventListener("lmx:realtime-event", handleRealtimeRefresh);
    return () => window.removeEventListener("lmx:realtime-event", handleRealtimeRefresh);
  }, [userData, fetchAllData]);

  const renderTriggerButton = useCallback(
    (props = {}) => (
      <button
        className={`relative flex touch-manipulation items-center justify-center rounded-full border border-slate-200/80 bg-white/80 p-1 transition-all duration-200 hover:scale-105 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/75 dark:hover:bg-slate-800 ${
          dockPhase === "opening" ? "pointer-events-none opacity-80" : ""
        }`}
        aria-haspopup={isMobile ? "dialog" : "menu"}
        aria-expanded={isOpen}
        aria-label="Otvori korisnički meni"
        disabled={dockPhase === "opening"}
        type="button"
        {...props}
      >
        <UserAvatar
          customAvatarUrl={customAvatarUrl}
          avatarId={sellerAvatarId}
          size={36}
          ringClassName="border-2 border-slate-200 hover:border-primary/50 transition-colors"
          showVerified={userStats.isVerified}
          verifiedSize={10}
          showNotifBadge={true}
          notifCount={userStats.unreadNotifications}
        />
      </button>
    ),
    [
      dockPhase,
      isMobile,
      isOpen,
      customAvatarUrl,
      sellerAvatarId,
      userStats.isVerified,
      userStats.unreadNotifications,
    ]
  );

  const handleTriggerClick = useCallback(
    (event) => {
      if (dockPhase === "opening") return;
      event.stopPropagation();
      handleOpenChange(true);
    },
    [handleOpenChange, dockPhase]
  );

  const preventSheetAutoFocusScroll = useCallback((event) => {
    event.preventDefault();
  }, []);

  const MenuPanel = (
    <div className="flex h-full flex-col overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
      {/* HEADER */}
      <div className="sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/90">
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Moj racun
          </p>
          {isMobile && (
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Zatvori meni"
            >
              <IoClose size={18} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 px-4 pb-3">
          <UserAvatar
            customAvatarUrl={customAvatarUrl}
            avatarId={sellerAvatarId}
            size={48}
            ringClassName="border-2 border-white dark:border-slate-700"
            showVerified={userStats.isVerified}
            verifiedSize={12}
            showNotifBadge={false}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                {userData?.name || "Korisnik"}
              </p>
              <MembershipBadge tier={userStats.membershipTier} size="xs" uppercase={false} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">{userData?.email}</p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div
        className={[
          "overflow-y-auto overscroll-contain scrollbar-lmx pb-[max(env(safe-area-inset-bottom),0.75rem)]",
          isMobile ? "max-h-[calc(100dvh-92px)]" : "max-h-[min(520px,70vh)]",
        ].join(" ")}
      >
        {/* QUICK STATS */}
        <div className="px-4 py-3 bg-gradient-to-br from-slate-50/70 to-white dark:from-slate-900/70 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-900 rounded-xl p-2 border border-slate-100 dark:border-slate-700">
            <QuickStat icon={Layers} value={userStats.activeAds} label="Oglasi" color="blue" />
            <QuickStat icon={BellRinging} value={userStats.unreadNotifications} label="Obavijesti" color="amber" />
            <QuickStat icon={IoStarOutline} value={userStats.rating} label="Ocjena" color="purple" />
          </div>
        </div>

        {/* PRIMARY ACTION */}
        <div className="px-4 py-3">
          <Link
            href="/ad-listing"
            onClick={() => closeAndRestoreDockImmediately()}
            className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-semibold hover:scale-[1.01] transition-all duration-200 w-full group shadow-sm shadow-primary/20"
          >
            <IoAddCircleOutline size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            {"Dodaj oglas"}
          </Link>
        </div>

        {/* MENU SECTIONS */}
        <div className="px-2 pb-3">
          <MenuSection title="Račun">
            <MenuItem
              icon={IdentificationCard}
              label={"Moj profil"}
              description="Uredi podatke i postavke"
              onClick={() => handleNavigate("/profile")}
            />
            {!userStats.isVerified && (
              <MenuItem
                icon={ShieldCheck}
                label="Verifikacija"
                description="Potvrdi svoj identitet"
                onClick={() => handleNavigate("/user-verification")}
                isNew
              />
            )}
            <MenuItem
              icon={Store}
              label="Postavke prodavača"
              description="Prilagodi svoj profil prodavača"
              onClick={() => handleNavigate("/profile/seller-settings")}
            />
          </MenuSection>

          <MenuDivider />

          <MenuSection title="Moji sadržaji">
            <MenuItem
              icon={Layers}
              label={"Moji oglasi"}
              description={`${userStats.activeAds} aktivnih oglasa`}
              onClick={() => handleNavigate("/my-ads")}
            />
            <MenuItem
              icon={Heart}
              label={"Spašeni oglasi"}
              description="Sačuvani oglasi"
              onClick={() => handleNavigate("/favorites")}
            />
            <MenuItem
              icon={UserList}
              label={"Sačuvani prodavači"}
              description="Kolekcije, bilješke i obavijesti"
              onClick={() => handleNavigate("/profile/saved")}
            />
            <MenuItem
              icon={Search}
              label="Spašene pretrage"
              description="Brze prečice do tvojih filtera"
              onClick={() => handleNavigate("/profile/saved-searches")}
            />
            <MenuItem
              icon={ShoppingBag}
              label="Moje kupovine"
              description="Historija kupovina"
              onClick={() => handleNavigate("/purchases")}
            />
          </MenuSection>

          <MenuDivider />

          <MenuSection title="Komunikacija">
            <MenuItem
              icon={MessageSquare}
              label="Poruke"
              description="Chat sa kupcima i prodavačima"
              onClick={() => handleNavigate("/chat")}
            />
            <MenuItem
              icon={BellRinging}
              label={"Notifikacije"}
              description="Sve obavijesti na jednom mjestu"
              onClick={() => handleNavigate("/notifications")}
              badge={userStats.unreadNotifications}
            />
            <MenuItem
              icon={MessageSquareMore}
              label="Javna pitanja"
              description="Pitanja na vašim oglasima"
              onClick={() => handleNavigate("/profile/public-questions")}
            />
          </MenuSection>

          <MenuDivider />

          {/* <MenuSection title="Finansije">
            <MenuItem
              icon={CreditCard}
              label={"Planovi i pristup"}
              description="Promotivni režim i pregled planova"
              onClick={() => handleNavigate("/user-subscription")}
            />
            <MenuItem
              icon={Receipt}
              label={"Transakcije"}
              description="Historija transakcija"
              onClick={() => handleNavigate("/transactions")}
            />
          </MenuSection> */}

          <MenuDivider />
{/* 
          <MenuSection title="Zajednica">
            <MenuItem icon={IoStarOutline} label={"Ocjene"} description="Recenzije i ocjene" onClick={() => handleNavigate("/reviews")} />
            <MenuItem icon={Medal} label="Bedževi" description="Tvoja postignuća" onClick={() => handleNavigate("/profile/badges")} />
            <MenuItem icon={Trophy} label="Ljestvica" description="Rangiranje korisnika" onClick={() => handleNavigate("/leaderboard")} />
          </MenuSection> */}

          <MenuDivider />

          <MenuSection title="Podrška">
            <MenuItem icon={Headset} label={"Kontakt"} description="Kontaktiraj podršku" onClick={() => handleNavigate("/contact-us")} />
          </MenuSection>

          <MenuDivider />

          <MenuSection>
            <MenuItem icon={IoLogOutOutline} label={"Odjava"} description="Odjavi se sa računa" onClick={handleLogout} danger />
          </MenuSection>
        </div>

        {promoEnabled ? (
          <div className="p-4 bg-gradient-to-r from-emerald-50 via-cyan-50 to-white border-t border-emerald-100/70 dark:from-emerald-500/10 dark:via-cyan-500/10 dark:to-slate-900 dark:border-emerald-500/20">
            <Link
              href="/membership/upgrade"
              onClick={() => closeAndRestoreDockImmediately()}
              className="flex items-center gap-4 p-3 bg-white/90 dark:bg-slate-900/85 backdrop-blur-sm rounded-xl border border-emerald-200/70 dark:border-emerald-400/30 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <Sparkles className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">Promotivni Free Access</h5>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{PROMO_HEADLINE}</p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{PROMO_SUBHEAD}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {PROMO_BENEFITS.map((benefit) => (
                    <span
                      key={benefit}
                      className="rounded-full border border-emerald-300/80 bg-emerald-50/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-200"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </div>
        ) : null}

        {/* UPGRADE BANNER */}
        {!promoEnabled && userStats.membershipTier === "free" && (
          <div className="p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-t border-amber-100/50 dark:from-amber-500/10 dark:via-amber-400/10 dark:to-orange-500/10 dark:border-amber-500/20">
            <Link
              href="/membership/upgrade"
              onClick={() => closeAndRestoreDockImmediately()}
              className="flex items-center gap-4 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-amber-200/60 dark:border-amber-400/30 hover:border-amber-300 dark:hover:border-amber-300/50 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  Nadogradi na Pro
                  <TrendingUp size={14} className="text-amber-500" />
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300">Otključaj sve mogućnosti i prednosti</p>
              </div>
              <IoChevronForward className="text-amber-400 group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </div>
        )}

        {/* PRO USER BANNER */}
        {!promoEnabled && isPremium && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100/50 dark:from-blue-500/10 dark:to-indigo-500/10 dark:border-blue-500/20">
            <div className="flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-400/30">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <IoSparklesOutline className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <div className="mb-1">
                  <MembershipBadge
                    tier={isShop ? "shop" : "pro"}
                    size="xs"
                    uppercase
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Uživaj u svim premium pogodnostima</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================
  // RESPONSIVE WRAPPER
  // ============================================
  if (isMobile) {
    return (
      <div className="relative">
        {renderTriggerButton({ onClick: handleTriggerClick })}
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetContent
            side="bottom"
            onOpenAutoFocus={preventSheetAutoFocusScroll}
            onCloseAutoFocus={preventSheetAutoFocusScroll}
            className="z-[96] h-[calc(100dvh-0.75rem)] max-h-[calc(100dvh-0.75rem)] p-0 overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-transparent shadow-2xl dark:border-slate-700 [&>button]:hidden"
          >
            {MenuPanel}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          className={`relative flex touch-manipulation items-center justify-center rounded-full border border-slate-200/80 bg-white/80 p-1 transition-all duration-200 hover:scale-105 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/75 dark:hover:bg-slate-800 ${
            dockPhase === "opening" ? "pointer-events-none opacity-80" : ""
          }`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Otvori korisnički meni"
          disabled={dockPhase === "opening"}
          type="button"
        >
          <UserAvatar
            customAvatarUrl={customAvatarUrl}
            avatarId={sellerAvatarId}
            size={36}
            ringClassName="border-2 border-slate-200 hover:border-primary/50 transition-colors"
            showVerified={userStats.isVerified}
            verifiedSize={10}
            showNotifBadge={true}
            notifCount={userStats.unreadNotifications}
          />
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={10} className="w-[420px] sm:w-[440px] p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent shadow-2xl shadow-slate-900/15 dark:shadow-black/40">
          {MenuPanel}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProfileDropdown;
