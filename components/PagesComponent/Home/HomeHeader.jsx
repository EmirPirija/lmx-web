"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import FirebaseData from "@/utils/Firebase.js";
import { t, truncate } from "@/utils";
import { useNavigate } from "@/components/Common/useNavigate.jsx";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage.jsx";

import {
  getIsLoggedIn,
  logoutSuccess,
  userSignUpData,
} from "@/redux/reducer/authSlice.js";
import { getIsFreAdListing, settingsData } from "@/redux/reducer/settingSlice";
import { CategoryData, getIsCatLoading } from "@/redux/reducer/categorySlice.js";
import { getCityData } from "@/redux/reducer/locationSlice";

import ProfileDropdown from "./ProfileDropdown.jsx";
import HomeMobileMenu from "./HomeMobileMenu.jsx";
import HeaderCategories from "./HeaderCategories.jsx";
import UnauthorizedModal from "@/components/Auth/UnauthorizedModal.jsx";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import MailSentSuccessModal from "@/components/Auth/MailSentSuccessModal.jsx";
import { ThemeToggle } from "@/components/ThemeToggle";

import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import FilterTree from "@/components/Filter/FilterTree";
import { deleteUser, getAuth } from "firebase/auth";

import {
  deleteUserApi,
  getLimitsApi,
  logoutApi,
  chatListApi,
  getNotificationList,
} from "@/utils/api.js";

import { Loader2 } from "lucide-react";
import { IoIosAddCircleOutline } from "react-icons/io";
import { MapPin, MessageSquareMore } from "lucide-react";


import {
  IconMenu2,
  IconBell,
  IconMapPin,
  IconHome,
  IconUserCircle,
  IconCirclePlus,
  IconListDetails,
  IconLoader2,
  IconCurrencyDollar,
  IconHeart,
  IconFileText,
  IconMessage,
  IconBriefcase,
  IconTrash,
  IconLogout,
  IconCategory2,
  IconDotsCircleHorizontal,
} from "@tabler/icons-react";

import {
  getIsLoginModalOpen,
  setIsLoginOpen,
} from "@/redux/reducer/globalStateSlice.js";

const Search = dynamic(() => import("./Search.jsx"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/Auth/LoginModal.jsx"), {
  ssr: false,
});
const RegisterModal = dynamic(
  () => import("@/components/Auth/RegisterModal.jsx"),
  { ssr: false }
);
const LocationModal = dynamic(
  () => import("@/components/Location/LocationModal.jsx"),
  { ssr: false }
);

const HeaderCategoriesSkeleton = () => (
  <div className="container">
    <div className="py-1.5 border-b">
      <Skeleton className="w-full h-[40px]" />
    </div>
  </div>
);

// Helpers
const safeList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
  return [];
};

const HomeHeader = () => {
  const { navigate } = useNavigate();
  const { signOut } = FirebaseData();
  const pathname = usePathname();

  const isLargeScreen = useMediaQuery("(min-width: 992px)");

  const handleProfileQuick = () => {
    setIsMobileMenuOpen(false);
    if (!IsLoggedin) setIsLoginOpen(true);
    else navigate("/profile");
  };

  // Redux
  const userData = useSelector(userSignUpData);
  const IsLoggedin = useSelector(getIsLoggedIn);
  const IsLoginOpen = useSelector(getIsLoginModalOpen);
  const isCategoryLoading = useSelector(getIsCatLoading);
  const cateData = useSelector(CategoryData);
  const IsFreeAdListing = useSelector(getIsFreAdListing);
  const cityData = useSelector(getCityData);
  const settings = useSelector(settingsData);

  // Local UI
  const [IsRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [IsLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [IsLogout, setIsLogout] = useState(false);
  const [IsLoggingOut, setIsLoggingOut] = useState(false);
  const [IsUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [IsAdListingClicked, setIsAdListingClicked] = useState(false);
  const [IsMailSentSuccess, setIsMailSentSuccess] = useState(false);

  // Mobile header sheet
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Delete account (mobile dialog)
  const [manageDeleteAccount, setManageDeleteAccount] = useState({
    IsDeleteAccount: false,
    IsDeleting: false,
  });

  // Counts
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [totalUnreadNotifications, setTotalUnreadNotifications] = useState(0);

  useEffect(() => {
    if (isLargeScreen && isMobileMenuOpen) setIsMobileMenuOpen(false);
  }, [isLargeScreen, isMobileMenuOpen]);

  // --- unread chat count ---
  useEffect(() => {
    let isMounted = true;

    const extractChatData = (res) => {
      const rootData = res?.data;
      if (!rootData || rootData.error) return [];
      const dataLayer1 = rootData.data;
      if (Array.isArray(dataLayer1)) return dataLayer1;
      if (dataLayer1 && Array.isArray(dataLayer1.data)) return dataLayer1.data;
      return [];
    };

    const fetchUnreadCount = async () => {
      if (!IsLoggedin) {
        setTotalUnreadMessages(0);
        return;
      }

      try {
        const [buyerRes, sellerRes] = await Promise.all([
          chatListApi.chatList({ type: "buyer", page: 1 }),
          chatListApi.chatList({ type: "seller", page: 1 }),
        ]);

        if (!isMounted) return;

        const buyerChats = extractChatData(buyerRes);
        const sellerChats = extractChatData(sellerRes);

        let count = 0;
        buyerChats.forEach((chat) => {
          if (chat.is_muted === true) return;
          count += Number(chat?.unread_chat_count || 0);
        });
        sellerChats.forEach((chat) => {
          if (chat.is_muted === true) return;
          count += Number(chat?.unread_chat_count || 0);
        });

        setTotalUnreadMessages(count);
      } catch (error) {
        console.error("Greška prilikom dohvatanja poruka:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [IsLoggedin, pathname]);

  // --- unread notifications count ---
  useEffect(() => {
    let isMounted = true;

    const fetchUnreadNotifications = async () => {
      if (!IsLoggedin) {
        setTotalUnreadNotifications(0);
        return;
      }

      try {
        const res = await getNotificationList.getNotification({ page: 1 });
        if (!isMounted) return;

        const payload = res?.data?.data ?? res?.data ?? null;
        const list = safeList(payload);

        const unread = list.filter((n) => !n?.read_at && !n?.is_read).length;
        setTotalUnreadNotifications(Number(unread || 0));
      } catch (e) {
        console.error("Greška prilikom dohvatanja notifikacija:", e);
      }
    };

    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 45000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [IsLoggedin, pathname]);

  const locationText = cityData?.formattedAddress;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();

      const res = await logoutApi.logoutApi({
        ...(userData?.fcm_id && { fcm_token: userData?.fcm_id }),
      });

      if (res?.data?.error === false) {
        logoutSuccess();
        toast.success(t("signOutSuccess"));
        setIsLogout(false);
        if (pathname !== "/") navigate("/");
      } else {
        toast.error(
          res?.data?.message || "Odjava nije uspjela. Pokušajte ponovo."
        );
      }
    } catch (error) {
      console.log("Neuspješna odjava", error);
      toast.error("Odjava nije uspjela. Pokušajte ponovo.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAdListing = async () => {
    setIsMobileMenuOpen(false);

    if (!IsLoggedin) {
      setIsLoginOpen(true);
      return;
    }
    if (!userData?.name || !userData?.email) {
      setIsUpdatingProfile(true);
      return;
    }

    if (IsFreeAdListing) {
      navigate("/ad-listing");
      return;
    }

    try {
      setIsAdListingClicked(true);
      const res = await getLimitsApi.getLimits({ package_type: "item_listing" });
      if (res?.data?.error === false) {
        navigate("/ad-listing");
      } else {
        toast.error(t("purchasePlan"));
        navigate("/subscription");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsAdListingClicked(false);
    }
  };

  const handleUpdateProfile = () => {
    setIsUpdatingProfile(false);
    navigate("/profile");
  };

  const handleDeleteAcc = async () => {
    try {
      setManageDeleteAccount((prev) => ({ ...prev, IsDeleting: true }));
      const auth = getAuth();
      const user = auth.currentUser;

      await deleteUser(user);
      await deleteUserApi.deleteUser();

      logoutSuccess();
      toast.success(t("userDeleteSuccess"));
      setManageDeleteAccount({ IsDeleteAccount: false, IsDeleting: false });

      if (pathname !== "/") navigate("/");
    } catch (error) {
      console.error("Greška prilikom brisanja korisnika:", error?.message);
      if (error?.code === "auth/requires-recent-login") {
        logoutSuccess();
        toast.error(t("deletePop"));
        setManageDeleteAccount({ IsDeleteAccount: false, IsDeleting: false });
      } else {
        toast.error("Brisanje računa nije uspjelo. Pokušajte ponovo.");
      }
    } finally {
      setManageDeleteAccount((prev) => ({ ...prev, IsDeleting: false }));
    }
  };

  const handleChatClick = () => {
    setIsMobileMenuOpen(false);
    if (!IsLoggedin) setIsLoginOpen(true);
    else navigate("/chat");
  };

  const handleNotificationsClick = () => {
    setIsMobileMenuOpen(false);
    if (!IsLoggedin) setIsLoginOpen(true);
    else navigate("/notifications");
  };

  const handleFavoritesClick = () => {
    setIsMobileMenuOpen(false);
    if (!IsLoggedin) setIsLoginOpen(true);
    else navigate("/favorites");
  };

  const handleMyAdsClick = () => {
    setIsMobileMenuOpen(false);
    if (!IsLoggedin) setIsLoginOpen(true);
    else navigate("/my-ads");
  };

  const openLocationEditModal = () => {
    setIsMobileMenuOpen(false);
    setIsLocationModalOpen(true);
  };

  // Mobile menu items (postojeće, samo zadržano)
  const isHomeActive = pathname === "/";
  const isProfileActive = pathname.startsWith("/profile");
  const isChatActive = pathname.startsWith("/chat");
  const isMyAdsActive = pathname.startsWith("/my-ads");
  const isFavoritesActive = pathname.startsWith("/favorites");

  const showMobileMenu = !!userData;
  const showMobileCategories = !pathname.startsWith("/ads");

  const mainNavItems = (
    <div className="flex flex-col border-b border-border pb-2 mb-2">
      <CustomLink
        href="/"
        className={`flex items-center gap-3 py-3 px-2 rounded-lg ${
          isHomeActive ? "bg-primary/10 text-primary" : ""
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconHome size={22} className={isHomeActive ? "text-primary" : ""} />
        <span className={isHomeActive ? "font-medium" : ""}>Početna</span>
      </CustomLink>

      <CustomLink
        href="/profile"
        className={`flex items-center gap-3 py-3 px-2 rounded-lg ${
          isProfileActive ? "bg-primary/10 text-primary" : ""
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconUserCircle
          size={22}
          className={isProfileActive ? "text-primary" : ""}
        />
        <span className={isProfileActive ? "font-medium" : ""}>
          {t("myProfile")}
        </span>
      </CustomLink>

      <button
        onClick={handleChatClick}
        className={`flex items-center gap-3 py-3 px-2 rounded-lg text-left w-full ${
          isChatActive ? "bg-primary/10 text-primary" : ""
        }`}
      >
        <div className="relative">
          <MessageSquareMore
            size={22}
            className={isChatActive ? "text-primary" : ""}
          />
          {IsLoggedin && totalUnreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-[2px] rounded-full bg-red-600 text-white text-[10px] font-bold border-2 border-background">
              {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
            </span>
          )}
        </div>
        <span className={isChatActive ? "font-medium" : ""}>Poruke</span>
      </button>

      <button
        onClick={handleAdListing}
        disabled={IsAdListingClicked}
        className="flex items-center gap-3 py-3 px-2 rounded-lg text-left w-full bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        {IsAdListingClicked ? (
          <IconLoader2 size={22} className="animate-spin text-primary" />
        ) : (
          <IconCirclePlus size={22} className="text-primary" />
        )}
        <span className="font-medium text-primary">{t("adListing")}</span>
      </button>

      <CustomLink
        href="/my-ads"
        className={`flex items-center gap-3 py-3 px-2 rounded-lg ${
          isMyAdsActive ? "bg-primary/10 text-primary" : ""
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconListDetails
          size={22}
          className={isMyAdsActive ? "text-primary" : ""}
        />
        <span className={isMyAdsActive ? "font-medium" : ""}>{t("myAds")}</span>
      </CustomLink>
    </div>
  );

  const secondaryNavItems = (
    <div className="flex flex-col">
      
      <button
        onClick={handleNotificationsClick}
        className="flex items-center justify-between gap-3 py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <IconBell size={22} />
          <span>{t("notifications")}</span>
        </div>
        {IsLoggedin && totalUnreadNotifications > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {totalUnreadNotifications > 99 ? "99+" : totalUnreadNotifications}
          </span>
        )}
      </button>

      <CustomLink
        href="/user-subscription"
        className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted transition-colors"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconCurrencyDollar size={22} />
        <span>{t("subscription")}</span>
      </CustomLink>

      <CustomLink
        href="/favorites"
        className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted transition-colors"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconHeart size={22} />
        <span>{t("favorites")}</span>
      </CustomLink>

      <CustomLink
        href="/transactions"
        className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted transition-colors"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconFileText size={22} />
        <span>{t("transaction")}</span>
      </CustomLink>

      <CustomLink
        href="/reviews"
        className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted transition-colors"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconMessage size={22} />
        <span>{t("myReviews")}</span>
      </CustomLink>

      <CustomLink
        href="/job-applications"
        className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted transition-colors"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconBriefcase size={22} />
        <span>{t("jobApplications")}</span>
      </CustomLink>
    </div>
  );

  const actionItems = (
    <div className="flex flex-col border-t border-border pt-2 mt-2">
      <button
        onClick={() => {
          setIsMobileMenuOpen(false);
          setIsLogout(true);
        }}
        className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left w-full"
      >
        <IconLogout size={22} />
        <span>{t("signOut")}</span>
      </button>

      <button
        onClick={() => {
          setIsMobileMenuOpen(false);
          setManageDeleteAccount((prev) => ({ ...prev, IsDeleteAccount: true }));
        }}
        className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive text-left w-full"
      >
        <IconTrash size={22} />
        <span>{t("deleteAccount")}</span>
      </button>
    </div>
  );

  const logoSrc = settings?.header_logo;
  const brandName = settings?.company_name || settings?.app_name || "LMX";
  const brandTagline = "Prodaj, kupi i pronađi brzo.";
  const isOnHome = pathname === "/";

  return (
    <>
      {/* ✅ Clean 2-row header (desktop) + mobile quick actions dole */}
      <header className="top-0 z-50 border-b bg-white/75 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/75 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <nav className="container">
          {isLargeScreen ? (
            <>
              {/* DESKTOP: GORE quick actions */}
              <div className="flex items-center justify-between gap-3 pt-3 pb-2 lg:pt-4">
                <div className="flex">
                {/* left: lokacija */}
                <button
                  className="group flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
                  onClick={() => setIsLocationModalOpen(true)}
                  type="button"
                  aria-label="Lokacija"
                  title="Lokacija"
                >
                  <MapPin
                    size={18}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 max-w-[220px] truncate">
                    {locationText || "Dodaj lokaciju"}
                  </span>
                </button>
                  {/* Theme Toggle (desno) */}
                  <ThemeToggle />
                </div>

                {/* right: (od desna) Theme, Poruke, Moji oglasi, Profil */}
                <div className="flex items-center gap-2">
                  {/* PROFIL (lijevo u ovom bloku) */}
                  {IsLoggedin ? (
                    <div className="flex items-center gap-2">
                      {/* ✅ Ime korisnika (desktop) */}
                      {userData?.name && (
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {truncate(userData.name, 20)}
                        </span>
                      )}
                      <ProfileDropdown
                        setIsLogout={setIsLogout}
                        IsLogout={IsLogout}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsLoginOpen(true)}
                        className="px-3 py-2 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        type="button"
                        title="Prijava"
                      >
                        {truncate(t("login"), 12)}
                      </button>
                      <button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="px-3 py-2 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        type="button"
                        title="Registracija"
                      >
                        {truncate(t("register"), 12)}
                      </button>
                    </div>
                  )}

                  {/* PORUKE */}
                  <button
                    onClick={handleChatClick}
                    className="relative w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 grid place-items-center transition-all duration-200 hover:scale-[1.04] active:scale-[0.98]"
                    title="Poruke"
                    type="button"
                    aria-label="Poruke"
                  >
                    <MessageSquareMore
                      size={20}
                      className="text-slate-700 dark:text-slate-300"
                    />
                    {IsLoggedin && totalUnreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                        {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                      </span>
                    )}
                  </button>

                  {/* MOJI OGLASI (ikonica) */}
                  <button
  onClick={handleMyAdsClick}
  className={`relative h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 flex items-center gap-2 px-3 transition-all duration-200 hover:scale-[1.04] active:scale-[0.98] ${
    isMyAdsActive ? "text-primary" : "text-slate-700 dark:text-slate-300"
  }`}
  title="Moji oglasi"
  type="button"
  aria-label="Moji oglasi"
>
  <IconListDetails size={20} strokeWidth={isMyAdsActive ? 2.5 : 1.8} />
  <span className="text-sm font-medium whitespace-nowrap">Moji oglasi</span>
</button>


                </div>
              </div>

              {/* DESKTOP: DOLE brand + search + CTA */}
              <div className="flex items-center gap-3 pb-3 lg:pb-4">
                {/* search */}
                <div className="flex-1">
                  <div className="mx-auto transition-transform duration-300 hover:scale-[1.01]">
                    <Search />
                  </div>
                </div>

                {/* extra: CTA */}
                <button
                  className="ml-1 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  disabled={IsAdListingClicked}
                  onClick={handleAdListing}
                  title="Objavi oglas"
                  type="button"
                >
                  {IsAdListingClicked ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <IoIosAddCircleOutline size={18} />
                  )}
                  <span className="hidden md:inline">Objavi oglas</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* MOBILE: GORE (brand + right actions) */}
              <div className="flex items-center justify-between gap-2 pt-3 pb-2">
                                  {/* Theme Toggle (desno) */}
                                  <ThemeToggle />

                {/* Right side: (od desna) Theme, Poruke, Moji oglasi, Profil */}
                <div className="flex items-center gap-1.5">
                  {/* Lokacija (ostaje lijevo u ovom bloku) */}
                  <button
                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 grid place-items-center transition-all"
                    onClick={() => setIsLocationModalOpen(true)}
                    type="button"
                    aria-label="Lokacija"
                    title={locationText || "Dodaj lokaciju"}
                  >
                    <MapPin
                      size={16}
                      className="text-slate-600 dark:text-slate-400"
                    />
                  </button>

                  {/* Profil (prije oglasa/poruka/theme) */}
                  {IsLoggedin ? (
                    <ProfileDropdown
                      setIsLogout={setIsLogout}
                      IsLogout={IsLogout}
                      hideNameOnMobile={false}
                    />
                  ) : (
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 grid place-items-center transition-all"
                      type="button"
                      aria-label="Prijava"
                      title="Prijava"
                    >
                      <IconUserCircle
                        size={20}
                        className="text-slate-600 dark:text-slate-400"
                      />
                    </button>
                  )}

                  {/* Moji oglasi */}
                  <button
                    className={`w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 grid place-items-center transition-all ${
                      isMyAdsActive
                        ? "text-primary"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                    onClick={handleMyAdsClick}
                    type="button"
                    aria-label="Moji oglasi"
                    title="Moji oglasi"
                  >
                    <IconListDetails
                      size={18}
                      strokeWidth={isMyAdsActive ? 2.5 : 1.8}
                    />
                  </button>

                  {/* Poruke */}
                  <button
                    onClick={handleChatClick}
                    className="relative w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 grid place-items-center transition-all"
                    title="Poruke"
                    type="button"
                    aria-label="Poruke"
                  >
                    <MessageSquareMore
                      size={18}
                      className="text-slate-700 dark:text-slate-300"
                    />
                    {IsLoggedin && totalUnreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                        {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* MOBILE: Search */}
              <div className="pb-3">
                <div className="transition-transform duration-300 hover:scale-[1.01]">
                  <Search />
                </div>
              </div>
            </>
          )}
        </nav>

        {/* soft line */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200/70 dark:via-slate-700/70 to-transparent" />
      </header>

      {/* categories (isto kao prije) */}
      {isCategoryLoading && !cateData.length ? (
        <HeaderCategoriesSkeleton />
      ) : (
        cateData && cateData.length > 0 && <HeaderCategories cateData={cateData} />
      )}

      {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
      {!isLargeScreen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          {/* Gradient shadow */}
          <div className="absolute inset-x-0 -top-4 h-4 bg-gradient-to-t from-white/80 dark:from-slate-900/80 to-transparent pointer-events-none" />

          <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-area-pb">
            <div className="grid grid-cols-5 h-16">
              {/* Moji oglasi */}
              <button
                type="button"
                onClick={handleMyAdsClick}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isMyAdsActive ? "text-primary" : "text-slate-600 dark:text-slate-400"
                }`}
                aria-label="Moji oglasi"
              >
                <IconListDetails size={22} strokeWidth={isMyAdsActive ? 2.5 : 1.5} />
                <span className={`text-[10px] ${isMyAdsActive ? "font-semibold" : ""}`}>
                  Moji oglasi
                </span>
              </button>

              {/* Poruke */}
              <button
                type="button"
                onClick={handleChatClick}
                className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isChatActive ? "text-primary" : "text-slate-600 dark:text-slate-400"
                }`}
                aria-label="Poruke"
              >
                <div className="relative">
                  <MessageSquareMore size={22} strokeWidth={isChatActive ? 0.5 : 0} />
                  {IsLoggedin && totalUnreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                      {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] ${isChatActive ? "font-semibold" : ""}`}>
                  Poruke
                </span>
              </button>

              {/* Objavi oglas - centralni, istaknut */}
              <button
                type="button"
                onClick={handleAdListing}
                disabled={IsAdListingClicked}
                className="flex flex-col items-center justify-center gap-0.5 -mt-3"
                aria-label="Objavi oglas"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-95">
                  {IsAdListingClicked ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <IoIosAddCircleOutline size={26} />
                  )}
                </div>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Objavi
                </span>
              </button>

              {/* Favoriti */}
              <button
                type="button"
                onClick={handleFavoritesClick}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isFavoritesActive ? "text-primary" : "text-slate-600 dark:text-slate-400"
                }`}
                aria-label="Favoriti"
              >
                <IconHeart size={22} strokeWidth={isFavoritesActive ? 2.5 : 1.5} />
                <span className={`text-[10px] ${isFavoritesActive ? "font-semibold" : ""}`}>
                  Favoriti
                </span>
              </button>

              {/* Više - otvara Sheet */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-0.5 text-slate-600 dark:text-slate-400"
                    aria-label="Više opcija"
                  >
                    <IconDotsCircleHorizontal size={22} strokeWidth={1.5} />
                    <span className="text-[10px]">Više</span>
                  </button>
                </SheetTrigger>

                <SheetContent
                  side="bottom"
                  className="p-0 overflow-y-auto max-h-[85vh] rounded-t-2xl border-t bg-background"
                >
                  {/* header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      
                      {userData ? (
                        <CustomLink
                          href="/profile"
                          className="flex items-center gap-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <IconUserCircle size={24} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{userData?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {userData?.email}
                            </p>
                          </div>
                        </CustomLink>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              setIsLoginOpen(true);
                            }}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                          >
                            {t("login")}
                          </button>
                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              setIsRegisterModalOpen(true);
                            }}
                            className="px-4 py-2 border border-border rounded-lg font-medium"
                          >
                            {t("register")}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Lokacija */}
                    <div
                      className="mt-1 flex items-center gap-2 p-3 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={openLocationEditModal}
                      role="button"
                      tabIndex={0}
                    >
                      <IconMapPin size={18} className="text-muted-foreground" />
                      <p className="text-sm line-clamp-1">
                        {locationText || "Dodaj lokaciju"}
                      </p>
                    </div>
                  </div>

                  {/* sadržaj */}
                  {showMobileMenu && showMobileCategories ? (
                    <Tabs defaultValue="menu">
                      <TabsList className="flex items-center justify-between bg-muted rounded-none border-b">
                        <TabsTrigger
                          value="menu"
                          className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none"
                        >
                          Meni
                        </TabsTrigger>
                        <TabsTrigger
                          value="categories"
                          className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none"
                        >
                          Kategorije
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="menu" className="px-4 py-2 pb-20">
                        {mainNavItems}
                        {secondaryNavItems}
                        {actionItems}
                      </TabsContent>

                      <TabsContent value="categories" className="p-4 pb-20">
                        <FilterTree />
                      </TabsContent>
                    </Tabs>
                  ) : showMobileMenu ? (
                    <div className="px-4 py-2 pb-20">
                      {mainNavItems}
                      {secondaryNavItems}
                      {actionItems}
                    </div>
                  ) : showMobileCategories ? (
                    <div className="p-4 pb-20">
                      <h1 className="font-medium mb-4">Kategorije</h1>
                      <FilterTree />
                    </div>
                  ) : null}
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      )}

      {/* Spacer za mobile bottom nav - da content ne bude prekriven */}
      {!isLargeScreen && <div className="h-16 lg:hidden" />}

      {/* modals (isto kao prije) */}
      <LoginModal
        key={IsLoginOpen}
        IsLoginOpen={IsLoginOpen}
        setIsRegisterModalOpen={setIsRegisterModalOpen}
      />

      <RegisterModal
        setIsMailSentSuccess={setIsMailSentSuccess}
        IsRegisterModalOpen={IsRegisterModalOpen}
        setIsRegisterModalOpen={setIsRegisterModalOpen}
        key={`${IsRegisterModalOpen}-register-modal`}
      />

      <MailSentSuccessModal
        IsMailSentSuccess={IsMailSentSuccess}
        setIsMailSentSuccess={setIsMailSentSuccess}
      />

      <ReusableAlertDialog
        open={IsLogout}
        onCancel={() => setIsLogout(false)}
        onConfirm={handleLogout}
        title={t("confirmLogout")}
        description={t("areYouSureToLogout")}
        cancelText={t("cancel")}
        confirmText={t("yes")}
        confirmDisabled={IsLoggingOut}
      />

      <ReusableAlertDialog
        open={IsUpdatingProfile}
        onCancel={() => setIsUpdatingProfile(false)}
        onConfirm={handleUpdateProfile}
        title={t("updateProfile")}
        description={t("youNeedToUpdateProfile")}
        confirmText={t("goToProfile")}
        cancelText={t("cancel")}
      />

      <ReusableAlertDialog
        open={manageDeleteAccount.IsDeleteAccount}
        onCancel={() =>
          setManageDeleteAccount((prev) => ({ ...prev, IsDeleteAccount: false }))
        }
        onConfirm={handleDeleteAcc}
        title={t("deleteAccount")}
        description={t("deleteAccountText")}
        cancelText={t("cancel")}
        confirmText={t("yes")}
        confirmDisabled={manageDeleteAccount.IsDeleting}
      />

      <UnauthorizedModal IsAdListingClicked={IsAdListingClicked} />

      <LocationModal
        IsLocationModalOpen={IsLocationModalOpen}
        setIsLocationModalOpen={setIsLocationModalOpen}
      />
    </>
  );
};

export default HomeHeader;
