"use client";
import { useEffect, useMemo, useState } from "react";
import { RiArrowLeftLine, RiArrowRightLine } from "@/components/Common/UnifiedIconPack";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PopularCategoriesSkeleton from "./PopularCategoriesSkeleton.jsx";
import PopularCategoryCard from "@/components/PagesComponent/Home/PopularCategoryCard";
import { useSelector } from "react-redux";
import { getIsRtl } from "@/redux/reducer/languageSlice.js";
import { IoGrid, Loader2 } from "@/components/Common/UnifiedIconPack";
import useGetCategories from "@/components/Layout/useGetCategories.jsx";
import PopularCategoryFilterModal from "@/components/PagesComponent/Home/PopularCategoryFilterModal";
import { categoryApi } from "@/utils/api";

const PopularCategories = () => {
  const {
    cateData,
    getCategories,
    isCatLoading,
    isCatLoadMore,
    catLastPage,
    catCurrentPage,
  } = useGetCategories();

  const isRTL = useSelector(getIsRtl);
  const [api, setApi] = useState();
  const [current, setCurrent] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAllCategoriesModalOpen, setIsAllCategoriesModalOpen] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [isAllCategoriesLoading, setIsAllCategoriesLoading] = useState(false);
  const [allCategoriesLoaded, setAllCategoriesLoaded] = useState(false);
  const [allCategoriesError, setAllCategoriesError] = useState("");
  const isNextDisabled =
    isCatLoadMore ||
    ((!api || !api.canScrollNext()) && catCurrentPage >= catLastPage);

  const handleCategorySelect = (category) => {
    if (!category?.slug) return;
    setSelectedCategory(category);
    setIsFilterModalOpen(true);
  };

  const handleAllCategoriesSelect = (category) => {
    if (!category?.slug) return;
    setIsAllCategoriesModalOpen(false);
    setSelectedCategory(category);
    setIsFilterModalOpen(true);
  };

  const loadAllRootCategories = async () => {
    if (allCategoriesLoaded || isAllCategoriesLoading) return;
    setIsAllCategoriesLoading(true);
    setAllCategoriesError("");
    try {
      const perPage = 100;
      const firstPageResponse = await categoryApi.getCategory({
        page: 1,
        per_page: perPage,
        tree_depth: 0,
        include_counts: false,
      });
      const firstPayload = firstPageResponse?.data?.data;
      const firstPageItems = Array.isArray(firstPayload?.data)
        ? firstPayload.data
        : [];
      const lastPage = Number(firstPayload?.last_page || 1);
      const expectedTotal = Number(firstPayload?.total || 0);
      const uniqueById = new Map();
      firstPageItems.forEach((entry) => {
        const key = Number(entry?.id);
        if (!Number.isFinite(key) || uniqueById.has(key)) return;
        uniqueById.set(key, entry);
      });

      // Prikaži odmah prvu stranicu (instant UX), pa u pozadini dopuni ostalo.
      const firstChunk = Array.from(uniqueById.values());
      if (firstChunk.length > 0) {
        setAllCategories(firstChunk);
      }

      if (lastPage > 1) {
        const requestedPages = Array.from(
          { length: lastPage - 1 },
          (_, index) => index + 2,
        );
        const pageRequests = requestedPages.map((pageNumber) =>
          categoryApi.getCategory({
            page: pageNumber,
            per_page: perPage,
            tree_depth: 0,
            include_counts: false,
          }),
        );
        const pageResults = await Promise.allSettled(pageRequests);
        const failedPages = [];

        pageResults.forEach((result, resultIndex) => {
          if (result.status !== "fulfilled") {
            const failedPage = requestedPages[resultIndex];
            if (Number.isFinite(failedPage)) failedPages.push(failedPage);
            return;
          }
          const payload = result.value?.data?.data;
          const items = Array.isArray(payload?.data) ? payload.data : [];
          items.forEach((entry) => {
            const key = Number(entry?.id);
            if (!Number.isFinite(key) || uniqueById.has(key)) return;
            uniqueById.set(key, entry);
          });
        });

        // Retry failed pages once, paralelno (brže od sekvencijalnog retry-a)
        if (failedPages.length > 0) {
          const retryResults = await Promise.allSettled(
            failedPages.map((failedPage) =>
              categoryApi.getCategory({
                page: failedPage,
                per_page: perPage,
                tree_depth: 0,
                include_counts: false,
              }),
            ),
          );

          retryResults.forEach((result) => {
            if (result.status !== "fulfilled") return;
            const retryPayload = result.value?.data?.data;
            const retryItems = Array.isArray(retryPayload?.data)
              ? retryPayload.data
              : [];
            retryItems.forEach((entry) => {
              const key = Number(entry?.id);
              if (!Number.isFinite(key) || uniqueById.has(key)) return;
              uniqueById.set(key, entry);
            });
          });
        }
      }

      const normalized = Array.from(uniqueById.values());

      const hasCompleteDataset = expectedTotal
        ? normalized.length >= expectedTotal
        : normalized.length > 0;

      setAllCategories(normalized);
      setAllCategoriesLoaded(hasCompleteDataset);
      if (!hasCompleteDataset) {
        setAllCategoriesError(
          "Nisu učitane sve kategorije. Pokušaj ponovo za kompletan spisak.",
        );
      }
    } catch (error) {
      console.error("Popular categories modal load failed:", error);
      setAllCategoriesLoaded(false);
      setAllCategoriesError("Učitavanje svih kategorija nije uspjelo.");
    } finally {
      setIsAllCategoriesLoading(false);
    }
  };

  const handleOpenAllCategories = () => {
    setIsAllCategoriesModalOpen(true);
    if (!allCategories.length && Array.isArray(cateData) && cateData.length > 0) {
      const seedById = new Map();
      cateData.forEach((entry) => {
        const key = Number(entry?.id);
        if (!Number.isFinite(key) || seedById.has(key)) return;
        seedById.set(key, entry);
      });
      setAllCategories(Array.from(seedById.values()));
    }
    if (!allCategoriesLoaded) {
      loadAllRootCategories();
    }
  };

  useEffect(() => {
    if (!api) {
      return;
    }
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api, cateData.length]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileViewport(media.matches);
    sync();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    if (!api || !isMobileViewport || isFilterModalOpen) return undefined;
    const intervalId = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, [api, isMobileViewport, isFilterModalOpen]);

  useEffect(() => {
    if (cateData?.length > 0 || isCatLoading) return;
    getCategories(1, { per_page: 18, tree_depth: 0, include_counts: true });
  }, [cateData?.length, getCategories, isCatLoading]);

  const orderedAllCategories = useMemo(() => {
    if (!allCategories.length) return [];

    const categoryOrderMap = new Map();
    (cateData || []).forEach((cat, index) => {
      const id = Number(cat?.id);
      if (!Number.isFinite(id) || categoryOrderMap.has(id)) return;
      categoryOrderMap.set(id, index);
    });
    const allCategoriesOrderMap = new Map();
    allCategories.forEach((cat, index) => {
      const id = Number(cat?.id);
      if (!Number.isFinite(id) || allCategoriesOrderMap.has(id)) return;
      allCategoriesOrderMap.set(id, index);
    });

    return [...allCategories].sort((a, b) => {
      const aId = Number(a?.id);
      const bId = Number(b?.id);
      const aOrder = categoryOrderMap.has(aId)
        ? categoryOrderMap.get(aId)
        : Number.POSITIVE_INFINITY;
      const bOrder = categoryOrderMap.has(bId)
        ? categoryOrderMap.get(bId)
        : Number.POSITIVE_INFINITY;

      if (aOrder !== bOrder) return aOrder - bOrder;

      const aOriginalOrder = allCategoriesOrderMap.get(aId) ?? Number.MAX_SAFE_INTEGER;
      const bOriginalOrder = allCategoriesOrderMap.get(bId) ?? Number.MAX_SAFE_INTEGER;
      return aOriginalOrder - bOriginalOrder;
    });
  }, [allCategories, cateData]);

  const handleNext = async () => {
    if (api && api.canScrollNext()) {
      api.scrollTo(current + 1);
    } else if (catCurrentPage < catLastPage) {
      await getCategories(catCurrentPage + 1);
      setTimeout(() => {
        api.scrollTo(current + 1);
      }, 200);
    }
  };

  return isCatLoading && !cateData.length ? (
    <PopularCategoriesSkeleton />
  ) : (
    cateData && cateData.length > 0 && (
      <section className="container mt-6">
        <div className="space-between">
          <h5 className="text-xl sm:text-2xl font-medium">
            Sve kategorije
          </h5>
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <button
              onClick={() => api && api.scrollTo(current - 1)}
              className={`bg-primary p-1 sm:p-2 rounded-full outline-none transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.04] active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                !api?.canScrollPrev() ? "opacity-65 cursor-default" : ""
              }`}
              disabled={!api?.canScrollPrev()}
            >
              <RiArrowLeftLine
                size={24}
                color="white"
                className={isRTL ? "rotate-180" : ""}
              />
            </button>
            <button
              onClick={handleNext}
              className={`bg-primary p-1 sm:p-2 rounded-full outline-none transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.04] active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                isNextDisabled ? "opacity-65 cursor-default" : ""
              }`}
              disabled={isNextDisabled}
            >
              {isCatLoadMore ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <RiArrowRightLine
                  size={24}
                  color="white"
                  className={isRTL ? "rotate-180" : ""}
                />
              )}
            </button>
          </div>
        </div>
        <div className="mt-6 flex items-start gap-3">
          <button
            type="button"
            onClick={handleOpenAllCategories}
            className="group sticky left-0 z-20 flex w-[92px] shrink-0 flex-col gap-2.5 rounded-xl outline-none [will-change:transform] transform-gpu transition-transform duration-200 ease-out motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-reduce:transform-none active:scale-[0.98] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900"
            aria-label="Prikaži sve popularne kategorije"
          >
            <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-full border border-slate-200/90 bg-slate-50 shadow-sm transition-all duration-200 ease-out group-hover:border-primary/40 group-hover:bg-primary/[0.07] group-hover:shadow-[0_10px_22px_-16px_rgba(2,6,23,0.55)] dark:border-slate-700/90 dark:bg-slate-900/80 dark:group-hover:border-primary/50 dark:group-hover:bg-primary/15 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]">
              <span className="absolute inset-0 flex items-center justify-center text-primary transition-transform duration-200 ease-out group-hover:scale-110">
                <IoGrid size={22} />
              </span>
            </div>
            <p className="text-xs sm:text-sm line-clamp-2 font-medium text-center leading-tight transition-colors duration-200 group-hover:text-primary">
              Sve kategorije
            </p>
          </button>

          <div className="min-w-0 flex-1">
            <Carousel
              key={isRTL ? "rtl" : "ltr"}
              className="w-full"
              setApi={setApi}
              opts={{
                align: "start",
                containScroll: "trim",
                direction: isRTL ? "rtl" : "ltr",
              }}
            >
              <CarouselContent className="-ml-2 md:-ml-3">
                {cateData.map((item, index) => (
                  <CarouselItem
                    key={item?.id}
                    style={{ animationDelay: `${Math.min(index * 28, 280)}ms` }}
                    className="basis-1/3 sm:basis-1/5 md:basis-1/6 lg:basis-[14.28%] xl:basis-[12.5%] 2xl:basis-[10%] pl-2 md:pl-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
                  >
                    <PopularCategoryCard
                      item={item}
                      onSelect={handleCategorySelect}
                      index={index}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
        <PopularCategoryFilterModal
          open={isFilterModalOpen}
          onOpenChange={setIsFilterModalOpen}
          category={selectedCategory}
        />
        <Dialog open={isAllCategoriesModalOpen} onOpenChange={setIsAllCategoriesModalOpen}>
          <DialogContent className="sm:max-w-4xl [&>button]:right-3 [&>button]:top-3 [&>button]:h-9 [&>button]:w-9 [&>button]:rounded-full [&>button]:border [&>button]:border-slate-200/90 [&>button]:bg-white [&>button]:text-slate-500 [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:transition-colors [&>button]:duration-150 hover:[&>button]:bg-slate-100 hover:[&>button]:text-slate-700 dark:[&>button]:border-slate-700 dark:[&>button]:bg-slate-900 dark:[&>button]:text-slate-300 dark:hover:[&>button]:bg-slate-800 dark:hover:[&>button]:text-slate-100">
            <DialogHeader>
              <DialogTitle>Sve popularne kategorije</DialogTitle>
              <DialogDescription>
                Odaberi kategoriju i nastavi pretragu kroz prilagođeni filter.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[62dvh] overflow-y-auto pr-1">
              {isAllCategoriesLoading && (
                <div className="mb-3 flex items-center justify-start">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Loader2 size={14} className="animate-spin" />
                    Učitavanje svih kategorija...
                  </div>
                </div>
              )}
              {!isAllCategoriesLoading && allCategoriesError ? (
                <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200">
                  {allCategoriesError}
                </div>
              ) : null}
              {orderedAllCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {orderedAllCategories.map((item, index) => (
                    <div
                      key={`all-cat-${item?.id}`}
                      style={{ animationDelay: `${Math.min(index * 20, 220)}ms` }}
                      className="rounded-xl border border-slate-200/80 p-2 transition-all duration-200 ease-out motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_14px_24px_-18px_rgba(2,6,23,0.6)] dark:border-slate-700/80 dark:hover:border-primary/50 dark:hover:bg-slate-800/60"
                    >
                      <PopularCategoryCard
                        item={item}
                        onSelect={handleAllCategoriesSelect}
                        index={index}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      </section>
    )
  );
};

export default PopularCategories;
