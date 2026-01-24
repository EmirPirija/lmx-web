import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuCard,
  NavigationMenuSection,
  NavigationMenuFeature,
  NavigationMenuSimpleLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import CustomLink from "@/components/Common/CustomLink";
import { useEffect, useRef, useState } from "react";
import { IoIosMore } from "react-icons/io";
import CustomImage from "@/components/Common/CustomImage";
import { useNavigate } from "@/components/Common/useNavigate";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  Layers, 
  TrendingUp, 
  Star, 
  ArrowRight,
  Sparkles,
  Grid3X3,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const HeaderCategories = ({ cateData }) => {
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate } = useNavigate();

  const [fitCategoriesCount, setFitCategoriesCount] = useState(3);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  useEffect(() => {
    const calculateFit = () => {
      if (!containerRef.current || !measureRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const otherWidth = 100;
      const availableWidth = containerWidth - otherWidth;

      const items = Array.from(measureRef.current.children);
      let totalWidth = 0;
      let visible = 0;

      for (const item of items) {
        const width = item.getBoundingClientRect().width + 48;

        if (totalWidth + width > availableWidth) break;
        totalWidth += width;
        visible++;
      }

      setFitCategoriesCount(visible);
    };

    const resizeObserver = new ResizeObserver(calculateFit);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [cateData]);

  const buildCategoryUrl = (categorySlug) => {
    if (pathname.startsWith("/ads")) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("lang");
      newSearchParams.set("category", categorySlug);
      return `/ads?${newSearchParams.toString()}`;
    } else {
      return `/ads?category=${categorySlug}`;
    }
  };

  const handleCategoryClick = (slug) => {
    if (pathname.startsWith("/ads")) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("category", slug);
      const newUrl = `/ads?${newSearchParams.toString()}`;
      window.history.pushState(null, "", newUrl);
    } else {
      navigate(`/ads?category=${slug}`);
    }
  };

  const handleOtherCategoryClick = () => {
    if (pathname.startsWith("/ads")) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("category");
      const newUrl = `/ads?${newSearchParams.toString()}`;
      window.history.pushState(null, "", newUrl);
    } else {
      navigate(`/ads`);
    }
  };

  // Izračunaj broj oglasa (simulirano - možeš zamijeniti pravim podacima)
  const getCategoryStats = (category) => {
    return {
      totalItems: category.items_count || Math.floor(Math.random() * 500) + 50,
      newToday: Math.floor(Math.random() * 20) + 1,
    };
  };

  return (
    <div className="hidden lg:block py-2 border-b bg-gradient-to-r from-background via-background to-background">
      <div className="container" ref={containerRef}>
        {/* Hidden measurement row */}
        <div
          ref={measureRef}
          className="absolute opacity-0 pointer-events-none flex"
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

        <NavigationMenu>
          <NavigationMenuList className="rtl:flex-row-reverse">
            {cateData?.slice(0, fitCategoriesCount)?.map((category, index) => {
              const stats = getCategoryStats(category);
              const isPopular = index < 2;
              
              return (
                <NavigationMenuItem key={category.id}>
                  {category.subcategories_count > 0 ? (
                    <>
                      <NavigationMenuTrigger
                        onClick={() => handleCategoryClick(category.slug)}
                        onMouseEnter={() => setHoveredCategory(category.id)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        badge={isPopular && index === 0 ? "🔥" : undefined}
                        badgeVariant="hot"
                      >
                        {category.translated_name}
                      </NavigationMenuTrigger>
                      
                      <NavigationMenuContent className="rtl:[direction:rtl]">
                        <div
                          style={{
                            width: containerRef?.current?.offsetWidth - 32,
                          }}
                          className="flex overflow-hidden rounded-xl"
                        >
                          {/* Lijeva strana - Featured sekcija */}
                          <div className="w-[280px] p-5 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent border-r border-border/30">
                            {/* Kategorija header */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden shadow-lg">
                                  <CustomImage
                                    src={category?.image}
                                    alt={category?.translated_name}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 object-contain"
                                  />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                                  <Sparkles className="w-3 h-3 text-white" />
                                </div>
                              </div>
                              <div>
                                <h3 className="font-bold text-foreground text-lg">
                                  {category?.translated_name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {stats.totalItems} oglasa
                                </p>
                              </div>
                            </div>

                            {/* Statistika */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                              <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-border/30">
                                <div className="flex items-center gap-2 mb-1">
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                  <span className="text-xs text-muted-foreground">Danas novo</span>
                                </div>
                                <p className="text-xl font-bold text-green-600">+{stats.newToday}</p>
                              </div>
                              <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-border/30">
                                <div className="flex items-center gap-2 mb-1">
                                  <Star className="w-4 h-4 text-amber-500" />
                                  <span className="text-xs text-muted-foreground">Popularno</span>
                                </div>
                                <p className="text-xl font-bold text-amber-600">Top 5</p>
                              </div>
                            </div>

                            {/* CTA */}
                            <CustomLink
                              href={buildCategoryUrl(category.slug)}
                              className={cn(
                                "group flex items-center justify-between w-full p-4 rounded-xl",
                                "bg-gradient-to-r from-primary to-secondary",
                                "text-white font-semibold",
                                "transition-all duration-300",
                                "hover:shadow-lg hover:shadow-primary/30",
                                "hover:scale-[1.02]"
                              )}
                            >
                              <span>Pregledaj sve</span>
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </CustomLink>
                          </div>

                          {/* Desna strana - Podkategorije */}
                          <div className="flex-1 p-5">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Grid3X3 className="w-4 h-4" />
                                Podkategorije
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {category.subcategories?.length || 0} kategorija
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-x-8 gap-y-1 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                              {category.subcategories.map((subcategory, subIndex) => (
                                <div key={subcategory.id} className="mb-4">
                                  <CustomLink
                                    href={buildCategoryUrl(subcategory.slug)}
                                    className={cn(
                                      "group flex items-center gap-2 py-2 px-3 -mx-3 rounded-lg",
                                      "font-semibold text-sm text-foreground",
                                      "hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent",
                                      "hover:text-primary",
                                      "transition-all duration-200"
                                    )}
                                  >
                                    <span className={cn(
                                      "w-2 h-2 rounded-full",
                                      "bg-gradient-to-r from-primary to-secondary",
                                      "opacity-0 group-hover:opacity-100",
                                      "transition-opacity duration-200"
                                    )} />
                                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                                      {subcategory.translated_name}
                                    </span>
                                    {subIndex < 2 && (
                                      <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        Novo
                                      </span>
                                    )}
                                  </CustomLink>

                                  {subcategory.subcategories_count > 0 && (
                                    <ul className="mt-1 ml-4 space-y-0.5">
                                      {subcategory?.subcategories
                                        ?.slice(0, 4)
                                        .map((nestedSubcategory) => (
                                          <li key={nestedSubcategory?.id}>
                                            <CustomLink
                                              href={buildCategoryUrl(nestedSubcategory?.slug)}
                                              className={cn(
                                                "group/nested flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md",
                                                "text-xs text-muted-foreground",
                                                "hover:text-primary hover:bg-primary/5",
                                                "transition-all duration-200"
                                              )}
                                            >
                                              <ChevronRight className="w-3 h-3 opacity-0 group-hover/nested:opacity-100 transition-opacity" />
                                              <span>{nestedSubcategory?.translated_name}</span>
                                            </CustomLink>
                                          </li>
                                        ))}
                                      {subcategory.subcategories.length > 4 && (
                                        <li>
                                          <CustomLink
                                            href={buildCategoryUrl(subcategory.slug)}
                                            className="flex items-center gap-1 py-1.5 px-2 text-xs text-primary font-medium hover:underline"
                                          >
                                            <span>+ još {subcategory.subcategories.length - 4}</span>
                                          </CustomLink>
                                        </li>
                                      )}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
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

            {/* "Ostalo" dropdown */}
            {cateData && cateData.length > fitCategoriesCount && (
              <NavigationMenuItem>
                <NavigationMenuTrigger 
                  onClick={handleOtherCategoryClick}
                  badge={cateData.length - fitCategoriesCount}
                  badgeVariant="default"
                >
                  <Layers className="w-4 h-4 mr-1" />
                  Ostalo
                </NavigationMenuTrigger>
                
                <NavigationMenuContent className="rtl:[direction:rtl]">
                  <div
                    style={{ width: containerRef?.current?.offsetWidth - 32 }}
                    className="flex overflow-hidden rounded-xl"
                  >
                    {/* Lijeva strana */}
                    <div className="w-[280px] p-5 bg-gradient-to-br from-secondary/5 via-primary/5 to-transparent border-r border-border/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center shadow-lg">
                          <Grid3X3 className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg">
                            Sve kategorije
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {cateData.length - fitCategoriesCount} dodatnih kategorija
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                        Pregledaj sve dostupne kategorije i pronađi upravo ono što tražiš.
                      </p>

                      <CustomLink
                        href="/ads"
                        className={cn(
                          "group flex items-center justify-between w-full p-4 rounded-xl",
                          "bg-gradient-to-r from-secondary to-primary",
                          "text-white font-semibold",
                          "transition-all duration-300",
                          "hover:shadow-lg hover:shadow-secondary/30",
                          "hover:scale-[1.02]"
                        )}
                      >
                        <span>Pregledaj sve oglase</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </CustomLink>
                    </div>

                    {/* Desna strana */}
                    <div className="flex-1 p-5">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Ostale kategorije
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-x-6 gap-y-1 max-h-[35vh] overflow-y-auto pr-2">
                        {cateData.slice(fitCategoriesCount).map((category, index) => (
                          <div key={category.id} className="mb-3">
                            <CustomLink
                              href={buildCategoryUrl(category.slug)}
                              className={cn(
                                "group flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-xl",
                                "hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent",
                                "transition-all duration-200"
                              )}
                            >
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                                <CustomImage
                                  src={category?.image}
                                  alt={category?.translated_name}
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors block truncate">
                                  {category.translated_name}
                                </span>
                                {category.subcategories_count > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {category.subcategories_count} podkategorija
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </CustomLink>

                            {category.subcategories_count > 0 && (
                              <ul className="mt-1 ml-[52px] space-y-0.5">
                                {category?.subcategories?.slice(0, 3).map((sub) => (
                                  <li key={sub?.id}>
                                    <CustomLink
                                      href={buildCategoryUrl(sub?.slug)}
                                      className="text-xs text-muted-foreground hover:text-primary transition-colors py-1 block"
                                    >
                                      {sub?.translated_name}
                                    </CustomLink>
                                  </li>
                                ))}
                                {category.subcategories?.length > 3 && (
                                  <li>
                                    <CustomLink
                                      href={buildCategoryUrl(category.slug)}
                                      className="text-xs text-primary font-medium hover:underline py-1 block"
                                    >
                                      Pogledaj sve →
                                    </CustomLink>
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, var(--primary), var(--secondary));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--primary);
        }
      `}</style>
    </div>
  );
};

export default HeaderCategories;
