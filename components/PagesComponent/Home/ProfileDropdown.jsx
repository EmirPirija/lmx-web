"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useMediaQuery } from "usehooks-ts";

import { userSignUpData } from "@/redux/reducer/authSlice";
import { settingsData } from "@/redux/reducer/settingSlice";
import { membershipApi, getNotificationList, getMyItemsApi } from "@/utils/api";
import { t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";
import { useNavigate } from "@/components/Common/useNavigate";

// Icons
import {
  IoPersonOutline,
  IoLayersOutline,
  IoHeartOutline,
  IoCardOutline,
  IoReceiptOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoLogOutOutline,
  IoChevronForward,
  IoClose,
  IoAddCircleOutline,
  IoStarOutline,
  IoTrophyOutline,
  IoShieldCheckmarkOutline,
  IoStorefrontOutline,
  IoBagHandleOutline,
  IoRibbonOutline,
  IoSparklesOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { Crown, Store, Sparkles, TrendingUp } from "lucide-react";
import { MdVerified } from "react-icons/md";

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
  if (typeof payload?.pagination?.total === "number") return payload.pagination.total;
  if (typeof payload?.meta?.pagination?.total === "number") return payload.meta.pagination.total;
  return 0;
};

// ============================================
// MEMBERSHIP BADGE
// ============================================
const MembershipBadge = ({ tier, size = "sm" }) => {
  if (!tier || tier === "free") return null;

  const configs = {
    pro: { icon: Crown, bg: "bg-gradient-to-r from-amber-100 to-yellow-100", text: "text-amber-700", border: "border-amber-200", label: "Pro" },
    shop: { icon: Store, bg: "bg-gradient-to-r from-blue-100 to-indigo-100", text: "text-blue-700", border: "border-blue-200", label: "Shop" },
  };

  const config = configs[String(tier).toLowerCase()] || configs.pro;
  const Icon = config.icon;
  const sizeClasses = { xs: "text-[10px] px-2 py-0.5", sm: "text-xs px-2.5 py-1" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}>
      <Icon size={size === "xs" ? 10 : 12} />
      {config.label}
    </span>
  );
};

// ============================================
// MENU ITEM
// ============================================
const MenuItem = ({ icon: Icon, label, href, onClick, badge, isNew, external, danger, description }) => {
  const content = (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50/80 hover:text-slate-900"
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${danger ? "bg-red-50 group-hover:bg-red-100" : "bg-slate-100 group-hover:bg-slate-200/70"}`}>
        <Icon size={18} className={danger ? "text-red-500" : "text-slate-500 group-hover:text-slate-700"} />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block">{label}</span>
        {description && <span className="text-[11px] text-slate-400 block truncate">{description}</span>}
      </div>

      {typeof badge === "number" && badge > 0 && (
        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] text-center animate-pulse">
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {isNew && (
        <span className="px-1.5 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[9px] font-bold rounded uppercase tracking-wide">
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
      <p className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        {title}
      </p>
    )}
    <div className="space-y-0.5">{children}</div>
  </div>
);

const MenuDivider = () => <div className="h-px bg-slate-100 mx-3 my-1" />;

// ============================================
// MODAL (CENTERED) - no white shadow/ring
// ============================================
const SheetModal = ({ open, onClose, children }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const panelRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // lock scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // outside click closes
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      const panel = panelRef.current;
      if (!panel) return;
      if (!panel.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, onClose]);

  if (!open) return null;
  if (!mounted) return null;
  if (typeof window === "undefined") return null;

  const content = (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        ref={panelRef}
        className={[
          "fixed z-[10000] bg-white overflow-hidden",
          // IMPORTANT: remove ALL shadow + ring
          "shadow-none ring-0 outline-none",
          isMobile
            ? "inset-x-0 bottom-0 rounded-t-3xl max-h-[90vh] animate-in slide-in-from-bottom duration-300"
            : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] rounded-2xl max-h-[85vh] animate-in fade-in zoom-in-95 duration-200",
        ].join(" ")}
        style={{
          // hard kill any custom shadow from elsewhere
          boxShadow: "none",
        }}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(content, window.document.body);
};

// ============================================
// QUICK STAT ITEM
// ============================================
const QuickStat = ({ icon: Icon, value, label, color = "blue" }) => {
  const colors = {
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-500 bg-green-50",
    amber: "text-amber-500 bg-amber-50",
    purple: "text-purple-500 bg-purple-50",
  };

  return (
    <div className="flex flex-col items-center gap-1 p-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <span className="text-sm font-bold text-slate-800">{value}</span>
      <span className="text-[10px] text-slate-400 font-medium">{label}</span>
    </div>
  );
};

// ============================================
// GLAVNA KOMPONENTA
// ============================================
const ProfileDropdown = ({ IsLogout, setIsLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { navigate } = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const userData = useSelector(userSignUpData);
  const settings = useSelector(settingsData);
  const placeholderImage = settings?.placeholder_image;

  const [userStats, setUserStats] = useState({
    activeAds: 0,
    totalViews: 0,
    unreadNotifications: 0,
    rating: "0.0",
    membershipTier: "free",
    isVerified: false,
  });

  const handleNavigate = useCallback(
    (path) => {
      setIsOpen(false);
      navigate(path);
    },
    [navigate]
  );

  const handleLogout = useCallback(() => {
    setIsOpen(false);
    setIsLogout(true);
  }, [setIsLogout]);

  const isPro = userStats.membershipTier === "pro" || userStats.membershipTier === "shop";

  const fetchAllData = useCallback(async () => {
    if (!userData) return;

    try {
      const results = await Promise.allSettled([
        membershipApi.getUserMembership({}),
        getNotificationList.getNotification({ page: 1 }),
        getMyItemsApi.getMyItems({ status: "approved", user_id: userData?.id, offset: 0, limit: 1 }),
      ]);

      const [membershipRes, notifRes, adsRes] = results;

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

      const ratingRaw = userData?.rating || userData?.avg_rating || 0;
      const rating = Number.isFinite(Number(ratingRaw)) ? Number(ratingRaw).toFixed(1) : "0.0";
      const isVerified = userData?.is_verified === 1 || userData?.verified === true;

      setUserStats({
        activeAds,
        totalViews: userData?.total_views || userData?.profile_views || 0,
        unreadNotifications,
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
  }, [userData, fetchAllData]);

  useEffect(() => {
    if (!isOpen) return;
    fetchAllData();
  }, [isOpen, fetchAllData]);

  return (
    <div className="relative">
      {/* TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center rounded-full hover:bg-slate-100 transition-all duration-200 p-1 hover:scale-105"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Otvori korisnički meni"
      >
        <div className="relative">
          <CustomImage
            src={userData?.profile || placeholderImage}
            alt={userData?.name || "Profil"}
            width={36}
            height={36}
            className="rounded-full w-9 h-9 aspect-square object-cover border-2 border-slate-200 hover:border-primary/50 transition-colors"
          />

          {userStats.isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
              <MdVerified className="text-white" size={10} />
            </div>
          )}

          {/* ONLY NOTIFICATIONS BADGE */}
          {userStats.unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {userStats.unreadNotifications > 9 ? "9+" : userStats.unreadNotifications}
            </span>
          )}
        </div>
      </button>

      {/* MODAL */}
      <SheetModal open={isOpen} onClose={() => setIsOpen(false)}>
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <CustomImage
                src={userData?.profile || placeholderImage}
                alt={userData?.name || "Profil"}
                width={48}
                height={48}
                className="rounded-full w-12 h-12 aspect-square object-cover border-2 border-white"
              />
              {userStats.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <MdVerified className="text-white" size={12} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate max-w-[220px]">{userData?.name || "Korisnik"}</p>
              <p className="text-xs text-slate-500 truncate max-w-[220px]">{userData?.email}</p>
              <div className="mt-1">
                <MembershipBadge tier={userStats.membershipTier} size="xs" />
              </div>
            </div>
          </div>

          <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors" aria-label="Zatvori">
            <IoClose size={22} className="text-slate-500" />
          </button>
        </div>

        {/* CONTENT */}
        <div className={["overflow-y-auto overscroll-contain", isMobile ? "max-h-[calc(90vh-80px)]" : "max-h-[calc(85vh-80px)]"].join(" ")}>
          {/* QUICK STATS (NO CHAT) */}
          <div className="px-4 py-3 bg-gradient-to-br from-slate-50/50 to-white border-b border-slate-100">
            <div className="grid grid-cols-3 gap-1 bg-white rounded-xl p-2 border border-slate-100">
              <QuickStat icon={IoLayersOutline} value={userStats.activeAds} label="Oglasi" color="blue" />
              <QuickStat icon={IoNotificationsOutline} value={userStats.unreadNotifications} label="Obavijesti" color="amber" />
              <QuickStat icon={IoStarOutline} value={userStats.rating} label="Ocjena" color="purple" />
            </div>
          </div>

          {/* PRIMARY ACTION - DODAJ OGLAS */}
          <div className="px-4 py-3">
            <Link
              href="/ad-listing"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-semibold hover:scale-[1.02] transition-all duration-200 w-full group"
            >
              <IoAddCircleOutline size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              {t("adListing")}
            </Link>
          </div>

          {/* MENU SECTIONS */}
          <div className="px-2 pb-2">
            {/* RAČUN */}
            <MenuSection title="Račun">
              <MenuItem icon={IoPersonOutline} label={t("myProfile")} description="Uredi podatke i postavke" onClick={() => handleNavigate("/profile")} />
              {!userStats.isVerified && (
                <MenuItem icon={IoShieldCheckmarkOutline} label="Verifikacija" description="Potvrdi svoj identitet" onClick={() => handleNavigate("/user-verification")} isNew />
              )}
              <MenuItem icon={IoStorefrontOutline} label="Postavke prodavača" description="Prilagodi svoj profil prodavača" onClick={() => handleNavigate("/profile/seller-settings")} />
            </MenuSection>

            <MenuDivider />

            {/* MOJI SADRŽAJI */}
            <MenuSection title="Moji sadržaji">
              <MenuItem icon={IoLayersOutline} label={t("myAds")} description={`${userStats.activeAds} aktivnih oglasa`} onClick={() => handleNavigate("/my-ads")} />
              <MenuItem icon={IoHeartOutline} label={t("favorites")} description="Sačuvani oglasi" onClick={() => handleNavigate("/favorites")} />
              <MenuItem
              icon={IoSearchOutline}
                 label="Spašene pretrage"
                 description="Brze prečice do tvojih filtera"
                 onClick={() => handleNavigate("/profile/saved-searches")}
               />
              <MenuItem icon={IoBagHandleOutline} label="Moje kupovine" description="Historija kupovina" onClick={() => handleNavigate("/purchases")} />
            </MenuSection>

            <MenuDivider />

            {/* KOMUNIKACIJA (NO CHAT) */}
            <MenuSection title="Komunikacija">
              <MenuItem icon={IoNotificationsOutline} label={t("notifications")} description="Sve obavijesti na jednom mjestu" onClick={() => handleNavigate("/notifications")} badge={userStats.unreadNotifications} />
            </MenuSection>

            <MenuDivider />

            {/* FINANSIJE */}
            <MenuSection title="Finansije">
              <MenuItem icon={IoCardOutline} label={t("subscription")} description="Upravljaj pretplatom" onClick={() => handleNavigate("/user-subscription")} />
              <MenuItem icon={IoReceiptOutline} label={t("transaction")} description="Historija transakcija" onClick={() => handleNavigate("/transactions")} />
            </MenuSection>

            <MenuDivider />

            {/* ZAJEDNICA */}
            <MenuSection title="Zajednica">
              <MenuItem icon={IoStarOutline} label={t("myReviews")} description="Recenzije i ocjene" onClick={() => handleNavigate("/reviews")} />
              <MenuItem icon={IoRibbonOutline} label="Bedževi" description="Tvoja postignuća" onClick={() => handleNavigate("/profile/badges")} />
              <MenuItem icon={IoTrophyOutline} label="Ljestvica" description="Rangiranje korisnika" onClick={() => handleNavigate("/leaderboard")} />
            </MenuSection>

            <MenuDivider />

            {/* PODRŠKA */}
            <MenuSection title="Podrška">
              <MenuItem icon={IoHelpCircleOutline} label={t("contactUs")} description="Kontaktiraj podršku" onClick={() => handleNavigate("/contact-us")} />
            </MenuSection>

            <MenuDivider />

            {/* ODJAVA */}
            <MenuSection>
              <MenuItem icon={IoLogOutOutline} label={t("signOut")} description="Odjavi se sa računa" onClick={handleLogout} danger />
            </MenuSection>
          </div>

          {/* UPGRADE BANNER - za free korisnike */}
          {userStats.membershipTier === "free" && (
            <div className="p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-t border-amber-100/50">
              <Link
                href="/membership/upgrade"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200/50 hover:border-amber-300 transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Sparkles className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Nadogradi na Pro
                    <TrendingUp size={14} className="text-amber-500" />
                  </h5>
                  <p className="text-xs text-slate-600">Otključaj sve mogućnosti i prednosti</p>
                </div>
                <IoChevronForward className="text-amber-400 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
            </div>
          )}

          {/* PRO USER BANNER */}
          {isPro && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100/50">
              <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200/50">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <IoSparklesOutline className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-slate-800">{userStats.membershipTier === "shop" ? "Shop" : "Pro"} član</h5>
                  <p className="text-xs text-slate-500">Uživaj u svim premium pogodnostima</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetModal>
    </div>
  );
};

export default ProfileDropdown;
