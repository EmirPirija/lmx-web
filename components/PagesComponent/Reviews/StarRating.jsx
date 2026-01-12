'use client';
import { cn } from '@/lib/utils';
 
const StarRating = ({ 
  rating = 0, 
  size = 16, 
  maxStars = 5, 
  showEmpty = true,
  showValue = false,
  className 
}) => {
  // Puni broj zvjezdica
  const fullStars = Math.floor(rating);
  
  // Provjeravamo ima li decimale
  const hasDecimal = rating % 1 !== 0;
  const decimalPart = rating % 1;
  
  // Prazne zvjezdice
  const emptyStars = maxStars - fullStars - (hasDecimal ? 1 : 0);
 
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {/* Pune zvjezdice */}
        {[...Array(fullStars)].map((_, index) => (
          <svg
            key={`full-${index}`}
            width={size}
            height={size}
            viewBox="0 0 20 20"
            className="fill-amber-400 text-amber-400"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
 
        {/* Djelomična zvjezdica */}
        {hasDecimal && (
          <div className="relative" style={{ width: size, height: size }}>
            {/* Siva pozadina */}
            <svg
              width={size}
              height={size}
              viewBox="0 0 20 20"
              className="fill-gray-200 text-gray-200 absolute inset-0"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {/* Žuta popuna */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${decimalPart * 100}%` }}
            >
              <svg
                width={size}
                height={size}
                viewBox="0 0 20 20"
                className="fill-amber-400 text-amber-400"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        )}
 
        {/* Prazne zvjezdice */}
        {showEmpty && [...Array(Math.max(0, emptyStars))].map((_, index) => (
          <svg
            key={`empty-${index}`}
            width={size}
            height={size}
            viewBox="0 0 20 20"
            className="fill-gray-200 text-gray-200"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
 
      {/* Vrijednost pored zvjezdica */}
      {showValue && (
        <span className="text-sm text-gray-600 font-medium ml-1">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};
 
export default StarRating;