import { useState, useMemo } from "react";
import { IoSearch } from "react-icons/io5";
import { t } from "@/utils";
import { MdArrowBack, MdOutlineKeyboardArrowRight } from "react-icons/md";
import { BiCurrentLocation } from "react-icons/bi";
import { DialogHeader, DialogTitle } from "../ui/dialog";
import { cn } from "@/lib/utils";
import { MapPin, X } from "lucide-react";
import { getLocationApi } from "@/utils/api";
import {
  getIsBrowserSupported,
  resetCityData,
  saveCity,
  setKilometerRange,
} from "@/redux/reducer/locationSlice";
import { useDispatch, useSelector } from "react-redux";
import { getMinRange } from "@/redux/reducer/settingSlice";
import { usePathname } from "next/navigation";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { useNavigate } from "../Common/useNavigate";
import {
  ENTITIES,
  getRegionsByEntity,
  getMunicipalitiesByRegion,
  searchMunicipalities,
  POPULAR_CITIES,
  getFullLocationFromMunicipalityId,
} from "@/lib/bih-locations";
 
// Default koordinate za BiH (Sarajevo)
const BIH_DEFAULT_COORDS = {
  lat: 43.8563,
  long: 18.4131,
};
 
const LocationSelector = ({ OnHide, setSelectedCity, setIsMapLocation }) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const dispatch = useDispatch();
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const minLength = useSelector(getMinRange);
  const IsBrowserSupported = useSelector(getIsBrowserSupported);
 
  const [search, setSearch] = useState("");
  const [locationStatus, setLocationStatus] = useState(null);
  const [currentView, setCurrentView] = useState("entities"); // entities, regions, municipalities
  const [selectedLocation, setSelectedLocation] = useState({
    entity: null,
    region: null,
    municipality: null,
  });
 
  // Dohvati podatke za trenutni view
  const regions = useMemo(() => {
    return selectedLocation.entity ? getRegionsByEntity(selectedLocation.entity.id) : [];
  }, [selectedLocation.entity]);
 
  const municipalities = useMemo(() => {
    return selectedLocation.region ? getMunicipalitiesByRegion(selectedLocation.region.id) : [];
  }, [selectedLocation.region]);
 
  // Search rezultati
  const searchResults = useMemo(() => {
    if (search.length < 2) return [];
    return searchMunicipalities(search).slice(0, 10);
  }, [search]);
 
  // Trenutni items za prikaz
  const currentItems = useMemo(() => {
    switch (currentView) {
      case "entities":
        return ENTITIES;
      case "regions":
        return regions;
      case "municipalities":
        return municipalities;
      default:
        return [];
    }
  }, [currentView, regions, municipalities]);
 
  const handleSubmitLocation = () => {
    minLength > 0
      ? dispatch(setKilometerRange(minLength))
      : dispatch(setKilometerRange(0));
    if (pathname !== "/") {
      navigate("/");
    }
  };
 
  const handleItemSelect = (item) => {
    switch (currentView) {
      case "entities":
        setSelectedLocation({
          entity: item,
          region: null,
          municipality: null,
        });
        setCurrentView("regions");
        setSearch("");
        break;
      case "regions":
        setSelectedLocation((prev) => ({
          ...prev,
          region: item,
          municipality: null,
        }));
        setCurrentView("municipalities");
        setSearch("");
        break;
      case "municipalities":
        // Sačuvaj lokaciju i zatvori
        const fullAddress = `${item.name}, ${selectedLocation.region?.name}, ${selectedLocation.entity?.name}, Bosna i Hercegovina`;
        saveCity({
          country: "Bosna i Hercegovina",
          state: selectedLocation.region?.name || "",
          city: item.name,
          area: "",
          lat: BIH_DEFAULT_COORDS.lat,
          long: BIH_DEFAULT_COORDS.long,
          formattedAddress: fullAddress,
        });
        handleSubmitLocation();
        OnHide();
        break;
    }
  };
 
  // Quick select iz pretrage
  const handleQuickSelect = (result) => {
    const fullAddress = `${result.name}, ${result.regionName}, ${result.entityName}, Bosna i Hercegovina`;
    saveCity({
      country: "Bosna i Hercegovina",
      state: result.regionName || "",
      city: result.name,
      area: "",
      lat: BIH_DEFAULT_COORDS.lat,
      long: BIH_DEFAULT_COORDS.long,
      formattedAddress: fullAddress,
    });
    handleSubmitLocation();
    OnHide();
  };
 
  // Popularni grad select
  const handlePopularCity = (city) => {
    const fullLocation = getFullLocationFromMunicipalityId(city.id);
    if (fullLocation) {
      saveCity({
        country: "Bosna i Hercegovina",
        state: fullLocation.region?.name || "",
        city: fullLocation.municipality?.name || "",
        area: "",
        lat: BIH_DEFAULT_COORDS.lat,
        long: BIH_DEFAULT_COORDS.long,
        formattedAddress: fullLocation.formatted,
      });
      handleSubmitLocation();
      OnHide();
    }
  };
 
  const getPlaceholderText = () => {
    switch (currentView) {
      case "entities":
        return "Pretraži grad ili općinu...";
      case "regions":
        return selectedLocation.entity?.id === "fbih" ? "Pretraži kanton..." : "Pretraži regiju...";
      case "municipalities":
        return "Pretraži grad/općinu...";
      default:
        return "Pretraži...";
    }
  };
 
  const getFormattedLocation = () => {
    const parts = [];
    if (selectedLocation.municipality?.name) parts.push(selectedLocation.municipality.name);
    if (selectedLocation.region?.name) parts.push(selectedLocation.region.name);
    if (selectedLocation.entity?.shortName) parts.push(selectedLocation.entity.shortName);
    return parts.length > 0 ? parts.join(", ") : "Bosna i Hercegovina";
  };
 
  const handleBack = () => {
    switch (currentView) {
      case "regions":
        setSelectedLocation({ entity: null, region: null, municipality: null });
        setCurrentView("entities");
        break;
      case "municipalities":
        setSelectedLocation((prev) => ({ ...prev, region: null, municipality: null }));
        setCurrentView("regions");
        break;
    }
    setSearch("");
  };
 
  const getTitle = () => {
    switch (currentView) {
      case "entities":
        return "Entitet";
      case "regions":
        return selectedLocation.entity?.id === "fbih" ? "Kanton" : "Regija";
      case "municipalities":
        return "Grad/Općina";
    }
  };
 
  const handleAllSelect = () => {
    switch (currentView) {
      case "entities":
        saveCity({
          country: "Bosna i Hercegovina",
          state: "",
          city: "",
          area: "",
          lat: BIH_DEFAULT_COORDS.lat,
          long: BIH_DEFAULT_COORDS.long,
          formattedAddress: "Bosna i Hercegovina",
        });
        handleSubmitLocation();
        OnHide();
        break;
      case "regions":
        saveCity({
          country: "Bosna i Hercegovina",
          state: selectedLocation.entity?.name || "",
          city: "",
          area: "",
          lat: BIH_DEFAULT_COORDS.lat,
          long: BIH_DEFAULT_COORDS.long,
          formattedAddress: `${selectedLocation.entity?.name}, Bosna i Hercegovina`,
        });
        handleSubmitLocation();
        OnHide();
        break;
      case "municipalities":
        saveCity({
          country: "Bosna i Hercegovina",
          state: selectedLocation.region?.name || "",
          city: "",
          area: "",
          lat: BIH_DEFAULT_COORDS.lat,
          long: BIH_DEFAULT_COORDS.long,
          formattedAddress: `${selectedLocation.region?.name}, ${selectedLocation.entity?.name}, Bosna i Hercegovina`,
        });
        handleSubmitLocation();
        OnHide();
        break;
    }
  };
 
  const getAllButtonTitle = () => {
    switch (currentView) {
      case "entities":
        return "Cijela Bosna i Hercegovina";
      case "regions":
        return `Sve u ${selectedLocation.entity?.shortName || selectedLocation.entity?.name}`;
      case "municipalities":
        return `Sve u ${selectedLocation.region?.name}`;
    }
  };
 
  const getCurrentLocationUsingFreeApi = async (latitude, longitude) => {
    try {
      const response = await getLocationApi.getLocation({
        lat: latitude,
        lng: longitude,
        lang: CurrentLanguage?.code,
      });
      if (response?.data.error === false) {
        const result = response?.data?.data;
        const cityData = {
          areaId: result?.area_id,
          area: result?.area,
          city: result?.city,
          state: result?.state,
          country: result?.country,
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
      } else {
        setLocationStatus("error");
      }
    } catch (error) {
      console.log(error);
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
      console.error("Geolocation not supported");
    }
  };
 
  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!search || currentView === "entities") return currentItems;
    return currentItems.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [currentItems, search, currentView]);
 
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl ltr:text-left rtl:text-right">
          {currentView !== "entities" && (
            <button onClick={handleBack}>
              <MdArrowBack size={20} className="rtl:scale-x-[-1]" />
            </button>
          )}
          {getFormattedLocation()}
        </DialogTitle>
      </DialogHeader>
 
      {/* Search input */}
      <div className="flex items-center gap-2 border rounded-lg py-2 px-4 relative">
        <IoSearch className="size-5 text-primary shrink-0" />
        <input
          type="text"
          className="w-full outline-none text-sm"
          placeholder={getPlaceholderText()}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
 
      {/* Search rezultati dropdown */}
      {search.length >= 2 && currentView === "entities" && searchResults.length > 0 && (
        <div className="border rounded-lg max-h-[200px] overflow-y-auto">
          {searchResults.map((result) => (
            <button
              key={result.id}
              onClick={() => handleQuickSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">{result.name}</p>
                <p className="text-xs text-gray-500">
                  {result.regionName} • {result.entityName}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
 
      {/* Popularni gradovi */}
      {currentView === "entities" && !search && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Popularni gradovi:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CITIES.slice(0, 6).map((city) => (
              <button
                key={city.id}
                onClick={() => handlePopularCity(city)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      )}
 
      {/* Current Location */}
      {IsBrowserSupported && (
        <div className="flex items-center gap-2 border rounded-lg p-2 px-4">
          <BiCurrentLocation className="text-primary size-5 shrink-0" />
          <button
            className="flex flex-col items-start ltr:text-left rtl:text-right"
            onClick={getCurrentLocation}
          >
            <p className="text-sm font-medium text-primary">
              {t("useCurrentLocation")}
            </p>
            <p className="text-xs font-normal m-0 text-gray-500">
              {locationStatus === "fetching"
                ? t("gettingLocation")
                : locationStatus === "denied"
                ? t("locationPermissionDenied")
                : locationStatus === "error"
                ? t("error")
                : t("automaticallyDetectLocation")}
            </p>
          </button>
        </div>
      )}
 
      {/* Lista lokacija */}
      <div className="border rounded-lg">
        <button
          className="flex items-center gap-1 p-3 text-sm font-medium justify-between w-full border-b ltr:text-left rtl:text-right hover:bg-gray-50"
          onClick={handleAllSelect}
        >
          <span>{getAllButtonTitle()}</span>
          <div className="bg-muted rounded-sm">
            <MdOutlineKeyboardArrowRight size={20} className="rtl:scale-x-[-1]" />
          </div>
        </button>
        
        <div className="overflow-y-auto max-h-[300px]">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <button
                className={cn(
                  "flex items-center ltr:text-left rtl:text-right gap-1 p-3 text-sm font-medium justify-between w-full hover:bg-gray-50",
                  index !== filteredItems.length - 1 && "border-b"
                )}
                onClick={() => handleItemSelect(item)}
                key={item?.id}
              >
                <div className="flex flex-col items-start">
                  <span>{item?.shortName || item?.name}</span>
                  {item?.shortName && item?.name !== item?.shortName && (
                    <span className="text-xs text-gray-500">{item?.name}</span>
                  )}
                  {item?.type === "grad" && (
                    <span className="text-[10px] text-primary">Grad</span>
                  )}
                </div>
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
      </div>
    </>
  );
};
 
export default LocationSelector;