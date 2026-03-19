import React, { useCallback, useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { allItemApi } from "@/utils/api";
import ProductCard from "@/components/Common/ProductCard";
import ProductCardSkeleton from "@/components/Common/ProductCardSkeleton";
import { useSelector } from "react-redux";
import { getIsRtl } from "@/redux/reducer/languageSlice";
import { getCityData, getKilometerRange } from "@/redux/reducer/locationSlice";

const carouselItemClassName = "basis-[78%] sm:basis-1/2 md:basis-1/3 xl:basis-1/4 flex";

const SimilarProducts = ({ productDetails }) => {
  const [similarData, setSimilarData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const isRTL = useSelector(getIsRtl);
  const location = useSelector(getCityData);
  const KmRange = useSelector(getKilometerRange);

  const fetchSimilarData = async (cateID) => {
    try {
      setIsLoading(true);
      const response = await allItemApi.getItems({
        category_id: cateID,
        limit: 10,
        compact: 1,
        ...(location?.lat &&
          location?.long && {
            latitude: location?.lat,
            longitude: location?.long,
            radius: KmRange,
          }),
      });
      const responseData = response?.data;
      if (responseData) {
        const payload = responseData?.data;
        const list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        const filteredData = list.filter((item) => item.id !== productDetails?.id);
        setSimilarData(filteredData);
      } else {
        console.error("Invalid response:", response);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (productDetails?.category_id) {
      fetchSimilarData(productDetails?.category_id);
    }
  }, [productDetails?.category_id]);

  const handleLikeAllData = useCallback((id) => {
    setSimilarData((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, is_liked: !item.is_liked } : item
      )
    );
  }, []);

  if (!isLoading && similarData && similarData.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 mt-8">
      <h2 className="text-2xl font-medium">{"Povezani oglasi"}</h2>
      <Carousel
        key={isRTL ? "rtl" : "ltr"}
        opts={{
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        <CarouselContent className="lmx-horizontal-card-track">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <CarouselItem
                  key={`similar-skeleton-${index}`}
                  className={`${carouselItemClassName} lmx-horizontal-card-item`}
                >
                  <div className="h-full w-full">
                    <ProductCardSkeleton />
                  </div>
                </CarouselItem>
              ))
            : similarData?.map((item) => (
                <CarouselItem
                  key={item.id}
                  className={`${carouselItemClassName} lmx-horizontal-card-item`}
                >
                  <div className="h-full w-full">
                    <ProductCard
                      item={item}
                      handleLike={handleLikeAllData}
                      trackingParams={{ ref: "similar" }}
                    />
                  </div>
                </CarouselItem>
              ))}
        </CarouselContent>
        {!isLoading && similarData?.length > 3 && (
          <>
            <CarouselPrevious className="hidden md:flex absolute top-1/2 ltr:left-2 rtl:right-2 rtl:scale-x-[-1] -translate-y-1/2 bg-primary text-white rounded-full" />
            <CarouselNext className="hidden md:flex absolute top-1/2 ltr:right-2 rtl:left-2 rtl:scale-x-[-1] -translate-y-1/2 bg-primary text-white rounded-full" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default SimilarProducts;
