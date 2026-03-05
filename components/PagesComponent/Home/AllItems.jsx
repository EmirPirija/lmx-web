import ProductCard from "@/components/Common/ProductCard";
import NoData from "@/components/EmptyStates/NoData";
import AllItemsSkeleton from "@/components/PagesComponent/Home/AllItemsSkeleton";
import { Button } from "@/components/ui/button";
import { resetBreadcrumb } from "@/redux/reducer/breadCrumbSlice";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { allItemApi } from "@/utils/api";
import { isHomeFeaturedItem } from "@/utils/featuredPlacement";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ensureHomeAllItemsDemoFill,
  isHomeDemoFillEnabled,
} from "./homeDemoPool";
const HOME_DEFAULT_COUNTRY = "Bosna i Hercegovina";

const AllItems = () => {
  const dispatch = useDispatch();
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [AllItem, setAllItem] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadMore, setIsLoadMore] = useState(false);

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
        country: HOME_DEFAULT_COUNTRY,
        limit: 20,
        no_cache: 1,
      };

      const response = await allItemApi.getItems(params);
      if (response.data?.error === true) {
        throw new Error(response.data?.message);
      }

      if (response?.data?.data?.data?.length > 0) {
        const data = response?.data?.data?.data;
        const featuredOnly = Array.isArray(data)
          ? data.filter((entry) => isHomeFeaturedItem(entry, { strict: true }))
          : [];

        const pageItems =
          page === 1 && isHomeDemoFillEnabled
            ? ensureHomeAllItemsDemoFill(featuredOnly)
            : featuredOnly;
        const hasSeededFallbackOnPage = pageItems.some(
          (entry) => Boolean(entry?.is_seeded_home_item || entry?.is_demo_item)
        );

        if (page === 1) {
          setAllItem(pageItems);
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
        if (page === 1 && hasSeededFallbackOnPage) {
          setHasMore(false);
        } else {
          setHasMore(currentPage < lastPage);
        }
        setCurrentPage(currentPage);
      } else {
        if (page === 1) {
          setAllItem(isHomeDemoFillEnabled ? ensureHomeAllItemsDemoFill([]) : []);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error:", error);
      if (page === 1 && isHomeDemoFillEnabled) {
        setAllItem(ensureHomeAllItemsDemoFill([]));
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
      setIsLoadMore(false);
    }
  };

  useEffect(() => {
    getAllItemData(1);
  }, [CurrentLanguage?.id]);

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
