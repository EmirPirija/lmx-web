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
import { t } from "@/utils";
import { useMediaQuery } from "usehooks-ts";
import BlockedUsersMenu from "../Chat/BlockedUsersMenu";
import { cn } from "@/lib/utils";

// Icons
import { 
  FiUser, FiBell, FiLayers, FiHeart, 
  FiCreditCard, FiStar, FiMessageSquare, FiBriefcase 
} from "react-icons/fi";
import { BiBadgeCheck } from "react-icons/bi";

const ProfileDashboard = () => {
  const pathname = usePathname();
  const isSmallerThanLaptop = useMediaQuery("(max-width: 1200px)");

  // Centralizovana konfiguracija
  const dashboardConfig = {
    "/profile": {
      title: t("myProfile"),
      description: "Uredite lične podatke i postavke naloga",
      icon: <FiUser className="w-6 h-6" />,
      component: <Profile />,
    },
    "/notifications": {
      title: t("notifications"),
      description: "Pregled svih vaših obavijesti i aktivnosti",
      icon: <FiBell className="w-6 h-6" />,
      component: <Notifications />,
    },
    "/user-subscription": {
      title: t("subscription"),
      description: "Status vaše pretplate i dostupni paketi",
      icon: <BiBadgeCheck className="w-6 h-6" />,
      component: <ProfileSubscription />,
    },
    "/my-ads": {
      title: t("myAds"),
      description: "Upravljajte svojim aktivnim, isteklim i arhiviranim oglasima",
      icon: <FiLayers className="w-6 h-6" />,
      component: <MyAds />,
    },
    "/favorites": {
      title: t("myFavorites"),
      description: "Lista oglasa koje ste sačuvali za kasnije",
      icon: <FiHeart className="w-6 h-6" />,
      component: <Favorites />,
    },
    "/transactions": {
      title: t("myTransaction"),
      description: "Historija vaših plaćanja i transakcija",
      icon: <FiCreditCard className="w-6 h-6" />,
      component: <Transactions />,
    },
    "/reviews": {
      title: t("reviews"),
      description: "Dojmovi i ocjene koje ste dobili od drugih korisnika",
      icon: <FiStar className="w-6 h-6" />,
      component: <Reviews />,
    },
    "/chat": {
      title: "Poruke",
      description: "Direktna komunikacija sa drugim korisnicima",
      icon: <FiMessageSquare className="w-6 h-6" />,
      component: <Chat />,
    },
    "/job-applications": {
      title: t("jobApplications"),
      description: "Pregled prijava za posao",
      icon: <FiBriefcase className="w-6 h-6" />,
      component: <JobApplications />,
    },
  };

  const currentConfig = dashboardConfig[pathname] || dashboardConfig["/profile"];
  const isChat = pathname === "/chat";

  return (
    <Layout>
      <div className="">
        <BreadCrumb title2={currentConfig.title} />
        
        <div className="container mt-8">
        <ProfileNavigation />
          {/* NAVIGATION - Horizontalni tab menu iznad svega */}

          {/* HEADER SEKCIJA - Naslov i Opis */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary hidden sm:block">
                  {currentConfig.icon}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {currentConfig.title}
                </h1>
              </div>
              <p className="text-gray-500 text-sm sm:text-base ml-0 sm:ml-12">
                {currentConfig.description}
              </p>
            </div>

            {/* Specijalni meni za Chat na manjim ekranima */}
            {isChat && isSmallerThanLaptop && (
              <BlockedUsersMenu />
            )}
          </div>

          {/* MAIN CONTENT - Puna širina ispod navigation-a */}
          <div className="w-full">
            <div
              className={cn(
                "bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300",
                isChat
                ? "sm:h-[640px] lg:h-[800px] overflow-hidden shadow-md"
                : "p-4 sm:p-6 lg:p-8 min-h-[500px]"
              )}
            >
              {currentConfig.component}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkauth(ProfileDashboard);