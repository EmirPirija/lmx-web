'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const StarRatingInput = ({ 
  rating = 0, 
  onRatingChange, 
  size = 32, 
  disabled = false,
  showLabel = true 
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const labels = {
    1: 'Loše',
    2: 'Moglo je bolje',
    3: 'Solidno',
    4: 'Vrlo dobro',
    5: 'Odlično'
  };

  const handleClick = (selectedRating) => {
    if (!disabled) {
      onRatingChange?.(selectedRating);
    }
  };

  const handleMouseEnter = (starValue) => {
    if (!disabled) {
      setHoveredRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={starValue}
            type="button"
            disabled={disabled}
            className={cn(
              "relative p-1 transition-all duration-200 ease-out focus:outline-none",
              !disabled && "hover:scale-110 active:scale-95",
              disabled && "cursor-not-allowed opacity-60"
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            aria-label={`Ocijeni ${starValue} od 5 zvjezdica`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              className={cn(
                "transition-all duration-200",
                displayRating >= starValue 
                  ? "fill-amber-400 stroke-amber-400" 
                  : "fill-transparent stroke-gray-300"
              )}
              strokeWidth="1.5"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            
            {/* Animirani krug pri selekciji */}
            {rating === starValue && (
              <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/30" />
            )}
          </button>
        ))}
      </div>

      {/* Label ispod zvjezdica */}
      {showLabel && (
        <div className="h-6 flex items-center justify-center">
          <span 
            className={cn(
              "text-sm font-medium transition-all duration-200",
              displayRating > 0 ? "opacity-100" : "opacity-0",
              displayRating >= 4 ? "text-green-600" : 
              displayRating >= 3 ? "text-amber-600" : 
              displayRating >= 1 ? "text-orange-500" : "text-gray-400"
            )}
          >
            {labels[displayRating] || ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default StarRatingInput;
