"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSelector } from "react-redux";

import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import {
  User,
  LogOut,
  Trash2,
  ChevronRight,
  Shield,
  Zap,
  Search,
} from "lucide-react";
import {
  getProfileNavigationSections,
  isProfileNavItemActive,
} from "@/components/Profile/profileNavConfig";

import FirebaseData from "@/utils/Firebase";
import { logoutSuccess, userSignUpData } from "@/redux/reducer/authSlice";
import { deleteUserApi, logoutApi } from "@/utils/api";
import { deleteUser, getAuth } from "firebase/auth";
import ReusableAlertDialog from "../Common/ReusableAlertDialog";
import { useNavigate } from "../Common/useNavigate";

function SidebarNavItem({ href, icon: Icon, label, isActive, badgeCount = 0 }) {
  return (
    <CustomLink href={href}>
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
          isActive
            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            isActive ? "bg-white/15 dark:bg-slate-900/15" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
          )}
        >
          <Icon
            size={18}
            strokeWidth={isActive ? 2.5 : 2}
            className={cn(isActive ? "text-white dark:text-slate-900" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200")}
          />
        </div>

        <span
          className={cn(
            "flex-1 text-sm font-semibold",
            isActive ? "text-white dark:text-slate-900" : "text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white"
          )}
        >
          {label}
        </span>

        {badgeCount > 0 && (
          <span
            className={cn(
              "min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full",
              isActive ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" : "bg-red-500 text-white"
            )}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}

        {isActive && (
          <motion.div
            layoutId="sidebarActiveIndicator"
            className="absolute left-0 w-1 h-6 bg-white dark:bg-slate-900 rounded-r-full"
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
  const [navQuery, setNavQuery] = useState("");

  const navigationSections = useMemo(
    () =>
      getProfileNavigationSections({
        isVerified:
          userData?.is_verified === 1 ||
          userData?.is_verified === true ||
          userData?.verified === true,
        activeAds: userData?.active_ads || 0,
        unreadNotifications: badges["/notifications"] || 0,
        unreadMessages: badges["/chat"] || 0,
      }),
    [badges, userData]
  );

  const filteredSections = useMemo(() => {
    const q = navQuery.trim().toLowerCase();
    if (!q) return navigationSections;

    return navigationSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const haystack = `${section.title} ${item.label} ${item.description}`.toLowerCase();
          return haystack.includes(q);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [navQuery, navigationSections]);

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
    <aside className="h-full flex flex-col bg-white dark:bg-slate-900/90 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
      {/* User Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white overflow-hidden ring-2 ring-slate-100 dark:ring-slate-700">
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {userData?.name || "Korisnik"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userData?.email || userData?.phone}</p>
          </div>

          <CustomLink
            href="/profile/seller"
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <Zap size={16} className="text-slate-600 dark:text-slate-300" />
          </CustomLink>
        </div>

        {/* Quick stats */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 text-center py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{userData?.active_ads || 0}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Oglasi</div>
          </div>
          <div className="flex-1 text-center py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {userData?.average_rating ? Number(userData.average_rating).toFixed(1) : "0.0"}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ocjena</div>
          </div>
        </div>

        <div className="mt-2.5 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            placeholder="Pretrazi meni..."
            className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 text-sm text-slate-700 dark:text-slate-100 outline-none focus:border-primary/40"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 scrollbar-lmx">
        <div className="space-y-2">
          {filteredSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isActive={isProfileNavItemActive(pathname, item)}
                    badgeCount={typeof badges[item.href] === "number" ? badges[item.href] : item.badge || 0}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 text-center text-xs text-slate-500 dark:text-slate-400">
              Nema rezultata za "{navQuery}".
            </div>
          )}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <button
          onClick={() => setIsLogoutOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <LogOut size={18} className="text-slate-500 dark:text-slate-300" />
          </div>
          <span className="flex-1 text-left">Odjavi se</span>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
        </button>

        <button
          onClick={() => setIsDeleteOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <Trash2 size={18} className="text-red-500 dark:text-red-300" />
          </div>
          <span className="flex-1 text-left">Obriši nalog</span>
          <ChevronRight size={16} className="text-red-200 dark:text-red-800" />
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
