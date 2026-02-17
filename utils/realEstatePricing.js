const REAL_ESTATE_KEYWORDS = ["nekretnine", "nekretnina", "real estate", "property"];
export const REAL_ESTATE_PRICE_MODE_AUTO = "auto";
export const REAL_ESTATE_PRICE_MODE_MANUAL = "manual";
const AREA_FIELD_HINTS = [
  "povrsina",
  "površina",
  "kvadratura",
  "kvadrata",
  "kvadrati",
  "stambena povrsina",
  "stambena površina",
  "ukupna povrsina",
  "ukupna površina",
  "quadrature",
  "kvm",
  "kv m",
  "m2",
  "m²",
  "sqm",
  "sq m",
  "square meter",
  "square meters",
  "square",
  "area",
  "total_area",
];
const SHOW_PRICE_PER_M2_KEYS = [
  "show_price_per_m2",
  "show_real_estate_price_per_m2",
  "display_price_per_m2",
  "price_per_m2_enabled",
  "showPricePerM2",
];
const PRICE_PER_M2_MODE_KEYS = [
  "price_per_m2_mode",
  "real_estate_price_per_m2_mode",
  "price_per_unit_mode",
];
const PRICE_PER_M2_VALUE_KEYS = [
  "price_per_unit",
  "real_estate_price_per_m2",
  "price_per_m2",
];

export const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const parseBooleanLike = (value) => {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;

  if (typeof value === "string") {
    const normalized = normalizeText(value);
    if (["true", "da", "yes", "on", "enabled"].includes(normalized)) return true;
    if (["false", "ne", "no", "off", "disabled"].includes(normalized)) return false;
  }

  return null;
};

const parseModeLike = (value) => {
  if (value === REAL_ESTATE_PRICE_MODE_MANUAL || value === REAL_ESTATE_PRICE_MODE_AUTO) return value;
  if (typeof value !== "string") return null;

  const normalized = normalizeText(value);
  if (["manual", "rucno", "ručno", "rucni", "ručni"].includes(normalized)) {
    return REAL_ESTATE_PRICE_MODE_MANUAL;
  }
  if (["auto", "automatski", "automatsko", "automatska"].includes(normalized)) {
    return REAL_ESTATE_PRICE_MODE_AUTO;
  }

  return null;
};

const normalizeNumericString = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const cleaned = raw.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  if (!cleaned) return "";

  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      return cleaned.replace(/\./g, "").replace(",", ".");
    }
    return cleaned.replace(/,/g, "");
  }

  return cleaned.replace(",", ".");
};

export const toPositiveNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;

  const normalized = normalizeNumericString(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const toBooleanFlag = (value) => {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const normalized = normalizeText(value);
    if (["true", "da", "yes", "on", "enabled"].includes(normalized)) return true;
    if (["false", "ne", "no", "off", "disabled"].includes(normalized)) return false;
  }
  return Boolean(value);
};

export const normalizeRealEstatePriceMode = (value) =>
  value === REAL_ESTATE_PRICE_MODE_MANUAL
    ? REAL_ESTATE_PRICE_MODE_MANUAL
    : REAL_ESTATE_PRICE_MODE_AUTO;

export const isRealEstatePerSquareEnabled = (details = {}) =>
  toBooleanFlag(
    details?.show_price_per_m2 ??
      details?.show_real_estate_price_per_m2 ??
      details?.display_price_per_m2 ??
      false
  );

const toPositiveInt = (value) => {
  const parsed = toPositiveNumber(value);
  if (!parsed) return null;
  const rounded = Math.round(parsed * 100) / 100;
  return rounded > 0 ? rounded : null;
};

const readDeepByKeys = (node, normalizedKeys = new Set()) => {
  if (node === null || node === undefined) return null;

  if (Array.isArray(node)) {
    for (const nested of node) {
      const found = readDeepByKeys(nested, normalizedKeys);
      if (found !== null && found !== undefined) return found;
    }
    return null;
  }

  if (typeof node !== "object") return null;

  for (const [key, value] of Object.entries(node)) {
    if (normalizedKeys.has(normalizeText(key))) return value;

    const nested = readDeepByKeys(value, normalizedKeys);
    if (nested !== null && nested !== undefined) return nested;
  }

  return null;
};

const readPositiveNumberFromAny = (value) => {
  if (Array.isArray(value)) {
    for (const nested of value) {
      const parsed = readPositiveNumberFromAny(nested);
      if (parsed) return parsed;
    }
    return null;
  }

  if (value && typeof value === "object") {
    const candidates = [
      value?.value,
      value?.translated_value,
      value?.selected_value,
      value?.label,
      value?.name,
      value?.title,
      value?.amount,
      value?.id,
    ];
    for (const candidate of candidates) {
      const parsed = toPositiveInt(candidate);
      if (parsed) return parsed;
    }
    return null;
  }

  return toPositiveInt(value);
};

const readBooleanFromAny = (value) => {
  if (Array.isArray(value)) {
    for (const nested of value) {
      const parsed = readBooleanFromAny(nested);
      if (parsed !== null) return parsed;
    }
    return null;
  }

  if (value && typeof value === "object") {
    const candidates = [
      value?.value,
      value?.translated_value,
      value?.selected_value,
      value?.label,
      value?.name,
      value?.title,
    ];
    for (const candidate of candidates) {
      const parsed = readBooleanFromAny(candidate);
      if (parsed !== null) return parsed;
    }

    for (const nested of Object.values(value)) {
      const parsed = readBooleanFromAny(nested);
      if (parsed !== null) return parsed;
    }
    return null;
  }

  return parseBooleanLike(value);
};

const readModeFromAny = (value) => {
  if (Array.isArray(value)) {
    for (const nested of value) {
      const parsed = readModeFromAny(nested);
      if (parsed) return parsed;
    }
    return null;
  }

  if (value && typeof value === "object") {
    const candidates = [
      value?.value,
      value?.translated_value,
      value?.selected_value,
      value?.label,
      value?.name,
      value?.title,
    ];
    for (const candidate of candidates) {
      const parsed = readModeFromAny(candidate);
      if (parsed) return parsed;
    }

    for (const nested of Object.values(value)) {
      const parsed = readModeFromAny(nested);
      if (parsed) return parsed;
    }
    return null;
  }

  return parseModeLike(value);
};

const matchesAreaHint = (fieldName = "") => {
  const normalized = normalizeText(fieldName);
  if (!normalized) return false;
  return AREA_FIELD_HINTS.some((hint) => normalized.includes(normalizeText(hint)));
};

const readAreaFromObject = (obj) => {
  if (!obj || typeof obj !== "object") return null;

  for (const [key, value] of Object.entries(obj)) {
    if (matchesAreaHint(key)) {
      const parsed = toPositiveInt(value);
      if (parsed) return parsed;
    }

    if (value && typeof value === "object") {
      const nested = readAreaFromObject(value);
      if (nested) return nested;
    }
  }

  return null;
};

const parseJsonSafe = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const readValueByKeysFromSources = (sources = [], keys = []) => {
  const normalizedKeys = new Set(keys.map((key) => normalizeText(key)));

  for (const source of sources) {
    const parsedSource = parseJsonSafe(source);
    const found = readDeepByKeys(parsedSource, normalizedKeys);
    if (found !== null && found !== undefined) return found;
  }

  return null;
};

const readAreaFromTranslatedFields = (item = {}) => {
  const fields = [
    ...(Array.isArray(item?.translated_custom_fields) ? item.translated_custom_fields : []),
    ...(Array.isArray(item?.all_translated_custom_fields) ? item.all_translated_custom_fields : []),
  ];

  for (const field of fields) {
    const fieldName = field?.translated_name || field?.name || "";
    if (!matchesAreaHint(fieldName)) continue;

    const candidates = [
      field?.translated_selected_values,
      field?.selected_values,
      field?.translated_value,
      field?.selected_value,
      field?.value,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        for (const nested of candidate) {
          const parsed = toPositiveInt(nested);
          if (parsed) return parsed;
        }
      } else {
        const parsed = toPositiveInt(candidate);
        if (parsed) return parsed;
      }
    }
  }

  return null;
};

const isRealEstateName = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  return REAL_ESTATE_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

export const isRealEstateCategoryPath = (categoryPath = []) => {
  if (!Array.isArray(categoryPath) || !categoryPath.length) return false;
  return categoryPath.some((category) => {
    const categoryNameCandidate =
      category?.translated_name ||
      category?.name ||
      category?.slug ||
      category?.full_path ||
      category?.path ||
      category?.breadcrumbs ||
      "";
    return isRealEstateName(categoryNameCandidate);
  });
};

export const isRealEstateItem = (item = {}) => {
  if (!item || typeof item !== "object") return false;

  const categoryCandidates = [
    item?.category?.translated_name,
    item?.category?.name,
    item?.category_name,
    item?.category?.slug,
    item?.translated_item?.category_name,
    item?.translated_item?.category?.translated_name,
    item?.translated_item?.category?.name,
  ];

  if (categoryCandidates.some(isRealEstateName)) return true;

  const categoryPathCandidates = Array.isArray(item?.category_path)
    ? item.category_path
    : Array.isArray(item?.all_categories)
    ? item.all_categories
    : [];
  if (isRealEstateCategoryPath(categoryPathCandidates)) return true;

  return false;
};

export const extractAreaM2FromItem = (item = {}) => {
  if (!item || typeof item !== "object") return null;

  const directCandidates = [
    item?.area,
    item?.area_m2,
    item?.real_estate_area_m2,
    item?.total_area,
    item?.m2,
    item?.surface,
    item?.povrsina,
    item?.površina,
    item?.square_meters,
    item?.quadrature,
    item?.translated_item?.area,
    item?.translated_item?.area_m2,
    item?.translated_item?.real_estate_area_m2,
    item?.translated_item?.total_area,
    item?.translated_item?.m2,
    item?.translated_item?.surface,
    item?.translated_item?.povrsina,
    item?.translated_item?.površina,
  ];

  for (const candidate of directCandidates) {
    const parsed = toPositiveInt(candidate);
    if (parsed) return parsed;
  }

  const fromExtraDetails = readAreaFromObject(parseJsonSafe(item?.extra_details));
  if (fromExtraDetails) return fromExtraDetails;

  const fromCustomFields = readAreaFromObject(parseJsonSafe(item?.custom_fields));
  if (fromCustomFields) return fromCustomFields;

  const fromTranslated = readAreaFromTranslatedFields(item);
  if (fromTranslated) return fromTranslated;

  return null;
};

export const extractAreaM2FromCustomFieldValues = ({
  customFields = [],
  extraDetails = {},
  languageId = null,
  fallbackLanguageId = null,
}) => {
  if (!Array.isArray(customFields) || !customFields.length || !extraDetails) return null;

  const candidateLangs = [];
  if (languageId !== null && languageId !== undefined) candidateLangs.push(languageId);
  if (fallbackLanguageId !== null && fallbackLanguageId !== undefined) candidateLangs.push(fallbackLanguageId);
  Object.keys(extraDetails || {}).forEach((langKey) => {
    if (langKey !== null && langKey !== undefined && String(langKey).trim() !== "") {
      candidateLangs.push(langKey);
    }
  });

  const seenLangs = new Set();
  for (const langId of candidateLangs) {
    const normalizedLangId = String(langId);
    if (seenLangs.has(normalizedLangId)) continue;
    seenLangs.add(normalizedLangId);

    const langDetails = extraDetails?.[langId] ?? extraDetails?.[normalizedLangId];
    if (!langDetails || typeof langDetails !== "object") continue;

    for (const field of customFields) {
      const fieldName = field?.translated_name || field?.name || field?.slug || "";
      if (!matchesAreaHint(fieldName)) continue;

      const rawValue =
        langDetails?.[field?.id] ??
        langDetails?.[String(field?.id)] ??
        null;
      const parsed = readPositiveNumberFromAny(rawValue);
      if (parsed) return parsed;
    }
  }

  return null;
};

export const computePricePerSquare = (totalPrice, areaM2) => {
  const total = toPositiveNumber(totalPrice);
  const area = toPositiveNumber(areaM2);
  if (!total || !area) return null;
  const value = total / area;
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
};

export const computeTotalPriceFromPerSquare = (perSquarePrice, areaM2) => {
  const perSquare = toPositiveNumber(perSquarePrice);
  const area = toPositiveNumber(areaM2);
  if (!perSquare || !area) return null;
  const value = perSquare * area;
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
};

export const inferRealEstatePerSquareMode = ({
  perSquarePrice,
  totalPrice,
  areaM2,
}) => {
  const explicit = toPositiveNumber(perSquarePrice);
  if (!explicit) return "auto";

  const auto = computePricePerSquare(totalPrice, areaM2);
  if (!auto) return "manual";

  const diffRatio = Math.abs(explicit - auto) / auto;
  return diffRatio <= 0.03 ? "auto" : "manual";
};

export const resolveRealEstatePerSquareValue = ({
  details = {},
  areaM2 = null,
  totalPrice = null,
} = {}) => {
  const enabled = isRealEstatePerSquareEnabled(details);
  const hasArea = Number.isFinite(Number(areaM2)) && Number(areaM2) > 0;
  const mode = normalizeRealEstatePriceMode(details?.price_per_m2_mode);
  const manualValue = toPositiveNumber(
    details?.price_per_unit ?? details?.real_estate_price_per_m2
  );
  const autoValue = computePricePerSquare(
    totalPrice ?? details?.price ?? null,
    areaM2
  );
  const derivedTotalPrice = computeTotalPriceFromPerSquare(manualValue, areaM2);
  const resolvedValue = !enabled
    ? null
    : mode === REAL_ESTATE_PRICE_MODE_MANUAL
    ? manualValue
    : autoValue;
  const canDisplay =
    enabled && hasArea && Number.isFinite(resolvedValue) && resolvedValue > 0;

  return {
    enabled,
    hasArea,
    mode,
    manualValue,
    autoValue,
    derivedTotalPrice,
    resolvedValue: canDisplay ? resolvedValue : null,
    canDisplay,
  };
};

export const resolveRealEstateDisplayPricing = (item = {}) => {
  const categoryDetectedRealEstate = isRealEstateItem(item);
  const areaM2 = extractAreaM2FromItem(item);
  const totalPrice = toPositiveNumber(item?.price);
  const configSources = [
    item,
    item?.translated_item,
    item?.extra_details,
    item?.translated_item?.extra_details,
    item?.custom_fields,
    item?.translated_item?.custom_fields,
  ];

  const directShowFlag = readBooleanFromAny([
    item?.show_price_per_m2,
    item?.translated_item?.show_price_per_m2,
    item?.show_real_estate_price_per_m2,
    item?.translated_item?.show_real_estate_price_per_m2,
    item?.display_price_per_m2,
    item?.translated_item?.display_price_per_m2,
  ]);
  const nestedShowFlag = readBooleanFromAny(
    readValueByKeysFromSources(configSources, SHOW_PRICE_PER_M2_KEYS)
  );
  const showFlag = directShowFlag !== null ? directShowFlag : nestedShowFlag;

  const modeFromDirect = readModeFromAny([
    item?.price_per_m2_mode,
    item?.translated_item?.price_per_m2_mode,
    item?.real_estate_price_per_m2_mode,
    item?.translated_item?.real_estate_price_per_m2_mode,
  ]);
  const modeFromNested = readModeFromAny(
    readValueByKeysFromSources(configSources, PRICE_PER_M2_MODE_KEYS)
  );
  const configuredMode = modeFromDirect || modeFromNested;

  const directPerM2Value =
    toPositiveNumber(item?.price_per_unit) ||
    toPositiveNumber(item?.translated_item?.price_per_unit) ||
    toPositiveNumber(item?.real_estate_price_per_m2) ||
    toPositiveNumber(item?.translated_item?.real_estate_price_per_m2);
  const nestedPerM2Value = readPositiveNumberFromAny(
    readValueByKeysFromSources(configSources, PRICE_PER_M2_VALUE_KEYS)
  );
  const explicitPerM2Value = directPerM2Value || nestedPerM2Value || null;
  const autoPerM2Value = computePricePerSquare(totalPrice, areaM2);
  const hasAreaSignal = Number.isFinite(areaM2) && areaM2 > 0;
  const hasPerM2Signal = Number.isFinite(explicitPerM2Value) && explicitPerM2Value > 0;
  const hasModeSignal = Boolean(configuredMode);
  const isRealEstateBySignals =
    showFlag === true ||
    hasModeSignal ||
    (hasAreaSignal && (hasPerM2Signal || Number.isFinite(autoPerM2Value)));
  const isRealEstate = categoryDetectedRealEstate || isRealEstateBySignals;

  if (!isRealEstate) {
    return {
      isRealEstate: false,
      areaM2: null,
      mode: REAL_ESTATE_PRICE_MODE_AUTO,
      enabled: false,
      perM2Value: null,
      autoPerM2Value: null,
      explicitPerM2Value: null,
      showPerM2: false,
    };
  }

  const inferredMode = inferRealEstatePerSquareMode({
    perSquarePrice: explicitPerM2Value,
    totalPrice,
    areaM2,
  });
  const mode = configuredMode ? normalizeRealEstatePriceMode(configuredMode) : inferredMode;
  const enabled = showFlag !== null ? showFlag : hasPerM2Signal || hasModeSignal;

  let perM2Value = null;
  if (enabled) {
    perM2Value =
      mode === REAL_ESTATE_PRICE_MODE_MANUAL
        ? explicitPerM2Value || autoPerM2Value || null
        : autoPerM2Value || explicitPerM2Value || null;
  }
  const showPerM2 = Boolean(enabled && areaM2 && perM2Value);

  return {
    isRealEstate,
    areaM2,
    mode,
    enabled,
    perM2Value,
    autoPerM2Value,
    explicitPerM2Value,
    showPerM2,
  };
};
