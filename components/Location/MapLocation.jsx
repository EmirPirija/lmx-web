import { DialogTitle } from "@radix-ui/react-dialog";
import { DialogFooter, DialogHeader } from "../ui/dialog";
import { t } from "@/utils";
import { MdArrowBack } from "react-icons/md";
import { IoSearch } from "react-icons/io5";
import SearchAutocomplete from "./SearchAutocomplete";
import { BiCurrentLocation } from "react-icons/bi";
import { useState } from "react";
import { getLocationApi } from "@/utils/api";
import { getMaxRange, getMinRange } from "@/redux/reducer/settingSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  getIsBrowserSupported,
  getKilometerRange,
  resetCityData,
  saveCity,
  setKilometerRange,
} from "@/redux/reducer/locationSlice";
import { Slider } from "../ui/slider";
import dynamic from "next/dynamic";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { CurrentLanguageData, getIsRtl } from "@/redux/reducer/languageSlice";
import { useNavigate } from "../Common/useNavigate";

const GetLocationWithMap = dynamic(() => import("./GetLocationWithMap"), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-gray-100 rounded-lg" />,
});

const MapLocation = ({
  OnHide,
  selectedCity,
  setSelectedCity,
  setIsMapLocation,
  IsPaidApi,
}) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const dispatch = useDispatch();
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const radius = useSelector(getKilometerRange);
  const [KmRange, setKmRange] = useState(radius || 0);
  const [IsFetchingLocation, setIsFetchingLocation] = useState(false);
  const min_range = useSelector(getMinRange);
  const max_range = useSelector(getMaxRange);
  const IsBrowserSupported = useSelector(getIsBrowserSupported);
  const isRTL = useSelector(getIsRtl);

  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      setIsFetchingLocation(true);
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
                  formattedAddress: [city, state, country]
                    .filter(Boolean)
                    .join(", "),
                };
                setSelectedCity(cityData);
              } else {
                const result = response?.data?.data;
                const cityData = {
                  areaId: result?.area_id,
                  area: result?.area_translation,
                  city: result?.city_translation,
                  state: result?.state_translation,
                  country: result?.country_translation,
                  lat: result?.latitude,
                  long: result?.longitude,
                  formattedAddress: [
                    result?.area_translation,
                    result?.city_translation,
                    result?.state_translation,
                    result?.country_translation,
                  ]
                    .filter(Boolean)
                    .join(", "),
                };
                setSelectedCity(cityData);
              }
            }
          } catch (error) {
            console.error("Error fetching location data:", error);
            toast.error(t("errorOccurred"));
          } finally {
            setIsFetchingLocation(false);
          }
        },
        (error) => {
          console.log(error);
          toast.error(t("locationNotGranted"));
          setIsFetchingLocation(false);
        }
      );
    } else {
      toast.error(t("geoLocationNotSupported"));
    }
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
            lat,
            long: lng,
            city,
            state,
            country,
            formattedAddress: [city, state, country].filter(Boolean).join(", "),
          };

          setSelectedCity(cityData);
        } else {
          const results = response?.data?.data;
          const formattedAddress = [
            results?.area_translation,
            results?.city_translation,
            results?.state_translation,
            results?.country_translation,
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
            formattedAddress,
          };
          setSelectedCity(cityData);
        }
      } else {
        toast.error(t("errorOccurred"));
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    }
  };

  const handleSave = () => {
    const isInvalidLocation = !selectedCity?.lat || !selectedCity?.long;
    if (isInvalidLocation) {
      toast.error(t("pleaseSelectLocation"));
      return;
    }
    dispatch(setKilometerRange(KmRange));
    saveCity(selectedCity);
    toast.success(t("locationSaved"));
    OnHide();
    // avoid redirect if already on home page otherwise router.push triggering server side api calls
    if (pathname !== "/") {
      navigate("/");
    }
  };

  const handleReset = () => {
    resetCityData();
    min_range > 0
      ? dispatch(setKilometerRange(min_range))
      : dispatch(setKilometerRange(0));
    OnHide();
    // avoid redirect if already on home page otherwise router.push triggering server side api calls
    if (pathname !== "/") {
      navigate("/");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-semibold text-xl">
          {!IsPaidApi && (
            <button onClick={() => setIsMapLocation(false)}>
              <MdArrowBack size={20} className="rtl:scale-x-[-1]" />
            </button>
          )}

          {selectedCity?.formattedAddress ? (
            <p>{selectedCity?.formattedAddress}</p>
          ) : (
            t("addYourAddress")
          )}
        </DialogTitle>
      </DialogHeader>
      <div className="flex items-center border rounded-md">
        <div className="flex-[3] sm:flex-[2]">
          <div className="flex items-center gap-2 rounded-sm py-2 px-4 relative">
            <IoSearch className="size-5 text-primary" />
            <SearchAutocomplete
              saveOnSuggestionClick={false}
              OnHide={OnHide}
              setSelectedLocation={setSelectedCity}
            />
          </div>
        </div>

        {IsBrowserSupported && (
          <>
            <div className="border-r h-full" />
            <button
              className="flex-1 flex items-center justify-center"
              onClick={getCurrentLocation}
            >
              <div className="flex items-center gap-2 py-2 px-4">
                <BiCurrentLocation className="size-5 shrink-0" />
                <span className="text-sm text-balance hidden sm:inline">
                  {IsFetchingLocation
                    ? t("gettingLocation")
                    : t("currentLocation")}
                </span>
              </div>
            </button>
          </>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Odabrana lokacija</p>
          <p className="text-sm font-semibold text-slate-800">
            {selectedCity?.formattedAddress || "Nije postavljena"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Radijus</p>
          <p className="text-sm font-semibold text-slate-800">{KmRange} KM</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Savjet</p>
          <p className="text-xs text-slate-600">
            Klikni mapu da preciziraš lokaciju ili koristi pretragu za adresu.
          </p>
        </div>
      </div>
      <GetLocationWithMap
        KmRange={KmRange}
        position={{ lat: selectedCity?.lat, lng: selectedCity?.long }}
        getLocationWithMap={getLocationWithMap}
      />
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 justify-between">
          <span>{t("rangeLabel")}</span>
          <span>{KmRange} KM</span>
        </div>
        <Slider
          value={[KmRange]}
          onValueChange={(value) => setKmRange(value[0])}
          max={max_range}
          min={min_range}
          step={1}
          dir={isRTL ? "rtl" : "ltr"}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={handleReset}>
          {t("reset")}
        </Button>
        <Button onClick={handleSave}>{t("save")}</Button>
      </DialogFooter>
    </>
  );
};

export default MapLocation;