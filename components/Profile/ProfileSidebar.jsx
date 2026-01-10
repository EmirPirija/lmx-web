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
import Image from "next/image"; // Dodano za avatar ako ga imate, ili placeholder

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

  // Helper funkcija za stiliziranje linkova da kod bude čišći
  const getLinkClass = (path) => {
    const isActive = pathname === path;
    return `group flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 text-sm font-medium ${
      isActive
        ? "bg-primary text-white shadow-md" // Prilagodite 'bg-primary' vašoj boji teme
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;
  };

  return (
    <aside className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* 1. Header sekcija sa podacima korisnika (UX poboljšanje) */}
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden shrink-0">
            {userData?.profile_image ? (
                 <img src={userData.profile_image} alt="User" className="h-full w-full object-cover" />
            ) : (
                 <FiUser size={24} />
            )}
        </div>
        <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-gray-900 truncate">{userData?.name || "Korisnik"}</h3>
            <p className="text-xs text-gray-500 truncate">{userData?.email || userData?.phone}</p>
        </div>
      </div>

      {/* 2. Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        <CustomLink href="/profile" className={getLinkClass("/profile")}>
          <FiUser size={20} />
          <span>{t("profile")}</span>
        </CustomLink>
        <CustomLink href="/notifications" className={getLinkClass("/notifications")}>
          <IoMdNotificationsOutline size={20} />
          <span>{t("notifications")}</span>
        </CustomLink>
        <CustomLink href="/chat" className={getLinkClass("/chat")}>
          <BiChat size={20} />
          <span>{t("chat")}</span>
        </CustomLink>
        <CustomLink href="/user-subscription" className={getLinkClass("/user-subscription")}>
          <BiDollarCircle size={20} />
          <span>{t("subscription")}</span>
        </CustomLink>
        <CustomLink href="/my-ads" className={getLinkClass("/my-ads")}>
          <LiaAdSolid size={20} />
          <span>{t("myAds")}</span>
        </CustomLink>
        <CustomLink href="/favorites" className={getLinkClass("/favorites")}>
          <LuHeart size={20} />
          <span>{t("favorites")}</span>
        </CustomLink>
        <CustomLink href="/transactions" className={getLinkClass("/transactions")}>
          <BiReceipt size={20} />
          <span>{t("transaction")}</span>
        </CustomLink>
        <CustomLink href="/reviews" className={getLinkClass("/reviews")}>
          <MdOutlineRateReview size={20} />
          <span>{t("myReviews")}</span>
        </CustomLink>
        <CustomLink href="/job-applications" className={getLinkClass("/job-applications")}>
          <MdWorkOutline size={20} />
          <span>{t("jobApplications")}</span>
        </CustomLink>
      </div>

      {/* 3. Footer Actions (Logout & Delete) - Jasno odvojeno */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50 space-y-1">
        <button
          onClick={() => setIsLogout(true)}
          className="w-full flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors duration-200"
        >
          <RiLogoutCircleLine size={20} />
          <span>{t("signOut")}</span>
        </button>
        
        <button
          onClick={() => setIsDeleteAccount(true)}
          className="w-full flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
        >
          <BiTrashAlt size={20} />
          <span>{t("deleteAccount")}</span>
        </button>
      </div>

      {/* Logout Alert Dialog */}
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

      {/* Delete Account Alert Dialog */}
      <ReusableAlertDialog
        open={IsDeleteAccount}
        onCancel={() => setIsDeleteAccount(false)}
        onConfirm={handleDeleteAcc}
        title={t("areYouSure")}
        description={
          <div className="bg-red-50 p-3 rounded-md border border-red-100">
             <p className="text-red-800 text-sm font-semibold mb-2">{t("warning")}:</p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
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
        confirmButtonClass="bg-red-600 hover:bg-red-700" // Opcionalno, ako komponenta podržava
      />
    </aside>
  );
};

export default ProfileSidebar;