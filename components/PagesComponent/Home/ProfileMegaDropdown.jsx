"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import {
  chatListApi,
  getNotificationList,
  getMyItemsApi,
  membershipApi,
  getMyReviewsApi,
} from "@/utils/api";
import { truncate } from "@/utils";
import { useMediaQuery } from "usehooks-ts";
import CustomImage from "@/components/Common/CustomImage";
import { useNavigate } from "@/components/Common/useNavigate";
import Link from "next/link";

// Icons
import { FiUser, FiSettings, FiHelpCircle, FiLogOut } from "react-icons/fi";
import {
  IoMdNotificationsOutline,
  IoMdCheckmarkCircleOutline,
} from "react-icons/io";
import {
  BiChat,
  BiDollarCircle,
  BiReceipt,
  BiPlus,
  BiStore,
} from "react-icons/bi";
import { LiaAdSolid } from "react-icons/lia";
import { LuHeart, LuShield, LuBadgeCheck } from "react-icons/lu";
import {
  MdOutlineRateReview,
  MdWorkOutline,
  MdVerified,
  MdOutlineStarRate,
} from "react-icons/md";
import { RiLogoutCircleLine, RiVipCrownLine } from "react-icons/ri";
import {
  FaAngleDown,
  FaAngleRight,
  FaCrown,
  FaStore,
  FaStar,
} from "react-icons/fa";
import {
  IoEyeOutline,
  IoChevronDown,
  IoChevronUp,
  IoCloseOutline,
  IoSettingsOutline,
  IoStatsChartOutline,
} from "react-icons/io5";
import { HiOutlineSparkles, HiOutlineBadgeCheck } from "react-icons/hi";

// ============================================
// HELPER FUNKCIJE
// ============================================
const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// ============================================
// KOMPONENTE - Stat Item
// ============================================
const StatItem = ({ icon: Icon, label, value, color = "blue" }) => {
  const colorClasses = {
    blue: "text-blue-500",
    green: "text-green-500",
    red: "text-red-500",
    purple: "text-purple-500",
    amber: "text-amber-500",
  };

  return (
    <div className="flex flex-col items-center p-2">
      <Icon className={colorClasses[color]} size={18} />
      <span className="text-lg font-bold text-slate-800 mt-1">
        {formatNumber(value)}
      </span>
      <span className="text-[10px] text-slate-500 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
};

// ============================================
// KOMPONENTE - Menu Item
// ============================================
const MenuItem = ({
  icon: Icon,
  label,
  href,
  onClick,
  badge,
  badgeColor = "blue",
  external = false,
}) => {
  const { navigate } = useNavigate();

  const badgeColors = {
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (external) {
      window.open(href, "_blank");
    } else if (href) {
      navigate(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
        <Icon size={16} className="text-slate-600" />
      </div>
      <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
      {badge !== undefined && (
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColors[badgeColor]}`}
        >
          {badge}
        </span>
      )}
      <FaAngleRight size={12} className="text-slate-300" />
    </button>
  );
};

// ============================================
// KOMPONENTE - Section Header
// ============================================
const SectionHeader = ({ title }) => (
  <div className="px-3 pt-3 pb-1">
    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
      {title}
    </span>
  </div>
);

// ============================================
// KOMPONENTE - Membership Badge
// ============================================
const MembershipBadge = ({ tier, expiresAt }) => {
  const tierConfig = {
    free: {
      label: "Besplatno",
      icon: null,
      bgColor: "bg-slate-100",
      textColor: "text-slate-600",
      borderColor: "border-slate-200",
    },
    pro: {
      label: "Pro",
      icon: FaCrown,
      bgColor: "bg-gradient-to-r from-amber-400 to-orange-500",
      textColor: "text-white",
      borderColor: "border-amber-300",
    },
    shop: {
      label: "Shop",
      icon: FaStore,
      bgColor: "bg-gradient-to-r from-purple-500 to-indigo-600",
      textColor: "text-white",
      borderColor: "border-purple-300",
    },
  };

  const config = tierConfig[tier] || tierConfig.free;
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor} ${config.borderColor} border`}
    >
      {Icon && <Icon size={12} />}
      <span className="text-xs font-semibold">{config.label}</span>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ProfileMegaDropdown = ({ IsLogout, setIsLogout }) => {
  const { navigate } = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const UserData = useSelector(userSignUpData);
  const dropdownRef = useRef(null);

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    activeAds: 0,
    totalViews: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [membershipTier, setMembershipTier] = useState("free");
  const [membershipExpires, setMembershipExpires] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch user stats when dropdown opens
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!isOpen || !UserData?.id) return;

      setLoading(true);

      try {
        // Fetch all data in parallel
        const [membershipRes, chatsRes, notificationsRes, adsRes, reviewsRes] =
          await Promise.allSettled([
            membershipApi.getUserMembership({}),
            chatListApi.chatList({ page: 1 }),
            getNotificationList.getNotification({ page: 1 }),
            getMyItemsApi.getMyItems({ status: "approved", page: 1 }),
            getMyReviewsApi.getMyReviews({ page: 1 }),
          ]);

        // Process membership
        if (membershipRes.status === "fulfilled") {
          const membershipData = membershipRes.value?.data?.data;
          if (membershipData) {
            const tier =
              membershipData.tier?.toLowerCase() ||
              (membershipData.is_shop
                ? "shop"
                : membershipData.is_pro
                ? "pro"
                : "free");
            setMembershipTier(tier);
            setMembershipExpires(membershipData.expires_at);
          }
        }

        // Process stats
        let unreadMessages = 0;
        let unreadNotifications = 0;
        let activeAds = 0;
        let totalViews = 0;
        let averageRating = 0;
        let totalReviews = 0;

        if (chatsRes.status === "fulfilled") {
          const chats = chatsRes.value?.data?.data?.data || [];
          unreadMessages = chats.filter((c) => c.unread_count > 0).length;
        }

        if (notificationsRes.status === "fulfilled") {
          const notifications = notificationsRes.value?.data?.data?.data || [];
          unreadNotifications = notifications.filter((n) => !n.read_at).length;
        }

        if (adsRes.status === "fulfilled") {
          const adsData = adsRes.value?.data?.data;
          activeAds = adsData?.total || 0;
          // Sum up total views from all items
          const items = adsData?.data || [];
          totalViews = items.reduce(
            (sum, item) => sum + (item.clicks || item.views || 0),
            0
          );
        }

        if (reviewsRes.status === "fulfilled") {
          const reviewsData = reviewsRes.value?.data?.data;
          totalReviews = reviewsData?.total || 0;
          averageRating = UserData?.average_rating || reviewsData?.average || 0;
        }

        setUserStats({
          activeAds,
          totalViews,
          unreadMessages,
          unreadNotifications,
          averageRating: parseFloat(averageRating || 0).toFixed(1),
          totalReviews,
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [isOpen, UserData?.id]);

  // Handle logout
  const handleLogout = () => {
    setIsOpen(false);
    setIsLogout(true);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Dropdown content
  const DropdownContent = () => (
    <div className="w-full max-h-[80vh] overflow-y-auto">
      {/* User Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <CustomImage
            src={UserData?.profile}
            alt={UserData?.name}
            width={56}
            height={56}
            className="rounded-xl w-14 h-14 aspect-square object-cover border-2 border-slate-100"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 truncate">
                {truncate(UserData?.name, 20)}
              </h3>
              {UserData?.is_verified && (
                <MdVerified className="text-blue-500 flex-shrink-0" size={16} />
              )}
            </div>
            <p className="text-xs text-slate-500 truncate">{UserData?.email}</p>
            <div className="mt-2">
              <MembershipBadge
                tier={membershipTier}
                expiresAt={membershipExpires}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-1 mt-4 bg-slate-50 rounded-xl p-2">
          <StatItem
            icon={LiaAdSolid}
            label="Oglasi"
            value={userStats.activeAds}
            color="blue"
          />
          <StatItem
            icon={IoEyeOutline}
            label="Pregledi"
            value={userStats.totalViews}
            color="green"
          />
          <StatItem
            icon={BiChat}
            label="Poruke"
            value={userStats.unreadMessages}
            color="purple"
          />
          <StatItem
            icon={FaStar}
            label="Ocjena"
            value={userStats.averageRating}
            color="amber"
          />
        </div>
      </div>

      {/* Quick Action */}
      <div className="p-3">
        <Link
          href="/add-listing"
          onClick={() => setIsOpen(false)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          <BiPlus size={20} />
          Dodaj novi oglas
        </Link>
      </div>

      {/* Menu Sections */}
      <div className="px-1 pb-4">
        {/* Moj Profil */}
        <SectionHeader title="Moj profil" />
        <MenuItem
          icon={FiUser}
          label="Pregled profila"
          href="/profile"
          onClick={() => setIsOpen(false)}
        />
        <MenuItem
          icon={IoSettingsOutline}
          label="Postavke"
          href="/profile/settings"
          onClick={() => setIsOpen(false)}
        />
        {membershipTier !== "shop" && (
          <MenuItem
            icon={RiVipCrownLine}
            label="Nadogradi na Pro/Shop"
            href="/user-subscription"
            onClick={() => setIsOpen(false)}
            badge={membershipTier === "free" ? "Preporučeno" : null}
            badgeColor="amber"
          />
        )}

        {/* Oglasi */}
        <SectionHeader title="Oglasi" />
        <MenuItem
          icon={LiaAdSolid}
          label="Moji oglasi"
          href="/my-ads"
          onClick={() => setIsOpen(false)}
          badge={userStats.activeAds > 0 ? userStats.activeAds : null}
          badgeColor="blue"
        />
        <MenuItem
          icon={LuHeart}
          label="Favoriti"
          href="/favorites"
          onClick={() => setIsOpen(false)}
        />
        <MenuItem
          icon={IoStatsChartOutline}
          label="Statistika oglasa"
          href="/my-ads?tab=statistics"
          onClick={() => setIsOpen(false)}
        />

        {/* Komunikacija */}
        <SectionHeader title="Komunikacija" />
        <MenuItem
          icon={BiChat}
          label="Poruke"
          href="/chat"
          onClick={() => setIsOpen(false)}
          badge={userStats.unreadMessages > 0 ? userStats.unreadMessages : null}
          badgeColor="red"
        />
        <MenuItem
          icon={IoMdNotificationsOutline}
          label="Obavještenja"
          href="/notifications"
          onClick={() => setIsOpen(false)}
          badge={
            userStats.unreadNotifications > 0
              ? userStats.unreadNotifications
              : null
          }
          badgeColor="red"
        />

        {/* Recenzije i Kupovina */}
        <SectionHeader title="Recenzije i transakcije" />
        <MenuItem
          icon={MdOutlineRateReview}
          label="Moje recenzije"
          href="/reviews"
          onClick={() => setIsOpen(false)}
          badge={userStats.totalReviews > 0 ? userStats.totalReviews : null}
          badgeColor="amber"
        />
        <MenuItem
          icon={BiDollarCircle}
          label="Pretplate"
          href="/user-subscription"
          onClick={() => setIsOpen(false)}
        />
        <MenuItem
          icon={BiReceipt}
          label="Transakcije"
          href="/transactions"
          onClick={() => setIsOpen(false)}
        />

        {/* Dodatno */}
        <SectionHeader title="Dodatno" />
        <MenuItem
          icon={MdWorkOutline}
          label="Poslovi"
          href="https://poslovi.lmx.ba/"
          onClick={() => setIsOpen(false)}
          external
        />
        <MenuItem
          icon={FiHelpCircle}
          label="Pomoć"
          href="/help"
          onClick={() => setIsOpen(false)}
        />

        {/* Logout */}
        <div className="mt-4 px-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
          >
            <FiLogOut size={16} />
            Odjava
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile Modal
  if (isMobile) {
    return (
      <>
        {/* Trigger Button */}
        <button
          onClick={toggleDropdown}
          className="flex items-center gap-1.5 p-1"
        >
          <CustomImage
            src={UserData?.profile}
            alt={UserData?.name}
            width={32}
            height={32}
            className="rounded-full w-8 h-8 aspect-square object-cover border"
          />
          <FaAngleDown
            className={`text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            size={12}
          />
        </button>

        {/* Mobile Modal Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[90vh]">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-slate-200 rounded-full" />
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <IoCloseOutline size={24} className="text-slate-500" />
              </button>

              <DropdownContent />
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop Dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors"
      >
        <CustomImage
          src={UserData?.profile}
          alt={UserData?.name}
          width={32}
          height={32}
          className="rounded-full w-8 h-8 aspect-square object-cover border"
        />
        <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate hidden lg:block">
          {truncate(UserData?.name, 12)}
        </span>
        <FaAngleDown
          className={`text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          size={12}
        />
      </button>

      {/* Desktop Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          <DropdownContent />
        </div>
      )}
    </div>
  );
};

export default ProfileMegaDropdown;
