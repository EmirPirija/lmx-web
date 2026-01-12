'use client';
import { useState, useRef, useEffect } from 'react';
import { IoChevronDown, IoClose } from 'react-icons/io5';
import { HiOutlinePhotograph, HiOutlineSortDescending } from 'react-icons/hi';
import { cn } from '@/lib/utils';

const ReviewFilters = ({
  activeFilters = {},
  onFilterChange,
  totalReviews = 0,
  filteredCount = 0
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Zatvaranje dropdown-a pri kliku van
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortOptions = [
    { value: 'newest', label: 'Najnovije' },
    { value: 'oldest', label: 'Najstarije' },
    { value: 'highest', label: 'Najviša ocjena' },
    { value: 'lowest', label: 'Najniža ocjena' },
  ];

  const currentSort = sortOptions.find(opt => opt.value === activeFilters.sort) || sortOptions[0];

  const handleSortChange = (value) => {
    onFilterChange?.({ ...activeFilters, sort: value });
    setIsDropdownOpen(false);
  };

  const handleImageFilterToggle = () => {
    onFilterChange?.({ 
      ...activeFilters, 
      withImages: !activeFilters.withImages 
    });
  };

  const handleStarFilterChange = (star) => {
    const newStars = activeFilters.stars === star ? null : star;
    onFilterChange?.({ ...activeFilters, stars: newStars });
  };

  const clearAllFilters = () => {
    onFilterChange?.({ sort: 'newest', withImages: false, stars: null });
  };

  const hasActiveFilters = activeFilters.withImages || activeFilters.stars;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        
        {/* Lijeva strana - Filteri */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Filter po zvjezdicama */}
          <div className="flex items-center gap-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => handleStarFilterChange(star)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  activeFilters.stars === star
                    ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {star}
                <svg className="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>

          {/* Filter - samo sa slikama */}
          <button
            onClick={handleImageFilterToggle}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              activeFilters.withImages
                ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <HiOutlinePhotograph className="w-4 h-4" />
            Sa slikama
          </button>

          {/* Očisti sve filtere */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <IoClose className="w-4 h-4" />
              Očisti
            </button>
          )}
        </div>

        {/* Desna strana - Sortiranje */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors min-w-[160px] justify-between"
          >
            <div className="flex items-center gap-2">
              <HiOutlineSortDescending className="w-4 h-4" />
              {currentSort.label}
            </div>
            <IoChevronDown className={cn(
              "w-4 h-4 transition-transform",
              isDropdownOpen && "rotate-180"
            )} />
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors",
                    currentSort.value === option.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info o filtriranim rezultatima */}
      {(hasActiveFilters || filteredCount !== totalReviews) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Prikazano <span className="font-medium text-gray-700">{filteredCount}</span> od{' '}
            <span className="font-medium text-gray-700">{totalReviews}</span> recenzija
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewFilters;
