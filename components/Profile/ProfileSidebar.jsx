"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSelector } from "react-redux";

import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import {
  User,
  Bell,
  MessageSquare,
  DollarSign,
  Layers,
  Heart,
  Receipt,
  Star,
  Briefcase,
  LogOut,
  Trash2,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";

import FirebaseData from "@/utils/Firebase";
import { logoutSuccess, userSignUpData } from "@/redux/reducer/authSlice";
import { deleteUserApi, logoutApi } from "@/utils/api";
import { deleteUser, getAuth } from "firebase/auth";
import ReusableAlertDialog from "../Common/ReusableAlertDialog";
import { useNavigate } from "../Common/useNavigate";

const navigationLinks = [
  { href: "/profile", icon: User, label: "Profil", group: "main" },
  { href: "/notifications", icon: Bell, label: "Obavijesti", badge: true, group: "main" },
  { href: "/chat", icon: MessageSquare, label: "Chat", badge: true, group: "main" },
  { href: "/user-subscription", icon: DollarSign, label: "Članstvo", group: "main" },
  { href: "/my-ads", icon: Layers, label: "Moji oglasi", group: "seller" },
  { href: "/favorites", icon: Heart, label: "Omiljeni", group: "buyer" },
  { href: "/transactions", icon: Receipt, label: "Transakcije", group: "buyer" },
  { href: "/reviews", icon: Star, label: "Recenzije", group: "main" },
  { href: "/job-applications", icon: Briefcase, label: "Prijave", group: "buyer" },
];

function SidebarNavItem({ href, icon: Icon, label, isActive, badge, badgeCount = 0 }) {
  return (
    <CustomLink href={href}>
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            isActive ? "bg-white/15" : "bg-slate-100 group-hover:bg-slate-200"
          )}
        >
          <Icon
            size={18}
            strokeWidth={isActive ? 2.5 : 2}
            className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700")}
          />
        </div>

        <span
          className={cn(
            "flex-1 text-sm font-semibold",
            isActive ? "text-white" : "text-slate-700 group-hover:text-slate-900"
          )}
        >
          {label}
        </span>

        {badge && badgeCount > 0 && (
          <span
            className={cn(
              "min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full",
              isActive ? "bg-white text-slate-900" : "bg-red-500 text-white"
            )}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}

        {isActive && (
          <motion.div
            layoutId="sidebarActiveIndicator"
            className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
    <aside className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* User Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white overflow-hidden ring-2 ring-slate-100">
              {userData?.profile_image ? (
                <img
                  src={userData.profile_image}
                  alt="User"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <User size={22} />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div className="overflow-hidden flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {userData?.name || "Korisnik"}
            </h3>
            <p className="text-xs text-slate-500 truncate">{userData?.email || userData?.phone}</p>
          </div>

          <CustomLink
            href="/profile/seller"
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <Zap size={16} className="text-slate-600" />
          </CustomLink>
        </div>

        {/* Quick stats */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 text-center py-2 px-3 bg-slate-50 rounded-lg">
            <div className="text-sm font-bold text-slate-900">{userData?.active_ads || 0}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Oglasi</div>
          </div>
          <div className="flex-1 text-center py-2 px-3 bg-slate-50 rounded-lg">
            <div className="text-sm font-bold text-slate-900">
              {userData?.average_rating ? Number(userData.average_rating).toFixed(1) : "0.0"}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Ocjena</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <div className="space-y-0.5">
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
      <div className="p-2 border-t border-slate-100 space-y-1">
        <button
          onClick={() => setIsLogoutOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <LogOut size={18} className="text-slate-500" />
          </div>
          <span className="flex-1 text-left">Odjavi se</span>
          <ChevronRight size={16} className="text-slate-300" />
        </button>

        <button
          onClick={() => setIsDeleteOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <span className="flex-1 text-left">Obriši nalog</span>
          <ChevronRight size={16} className="text-red-200" />
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
            <p className="text-red-900 text-sm font-semibold flex items-center gap-2">
              <Shield size={16} />
              Upozorenje:
            </p>
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
