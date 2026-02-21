"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import dynamic from "next/dynamic";
import { getCityData, getKilometerRange } from "@/redux/reducer/locationSlice";
import { t } from "@/utils";
import { mapSearchApi, transformItemsForMap } from "@/utils/api";
import { toast } from "@/utils/toastBs";
import { useRouter } from "next/navigation";
import { Loader2 } from "@/components/Common/UnifiedIconPack";

// Dynamic import za map komponentu
const MapSearchView = dynamic(
  () => import("@/components/MapSearchView"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[700px] flex items-center justify-center bg-slate-100 rounded-2xl border">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-slate-600">{"Učitavanje mape..." || "Učitavanje mape..."}</p>
        </div>
      </div>
    ),
  }
);

const MapSearchPage = () => {
  const router = useRouter();
  const cityData = useSelector(getCityData);
  const kmRange = useSelector(getKilometerRange);

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category_id: "",
    min_price: "",
    max_price: "",
    sort_by: "newest",
  });

  // Fetch ads kada se promeni lokacija ili filteri
  useEffect(() => {
    if (cityData?.lat && cityData?.long) {
      fetchAds();
    } else {
      setLoading(false);
    }
  }, [cityData, kmRange, filters]);

  const fetchAds = useCallback(async (mapBounds = null) => {
    setLoading(true);
    try {
      let response;

      if (mapBounds) {
        // Fetch po map bounds (kada korisnik pomeri mapu)
        response = await mapSearchApi.getMapItemsByBounds({
          north: mapBounds.north,
          south: mapBounds.south,
          east: mapBounds.east,
          west: mapBounds.west,
          category_id: filters.category_id || undefined,
          min_price: filters.min_price || undefined,
          max_price: filters.max_price || undefined,
        });
      } else if (cityData?.lat && cityData?.long) {
        // Fetch po radius-u (default)
        response = await mapSearchApi.getMapItemsByRadius({
          latitude: cityData.lat,
          longitude: cityData.long,
          radius: kmRange || 10,
          category_id: filters.category_id || undefined,
          min_price: filters.min_price || undefined,
          max_price: filters.max_price || undefined,
        });
      } else {
        // Fallback: dohvati sve oglase
        response = await mapSearchApi.getMapItems({
          limit: 500,
          category_id: filters.category_id || undefined,
          min_price: filters.min_price || undefined,
          max_price: filters.max_price || undefined,
        });
      }

      if (response?.data?.error === false) {
        const items = response.data.data || [];
        const formattedAds = transformItemsForMap(items);
        setAds(formattedAds);
      } else {
        toast.error(response?.data?.message || "Greška pri učitavanju oglasa.");
      }
    } catch (error) {
      console.error("Error fetching map ads:", error);
      toast.error("Došlo je do greške." || "Došlo je do greške");
    } finally {
      setLoading(false);
    }
  }, [cityData, kmRange, filters]);

  const handleAdClick = (ad) => {
    // Navigate to ad detail page
    router.push(`/ad-details/${ad.id}`);
  };

  const handleMapBoundsChange = useCallback((bounds) => {
    // Optional: refetch ads when map bounds change
    // Uncomment to enable dynamic loading as user pans the map
    // fetchAds(bounds);
    
    console.log("Map bounds changed:", bounds);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleCurrentLocationClick = () => {
    // Could open LocationModal or do something else
    toast.info("Otvori postavke lokacije" || "Otvorite postavke lokacije");
  };

  // No location selected state
  if (!cityData?.lat || !cityData?.long) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {"Prvo odaberi lokaciju" || "Odaberite lokaciju"}
            </h2>
            <p className="text-slate-600 mb-6">
              {"Odaberi lokaciju da vidiš oglase na mapi" ||
                "Molimo odaberite lokaciju da vidite oglase na mapi"}
            </p>
            <button
              onClick={() => {
                // Trigger location modal
                // You can dispatch an action or use a context
                toast.info("Otvori postavke lokacije");
              }}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              {"Odaberi lokaciju" || "Odaberi lokaciju"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-slate-800">
            {"Pretraga na mapi" || "Pretraga na mapi"}
          </h1>
          {!loading && ads.length > 0 && (
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-primary">{ads.length}</span>{" "}
              {"oglasa" || "oglasa"}
            </div>
          )}
        </div>
        <p className="text-slate-600">
          {cityData?.formattedAddress && (
            <>
              {"Prikazujem oglase blizu" || "Prikazujem oglase blizu"}{" "}
              <span className="font-medium">{cityData.formattedAddress}</span>
              {kmRange > 0 && (
                <span className="text-slate-500">
                  {" "}
                  ({kmRange} km {"radijus" || "radius"})
                </span>
              )}
            </>
          )}
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

      {/* Tips Section */}
      {!loading && ads.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
              </svg>
              {"Savjet" || "Savjet"}
            </h3>
            <p className="text-sm text-blue-800">
              {"Klikni na marker da vidiš detalje i otvoriš oglas." ||
                "Kliknite na marker da vidite detalje oglasa, ili na karticu u listi za brzu navigaciju."}
            </p>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
              {"Brzi filteri" || "Brzi filteri"}
            </h3>
            <p className="text-sm text-green-800">
              {"Koristi brze filtere i radijus da suziš rezultate." ||
                "Koristite filtere iznad mape da suzite pretragu po kategoriji, cijeni ili statusu."}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && ads.length === 0 && (
        <div className="mt-6 p-8 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {"Nema oglasa u ovoj oblasti" || "Nema oglasa u ovoj oblasti"}
          </h3>
          <p className="text-slate-600 mb-4">
            {"Pokušaj povećati radijus ili ukloniti neke filtere." ||
              "Pokušajte proširiti radius pretrage ili promijenite filtere"}
          </p>
          <button
            onClick={() => {
              setFilters({
                category_id: "",
                min_price: "",
                max_price: "",
                sort_by: "newest",
              });
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
          >
            {"Resetuj filtere" || "Resetuj filtere"}
          </button>
        </div>
      )}
    </div>
  );
};

export default MapSearchPage;