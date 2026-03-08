"use client";

const normalizeBooleanLike = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on", "enabled"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off", "disabled"].includes(normalized)) {
      return false;
    }
  }
  return null;
};

const getRuntimeData = (state) => state?.RuntimeConfig?.data || null;

export const getRuntimeMaintenance = (state) => {
  const maintenance = getRuntimeData(state)?.maintenance;
  if (!maintenance || typeof maintenance !== "object") {
    return { enabled: false, message: "" };
  }

  return {
    ...maintenance,
    enabled: normalizeBooleanLike(maintenance.enabled) ?? false,
    message: String(maintenance.message || ""),
  };
};

export const getRuntimeService = (state, key) => {
  const services = getRuntimeData(state)?.services;
  const service = services && typeof services === "object" ? services[key] : null;
  if (service && typeof service === "object") {
    return {
      enabled: normalizeBooleanLike(service.enabled) ?? true,
      message: String(service.message || ""),
      ...service,
    };
  }
  return {
    enabled: true,
    message: "",
  };
};

export const isRuntimeServiceEnabled = (state, key, fallback = true) => {
  const service = getRuntimeService(state, key);
  const parsed = normalizeBooleanLike(service.enabled);
  return parsed === null ? fallback : parsed;
};

export const isRuntimeAdControlEnabled = (state, key, fallback = true) => {
  const controls = getRuntimeData(state)?.ad_controls;
  const value = controls && typeof controls === "object" ? controls[key] : undefined;
  const parsed = normalizeBooleanLike(value);
  return parsed === null ? fallback : parsed;
};

export const getRuntimeAnnouncements = (state) => {
  const announcements = getRuntimeData(state)?.announcements;
  if (!Array.isArray(announcements)) return [];
  return announcements.filter((entry) => entry && typeof entry === "object");
};

export const getRuntimeFeatureFlag = (state, key) => {
  if (!key) return { enabled: false, payload: {}, variant: null };
  const flags = getRuntimeData(state)?.feature_flags;
  const entry = flags && typeof flags === "object" ? flags[key] : null;

  if (!entry || typeof entry !== "object") {
    return { enabled: false, payload: {}, variant: null };
  }

  return {
    enabled: normalizeBooleanLike(entry.enabled) ?? false,
    payload:
      entry.payload && typeof entry.payload === "object" ? entry.payload : {},
    variant: entry.variant || null,
  };
};
