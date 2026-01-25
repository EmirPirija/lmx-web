"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";

import Layout from "@/components/Layout/Layout";
import Checkauth from "@/HOC/Checkauth";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import ProfileNavigation from "@/components/Profile/ProfileNavigation";
import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";

import Profile from "@/components/Profile/Profile";
import Notifications from "../Notifications/Notifications";
import MyAds from "../MyAds/MyAds";
import Favorites from "../Favorites/Favorites";
import Transactions from "../Transactions/Transactions";
import Reviews from "../Reviews/Reviews";
import Chat from "../Chat/Chat";
import ProfileSubscription from "../Subscription/ProfileSubscription";
import JobApplications from "../JobApplications/JobApplications";
import BlockedUsersMenu from "../Chat/BlockedUsersMenu";

// Icons
import {
  FiUser,
  FiBell,
  FiLayers,
  FiHeart,
  FiStar,
  FiMessageSquare,
  FiBriefcase,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { BiBadgeCheck, BiReceipt, BiShoppingBag, BiBookmark } from "react-icons/bi";

const LS_HOVER_MODE = "profile_sidebar_hover_mode";
const LS_COLLAPSED = "profile_sidebar_collapsed";

const SidebarLink = ({ href, label, icon: Icon, expanded }) => {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <CustomLink
      href={href}
      title={!expanded ? label : undefined}
      className={cn(
        "group flex items-center rounded-xl border transition-all duration-300",
        "ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        expanded ? "gap-3 px-4 py-3" : "gap-0 px-3 py-3 justify-center",
        active
          ? "bg-primary text-white border-primary shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
      )}
    >
      <span
        className={cn(
          "rounded-lg flex items-center justify-center border transition-all duration-300",
          "ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          expanded ? "w-9 h-9" : "w-10 h-10",
          active
            ? "bg-white/15 border-white/20"
            : "bg-slate-100 border-slate-200 group-hover:bg-slate-200/60"
        )}
      >
        <Icon size={18} className={cn(active ? "text-white" : "text-slate-500")} />
      </span>

      {/* Label (animirano) */}
      <span
        className={cn(
          "min-w-0 truncate text-sm font-semibold transition-all duration-300",
          "ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 w-0"
        )}
      >
        {label}
      </span>
    </CustomLink>
  );
};

const ProfileDashboard = () => {
  const pathname = usePathname();
  const isSmallerThanLaptop = useMediaQuery("(max-width: 1200px)");

  // Ne prikazuj “hero” na /profile (jer Profile komponenta već ima svoj header)
  const hideHero = pathname === "/profile";
  const isChat = pathname === "/chat";

  // Sidebar state
  const [hoverMode, setHoverMode] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [navQuery, setNavQuery] = useState("");

  // Debounce hover (da ne trza)
  const openTimer = useRef(null);
  const closeTimer = useRef(null);

  const clearTimers = useCallback(() => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  useEffect(() => {
    try {
      const hm = localStorage.getItem(LS_HOVER_MODE);
      const col = localStorage.getItem(LS_COLLAPSED);
      if (hm !== null) setHoverMode(hm === "1");
      if (col !== null) setCollapsed(col === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_HOVER_MODE, hoverMode ? "1" : "0");
    } catch {}
  }, [hoverMode]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_COLLAPSED, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const expanded = useMemo(() => {
    // ✅ ovo je “stari layout” (širi se u gridu), samo je sad animirano i stabilno
    if (hoverMode) return !collapsed || isHovering;
    return !collapsed;
  }, [hoverMode, collapsed, isHovering]);

  const onSidebarEnter = useCallback(() => {
    if (!hoverMode) return;
    if (!collapsed) return; // već je “pinano” otvoreno
    clearTimers();
    openTimer.current = window.setTimeout(() => setIsHovering(true), 90);
  }, [hoverMode, collapsed, clearTimers]);

  const onSidebarLeave = useCallback(() => {
    if (!hoverMode) return;
    if (!collapsed) return;
    clearTimers();
    closeTimer.current = window.setTimeout(() => setIsHovering(false), 140);
  }, [hoverMode, collapsed, clearTimers]);

  const toggleHoverMode = useCallback(() => {
    setHoverMode((v) => {
      const next = !v;
      // kad uključi hover mode, najbolje da default bude collapsed pa hover otvara
      if (next) setCollapsed(true);
      return next;
    });
  }, []);

  const toggleCollapsed = useCallback(() => {
    // ručno otvori/zatvori (pin)
    setCollapsed((v) => !v);
    setIsHovering(false);
  }, []);

  const dashboardConfig = useMemo(
    () => ({
      "/profile": {
        title: "Moj profil",
        description: "Uredi lične podatke i postavke naloga.",
        icon: FiUser,
        component: <Profile />,
      },
      "/notifications": {
        title: "Obavijesti",
        description: "Pregled svih obavijesti i aktivnosti na tvom nalogu.",
        icon: FiBell,
        component: <Notifications />,
      },
      "/profile/saved-searches": {
        title: "Spašene pretrage",
        description: "Upravljaj sačuvanim filterima i brzo ih otvaraj.",
        icon: BiBookmark,
        component: null,
      },
      "/user-subscription": {
        title: "Pretplata",
        description: "Status pretplate i dostupni paketi.",
        icon: BiBadgeCheck,
        component: <ProfileSubscription />,
      },
      "/my-ads": {
        title: "Moji oglasi",
        description: "Upravljaj aktivnim, isteklim i arhiviranim oglasima.",
        icon: FiLayers,
        component: <MyAds />,
      },
      "/favorites": {
        title: "Favoriti",
        description: "Oglasi koje si sačuvao/la za kasnije.",
        icon: FiHeart,
        component: <Favorites />,
      },
      "/purchases": {
        title: "Moje kupovine",
        description: "Historija kupovina i detalji narudžbi.",
        icon: BiShoppingBag,
        component: null,
      },
      "/transactions": {
        title: "Transakcije",
        description: "Historija tvojih plaćanja i transakcija.",
        icon: BiReceipt,
        component: <Transactions />,
      },
      "/reviews": {
        title: "Recenzije",
        description: "Ocjene i dojmovi koje si dobio/la od drugih korisnika.",
        icon: FiStar,
        component: <Reviews />,
      },
      "/chat": {
        title: "Poruke",
        description: "Direktna komunikacija sa drugim korisnicima.",
        icon: FiMessageSquare,
        component: <Chat />,
      },
      "/job-applications": {
        title: "Prijave za posao",
        description: "Pregled tvojih prijava i statusa prijava.",
        icon: FiBriefcase,
        component: <JobApplications />,
      },
    }),
    []
  );

  const currentConfig = dashboardConfig[pathname] || dashboardConfig["/profile"];

  const sidebarPrimary = useMemo(
    () => [
      { href: "/profile", label: "Profil", icon: FiUser },
      { href: "/chat", label: "Poruke", icon: FiMessageSquare },
      { href: "/notifications", label: "Obavijesti", icon: FiBell },
      { href: "/my-ads", label: "Moji oglasi", icon: FiLayers },
      { href: "/favorites", label: "Favoriti", icon: FiHeart },
      { href: "/profile/saved-searches", label: "Spašene pretrage", icon: BiBookmark },
    ],
    []
  );

  const sidebarSecondary = useMemo(
    () => [
      { href: "/user-subscription", label: "Pretplata", icon: BiBadgeCheck },
      { href: "/purchases", label: "Moje kupovine", icon: BiShoppingBag },
      { href: "/transactions", label: "Transakcije", icon: BiReceipt },
      { href: "/reviews", label: "Recenzije", icon: FiStar },
      { href: "/job-applications", label: "Prijave za posao", icon: FiBriefcase },
    ],
    []
  );

  const filteredPrimary = useMemo(() => {
    const q = navQuery.trim().toLowerCase();
    if (!q) return sidebarPrimary;
    return sidebarPrimary.filter((x) => x.label.toLowerCase().includes(q));
  }, [navQuery, sidebarPrimary]);

  const filteredSecondary = useMemo(() => {
    const q = navQuery.trim().toLowerCase();
    if (!q) return sidebarSecondary;
    return sidebarSecondary.filter((x) => x.label.toLowerCase().includes(q));
  }, [navQuery, sidebarSecondary]);

  const sidebarWidth = expanded ? 320 : 88;

  const contentFrameClass = cn(
    "bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden",
    isChat ? "sm:h-[660px] lg:h-[820px]" : "min-h-[520px]"
  );

  return (
    <Layout currentPageId="profile" parentPage="profile">
      <div className="min-h-[calc(100vh-60px)] bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="pt-4">
          <BreadCrumb title2={currentConfig?.title || "Moj profil"} />
        </div>

        <div className="container mt-6 sm:mt-8 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)] gap-6">
            {/* SIDEBAR (desktop) */}
            <aside className="hidden lg:block">
              {/* ✅ da ne bude “previše iznad”: top-6 i bez čudnih margina */}
              <div className="sticky top-6">
                <div
                  className={cn(
                    "rounded-2xl border border-gray-200 bg-white overflow-hidden",
                    "transition-[width,box-shadow,transform] duration-300",
                    "ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                    expanded ? "shadow-lg" : "shadow-sm"
                  )}
                  style={{ width: sidebarWidth }}
                  onMouseEnter={onSidebarEnter}
                  onMouseLeave={onSidebarLeave}
                >
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      {/* Naslov (animiran) */}
                      <div
                        className={cn(
                          "min-w-0 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                          expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 w-0 overflow-hidden"
                        )}
                      >
                        <h3 className="text-sm font-bold text-gray-900">Navigacija profila</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Brzo pronađi sekciju koja ti treba
                        </p>
                      </div>

                      {/* Pin / unpin (uvijek vidljiv) */}
                      <button
                        type="button"
                        onClick={toggleCollapsed}
                        className={cn(
                          "shrink-0 w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50",
                          "flex items-center justify-center transition-all duration-200",
                          "hover:shadow-sm active:scale-[0.98]"
                        )}
                        title={collapsed ? "Otvori meni" : "Zatvori meni"}
                        aria-label={collapsed ? "Otvori meni" : "Zatvori meni"}
                      >
                        {collapsed ? (
                          <FiChevronRight size={18} className="text-slate-600" />
                        ) : (
                          <FiChevronLeft size={18} className="text-slate-600" />
                        )}
                      </button>
                    </div>

                    {/* Hover switch (animiran) */}
                    <div
                      className={cn(
                        "mt-3 flex items-center justify-between gap-3 transition-all duration-300",
                        "ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                        expanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 h-0 overflow-hidden mt-0"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-700">Hover otvaranje</div>
                        <div className="text-[11px] text-slate-500">Meni se otvara na prelazak miša</div>
                      </div>

                      <button
                        type="button"
                        onClick={toggleHoverMode}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors border",
                          hoverMode ? "bg-primary border-primary" : "bg-slate-200 border-slate-300"
                        )}
                        aria-label="Uključi/isključi hover otvaranje"
                      >
                        <span
                          className={cn(
                            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                            hoverMode ? "translate-x-5" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    {/* Search (animiran) */}
                    <div
                      className={cn(
                        "mt-3 transition-all duration-300",
                        "ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                        expanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 h-0 overflow-hidden mt-0"
                      )}
                    >
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          value={navQuery}
                          onChange={(e) => setNavQuery(e.target.value)}
                          placeholder="Pretraži u profilu..."
                          className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-primary transition-colors"
                        />
                        {navQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => setNavQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            aria-label="Očisti pretragu"
                          >
                            Očisti
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Kad je zatvoren: mali search button (čisto da ne izgleda prazno) */}
                    {!expanded && (
                      <div className="mt-3 flex items-center justify-center">
                        <button
                          type="button"
                          className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
                          title="Pretraga (otvori meni)"
                          onClick={() => setCollapsed(false)}
                        >
                          <FiSearch size={18} className="text-slate-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ✅ SCROLLABLE BODY */}
                  <div
                    className="p-3 space-y-3 overflow-y-auto overscroll-contain"
                    style={{
                      // 100vh minus headeri; dovoljno da radi na svim stranicama
                      maxHeight: "calc(100vh - 190px)",
                    }}
                  >
                    <div className="space-y-1">
                      <div
                        className={cn(
                          "px-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider transition-all duration-300",
                          expanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden pb-0"
                        )}
                      >
                        Najčešće
                      </div>

                      {filteredPrimary.length ? (
                        filteredPrimary.map((x) => (
                          <SidebarLink
                            key={x.href}
                            href={x.href}
                            label={x.label}
                            icon={x.icon}
                            expanded={expanded}
                          />
                        ))
                      ) : (
                        <div className={cn("px-4 py-3 text-sm text-slate-500", expanded ? "block" : "hidden")}>
                          Nema rezultata za “{navQuery}”.
                        </div>
                      )}
                    </div>

                    <div className={cn("h-px bg-gray-100 transition-all", expanded ? "block" : "hidden")} />

                    <div className="space-y-1">
                      <div
                        className={cn(
                          "px-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider transition-all duration-300",
                          expanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden pb-0"
                        )}
                      >
                        Ostalo
                      </div>

                      {filteredSecondary.length ? (
                        filteredSecondary.map((x) => (
                          <SidebarLink
                            key={x.href}
                            href={x.href}
                            label={x.label}
                            icon={x.icon}
                            expanded={expanded}
                          />
                        ))
                      ) : (
                        <div className={cn("px-4 py-3 text-sm text-slate-500", expanded ? "block" : "hidden")}>
                          Nema dodatnih rezultata.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* CONTENT */}
            <section className="min-w-0">
              {/* Mobile nav ostaje */}
              <div className="lg:hidden">
                <ProfileNavigation />
              </div>

              {/* HERO (ne prikazujemo na /profile da ne duplira header) */}
              {!hideHero && (
                <div className="mt-4 lg:mt-0">
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
                      <div className="relative px-4 sm:px-6 py-5 sm:py-6 flex items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                          <div className="shrink-0 rounded-2xl p-3 bg-primary/10 text-primary border border-primary/10">
                            {currentConfig?.icon ? (
                              <currentConfig.icon className="w-5 h-5" />
                            ) : (
                              <FiUser className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                              {currentConfig?.title || "Moj profil"}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-1 line-clamp-2">
                              {currentConfig?.description || ""}
                            </p>
                          </div>
                        </div>

                        {isChat && isSmallerThanLaptop && (
                          <div className="shrink-0">
                            <BlockedUsersMenu />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENT FRAME */}
              <div className={hideHero ? "mt-4" : "mt-4 sm:mt-6"}>
                <div className={contentFrameClass}>
                  <div className={cn(isChat ? "h-full" : "p-4 sm:p-6 lg:p-8")}>
                    {currentConfig?.component}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="h-10" />
        </div>
      </div>

      {/* Malo “polish” za scrollbar (opcionalno) */}
      <style jsx global>{`
        /* samo za ovaj sidebar scrollbar izgled */
        .profile-sidebar-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .profile-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .profile-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.35);
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .profile-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.55);
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>
    </Layout>
  );
};

export default Checkauth(ProfileDashboard);
