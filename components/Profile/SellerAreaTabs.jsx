"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Settings,
  Package,
  Bookmark,
  MessageSquare,
  Star,
  ChevronDown,
  Zap,
} from "@/components/Common/UnifiedIconPack";

const tabs = [
  {
    href: "/profile/seller",
    label: "Pregled",
    icon: LayoutGrid,
    description: "Dashboard i statistika",
  },
  {
    href: "/profile/seller-settings",
    label: "Postavke",
    icon: Settings,
    description: "Uredi profil prodavača",
  },
  // {
  //   href: "/my-ads",
  //   label: "Oglasi",
  //   icon: Package,
  //   description: "Upravljaj objavama",
  // },
  // {
  //   href: "/profile/saved",
  //   label: "Kontakti",
  //   icon: Bookmark,
  //   description: "Sačuvani kupci i selleri",
  // },
  // {
  //   href: "/chat",
  //   label: "Poruke",
  //   icon: MessageSquare,
  //   description: "Chat sa kupcima",
  //   badge: true,
  // },
  // {
  //   href: "/reviews",
  //   label: "Recenzije",
  //   icon: Star,
  //   description: "Tvoje ocjene",
  // },
];

export default function SellerAreaTabs({ badge = 0 }) {
  const pathname = usePathname();

  return (
    <div className="mb-8">
      {/* Desktop - Horizontalni tabovi */}
      <div className="hidden lg:block">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;

              return (
                <CustomLink key={tab.href} href={tab.href} className="relative flex-1">
                  <motion.div
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-slate-900 text-white shadow-lg dark:bg-primary dark:text-slate-950"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    )}
                  >
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={isActive ? "text-white dark:text-slate-950" : "text-slate-500 dark:text-slate-400"}
                    />
                    <div className="flex flex-col items-start min-w-0">
                      <span
                        className={cn(
                          "text-sm font-semibold whitespace-nowrap",
                          isActive ? "text-white dark:text-slate-950" : "text-slate-800 dark:text-slate-100"
                        )}
                      >
                        {tab.label}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] whitespace-nowrap hidden xl:block",
                          isActive ? "text-white/70 dark:text-slate-950/80" : "text-slate-400 dark:text-slate-500"
                        )}
                      >
                        {tab.description}
                      </span>
                    </div>

                    {tab.badge && badge > 0 && (
                      <span
                        className={cn(
                          "ml-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full",
                          isActive ? "bg-white text-slate-900" : "bg-red-500 text-white"
                        )}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </motion.div>
                </CustomLink>
              );
            })}
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sve na jednom mjestu: pregled, poruke, postavke i kontakti.
          </p>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600">Online</span>
          </div>
        </div>
      </div>

      {/* Tablet - Kompaktni tabovi */}
      <div className="hidden md:block lg:hidden">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;

              return (
                <CustomLink key={tab.href} href={tab.href} className="relative flex-1">
                  <div
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all",
                      isActive
                        ? "bg-slate-900 text-white shadow-md dark:bg-primary dark:text-slate-950"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="relative">
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      {tab.badge && badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </div>
                    <span className={cn("text-xs font-semibold", isActive ? "text-white dark:text-slate-950" : "text-slate-700 dark:text-slate-200")}>
                      {tab.label}
                    </span>
                  </div>
                </CustomLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile - Select dropdown + Pills */}
      <div className="md:hidden space-y-3">
        {/* Dropdown za navigaciju */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Navigacija
          </label>
          <div className="relative">
            <select
              value={pathname}
              onChange={(e) => {
                window.location.href = e.target.value;
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-semibold text-slate-900 transition-all cursor-pointer focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-300/20"
            >
              {tabs.map((tab) => (
                <option key={tab.href} value={tab.href}>
                  {tab.label} — {tab.description}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
          </div>
        </div>

        {/* Quick pills za najvažnije akcije */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.slice(0, 4).map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <CustomLink key={tab.href} href={tab.href}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all whitespace-nowrap",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-md dark:border-primary dark:bg-primary dark:text-slate-950"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
                  )}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm font-semibold">{tab.label}</span>
                  {tab.badge && badge > 0 && (
                    <span
                      className={cn(
                        "min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full",
                        isActive ? "bg-white text-slate-900" : "bg-red-500 text-white"
                      )}
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
              </CustomLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
