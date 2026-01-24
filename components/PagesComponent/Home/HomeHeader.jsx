"use client";
import LanguageDropdown from "@/components/Common/LanguageDropdown";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { getIsFreAdListing, settingsData } from "@/redux/reducer/settingSlice";
import { t, truncate } from "@/utils";
import CustomLink from "@/components/Common/CustomLink";
import { useSelector } from "react-redux";
import { GrLocation } from "react-icons/gr";
import { BsChatDots } from "react-icons/bs";
import { getCityData } from "@/redux/reducer/locationSlice";
import HomeMobileMenu from "./HomeMobileMenu.jsx";
import MailSentSuccessModal from "@/components/Auth/MailSentSuccessModal.jsx";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle.jsx";
import { IconMenu2 } from "@tabler/icons-react";

import {
  getIsLoggedIn,
  logoutSuccess,
  userSignUpData,
} from "@/redux/reducer/authSlice.js";
import ProfileDropdown from "./ProfileDropdown.jsx";
import { toast } from "sonner";
import FirebaseData from "@/utils/Firebase.js";
import {
  CategoryData,
  getIsCatLoading,
} from "@/redux/reducer/categorySlice.js";
import { IoIosAddCircleOutline } from "react-icons/io";
import dynamic from "next/dynamic";
import {
  getIsLoginModalOpen,
  setIsLoginOpen,
} from "@/redux/reducer/globalStateSlice.js";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import {
  deleteUserApi,
  getLimitsApi,
  logoutApi,
  chatListApi,
} from "@/utils/api.js";
import { useMediaQuery } from "usehooks-ts";
import UnauthorizedModal from "@/components/Auth/UnauthorizedModal.jsx";
import CustomImage from "@/components/Common/CustomImage.jsx";
import { Loader2 } from "lucide-react";
import { useNavigate } from "@/components/Common/useNavigate.jsx";
import { usePathname } from "next/navigation.js";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import HeaderCategories from "./HeaderCategories.jsx";
import { deleteUser, getAuth } from "firebase/auth";

// 🔥 IMPORTI ZA MOBILNI MENI U HEADERU
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FilterTree from "@/components/Filter/FilterTree";
import {
  IconDots,
  IconBell,
  IconCurrencyDollar,
  IconHeart,
  IconFileText,
  IconMessage,
  IconBriefcase,
  IconTrash,
  IconLogout,
  IconMapPin,
  IconHome,
  IconUserCircle,
  IconMessageCircle,
  IconCirclePlus,
  IconListDetails,
  IconLoader2,
} from "@tabler/icons-react";

const Search = dynamic(() => import("./Search.jsx"), {
  ssr: false,
});
const LoginModal = dynamic(() => import("@/components/Auth/LoginModal.jsx"), {
  ssr: false,
});
const RegisterModal = dynamic(
  () => import("@/components/Auth/RegisterModal.jsx"),
  {
    ssr: false,
  }
);
const LocationModal = dynamic(
  () => import("@/components/Location/LocationModal.jsx"),
  {
    ssr: false,
  }
);

const HeaderCategoriesSkeleton = () => {
  return (
    <div className="container">
      <div className="py-1.5 border-b">
        <Skeleton className="w-full h-[40px]" />
      </div>
    </div>
  );
};

const HomeHeader = () => {
  // 📦 Framework & Firebase
  const { navigate } = useNavigate();
  const { signOut } = FirebaseData();
  const pathname = usePathname();

  // 🔥 Provjera da li smo na početnoj stranici
  const isHomePage = pathname === "/";

  // 🔌 Redux State
  const userData = useSelector(userSignUpData);
  const IsLoggedin = useSelector(getIsLoggedIn);
  const IsLoginOpen = useSelector(getIsLoginModalOpen);
  const isCategoryLoading = useSelector(getIsCatLoading);
  const cateData = useSelector(CategoryData);
  const IsFreeAdListing = useSelector(getIsFreAdListing);
  const cityData = useSelector(getCityData);
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const settings = useSelector(settingsData);

  // 🎛️ Local UI State
  const [IsRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [IsLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [IsLogout, setIsLogout] = useState(false);
  const [IsLoggingOut, setIsLoggingOut] = useState(false);
  const [IsUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [IsAdListingClicked, setIsAdListingClicked] = useState(false);
  const [IsMailSentSuccess, setIsMailSentSuccess] = useState(false);

  // 🔥 CHAT COUNT STATE
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

  // 🔥 STANJE ZA MOBILNI MENI U HEADERU (za stranice koje nisu početna)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 📱 Media Query
  const isLargeScreen = useMediaQuery("(min-width: 992px)");

  // Delete account state
  const [manageDeleteAccount, setManageDeleteAccount] = useState({
    IsDeleteAccount: false,
    IsDeleting: false,
  });

  useEffect(() => {
    if (isLargeScreen && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isLargeScreen, isMobileMenuOpen]);
  

  // --- LOGIKA ZA BROJANJE PORUKA ---
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
        if (pathname !== "/") {
          navigate("/");
        }
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.log("Neuspješna odjava", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAdListing = async () => {
    setIsMobileMenuOpen(false); // Zatvori meni
    
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
      const res = await getLimitsApi.getLimits({
        package_type: "item_listing",
      });
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

  const locationText = cityData?.formattedAddress;

  const handleDeleteAcc = async () => {
    try {
      setManageDeleteAccount((prev) => ({ ...prev, IsDeleting: true }));
      const auth = getAuth();
      const user = auth.currentUser;
      await deleteUser(user);
      await deleteUserApi.deleteUser();
      logoutSuccess();
      toast.success(t("userDeleteSuccess"));
      setManageDeleteAccount((prev) => ({
        ...prev,
        IsDeleteAccount: false,
      }));
      if (pathname !== "/") {
        navigate("/");
      }
    } catch (error) {
      console.error("Greška prilikom brisanja korisnika:", error.message);
      if (error.code === "auth/requires-recent-login") {
        logoutSuccess();
        toast.error(t("deletePop"));
        setManageDeleteAccount((prev) => ({
          ...prev,
          IsDeleteAccount: false,
        }));
      }
    } finally {
      setManageDeleteAccount((prev) => ({
        ...prev,
        IsDeleting: false,
      }));
    }
  };

  const handleChatClick = () => {
    setIsMobileMenuOpen(false); // Zatvori meni
    if (!IsLoggedin) {
      setIsLoginOpen(true);
    } else {
      navigate("/chat");
    }
  };

  // 🔥 FUNKCIJE ZA MOBILNI MENI U HEADERU
  const openLocationEditModal = () => {
    setIsMobileMenuOpen(false);
    setIsLocationModalOpen(true);
  };

  const handleMobileLogin = () => {
    setIsMobileMenuOpen(false);
    setIsLoginOpen(true);
  };

  const handleMobileRegister = () => {
    setIsMobileMenuOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleMobileSignOut = () => {
    setIsMobileMenuOpen(false);
    setIsLogout(true);
  };

  const handleMobileDeleteAccount = () => {
    setIsMobileMenuOpen(false);
    setManageDeleteAccount((prev) => ({
      ...prev,
      IsDeleteAccount: true,
    }));
  };

  // Provjera aktivne stranice
  const isHomeActive = pathname === "/";
  const isProfileActive = pathname.startsWith("/profile");
  const isChatActive = pathname.startsWith("/chat");
  const isMyAdsActive = pathname.startsWith("/my-ads");

  // 🔥 GLAVNE NAVIGACIJSKE STAVKE (Početna, Profil, Poruke, Objavi, Moji oglasi)
  const mainNavItems = (
    <div className="flex flex-col border-b border-border pb-2 mb-2">
      {/* POČETNA */}
      <CustomLink
        href="/"
        className={`flex items-center gap-3 py-3 px-2 rounded-lg ${isHomeActive ? 'bg-primary/10 text-primary' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconHome size={22} className={isHomeActive ? "text-primary" : ""} />
        <span className={isHomeActive ? "font-medium" : ""}>Početna</span>
      </CustomLink>

      {/* PROFIL */}
      <CustomLink
        href="/profile"
        className={`flex items-center gap-3 py-3 px-2 rounded-lg ${isProfileActive ? 'bg-primary/10 text-primary' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconUserCircle size={22} className={isProfileActive ? "text-primary" : ""} />
        <span className={isProfileActive ? "font-medium" : ""}>{t("myProfile")}</span>
      </CustomLink>

      {/* PORUKE */}
      <button
        onClick={handleChatClick}
        className={`flex items-center gap-3 py-3 px-2 rounded-lg text-left w-full ${isChatActive ? 'bg-primary/10 text-primary' : ''}`}
      >
        <div className="relative">
          <IconMessageCircle size={22} className={isChatActive ? "text-primary" : ""} />
          {IsLoggedin && totalUnreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-[2px] rounded-full bg-red-600 text-white text-[10px] font-bold">
              {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
            </span>
          )}
        </div>
        <span className={isChatActive ? "font-medium" : ""}>Poruke</span>
      </button>

      {/* OBJAVI OGLAS */}
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

      {/* MOJI OGLASI */}
      <CustomLink
        href="/my-ads"
        className={`flex items-center gap-3 py-3 px-2 rounded-lg ${isMyAdsActive ? 'bg-primary/10 text-primary' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconListDetails size={22} className={isMyAdsActive ? "text-primary" : ""} />
        <span className={isMyAdsActive ? "font-medium" : ""}>{t("myAds")}</span>
      </CustomLink>
    </div>
  );

  // 🔥 OSTALE NAVIGACIJSKE STAVKE
  const secondaryNavItems = (
    <div className="flex flex-col">
      <CustomLink
        href="/notifications"
        className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted transition-colors"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <IconBell size={22} />
        <span>{t("notifications")}</span>
      </CustomLink>
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

  // 🔥 AKCIJE (Odjava, Brisanje računa)
  const actionItems = (
    <div className="flex flex-col border-t border-border pt-2 mt-2">
      <button
        onClick={handleMobileSignOut}
        className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left w-full"
      >
        <IconLogout size={22} />
        <span>{t("signOut")}</span>
      </button>
      <button
        onClick={handleMobileDeleteAccount}
        className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive text-left w-full"
      >
        <IconTrash size={22} />
        <span>{t("deleteAccount")}</span>
      </button>
    </div>
  );

  const showMobileMenu = !!userData;
  const showMobileCategories = !pathname.startsWith("/ads");

  return (
    <>
      <header className="py-5 border-b">
        <nav className="container">
          <div className="space-between">
            <CustomLink href="/">
              {/* <CustomImage
                src={settings?.header_logo}
                alt="logo"
                width={195}
                height={52}
                className="w-full h-[52px] object-contain ltr:object-left rtl:object-right max-w-[195px]"
              /> */}
            </CustomLink>

            {isLargeScreen && (
              <div className="flex items-center leading-none rounded grow-[0.7]">
                <Search />
              </div>
            )}

            <button
              className="hidden lg:flex items-center gap-1"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <GrLocation
                size={20}
                className="flex-shrink-0"
                title={"Lokacija"}
              />
            </button>

            <div className="hidden lg:flex items-center gap-2">
  {/* OVDJE JE BIO SHEET (HAMBURGER) - OBRISANO */}

  {/* --- DUGME ZA PORUKE (DESKTOP) --- */}
  {IsLoggedin && (
    <button
      onClick={handleChatClick}
      className="relative p-2 text-gray-600 hover:text-primary transition-colors mx-1"
      title={t("chat")}
    >
      <BsChatDots size={22} />
      {totalUnreadMessages > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full border-2 border-white box-content">
          {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
        </span>
      )}
    </button>
  )}

  {IsLoggedin ? (
    <ProfileDropdown setIsLogout={setIsLogout} IsLogout={IsLogout} />
  ) : (
    <>
      <button onClick={() => setIsLoginOpen(true)} title={t("login")}>
        {truncate(t("login"), 12)}
      </button>
      <span className="border-l h-6 self-center"></span>
      <button onClick={() => setIsRegisterModalOpen(true)} title={t("register")}>
        {truncate(t("register"), 12)}
      </button>
    </>
  )}

  <button
    className="bg-primary px-2 xl:px-4 py-2 items-center text-white rounded-md flex gap-1"
    disabled={IsAdListingClicked}
    onClick={handleAdListing}
    title={t("adListing")}
  >
    {IsAdListingClicked ? (
      <Loader2 size={20} className="animate-spin" />
    ) : (
      <IoIosAddCircleOutline size={20} />
    )}
  </button>
</div>

            {/* 🔥 MOBILNI MENI - PRIKAZUJE SE SAMO NA POČETNOJ */}
            <HomeMobileMenu
              setIsLocationModalOpen={setIsLocationModalOpen}
              setIsRegisterModalOpen={setIsRegisterModalOpen}
              setIsLogout={setIsLogout}
              locationText={locationText}
              handleAdListing={handleAdListing}
              IsAdListingClicked={IsAdListingClicked}
              setManageDeleteAccount={setManageDeleteAccount}
            />
          </div>

          {!isLargeScreen && (
  <div className="flex gap-2 mt-2">
    <div className="flex-1 flex items-center leading-none rounded gap-2">
      <Search />

      {/* HAMBURGER (SAMO MOBITEL) */}
      <div className="lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="relative flex items-center justify-center w-10 h-10 border rounded-md bg-background hover:bg-muted transition-colors"
              aria-label="Meni"
            >
              <IconMenu2 size={22} />

              {/* Badge za nepročitane poruke */}
              {IsLoggedin && totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-[2px] rounded-full bg-red-600 text-white text-[9px] font-bold border-2 border-background">
                  {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                </span>
              )}
            </button>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="p-0 overflow-y-auto max-h-[85vh] rounded-t-2xl border-t bg-background"
          >
            {/* ZAGLAVLJE */}
            <div className="p-4 border-b border-border">
              {/* KORISNIČKE INFORMACIJE */}
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
                      onClick={handleMobileLogin}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                    >
                      {t("login")}
                    </button>
                    <button
                      onClick={handleMobileRegister}
                      className="px-4 py-2 border border-border rounded-lg font-medium"
                    >
                      {t("register")}
                    </button>
                  </div>
                )}
              </div>

              {/* LOKACIJA */}

              {/* THEME TOGGLE PREBAČEN U MENI (umjesto da stoji pored Search) */}
              <div className="mt-3 flex items-center justify-between p-2 bg-muted rounded-lg">
              <div
                className="flex items-center gap-2 p-2 bg-muted rounded-lg cursor-pointer"
                onClick={openLocationEditModal}
              >
                <IconMapPin size={18} className="text-muted-foreground" />
                <p className="text-sm line-clamp-1">
                  {locationText || t("addLocation")}
                </p>
              </div>
                <ThemeToggle />
              </div>
            </div>

            {/* SADRŽAJ */}
            {showMobileMenu && showMobileCategories ? (
              <Tabs defaultValue="menu">
                <TabsList className="flex items-center justify-between bg-muted rounded-none border-b">
                  <TabsTrigger
                    value="menu"
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none"
                  >
                    {t("menu")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="categories"
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none"
                  >
                    {t("multipleCategories")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="menu" className="px-4 py-2">
                  {mainNavItems}
                  {secondaryNavItems}
                  {actionItems}
                </TabsContent>

                <TabsContent value="categories" className="p-4">
                  <FilterTree />
                </TabsContent>
              </Tabs>
            ) : showMobileMenu ? (
              <div className="px-4 py-2">
                {mainNavItems}
                {secondaryNavItems}
                {actionItems}
              </div>
            ) : showMobileCategories ? (
              <div className="p-4">
                <h1 className="font-medium mb-4">{t("multipleCategories")}</h1>
                <FilterTree />
              </div>
            ) : null}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </div>
)}

        </nav>
      </header>

      {isCategoryLoading && !cateData.length ? (
        <HeaderCategoriesSkeleton />
      ) : (
        cateData &&
        cateData.length > 0 && <HeaderCategories cateData={cateData} />
      )}

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
        confirmText={t("yes")}
      />

      {!isLargeScreen && (
        <ReusableAlertDialog
          open={manageDeleteAccount?.IsDeleteAccount}
          onCancel={() =>
            setManageDeleteAccount((prev) => ({
              ...prev,
              IsDeleteAccount: false,
            }))
          }
          onConfirm={handleDeleteAcc}
          title={t("areYouSure")}
          description={
            <ul className="list-disc list-inside mt-2">
              <li>{t("adsAndTransactionWillBeDeleted")}</li>
              <li>{t("accountsDetailsWillNotRecovered")}</li>
              <li>{t("subWillBeCancelled")}</li>
              <li>{t("savedMesgWillBeLost")}</li>
            </ul>
          }
          cancelText={t("cancel")}
          confirmText={t("yes")}
          confirmDisabled={manageDeleteAccount?.IsDeleting}
        />
      )}

      <LocationModal
        key={`${IsLocationModalOpen}-location-modal`}
        IsLocationModalOpen={IsLocationModalOpen}
        setIsLocationModalOpen={setIsLocationModalOpen}
      />
      <UnauthorizedModal />
    </>
  );
};

export default HomeHeader;