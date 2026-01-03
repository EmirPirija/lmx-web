import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { saveCity } from "@/redux/reducer/locationSlice";
import { getIsPaidApi } from "@/redux/reducer/settingSlice";
import { t } from "@/utils";
import { getLocationApi } from "@/utils/api";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useDebounce } from "use-debounce";
import { useNavigate } from "../Common/useNavigate";

const SearchAutocomplete = ({
  saveOnSuggestionClick,
  OnHide,
  setSelectedLocation,
}) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const inputRef = useRef(null);
  const isSuggestionClick = useRef(false);
  const IsPaidApi = useSelector(getIsPaidApi);
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [autoState, setAutoState] = useState({
    suggestions: [],
    loading: false,
    show: false,
  });
  const sessionTokenRef = useRef(null);

  // Generate a new session token (UUID v4)
  const generateSessionToken = () => {
    // Use crypto.randomUUID() if available (modern browsers)
    // Fallback to a simple UUID generator
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback UUID generator
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (isSuggestionClick.current) {
        isSuggestionClick.current = false;
        return;
      }
      if (debouncedSearch && debouncedSearch.length > 1) {
        setAutoState((prev) => ({ ...prev, loading: true, show: true }));
        try {
          // Generate new session token for new search session
          // Only generate if we don't have one or if search changed significantly
          if (!sessionTokenRef.current) {
            sessionTokenRef.current = generateSessionToken();
          }
          const response = await getLocationApi.getLocation({
            search: debouncedSearch,
            lang: "en",
            // Only include sessiontoken for Google Places API (IsPaidApi)
            ...(IsPaidApi && { session_id: sessionTokenRef.current }),
          });

          if (IsPaidApi) {
            const results = response?.data?.data?.predictions || [];
            setAutoState({ suggestions: results, loading: false, show: true });
          } else {
            const results = response?.data?.data || [];
            const formattedResults = results.map((result) => ({
              description: [
                result?.area_translation,
                result?.city_translation,
                result?.state_translation,
                result?.country_translation,
              ]
                .filter(Boolean)
                .join(", "),
              original: result,
            }));
            setAutoState({
              suggestions: formattedResults,
              loading: false,
              show: true,
            });
          }
        } catch (error) {
          console.log("error", error);
          setAutoState({ suggestions: [], loading: false, show: true });
        }
      } else {
        // Reset session token when search is cleared
        sessionTokenRef.current = null;
        setAutoState({ suggestions: [], loading: false, show: false });
      }
    };

    fetchSuggestions();
  }, [debouncedSearch, IsPaidApi]);

  const handleSearchChange = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    // Generate new session token when user starts typing (if none exists)
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = generateSessionToken();
    }
  };

  const handleInputFocus = () => {
    if (autoState.suggestions.length > 0) {
      setAutoState((prev) => ({ ...prev, show: true }));
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setAutoState((prev) => ({ ...prev, show: false }));
    }, 200);
  };

  const handleSuggestionClick = async (suggestion) => {
    isSuggestionClick.current = true;

    if (IsPaidApi) {
      // Use the same session token from autocomplete request
      // This groups autocomplete + place details into one billing session
      const response = await getLocationApi.getLocation({
        place_id: suggestion.place_id,
        lang: "en",
        // Use the same session token from autocomplete (only if it exists)
        ...(sessionTokenRef.current && {
          session_id: sessionTokenRef.current,
        }),
      });

      const result = response?.data?.data?.results?.[0];
      const addressComponents = result.address_components || [];

      const getAddressComponent = (type) => {
        const component = addressComponents.find((comp) =>
          comp.types.includes(type)
        );
        return component?.long_name || "";
      };

      const city = getAddressComponent("locality");
      const state = getAddressComponent("administrative_area_level_1");
      const country = getAddressComponent("country");
      const data = {
        lat: result?.geometry?.location?.lat,
        long: result?.geometry?.location?.lng,
        city,
        state,
        country,
        formattedAddress: suggestion?.description,
      };
      setSearch(suggestion?.description || "");
      setAutoState({ suggestions: [], loading: false, show: false });

      // Reset session token after place details request (session complete)
      sessionTokenRef.current = null;

      if (saveOnSuggestionClick) {
        saveCity(data);
        OnHide?.();
        // avoid redirect if already on home page otherwise router.push triggering server side api calls
        if (pathname !== "/") {
          navigate("/");
        }
      } else {
        setSelectedLocation(data);
      }
    } else {
      const original = suggestion.original;
      const data = {
        lat: original?.latitude,
        long: original?.longitude,
        city: original?.city || "",
        state: original?.state || "",
        country: original?.country || "",
        formattedAddress: suggestion.description || "",
        area: original?.area || "",
        areaId: original?.area_id || "",
      };
      setSearch(suggestion?.description || "");
      setAutoState({ suggestions: [], loading: false, show: false });
      if (saveOnSuggestionClick) {
        saveCity(data);
        OnHide?.();
        // avoid redirect if already on home page otherwise router.push triggering server side api calls
        if (pathname !== "/") {
          navigate("/");
        }
      } else {
        setSelectedLocation(data);
      }
    }
  };

  return (
    <>
      <input
        type="text"
        placeholder={t("selectLocation")}
        onChange={handleSearchChange}
        value={search}
        ref={inputRef}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        autoComplete="off"
        className="w-full text-sm outline-none"
      />
      {autoState.show &&
        (autoState.suggestions.length > 0 || autoState.loading) && (
          <div className="absolute top-full left-0 right-0 bg-white border z-[1500] max-h-[220px] overflow-y-auto shadow-lg rounded-lg mt-0.5">
            {autoState.loading ? (
              <div className="px-4 py-2.5 text-muted-foreground text-sm">
                {t("loading")}
              </div>
            ) : (
              autoState.suggestions.map((s, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2.5 cursor-pointer transition-colors duration-200 text-sm text-gray-800 ltr:text-left rtl:text-right hover:bg-gray-50 active:bg-gray-50"
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s.description || "Unknown"}
                </div>
              ))
            )}
          </div>
        )}
    </>
  );
};

export default SearchAutocomplete;
