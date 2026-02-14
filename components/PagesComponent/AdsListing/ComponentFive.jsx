import { useState, useEffect } from "react";
import { BiMapPin } from "@/components/Common/UnifiedIconPack";
import { IoLocationOutline } from "@/components/Common/UnifiedIconPack";
import { toast } from "@/utils/toastBs";
import ManualAddress from "./ManualAddress";
import PublishOptionsModal from "./PublishOptionsModal";
import { t } from "@/utils";
import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import { useUserLocation } from "@/hooks/useUserLocation";
import { MdCheckCircle, MdInfoOutline, MdEditLocation } from "@/components/Common/UnifiedIconPack";
import StickyActionButtons from "@/components/Common/StickyActionButtons";
 
// Default koordinate za BiH (Sarajevo) - backend zahtijeva lat/long
const BIH_DEFAULT_COORDS = {
  lat: 43.8563,
  long: 18.4131,
};
 
const ComponentFive = ({
  location,
  setLocation,
  handleFullSubmission,
  isAdPlaced,
  handleGoBack,
  setScheduledAt,
}) => {
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
  // BiH Location system
  const { userLocation, hasLocation, getFormattedAddress } = useUserLocation();
  const [bihLocation, setBihLocation] = useState({
    entityId: null,
    regionId: null,
    municipalityId: null,
    address: "",
    formattedAddress: "",
  });
  const [locationSource, setLocationSource] = useState("none"); // "profile", "manual", "none"
  const [isInitialized, setIsInitialized] = useState(false);
 
  // Učitaj lokaciju iz profila pri prvom renderovanju
  useEffect(() => {
    if (isInitialized) return;
    
    // Ako već ima lokacija (npr. vraćanje nazad), ne diraj
    if (location?.city) {
      setIsInitialized(true);
      setLocationSource("manual");
      return;
    }
 
    // Učitaj iz profila ako postoji
    if (hasLocation && userLocation?.municipalityId) {
      loadProfileLocation();
      setIsInitialized(true);
    }
  }, [hasLocation, userLocation?.municipalityId, location?.city, isInitialized]);
 
  // Funkcija za učitavanje lokacije iz profila
  const loadProfileLocation = () => {
    if (!userLocation?.municipalityId) return;
 
    try {
      const { getFullLocationFromMunicipalityId } = require("@/lib/bih-locations");
      const fullLocation = getFullLocationFromMunicipalityId(userLocation.municipalityId);
      
      if (fullLocation) {
        const formattedAddr = userLocation.address 
          ? `${userLocation.address}, ${fullLocation.formatted}`
          : fullLocation.formatted;
        
        setBihLocation(userLocation);
        setLocation({
          country: "Bosna i Hercegovina",
          state: fullLocation.region?.name || "",
          city: fullLocation.municipality?.name || "",
          address: formattedAddr,
          lat: BIH_DEFAULT_COORDS.lat,
          long: BIH_DEFAULT_COORDS.long,
          formattedAddress: formattedAddr,
          address_translated: formattedAddr,
        });
        setLocationSource("profile");
      }
    } catch (error) {
      console.error("Error loading profile location:", error);
    }
  };
 
  // Handler za BiH location promjenu
  const handleBihLocationChange = (newBihLocation) => {
    setBihLocation(newBihLocation);
    
    if (newBihLocation?.municipalityId) {
      try {
        const { getFullLocationFromMunicipalityId } = require("@/lib/bih-locations");
        const fullLocation = getFullLocationFromMunicipalityId(newBihLocation.municipalityId);
        
        if (fullLocation) {
          const formattedAddr = newBihLocation.address 
            ? `${newBihLocation.address}, ${fullLocation.formatted}`
            : fullLocation.formatted;
          
          setLocation({
            country: "Bosna i Hercegovina",
            state: fullLocation.region?.name || "",
            city: fullLocation.municipality?.name || "",
            address: formattedAddr,
            lat: BIH_DEFAULT_COORDS.lat,
            long: BIH_DEFAULT_COORDS.long,
            formattedAddress: formattedAddr,
            address_translated: formattedAddr,
          });
          setLocationSource("manual");
        }
      } catch (error) {
        console.error("Error setting location:", error);
      }
    }
  };
 
  // Reset i omogući ručni odabir
  const handleUseManualLocation = () => {
    setLocationSource("manual");
    setBihLocation({
      entityId: null,
      regionId: null,
      municipalityId: null,
      address: "",
      formattedAddress: "",
    });
    setLocation({});
  };
 
  // Vrati na profil lokaciju
  const handleUseProfileLocation = () => {
    loadProfileLocation();
  };
 
  // Handler za ManualAddress (dropdown)
  const handleManualAddressSet = (newLocation) => {
    // Dodaj default koordinate ako nema
    const locationWithCoords = {
      ...newLocation,
      lat: newLocation.lat || BIH_DEFAULT_COORDS.lat,
      long: newLocation.long || BIH_DEFAULT_COORDS.long,
    };
    setLocation(locationWithCoords);
    setLocationSource("manual");
    setShowManualAddress(false);
  };
 
  // Publish handlers
  const handlePublishClick = () => {
    if (!location?.country || !location?.state || !location?.city || !location?.address) {
      toast.error(t("pleaseSelectCity"));
      return;
    }
    setShowPublishModal(true);
  };
 
  const handlePublishNow = () => {
    if (setScheduledAt) setScheduledAt(null);
    setShowPublishModal(false);
    handleFullSubmission();
  };
 
  const handleSchedule = (scheduledDateTime) => {
    if (setScheduledAt) setScheduledAt(scheduledDateTime);
    setShowPublishModal(false);
    handleFullSubmission(scheduledDateTime);
  };
 
  return (
    <>
      <div className="flex flex-col gap-6 pb-24">
        
        {/* Ako je lokacija učitana iz profila */}
        {locationSource === "profile" && location?.city && (
          <div className="flex items-start gap-4 rounded-xl border-2 border-green-200 bg-green-50 p-4 dark:border-green-500/40 dark:bg-green-500/10">
            <div className="bg-green-500 p-2 rounded-lg">
              <MdCheckCircle className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Lokacija je preuzeta iz profila</h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-200">
                {location?.address || getFormattedAddress()}
              </p>
              <button
                onClick={handleUseManualLocation}
                className="mt-3 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
              >
                <MdEditLocation size={18} />
                Koristi drugu lokaciju za ovaj oglas
              </button>
            </div>
          </div>
        )}
 
        {/* Ako je ručno odabrana lokacija */}
        {locationSource === "manual" && location?.city && (
          <div className="flex items-start gap-4 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-500/40 dark:bg-blue-500/10">
            <div className="bg-blue-500 p-2 rounded-lg">
              <MdEditLocation className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Lokacija oglasa</h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-200">
                {location?.address_translated || location?.address}
              </p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleUseManualLocation}
                  className="text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  Promijeni lokaciju
                </button>
                {hasLocation && (
                  <button
                    onClick={handleUseProfileLocation}
                    className="text-sm text-green-600 underline hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
                  >
                    Koristi lokaciju iz profila
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
 
        {/* Odabir lokacije - prikaži ako nema lokacije ili je source "manual" bez odabrane lokacije */}
        {(locationSource === "none" || (locationSource === "manual" && !location?.city)) && (
          <>
            {/* Info ako ima profil lokacija */}
            {hasLocation && (
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-500/40 dark:bg-green-500/10">
                <MdCheckCircle className="text-green-600 mt-0.5 shrink-0" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Imate sačuvanu lokaciju u profilu</p>
                  <p className="mt-1 text-xs text-green-700 dark:text-green-300">{getFormattedAddress()}</p>
                  <button
                    onClick={handleUseProfileLocation}
                    className="mt-2 text-sm font-semibold text-green-700 underline hover:text-green-900 dark:text-green-200 dark:hover:text-green-100"
                  >
                    Koristi ovu lokaciju
                  </button>
                </div>
              </div>
            )}
 
            {/* BiH Location Selector */}
            <div className="rounded-xl border-2 border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <IoLocationOutline className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Odaberite lokaciju oglasa</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Gdje se nalazi vaš artikal?</p>
                </div>
              </div>
              
              <BiHLocationSelector
                value={bihLocation}
                onChange={handleBihLocationChange}
                showAddress={true}
                label=""
              />
 
              {/* Alternativa - ručni dropdown */}
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-slate-700">
                <button
                  onClick={() => setShowManualAddress(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-all hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  <IoLocationOutline size={20} />
                  Ili odaberite putem padajućeg izbornika (država/grad/općina)
                </button>
              </div>
            </div>
 
            {/* Info ako nema profil lokacije */}
            {!hasLocation && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
                <MdInfoOutline className="text-amber-600 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Savjet</p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                    Postavite svoju lokaciju u profilu i ona će se automatski popuniti prilikom svakog novog oglasa.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
 
        {/* Prikaz odabrane lokacije */}
        {location?.city && (
          <div className="flex items-start gap-4 rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/40 dark:bg-blue-500/10">
              <BiMapPin className="text-blue-600" size={28} />
            </div>
            <div className="flex-1">
              <h6 className="mb-1 text-lg font-semibold text-gray-800 dark:text-slate-100">Lokacija oglasa</h6>
              <p className="text-gray-600 dark:text-slate-300">
                {location?.address_translated || location?.address}
              </p>
            </div>
          </div>
        )}
      </div>
 
      {/* Sticky Action Buttons */}
      <StickyActionButtons
        secondaryLabel="Nazad"
        onSecondaryClick={handleGoBack}
        primaryLabel={isAdPlaced ? "Postavljam..." : "Objavi oglas"}
        onPrimaryClick={handlePublishClick}
        primaryDisabled={isAdPlaced}
      />
 
      {/* Manual Address Modal */}
      <ManualAddress
        key={showManualAddress ? "open" : "closed"}
        showManualAddress={showManualAddress}
        setShowManualAddress={setShowManualAddress}
        setLocation={handleManualAddressSet}
      />
 
      {/* Publish Options Modal */}
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
