const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on", "enabled", "enable"].includes(normalized)) {
      return true;
    }
    if (
      ["0", "false", "no", "off", "disabled", "disable"].includes(normalized)
    ) {
      return false;
    }
  }
  return fallback;
};

const readSettingValue = (settings, keys = [], fallback = undefined) => {
  if (!settings || typeof settings !== "object" || !Array.isArray(keys)) {
    return fallback;
  }

  for (const key of keys) {
    if (!key) continue;
    if (settings[key] !== undefined && settings[key] !== null && settings[key] !== "") {
      return settings[key];
    }
  }

  return fallback;
};

export const normalizeCampaignBadgeKey = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized.slice(0, 80);
};

const normalizeHexColor = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) return null;
  return trimmed.toUpperCase();
};

const normalizeOption = (candidate, fallbackKey = "") => {
  if (candidate === null || candidate === undefined) return null;

  if (typeof candidate === "string" || typeof candidate === "number") {
    const label = String(candidate).trim();
    if (!label) return null;
    const key = normalizeCampaignBadgeKey(fallbackKey || label);
    if (!key) return null;

    return { key, label };
  }

  if (typeof candidate !== "object") {
    return null;
  }

  const rawLabel =
    candidate.label ??
    candidate.name ??
    candidate.title ??
    (typeof fallbackKey === "string" ? fallbackKey : "");
  const label = String(rawLabel || "").trim();
  if (!label) return null;

  const key = normalizeCampaignBadgeKey(
    candidate.key ?? candidate.id ?? fallbackKey ?? label,
  );
  if (!key) return null;

  const bgColor = normalizeHexColor(
    candidate.bg_color ?? candidate.background_color,
  );
  const textColor = normalizeHexColor(
    candidate.text_color ?? candidate.foreground_color,
  );

  return {
    key,
    label,
    ...(bgColor ? { bgColor } : {}),
    ...(textColor ? { textColor } : {}),
  };
};

export const parseCampaignBadgeOptions = (rawValue) => {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return [];
  }

  let parsed = rawValue;

  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    if (!trimmed) return [];

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      parsed = trimmed
        .split(/[\r\n,;]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return [];
  }

  const options = [];
  const seen = new Set();

  const append = (candidate, fallbackKey = "") => {
    const option = normalizeOption(candidate, fallbackKey);
    if (!option || seen.has(option.key)) return;
    seen.add(option.key);
    options.push(option);
  };

  if (Array.isArray(parsed)) {
    parsed.forEach((entry) => append(entry));
    return options;
  }

  Object.entries(parsed).forEach(([mapKey, mapValue]) => {
    append(mapValue, mapKey);
  });

  return options;
};

export const getListingCampaignBadgeConfig = (settings = null) => {
  const enabled = toBoolean(
    readSettingValue(
      settings,
      [
        "listing_campaign_badges_enabled",
        "campaign_badges_enabled",
        "seasonal_badges_enabled",
      ],
      false,
    ),
    false,
  );

  const rawOptions = readSettingValue(
    settings,
    [
      "listing_campaign_badges",
      "campaign_badges",
      "seasonal_badges",
      "listing_seasonal_badges",
    ],
    "[]",
  );

  const options = parseCampaignBadgeOptions(rawOptions);
  const optionsByKey = options.reduce((acc, option) => {
    acc[option.key] = option;
    return acc;
  }, {});

  return {
    enabled,
    options,
    optionsByKey,
  };
};

export const resolveListingCampaignBadge = (item = null, settings = null) => {
  if (!item || typeof item !== "object") return null;

  const config = getListingCampaignBadgeConfig(settings);
  const rawKey =
    item?.campaign_badge_key ??
    item?.campaignBadgeKey ??
    item?.campaign_badge ??
    item?.campaignBadge;
  const rawLabel =
    item?.campaign_badge_label ??
    item?.campaignBadgeLabel ??
    item?.campaign_label ??
    item?.campaignLabel;

  const key = normalizeCampaignBadgeKey(rawKey);
  const labelFallback = String(rawLabel || "").trim();

  if (key && config.optionsByKey[key]) {
    const option = config.optionsByKey[key];
    return {
      key: option.key,
      label: option.label,
      ...(option.bgColor ? { bgColor: option.bgColor } : {}),
      ...(option.textColor ? { textColor: option.textColor } : {}),
    };
  }

  if (key) {
    return {
      key,
      label: labelFallback || key.replace(/-/g, " "),
    };
  }

  if (labelFallback) {
    return {
      key: normalizeCampaignBadgeKey(labelFallback) || "campaign-badge",
      label: labelFallback,
    };
  }

  return null;
};
