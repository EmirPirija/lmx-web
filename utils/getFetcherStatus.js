let hasFetchedSystemSettings = false;
let systemSettingsLastFetchedAt = 0;
let hasFetchedCategories = false;
let hasFetchedRuntimeConfig = false;
let runtimeConfigLastFetchedAt = 0;

const DEFAULT_SYSTEM_SETTINGS_TTL_MS = 1000 * 60 * 2; // 2 min
const DEFAULT_RUNTIME_CONFIG_TTL_MS = 1000 * 45; // 45s

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export function getSystemSettingsRefreshTtlMs() {
  return parsePositiveNumber(
    process.env.NEXT_PUBLIC_SYSTEM_SETTINGS_TTL_MS,
    DEFAULT_SYSTEM_SETTINGS_TTL_MS,
  );
}

export function getRuntimeConfigRefreshTtlMs() {
  return parsePositiveNumber(
    process.env.NEXT_PUBLIC_RUNTIME_CONFIG_TTL_MS,
    DEFAULT_RUNTIME_CONFIG_TTL_MS,
  );
}

export function getHasFetchedSystemSettings() {
  return hasFetchedSystemSettings;
}

export function setHasFetchedSystemSettings(value) {
  hasFetchedSystemSettings = Boolean(value);
  if (!hasFetchedSystemSettings) {
    systemSettingsLastFetchedAt = 0;
  } else if (!systemSettingsLastFetchedAt) {
    systemSettingsLastFetchedAt = Date.now();
  }
}

export function markSystemSettingsFetched(timestamp = Date.now()) {
  hasFetchedSystemSettings = true;
  systemSettingsLastFetchedAt = Number.isFinite(timestamp)
    ? timestamp
    : Date.now();
}

export function getSystemSettingsLastFetchedAt() {
  return systemSettingsLastFetchedAt;
}

export function shouldRefetchSystemSettings(
  ttlMs = getSystemSettingsRefreshTtlMs(),
) {
  if (!hasFetchedSystemSettings) return true;
  if (!systemSettingsLastFetchedAt) return true;
  return Date.now() - systemSettingsLastFetchedAt > ttlMs;
}

export function getHasFetchedCategories() {
  return hasFetchedCategories;
}

export function setHasFetchedCategories(value) {
  hasFetchedCategories = value;
}

export function getHasFetchedRuntimeConfig() {
  return hasFetchedRuntimeConfig;
}

export function setHasFetchedRuntimeConfig(value) {
  hasFetchedRuntimeConfig = Boolean(value);
  if (!hasFetchedRuntimeConfig) {
    runtimeConfigLastFetchedAt = 0;
  } else if (!runtimeConfigLastFetchedAt) {
    runtimeConfigLastFetchedAt = Date.now();
  }
}

export function markRuntimeConfigFetched(timestamp = Date.now()) {
  hasFetchedRuntimeConfig = true;
  runtimeConfigLastFetchedAt = Number.isFinite(timestamp)
    ? timestamp
    : Date.now();
}

export function getRuntimeConfigLastFetchedAt() {
  return runtimeConfigLastFetchedAt;
}

export function shouldRefetchRuntimeConfig(
  ttlMs = getRuntimeConfigRefreshTtlMs(),
) {
  if (!hasFetchedRuntimeConfig) return true;
  if (!runtimeConfigLastFetchedAt) return true;
  return Date.now() - runtimeConfigLastFetchedAt > ttlMs;
}
