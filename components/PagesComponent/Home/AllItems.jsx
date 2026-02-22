import ProductCard from "@/components/Common/ProductCard";
import NoData from "@/components/EmptyStates/NoData";
import AllItemsSkeleton from "@/components/PagesComponent/Home/AllItemsSkeleton";
import { Button } from "@/components/ui/button";
import { resetBreadcrumb } from "@/redux/reducer/breadCrumbSlice";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { allItemApi } from "@/utils/api";
import { isHomeFeaturedItem } from "@/utils/featuredPlacement";
import { Info } from "@/components/Common/UnifiedIconPack";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { buildHomeLocationKey, buildHomeLocationParams } from "./locationParams";

const formatLocationAlertMessage = (message = "") => {
  const raw = String(message || "").trim();
  if (!raw) return "Nema oglasa za odabranu lokaciju. Prikazujemo sve dostupne oglase.";

  const locationFallbackMatch = raw.match(
    /no ads found in\s+(.+?)\.\s*showing all available ads\.?/i
  );
  if (locationFallbackMatch?.[1]) {
    const locationName = locationFallbackMatch[1].trim();
    return `Nema oglasa u ${locationName}. Prikazujemo sve dostupne oglase.`;
  }

  if (raw.toLowerCase().includes("no ads found")) {
    return "Nema oglasa za odabranu lokaciju. Prikazujemo sve dostupne oglase.";
  }

  return raw;
};

const AllItems = ({ cityData, KmRange }) => {
  const dispatch = useDispatch();
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [AllItem, setAllItem] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadMore, setIsLoadMore] = useState(false);

  // State to track if we should show location alert
  const [locationAlertMessage, setLocationAlertMessage] = useState("");
  const locationKey = buildHomeLocationKey(cityData);

  const getAllItemData = async (page) => {
    if (page === 1) {
      setIsLoading(true);
    }
    try {
      const params = {
        page,
        current_page: "home",
        is_feature: 1,
        placement: "home",
        positions: "home",
        limit: 20,
        no_cache: 1,
      };

      Object.assign(params, buildHomeLocationParams({ cityData, KmRange }));

      const response = await allItemApi.getItems(params);
      if (response.data?.error === true) {
        throw new Error(response.data?.message);
      }

      const apiMessage = response.data.message;
      // Check if message indicates no items in selected location
      const isNoItemsInLocation = apiMessage
        ?.toLowerCase()
        .includes("no ads found");

      // Show alert only if there are items but from different location
      if (isNoItemsInLocation && response?.data?.data?.data?.length > 0) {
        setLocationAlertMessage(formatLocationAlertMessage(apiMessage));
      } else {
        setLocationAlertMessage("");
      }

      if (response?.data?.data?.data?.length > 0) {
        const data = response?.data?.data?.data;
        const featuredOnly = Array.isArray(data)
          ? data.filter((entry) => isHomeFeaturedItem(entry, { strict: true }))
          : [];

        if (page === 1) {
          setAllItem(featuredOnly);
        } else {
          setAllItem((prevData) => {
            const mergedById = new Map();
            (prevData || []).forEach((entry) => {
              const id = Number(entry?.id);
              if (Number.isFinite(id) && id > 0) {
                mergedById.set(id, entry);
              }
            });
            (featuredOnly || []).forEach((entry) => {
              const id = Number(entry?.id);
              if (Number.isFinite(id) && id > 0) {
                mergedById.set(id, entry);
              }
            });
            return Array.from(mergedById.values());
          });
        }
        const currentPage = response?.data?.data?.current_page;
        const lastPage = response?.data?.data?.last_page;
        setHasMore(currentPage < lastPage);
        setCurrentPage(currentPage);
      } else {
        if (page === 1) {
          setAllItem([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      setIsLoadMore(false);
    }
  };

  useEffect(() => {
    getAllItemData(1);
  }, [locationKey, KmRange, CurrentLanguage?.id]);

  const handleLoadMore = () => {
    setIsLoadMore(true);
    getAllItemData(currentPage + 1);
  };

  useEffect(() => {
    // reset breadcrumb path when in home page
    dispatch(resetBreadcrumb());
  }, []);

  const handleLikeAllData = useCallback((id) => {
    setAllItem((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, is_liked: !item.is_liked } : item
      )
    );
  }, []);

  return (
    <section className="container mt-12">
      <h5 className="text-xl sm:text-2xl font-medium">Izdvojeni oglasi</h5>

      {/* Location Alert - shows when items are from different location */}
      {locationAlertMessage && AllItem.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-amber-50/80 to-white px-4 py-3 shadow-sm dark:border-amber-500/30 dark:bg-gradient-to-r dark:from-amber-500/15 dark:via-amber-500/10 dark:to-slate-900">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
              <Info className="size-3.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700/80 dark:text-amber-200/90">
                Lokacijski filter
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-100">{locationAlertMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1 sm:gap-1 mt-6">
        {isLoading ? (
          <AllItemsSkeleton />
        ) : AllItem && AllItem.length > 0 ? (
            AllItem?.map((item) => (
            <ProductCard
              key={item?.id}
              item={item}
              handleLike={handleLikeAllData}
              trackingParams={{ ref: "featured", source_detail: "home" }}
            />
          ))
        ) : (
          <div className="col-span-full">
            <NoData name={"Oglasi"} />
          </div>
        )}
      </div>

      {AllItem && AllItem.length > 0 && hasMore && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            className="text-sm sm:text-base text-primary w-[256px]"
            disabled={isLoading || isLoadMore}
            onClick={handleLoadMore}
          >
            {isLoadMore ? "Učitavanje..." : "Učitaj još"}
          </Button>
        </div>
      )}
    </section>
  );
};

export default AllItems;
