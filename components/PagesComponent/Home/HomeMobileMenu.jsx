"use client";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { t } from "@/utils";
import { useEffect, useRef, useState } from "react";

import {
  IconHome,
  IconUserCircle,
  IconMessageCircle,
  IconCirclePlus,
  IconListDetails,
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
  IconLoader2,
} from "@/components/Common/UnifiedIconPack";

import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import CustomLink from "@/components/Common/CustomLink";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FilterTree from "@/components/Filter/FilterTree";
import { chatListApi } from "@/utils/api.js";

const HomeMobileMenu = ({
  setIsLocationModalOpen,
  setIsRegisterModalOpen,
  setIsLogout,
  locationText,
  handleAdListing,
  IsAdListingClicked,
  setManageDeleteAccount,
}) => {
  const UserData = useSelector(userSignUpData);
  const IsLoggedin = useSelector(getIsLoggedIn);

  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  const pathname = usePathname();
  
  // 🔥 SAMO NA POČETNOJ STRANICI
  const isHomePage = pathname === "/";

  const showMenu = !!UserData;
  const showCategories = !pathname.startsWith("/ads");

  // 🔥 CHAT COUNT STATE
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

  // --- LOGIKA ZA BROJANJE PORUKA ---
  useEffect(() => {
    let isMounted = true;
    let lastRealtimeRefreshAt = 0;

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
        const now = Date.now();
        if (now - lastRealtimeRefreshAt < 2000) return;
        lastRealtimeRefreshAt = now;
        fetchUnreadCount();
      }
    };

    window.addEventListener("lmx:realtime-event", handleRealtimeRefresh);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("lmx:realtime-event", handleRealtimeRefresh);
    };
  }, [IsLoggedin]);

  const openLocationEditModal = () => {
    setIsOpen(false);
    setIsLocationModalOpen(true);
  };

  const handleLogin = () => {
    setIsOpen(false);
    setIsLoginOpen(true);
  };

  const handleRegister = () => {
    setIsOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleSignOut = () => {
    setIsOpen(false);
    setIsLogout(true);
  };

  const handleDeleteAccount = () => {
    setIsOpen(false);
    setManageDeleteAccount((prev) => ({
      ...prev,
      IsDeleteAccount: true,
    }));
  };

  // Sakrij bottom bar prilikom skrolanja
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      if (currentY < 64) {
        setIsHidden(false);
      } else if (diff > 4) {
        setIsHidden(true);
      } else if (diff < -4) {
        setIsHidden(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = (
    <div className="flex flex-col px-4 pb-4">
      <CustomLink
        href="/notifications"
        className="flex items-center gap-2 py-3"
        onClick={() => setIsOpen(false)}
      >
        <IconBell size={22} />
        <span>{"Obavještenja"}</span>
      </CustomLink>
      <button
        type="button"
        disabled
        className="flex w-full cursor-not-allowed items-center gap-2 py-3 text-left opacity-70"
      >
        <IconCurrencyDollar size={22} />
        <span>Promo pristup</span>
        <span className="ml-auto rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
          Aktivno
        </span>
      </button>
      <CustomLink
        href="/favorites"
        className="flex items-center gap-2 py-3"
        onClick={() => setIsOpen(false)}
      >
        <IconHeart size={22} />
        <span>{"Favoriti"}</span>
      </CustomLink>
      <CustomLink
        href="/transactions"
        className="flex items-center gap-2 py-3"
        onClick={() => setIsOpen(false)}
      >
        <IconFileText size={22} />
        <span>{"Transakcije"}</span>
      </CustomLink>
      <CustomLink
        href="/reviews"
        className="flex items-center gap-2 py-3"
        onClick={() => setIsOpen(false)}
      >
        <IconMessage size={22} />
        <span>{"Moje recenzije"}</span>
      </CustomLink>
      <CustomLink
        href="/job-applications"
        className="flex items-center gap-2 py-3"
        onClick={() => setIsOpen(false)}
      >
        <IconBriefcase size={22} />
        <span>{"Prijave za posao"}</span>
      </CustomLink>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 py-3 text-left w-full"
      >
        <IconLogout size={22} />
        <span>{"Odjava"}</span>
      </button>
      <button
        onClick={handleDeleteAccount}
        className="flex items-center gap-2 text-destructive py-3 text-left w-full"
      >
        <IconTrash size={22} />
        <span>{"Obriši račun"}</span>
      </button>
    </div>
  );

  const isHomeActive = pathname === "/";
  const isProfileActive = pathname.startsWith("/profile");
  const isChatActive = pathname.startsWith("/chat");
  const isMyAdsActive = pathname.startsWith("/my-ads");

  // 🔥 AKO NIJE POČETNA STRANICA, NE RENDERUJ BOTTOM BAR
  if (!isHomePage) {
    return null;
  }

  return (
    <>
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-50 border-t 
        bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.12)]
        transition-transform duration-300 ease-out
        ${isHidden ? "translate-y-full" : "translate-y-0"}`}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2 text-xs">
          {/* POČETNA */}
          <CustomLink
            href="/"
            className="flex flex-col items-center gap-1 flex-1"
          >
            <IconHome
              size={24}
              className={isHomeActive ? "text-primary" : ""}
            />
            <span
              className={`text-[11px] ${
                isHomeActive ? "text-primary font-medium" : ""
              }`}
            >
              Početna
            </span>
          </CustomLink>


          {/* PORUKE + BADGE */}
          <CustomLink
            href="/chat"
            className="relative flex flex-col items-center gap-1 flex-1"
          >
            <div className="relative">
              <IconMessageCircle
                size={24}
                className={isChatActive ? "text-primary" : ""}
              />
              {IsLoggedin && totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-[2px] rounded-full bg-red-600 text-white text-[10px] font-bold border border-background">
                  {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] ${
                isChatActive ? "text-primary font-medium" : ""
              }`}
            >
              Poruke
            </span>
          </CustomLink>

          {/* DODAJ OGLAS */}
          <button
            className="flex flex-col items-center gap-1 flex-1"
            onClick={handleAdListing}
            disabled={IsAdListingClicked}
          >
            <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              {IsAdListingClicked ? (
                <IconLoader2 size={18} className="animate-spin" />
              ) : (
                <IconCirclePlus size={20} />
              )}
            </div>
            <span className="text-[11px] font-medium">
              {"Lista oglasa"}
            </span>
          </button>

          {/* MOJI OGLASI */}
          <CustomLink
            href="/my-ads"
            className="flex flex-col items-center gap-1 flex-1"
          >
            <IconListDetails
              size={24}
              className={isMyAdsActive ? "text-primary" : ""}
            />
            <span
              className={`text-[11px] ${
                isMyAdsActive ? "text-primary font-medium" : ""
              }`}
            >
              {"Moji oglasi"}
            </span>
          </CustomLink>


          {/* PROFIL */}
          <CustomLink
            href="/profile"
            className="flex flex-col items-center gap-1 flex-1"
          >
            <IconUserCircle
              size={24}
              className={isProfileActive ? "text-primary" : ""}
            />
            <span
              className={`text-[11px] ${
                isProfileActive ? "text-primary font-medium" : ""
              }`}
            >
              {"Moj profil"}
            </span>
          </CustomLink>

         
        </div>
      </div>
    </>
  );
};

export default HomeMobileMenu;
