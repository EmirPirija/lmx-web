import { logoutSuccess } from "@/redux/reducer/authSlice";
import { setIsUnauthorized } from "@/redux/reducer/globalStateSlice";
import { getAppStore } from "@/redux/store/storeRef";
import axios from "axios";

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const IDEMPOTENT_METHODS = new Set(["get", "head", "options"]);
const CRITICAL_ENDPOINT_MATCHERS = [
  "get-location",
  "verification-request",
  "internal/location",
  "internal/verification-status",
  "location",
  "verification-status",
];
const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;
const BASE_RETRY_DELAY_MS = 250;
const MAX_RETRY_ATTEMPTS_DEFAULT = 2;
const MAX_RETRY_ATTEMPTS_CRITICAL = 3;
const DEFAULT_INTERNAL_PROXY_BASE_PATH = "/internal-api";
const DEFAULT_API_ENDPOINT_PATH = "/api";
const DEFAULT_PROXY_ALERT_THRESHOLD = 8;
const DEFAULT_PROXY_ALERT_WINDOW_MS = 120_000;
const DEFAULT_PROXY_ALERT_COOLDOWN_MS = 120_000;
const RUNTIME_RULES_BY_ENDPOINT = [
  {
    matcher: "add-item",
    service: "listings",
    adControl: "create_enabled",
    message: "Objava oglasa je trenutno privremeno onemogućena.",
  },
  {
    matcher: "update-item",
    service: "listings",
    adControl: "edit_enabled",
    message: "Uređivanje oglasa je trenutno privremeno onemogućeno.",
  },
  {
    matcher: "delete-item",
    service: "listings",
    adControl: "delete_enabled",
    message: "Brisanje oglasa je trenutno privremeno onemogućeno.",
  },
  {
    matcher: "update-item-status",
    service: "listings",
    adControl: "edit_enabled",
    message: "Promjena statusa oglasa je trenutno privremeno onemogućena.",
  },
  {
    matcher: "make-item-featured",
    service: "listings",
    adControl: "feature_enabled",
    message: "Izdvajanje oglasa je trenutno privremeno onemogućeno.",
  },
  {
    matcher: "renew-item",
    service: "listings",
    adControl: "renew_enabled",
    message: "Obnova oglasa je trenutno privremeno onemogućena.",
  },
  {
    matcher: "send-message",
    service: "chat",
    message: "Slanje poruka je trenutno privremeno onemogućeno.",
  },
  {
    matcher: "item-offer",
    service: "chat",
    message: "Slanje ponuda je trenutno privremeno onemogućeno.",
  },
  {
    matcher: "payment-intent",
    service: "payments",
    message: "Plaćanje je trenutno privremeno onemogućeno.",
  },
];

const circuitBreakerState = new Map();
const internalProxyIncidentState = {
  events: [],
  lastAlertAt: 0,
};

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getInternalProxyBasePath = () =>
  String(
    process.env.NEXT_PUBLIC_INTERNAL_PROXY_BASE_PATH ||
      DEFAULT_INTERNAL_PROXY_BASE_PATH,
  )
    .trim()
    .replace(/\/+$/, "") || DEFAULT_INTERNAL_PROXY_BASE_PATH;

const getApiEndpointPath = () => {
  const endpointRaw = String(
    process.env.NEXT_PUBLIC_END_POINT || DEFAULT_API_ENDPOINT_PATH,
  );
  const endpoint = endpointRaw.startsWith("/") ? endpointRaw : `/${endpointRaw}`;
  return endpoint.replace(/\/+$/, "") || DEFAULT_API_ENDPOINT_PATH;
};

const getApiBaseURL = () => {
  const internalProxyBase = getInternalProxyBasePath();

  if (typeof window !== "undefined") {
    // Browser requests are always forced through the internal BFF layer.
    return internalProxyBase || DEFAULT_INTERNAL_PROXY_BASE_PATH;
  }

  const normalizedEndpoint = getApiEndpointPath();
  const apiUrl = String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  return `${apiUrl}${normalizedEndpoint}`;
};

const Api = axios.create({
  baseURL: getApiBaseURL(),
});

const createRequestId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isInternalProxyRequest = (config = {}) => {
  const internalBasePath = getInternalProxyBasePath();
  const configBaseUrl = String(config?.baseURL ?? Api.defaults.baseURL ?? "");
  const requestUrl = String(config?.url || "");

  if (configBaseUrl === internalBasePath) return true;
  if (requestUrl.startsWith(`${internalBasePath}/`)) return true;
  if (requestUrl === internalBasePath) return true;
  return false;
};

const getProxyAlertWindowMs = () =>
  parsePositiveNumber(
    process.env.NEXT_PUBLIC_INTERNAL_PROXY_ALERT_WINDOW_MS,
    DEFAULT_PROXY_ALERT_WINDOW_MS,
  );

const getProxyAlertThreshold = () =>
  parsePositiveNumber(
    process.env.NEXT_PUBLIC_INTERNAL_PROXY_ALERT_THRESHOLD,
    DEFAULT_PROXY_ALERT_THRESHOLD,
  );

const getProxyAlertCooldownMs = () =>
  parsePositiveNumber(
    process.env.NEXT_PUBLIC_INTERNAL_PROXY_ALERT_COOLDOWN_MS,
    DEFAULT_PROXY_ALERT_COOLDOWN_MS,
  );

const emitInternalProxyAlert = (payload) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("lmx:internal-proxy-alert", {
        detail: payload,
      }),
    );
  }

  console.error("[ALERT][internal-proxy] incident spike detected", payload);

  const sentry = globalThis?.Sentry;
  if (sentry?.captureMessage) {
    sentry.captureMessage("internal_proxy_incident_spike", {
      level: "error",
      tags: {
        area: "internal_proxy",
      },
      extra: payload,
    });
  }
};

const recordInternalProxyIncident = (error) => {
  if (!isInternalProxyRequest(error?.config || {})) return;

  const now = Date.now();
  const windowMs = getProxyAlertWindowMs();
  const threshold = getProxyAlertThreshold();
  const cooldownMs = getProxyAlertCooldownMs();
  const status = Number(error?.response?.status || 0) || null;

  internalProxyIncidentState.events.push({
    at: now,
    status,
    code: String(error?.code || ""),
    path: String(error?.config?.url || ""),
    requestId:
      error?.response?.headers?.["x-request-id"] ||
      error?.config?.metadata?.requestId ||
      null,
  });

  internalProxyIncidentState.events = internalProxyIncidentState.events.filter(
    (entry) => now - entry.at <= windowMs,
  );

  if (
    internalProxyIncidentState.events.length >= threshold &&
    now - internalProxyIncidentState.lastAlertAt >= cooldownMs
  ) {
    internalProxyIncidentState.lastAlertAt = now;
    const recent = internalProxyIncidentState.events.slice(-5);
    const statuses = [...new Set(recent.map((entry) => entry.status).filter(Boolean))];
    emitInternalProxyAlert({
      incidents_in_window: internalProxyIncidentState.events.length,
      window_ms: windowMs,
      threshold,
      statuses,
      samples: recent,
    });
  }
};

const resolveEndpointKey = (config = {}) => {
  const requestUrl = String(config?.url || "").toLowerCase();
  return (
    CRITICAL_ENDPOINT_MATCHERS.find((matcher) => requestUrl.includes(matcher)) ||
    null
  );
};

const getCircuitState = (key) => {
  if (!key) return null;
  return circuitBreakerState.get(key) || null;
};

const markCircuitFailure = (key) => {
  if (!key) return;
  const now = Date.now();
  const prev = getCircuitState(key) || {
    failures: 0,
    lastFailureAt: 0,
    openUntil: 0,
  };
  const nextFailures = prev.failures + 1;
  const openUntil =
    nextFailures >= CIRCUIT_BREAKER_FAILURE_THRESHOLD
      ? now + CIRCUIT_BREAKER_COOLDOWN_MS
      : 0;

  circuitBreakerState.set(key, {
    failures: nextFailures,
    lastFailureAt: now,
    openUntil,
  });
};

const resetCircuit = (key) => {
  if (!key) return;
  circuitBreakerState.delete(key);
};

const isNetworkLikeError = (error) => {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  return (
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    code === "ERR_NETWORK" ||
    message.includes("network error") ||
    message.includes("timeout")
  );
};

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

const getRuntimeConfigSnapshot = () =>
  getAppStore()?.getState?.()?.RuntimeConfig?.data || null;

const getRuntimeServiceState = (runtime, serviceKey) => {
  const service = runtime?.services?.[serviceKey];
  if (!service || typeof service !== "object") {
    return { enabled: true, message: "" };
  }

  return {
    enabled: normalizeBooleanLike(service.enabled) ?? true,
    message: String(service.message || ""),
  };
};

const getRuntimeAdControlEnabled = (runtime, controlKey) => {
  const raw = runtime?.ad_controls?.[controlKey];
  const parsed = normalizeBooleanLike(raw);
  return parsed === null ? true : parsed;
};

const resolveRuntimeBlock = (config = {}) => {
  const requestUrl = String(config?.url || "").toLowerCase();
  if (!requestUrl || requestUrl.includes("runtime-config")) {
    return null;
  }

  const runtime = getRuntimeConfigSnapshot();
  if (!runtime || typeof runtime !== "object") {
    return null;
  }

  const maintenanceEnabled =
    normalizeBooleanLike(runtime?.maintenance?.enabled) ?? false;
  if (maintenanceEnabled) {
    return {
      reason: "maintenance_mode",
      message:
        String(runtime?.maintenance?.message || "").trim() ||
        "Sistem je trenutno u održavanju.",
    };
  }

  const endpointRule = RUNTIME_RULES_BY_ENDPOINT.find((rule) =>
    requestUrl.includes(rule.matcher),
  );
  if (!endpointRule) {
    return null;
  }

  if (endpointRule.service) {
    const serviceState = getRuntimeServiceState(runtime, endpointRule.service);
    if (!serviceState.enabled) {
      return {
        reason: `service_disabled:${endpointRule.service}`,
        message: serviceState.message || endpointRule.message,
      };
    }
  }

  if (endpointRule.adControl) {
    const enabled = getRuntimeAdControlEnabled(runtime, endpointRule.adControl);
    if (!enabled) {
      return {
        reason: `ad_control_disabled:${endpointRule.adControl}`,
        message: endpointRule.message,
      };
    }
  }

  return null;
};

const shouldRetryRequest = (error) => {
  if (!error) return false;
  if (error?.isCircuitOpen) return false;

  const config = error.config || {};
  if (config.__skipRetry) return false;

  const method = String(config.method || "get").toLowerCase();
  if (!IDEMPOTENT_METHODS.has(method)) return false;

  if (config.signal?.aborted) return false;

  const status = Number(error?.response?.status || 0);
  if (RETRYABLE_STATUS_CODES.has(status)) return true;

  if (!status && isNetworkLikeError(error)) return true;

  return false;
};

const getRetryLimit = (config = {}) =>
  resolveEndpointKey(config)
    ? MAX_RETRY_ATTEMPTS_CRITICAL
    : MAX_RETRY_ATTEMPTS_DEFAULT;

const getRetryDelay = (attempt) => {
  const exp = BASE_RETRY_DELAY_MS * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 120);
  return exp + jitter;
};

const normalizeApiError = (error) => {
  const status = Number(error?.response?.status || 0);
  const data = error?.response?.data;
  const requestId =
    error?.response?.headers?.["x-request-id"] ||
    error?.config?.metadata?.requestId ||
    null;

  return {
    status,
    code:
      data?.code ||
      data?.error_code ||
      error?.code ||
      (status ? `HTTP_${status}` : "NETWORK_ERROR"),
    message:
      data?.message ||
      error?.message ||
      "Došlo je do greške prilikom mrežnog zahtjeva.",
    trace_id: requestId,
    is_network_error: !status,
    is_timeout: String(error?.code || "") === "ECONNABORTED",
    is_circuit_open: Boolean(error?.isCircuitOpen),
  };
};

let isUnauthorizedToastShown = false;
const UNAUTHORIZED_COOLDOWN_MS = 10000;
let lastUnauthorizedAt = 0;

Api.interceptors.request.use(function (config) {
  config.headers = config.headers || {};
  config.timeout = config.timeout ?? 15000;

  const requestId = createRequestId();
  const resolvedBaseUrl = String(config.baseURL ?? Api.defaults.baseURL ?? "");
  const requestViaInternalProxy = isInternalProxyRequest({
    ...config,
    baseURL: resolvedBaseUrl,
  });
  config.metadata = {
    ...(config.metadata || {}),
    requestId,
    startedAt: Date.now(),
    resolvedBaseUrl,
    requestProxyMode: requestViaInternalProxy ? "internal" : "direct",
  };
  config.headers["X-Request-Id"] = requestId;

  let token = undefined;
  let langCode = undefined;

  if (typeof window !== "undefined") {
    const state = getAppStore()?.getState?.();
    token = state?.UserSignup?.data?.token;
    langCode = state?.CurrentLanguage?.language?.code;
  }

  if (token) config.headers.authorization = `Bearer ${token}`;
  if (langCode) config.headers["Content-Language"] = langCode;

  const endpointKey = resolveEndpointKey(config);
  const state = getCircuitState(endpointKey);
  const now = Date.now();

  if (state?.openUntil && state.openUntil > now) {
    const retryAfterMs = state.openUntil - now;
    const circuitError = new axios.AxiosError(
      "Circuit breaker is open for this endpoint.",
      "ERR_CIRCUIT_OPEN",
      config,
    );
    circuitError.isCircuitOpen = true;
    circuitError.response = {
      status: 503,
      data: {
        error: true,
        code: "CIRCUIT_OPEN",
        message: "Servis je privremeno nedostupan. Pokušajte ponovo uskoro.",
        retry_after_ms: retryAfterMs,
        trace_id: requestId,
      },
      config,
      headers: {
        "x-request-id": requestId,
      },
    };
    circuitError.normalized = normalizeApiError(circuitError);
    return Promise.reject(circuitError);
  }

  const runtimeBlock = resolveRuntimeBlock(config);
  if (runtimeBlock) {
    const blockError = new axios.AxiosError(
      runtimeBlock.message,
      "ERR_RUNTIME_CONTROL_BLOCK",
      config,
    );
    blockError.response = {
      status: 503,
      data: {
        error: true,
        code: "RUNTIME_CONTROL_BLOCKED",
        message: runtimeBlock.message,
        reason: runtimeBlock.reason,
        trace_id: requestId,
      },
      config,
      headers: {
        "x-request-id": requestId,
      },
    };
    blockError.normalized = normalizeApiError(blockError);
    return Promise.reject(blockError);
  }

  return config;
});

// Add a response interceptor
Api.interceptors.response.use(
  function (response) {
    const endpointKey = resolveEndpointKey(response?.config || {});
    resetCircuit(endpointKey);

    const startedAt = response?.config?.metadata?.startedAt;
    if (Number.isFinite(startedAt)) {
      response.lmxMeta = {
        requestId: response?.config?.metadata?.requestId || null,
        durationMs: Date.now() - startedAt,
      };
    }

    return response;
  },
  async function (error) {
    if (shouldRetryRequest(error)) {
      const config = error.config || {};
      const currentAttempt = Number(config.__retryCount || 0) + 1;
      const retryLimit = getRetryLimit(config);

      if (currentAttempt <= retryLimit) {
        config.__retryCount = currentAttempt;
        await sleep(getRetryDelay(currentAttempt));
        return Api(config);
      }
    }

    const status = error?.response?.status;

    if (status === 401) {
      const appStore = getAppStore();
      const state = appStore?.getState?.();
      const hasTokenInStore = Boolean(state?.UserSignup?.data?.token);
      const hadAuthHeader = Boolean(
        error?.config?.headers?.authorization ||
        error?.config?.headers?.Authorization,
      );
      const requestUrl = String(error?.config?.url || "");
      const isLogoutRequest = requestUrl.includes("logout");

      // Avoid endless unauthorized popups for guests/public requests.
      // Only handle when there was an authenticated session/request.
      if (!isLogoutRequest && (hasTokenInStore || hadAuthHeader)) {
        if (appStore?.dispatch) {
          appStore.dispatch(logoutSuccess());
        }

        const now = Date.now();
        const canShowModal =
          now - lastUnauthorizedAt >= UNAUTHORIZED_COOLDOWN_MS;
        if (!isUnauthorizedToastShown && canShowModal) {
          appStore?.dispatch?.(setIsUnauthorized(true));
          isUnauthorizedToastShown = true;
          lastUnauthorizedAt = now;

          setTimeout(() => {
            isUnauthorizedToastShown = false;
          }, 3000);
        }
      }
    }

    const endpointKey = resolveEndpointKey(error?.config || {});
    const transientStatus = Number(error?.response?.status || 0);
    const isTransientFailure =
      !transientStatus ||
      transientStatus >= 500 ||
      RETRYABLE_STATUS_CODES.has(transientStatus) ||
      isNetworkLikeError(error);

    if (endpointKey) {
      if (isTransientFailure) {
        markCircuitFailure(endpointKey);
      } else {
        resetCircuit(endpointKey);
      }
    }

    recordInternalProxyIncident(error);

    error.normalized = normalizeApiError(error);
    return Promise.reject(error);
  },
);

export default Api;
