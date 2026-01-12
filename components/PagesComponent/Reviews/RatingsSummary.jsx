'use client';
import { cn } from '@/lib/utils';
import { calculateRatingPercentages } from '@/utils';

const RatingsSummary = ({ averageRating, reviews, onFilterByRating, activeFilter }) => {
  const { ratingCount, ratingPercentages } = reviews?.length
    ? calculateRatingPercentages(reviews)
    : { ratingCount: {}, ratingPercentages: {} };

  const totalReviews = reviews?.length || 0;
  const avgRating = Number(averageRating || 0).toFixed(1);

  // Opis ocjene na osnovu prosjeka
  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return 'Izvanredno';
    if (rating >= 4.0) return 'Odlično';
    if (rating >= 3.5) return 'Vrlo dobro';
    if (rating >= 3.0) return 'Dobro';
    if (rating >= 2.0) return 'Prosječno';
    return 'Potrebno poboljšanje';
  };

  // Boja na osnovu ocjene
  const getRatingColor = (rating) => {
    if (rating >= 4.0) return 'text-green-600';
    if (rating >= 3.0) return 'text-amber-600';
    return 'text-orange-500';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Lijeva strana - Ukupna ocjena */}
        <div className="flex flex-col items-center justify-center lg:min-w-[200px] lg:border-r lg:border-gray-100 lg:pr-8">
          <div className="relative">
            <span className="text-6xl font-bold text-gray-900">{avgRating}</span>
            <span className="absolute -top-1 -right-6 text-lg text-gray-400">/5</span>
          </div>
          
          {/* Zvjezdice */}
          <div className="flex items-center gap-0.5 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={cn(
                  "w-5 h-5 transition-colors",
                  star <= Math.round(averageRating) 
                    ? "fill-amber-400 text-amber-400" 
                    : "fill-gray-200 text-gray-200"
                )}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          
          <p className={cn("mt-2 text-sm font-medium", getRatingColor(averageRating))}>
            {getRatingLabel(averageRating)}
          </p>
          
          <p className="mt-1 text-xs text-gray-500">
            {totalReviews} {totalReviews === 1 ? 'recenzija' : totalReviews < 5 ? 'recenzije' : 'recenzija'}
          </p>
        </div>

        {/* Desna strana - Distribucija ocjena */}
        <div className="flex-1 space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Distribucija ocjena</h3>
          
          {[5, 4, 3, 2, 1].map((rating) => {
            const percentage = ratingPercentages?.[rating] || 0;
            const count = ratingCount?.[rating] || 0;
            const isActive = activeFilter === rating;
            
            return (
              <button
                key={rating}
                onClick={() => onFilterByRating?.(isActive ? null : rating)}
                className={cn(
                  "w-full flex items-center gap-3 group transition-all duration-200 rounded-lg p-1.5 -mx-1.5",
                  onFilterByRating && "hover:bg-gray-50 cursor-pointer",
                  isActive && "bg-amber-50"
                )}
              >
                {/* Broj zvjezdica */}
                <div className="flex items-center gap-1 min-w-[50px]">
                  <span className={cn(
                    "text-sm font-medium",
                    isActive ? "text-amber-600" : "text-gray-600"
                  )}>
                    {rating}
                  </span>
                  <svg
                    className={cn(
                      "w-4 h-4",
                      isActive ? "fill-amber-400 text-amber-400" : "fill-amber-400 text-amber-400"
                    )}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>

                {/* Progress bar */}
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      isActive ? "bg-amber-400" : "bg-amber-400/80",
                      "group-hover:bg-amber-400"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Broj recenzija */}
                <span className={cn(
                  "text-sm min-w-[40px] text-right tabular-nums",
                  isActive ? "text-amber-600 font-medium" : "text-gray-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
          
          {/* Filter indikator */}
          {activeFilter && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-4">
              <span className="text-xs text-gray-500">
                Prikazane samo {activeFilter}-zvjezdice recenzije
              </span>
              <button
                onClick={() => onFilterByRating?.(null)}
                className="text-xs text-primary hover:underline font-medium"
              >
                Prikaži sve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingsSummary;
