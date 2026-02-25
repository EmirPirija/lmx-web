"use client";
import { useEffect, useState } from "react";
import { RiArrowLeftLine, RiArrowRightLine } from "@/components/Common/UnifiedIconPack";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import PopularCategoriesSkeleton from "./PopularCategoriesSkeleton.jsx";
import PopularCategoryCard from "@/components/PagesComponent/Home/PopularCategoryCard";
import { useSelector } from "react-redux";
import { getIsRtl } from "@/redux/reducer/languageSlice.js";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
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
  const isNextDisabled =
    isCatLoadMore ||
    ((!api || !api.canScrollNext()) && catCurrentPage >= catLastPage);

  const handleCategorySelect = (category) => {
    if (!category?.slug) return;
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
        <Carousel
          key={isRTL ? "rtl" : "ltr"}
          className="w-full mt-6"
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
        <PopularCategoryFilterModal
          open={isFilterModalOpen}
          onOpenChange={setIsFilterModalOpen}
          category={selectedCategory}
        />
      </section>
    )
  );
};

export default PopularCategories;
