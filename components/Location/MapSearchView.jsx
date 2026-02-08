"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { IoLocationOutline, IoClose } from "react-icons/io5";
import { MdMap, MdList, MdFilterList } from "react-icons/md";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { BiCurrentLocation } from "react-icons/bi";
import Image from "next/image";
import { useSelector } from "react-redux";
import { getCityData, getKilometerRange } from "@/redux/reducer/locationSlice";
import { t } from "@/utils";
import { cn } from "@/lib/utils";

// Dynamic import za mapu
const MapWithListingsMarkers = dynamic(() => import("./MapWithListingsMarkers"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  ),
});

const MapSearchView = ({
  ads = [],
  isLoading = false,
  onAdClick,
  onMapBoundsChange,
  onFilterChange,
  filters = {},
  showCurrentLocationButton = true,
  onCurrentLocationClick,
}) => {
  const cityData = useSelector(getCityData);
  const kmRange = useSelector(getKilometerRange);
  
  const [selectedAd, setSelectedAd] = useState(null);
  const [hoveredAd, setHoveredAd] = useState(null);
  const [viewMode, setViewMode] = useState("both"); // 'map', 'list', 'both'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const listRef = useRef(null);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Scroll do selektovanog oglasa u listi
  const scrollToAd = (adId) => {
    const element = document.getElementById(`ad-card-${adId}`);
    if (element && listRef.current) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleMarkerClick = (ad) => {
    setSelectedAd(ad);
    if (onAdClick) onAdClick(ad);
    if (viewMode !== "map") {
      scrollToAd(ad.id);
    }
  };

  const handleAdCardClick = (ad) => {
    setSelectedAd(ad);
    if (onAdClick) onAdClick(ad);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const formatPrice = (price) => {
    if (!price) return t("priceOnRequest") || "Cijena na upit";
    return new Intl.NumberFormat("bs-BA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + " KM";
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden transition-all duration-300",
        isFullscreen && "fixed inset-0 z-50 rounded-none"
      )}
    >
      {/* Toolbar */}
      <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <MdMap className="text-primary text-xl" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">
              {t("mapSearch") || "Pretraga na mapi"}
            </h2>
            <p className="text-xs text-slate-500">
              {isLoading 
                ? t("loading") || "Učitavanje..."
                : `${t("found") || "Pronađeno"} ${ads.length} ${t("ads") || "oglasa"}`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Current location info */}
          {cityData?.formattedAddress && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <IoLocationOutline className="text-primary text-sm" />
              <span className="text-xs text-slate-600 max-w-[200px] truncate">
                {cityData.formattedAddress}
              </span>
              {kmRange > 0 && (
                <span className="text-xs text-slate-500">
                  ({kmRange} km)
                </span>
              )}
            </div>
          )}

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 rounded-lg transition-all",
              showFilters 
                ? "bg-primary text-white" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <MdFilterList className="text-xl" />
          </button>

          {/* View mode toggle */}
          <div className="hidden md:flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("both")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === "both" 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-600 hover:text-slate-800"
              )}
            >
              {t("both") || "Oboje"}
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === "map" 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-600 hover:text-slate-800"
              )}
            >
              {t("map") || "Mapa"}
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === "list" 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-600 hover:text-slate-800"
              )}
            >
              {t("list") || "Lista"}
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
          >
            {isFullscreen ? (
              <FiMinimize2 className="text-xl text-slate-600" />
            ) : (
              <FiMaximize2 className="text-xl text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 animate-in slide-in-from-top duration-200">
          <div className="flex flex-wrap gap-2">
            {/* Kategorija */}
            <select 
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              value={localFilters.category || ""}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="">{t("allCategories") || "Sve kategorije"}</option>
              <option value="stanovi">{t("apartments") || "Stanovi"}</option>
              <option value="kuce">{t("houses") || "Kuće"}</option>
              <option value="automobili">{t("vehicles") || "Automobili"}</option>
              <option value="ostalo">{t("other") || "Ostalo"}</option>
            </select>

            {/* Cijena */}
            <select 
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              value={localFilters.priceRange || ""}
              onChange={(e) => handleFilterChange("priceRange", e.target.value)}
            >
              <option value="">{t("allPrices") || "Sve cijene"}</option>
              <option value="0-50000">Do 50.000 KM</option>
              <option value="50000-100000">50.000 - 100.000 KM</option>
              <option value="100000-200000">100.000 - 200.000 KM</option>
              <option value="200000+">200.000+ KM</option>
            </select>

            {/* Status */}
            <select 
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              value={localFilters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">{t("allStatuses") || "Svi statusi"}</option>
              <option value="prodaja">{t("sale") || "Prodaja"}</option>
              <option value="iznajmljivanje">{t("rent") || "Iznajmljivanje"}</option>
            </select>

            {/* Reset */}
            <button
              onClick={() => {
                setLocalFilters({});
                if (onFilterChange) onFilterChange({});
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
            >
              {t("reset") || "Resetuj"}
            </button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex h-[600px] lg:h-[700px]">
        {/* Sidebar sa listom oglasa */}
        {(viewMode === "both" || viewMode === "list") && (
          <div
            ref={listRef}
            className={cn(
              "overflow-y-auto border-r border-slate-200 bg-slate-50",
              viewMode === "list" ? "w-full" : "w-full md:w-2/5 lg:w-1/3"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : ads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                <MdMap className="text-6xl text-slate-300" />
                <p className="text-sm">{t("noAdsFound") || "Nema pronađenih oglasa"}</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {ads.map((ad) => (
                  <AdCard
                    key={ad.id}
                    ad={ad}
                    isSelected={selectedAd?.id === ad.id}
                    isHovered={hoveredAd?.id === ad.id}
                    onClick={() => handleAdCardClick(ad)}
                    onMouseEnter={() => setHoveredAd(ad)}
                    onMouseLeave={() => setHoveredAd(null)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mapa */}
        {(viewMode === "both" || viewMode === "map") && (
          <div className={viewMode === "map" ? "w-full" : "flex-1"}>
            <MapWithListingsMarkers
              ads={ads}
              selectedAd={selectedAd}
              hoveredAd={hoveredAd}
              onMarkerClick={handleMarkerClick}
              onBoundsChange={onMapBoundsChange}
              cityData={cityData}
              kmRange={kmRange}
              showCurrentLocationButton={showCurrentLocationButton}
              onCurrentLocationClick={onCurrentLocationClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Ad Card Component
const AdCard = ({
  ad,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  formatPrice,
}) => {
  return (
    <div
      id={`ad-card-${ad.id}`}
      className={cn(
        "group relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200",
        isSelected 
          ? "border-primary shadow-lg scale-[1.02]" 
          : isHovered
          ? "border-primary/50 shadow-md"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Image */}
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        {ad.image || ad.images?.[0] ? (
          <Image
            src={ad.image || ad.images[0]}
            alt={ad.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MdMap className="text-slate-300 text-4xl" />
          </div>
        )}
        
        {/* Badge */}
        {ad.featured && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-primary/90 backdrop-blur-sm text-white text-xs font-medium rounded-md">
            {t("featured") || "ISTAKNUTO"}
          </div>
        )}

        {/* Status badge */}
        {ad.status && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-medium rounded-md">
            {ad.status}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {ad.title || ad.name}
        </h3>
        
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
          <IoLocationOutline className="text-sm flex-shrink-0" />
          <span className="truncate">
            {ad.location || ad.address || ad.city || t("locationNotSpecified")}
          </span>
        </div>

        <div className="flex items-center justify-between mb-2">
          <p className="text-lg font-bold text-primary">
            {formatPrice(ad.price)}
          </p>
          {ad.area && (
            <span className="text-xs text-slate-500">
              {ad.area} m²
            </span>
          )}
        </div>

        {/* Additional info */}
        {(ad.rooms || ad.bedrooms || typeof ad.views === "number") && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {ad.rooms && <span>{ad.rooms} sobe</span>}
            {ad.bedrooms && <span>{ad.bedrooms} spavaće</span>}
            {typeof ad.views === "number" && <span>👀 {ad.views} pregleda</span>}
          </div>
        )}

        {/* Category */}
        {(ad.category || ad.status) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {ad.category && (
              <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                {ad.category}
              </span>
            )}
            {ad.status && (
              <span className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                {ad.status}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-4 border-primary/20 pointer-events-none rounded-xl" />
      )}
    </div>
  );
};

export default MapSearchView;