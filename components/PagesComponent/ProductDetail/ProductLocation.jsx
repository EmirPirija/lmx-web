import { useEffect, useMemo, useState } from "react";
import { IoCopyOutline } from "@/components/Common/UnifiedIconPack";
import {
  MdDirections,
  MdMap,
  MdOpenInNew,
} from "@/components/Common/UnifiedIconPack";
import dynamic from "next/dynamic";
import { toast } from "@/utils/toastBs";
import { getLocationApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";

const MAP_PRIVACY_RADIUS_METERS = 100;
const COORDINATE_MISMATCH_THRESHOLD_METERS = 60000;

const Map = dynamic(() => import("@/components/Location/Map"), {
  ssr: false,
});

const parseCoordinate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).trim().replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
};

const isValidLatitude = (lat) =>
  lat !== null && Number.isFinite(lat) && lat >= -90 && lat <= 90;
const isValidLongitude = (lng) =>
  lng !== null && Number.isFinite(lng) && lng >= -180 && lng <= 180;
const isNullIslandCoordinatePair = (lat, lng) =>
  Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001;
const isMeaningfulCoordinatePair = (lat, lng) =>
  isValidLatitude(lat) &&
  isValidLongitude(lng) &&
  !isNullIslandCoordinatePair(lat, lng);

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const LOCATION_COORDINATE_FALLBACK = [
  { key: "sarajevo", lat: 43.8563, lng: 18.4131 },
  { key: "mostar", lat: 43.3438, lng: 17.8078 },
  { key: "capljina", lat: 43.1217, lng: 17.6844 },
  { key: "čapljina", lat: 43.1217, lng: 17.6844 },
  { key: "bihac", lat: 44.8167, lng: 15.87 },
  { key: "bihać", lat: 44.8167, lng: 15.87 },
  { key: "tuzla", lat: 44.5384, lng: 18.6671 },
  { key: "zenica", lat: 44.2034, lng: 17.9077 },
  { key: "banja luka", lat: 44.7722, lng: 17.191 },
  { key: "banjaluka", lat: 44.7722, lng: 17.191 },
  { key: "brcko", lat: 44.8728, lng: 18.8102 },
  { key: "brčko", lat: 44.8728, lng: 18.8102 },
  { key: "berkovici", lat: 43.0935, lng: 18.1713 },
  { key: "berkovići", lat: 43.0935, lng: 18.1713 },
  { key: "trebinje", lat: 42.7119, lng: 18.3436 },
];

const resolveCoordinatesFromLocationText = (...chunks) => {
  const normalizedJoined = normalizeText(chunks.filter(Boolean).join(" | "));
  if (!normalizedJoined) return null;

  const match = LOCATION_COORDINATE_FALLBACK.find((entry) =>
    normalizedJoined.includes(entry.key),
  );
  if (!match) return null;

  return { lat: match.lat, lng: match.lng };
};

const parseExtraDetailsSafe = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return typeof value === "object" ? value : null;
};

const resolveCoordinatesFromCoordinateArray = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const lng = parseCoordinate(coordinates[0]);
  const lat = parseCoordinate(coordinates[1]);
  if (!isMeaningfulCoordinatePair(lat, lng)) return null;
  return { lat, lng };
};

const resolveCoordinatesFromObject = (source) => {
  if (!source || typeof source !== "object") return null;

  const directCandidates = [
    [source?.latitude, source?.longitude],
    [source?.lat, source?.lng],
    [source?.lat, source?.long],
    [source?.lat, source?.lon],
    [source?.y, source?.x],
  ];

  for (const [latRaw, lngRaw] of directCandidates) {
    const lat = parseCoordinate(latRaw);
    const lng = parseCoordinate(lngRaw);
    if (isMeaningfulCoordinatePair(lat, lng)) {
      return { lat, lng };
    }
  }

  const coordinateArrays = [
    source?.coordinates,
    source?.coordinate,
    source?.center,
    source?.centroid,
    source?.geometry?.coordinates,
    source?.geojson?.coordinates,
  ];

  for (const coordinateArray of coordinateArrays) {
    const resolved = resolveCoordinatesFromCoordinateArray(coordinateArray);
    if (resolved) return resolved;
  }

  return null;
};

const resolvePrimaryCoordinates = (details) => {
  if (!details || typeof details !== "object") return null;

  const extraDetails = parseExtraDetailsSafe(details?.extra_details);

  const directCandidates = [
    [details?.map_display_latitude, details?.map_display_longitude],
    [details?.display_latitude, details?.display_longitude],
    [
      details?.translated_item?.map_display_latitude,
      details?.translated_item?.map_display_longitude,
    ],
    [
      details?.translated_item?.display_latitude,
      details?.translated_item?.display_longitude,
    ],
    [details?.latitude, details?.longitude],
    [details?.lat, details?.lng],
    [details?.lat, details?.long],
    [details?.location_latitude, details?.location_longitude],
    [details?.location_lat, details?.location_lng],
    [details?.translated_item?.latitude, details?.translated_item?.longitude],
    [details?.translated_item?.lat, details?.translated_item?.lng],
    [details?.area?.latitude, details?.area?.longitude],
    [details?.area?.lat, details?.area?.lng],
    [details?.city?.latitude, details?.city?.longitude],
    [details?.city?.lat, details?.city?.lng],
    [details?.state?.latitude, details?.state?.longitude],
    [details?.state?.lat, details?.state?.lng],
    [details?.country?.latitude, details?.country?.longitude],
    [details?.country?.lat, details?.country?.lng],
    [extraDetails?.latitude, extraDetails?.longitude],
    [extraDetails?.lat, extraDetails?.lng],
    [extraDetails?.lat, extraDetails?.long],
    [extraDetails?.map_display_latitude, extraDetails?.map_display_longitude],
    [extraDetails?.display_latitude, extraDetails?.display_longitude],
    [extraDetails?.location?.latitude, extraDetails?.location?.longitude],
    [extraDetails?.location?.lat, extraDetails?.location?.lng],
    [extraDetails?.location?.lat, extraDetails?.location?.long],
  ];

  for (const [latRaw, lngRaw] of directCandidates) {
    const lat = parseCoordinate(latRaw);
    const lng = parseCoordinate(lngRaw);
    if (isMeaningfulCoordinatePair(lat, lng)) {
      return { lat, lng };
    }
  }

  const objectCandidates = [
    details?.location,
    details?.coordinates,
    details?.geo,
    details?.geometry,
    details?.area,
    details?.city,
    details?.state,
    details?.country,
    details?.translated_item,
    details?.translated_item?.location,
    extraDetails,
    extraDetails?.location,
    extraDetails?.coordinates,
    extraDetails?.geometry,
  ];

  for (const candidate of objectCandidates) {
    const resolved = resolveCoordinatesFromObject(candidate);
    if (resolved) return resolved;
  }

  return null;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toRadians = (value) => (value * Math.PI) / 180;

const distanceBetweenCoordinatesMeters = (from, to) => {
  if (!from || !to) return Number.POSITIVE_INFINITY;
  const earthRadiusMeters = 6371000;
  const dLat = toRadians((to.lat || 0) - (from.lat || 0));
  const dLng = toRadians((to.lng || 0) - (from.lng || 0));
  const lat1 = toRadians(from.lat || 0);
  const lat2 = toRadians(to.lat || 0);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
};

const createSeed = (input) => {
  const str = String(input || "");
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
};

const obfuscateCoordinates = (lat, lng, seedInput) => {
  const seed = createSeed(seedInput);
  const angle = ((seed % 360) * Math.PI) / 180;
  const distanceMeters = 700 + (seed % 900);
  const latOffset = (distanceMeters / 111320) * Math.cos(angle);
  const lngDenominator =
    111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  const lngOffset = (distanceMeters / lngDenominator) * Math.sin(angle);

  return {
    lat: clamp(lat + latOffset, -90, 90),
    lng: clamp(lng + lngOffset, -180, 180),
  };
};

const parseLocationParts = (value) =>
  String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

const LOCATION_DISCARDED_TOKENS = new Set([
  "bih",
  "bosna i hercegovina",
  "federacija bosne i hercegovine",
  "republika srpska",
]);

const BOSNIA_COUNTRY_TOKENS = new Set([
  "bih",
  "bosna i hercegovina",
  "federacija bosne i hercegovine",
  "republika srpska",
]);

const normalizeCountryLabel = (value) => {
  const token = normalizeLocationToken(value);
  if (!token) return "";
  const lowered = token.toLowerCase();
  if (
    BOSNIA_COUNTRY_TOKENS.has(lowered) ||
    lowered.includes("bosna i hercegovina")
  ) {
    return "BiH";
  }
  return token;
};

const expandLocationCollisionTokens = (value) => {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return [];

  const parts = normalized
    .split(/[,\-/]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const words = normalized
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);

  return Array.from(new Set([normalized, ...parts, ...words]));
};

const normalizeLocationToken = (value) => {
  let token = String(value || "").trim();
  if (!token) return "";

  token = token
    .replace(/^Područje:\s*/i, "")
    .replace(/^Zona:\s*/i, "")
    .replace(/^Općina\s+/i, "")
    .replace(/^Opština\s+/i, "")
    .replace(/\bBrčko Distrikt\b/gi, "Brčko")
    .replace(/Bosansko-podrinjski(?:\s+kanton)?\s+Goražde/gi, "Goražde")
    .replace(/\bkanton\b/gi, "")
    .replace(/\bregija\b/gi, "")
    .replace(/\bžupanija\b/gi, "")
    .replace(/\bdistrikt\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,+/g, ",")
    .trim();

  if (!token) return "";

  if (LOCATION_DISCARDED_TOKENS.has(token.toLowerCase())) {
    return "";
  }

  return token;
};

// Helper za dobijanje vrijednosti iz extra_details
const getExtraDetailValue = (extraDetails, keys) => {
  if (!extraDetails) return null;
  let details = extraDetails;
  if (typeof extraDetails === "string") {
    try {
      details = JSON.parse(extraDetails);
    } catch {
      details = null;
    }
  }
  for (const key of keys) {
    if (details?.[key]) return details[key];
  }
  return null;
};

const toText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    return String(
      value?.translated_name || value?.name || value?.title || "",
    ).trim();
  }
  return "";
};

const ProductLocation = ({ productDetails, onMapOpen }) => {
  const currentLanguage = useSelector(CurrentLanguageData);
  const [resolvedLocationByPin, setResolvedLocationByPin] = useState(null);
  const [resolvedCoordinatesBySearch, setResolvedCoordinatesBySearch] =
    useState(null);

  const preciseCoordinates = useMemo(
    () => resolvePrimaryCoordinates(productDetails),
    [productDetails],
  );
  const preciseLat = preciseCoordinates?.lat ?? null;
  const preciseLng = preciseCoordinates?.lng ?? null;

  useEffect(() => {
    let cancelled = false;

    const resolveByPin = async () => {
      if (preciseLat === null || preciseLng === null) {
        setResolvedLocationByPin(null);
        return;
      }

      try {
        const response = await getLocationApi.getLocation({
          lat: preciseLat,
          lng: preciseLng,
          lang: currentLanguage?.code || "bs",
        });

        if (cancelled) return;
        if (response?.data?.error === true) {
          setResolvedLocationByPin(null);
          return;
        }

        const payload = response?.data?.data;
        const result = Array.isArray(payload)
          ? payload[0] || {}
          : payload || {};
        const area = result?.area_translation || result?.area || "";
        const city = result?.city_translation || result?.city || "";
        const state = result?.state_translation || result?.state || "";
        const country = result?.country_translation || result?.country || "";
        const composedAddress = [area, city, state, country]
          .filter(Boolean)
          .join(", ");

        setResolvedLocationByPin({
          area,
          city,
          state,
          country,
          address:
            composedAddress ||
            [city, state, country].filter(Boolean).join(", "),
        });
      } catch {
        if (!cancelled) {
          setResolvedLocationByPin(null);
        }
      }
    };

    resolveByPin();
    return () => {
      cancelled = true;
    };
  }, [currentLanguage?.code, preciseLat, preciseLng]);

  const structuredLocationText = useMemo(() => {
    const areaName = toText(
      productDetails?.area?.translated_name ||
        productDetails?.area?.name ||
        productDetails?.area_name,
    );
    const city = toText(productDetails?.city);
    const state = toText(productDetails?.state);
    const country = toText(productDetails?.country);
    return [areaName, city, state, country].filter(Boolean).join(", ");
  }, [
    productDetails?.area,
    productDetails?.area_name,
    productDetails?.city,
    productDetails?.country,
    productDetails?.state,
  ]);

  const fallbackLocationText = useMemo(
    () =>
      productDetails?.address ||
      productDetails?.formatted_address ||
      productDetails?.translated_item?.address ||
      productDetails?.translated_item?.formatted_address ||
      productDetails?.translated_address ||
      productDetails?.address_translated ||
      "",
    [
      productDetails?.address,
      productDetails?.formatted_address,
      productDetails?.translated_address,
      productDetails?.address_translated,
      productDetails?.translated_item?.address,
      productDetails?.translated_item?.formatted_address,
    ],
  );

  const municipalityOrCityFallback = useMemo(() => {
    const fromPinState = normalizeLocationToken(
      resolvedLocationByPin?.state || "",
    );
    const fromPinCity = normalizeLocationToken(
      resolvedLocationByPin?.city || "",
    );
    const fromDetailsState = normalizeLocationToken(
      productDetails?.state_translation ||
        productDetails?.state ||
        productDetails?.translated_item?.state_translation ||
        productDetails?.translated_item?.state ||
        "",
    );
    const fromDetailsCity = normalizeLocationToken(
      productDetails?.city_translation ||
        productDetails?.city ||
        productDetails?.translated_item?.city_translation ||
        productDetails?.translated_item?.city ||
        "",
    );

    return (
      fromPinState || fromPinCity || fromDetailsState || fromDetailsCity || ""
    );
  }, [
    resolvedLocationByPin?.state,
    resolvedLocationByPin?.city,
    productDetails?.state_translation,
    productDetails?.state,
    productDetails?.translated_item?.state_translation,
    productDetails?.translated_item?.state,
    productDetails?.city_translation,
    productDetails?.city,
    productDetails?.translated_item?.city_translation,
    productDetails?.translated_item?.city,
  ]);

  const effectiveLocationText = useMemo(() => {
    if (preciseLat !== null && preciseLng !== null) {
      return (
        resolvedLocationByPin?.address ||
        fallbackLocationText ||
        structuredLocationText ||
        municipalityOrCityFallback ||
        "Lokacija nije specificirana"
      );
    }

    return (
      fallbackLocationText ||
      resolvedLocationByPin?.address ||
      structuredLocationText ||
      municipalityOrCityFallback
    );
  }, [
    fallbackLocationText,
    municipalityOrCityFallback,
    preciseLat,
    preciseLng,
    resolvedLocationByPin?.address,
    structuredLocationText,
  ]);
  const locationParts = useMemo(
    () => parseLocationParts(effectiveLocationText),
    [effectiveLocationText],
  );
  const normalizedLocationParts = useMemo(
    () => locationParts.map(normalizeLocationToken).filter(Boolean),
    [locationParts],
  );

  const countryLabel = useMemo(() => {
    const localityToken = normalizeLocationToken(municipalityOrCityFallback);
    const locationCollisionCandidates = [
      localityToken,
      ...normalizedLocationParts,
      normalizeLocationToken(
        productDetails?.state_translation ||
          productDetails?.state ||
          productDetails?.translated_item?.state_translation ||
          productDetails?.translated_item?.state,
      ),
      normalizeLocationToken(
        productDetails?.city_translation ||
          productDetails?.city ||
          productDetails?.translated_item?.city_translation ||
          productDetails?.translated_item?.city,
      ),
      normalizeLocationToken(
        productDetails?.area?.translated_name ||
          productDetails?.area?.name ||
          productDetails?.area_name ||
          productDetails?.translated_item?.area_name,
      ),
    ];
    const localityCollisionTokens = new Set(
      locationCollisionCandidates
        .flatMap((entry) => expandLocationCollisionTokens(entry))
        .filter(Boolean),
    );
    const explicitCountryCandidates = [
      resolvedLocationByPin?.country,
      productDetails?.country_translation,
      productDetails?.country,
      productDetails?.translated_item?.country_translation,
      productDetails?.translated_item?.country,
    ];

    for (const candidate of explicitCountryCandidates) {
      const normalizedCountry = normalizeCountryLabel(candidate);
      if (!normalizedCountry) continue;
      if (
        localityToken &&
        normalizedCountry.toLowerCase() === localityToken.toLowerCase()
      ) {
        continue;
      }
      if (localityCollisionTokens.has(normalizedCountry.toLowerCase())) {
        continue;
      }
      if (normalizedCountry) return normalizedCountry;
    }

    if (normalizedLocationParts.length > 1) {
      const inferredCountry = normalizeCountryLabel(
        normalizedLocationParts.at(-1),
      );
      if (inferredCountry) {
        const inferredLower = inferredCountry.toLowerCase();
        if (!localityCollisionTokens.has(inferredLower)) {
          return inferredCountry;
        }
      }
    }

    return "BiH";
  }, [
    normalizedLocationParts,
    productDetails?.country_translation,
    productDetails?.country,
    productDetails?.translated_item?.country_translation,
    productDetails?.translated_item?.country,
    municipalityOrCityFallback,
    productDetails?.state_translation,
    productDetails?.state,
    productDetails?.translated_item?.state_translation,
    productDetails?.translated_item?.state,
    productDetails?.city_translation,
    productDetails?.city,
    productDetails?.translated_item?.city_translation,
    productDetails?.translated_item?.city,
    productDetails?.area?.translated_name,
    productDetails?.area?.name,
    productDetails?.area_name,
    productDetails?.translated_item?.area_name,
    resolvedLocationByPin?.country,
  ]);
  const locationPartsWithoutCountry = useMemo(() => {
    if (!normalizedLocationParts.length) return [];
    return normalizedLocationParts.filter((part, index) => {
      if (normalizedLocationParts.length <= 1) return true;
      const isLastToken = index === normalizedLocationParts.length - 1;
      if (!isLastToken) return true;
      return normalizeCountryLabel(part) !== countryLabel;
    });
  }, [countryLabel, normalizedLocationParts]);
  const regionLabel = useMemo(
    () =>
      municipalityOrCityFallback || locationPartsWithoutCountry.at(-1) || "",
    [locationPartsWithoutCountry, municipalityOrCityFallback],
  );
  const zoneLocation = useMemo(() => {
    if (municipalityOrCityFallback) return municipalityOrCityFallback;
    if (!locationPartsWithoutCountry.length) return "";
    return locationPartsWithoutCountry.slice(0, 2).join(", ");
  }, [locationPartsWithoutCountry, municipalityOrCityFallback]);
  const shortLocation = useMemo(() => {
    const primary =
      zoneLocation || regionLabel || locationPartsWithoutCountry.at(0);
    return primary || "Lokacija nije specificirana";
  }, [locationPartsWithoutCountry, regionLabel, zoneLocation]);

  const searchLocationQuery = useMemo(() => {
    const candidates = [
      municipalityOrCityFallback,
      regionLabel,
      zoneLocation,
      shortLocation,
      productDetails?.state_translation,
      productDetails?.state,
      productDetails?.city_translation,
      productDetails?.city,
      productDetails?.area?.translated_name,
      productDetails?.area?.name,
      fallbackLocationText,
      structuredLocationText,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeLocationToken(candidate);
      if (!normalized) continue;
      if (
        normalized.toLowerCase() === "lokacija nije specificirana" ||
        normalized.toLowerCase() === "lokacija nije navedena"
      ) {
        continue;
      }
      return normalized;
    }

    return "";
  }, [
    municipalityOrCityFallback,
    regionLabel,
    zoneLocation,
    shortLocation,
    productDetails?.state_translation,
    productDetails?.state,
    productDetails?.city_translation,
    productDetails?.city,
    productDetails?.area?.translated_name,
    productDetails?.area?.name,
    fallbackLocationText,
    structuredLocationText,
  ]);

  const fastSearchFallbackCoordinates = useMemo(
    () =>
      searchLocationQuery
        ? resolveCoordinatesFromLocationText(searchLocationQuery)
        : null,
    [searchLocationQuery],
  );

  useEffect(() => {
    let cancelled = false;

    const resolveBySearch = async () => {
      if (!searchLocationQuery) {
        setResolvedCoordinatesBySearch(null);
        return;
      }

      try {
        const response = await getLocationApi.getLocation({
          search: searchLocationQuery,
          lang: currentLanguage?.code || "bs",
        });

        if (cancelled) return;
        if (response?.data?.error === true) {
          const fallbackResolved =
            resolveCoordinatesFromLocationText(searchLocationQuery);
          setResolvedCoordinatesBySearch(fallbackResolved || null);
          return;
        }

        const payload = response?.data?.data;
        const firstResult = Array.isArray(payload)
          ? payload[0] || null
          : payload?.results?.[0] || payload || null;

        const resolved =
          resolveCoordinatesFromObject(firstResult) ||
          resolveCoordinatesFromLocationText(searchLocationQuery);
        if (!cancelled) {
          setResolvedCoordinatesBySearch(resolved || null);
        }
      } catch {
        if (!cancelled) {
          const fallbackResolved =
            resolveCoordinatesFromLocationText(searchLocationQuery);
          setResolvedCoordinatesBySearch(fallbackResolved || null);
        }
      }
    };

    resolveBySearch();
    return () => {
      cancelled = true;
    };
  }, [currentLanguage?.code, searchLocationQuery]);

  const effectiveCoordinates = useMemo(() => {
    const preciseCandidate = isMeaningfulCoordinatePair(preciseLat, preciseLng)
      ? { lat: preciseLat, lng: preciseLng }
      : null;
    const resolvedSearchCandidate =
      resolvedCoordinatesBySearch || fastSearchFallbackCoordinates;
    const searchCandidate = isMeaningfulCoordinatePair(
      resolvedSearchCandidate?.lat ?? null,
      resolvedSearchCandidate?.lng ?? null,
    )
      ? {
          lat: resolvedSearchCandidate.lat,
          lng: resolvedSearchCandidate.lng,
        }
      : null;

    if (preciseCandidate && searchCandidate) {
      const mismatchDistance = distanceBetweenCoordinatesMeters(
        preciseCandidate,
        searchCandidate,
      );
      const hasStrongLocalitySignal = Boolean(
        normalizeLocationToken(municipalityOrCityFallback),
      );
      if (
        hasStrongLocalitySignal &&
        mismatchDistance > COORDINATE_MISMATCH_THRESHOLD_METERS
      ) {
        return searchCandidate;
      }
      return preciseCandidate;
    }

    if (preciseCandidate) return preciseCandidate;
    if (searchCandidate) return searchCandidate;
    return null;
  }, [
    municipalityOrCityFallback,
    preciseLat,
    preciseLng,
    fastSearchFallbackCoordinates,
    resolvedCoordinatesBySearch?.lat,
    resolvedCoordinatesBySearch?.lng,
  ]);

  const obscuredCoordinates = useMemo(() => {
    if (!effectiveCoordinates) return null;
    return obfuscateCoordinates(
      effectiveCoordinates.lat,
      effectiveCoordinates.lng,
      `${productDetails?.id || productDetails?.slug || "listing"}-${effectiveLocationText}`,
    );
  }, [
    effectiveCoordinates,
    productDetails?.id,
    productDetails?.slug,
    effectiveLocationText,
  ]);

  const hasCoordinates = Boolean(obscuredCoordinates);
  const shortLocationDisplay = useMemo(() => {
    if (!shortLocation || shortLocation === "Lokacija nije specificirana") {
      return shortLocation;
    }
    return hasCoordinates ? `Okvirno ${shortLocation}` : shortLocation;
  }, [hasCoordinates, shortLocation]);
  const locationHeaderHint = hasCoordinates
    ? "Prikazujemo okvirnu zonu radi privatnosti prodavača."
    : "Lokacija je informativna (grad/općina), a tačnu adresu potvrđuje prodavač.";
  const privacyHint = hasCoordinates
    ? "Tačna adresa nije javno prikazana i dijeli se po dogovoru sa prodavačem."
    : "Prikazana lokacija je informativna i može odstupati od tačne adrese.";

  const handleShowMapClick = () => {
    const mapQuery = hasCoordinates
      ? `${obscuredCoordinates.lat},${obscuredCoordinates.lng}`
      : shortLocation || "Bosna i Hercegovina";
    const googleMapsUrl = hasCoordinates
      ? `https://www.google.com/maps?q=${mapQuery}&z=13&t=m`
      : `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=10&t=m`;
    window.open(googleMapsUrl, "_blank");
    if (onMapOpen) onMapOpen();
  };

  const handleDirectionsClick = () => {
    const destination = hasCoordinates
      ? `${obscuredCoordinates.lat},${obscuredCoordinates.lng}`
      : shortLocation || "Bosna i Hercegovina";
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination,
    )}&travelmode=driving`;
    window.open(googleMapsUrl, "_blank");
    if (onMapOpen) onMapOpen();
  };

  const handleCopyLocation = async () => {
    const locationForCopy = zoneLocation
      ? `${shortLocation} (${zoneLocation})`
      : shortLocation || effectiveLocationText;
    if (!locationForCopy) return;
    try {
      await navigator.clipboard.writeText(locationForCopy);
      toast.success("Lokacija je kopirana.");
    } catch (error) {
      console.error("Greška pri kopiranju lokacije:", error);
      toast.error("Ne mogu kopirati lokaciju. Pokušaj ponovo.");
    }
  };

  // Prepare product data for the map marker popup
  const mapProductData = useMemo(() => {
    if (!productDetails) return null;

    const area =
      productDetails?.area ||
      productDetails?.total_area ||
      getExtraDetailValue(productDetails?.extra_details, [
        "povrsina",
        "quadrature",
        "m2",
        "area",
      ]);

    const rooms =
      productDetails?.bedrooms ||
      productDetails?.rooms ||
      getExtraDetailValue(productDetails?.extra_details, [
        "broj_soba",
        "sobe",
        "rooms",
        "bedrooms",
      ]);

    const roomType = getExtraDetailValue(productDetails?.extra_details, [
      "tip_stana",
      "room_type",
      "tip_nekretnine",
      "property_type",
    ]);

    const image =
      productDetails?.image ||
      productDetails?.gallery_images?.[0]?.image ||
      productDetails?.gallery?.[0];

    return {
      title:
        productDetails?.translated_item?.name ||
        productDetails?.name ||
        productDetails?.title,
      price: parseFloat(productDetails?.price) || 0,
      image,
      area,
      rooms,
      roomType,
      createdAt: productDetails?.created_at,
      location: shortLocationDisplay,
      privacyMode: true,
    };
  }, [productDetails, shortLocationDisplay]);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 dark:border-slate-800 dark:bg-slate-900">

      <div className="flex flex-col p-4 lg:p-5 gap-4">
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
          <div className="p-2 bg-primary/10 rounded-lg mt-0.5 text-primary dark:bg-primary/20 dark:text-primary-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              id="Location-2-Fill--Streamline-Mingcute-Fill"
              height="26"
              width="26"
            >
              <g fill="none" fillRule="evenodd">
                <path
                  d="M16 0v16H0V0h16ZM8.395333333333333 15.505333333333333l-0.007333333333333332 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023333333333333334c-0.006666666666666666 -0.0026666666666666666 -0.012666666666666666 -0.0006666666666666666 -0.016 0.003333333333333333l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.011333333333333334 -0.011999999999999999Zm0.17666666666666667 -0.07533333333333334 -0.008666666666666666 0.0013333333333333333 -0.12333333333333332 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.004666666666666666 0.134 0.062c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.0026666666666666666 -0.007333333333333332 0.011333333333333334 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z"
                  strokeWidth="0.6667"
                ></path>
                <path
                  fill="#0ab6af"
                  fillRule="nonzero"
                  d="M4.4799999999999995 11.093333333333334a0.6666666666666666 0.6666666666666666 0 0 1 0.37333333333333335 1.2799999999999998c-0.3333333333333333 0.09733333333333333 -0.5733333333333333 0.19999999999999998 -0.7273333333333333 0.29333333333333333 0.15866666666666665 0.09533333333333333 0.4093333333333333 0.20199999999999999 0.7573333333333332 0.30133333333333334C5.653333333333333 13.187999999999999 6.755333333333333 13.333333333333332 8 13.333333333333332s2.3466666666666667 -0.14533333333333331 3.1166666666666663 -0.36533333333333334c0.3486666666666667 -0.09933333333333333 0.5986666666666667 -0.206 0.7573333333333332 -0.30133333333333334 -0.15333333333333332 -0.09333333333333334 -0.3933333333333333 -0.19599999999999998 -0.7266666666666667 -0.29333333333333333a0.6666666666666666 0.6666666666666666 0 0 1 0.3726666666666667 -1.2799999999999998c0.44533333333333336 0.13 0.8533333333333333 0.29666666666666663 1.1666666666666665 0.5106666666666666 0.29 0.1993333333333333 0.6466666666666666 0.5466666666666666 0.6466666666666666 1.0626666666666666 0 0.522 -0.36533333333333334 0.872 -0.6599999999999999 1.0713333333333332 -0.31866666666666665 0.21466666666666667 -0.7353333333333333 0.38199999999999995 -1.1906666666666665 0.512C10.564 14.513333333333332 9.333333333333332 14.666666666666666 8 14.666666666666666s-2.564 -0.15333333333333332 -3.482666666666667 -0.41666666666666663c-0.45533333333333337 -0.13 -0.872 -0.29733333333333334 -1.1906666666666665 -0.512 -0.29466666666666663 -0.19999999999999998 -0.6599999999999999 -0.5493333333333332 -0.6599999999999999 -1.0713333333333332 0 -0.516 0.3566666666666667 -0.8633333333333333 0.6466666666666666 -1.0626666666666666 0.3133333333333333 -0.214 0.7213333333333334 -0.3806666666666666 1.1666666666666665 -0.5106666666666666ZM8 1.3333333333333333a5 5 0 0 1 5 5c0 1.712 -0.9333333333333332 3.1039999999999996 -1.9 4.093333333333333 -0.41 0.41866666666666663 -0.84 0.7793333333333333 -1.2353333333333332 1.0766666666666667 -0.39599999999999996 0.29733333333333334 -1.3013333333333332 0.8546666666666667 -1.3013333333333332 0.8546666666666667a1.14 1.14 0 0 1 -1.1266666666666665 0 13.824 13.824 0 0 1 -1.3013333333333332 -0.8546666666666667A10.86 10.86 0 0 1 4.8999999999999995 10.426666666666666C3.9333333333333336 9.437333333333333 3 8.045333333333332 3 6.333333333333333A5 5 0 0 1 8 1.3333333333333333Zm0 3.6666666666666665a1.3333333333333333 1.3333333333333333 0 1 0 0 2.6666666666666665 1.3333333333333333 1.3333333333333333 0 0 0 0 -2.6666666666666665Z"
                  strokeWidth="0.6667"
                ></path>
              </g>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 break-words leading-relaxed dark:text-slate-200">
              {shortLocationDisplay}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {regionLabel ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Regija: {regionLabel}
                </span>
              ) : null}
              {countryLabel ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Država: {countryLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {privacyHint}
            </p>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-100 h-64 relative dark:border-slate-800 dark:bg-slate-800">
          <Map
            latitude={obscuredCoordinates?.lat}
            longitude={obscuredCoordinates?.lng}
            productData={mapProductData}
            privacyMode
            approximateRadiusMeters={MAP_PRIVACY_RADIUS_METERS}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm dark:bg-slate-700 dark:hover:bg-slate-600"
            onClick={handleShowMapClick}
          >
            <MdOpenInNew className="text-lg" />
            Otvori zonu
          </button>
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-primary/10 text-primary hover:bg-primary/20 font-bold rounded-xl transition-all active:scale-[0.98] border border-primary/20 dark:bg-primary/20 dark:text-primary-200 dark:hover:bg-primary/30"
            onClick={handleDirectionsClick}
          >
            <MdDirections className="text-lg" />
            Ruta do zone
          </button>
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 font-bold rounded-xl transition-all active:scale-[0.98] border border-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200"
            onClick={handleCopyLocation}
          >
            <IoCopyOutline className="text-lg" />
            Kopiraj lokaciju
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductLocation;
