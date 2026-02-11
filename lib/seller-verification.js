const normalize = (value) => String(value ?? "").trim().toLowerCase();

const POSITIVE_STATUSES = new Set([
  "approved",
  "verified",
  "seller_verified",
  "kyc_approved",
  "approved_kyc",
  "kyc-verified",
  "kyc_verified",
]);

const NEGATIVE_STATUS_PARTS = [
  "pend",
  "wait",
  "review",
  "reject",
  "declin",
  "unver",
  "not_approved",
  "not approved",
  "suspend",
  "ban",
  "cancel",
];

const TRUE_FLAGS = new Set(["1", "true", "yes", "y", "approved", "verified"]);
const FALSE_FLAGS = new Set(["0", "false", "no", "n", "none", "null", "undefined"]);

const toBool = (value) => {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;

  if (typeof value === "number") return value > 0;

  if (typeof value === "string") {
    const normalized = normalize(value);
    if (!normalized) return false;
    if (TRUE_FLAGS.has(normalized)) return true;
    if (FALSE_FLAGS.has(normalized)) return false;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed > 0;
    return false;
  }

  return Boolean(value);
};

const getStatusCandidates = (source) => {
  if (!source || typeof source !== "object") return [];

  return [
    source?.verification_status,
    source?.verificationStatus,
    source?.verified_status,
    source?.verifiedStatus,
    source?.seller_verification_status,
    source?.sellerVerificationStatus,
    source?.kyc_status,
    source?.status,
    source?.verification?.status,
    source?.kyc?.status,
  ]
    .map((value) => normalize(value))
    .filter(Boolean);
};

const hasApprovedStatus = (statuses) =>
  statuses.some((status) => POSITIVE_STATUSES.has(status));

const hasRejectedOrPendingStatus = (statuses) =>
  statuses.some((status) => NEGATIVE_STATUS_PARTS.some((part) => status.includes(part)));

const getFlagCandidates = (source) => {
  if (!source || typeof source !== "object") return [];

  return [
    source?.is_verified,
    source?.verified,
    source?.isVerified,
    source?.seller_verified,
    source?.sellerVerified,
    source?.is_seller_verified,
    source?.is_verified_status,
    source?.is_kyc_verified,
    source?.kyc_verified,
    source?.verification_approved,
    source?.verificationApproved,
    source?.verification?.approved,
    source?.verification?.is_verified,
    source?.verification?.verified,
    source?.kyc?.approved,
    source?.kyc?.verified,
  ];
};

const hasVerifiedBadge = (source) => {
  const badges = Array.isArray(source?.badges) ? source.badges : [];

  return badges.some((badge) => {
    const id = normalize(badge?.id);
    const slug = normalize(badge?.slug);
    const key = normalize(badge?.key);
    return (
      id === "seller_verified" ||
      id === "kyc_verified" ||
      id === "account_verified" ||
      slug === "seller-verified" ||
      slug === "kyc-verified" ||
      key === "seller_verified" ||
      key === "kyc_verified"
    );
  });
};

export const isSellerVerified = (...sources) => {
  const list = sources.filter(Boolean);
  if (!list.length) return false;

  const statuses = list.flatMap((source) => getStatusCandidates(source));
  if (hasApprovedStatus(statuses)) return true;

  const hasPositiveFlag = list.some((source) =>
    getFlagCandidates(source).some((flag) => toBool(flag))
  );
  if (hasPositiveFlag) return true;

  if (hasRejectedOrPendingStatus(statuses)) return false;

  return list.some((source) => hasVerifiedBadge(source));
};
