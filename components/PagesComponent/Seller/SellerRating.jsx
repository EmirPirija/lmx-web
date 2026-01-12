'use client';
import { useState, useMemo } from 'react';
import RatingsSummary from '../Reviews/RatingsSummary';
import SellerReviewCard from '@/components/PagesComponent/Reviews/SellerReviewCard';
import ReviewFilters from '@/components/PagesComponent/Reviews/ReviewFilters';
import { Button } from '@/components/ui/button';
import NoData from '@/components/EmptyStates/NoData';
import { cn } from '@/lib/utils';

const SellerRating = ({
  ratingsData,
  seller,
  isLoadMoreReview,
  reviewHasMore,
  reviewCurrentPage,
  getSeller,
}) => {
  // Stanje filtera
  const [filters, setFilters] = useState({
    sort: 'newest',
    withImages: false,
    stars: null,
  });

  const reviews = ratingsData?.data || [];

  // Filtriranje i sortiranje recenzija
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    // Filter po zvjezdicama
    if (filters.stars) {
      result = result.filter(
        (review) => Math.round(Number(review.ratings)) === filters.stars
      );
    }

    // Filter - samo sa slikama
    if (filters.withImages) {
      result = result.filter(
        (review) => review.images && review.images.length > 0
      );
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
  }, [reviews, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Nema recenzija
  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <NoData name="recenzije" />
        <p className="mt-4 text-gray-500 text-center">
          Ovaj prodavač još nema nijednu recenziju.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sumarni prikaz */}
      <RatingsSummary
        averageRating={seller?.average_rating}
        reviews={reviews}
        onFilterByRating={(star) =>
          handleFilterChange({ ...filters, stars: star })
        }
        activeFilter={filters.stars}
      />

      {/* Filteri */}
      <ReviewFilters
        activeFilters={filters}
        onFilterChange={handleFilterChange}
        totalReviews={reviews.length}
        filteredCount={filteredReviews.length}
      />

      {/* Lista recenzija */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recenzije kupaca
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredReviews.length})
              </span>
            </h2>
          </div>

          {/* Grid kartica */}
          <div className="grid gap-4">
            {filteredReviews.map((rating) => (
              <SellerReviewCard key={rating.id} rating={rating} />
            ))}
          </div>

          {/* Load More dugme */}
          {reviewHasMore && !filters.stars && !filters.withImages && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => getSeller(reviewCurrentPage + 1)}
                disabled={isLoadMoreReview}
                className={cn('min-w-[200px]', isLoadMoreReview && 'opacity-70')}
              >
                {isLoadMoreReview ? (
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
            onClick={() =>
              handleFilterChange({ sort: 'newest', withImages: false, stars: null })
            }
            className="mt-2 text-primary hover:underline text-sm font-medium"
          >
            Očisti filtere
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerRating;
