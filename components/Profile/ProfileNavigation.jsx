"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import { toast } from "@/utils/toastBs";
import { IoCloseOutline, IoSearchOutline } from "@/components/Common/UnifiedIconPack";
import {
  getProfileNavigationSections,
  isProfileNavItemActive,
} from "@/components/Profile/profileNavConfig";

function NavItem({
  href,
  label,
  icon: Icon,
  description,
  isActive,
  badgeCount,
  highlight,
  disabled = false,
  unavailableBadge = "",
}) {
  const content = (
    <motion.div
      whileHover={disabled ? undefined : { x: 3 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      title={description || label}
      aria-label={description || label}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
        disabled
          ? "cursor-not-allowed opacity-65 text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/70"
          : isActive
          ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
          : highlight
          ? "bg-emerald-50 text-emerald-900 border border-emerald-200/60 hover:bg-emerald-100/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/20"
          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
          disabled
            ? "bg-slate-200 dark:bg-slate-700"
            : isActive
            ? "bg-white/15 dark:bg-slate-900/15"
            : highlight
            ? "bg-emerald-100 dark:bg-emerald-500/20"
            : "bg-slate-100 dark:bg-slate-800"
        )}
      >
        <Icon
          size={18}
          strokeWidth={isActive ? 2.5 : 2}
          className={cn(
            disabled
              ? "text-slate-400 dark:text-slate-500"
              : isActive
              ? "text-white dark:text-slate-900"
              : highlight
              ? "text-emerald-600 dark:text-emerald-300"
              : "text-slate-500 dark:text-slate-400"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-semibold",
            disabled
              ? "text-slate-500 dark:text-slate-400"
              : isActive
              ? "text-white dark:text-slate-900"
              : highlight
              ? "text-emerald-900 dark:text-emerald-300"
              : "text-slate-800 dark:text-slate-200"
          )}
        >
          {label}
        </div>
        <div
          className={cn(
            "text-[11px] truncate",
            disabled
              ? "text-slate-400 dark:text-slate-500"
              : isActive
              ? "text-white/70 dark:text-slate-900/70"
              : highlight
              ? "text-emerald-600 dark:text-emerald-300"
              : "text-slate-400 dark:text-slate-500"
          )}
        >
          {description}
        </div>
      </div>

      {disabled && unavailableBadge ? (
        <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
          {unavailableBadge}
        </span>
      ) : null}

      {!disabled && badgeCount > 0 && (
        <span
          className={cn(
            "min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full",
            isActive ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" : "bg-red-500 text-white"
          )}
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}

      {!disabled && isActive && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white dark:bg-slate-900 rounded-r-full"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.div>
  );

  if (disabled) {
    return (
      <button
        type="button"
        onClick={() => toast.info(`${label} je privremeno nedostupno.`)}
        className="w-full text-left"
      >
        {content}
      </button>
    );
  }

  return <CustomLink href={href}>{content}</CustomLink>;
}

export default function ProfileNavigation({ badges = {} }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const navigationGroups = useMemo(
    () =>
      getProfileNavigationSections({
        unreadNotifications: badges["/notifications"] || 0,
        unreadMessages: badges["/chat"] || 0,
      }).map((section) => ({ label: section.title, items: section.items })),
    [badges]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const flatItems = useMemo(() => navigationGroups.flatMap((group) => group.items), [navigationGroups]);

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return navigationGroups;

    return navigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const haystack = `${item.label} ${item.description}`.toLowerCase();
          return haystack.includes(normalizedQuery);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [navigationGroups, normalizedQuery]);

  const filteredFlatItems = useMemo(() => {
    if (!normalizedQuery) return flatItems;
    return flatItems.filter((item) => {
      const haystack = `${item.label} ${item.description}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [flatItems, normalizedQuery]);

  return (
    <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="relative">
        <IoSearchOutline size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pretraži sekcije..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Ocisti pretragu"
          >
            <IoCloseOutline size={14} />
          </button>
        ) : null}
      </div>

      <div className="md:hidden mt-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-lmx">
          {filteredFlatItems.map((item) => {
            const Icon = item.icon;
            const isActive = isProfileNavItemActive(pathname, item);
            const badgeCount = typeof badges[item.href] === "number" ? badges[item.href] : item.badge || 0;
            const isDisabled = Boolean(item.disabled);
            const chipClass = cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap transition",
              isDisabled
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                : isActive
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            );

            if (isDisabled) {
              return (
                <button
                  key={item.href}
                  type="button"
                  title={item.description || item.label}
                  aria-label={item.description || item.label}
                  onClick={() => toast.info(`${item.label} je privremeno nedostupno.`)}
                  className={chipClass}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            }

            return (
              <CustomLink
                key={item.href}
                href={item.href}
                title={item.description || item.label}
                aria-label={item.description || item.label}
                className={chipClass}
              >
                <Icon size={14} />
                {item.label}
                {badgeCount > 0 ? (
                  <span className="inline-flex min-w-[18px] justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                ) : null}
              </CustomLink>
            );
          })}
          {filteredFlatItems.length === 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 py-2">Nema rezultata.</span>
          )}
        </div>
      </div>

      <nav className="hidden md:block mt-4 space-y-5">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  isActive={isProfileNavItemActive(pathname, item)}
                  badgeCount={typeof badges[item.href] === "number" ? badges[item.href] : item.badge || 0}
                  disabled={Boolean(item.disabled)}
                  unavailableBadge={item.unavailableBadge}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 text-center text-xs text-slate-500 dark:text-slate-400">
            Nema rezultata za "{query}".
          </div>
        )}
      </nav>
    </div>
  );
}
