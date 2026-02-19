"use client";
import { useEffect, useState } from "react";
import AllItems from "./AllItems";
import FeaturedSections from "./FeaturedSections";
import { FeaturedSectionApi, allItemApi, sliderApi } from "@/utils/api";
import { getCurrentLangCode } from "@/redux/reducer/languageSlice";
import { useSelector } from "react-redux";
import { getCityData, getKilometerRange } from "@/redux/reducer/locationSlice";
import OfferSliderSkeleton from "@/components/PagesComponent/Home/OfferSliderSkeleton";
import FeaturedSectionsSkeleton from "./FeaturedSectionsSkeleton";
import PopularCategories from "./PopularCategories";
import dynamic from "next/dynamic";

import HomeReels from "./HomeReels";
import PlatformBenefitsStrip from "./PlatformBenefitsStrip";
import { isHomeFeaturedItem } from "@/utils/featuredPlacement";
import LowInventoryItems from "./LowInventoryItems";

const OfferSlider = dynamic(() => import("./OfferSlider"), {
  ssr: false,
  loading: OfferSliderSkeleton,
});

const extractItemsFromGetItemsResponse = (responseData) => {
  const payload = responseData?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const Home = () => {
  const KmRange = useSelector(getKilometerRange);
  const cityData = useSelector(getCityData);
  const currentLanguageCode = useSelector(getCurrentLangCode);
  const [IsFeaturedLoading, setIsFeaturedLoading] = useState(false);
  const [featuredData, setFeaturedData] = useState([]);
  const [Slider, setSlider] = useState([]);
  const [IsSliderLoading, setIsSliderLoading] = useState(true);
  const allEmpty = featuredData?.every((ele) => ele?.section_data.length === 0);

  useEffect(() => {
    const fetchSliderData = async () => {
      try {
        const response = await sliderApi.getSlider();
        const data = response.data;
        setSlider(data.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsSliderLoading(false);
      }
    };
    fetchSliderData();
  }, []);

  useEffect(() => {
    const fetchFeaturedSectionData = async () => {
      setIsFeaturedLoading(true);
      try {
        const params = {};
        if (Number(KmRange) > 0 && (cityData?.areaId || cityData?.city)) {
          params.radius = KmRange;
          params.latitude = cityData.lat;
          params.longitude = cityData.long;
        } else {
          if (cityData?.areaId) {
            params.area_id = cityData.areaId;
          } else if (cityData?.city) {
            params.city = cityData.city;
          } else if (cityData?.state) {
            params.state = cityData.state;
          } else if (cityData?.country) {
            params.country = cityData.country;
          }
        }
        const [featuredResponse, featuredItemsResponse] = await Promise.all([
          FeaturedSectionApi.getFeaturedSections({
            ...params,
            current_page: "home",
            placement: "home",
            positions: "home",
          }),
          allItemApi.getItems({
            ...params,
            current_page: "home",
            is_feature: 1,
            placement: "home",
            positions: "home",
            page: 1,
            limit: 120,
          }),
        ]);

        const featuredSections = featuredResponse?.data?.data || [];
        const featuredItems = extractItemsFromGetItemsResponse(featuredItemsResponse?.data).filter((item) =>
          isHomeFeaturedItem(item, { strict: true })
        );

        const featuredItemsById = new Map(
          featuredItems
            .map((item) => [Number(item?.id), item])
            .filter(([id]) => Number.isFinite(id) && id > 0)
        );

        const mergedFeaturedSections = featuredSections.map((section) => {
          const sectionItems = Array.isArray(section?.section_data) ? section.section_data : [];
          const isFeaturedAdsSection = String(section?.filter || "").toLowerCase() === "featured_ads";

          const hydratedItems = sectionItems
            .map((sectionItem) => {
              const enriched = featuredItemsById.get(Number(sectionItem?.id));
              return enriched ? { ...sectionItem, ...enriched } : sectionItem;
            })
            .filter((entry) => {
              if (!isFeaturedAdsSection) return true;
              return featuredItemsById.has(Number(entry?.id));
            });

          return {
            ...section,
            section_data: hydratedItems,
          };
        });

        setFeaturedData(mergedFeaturedSections);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsFeaturedLoading(false);
      }
    };
    fetchFeaturedSectionData();
  }, [cityData.lat, cityData.long, KmRange, currentLanguageCode]);
  return (
    <>
      {IsSliderLoading ? (
        <OfferSliderSkeleton />
      ) : (
        Slider &&
        Slider.length > 0 && (
          <OfferSlider Slider={Slider} IsLoading={IsSliderLoading} />
        )
      )}

      <PlatformBenefitsStrip />
      <PopularCategories />
      <HomeReels />
      {IsFeaturedLoading ? (
        <FeaturedSectionsSkeleton />
      ) : (
        <FeaturedSections
          featuredData={featuredData}
          setFeaturedData={setFeaturedData}
          allEmpty={allEmpty}
        />
      )}
      
      <AllItems cityData={cityData} KmRange={KmRange} />
    </>
  );
};

export default Home;
