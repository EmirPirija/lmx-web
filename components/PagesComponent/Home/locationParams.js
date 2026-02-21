const BIH_SELECTOR_FALLBACK_COORDS = {
  lat: 43.8563,
  long: 18.4131,
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const hasValidCoordinates = (cityData = {}) => {
  return toNumber(cityData?.lat) !== null && toNumber(cityData?.long) !== null;
};

export const isSelectorFallbackCoordinates = (cityData = {}) => {
  const lat = toNumber(cityData?.lat);
  const long = toNumber(cityData?.long);
  if (lat === null || long === null) return false;

  return (
    Math.abs(lat - BIH_SELECTOR_FALLBACK_COORDS.lat) < 0.0001 &&
    Math.abs(long - BIH_SELECTOR_FALLBACK_COORDS.long) < 0.0001
  );
};

export const shouldUseRadiusLocationFilter = ({ cityData = {}, KmRange = 0 } = {}) => {
  if (Number(KmRange) <= 0 || !hasValidCoordinates(cityData)) return false;

  const source = String(cityData?.location_source || "")
    .trim()
    .toLowerCase();

  if (["map", "gps", "precise", "geolocation", "current-location"].includes(source)) {
    return true;
  }

  if (["hierarchy", "manual", "selector"].includes(source)) {
    return false;
  }

  return !isSelectorFallbackCoordinates(cityData);
};

export const buildHomeLocationParams = ({ cityData = {}, KmRange = 0 } = {}) => {
  const params = {};

  if (shouldUseRadiusLocationFilter({ cityData, KmRange })) {
    params.radius = KmRange;
    params.latitude = cityData.lat;
    params.longitude = cityData.long;
    return params;
  }

  if (cityData?.areaId) {
    params.area_id = cityData.areaId;
  } else if (cityData?.city) {
    params.city = cityData.city;
  } else if (cityData?.state) {
    params.state = cityData.state;
  } else if (cityData?.country) {
    params.country = cityData.country;
  }

  return params;
};

export const buildHomeLocationKey = (cityData = {}) => {
  return [
    cityData?.location_source || "",
    cityData?.areaId || "",
    cityData?.area || "",
    cityData?.city || "",
    cityData?.state || "",
    cityData?.country || "",
    cityData?.lat || "",
    cityData?.long || "",
    cityData?.formattedAddress || "",
  ].join("|");
};
