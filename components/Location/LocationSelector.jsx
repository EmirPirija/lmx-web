import { useMemo, useState } from "react";
import {
  BiCurrentLocation,
  IoSearch,
  MapPin,
  MdArrowBack,
  MdOutlineKeyboardArrowRight,
  X,
} from "@/components/Common/UnifiedIconPack";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getLocationApi } from "@/utils/api";
import {
  getIsBrowserSupported,
  saveCity,
  setKilometerRange,
} from "@/redux/reducer/locationSlice";
import { useDispatch, useSelector } from "react-redux";
import { getMinRange } from "@/redux/reducer/settingSlice";
import { usePathname } from "next/navigation";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { useNavigate } from "../Common/useNavigate";
import {
  BIH_COUNTRY,
  POPULAR_CITIES,
  formatBiHAddress,
  getCities,
  getCityById,
  getMunicipalitiesByCity,
  searchLocations,
} from "@/lib/bih-locations";
import { AnimatePresence, motion } from "framer-motion";

const BIH_DEFAULT_COORDS = {
  lat: 43.8563,
  long: 18.4131,
};

const SECTION_TRANSITION = {
  type: "spring",
  stiffness: 320,
  damping: 30,
  mass: 0.85,
};

const buildLocationPayload = ({ city = null, municipality = null } = {}) => {
  const formattedAddress = city
    ? formatBiHAddress({ city, municipality })
    : BIH_COUNTRY.name;

  return {
    country: BIH_COUNTRY.name,
    state: municipality?.name || "",
    city: city?.name || "",
    area: "",
    lat: BIH_DEFAULT_COORDS.lat,
    long: BIH_DEFAULT_COORDS.long,
    location_source: "hierarchy",
    cityId: city?.id || null,
    municipalityId: municipality?.id || null,
    formattedAddress,
  };
};

const LocationSelector = ({
  OnHide,
  setSelectedCity,
  setIsMapLocation,
  navigateOnSave = true,
  onLocationSaved = null,
}) => {
  const currentLanguage = useSelector(CurrentLanguageData);
  const dispatch = useDispatch();
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const minLength = useSelector(getMinRange);
  const isBrowserSupported = useSelector(getIsBrowserSupported);

  const [search, setSearch] = useState("");
  const [locationStatus, setLocationStatus] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);

  const selectedCity = useMemo(() => getCityById(selectedCityId), [selectedCityId]);
  const cities = useMemo(() => getCities(), []);
  const municipalities = useMemo(
    () => (selectedCity ? getMunicipalitiesByCity(selectedCity.id) : []),
    [selectedCity]
  );
  const showMunicipalities = Boolean(selectedCity && municipalities.length > 0);

  const searchResults = useMemo(() => {
    if (search.trim().length < 2) return [];
    return searchLocations(search.trim());
  }, [search]);

  const filteredCities = useMemo(() => {
    if (!search.trim() || showMunicipalities) return cities;
    const needle = search.trim().toLowerCase();
    return cities.filter((city) => city.name.toLowerCase().includes(needle));
  }, [cities, search, showMunicipalities]);

  const handleSubmitLocation = () => {
    dispatch(setKilometerRange(minLength > 0 ? minLength : 0));
    if (navigateOnSave && pathname !== "/") {
      navigate("/");
    }
  };

  const handleSaveSelection = (payload) => {
    saveCity(payload);
    onLocationSaved?.(payload);
    handleSubmitLocation();
    OnHide();
  };

  const handleCitySelect = (cityId) => {
    const city = getCityById(cityId);
    if (!city) return;

    const cityMunicipalities = getMunicipalitiesByCity(city.id);
    if (!cityMunicipalities.length) {
      handleSaveSelection(buildLocationPayload({ city, municipality: null }));
      return;
    }

    setSelectedCityId(city.id);
    setSearch("");
  };

  const handleMunicipalitySelect = (municipalityId) => {
    if (!selectedCity) return;
    const municipality = municipalities.find((item) => item.id === municipalityId) || null;
    handleSaveSelection(buildLocationPayload({ city: selectedCity, municipality }));
  };

  const handleQuickSelect = (result) => {
    const city = getCityById(result.cityId);
    if (!city) return;
    const municipality =
      city.municipalities.find((item) => item.id === result.municipalityId) || null;

    handleSaveSelection(buildLocationPayload({ city, municipality }));
  };

  const handleAllSelect = () => {
    if (!showMunicipalities) {
      const payload = {
        country: BIH_COUNTRY.name,
        state: "",
        city: "",
        area: "",
        lat: BIH_DEFAULT_COORDS.lat,
        long: BIH_DEFAULT_COORDS.long,
        location_source: "hierarchy",
        cityId: null,
        municipalityId: null,
        formattedAddress: BIH_COUNTRY.name,
      };
      handleSaveSelection(payload);
      return;
    }

    handleSaveSelection(buildLocationPayload({ city: selectedCity, municipality: null }));
  };

  const getTitle = () => {
    if (showMunicipalities) return `Grad: ${selectedCity?.name}`;
    return BIH_COUNTRY.name;
  };

  const getBack = () => {
    setSelectedCityId(null);
    setSearch("");
  };

  const getCurrentLocationUsingFreeApi = async (latitude, longitude) => {
    try {
      const response = await getLocationApi.getLocation({
        lat: latitude,
        lng: longitude,
        lang: currentLanguage?.code,
      });

      if (response?.data?.error === false) {
        const result = response?.data?.data;
        const cityData = {
          areaId: result?.area_id,
          area: result?.area,
          city: result?.city,
          state: result?.state,
          country: result?.country,
          lat: result?.latitude,
          long: result?.longitude,
          location_source: "map",
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
      } else {
        setLocationStatus("error");
      }
    } catch (error) {
      console.error(error);
      setLocationStatus("error");
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus("fetching");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await getCurrentLocationUsingFreeApi(latitude, longitude);
          setIsMapLocation(true);
          setLocationStatus(null);
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationStatus("denied");
          } else {
            setLocationStatus("error");
          }
        }
      );
    } else {
      setLocationStatus("error");
    }
  };

  const listItems = useMemo(() => {
    if (showMunicipalities) {
      if (!search.trim()) return municipalities;
      const needle = search.trim().toLowerCase();
      return municipalities.filter((item) =>
        item.name.toLowerCase().includes(needle)
      );
    }
    return filteredCities;
  }, [filteredCities, municipalities, search, showMunicipalities]);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl ltr:text-left rtl:text-right">
          {showMunicipalities ? (
            <button onClick={getBack}>
              <MdArrowBack size={20} className="rtl:scale-x-[-1]" />
            </button>
          ) : null}
          {getTitle()}
        </DialogTitle>
      </DialogHeader>

      <div className="flex items-center gap-2 rounded-lg border py-2 px-4 relative">
        <IoSearch className="size-5 text-primary shrink-0" />
        <input
          type="text"
          data-autofocus
          autoFocus
          className="w-full outline-none text-sm bg-transparent"
          placeholder={showMunicipalities ? "Pretraži općinu..." : "Pretraži grad ili općinu..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search ? (
          <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false} mode="wait">
      {!showMunicipalities && search.trim().length < 2 ? (
        <motion.div
          key="popular-cities"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={SECTION_TRANSITION}
          className="space-y-2"
        >
          <p className="text-xs text-gray-500 font-medium">Popularni gradovi:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CITIES.map((city) => (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city.id)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-full transition-all duration-200 hover:-translate-y-0.5"
              >
                {city.name}
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
      {search.trim().length >= 2 && !showMunicipalities ? (
        <motion.div
          key="quick-search-results"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={SECTION_TRANSITION}
          className="rounded-lg border max-h-[200px] overflow-y-auto"
        >
          {searchResults.length ? (
            searchResults.map((result) => (
              <button
                key={`${result.cityId}:${result.municipalityId || "city"}`}
                onClick={() => handleQuickSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0 transition-colors"
              >
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">{result.displayName}</p>
                  <p className="text-xs text-gray-500">{result.formatted}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-sm text-muted-foreground">Nema rezultata za "{search}".</div>
          )}
        </motion.div>
      ) : null}
      </AnimatePresence>

      {isBrowserSupported ? (
        <div className="flex items-center gap-2 border rounded-lg p-2 px-4">
          <BiCurrentLocation className="text-primary size-5 shrink-0" />
          <button className="flex flex-col items-start ltr:text-left rtl:text-right" onClick={getCurrentLocation}>
            <p className="text-sm font-medium text-primary">Koristi trenutnu lokaciju</p>
            <p className="text-xs font-normal m-0 text-gray-500">
              {locationStatus === "fetching"
                ? "Učitavam lokaciju..."
                : locationStatus === "denied"
                ? "Lokacija odbijena"
                : locationStatus === "error"
                ? "Greška"
                : "Automatski pronađi lokaciju"}
            </p>
          </button>
        </div>
      ) : null}

      <motion.div
        layout
        initial={false}
        transition={SECTION_TRANSITION}
        className="rounded-lg border"
      >
        <button
          className="flex items-center gap-1 p-3 text-sm font-medium justify-between w-full border-b ltr:text-left rtl:text-right hover:bg-gray-50 transition-colors"
          onClick={handleAllSelect}
        >
          <span>
            {showMunicipalities
              ? `Sve u gradu ${selectedCity?.name}`
              : "Cijela Bosna i Hercegovina"}
          </span>
          <div className="bg-muted rounded-sm">
            <MdOutlineKeyboardArrowRight size={20} className="rtl:scale-x-[-1]" />
          </div>
        </button>

        <div className="overflow-y-auto max-h-[300px]">
          {listItems.length ? (
            listItems.map((item, index) => (
              <button
                className={cn(
                  "flex items-center ltr:text-left rtl:text-right gap-1 p-3 text-sm font-medium justify-between w-full hover:bg-gray-50 transition-colors",
                  index !== listItems.length - 1 && "border-b"
                )}
                onClick={() =>
                  showMunicipalities
                    ? handleMunicipalitySelect(item.id)
                    : handleCitySelect(item.id)
                }
                key={item.id}
              >
                <span>{item.name}</span>
                <div className="bg-muted rounded-sm">
                  <MdOutlineKeyboardArrowRight size={20} className="rtl:scale-x-[-1]" />
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              {search ? `Nema rezultata za "${search}"` : "Nema podataka"}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default LocationSelector;
