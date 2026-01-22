"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useMediaQuery } from "usehooks-ts";

import { userSignUpData } from "@/redux/reducer/authSlice";
import { settingsData } from "@/redux/reducer/settingSlice";
import { membershipApi, chatListApi, getNotificationList, getMyItemsApi } from "@/utils/api";
import { truncate } from "@/utils";
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
import { MdVerified } from "react-icons/md";

// ============================================
// HELPERS
// ============================================
const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const getApiData = (res) => res?.data?.data ?? null;

// Pokušaj izvući listu iz paginated ili plain odgovora
const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data; // paginator shape: {data: [...]}
  return [];
};

const extractTotal = (payload) => {
  if (!payload) return 0;
  // paginator / custom meta
  if (typeof payload?.total === "number") return payload.total;
  if (typeof payload?.meta?.total === "number") return payload.meta.total;
  if (typeof payload?.pagination?.total === "number") return payload.pagination.total;
  return 0;
};

// ============================================
// MEMBERSHIP BADGE
// ============================================
const MembershipBadge = ({ tier, size = "sm" }) => {
  if (!tier || tier === "free") return null;

  const configs = {
    pro: { icon: Crown, bg: "bg-amber-100", text: "text-amber-700", label: "Pro" },
    shop: { icon: Store, bg: "bg-blue-100", text: "text-blue-700", label: "Shop" },
  };

  const config = configs[String(tier).toLowerCase()] || configs.pro;
  const Icon = config.icon;
  const sizeClasses = { xs: "text-[10px] px-1.5 py-0.5", sm: "text-xs px-2 py-0.5" };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${config.bg} ${config.text} ${sizeClasses[size]}`}
    >
      <Icon size={size === "xs" ? 10 : 12} />
      {config.label}
    </span>
  );
};

// ============================================
// MENU ITEM
// ============================================
const MenuItem = ({ icon: Icon, label, href, onClick, badge, isNew, external, danger }) => {
  const content = (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <Icon size={18} className={danger ? "text-red-500" : "text-slate-400"} />
      <span className="flex-1 text-sm font-medium">{label}</span>

      {typeof badge === "number" && badge > 0 && (
        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {isNew && <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded">NOVO</span>}

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
  <div className="py-2">
    {title && (
      <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
    )}
    {children}
  </div>
);

// ============================================
// MODAL (SHEET)
// ============================================
const SheetModal = ({ open, onClose, children }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const panelRef = useRef(null);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Click outside to close
  const onOverlayMouseDown = (e) => {
    // ako klikneš direktno na overlay (ne na panel)
    if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onMouseDown={onOverlayMouseDown}
      />

      <div
        ref={panelRef}
        className={[
          "fixed z-[10000] bg-white border border-slate-100 shadow-2xl overflow-hidden",
          isMobile
            ? "inset-x-0 bottom-0 rounded-t-2xl max-h-[92vh] animate-in slide-in-from-bottom duration-200"
            : "top-16 right-4 w-[380px] rounded-2xl max-h-[80vh] animate-in fade-in slide-in-from-top-2 duration-150",
        ].join(" ")}
      >
        {children}
      </div>
    </div>,
    document.body
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
    unreadMessages: 0,
    unreadNotifications: 0,
    rating: "0.0",
    membershipTier: "free",
    isVerified: false,
  });
  const [loading, setLoading] = useState(false);

  const hasUnread = useMemo(
    () => (userStats.unreadMessages || 0) + (userStats.unreadNotifications || 0) > 0,
    [userStats.unreadMessages, userStats.unreadNotifications]
  );

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
    setLoading(true);

    try {
      // Buyer + Seller chatovi (backend ne prihvata "all")
      const chatBuyerPromise = chatListApi.chatList({ type: "buyer", page: 1 });
      const chatSellerPromise = chatListApi.chatList({ type: "seller", page: 1 });

      const results = await Promise.allSettled([
        membershipApi.getUserMembership({}),
        chatBuyerPromise,
        chatSellerPromise,
        getNotificationList.getNotification({ page: 1 }),
        // Pošto getItem traži offset/limit, a nama treba total:
        // plus user_id da bude "moji oglasi" (ne svi oglasi).
        getMyItemsApi.getMyItems({ status: "approved", user_id: userData?.id, offset: 0, limit: 1 }),
      ]);

      const [membershipRes, chatBuyerRes, chatSellerRes, notifRes, adsRes] = results;

      // Membership
      let membershipTier = userData?.membership_tier || "free";
      if (membershipRes.status === "fulfilled") {
        const membershipData = getApiData(membershipRes.value);
        membershipTier = membershipData?.tier || membershipData?.membership_tier || membershipTier;
      }

      // Chat unread (sum unread_chat_count / unread_count)
      const computeUnreadFromChatRes = (settled) => {
        if (settled.status !== "fulfilled") return 0;
        const payload = getApiData(settled.value);
        const chats = extractList(payload);
        return chats.reduce((sum, chat) => {
          const v =
            chat?.unread_chat_count ??
            chat?.unread_count ??
            chat?.unread ??
            (chat?.is_read === 0 ? 1 : 0);
          return sum + (Number(v) || 0);
        }, 0);
      };

      const unreadMessages = computeUnreadFromChatRes(chatBuyerRes) + computeUnreadFromChatRes(chatSellerRes);

      // Notifications unread
      let unreadNotifications = 0;
      if (notifRes.status === "fulfilled") {
        const payload = getApiData(notifRes.value);
        const list = extractList(payload);
        unreadNotifications = list.filter((n) => !n?.read_at && !n?.is_read).length;
      }

      // Active ads count
      let activeAds = 0;
      if (adsRes.status === "fulfilled") {
        const payload = getApiData(adsRes.value);
        activeAds = extractTotal(payload) || payload?.total || 0;
      }

      // Total views + rating + verified (iz userData)
      const totalViews = userData?.total_views || userData?.profile_views || 0;
      const ratingRaw = userData?.rating || userData?.avg_rating || 0;
      const rating = Number.isFinite(Number(ratingRaw)) ? Number(ratingRaw).toFixed(1) : "0.0";
      const isVerified = userData?.is_verified === 1 || userData?.verified === true;

      setUserStats({
        activeAds,
        totalViews,
        unreadMessages,
        unreadNotifications,
        rating,
        membershipTier: String(membershipTier).toLowerCase(),
        isVerified,
      });
    } catch (e) {
      console.error("Error fetching user stats:", e);
    } finally {
      setLoading(false);
    }
  }, [userData]);

  // Fetch on mount / user change
  useEffect(() => {
    if (!userData) return;
    fetchAllData();
  }, [userData, fetchAllData]);

  // Optional: refresh counts when opening (da badge bude svjež)
  useEffect(() => {
    if (!isOpen) return;
    fetchAllData();
  }, [isOpen, fetchAllData]);

  // Header button (clean)
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors p-1"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Otvori profil meni"
      >
        <div className="relative">
          <CustomImage
            src={userData?.profile || placeholderImage}
            alt={userData?.name || "Profil"}
            width={32}
            height={32}
            className="rounded-full w-8 h-8 aspect-square object-cover border border-slate-200"
          />

          {userStats.isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
              <MdVerified className="text-white" size={10} />
            </div>
          )}

          {/* clean unread dot */}
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </div>
      </button>

      <SheetModal open={isOpen} onClose={() => setIsOpen(false)}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              {truncate(userData?.name || "Moj profil", 22)}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <MembershipBadge tier={userStats.membershipTier} size="xs" />
              {loading && <span className="text-[11px] text-slate-400">učitavam…</span>}
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Zatvori"
          >
            <IoClose size={22} className="text-slate-600" />
          </button>
        </div>

        <div className={["overflow-y-auto", isMobile ? "max-h-[calc(92vh-64px)]" : "max-h-[calc(80vh-64px)]"].join(" ")}>
          {/* User Card */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/60">
            <div className="flex items-center gap-3">
              <div className="relative">
                <CustomImage
                  src={userData?.profile || placeholderImage}
                  alt={userData?.name || "Profil"}
                  width={56}
                  height={56}
                  className="rounded-full w-14 h-14 aspect-square object-cover border-2 border-white shadow-sm"
                />
                {userStats.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <MdVerified className="text-white" size={14} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{userData?.name}</p>
                <p className="text-xs text-slate-500 truncate">{userData?.email}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 mt-4 bg-white rounded-xl p-3">
              <div className="text-center">
                <IoLayersOutline className="mx-auto text-blue-500" size={18} />
                <p className="text-sm font-bold text-slate-800">{userStats.activeAds}</p>
                <p className="text-[10px] text-slate-400">Oglasi</p>
              </div>
              <div className="text-center">
                <IoEyeOutline className="mx-auto text-green-500" size={18} />
                <p className="text-sm font-bold text-slate-800">{formatNumber(userStats.totalViews)}</p>
                <p className="text-[10px] text-slate-400">Pregledi</p>
              </div>
              <div className="text-center">
                <IoChatbubbleOutline className="mx-auto text-amber-500" size={18} />
                <p className="text-sm font-bold text-slate-800">{userStats.unreadMessages}</p>
                <p className="text-[10px] text-slate-400">Poruke</p>
              </div>
              <div className="text-center">
                <IoStarOutline className="mx-auto text-amber-500" size={18} />
                <p className="text-sm font-bold text-slate-800">{userStats.rating}</p>
                <p className="text-[10px] text-slate-400">Ocjena</p>
              </div>
            </div>
          </div>

          {/* Primary action */}
          <div className="p-4 border-b border-slate-100">
            <Link
              href="/ad-listing"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors w-full"
            >
              <IoAddCircleOutline size={18} />
              Dodaj oglas
            </Link>
          </div>

          {/* Menu */}
          <div className="p-2">
            <MenuSection title="Profil">
              <MenuItem icon={IoPersonOutline} label="Moj profil" onClick={() => handleNavigate("/profile")} />
              <MenuItem icon={IoSettingsOutline} label="Postavke" onClick={() => handleNavigate("/profile")} />
            </MenuSection>

            <div className="h-px bg-slate-100 mx-3" />

            <MenuSection title="Oglasi">
              <MenuItem
                icon={IoLayersOutline}
                label="Moji oglasi"
                onClick={() => handleNavigate("/my-ads")}
                badge={userStats.activeAds}
              />
              <MenuItem icon={IoHeartOutline} label="Favoriti" onClick={() => handleNavigate("/favorites")} />
              <MenuItem icon={IoStatsChartOutline} label="Statistika" onClick={() => handleNavigate("/my-ads")} isNew={isPro} />
            </MenuSection>

            <div className="h-px bg-slate-100 mx-3" />

            <MenuSection title="Finansije">
              <MenuItem icon={IoCardOutline} label="Pretplata" onClick={() => handleNavigate("/user-subscription")} />
              <MenuItem icon={IoReceiptOutline} label="Transakcije" onClick={() => handleNavigate("/transactions")} />
            </MenuSection>

            <div className="h-px bg-slate-100 mx-3" />

            <MenuSection title="Komunikacija">
              <MenuItem
                icon={IoChatbubbleOutline}
                label="Poruke"
                onClick={() => handleNavigate("/chat")}
                badge={userStats.unreadMessages}
              />
              <MenuItem
                icon={IoNotificationsOutline}
                label="Obavijesti"
                onClick={() => handleNavigate("/notifications")}
                badge={userStats.unreadNotifications}
              />
            </MenuSection>

            <div className="h-px bg-slate-100 mx-3" />

            <MenuSection title="Podrška">
              <MenuItem
                icon={IoBriefcaseOutline}
                label="Prijave za posao"
                onClick={() => window.open("https://poslovi.lmx.ba/", "_blank")}
                external
              />
              <MenuItem icon={IoHelpCircleOutline} label="Pomoć" onClick={() => handleNavigate("/contact-us")} />
            </MenuSection>

            <div className="h-px bg-slate-100 mx-3" />

            <MenuSection>
              <MenuItem icon={IoLogOutOutline} label="Odjavi se" onClick={handleLogout} danger />
            </MenuSection>
          </div>

          {/* Upgrade banner */}
          {userStats.membershipTier === "free" && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-t border-amber-100">
              <Link
                href="/membership/upgrade"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Crown className="text-white" size={16} />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-amber-800">Nadogradi na Pro</h5>
                  <p className="text-xs text-amber-600">Napredna statistika i više</p>
                </div>
                <IoChevronForward className="text-amber-400 group-hover:translate-x-1 transition-transform" size={18} />
              </Link>
            </div>
          )}
        </div>
      </SheetModal>
    </div>
  );
};

export default ProfileDropdown;
