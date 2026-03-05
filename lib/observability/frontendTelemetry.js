"use client";

const FAILURE_BUCKETS = {
  network: "network.unreachable",
  timeout: "network.timeout",
  unauthorized: "auth.unauthorized",
  expired: "auth.session_expired",
  forbidden: "auth.forbidden",
  validation: "api.validation",
  upstream: "api.upstream",
  unknown: "api.unknown",
};

const resolveFailureBucket = ({
  status = 0,
  isNetwork = false,
  isTimeout = false,
} = {}) => {
  if (isTimeout) return FAILURE_BUCKETS.timeout;
  if (isNetwork || !status) return FAILURE_BUCKETS.network;
  if (status === 401) return FAILURE_BUCKETS.unauthorized;
  if (status === 419) return FAILURE_BUCKETS.expired;
  if (status === 403) return FAILURE_BUCKETS.forbidden;
  if (status === 422) return FAILURE_BUCKETS.validation;
  if (status >= 500) return FAILURE_BUCKETS.upstream;
  return FAILURE_BUCKETS.unknown;
};

const sanitizePath = (value = "") =>
  String(value)
    .replace(/\?.*$/, "")
    .replace(/\/{2,}/g, "/");

const safeDispatchTelemetryEvent = (name, detail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(name, {
      detail,
    }),
  );
};

export const emitRequestSuccessTelemetry = ({
  requestId = null,
  method = "get",
  path = "",
  durationMs = null,
  proxyMode = "unknown",
  status = 200,
} = {}) => {
  safeDispatchTelemetryEvent("lmx:request-telemetry", {
    type: "success",
    request_id: requestId,
    method: String(method || "get").toUpperCase(),
    path: sanitizePath(path),
    duration_ms: durationMs,
    proxy_mode: proxyMode,
    status,
  });
};

export const emitRequestFailureTelemetry = ({
  requestId = null,
  method = "get",
  path = "",
  durationMs = null,
  proxyMode = "unknown",
  status = 0,
  isNetwork = false,
  isTimeout = false,
  errorCode = null,
} = {}) => {
  const taxonomy = resolveFailureBucket({
    status,
    isNetwork,
    isTimeout,
  });

  safeDispatchTelemetryEvent("lmx:request-telemetry", {
    type: "failure",
    taxonomy,
    request_id: requestId,
    method: String(method || "get").toUpperCase(),
    path: sanitizePath(path),
    duration_ms: durationMs,
    proxy_mode: proxyMode,
    status,
    code: errorCode,
  });
};

export const emitFlowTelemetry = ({
  flow = "unknown",
  stage = "unknown",
  status = "info",
  requestId = null,
  extras = null,
} = {}) => {
  safeDispatchTelemetryEvent("lmx:flow-telemetry", {
    flow,
    stage,
    status,
    request_id: requestId,
    extras,
    at: new Date().toISOString(),
  });
};
