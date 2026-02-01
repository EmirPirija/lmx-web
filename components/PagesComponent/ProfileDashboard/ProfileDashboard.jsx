"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import Layout from "@/components/Layout/Layout";
import Checkauth from "@/HOC/Checkauth";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";

// Import komponenti za dashboard
import Profile from "@/components/Profile/Profile";
import Notifications from "../Notifications/Notifications";
import MyAds from "../MyAds/MyAds";
import Favorites from "../Favorites/Favorites";
import Transactions from "../Transactions/Transactions";
import Reviews from "../Reviews/Reviews";
import Chat from "../Chat/Chat";
import ProfileSubscription from "../Subscription/ProfileSubscription";
import JobApplications from "../JobApplications/JobApplications";

// Lucide ikone
import {
  User,
  Bell,
  Layers,
  Heart,
  Star,
  MessageSquare,
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
  HelpCircle,
  Home,
  CreditCard,
  Package,
  Users,
  BadgeCheck,
  Receipt,
  ShoppingBag,
  Bookmark,
  BarChart3,
  Cog,
  Clock,
  Plus,
  Sparkles,
} from "lucide-react";

import { userSignUpData } from "@/redux/reducer/authSlice";

// ===== UTILITY FUNKCIJE =====

const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Dobro jutro";
  if (hour < 18) return "Dobar dan";
  return "Dobro veče";
};

// ===== KOMPONENTE =====

// Stavka sidebar navigacije
const SidebarItem = ({ 
  href, 
  label, 
  icon: Icon, 
  isActive, 
  isExpanded, 
  badge,
  isComingSoon = false,
  onClick
}) => {
  const content = (
    <motion.div
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex items-center transition-all duration-200 rounded-xl overflow-hidden",
        isExpanded ? "px-3 py-3 gap-3" : "p-3 justify-center",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <div className={cn(
        "relative flex items-center justify-center transition-all duration-200",
        isExpanded ? "w-9 h-9" : "w-10 h-10"
      )}>
        <div className={cn(
          "absolute inset-0 rounded-lg transition-all duration-200",
          isActive 
            ? "bg-primary/10" 
            : "bg-slate-100 group-hover:bg-slate-200/80"
        )} />
        <Icon
          size={18}
          className={cn(
            "relative z-10 transition-colors duration-200",
            isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-700"
          )}
        />
        
        {/* Badge */}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full border-2 border-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>

      {/* Label */}
      {isExpanded && (
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <span className="text-sm font-medium truncate">{label}</span>
          {isComingSoon && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded">
              Uskoro
            </span>
          )}
        </div>
      )}
    </motion.div>
  );

  if (isComingSoon) {
    return (
      <div className="cursor-not-allowed opacity-60">
        {content}
      </div>
    );
  }

  return (
    <CustomLink href={href} onClick={onClick}>
      {content}
    </CustomLink>
  );
};

// Mobilna navigacija (donja)
const MobileBottomNav = ({ activePath, navigationItems }) => {
  const mainTabs = navigationItems.filter(item => 
    ["/profile", "/chat", "/my-ads", "/favorites", "/notifications"].includes(item.href)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-2 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {mainTabs.map((tab) => {
          const isActive = activePath === tab.href;
          return (
            <CustomLink
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
                "min-w-[56px] relative",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              <div className="relative">
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-1",
                isActive ? "text-primary" : "text-slate-500"
              )}>
                {tab.label.split(" ")[0]}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </CustomLink>
          );
        })}
      </div>
    </nav>
  );
};

// Mobilni meni (sheet)
const MobileMenuSheet = ({ 
  isOpen, 
  onClose, 
  navigationItems, 
  activePath, 
  userData 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white z-50 shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-slate-900">Meni</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>
              
              {/* Korisnički info */}
              {userData && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{userData.name || "Korisnik"}</p>
                    <p className="text-xs text-slate-500 truncate">{userData.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigacija */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <CustomLink
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
                      activePath === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </CustomLink>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100">
              <div className="space-y-2">
                <CustomLink
                  href="/help"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <HelpCircle size={18} />
                  <span>Pomoć i podrška</span>
                </CustomLink>
                <CustomLink
                  href="/settings"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Settings size={18} />
                  <span>Postavke</span>
                </CustomLink>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Dashboard zaglavlje
const DashboardHeader = ({ userData, currentConfig, onMenuClick, isMobile }) => {
  const greeting = getTimeGreeting();
  
  const quickStats = useMemo(() => [
    { label: "Oglasi", value: userData?.ads_count || 0, icon: Layers, color: "text-blue-500" },
    { label: "Poruke", value: userData?.unread_messages || 0, icon: MessageSquare, color: "text-green-500" },
    { label: "Favoriti", value: userData?.favorites_count || 0, icon: Heart, color: "text-pink-500" },
  ], [userData]);

  return (
    <div className="mb-6 lg:mb-8">
      {/* Gornji dio */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          {/* Pozdrav */}
          <div className="flex items-center gap-2 mb-2">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
            <span className="text-sm text-slate-500 font-medium">
              {greeting}, <span className="text-slate-700">{userData?.name || "Korisnik"}</span>
            </span>
          </div>
          
          {/* Naslov */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
            {currentConfig?.title || "Kontrolna tabla"}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base line-clamp-2">
            {currentConfig?.description || "Pregledajte i upravljajte svojim nalogom"}
          </p>
        </div>

        {/* Akcije */}
        <div className="flex items-center gap-2">
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Menu size={20} className="text-slate-600" />
            </button>
          )}
          <CustomLink
            href="/ad-listing"
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Novi oglas</span>
          </CustomLink>
        </div>
      </div>

      {/* Brze statistike */}
      <div className="grid grid-cols-3 gap-3">
        {quickStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-slate-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={18} className={stat.color} />
              {stat.value > 0 && (
                <span className="text-xs font-medium text-slate-400">Aktivno</span>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(stat.value)}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ===== GLAVNA KOMPONENTA =====
const ProfileDashboard = () => {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  
  // Redux stanje
  const userData = useSelector(userSignUpData);
  
  // Lokalno stanje
  const [sidebarExpanded, setSidebarExpanded] = useState(!isTablet);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("sve");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    notifications: 0,
    reviews: 0,
  });

  // Dohvati brojeve
  useEffect(() => {
    if (userData) {
      setUnreadCounts({
        messages: userData.unread_messages || 0,
        notifications: userData.unread_notifications || 0,
        reviews: userData.pending_reviews || 0,
      });
    }
  }, [userData]);

  // Reaguj na promjenu veličine ekrana
  useEffect(() => {
    setSidebarExpanded(!isTablet);
  }, [isTablet]);

  // Konfiguracija dashboarda
  const dashboardConfig = useMemo(() => {
    const baseConfig = {
      "/profile": {
        title: "Moj profil",
        description: "Upravljajte ličnim podacima i postavkama naloga",
        icon: User,
        component: <Profile />,
        category: "nalog",
      },
      "/notifications": {
        title: "Obavijesti",
        description: "Pregledajte sve obavijesti i aktivnosti",
        icon: Bell,
        component: <Notifications />,
        badge: unreadCounts.notifications,
        category: "nalog",
      },
      "/my-ads": {
        title: "Moji oglasi",
        description: "Upravljajte aktivnim, isteklim i arhiviranim oglasima",
        icon: Layers,
        component: <MyAds />,
        category: "oglasi",
      },
      "/favorites": {
        title: "Favoriti",
        description: "Oglasi koje ste sačuvali za kasnije",
        icon: Heart,
        component: <Favorites />,
        category: "oglasi",
      },
      "/transactions": {
        title: "Transakcije",
        description: "Historija plaćanja i transakcija",
        icon: Receipt,
        component: <Transactions />,
        category: "finansije",
      },
      "/reviews": {
        title: "Recenzije",
        description: "Ocjene i komentari od drugih korisnika",
        icon: Star,
        component: <Reviews />,
        badge: unreadCounts.reviews,
        category: "nalog",
      },
      "/chat": {
        title: "Poruke",
        description: "Direktna komunikacija sa drugim korisnicima",
        icon: MessageSquare,
        component: <Chat />,
        badge: unreadCounts.messages,
        category: "komunikacija",
      },
      "/user-subscription": {
        title: "Pretplata",
        description: "Status pretplate i dostupni paketi",
        icon: CreditCard,
        component: <ProfileSubscription />,
        category: "finansije",
      },
      "/job-applications": {
        title: "Prijave za posao",
        description: "Pregled prijava i statusa",
        icon: Briefcase,
        component: <JobApplications />,
        category: "posao",
      },
    };

    return baseConfig;
  }, [unreadCounts]);

  const currentConfig = dashboardConfig[pathname] || dashboardConfig["/profile"];

  // Stavke navigacije
  const navigationItems = useMemo(() => {
    return Object.entries(dashboardConfig).map(([href, config]) => ({
      href,
      label: config.title,
      icon: config.icon,
      badge: config.badge,
      category: config.category,
    }));
  }, [dashboardConfig]);

  // Kategorije
  const categories = useMemo(() => {
    const cats = [...new Set(navigationItems.map(item => item.category))];
    return ["sve", ...cats];
  }, [navigationItems]);

  // Filtrirane stavke
  const filteredItems = useMemo(() => {
    let filtered = navigationItems;
    
    if (activeCategory !== "sve") {
      filtered = filtered.filter(item => item.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.label.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [navigationItems, activeCategory, searchQuery]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarExpanded(prev => !prev);
  }, []);

  return (
    <Layout currentPageId="profile" parentPage="profile">
      <div className="min-h-screen bg-slate-50/50">
        {/* Breadcrumb */}
        <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
          <div className="container mx-auto px-4 lg:px-6 py-3">
            <BreadCrumb title2={currentConfig.title} />
          </div>
        </div>

        {/* Glavni kontejner */}
        <div className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
          {/* Zaglavlje */}
          <DashboardHeader 
            userData={userData} 
            currentConfig={currentConfig}
            onMenuClick={() => setMobileMenuOpen(true)}
            isMobile={isMobile}
          />

          {/* Glavni grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Sidebar */}
            {!isMobile && (
              <motion.aside
                animate={{ width: sidebarExpanded ? 280 : 80 }}
                transition={{ duration: 0.2 }}
                className="lg:sticky lg:top-24 self-start flex-shrink-0"
                style={{ maxHeight: "calc(100vh - 180px)" }}
              >
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
                  {/* Sidebar zaglavlje */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      {sidebarExpanded && (
                        <h3 className="text-sm font-bold text-slate-900">Navigacija</h3>
                      )}
                      <button
                        onClick={toggleSidebar}
                        className={cn(
                          "p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700",
                          !sidebarExpanded && "mx-auto"
                        )}
                        title={sidebarExpanded ? "Sakrij meni" : "Prikaži meni"}
                      >
                        {sidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </div>

                    {/* Pretraga */}
                    {sidebarExpanded && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 relative"
                      >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="Pretraži..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Kategorije */}
                  {sidebarExpanded && (
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={cn(
                              "px-2.5 py-1 text-xs font-medium rounded-lg transition-colors capitalize",
                              activeCategory === category
                                ? "bg-primary text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stavke navigacije */}
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="space-y-1">
                      {filteredItems.map((item) => (
                        <SidebarItem
                          key={item.href}
                          href={item.href}
                          label={item.label}
                          icon={item.icon}
                          isActive={pathname === item.href}
                          isExpanded={sidebarExpanded}
                          badge={item.badge}
                        />
                      ))}
                    </div>

                    {/* Nema rezultata */}
                    {filteredItems.length === 0 && (
                      <div className="text-center py-8">
                        <Search className="mx-auto text-slate-300 mb-3" size={28} />
                        <p className="text-sm text-slate-500">Nema rezultata</p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar footer */}
                  {sidebarExpanded && (
                    <div className="p-4 border-t border-slate-100">
                      <div className="space-y-1">
                        <CustomLink
                          href="/help"
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <HelpCircle size={18} />
                          <span>Pomoć i podrška</span>
                        </CustomLink>
                        <CustomLink
                          href="/settings"
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <Settings size={18} />
                          <span>Napredne postavke</span>
                        </CustomLink>
                      </div>
                    </div>
                  )}
                </div>
              </motion.aside>
            )}

            {/* Glavni sadržaj */}
            <main className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden",
                  pathname === "/chat" ? "h-[calc(100vh-280px)]" : "min-h-[500px]"
                )}
              >
                <div className={cn(
                  pathname === "/chat" ? "h-full" : "p-4 sm:p-6"
                )}>
                  {currentConfig.component}
                </div>
              </motion.div>

              {/* Mobilne brze akcije */}
              {isMobile && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <CustomLink
                    href="/help"
                    className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors"
                  >
                    <HelpCircle size={20} className="text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Pomoć</span>
                  </CustomLink>
                  <CustomLink
                    href="/ad-listing"
                    className="flex items-center justify-center gap-2 p-4 bg-primary text-white border border-primary rounded-2xl hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={20} />
                    <span className="text-sm font-medium">Novi oglas</span>
                  </CustomLink>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Mobilna donja navigacija */}
        {isMobile && (
          <MobileBottomNav 
            activePath={pathname}
            navigationItems={navigationItems}
          />
        )}

        {/* Mobilni meni */}
        <MobileMenuSheet
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          navigationItems={navigationItems}
          activePath={pathname}
          userData={userData}
        />

        {/* Donji spacer za mobilnu navigaciju */}
        {isMobile && <div className="h-24" />}
      </div>
    </Layout>
  );
};

export default ProfileDashboard;