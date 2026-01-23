"use client";
import { t } from "@/utils";
import CustomLink from "@/components/Common/CustomLink";
import { usePathname } from "next/navigation";
import { BiChat, BiDollarCircle, BiReceipt, BiTrashAlt, BiShoppingBag } from "react-icons/bi";
import { FiUser } from "react-icons/fi";
import { IoMdNotificationsOutline } from "react-icons/io";
import { LiaAdSolid } from "react-icons/lia";
import { LuHeart } from "react-icons/lu";
import { MdOutlineRateReview, MdWorkOutline } from "react-icons/md";
import { RiLogoutCircleLine } from "react-icons/ri";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import FirebaseData from "@/utils/Firebase";
import { logoutSuccess, userSignUpData } from "@/redux/reducer/authSlice";
import { toast } from "sonner";
import { useState } from "react";
import { deleteUserApi, logoutApi } from "@/utils/api";
import { deleteUser, getAuth } from "firebase/auth";
import ReusableAlertDialog from "../Common/ReusableAlertDialog";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { useSelector } from "react-redux";
import { useNavigate } from "../Common/useNavigate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HiOutlineBadgeCheck } from "react-icons/hi";

const ProfileNavigation = () => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const userData = useSelector(userSignUpData);
  const [IsLogout, setIsLogout] = useState(false);
  const [IsDeleting, setIsDeleting] = useState(false);
  const [IsDeleteAccount, setIsDeleteAccount] = useState(false);
  const [IsLoggingOut, setIsLoggingOut] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { signOut } = FirebaseData();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      const res = await logoutApi.logoutApi({
        ...(userData?.fcm_id && { fcm_token: userData?.fcm_id }),
      });
      if (res?.data?.error === false) {
        logoutSuccess();
        toast.success(t("signOutSuccess"));
        setIsLogout(false);
        if (pathname !== "/") {
          navigate("/");
        }
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.log("Failed to logout", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAcc = async () => {
    try {
      setIsDeleting(true);
      const auth = getAuth();
      const user = auth.currentUser;
      await deleteUser(user);
      await deleteUserApi.deleteUser();
      logoutSuccess();
      toast.success(t("userDeleteSuccess"));
      setIsDeleteAccount(false);
      if (pathname !== "/") {
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting user:", error.message);
      if (error.code === "auth/requires-recent-login") {
        logoutSuccess();
        toast.error(t("deletePop"));
        setIsDeleteAccount(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getLinkClass = (path, isMobile = false) => {
    const isActive = pathname === path;
    if (isMobile) {
      return `flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all duration-200 ${
        isActive
          ? "text-[#00B8D4]"
          : "text-gray-500"
      }`;
    }
    return `flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap ${
      isActive
        ? "bg-[#00B8D4] text-white shadow-sm"
        : "text-gray-600 hover:bg-gray-100"
    }`;
  };

  // Glavne stavke za mobile bottom nav (5 najvažnijih)
  const mainNavigationLinks = [
    { href: "/profile", icon: FiUser, label: "Profil" },
    { href: "/chat", icon: BiChat, label: "Chat" },
    { href: "/my-ads", icon: LiaAdSolid, label: "Oglasi" },
    { href: "/favorites", icon: LuHeart, label: "Omiljeni" },
  ];

// Ostale stavke za "More" dropdown
const moreNavigationLinks = [
  { href: "/notifications", icon: IoMdNotificationsOutline, label: t("notifications") },
  { href: "/user-subscription", icon: BiDollarCircle, label: t("subscription") },
  { href: "/purchases", icon: BiShoppingBag, label: t("myPurchases") },
  { href: "/profile/badges", icon: HiOutlineBadgeCheck, label: t("badges") },
  { href: "/transactions", icon: BiReceipt, label: t("transaction") },
  { href: "/reviews", icon: MdOutlineRateReview, label: t("myReviews") },
  { href: "/job-applications", icon: MdWorkOutline, label: t("jobApplications") },
];


  // Sve stavke za desktop
  const allNavigationLinks = [
    { href: "/profile", icon: FiUser, label: t("profile") },
    { href: "/notifications", icon: IoMdNotificationsOutline, label: t("notifications") },
    { href: "/chat", icon: BiChat, label: t("chat") },
    { href: "/user-subscription", icon: BiDollarCircle, label: t("subscription") },
    { href: "/my-ads", icon: LiaAdSolid, label: t("myAds") },
    { href: "/purchases", icon: BiShoppingBag, label: t("myPurchases") },
    { href: "/profile/badges", icon: HiOutlineBadgeCheck, label: t("badges") },
    { href: "/favorites", icon: LuHeart, label: t("favorites") },
    { href: "/transactions", icon: BiReceipt, label: t("transaction") },
    { href: "/reviews", icon: MdOutlineRateReview, label: t("myReviews") },
    { href: "/job-applications", icon: MdWorkOutline, label: t("jobApplications") },
  ];

  const isInMoreMenu = moreNavigationLinks.some(link => link.href === pathname);

  return (
    <>
      {/* Desktop: User Header + Navigation */}
      <div className="hidden sm:block">
        {/* User Header Card */}
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#00B8D4] to-[#0097A7] flex items-center justify-center text-white overflow-hidden shadow-sm shrink-0">
                {userData?.profile_image ? (
                  <img src={userData.profile_image} alt="User" className="h-full w-full object-cover" />
                ) : (
                  <FiUser size={20} />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {userData?.name || "Korisnik"}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {userData?.email || userData?.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLogout(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                title={t("signOut")}
              >
                <RiLogoutCircleLine size={18} />
                <span className="hidden lg:inline">{t("signOut")}</span>
              </button>
              <button
                onClick={() => setIsDeleteAccount(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                title={t("deleteAccount")}
              >
                <BiTrashAlt size={18} />
                <span className="hidden lg:inline">{t("deleteAccount")}</span>
              </button>
            </div>
          </div>
        </div>

{/* Desktop Navigation */}
<div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 mb-6">

          <div className="p-4 flex gap-2 overflow-x-auto scrollbar-hide">
            {allNavigationLinks.map((link) => {
              const Icon = link.icon;
              return (
                <CustomLink key={link.href} href={link.href} className={getLinkClass(link.href)}>
                  <Icon size={18} className="shrink-0" />
                  <span>{link.label}</span>
                </CustomLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Samo User Header (sticky navigation je na dnu) */}
      <div className="sm:hidden">
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00B8D4] to-[#0097A7] flex items-center justify-center text-white overflow-hidden shadow-sm shrink-0">
              {userData?.profile_image ? (
                <img src={userData.profile_image} alt="User" className="h-full w-full object-cover" />
              ) : (
                <FiUser size={18} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {userData?.name || "Korisnik"}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {userData?.email || userData?.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Sticky Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg pb-safe">
        <div className="grid grid-cols-5 gap-0">
          {mainNavigationLinks.map((link) => {
            const Icon = link.icon;
            return (
              <CustomLink key={link.href} href={link.href} className={getLinkClass(link.href, true)}>
                <Icon size={22} className="shrink-0" />
                <span className="text-[10px] font-medium leading-none">{link.label}</span>
              </CustomLink>
            );
          })}

          {/* More Menu */}
          <DropdownMenu open={showMoreMenu} onOpenChange={setShowMoreMenu}>
            <DropdownMenuTrigger asChild>
              <button className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all duration-200 ${
                isInMoreMenu ? "text-[#00B8D4]" : "text-gray-500"
              }`}>
                <HiOutlineDotsHorizontal size={22} className="shrink-0" />
                <span className="text-[10px] font-medium leading-none">Više</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
              {moreNavigationLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <DropdownMenuItem
                    key={link.href}
                    onClick={() => {
                      navigate(link.href);
                      setShowMoreMenu(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer ${
                      isActive ? "bg-[#00B8D4]/10 text-[#00B8D4]" : ""
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{link.label}</span>
                  </DropdownMenuItem>
                );
              })}
              <div className="border-t border-gray-100 my-1"></div>
              <DropdownMenuItem
                onClick={() => {
                  setIsLogout(true);
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-gray-600"
              >
                <RiLogoutCircleLine size={18} />
                <span className="text-sm font-medium">{t("signOut")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setIsDeleteAccount(true);
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-red-500"
              >
                <BiTrashAlt size={18} />
                <span className="text-sm font-medium">{t("deleteAccount")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Spacer za mobile sticky bottom nav */}
      <div className="sm:hidden h-16"></div>

      {/* Dialogs */}
      <ReusableAlertDialog
        open={IsLogout}
        onCancel={() => setIsLogout(false)}
        onConfirm={handleLogout}
        title={t("confirmLogout")}
        description={t("areYouSureToLogout")}
        cancelText={t("cancel")}
        confirmText={t("yes")}
        confirmDisabled={IsLoggingOut}
      />

      <ReusableAlertDialog
        open={IsDeleteAccount}
        onCancel={() => setIsDeleteAccount(false)}
        onConfirm={handleDeleteAcc}
        title={t("areYouSure")}
        description={
          <div className="bg-red-50 p-3 rounded-lg border border-red-100">
            <p className="text-red-800 text-sm font-semibold mb-2">{t("warning")}:</p>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
              <li>{t("adsAndTransactionWillBeDeleted")}</li>
              <li>{t("accountsDetailsWillNotRecovered")}</li>
              <li>{t("subWillBeCancelled")}</li>
              <li>{t("savedMesgWillBeLost")}</li>
            </ul>
          </div>
        }
        cancelText={t("cancel")}
        confirmText={t("yes")}
        confirmDisabled={IsDeleting}
      />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  );
};

export default ProfileNavigation;