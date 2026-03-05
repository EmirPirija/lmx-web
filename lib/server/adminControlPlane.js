import { extractAdminControlPlane, normalizeSystemSettingsEnvelope } from "@/lib/runtime/adminControlPlane";

const DEFAULT_REVALIDATE_SECONDS = 45;
const DEFAULT_TIMEOUT_MS = 4500;

let cachedSnapshot = {
  expiresAt: 0,
  payload: null,
};

const normalizePath = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

const getBackendUrl = () => {
  const apiHost = String(
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "",
  ).trim();
  const endpointRaw = String(
    process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_END_POINT || "/api",
  ).trim();

  if (!apiHost) return null;
  const host = apiHost.replace(/\/+$/, "");
  const endpoint = normalizePath(endpointRaw);
  return `${host}/${endpoint}`;
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const parseBooleanLike = (value, fallback = false) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "off"].includes(normalized)) return false;
  return fallback;
};

const buildFallbackPayload = () =>
  normalizeSystemSettingsEnvelope({
    maintenance_mode: Number(
      String(process.env.MAINTENANCE_MODE || "").trim().toLowerCase() === "true",
    ),
    force_update: 0,
    show_landing_page: 0,
  });

const fetchSettingsPayload = async ({ langCode = null } = {}) => {
  const backend = getBackendUrl();
  if (!backend) return buildFallbackPayload();

  const url = new URL(`${backend}/get-system-settings`);
  const timeout = Number(process.env.SYSTEM_SETTINGS_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(langCode ? { "Content-Language": langCode } : {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const json = await parseJsonSafe(response);
    if (!response.ok || !json || json.error === true) {
      return buildFallbackPayload();
    }

    return normalizeSystemSettingsEnvelope(json);
  } catch {
    return buildFallbackPayload();
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchBackendControlPlane = async ({ langCode = null } = {}) => {
  const backend = getBackendUrl();
  if (!backend) return null;

  const url = new URL(`${backend}/frontend-control-plane`);
  const timeout = Number(process.env.SYSTEM_SETTINGS_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(langCode ? { "Content-Language": langCode } : {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
    const json = await parseJsonSafe(response);
    if (!response.ok || !json || json?.error === true) return null;
    return json?.data || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const mergeBackendSnapshotIntoControlPlane = (baseControlPlane, snapshot) => {
  if (!snapshot || typeof snapshot !== "object") return baseControlPlane;
  const controls = snapshot?.controls || {};
  const auth = controls?.auth || {};
  const features = controls?.features || {};

  return {
    ...baseControlPlane,
    maintenanceMode: parseBooleanLike(
      controls?.maintenance_mode,
      baseControlPlane?.maintenanceMode ?? false,
    ),
    forceUpdate: parseBooleanLike(
      controls?.force_update,
      baseControlPlane?.forceUpdate ?? false,
    ),
    showLandingPage: parseBooleanLike(
      controls?.show_landing_page,
      baseControlPlane?.showLandingPage ?? false,
    ),
    authProviders: {
      ...baseControlPlane?.authProviders,
      mobile: parseBooleanLike(
        auth?.mobile_authentication,
        baseControlPlane?.authProviders?.mobile ?? true,
      ),
      google: parseBooleanLike(
        auth?.google_authentication,
        baseControlPlane?.authProviders?.google ?? true,
      ),
      email: parseBooleanLike(
        auth?.email_authentication,
        baseControlPlane?.authProviders?.email ?? true,
      ),
      apple: parseBooleanLike(
        auth?.apple_authentication,
        baseControlPlane?.authProviders?.apple ?? false,
      ),
    },
    features: {
      ...baseControlPlane?.features,
      realtimeEventsEnabled: parseBooleanLike(
        features?.realtime_events_enabled,
        baseControlPlane?.features?.realtimeEventsEnabled ?? true,
      ),
      pushNotificationsEnabled: parseBooleanLike(
        features?.push_notifications_enabled,
        baseControlPlane?.features?.pushNotificationsEnabled ?? true,
      ),
      liveTrackingEnabled: parseBooleanLike(
        features?.live_tracking_enabled,
        baseControlPlane?.features?.liveTrackingEnabled ?? true,
      ),
      engagementTrackingEnabled: parseBooleanLike(
        features?.engagement_tracking_enabled,
        baseControlPlane?.features?.engagementTrackingEnabled ?? true,
      ),
      frontendObservabilityEnabled: parseBooleanLike(
        features?.frontend_observability_enabled,
        baseControlPlane?.features?.frontendObservabilityEnabled ?? true,
      ),
    },
    backendControlPlaneVersion:
      typeof snapshot?.version === "string" ? snapshot.version : null,
    backendControlPlaneGeneratedAt:
      typeof snapshot?.generated_at === "string" ? snapshot.generated_at : null,
  };
};

export const getAdminControlPlane = async ({ langCode = null } = {}) => {
  const now = Date.now();
  if (cachedSnapshot.payload && cachedSnapshot.expiresAt > now) {
    return cachedSnapshot.payload;
  }

  const [settingsPayload, backendControlPlaneSnapshot] = await Promise.all([
    fetchSettingsPayload({ langCode }),
    fetchBackendControlPlane({ langCode }),
  ]);

  const derivedControlPlane = extractAdminControlPlane(settingsPayload);
  const controlPlane = mergeBackendSnapshotIntoControlPlane(
    derivedControlPlane,
    backendControlPlaneSnapshot,
  );
  const payload = {
    controlPlane,
    settingsPayload,
    backendControlPlaneSnapshot,
  };

  const ttlSeconds = Number(
    process.env.SYSTEM_SETTINGS_REVALIDATE_SECONDS || DEFAULT_REVALIDATE_SECONDS,
  );
  cachedSnapshot = {
    payload,
    expiresAt: now + Math.max(10, ttlSeconds) * 1000,
  };
  return payload;
};
