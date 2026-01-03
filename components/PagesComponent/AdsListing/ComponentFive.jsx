import { useState } from "react";
import { FaLocationCrosshairs } from "react-icons/fa6";
import dynamic from "next/dynamic";
import { BiMapPin } from "react-icons/bi";
import { IoLocationOutline } from "react-icons/io5";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import ManualAddress from "./ManualAddress";
import { getIsBrowserSupported } from "@/redux/reducer/locationSlice";
import { getIsPaidApi } from "@/redux/reducer/settingSlice";
import { getLocationApi } from "@/utils/api";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { t } from "@/utils";

const MapComponent = dynamic(() => import("@/components/Common/MapComponent"), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-100 rounded-lg" />,
});

const ComponentFive = ({
  location,
  setLocation,
  handleFullSubmission,
  isAdPlaced,
  handleGoBack,
}) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const isBrowserSupported = useSelector(getIsBrowserSupported);
  const [IsGettingCurrentLocation, setIsGettingCurrentLocation] =
    useState(false);
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
        toast.error(t("errorOccurred"));
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
      toast.error(t("errorOccurred"));
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
              toast.error(t("errorOccurred"));
            }
          } catch (error) {
            console.error("Error fetching location data:", error);
            toast.error(t("errorOccurred"));
          } finally {
            setIsGettingCurrentLocation(false);
          }
        },
        (error) => {
          toast.error(t("locationNotGranted"));
          setIsGettingCurrentLocation(false);
        }
      );
    } else {
      toast.error(t("geoLocationNotSupported"));
    }
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        {isBrowserSupported && (
          <div className="flex justify-between items-center">
            <span className="text-xl font-medium">{t("addLocation")}</span>
            <button
              onClick={getCurrentLocation}
              disabled={IsGettingCurrentLocation}
            >
              <span className="bg-primary p-2 text-white gap-2 flex items-center rounded-md ">
                <FaLocationCrosshairs size={20} />
                {IsGettingCurrentLocation ? t("loading") : t("locateMe")}
              </span>
            </button>
          </div>
        )}
        <div className="flex gap-8 flex-col">
          <MapComponent
            location={location}
            getLocationWithMap={getLocationWithMap}
          />
          <div className="flex items-center gap-3 bg-muted rounded-lg p-4  ">
            <div className="p-5 rounded-md bg-white">
              <BiMapPin className="text-primary" size={32} />
            </div>
            <span className="flex flex-col gap-1">
              <h6 className="font-medium">{t("address")}</h6>
              {location?.address_translated || location?.address ? (
                <p>{location?.address_translated || location?.address}</p>
              ) : (
                t("addYourAddress")
              )}
            </span>
          </div>
        </div>

        {!IsPaidApi && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#d3d3d3]"></div>
              <div className="relative bg-muted text-black text-base font-medium rounded-full w-12 h-12 flex items-center justify-center uppercase">
                {t("or")}
              </div>
            </div>
            <div className="flex flex-col gap-3 items-center justify-center">
              <p className="text-xl font-semibold">
                {t("whatLocAdYouSelling")}
              </p>
              <button
                className="p-2 flex items-center gap-2 border rounded-md font-medium"
                onClick={() => setShowManualAddress(true)}
              >
                <IoLocationOutline size={20} />
                {t("addLocation")}
              </button>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3">
          <button
            className="bg-black text-white px-4 py-2 rounded-md text-xl font-light"
            onClick={handleGoBack}
          >
            {t("back")}
          </button>
          <button
            className="bg-primary text-white px-4 py-2 rounded-md text-xl font-light disabled:bg-muted-foreground"
            disabled={isAdPlaced}
            onClick={handleFullSubmission}
          >
            {isAdPlaced ? t("posting") : t("postNow")}
          </button>
        </div>
      </div>
      <ManualAddress
        key={showManualAddress}
        showManualAddress={showManualAddress}
        setShowManualAddress={setShowManualAddress}
        setLocation={setLocation}
      />
    </>
  );
};

export default ComponentFive;
