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
import { useState, useEffect, useRef } from "react";
import { HiOutlineQueueList } from "react-icons/hi2";

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
import { deleteUserApi, getLimitsApi, logoutApi, chatListApi } from "@/utils/api.js";
import { useMediaQuery } from "usehooks-ts";
import UnauthorizedModal from "@/components/Auth/UnauthorizedModal.jsx";
import CustomImage from "@/components/Common/CustomImage.jsx";
import { Loader2 } from "lucide-react";
import { useNavigate } from "@/components/Common/useNavigate.jsx";
import { usePathname } from "next/navigation.js";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import HeaderCategories from "./HeaderCategories.jsx";
import { deleteUser, getAuth } from "firebase/auth";

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

  // 📱 Media Query
  const isLargeScreen = useMediaQuery("(min-width: 992px)");

  // Delete account state
  const [manageDeleteAccount, setManageDeleteAccount] = useState({
    IsDeleteAccount: false,
    IsDeleting: false,
  });

  // --- LOGIKA ZA BROJANJE PORUKA ---
  useEffect(() => {
    let isMounted = true;
    
    // Pomoćna funkcija za sigurno izvlačenje niza chatova
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
          chatListApi.chatList({ type: "seller", page: 1 })
        ]);

        if (!isMounted) return;

        const buyerChats = extractChatData(buyerRes);
        const sellerChats = extractChatData(sellerRes);

        let count = 0;

        // Saberi nepročitane poruke
        buyerChats.forEach(chat => {
          // 🔥 NOVO: Ako je chat mutiran, PRESKOČI GA
          if (chat.is_muted === true) return;
          
          count += Number(chat?.unread_chat_count || 0);
        });

        sellerChats.forEach(chat => {
          // 🔥 NOVO: Ako je chat mutiran, PRESKOČI GA
          if (chat.is_muted === true) return;

          count += Number(chat?.unread_chat_count || 0);
        });

        setTotalUnreadMessages(count);

      } catch (error) {
        console.error("Greška pri dohvatanju poruka:", error);
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
      console.log("Failed to log out", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAdListing = async () => {
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
      setManageDeleteAccount((prev) => ({ ...prev, IsDeleteAccount: false }));
      if (pathname !== "/") {
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting user:", error.message);
      if (error.code === "auth/requires-recent-login") {
        logoutSuccess();
        toast.error(t("deletePop"));
        setManageDeleteAccount((prev) => ({ ...prev, IsDeleteAccount: false }));
      }
    } finally {
      setManageDeleteAccount((prev) => ({ ...prev, IsDeleting: false }));
    }
  };

  const handleChatClick = () => {
      if (!IsLoggedin) {
          setIsLoginOpen(true);
      } else {
          navigate("/chat");
      }
  }

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
              <div className="flex items-center border leading-none rounded grow-[0.7]">
                <Search />
              </div>
            )}

            <button
              className="hidden lg:flex items-center gap-1"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <GrLocation
                size={16}
                className="flex-shrink-0"
                title={locationText ? locationText : t("addLocation")}
              />
              <p
                className="hidden xl:block text-sm"
                title={locationText ? locationText : t("addLocation")}
              >
                {locationText
                  ? truncate(locationText, 12)
                  : truncate(t("addLocation"), 12)}
              </p>
            </button>

            <div className="hidden lg:flex items-center gap-2">
              
              {/* --- CHAT DUGME (DESKTOP) --- */}
              {IsLoggedin && (
                  <button 
                    onClick={handleChatClick}
                    className="relative p-2 text-gray-600 hover:text-primary transition-colors mx-1"
                    title={t("chat")}
                  >
                      <BsChatDots size={22} />
                      {totalUnreadMessages > 0 && (
                          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full border-2 border-white box-content">
                              {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                          </span>
                      )}
                  </button>
              )}

              {IsLoggedin ? (
                <ProfileDropdown
                  setIsLogout={setIsLogout}
                  IsLogout={IsLogout}
                />
              ) : (
                <>
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    title={t("login")}
                  >
                    {truncate(t("login"), 12)}
                  </button>
                  <span className="border-l h-6 self-center"></span>
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    title={t("register")}
                  >
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
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <IoIosAddCircleOutline size={18} />
                )}

                <span className="hidden xl:inline">
                  {truncate(t("adListing"), 12)}
                </span>
              </button>

              <LanguageDropdown />
            </div>
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
                <div className="flex-1 flex items-center leading-none rounded">
                   <Search />
                </div>
                
                {/* --- CHAT DUGME (MOBITEL) --- */}
                {IsLoggedin && (
                  <button 
                    onClick={handleChatClick}
                    className="hidden relative flex items-center justify-center w-12 border rounded bg-white text-gray-600 active:bg-slate-50"
                  >
                      <BsChatDots size={20} />
                       {totalUnreadMessages > 0 && (
                          <span className="absolute top-1 right-1 flex items-center justify-center w-3 h-3 bg-red-600 rounded-full border border-white">
                              {/* Dot */}
                          </span>
                      )}
                  </button>
              )}
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