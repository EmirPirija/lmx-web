"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { t } from "@/utils";
import { useEffect, useRef, useState } from "react";
import { GrLocation } from "react-icons/gr";
import {
  IoIosAddCircleOutline,
  IoMdNotificationsOutline,
} from "react-icons/io";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { usePathname } from "next/navigation";
import CustomImage from "@/components/Common/CustomImage";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import CustomLink from "@/components/Common/CustomLink";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BiChat, BiDollarCircle, BiReceipt, BiTrashAlt } from "react-icons/bi";
import { LiaAdSolid } from "react-icons/lia";
import { HiOutlineQueueList } from "react-icons/hi2";

import { LuHeart } from "react-icons/lu";
import { MdOutlineRateReview, MdWorkOutline } from "react-icons/md";
import { RiLogoutCircleLine } from "react-icons/ri";
import { settingsData } from "@/redux/reducer/settingSlice";
import FilterTree from "@/components/Filter/FilterTree";
import LanguageDropdown from "@/components/Common/LanguageDropdown";

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
  const settings = useSelector(settingsData);

  const [isOpen, setIsOpen] = useState(false); // "Više" sheet
  const [isHidden, setIsHidden] = useState(false); // hide bottom bar on scroll
  const lastScrollY = useRef(0);

  const pathname = usePathname();

  const showMenu = !!UserData;
  const showCategories = !pathname.startsWith("/ads");

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

  // sakrij / pokaži bottom bar ovisno o scrollu
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      if (currentY < 64) {
        setIsHidden(false);
      } else if (diff > 4) {
        setIsHidden(true); // skrol dole
      } else if (diff < -4) {
        setIsHidden(false); // skrol gore
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ostali linkovi koji idu u "Više"
  const navItems = (
    <div className="flex flex-col px-4 pb-4">
      <CustomLink
        href="/notifications"
        className="flex items-center gap-2 py-3"
        onClick={() => setIsOpen(false)}
      >
        <IoMdNotificationsOutline size={22} />
        <span>{t("notifications")}</span>
      </CustomLink>
      <CustomLink
        href="/user-subscription"
        className="flex items-center gap-2 py-3"
        onClick={() => setIsOpen(false)}
      >
        <BiDollarCircle size={22} />
        <span>{t("subscription")}</span>
      </CustomLink>
      <CustomLink
        href="/favorites"
        className="flex items-center gap-2 py-3"
        onClick={() => setIsOpen(false)}
      >
        <LuHeart size={22} />
        <span>{t("favorites")}</span>
      </CustomLink>
      <CustomLink
        href="/transactions"
        className="flex items-center gap-2 py-3"
        onClick={() => setIsOpen(false)}
      >
        <BiReceipt size={22} />
        <span>{t("transaction")}</span>
      </CustomLink>
      <CustomLink
        href="/reviews"
        className="flex items-center gap-2 py-3"
        onClick={() => setIsOpen(false)}
      >
        <MdOutlineRateReview size={22} />
        <span>{t("myReviews")}</span>
      </CustomLink>
      <CustomLink
        href="/job-applications"
        className="flex items-center gap-2 py-3"
        onClick={() => setIsOpen(false)}
      >
        <MdWorkOutline size={22} />
        <span>{t("jobApplications")}</span>
      </CustomLink>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 py-3 text-left w-full"
      >
        <RiLogoutCircleLine size={22} />
        <span>{t("signOut")}</span>
      </button>
      <button
        onClick={handleDeleteAccount}
        className="flex items-center gap-2 text-destructive py-3 text-left w-full"
      >
        <BiTrashAlt size={22} />
        <span>{t("deleteAccount")}</span>
      </button>
    </div>
  );

  // helper za active state u bottom baru
  const isProfileActive = pathname.startsWith("/profile");
  const isChatActive = pathname.startsWith("/chat");
  const isMyAdsActive = pathname.startsWith("/my-ads");

  return (
    <>
      {/* BOTTOM NAV BAR */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-50 border-t 
        bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.12)]
        transition-transform duration-300 ease-out
        ${isHidden ? "translate-y-full" : "translate-y-0"}`}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2 text-xs">
          {/* PROFIL */}
          {UserData ? (
            <CustomLink
              href="/profile"
              className="flex flex-col items-center gap-1 flex-1"
            >
              <CustomImage
                src={UserData?.profile}
                width={28}
                height={28}
                alt={UserData?.name}
                className={`rounded-full w-7 h-7 aspect-square object-cover border ${
                  isProfileActive ? "border-primary" : "border-border"
                }`}
              />
              <span
                className={`text-[11px] ${
                  isProfileActive ? "text-primary font-medium" : ""
                }`}
              >
                {t("myProfile")}
              </span>
            </CustomLink>
          ) : (
            <button
              onClick={handleLogin}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <div className="w-7 h-7 rounded-full border flex items-center justify-center text-[11px]">
                ?
              </div>
              <span className="text-[11px]">{t("login")}</span>
            </button>
          )}

          {/* PORUKE */}
          <CustomLink
            href="/chat"
            className="flex flex-col items-center gap-1 flex-1"
          >
            <BiChat
              size={24}
              className={isChatActive ? "text-primary" : "text-current"}
            />
            <span
              className={`text-[11px] ${
                isChatActive ? "text-primary font-medium" : ""
              }`}
            >
              {"Poruke"}
            </span>
          </CustomLink>

          {/* OBJAVI OGLAS – centralni CTA */}
          <button
            className="flex flex-col items-center gap-1 flex-1"
            onClick={handleAdListing}
            disabled={IsAdListingClicked}
          >
            <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              {IsAdListingClicked ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <IoIosAddCircleOutline size={20} />
              )}
            </div>
            <span className="text-[11px] font-medium">
              {t("adListing") /* Objavi oglas */}
            </span>
          </button>

          {/* MOJI OGLASI */}
          <CustomLink
            href="/my-ads"
            className="flex flex-col items-center gap-1 flex-1"
          >
            <HiOutlineQueueList
              size={24}
              className={isMyAdsActive ? "text-primary" : "text-current"}
            />
            <span
              className={`text-[11px] ${
                isMyAdsActive ? "text-primary font-medium" : ""
              }`}
            >
              {t("myAds")}
            </span>
          </CustomLink>

          {/* VIŠE – sheet od dole prema gore */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-1 flex-1">
                <div className="w-7 h-7 rounded-full border flex items-center justify-center text-[16px]">
                  …
                </div>
                <span className="text-[11px]">{"Više"}</span>
              </button>
            </SheetTrigger>

            <SheetContent
              side="bottom"
              className="p-0 overflow-y-auto max-h-[80vh] rounded-t-2xl border-t bg-background"
            >
              {/* <SheetHeader className="p-4 border-b">
                <SheetTitle>
                  <CustomImage
                    src={settings?.header_logo}
                    width={195}
                    height={92}
                    alt="Logo"
                    className="w-full h-[40px] object-contain ltr:object-left rtl:object-right max-w-[195px]"
                  />
                </SheetTitle>
                <SheetDescription className="sr-only"></SheetDescription>
              </SheetHeader> */}

              <div className="p-4 flex flex-col gap-4">
                {/* user + jezik */}
                <div className="flex items-center justify-between gap-3">
                  {UserData ? (
                    <CustomLink
                      href="/profile"
                      className="flex items-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <CustomImage
                        src={UserData?.profile}
                        width={48}
                        height={48}
                        alt={UserData?.name}
                        className="rounded-full size-12 aspect-square object-cover border"
                      />
                      <p className="line-clamp-2" title={UserData?.name}>
                        {UserData?.name}
                      </p>
                    </CustomLink>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={handleLogin}>{t("login")}</button>
                      <span className="border-l h-6 self-center"></span>
                      <button onClick={handleRegister}>{t("register")}</button>
                    </div>
                  )}
                  <div className="flex-shrink-0">
                    {/* <LanguageDropdown /> */}
                  </div>
                </div>

                {/* lokacija */}
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={openLocationEditModal}
                >
                  <GrLocation size={16} className="flex-shrink-0" />
                  <p
                    className="line-clamp-2"
                    title={locationText ? locationText : t("addLocation")}
                  >
                    {locationText ? locationText : t("addLocation")}
                  </p>
                </div>
              </div>

              {showMenu && showCategories ? (
                <Tabs defaultValue="menu">
                  <TabsList className="flex items-center justify-between bg-muted rounded-none">
                    <TabsTrigger
                      value="menu"
                      className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {t("menu")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="categories"
                      className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {t("multipleCategories")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="menu">{navItems}</TabsContent>

                  <TabsContent value="categories" className="mt-4 px-4 pb-4">
                    <FilterTree />
                  </TabsContent>
                </Tabs>
              ) : showMenu ? (
                navItems
              ) : showCategories ? (
                <div className="px-4 pb-4 flex flex-col gap-4">
                  <h1 className="font-medium">{t("multipleCategories")}</h1>
                  <FilterTree />
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};

export default HomeMobileMenu;
