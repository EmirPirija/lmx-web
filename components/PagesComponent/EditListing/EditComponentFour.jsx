import { useState, useEffect } from "react";
import { BiMapPin } from "react-icons/bi";
import { IoLocationOutline } from "react-icons/io5";
import { toast } from "sonner";
import ManualAddress from "../AdsListing/ManualAddress";
import PublishOptionsModal from "../AdsListing/PublishOptionsModal";
import { t } from "@/utils";
import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import { useUserLocation } from "@/hooks/useUserLocation";
import { MdCheckCircle, MdEditLocation } from "react-icons/md";

// Default koordinate za BiH (Sarajevo) - backend zahtijeva lat/long
const BIH_DEFAULT_COORDS = {
  lat: 43.8563,
  long: 18.4131,
};

const EditComponentFour = ({
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
  const { userLocation, hasLocation, getFormattedAddress, convertApiLocationToBiH } = useUserLocation();
  const [bihLocation, setBihLocation] = useState({
    entityId: null,
    regionId: null,
    municipalityId: null,
    address: "",
    formattedAddress: "",
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicijaliziraj lokaciju iz postojećeg oglasa
  useEffect(() => {
    if (isInitialized) return;
    
    if (location?.city) {
      // Osiguraj da ima koordinate
      if (!location.lat || !location.long) {
        setLocation(prev => ({
          ...prev,
          lat: BIH_DEFAULT_COORDS.lat,
          long: BIH_DEFAULT_COORDS.long,
        }));
      }
      
      // Pokušaj konvertovati u BiH format
      const converted = convertApiLocationToBiH(location);
      if (converted) {
        setBihLocation(converted);
      }
      setIsInitialized(true);
    }
  }, [location?.city, isInitialized]);

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
            lat: location?.lat || BIH_DEFAULT_COORDS.lat,
            long: location?.long || BIH_DEFAULT_COORDS.long,
            formattedAddress: formattedAddr,
            address_translated: formattedAddr,
          });
          setShowLocationPicker(false);
        }
      } catch (error) {
        console.error("Error setting location:", error);
      }
    }
  };

  // Koristi profil lokaciju
  const handleUseProfileLocation = () => {
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
        setShowLocationPicker(false);
      }
    } catch (error) {
      console.error("Error loading profile location:", error);
    }
  };

  // Handler za ManualAddress (dropdown)
  const handleManualAddressSet = (newLocation) => {
    const locationWithCoords = {
      ...newLocation,
      lat: newLocation.lat || BIH_DEFAULT_COORDS.lat,
      long: newLocation.long || BIH_DEFAULT_COORDS.long,
    };
    setLocation(locationWithCoords);
    setShowManualAddress(false);
    setShowLocationPicker(false);
  };

  // Publish handlers
  const handlePublishClick = () => {
    if (!location?.country || !location?.state || !location?.city || !location?.address) {
      toast.error(t("pleaseSelectCity"));
      return;
    }
    
    // Osiguraj koordinate
    if (!location.lat || !location.long) {
      setLocation(prev => ({
        ...prev,
        lat: BIH_DEFAULT_COORDS.lat,
        long: BIH_DEFAULT_COORDS.long,
      }));
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

        {/* Trenutna lokacija oglasa */}
        {location?.city && !showLocationPicker && (
          <div className="flex items-start gap-4 bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="bg-green-500 p-2 rounded-lg">
              <MdCheckCircle className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800">Lokacija oglasa</h3>
              <p className="text-sm text-green-700 mt-1">
                {location?.address_translated || location?.address}
              </p>
              <button
                onClick={() => setShowLocationPicker(true)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <MdEditLocation size={18} />
                Promijeni lokaciju
              </button>
            </div>
          </div>
        )}

        {/* Odabir nove lokacije */}
        {(showLocationPicker || !location?.city) && (
          <>
            {/* Profil lokacija opcija */}
            {hasLocation && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <MdCheckCircle className="text-blue-600 mt-0.5 shrink-0" size={20} />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium">Koristi lokaciju iz profila</p>
                  <p className="text-xs text-blue-700 mt-1">{getFormattedAddress()}</p>
                  <button
                    onClick={handleUseProfileLocation}
                    className="mt-2 text-sm text-blue-700 hover:text-blue-900 font-semibold underline"
                  >
                    Koristi ovu lokaciju
                  </button>
                </div>
              </div>
            )}

            {/* BiH Location Selector */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <IoLocationOutline className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Odaberite novu lokaciju</h3>
                    <p className="text-sm text-gray-500">Izaberite entitet, kanton/regiju i grad</p>
                  </div>
                </div>
                
                {location?.city && (
                  <button
                    onClick={() => setShowLocationPicker(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Odustani
                  </button>
                )}
              </div>
              
              <BiHLocationSelector
                value={bihLocation}
                onChange={handleBihLocationChange}
                showAddress={true}
                label=""
              />

              {/* Alternativa - ručni dropdown */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowManualAddress(true)}
                  className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-all"
                >
                  <IoLocationOutline size={20} />
                  Ili odaberi putem dropdown menija (država/grad/općina)
                </button>
              </div>
            </div>
          </>
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
            {isAdPlaced ? "Spremam..." : "Spremi izmjene"}
          </button>
        </div>
      </div>

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

export default EditComponentFour;
