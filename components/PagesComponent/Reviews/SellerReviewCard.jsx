'use client';
import { useState, useRef, useEffect } from 'react';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { HiOutlinePhotograph } from 'react-icons/hi';
import StarRating from './StarRating';
import CustomImage from '@/components/Common/CustomImage';
import { cn } from '@/lib/utils';
 
const SellerReviewCard = ({ rating }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTextOverflowing, setIsTextOverflowing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const textRef = useRef(null);
 
  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        setIsTextOverflowing(textRef.current.scrollHeight > textRef.current.clientHeight);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [rating?.review]);
 
  // Formatiranje datuma na bosanski
  const formatDateBosnian = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
 
    if (diffInDays === 0) return 'Danas';
    if (diffInDays === 1) return 'Jučer';
    if (diffInDays < 7) return `Prije ${diffInDays} dana`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Prije ${weeks} ${weeks === 1 ? 'sedmicu' : 'sedmice'}`;
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `Prije ${months} ${months === 1 ? 'mjesec' : months < 5 ? 'mjeseca' : 'mjeseci'}`;
    }
    const years = Math.floor(diffInDays / 365);
    return `Prije ${years} ${years === 1 ? 'godinu' : 'godina'}`;
  };
 
  // Slike iz recenzije (ako postoje)
  const reviewImages = rating?.images || [];
 
  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
        <div className="p-4 sm:p-5">
          {/* Header - Korisnik i ocjena */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <CustomImage
              src={rating?.buyer?.profile}
              width={48}
              height={48}
              alt={rating?.buyer?.name || 'Korisnik'}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 flex-shrink-0"
            />
 
            {/* Informacije */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h4 className="font-semibold text-gray-900">
                  {rating?.buyer?.name}
                </h4>
                <span className="text-xs text-gray-400">
                  {formatDateBosnian(rating?.created_at)}
                </span>
              </div>
 
              {/* Ocjena */}
              <div className="mt-1">
                <StarRating rating={Number(rating?.ratings)} size={16} showValue />
              </div>
            </div>
          </div>
 
          {/* Tekst recenzije */}
          {rating?.review && (
            <div className="mt-4">
              <p
                ref={textRef}
                className={cn(
                  'text-gray-700 text-sm leading-relaxed transition-all duration-300',
                  !isExpanded && 'line-clamp-3'
                )}
              >
                {rating?.review}
              </p>
 
              {isTextOverflowing && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {isExpanded ? (
                    <>
                      Prikaži manje <IoChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Prikaži više <IoChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
 
          {/* Slike recenzije */}
          {reviewImages.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <HiOutlinePhotograph className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {reviewImages.length} {reviewImages.length === 1 ? 'slika' : reviewImages.length < 5 ? 'slike' : 'slika'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {reviewImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className="relative group overflow-hidden rounded-lg"
                  >
                    <CustomImage
                      src={image}
                      width={80}
                      height={80}
                      alt={`Slika recenzije ${index + 1}`}
                      className="w-20 h-20 object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* Modal za uvećanu sliku */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Uvećana slika"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
 
export default SellerReviewCard;