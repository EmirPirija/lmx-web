const ACTIVE_MEMBERSHIP_STATUSES = new Set([
  "",
  "active",
  "trial",
  "trialing",
  "paid",
  "approved",
  "completed",
  "success",
]);

const INACTIVE_MEMBERSHIP_STATUSES = new Set([
  "inactive",
  "cancelled",
  "canceled",
  "expired",
  "failed",
  "suspended",
  "blocked",
  "rejected",
]);

const isObjectLike = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toBool = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on", "shop", "pro", "premium"].includes(normalized)) return true;
  }
  return false;
};

const toText = (value) => String(value ?? "").trim().toLowerCase();

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const extractApiData = (input, maxDepth = 5) => {
  let current = input;
  let depth = 0;

  while (depth < maxDepth && isObjectLike(current) && "data" in current && current.data != null) {
    current = current.data;
    depth += 1;
  }

  return current ?? null;
};

const readMembershipStatus = (source) =>
  toText(
    source?.membership_status ||
      source?.status ||
      source?.membership?.status ||
      source?.membershipStatus ||
      source?.membership?.membership_status ||
      source?.subscription?.status
  );

const isActiveStatus = (status) => ACTIVE_MEMBERSHIP_STATUSES.has(toText(status));

const isShopText = (text) =>
  text.includes("shop") ||
  text.includes("store") ||
  text.includes("trgovina") ||
  text.includes("business");

const isProText = (text) => text.includes("pro") || text.includes("premium");

const collectTierIds = (source) =>
  [
    source?.tier_id,
    source?.membership_tier_id,
    source?.plan_id,
    source?.tier?.id,
    source?.membership?.tier_id,
    source?.membership?.tier?.id,
    source?.membership?.plan_id,
    source?.subscription?.tier_id,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

const collectTierTexts = (source) =>
  [
    source?.membership_tier,
    source?.membershipTier,
    source?.membership_type,
    source?.membershipType,
    source?.membership_slug,
    source?.membershipSlug,
    source?.seller_type,
    source?.sellerType,
    source?.account_type,
    source?.accountType,
    source?.user_type,
    source?.userType,
    source?.tier,
    source?.tier?.slug,
    source?.tier_name,
    source?.plan,
    source?.plan?.slug,
    source?.label,
    source?.seller_level,
    source?.role,
    source?.type,
    typeof source?.membership === "string" ? source.membership : null,
    source?.membership?.tier,
    source?.membership?.tier?.slug,
    source?.membership?.tier_name,
    source?.membership?.plan,
    source?.membership?.plan?.slug,
    source?.membership?.label,
    source?.membership?.membership_tier,
    source?.membership?.membership_type,
    source?.membership?.membership_slug,
    source?.membership?.seller_type,
    source?.membership?.account_type,
    source?.membership?.user_type,
    source?.subscription?.tier,
    source?.subscription?.tier_name,
    source?.subscription?.plan,
    source?.subscription?.membership_type,
    source?.subscription?.membership_tier,
    source?.subscription?.seller_type,
  ]
    .map(toText)
    .filter(Boolean);

const collectMembershipSources = (source) => {
  const normalized = extractApiData(source);

  if (typeof normalized === "string" || typeof normalized === "number") {
    return [{ tier: normalized }];
  }

  if (!isObjectLike(normalized)) return [];

  return [
    normalized,
    normalized?.user,
    normalized?.seller,
    normalized?.seller_settings,
    normalized?.settings,
    normalized?.membership,
    normalized?.plan,
    normalized?.tier,
    normalized?.subscription,
    normalized?.current_membership,
    normalized?.active_membership,
  ]
    .map((entry) => {
      if (typeof entry === "string" || typeof entry === "number") {
        return { tier: entry };
      }
      return entry;
    })
    .filter(isObjectLike);
};

const collectExpiryDates = (source) =>
  [
    source?.expires_at,
    source?.membership_expires_at,
    source?.membership?.expires_at,
    source?.subscription?.expires_at,
    source?.plan_expires_at,
  ]
    .map(toDate)
    .filter(Boolean);

const resolveFromSources = (sources) => {
  let hasShop = false;
  let hasPro = false;

  for (const rawSource of sources) {
    for (const source of collectMembershipSources(rawSource)) {
      const status = readMembershipStatus(source);
      const statusInactive = INACTIVE_MEMBERSHIP_STATUSES.has(status);

      if (statusInactive) continue;

      if (
        toBool(
          source?.is_shop ??
            source?.isShop ??
            source?.shop ??
            source?.membership?.is_shop ??
            source?.membership?.isShop ??
            source?.membership?.shop
        )
      ) {
        hasShop = true;
      }

      if (
        toBool(
          source?.is_pro ??
            source?.isPro ??
            source?.premium ??
            source?.is_premium ??
            source?.membership?.is_pro ??
            source?.membership?.isPro ??
            source?.membership?.premium ??
            source?.membership?.is_premium
        )
      ) {
        hasPro = true;
      }

      for (const tierId of collectTierIds(source)) {
        if (tierId === 3) hasShop = true;
        if (tierId === 2) hasPro = true;
      }

      const tierTexts = collectTierTexts(source);
      const activeMembership =
        isActiveStatus(status) ||
        collectExpiryDates(source).some((date) => date.getTime() > Date.now());

      for (const tierText of tierTexts) {
        if (!activeMembership && !tierText.includes("free")) continue;
        if (isShopText(tierText)) hasShop = true;
        if (isProText(tierText)) hasPro = true;
      }
    }
  }

  const tier = hasShop ? "shop" : hasPro ? "pro" : "free";
  return {
    tier,
    isFree: tier === "free",
    isPro: tier === "pro",
    isShop: tier === "shop",
    isPremium: tier !== "free",
    label: tier === "shop" ? "Shop" : tier === "pro" ? "Pro" : "Free",
  };
};

export const resolveMembership = (...entities) =>
  resolveFromSources(entities.flat(Infinity).filter(Boolean));

export const resolveMembershipTier = (...entities) =>
  resolveMembership(...entities).tier;

export const resolveMembershipActivity = (...entities) => {
  let hasExplicitActive = false;
  let hasExplicitInactive = false;
  let hasFutureExpiry = false;
  let hasExpiryDate = false;
  let latestExpiry = null;

  for (const rawSource of entities.flat(Infinity).filter(Boolean)) {
    for (const source of collectMembershipSources(rawSource)) {
      const status = readMembershipStatus(source);
      if (status) {
        if (ACTIVE_MEMBERSHIP_STATUSES.has(status)) hasExplicitActive = true;
        if (INACTIVE_MEMBERSHIP_STATUSES.has(status)) hasExplicitInactive = true;
      }

      const activeSignals = [
        source?.is_active,
        source?.active,
        source?.membership?.is_active,
        source?.membership?.active,
      ];
      const hasBooleanActive = activeSignals.some((value) => value === true || value === 1 || value === "1");
      const hasBooleanInactive = activeSignals.some((value) => value === false || value === 0 || value === "0");

      if (hasBooleanActive) hasExplicitActive = true;
      if (hasBooleanInactive) hasExplicitInactive = true;

      for (const expiryDate of collectExpiryDates(source)) {
        hasExpiryDate = true;
        if (!latestExpiry || expiryDate.getTime() > latestExpiry.getTime()) {
          latestExpiry = expiryDate;
        }
        if (expiryDate.getTime() > Date.now()) {
          hasFutureExpiry = true;
        }
      }
    }
  }

  const isExpiredByDate = hasExpiryDate && !hasFutureExpiry;
  const isExplicitlyInactive = hasExplicitInactive && !hasExplicitActive;
  const isActive = isExplicitlyInactive
    ? false
    : hasFutureExpiry || (!isExpiredByDate && (hasExplicitActive || !hasExplicitInactive));

  return {
    isActive,
    hasFutureExpiry,
    hasExpiryDate,
    isExpiredByDate,
    isExplicitlyInactive,
    hasExplicitActive,
    hasExplicitInactive,
    expiresAt: latestExpiry ? latestExpiry.toISOString() : null,
  };
};
