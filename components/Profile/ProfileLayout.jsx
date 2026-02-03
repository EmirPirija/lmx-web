"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import Layout from "@/components/Layout/Layout";
import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import { userSignUpData, logoutSuccess } from "@/redux/reducer/authSlice";
import { logoutApi, deleteUserApi } from "@/utils/api";
import FirebaseData from "@/utils/Firebase";
import { deleteUser, getAuth } from "firebase/auth";
import { useNavigate } from "@/components/Common/useNavigate";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";

import {
  User,
  LayoutDashboard,
  Settings,
  Package,
  MessageSquare,
  Bell,
  Heart,
  Star,
  Receipt,
  Briefcase,
  Award,
  Shield,
  LogOut,
  Trash2,
  Menu,
  X,
  ChevronRight,
  Zap,
  TrendingUp,
  Bookmark,
  Camera,
  BadgeCheck,
} from "lucide-react";

// ============================================
// NAVIGACIJA
// ============================================

const mainNavItems = [
  {
    label: "Dashboard",
    href: "/profile/seller",
    icon: LayoutDashboard,
    color: "from-primary to-orange-600",
    description: "Pregled statistike",
  },
  {
    label: "Moj profil",
    href: "/profile",
    icon: User,
    color: "from-blue-500 to-indigo-600",
    description: "Lični podaci",
  },
  {
    label: "Postavke prodavača",
    href: "/profile/seller-settings",
    icon: Settings,
    color: "from-slate-600 to-slate-800",
    description: "Kontakt i radno vrijeme",
  },
];

const sellerNavItems = [
  {
    label: "Moji oglasi",
    href: "/my-ads",
    icon: Package,
    badge: true,
    badgeKey: "ads",
  },
  {
    label: "Poruke",
    href: "/chat",
    icon: MessageSquare,
    badge: true,
    badgeKey: "messages",
  },
  {
    label: "Sačuvani kontakti",
    href: "/profile/saved",
    icon: Bookmark,
  },
];

const buyerNavItems = [
  {
    label: "Obavijesti",
    href: "/notifications",
    icon: Bell,
    badge: true,
    badgeKey: "notifications",
  },
  {
    label: "Omiljeni oglasi",
    href: "/favorites",
    icon: Heart,
  },
  {
    label: "Recenzije",
    href: "/reviews",
    icon: Star,
  },
  {
    label: "Transakcije",
    href: "/transactions",
    icon: Receipt,
  },
  {
    label: "Prijave za posao",
    href: "/job-applications",
    icon: Briefcase,
  },
];

const otherNavItems = [
  {
    label: "Članstvo",
    href: "/user-subscription",
    icon: Award,
    highlight: true,
  },
  {
    label: "Verifikacija",
    href: "/user-verification",
    icon: Shield,
  },
];

// ============================================
// SIDEBAR KOMPONENTA
// ============================================

function ProfileSidebar({ 
  isOpen, 
  onClose, 
  badges = {},
  onLogout,
  onDeleteAccount,
}) {
  const pathname = usePathname();
  const userData = useSelector(userSignUpData);

  const NavItem = ({ item, isActive }) => {
    const Icon = item.icon;
    const badgeCount = item.badge ? badges[item.badgeKey] || 0 : 0;

    return (
      <CustomLink href={item.href} onClick={onClose}>
        <motion.div
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden",
            isActive
              ? "bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/30"
              : item.highlight
              ? "bg-gradient-to-r from-secondary/10 to-teal-500/10 text-secondary hover:from-secondary/20 hover:to-teal-500/20 border border-secondary/20"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              isActive
                ? "bg-white/20"
                : item.highlight
                ? "bg-secondary/20"
                : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          </div>

          <span className="flex-1 font-medium text-sm">{item.label}</span>

          {badgeCount > 0 && (
            <span
              className={cn(
                "min-w-[24px] h-6 px-2 flex items-center justify-center text-xs font-bold rounded-full",
                isActive ? "bg-white text-primary" : "bg-red-500 text-white"
              )}
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}

          {isActive && (
            <motion.div
              layoutId="activeNavIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </motion.div>
      </CustomLink>
    );
  };

  const NavGroup = ({ title, items }) => (
    <div className="space-y-1">
      <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
        {title}
      </h3>
      {items.map((item) => (
        <NavItem key={item.href} item={item} isActive={pathname === item.href} />
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 lg:z-auto",
          "w-80 h-screen lg:h-auto",
          "bg-white dark:bg-slate-900 lg:bg-transparent",
          "border-r border-slate-200 dark:border-slate-800 lg:border-0",
          "overflow-y-auto",
          "lg:translate-x-0"
        )}
      >
        <div className="p-4 lg:p-0 space-y-6">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between lg:hidden">
            <span className="text-lg font-bold text-slate-900 dark:text-white">Menu</span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Card */}
          <div className="bg-gradient-to-br from-accent via-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl shadow-accent/20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
                  {userData?.profile_image || userData?.profile ? (
                    <img
                      src={userData.profile_image || userData.profile}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-white/80" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                  <Zap size={10} className="text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{userData?.name || "Korisnik"}</h3>
                <p className="text-white/70 text-sm truncate">{userData?.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <BadgeCheck size={14} className="text-green-300" />
                  <span className="text-xs text-green-300">Aktivan</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center">
                <div className="text-lg font-bold">{userData?.active_ads || 0}</div>
                <div className="text-[10px] text-white/70 uppercase">Oglasi</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center">
                <div className="text-lg font-bold">
                  {userData?.average_rating ? Number(userData.average_rating).toFixed(1) : "0.0"}
                </div>
                <div className="text-[10px] text-white/70 uppercase">Ocjena</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center">
                <div className="text-lg font-bold">{badges.messages || 0}</div>
                <div className="text-[10px] text-white/70 uppercase">Poruke</div>
              </div>
            </div>
          </div>

          {/* Main Nav Cards */}
          <div className="space-y-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <CustomLink key={item.href} href={item.href} onClick={onClose}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                      isActive
                        ? "border-transparent bg-gradient-to-r " + item.color + " text-white shadow-lg"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          isActive ? "bg-white/20" : "bg-gradient-to-br " + item.color + " text-white"
                        )}
                      >
                        <Icon size={24} />
                      </div>
                      <div>
                        <div className={cn("font-bold", isActive ? "text-white" : "text-slate-900 dark:text-white")}>
                          {item.label}
                        </div>
                        <div className={cn("text-xs", isActive ? "text-white/80" : "text-slate-500 dark:text-slate-400")}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
                    )}
                  </motion.div>
                </CustomLink>
              );
            })}
          </div>

          {/* Nav Groups */}
          <NavGroup title="Prodaja" items={sellerNavItems} />
          <NavGroup title="Kupovina" items={buyerNavItems} />
          <NavGroup title="Nalog" items={otherNavItems} />

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <LogOut size={20} />
              </div>
              <span className="font-medium text-sm">Odjavi se</span>
            </button>

            <button
              onClick={onDeleteAccount}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <span className="font-medium text-sm">Obriši nalog</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

// ============================================
// MAIN LAYOUT
// ============================================

export default function ProfileLayout({ children, title, subtitle, badges = {} }) {
  const pathname = usePathname();
  const userData = useSelector(userSignUpData);
  const { navigate } = useNavigate();
  const { signOut } = FirebaseData();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        navigate("/");
      } else {
        toast.error(res?.data?.message || "Greška pri odjavi");
      }
    } catch (error) {
      console.error("Logout error:", error);
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
      navigate("/");
    } catch (error) {
      console.error("Delete error:", error);
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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <Menu size={24} className="text-slate-700 dark:text-slate-200" />
            </button>

            {title && (
              <div className="text-center">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
              </div>
            )}

            <div className="w-12" /> {/* Spacer */}
          </div>

          <div className="flex gap-8">
            {/* Sidebar */}
            <ProfileSidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              badges={badges}
              onLogout={() => setIsLogoutOpen(true)}
              onDeleteAccount={() => setIsDeleteOpen(true)}
            />

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {/* Desktop Header */}
              {title && (
                <div className="hidden lg:block mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
                      {subtitle && <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Page Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {children}
              </motion.div>
            </main>
          </div>
        </div>
      </div>

      {/* Dialogs */}
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

      <ReusableAlertDialog
        open={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Obriši nalog?"
        description={
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 space-y-2">
            <p className="text-red-900 dark:text-red-200 text-sm font-semibold flex items-center gap-2">
              <Shield size={16} />
              Upozorenje - Ova akcija je nepovratna!
            </p>
            <ul className="list-disc list-inside text-xs text-red-800 dark:text-red-300 space-y-1">
              <li>Svi vaši oglasi će biti trajno obrisani</li>
              <li>Sve transakcije i istorija će biti izgubljene</li>
              <li>Pretplate će biti automatski otkazane</li>
              <li>Sve poruke i razgovori će biti obrisani</li>
            </ul>
          </div>
        }
        cancelText="Odustani"
        confirmText="Obriši nalog"
        confirmDisabled={isDeleting}
      />
    </Layout>
  );
}
