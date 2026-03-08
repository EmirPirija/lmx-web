"use client";
import { useEffect, useState } from "react";
import FeaturedSections from "./FeaturedSections";
import { FeaturedSectionApi, allItemApi, sliderApi } from "@/utils/api";
import { getCurrentLangCode } from "@/redux/reducer/languageSlice";
import { useSelector } from "react-redux";
import { getCityData, getKilometerRange } from "@/redux/reducer/locationSlice";
import OfferSliderSkeleton from "@/components/PagesComponent/Home/OfferSliderSkeleton";
import FeaturedSectionsSkeleton from "./FeaturedSectionsSkeleton";
import PopularCategories from "./PopularCategories";
import dynamic from "next/dynamic";
import DeferredSection from "@/components/Common/DeferredSection";
import { isHomeFeaturedItem } from "@/utils/featuredPlacement";
import { buildHomeLocationKey, buildHomeLocationParams } from "./locationParams";
import {
  ensureFeaturedSectionsDemoFill,
  isHomeDemoFillEnabled,
} from "./homeDemoPool";

const OfferSlider = dynamic(() => import("./OfferSlider"), {
  ssr: false,
  loading: OfferSliderSkeleton,
});

const HomeReels = dynamic(() => import("./HomeReels"), {
  loading: () => null,
});

const AllItems = dynamic(() => import("./AllItems"), {
  loading: () => null,
});

const PlatformBenefitsStrip = dynamic(() => import("./PlatformBenefitsStrip"), {
  loading: () => null,
});

const extractItemsFromGetItemsResponse = (responseData) => {
  const payload = responseData?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const shouldHydrateFeaturedSectionItems = (sections = []) => {
  return sections.some((section) => {
    const isFeaturedAdsSection =
      String(section?.filter || "").toLowerCase() === "featured_ads";
    if (!isFeaturedAdsSection) return false;

    const sectionItems = Array.isArray(section?.section_data)
      ? section.section_data
      : [];
    if (!sectionItems.length) return false;

    return sectionItems.some((entry) => {
      const hasId = Number.isFinite(Number(entry?.id)) && Number(entry?.id) > 0;
      const hasTitle = Boolean(entry?.translated_item?.name || entry?.name);
      const hasSlug = Boolean(entry?.slug);
      const hasImage = Boolean(entry?.image);
      return !(hasId && hasTitle && hasSlug && hasImage);
    });
  });
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
  const locationKey = buildHomeLocationKey(cityData);

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
    let cancelled = false;

    const fetchFeaturedSectionData = async () => {
      setIsFeaturedLoading(true);
      try {
        const params = buildHomeLocationParams({ cityData, KmRange });
        const featuredResponse = await FeaturedSectionApi.getFeaturedSections({
          ...params,
          current_page: "home",
          placement: "home",
          positions: "home",
        });

        if (cancelled) return;

        const featuredSections = featuredResponse?.data?.data || [];
        let mergedFeaturedSections = featuredSections;

        if (shouldHydrateFeaturedSectionItems(featuredSections)) {
          const featuredItemsResponse = await allItemApi.getItems({
            ...params,
            current_page: "home",
            is_feature: 1,
            placement: "home",
            positions: "home",
            page: 1,
            limit: 120,
            compact: 1,
          });

          if (cancelled) return;

          const featuredItems = extractItemsFromGetItemsResponse(
            featuredItemsResponse?.data,
          ).filter((item) => isHomeFeaturedItem(item, { strict: true }));

          const featuredItemsById = new Map(
            featuredItems
              .map((item) => [Number(item?.id), item])
              .filter(([id]) => Number.isFinite(id) && id > 0),
          );

          mergedFeaturedSections = featuredSections.map((section) => {
            const sectionItems = Array.isArray(section?.section_data)
              ? section.section_data
              : [];
            const isFeaturedAdsSection =
              String(section?.filter || "").toLowerCase() === "featured_ads";

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
        }

        const finalSections = isHomeDemoFillEnabled
          ? ensureFeaturedSectionsDemoFill(mergedFeaturedSections)
          : mergedFeaturedSections;

        if (!cancelled) {
          setFeaturedData(finalSections);
        }
      } catch (error) {
        console.error("Error:", error);
        if (!cancelled && isHomeDemoFillEnabled) {
          setFeaturedData(ensureFeaturedSectionsDemoFill([]));
        }
      } finally {
        if (!cancelled) {
          setIsFeaturedLoading(false);
        }
      }
    };
    fetchFeaturedSectionData();

    return () => {
      cancelled = true;
    };
  }, [locationKey, KmRange, currentLanguageCode]);

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

      <PopularCategories />
      <DeferredSection
        className="mt-8"
        rootMargin="560px 0px"
        minHeight={120}
        idleTimeoutMs={1400}
      >
        <HomeReels />
      </DeferredSection>

      {IsFeaturedLoading ? (
        <FeaturedSectionsSkeleton />
      ) : (
        <FeaturedSections
          featuredData={featuredData}
          setFeaturedData={setFeaturedData}
          allEmpty={allEmpty}
        />
      )}

      <DeferredSection
        rootMargin="900px 0px"
        minHeight={380}
        idleTimeoutMs={1800}
      >
        <AllItems cityData={cityData} KmRange={KmRange} />
      </DeferredSection>

      <DeferredSection
        rootMargin="1100px 0px"
        minHeight={100}
        idleTimeoutMs={2600}
      >
        <PlatformBenefitsStrip />
      </DeferredSection>
    </>
  );
};

export default Home;
