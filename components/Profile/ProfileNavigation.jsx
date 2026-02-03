"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import {
  User,
  Bell,
  MessageSquare,
  Layers,
  Heart,
  Star,
  DollarSign,
  Briefcase,
  Settings,
  Bookmark,
  BarChart3,
  Award,
} from "lucide-react";

const navigationGroups = [
  {
    label: "Profil",
    items: [
      {
        href: "/profile",
        label: "Moj profil",
        icon: User,
        description: "Lični podaci i postavke",
      },
      {
        href: "/notifications",
        label: "Obavijesti",
        icon: Bell,
        description: "Nove poruke i notifikacije",
        badge: true,
      },
    ],
  },
  {
    label: "Prodaja",
    items: [
      {
        href: "/profile/seller",
        label: "Seller Dashboard",
        icon: BarChart3,
        description: "Pregled i statistika",
        highlight: true,
      },
      {
        href: "/my-ads",
        label: "Moji oglasi",
        icon: Layers,
        description: "Upravljaj objavama",
      },
      {
        href: "/chat",
        label: "Poruke",
        icon: MessageSquare,
        description: "Chat sa kupcima",
        badge: true,
      },
      {
        href: "/profile/saved",
        label: "Sačuvani kontakti",
        icon: Bookmark,
        description: "Kolekcije i bilješke",
      },
    ],
  },
  {
    label: "Kupovina",
    items: [
      {
        href: "/favorites",
        label: "Omiljeni oglasi",
        icon: Heart,
        description: "Sačuvani proizvodi",
      },
      {
        href: "/transactions",
        label: "Transakcije",
        icon: DollarSign,
        description: "Plaćanja i kupovine",
      },
      {
        href: "/job-applications",
        label: "Prijave za posao",
        icon: Briefcase,
        description: "Tvoje aplikacije",
      },
    ],
  },
  {
    label: "Ostalo",
    items: [
      {
        href: "/reviews",
        label: "Recenzije",
        icon: Star,
        description: "Tvoje ocjene",
      },
      {
        href: "/user-subscription",
        label: "Članstvo",
        icon: Award,
        description: "Pro/Shop paketi",
      },
    ],
  },
];

function NavItem({ href, label, icon: Icon, description, isActive, badge, badgeCount, highlight }) {
  return (
    <CustomLink href={href}>
      <motion.div
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
          isActive
            ? "bg-slate-900 text-white shadow-sm"
            : highlight
            ? "bg-emerald-50 text-emerald-900 border border-emerald-200/60 hover:bg-emerald-100/80"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            isActive
              ? "bg-white/15"
              : highlight
              ? "bg-emerald-100"
              : "bg-slate-100"
          )}
        >
          <Icon
            size={18}
            strokeWidth={isActive ? 2.5 : 2}
            className={isActive ? "text-white" : highlight ? "text-emerald-600" : "text-slate-500"}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "text-sm font-semibold",
              isActive ? "text-white" : highlight ? "text-emerald-900" : "text-slate-800"
            )}
          >
            {label}
          </div>
          <div
            className={cn(
              "text-[11px] truncate",
              isActive ? "text-white/70" : highlight ? "text-emerald-600" : "text-slate-400"
            )}
          >
            {description}
          </div>
        </div>

        {badge && badgeCount > 0 && (
          <span
            className={cn(
              "min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full",
              isActive ? "bg-white text-slate-900" : "bg-red-500 text-white"
            )}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}

        {isActive && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </motion.div>
    </CustomLink>
  );
}

export default function ProfileNavigation({ badges = {} }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {navigationGroups.map((group) => (
        <div key={group.label}>
          <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {group.label}
          </h3>
          <div className="space-y-0.5">
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
