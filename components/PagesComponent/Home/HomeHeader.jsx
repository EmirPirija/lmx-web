"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";
import { useSelector } from "react-redux";
import { toast } from "@/utils/toastBs";
import { AnimatePresence, motion } from "framer-motion";

import FirebaseData from "@/utils/Firebase.js";
import { t, truncate } from "@/utils";
import { useNavigate } from "@/components/Common/useNavigate.jsx";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage.jsx";
import { headerQuickLinks } from "@/utils/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  getIsLoggedIn,
  logoutSuccess,
  userSignUpData,
} from "@/redux/reducer/authSlice.js";
import { getIsFreAdListing, settingsData } from "@/redux/reducer/settingSlice";
import { CategoryData, getIsCatLoading } from "@/redux/reducer/categorySlice.js";
import { getCityData } from "@/redux/reducer/locationSlice";
import { useAdaptiveMobileDock } from "@/components/Layout/AdaptiveMobileDock";

import ProfileDropdown from "./ProfileDropdown.jsx";
import HeaderCategories from "./HeaderCategories.jsx";
import UnauthorizedModal from "@/components/Auth/UnauthorizedModal.jsx";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import MailSentSuccessModal from "@/components/Auth/MailSentSuccessModal.jsx";
import { ThemeToggle } from "@/components/ThemeToggle";

import { Skeleton } from "@/components/ui/skeleton.jsx";
import { deleteUser, getAuth } from "firebase/auth";

import {
  deleteUserApi,
  getLimitsApi,
  logoutApi,
  chatListApi,
} from "@/utils/api.js";

import {
  Loader2,
  MapPin,
  Menu,
  Search as SearchIcon,
  Video,
  X,
  ChevronDown,
} from "@/components/Common/UnifiedIconPack";
import { IoIosAddCircleOutline } from "@/components/Common/UnifiedIconPack";

import { MessagesSquare, MessageSquareMore } from "@/components/Common/UnifiedIconPack";

import { IconUserCircle, IconListDetails } from "@/components/Common/UnifiedIconPack";

import {
  getIsLoginModalOpen,
  setIsLoginOpen,
  getHideMobileBottomNav,
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

const AllUsersIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    id="User-Search-Fill--Streamline-Mingcute-Fill"
    height="16"
    width="16"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <desc>User Search Fill Streamline Icon: https://streamlinehq.com</desc>
    <g fill="none" fillRule="evenodd">
      <path
        d="M16 0v16H0V0h16ZM8.395999999999999 15.505333333333333l-0.008 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023999999999999997c-0.006666666666666666 -0.002 -0.012666666666666666 0 -0.016 0.004l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.010666666666666666 -0.011999999999999999Zm0.176 -0.07533333333333334 -0.009333333333333332 0.0013333333333333333 -0.12266666666666666 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.005333333333333333 0.134 0.06133333333333333c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.002 -0.007333333333333332 0.011999999999999999 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z"
        strokeWidth="0.6667"
      />
      <path
        fill="#0ab6af"
        d="M4 4.666666666666666a3.333333333333333 3.333333333333333 0 1 1 6.666666666666666 0A3.333333333333333 3.333333333333333 0 0 1 4 4.666666666666666Zm-0.7853333333333332 5.1146666666666665C4.283333333333333 9.129333333333333 5.736666666666666 8.666666666666666 7.333333333333333 8.666666666666666c0.298 0 0.5913333333333333 0.016 0.8773333333333333 0.04666666666666667a0.6666666666666666 0.6666666666666666 0 0 1 0.48 1.0379999999999998A3.9786666666666664 3.9786666666666664 0 0 0 8 12c0 0.6133333333333333 0.13799999999999998 1.1933333333333334 0.3833333333333333 1.7113333333333334a0.6666666666666666 0.6666666666666666 0 0 1 -0.5933333333333333 0.952c-0.15066666666666667 0.002 -0.30333333333333334 0.003333333333333333 -0.45666666666666667 0.003333333333333333 -1.486 0 -2.8899999999999997 -0.09333333333333334 -3.942 -0.372 -0.5233333333333333 -0.13866666666666666 -1.016 -0.3373333333333333 -1.3893333333333333 -0.6373333333333333C1.6066666666666667 13.34 1.3333333333333333 12.896666666666665 1.3333333333333333 12.333333333333332c0 -0.5246666666666666 0.23866666666666664 -1.0153333333333332 0.5626666666666666 -1.4259999999999997 0.3293333333333333 -0.41666666666666663 0.7846666666666666 -0.7999999999999999 1.3186666666666667 -1.1266666666666665ZM11.666666666666666 10.666666666666666a1 1 0 1 0 0 2 1 1 0 0 0 0 -2ZM9.333333333333332 11.666666666666666a2.333333333333333 2.333333333333333 0 1 1 4.386666666666667 1.1099999999999999l0.5559999999999999 0.5566666666666666A0.6666666666666666 0.6666666666666666 0 1 1 13.333333333333332 14.276l-0.5566666666666666 -0.5566666666666666A2.333333333333333 2.333333333333333 0 0 1 9.333333333333332 11.666666666666666Z"
        strokeWidth="0.6667"
      />
    </g>
  </svg>
);


const HomeHeader = () => {
  const { navigate } = useNavigate();
  const { signOut } = FirebaseData();
  const pathname = usePathname();

  const isLargeScreen = useMediaQuery("(min-width: 992px)");

  // Redux
  const userData = useSelector(userSignUpData);
  const IsLoggedin = useSelector(getIsLoggedIn);
  const IsLoginOpen = useSelector(getIsLoginModalOpen);
  const hideMobileBottomNav = useSelector(getHideMobileBottomNav);
  const isCategoryLoading = useSelector(getIsCatLoading);
  const cateData = useSelector(CategoryData);
  const IsFreeAdListing = useSelector(getIsFreAdListing);
  const settings = useSelector(settingsData);
  const cityData = useSelector(getCityData);

  // Local UI
  const [IsRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [IsLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [IsLogout, setIsLogout] = useState(false);
  const [IsLoggingOut, setIsLoggingOut] = useState(false);
  const [IsUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [IsAdListingClicked, setIsAdListingClicked] = useState(false);
  const [IsMailSentSuccess, setIsMailSentSuccess] = useState(false);
  const [isMobileHeaderCollapsed, setIsMobileHeaderCollapsed] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [isMobileUtilityMenuOpen, setIsMobileUtilityMenuOpen] = useState(false);
  const [adsMobileHeaderState, setAdsMobileHeaderState] = useState({
    enabled: false,
    hideHeader: false,
    searchIconMode: false,
  });
  const lastMobileScrollYRef = useRef(0);
  const mobileHeaderMenuRef = useRef(null);
  const mobileHeaderRef = useRef(null);
  const lastHeaderOffsetRef = useRef(0);
  const headerOffsetHideTimerRef = useRef(null);

  // Delete account (mobile dialog)
  const [manageDeleteAccount, setManageDeleteAccount] = useState({
    IsDeleteAccount: false,
    IsDeleting: false,
  });

  // Counts
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

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

    const handleRealtimeRefresh = (event) => {
      const detail = event?.detail;
      if (!detail) return;
      if (detail?.category === "chat" || detail?.type === "chat" || detail?.type === "new_message") {
        fetchUnreadCount();
      }
    };

    window.addEventListener("lmx:realtime-event", handleRealtimeRefresh);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("lmx:realtime-event", handleRealtimeRefresh);
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
    if (!IsLoggedin) setIsLoginOpen(true);
    else navigate("/chat");
  };

  const handleMyAdsClick = () => {
    if (!IsLoggedin) setIsLoginOpen(true);
    else navigate("/my-ads");
  };

  const closeMobileUtilityMenu = useCallback(() => {
    setIsMobileUtilityMenuOpen(false);
  }, []);

  const toggleMobileUtilityMenu = useCallback(() => {
    setIsMobileUtilityMenuOpen((prev) => {
      const next = !prev;
      if (next) setIsMobileSearchFocused(false);
      return next;
    });
  }, []);

  const runMobileMenuAction = useCallback((callback) => {
    setIsMobileUtilityMenuOpen(false);
    setIsMobileSearchFocused(false);
    window.requestAnimationFrame(() => callback?.());
  }, []);

  // Mobile menu items (postojeće, samo zadržano)
  const isChatActive = pathname.startsWith("/chat");
  const isMyAdsActive = pathname.startsWith("/my-ads");

  const isOnHome = pathname === "/";
  const isAdsPage = pathname === "/ads" || pathname.startsWith("/ads/");
  const isAdsMobileManagedHeader =
    !isLargeScreen && isAdsPage && adsMobileHeaderState.enabled;
  const shouldHideMobileHeader =
    isAdsMobileManagedHeader && adsMobileHeaderState.hideHeader;
  const shouldUseAdsSearchIconMode =
    isAdsMobileManagedHeader &&
    adsMobileHeaderState.searchIconMode &&
    !isMobileUtilityMenuOpen &&
    !isMobileSearchFocused;
  const mobileDock = useAdaptiveMobileDock();
  const showMobileDockNav = !isLargeScreen && !hideMobileBottomNav;

  const renderDockCompactNav = useCallback(
    ({ isExpanded }) => (
      <>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200">
          <Menu size={18} className={isExpanded ? "rotate-90 transition-transform duration-200" : "transition-transform duration-200"} />
        </div>
        {IsLoggedin && totalUnreadMessages > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
            {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
          </span>
        )}
      </>
    ),
    [IsLoggedin, totalUnreadMessages]
  );

  const renderDockFullNav = useCallback(
    ({ closeNav }) => (
      <nav className="bg-transparent">
        <div className="grid grid-cols-5 h-[68px]">
          <button
            type="button"
            onClick={() => {
              closeNav?.();
              navigate("/");
            }}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isOnHome ? "text-primary" : "text-slate-600 dark:text-slate-400"
            }`}
            aria-label="Početna"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={isOnHome ? 2.5 : 1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className={`text-[10px] ${isOnHome ? "font-semibold" : ""}`}>Početna</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeNav?.();
              handleMyAdsClick();
            }}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isMyAdsActive ? "text-primary" : "text-slate-600 dark:text-slate-400"
            }`}
            aria-label="Moji oglasi"
          >
            <IconListDetails size={20} strokeWidth={isMyAdsActive ? 2.5 : 1.5} />
            <span className={`text-[10px] ${isMyAdsActive ? "font-semibold" : ""}`}>Moji oglasi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeNav?.();
              handleAdListing();
            }}
            disabled={IsAdListingClicked}
            className="flex flex-col items-center justify-center gap-0.5 -mt-1"
            aria-label="Objavi oglas"
          >
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-95">
              {IsAdListingClicked ? <Loader2 size={24} className="animate-spin" /> : <IoIosAddCircleOutline size={26} />}
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Objavi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeNav?.();
              handleChatClick();
            }}
            className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isChatActive ? "text-primary" : "text-slate-600 dark:text-slate-400"
            }`}
            aria-label="Poruke"
          >
            <div className="relative">
              {totalUnreadMessages > 1 ? (
                <MessagesSquare size={20} strokeWidth={isChatActive ? 2.5 : 1.5} />
              ) : (
                <MessageSquareMore size={20} strokeWidth={isChatActive ? 2.5 : 1.5} />
              )}

              {IsLoggedin && totalUnreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                  {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                </span>
              )}
            </div>
            <span className={`text-[10px] ${isChatActive ? "font-semibold" : ""}`}>Poruke</span>
          </button>

          <div className="flex flex-col items-center justify-center gap-0.5">
            {IsLoggedin ? (
              <>
                <div className="scale-[0.92]">
                  <ProfileDropdown
                    setIsLogout={setIsLogout}
                    IsLogout={IsLogout}
                  />
                </div>
                <span
                  className={`text-[10px] ${
                    pathname.startsWith("/profile")
                      ? "font-semibold text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Profil
                </span>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeNav?.();
                  setIsLoginOpen(true);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  pathname.startsWith("/profile")
                    ? "text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
                aria-label="Profil"
              >
                <IconUserCircle
                  size={20}
                  strokeWidth={pathname.startsWith("/profile") ? 2.2 : 1.8}
                />
                <span className={`text-[10px] ${pathname.startsWith("/profile") ? "font-semibold" : ""}`}>
                  Profil
                </span>
              </button>
            )}
          </div>
        </div>
      </nav>
    ),
    [
      IsAdListingClicked,
      IsLoggedin,
      handleAdListing,
      handleChatClick,
      handleMyAdsClick,
      isChatActive,
      isMyAdsActive,
      isOnHome,
      IsLogout,
      pathname,
      navigate,
      setIsLoginOpen,
      setIsLogout,
      totalUnreadMessages,
    ]
  );

  useEffect(() => {
    if (!mobileDock) return;

    if (!showMobileDockNav) {
      mobileDock.removeNav("home-header-mobile-nav");
      return;
    }

    mobileDock.upsertNav("home-header-mobile-nav", {
      priority: 40,
      enabled: true,
      renderCompact: renderDockCompactNav,
      renderFull: renderDockFullNav,
    });

    return () => {
      mobileDock.removeNav("home-header-mobile-nav");
    };
  }, [mobileDock, showMobileDockNav, renderDockCompactNav, renderDockFullNav]);

  useEffect(() => {
    mobileDock?.closeNav?.();
  }, [mobileDock, pathname]);

  useEffect(() => {
    closeMobileUtilityMenu();
    setIsMobileSearchFocused(false);
  }, [pathname, closeMobileUtilityMenu]);

  useEffect(() => {
    if (!isLargeScreen) return;
    closeMobileUtilityMenu();
    setIsMobileSearchFocused(false);
  }, [isLargeScreen, closeMobileUtilityMenu]);

  useEffect(() => {
    if (!isMobileSearchFocused || !isMobileUtilityMenuOpen) return;
    setIsMobileUtilityMenuOpen(false);
  }, [isMobileSearchFocused, isMobileUtilityMenuOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleAdsHeaderState = (event) => {
      const detail = event?.detail || {};
      setAdsMobileHeaderState((prev) => {
        const next = {
          enabled: Boolean(detail.enabled),
          hideHeader: Boolean(detail.hideHeader),
          searchIconMode: Boolean(detail.searchIconMode),
        };

        if (
          prev.enabled === next.enabled &&
          prev.hideHeader === next.hideHeader &&
          prev.searchIconMode === next.searchIconMode
        ) {
          return prev;
        }

        return next;
      });
    };

    window.addEventListener("lmx:ads-mobile-header-state", handleAdsHeaderState);
    return () => {
      window.removeEventListener("lmx:ads-mobile-header-state", handleAdsHeaderState);
    };
  }, []);

  useEffect(() => {
    if (isAdsPage) return;
    setAdsMobileHeaderState((prev) => {
      if (!prev.enabled && !prev.hideHeader && !prev.searchIconMode) {
        return prev;
      }
      return {
        enabled: false,
        hideHeader: false,
        searchIconMode: false,
      };
    });
  }, [isAdsPage]);

  useEffect(() => {
    if (isLargeScreen || !isMobileUtilityMenuOpen) return undefined;

    const handleEsc = (event) => {
      if (event.key === "Escape") closeMobileUtilityMenu();
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isLargeScreen, isMobileUtilityMenuOpen, closeMobileUtilityMenu]);

  useEffect(() => {
    if (isLargeScreen) {
      setIsMobileHeaderCollapsed(false);
      return undefined;
    }
    if (isAdsMobileManagedHeader) {
      setIsMobileHeaderCollapsed(false);
      return undefined;
    }
    if (isMobileSearchFocused) {
      setIsMobileHeaderCollapsed(false);
      return undefined;
    }
    if (isMobileUtilityMenuOpen) {
      setIsMobileHeaderCollapsed(false);
      return undefined;
    }
    if (typeof window === "undefined") return undefined;

    let ticking = false;
    const collapseThreshold = 180;
    const expandThreshold = 12;

    const updateCollapsed = () => {
      const currentY = window.scrollY;
      const lastY = lastMobileScrollYRef.current;
      const isScrollingDown = currentY > lastY + 2;

      setIsMobileHeaderCollapsed((prev) => {
        if (!prev && isScrollingDown && currentY > collapseThreshold) return true;
        if (prev && currentY < expandThreshold) return false;
        return prev;
      });

      lastMobileScrollYRef.current = currentY;
    };

    lastMobileScrollYRef.current = window.scrollY;
    setIsMobileHeaderCollapsed(false);
    updateCollapsed();

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateCollapsed();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [
    isLargeScreen,
    pathname,
    isMobileUtilityMenuOpen,
    isMobileSearchFocused,
    isAdsMobileManagedHeader,
  ]);

  const shouldSuspendDockForOverlay =
    !isLargeScreen &&
    (IsLocationModalOpen ||
      IsLoginOpen ||
      IsRegisterModalOpen ||
      IsMailSentSuccess ||
      IsLogout ||
      IsUpdatingProfile ||
      manageDeleteAccount.IsDeleteAccount ||
      isMobileUtilityMenuOpen);

  const availableHeaderQuickLinks = useMemo(
    () =>
      headerQuickLinks.filter((link) => {
        if (!link.requiresAuth) return true;
        return IsLoggedin;
      }),
    [IsLoggedin]
  );
  const unifiedHeaderQuickLinks = useMemo(
    () => [
      {
        id: "all-users",
        href: "/svi-korisnici",
        label: (
          <span className="inline-flex items-center justify-center">
            <AllUsersIcon className="h-4 w-4" />
            <span className="sr-only">Svi korisnici</span>
          </span>
        ),
      },
      ...availableHeaderQuickLinks,
    ],
    [availableHeaderQuickLinks]
  );
  
  
  const primaryQuickLinkIds = useMemo(
    () => new Set(["all-users", 2, 6, 7, 8]),
    []
  );
  const primaryHeaderQuickLinks = useMemo(
    () =>
      unifiedHeaderQuickLinks.filter((link) =>
        primaryQuickLinkIds.has(link.id)
      ),
    [primaryQuickLinkIds, unifiedHeaderQuickLinks]
  );
  const overflowHeaderQuickLinks = useMemo(
    () =>
      unifiedHeaderQuickLinks.filter(
        (link) => !primaryQuickLinkIds.has(link.id)
      ),
    [primaryQuickLinkIds, unifiedHeaderQuickLinks]
  );
  const quickLinkChipClass =
    "inline-flex h-9 items-center rounded-full border border-slate-200/90 bg-white px-3.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600";

  const handleAdsSearchShortcut = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lmx:ads-mobile-toolbar-reset"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setIsMobileUtilityMenuOpen(false);
    setIsMobileSearchFocused(true);
  }, []);

  const mobileHeaderLayoutTransition = {
    type: "spring",
    stiffness: 250,
    damping: 30,
    mass: 0.85,
  };
  const isMobileSearchExpanded =
    isMobileSearchFocused &&
    !isMobileUtilityMenuOpen &&
    !shouldUseAdsSearchIconMode;

  useEffect(() => {
    if (!mobileDock) return undefined;
    const suspendKey = "home-header-overlay-stack";
    mobileDock.setSuspended?.(suspendKey, shouldSuspendDockForOverlay);

    return () => {
      mobileDock.clearSuspended?.(suspendKey);
    };
  }, [mobileDock, shouldSuspendDockForOverlay]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const rootStyle = document.documentElement.style;
    const clearHideOffsetTimer = () => {
      if (!headerOffsetHideTimerRef.current) return;
      window.clearTimeout(headerOffsetHideTimerRef.current);
      headerOffsetHideTimerRef.current = null;
    };

    const commitOffset = (nextOffset) => {
      if (Math.abs(nextOffset - lastHeaderOffsetRef.current) <= 1) return;
      lastHeaderOffsetRef.current = nextOffset;
      rootStyle.setProperty("--lmx-mobile-header-offset", `${nextOffset}px`);
    };

    const syncOffset = () => {
      if (isLargeScreen || !mobileHeaderRef.current) {
        clearHideOffsetTimer();
        commitOffset(0);
        return;
      }

      if (shouldHideMobileHeader) {
        if (!headerOffsetHideTimerRef.current) {
          headerOffsetHideTimerRef.current = window.setTimeout(() => {
            headerOffsetHideTimerRef.current = null;
            commitOffset(0);
          }, 170);
        }
        return;
      }

      clearHideOffsetTimer();
      const nextHeight = Math.max(
        0,
        Math.round(mobileHeaderRef.current.getBoundingClientRect().height)
      );
      commitOffset(nextHeight);
    };

    syncOffset();
    window.addEventListener("resize", syncOffset);

    let observer;
    if (typeof ResizeObserver !== "undefined" && mobileHeaderRef.current) {
      observer = new ResizeObserver(syncOffset);
      observer.observe(mobileHeaderRef.current);
    }

    return () => {
      clearHideOffsetTimer();
      observer?.disconnect();
      window.removeEventListener("resize", syncOffset);
      lastHeaderOffsetRef.current = 0;
      rootStyle.setProperty("--lmx-mobile-header-offset", "0px");
    };
  }, [
    isLargeScreen,
    isMobileSearchExpanded,
    isMobileUtilityMenuOpen,
    shouldHideMobileHeader,
    shouldUseAdsSearchIconMode,
  ]);

  return (
    <>
      <AnimatePresence>
        {!isLargeScreen && isMobileUtilityMenuOpen && (
          <motion.button
            type="button"
            aria-label="Zatvori brzi meni"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMobileUtilityMenu}
            className="fixed inset-0 z-[48] bg-slate-950/25 backdrop-blur-[1.5px] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop two-row header + mobile single-row quick header */}
      <header
        ref={mobileHeaderRef}
        className={`${isLargeScreen ? "relative" : "sticky top-0"} z-50 pt-[max(env(safe-area-inset-top),0px)] transition-all duration-300 ease-out lg:pt-0 ${
          isLargeScreen
            ? "bg-white/88 backdrop-blur-xl dark:bg-slate-950/84"
            : "bg-white dark:bg-slate-950"
        } ${
          shouldHideMobileHeader
            ? "pointer-events-none -translate-y-full opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <nav className="w-full px-3 sm:px-4 lg:px-6">
          {/* container */}
          {isLargeScreen ? (
            <>
              <div className="py-3 lg:py-4">
              <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-3 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/75 lg:p-4">
              {/* DESKTOP: GORE utility + quick links rail */}
              <div className="space-y-3 border-b border-slate-200/80 pb-3 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <button
                    className="group inline-flex min-w-0 max-w-[220px] xl:max-w-[320px] items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
                    onClick={() => setIsLocationModalOpen(true)}
                    type="button"
                    aria-label="Lokacija"
                    title="Lokacija"
                  >
                    <MapPin size={18} className="shrink-0 text-primary" />
                    <span className="truncate text-sm font-medium">
                      {locationText || "Dodaj lokaciju"}
                    </span>
                  </button>

                  <div className="flex items-center gap-2">

                  <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
                    <div className="flex w-max items-center gap-2 pr-1">
                      {primaryHeaderQuickLinks.map((link) => (
                        <CustomLink
                          key={`desktop-quick-link-${link.id}`}
                          href={link.href}
                          className={quickLinkChipClass}
                        >
                          {link.label || t(link.labelKey)}
                        </CustomLink>
                      ))}

                      {overflowHeaderQuickLinks.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={quickLinkChipClass}
                              aria-label="Prikaži ostale linkove"
                            >
                              Ostalo
                              <ChevronDown size={14} className="ml-1" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-60 rounded-2xl border border-slate-200/80 bg-white/95 p-1 dark:border-slate-700 dark:bg-slate-900/95"
                          >
                            {overflowHeaderQuickLinks.map((link) => (
                              <DropdownMenuItem
                                asChild
                                key={`desktop-overflow-link-${link.id}`}
                                className="rounded-xl"
                              >
                                <CustomLink
                                  href={link.href}
                                  className="w-full rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
                                >
                                  {link.label || t(link.labelKey)}
                                </CustomLink>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      <button
                        type="button"
                        onClick={handleAdListing}
                        disabled={IsAdListingClicked}
                        className={`${quickLinkChipClass} hidden 2xl:inline-flex disabled:opacity-60`}
                      >
                        <Video size={14} className="mr-1 text-violet-500 dark:text-violet-300" />
                        Objavi video oglas
                      </button>
                    </div>
                  </div>
                </div>

                  <div className="flex min-w-0 items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-full border border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900">
                      <ThemeToggle />
                    </div>

                  {/* PROFIL (lijevo u ovom bloku) */}
                  {IsLoggedin ? (
                    <div className="flex items-center gap-2">
                      {/* ✅ Ime korisnika (desktop) */}
                      {userData?.name && (
                        <span className="hidden max-w-[130px] truncate text-sm font-medium text-slate-700 dark:text-slate-300 2xl:inline">
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

{/* DESKTOP PORUKE DUGME */}
<button
  onClick={handleChatClick}
  className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200/90 bg-white text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
  title="Poruke"
  type="button"
  aria-label="Poruke"
>
  {/* Logika: Ako je više od jedne poruke MessagesSquare, inače MessageSquareMore */}
  {totalUnreadMessages > 1 ? (
    <MessagesSquare 
      size={20} 
      strokeWidth={isChatActive ? 2.5 : 1.5} 
      className={isChatActive ? "text-primary" : "text-slate-700 dark:text-slate-300"} 
    />
  ) : (
    <MessageSquareMore 
      size={20} 
      strokeWidth={isChatActive ? 2.5 : 1.5} 
      className={isChatActive ? "text-primary" : "text-slate-700 dark:text-slate-300"} 
    />
  )}

  {IsLoggedin && totalUnreadMessages > 0 && (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
      {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
    </span>
  )}
</button>

                  {/* MOJI OGLASI (ikonica) */}
                  <button
                    onClick={handleMyAdsClick}
                    className={`relative flex h-10 items-center gap-2 rounded-full border border-slate-200/90 bg-white px-2.5 xl:px-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 ${
                      isMyAdsActive ? "text-primary" : "text-slate-700 dark:text-slate-300"
                    }`}
                    title="Moji oglasi"
                    type="button"
                    aria-label="Moji oglasi"
                  >
                    <IconListDetails size={20} strokeWidth={isMyAdsActive ? 2.5 : 1.8} />
                    <span className="hidden whitespace-nowrap text-sm font-medium 2xl:inline">Moji oglasi</span>
                  </button>
                  </div>
                </div>

              </div>

              {/* DESKTOP: DOLE brand + search + CTA */}
              <div className="mt-3 flex items-center gap-3">
                {/* search */}
                <div className="flex-1">
                  <div className="mx-auto">
                    <Search />
                  </div>
                </div>

                {/* extra: CTA */}
                <button
                  className="ml-1 inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(13,148,136,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0"
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
              </div>
              </div>
            </>
          ) : (
            <>
              <div className="py-2">
                <motion.div
                  ref={mobileHeaderMenuRef}
                  layout
                  initial={false}
                  animate={
                    isMobileHeaderCollapsed || shouldUseAdsSearchIconMode
                      ? { padding: 6 }
                      : { padding: 8 }
                  }
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl bg-white p-2 dark:bg-slate-900"
                >
                  <motion.div layout transition={mobileHeaderLayoutTransition} className="flex items-center gap-2">
                    <AnimatePresence initial={false}>
                      {!isMobileSearchExpanded && (
                        <motion.button
                          key="mobile-logo-button"
                          type="button"
                          layout
                          whileTap={{ scale: 0.96 }}
                          transition={mobileHeaderLayoutTransition}
                          initial={{ width: 0, opacity: 0, scale: 0.9 }}
                          animate={{
                            width: isMobileUtilityMenuOpen ? 44 : "auto",
                            opacity: 1,
                            scale: 1
                          }}                          
                          exit={{ width: 0, opacity: 0, scale: 0.9 }}
                          onClick={() => navigate("/")}
                          className="grid h-10 shrink-0 place-items-center overflow-hidden rounded-xl text-[14px] font-bold uppercase tracking-[0.08em] text-slate-600 dark:bg-slate-800/90 dark:text-slate-300"
                          aria-label="Početna"
                        >
                          {settings?.header_logo ? (
                            <CustomImage
                              src={settings.header_logo}
                              alt="lmx logo"
                              width={190}
                              height={42}
                              className="h-8 w-auto object-contain"
                            />
                          ) : (
                            <span>LMX</span>
                          )}
                        </motion.button>
                      )}
                    </AnimatePresence>

                    <motion.div
                      layout
                      transition={mobileHeaderLayoutTransition}
                      className={`min-w-0 flex-1 ${
                        isMobileSearchFocused ? "overflow-visible" : "overflow-hidden"
                      }`}
                      animate={isMobileUtilityMenuOpen ? { opacity: 0.75 } : { opacity: 1 }}
                    >
                      <AnimatePresence initial={false} mode="wait">
                        {isMobileUtilityMenuOpen ? (
                          <motion.div
                            key="mobile-menu-title"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className="flex h-10 items-center pl-1"
                          >
                            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                              Brze opcije
                            </span>
                          </motion.div>
                        ) : shouldUseAdsSearchIconMode ? (
                          <motion.button
                            key="ads-mobile-search-icon"
                            type="button"
                            initial={{ opacity: 0, x: 8, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -8, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100/85 text-slate-600 dark:bg-slate-800/90 dark:text-slate-300"
                            onClick={handleAdsSearchShortcut}
                            aria-label="Otvori pretragu"
                          >
                            <SearchIcon size={18} />
                          </motion.button>
                        ) : (
                          <motion.div
                            key="mobile-search-full"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              scale: isMobileSearchExpanded ? 1.015 : 1,
                            }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={mobileHeaderLayoutTransition}
                          >
                            <Search
                              hideBrand
                              compact
                              minimal
                              onInputFocusChange={setIsMobileSearchFocused}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <AnimatePresence initial={false}>
                      {!isMobileSearchExpanded && (
                        <motion.button
                          key="mobile-menu-button"
                          type="button"
                          layout
                          whileTap={{ scale: 0.96 }}
                          transition={mobileHeaderLayoutTransition}
                          initial={{ width: 0, opacity: 0, scale: 0.9 }}
                          animate={{ width: 40, opacity: 1, scale: 1 }}
                          exit={{ width: 0, opacity: 0, scale: 0.9 }}
                          className="grid h-10 shrink-0 place-items-center rounded-xl bg-slate-100/85 text-slate-700 dark:bg-slate-800/90 dark:text-slate-200"
                          onClick={toggleMobileUtilityMenu}
                          aria-label={isMobileUtilityMenuOpen ? "Zatvori meni" : "Otvori meni"}
                        >
                          <AnimatePresence initial={false} mode="wait">
                            {isMobileUtilityMenuOpen ? (
                              <motion.span
                                key="header-menu-close"
                                initial={{ rotate: -80, opacity: 0, scale: 0.75 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: 80, opacity: 0, scale: 0.75 }}
                                transition={{ duration: 0.18 }}
                              >
                                <X size={18} />
                              </motion.span>
                            ) : (
                              <motion.span
                                key="header-menu-open"
                                initial={{ rotate: 80, opacity: 0, scale: 0.75 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: -80, opacity: 0, scale: 0.75 }}
                                transition={{ duration: 0.18 }}
                              >
                                <Menu size={18} />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <AnimatePresence>
                    {isMobileUtilityMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="mt-2 overflow-hidden rounded-xl"
                      >
                        <div className="space-y-2 rounded-xl bg-slate-100/85 p-2 dark:bg-slate-800/75">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => runMobileMenuAction(() => setIsLocationModalOpen(true))}
                              className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-left text-sm font-medium text-slate-700 dark:bg-slate-900/90 dark:text-slate-200"
                              aria-label="Lokacija"
                              title={locationText || "Dodaj lokaciju"}
                            >
                              <MapPin size={16} className="shrink-0 text-primary" />
                              <span className="truncate">{locationText || "Dodaj lokaciju"}</span>
                            </button>
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/90 dark:bg-slate-900/90">
                              <ThemeToggle />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">
                              Brzi linkovi
                            </p>
                            <div className="overflow-x-auto scrollbar-none">
                              <div className="flex w-max items-center gap-2 pr-1">
                                {primaryHeaderQuickLinks.map((link) => (
                                  <CustomLink
                                    key={`mobile-quick-link-${link.id}`}
                                    href={link.href}
                                    onClick={closeMobileUtilityMenu}
                                    className="inline-flex h-9 items-center rounded-full border border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200"
                                  >
                                    {link.label || t(link.labelKey)}
                                  </CustomLink>
                                ))}

                                {overflowHeaderQuickLinks.length > 0 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="inline-flex h-9 items-center rounded-full border border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200"
                                        aria-label="Prikaži ostale linkove"
                                      >
                                        Ostalo
                                        <ChevronDown size={13} className="ml-1" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="start"
                                      className="w-56 rounded-2xl border border-slate-200/80 bg-white/95 p-1 dark:border-slate-700 dark:bg-slate-900/95"
                                    >
                                      {overflowHeaderQuickLinks.map((link) => (
                                        <DropdownMenuItem
                                          asChild
                                          key={`mobile-overflow-link-${link.id}`}
                                          className="rounded-xl"
                                        >
                                          <CustomLink
                                            href={link.href}
                                            onClick={closeMobileUtilityMenu}
                                            className="w-full rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
                                          >
                                            {link.label || t(link.labelKey)}
                                          </CustomLink>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          </div>

                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.24, delay: 0.05 }}
                            className="rounded-xl border border-cyan-200/80 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-2.5 dark:border-cyan-700/60 dark:from-cyan-900/25 dark:via-slate-900/95 dark:to-emerald-900/25"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cyan-700 dark:text-cyan-300">
                                  Promotivni režim
                                </p>
                                <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                                  Svi planovi su trenutno besplatni i sve funkcionalnosti su otključane bez unosa kartice.
                                </p>
                              </div>
                              <Video size={16} className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-300" />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => runMobileMenuAction(handleAdListing)}
                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-[11px] font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                              >
                                <Video size={13} className="text-violet-500" />
                                Objavi oglas
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </>
          )}
        </nav>

      </header>

      {/* categories (isto kao prije) */}
      {isCategoryLoading && !cateData.length ? (
        <HeaderCategoriesSkeleton />
      ) : (
        cateData && cateData.length > 0 && <HeaderCategories cateData={cateData} />
      )}

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
