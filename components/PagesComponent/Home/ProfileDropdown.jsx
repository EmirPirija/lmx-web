"use client";
 
import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { settingsData } from "@/redux/reducer/settingSlice";
import { membershipApi, chatListApi, getNotificationList, getMyItemsApi } from "@/utils/api";
import { truncate } from "@/utils";
import { useMediaQuery } from "usehooks-ts";
import CustomImage from "@/components/Common/CustomImage";
import { useNavigate } from "@/components/Common/useNavigate";
import Link from "next/link";
 
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
import { Crown, Store, Sparkles } from "lucide-react";
import { FaAngleDown } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
 
// ============================================
// HELPER
// ============================================
const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
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
 
  const config = configs[tier?.toLowerCase()] || configs.pro;
  const Icon = config.icon;
  const sizeClasses = { xs: "text-[10px] px-1.5 py-0.5", sm: "text-xs px-2 py-0.5" };
 
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${config.bg} ${config.text} ${sizeClasses[size]}`}>
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
    >
      <Icon size={18} className={danger ? "text-red-500" : "text-slate-400"} />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {badge > 0 && (
        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {isNew && <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded">NOVO</span>}
      {external && <IoChevronForward size={14} className="text-slate-300" />}
    </div>
  );
 
  if (href && !onClick) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
};
 
// ============================================
// MENU SECTION
// ============================================
const MenuSection = ({ title, children }) => (
  <div className="py-2">
    {title && <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</p>}
    {children}
  </div>
);
 
// ============================================
// GLAVNA KOMPONENTA
// ============================================
const ProfileDropdown = ({ IsLogout, setIsLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { navigate } = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
 
  const userData = useSelector(userSignUpData);
  const settings = useSelector(settingsData);
  const placeholderImage = settings?.placeholder_image;
 
  // State za prave podatke
  const [userStats, setUserStats] = useState({
    activeAds: 0,
    totalViews: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
    rating: 0,
    membershipTier: "free",
    isVerified: false,
  });
  const [loading, setLoading] = useState(true);
 
  // Dohvati sve podatke
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
 
      try {
        // Paralelni API pozivi
        const [membershipRes, chatRes, notifRes, adsRes] = await Promise.allSettled([
          membershipApi.getUserMembership({}),
          chatListApi.chatList({ type: "all", page: 1 }),
          getNotificationList.getNotification({ page: 1 }),
          getMyItemsApi.getMyItems({ status: "approved", page: 1 }),
        ]);
 
        // Membership
        let membershipTier = userData?.membership_tier || "free";
        if (membershipRes.status === "fulfilled" && membershipRes.value?.data?.data) {
          const data = membershipRes.value.data.data;
          membershipTier = data?.tier?.slug || data?.membership_tier || "free";
        }
 
        // Unread messages - broji chats sa unread > 0
        let unreadMessages = 0;
        if (chatRes.status === "fulfilled" && chatRes.value?.data?.data?.data) {
          const chats = chatRes.value.data.data.data;
          unreadMessages = chats.filter((chat) => chat.unread_count > 0 || chat.unread > 0).length;
        }
 
        // Unread notifications
        let unreadNotifications = 0;
        if (notifRes.status === "fulfilled" && notifRes.value?.data?.data) {
          const notifs = notifRes.value.data.data.data || notifRes.value.data.data;
          if (Array.isArray(notifs)) {
            unreadNotifications = notifs.filter((n) => !n.read_at && !n.is_read).length;
          }
        }
 
        // Active ads count
        let activeAds = 0;
        if (adsRes.status === "fulfilled" && adsRes.value?.data?.data) {
          activeAds = adsRes.value.data.data.total || 0;
        }
 
        // Total views - iz userData ako postoji
        const totalViews = userData?.total_views || userData?.profile_views || 0;
 
        // Rating
        const rating = userData?.rating || userData?.avg_rating || 0;
 
        // Verified status
        const isVerified = userData?.is_verified === 1 || userData?.verified === true;
 
        setUserStats({
          activeAds,
          totalViews,
          unreadMessages,
          unreadNotifications,
          rating: parseFloat(rating).toFixed(1),
          membershipTier: membershipTier.toLowerCase(),
          isVerified,
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };
 
    if (userData) {
      fetchAllData();
    }
  }, [userData]);
 
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 
  // Close on escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);
 
  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };
 
  const handleLogout = () => {
    setIsOpen(false);
    setIsLogout(true);
  };
 
  const isPro = userStats.membershipTier === "pro" || userStats.membershipTier === "shop";
 
  // ============================================
  // MOBILE FULL SCREEN
  // ============================================
  if (isMobile && isOpen) {
    return (
      <>
        <button onClick={() => setIsOpen(true)} className="flex items-center gap-1">
          <CustomImage src={userData?.profile || placeholderImage} alt={userData?.name} width={32} height={32} className="rounded-full w-8 h-8 aspect-square object-cover border-2 border-slate-200" />
        </button>
 
        <div className="fixed inset-0 z-50 bg-white animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Moj profil</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <IoClose size={24} className="text-slate-500" />
            </button>
          </div>
 
          <div className="overflow-y-auto h-[calc(100vh-64px)]">
            {/* User Card */}
            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <CustomImage src={userData?.profile || placeholderImage} alt={userData?.name} width={64} height={64} className="rounded-full w-16 h-16 aspect-square object-cover border-3 border-white shadow-md" />
                  {userStats.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                      <MdVerified className="text-white" size={14} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-lg">{userData?.name}</h3>
                    <MembershipBadge tier={userStats.membershipTier} size="sm" />
                  </div>
                  <p className="text-sm text-slate-500">{userData?.email}</p>
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
 
            {/* Quick Actions */}
            <div className="p-4 border-b border-slate-100">
              <Link href="/ad-listing" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors w-full">
                <IoAddCircleOutline size={18} />
                Dodaj oglas
              </Link>
            </div>
 
            {/* Menu Items */}
            <div className="p-2">
              <MenuSection title="Profil">
                <MenuItem icon={IoPersonOutline} label="Moj profil" onClick={() => handleNavigate("/profile")} />
                <MenuItem icon={IoSettingsOutline} label="Postavke" onClick={() => handleNavigate("/profile")} />
              </MenuSection>
 
              <MenuSection title="Oglasi">
                <MenuItem icon={IoLayersOutline} label="Moji oglasi" onClick={() => handleNavigate("/my-ads")} badge={userStats.activeAds} />
                <MenuItem icon={IoHeartOutline} label="Favoriti" onClick={() => handleNavigate("/favorites")} />
                <MenuItem icon={IoStatsChartOutline} label="Statistika" onClick={() => handleNavigate("/my-ads")} isNew={isPro} />
              </MenuSection>
 
              <MenuSection title="Finansije">
                <MenuItem icon={IoCardOutline} label="Pretplata" onClick={() => handleNavigate("/user-subscription")} />
                <MenuItem icon={IoReceiptOutline} label="Transakcije" onClick={() => handleNavigate("/transactions")} />
              </MenuSection>
 
              <MenuSection title="Podrška">
                <MenuItem icon={IoChatbubbleOutline} label="Poruke" onClick={() => handleNavigate("/chat")} badge={userStats.unreadMessages} />
                <MenuItem icon={IoNotificationsOutline} label="Obavijesti" onClick={() => handleNavigate("/notifications")} badge={userStats.unreadNotifications} />
                <MenuItem icon={IoBriefcaseOutline} label="Prijave za posao" onClick={() => window.open("https://poslovi.lmx.ba/", "_blank")} external />
                <MenuItem icon={IoHelpCircleOutline} label="Pomoć" onClick={() => handleNavigate("/contact-us")} />
              </MenuSection>
 
              <MenuSection>
                <MenuItem icon={IoLogOutOutline} label="Odjavi se" onClick={handleLogout} danger />
              </MenuSection>
            </div>
 
            {/* Upgrade Banner */}
            {userStats.membershipTier === "free" && (
              <div className="p-4">
                <Link href="/membership/upgrade" onClick={() => setIsOpen(false)} className="block p-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Crown size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">Nadogradi na Pro</h4>
                      <p className="text-sm text-white/80">Otključaj naprednu statistiku</p>
                    </div>
                    <IoChevronForward size={20} />
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
 
  // ============================================
  // DESKTOP DROPDOWN
  // ============================================
  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-slate-100 transition-colors">
        <div className="relative">
          <CustomImage src={userData?.profile || placeholderImage} alt={userData?.name} width={32} height={32} className="rounded-full w-8 h-8 aspect-square object-cover border-2 border-slate-200" />
          {userStats.isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
              <MdVerified className="text-white" size={10} />
            </div>
          )}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-slate-700 leading-tight max-w-[100px] truncate">{truncate(userData?.name, 12)}</p>
          {userStats.membershipTier !== "free" && <MembershipBadge tier={userStats.membershipTier} size="xs" />}
        </div>
        <FaAngleDown className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} size={12} />
      </button>
 
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[320px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          {/* User Header */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <CustomImage src={userData?.profile || placeholderImage} alt={userData?.name} width={48} height={48} className="rounded-full w-12 h-12 aspect-square object-cover border-2 border-white shadow-sm" />
                {userStats.isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <MdVerified className="text-white" size={12} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-800 truncate">{userData?.name}</h4>
                  <MembershipBadge tier={userStats.membershipTier} size="sm" />
                </div>
                <p className="text-xs text-slate-500 truncate">{userData?.email}</p>
              </div>
            </div>
 
            {/* Quick Stats Bar */}
            <div className="flex items-center justify-between mt-3 p-2 bg-white rounded-xl text-xs">
              <div className="flex items-center gap-1.5">
                <IoLayersOutline className="text-blue-500" size={14} />
                <span className="font-semibold text-slate-700">{userStats.activeAds}</span>
                <span className="text-slate-400">oglasa</span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <IoEyeOutline className="text-green-500" size={14} />
                <span className="font-semibold text-slate-700">{formatNumber(userStats.totalViews)}</span>
                <span className="text-slate-400">pregleda</span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <IoStarOutline className="text-amber-500" size={14} />
                <span className="font-semibold text-slate-700">{userStats.rating}</span>
              </div>
            </div>
          </div>
 
          {/* Quick Action */}
          <div className="p-3 border-b border-slate-100">
            <Link href="/ad-listing" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-1.5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-full">
              <IoAddCircleOutline size={16} />
              Dodaj oglas
            </Link>
          </div>
 
          {/* Menu */}
          <div className="max-h-[360px] overflow-y-auto">
            <MenuSection title="Profil">
              <MenuItem icon={IoPersonOutline} label="Moj profil" onClick={() => handleNavigate("/profile")} />
              <MenuItem icon={IoSettingsOutline} label="Postavke" onClick={() => handleNavigate("/profile")} />
            </MenuSection>
 
            <div className="h-px bg-slate-100 mx-3" />
 
            <MenuSection title="Oglasi">
              <MenuItem icon={IoLayersOutline} label="Moji oglasi" onClick={() => handleNavigate("/my-ads")} badge={userStats.activeAds} />
              <MenuItem icon={IoHeartOutline} label="Favoriti" onClick={() => handleNavigate("/favorites")} />
              <MenuItem icon={IoStatsChartOutline} label="Statistika" onClick={() => handleNavigate("/my-ads")} isNew={isPro} />
            </MenuSection>
 
            <div className="h-px bg-slate-100 mx-3" />
 
            <MenuSection title="Finansije">
              <MenuItem icon={IoCardOutline} label="Pretplata" onClick={() => handleNavigate("/user-subscription")} />
              <MenuItem icon={IoReceiptOutline} label="Transakcije" onClick={() => handleNavigate("/transactions")} />
            </MenuSection>
 
            <div className="h-px bg-slate-100 mx-3" />
 
            <MenuSection title="Podrška">
              <MenuItem icon={IoChatbubbleOutline} label="Poruke" onClick={() => handleNavigate("/chat")} badge={userStats.unreadMessages} />
              <MenuItem icon={IoNotificationsOutline} label="Obavijesti" onClick={() => handleNavigate("/notifications")} badge={userStats.unreadNotifications} />
              <MenuItem icon={IoBriefcaseOutline} label="Prijave za posao" onClick={() => window.open("https://poslovi.lmx.ba/", "_blank")} external />
            </MenuSection>
 
            <div className="h-px bg-slate-100 mx-3" />
 
            <MenuSection>
              <MenuItem icon={IoLogOutOutline} label="Odjavi se" onClick={handleLogout} danger />
            </MenuSection>
          </div>
 
          {/* Upgrade Banner */}
          {userStats.membershipTier === "free" && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-t border-amber-100">
              <Link href="/membership/upgrade" onClick={() => setIsOpen(false)} className="flex items-center gap-3 group">
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
      )}
    </div>
  );
};
 
export default ProfileDropdown;