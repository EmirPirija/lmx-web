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

