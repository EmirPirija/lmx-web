"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import ProfileLayout from "@/components/Profile/ProfileLayout";
import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Import komponenti za dashboard
import Notifications from "../Notifications/Notifications";
import MyAds from "../MyAds/MyAds";
import Favorites from "../Favorites/Favorites";
import Transactions from "../Transactions/Transactions";
import Reviews from "../Reviews/Reviews";
import Chat from "../Chat/Chat";
import ProfileSubscription from "../Subscription/ProfileSubscription";
import JobApplications from "../JobApplications/JobApplications";

import {
  User,
  Bell,
  Layers,
  Heart,
  Star,
  MessageSquare,
  Briefcase,
  CreditCard,
  Receipt,
  Package,
  Plus,
  Filter,
  Search,
  Grid3X3,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Bookmark,
} from "lucide-react";

import { userSignUpData } from "@/redux/reducer/authSlice";

// ============================================
// HOOKS
// ============================================

const usePageBadges = (userData) => {
  const [badges, setBadges] = useState({
    messages: 0,
    notifications: 0,
    reviews: 0,
  });

  useEffect(() => {
    if (userData) {
      setBadges({
        messages: userData.unread_messages || 0,
        notifications: userData.unread_notifications || 0,
        reviews: userData.pending_reviews || 0,
      });
    }
  }, [userData]);

  return badges;
};

// ============================================
// PAGE CONFIGS
// ============================================

const getPageConfig = (pathname, badges) => {
  const configs = {
    "/notifications": {
      title: "Obavijesti",
      subtitle: "Pregledajte sve aktivnosti i obavijesti",
      icon: Bell,
      color: "from-amber-500 to-orange-600",
      component: <Notifications />,
      badge: badges.notifications,
    },
    "/my-ads": {
      title: "Moji oglasi",
      subtitle: "Upravljajte aktivnim, isteklim i arhiviranim oglasima",
      icon: Layers,
      color: "from-blue-500 to-indigo-600",
      component: <MyAds />,
    },
    "/favorites": {
      title: "Omiljeni oglasi",
      subtitle: "Oglasi koje ste sačuvali za kasnije",
      icon: Heart,
      color: "from-pink-500 to-rose-600",
      component: <Favorites />,
    },
    "/transactions": {
      title: "Transakcije",
      subtitle: "Historija svih plaćanja i transakcija",
      icon: Receipt,
      color: "from-emerald-500 to-green-600",
      component: <Transactions />,
    },
    "/reviews": {
      title: "Recenzije",
      subtitle: "Ocjene i komentari od korisnika",
      icon: Star,
      color: "from-amber-500 to-yellow-600",
      component: <Reviews />,
      badge: badges.reviews,
    },
    "/chat": {
      title: "Poruke",
      subtitle: "Komunikacija sa drugim korisnicima",
      icon: MessageSquare,
      color: "from-green-500 to-emerald-600",
      component: <Chat />,
      badge: badges.messages,
      isChat: true,
    },
    "/user-subscription": {
      title: "Pretplata",
      subtitle: "Status pretplate i dostupni paketi",
      icon: CreditCard,
      color: "from-purple-500 to-violet-600",
      component: <ProfileSubscription />,
    },
    "/job-applications": {
      title: "Prijave za posao",
      subtitle: "Pregled prijava i statusa",
      icon: Briefcase,
      color: "from-slate-600 to-slate-800",
      component: <JobApplications />,
    },
  };

  return configs[pathname] || configs["/my-ads"];
};

// ============================================
// COMPONENTS
// ============================================

function PageHeader({ config, showActions = true }) {
  const Icon = config.icon;

  return (
    <div className="mb-8">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-[2rem] p-6 md:p-8 text-white shadow-xl",
          `bg-gradient-to-br ${config.color}`
        )}
      >
        <div className="absolute inset-0 bg-[url('/assets/pattern.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Icon size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black">{config.title}</h1>
                <p className="text-white/80 mt-1">{config.subtitle}</p>
              </div>
            </div>

            {showActions && (
              <div className="flex items-center gap-3">
                <CustomLink href="/ad-listing">
                  <Button className="gap-2 bg-white text-slate-900 hover:bg-white/90 shadow-lg rounded-xl h-11 px-5 font-semibold">
                    <Plus size={18} />
                    <span className="hidden sm:inline">Novi oglas</span>
                  </Button>
                </CustomLink>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {config.badge && config.badge > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-semibold">{config.badge} nepročitan{config.badge === 1 ? 'a' : 'ih'}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ContentWrapper({ children, isChat }) {
  if (isChat) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
        style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
    >
      <div className="p-6 md:p-8">
        {children}
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const ProfileDashboard = () => {
  const pathname = usePathname();
  const userData = useSelector(userSignUpData);
  const badges = usePageBadges(userData);
  
  const config = useMemo(() => getPageConfig(pathname, badges), [pathname, badges]);

  return (
    <ProfileLayout
      title={config.title}
      subtitle={config.subtitle}
      badges={badges}
    >
      <div className="space-y-6">
        {/* Page Header - only show for non-chat pages */}
        {!config.isChat && (
          <PageHeader config={config} />
        )}

        {/* Content */}
        <ContentWrapper isChat={config.isChat}>
          {config.component}
        </ContentWrapper>
      </div>
    </ProfileLayout>
  );
};

export default ProfileDashboard;