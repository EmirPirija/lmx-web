"use client";
import CustomLink from "@/components/Common/CustomLink";
import ProductCard from "@/components/Common/ProductCard";
import { ChevronLeft, ChevronRight } from "@/components/Common/UnifiedIconPack";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

const FeaturedSections = ({ featuredData, setFeaturedData, allEmpty }) => {
  const sectionScrollRefs = useRef({});
  const [scrollState, setScrollState] = useState({});

  const handleLike = (id) => {
    const updatedData = featuredData.map((section) => {
      const updatedSectionData = section.section_data.map((item) => {
        if (item.id === id) {
          return { ...item, is_liked: !item.is_liked };
        }
        return item;
      });
      return { ...section, section_data: updatedSectionData };
    });
    setFeaturedData(updatedData);
  };

  const updateSectionScrollState = useCallback((sectionKey) => {
    const target = sectionScrollRefs.current[sectionKey];
    if (!target) return;

    const maxScrollLeft = Math.max(target.scrollWidth - target.clientWidth, 0);
    const nextState = {
      canLeft: target.scrollLeft > 8,
      canRight: maxScrollLeft - target.scrollLeft > 8,
    };

    setScrollState((prev) => {
      const current = prev[sectionKey];
      if (
        current &&
        current.canLeft === nextState.canLeft &&
        current.canRight === nextState.canRight
      ) {
        return prev;
      }
      return { ...prev, [sectionKey]: nextState };
    });
  }, []);

  const registerSectionScroller = useCallback(
    (sectionKey, node) => {
      if (!node) return;
      sectionScrollRefs.current[sectionKey] = node;
      requestAnimationFrame(() => updateSectionScrollState(sectionKey));
    },
    [updateSectionScrollState],
  );

  const scrollSection = useCallback(
    (sectionKey, direction) => {
      const target = sectionScrollRefs.current[sectionKey];
      if (!target) return;

      const offset = Math.max(target.clientWidth * 0.9, 280);
      target.scrollBy({
        left: direction * offset,
        behavior: "smooth",
      });

      requestAnimationFrame(() => updateSectionScrollState(sectionKey));
      setTimeout(() => updateSectionScrollState(sectionKey), 360);
    },
    [updateSectionScrollState],
  );

  useEffect(() => {
    if (!Array.isArray(featuredData)) return;
    featuredData.forEach((section, index) => {
      const sectionKey = String(section?.id ?? section?.slug ?? `section-${index}`);
      requestAnimationFrame(() => updateSectionScrollState(sectionKey));
    });
  }, [featuredData, updateSectionScrollState]);

  useEffect(() => {
    if (!Array.isArray(featuredData) || featuredData.length === 0) return;

    const autoScrollTimer = setInterval(() => {
      Object.entries(sectionScrollRefs.current).forEach(([sectionKey, target]) => {
        if (!target) return;

        const maxScrollLeft = Math.max(target.scrollWidth - target.clientWidth, 0);
        if (maxScrollLeft <= 8) return;

        const offset = Math.max(target.clientWidth * 0.9, 280);
        const isAtEnd = maxScrollLeft - target.scrollLeft <= 8;

        if (isAtEnd) {
          target.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          target.scrollBy({ left: offset, behavior: "smooth" });
        }

        requestAnimationFrame(() => updateSectionScrollState(sectionKey));
        setTimeout(() => updateSectionScrollState(sectionKey), 360);
      });
    }, 10000);

    return () => clearInterval(autoScrollTimer);
  }, [featuredData, updateSectionScrollState]);

  return (
    featuredData &&
    featuredData.length > 0 &&
    !allEmpty && (
      <section className="container">
        {featuredData.map(
          (ele, index) => {
            const filterKey = String(ele?.filter || "").toLowerCase();
            const isAllAdsSection = filterKey === "all_ads";
            const sectionItems = Array.isArray(ele?.section_data)
              ? ele.section_data
              : [];
            const visibleItems = isAllAdsSection
              ? sectionItems
              : sectionItems.slice(0, 4);
            const sectionKey = String(ele?.id ?? ele?.slug ?? `section-${index}`);
            const sectionScroll = scrollState[sectionKey] || {
              canLeft: false,
              canRight: sectionItems.length > visibleItems.length,
            };

            return (
              visibleItems.length > 0 && (
              <Fragment key={sectionKey}>
                <div className="space-between gap-2 mt-12">
                  <h5 className="text-xl sm:text-2xl font-medium">
                    {ele?.translated_name || ele?.title}
                  </h5>

                  <div className="flex items-center gap-2">
                    {!isAllAdsSection && sectionItems.length > 4 && (
                      <CustomLink
                        href={`/ads?featured_section=${ele?.slug}`}
                        className="text-sm sm:text-base font-medium whitespace-nowrap"
                        prefetch={false}
                      >
                        {"Pogledaj sve"}
                      </CustomLink>
                    )}

                    <button
                      type="button"
                      onClick={() => scrollSection(sectionKey, -1)}
                      disabled={!sectionScroll.canLeft}
                      aria-label="Pomjeri ulijevo"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollSection(sectionKey, 1)}
                      disabled={!sectionScroll.canRight}
                      aria-label="Pomjeri udesno"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div
                  ref={(node) => registerSectionScroller(sectionKey, node)}
                  onScroll={() => updateSectionScrollState(sectionKey)}
                  className="featured-scroll-track mt-6 overflow-x-auto overflow-y-hidden pb-0"
                >
                  <div className="flex flex-nowrap gap-1 sm:gap-1">
                    {visibleItems.map((data) => (
                      <div
                        key={data?.id}
                        className="w-1/2 flex-shrink-0 sm:w-1/3 lg:w-1/4 xl:w-1/6"
                      >
                        <ProductCard
                          item={data}
                          handleLike={handleLike}
                          trackingParams={{ ref: "featured", source_detail: ele?.slug || ele?.id }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Fragment>
              )
            );
          }
        )}
        <style jsx>{`
          .featured-scroll-track {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .featured-scroll-track::-webkit-scrollbar {
            display: none !important;
            width: 0;
            height: 0;
          }
        `}</style>
      </section>
    )
  );
};

export default FeaturedSections;
