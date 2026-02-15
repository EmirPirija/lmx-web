"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { logoutSuccess, userSignUpData } from "@/redux/reducer/authSlice";
import { settingsData } from "@/redux/reducer/settingSlice";
import {
  membershipApi,
  getNotificationList,
  getMyItemsApi,
  getMyReviewsApi,
  getVerificationStatusApi,
  logoutApi,
  sellerSettingsApi,
} from "@/utils/api";

import MembershipBadge from "@/components/Common/MembershipBadge";
import CustomLink from "@/components/Common/CustomLink";
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";
import { useNavigate } from "@/components/Common/useNavigate";
import FirebaseData from "@/utils/Firebase";
import { resolveMembership } from "@/lib/membership";
import { resolveVerificationState } from "@/lib/verification";
import { cn } from "@/lib/utils";
import { toast } from "@/utils/toastBs";
import { SOCIAL_POSTING_TEMP_UNAVAILABLE } from "@/utils/socialAvailability";
import { PROMO_BENEFITS, PROMO_HEADLINE, isPromoFreeAccessEnabled } from "@/lib/promoMode";
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
} from "@/components/Common/UnifiedIconPack";
import { Crown } from "@/components/Common/UnifiedIconPack";
import { MdVerified } from "@/components/Common/UnifiedIconPack";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

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

const PROFILE_CONTEXT_COPY = {
  "/profile": {
    title: "Moj profil",
    description: "Uredi lične podatke, kontakt i osnovne informacije računa.",
  },
  "/profile/seller-settings": {
    title: "Postavke prodavača",
    description: "Podešavanja javnog profila prodavača i prikaza na oglasima.",
  },
  "/profile/integrations": {
    title: "Integracije",
    description: SOCIAL_POSTING_TEMP_UNAVAILABLE
      ? "Instagram/Facebook/TikTok objave su privremeno nedostupne."
      : "Instagram povezivanje, sinhronizacija i zakazane objave.",
  },
  "/profile/shop-ops": {
    title: "Shop operacije",
    description: "Zalihe, custom domena i operativna kontrola shopa.",
  },
  "/profile/gamification": {
    title: "Gamifikacija",
    description: "Privremeno nedostupno.",
  },
  "/profile/badges": {
    title: "Bedževi",
    description: "Privremeno nedostupno.",
  },
  "/leaderboard": {
    title: "Ljestvica",
    description: "Privremeno nedostupno.",
  },
  "/my-ads": {
    title: "Moji oglasi",
    description: "Prati stanje oglasa i brzo reaguj na upite kupaca.",
  },
  "/notifications": {
    title: "Obavijesti",
    description: "Sve nove aktivnosti na jednom mjestu, bez propuštenih događaja.",
  },
  "/chat": {
    title: "Poruke",
    description: "Komunikacija sa kupcima i prodavačima u realnom vremenu.",
  },
  "/reviews": {
    title: "Ocjene i recenzije",
    description: "Prati kvalitet usluge i reputaciju profila kroz ocjene.",
  },
  "/transactions": {
    title: "Transakcije",
    description: "Pregled uplata, troškova i historije plaćanja.",
  },
  "/user-subscription": {
    title: "Planovi i pristup",
    description: "Pregled promotivnog režima i dostupnih planova.",
  },
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
  disabled = false,
  unavailableBadge = "",
}) => {
  const content = (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
        disabled && "cursor-not-allowed opacity-65",
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          : isActive
          ? "bg-primary/10 text-primary dark:bg-primary/20"
          : disabled
          ? "text-slate-500 bg-slate-100/70 dark:text-slate-400 dark:bg-slate-800/70"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
      )}
      title={description || label}
      aria-label={description || label}
      onClick={href ? undefined : onClick}
      role="button"
      tabIndex={href ? -1 : 0}
      onKeyDown={(e) => {
        if (href) return;
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
            : disabled
            ? "bg-slate-200 dark:bg-slate-700"
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
              : disabled
              ? "text-slate-400 dark:text-slate-500"
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

      {disabled && unavailableBadge ? (
        <span className="px-2 py-0.5 bg-slate-300 text-slate-700 text-[10px] font-bold rounded-full min-w-[20px] text-center dark:bg-slate-700 dark:text-slate-200">
          {unavailableBadge}
        </span>
      ) : null}

      {isNew && (
        <span className="px-1.5 py-0.5 bg-primary text-white text-[9px] font-bold rounded uppercase tracking-wide">
          Novo
        </span>
      )}
    </div>
  );

  if (disabled) {
    return (
      <button
        type="button"
        onClick={() => toast.info(`${label} je privremeno nedostupno.`)}
        className="block w-full text-left"
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <CustomLink href={href} className="block" onClick={onClick}>
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
const QuickStat = ({ icon: Icon, value, label, color = "primary", loading = false }) => {
  const colors = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary/10",
    accent: "text-accent bg-accent/10",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-1 p-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-8 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 p-2" title={label} aria-label={label}>
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
  isStatsLoading = false,
  navigationSections,
  pathname,
  handleLogout,
  isLoggingOut = false,
  onClose,
  isMobile = false,
}) => {
  const resolvedMembership = useMemo(
    () => resolveMembership({ tier: userStats.membershipTier }),
    [userStats.membershipTier]
  );
  const isShop = resolvedMembership.isShop;
  const isPremium = resolvedMembership.isPremium;
  const [menuQuery, setMenuQuery] = useState("");
  const promoEnabled = isPromoFreeAccessEnabled();

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
                {isStatsLoading ? (
                  <Skeleton className="inline-flex h-5 w-14 rounded-full" />
                ) : (
                  <MembershipBadge tier={userStats.membershipTier} size="xs" uppercase={false} />
                )}
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
            <QuickStat
              icon={IoLayersOutline}
              value={userStats.activeAds}
              label="Oglasi"
              color="primary"
              loading={isStatsLoading}
            />
            <QuickStat
              icon={IoNotificationsOutline}
              value={userStats.unreadNotifications}
              label="Obavijesti"
              color="secondary"
              loading={isStatsLoading}
            />
            <QuickStat
              icon={IoStarOutline}
              value={userStats.rating}
              label="Ocjena"
              color="accent"
              loading={isStatsLoading}
            />
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
              placeholder="Pretraži meni..."
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
                    disabled={Boolean(item.disabled)}
                    unavailableBadge={item.unavailableBadge}
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
              label={isLoggingOut ? "Odjavljivanje..." : "Odjava"}
              description={isLoggingOut ? "Odjava je u toku" : "Odjavi se sa računa"}
              onClick={() => {
                if (isLoggingOut) return;
                handleLogout();
                onClose?.();
              }}
              danger
            />
          </MenuSection>
        </div>

        {/* UPGRADE BANNER (za free korisnike) */}
        {!isStatsLoading && promoEnabled && (
          <div className="border-t border-emerald-300/30 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <div className="rounded-xl border border-emerald-200/80 bg-white p-3 dark:border-emerald-500/30 dark:bg-slate-900">
              <h5 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Promotivni Free Access
              </h5>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{PROMO_HEADLINE}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PROMO_BENEFITS.map((benefit) => (
                  <span
                    key={benefit}
                    className="rounded-full border border-emerald-300/80 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/35 dark:bg-slate-900 dark:text-emerald-200"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
              <CustomLink
                href="/ad-listing"
                onClick={onClose}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-300/80 bg-emerald-100 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-200 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
              >
                Istraži funkcionalnosti
              </CustomLink>
            </div>
          </div>
        )}

        {!isStatsLoading && !promoEnabled && userStats.membershipTier === "free" && (
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
        {!isStatsLoading && !promoEnabled && isPremium && (
          <div className="border-t border-primary/10 bg-primary/5 p-4 dark:border-primary/25 dark:bg-primary/10">
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-white p-3 dark:border-primary/30 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Crown className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <div className="mb-1">
                  <MembershipBadge tier={isShop ? "shop" : "pro"} size="xs" uppercase />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Uživaj u svim premium pogodnostima</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const contextHeaderVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.36,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.06,
    },
  },
};

const contextHeaderItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
};

const ProfileContextHeader = ({ userStats, pathname, isStatsLoading = false }) => {
  const verificationStatus = String(userStats.verificationStatus || "not-applied");
  const shouldShowVerificationBlock = !userStats.isVerified;
  const verificationText = verificationStatus === "pending"
    ? "Verifikacija je u toku"
    : verificationStatus === "rejected"
    ? "Verifikacija je odbijena"
    : "Račun nije verificiran";
  const verificationTone = verificationStatus === "pending"
    ? "border-amber-200 bg-amber-50/90 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
    : verificationStatus === "rejected"
    ? "border-rose-200 bg-rose-50/90 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
    : "border-slate-200 bg-slate-50/90 text-slate-600 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300";
  const verificationCtaLabel =
    verificationStatus === "pending"
      ? "Provjeri verifikaciju"
      : verificationStatus === "rejected"
      ? "Pošalji verifikaciju ponovo"
      : "Verificiraj račun";
  const hasContextActions = shouldShowVerificationBlock;
  const contextCopy = PROFILE_CONTEXT_COPY[pathname] || {
    title: "Kontekst stranice",
    description: "Brzi pregled konteksta i radnji za trenutno otvorenu sekciju profila.",
  };

  return (
    <motion.section
      className="hidden lg:block"
      variants={contextHeaderVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.5)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <motion.div variants={contextHeaderItemVariants} className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Kontekst sekcije
            </p>
            {isStatsLoading ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-3 w-[420px] max-w-full rounded" />
              </div>
            ) : (
              <>
                <h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {contextCopy.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {contextCopy.description}
                </p>
              </>
            )}
          </div>
        </motion.div>

        <motion.div variants={contextHeaderItemVariants} className="flex flex-wrap items-center gap-2 px-5 py-3">
          {isStatsLoading ? (
            <>
              <Skeleton className="h-9 w-32 rounded-xl" />
              <Skeleton className="h-9 w-36 rounded-xl" />
            </>
          ) : hasContextActions ? (
            <>
              {shouldShowVerificationBlock && (
                <>
                  <span className={cn("inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold", verificationTone)}>
                    {verificationText}
                  </span>
                  <CustomLink
                    href="/user-verification"
                    className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                  >
                    {verificationCtaLabel}
                  </CustomLink>
                </>
              )}

            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Profil je usklađen i spreman. Nema dodatnih koraka za ovu sekciju.
            </p>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
};

// ============================================
// MAIN PROFILE LAYOUT COMPONENT
// ============================================
const ProfileLayout = ({ children, IsLogout, setIsLogout }) => {
  const pathname = usePathname();
  const { navigate } = useNavigate();
  const { signOut } = FirebaseData();

  const userData = useSelector(userSignUpData);
  const settings = useSelector(settingsData);
  const placeholderImage = settings?.placeholder_image;

  const [sellerAvatarId, setSellerAvatarId] = useState("lmx-01");
  const lastStatsFetchRef = useRef(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const PROFILE_LAYOUT_FETCH_COOLDOWN_MS = 15000;

  const [userStats, setUserStats] = useState({
    activeAds: 0,
    totalViews: 0,
    unreadNotifications: 0,
    unreadMessages: 0,
    rating: "0.0",
    membershipTier: "free",
    isVerified: false,
    verificationStatus: "not-applied",
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

  const handleHardLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      const response = await logoutApi.logoutApi({
        ...(userData?.fcm_id ? { fcm_token: userData.fcm_id } : {}),
      });

      if (response?.data?.error === false) {
        logoutSuccess();
        toast.success("Uspješno ste se odjavili");
        navigate("/");
      } else {
        toast.error(response?.data?.message || "Greška pri odjavi");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Greška pri odjavi");
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, signOut, userData?.fcm_id, navigate]);

  const handleLogout = useCallback(() => {
    setMobileMenuOpen(false);

    if (setIsLogout) {
      setIsLogout(true);
      return;
    }

    void handleHardLogout();
  }, [setIsLogout, handleHardLogout]);

  const fetchAllData = useCallback(async ({ showLoader = false, force = false } = {}) => {
    if (!userData) return;
    const now = Date.now();
    if (!force && now - lastStatsFetchRef.current < PROFILE_LAYOUT_FETCH_COOLDOWN_MS) {
      return;
    }
    lastStatsFetchRef.current = now;
    if (showLoader) {
      setIsStatsLoading(true);
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
          unreadMessages: userData?.unread_messages || 0,
          rating,
          membershipTier: String(membershipTier).toLowerCase(),
          isVerified,
          verificationStatus,
        };
      });
    } catch (e) {
      console.error("Error fetching user stats:", e);
    } finally {
      if (showLoader) {
        setIsStatsLoading(false);
      }
    }
  }, [userData, PROFILE_LAYOUT_FETCH_COOLDOWN_MS]);

  useEffect(() => {
    if (!userData) {
      setIsStatsLoading(false);
      return;
    }
    fetchAllData({ showLoader: true, force: true });
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
      <SheetTrigger
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 lg:hidden"
        aria-label="Otvori meni"
      >
        <IoMenuOutline size={20} className="text-slate-600 dark:text-slate-300" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Meni</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] max-w-[85vw] p-0">
        <ProfileSidebar
          userData={userData}
          customAvatarUrl={customAvatarUrl}
          sellerAvatarId={sellerAvatarId}
          userStats={userStats}
          isStatsLoading={isStatsLoading}
          navigationSections={navigationSections}
          pathname={pathname}
          handleLogout={handleLogout}
          isLoggingOut={isLoggingOut}
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
        <motion.div
          layout
          className="lg:grid lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:items-start lg:gap-6"
        >
          {/* Desktop Sidebar */}
          <motion.aside
            layout
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block lg:self-start"
          >
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <ProfileSidebar
                userData={userData}
                customAvatarUrl={customAvatarUrl}
                sellerAvatarId={sellerAvatarId}
                userStats={userStats}
                isStatsLoading={isStatsLoading}
                navigationSections={navigationSections}
                pathname={pathname}
                handleLogout={handleLogout}
                isLoggingOut={isLoggingOut}
                isMobile={false}
              />
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.main layout className="min-w-0 space-y-4">
            <ProfileContextHeader userStats={userStats} pathname={pathname} isStatsLoading={isStatsLoading} />
            <motion.div
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/85"
            >
              <div className="p-4 sm:p-6">{children}</div>
            </motion.div>
          </motion.main>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileLayout;
