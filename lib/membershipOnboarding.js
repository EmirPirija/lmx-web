"use client";

export const MEMBERSHIP_ONBOARDING_INTENT_KEY =
  "lmx_membership_onboarding_intent_v1";

export const normalizeMembershipTier = (value, fallback = "pro") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "shop") return "shop";
  if (normalized === "pro") return "pro";
  return fallback;
};

export const getMembershipUpgradePath = (tier = "pro") =>
  `/membership/wizard?tier=${normalizeMembershipTier(tier)}`;

export const resolveMembershipOnboardingTarget = ({
  requestedTier = "pro",
  membership = null,
} = {}) => {
  const tier = normalizeMembershipTier(requestedTier);
  const isShop = Boolean(membership?.isShop);
  const isPremium = Boolean(membership?.isPremium);

  if (tier === "shop") {
    return isShop ? "/profile/shop-ops" : getMembershipUpgradePath("shop");
  }

  if (isPremium) {
    return "/membership/manage";
  }

  return getMembershipUpgradePath("pro");
};

export const writeMembershipOnboardingIntent = (tier = "pro") => {
  if (typeof window === "undefined") return;
  const payload = {
    tier: normalizeMembershipTier(tier),
    created_at: Date.now(),
  };

  try {
    window.sessionStorage.setItem(
      MEMBERSHIP_ONBOARDING_INTENT_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // no-op
  }
};

export const readMembershipOnboardingIntent = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(MEMBERSHIP_ONBOARDING_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const clearMembershipOnboardingIntent = () => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(MEMBERSHIP_ONBOARDING_INTENT_KEY);
  } catch {
    // no-op
  }
};
