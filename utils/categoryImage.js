const ROOT_CATEGORY_ICON_BY_SLUG = Object.freeze({
  vozila: "/category-icons/root/vozila.svg",
  nekretnine: "/category-icons/root/nekretnine.svg",
  "mobiteli-i-oprema": "/category-icons/root/mobiteli-i-oprema.svg",
  "racunari-i-oprema": "/category-icons/root/racunari-i-oprema.svg",
  tehnika: "/category-icons/root/tehnika.svg",
  "video-igre-i-konzole": "/category-icons/root/video-igre-i-konzole.svg",
  "moj-dom": "/category-icons/root/moj-dom.svg",
  "muzika-i-audio-oprema": "/category-icons/root/muzika-i-audio-oprema.svg",
  literatura: "/category-icons/root/literatura.svg",
  "umjetnost-i-dekoracija": "/category-icons/root/umjetnost-i-dekoracija.svg",
  kolekcionarstvo: "/category-icons/root/kolekcionarstvo.svg",
  antikviteti: "/category-icons/root/antikviteti.svg",
  "karte-i-ulaznice": "/category-icons/root/karte-i-ulaznice.svg",
  "hrana-i-pice": "/category-icons/root/hrana-i-pice.svg",
  bebe: "/category-icons/root/bebe.svg",
  "igre-i-igracke": "/category-icons/root/igre-i-igracke.svg",
  "moda-i-ljepota": "/category-icons/root/moda-i-ljepota.svg",
  "nakit-i-satovi": "/category-icons/root/nakit-i-satovi.svg",
  "odjeca-i-obuca": "/category-icons/root/odjeca-i-obuca.svg",
  "sport-i-rekreacija": "/category-icons/root/sport-i-rekreacija.svg",
  "biznis-i-industrija": "/category-icons/root/biznis-i-industrija.svg",
  zivotinje: "/category-icons/root/zivotinje.svg",
  ostalo: "/category-icons/root/ostalo.svg",
  "usluge-i-servisi": "/category-icons/root/usluge-i-servisi.svg",
});

const DEFAULT_ROOT_ICON = "/category-icons/root/default.svg";
const ADMIN_STORAGE_ORIGIN = "https://admin.lmx.ba";

const isEmptyParent = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "" || normalized === "null") return true;
  }
  return Number(value) === 0;
};

export const normalizeLegacyImageUrl = (rawValue) => {
  if (typeof rawValue !== "string") return rawValue;

  let normalized = rawValue.trim();
  if (!normalized) return "";

  // Handles malformed values like:
  // https://admin.lmx.ba/storage/https://admin.lmx.ba/storage/custom-fields/file.svg
  while (true) {
    const lower = normalized.toLowerCase();
    const storageHttpPos = lower.indexOf("/storage/http");
    if (storageHttpPos === -1) break;

    const innerHttpPos = lower.indexOf("http", storageHttpPos + 9);
    if (innerHttpPos === -1) break;

    normalized = normalized.slice(innerHttpPos);
  }

  if (/^https?:\/\//i.test(normalized)) return normalized;

  if (normalized.startsWith("/storage/")) {
    return `${ADMIN_STORAGE_ORIGIN}${normalized}`;
  }

  if (normalized.startsWith("storage/")) {
    return `${ADMIN_STORAGE_ORIGIN}/${normalized}`;
  }

  if (normalized.startsWith("/custom-fields/")) {
    return `${ADMIN_STORAGE_ORIGIN}/storage${normalized}`;
  }

  if (normalized.startsWith("custom-fields/")) {
    return `${ADMIN_STORAGE_ORIGIN}/storage/${normalized}`;
  }

  return normalized;
};

const getCategoryImageVersion = (category) => {
  if (!category || typeof category !== "object") return "";

  const rawVersion =
    category?.image_updated_at ??
    category?.updated_at ??
    category?.image_updated_at_timestamp ??
    category?.image_version;

  if (rawVersion === null || rawVersion === undefined) return "";

  if (typeof rawVersion === "number" && Number.isFinite(rawVersion)) {
    return String(rawVersion);
  }

  if (typeof rawVersion === "string") {
    const trimmed = rawVersion.trim();
    if (!trimmed) return "";
    const asTimestamp = Date.parse(trimmed);
    return Number.isNaN(asTimestamp) ? trimmed : String(asTimestamp);
  }

  return "";
};

export const withCategoryImageVersion = (imageUrl, category) => {
  if (typeof imageUrl !== "string") return imageUrl;
  const trimmedUrl = imageUrl.trim();
  if (!trimmedUrl) return "";

  const version = getCategoryImageVersion(category);
  if (!version) return trimmedUrl;

  try {
    const url = new URL(trimmedUrl, ADMIN_STORAGE_ORIGIN);
    url.searchParams.set("v", version);
    return url.toString();
  } catch {
    const encodedVersion = encodeURIComponent(version);

    if (/[?&]v=/.test(trimmedUrl)) {
      return trimmedUrl.replace(/([?&])v=[^&]*/u, `$1v=${encodedVersion}`);
    }

    const separator = trimmedUrl.includes("?") ? "&" : "?";
    return `${trimmedUrl}${separator}v=${encodedVersion}`;
  }
};

export const isRootCategoryObject = (category) => {
  if (!category || typeof category !== "object") return false;

  if ("parent_category_id" in category) {
    return isEmptyParent(category.parent_category_id);
  }

  if ("parent_id" in category) {
    return isEmptyParent(category.parent_id);
  }

  if (typeof category.full_path === "string" && category.full_path) {
    return !category.full_path.includes(" > ");
  }

  return false;
};

export const getRootCategoryIcon = (slug) => {
  if (typeof slug !== "string" || !slug.trim()) return DEFAULT_ROOT_ICON;
  return ROOT_CATEGORY_ICON_BY_SLUG[slug.trim()] || DEFAULT_ROOT_ICON;
};

export const resolveCategoryImage = (category, options = {}) => {
  const preferUnifiedRootIcon = options.preferUnifiedRootIcon ?? false;
  const useRootFallback = options.useRootFallback ?? false;
  const fallback = options.fallback ?? "/assets/Transperant_Placeholder.png";

  if (!category || typeof category !== "object") {
    const normalized = normalizeLegacyImageUrl(category);
    return normalized || fallback;
  }

  const isRoot = isRootCategoryObject(category);
  const slug = category?.slug;

  if (preferUnifiedRootIcon && isRoot) {
    return getRootCategoryIcon(slug);
  }

  const normalized = normalizeLegacyImageUrl(category?.image);
  if (normalized) return withCategoryImageVersion(normalized, category);

  if (useRootFallback && isRoot) {
    return getRootCategoryIcon(slug);
  }

  return fallback;
};
