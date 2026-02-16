const FEATURED_TRUTHY_VALUES = new Set(["1", "true", "yes", "on"]);

const normalizePlacementToken = (value) => {
  if (value === null || value === undefined) return null;

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!normalized) return null;

  const hasHome = normalized.includes("home") || normalized.includes("naslov");
  const hasCategory = normalized.includes("category") || normalized.includes("kategor");

  if (hasHome && hasCategory) return "category_home";
  if (
    normalized === "category_home" ||
    normalized === "home_category" ||
    normalized === "all" ||
    normalized === "both"
  ) {
    return "category_home";
  }
  if (hasHome) return "home";
  if (hasCategory) return "category";

  return null;
};

const isTruthyFeaturedFlag = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value !== "string") return false;
  return FEATURED_TRUTHY_VALUES.has(value.trim().toLowerCase());
};

const parseDateSafe = (value, { endOfDay = false } = {}) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const asString = String(value).trim();
  if (!asString) return null;

  const hasTimePart = asString.includes("T") || asString.includes(" ");
  const normalizedInput = hasTimePart
    ? asString
    : `${asString}${endOfDay ? "T23:59:59" : "T00:00:00"}`;

  const parsed = new Date(normalizedInput);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  if (normalizedInput.includes(" ")) {
    const fallbackParsed = new Date(normalizedInput.replace(" ", "T"));
    if (!Number.isNaN(fallbackParsed.getTime())) return fallbackParsed;
  }

  return null;
};

const formatRemainingShortBs = (msLeft) => {
  if (msLeft <= 0) return "Isteklo";

  const minutes = Math.ceil(msLeft / (60 * 1000));
  const hours = Math.ceil(msLeft / (60 * 60 * 1000));
  const days = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

  if (days >= 2) return `${days} dana`;
  if (days === 1 && hours > 24) return "1 dan";
  if (hours >= 2) return `${hours} h`;
  if (hours === 1) return "1 h";
  return `${Math.max(1, minutes)} min`;
};

const formatExactDateBs = (date) => {
  if (!date || Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("bs-BA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString();
  }
};

const parseNonNegativeNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

export const getFeaturedPlacementLabel = (placement) => {
  const normalized = normalizePlacementToken(placement);
  if (normalized === "home") return "Samo naslovna";
  if (normalized === "category") return "Samo kategorija";
  if (normalized === "category_home") return "Kategorija + naslovna";
  return "Nije određeno";
};

const extractFeaturedPlacementCandidates = (item) => {
  if (!item || typeof item !== "object") return [];

  const candidates = [
    item?.placement,
    item?.positions,
    item?.position,
    item?.featured_placement,
    item?.featured_positions,
    item?.featured_position,
  ];

  const featuredRows = Array.isArray(item?.featured_items) ? item.featured_items : [];
  featuredRows.forEach((row) => {
    candidates.push(
      row?.placement,
      row?.positions,
      row?.position,
      row?.featured_placement,
      row?.featured_position
    );
  });

  const packageSources = [item?.package, item?.featured_package, item?.user_purchased_package];
  packageSources.forEach((source) => {
    candidates.push(source?.placement, source?.positions, source?.position);
  });

  return candidates
    .map((candidate) => normalizePlacementToken(candidate))
    .filter(Boolean);
};

const resolveActiveFeaturedRow = (item) => {
  const rows = Array.isArray(item?.featured_items) ? item.featured_items : [];
  if (!rows.length) return null;

  const sorted = [...rows].sort((a, b) => {
    const aDate =
      parseDateSafe(a?.updated_at) ||
      parseDateSafe(a?.created_at) ||
      parseDateSafe(a?.end_date, { endOfDay: true }) ||
      parseDateSafe(a?.start_date) ||
      new Date(0);
    const bDate =
      parseDateSafe(b?.updated_at) ||
      parseDateSafe(b?.created_at) ||
      parseDateSafe(b?.end_date, { endOfDay: true }) ||
      parseDateSafe(b?.start_date) ||
      new Date(0);
    return bDate.getTime() - aDate.getTime();
  });

  return sorted[0] || null;
};

export const isFeaturedItem = (item) => {
  if (!item || typeof item !== "object") return false;

  if (
    isTruthyFeaturedFlag(item?.is_feature) ||
    isTruthyFeaturedFlag(item?.is_featured) ||
    isTruthyFeaturedFlag(item?.featured)
  ) {
    return true;
  }

  return Array.isArray(item?.featured_items) && item.featured_items.length > 0;
};

export const resolveFeaturedPlacement = (item) => {
  const placements = extractFeaturedPlacementCandidates(item);
  if (!placements.length) return null;
  if (placements.includes("category_home")) return "category_home";
  if (placements.includes("home")) return "home";
  if (placements.includes("category")) return "category";
  return placements[0];
};

export const isHomeFeaturedItem = (item, { strict = false } = {}) => {
  if (!isFeaturedItem(item)) return false;

  const placement = resolveFeaturedPlacement(item);
  if (!placement) return !strict;

  return placement === "home" || placement === "category_home";
};

export const isCategoryFeaturedItem = (item, { strict = false } = {}) => {
  if (!isFeaturedItem(item)) return false;

  const placement = resolveFeaturedPlacement(item);
  if (!placement) return !strict;

  return placement === "category" || placement === "category_home";
};

export const getFeaturedMeta = (item, { now = Date.now() } = {}) => {
  const featured = isFeaturedItem(item);
  const placement = resolveFeaturedPlacement(item);
  const activeRow = resolveActiveFeaturedRow(item);
  const durationDaysRaw =
    activeRow?.duration_days ??
    item?.featured_duration_days ??
    item?.duration_days ??
    null;
  const durationDays = Number(durationDaysRaw);

  const endDate =
    parseDateSafe(item?.featured_expires_at, { endOfDay: false }) ||
    parseDateSafe(item?.featured_end_date, { endOfDay: true }) ||
    parseDateSafe(activeRow?.end_date, { endOfDay: true }) ||
    parseDateSafe(item?.featured_until, { endOfDay: true }) ||
    null;

  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const validNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const secondsLeftFromApi =
    parseNonNegativeNumber(item?.featured_seconds_left) ??
    parseNonNegativeNumber(activeRow?.featured_seconds_left);
  const endMsFromDate = endDate ? endDate.getTime() : null;
  const endMs = endMsFromDate ?? (secondsLeftFromApi !== null ? validNowMs + secondsLeftFromApi * 1000 : null);
  const rawMsLeft = endMs === null ? null : endMs - validNowMs;
  const msLeft = rawMsLeft === null ? null : Math.max(rawMsLeft, 0);
  const isUnlimited = endMs === null;
  const isExpired = endMs !== null && rawMsLeft <= 0;
  const resolvedEndDate = endDate ?? (endMs ? new Date(endMs) : null);

  const remainingLabel = isUnlimited
    ? "Bez isteka"
    : isExpired
    ? "Isteklo"
    : formatRemainingShortBs(msLeft ?? 0);

  return {
    isFeatured: featured,
    placement: placement || null,
    placementLabel: getFeaturedPlacementLabel(placement),
    durationDays: Number.isFinite(durationDays) && durationDays > 0 ? durationDays : null,
    endDate: resolvedEndDate,
    endAtIso: resolvedEndDate ? resolvedEndDate.toISOString() : null,
    endAtLabel: formatExactDateBs(resolvedEndDate),
    isUnlimited,
    isExpired,
    msLeft,
    remainingLabel,
  };
};
