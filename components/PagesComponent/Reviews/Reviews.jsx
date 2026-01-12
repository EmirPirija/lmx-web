'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getMyReviewsApi } from '@/utils/api';
import RatingsSummary from './RatingsSummary';
import RatingsSummarySkeleton from './RatingsSummarySkeleton';
import MyReviewsCard from './MyReviewsCard';
import MyReviewsCardSkeleton from './MyReviewsCardSkeleton';
import ReviewFilters from './ReviewFilters';
import NoData from '@/components/EmptyStates/NoData';
import { Button } from '@/components/ui/button';
import { CurrentLanguageData } from '@/redux/reducer/languageSlice';
import { cn } from '@/lib/utils';

const Reviews = () => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [myReviews, setMyReviews] = useState([]);
  const [averageRating, setAverageRating] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Stanje filtera
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

  // Filtriranje i sortiranje recenzija
  const filteredReviews = useMemo(() => {
    let result = [...myReviews];

    // Filter po zvjezdicama
    if (filters.stars) {
      result = result.filter(review => Math.round(Number(review.ratings)) === filters.stars);
    }

    // Filter - samo sa slikama
    if (filters.withImages) {
      result = result.filter(review => review.images && review.images.length > 0);
    }

    // Sortiranje
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

  // Skeleton loading stanje
  if (isLoading) {
    return (
      <div className="space-y-6">
        <RatingsSummarySkeleton />
        <MyReviewsCardSkeleton />
      </div>
    );
  }

  // Nema recenzija
  if (!myReviews || myReviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <NoData name="recenzije" />
        <p className="mt-4 text-gray-500 text-center">
          Još uvijek nemate nijednu recenziju.
          <br />
          Recenzije će se pojaviti nakon što kupci ocijene vaše proizvode.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sumarni prikaz */}
      <RatingsSummary
        averageRating={averageRating}
        reviews={myReviews}
        onFilterByRating={(star) => handleFilterChange({ ...filters, stars: star })}
        activeFilter={filters.stars}
      />

      {/* Filteri */}
      <ReviewFilters
        activeFilters={filters}
        onFilterChange={handleFilterChange}
        totalReviews={myReviews.length}
        filteredCount={filteredReviews.length}
      />

      {/* Lista recenzija */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recenzije
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredReviews.length})
              </span>
            </h2>
          </div>

          {/* Grid kartica */}
          <div className="grid gap-4">
            {filteredReviews.map((rating) => (
              <MyReviewsCard
                key={rating?.id}
                rating={rating}
                setMyReviews={setMyReviews}
              />
            ))}
          </div>

          {/* Load More dugme */}
          {hasMore && !filters.stars && !filters.withImages && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className={cn(
                  "min-w-[200px]",
                  isLoadingMore && "opacity-70"
                )}
              >
                {isLoadingMore ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Učitavam...
                  </span>
                ) : (
                  'Učitaj još'
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">
            Nema recenzija koje odgovaraju odabranim filterima.
          </p>
          <button
            onClick={() => handleFilterChange({ sort: 'newest', withImages: false, stars: null })}
            className="mt-2 text-primary hover:underline text-sm font-medium"
          >
            Očisti filtere
          </button>
        </div>
      )}
    </div>
  );
};

export default Reviews;
