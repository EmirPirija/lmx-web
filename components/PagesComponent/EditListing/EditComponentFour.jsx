import { useState } from "react";
import { FaLocationCrosshairs } from "react-icons/fa6";
import dynamic from "next/dynamic";
import { BiMapPin } from "react-icons/bi";
import { IoLocationOutline } from "react-icons/io5";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import ManualAddress from "../AdsListing/ManualAddress";
import PublishOptionsModal from "../AdsListing/PublishOptionsModal";
import { getIsBrowserSupported } from "@/redux/reducer/locationSlice";
import { getIsPaidApi } from "@/redux/reducer/settingSlice";
import { getLocationApi } from "@/utils/api";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { t } from "@/utils";
 
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
 
const EditComponentFour = ({
  location,
  setLocation,
  handleFullSubmission,
  isAdPlaced,
  handleGoBack,
  // NOVO: opcioni prop za scheduled_at
  setScheduledAt,
}) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const isBrowserSupported = useSelector(getIsBrowserSupported);
  const [IsGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const IsPaidApi = useSelector(getIsPaidApi);
 
  const getLocationWithMap = async (pos) => {
    try {
      const { lat, lng } = pos;
      const response = await getLocationApi.getLocation({
        lat,
        lng,
        lang: IsPaidApi ? "en" : CurrentLanguage?.code,
      });
 
      if (response?.data.error === false) {
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
          const locationData = {
            lat,
            long: lng,
            city,
            state,
            country,
            address: [city, state, country].filter(Boolean).join(", "),
          };
          setLocation(locationData);
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
 
          const cityData = {
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
          setLocation(cityData);
        }
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
 
                const cityData = {
                  lat: latitude,
                  long: longitude,
                  city,
                  state,
                  country,
                  address: [city, state, country].filter(Boolean).join(", "),
                };
                setLocation(cityData);
              } else {
                const result = response?.data?.data;
                const cityData = {
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
                setLocation(cityData);
              }
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
 
  // Handler za klik na dugme "Objavi"
  const handlePublishClick = () => {
    // Provjeri da li je lokacija unijeta
    if (
      !location?.country ||
      !location?.state ||
      !location?.city ||
      !location?.address
    ) {
      toast.error(t("pleaseSelectCity"));
      return;
    }
    // Otvori modal
    setShowPublishModal(true);
  };
 
  // Handler za "Objavi odmah"
  const handlePublishNow = () => {
    if (setScheduledAt) {
      setScheduledAt(null);
    }
    setShowPublishModal(false);
    handleFullSubmission(selectedDateTime)

  };
 
  // Handler za "Zakaži objavu"
  const handleSchedule = (scheduledDateTime) => {
    if (setScheduledAt) {
      setScheduledAt(scheduledDateTime);
      console.log('NOW ISO:', new Date().toISOString());
console.log('SCHEDULED ISO:', scheduledDateTime);
console.log('DIFF MIN:', (new Date(scheduledDateTime) - new Date()) / 60000);
console.log('SCHEDULED LOCAL:', new Date(scheduledDateTime).toString());

    }
    setShowPublishModal(false);
    handleFullSubmission(scheduledDateTime);
  };
 
  return (
    <>
      <div className="flex flex-col gap-8 pb-24">
        {isBrowserSupported && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-3 rounded-xl">
                <FaLocationCrosshairs className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Dodajte lokaciju</h3>
                <p className="text-sm text-gray-600">Omogućite automatsko pronalaženje vaše lokacije</p>
              </div>
            </div>
            <button
              onClick={getCurrentLocation}
              disabled={IsGettingCurrentLocation}
              className={`bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg ${
                IsGettingCurrentLocation ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              }`}
            >
              <FaLocationCrosshairs size={20} />
              {IsGettingCurrentLocation ? "Pronalazim..." : "Pronađi me"}
            </button>
          </div>
        )}
 
        <div className="flex gap-6 flex-col">
          <div className="rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
            <MapComponent
              location={location}
              getLocationWithMap={getLocationWithMap}
            />
          </div>
          
          <div className="flex items-start gap-4 bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
              <BiMapPin className="text-blue-600" size={32} />
            </div>
            <div className="flex-1">
              <h6 className="font-semibold text-gray-800 text-lg mb-2">Adresa</h6>
              {location?.address_translated || location?.address ? (
                <p className="text-gray-600 leading-relaxed">
                  {location?.address_translated || location?.address}
                </p>
              ) : (
                <p className="text-gray-400 italic">Dodajte vašu adresu koristeći mapu ili ručno</p>
              )}
            </div>
          </div>
        </div>
 
        {!IsPaidApi && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200"></div>
              <div className="relative bg-white text-gray-600 text-sm font-semibold rounded-full px-4 py-2 border-2 border-gray-200 uppercase">
                ili
              </div>
            </div>
            
            <div className="flex flex-col gap-4 items-center justify-center bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
              <IoLocationOutline size={48} className="text-gray-400" />
              <p className="text-xl font-semibold text-gray-800 text-center">
                Na kojoj lokaciji prodajete artikal?
              </p>
              <button
                className="px-6 py-3 flex items-center gap-3 bg-white border-2 border-gray-300 hover:border-blue-500 rounded-xl font-semibold text-gray-700 hover:text-blue-600 transition-all shadow-sm hover:shadow-md hover:scale-105"
                onClick={() => setShowManualAddress(true)}
              >
                <IoLocationOutline size={22} />
                Dodaj lokaciju ručno
              </button>
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
            {isAdPlaced ? "Spremam..." : "Spremi izmjene"}
          </button>
        </div>
      </div>
 
      <ManualAddress
        key={showManualAddress}
        showManualAddress={showManualAddress}
        setShowManualAddress={setShowManualAddress}
        setLocation={setLocation}
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