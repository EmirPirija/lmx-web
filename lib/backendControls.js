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

