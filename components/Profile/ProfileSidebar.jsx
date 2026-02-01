"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { 
  BiChat, 
  BiDollarCircle, 
  BiReceipt, 
  BiTrashAlt 
} from "react-icons/bi";
import { 
  FiUser, 
  FiPackage,
  FiLogOut,
  FiHelpCircle,
  FiSettings,
  FiChevronRight,
} from "react-icons/fi";
import { 
  IoMdNotificationsOutline 
} from "react-icons/io";
import { 
  LiaAdSolid 
} from "react-icons/lia";
import { 
  LuHeart 
} from "react-icons/lu";
import { 
  MdOutlineRateReview, 
  MdWorkOutline 
} from "react-icons/md";

import FirebaseData from "@/utils/Firebase";
import { logoutSuccess, userSignUpData } from "@/redux/reducer/authSlice";
import { deleteUserApi, logoutApi } from "@/utils/api";
import { deleteUser, getAuth } from "firebase/auth";
import ReusableAlertDialog from "../Common/ReusableAlertDialog";
import { useSelector } from "react-redux";
import { useNavigate } from "../Common/useNavigate";
import { t } from "@/utils";

const navigationLinks = [
  { href: "/profile", icon: FiUser, label: "Profil", group: "main" },
  { href: "/notifications", icon: IoMdNotificationsOutline, label: "Obavijesti", badge: true, group: "main" },
  { href: "/chat", icon: BiChat, label: "Chat", badge: true, group: "main" },
  { href: "/user-subscription", icon: BiDollarCircle, label: "Članstvo", group: "main" },
  { href: "/my-ads", icon: LiaAdSolid, label: "Moji oglasi", group: "seller" },
  { href: "/favorites", icon: LuHeart, label: "Omiljeni", group: "buyer" },
  { href: "/transactions", icon: BiReceipt, label: "Transakcije", group: "buyer" },
  { href: "/reviews", icon: MdOutlineRateReview, label: "Recenzije", group: "main" },
  { href: "/job-applications", icon: MdWorkOutline, label: "Prijave", group: "buyer" },
];

function SidebarNavItem({ href, icon: Icon, label, isActive, badge, badgeCount = 0 }) {
  return (
    <CustomLink href={href}>
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
          isActive
            ? "bg-primary text-white shadow-md"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
          isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"
        )}>
          <Icon 
            size={18} 
            className={cn(
              isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
            )}
          />
        </div>

        <span className={cn(
          "flex-1 text-sm font-semibold",
          isActive ? "text-white" : "text-slate-700 group-hover:text-slate-900"
        )}>
          {label}
        </span>

        {badge && badgeCount > 0 && (
          <span className={cn(
            "min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-black rounded-full",
            isActive ? "bg-white text-primary" : "bg-red-500 text-white"
          )}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}

        {isActive && (
          <motion.div
            layoutId="sidebarActiveIndicator"
            className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
          />
        )}
      </motion.div>
    </CustomLink>
  );
}

export default function ProfileSidebar({ badges = {} }) {
  const pathname = usePathname();
  const userData = useSelector(userSignUpData);
  const { navigate } = useNavigate();
  const { signOut } = FirebaseData();

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      const res = await logoutApi.logoutApi({
        ...(userData?.fcm_id && { fcm_token: userData?.fcm_id }),
      });
      if (res?.data?.error === false) {
        logoutSuccess();
        toast.success("Uspješno ste se odjavili");
        setIsLogoutOpen(false);
        if (pathname !== "/") {
          navigate("/");
        }
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.log("Failed to logout", error);
      toast.error("Greška pri odjavi");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const auth = getAuth();
      const user = auth.currentUser;
      await deleteUser(user);
      await deleteUserApi.deleteUser();
      logoutSuccess();
      toast.success("Nalog uspješno obrisan");
      setIsDeleteOpen(false);
      if (pathname !== "/") {
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting user:", error.message);
      if (error.code === "auth/requires-recent-login") {
        logoutSuccess();
        toast.error("Morate se ponovo prijaviti prije brisanja naloga");
        setIsDeleteOpen(false);
      } else {
        toast.error("Greška pri brisanju naloga");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <aside className="h-full flex flex-col bg-white rounded-3xl shadow-lg border border-slate-200/70 overflow-hidden">
      {/* User Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white overflow-hidden shadow-md border-2 border-white ring-2 ring-slate-100">
              {userData?.profile_image ? (
                <img 
                  src={userData.profile_image} 
                  alt="User" 
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <FiUser size={24} />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div className="overflow-hidden flex-1">
            <h3 className="text-sm font-extrabold text-slate-900 truncate">
              {userData?.name || "Korisnik"}
            </h3>
            <p className="text-xs text-slate-500 truncate">
              {userData?.email || userData?.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <div className="space-y-1">
          {navigationLinks.map((link) => (
            <SidebarNavItem
              key={link.href}
              {...link}
              isActive={pathname === link.href}
              badgeCount={badges[link.href] || 0}
            />
          ))}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
        <button
          onClick={() => setIsLogoutOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-white hover:text-slate-900 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <FiLogOut size={18} className="text-slate-500" />
          </div>
          <span className="flex-1 text-left">Odjavi se</span>
        </button>
        
        <button
          onClick={() => setIsDeleteOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <BiTrashAlt size={18} className="text-red-500" />
          </div>
          <span className="flex-1 text-left">Obriši nalog</span>
        </button>
      </div>

      {/* Logout Dialog */}
      <ReusableAlertDialog
        open={isLogoutOpen}
        onCancel={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Potvrdi odjavu"
        description="Da li ste sigurni da se želite odjaviti?"
        cancelText="Odustani"
        confirmText="Odjavi se"
        confirmDisabled={isLoggingOut}
      />

      {/* Delete Account Dialog */}
      <ReusableAlertDialog
        open={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Obriši nalog?"
        description={
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-2">
            <p className="text-red-900 text-sm font-bold">⚠️ Upozorenje:</p>
            <ul className="list-disc list-inside text-xs text-red-800 space-y-1">
              <li>Svi oglasi i transakcije će biti obrisani</li>
              <li>Podaci se ne mogu vratiti</li>
              <li>Pretplate će biti otkazane</li>
              <li>Sve poruke će biti izgubljene</li>
            </ul>
          </div>
        }
        cancelText="Odustani"
        confirmText="Obriši nalog"
        confirmDisabled={isDeleting}
      />
    </aside>
  );
}