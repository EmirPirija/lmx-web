"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

import ProductCard from "@/components/Common/ProductCard";
import NoData from "@/components/EmptyStates/NoData";
import ProductCardSkeleton from "@/components/Common/ProductCardSkeleton";
import { Button } from "@/components/ui/button";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { t } from "@/utils";
import { getFavouriteApi } from "@/utils/api";

import { Loader2, Heart, ChevronDown } from "@/components/Common/UnifiedIconPack";

// ============================================
// MAIN COMPONENT
// ============================================

const Favorites = () => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [favoritesData, setFavoriteData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [IsLoadMore, setIsLoadMore] = useState(false);

  const fetchFavoriteItems = async (page) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      }
      const response = await getFavouriteApi.getFavouriteApi({ page });
      const data = response?.data?.data?.data;
      
      if (page === 1) {
        setFavoriteData(data);
      } else {
        setFavoriteData((prevData) => [...prevData, ...data]);
      }

      setCurrentPage(response?.data?.data.current_page);
      setHasMore(response?.data?.data.current_page < response?.data?.data.last_page);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsLoadMore(false);
    }
  };

  useEffect(() => {
    fetchFavoriteItems(currentPage);
  }, [currentPage, CurrentLanguage.id]);

  const handleLoadMore = () => {
    setIsLoadMore(true);
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handleLike = (id) => {
    fetchFavoriteItems(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {[...Array(8)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <ProductCardSkeleton />
          </motion.div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!favoritesData || favoritesData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-16"
      >
        <NoData name={t("favorites")} />
      </motion.div>
    );
  }

  // Filter only liked items
  const likedItems = favoritesData.filter((fav) => fav?.is_liked);

  if (likedItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-16"
      >
        <NoData name={t("favorites")} />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {likedItems.map((fav, index) => (
          <motion.div
            key={fav?.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <ProductCard item={fav} handleLike={handleLike} trackingParams={{ ref: "favorites" }} />
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading || IsLoadMore}
            className="h-12 px-8 rounded-2xl border-2 gap-2 hover:border-primary/50 transition-all"
          >
            {IsLoadMore ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t("loading")}
              </>
            ) : (
              <>
                <ChevronDown size={18} />
                {t("loadMore")}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Favorites;