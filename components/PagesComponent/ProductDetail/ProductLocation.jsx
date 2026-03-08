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
import { isRealEstateItem } from "@/utils/realEstatePricing";
import {
  searchLocations as searchBiHLocations,
} from "@/lib/bih-locations";

const LOCATION_SEARCH_SCORE_MATCH_THRESHOLD = 70;
const MAP_PRIVACY_RADIUS_REAL_ESTATE_METERS = 100;
const MAP_PRIVACY_RADIUS_FALLBACK_METERS = 1800;
const MAP_PRIVACY_RADIUS_MIN_METERS = 350;
const MAP_PRIVACY_RADIUS_MAX_METERS = 9000;
const MAP_PRIVACY_RADIUS_MAX_CITY_METERS = 7000;
const MAP_PRIVACY_RADIUS_MAX_MUNICIPALITY_METERS = 3200;
const COORDINATE_MISMATCH_FALLBACK_METERS = 6000;
const INTERNAL_NOMINATIM_ENDPOINT = "/internal-api/nominatim";
const NOMINATIM_MAX_RESULTS = 6;

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

const normalizeBounds = ({ minLat, maxLat, minLng, maxLng }) => {
  const south = parseCoordinate(minLat);
  const north = parseCoordinate(maxLat);
  const west = parseCoordinate(minLng);
  const east = parseCoordinate(maxLng);

  if (
    !isValidLatitude(south) ||
    !isValidLatitude(north) ||
    !isValidLongitude(west) ||
    !isValidLongitude(east)
  ) {
    return null;
  }

  const normalized = {
    minLat: Math.min(south, north),
    maxLat: Math.max(south, north),
    minLng: Math.min(west, east),
    maxLng: Math.max(west, east),
  };

  const hasArea =
    Math.abs(normalized.maxLat - normalized.minLat) > 0.000001 ||
    Math.abs(normalized.maxLng - normalized.minLng) > 0.000001;
  if (!hasArea) return null;

  return normalized;
};

const resolveBoundsFromArray = (rawBounds) => {
  if (!Array.isArray(rawBounds) || rawBounds.length < 4) return null;
  const values = rawBounds.slice(0, 4).map((entry) => parseCoordinate(entry));
  if (values.some((entry) => entry === null)) return null;

  const [a, b, c, d] = values;

  // Nominatim: [south, north, west, east]
  const asNominatim = normalizeBounds({
    minLat: a,
    maxLat: b,
    minLng: c,
    maxLng: d,
  });

  // GeoJSON bbox: [west, south, east, north]
  const asGeoJson = normalizeBounds({
    minLat: b,
    maxLat: d,
    minLng: a,
    maxLng: c,
  });

  if (asNominatim && !asGeoJson) return asNominatim;
  if (asGeoJson && !asNominatim) return asGeoJson;
  if (!asGeoJson && !asNominatim) return null;

  const nominatimArea =
    (asNominatim.maxLat - asNominatim.minLat) *
    (asNominatim.maxLng - asNominatim.minLng);
  const geoJsonArea =
    (asGeoJson.maxLat - asGeoJson.minLat) *
    (asGeoJson.maxLng - asGeoJson.minLng);

  return nominatimArea <= geoJsonArea ? asNominatim : asGeoJson;
};

const resolveCoordinatesFromPointLikeValue = (value) => {
  if (!value) return null;
  if (Array.isArray(value) && value.length >= 2) {
    const first = parseCoordinate(value[0]);
    const second = parseCoordinate(value[1]);
    if (isMeaningfulCoordinatePair(first, second)) {
      return { lat: first, lng: second };
    }
    if (isMeaningfulCoordinatePair(second, first)) {
      return { lat: second, lng: first };
    }
    return null;
  }
  return resolveCoordinatesFromObject(value);
};

const resolveBoundsFromPointPair = (southWest, northEast) => {
  if (!southWest || !northEast) return null;

  const sw = resolveCoordinatesFromPointLikeValue(southWest);
  const ne = resolveCoordinatesFromPointLikeValue(northEast);

  if (!sw || !ne) return null;
  return normalizeBounds({
    minLat: sw.lat,
    maxLat: ne.lat,
    minLng: sw.lng,
    maxLng: ne.lng,
  });
};

const resolveBoundsFromObject = (source) => {
  if (!source || typeof source !== "object") return null;

  const arrayCandidates = [
    source?.boundingbox,
    source?.bounding_box,
    source?.bbox,
    source?.geojson?.bbox,
    source?.geometry?.bbox,
    source?.envelope,
    source?.extent,
  ];

  for (const rawBounds of arrayCandidates) {
    const resolved = resolveBoundsFromArray(rawBounds);
    if (resolved) return resolved;
  }

  const directObjectBounds = normalizeBounds({
    minLat:
      source?.south ??
      source?.minLat ??
      source?.min_lat ??
      source?.minLatitude ??
      source?.min_latitude,
    maxLat:
      source?.north ??
      source?.maxLat ??
      source?.max_lat ??
      source?.maxLatitude ??
      source?.max_latitude,
    minLng:
      source?.west ??
      source?.minLng ??
      source?.min_lng ??
      source?.minLongitude ??
      source?.min_longitude,
    maxLng:
      source?.east ??
      source?.maxLng ??
      source?.max_lng ??
      source?.maxLongitude ??
      source?.max_longitude,
  });
  if (directObjectBounds) return directObjectBounds;

  const objectCandidates = [source?.bounds, source?.viewport];
  for (const boundsObject of objectCandidates) {
    if (!boundsObject || typeof boundsObject !== "object") continue;

    const directBounds = normalizeBounds({
      minLat:
        boundsObject?.south ??
        boundsObject?.minLat ??
        boundsObject?.min_lat,
      maxLat:
        boundsObject?.north ??
        boundsObject?.maxLat ??
        boundsObject?.max_lat,
      minLng:
        boundsObject?.west ??
        boundsObject?.minLng ??
        boundsObject?.min_lng,
      maxLng:
        boundsObject?.east ??
        boundsObject?.maxLng ??
        boundsObject?.max_lng,
    });
    if (directBounds) return directBounds;

    const fromPoints = resolveBoundsFromPointPair(
      boundsObject?.southwest || boundsObject?.sw || boundsObject?.southWest,
      boundsObject?.northeast || boundsObject?.ne || boundsObject?.northEast,
    );
    if (fromPoints) return fromPoints;
  }

  return null;
};

const getCenterFromBounds = (bounds) => {
  if (!bounds) return null;
  const lat = (bounds.minLat + bounds.maxLat) / 2;
  const lng = (bounds.minLng + bounds.maxLng) / 2;
  if (!isMeaningfulCoordinatePair(lat, lng)) return null;
  return { lat, lng };
};

const sanitizeLinearRingCoordinates = (ring) => {
  if (!Array.isArray(ring)) return null;

  const points = [];
  for (const point of ring) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const lng = parseCoordinate(point[0]);
    const lat = parseCoordinate(point[1]);
    if (!isMeaningfulCoordinatePair(lat, lng)) continue;
    points.push([lng, lat]);
  }

  if (points.length < 3) return null;

  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    points.push([...first]);
  }

  if (points.length < 4) return null;
  return points;
};

const sanitizeGeoJsonGeometry = (geometry) => {
  if (!geometry || typeof geometry !== "object") return null;
  const type = String(geometry?.type || "");
  const coordinates = geometry?.coordinates;

  if (type === "Polygon") {
    if (!Array.isArray(coordinates)) return null;
    const rings = coordinates
      .map((ring) => sanitizeLinearRingCoordinates(ring))
      .filter(Boolean);
    if (!rings.length) return null;
    return { type: "Polygon", coordinates: rings };
  }

  if (type === "MultiPolygon") {
    if (!Array.isArray(coordinates)) return null;
    const polygons = coordinates
      .map((polygon) => {
        if (!Array.isArray(polygon)) return null;
        const rings = polygon
          .map((ring) => sanitizeLinearRingCoordinates(ring))
          .filter(Boolean);
        return rings.length ? rings : null;
      })
      .filter(Boolean);
    if (!polygons.length) return null;
    return { type: "MultiPolygon", coordinates: polygons };
  }

  return null;
};

const toFeatureWithSanitizedGeometry = (candidate) => {
  if (!candidate || typeof candidate !== "object") return null;

  if (String(candidate?.type || "") === "Feature") {
    const sanitizedGeometry = sanitizeGeoJsonGeometry(candidate?.geometry);
    if (!sanitizedGeometry) return null;
    return {
      type: "Feature",
      geometry: sanitizedGeometry,
      properties:
        candidate?.properties && typeof candidate.properties === "object"
          ? candidate.properties
          : {},
    };
  }

  const sanitizedGeometry = sanitizeGeoJsonGeometry(candidate);
  if (!sanitizedGeometry) return null;
  return { type: "Feature", geometry: sanitizedGeometry, properties: {} };
};

const resolveZoneGeoJsonFromObject = (source) => {
  if (!source || typeof source !== "object") return null;

  const direct = toFeatureWithSanitizedGeometry(source);
  if (direct) return direct;

  const nestedCandidates = [
    source?.geojson,
    source?.geometry,
    source?.polygon_geojson,
    source?.polygon,
    source?.shape,
    source?.boundary,
    source?.feature,
    source?.feature?.geometry,
  ];

  for (const candidate of nestedCandidates) {
    if (!candidate) continue;
    let parsedCandidate = candidate;
    if (typeof candidate === "string") {
      try {
        parsedCandidate = JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    const parsed = toFeatureWithSanitizedGeometry(parsedCandidate);
    if (parsed) return parsed;
  }

  return null;
};

const resolveBoundsFromGeoJson = (geoJsonFeature) => {
  if (!geoJsonFeature || typeof geoJsonFeature !== "object") return null;

  const coordinates = geoJsonFeature?.geometry?.coordinates;
  if (!coordinates) return null;

  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let hasPoint = false;

  const walk = (node) => {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && !Array.isArray(node[0])) {
      const lng = parseCoordinate(node[0]);
      const lat = parseCoordinate(node[1]);
      if (!isMeaningfulCoordinatePair(lat, lng)) return;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      hasPoint = true;
      return;
    }
    node.forEach(walk);
  };

  walk(coordinates);
  if (!hasPoint) return null;

  return normalizeBounds({ minLat, maxLat, minLng, maxLng });
};

const toSearchCandidatesArray = (payload) => {
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload?.results)) return payload.results.filter(Boolean);
  if (payload && typeof payload === "object") return [payload];
  return [];
};

const collectSearchResultTokens = (result) => {
  if (!result || typeof result !== "object") return [];
  const addressValues =
    result?.address && typeof result.address === "object"
      ? Object.values(result.address)
      : [];
  const values = [
    result?.display_name,
    result?.formatted,
    result?.formatted_address,
    result?.address,
    result?.name,
    result?.title,
    result?.area_translation,
    result?.area,
    result?.city_translation,
    result?.city,
    result?.state_translation,
    result?.state,
    result?.country_translation,
    result?.country,
    result?.location,
    result?.label,
    ...addressValues,
  ];
  return values.map((value) => normalizeText(value)).filter(Boolean);
};

const ADMINISTRATIVE_ADDRESS_TYPES = new Set([
  "municipality",
  "city",
  "town",
  "village",
  "district",
  "borough",
  "suburb",
  "quarter",
  "neighbourhood",
]);

const MUNICIPALITY_PREFERRED_ADDRESS_TYPES = new Set([
  "municipality",
  "district",
  "borough",
  "suburb",
  "quarter",
  "neighbourhood",
  "town",
  "village",
]);

const POINT_OF_INTEREST_ADDRESS_TYPES = new Set([
  "amenity",
  "shop",
  "tourism",
  "office",
  "building",
  "commercial",
  "education",
  "healthcare",
]);

const POINT_OF_INTEREST_CATEGORIES = new Set([
  "amenity",
  "shop",
  "tourism",
  "leisure",
  "building",
  "office",
  "highway",
  "railway",
]);

const tokenizeLocationWords = (value) =>
  normalizeText(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);

const collectSearchResultWordSet = (result) => {
  const wordSet = new Set();
  collectSearchResultTokens(result).forEach((token) => {
    tokenizeLocationWords(token).forEach((word) => {
      wordSet.add(word);
    });
  });
  return wordSet;
};

const allWordsMatch = (wordSet, words = []) => {
  if (!Array.isArray(words) || !words.length) return false;
  return words.every((word) => wordSet.has(word));
};

const dedupeWordGroups = (groups = []) => {
  const deduped = [];
  const seen = new Set();

  groups.forEach((group) => {
    if (!Array.isArray(group) || !group.length) return;
    const normalizedGroup = Array.from(
      new Set(group.map((word) => String(word || "").trim()).filter(Boolean)),
    );
    if (!normalizedGroup.length) return;
    const key = normalizedGroup.join("|");
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(normalizedGroup);
  });

  return deduped;
};

const buildLocationSearchIntent = (query) => {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) return null;

  const libraryMatches = searchBiHLocations(normalizedQuery).slice(0, 6);
  if (!libraryMatches.length) return null;

  const primaryMatch = libraryMatches[0];
  const cityName = normalizeLocationToken(primaryMatch?.cityName || "");
  const municipalityName = normalizeLocationToken(
    primaryMatch?.municipalityName || "",
  );

  const cityWords = Array.from(new Set(tokenizeLocationWords(cityName)));
  const municipalityWords = Array.from(
    new Set(tokenizeLocationWords(municipalityName)),
  );
  const municipalityDistinctWords = municipalityWords.filter(
    (word) => !cityWords.includes(word),
  );
  const municipalityWordGroups = dedupeWordGroups([
    municipalityDistinctWords,
    municipalityWords,
  ]);

  const expectsMunicipality = Boolean(
    primaryMatch?.municipalityId || municipalityWordGroups.length,
  );
  const granularity = expectsMunicipality
    ? "municipality"
    : cityWords.length
      ? "city"
      : "generic";

  return {
    cityName,
    municipalityName,
    cityWords,
    municipalityWordGroups,
    expectsMunicipality,
    granularity,
  };
};

const estimateBoundsRadiusMeters = (bounds) => {
  if (!bounds) return null;

  const minLat = parseCoordinate(bounds?.minLat);
  const maxLat = parseCoordinate(bounds?.maxLat);
  const minLng = parseCoordinate(bounds?.minLng);
  const maxLng = parseCoordinate(bounds?.maxLng);

  if (
    !isValidLatitude(minLat) ||
    !isValidLatitude(maxLat) ||
    !isValidLongitude(minLng) ||
    !isValidLongitude(maxLng)
  ) {
    return null;
  }

  const centerLat = (minLat + maxLat) / 2;
  const latSpanMeters = Math.abs(maxLat - minLat) * 111320;
  const lngSpanMeters =
    Math.abs(maxLng - minLng) *
    111320 *
    Math.max(Math.cos((centerLat * Math.PI) / 180), 0.2);

  if (!Number.isFinite(latSpanMeters) || !Number.isFinite(lngSpanMeters)) {
    return null;
  }

  const halfDiagonal =
    Math.sqrt(latSpanMeters * latSpanMeters + lngSpanMeters * lngSpanMeters) /
    2;
  return Number.isFinite(halfDiagonal) && halfDiagonal > 0
    ? halfDiagonal
    : null;
};

const getMinZoneRadiusForGranularity = (granularity = "generic") => {
  if (granularity === "municipality") return 700;
  if (granularity === "city") return 1600;
  return 500;
};

const isResultAdministrativeBoundary = (result) => {
  const category = normalizeText(result?.category);
  const type = normalizeText(result?.type);
  const addresstype = normalizeText(result?.addresstype);

  return (
    (category === "boundary" || type === "administrative") &&
    ADMINISTRATIVE_ADDRESS_TYPES.has(addresstype)
  );
};

const isBoundsUsableForGranularity = (bounds, granularity = "generic") => {
  const estimatedRadiusMeters = estimateBoundsRadiusMeters(bounds);
  if (!Number.isFinite(estimatedRadiusMeters)) return false;
  return estimatedRadiusMeters >= getMinZoneRadiusForGranularity(granularity);
};

const scoreSearchResultForQuery = (
  result,
  normalizedQuery,
  locationIntent = null,
) => {
  if (!normalizedQuery) return 0;
  const tokens = collectSearchResultTokens(result);
  if (!tokens.length) return 0;

  let bestScore = 0;
  for (const token of tokens) {
    if (token === normalizedQuery) {
      bestScore = Math.max(bestScore, 120);
      continue;
    }
    if (token.startsWith(normalizedQuery)) {
      bestScore = Math.max(bestScore, 96);
      continue;
    }
    if (token.includes(normalizedQuery)) {
      bestScore = Math.max(bestScore, 84);
      continue;
    }
    if (normalizedQuery.startsWith(token) && token.length >= 4) {
      bestScore = Math.max(bestScore, 60);
      continue;
    }
  }

  const addresstype = normalizeText(result?.addresstype);
  const category = normalizeText(result?.category);
  const type = normalizeText(result?.type);
  const placeRank = Number(result?.place_rank);
  const geoType = normalizeText(result?.geojson?.type);
  const bounds = resolveBoundsFromObject(result);
  const isAdministrativeBoundaryResult = isResultAdministrativeBoundary(result);
  const isPointOfInterestResult =
    POINT_OF_INTEREST_ADDRESS_TYPES.has(addresstype) ||
    POINT_OF_INTEREST_CATEGORIES.has(category);
  const approximateZoneRadiusMeters = estimateBoundsRadiusMeters(bounds);

  let adjustedScore = bestScore;
  const resultCoordinates = resolveCoordinatesFromObject(result);
  if (
    bestScore > 0 &&
    isMeaningfulCoordinatePair(
      resultCoordinates?.lat ?? null,
      resultCoordinates?.lng ?? null,
    )
  ) {
    adjustedScore += 8;
  }

  if (category === "boundary" || type === "administrative") {
    adjustedScore += 28;
  }
  if (ADMINISTRATIVE_ADDRESS_TYPES.has(addresstype)) {
    adjustedScore += 20;
  }
  if (Number.isFinite(placeRank) && placeRank <= 16) {
    adjustedScore += 8;
  }

  if (isPointOfInterestResult) {
    adjustedScore -= 30;
  }

  if (geoType === "polygon" || geoType === "multipolygon") {
    adjustedScore += 10;
  } else if (geoType === "point") {
    adjustedScore -= 16;
  }

  if (bounds) {
    const latSpan = Math.abs(bounds.maxLat - bounds.minLat);
    const lngSpan = Math.abs(bounds.maxLng - bounds.minLng);
    const isTinyArea = latSpan < 0.002 && lngSpan < 0.002;
    if (isTinyArea) adjustedScore -= 12;
  }

  if (locationIntent) {
    const resultWordSet = collectSearchResultWordSet(result);
    const cityWords = locationIntent?.cityWords || [];
    const municipalityWordGroups = locationIntent?.municipalityWordGroups || [];

    if (cityWords.length) {
      adjustedScore += allWordsMatch(resultWordSet, cityWords) ? 14 : -18;
    }

    if (locationIntent?.expectsMunicipality) {
      const hasMunicipalityMatch = municipalityWordGroups.some((group) =>
        allWordsMatch(resultWordSet, group),
      );

      adjustedScore += hasMunicipalityMatch ? 56 : -56;

      if (MUNICIPALITY_PREFERRED_ADDRESS_TYPES.has(addresstype)) {
        adjustedScore += 28;
      }
      if (addresstype === "city" || addresstype === "county") {
        adjustedScore -= 30;
      }
      if (!(category === "boundary" || type === "administrative")) {
        adjustedScore -= 20;
      }
      if (isPointOfInterestResult) {
        adjustedScore -= 95;
      }
      if (!isAdministrativeBoundaryResult) {
        adjustedScore -= 45;
      }
      if (
        Number.isFinite(approximateZoneRadiusMeters) &&
        approximateZoneRadiusMeters <
          getMinZoneRadiusForGranularity("municipality")
      ) {
        adjustedScore -= 80;
      }
    } else if (locationIntent?.granularity === "city") {
      if (isPointOfInterestResult) {
        adjustedScore -= 55;
      }
      if (
        Number.isFinite(approximateZoneRadiusMeters) &&
        approximateZoneRadiusMeters < getMinZoneRadiusForGranularity("city")
      ) {
        adjustedScore -= 40;
      }
    }
  }

  return adjustedScore;
};

const pickBestSearchResult = (payload, searchQuery, locationIntent = null) => {
  const results = toSearchCandidatesArray(payload);
  if (!results.length) return null;
  const normalizedQuery = normalizeText(searchQuery);

  let bestResult = null;
  let bestScore = -1;

  for (const result of results) {
    const score = scoreSearchResultForQuery(
      result,
      normalizedQuery,
      locationIntent,
    );
    if (score > bestScore) {
      bestScore = score;
      bestResult = result;
    }
  }

  if (bestScore < LOCATION_SEARCH_SCORE_MATCH_THRESHOLD) return null;
  return bestResult || null;
};

const buildMunicipalityAliases = (municipalityName, cityName) => {
  const normalizedMunicipality = String(municipalityName || "").trim();
  if (!normalizedMunicipality) return [];

  const aliases = [normalizedMunicipality];
  const cityWords = new Set(tokenizeLocationWords(cityName));
  const strippedAliasWords = normalizedMunicipality
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      const normalizedEntry = tokenizeLocationWords(entry)[0];
      return normalizedEntry ? !cityWords.has(normalizedEntry) : true;
    });
  if (strippedAliasWords.length) {
    aliases.push(strippedAliasWords.join(" "));
  }

  normalizedMunicipality
    .split("-")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 3)
    .forEach((entry) => {
      aliases.push(entry);
    });

  const deduped = [];
  const seen = new Set();
  aliases.forEach((alias) => {
    const key = normalizeText(alias);
    if (!key || seen.has(key)) return;
    seen.add(key);
    deduped.push(alias);
  });

  return deduped.slice(0, 3);
};

const buildLocationSearchVariants = (query) => {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) return [];

  const libraryMatches = searchBiHLocations(normalizedQuery).slice(0, 6);
  const strictAdministrativeVariants = [];
  libraryMatches.forEach((entry) => {
    const municipalityName = String(entry?.municipalityName || "").trim();
    const cityName = String(entry?.cityName || "").trim();

    if (municipalityName && cityName) {
      const municipalityAliases = buildMunicipalityAliases(
        municipalityName,
        cityName,
      );
      strictAdministrativeVariants.push(
        `Općina ${municipalityName}, ${cityName}, Bosna i Hercegovina`,
        `Opština ${municipalityName}, ${cityName}, Bosna i Hercegovina`,
        `Grad ${cityName}, Općina ${municipalityName}, Bosna i Hercegovina`,
        `${municipalityName}, ${cityName}, Bosna i Hercegovina`,
      );

      municipalityAliases.forEach((alias) => {
        strictAdministrativeVariants.push(
          `Općina ${alias}, ${cityName}, Bosna i Hercegovina`,
          `Opština ${alias}, ${cityName}, Bosna i Hercegovina`,
          `${cityName} - ${alias}, Bosna i Hercegovina`,
        );
      });
      return;
    }

    if (cityName) {
      strictAdministrativeVariants.push(
        `Grad ${cityName}, Bosna i Hercegovina`,
        `${cityName}, Bosna i Hercegovina`,
      );
    }
  });

  const variants = [
    ...strictAdministrativeVariants,
    normalizedQuery,
    `${normalizedQuery}, Bosna i Hercegovina`,
    `${normalizedQuery}, BiH`,
    ...libraryMatches.map((entry) => entry?.displayName),
    ...libraryMatches.map((entry) => entry?.formatted),
  ];

  const deduped = [];
  const seen = new Set();
  for (const value of variants) {
    const trimmed = String(value || "").trim();
    if (!trimmed) continue;
    const key = normalizeText(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(trimmed);
  }

  return deduped.slice(0, 8);
};

const getCoordinatesFromNominatimResult = (result) => {
  if (!result || typeof result !== "object") return null;
  const lat = parseCoordinate(result?.lat);
  const lng = parseCoordinate(
    result?.lon ?? result?.lng ?? result?.long ?? result?.longitude,
  );
  if (!isMeaningfulCoordinatePair(lat, lng)) return null;
  return { lat, lng };
};

const buildResolvedSearchCandidate = (result) => {
  if (!result || typeof result !== "object") return null;

  const zoneGeoJson = resolveZoneGeoJsonFromObject(result);
  const bounds =
    resolveBoundsFromObject(result) || resolveBoundsFromGeoJson(zoneGeoJson);
  const coordinates =
    resolveCoordinatesFromObject(result) ||
    getCoordinatesFromNominatimResult(result) ||
    getCenterFromBounds(bounds);

  if (!isMeaningfulCoordinatePair(coordinates?.lat, coordinates?.lng)) {
    return null;
  }

  return {
    lat: coordinates.lat,
    lng: coordinates.lng,
    bounds: bounds || null,
    zoneGeoJson: zoneGeoJson || null,
  };
};

const resolveCoordinatesViaNominatim = async ({
  searchVariants = [],
  baseQuery = "",
  languageCode = "bs",
  locationIntent = null,
}) => {
  const candidateQueries = [...searchVariants, baseQuery]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  if (!candidateQueries.length) return null;

  let bestCandidate = null;
  let bestScore = -1;

  for (const query of candidateQueries.slice(0, 5)) {
    const params = new URLSearchParams({
      q: query,
      limit: String(NOMINATIM_MAX_RESULTS),
    });
    if (languageCode) {
      params.set("accept-language", languageCode);
    }

    let response = null;
    try {
      response = await fetch(
        `${INTERNAL_NOMINATIM_ENDPOINT}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );
    } catch {
      continue;
    }
    if (!response?.ok) continue;

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      continue;
    }
    const results = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
    if (!results.length) continue;

    for (const result of results) {
      const candidate = buildResolvedSearchCandidate(result);
      if (!candidate) continue;
      const candidateGranularity = locationIntent?.expectsMunicipality
        ? "municipality"
        : locationIntent?.granularity || "generic";
      const hasUsableCandidateBounds = isBoundsUsableForGranularity(
        candidate?.bounds,
        candidateGranularity,
      );

      if (locationIntent?.expectsMunicipality && !hasUsableCandidateBounds) {
        continue;
      }

      const score = Math.max(
        scoreSearchResultForQuery(
          result,
          normalizeText(baseQuery || query),
          locationIntent,
        ),
        scoreSearchResultForQuery(
          result,
          normalizeText(query),
          locationIntent,
        ),
      );
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }
  }

  if (!bestCandidate) return null;
  if (bestScore < LOCATION_SEARCH_SCORE_MATCH_THRESHOLD) return null;
  return bestCandidate;
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

const resolveExactPinCoordinates = (details) => {
  if (!details || typeof details !== "object") return null;

  const extraDetails = parseExtraDetailsSafe(details?.extra_details);

  const exactCandidates = [
    [details?.latitude, details?.longitude],
    [details?.lat, details?.lng],
    [details?.lat, details?.long],
    [details?.location_latitude, details?.location_longitude],
    [details?.location_lat, details?.location_lng],
    [details?.translated_item?.latitude, details?.translated_item?.longitude],
    [details?.translated_item?.lat, details?.translated_item?.lng],
    [details?.translated_item?.lat, details?.translated_item?.long],
    [extraDetails?.latitude, extraDetails?.longitude],
    [extraDetails?.lat, extraDetails?.lng],
    [extraDetails?.lat, extraDetails?.long],
    [extraDetails?.location?.latitude, extraDetails?.location?.longitude],
    [extraDetails?.location?.lat, extraDetails?.location?.lng],
    [extraDetails?.location?.lat, extraDetails?.location?.long],
    [extraDetails?.pin_latitude, extraDetails?.pin_longitude],
    [extraDetails?.pin_lat, extraDetails?.pin_lng],
    [extraDetails?.pin_lat, extraDetails?.pin_long],
  ];

  for (const [latRaw, lngRaw] of exactCandidates) {
    const lat = parseCoordinate(latRaw);
    const lng = parseCoordinate(lngRaw);
    if (isMeaningfulCoordinatePair(lat, lng)) {
      return { lat, lng };
    }
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

const isCoordinateWithinBounds = (coordinates, bounds) => {
  if (!coordinates || !bounds) return false;
  if (!isMeaningfulCoordinatePair(coordinates.lat, coordinates.lng)) return false;

  return (
    coordinates.lat >= bounds.minLat &&
    coordinates.lat <= bounds.maxLat &&
    coordinates.lng >= bounds.minLng &&
    coordinates.lng <= bounds.maxLng
  );
};

const getRadiusMaxForGranularity = (granularity = "generic") => {
  if (granularity === "municipality") {
    return MAP_PRIVACY_RADIUS_MAX_MUNICIPALITY_METERS;
  }
  if (granularity === "city") {
    return MAP_PRIVACY_RADIUS_MAX_CITY_METERS;
  }
  return MAP_PRIVACY_RADIUS_MAX_METERS;
};

const getRadiusFallbackForGranularity = (granularity = "generic") => {
  if (granularity === "municipality") return 1200;
  if (granularity === "city") return 2200;
  return MAP_PRIVACY_RADIUS_FALLBACK_METERS;
};

const estimateRadiusFromBoundsMeters = (
  bounds,
  {
    minMeters = MAP_PRIVACY_RADIUS_MIN_METERS,
    maxMeters = MAP_PRIVACY_RADIUS_MAX_METERS,
  } = {},
) => {
  if (!bounds) return null;

  const center = getCenterFromBounds(bounds);
  if (!center) return null;

  const westPoint = { lat: center.lat, lng: bounds.minLng };
  const eastPoint = { lat: center.lat, lng: bounds.maxLng };
  const southPoint = { lat: bounds.minLat, lng: center.lng };
  const northPoint = { lat: bounds.maxLat, lng: center.lng };

  const widthMeters = distanceBetweenCoordinatesMeters(westPoint, eastPoint);
  const heightMeters = distanceBetweenCoordinatesMeters(southPoint, northPoint);

  if (!Number.isFinite(widthMeters) || !Number.isFinite(heightMeters)) {
    return null;
  }
  if (widthMeters <= 0 || heightMeters <= 0) return null;

  const equivalentAreaRadius = Math.sqrt((widthMeters * heightMeters) / Math.PI);
  const halfDiagonal =
    Math.sqrt(widthMeters * widthMeters + heightMeters * heightMeters) / 2;
  const normalizedRadius = Math.max(equivalentAreaRadius, halfDiagonal * 0.72);

  return clamp(
    normalizedRadius,
    minMeters,
    maxMeters,
  );
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
  const isRealEstateAd = useMemo(
    () => isRealEstateItem(productDetails || {}),
    [productDetails],
  );

  const exactPinCoordinates = useMemo(
    () => resolveExactPinCoordinates(productDetails),
    [productDetails],
  );
  const primaryCoordinates = useMemo(
    () => resolvePrimaryCoordinates(productDetails),
    [productDetails],
  );
  const shouldForceRealEstatePinCoordinates = useMemo(() => {
    if (!isRealEstateAd) return false;
    if (!exactPinCoordinates) return false;
    return true;
  }, [isRealEstateAd, exactPinCoordinates]);

  const preciseCoordinates = useMemo(
    () =>
      shouldForceRealEstatePinCoordinates
        ? exactPinCoordinates
        : primaryCoordinates,
    [
      shouldForceRealEstatePinCoordinates,
      exactPinCoordinates,
      primaryCoordinates,
    ],
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
    const fromDetailsArea = normalizeLocationToken(
      productDetails?.area?.translated_name ||
        productDetails?.area?.name ||
        productDetails?.area_name ||
        productDetails?.translated_item?.area_name ||
        "",
    );
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
      fromDetailsArea ||
      fromDetailsState ||
      fromDetailsCity ||
      fromPinState ||
      fromPinCity ||
      ""
    );
  }, [
    productDetails?.area?.translated_name,
    productDetails?.area?.name,
    productDetails?.area_name,
    productDetails?.translated_item?.area_name,
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

  const areaLocationSignal = useMemo(
    () =>
      normalizeLocationToken(
        productDetails?.area?.translated_name ||
          productDetails?.area?.name ||
          productDetails?.area_name ||
          productDetails?.translated_item?.area_name ||
          "",
      ),
    [
      productDetails?.area?.translated_name,
      productDetails?.area?.name,
      productDetails?.area_name,
      productDetails?.translated_item?.area_name,
    ],
  );

  const pinLocationTokens = useMemo(
    () =>
      [
        resolvedLocationByPin?.area,
        resolvedLocationByPin?.state,
        resolvedLocationByPin?.city,
        resolvedLocationByPin?.address,
      ]
        .map((token) => normalizeLocationToken(token))
        .filter(Boolean),
    [
      resolvedLocationByPin?.area,
      resolvedLocationByPin?.state,
      resolvedLocationByPin?.city,
      resolvedLocationByPin?.address,
    ],
  );

  const pinMatchesLocationSignal = useMemo(() => {
    if (!pinLocationTokens.length) return true;
    if (!areaLocationSignal) return true;
    return pinLocationTokens.some(
      (token) =>
        token === areaLocationSignal ||
        token.includes(areaLocationSignal) ||
        areaLocationSignal.includes(token),
    );
  }, [areaLocationSignal, pinLocationTokens]);

  const effectiveLocationText = useMemo(() => {
    if (preciseLat !== null && preciseLng !== null) {
      return (
        fallbackLocationText ||
        structuredLocationText ||
        municipalityOrCityFallback ||
        resolvedLocationByPin?.address ||
        "Lokacija nije specificirana"
      );
    }

    return (
      fallbackLocationText ||
      structuredLocationText ||
      municipalityOrCityFallback ||
      resolvedLocationByPin?.address
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
    const areaToken = normalizeLocationToken(
      areaLocationSignal ||
        productDetails?.area_name ||
        productDetails?.area?.translated_name ||
        productDetails?.area?.name ||
        productDetails?.translated_item?.area_name ||
        municipalityOrCityFallback,
    );
    const cityToken = normalizeLocationToken(
      productDetails?.city_translation ||
        productDetails?.city ||
        productDetails?.translated_item?.city_translation ||
        productDetails?.translated_item?.city ||
        resolvedLocationByPin?.city ||
        "",
    );
    const stateToken = normalizeLocationToken(
      productDetails?.state_translation ||
        productDetails?.state ||
        productDetails?.translated_item?.state_translation ||
        productDetails?.translated_item?.state ||
        resolvedLocationByPin?.state ||
        "",
    );

    const composedParts = [];
    const pushComposedPart = (part) => {
      const normalized = normalizeLocationToken(part);
      if (!normalized) return;
      const normalizedLower = normalized.toLowerCase();
      if (composedParts.some((entry) => entry.toLowerCase() === normalizedLower)) {
        return;
      }
      if (
        composedParts.some(
          (entry) =>
            entry.toLowerCase().includes(normalizedLower) ||
            normalizedLower.includes(entry.toLowerCase()),
        )
      ) {
        return;
      }
      composedParts.push(normalized);
    };

    pushComposedPart(areaToken);
    pushComposedPart(cityToken);
    pushComposedPart(stateToken);

    const composedSpecificQuery =
      composedParts.length >= 2 ? composedParts.join(", ") : "";

    const candidates = [
      composedSpecificQuery,
      areaLocationSignal,
      productDetails?.area_name,
      productDetails?.area?.translated_name,
      productDetails?.area?.name,
      productDetails?.translated_item?.area_name,
      productDetails?.state_translation,
      productDetails?.state,
      productDetails?.city_translation,
      productDetails?.city,
      municipalityOrCityFallback,
      regionLabel,
      zoneLocation,
      shortLocation,
      fallbackLocationText,
      structuredLocationText,
      resolvedLocationByPin?.address,
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
    areaLocationSignal,
    productDetails?.area_name,
    productDetails?.area?.translated_name,
    productDetails?.area?.name,
    productDetails?.translated_item?.area_name,
    productDetails?.state_translation,
    productDetails?.state,
    productDetails?.city_translation,
    productDetails?.city,
    municipalityOrCityFallback,
    regionLabel,
    zoneLocation,
    shortLocation,
    fallbackLocationText,
    structuredLocationText,
    resolvedLocationByPin?.city,
    resolvedLocationByPin?.state,
    resolvedLocationByPin?.address,
  ]);

  const searchLocationIntent = useMemo(
    () => buildLocationSearchIntent(searchLocationQuery),
    [searchLocationQuery],
  );
  const searchLocationGranularity =
    searchLocationIntent?.granularity || "generic";
  const mapRadiusMaxMeters = useMemo(
    () => getRadiusMaxForGranularity(searchLocationGranularity),
    [searchLocationGranularity],
  );
  const mapRadiusFallbackMeters = useMemo(
    () => getRadiusFallbackForGranularity(searchLocationGranularity),
    [searchLocationGranularity],
  );

  useEffect(() => {
    let cancelled = false;

    const resolveBySearch = async () => {
      if (!searchLocationQuery) {
        setResolvedCoordinatesBySearch(null);
        return;
      }

      const searchVariants = buildLocationSearchVariants(searchLocationQuery);
      if (!searchVariants.length) {
        setResolvedCoordinatesBySearch(null);
        return;
      }

      try {
        let bestResolved = null;
        let bestScore = -1;

        for (const searchVariant of searchVariants) {
          let response = null;
          try {
            response = await getLocationApi.getLocation({
              search: searchVariant,
              lang: currentLanguage?.code || "bs",
            });
          } catch {
            continue;
          }

          if (cancelled) return;
          if (response?.data?.error === true) {
            continue;
          }

          const payload = response?.data?.data;
          const bestResult = pickBestSearchResult(
            payload,
            searchLocationQuery,
            searchLocationIntent,
          );
          if (!bestResult) continue;

          const score = Math.max(
            scoreSearchResultForQuery(
              bestResult,
              normalizeText(searchLocationQuery),
              searchLocationIntent,
            ),
            scoreSearchResultForQuery(
              bestResult,
              normalizeText(searchVariant),
              searchLocationIntent,
            ),
          );
          const resolvedCandidate = buildResolvedSearchCandidate(bestResult);
          if (!resolvedCandidate) continue;

          if (score > bestScore) {
            bestScore = score;
            bestResolved = resolvedCandidate;
          }
        }

        let nominatimResolved = null;
        if (
          !bestResolved ||
          !bestResolved?.bounds ||
          !bestResolved?.zoneGeoJson
        ) {
          nominatimResolved = await resolveCoordinatesViaNominatim({
            searchVariants,
            baseQuery: searchLocationQuery,
            languageCode: currentLanguage?.code || "bs",
            locationIntent: searchLocationIntent,
          });
        }

        const resolved = nominatimResolved?.zoneGeoJson
          ? nominatimResolved
          : bestResolved
            ? {
                ...bestResolved,
                bounds:
                  bestResolved?.bounds || nominatimResolved?.bounds || null,
                zoneGeoJson:
                  bestResolved?.zoneGeoJson ||
                  nominatimResolved?.zoneGeoJson ||
                  null,
              }
            : nominatimResolved;
        if (!cancelled) {
          setResolvedCoordinatesBySearch(resolved || null);
        }
      } catch {
        if (!cancelled) {
          const fallbackResolved = await resolveCoordinatesViaNominatim({
            searchVariants: buildLocationSearchVariants(searchLocationQuery),
            baseQuery: searchLocationQuery,
            languageCode: currentLanguage?.code || "bs",
            locationIntent: searchLocationIntent,
          });
          setResolvedCoordinatesBySearch(fallbackResolved || null);
        }
      }
    };

    resolveBySearch();
    return () => {
      cancelled = true;
    };
  }, [currentLanguage?.code, searchLocationIntent, searchLocationQuery]);

  const searchAreaBounds = resolvedCoordinatesBySearch?.bounds || null;
  const hasUsableSearchBounds = useMemo(
    () =>
      isBoundsUsableForGranularity(searchAreaBounds, searchLocationGranularity),
    [searchAreaBounds, searchLocationGranularity],
  );
  const effectiveSearchAreaBounds = hasUsableSearchBounds
    ? searchAreaBounds
    : null;
  const searchAreaGeoJson =
    hasUsableSearchBounds && resolvedCoordinatesBySearch?.zoneGeoJson
      ? resolvedCoordinatesBySearch.zoneGeoJson
      : null;
  const inferredSearchRadiusMeters = useMemo(
    () =>
      estimateRadiusFromBoundsMeters(effectiveSearchAreaBounds, {
        maxMeters: mapRadiusMaxMeters,
      }),
    [effectiveSearchAreaBounds, mapRadiusMaxMeters],
  );
  const coordinateMismatchThresholdMeters = useMemo(() => {
    if (Number.isFinite(inferredSearchRadiusMeters)) {
      return clamp(inferredSearchRadiusMeters * 1.25, 1400, mapRadiusMaxMeters * 1.45);
    }
    return Math.max(
      Math.min(COORDINATE_MISMATCH_FALLBACK_METERS, mapRadiusMaxMeters * 1.1),
      mapRadiusFallbackMeters * 1.8,
    );
  }, [inferredSearchRadiusMeters, mapRadiusFallbackMeters, mapRadiusMaxMeters]);

  const mapPrivacyRadiusMeters = useMemo(() => {
    if (isRealEstateAd) return MAP_PRIVACY_RADIUS_REAL_ESTATE_METERS;
    if (Number.isFinite(inferredSearchRadiusMeters)) {
      return clamp(
        inferredSearchRadiusMeters,
        MAP_PRIVACY_RADIUS_MIN_METERS,
        mapRadiusMaxMeters,
      );
    }
    return mapRadiusFallbackMeters;
  }, [
    inferredSearchRadiusMeters,
    isRealEstateAd,
    mapRadiusFallbackMeters,
    mapRadiusMaxMeters,
  ]);

  const mapPrivacyZoneGeoJson = useMemo(() => {
    if (isRealEstateAd) return null;
    return searchAreaGeoJson || null;
  }, [isRealEstateAd, searchAreaGeoJson]);

  const effectiveCoordinates = useMemo(() => {
    const preciseCandidate = isMeaningfulCoordinatePair(preciseLat, preciseLng)
      ? { lat: preciseLat, lng: preciseLng }
      : null;
    const resolvedSearchCandidate = resolvedCoordinatesBySearch;
    const searchBounds = effectiveSearchAreaBounds;
    const searchCandidate = isMeaningfulCoordinatePair(
      resolvedSearchCandidate?.lat ?? null,
      resolvedSearchCandidate?.lng ?? null,
    )
      ? {
          lat: resolvedSearchCandidate.lat,
          lng: resolvedSearchCandidate.lng,
        }
      : null;

    if (shouldForceRealEstatePinCoordinates && preciseCandidate) {
      return preciseCandidate;
    }

    if (preciseCandidate && searchCandidate) {
      const mismatchDistance = distanceBetweenCoordinatesMeters(
        preciseCandidate,
        searchCandidate,
      );
      const hasStrongLocalitySignal = Boolean(
        normalizeLocationToken(municipalityOrCityFallback),
      );
      const preciseInsideSearchBounds = searchBounds
        ? isCoordinateWithinBounds(preciseCandidate, searchBounds)
        : true;
      if (
        hasStrongLocalitySignal &&
        searchBounds &&
        !preciseInsideSearchBounds
      ) {
        return searchCandidate;
      }
      if (
        hasStrongLocalitySignal &&
        mismatchDistance > coordinateMismatchThresholdMeters
      ) {
        return searchCandidate;
      }
      return preciseCandidate;
    }

    if (
      preciseCandidate &&
      !pinMatchesLocationSignal &&
      !shouldForceRealEstatePinCoordinates
    ) {
      return null;
    }
    if (preciseCandidate) return preciseCandidate;
    if (searchCandidate) return searchCandidate;
    return null;
  }, [
    shouldForceRealEstatePinCoordinates,
    pinMatchesLocationSignal,
    municipalityOrCityFallback,
    preciseLat,
    preciseLng,
    resolvedCoordinatesBySearch?.lat,
    resolvedCoordinatesBySearch?.lng,
    effectiveSearchAreaBounds,
    coordinateMismatchThresholdMeters,
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
  const hasZoneBoundary = Boolean(mapPrivacyZoneGeoJson);
  const shortLocationDisplay = useMemo(() => {
    if (!shortLocation || shortLocation === "Lokacija nije specificirana") {
      return shortLocation;
    }
    return hasCoordinates ? `Okvirno ${shortLocation}` : shortLocation;
  }, [hasCoordinates, shortLocation]);
  const locationHeaderHint = hasCoordinates
    ? hasZoneBoundary
      ? "Prikazujemo okvirnu zonu prema granicama odabrane lokacije radi privatnosti prodavača."
      : "Prikazujemo okvirnu zonu radi privatnosti prodavača."
    : "Lokacija je informativna (grad/općina), a tačnu adresu potvrđuje prodavač.";
  const privacyHint = hasCoordinates
    ? hasZoneBoundary
      ? "Tačna adresa nije javno prikazana. Prikazana zona prati okvirne granice lokacije."
      : "Tačna adresa nije javno prikazana i dijeli se po dogovoru sa prodavačem."
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
            approximateRadiusMeters={mapPrivacyRadiusMeters}
            approximateZoneGeoJson={mapPrivacyZoneGeoJson}
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
