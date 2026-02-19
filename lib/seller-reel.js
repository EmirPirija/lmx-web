const toBool = (value) => {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    if (["false", "no", "n", "0", "off", "inactive", "none", "null", "undefined"].includes(normalized)) {
      return false;
    }
    if (["true", "yes", "y", "approved", "active", "on", "1"].includes(normalized)) return true;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed > 0;
    return false;
  }
  return Boolean(value);
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const hasMediaString = (value) => {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return !["false", "0", "null", "undefined", "none"].includes(normalized);
};

export const hasItemVideo = (item) => {
  if (!item) return false;
  if (toBool(item.video) || toBool(item.reel_video) || toBool(item.story_video)) return true;
  if (hasMediaString(item.video_link) || hasMediaString(item.reel_link) || hasMediaString(item.story_link)) return true;
  return false;
};

export const hasSellerActiveReel = (seller) => {
  if (!seller) return false;

  const booleanKeys = [
    "has_reel",
    "has_story",
    "reel_video",
    "story_video",
  ];

  const mediaLinkKeys = [
    "reel_link",
    "story_link",
  ];

  if (booleanKeys.some((key) => toBool(seller?.[key]))) return true;
  if (mediaLinkKeys.some((key) => hasMediaString(seller?.[key]))) return true;

  const numericKeys = [
    "reels_count",
    "reel_count",
    "story_count",
    "stories_count",
    "total_reels",
    "active_story_count",
    "active_reels_count",
  ];

  if (numericKeys.some((key) => toPositiveNumber(seller?.[key]))) return true;

  const stats = seller?.stats || seller?.statistics || seller?.analytics || seller?.reel_stats || seller?.story_stats;
  if (stats) {
    if (booleanKeys.some((key) => toBool(stats?.[key]))) return true;
    if (mediaLinkKeys.some((key) => hasMediaString(stats?.[key]))) return true;
    if (numericKeys.some((key) => toPositiveNumber(stats?.[key]))) return true;
  }

  if (Array.isArray(seller?.reels) && seller.reels.length > 0) return true;
  if (Array.isArray(seller?.stories) && seller.stories.length > 0) return true;

  return false;
};
