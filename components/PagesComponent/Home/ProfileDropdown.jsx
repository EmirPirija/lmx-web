"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { settingsData } from "@/redux/reducer/settingSlice";
import { membershipApi, chatListApi, getNotificationList, getMyItemsApi } from "@/utils/api";
import { truncate } from "@/utils";
import { useMediaQuery } from "usehooks-ts";
import CustomImage from "@/components/Common/CustomImage";
import { useNavigate } from "@/components/Common/useNavigate";

// Icons
import {
  IoPersonOutline,
  IoSettingsOutline,
  IoLayersOutline,
  IoHeartOutline,
  IoStatsChartOutline,
  IoCardOutline,
  IoReceiptOutline,
  IoChatbubbleOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoLogOutOutline,
  IoChevronForward,
  IoClose,
  IoAddCircleOutline,
  IoStarOutline,
  IoEyeOutline,
  IoBriefcaseOutline,
} from "react-icons/io5";
import { Crown, Store } from "lucide-react";
import { FaAngleDown } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

// ============================================
// HELPERS
// ============================================
const formatNumber = (num) => {
  const n = Number(num || 0);
  if (Number.isNaN(n)) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
};

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

const focusableSelector =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// ============================================
// MEMBERSHIP BADGE
// ============================================
const MembershipBadge = ({ tier, size = "sm" }) => {
  if (!tier || tier === "free") return null;

  const configs = {
    pro: { icon: Crown, bg: "bg-amber-100", text: "text-amber-700", label: "Pro" },
    shop: { icon: Store, bg: "bg-blue-100", text: "text-blue-700", label: "Shop" },
  };

  const key = String(tier || "").toLowerCase();
  const config = configs[key] || configs.pro;
  const Icon = config.icon;
  const sizeClasses = { xs: "text-[10px] px-1.5 py-0.5", sm: "text-xs px-2 py-0.5" };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${config.bg} ${config.text} ${
        sizeClasses[size] || sizeClasses.sm
      }`}
    >
      <Icon size={size === "xs" ? 10 : 12} />
      {config.label}
    </span>
  );
};

// ============================================
// MENU ITEM
// - badge: crveni alert (unread)
// - count: sivi broj (informativno, npr. broj oglasa)
// - proOnly: ako je free, vodi na upgrade
// ============================================
const MenuItem = ({
  icon: Icon,
  label,
  onClick,
  badge = 0,
  count = null,
  isNew = false,
  external = false,
  danger = false,
  proOnly = false,
  disabled = false,
}) => {
  const badgeNum = Number(badge || 0);

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={[
        "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
      ].join(" ")}
    >
      <Icon size={18} className={danger ? "text-red-500" : "text-slate-400"} />
      <span className="flex-1 text-sm font-medium">{label}</span>

      {count !== null && (
        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full">
          {count}
        </span>
      )}

      {badgeNum > 0 && (
        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
          {badgeNum > 99 ? "99+" : badgeNum}
        </span>
      )}

      {proOnly && (
        <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded">PRO</span>
      )}

      {isNew && <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded">NOVO</span>}

      {external && <IoChevronForward size={14} className="text-slate-300" />}
    </button>
  );
};

// ============================================
// MENU SECTION
// ============================================
const MenuSection = ({ title, children }) => (
  <div className="py-2">
    {title && (
      <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </p>
    )}
    <div className="space-y-1">{children}</div>
  </div>
);

// ============================================
// LOADING SKELETON (mini)
// ============================================
const SkeletonLine = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

// ============================================
// STATS HOOK (fetch on open + cache)
// ============================================
const useProfileMenuStats = ({ userData, isOpen }) => {
  const cacheRef = useRef({ ts: 0, data: null });
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    activeAds: 0,
    totalViews: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
    rating: 0,
    membershipTier: "free",
    isVerified: false,
  });

  const userId = userData?.id;

  useEffect(() => {
    if (!userId || !isOpen) return;

    const now = Date.now();
    const cacheAge = now - (cacheRef.current.ts || 0);
    const CACHE_TTL_MS = 90 * 1000; // 90s

    // serve cache odmah (snappy)
    if (cacheRef.current.data && cacheAge < CACHE_TTL_MS) {
      setStats(cacheRef.current.data);
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);

      try {
        const [membershipRes, chatRes, notifRes, adsRes] = await Promise.allSettled([
          membershipApi.getUserMembership({}),
          chatListApi.chatList({ type: "all", page: 1 }),
          getNotificationList.getNotification({ page: 1 }),
          getMyItemsApi.getMyItems({ status: "approved", page: 1 }),
        ]);

        // Membership
        let membershipTier = (userData?.membership_tier || "free").toString().toLowerCase();
        if (membershipRes.status === "fulfilled" && membershipRes.value?.data?.data) {
          const data = membershipRes.value.data.data;
          membershipTier = (data?.tier?.slug || data?.membership_tier || membershipTier || "free")
            .toString()
            .toLowerCase();
        }

        // Unread messages (sum, ne broj chatova)
        let unreadMessages = 0;
        if (chatRes.status === "fulfilled" && chatRes.value?.data?.data?.data) {
          const chats = chatRes.value.data.data.data;
          unreadMessages = chats.reduce((sum, chat) => {
            const c = Number(chat?.unread_count ?? chat?.unread ?? 0);
            return sum + (Number.isNaN(c) ? 0 : c);
          }, 0);
        }

        // Unread notifications
        let unreadNotifications = 0;
        if (notifRes.status === "fulfilled" && notifRes.value?.data?.data) {
          const maybe = notifRes.value.data.data;
          const notifs = maybe?.data || maybe;
          if (Array.isArray(notifs)) {
            unreadNotifications = notifs.filter((n) => !n?.read_at && !n?.is_read).length;
          }
        }

        // Active ads count
        let activeAds = 0;
        if (adsRes.status === "fulfilled" && adsRes.value?.data?.data) {
          const d = adsRes.value.data.data;
          activeAds = Number(d?.total ?? d?.count ?? 0) || 0;
        }

        // Total views (fallback)
        const totalViews = Number(userData?.total_views ?? userData?.profile_views ?? 0) || 0;

        // Rating (safe)
        const rawRating = Number(userData?.rating ?? userData?.avg_rating ?? 0);
        const rating = Number.isNaN(rawRating) ? 0 : rawRating;

        // Verified status
        const isVerified = userData?.is_verified === 1 || userData?.verified === true;

        const next = {
          activeAds,
          totalViews,
          unreadMessages,
          unreadNotifications,
          rating: Number(rating.toFixed(1)),
          membershipTier,
          isVerified,
        };

        if (!cancelled) {
          setStats(next);
          cacheRef.current = { ts: Date.now(), data: next };
        }
      } catch (e) {
        // silent fail
        // eslint-disable-next-line no-console
        console.error("Error fetching user stats:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [userId, isOpen, userData]);

  return { stats, loading };
};

// ============================================
// CONTENT (shared za modal)
// ============================================
const ProfileMenuContent = ({
  userData,
  placeholderImage,
  stats,
  loading,
  isMobile,
  onClose,
  onLogout,
  onNavigate,
  onUpgrade,
}) => {
  const isPro = stats.membershipTier === "pro" || stats.membershipTier === "shop";
  const isFree = stats.membershipTier === "free";

  const MENU = useMemo(
    () => [
      {
        title: "Profil",
        items: [
          { icon: IoPersonOutline, label: "Moj profil", action: () => onNavigate("/profile") },
          { icon: IoSettingsOutline, label: "Postavke", action: () => onNavigate("/profile") },
        ],
      },
      {
        title: "Oglasi",
        items: [
          {
            icon: IoLayersOutline,
            label: "Moji oglasi",
            action: () => onNavigate("/my-ads"),
            count: stats.activeAds,
          },
          { icon: IoHeartOutline, label: "Favoriti", action: () => onNavigate("/favorites") },
          {
            icon: IoStatsChartOutline,
            label: "Statistika",
            action: () => (isFree ? onUpgrade() : onNavigate("/my-ads")),
            proOnly: isFree,
          },
        ],
      },
      {
        title: "Finansije",
        items: [
          { icon: IoCardOutline, label: "Pretplata", action: () => onNavigate("/user-subscription") },
          { icon: IoReceiptOutline, label: "Transakcije", action: () => onNavigate("/transactions") },
        ],
      },
      {
        title: "Podrška",
        items: [
          {
            icon: IoChatbubbleOutline,
            label: "Poruke",
            action: () => onNavigate("/chat"),
            badge: stats.unreadMessages,
          },
          {
            icon: IoNotificationsOutline,
            label: "Obavijesti",
            action: () => onNavigate("/notifications"),
            badge: stats.unreadNotifications,
          },
          {
            icon: IoBriefcaseOutline,
            label: "Prijave za posao",
            action: () => window.open("https://poslovi.lmx.ba/", "_blank"),
            external: true,
          },
          { icon: IoHelpCircleOutline, label: "Pomoć", action: () => onNavigate("/contact-us") },
        ],
      },
    ],
    [stats.activeAds, stats.unreadMessages, stats.unreadNotifications, isFree, onNavigate, onUpgrade]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/60 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <CustomImage
                src={userData?.profile || placeholderImage}
                alt={userData?.name || "User"}
                width={52}
                height={52}
                className="rounded-full w-13 h-13 aspect-square object-cover border-2 border-white shadow-sm"
              />
              {stats.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <MdVerified className="text-white" size={12} />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{userData?.name || "Korisnik"}</p>
                <MembershipBadge tier={stats.membershipTier} size="sm" />
              </div>
              <p className="text-xs text-slate-500 truncate">{userData?.email || ""}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/70 transition-colors"
            aria-label="Zatvori"
          >
            <IoClose size={22} className="text-slate-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl p-2.5 border border-slate-100">
            <div className="flex items-center gap-2">
              <IoLayersOutline className="text-blue-500" size={16} />
              <p className="text-xs text-slate-500">Oglasi</p>
            </div>
            <div className="mt-1">
              {loading ? (
                <SkeletonLine className="h-4 w-12" />
              ) : (
                <p className="text-sm font-bold text-slate-800">{stats.activeAds}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-slate-100">
            <div className="flex items-center gap-2">
              <IoChatbubbleOutline className="text-amber-500" size={16} />
              <p className="text-xs text-slate-500">Poruke</p>
            </div>
            <div className="mt-1">
              {loading ? (
                <SkeletonLine className="h-4 w-16" />
              ) : (
                <p className="text-sm font-bold text-slate-800">{stats.unreadMessages}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-slate-100">
            <div className="flex items-center gap-2">
              <IoStarOutline className="text-amber-500" size={16} />
              <p className="text-xs text-slate-500">Ocjena</p>
            </div>
            <div className="mt-1">
              {loading ? (
                <SkeletonLine className="h-4 w-10" />
              ) : (
                <p className="text-sm font-bold text-slate-800">{stats.rating}</p>
              )}
            </div>
          </div>
        </div>

        {/* Primary action */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onNavigate("/ad-listing")}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <IoAddCircleOutline size={18} />
            Dodaj oglas
          </button>
        </div>

        {/* Optional: views (manje upadljivo) */}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <IoEyeOutline size={14} className="text-green-500" />
            {loading ? <SkeletonLine className="h-3 w-10" /> : <span>{formatNumber(stats.totalViews)} pregleda</span>}
          </span>

          {isPro && (
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <IoCardOutline size={14} className="text-slate-400" />
              Pro aktivan
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className={["flex-1 overflow-y-auto", isMobile ? "p-2" : "p-3"].join(" ")}>
        {MENU.map((section) => (
          <div key={section.title}>
            <MenuSection title={section.title}>
              {section.items.map((it) => (
                <MenuItem
                  key={it.label}
                  icon={it.icon}
                  label={it.label}
                  onClick={() => it.action?.()}
                  badge={it.badge}
                  count={it.count}
                  external={it.external}
                  danger={it.danger}
                  proOnly={it.proOnly}
                />
              ))}
            </MenuSection>
            <div className="h-px bg-slate-100 mx-3" />
          </div>
        ))}

        <MenuSection>
          <MenuItem icon={IoLogOutOutline} label="Odjavi se" onClick={onLogout} danger />
        </MenuSection>
      </div>

      {/* Upgrade banner */}
      {isFree && (
        <div className="p-3 border-t border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full flex items-center gap-3 group text-left"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Crown className="text-white" size={16} />
            </div>
            <div className="flex-1">
              <h5 className="text-sm font-semibold text-amber-800">Nadogradi na Pro</h5>
              <p className="text-xs text-amber-600">Napredna statistika i više</p>
            </div>
            <IoChevronForward className="text-amber-400 group-hover:translate-x-1 transition-transform" size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// MODAL WRAPPER (portal + focus trap + esc + outside click)
// ============================================
const ProfileModal = ({ open, onClose, children, isMobile }) => {
  const modalRef = useRef(null);

  // lock body scroll
  useEffect(() => {
    if (!isBrowser()) return;
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // focus trap + ESC
  useEffect(() => {
    if (!isBrowser() || !open) return;

    const el = modalRef.current;
    if (!el) return;

    const focusables = Array.from(el.querySelectorAll(focusableSelector));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    // focus first interactive
    (first || el).focus?.();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab" || focusables.length === 0) return;

      // trap
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !isBrowser()) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center"
      aria-hidden={!open}
    >
      {/* overlay */}
      <button
        type="button"
        aria-label="Zatvori overlay"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
      />

      {/* panel */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={[
          "relative bg-white shadow-2xl border border-slate-100 overflow-hidden",
          isMobile
            ? "w-full h-[92vh] rounded-t-2xl animate-in slide-in-from-bottom duration-200"
            : "w-[420px] max-w-[92vw] max-h-[82vh] rounded-2xl animate-in fade-in zoom-in-95 duration-150",
        ].join(" ")}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ProfileDropdown = ({ IsLogout, setIsLogout }) => {
  const [open, setOpen] = useState(false);
  const { navigate } = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const userData = useSelector(userSignUpData);
  const settings = useSelector(settingsData);
  const placeholderImage = settings?.placeholder_image;

  const { stats, loading } = useProfileMenuStats({ userData, isOpen: open });

  const handleClose = useCallback(() => setOpen(false), []);
  const handleOpen = useCallback(() => setOpen(true), []);

  const handleNavigate = useCallback(
    (path) => {
      setOpen(false);
      navigate(path);
    },
    [navigate]
  );

  const handleUpgrade = useCallback(() => {
    setOpen(false);
    navigate("/membership/upgrade");
  }, [navigate]);

  const handleLogout = useCallback(() => {
    setOpen(false);
    setIsLogout?.(true);
  }, [setIsLogout]);

  if (!userData) return null;

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => (open ? handleClose() : handleOpen())}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="relative">
          <CustomImage
            src={userData?.profile || placeholderImage}
            alt={userData?.name || "User"}
            width={32}
            height={32}
            className="rounded-full w-8 h-8 aspect-square object-cover border-2 border-slate-200"
          />
          {stats.isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
              <MdVerified className="text-white" size={10} />
            </div>
          )}
        </div>

        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-slate-700 leading-tight max-w-[110px] truncate">
            {truncate(userData?.name, 14)}
          </p>
          {stats.membershipTier !== "free" && <MembershipBadge tier={stats.membershipTier} size="xs" />}
        </div>

        <FaAngleDown
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          size={12}
        />
      </button>

      {/* Modal */}
      <ProfileModal open={open} onClose={handleClose} isMobile={isMobile}>
        <ProfileMenuContent
          userData={userData}
          placeholderImage={placeholderImage}
          stats={stats}
          loading={loading}
          isMobile={isMobile}
          onClose={handleClose}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          onUpgrade={handleUpgrade}
        />
      </ProfileModal>
    </div>
  );
};

export default ProfileDropdown;
