"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Bell, Layers, Heart, Star, MessageSquare, Briefcase, CreditCard, Receipt } from "lucide-react";

import Layout from "@/components/Layout/Layout";
import ProfileLayout from "@/components/Profile/ProfileLayout";
import CustomLink from "@/components/Common/CustomLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import Notifications from "../Notifications/Notifications";
import MyAds from "../MyAds/MyAds";
import Favorites from "../Favorites/Favorites";
import Transactions from "../Transactions/Transactions";
import Reviews from "../Reviews/Reviews";
import Chat from "../Chat/Chat";
import ProfileSubscription from "../Subscription/ProfileSubscription";
import JobApplications from "../JobApplications/JobApplications";

import { userSignUpData } from "@/redux/reducer/authSlice";

// ============================================
// CONFIG
// ============================================

const PAGE_CONFIGS = {
  "/notifications": {
    title: "Obavijesti",
    subtitle: "Pregledajte sve aktivnosti i obavijesti",
    icon: Bell,
    Component: Notifications,
    badgeKey: "notifications",
  },
  "/my-ads": {
    title: "Moji oglasi",
    subtitle: "Upravljajte aktivnim, isteklim i arhiviranim oglasima",
    icon: Layers,
    Component: MyAds,
  },
  "/favorites": {
    title: "Omiljeni oglasi",
    subtitle: "Oglasi koje ste sačuvali za kasnije",
    icon: Heart,
    Component: Favorites,
  },
  "/transactions": {
    title: "Transakcije",
    subtitle: "Historija svih plaćanja i transakcija",
    icon: Receipt,
    Component: Transactions,
  },
  "/reviews": {
    title: "Recenzije",
    subtitle: "Ocjene i komentari od korisnika",
    icon: Star,
    Component: Reviews,
    badgeKey: "reviews",
  },
  "/chat": {
    title: "Poruke",
    subtitle: "Komunikacija sa drugim korisnicima",
    icon: MessageSquare,
    Component: Chat,
    badgeKey: "messages",
    isChat: true,
  },
  "/user-subscription": {
    title: "Pretplata",
    subtitle: "Status pretplate i dostupni paketi",
    icon: CreditCard,
    Component: ProfileSubscription,
  },
  "/job-applications": {
    title: "Prijave za posao",
    subtitle: "Pregled prijava i statusa",
    icon: Briefcase,
    Component: JobApplications,
  },
};

const DEFAULT_ROUTE = "/my-ads";

// ============================================
// HELPERS
// ============================================

const getUnreadLabel = (count) => {
  if (!count || count <= 0) return null;
  if (count === 1) return "nepročitana";
  return "nepročitanih";
};

const getPageConfig = (pathname, badges) => {
  const base = PAGE_CONFIGS[pathname] || PAGE_CONFIGS[DEFAULT_ROUTE];
  const badge = base.badgeKey ? badges?.[base.badgeKey] || 0 : 0;
  return { ...base, badge };
};

// ============================================
// HOOKS
// ============================================

const usePageBadges = (userData) => {
  const [badges, setBadges] = useState({ messages: 0, notifications: 0, reviews: 0 });

  useEffect(() => {
    if (!userData) return;

    setBadges({
      messages: userData.unread_messages || 0,
      notifications: userData.unread_notifications || 0,
      reviews: userData.pending_reviews || 0,
    });
  }, [userData]);

  return badges;
};

// ============================================
// UI
// ============================================

const PageHeader = ({ config }) => {
  const Icon = config.icon;

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
            <Icon className="w-5 h-5" />
          </div>

          <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">{config.title}</h2>

          {!!config.badge && config.badge > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {config.badge} {getUnreadLabel(config.badge)}
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{config.subtitle}</p>
      </div>

      {!config.isChat && (
        <div className="flex items-center gap-2">
          <CustomLink href="/ad-listing">
            <Button size="sm" className="rounded-xl gap-2 font-semibold">
              <Plus className="w-4 h-4" />
              Novi oglas
            </Button>
          </CustomLink>
        </div>
      )}
    </div>
  );
};

const PageBody = ({ isChat, children }) => {
  if (isChat) {
    return (
      <div
        className={cn(
          "mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700",
          "min-h-[520px] h-[calc(100vh-360px)]"
        )}
      >
        {children}
      </div>
    );
  }

  return <div className="mt-5">{children}</div>;
};

// ============================================
// MAIN
// ============================================

const ProfileDashboard = () => {
  const pathname = usePathname();
  const userData = useSelector(userSignUpData);
  const badges = usePageBadges(userData);

  const config = useMemo(() => getPageConfig(pathname, badges), [pathname, badges]);
  const SelectedPage = config.Component;

  return (
    <Layout>
      <ProfileLayout>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <PageHeader config={config} />
          <PageBody isChat={config.isChat}>
            <SelectedPage />
          </PageBody>
        </motion.div>
      </ProfileLayout>
    </Layout>
  );
};

export default ProfileDashboard;
