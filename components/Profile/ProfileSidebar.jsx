"use client";
import { t } from "@/utils";
import CustomLink from "@/components/Common/CustomLink";
import { usePathname } from "next/navigation";
import { BiChat, BiDollarCircle, BiReceipt, BiTrashAlt } from "react-icons/bi";
import { FiUser } from "react-icons/fi";
import { IoMdNotificationsOutline } from "react-icons/io";
import { LiaAdSolid } from "react-icons/lia";
import { LuHeart } from "react-icons/lu";
import { MdOutlineRateReview, MdWorkOutline } from "react-icons/md";
import { RiLogoutCircleLine } from "react-icons/ri";
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

const ProfileSidebar = () => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const userData = useSelector(userSignUpData);
  const [IsLogout, setIsLogout] = useState(false);
  const [IsDeleting, setIsDeleting] = useState(false);
  const [IsDeleteAccount, setIsDeleteAccount] = useState(false);
  const [IsLoggingOut, setIsLoggingOut] = useState(false);
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

  const getLinkClass = (path) => {
    const isActive = pathname === path;
    return `group flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 ${
      isActive
        ? "bg-[#00B8D4] text-white shadow-sm"
        : "text-gray-700 hover:bg-gray-50 hover:shadow-sm"
    }`;
  };

  const navigationLinks = [
    { href: "/profile", icon: FiUser, label: t("profile") },
    { href: "/notifications", icon: IoMdNotificationsOutline, label: t("notifications") },
    { href: "/chat", icon: BiChat, label: t("chat") },
    { href: "/user-subscription", icon: BiDollarCircle, label: t("subscription") },
    { href: "/my-ads", icon: LiaAdSolid, label: t("myAds") },
    { href: "/favorites", icon: LuHeart, label: t("favorites") },
    { href: "/transactions", icon: BiReceipt, label: t("transaction") },
    { href: "/reviews", icon: MdOutlineRateReview, label: t("myReviews") },
    { href: "/job-applications", icon: MdWorkOutline, label: t("jobApplications") },
  ];

  return (
    <aside className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200">
      {/* User Header - Kompaktan dizajn */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#00B8D4] to-[#0097A7] flex items-center justify-center text-white overflow-hidden shrink-0 shadow-sm">
            {userData?.profile_image ? (
              <img 
                src={userData.profile_image} 
                alt="User" 
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <FiUser size={20} />
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {userData?.name || "Korisnik"}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {userData?.email || userData?.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - Sve na vrhu, kompaktno */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <div className="space-y-0.5">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            return (
              <CustomLink 
                key={link.href} 
                href={link.href} 
                className={getLinkClass(link.href)}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{link.label}</span>
              </CustomLink>
            );
          })}
        </div>
      </nav>

      {/* Footer Actions - Minimalan dizajn */}
      <div className="p-2 border-t border-gray-200 space-y-0.5">
        <button
          onClick={() => setIsLogout(true)}
          className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <RiLogoutCircleLine size={18} className="shrink-0" />
          <span className="truncate">{t("signOut")}</span>
        </button>
        
        <button
          onClick={() => setIsDeleteAccount(true)}
          className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-100"
        >
          <BiTrashAlt size={18} className="shrink-0" />
          <span className="truncate">{t("deleteAccount")}</span>
        </button>
      </div>

      {/* Logout Dialog */}
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

      {/* Delete Account Dialog */}
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
    </aside>
  );
};

export default ProfileSidebar;