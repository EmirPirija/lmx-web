const ACTIVE_MEMBERSHIP_STATUSES = new Set(["", "active", "trial", "trialing", "paid"]);

const toBool = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "shop", "pro"].includes(normalized)) return true;
  }
  return false;
};

const toText = (value) => String(value ?? "").trim().toLowerCase();

const readMembershipStatus = (source) =>
  toText(
    source?.membership_status ||
      source?.status ||
      source?.membership?.status ||
      source?.membershipStatus
  );

const isActiveStatus = (status) => ACTIVE_MEMBERSHIP_STATUSES.has(toText(status));

const isShopText = (text) =>
  text.includes("shop") ||
  text.includes("trgovina") ||
  text.includes("business");

const isProText = (text) => text.includes("pro") || text.includes("premium");

const collectTierTexts = (source) =>
  [
    source?.membership_tier,
    source?.tier,
    source?.tier_name,
    source?.plan,
    source?.label,
    source?.seller_level,
    source?.role,
    source?.membership?.tier,
    source?.membership?.tier_name,
    source?.membership?.plan,
    source?.membership?.label,
  ]
    .map(toText)
    .filter(Boolean);

const resolveFromSources = (sources) => {
  let hasShop = false;
  let hasPro = false;

  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    if (toBool(source?.is_shop ?? source?.isShop ?? source?.shop)) {
      hasShop = true;
    }
    if (toBool(source?.is_pro ?? source?.isPro ?? source?.premium)) {
      hasPro = true;
    }

    const status = readMembershipStatus(source);
    const activeMembership = isActiveStatus(status);
    const tierTexts = collectTierTexts(source);

    for (const tierText of tierTexts) {
      if (!activeMembership && !tierText.includes("free")) continue;
      if (isShopText(tierText)) hasShop = true;
      if (isProText(tierText)) hasPro = true;
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

