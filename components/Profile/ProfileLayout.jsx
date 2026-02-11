"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";

import { userSignUpData } from "@/redux/reducer/authSlice";
import { settingsData } from "@/redux/reducer/settingSlice";
import {
  membershipApi,
  getNotificationList,
  getMyItemsApi,
  getMyReviewsApi,
  sellerSettingsApi,
} from "@/utils/api";

import MembershipBadge from "@/components/Common/MembershipBadge";
import CustomLink from "@/components/Common/CustomLink";
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";
import { resolveMembership } from "@/lib/membership";
import { cn } from "@/lib/utils";
import {
  getProfileNavigationSections,
  isProfileNavItemActive,
} from "@/components/Profile/profileNavConfig";

import {
  IoLayersOutline,
  IoNotificationsOutline,
  IoLogOutOutline,
  IoChevronForward,
  IoAddCircleOutline,
  IoStarOutline,
  IoSearchOutline,
  IoMenuOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { Crown } from "lucide-react";
import { MdVerified } from "react-icons/md";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
// USER AVATAR (isti stil kao ProfileDropdown)
// ============================================
function UserAvatar({
  customAvatarUrl,
  avatarId,
  size = 36,
  className = "",
  ringClassName = "border-2 border-slate-200",
  showVerified,
  verifiedSize = 10,
}) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = Boolean(customAvatarUrl) && !imgErr;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className={cn(
          "w-full h-full rounded-full overflow-hidden relative bg-gray-100 shadow-sm",
          ringClassName,
          className
        )}
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

      {showVerified && (
        <div
          className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white"
          style={{ width: Math.max(14, Math.round(size * 0.33)), height: Math.max(14, Math.round(size * 0.33)) }}
        >
          <MdVerified className="text-white" size={verifiedSize} />
        </div>
      )}
    </div>
  );
}

// ============================================
// MENU ITEM (isti stil kao ProfileDropdown)
// ============================================
const MenuItem = ({
  icon: Icon,
  label,
  href,
  onClick,
  badge,
  isNew,
  isActive,
  description,
  danger,
}) => {
  const content = (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          : isActive
          ? "bg-primary/10 text-primary dark:bg-primary/20"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
          danger
            ? "bg-red-50 group-hover:bg-red-100 dark:bg-red-500/10 dark:group-hover:bg-red-500/20"
            : isActive
            ? "bg-primary/10 dark:bg-primary/20"
            : "bg-slate-100 group-hover:bg-slate-200/70 dark:bg-slate-800 dark:group-hover:bg-slate-700"
        )}
      >
        <Icon
          size={18}
          className={cn(
            danger
              ? "text-red-500 dark:text-red-400"
              : isActive
              ? "text-primary"
              : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <span className={cn("text-sm font-medium block", isActive && "font-semibold")}>{label}</span>
        {description && (
          <span className="block truncate text-[11px] text-slate-400 dark:text-slate-500">{description}</span>
        )}
      </div>

      {typeof badge === "number" && badge > 0 && (
        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] text-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {isNew && (
        <span className="px-1.5 py-0.5 bg-primary text-white text-[9px] font-bold rounded uppercase tracking-wide">
          Novo
        </span>
      )}
    </div>
  );

  if (href && !onClick) {
    return (
      <CustomLink href={href} className="block">
        {content}
      </CustomLink>
    );
  }

  return content;
};

const MenuSection = ({ title, children }) => (
  <div className="py-1.5">
    {title && (
      <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {title}
      </p>
    )}
    <div className="space-y-0.5">{children}</div>
  </div>
);

const MenuDivider = () => <div className="mx-3 my-1 h-px bg-slate-100 dark:bg-slate-800" />;

// ============================================
// QUICK STAT (isti stil kao ProfileDropdown)
// ============================================
const QuickStat = ({ icon: Icon, value, label, color = "primary" }) => {
  const colors = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary/10",
    accent: "text-accent bg-accent/10",
  };

  return (
    <div className="flex flex-col items-center gap-1 p-2">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors[color])}>
        <Icon size={16} />
      </div>
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{value}</span>
      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{label}</span>
    </div>
  );
};

// ============================================
// SIDEBAR COMPONENT (isti stil kao ProfileDropdown MenuPanel)
// ============================================
const ProfileSidebar = ({
  userData,
  customAvatarUrl,
  sellerAvatarId,
  userStats,
  navigationSections,
  pathname,
  handleLogout,
  onClose,
  isMobile = false,
}) => {
  const resolvedMembership = useMemo(
    () => resolveMembership({ tier: userStats.membershipTier }),
    [userStats.membershipTier]
  );
  const isPro = resolvedMembership.isPro;
  const isShop = resolvedMembership.isShop;
  const isPremium = resolvedMembership.isPremium;
  const [menuQuery, setMenuQuery] = useState("");

  const normalizedQuery = menuQuery.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    if (!normalizedQuery) {
      return navigationSections;
    }

    return navigationSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const haystack = `${item.label || ""} ${item.description || ""}`.toLowerCase();
          return haystack.includes(normalizedQuery);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [navigationSections, normalizedQuery]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur">
      {/* HEADER */}
      <div className="sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/90 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <UserAvatar
              customAvatarUrl={customAvatarUrl}
              avatarId={sellerAvatarId}
              size={48}
              ringClassName="border-2 border-white shadow-sm dark:border-slate-700"
              showVerified={userStats.isVerified}
              verifiedSize={12}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-[150px]">
                  {userData?.name || "Korisnik"}
                </p>
                <MembershipBadge tier={userStats.membershipTier} size="xs" uppercase={false} />
              </div>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{userData?.email}</p>
            </div>
          </div>

          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <IoCloseOutline size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-lmx">
        {/* QUICK STATS */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-100 bg-white p-2 dark:border-slate-700 dark:bg-slate-900/95">
            <QuickStat icon={IoLayersOutline} value={userStats.activeAds} label="Oglasi" color="primary" />
            <QuickStat
              icon={IoNotificationsOutline}
              value={userStats.unreadNotifications}
              label="Obavijesti"
              color="secondary"
            />
            <QuickStat icon={IoStarOutline} value={userStats.rating} label="Ocjena" color="accent" />
          </div>

          <div className="mt-2.5 relative">
            <IoSearchOutline
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              value={menuQuery}
              onChange={(e) => setMenuQuery(e.target.value)}
              placeholder="Pretrazi meni..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {menuQuery ? (
              <button
                type="button"
                onClick={() => setMenuQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Ocisti pretragu"
              >
                <IoCloseOutline size={14} />
              </button>
            ) : null}
          </div>
        </div>

        {/* PRIMARY ACTION */}
        <div className="px-4 py-3">
          <CustomLink
            href="/ad-listing"
            onClick={onClose}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition-all duration-200 hover:bg-primary/90"
          >
            <IoAddCircleOutline size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Dodaj oglas
          </CustomLink>
        </div>

        {/* MENU SECTIONS */}
        <div className="px-2 pb-2">
          {filteredSections.map((section, index) => (
            <div key={section.title}>
              <MenuSection title={section.title}>
                {section.items.map((item) => (
                  <MenuItem
                    key={item.href || item.label}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    href={item.href}
                    onClick={item.onClick ? () => { item.onClick(); onClose?.(); } : onClose}
                    isActive={isProfileNavItemActive(pathname, item)}
                    badge={item.badge}
                    isNew={item.isNew}
                    danger={item.danger}
                  />
                ))}
              </MenuSection>
              {index < filteredSections.length - 1 && <MenuDivider />}
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Nema rezultata za "{menuQuery}".
            </div>
          )}

          <MenuDivider />

          <MenuSection>
            <MenuItem
              icon={IoLogOutOutline}
              label="Odjava"
              description="Odjavi se sa računa"
              onClick={() => {
                handleLogout();
                onClose?.();
              }}
              danger
            />
          </MenuSection>
        </div>

        {/* UPGRADE BANNER (za free korisnike) */}
        {userStats.membershipTier === "free" && (
          <div className="border-t border-primary/10 bg-primary/5 p-4 dark:border-primary/25 dark:bg-primary/10">
            <CustomLink
              href="/membership/upgrade"
              onClick={onClose}
              className="group flex items-center gap-4 rounded-xl border border-primary/20 bg-white p-3 transition-all duration-200 hover:border-primary/40 dark:border-primary/30 dark:bg-slate-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary transition-transform duration-200 group-hover:scale-110">
                <Crown className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Nadogradi na Pro
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400">Otključaj sve mogućnosti</p>
              </div>
              <IoChevronForward className="text-primary group-hover:translate-x-1 transition-transform" size={20} />
            </CustomLink>
          </div>
        )}

        {/* PRO USER BANNER */}
        {isPremium && (
          <div className="border-t border-primary/10 bg-primary/5 p-4 dark:border-primary/25 dark:bg-primary/10">
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-white p-3 dark:border-primary/30 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Crown className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {isShop ? "Shop" : "Pro"} član
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400">Uživaj u svim premium pogodnostima</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN PROFILE LAYOUT COMPONENT
// ============================================
const ProfileLayout = ({ children, IsLogout, setIsLogout }) => {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const userData = useSelector(userSignUpData);
  const settings = useSelector(settingsData);
  const placeholderImage = settings?.placeholder_image;

  const [sellerAvatarId, setSellerAvatarId] = useState("lmx-01");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [userStats, setUserStats] = useState({
    activeAds: 0,
    totalViews: 0,
    unreadNotifications: 0,
    unreadMessages: 0,
    rating: "0.0",
    membershipTier: "free",
    isVerified: false,
  });

  // Custom avatar URL
  const customAvatarUrl = useMemo(() => {
    const p = userData?.profile || "";
    if (!p) return "";
    if (placeholderImage && p === placeholderImage) return "";
    return p;
  }, [userData?.profile, placeholderImage]);

  // Fetch seller avatar id
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

  const handleLogout = useCallback(() => {
    setMobileMenuOpen(false);
    if (setIsLogout) {
      setIsLogout(true);
    }
  }, [setIsLogout]);

  const fetchAllData = useCallback(async () => {
    if (!userData) return;

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
      ]);

      const [membershipRes, notifRes, adsRes, reviewsRes] = results;

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
      const isVerified = userData?.is_verified === 1 || userData?.verified === true;

      setUserStats({
        activeAds,
        totalViews: userData?.total_views || userData?.profile_views || 0,
        unreadNotifications,
        unreadMessages: userData?.unread_messages || 0,
        rating,
        membershipTier: String(membershipTier).toLowerCase(),
        isVerified,
      });
    } catch (e) {
      console.error("Error fetching user stats:", e);
    }
  }, [userData]);

  useEffect(() => {
    if (!userData) return;
    fetchAllData();
    getSellerSettings();
  }, [userData, fetchAllData, getSellerSettings]);

  useEffect(() => {
    if (!userData) return;

    const handleRealtimeRefresh = (event) => {
      const detail = event?.detail;
      if (!detail) return;
      if (detail?.category === "notification" || detail?.category === "chat" || detail?.category === "system") {
        fetchAllData();
      }
    };

    window.addEventListener("lmx:realtime-event", handleRealtimeRefresh);
    return () => window.removeEventListener("lmx:realtime-event", handleRealtimeRefresh);
  }, [userData, fetchAllData]);

  // Navigation config
  const navigationSections = useMemo(
    () =>
      getProfileNavigationSections({
        isVerified: userStats.isVerified,
        activeAds: userStats.activeAds,
        unreadNotifications: userStats.unreadNotifications,
        unreadMessages: userStats.unreadMessages,
      }),
    [userStats]
  );

  // Mobile sidebar (Sheet kao ProfileDropdown)
  const MobileSidebar = (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Otvori meni"
        >
          <IoMenuOutline size={20} className="text-slate-600 dark:text-slate-300" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Meni</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] max-w-[85vw] p-0">
        <ProfileSidebar
          userData={userData}
          customAvatarUrl={customAvatarUrl}
          sellerAvatarId={sellerAvatarId}
          userStats={userStats}
          navigationSections={navigationSections}
          pathname={pathname}
          handleLogout={handleLogout}
          onClose={() => setMobileMenuOpen(false)}
          isMobile={true}
        />
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="profile-shell min-h-screen bg-[var(--background)]">
      <div className="container relative mx-auto px-4 py-6 lg:px-6 lg:py-8">
        <div className="pointer-events-none absolute -top-10 left-2 h-44 w-44 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
        <div className="pointer-events-none absolute right-2 top-20 h-40 w-40 rounded-full bg-secondary/10 blur-3xl dark:bg-secondary/20" />

        {/* Mobile Header */}
        <div className="mb-4 lg:hidden">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center justify-between gap-4">
              {MobileSidebar}
              <CustomLink
                href="/ad-listing"
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                <IoAddCircleOutline size={18} />
                <span className="hidden sm:inline">Dodaj</span>
              </CustomLink>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="lg:grid lg:grid-cols-[minmax(300px,336px)_1fr] lg:gap-6">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <ProfileSidebar
                  userData={userData}
                  customAvatarUrl={customAvatarUrl}
                  sellerAvatarId={sellerAvatarId}
                  userStats={userStats}
                  navigationSections={navigationSections}
                  pathname={pathname}
                  handleLogout={handleLogout}
                  isMobile={false}
                />
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/85">
              <div className="p-4 sm:p-6">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
