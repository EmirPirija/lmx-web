"use client";
import { useEffect, useState } from "react";
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
      <section className="container mt-12">
        <div className="space-between">
          <h5 className="text-xl sm:text-2xl font-medium">
            {"Popularne kategorije"}
          </h5>
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <button
              onClick={() => api && api.scrollTo(current - 1)}
              className={`bg-primary p-1 sm:p-2 rounded-full ${
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
              className={`bg-primary p-1 sm:p-2 rounded-full ${
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
            onClick={() => setIsAllCategoriesModalOpen(true)}
            className="sticky left-0 z-20 flex w-[92px] shrink-0 flex-col gap-2.5"
            aria-label="Prikaži sve popularne kategorije"
          >
            <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-full border border-slate-200/90 bg-slate-50 shadow-sm sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]">
              <span className="absolute inset-0 flex items-center justify-center text-primary">
                <IoGrid size={22} />
              </span>
            </div>
            <p className="text-xs sm:text-sm line-clamp-2 font-medium text-center leading-tight">
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
                {cateData.map((item) => (
                  <CarouselItem
                    key={item?.id}
                    className="basis-1/4 sm:basis-1/5 md:basis-1/6 lg:basis-[14.28%] xl:basis-[12.5%] 2xl:basis-[10%] pl-2 md:pl-3"
                  >
                    <PopularCategoryCard item={item} onSelect={handleCategorySelect} />
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
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Sve popularne kategorije</DialogTitle>
              <DialogDescription>
                Odaberi kategoriju i nastavi pretragu kroz prilagođeni filter.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[62dvh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {cateData.map((item) => (
                  <div key={`all-cat-${item?.id}`} className="rounded-xl border border-slate-200/80 p-2 dark:border-slate-700/80">
                    <PopularCategoryCard
                      item={item}
                      onSelect={handleAllCategoriesSelect}
                    />
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    )
  );
};

export default PopularCategories;
