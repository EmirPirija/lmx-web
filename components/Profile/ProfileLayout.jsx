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
  ChevronDown,
  Bookmark,
  Crown,
} from "lucide-react";

// ============================================
// NAVIGACIJA - Kompaktnija struktura
// ============================================

const navSections = [
  {
    id: "main",
    items: [
      { label: "Dashboard", href: "/profile/seller", icon: LayoutDashboard },
      { label: "Moj profil", href: "/profile", icon: User },
      { label: "Postavke", href: "/profile/seller-settings", icon: Settings },
    ],
  },
  {
    id: "activity",
    label: "Aktivnost",
    items: [
      { label: "Moji oglasi", href: "/my-ads", icon: Package, badgeKey: "ads" },
      { label: "Poruke", href: "/chat", icon: MessageSquare, badgeKey: "messages" },
      { label: "Obavijesti", href: "/notifications", icon: Bell, badgeKey: "notifications" },
    ],
  },
  {
    id: "other",
    label: "Ostalo",
    collapsible: true,
    items: [
      { label: "Omiljeno", href: "/favorites", icon: Heart },
      { label: "Sačuvano", href: "/profile/saved", icon: Bookmark },
      { label: "Recenzije", href: "/reviews", icon: Star },
      { label: "Transakcije", href: "/transactions", icon: Receipt },
      { label: "Prijave za posao", href: "/job-applications", icon: Briefcase },
    ],
  },
];

// ============================================
// SIDEBAR KOMPONENTA - Kompaktni dizajn
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
  const [expandedSections, setExpandedSections] = useState({ other: false });

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const NavLink = ({ item }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    const badgeCount = item.badgeKey ? badges[item.badgeKey] || 0 : 0;

    return (
      <CustomLink href={item.href} onClick={onClose}>
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            isActive
              ? "bg-primary text-white font-medium"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-sm">{item.label}</span>
          {badgeCount > 0 && (
            <span className={cn(
              "ml-auto text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center",
              isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
            )}>
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </div>
      </CustomLink>
    );
  };

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
            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative top-0 left-0 z-50 lg:z-auto",
          "w-72 lg:w-64 h-full lg:h-auto",
          "bg-white dark:bg-slate-900 lg:bg-white/80 lg:dark:bg-slate-900/80 lg:backdrop-blur-xl",
          "border-r lg:border border-slate-200 dark:border-slate-800",
          "lg:rounded-2xl lg:shadow-sm",
          "overflow-hidden",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full lg:h-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between lg:hidden mb-4">
              <span className="font-semibold text-slate-900 dark:text-white">Menu</span>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Info - Kompaktno */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-orange-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                    {userData?.profile_image || userData?.profile ? (
                      <img
                        src={userData.profile_image || userData.profile}
                        alt=""
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User size={18} className="text-slate-400" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                  {userData?.name || "Korisnik"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {userData?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-4">
            {navSections.map((section) => (
              <div key={section.id}>
                {section.label && (
                  <div className="flex items-center justify-between mb-1">
                    {section.collapsible ? (
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex items-center gap-1 w-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        <span>{section.label}</span>
                        <ChevronDown
                          size={14}
                          className={cn(
                            "transition-transform duration-200",
                            expandedSections[section.id] ? "rotate-180" : ""
                          )}
                        />
                      </button>
                    ) : (
                      <span className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {section.label}
                      </span>
                    )}
                  </div>
                )}
                
                <AnimatePresence initial={false}>
                  {(!section.collapsible || expandedSections[section.id] || section.id !== "other") && (
                    <motion.div
                      initial={section.collapsible ? { height: 0, opacity: 0 } : false}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={section.collapsible ? { height: 0, opacity: 0 } : undefined}
                      transition={{ duration: 0.2 }}
                      className="space-y-0.5 overflow-hidden"
                    >
                      {(section.collapsible && !expandedSections[section.id] ? [] : section.items).map((item) => (
                        <NavLink key={item.href} item={item} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Pro/Upgrade Card */}
            <CustomLink href="/user-subscription" onClick={onClose}>
              <div className="mx-0 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-700/30 hover:border-amber-300 dark:hover:border-amber-600 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Crown size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Članstvo</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Nadogradite profil</p>
                  </div>
                </div>
              </div>
            </CustomLink>
          </nav>

          {/* Footer Actions */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm">Odjava</span>
            </button>
            <button
              onClick={onDeleteAccount}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={18} />
              <span className="text-sm">Obriši nalog</span>
            </button>
          </div>
        </div>
      </aside>
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-4 mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <Menu size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            {title && (
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
            )}
          </div>

          <div className="flex gap-6 lg:gap-8 items-start">
            {/* Sidebar - Sticky i kompaktna */}
            <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
              <ProfileSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                badges={badges}
                onLogout={() => setIsLogoutOpen(true)}
                onDeleteAccount={() => setIsDeleteOpen(true)}
              />
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden">
              <ProfileSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                badges={badges}
                onLogout={() => setIsLogoutOpen(true)}
                onDeleteAccount={() => setIsDeleteOpen(true)}
              />
            </div>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {/* Desktop Header */}
              {title && (
                <div className="hidden lg:flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
                    {subtitle && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Page Content */}
              {children}
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
