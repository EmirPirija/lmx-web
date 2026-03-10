"use client";

import { getAppStore } from "@/redux/store/storeRef";

const DEFAULT_PROMO_FLAG =
  String(process.env.NEXT_PUBLIC_PROMO_FREE_ACCESS ?? "").trim().toLowerCase() !==
  "false";

const DEFAULT_SELLER_OVERVIEW_FLAG =
  String(process.env.NEXT_PUBLIC_SELLER_OVERVIEW_ENABLED ?? "")
    .trim()
    .toLowerCase() === "true" ||
  String(process.env.NEXT_PUBLIC_SELLER_OVERVIEW_ENABLED ?? "").trim() === "1";

const DEFAULT_PUSH_FLAG = (() => {
  const raw = String(process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return true;
  return raw !== "0" && raw !== "false";
})();

const DEFAULT_PUSH_DEV_FLAG =
  String(process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS_DEV ?? "")
    .trim()
    .toLowerCase() === "true" ||
  String(process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS_DEV ?? "").trim() ===
    "1";

const normalizeBooleanLike = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on", "enabled", "enable"].includes(normalized)) {
      return true;
    }
    if (
      ["0", "false", "no", "off", "disabled", "disable"].includes(normalized)
    ) {
      return false;
    }
  }
  return null;
};

const getByPath = (source, path) => {
  if (!source || typeof source !== "object" || !path) return undefined;
  const segments = String(path).split(".").filter(Boolean);
  if (!segments.length) return undefined;

  let cursor = source;
  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = cursor[segment];
  }
  return cursor;
};

const normalizeKeys = (keys) => {
  if (!Array.isArray(keys)) return [];
  return keys
    .map((key) => String(key || "").trim())
    .filter(Boolean);
};

export const getSystemSettingsSnapshot = () => {
  const store = getAppStore();
  const state = store?.getState?.();
  return state?.Settings?.data?.data || null;
};

export const getRuntimeConfigSnapshot = () => {
  const store = getAppStore();
  const state = store?.getState?.();
  return state?.RuntimeConfig?.data || null;
};

export const readSettingValue = (keys = [], fallback = undefined, settings = null) => {
  const source = settings || getSystemSettingsSnapshot();
  const normalizedKeys = normalizeKeys(keys);

  for (const key of normalizedKeys) {
    const value = getByPath(source, key);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
};

export const readBooleanSetting = (keys = [], fallback = false, settings = null) => {
  const value = readSettingValue(keys, undefined, settings);
  const parsed = normalizeBooleanLike(value);
  if (parsed === null) return fallback;
  return parsed;
};

export const readArraySetting = (keys = [], fallback = [], settings = null) => {
  const value = readSettingValue(keys, undefined, settings);

  if (Array.isArray(value)) {
    return value.filter(Boolean).map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(Boolean)
          .map((entry) => String(entry).trim())
          .filter(Boolean);
      }
    } catch {
      // no-op
    }

    return trimmed
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return fallback;
};

const readRuntimeValue = (
  keys = [],
  fallback = undefined,
  runtimeConfig = null,
) => {
  const source = runtimeConfig || getRuntimeConfigSnapshot();
  const normalizedKeys = normalizeKeys(keys);

  for (const key of normalizedKeys) {
    const value = getByPath(source, key);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
};

const readRuntimeBoolean = (
  keys = [],
  fallback = false,
  runtimeConfig = null,
) => {
  const value = readRuntimeValue(keys, undefined, runtimeConfig);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const nestedEnabled = normalizeBooleanLike(value.enabled);
    if (nestedEnabled !== null) return nestedEnabled;
  }

  const parsed = normalizeBooleanLike(value);
  if (parsed === null) return fallback;
  return parsed;
};

const readRuntimeFeatureFlagBoolean = (
  keys = [],
  fallback = null,
  runtimeConfig = null,
) => {
  const source = runtimeConfig || getRuntimeConfigSnapshot();
  const flags =
    source?.feature_flags && typeof source.feature_flags === "object"
      ? source.feature_flags
      : null;
  const normalizedKeys = normalizeKeys(keys);

  if (!flags || normalizedKeys.length === 0) return fallback;

  for (const key of normalizedKeys) {
    const value = flags?.[key];
    if (value === undefined || value === null || value === "") continue;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nestedEnabled = normalizeBooleanLike(value.enabled);
      if (nestedEnabled !== null) return nestedEnabled;
    }

    const parsed = normalizeBooleanLike(value);
    if (parsed !== null) return parsed;
  }

  return fallback;
};

export const isPromoFreeAccessEnabledSetting = (settings = null) =>
  readBooleanSetting(
    [
      "promo_free_access",
      "promo_mode",
      "free_access_mode",
      "membership_promo_mode",
      "all_plans_free",
      "plans_free_mode",
    ],
    DEFAULT_PROMO_FLAG,
    settings,
  );

export const isSellerOverviewEnabledSetting = (settings = null) =>
  readBooleanSetting(
    [
      "seller_overview_enabled",
      "enable_seller_overview",
      "seller_analytics_overview_enabled",
      "seller_analytics_enabled",
      "my_ads_overview_enabled",
    ],
    DEFAULT_SELLER_OVERVIEW_FLAG,
    settings,
  );

export const isPushNotificationsEnabledSetting = (settings = null) =>
  readBooleanSetting(
    [
      "push_notifications_enabled",
      "web_push_notifications_enabled",
      "enable_push_notifications",
      "notifications_push_enabled",
    ],
    DEFAULT_PUSH_FLAG,
    settings,
  );

export const isPushNotificationsDevEnabledSetting = (settings = null) =>
  readBooleanSetting(
    [
      "push_notifications_dev_enabled",
      "web_push_dev_enabled",
      "enable_push_notifications_dev",
    ],
    DEFAULT_PUSH_DEV_FLAG,
    settings,
  );

export const getMaintenanceMessageSetting = (settings = null) =>
  String(
    readSettingValue(
      [
        "maintenance_message",
        "web_maintenance_message",
        "maintenance_notice",
      ],
      "",
      settings,
    ) || "",
  ).trim();

export const isProOnboardingEnabledSetting = (
  settings = null,
  runtimeConfig = null,
) => {
  const globalSettingsEnabled = readBooleanSetting(
    [
      "membership_onboarding_enabled",
      "membership_signup_enabled",
      "membership_upgrade_enabled",
    ],
    true,
    settings,
  );
  const globalRuntimeEnabled = readRuntimeBoolean(
    [
      "membership_onboarding_enabled",
      "services.membership_onboarding.enabled",
      "services.membership_upgrade.enabled",
    ],
    true,
    runtimeConfig,
  );

  if (!globalSettingsEnabled || !globalRuntimeEnabled) return false;

  const settingsEnabled = readBooleanSetting(
    [
      "pro_signup_enabled",
      "pro_onboarding_enabled",
      "membership.pro_signup_enabled",
      "membership.pro.enabled",
      "features.pro_signup_enabled",
    ],
    true,
    settings,
  );
  const runtimeEnabled = readRuntimeBoolean(
    [
      "pro_signup_enabled",
      "services.pro_signup.enabled",
      "services.pro_onboarding.enabled",
      "membership.pro_signup_enabled",
    ],
    true,
    runtimeConfig,
  );
  const featureFlagEnabled = readRuntimeFeatureFlagBoolean(
    [
      "pro_signup",
      "pro_onboarding",
      "membership_pro_signup",
    ],
    null,
    runtimeConfig,
  );

  return settingsEnabled && runtimeEnabled && (featureFlagEnabled ?? true);
};

export const isShopOnboardingEnabledSetting = (
  settings = null,
  runtimeConfig = null,
) => {
  const globalSettingsEnabled = readBooleanSetting(
    [
      "membership_onboarding_enabled",
      "membership_signup_enabled",
      "membership_upgrade_enabled",
    ],
    true,
    settings,
  );
  const globalRuntimeEnabled = readRuntimeBoolean(
    [
      "membership_onboarding_enabled",
      "services.membership_onboarding.enabled",
      "services.membership_upgrade.enabled",
    ],
    true,
    runtimeConfig,
  );

  if (!globalSettingsEnabled || !globalRuntimeEnabled) return false;

  const settingsEnabled = readBooleanSetting(
    [
      "shop_signup_enabled",
      "shop_onboarding_enabled",
      "membership.shop_signup_enabled",
      "membership.shop.enabled",
      "features.shop_signup_enabled",
    ],
    true,
    settings,
  );
  const runtimeEnabled = readRuntimeBoolean(
    [
      "shop_signup_enabled",
      "services.shop_signup.enabled",
      "services.shop_onboarding.enabled",
      "membership.shop_signup_enabled",
    ],
    true,
    runtimeConfig,
  );
  const featureFlagEnabled = readRuntimeFeatureFlagBoolean(
    [
      "shop_signup",
      "shop_onboarding",
      "membership_shop_signup",
    ],
    null,
    runtimeConfig,
  );

  return settingsEnabled && runtimeEnabled && (featureFlagEnabled ?? true);
};

export const isMembershipOnboardingEnabled = (
  tier,
  settings = null,
  runtimeConfig = null,
) => {
  const normalizedTier = String(tier || "").trim().toLowerCase();
  if (normalizedTier === "shop") {
    return isShopOnboardingEnabledSetting(settings, runtimeConfig);
  }
  return isProOnboardingEnabledSetting(settings, runtimeConfig);
};
