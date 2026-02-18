import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import {
  BiMapPin,
  IoLocationOutline,
  Loader2,
  MdCheckCircle,
  MdInfoOutline,
  MdEditLocation,
} from "@/components/Common/UnifiedIconPack";
import { toast } from "@/utils/toastBs";
import PublishOptionsModal from "../AdsListing/PublishOptionsModal";
import { t } from "@/utils";
import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import { useUserLocation } from "@/hooks/useUserLocation";
import StickyActionButtons from "@/components/Common/StickyActionButtons";
import { getLocationApi } from "@/utils/api";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";

const GetLocationWithMap = dynamic(() => import("@/components/Location/GetLocationWithMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />,
});

const BIH_DEFAULT_COORDS = {
  lat: 43.8563,
  long: 18.4131,
};

const hasPreciseCoordinates = (value = {}) =>
  Number.isFinite(Number(value?.lat)) && Number.isFinite(Number(value?.long));

const EditComponentFour = ({
  location,
  setLocation,
  handleFullSubmission,
  isAdPlaced,
  handleGoBack,
  setScheduledAt,
  isRealEstate = false,
}) => {
  const currentLanguage = useSelector(CurrentLanguageData);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isResolvingMapPoint, setIsResolvingMapPoint] = useState(false);

  const {
    userLocation,
    hasLocation,
    getFormattedAddress,
    getLocationForAd,
    convertApiLocationToBiH,
  } = useUserLocation();

  const [bihLocation, setBihLocation] = useState({
    entityId: null,
    regionId: null,
    municipalityId: null,
    address: "",
    formattedAddress: "",
  });
  const [locationSource, setLocationSource] = useState("none"); // "profile", "manual", "none"
  const [isInitialized, setIsInitialized] = useState(false);
  const [realEstateLocationMode, setRealEstateLocationMode] = useState("map"); // "map" | "profile"
  const [mapPreviewPosition, setMapPreviewPosition] = useState(null);

  const hasAddressData = Boolean(location?.country && location?.state && location?.city && location?.address);
  const hasPreciseLocation = hasPreciseCoordinates(location);
  const canPublish = hasAddressData;

  const mapPosition = useMemo(() => {
    if (hasPreciseLocation) {
      return {
        lat: Number(location?.lat),
        lng: Number(location?.long),
      };
    }
    if (
      Number.isFinite(Number(mapPreviewPosition?.lat)) &&
      Number.isFinite(Number(mapPreviewPosition?.lng))
    ) {
      return {
        lat: Number(mapPreviewPosition.lat),
        lng: Number(mapPreviewPosition.lng),
      };
    }
    return {
      lat: BIH_DEFAULT_COORDS.lat,
      lng: BIH_DEFAULT_COORDS.long,
    };
  }, [hasPreciseLocation, location?.lat, location?.long, mapPreviewPosition?.lat, mapPreviewPosition?.lng]);

  const shortLocationLabel = useMemo(() => {
    const preferred = [location?.city, location?.state].filter(Boolean).join(", ");
    if (preferred) return preferred;

    const addressParts = String(location?.address_translated || location?.address || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2);
    if (addressParts.length) return addressParts.join(", ");

    return "Nije odabrano područje";
  }, [location?.address, location?.address_translated, location?.city, location?.state]);

  const resolveApproximateMapPoint = useCallback(
    async (searchAddress) => {
      const query = String(searchAddress || "").trim();
      if (!query) return null;

      try {
        const response = await getLocationApi.getLocation({
          search: query,
          lang: currentLanguage?.code || "bs",
        });

        if (response?.data?.error === true) return null;

        const payload = response?.data?.data;
        const result = Array.isArray(payload) ? payload[0] || null : payload || null;
        const latNum = Number(result?.latitude ?? result?.lat);
        const lngNum = Number(result?.longitude ?? result?.long ?? result?.lng);

        if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
        return { lat: latNum, lng: lngNum };
      } catch {
        return null;
      }
    },
    [currentLanguage?.code]
  );

  const loadProfileLocation = useCallback(() => {
    if (isRealEstate || !userLocation?.municipalityId) return;

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
          location_source: "profile",
        });
        setLocationSource("profile");
      }
    } catch (error) {
      console.error("Error loading profile location:", error);
    }
  }, [isRealEstate, setLocation, userLocation]);

  const getProfileLocationForRealEstate = useCallback(() => {
    const profileLocation = getLocationForAd?.();
    if (!profileLocation) return null;
    return {
      ...profileLocation,
      lat: null,
      long: null,
      area_id: null,
      location_source: "profile",
    };
  }, [getLocationForAd]);

  useEffect(() => {
    if (isInitialized) return;

    if (location?.city || location?.address || hasPreciseCoordinates(location)) {
      const source = String(location?.location_source || "").toLowerCase();
      const hasPrecise = hasPreciseCoordinates(location);
      const useProfileSource = source === "profile" || (isRealEstate && !hasPrecise && source !== "map");

      if (isRealEstate) {
        setRealEstateLocationMode(useProfileSource ? "profile" : "map");
        if (!useProfileSource) {
          const latNum = Number(location?.lat);
          const lngNum = Number(location?.long);
          if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
            setMapPreviewPosition({ lat: latNum, lng: lngNum });
          } else {
            resolveApproximateMapPoint(
              location?.address_translated ||
                location?.formattedAddress ||
                location?.address ||
                [location?.city, location?.state, location?.country].filter(Boolean).join(", ")
            ).then((point) => {
              if (point) setMapPreviewPosition(point);
            });
          }
        }
      }
      setLocationSource(useProfileSource ? "profile" : "manual");

      if (typeof convertApiLocationToBiH === "function") {
        const converted = convertApiLocationToBiH(location);
        if (converted) {
          setBihLocation(converted);
        }
      }

      if (!location?.location_source) {
        setLocation((prev) => ({
          ...(prev || {}),
          location_source: useProfileSource ? "profile" : isRealEstate ? "map" : "manual",
        }));
      }

      setIsInitialized(true);
      return;
    }

    if (!isRealEstate && hasLocation && userLocation?.municipalityId) {
      loadProfileLocation();
      setIsInitialized(true);
      return;
    }

    if (isRealEstate) {
      setRealEstateLocationMode("map");
      setLocationSource("manual");
      setIsInitialized(true);
      return;
    }

    setIsInitialized(true);
  }, [
    convertApiLocationToBiH,
    hasLocation,
    isInitialized,
    isRealEstate,
    loadProfileLocation,
    location,
    resolveApproximateMapPoint,
    setLocation,
    userLocation?.municipalityId,
  ]);

  const handleBihLocationChange = (newBihLocation) => {
    setBihLocation(newBihLocation);

    if (!newBihLocation?.municipalityId) return;

    try {
      const { getFullLocationFromMunicipalityId } = require("@/lib/bih-locations");
      const fullLocation = getFullLocationFromMunicipalityId(newBihLocation.municipalityId);

      if (fullLocation) {
        const formattedAddr = newBihLocation.address
          ? `${newBihLocation.address}, ${fullLocation.formatted}`
          : fullLocation.formatted;

        setLocation((prev) => ({
          ...prev,
          country: "Bosna i Hercegovina",
          state: fullLocation.region?.name || "",
          city: fullLocation.municipality?.name || "",
          address: formattedAddr,
          formattedAddress: formattedAddr,
          address_translated: formattedAddr,
          lat: isRealEstate ? null : BIH_DEFAULT_COORDS.lat,
          long: isRealEstate ? null : BIH_DEFAULT_COORDS.long,
          location_source: isRealEstate ? "map" : "manual",
        }));
        setLocationSource("manual");

        if (isRealEstate) {
          resolveApproximateMapPoint(formattedAddr).then((point) => {
            if (point) setMapPreviewPosition(point);
          });
        }
      }
    } catch (error) {
      console.error("Error setting location:", error);
    }
  };

  const handleUseManualLocation = () => {
    setLocationSource("manual");
    setBihLocation({
      entityId: null,
      regionId: null,
      municipalityId: null,
      address: "",
      formattedAddress: "",
    });

    if (isRealEstate) {
      setLocation({
        country: "",
        state: "",
        city: "",
        address: "",
        address_translated: "",
        lat: null,
        long: null,
        area_id: null,
        location_source: "map",
      });
      setMapPreviewPosition(null);
      return;
    }

    setLocation({});
  };

  const handleUseProfileLocation = () => {
    if (isRealEstate) return;
    loadProfileLocation();
  };

  const handleMapLocationChange = async (pos) => {
    const lat = Number(pos?.lat);
    const lng = Number(pos?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setIsResolvingMapPoint(true);

    try {
      const response = await getLocationApi.getLocation({
        lat,
        lng,
        lang: currentLanguage?.code || "bs",
      });

      if (response?.data?.error === true) {
        throw new Error("Location lookup failed");
      }

      const payload = response?.data?.data;
      const result = Array.isArray(payload) ? payload[0] || {} : payload || {};
      const resolvedCity = result?.city_translation || result?.city || "";
      const resolvedState = result?.state_translation || result?.state || "";
      const composedAddress = [
        result?.area_translation || result?.area,
        resolvedCity,
        resolvedState,
        result?.country_translation || result?.country,
      ]
        .filter(Boolean)
        .join(", ");

      const fallbackAddress = [resolvedCity, resolvedState].filter(Boolean).join(", ");

      if (typeof convertApiLocationToBiH === "function") {
        const converted = convertApiLocationToBiH({
          city: resolvedCity || result?.city || "",
          state: resolvedState || result?.state || "",
          country: result?.country_translation || result?.country || "Bosna i Hercegovina",
        });
        if (converted) {
          setBihLocation((prev) => ({
            ...prev,
            ...converted,
          }));
        }
      }

      setLocation((prev) => ({
        ...prev,
        country:
          result?.country_translation ||
          result?.country ||
          (isRealEstate ? "Bosna i Hercegovina" : prev?.country || "Bosna i Hercegovina"),
        state: result?.state_translation || result?.state || (isRealEstate ? "" : prev?.state || ""),
        city: result?.city_translation || result?.city || (isRealEstate ? "" : prev?.city || ""),
        address:
          composedAddress ||
          fallbackAddress ||
          (isRealEstate ? prev?.address || "Odabrana lokacija na mapi" : prev?.address || "Odabrana lokacija"),
        address_translated:
          composedAddress ||
          fallbackAddress ||
          (isRealEstate ? prev?.address_translated || "Odabrana lokacija na mapi" : prev?.address_translated || "Odabrana lokacija"),
        lat,
        long: lng,
        area_id: result?.area_id ?? (isRealEstate ? null : prev?.area_id || null),
        location_source: isRealEstate ? "map" : "manual",
      }));
      setLocationSource("manual");
      setMapPreviewPosition({ lat, lng });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Map location reverse lookup fallback aktivan.", error);
      }
      setLocation((prev) =>
        isRealEstate
          ? {
              ...prev,
              country: prev?.country || "Bosna i Hercegovina",
              state: prev?.state || "",
              city: prev?.city || "",
              address: prev?.address || "Odabrana lokacija na mapi",
              address_translated: prev?.address_translated || prev?.address || "Odabrana lokacija na mapi",
              lat,
              long: lng,
              area_id: null,
              location_source: "map",
            }
          : {
              ...prev,
              lat,
              long: lng,
          }
      );
      setMapPreviewPosition({ lat, lng });
      toast.warning("Pin je postavljen na mapi. Provjerite i dopunite adresu ako je potrebno.");
    } finally {
      setIsResolvingMapPoint(false);
    }
  };

  const handlePublishClick = () => {
    if (!hasAddressData) {
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

  const shouldShowStandardLocationPicker =
    !isRealEstate && (locationSource === "none" || (locationSource === "manual" && !location?.city));

  const handleUseRealEstateProfileLocation = () => {
    if (!hasLocation) {
      toast.info("Prvo sačuvajte lokaciju u profilu pa je onda možete koristiti za nekretninu.");
      return;
    }
    const profileLocation = getProfileLocationForRealEstate();
    if (!profileLocation) {
      toast.error("Ne mogu preuzeti lokaciju iz profila. Provjerite profilne podatke.");
      return;
    }
    setRealEstateLocationMode("profile");
    setLocationSource("profile");
    setLocation(profileLocation);
  };

  const handleUseRealEstateMapLocation = () => {
    setRealEstateLocationMode("map");
    setLocationSource("manual");
    setLocation((prev) => ({
      ...(prev || {}),
      location_source: "map",
    }));
    if (!hasPreciseCoordinates(location)) {
      resolveApproximateMapPoint(
        location?.address_translated || location?.formattedAddress || location?.address
      ).then((point) => {
        if (point) setMapPreviewPosition(point);
      });
    }
    if (!hasPreciseCoordinates(location)) {
      toast.info("Odaberite područje oglasa.");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 pb-24">
        {isRealEstate ? (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-500/40 dark:bg-cyan-500/10">
              <MdInfoOutline className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-300" size={20} />
              <div>
                <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                  Lokacija nekretnine je obavezna
                </p>
                <p className="mt-1 text-xs text-cyan-800 dark:text-cyan-300">
                  Odaberite da li želite koristiti lokaciju iz profila ili unijeti posebnu lokaciju oglasa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleUseRealEstateMapLocation}
                className={`rounded-xl border p-4 text-left transition-all ${
                  realEstateLocationMode === "map"
                    ? "border-primary/50 bg-primary/10 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Odaberi područje oglasa</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Koristite lokaciju oglasa kroz odabir područja.
                </p>
              </button>
              <button
                type="button"
                onClick={handleUseRealEstateProfileLocation}
                disabled={!hasLocation}
                className={`rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  realEstateLocationMode === "profile"
                    ? "border-primary/50 bg-primary/10 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Koristi lokaciju iz profila</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {hasLocation
                    ? `Sačuvana lokacija: ${getFormattedAddress()}`
                    : "Prvo sačuvajte lokaciju u profilu da biste je koristili."}
                </p>
              </button>
            </div>

            {realEstateLocationMode === "profile" ? (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/40 dark:bg-emerald-500/10">
                <MdCheckCircle className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" size={20} />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">
                    Koristi se lokacija iz profila
                  </p>
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                    {location?.address_translated || location?.address || getFormattedAddress()}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-700/90 dark:text-emerald-300/90">
                    Ako želite posebnu lokaciju oglasa, prebacite na opciju "Odaberi područje oglasa".
                  </p>
                </div>
              </div>
            ) : (
              <>
                {hasLocation ? (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
                    <MdInfoOutline className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={20} />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-100">
                        Lokacija profila ({getFormattedAddress()}) nije aktivna dok je uključena opcija "Odaberi područje oglasa".
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-xl border-2 border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <IoLocationOutline className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Podaci o lokaciji</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        Odabrano područje: {shortLocationLabel}
                      </p>
                    </div>
                  </div>

                  <BiHLocationSelector value={bihLocation} onChange={handleBihLocationChange} showAddress={true} label="" />
                </div>
              </>
            )}

            {location?.city || location?.address ? (
              <div className="flex items-start gap-4 rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/40 dark:bg-blue-500/10">
                  <BiMapPin className="text-blue-600" size={28} />
                </div>
                <div className="flex-1">
                  <h6 className="mb-1 text-lg font-semibold text-gray-800 dark:text-slate-100">Lokacija nekretnine</h6>
                  <p className="text-gray-600 dark:text-slate-300">
                    {location?.address_translated || location?.address}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    U prikazu oglasa kupcima je vidljiva okvirna zona radi privatnosti.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        realEstateLocationMode === "profile"
                          ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                      }`}
                    >
                      {realEstateLocationMode === "profile"
                        ? "Lokacija iz profila"
                        : "Lokacija unesena za oglas"}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            {locationSource === "profile" && location?.city ? (
              <div className="flex items-start gap-4 rounded-xl border-2 border-green-200 bg-green-50 p-4 dark:border-green-500/40 dark:bg-green-500/10">
                <div className="rounded-lg bg-green-500 p-2">
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
            ) : null}

            {locationSource === "manual" && location?.city ? (
              <div className="flex items-start gap-4 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-500/40 dark:bg-blue-500/10">
                <div className="rounded-lg bg-blue-500 p-2">
                  <MdEditLocation className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Lokacija oglasa</h3>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-200">
                    {location?.address_translated || location?.address}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={handleUseManualLocation}
                      className="text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                    >
                      Promijeni lokaciju
                    </button>
                    {hasLocation ? (
                      <button
                        onClick={handleUseProfileLocation}
                        className="text-sm text-green-600 underline hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
                      >
                        Koristi lokaciju iz profila
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {shouldShowStandardLocationPicker ? (
              <>
                {hasLocation ? (
                  <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-500/40 dark:bg-green-500/10">
                    <MdCheckCircle className="mt-0.5 shrink-0 text-green-600" size={20} />
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
                ) : null}

                <div className="rounded-xl border-2 border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <IoLocationOutline className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Odaberite lokaciju oglasa</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Lokacija se koristi za pretragu i mapu oglasa.</p>
                    </div>
                  </div>

                  <BiHLocationSelector value={bihLocation} onChange={handleBihLocationChange} showAddress={true} label="" />
                </div>

                {!hasLocation ? (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
                    <MdInfoOutline className="mt-0.5 shrink-0 text-amber-600" size={20} />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Savjet</p>
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        Postavite svoju lokaciju u profilu i ona će se automatski popuniti prilikom svakog novog oglasa.
                      </p>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {/* {location?.city ? (
              <div className="flex items-start gap-4 rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/40 dark:bg-blue-500/10">
                  <BiMapPin className="text-blue-600" size={28} />
                </div>
                <div className="flex-1">
                  <h6 className="mb-1 text-lg font-semibold text-gray-800 dark:text-slate-100">Lokacija oglasa</h6>
                  <p className="text-gray-600 dark:text-slate-300">
                    {location?.address_translated || location?.address}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Kupcima je prikazana okvirna zona lokacije.
                  </p>
                </div>
              </div>
            ) : null} */}
          </>
        )}
      </div>

      <StickyActionButtons
        secondaryLabel="Nazad"
        onSecondaryClick={handleGoBack}
        primaryLabel={isAdPlaced ? "Spremam..." : "Spremi izmjene"}
        onPrimaryClick={handlePublishClick}
        primaryDisabled={isAdPlaced || !canPublish}
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

export default EditComponentFour;
