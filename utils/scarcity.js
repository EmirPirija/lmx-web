const DEFAULT_LOW_INVENTORY_THRESHOLD = 3;
const DEFAULT_LAST_UNITS_THRESHOLD = 2;

const toNormalizedText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const toNumber = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toBoolean = (value) => {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;

  const normalized = toNormalizedText(value);
  if (!normalized) return null;

  if (
    [
      "true",
      "yes",
      "da",
      "on",
      "enabled",
      "active",
      "ukljuceno",
      "do_isteka",
      "do isteka zaliha",
      "scarcity",
      "low_stock",
      "limited",
      "posljednji komadi",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "no",
      "ne",
      "off",
      "disabled",
      "inactive",
      "iskljuceno",
      "normal",
      "none",
    ].includes(normalized)
  ) {
    return false;
  }

  return null;
};

const readFirstDefined = (candidates = []) => {
  for (const value of candidates) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const readFirstNumber = (candidates = [], fallback = null) => {
  for (const value of candidates) {
    const num = toNumber(value, null);
    if (num !== null) return num;
  }
  return fallback;
};

const readFirstBoolean = (candidates = [], fallback = null) => {
  for (const value of candidates) {
    if (Array.isArray(value)) {
      const nested = readFirstBoolean(value, null);
      if (nested !== null) return nested;
      continue;
    }

    const parsed = toBoolean(value);
    if (parsed !== null) return parsed;
  }
  return fallback;
};

const parseCustomFields = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const readFromCustomFields = (customFields, keys = []) => {
  const source = parseCustomFields(customFields);
  if (!source || typeof source !== "object") return undefined;

  const keySet = new Set(keys.map((entry) => toNormalizedText(entry)));

  const walk = (node) => {
    if (!node || typeof node !== "object") return undefined;

    for (const [rawKey, rawValue] of Object.entries(node)) {
      const key = toNormalizedText(rawKey);
      if (keySet.has(key)) return rawValue;

      if (rawValue && typeof rawValue === "object") {
        const nested = walk(rawValue);
        if (nested !== undefined) return nested;
      }
    }

    return undefined;
  };

  return walk(source);
};

const clampPositiveInt = (value, fallback) => {
  const parsed = Math.round(toNumber(value, fallback));
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const getKomadLabel = (count) => {
  const abs = Math.abs(Number(count) || 0);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod10 === 1 && mod100 !== 11) return "komad";
  return "komada";
};

export const getInventoryCount = (item = {}) => {
  const direct = readFirstNumber(
    [
      item?.inventory_count,
      item?.inventoryCount,
      item?.translated_item?.inventory_count,
      item?.translated_item?.inventoryCount,
      readFromCustomFields(item?.custom_fields, ["inventory_count", "inventory", "kolicina_na_zalihi", "zaliha"]),
    ],
    null
  );

  if (direct === null) return null;
  return Math.max(0, Math.round(direct));
};

export const getLowInventoryThreshold = (item = {}, fallback = DEFAULT_LOW_INVENTORY_THRESHOLD) => {
  const threshold = readFirstNumber(
    [
      item?.stock_alert_threshold,
      item?.low_stock_threshold,
      item?.seller_settings?.low_stock_threshold,
      item?.seller?.seller_settings?.low_stock_threshold,
      item?.user?.seller_settings?.low_stock_threshold,
      readFromCustomFields(item?.custom_fields, ["stock_alert_threshold", "low_stock_threshold", "prag_niske_zalihe"]),
    ],
    fallback
  );

  return clampPositiveInt(threshold, fallback);
};

export const getLastUnitsThreshold = (
  item = {},
  {
    fallback = DEFAULT_LAST_UNITS_THRESHOLD,
    lowThreshold = getLowInventoryThreshold(item),
  } = {}
) => {
  const parsed = readFirstNumber(
    [
      item?.last_units_threshold,
      item?.critical_stock_threshold,
      readFromCustomFields(item?.custom_fields, ["last_units_threshold", "critical_stock_threshold", "prag_posljednjih_komada"]),
    ],
    fallback
  );

  const normalized = clampPositiveInt(parsed, fallback);
  return Math.min(Math.max(1, normalized), Math.max(1, lowThreshold));
};

export const getScarcityFlagEnabled = (item = {}) => {
  const customFlag = readFromCustomFields(item?.custom_fields, [
    "scarcity_enabled",
    "is_scarcity_enabled",
    "low_stock_flag",
    "do_isteka_zaliha",
  ]);

  return Boolean(
    readFirstBoolean(
      [
        item?.scarcity_enabled,
        item?.is_scarcity_enabled,
        item?.low_stock_flag,
        item?.scarcity_flag,
        item?.translated_item?.scarcity_enabled,
        item?.translated_item?.is_scarcity_enabled,
        customFlag,
      ],
      false
    )
  );
};

export const getPopularitySignal = (item = {}) => {
  const views = readFirstNumber(
    [
      item?.total_click,
      item?.views,
      item?.statistics?.summary?.period?.views,
      item?.item_statistics?.summary?.period?.views,
      item?.analytics?.views,
    ],
    0
  );

  const messages = readFirstNumber(
    [
      item?.messages_count,
      item?.statistics?.summary?.period?.messages,
      item?.item_statistics?.summary?.period?.messages,
      item?.analytics?.messages,
    ],
    0
  );

  const favorites = readFirstNumber(
    [
      item?.favorites_count,
      item?.favourite_count,
      item?.statistics?.summary?.period?.favorites,
      item?.item_statistics?.summary?.period?.favorites,
      item?.analytics?.favorites,
    ],
    0
  );

  const contacts = readFirstNumber(
    [
      item?.contacts_count,
      item?.statistics?.summary?.period?.contacts,
      item?.item_statistics?.summary?.period?.contacts,
      item?.analytics?.contacts,
    ],
    0
  );

  const hasSignal = views >= 250 || messages >= 8 || favorites >= 15 || contacts >= 6;

  return {
    hasSignal,
    views,
    messages,
    favorites,
    contacts,
  };
};

export const getScarcityState = (
  item = {},
  {
    defaultLowThreshold = DEFAULT_LOW_INVENTORY_THRESHOLD,
    defaultLastUnitsThreshold = DEFAULT_LAST_UNITS_THRESHOLD,
  } = {}
) => {
  const inventoryCount = getInventoryCount(item);
  const inventoryKnown = Number.isFinite(inventoryCount);

  const lowThreshold = getLowInventoryThreshold(item, defaultLowThreshold);
  const lastUnitsThreshold = getLastUnitsThreshold(item, {
    fallback: defaultLastUnitsThreshold,
    lowThreshold,
  });

  const flagEnabled = getScarcityFlagEnabled(item);

  const isOutOfStock = inventoryKnown && inventoryCount <= 0;
  const isLowStock = inventoryKnown && inventoryCount > 0 && inventoryCount <= lowThreshold;
  const isLastUnits = inventoryKnown && inventoryCount > 0 && inventoryCount <= lastUnitsThreshold;

  const isEligible = Boolean(flagEnabled && isLowStock && !isOutOfStock);
  const popularity = getPopularitySignal(item);

  return {
    inventoryKnown,
    inventoryCount,
    lowThreshold,
    lastUnitsThreshold,
    flagEnabled,
    isOutOfStock,
    isLowStock,
    isLastUnits,
    isEligible,
    popularity,
  };
};

export const getScarcityCopy = (state) => {
  if (!state) {
    return {
      badge: null,
      quantity: null,
      priceHint: null,
      status: null,
    };
  }

  if (state.isOutOfStock) {
    return {
      badge: "Rasprodano",
      quantity: "Trenutno nema na stanju",
      priceHint: null,
      status: "out_of_stock",
    };
  }

  if (!state.isEligible) {
    return {
      badge: null,
      quantity: null,
      priceHint: null,
      status: "inactive",
    };
  }

  const quantity = state.isLastUnits
    ? "Posljednji komadi"
    : `Još ${state.inventoryCount} ${getKomadLabel(state.inventoryCount)} dostupno`;

  return {
    badge: "Do isteka zaliha",
    quantity,
    priceHint: "Cijena važi do isteka zaliha",
    status: state.isLastUnits ? "last_units" : "low_stock",
  };
};

export const scarcityConfig = {
  DEFAULT_LOW_INVENTORY_THRESHOLD,
  DEFAULT_LAST_UNITS_THRESHOLD,
};
