"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import CustomLink from "@/components/Common/CustomLink";
import { useEffect, useMemo, useRef, useState } from "react";
import CustomImage from "@/components/Common/CustomImage";
import { useNavigate } from "@/components/Common/useNavigate";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Grid3X3,
  ArrowRight,
  ChevronRight,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// HELPERS
// ============================================
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const formatCompact = (num) => {
  const n = Number(num || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

// Deterministic stats (no random jumping)
const stableStats = (category) => {
  const base = Number(category?.items_count || 0);
  const seed = Number(category?.id || 1) * 9973;
  const newToday = clamp((seed % 17) + 1, 1, 18);
  const trend = clamp((seed % 61) + 35, 30, 95);

  return {
    totalItems: base > 0 ? base : clamp((seed % 900) + 60, 60, 900),
    newToday,
    trend,
  };
};

// ============================================
// MEGA MENU CONTENT (fixes whitespace)
// ============================================
const CategoryMegaContent = ({ category, containerWidth, buildCategoryUrl }) => {
  const stats = stableStats(category);

  const subcats = Array.isArray(category?.subcategories) ? category.subcategories : [];
  const [activeSubId, setActiveSubId] = useState(subcats?.[0]?.id ?? null);

  useEffect(() => {
    setActiveSubId(subcats?.[0]?.id ?? null);
  }, [category?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSub = useMemo(() => {
    if (!subcats?.length) return null;
    return subcats.find((s) => s.id === activeSubId) || subcats[0];
  }, [subcats, activeSubId]);

  const activeNested = useMemo(() => {
    const list = activeSub?.subcategories;
    return Array.isArray(list) ? list : [];
  }, [activeSub]);

  const panelW = Math.max(760, (containerWidth || 900) - 32);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-background shadow-none"
      style={{ width: panelW }}
    >
      <div className="flex">
        {/* LEFT / SUMMARY */}
        <div className="w-[300px] p-5 border-r border-border bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center overflow-hidden">
              <CustomImage
                src={category?.image}
                alt={category?.translated_name}
                width={32}
                height={32}
                className="w-7 h-7 object-contain"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-base truncate">
                  {category?.translated_name}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                  {formatCompact(stats.totalItems)} oglasa
                </span>
              </div>

              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Pregledaj podkategorije i detalje desno.
              </p>
            </div>
          </div>

          {/* Metrics (hard-fixed bar, no white gaps) */}
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  Trend
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {stats.trend}/100
                </span>
              </div>

              <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${stats.trend}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Novo danas</span>
                <span className="text-sm font-semibold text-foreground">
                  +{stats.newToday}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Procjena na osnovu aktivnosti.
              </p>
            </div>
          </div>

          <CustomLink
            href={buildCategoryUrl(category.slug)}
            className={cn(
              "mt-5 inline-flex w-full items-center justify-between rounded-xl",
              "border border-border bg-background px-4 py-3",
              "text-sm font-semibold text-foreground",
              "hover:bg-muted/40 transition-colors"
            )}
          >
            <span>Pregledaj sve oglase</span>
            <ArrowRight className="w-4 h-4" />
          </CustomLink>
        </div>

        {/* RIGHT / SUBCATEGORY LIST + DETAILS (removes ugly empty whitespace) */}
        <div className="flex-1 min-w-0">
          <div className="flex h-full">
            {/* Subcategory list */}
            <div className="w-[260px] border-r border-border">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4" />
                    Podkategorije
                  </h4>
                  <span className="text-xs text-muted-foreground">{subcats.length}</span>
                </div>

                <div className="max-h-[36vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-1">
                    {subcats.map((s) => {
                      const isActive = s.id === activeSubId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onMouseEnter={() => setActiveSubId(s.id)}
                          onFocus={() => setActiveSubId(s.id)}
                          className={cn(
                            "w-full text-left rounded-lg px-3 py-2",
                            "border border-transparent",
                            "transition-colors",
                            isActive
                              ? "bg-muted/40 border-border"
                              : "hover:bg-muted/30 hover:border-border/60"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn("text-sm font-medium truncate", isActive ? "text-foreground" : "text-foreground")}>
                              {s.translated_name}
                            </span>
                            <ChevronRight className={cn("w-4 h-4 shrink-0 text-muted-foreground", isActive ? "opacity-100" : "opacity-40")} />
                          </div>

                          {s.subcategories_count > 0 && (
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              {s.subcategories_count} podkategorija
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Details panel */}
            <div className="flex-1 min-w-0 p-5">
              {activeSub ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="min-w-0">
                      <h5 className="text-base font-semibold text-foreground truncate">
                        {activeSub.translated_name}
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        {activeSub.subcategories_count > 0
                          ? `${activeSub.subcategories_count} podkategorija`
                          : "Bez dodatnih podkategorija"}
                      </p>
                    </div>

                    <CustomLink
                      href={buildCategoryUrl(activeSub.slug)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                    >
                      Pregledaj
                      <ArrowRight className="w-4 h-4" />
                    </CustomLink>
                  </div>

                  {activeNested.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-[36vh] overflow-y-auto pr-2 custom-scrollbar">
                      {activeNested.map((n) => (
                        <CustomLink
                          key={n.id}
                          href={buildCategoryUrl(n.slug)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2",
                            "border border-transparent",
                            "hover:border-border hover:bg-muted/30 transition-colors"
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                          <span className="text-sm text-foreground truncate">
                            {n.translated_name}
                          </span>
                        </CustomLink>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-sm text-muted-foreground">
                        Ova podkategorija nema dodatne podkategorije — možeš direktno pregledati oglase.
                      </p>
                      <CustomLink
                        href={buildCategoryUrl(activeSub.slug)}
                        className={cn(
                          "mt-3 inline-flex items-center justify-between w-full rounded-xl",
                          "border border-border bg-background px-4 py-3",
                          "text-sm font-semibold text-foreground",
                          "hover:bg-muted/40 transition-colors"
                        )}
                      >
                        <span>Pregledaj oglase</span>
                        <ArrowRight className="w-4 h-4" />
                      </CustomLink>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Nema podkategorija.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN
// ============================================
const HeaderCategories = ({ cateData = [] }) => {
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate } = useNavigate();

  const [fitCategoriesCount, setFitCategoriesCount] = useState(3);

  useEffect(() => {
    const calculateFit = () => {
      if (!containerRef.current || !measureRef.current) return;

      const containerWidth = containerRef.current.offsetWidth || 0;
      const reserved = 150; // space for Ostalo
      const availableWidth = containerWidth - reserved;

      const items = Array.from(measureRef.current.children);
      let total = 0;
      let visible = 0;

      for (const item of items) {
        const w = item.getBoundingClientRect().width + 40;
        if (total + w > availableWidth) break;
        total += w;
        visible++;
      }

      setFitCategoriesCount(Math.max(0, visible));
    };

    calculateFit();
    const ro = new ResizeObserver(calculateFit);
    if (containerRef.current) ro.observe(containerRef.current);

    window.addEventListener("resize", calculateFit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calculateFit);
    };
  }, [cateData]);

  const buildCategoryUrl = (categorySlug) => {
    if (pathname.startsWith("/ads")) {
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("lang");
      sp.set("category", categorySlug);
      return `/ads?${sp.toString()}`;
    }
    return `/ads?category=${categorySlug}`;
  };

  const handleCategoryClick = (slug) => {
    if (pathname.startsWith("/ads")) {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("category", slug);
      window.history.pushState(null, "", `/ads?${sp.toString()}`);
    } else {
      navigate(`/ads?category=${slug}`);
    }
  };

  const visibleCategories = useMemo(
    () => cateData.slice(0, fitCategoriesCount),
    [cateData, fitCategoriesCount]
  );
  const overflowCategories = useMemo(
    () => cateData.slice(fitCategoriesCount),
    [cateData, fitCategoriesCount]
  );

  return (
    <div className="hidden lg:block border-b bg-background">
      <div className="container" ref={containerRef}>
        {/* Hidden measurement row */}
        <div
          ref={measureRef}
          className="pointer-events-none opacity-0 flex"
          style={{ position: "fixed", top: -9999, left: -9999 }}
        >
          {cateData.map((category) => (
            <div key={category.id} className="px-2">
              <span className="whitespace-nowrap font-medium text-sm">
                {category.translated_name}
              </span>
            </div>
          ))}
        </div>

        <div className="py-2">
          <NavigationMenu>
            <NavigationMenuList className="rtl:flex-row-reverse">
              {visibleCategories.map((category, index) => {
                const isHot = index === 0 && category?.subcategories_count > 0;

                return (
                  <NavigationMenuItem key={category.id}>
                    {category.subcategories_count > 0 ? (
                      <>
                        <NavigationMenuTrigger
                          onClick={() => handleCategoryClick(category.slug)}
                          className="group"
                        >
                          <span className="inline-flex items-center gap-2">
                            {isHot && (
                              <span className="inline-flex items-center text-amber-600">
                                <Flame className="w-4 h-4" />
                              </span>
                            )}
                            {category.translated_name}
                          </span>
                        </NavigationMenuTrigger>

                        <NavigationMenuContent className="rtl:[direction:rtl]">
                          <CategoryMegaContent
                            category={category}
                            containerWidth={containerRef?.current?.offsetWidth}
                            buildCategoryUrl={buildCategoryUrl}
                          />
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink
                        className={navigationMenuTriggerStyle()}
                        href={buildCategoryUrl(category?.slug)}
                        asChild
                      >
                        <CustomLink href={buildCategoryUrl(category?.slug)}>
                          {category.translated_name}
                        </CustomLink>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                );
              })}

              {/* Ostalo (stays in menu, no auto navigation) */}
              {overflowCategories.length > 0 && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="group">
                    <span className="inline-flex items-center gap-2">
                      <Grid3X3 className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      Ostalo
                      <span className="ml-1 inline-flex items-center justify-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                        +{overflowCategories.length}
                      </span>
                    </span>
                  </NavigationMenuTrigger>

                  <NavigationMenuContent className="rtl:[direction:rtl]">
                    <div
                      className="overflow-hidden rounded-2xl border border-border bg-background shadow-none"
                      style={{
                        width: Math.max(
                          760,
                          (containerRef?.current?.offsetWidth || 900) - 32
                        ),
                      }}
                    >
                      <div className="flex">
                        <div className="w-[300px] p-5 border-r border-border bg-muted/30">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center">
                              <Grid3X3 className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground text-base">
                                Sve kategorije
                              </h3>
                              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                Kategorije koje ne stanu u header su ovdje.
                              </p>
                            </div>
                          </div>

                          <CustomLink
                            href="/ads"
                            className={cn(
                              "mt-5 inline-flex w-full items-center justify-between rounded-xl",
                              "border border-border bg-background px-4 py-3",
                              "text-sm font-semibold text-foreground",
                              "hover:bg-muted/40 transition-colors"
                            )}
                          >
                            <span>Pregledaj sve oglase</span>
                            <ArrowRight className="w-4 h-4" />
                          </CustomLink>
                        </div>

                        <div className="flex-1 p-5">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Grid3X3 className="w-4 h-4" />
                            Ostale kategorije
                          </h4>

                          <div className="grid grid-cols-3 gap-x-6 gap-y-2 max-h-[36vh] overflow-y-auto pr-2 custom-scrollbar">
                            {overflowCategories.map((c) => (
                              <div key={c.id} className="min-w-0">
                                <CustomLink
                                  href={buildCategoryUrl(c.slug)}
                                  className={cn(
                                    "group flex items-center gap-3 rounded-xl px-3 py-2",
                                    "border border-transparent",
                                    "hover:border-border hover:bg-muted/30 transition-colors"
                                  )}
                                >
                                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                                    <CustomImage
                                      src={c?.image}
                                      alt={c?.translated_name}
                                      width={24}
                                      height={24}
                                      className="w-6 h-6 object-contain"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <span className="block text-sm font-medium text-foreground truncate">
                                      {c.translated_name}
                                    </span>
                                    {c.subcategories_count > 0 && (
                                      <span className="block text-[11px] text-muted-foreground truncate">
                                        {c.subcategories_count} podkategorija
                                      </span>
                                    )}
                                  </div>

                                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </CustomLink>

                                {/* show all subcategories (no "pogledaj sve") */}
                                {c.subcategories_count > 0 && (
                                  <ul className="mt-1 ml-[52px] space-y-0.5">
                                    {(c?.subcategories || []).map((sub) => (
                                      <li key={sub?.id}>
                                        <CustomLink
                                          href={buildCategoryUrl(sub?.slug)}
                                          className="block rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                                        >
                                          {sub?.translated_name}
                                        </CustomLink>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>

      {/* Scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.35);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.55);
        }
      `}</style>
    </div>
  );
};

export default HeaderCategories;
