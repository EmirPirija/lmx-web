"use client";

import { logoutSuccess, updateDataSuccess } from "@/redux/reducer/authSlice";
import { setIsUnauthorized } from "@/redux/reducer/globalStateSlice";
import { getAppStore } from "@/redux/store/storeRef";

const AUTH_RECOVERY_TIMEOUT_MS = 10_000;
const UNAUTHORIZED_MODAL_COOLDOWN_MS = 10_000;
const RECOVERY_ATTEMPT_WINDOW_MS = 60_000;
const MAX_RECOVERY_ATTEMPTS_PER_WINDOW = 3;

let unauthorizedModalShown = false;
let lastUnauthorizedAt = 0;
let activeRecoveryPromise = null;
let refreshEndpointDisabled = false;
let recoveryAttemptTimestamps = [];

const AUTH_ENDPOINT_EXCLUSIONS = [
  "auth/signup",
  "auth/otp",
  "auth/verify-otp",
  "auth/resolve-identifier",
  "auth/logout",
  "auth/logout-all-devices",
];

const normalizeUrl = (value) => String(value || "").toLowerCase();

const isAuthExcludedRequest = (config = {}) => {
  const requestUrl = normalizeUrl(config?.url);
  if (!requestUrl) return false;
  return AUTH_ENDPOINT_EXCLUSIONS.some((matcher) => requestUrl.includes(matcher));
};

const getRefreshEndpoint = () => {
  const raw = String(process.env.NEXT_PUBLIC_AUTH_REFRESH_ENDPOINT || "").trim();
  return raw.replace(/^\/+|\/+$/g, "");
};

const getStoreAuthData = () => {
  const state = getAppStore()?.getState?.();
  return state?.UserSignup?.data || null;
};

const updateStoreAuthToken = (token) => {
  if (!token) return;

  const appStore = getAppStore();
  const currentAuthData = getStoreAuthData() || {};
  const nextAuthData = {
    ...currentAuthData,
    token,
  };

  appStore?.dispatch?.(updateDataSuccess(nextAuthData));
};

const openUnauthorizedModalThrottled = () => {
  const appStore = getAppStore();
  const now = Date.now();
  const canOpen = now - lastUnauthorizedAt >= UNAUTHORIZED_MODAL_COOLDOWN_MS;

  if (unauthorizedModalShown || !canOpen) return;
  appStore?.dispatch?.(setIsUnauthorized(true));
  unauthorizedModalShown = true;
  lastUnauthorizedAt = now;

  window.setTimeout(() => {
    unauthorizedModalShown = false;
  }, 3000);
};

const emitSafeLogoutEvent = (payload = {}) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("lmx:auth-safe-logout", {
      detail: {
        at: new Date().toISOString(),
        ...payload,
      },
    }),
  );
};

const trimRecoveryAttempts = () => {
  const now = Date.now();
  recoveryAttemptTimestamps = recoveryAttemptTimestamps.filter(
    (timestamp) => now - timestamp <= RECOVERY_ATTEMPT_WINDOW_MS,
  );
};

const canStartRecoveryAttempt = () => {
  trimRecoveryAttempts();
  return recoveryAttemptTimestamps.length < MAX_RECOVERY_ATTEMPTS_PER_WINDOW;
};

const registerRecoveryAttempt = () => {
  trimRecoveryAttempts();
  recoveryAttemptTimestamps.push(Date.now());
};

const resetRecoveryAttempts = () => {
  recoveryAttemptTimestamps = [];
};

export const handleSafeLogout = ({
  status = 0,
  reason = "session_expired",
  showUnauthorizedModal = true,
} = {}) => {
  activeRecoveryPromise = null;
  resetRecoveryAttempts();
  const appStore = getAppStore();
  appStore?.dispatch?.(logoutSuccess());
  if (showUnauthorizedModal) {
    openUnauthorizedModalThrottled();
  }
  emitSafeLogoutEvent({ status, reason });
};

const requestRefreshToken = async (apiInstance, requestId) => {
  if (refreshEndpointDisabled) return null;

  const refreshEndpoint = getRefreshEndpoint();
  if (!refreshEndpoint) return null;

  try {
    const response = await apiInstance.post(refreshEndpoint, null, {
      timeout: AUTH_RECOVERY_TIMEOUT_MS,
      __skipRetry: true,
      __skipAuthRecovery: true,
      headers: requestId ? { "X-Request-Id": requestId } : undefined,
    });

    return (
      response?.data?.token ||
      response?.data?.data?.token ||
      response?.data?.access_token ||
      response?.data?.data?.access_token ||
      null
    );
  } catch (error) {
    const status = Number(error?.response?.status || 0);
    if (status === 404 || status === 405) {
      refreshEndpointDisabled = true;
    }
    return null;
  }
};

const probeSession = async (apiInstance, requestId) => {
  try {
    const response = await apiInstance.get("auth/me", {
      timeout: AUTH_RECOVERY_TIMEOUT_MS,
      __skipRetry: true,
      __skipAuthRecovery: true,
      headers: requestId ? { "X-Request-Id": requestId } : undefined,
    });
    return Number(response?.status || 0) >= 200 && Number(response?.status || 0) < 300;
  } catch {
    return false;
  }
};

export const shouldAttemptAuthRecovery = (error) => {
  const status = Number(error?.response?.status || 0);
  if (status !== 401 && status !== 419) return false;

  const config = error?.config || {};
  if (config.__skipAuthRecovery) return false;
  if (config.__isRetryAfterAuthRecovery) return false;
  if (config.signal?.aborted) return false;
  if (isAuthExcludedRequest(config)) return false;

  const authData = getStoreAuthData();
  const hasTokenInStore = Boolean(authData?.token);
  const hadAuthHeader = Boolean(
    error?.config?.headers?.authorization ||
      error?.config?.headers?.Authorization,
  );
  return (hasTokenInStore || hadAuthHeader) && canStartRecoveryAttempt();
};

export const recoverAuthSession = async ({ apiInstance, error }) => {
  if (!apiInstance) {
    return { ok: false, reason: "not-applicable" };
  }

  if (!shouldAttemptAuthRecovery(error)) {
    const status = Number(error?.response?.status || 0);
    const authLikeError = status === 401 || status === 419;
    if (authLikeError && !canStartRecoveryAttempt()) {
      return { ok: false, reason: "recovery-rate-limited" };
    }
    return { ok: false, reason: "not-applicable" };
  }

  if (activeRecoveryPromise) return activeRecoveryPromise;
  registerRecoveryAttempt();

  const requestId =
    error?.response?.headers?.["x-request-id"] ||
    error?.response?.headers?.["x-correlation-id"] ||
    error?.config?.metadata?.requestId ||
    null;

  activeRecoveryPromise = (async () => {
    const refreshedToken = await requestRefreshToken(apiInstance, requestId);
    if (refreshedToken) {
      updateStoreAuthToken(refreshedToken);
      resetRecoveryAttempts();
      return {
        ok: true,
        mode: "refresh",
      };
    }

    const isSessionStillValid = await probeSession(apiInstance, requestId);
    if (isSessionStillValid) {
      resetRecoveryAttempts();
      return {
        ok: true,
        mode: "probe",
      };
    }

    return {
      ok: false,
      reason: "session-invalid",
    };
  })().finally(() => {
    activeRecoveryPromise = null;
  });

  return activeRecoveryPromise;
};
