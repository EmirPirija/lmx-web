'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyReviewsApi } from '@/utils/api';
import RatingsSummary from './RatingsSummary';
import RatingsSummarySkeleton from './RatingsSummarySkeleton';
import MyReviewsCard from './MyReviewsCard';
import MyReviewsCardSkeleton from './MyReviewsCardSkeleton';
import ReviewFilters from './ReviewFilters';
import NoData from '@/components/EmptyStates/NoData';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrentLanguageData } from '@/redux/reducer/languageSlice';
import { cn } from '@/lib/utils';

import { Loader2, Star, Filter, X } from "@/components/Common/UnifiedIconPack";
 
const Reviews = () => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [myReviews, setMyReviews] = useState([]);
  const [averageRating, setAverageRating] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    sort: 'newest',
    withImages: false,
    stars: null
  });
 
  const getReviews = async (page) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
 
      const res = await getMyReviewsApi.getMyReviews({ page });
      const data = res?.data?.data;
 
      setAverageRating(data?.average_rating);
      
      if (page === 1) {
        setMyReviews(data?.ratings?.data || []);
      } else {
        setMyReviews(prev => [...prev, ...(data?.ratings?.data || [])]);
      }
 
      setCurrentPage(data?.ratings?.current_page);
      setHasMore(data?.ratings?.current_page < data?.ratings?.last_page);
 
    } catch (error) {
      console.error('Greška pri učitavanju recenzija:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };
 
  useEffect(() => {
    getReviews(1);
  }, [CurrentLanguage?.id]);
 
  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let result = [...myReviews];
 
    if (filters.stars) {
      result = result.filter(review => Math.round(Number(review.ratings)) === filters.stars);
    }
 
    if (filters.withImages) {
      result = result.filter(review => review.images && review.images.length > 0);
    }
 
    switch (filters.sort) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'highest':
        result.sort((a, b) => Number(b.ratings) - Number(a.ratings));
        break;
      case 'lowest':
        result.sort((a, b) => Number(a.ratings) - Number(b.ratings));
        break;
      default:
        break;
    }
 
    return result;
  }, [myReviews, filters]);
 
  const handleLoadMore = () => {
    getReviews(currentPage + 1);
  };
 
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({ sort: 'newest', withImages: false, stars: null });
  };

  const hasActiveFilters = filters.stars || filters.withImages || filters.sort !== 'newest';
 
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <RatingsSummarySkeleton />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200/80 bg-white/85 p-6 dark:border-slate-700/80 dark:bg-slate-900/75">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
 
  // No reviews
  if (!myReviews || myReviews.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-16 text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/20">
          <Star size={40} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Još nema recenzija</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Recenzije će se pojaviti nakon što kupci ocijene vaše proizvode.
        </p>
      </motion.div>
    );
  }
 
  return (
    <div className="space-y-6">
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <RatingsSummary
          averageRating={averageRating}
          reviews={myReviews}
          onFilterByRating={(star) => handleFilterChange({ ...filters, stars: star })}
          activeFilter={filters.stars}
        />
      </motion.div>
 
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ReviewFilters
          activeFilters={filters}
          onFilterChange={handleFilterChange}
          totalReviews={myReviews.length}
          filteredCount={filteredReviews.length}
        />
      </motion.div>
 
      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Recenzije
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                {filteredReviews.length}
              </span>
            </h2>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors"
              >
                <X size={16} />
                Očisti filtere
              </button>
            )}
          </div>
 
          {/* Reviews Grid */}
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredReviews.map((rating, index) => (
                <motion.div
                  key={rating?.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MyReviewsCard
                    rating={rating}
                    setMyReviews={setMyReviews}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
 
          {/* Load More */}
          {hasMore && !filters.stars && !filters.withImages && (
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="h-12 px-8 rounded-2xl border-2 gap-2 hover:border-primary/50 transition-all"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Učitavam...
                  </>
                ) : (
                  'Učitaj još'
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
        >
          <Filter size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            Nema recenzija koje odgovaraju filterima.
          </p>
          <button
            onClick={clearFilters}
            className="mt-3 text-primary hover:underline text-sm font-semibold"
          >
            Očisti filtere
          </button>
        </motion.div>
      )}
    </div>
  );
};
 
export default Reviews;
