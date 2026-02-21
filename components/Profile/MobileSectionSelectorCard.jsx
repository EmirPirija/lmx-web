"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "@/utils/toastBs";
import { cn } from "@/lib/utils";
import CustomLink from "@/components/Common/CustomLink";
import { userSignUpData } from "@/redux/reducer/authSlice";
import {
  getProfileNavigationSections,
  isProfileNavItemActive,
} from "@/components/Profile/profileNavConfig";
import {
  IoChevronForward,
  IoMenuOutline,
} from "@/components/Common/UnifiedIconPack";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const findActiveNavItem = (sections, pathname) => {
  for (const section of sections) {
    for (const item of section.items || []) {
      if (isProfileNavItemActive(pathname, item)) {
        return { ...item, sectionTitle: section.title };
      }
    }
  }
  return null;
};

const MobileSectionSelectorCard = ({ className = "" }) => {
  const pathname = usePathname();
  const userData = useSelector(userSignUpData);
  const [isOpen, setIsOpen] = useState(false);

  const navigationSections = useMemo(
    () =>
      getProfileNavigationSections({
        isVerified: Boolean(
          userData?.is_verified === true ||
            userData?.verified === true ||
            Number(userData?.is_verified) === 1 ||
            Number(userData?.verified) === 1
        ),
        activeAds: Number(userData?.active_ads || userData?.total_ads || 0),
        unreadNotifications: Number(userData?.unread_notifications || 0),
        unreadMessages: Number(userData?.unread_messages || 0),
      }),
    [userData]
  );

  const activeItem = useMemo(
    () => findActiveNavItem(navigationSections, pathname),
    [navigationSections, pathname]
  );
  const ActiveIcon = activeItem?.icon || IoMenuOutline;

  return (
    <div
      className={cn(
        "mb-4 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/85 lg:hidden",
        className
      )}
    >
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="group relative w-full overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-3 py-2.5 text-left transition-colors hover:border-primary/35 dark:border-primary/30 dark:from-primary/20 dark:via-primary/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary/90 dark:text-primary/80">
                  Trenutno odabrano
                </p>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-primary shadow-sm dark:bg-slate-900/80">
                    <ActiveIcon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {activeItem?.label || "Odaberite sekciju"}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {activeItem?.sectionTitle || "Sekcije"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-full border border-primary/30 bg-white/80 px-2 py-1 text-[11px] font-semibold text-primary dark:bg-slate-900/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Aktivno
              </div>
            </div>

            <div className="mt-2 flex items-center justify-end gap-1 text-[11px] font-semibold text-primary/90 dark:text-primary/80">
              <span>Dodirni za odabir sekcije</span>
              <IoChevronForward size={14} />
            </div>
          </button>
        </SheetTrigger>

        <SheetContent
          side="bottom"
          className="h-[min(86dvh,740px)] rounded-t-3xl border border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900 [&>button]:hidden"
        >
          <SheetHeader className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <SheetTitle className="flex items-center justify-between text-left text-base font-semibold text-slate-900 dark:text-slate-100">
              <span>Profil sekcije</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                Aktivno
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="h-full overflow-y-auto px-3 pb-6 pt-3">
            <div className="space-y-3">
              {navigationSections.map((section) => (
                <div key={`selector-${section.title}`}>
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = isProfileNavItemActive(pathname, item);
                      const isDisabled = Boolean(item.disabled);

                      if (isDisabled) {
                        return (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => toast.info(`${item.label} je privremeno nedostupno.`)}
                            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
                              <ItemIcon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{item.label}</p>
                              <p className="truncate text-[11px] opacity-80">{item.description}</p>
                            </div>
                          </button>
                        );
                      }

                      return (
                        <CustomLink
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors",
                            isActive
                              ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg",
                              isActive
                                ? "bg-white/15 dark:bg-slate-900/15"
                                : "bg-slate-100 dark:bg-slate-800"
                            )}
                          >
                            <ItemIcon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{item.label}</p>
                            <p
                              className={cn(
                                "truncate text-[11px]",
                                isActive ? "text-white/75 dark:text-slate-900/70" : "text-slate-500 dark:text-slate-400"
                              )}
                            >
                              {item.description}
                            </p>
                          </div>
                        </CustomLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileSectionSelectorCard;
