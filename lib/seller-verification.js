const normalize = (value) => String(value ?? "").trim().toLowerCase();

const POSITIVE_STATUSES = new Set([
  "approved",
  "active",
  "verified",
  "seller_verified",
  "account_verified",
  "verified_seller",
  "verified_account",
  "approved_seller",
  "approved_account",
  "kyc_approved",
  "approved_kyc",
  "kyc-verified",
  "kyc_verified",
  "fully_verified",
]);

const HARD_NEGATIVE_STATUS_PARTS = [
  "reject",
  "declin",
  "suspend",
  "ban",
  "blocked",
  "fraud",
  "revok",
  "disable",
  "deactivat",
  "remove",
];

const SOFT_NEGATIVE_STATUS_PARTS = [
  "pend",
  "wait",
  "review",
  "not_approved",
  "not approved",
  "not-verified",
  "not_verified",
  "verification_required",
  "verification required",
  "unverified",
];

const TRUE_FLAGS = new Set(["1", "true", "yes", "y", "approved", "verified"]);
const FALSE_FLAGS = new Set([
  "0",
  "false",
  "no",
  "n",
  "none",
  "null",
  "undefined",
]);

const toBool = (value) => {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;

  if (typeof value === "number") return value > 0;

  if (typeof value === "string") {
    const normalizedValue = normalize(value);
    if (!normalizedValue) return false;
    if (TRUE_FLAGS.has(normalizedValue)) return true;
    if (FALSE_FLAGS.has(normalizedValue)) return false;
    const parsed = Number(normalizedValue);
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
    source?.account_verification_status,
    source?.accountVerificationStatus,
    source?.status,
    source?.verification?.status,
    source?.kyc?.status,
    source?.user?.verification_status,
    source?.user?.verificationStatus,
    source?.seller?.verification_status,
    source?.seller?.verificationStatus,
  ]
    .map((value) => normalize(value))
    .filter(Boolean);
};

const hasApprovedStatus = (statuses) =>
  statuses.some((status) => POSITIVE_STATUSES.has(status));

const hasHardNegativeStatus = (statuses) =>
  statuses.some((status) =>
    HARD_NEGATIVE_STATUS_PARTS.some((part) => status.includes(part)),
  );

const hasSoftNegativeStatus = (statuses) =>
  statuses.some((status) =>
    SOFT_NEGATIVE_STATUS_PARTS.some((part) => status.includes(part)),
  );

const getFlagCandidates = (source) => {
  if (!source || typeof source !== "object") return [];

  return [
    source?.is_verified,
    source?.verified,
    source?.isVerified,
    source?.user_verified,
    source?.userVerified,
    source?.seller_verified,
    source?.sellerVerified,
    source?.is_seller_verified,
    source?.account_verified,
    source?.accountVerified,
    source?.is_account_verified,
    source?.is_kyc_verified,
    source?.kyc_verified,
    source?.verification_approved,
    source?.verificationApproved,
    source?.verification?.approved,
    source?.verification?.is_verified,
    source?.verification?.verified,
    source?.kyc?.approved,
    source?.kyc?.verified,
    source?.seller?.is_verified,
    source?.seller?.verified,
    source?.user?.is_verified,
    source?.user?.verified,
  ];
};

const hasVerificationTimestamp = (source) => {
  if (!source || typeof source !== "object") return false;

  const timestampCandidates = [
    source?.verified_at,
    source?.seller_verified_at,
    source?.kyc_verified_at,
    source?.verification_approved_at,
    source?.verification?.verified_at,
    source?.verification?.approved_at,
    source?.kyc?.verified_at,
    source?.seller?.verified_at,
    source?.seller?.verification_approved_at,
    source?.user?.verified_at,
    source?.user?.verification_approved_at,
  ];

  return timestampCandidates.some((value) => {
    if (!value) return false;
    if (value instanceof Date) return !Number.isNaN(value.getTime());
    if (typeof value === "number") return Number.isFinite(value) && value > 0;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return false;
      const parsed = Date.parse(trimmed);
      return !Number.isNaN(parsed);
    }
    return false;
  });
};

const hasVerifiedBadge = (source) => {
  const badges = Array.isArray(source?.badges) ? source.badges : [];

  return badges.some((badge) => {
    const id = normalize(badge?.id);
    const slug = normalize(badge?.slug);
    const key = normalize(badge?.key);
    const name = normalize(badge?.name);
    return (
      id === "seller_verified" ||
      id === "kyc_verified" ||
      id === "account_verified" ||
      id === "verified_seller" ||
      id === "verified_account" ||
      slug === "seller-verified" ||
      slug === "kyc-verified" ||
      slug === "account-verified" ||
      slug === "verified-seller" ||
      slug === "verified-account" ||
      key === "seller_verified" ||
      key === "kyc_verified" ||
      key === "account_verified" ||
      key === "verified_seller" ||
      key === "verified_account" ||
      name.includes("verificiran prodava") ||
      name.includes("verifikovan prodava") ||
      name.includes("verified seller") ||
      name.includes("verificiran profil") ||
      name.includes("verifikovan profil") ||
      name.includes("verified account")
    );
  });
};

export const resolveSellerVerificationModel = (...sources) => {
  const list = sources.filter(Boolean);
  if (!list.length) {
    return {
      isVerified: false,
      status: "unknown",
      confidence: "none",
      reason: "no-sources",
      signals: {
        statuses: [],
        hasApprovedStatus: false,
        hasHardNegativeStatus: false,
        hasSoftNegativeStatus: false,
        hasPositiveFlag: false,
        hasVerificationTimestamp: false,
        hasVerifiedBadge: false,
      },
    };
  }

  const statuses = list.flatMap((source) => getStatusCandidates(source));
  const approvedStatus = hasApprovedStatus(statuses);
  const hardNegativeStatus = hasHardNegativeStatus(statuses);
  const softNegativeStatus = hasSoftNegativeStatus(statuses);
  const positiveFlag = list.some((source) =>
    getFlagCandidates(source).some((flag) => toBool(flag)),
  );
  const verifiedTimestamp = list.some((source) => hasVerificationTimestamp(source));
  const verifiedBadge = list.some((source) => hasVerifiedBadge(source));

  if (approvedStatus) {
    return {
      isVerified: true,
      status: "approved",
      confidence: "high",
      reason: "approved-status",
      signals: {
        statuses,
        hasApprovedStatus: true,
        hasHardNegativeStatus: hardNegativeStatus,
        hasSoftNegativeStatus: softNegativeStatus,
        hasPositiveFlag: positiveFlag,
        hasVerificationTimestamp: verifiedTimestamp,
        hasVerifiedBadge: verifiedBadge,
      },
    };
  }

  if (hardNegativeStatus) {
    return {
      isVerified: false,
      status: "rejected",
      confidence: "high",
      reason: "hard-negative-status",
      signals: {
        statuses,
        hasApprovedStatus: false,
        hasHardNegativeStatus: true,
        hasSoftNegativeStatus: softNegativeStatus,
        hasPositiveFlag: positiveFlag,
        hasVerificationTimestamp: verifiedTimestamp,
        hasVerifiedBadge: verifiedBadge,
      },
    };
  }

  if (positiveFlag) {
    return {
      isVerified: true,
      status: "approved",
      confidence: "medium",
      reason: "positive-flag",
      signals: {
        statuses,
        hasApprovedStatus: false,
        hasHardNegativeStatus: false,
        hasSoftNegativeStatus: softNegativeStatus,
        hasPositiveFlag: true,
        hasVerificationTimestamp: verifiedTimestamp,
        hasVerifiedBadge: verifiedBadge,
      },
    };
  }

  if (verifiedTimestamp) {
    return {
      isVerified: true,
      status: "approved",
      confidence: "medium",
      reason: "verification-timestamp",
      signals: {
        statuses,
        hasApprovedStatus: false,
        hasHardNegativeStatus: false,
        hasSoftNegativeStatus: softNegativeStatus,
        hasPositiveFlag: false,
        hasVerificationTimestamp: true,
        hasVerifiedBadge: verifiedBadge,
      },
    };
  }

  if (verifiedBadge) {
    return {
      isVerified: true,
      status: "approved",
      confidence: "low",
      reason: "verified-badge",
      signals: {
        statuses,
        hasApprovedStatus: false,
        hasHardNegativeStatus: false,
        hasSoftNegativeStatus: softNegativeStatus,
        hasPositiveFlag: false,
        hasVerificationTimestamp: false,
        hasVerifiedBadge: true,
      },
    };
  }

  if (softNegativeStatus) {
    return {
      isVerified: false,
      status: "pending",
      confidence: "medium",
      reason: "soft-negative-status",
      signals: {
        statuses,
        hasApprovedStatus: false,
        hasHardNegativeStatus: false,
        hasSoftNegativeStatus: true,
        hasPositiveFlag: false,
        hasVerificationTimestamp: false,
        hasVerifiedBadge: false,
      },
    };
  }

  return {
    isVerified: false,
    status: "unknown",
    confidence: "low",
    reason: "no-positive-signal",
    signals: {
      statuses,
      hasApprovedStatus: false,
      hasHardNegativeStatus: false,
      hasSoftNegativeStatus: false,
      hasPositiveFlag: false,
      hasVerificationTimestamp: false,
      hasVerifiedBadge: false,
    },
  };
};

export const isSellerVerified = (...sources) =>
  resolveSellerVerificationModel(...sources).isVerified;
