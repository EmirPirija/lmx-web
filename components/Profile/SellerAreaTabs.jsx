"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import { 
  FiGrid, 
  FiSettings, 
  FiBarChart2, 
  FiBookmark, 
  FiMessageSquare,
  FiPackage,
  FiStar,
} from "react-icons/fi";

const tabs = [
  { 
    href: "/profile/seller", 
    label: "Pregled", 
    icon: FiGrid,
    description: "Dashboard i statistika"
  },
  { 
    href: "/profile/seller-settings", 
    label: "Postavke", 
    icon: FiSettings,
    description: "Uredi profil prodavača"
  },
  { 
    href: "/my-ads", 
    label: "Oglasi", 
    icon: FiPackage,
    description: "Upravljaj objavama"
  },
  { 
    href: "/saved-sellers", 
    label: "Kontakti", 
    icon: FiBookmark,
    description: "Sačuvani kupci i selleri"
  },
  { 
    href: "/chat", 
    label: "Poruke", 
    icon: FiMessageSquare,
    description: "Chat sa kupcima",
    badge: true
  },
  { 
    href: "/reviews", 
    label: "Recenzije", 
    icon: FiStar,
    description: "Tvoje ocjene"
  },
];

export default function SellerAreaTabs({ badge }) {
  const pathname = usePathname();

  return (
    <div className="mb-8">
      {/* Desktop - Horizontalni tabovi */}
      <div className="hidden lg:block">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/70 rounded-3xl p-2 shadow-lg shadow-slate-200/50">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((t) => {
              const active = pathname === t.href;
              const Icon = t.icon;

              return (
                <CustomLink
                  key={t.href}
                  href={t.href}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-200 min-w-max",
                      active
                        ? "bg-gradient-to-br from-primary to-primary/90 text-white shadow-lg shadow-primary/25"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon 
                        size={20} 
                        strokeWidth={active ? 2.5 : 2}
                        className={active ? "text-white" : "text-slate-500"}
                      />
                      <div className="min-w-0">
                        <div className={cn(
                          "text-sm font-bold",
                          active ? "text-white" : "text-slate-900"
                        )}>
                          {t.label}
                        </div>
                        <div className={cn(
                          "text-xs mt-0.5",
                          active ? "text-white/80" : "text-slate-500"
                        )}>
                          {t.description}
                        </div>
                      </div>
                    </div>

                    {t.badge && badge > 0 && (
                      <span className="ml-2 min-w-[22px] h-[22px] px-2 flex items-center justify-center text-xs font-black bg-red-500 text-white rounded-full">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}

                    {active && (
                      <motion.div
                        layoutId="sellerTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full"
                      />
                    )}
                  </motion.div>
                </CustomLink>
              );
            })}
          </div>
        </div>

        {/* Pomoćni tekst */}
        <div className="mt-4 flex items-center justify-between px-2">
          <p className="text-xs text-slate-500">
            Sve vezano za prodaju na jednom mjestu: pregled, poruke, postavke i kontakti.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">Online</span>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet - Dropdown select */}
      <div className="lg:hidden">
        <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-sm">
          <label className="text-xs font-bold text-slate-700 mb-2 block">
            Seller navigacija
          </label>
          <select
            value={pathname}
            onChange={(e) => {
              window.location.href = e.target.value;
            }}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            {tabs.map((t) => (
              <option key={t.href} value={t.href}>
                {t.label} - {t.description}
              </option>
            ))}
          </select>
          
          <div className="mt-3 text-xs text-slate-500">
            Odaberi sekciju za brzu navigaciju
          </div>
        </div>
      </div>

      {/* Mobile - Horizontalna scrollable verzija (alternativa) */}
      <div className="lg:hidden mt-4">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/70 rounded-2xl p-2 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {tabs.map((t) => {
              const active = pathname === t.href;
              const Icon = t.icon;

              return (
                <CustomLink
                  key={t.href}
                  href={t.href}
                  className="relative"
                >
                  <div
                    className={cn(
                      "flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all min-w-[90px]",
                      active
                        ? "bg-primary text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <div className="relative">
                      <Icon 
                        size={22} 
                        strokeWidth={active ? 2.5 : 2}
                      />
                      {t.badge && badge > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-black bg-red-500 text-white rounded-full border-2 border-white">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-bold text-center",
                      active ? "text-white" : "text-slate-700"
                    )}>
                      {t.label}
                    </span>
                  </div>
                </CustomLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}