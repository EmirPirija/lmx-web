"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import MapSearchView from "@/components/MapSearchView-Integrated";
import { getCityData, getKilometerRange } from "@/redux/reducer/locationSlice";
import { t } from "@/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const AdsMapPage = () => {
  const router = useRouter();
  const cityData = useSelector(getCityData);
  const kmRange = useSelector(getKilometerRange);

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  // Fetch ads on mount and when location/filters change
  useEffect(() => {
    fetchAds();
  }, [cityData, kmRange, filters]);

  const fetchAds = async (bounds = null) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();

      // Location params
      if (cityData?.lat && cityData?.long) {
        params.append("latitude", cityData.lat);
        params.append("longitude", cityData.long);
      }

      if (kmRange > 0) {
        params.append("radius", kmRange);
      }

      // Map bounds params (if searching within visible map area)
      if (bounds) {
        params.append("north", bounds.north);
        params.append("south", bounds.south);
        params.append("east", bounds.east);
        params.append("west", bounds.west);
      }

      // Filter params
      if (filters.category) {
        params.append("category", filters.category);
      }
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split("-");
        if (min) params.append("min_price", min);
        if (max && max !== "+") params.append("max_price", max);
      }
      if (filters.status) {
        params.append("status", filters.status);
      }

      // Replace with your actual API endpoint
      const response = await fetch(`/api/ads/map?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch ads");
      }

      const data = await response.json();

      // Transform API response to match MapSearchView expected format
      const formattedAds = data.map((ad) => ({
        id: ad.id,
        title: ad.title || ad.name,
        price: parseFloat(ad.price) || 0,
        location: ad.location || ad.city,
        address: ad.address,
        city: ad.city,
        latitude: parseFloat(ad.latitude),
        longitude: parseFloat(ad.longitude),
        image: ad.images?.[0]?.url || ad.image,
        images: ad.images?.map(img => img.url) || [],
        area: ad.area,
        rooms: ad.rooms,
        bedrooms: ad.bedrooms,
        category: ad.category_name || ad.category,
        status: ad.status,
        featured: ad.is_featured || ad.featured,
      }));

      setAds(formattedAds);
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast.error(t("errorFetchingAds") || "Greška pri učitavanju oglasa");
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = (ad) => {
    // Navigate to ad detail page
    router.push(`/ad/${ad.id}`);
  };

  const handleMapBoundsChange = (bounds) => {
    // Optional: Refetch ads when map bounds change
    // fetchAds(bounds);
    
    // Or just log for now
    console.log("Map bounds changed:", bounds);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleCurrentLocationClick = () => {
    // This could open the LocationModal to set new location
    toast.info(t("useLocationModal") || "Koristite modal za promjenu lokacije");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          {t("searchOnMap") || "Pretraga oglasa na mapi"}
        </h1>
        <p className="text-slate-600">
          {cityData?.formattedAddress 
            ? `${t("showingAdsNear")} ${cityData.formattedAddress}` 
            : t("selectLocationToSeeAds") || "Odaberite lokaciju da vidite oglase"
          }
        </p>
      </div>

      {/* Map Search View */}
      <MapSearchView
        ads={ads}
        isLoading={loading}
        onAdClick={handleAdClick}
        onMapBoundsChange={handleMapBoundsChange}
        onFilterChange={handleFilterChange}
        filters={filters}
        showCurrentLocationButton={true}
        onCurrentLocationClick={handleCurrentLocationClick}
      />

      {/* Optional: Additional info below map */}
      {!loading && ads.length > 0 && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-2">
            {t("tips") || "Savjeti za pretragu"}
          </h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• {t("tipZoom") || "Zumirајte mapu da vidite detaljnije oglase"}</li>
            <li>• {t("tipClick") || "Kliknite na marker da vidite detalje oglasa"}</li>
            <li>• {t("tipFilter") || "Koristite filtere da suzite pretragu"}</li>
            <li>• {t("tipLocation") || "Promenite lokaciju da vidite oglase u drugoj oblasti"}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdsMapPage;