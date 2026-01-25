"use client";

import ProfileNavigation from "@/components/Profile/ProfileNavigation";
import { usePathname } from "next/navigation";
import Checkauth from "@/HOC/Checkauth";
import Notifications from "../Notifications/Notifications";
import Profile from "@/components/Profile/Profile";
import MyAds from "../MyAds/MyAds";
import Favorites from "../Favorites/Favorites";
import Transactions from "../Transactions/Transactions";
import Reviews from "../Reviews/Reviews";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import Chat from "../Chat/Chat";
import Layout from "@/components/Layout/Layout";
import ProfileSubscription from "../Subscription/ProfileSubscription";
import JobApplications from "../JobApplications/JobApplications";
import { useMediaQuery } from "usehooks-ts";
import BlockedUsersMenu from "../Chat/BlockedUsersMenu";
import { cn } from "@/lib/utils";

// Icons
import {
  FiUser,
  FiBell,
  FiLayers,
  FiHeart,
  FiCreditCard,
  FiStar,
  FiMessageSquare,
  FiBriefcase,
} from "react-icons/fi";
import { BiBadgeCheck } from "react-icons/bi";

const ProfileDashboard = () => {
  const pathname = usePathname();
  const isSmallerThanLaptop = useMediaQuery("(max-width: 1200px)");

  const dashboardConfig = {
    "/profile": {
      title: "Moj profil",
      description: "Uredi lične podatke i postavke naloga.",
      icon: <FiUser className="w-5 h-5" />,
      component: <Profile />,
    },
    "/notifications": {
      title: "Obavijesti",
      description: "Pregled svih obavijesti i aktivnosti na tvom nalogu.",
      icon: <FiBell className="w-5 h-5" />,
      component: <Notifications />,
    },
    "/user-subscription": {
      title: "Pretplata",
      description: "Status tvoje pretplate i dostupni paketi.",
      icon: <BiBadgeCheck className="w-5 h-5" />,
      component: <ProfileSubscription />,
    },
    "/my-ads": {
      title: "Moji oglasi",
      description: "Upravljaj aktivnim, isteklim i arhiviranim oglasima.",
      icon: <FiLayers className="w-5 h-5" />,
      component: <MyAds />,
    },
    "/favorites": {
      title: "Omiljeni",
      description: "Oglasi koje si sačuvao/la za kasnije.",
      icon: <FiHeart className="w-5 h-5" />,
      component: <Favorites />,
    },
    "/transactions": {
      title: "Transakcije",
      description: "Historija tvojih plaćanja i transakcija.",
      icon: <FiCreditCard className="w-5 h-5" />,
      component: <Transactions />,
    },
    "/reviews": {
      title: "Recenzije",
      description: "Ocjene i dojmovi koje si dobio/la od drugih korisnika.",
      icon: <FiStar className="w-5 h-5" />,
      component: <Reviews />,
    },
    "/chat": {
      title: "Poruke",
      description: "Direktna komunikacija sa drugim korisnicima.",
      icon: <FiMessageSquare className="w-5 h-5" />,
      component: <Chat />,
    },
    "/job-applications": {
      title: "Prijave za posao",
      description: "Pregled tvojih prijava i statusa prijava.",
      icon: <FiBriefcase className="w-5 h-5" />,
      component: <JobApplications />,
    },
  };

  const currentConfig = dashboardConfig[pathname] || dashboardConfig["/profile"];
  const isChat = pathname === "/chat";

  return (
    <Layout currentPageId="profile" parentPage="profile">
      {/* Blagi background da cijeli profil izgleda “sređenije” */}
      <div className="min-h-[calc(100vh-60px)] bg-gradient-to-b from-slate-50 via-white to-white">
        {/* Breadcrumb (ostaje) */}
        <div className="pt-4">
          <BreadCrumb title2={currentConfig.title} />
        </div>

        <div className="container mt-6 sm:mt-8 pb-10">
          {/* Navigacija + user header */}
          <ProfileNavigation />

          {/* HERO header (novo) */}
          <div className="mt-4 sm:mt-6">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="relative">
                {/* dekor */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
                <div className="relative px-4 sm:px-6 py-5 sm:py-6 flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    <div className="shrink-0 rounded-2xl p-3 bg-primary/10 text-primary border border-primary/10">
                      {currentConfig.icon}
                    </div>

                    <div className="min-w-0">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                        {currentConfig.title}
                      </h1>
                      <p className="text-sm sm:text-base text-gray-600 mt-1 line-clamp-2">
                        {currentConfig.description}
                      </p>
                    </div>
                  </div>

                  {/* Specijalni meni za Chat na manjim ekranima */}
                  {isChat && isSmallerThanLaptop && (
                    <div className="shrink-0">
                      <BlockedUsersMenu />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT (novo: ljepši frame + bolji padding) */}
          <div className="mt-4 sm:mt-6">
            <div
              className={cn(
                "bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden",
                isChat
                  ? "sm:h-[660px] lg:h-[820px]"
                  : "min-h-[520px]"
              )}
            >
              <div
                className={cn(
                  isChat ? "h-full" : "p-4 sm:p-6 lg:p-8"
                )}
              >
                {currentConfig.component}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkauth(ProfileDashboard);
