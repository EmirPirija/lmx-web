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

import { useNavigate } from "@/components/Common/useNavigate";
import CustomLink from "@/components/Common/CustomLink";
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";
import { cn } from "@/lib/utils";

// Ikone iz react-icons/io5 (kao u ProfileDropdown)
import {
  IoPersonOutline,
  IoLayersOutline,
  IoHeartOutline,
  IoBookmarkOutline,
  IoCardOutline,
  IoReceiptOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoLogOutOutline,
  IoChevronForward,
  IoAddCircleOutline,
  IoStarOutline,
  IoTrophyOutline,
  IoShieldCheckmarkOutline,
  IoStorefrontOutline,
  IoBagHandleOutline,
  IoRibbonOutline,
  IoSearchOutline,
  IoMenuOutline,
  IoCloseOutline,
  IoChatbubbleOutline,
} from "react-icons/io5";
import { Crown, Store } from "lucide-react";
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
// MEMBERSHIP BADGE (isti stil kao ProfileDropdown)
// ============================================
const MembershipBadge = ({ tier, size = "sm" }) => {
  if (!tier || tier === "free") return null;

  const configs = {
    pro: {
      icon: Crown,
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      label: "Pro",
    },
    shop: {
      icon: Store,
      bg: "bg-secondary/10",
      text: "text-secondary",
      border: "border-secondary/20",
      label: "Shop",
    },
  };

  const config = configs[String(tier).toLowerCase()] || configs.pro;
  const Icon = config.icon;
  const sizeClasses = { xs: "text-[10px] px-2 py-0.5", sm: "text-xs px-2.5 py-1" };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold border",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size]
      )}
    >
      <Icon size={size === "xs" ? 10 : 12} />
      {config.label}
    </span>
  );
};

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
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group",
        danger
          ? "text-red-600 hover:bg-red-50"
          : isActive
          ? "bg-primary/10 text-primary"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
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
          "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
          danger
            ? "bg-red-50 group-hover:bg-red-100"
            : isActive
            ? "bg-primary/10"
            : "bg-slate-100 group-hover:bg-slate-200/70"
        )}
      >
        <Icon
          size={18}
          className={cn(
            danger
              ? "text-red-500"
              : isActive
              ? "text-primary"
              : "text-slate-500 group-hover:text-slate-700"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <span className={cn("text-sm font-medium block", isActive && "font-semibold")}>{label}</span>
        {description && (
          <span className="text-[11px] text-slate-400 block truncate">{description}</span>
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
      <p className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </p>
    )}
    <div className="space-y-0.5">{children}</div>
  </div>
);

const MenuDivider = () => <div className="h-px bg-slate-100 mx-3 my-1" />;

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
      <span className="text-sm font-bold text-slate-800">{value}</span>
      <span className="text-[10px] text-slate-400 font-medium">{label}</span>
    </div>
  );
};

// ============================================
// NAVIGATION CONFIG
// ============================================
const getNavigationConfig = (pathname, userStats) => {
  return {
    sections: [
      {
        title: "Račun",
        items: [
          {
            icon: IoPersonOutline,
            label: "Moj profil",
            description: "Uredi podatke i postavke",
            href: "/profile",
            isActive: pathname === "/profile",
          },
          ...(!userStats.isVerified
            ? [
                {
                  icon: IoShieldCheckmarkOutline,
                  label: "Verifikacija",
                  description: "Potvrdi svoj identitet",
                  href: "/user-verification",
                  isActive: pathname === "/user-verification",
                  isNew: true,
                },
              ]
            : []),
          {
            icon: IoStorefrontOutline,
            label: "Postavke prodavača",
            description: "Prilagodi svoj profil prodavača",
            href: "/profile/seller-settings",
            isActive: pathname === "/profile/seller-settings",
          },
        ],
      },
      {
        title: "Moji sadržaji",
        items: [
          {
            icon: IoLayersOutline,
            label: "Moji oglasi",
            description: userStats.activeAds > 0 ? `${userStats.activeAds} aktivnih oglasa` : "Upravljaj oglasima",
            href: "/my-ads",
            isActive: pathname === "/my-ads" || pathname?.startsWith("/my-ads/"),
          },
          {
            icon: IoHeartOutline,
            label: "Spašeni oglasi",
            description: "Sačuvani oglasi",
            href: "/favorites",
            isActive: pathname === "/favorites",
          },
          {
            icon: IoBookmarkOutline,
            label: "Sačuvani prodavači",
            description: "Kolekcije, bilješke i obavijesti",
            href: "/profile/saved",
            isActive: pathname === "/profile/saved",
          },
          {
            icon: IoSearchOutline,
            label: "Spašene pretrage",
            description: "Brze prečice do tvojih filtera",
            href: "/profile/saved-searches",
            isActive: pathname === "/profile/saved-searches",
          },
          {
            icon: IoBagHandleOutline,
            label: "Moje kupovine",
            description: "Historija kupovina",
            href: "/purchases",
            isActive: pathname === "/purchases",
          },
        ],
      },
      {
        title: "Komunikacija",
        items: [
          {
            icon: IoChatbubbleOutline,
            label: "Poruke",
            description: "Sve tvoje poruke",
            href: "/chat",
            isActive: pathname === "/chat" || pathname?.startsWith("/chat"),
            badge: userStats.unreadMessages,
          },
          {
            icon: IoNotificationsOutline,
            label: "Notifikacije",
            description: "Sve obavijesti na jednom mjestu",
            href: "/notifications",
            isActive: pathname === "/notifications",
            badge: userStats.unreadNotifications,
          },
        ],
      },
      {
        title: "Finansije",
        items: [
          {
            icon: IoCardOutline,
            label: "Pretplata",
            description: "Upravljaj pretplatom",
            href: "/user-subscription",
            isActive: pathname === "/user-subscription",
          },
          {
            icon: IoReceiptOutline,
            label: "Transakcije",
            description: "Historija transakcija",
            href: "/transactions",
            isActive: pathname === "/transactions",
          },
        ],
      },
      {
        title: "Zajednica",
        items: [
          {
            icon: IoStarOutline,
            label: "Ocjene",
            description: "Recenzije i ocjene",
            href: "/reviews",
            isActive: pathname === "/reviews",
          },
          {
            icon: IoRibbonOutline,
            label: "Bedževi",
            description: "Tvoja postignuća",
            href: "/profile/badges",
            isActive: pathname === "/profile/badges",
          },
          {
            icon: IoTrophyOutline,
            label: "Ljestvica",
            description: "Rangiranje korisnika",
            href: "/leaderboard",
            isActive: pathname === "/leaderboard",
          },
        ],
      },
      {
        title: "Podrška",
        items: [
          {
            icon: IoHelpCircleOutline,
            label: "Kontaktirajte nas",
            description: "Kontaktiraj podršku",
            href: "/contact-us",
            isActive: pathname === "/contact-us",
          },
        ],
      },
    ],
  };
};

// ============================================
// SIDEBAR COMPONENT (isti stil kao ProfileDropdown MenuPanel)
// ============================================
const ProfileSidebar = ({
  userData,
  customAvatarUrl,
  sellerAvatarId,
  userStats,
  navigationConfig,
  handleLogout,
  onClose,
  isMobile = false,
}) => {
  const isPro = userStats.membershipTier === "pro" || userStats.membershipTier === "shop";

  return (
    <div className="bg-white overflow-hidden h-full flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <UserAvatar
            customAvatarUrl={customAvatarUrl}
            avatarId={sellerAvatarId}
            size={48}
            ringClassName="border-2 border-white shadow-sm"
            showVerified={userStats.isVerified}
            verifiedSize={12}
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {userData?.name || "Korisnik"}
            </p>
            <p className="text-xs text-slate-500 truncate">{userData?.email}</p>
            <div className="mt-1">
              <MembershipBadge tier={userStats.membershipTier} size="xs" />
            </div>
          </div>
        </div>

        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <IoCloseOutline size={20} className="text-slate-600" />
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* QUICK STATS */}
        <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
          <div className="grid grid-cols-3 gap-1 bg-white rounded-xl p-2 border border-slate-100">
            <QuickStat icon={IoLayersOutline} value={userStats.activeAds} label="Oglasi" color="primary" />
            <QuickStat
              icon={IoNotificationsOutline}
              value={userStats.unreadNotifications}
              label="Obavijesti"
              color="secondary"
            />
            <QuickStat icon={IoStarOutline} value={userStats.rating} label="Ocjena" color="accent" />
          </div>
        </div>

        {/* PRIMARY ACTION */}
        <div className="px-4 py-3">
          <CustomLink
            href="/ad-listing"
            onClick={onClose}
            className="flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 w-full group"
          >
            <IoAddCircleOutline size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Dodaj oglas
          </CustomLink>
        </div>

        {/* MENU SECTIONS */}
        <div className="px-2 pb-2">
          {navigationConfig.sections.map((section, index) => (
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
                    isActive={item.isActive}
                    badge={item.badge}
                    isNew={item.isNew}
                    danger={item.danger}
                  />
                ))}
              </MenuSection>
              {index < navigationConfig.sections.length - 1 && <MenuDivider />}
            </div>
          ))}

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
          <div className="p-4 bg-primary/5 border-t border-primary/10">
            <CustomLink
              href="/membership/upgrade"
              onClick={onClose}
              className="flex items-center gap-4 p-3 bg-white rounded-xl border border-primary/20 hover:border-primary/40 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Crown className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-slate-800">
                  Nadogradi na Pro
                </h5>
                <p className="text-xs text-slate-600">Otključaj sve mogućnosti</p>
              </div>
              <IoChevronForward className="text-primary group-hover:translate-x-1 transition-transform" size={20} />
            </CustomLink>
          </div>
        )}

        {/* PRO USER BANNER */}
        {isPro && (
          <div className="p-4 bg-primary/5 border-t border-primary/10">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-primary/20">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Crown className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-slate-800">
                  {userStats.membershipTier === "shop" ? "Shop" : "Pro"} član
                </h5>
                <p className="text-xs text-slate-500">Uživaj u svim premium pogodnostima</p>
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
  const { navigate } = useNavigate();
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

      let membershipTier = userData?.membership_tier || "free";
      if (membershipRes.status === "fulfilled") {
        const membershipData = getApiData(membershipRes.value);
        membershipTier = membershipData?.tier || membershipData?.membership_tier || membershipTier;
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

  // Navigation config
  const navigationConfig = useMemo(
    () => getNavigationConfig(pathname, userStats),
    [pathname, userStats]
  );

  // Get current page title
  const currentPageTitle = useMemo(() => {
    for (const section of navigationConfig.sections) {
      const activeItem = section.items.find((item) => item.isActive);
      if (activeItem) return activeItem.label;
    }
    return "Profil";
  }, [navigationConfig]);

  // Mobile sidebar (Sheet kao ProfileDropdown)
  const MobileSidebar = (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <button
          className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          aria-label="Otvori meni"
        >
          <IoMenuOutline size={20} className="text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Meni</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[320px] max-w-[85vw]">
        <ProfileSidebar
          userData={userData}
          customAvatarUrl={customAvatarUrl}
          sellerAvatarId={sellerAvatarId}
          userStats={userStats}
          navigationConfig={navigationConfig}
          handleLogout={handleLogout}
          onClose={() => setMobileMenuOpen(false)}
          isMobile={true}
        />
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between gap-4">
            {MobileSidebar}
            <CustomLink
              href="/ad-listing"
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <IoAddCircleOutline size={18} />
              <span className="hidden sm:inline">Dodaj</span>
            </CustomLink>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <aside className="hidden lg:block w-[320px] flex-shrink-0">
              <div className="sticky top-24 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <ProfileSidebar
                  userData={userData}
                  customAvatarUrl={customAvatarUrl}
                  sellerAvatarId={sellerAvatarId}
                  userStats={userStats}
                  navigationConfig={navigationConfig}
                  handleLogout={handleLogout}
                  isMobile={false}
                />
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Content Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
