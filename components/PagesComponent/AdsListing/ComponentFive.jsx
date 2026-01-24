import { useState, useEffect, useRef } from "react";
import { FaLocationCrosshairs } from "react-icons/fa6";
import dynamic from "next/dynamic";
import { BiMapPin } from "react-icons/bi";
import { IoLocationOutline } from "react-icons/io5";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import ManualAddress from "./ManualAddress";
import PublishOptionsModal from "./PublishOptionsModal";
import { getIsBrowserSupported } from "@/redux/reducer/locationSlice";
import { getIsPaidApi } from "@/redux/reducer/settingSlice";
import { getLocationApi } from "@/utils/api";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { t } from "@/utils";
import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import { useUserLocation } from "@/hooks/useUserLocation";
import { MdCheckCircle, MdInfoOutline, MdEditLocation } from "react-icons/md";

// Default koordinate za BiH (Sarajevo)
const BIH_DEFAULT_COORDS = {
  lat: 43.8563,
  long: 18.4131,
};
 
const MapComponent = dynamic(() => import("@/components/Common/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Učitavam mapu...</p>
      </div>
    </div>
  ),
});

// Session storage key za čuvanje lokacije tokom ad-listing procesa
const AD_LOCATION_SESSION_KEY = "ad_listing_location";
const AD_BIH_LOCATION_SESSION_KEY = "ad_listing_bih_location";
 
const ComponentFive = ({
  location,
  setLocation,
  handleFullSubmission,
  isAdPlaced,
  handleGoBack,
  setScheduledAt,
}) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const isBrowserSupported = useSelector(getIsBrowserSupported);
  const [IsGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const IsPaidApi = useSelector(getIsPaidApi);
  
  // BiH Location system
  const { userLocation, hasLocation, getLocationForAd, getFormattedAddress } = useUserLocation();
  const [bihLocation, setBihLocation] = useState({
    entityId: null,
    regionId: null,
    municipalityId: null,
    address: "",
    formattedAddress: "",
  });
  const [profileLocationApplied, setProfileLocationApplied] = useState(false);
  const [useManualLocation, setUseManualLocation] = useState(false);
  const initialLoadDone = useRef(false);

  // Učitaj sačuvanu lokaciju iz sessionStorage pri mount-u
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    try {
      // Prvo pokušaj učitati iz sessionStorage (ako je već bila odabrana)
      const savedLocation = sessionStorage.getItem(AD_LOCATION_SESSION_KEY);
      const savedBihLocation = sessionStorage.getItem(AD_BIH_LOCATION_SESSION_KEY);
      
      if (savedLocation) {
        const parsed = JSON.parse(savedLocation);
        if (parsed?.city) {
          setLocation(parsed);
          if (savedBihLocation) {
            setBihLocation(JSON.parse(savedBihLocation));
          }
          setProfileLocationApplied(true);
          return; // Imamo sačuvanu lokaciju, ne trebamo profil
        }
      }

      // Ako nema sačuvane lokacije, učitaj iz profila
      if (hasLocation && userLocation && !location?.city) {
        setBihLocation(userLocation);
        const adLocation = getLocationForAd();
        if (adLocation) {
          // Dodaj default koordinate za BiH
          const locationWithCoords = {
            ...adLocation,
            lat: adLocation.lat || BIH_DEFAULT_COORDS.lat,
            long: adLocation.long || BIH_DEFAULT_COORDS.long,
          };
          setLocation(locationWithCoords);
          setProfileLocationApplied(true);
          
          // Sačuvaj u sessionStorage
          sessionStorage.setItem(AD_LOCATION_SESSION_KEY, JSON.stringify(locationWithCoords));
          sessionStorage.setItem(AD_BIH_LOCATION_SESSION_KEY, JSON.stringify(userLocation));
        }
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
    }
  }, [hasLocation, userLocation]);

  // Sync BiH location sa glavnom lokacijom
  const handleBihLocationChange = (newBihLocation) => {
    setBihLocation(newBihLocation);
    
    if (newBihLocation?.municipalityId) {
      const { getFullLocationFromMunicipalityId } = require("@/lib/bih-locations");
      const fullLocation = getFullLocationFromMunicipalityId(newBihLocation.municipalityId);
      
      if (fullLocation) {
        const formattedAddress = newBihLocation.address 
          ? `${newBihLocation.address}, ${fullLocation.formatted}`
          : fullLocation.formatted;
        
        const newLocation = {
          country: "Bosna i Hercegovina",
          state: fullLocation.region?.name || "",
          city: fullLocation.municipality?.name || "",
          address: formattedAddress,
          lat: BIH_DEFAULT_COORDS.lat,
          long: BIH_DEFAULT_COORDS.long,
          formattedAddress: formattedAddress,
          address_translated: formattedAddress,
        };
        
        setLocation(newLocation);
        
        // Sačuvaj u sessionStorage
        sessionStorage.setItem(AD_LOCATION_SESSION_KEY, JSON.stringify(newLocation));
        sessionStorage.setItem(AD_BIH_LOCATION_SESSION_KEY, JSON.stringify(newBihLocation));
      }
    }
  };

  // Reset lokacije i omogući odabir nove
  const handleChangeLocation = () => {
    setProfileLocationApplied(false);
    setUseManualLocation(false);
    setBihLocation({
      entityId: null,
      regionId: null,
      municipalityId: null,
      address: "",
      formattedAddress: "",
    });
    setLocation({});
    sessionStorage.removeItem(AD_LOCATION_SESSION_KEY);
    sessionStorage.removeItem(AD_BIH_LOCATION_SESSION_KEY);
  };

  // Omogući ručni unos lokacije
  const handleEnableManualLocation = () => {
    setUseManualLocation(true);
    setProfileLocationApplied(false);
    setBihLocation({});
    setLocation({});
    sessionStorage.removeItem(AD_LOCATION_SESSION_KEY);
    sessionStorage.removeItem(AD_BIH_LOCATION_SESSION_KEY);
  };
 
  const getLocationWithMap = async (pos) => {
    try {
      const { lat, lng } = pos;
      const response = await getLocationApi.getLocation({
        lat,
        lng,
        lang: IsPaidApi ? "en" : CurrentLanguage?.code,
      });
 
      if (response?.data.error === false) {
        let newLocation;
        if (IsPaidApi) {
          let city = "";
          let state = "";
          let country = "";
          const results = response?.data?.data?.results;
          results?.forEach((result) => {
            const addressComponents = result.address_components;
            const getAddressComponent = (type) => {
              const component = addressComponents.find((comp) =>
                comp.types.includes(type)
              );
              return component ? component.long_name : "";
            };
            if (!city) city = getAddressComponent("locality");
            if (!state)
              state = getAddressComponent("administrative_area_level_1");
            if (!country) country = getAddressComponent("country");
          });
          newLocation = {
            lat,
            long: lng,
            city,
            state,
            country,
            address: [city, state, country].filter(Boolean).join(", "),
          };
        } else {
          const results = response?.data?.data;
          const address_translated = [
            results?.area_translation,
            results?.city_translation,
            results?.state_translation,
            results?.country_translation,
          ]
            .filter(Boolean)
            .join(", ");
          const formattedAddress = [
            results?.area,
            results?.city,
            results?.state,
            results?.country,
          ]
            .filter(Boolean)
            .join(", ");
 
          newLocation = {
            lat: results?.latitude,
            long: results?.longitude,
            city: results?.city || "",
            state: results?.state || "",
            country: results?.country || "",
            area: results?.area || "",
            areaId: results?.area_id || "",
            address: formattedAddress,
            address_translated,
          };
        }
        
        setLocation(newLocation);
        setUseManualLocation(true);
        sessionStorage.setItem(AD_LOCATION_SESSION_KEY, JSON.stringify(newLocation));
      } else {
        toast.error("Došlo je do greške");
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
      toast.error("Došlo je do greške");
    }
  };
 
  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      setIsGettingCurrentLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await getLocationApi.getLocation({
              lat: latitude,
              lng: longitude,
              lang: IsPaidApi ? "en" : CurrentLanguage?.code,
            });
            if (response?.data.error === false) {
              let newLocation;
              if (IsPaidApi) {
                let city = "";
                let state = "";
                let country = "";
                const results = response?.data?.data?.results;
                results?.forEach((result) => {
                  const addressComponents = result.address_components;
                  const getAddressComponent = (type) => {
                    const component = addressComponents.find((comp) =>
                      comp.types.includes(type)
                    );
                    return component ? component.long_name : "";
                  };
                  if (!city) city = getAddressComponent("locality");
                  if (!state)
                    state = getAddressComponent("administrative_area_level_1");
                  if (!country) country = getAddressComponent("country");
                });
 
                newLocation = {
                  lat: latitude,
                  long: longitude,
                  city,
                  state,
                  country,
                  address: [city, state, country].filter(Boolean).join(", "),
                };
              } else {
                const result = response?.data?.data;
                newLocation = {
                  areaId: result?.area_id,
                  area: result?.area,
                  city: result?.city,
                  state: result?.state,
                  country: result?.country,
                  lat: result?.latitude,
                  long: result?.longitude,
                  address: [
                    result?.area,
                    result?.city,
                    result?.state,
                    result?.country,
                  ]
                    .filter(Boolean)
                    .join(", "),
                  address_translated: [
                    result?.area_translation,
                    result?.city_translation,
                    result?.state_translation,
                    result?.country_translation,
                  ]
                    .filter(Boolean)
                    .join(", "),
                };
              }
              
              setLocation(newLocation);
              setUseManualLocation(true);
              sessionStorage.setItem(AD_LOCATION_SESSION_KEY, JSON.stringify(newLocation));
            } else {
              toast.error("Došlo je do greške");
            }
          } catch (error) {
            console.error("Error fetching location data:", error);
            toast.error("Došlo je do greške");
          } finally {
            setIsGettingCurrentLocation(false);
          }
        },
        (error) => {
          toast.error("Lokacija nije dozvoljena");
          setIsGettingCurrentLocation(false);
        }
      );
    } else {
      toast.error("Geolokacija nije podržana");
    }
  };

  // Handler za ManualAddress callback
  const handleManualAddressSet = (newLocation) => {
    setLocation(newLocation);
    setUseManualLocation(true);
    sessionStorage.setItem(AD_LOCATION_SESSION_KEY, JSON.stringify(newLocation));
  };
 
  const handlePublishClick = () => {
    if (
      !location?.country ||
      !location?.state ||
      !location?.city ||
      !location?.address
    ) {
      toast.error(t("pleaseSelectCity"));
      return;
    }
    setShowPublishModal(true);
  };
 
  const handlePublishNow = () => {
    if (setScheduledAt) {
      setScheduledAt(null);
    }
    setShowPublishModal(false);
    // Očisti sessionStorage nakon uspješne objave
    sessionStorage.removeItem(AD_LOCATION_SESSION_KEY);
    sessionStorage.removeItem(AD_BIH_LOCATION_SESSION_KEY);
    handleFullSubmission();
  };
 
  const handleSchedule = (scheduledDateTime) => {
    if (setScheduledAt) {
      setScheduledAt(scheduledDateTime);
    }
    setShowPublishModal(false);
    sessionStorage.removeItem(AD_LOCATION_SESSION_KEY);
    sessionStorage.removeItem(AD_BIH_LOCATION_SESSION_KEY);
    handleFullSubmission(scheduledDateTime);
  };

  // Da li prikazati BiH selector (profil lokacija ili novi odabir)
  const showBiHSelector = !useManualLocation && (!profileLocationApplied || !location?.city);
  // Da li prikazati ručni unos
  const showManualOptions = useManualLocation || (!profileLocationApplied && !hasLocation);
 
  return (
    <>
      <div className="flex flex-col gap-6 pb-24">
        
        {/* Prikaz ako je lokacija preuzeta iz profila ili već odabrana */}
        {profileLocationApplied && location?.city && !useManualLocation && (
          <div className="flex items-start gap-4 bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="bg-green-500 p-2 rounded-lg">
              <MdCheckCircle className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800">
                {hasLocation ? "Lokacija preuzeta iz profila" : "Lokacija odabrana"}
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {location?.address || location?.formattedAddress || getFormattedAddress()}
              </p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleChangeLocation}
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  Promijeni lokaciju
                </button>
                <button
                  onClick={handleEnableManualLocation}
                  className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                >
                  <MdEditLocation size={16} />
                  Koristi drugu lokaciju za ovaj oglas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BiH Location Selector */}
        {showBiHSelector && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <IoLocationOutline className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Lokacija oglasa</h3>
                  <p className="text-sm text-gray-500">Gdje se nalazi vaš artikal?</p>
                </div>
              </div>
              
              {/* Opcija za ručni unos */}
              <button
                onClick={handleEnableManualLocation}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <MdEditLocation size={18} />
                Ručni unos
              </button>
            </div>
            
            <BiHLocationSelector
              value={bihLocation}
              onChange={handleBihLocationChange}
              showAddress={true}
              label=""
            />
          </div>
        )}

        {/* Info ako nema sačuvane lokacije u profilu */}
        {!hasLocation && !location?.city && !useManualLocation && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <MdInfoOutline className="text-amber-600 mt-0.5 shrink-0" size={20} />
            <div>
              <p className="text-sm text-amber-800 font-medium">Savjet</p>
              <p className="text-xs text-amber-700 mt-1">
                Postavite svoju lokaciju u profilu i ona će se automatski popuniti prilikom svakog novog oglasa. 
                Nećete morati svaki put ponovo unositi lokaciju!
              </p>
            </div>
          </div>
        )}

        {/* Ručni unos lokacije sekcija */}
        {useManualLocation && (
          <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <MdEditLocation className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Ručni unos lokacije</h3>
                  <p className="text-sm text-gray-500">Unesite lokaciju specifičnu za ovaj oglas</p>
                </div>
              </div>
              
              {hasLocation && (
                <button
                  onClick={() => {
                    setUseManualLocation(false);
                    setProfileLocationApplied(false);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Koristi profil lokaciju
                </button>
              )}
            </div>

            {/* Mapa i geolokacija */}
            {isBrowserSupported && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <FaLocationCrosshairs className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Pronađi moju lokaciju</h4>
                    <p className="text-sm text-gray-600">Automatski dohvati GPS koordinate</p>
                  </div>
                </div>
                <button
                  onClick={getCurrentLocation}
                  disabled={IsGettingCurrentLocation}
                  className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                    IsGettingCurrentLocation ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  }`}
                >
                  <FaLocationCrosshairs size={16} />
                  {IsGettingCurrentLocation ? "Pronalazim..." : "Pronađi me"}
                </button>
              </div>
            )}

            {/* Mapa */}
            <div className="rounded-xl overflow-hidden border border-gray-200 mb-4">
              <MapComponent
                location={location}
                getLocationWithMap={getLocationWithMap}
              />
            </div>

            {/* Ili ručni dropdown unos */}
            <div className="text-center">
              <button
                className="px-4 py-2 flex items-center gap-2 mx-auto bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-all"
                onClick={() => setShowManualAddress(true)}
              >
                <IoLocationOutline size={18} />
                Dodaj lokaciju putem dropdown menija
              </button>
            </div>
          </div>
        )}

        {/* Prikaz odabrane adrese */}
        {location?.city && (
          <div className="flex items-start gap-4 bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <BiMapPin className="text-blue-600" size={28} />
            </div>
            <div className="flex-1">
              <h6 className="font-semibold text-gray-800 text-lg mb-1">Adresa oglasa</h6>
              <p className="text-gray-600">
                {location?.address_translated || location?.address}
              </p>
            </div>
          </div>
        )}

        {/* Mapa za BiH lokaciju (ne ručni unos) */}
        {!useManualLocation && location?.city && (
          <>
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200"></div>
              <div className="relative bg-white text-gray-500 text-sm font-medium rounded-full px-4 py-1.5 border border-gray-200">
                Opcionalno: precizna lokacija na mapi
              </div>
            </div>

            <div className="rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
              <MapComponent
                location={location}
                getLocationWithMap={(pos) => {
                  getLocationWithMap(pos);
                  setUseManualLocation(true);
                }}
              />
            </div>
          </>
        )}
      </div>
 
      {/* Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between sm:justify-end gap-3">
          <button
            className="bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-gray-800 transition-colors shadow-md flex-1 sm:flex-none"
            onClick={handleGoBack}
          >
            Nazad
          </button>
          <button
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium transition-all shadow-md flex-1 sm:flex-none ${
              isAdPlaced
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
            disabled={isAdPlaced}
            onClick={handlePublishClick}
          >
            {isAdPlaced ? "Postavljam..." : "Objavi oglas"}
          </button>
        </div>
      </div>
 
      <ManualAddress
        key={showManualAddress}
        showManualAddress={showManualAddress}
        setShowManualAddress={setShowManualAddress}
        setLocation={handleManualAddressSet}
      />
 
      <PublishOptionsModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublishNow={handlePublishNow}
        onSchedule={handleSchedule}
        isSubmitting={isAdPlaced}
      />
    </>
  );
};
 
export default ComponentFive;
