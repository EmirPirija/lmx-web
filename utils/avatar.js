import { normalizeLegacyImageUrl } from "@/utils/categoryImage";

const STATIC_PLACEHOLDER_PATHS = new Set([
  "/assets/image1.png",
  "/assets/image2.png",
  "/assets/image3.png",
  "/assets/image4.png",
  "/assets/image5.png",
  "/assets/image6.png",
  "/assets/transperant_placeholder.png",
  "/assets/transparent_placeholder.png",
  "/assets/lmx-loader.svg",
  "/assets/logo.svg",
  "/assets/lmx-logo.svg",
  "/logo.svg",
]);

const INVALID_LITERAL_VALUES = new Set([
  "",
  "null",
  "undefined",
  "false",
  "none",
  "n/a",
]);

const LMX_AVATAR_ID_PATTERN = /^lmx-\d{2}$/i;

const normalizeAvatarCandidate = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  return normalizeLegacyImageUrl(trimmed) || trimmed;
};

export const isAvatarPlaceholderValue = (value, placeholderImage = "") => {
  const normalized = normalizeAvatarCandidate(value);
  if (!normalized) return true;

  const lowered = normalized.toLowerCase();
  if (INVALID_LITERAL_VALUES.has(lowered)) return true;
  if (LMX_AVATAR_ID_PATTERN.test(lowered)) return true;

  const loweredNoQuery = lowered.split("?")[0];
  if (STATIC_PLACEHOLDER_PATHS.has(loweredNoQuery)) return true;

  // Backend settings images (logo/fallback assets) should never appear
  // as user profile avatars.
  if (loweredNoQuery.includes("/storage/settings/")) return true;

  const normalizedPlaceholder = normalizeAvatarCandidate(placeholderImage);
  if (normalizedPlaceholder && normalized === normalizedPlaceholder) return true;

  return false;
};

export const resolveAvatarUrl = (sources, options = {}) => {
  const list = Array.isArray(sources) ? sources : [sources];
  const placeholderImage = options?.placeholderImage || "";

  for (const source of list) {
    const normalized = normalizeAvatarCandidate(source);
    if (!normalized) continue;
    if (isAvatarPlaceholderValue(normalized, placeholderImage)) continue;
    return normalized;
  }

  return "";
};
