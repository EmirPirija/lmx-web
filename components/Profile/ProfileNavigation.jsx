"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import {
  FiUser,
  FiBell,
  FiMessageSquare,
  FiLayers,
  FiHeart,
  FiStar,
  FiDollarSign,
  FiBriefcase,
  FiPackage,
  FiSettings,
  FiBookmark,
  FiBarChart2,
  FiShield,
  FiAward,
} from "react-icons/fi";

const navigationGroups = [
  {
    label: "Profil",
    items: [
      { 
        href: "/profile", 
        label: "Moj profil", 
        icon: FiUser,
        description: "Lični podaci i postavke"
      },
      { 
        href: "/notifications", 
        label: "Obavijesti", 
        icon: FiBell,
        description: "Nove poruke i notifikacije",
        badge: true
      },
    ]
  },
  {
    label: "Prodaja",
    items: [
      { 
        href: "/profile/seller", 
        label: "Seller Dashboard", 
        icon: FiBarChart2,
        description: "Pregled i statistika",
        highlight: true
      },
      { 
        href: "/my-ads", 
        label: "Moji oglasi", 
        icon: FiLayers,
        description: "Upravljaj objavama"
      },
      { 
        href: "/chat", 
        label: "Poruke", 
        icon: FiMessageSquare,
        description: "Chat sa kupcima",
        badge: true
      },
      { 
        href: "/saved-sellers", 
        label: "Sačuvani kontakti", 
        icon: FiBookmark,
        description: "Kolekcije i bilješke"
      },
    ]
  },
  {
    label: "Kupovina",
    items: [
      { 
        href: "/favorites", 
        label: "Omiljeni oglasi", 
        icon: FiHeart,
        description: "Sačuvani proizvodi"
      },
      { 
        href: "/transactions", 
        label: "Transakcije", 
        icon: FiDollarSign,
        description: "Plaćanja i kupovine"
      },
      { 
        href: "/job-applications", 
        label: "Prijave za posao", 
        icon: FiBriefcase,
        description: "Tvoje aplikacije"
      },
    ]
  },
  {
    label: "Ostalo",
    items: [
      { 
        href: "/reviews", 
        label: "Recenzije", 
        icon: FiStar,
        description: "Tvoje ocjene"
      },
      { 
        href: "/user-subscription", 
        label: "Članstvo", 
        icon: FiAward,
        description: "Pro/Shop paketi"
      },
    ]
  }
];

function NavItem({ href, label, icon: Icon, description, isActive, badge, badgeCount, highlight }) {
  return (
    <CustomLink href={href}>
      <motion.div
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/20"
            : highlight
            ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-900 border border-emerald-200/50 hover:shadow-md"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
          isActive
            ? "bg-white/20"
            : highlight
            ? "bg-emerald-600/10"
            : "bg-slate-100"
        )}>
          <Icon 
            size={18} 
            strokeWidth={isActive ? 2.5 : 2}
            className={isActive ? "text-white" : highlight ? "text-emerald-600" : "text-slate-500"}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className={cn(
            "text-sm font-bold",
            isActive ? "text-white" : highlight ? "text-emerald-900" : "text-slate-900"
          )}>
            {label}
          </div>
          <div className={cn(
            "text-xs mt-0.5 truncate",
            isActive ? "text-white/80" : highlight ? "text-emerald-700" : "text-slate-500"
          )}>
            {description}
          </div>
        </div>

        {badge && badgeCount > 0 && (
          <span className={cn(
            "min-w-[22px] h-[22px] px-2 flex items-center justify-center text-xs font-black rounded-full",
            isActive ? "bg-white text-primary" : "bg-red-500 text-white"
          )}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}

        {isActive && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
          />
        )}
      </motion.div>
    </CustomLink>
  );
}

export default function ProfileNavigation({ badges = {} }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {navigationGroups.map((group) => (
        <div key={group.label}>
          <h3 className="px-4 mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
            {group.label}
          </h3>
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
                badgeCount={badges[item.href] || 0}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}