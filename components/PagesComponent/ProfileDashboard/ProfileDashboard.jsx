"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";
import { useSelector } from "react-redux";

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

// Icons
import {
  FiUser,
  FiBell,
  FiLayers,
  FiHeart,
  FiStar,
  FiMessageSquare,
  FiBriefcase,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
  FiSettings,
  FiHelpCircle,
  FiHome,
  FiCreditCard,
  FiPackage,
  FiUsers,
} from "react-icons/fi";
import { 
  BiBadgeCheck, 
  BiReceipt, 
  BiShoppingBag, 
  BiBookmark,
  BiChart,
  BiCog
} from "react-icons/bi";
import { TbHistory } from "react-icons/tb";
import { userSignUpData } from "@/redux/reducer/authSlice";

const LS_SIDEBAR_STATE = "profile_sidebar_state";

// ===== UTILITY FUNCTIONS =====
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

// ===== SIDEBAR COMPONENT =====
const SidebarItem = ({ 
  href, 
  label, 
  icon: Icon, 
  isActive, 
  isExpanded, 
  badge,
  isComingSoon = false 
}) => {
  return (
    <CustomLink
      href={isComingSoon ? "#" : href}
      className={cn(
        "group relative flex items-center transition-all duration-200",
        "rounded-lg overflow-hidden",
        isExpanded ? "px-3 py-3 gap-3" : "p-3 justify-center",
        isActive
          ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary"
          : "text-slate-700 hover:bg-slate-50 hover:text-primary"
      )}
      onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
    >
      <div className={cn(
        "relative flex items-center justify-center transition-all duration-200",
        isExpanded ? "w-10 h-10" : "w-12 h-12"
      )}>
        <div className={cn(
          "absolute inset-0 rounded-lg transition-all duration-200",
          isActive 
            ? "bg-primary/10" 
            : "bg-slate-100 group-hover:bg-primary/5"
        )} />
        <Icon
          size={20}
          className={cn(
            "relative z-10 transition-colors duration-200",
            isActive ? "text-primary" : "text-slate-600 group-hover:text-primary"
          )}
        />
        
        {/* Badge */}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full border-2 border-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>

      {/* Label */}
      {isExpanded && (
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <span className="text-sm font-medium truncate">{label}</span>
          {isComingSoon && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-md">
              Uskoro
            </span>
          )}
        </div>
      )}
    </CustomLink>
  );
};

// ===== MOBILE NAVIGATION =====
const MobileNavigation = ({ 
  activePath, 
  navigationItems,
  userData 
}) => {
  const [activeTab, setActiveTab] = useState(activePath);

  const mainTabs = navigationItems.filter(item => 
    ["/profile", "/chat", "/my-ads", "/favorites", "/notifications"].includes(item.href)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 py-2">
      <div className="flex items-center justify-around">
        {mainTabs.map((tab) => (
          <CustomLink
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
              "min-w-[60px]",
              activeTab === tab.href
                ? "text-primary"
                : "text-slate-500 hover:text-primary"
            )}
            onClick={() => setActiveTab(tab.href)}
          >
            <div className="relative">
              <tab.icon size={22} />
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium mt-1 truncate max-w-[60px]">
              {tab.label.split(" ")[0]}
            </span>
          </CustomLink>
        ))}
        
        {/* More Menu */}
        <button className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-500 hover:text-primary transition-colors duration-200">
          <FiMenu size={22} />
          <span className="text-xs font-medium mt-1">Više</span>
        </button>
      </div>
    </nav>
  );
};

// ===== DASHBOARD HEADER =====
const DashboardHeader = ({ userData, currentConfig }) => {
  const greeting = getTimeGreeting();
  const userStats = [
    { label: "Oglasi", value: userData?.ads_count || 0 },
    { label: "Poruke", value: userData?.unread_messages || 0 },
    { label: "Favoriti", value: userData?.favorites_count || 0 },
  ];

  return (
    <div className="mb-6 lg:mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-slate-600 font-medium">
              {greeting}, {userData?.name || "Korisnik"}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
            {currentConfig?.title || "Kontrolna tabla"}
          </h1>
          <p className="text-slate-600 text-sm lg:text-base max-w-3xl">
            {currentConfig?.description || "Pregledajte i upravljajte svojim nalogom"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200">
            <FiSettings size={18} />
            <span className="text-sm font-medium">Postavke</span>
          </button>
          <button className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200">
            <FiHelpCircle size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {userStats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl border border-slate-200 p-4 hover:border-primary transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatNumber(stat.value)}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                {index === 0 && <FiLayers size={20} className="text-primary" />}
                {index === 1 && <FiMessageSquare size={20} className="text-green-500" />}
                {index === 2 && <FiHeart size={20} className="text-pink-500" />}
              </div>
            </div>
          </div>
        ))}
        
        {/* Upgrade Card */}
        <div className="bg-gradient-to-r from-primary to-primary/90 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">Profi nalog</p>
              <p className="text-sm text-white/80 mt-1">Nadogradite</p>
            </div>
            <BiBadgeCheck size={24} className="text-white/80" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
const ProfileDashboard = () => {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  
  // Redux state
  const userData = useSelector(userSignUpData);
  
  // Local state
  const [sidebarExpanded, setSidebarExpanded] = useState(!isTablet);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("sve");
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    notifications: 0,
    reviews: 0,
  });

  // Fetch unread counts
  useEffect(() => {
    if (userData) {
      setUnreadCounts({
        messages: userData.unread_messages || 0,
        notifications: userData.unread_notifications || 0,
        reviews: userData.pending_reviews || 0,
      });
    }
  }, [userData]);

  // Dashboard configuration - DINAMIČKA
  const dashboardConfig = useMemo(() => {
    const baseConfig = {
      "/profile": {
        title: "Moj profil",
        description: "Upravljajte ličnim podacima i postavkama naloga.",
        icon: FiUser,
        component: <Profile />,
        category: "nalog",
      },
      "/notifications": {
        title: "Obavijesti",
        description: "Pregledajte sve obavijesti i aktivnosti.",
        icon: FiBell,
        component: <Notifications />,
        badge: unreadCounts.notifications,
        category: "nalog",
      },
      "/my-ads": {
        title: "Moji oglasi",
        description: "Upravljajte aktivnim, isteklim i arhiviranim oglasima.",
        icon: FiLayers,
        component: <MyAds />,
        category: "oglasi",
      },
      "/favorites": {
        title: "Favoriti",
        description: "Oglasi koje ste sačuvali za kasnije.",
        icon: FiHeart,
        component: <Favorites />,
        category: "oglasi",
      },
      "/transactions": {
        title: "Transakcije",
        description: "Historija plaćanja i transakcija.",
        icon: BiReceipt,
        component: <Transactions />,
        category: "finansije",
      },
      "/reviews": {
        title: "Recenzije",
        description: "Ocjene i dojmovi od drugih korisnika.",
        icon: FiStar,
        component: <Reviews />,
        badge: unreadCounts.reviews,
        category: "nalog",
      },
      "/chat": {
        title: "Poruke",
        description: "Direktna komunikacija sa drugim korisnicima.",
        icon: FiMessageSquare,
        component: <Chat />,
        badge: unreadCounts.messages,
        category: "komunikacija",
      },
      "/user-subscription": {
        title: "Pretplata",
        description: "Status pretplate i dostupni paketi.",
        icon: FiCreditCard,
        component: <ProfileSubscription />,
        category: "finansije",
      },
      "/job-applications": {
        title: "Prijave za posao",
        description: "Pregled prijava i statusa.",
        icon: FiBriefcase,
        component: <JobApplications />,
        category: "posao",
      },
    };

    // Dodajte samo ako postoje rute
    if (userData?.has_saved_searches) {
      baseConfig["/profile/saved-searches"] = {
        title: "Spašene pretrage",
        description: "Sačuvani filteri za brzu pretragu.",
        icon: BiBookmark,
        component: null,
        category: "alati",
      };
    }

    if (userData?.has_purchases) {
      baseConfig["/purchases"] = {
        title: "Moje kupovine",
        description: "Historija kupovina i narudžbi.",
        icon: BiShoppingBag,
        component: null,
        category: "finansije",
      };
    }

    return baseConfig;
  }, [userData, unreadCounts]);

  const currentConfig = dashboardConfig[pathname] || dashboardConfig["/profile"];

  // Navigation items grouped by category - DINAMIČKI
  const navigationItems = useMemo(() => {
    const items = Object.entries(dashboardConfig).map(([href, config]) => ({
      href,
      label: config.title,
      icon: config.icon,
      badge: config.badge,
      category: config.category,
    }));

    // Filtriraj samo validne stavke sa komponentama ili posebnim uslovima
    return items.filter(item => {
      if (item.href === "/profile/saved-searches" && !userData?.has_saved_searches) return false;
      if (item.href === "/purchases" && !userData?.has_purchases) return false;
      return true;
    });
  }, [dashboardConfig, userData]);

  // Get categories from items
  const categories = useMemo(() => {
    const cats = [...new Set(navigationItems.map(item => item.category))];
    return ["sve", ...cats];
  }, [navigationItems]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    let filtered = navigationItems;
    
    // Apply category filter
    if (activeCategory !== "sve") {
      filtered = filtered.filter(item => item.category === activeCategory);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [navigationItems, activeCategory, searchQuery]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  // Sidebar width
  const sidebarWidth = sidebarExpanded ? "280px" : "88px";

  return (
    <Layout currentPageId="profile" parentPage="profile">
      <div className="min-h-screen bg-slate-50">
        {/* Breadcrumb */}
        <div className="border-b border-slate-200 bg-white">
          <div className="container mx-auto px-4 lg:px-6 py-3">
            <BreadCrumb title2={currentConfig.title} />
          </div>
        </div>

        {/* Main Container */}
        <div className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
          {/* Dashboard Header */}
          <DashboardHeader userData={userData} currentConfig={currentConfig} />

          {/* Main Grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Sidebar */}
            {!isMobile && (
              <aside
                className={cn(
                  "lg:sticky lg:top-24 self-start transition-all duration-300 ease-out",
                  sidebarExpanded ? "lg:w-[280px]" : "lg:w-[88px]"
                )}
                style={{ height: "calc(100vh - 180px)" }}
              >
                <div className={cn(
                  "bg-white rounded-xl border border-slate-200 h-full",
                  "flex flex-col transition-all duration-300"
                )}>
                  {/* Sidebar Header */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      {sidebarExpanded && (
                        <h3 className="text-sm font-bold text-slate-900">Navigacija</h3>
                      )}
                      <button
                        onClick={toggleSidebar}
                        className={cn(
                          "p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200",
                          "text-slate-600 hover:text-primary"
                        )}
                        title={sidebarExpanded ? "Sakrij meni" : "Prikaži meni"}
                      >
                        {sidebarExpanded ? (
                          <FiChevronLeft size={20} />
                        ) : (
                          <FiChevronRight size={20} />
                        )}
                      </button>
                    </div>

                    {/* Search */}
                    {sidebarExpanded && (
                      <div className="mt-4 relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          placeholder="Pretraži..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <FiX size={18} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Categories */}
                  {sidebarExpanded && (
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={cn(
                              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 capitalize",
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

                  {/* Navigation Items */}
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className={cn(
                      "space-y-1",
                      sidebarExpanded ? "space-y-1" : "space-y-2"
                    )}>
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

                    {/* No Results */}
                    {filteredItems.length === 0 && (
                      <div className="text-center py-8">
                        <FiSearch className="mx-auto text-slate-300 mb-3" size={32} />
                        <p className="text-sm text-slate-500">Nema rezultata</p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Footer */}
                  {sidebarExpanded && (
                    <div className="p-4 border-t border-slate-100">
                      <div className="space-y-2">
                        <CustomLink
                          href="/help"
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors duration-200"
                        >
                          <FiHelpCircle size={18} />
                          <span>Pomoć & Podrška</span>
                        </CustomLink>
                        <CustomLink
                          href="/settings"
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors duration-200"
                        >
                          <BiCog size={18} />
                          <span>Napredne postavke</span>
                        </CustomLink>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            )}

            {/* Main Content */}
            <main className={cn(
              "flex-1 min-w-0",
              !isMobile && sidebarExpanded ? "lg:ml-0" : "lg:ml-0"
            )}>
              {/* Content Area */}
              <div className={cn(
                "bg-white rounded-xl border border-slate-200 overflow-hidden",
                pathname === "/chat" ? "h-[calc(100vh-250px)]" : "min-h-[600px]"
              )}>
                <div className={cn(
                  pathname === "/chat" ? "h-full" : "p-4 sm:p-6 lg:p-8"
                )}>
                  {currentConfig.component}
                </div>
              </div>

              {/* Quick Actions (Mobile) */}
              {isMobile && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <CustomLink
                    href="/help"
                    className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:border-primary transition-colors duration-200"
                  >
                    <FiHelpCircle size={20} className="text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Pomoć</span>
                  </CustomLink>
                  <CustomLink
                    href="/settings"
                    className="flex items-center justify-center gap-2 p-4 bg-primary text-white border border-primary rounded-xl hover:bg-primary/90 transition-colors duration-200"
                  >
                    <FiSettings size={20} />
                    <span className="text-sm font-medium">Postavke</span>
                  </CustomLink>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobile && (
          <MobileNavigation 
            activePath={pathname}
            navigationItems={navigationItems}
            userData={userData}
          />
        )}

        {/* Bottom Spacer for Mobile */}
        {isMobile && <div className="h-20" />}
      </div>
    </Layout>
  );
};

export default Checkauth(ProfileDashboard);