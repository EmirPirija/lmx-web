"use client";

import Api from "@/api/AxiosInterceptors";

export const AUTH_ENDPOINTS = {
  USER_SIGNUP: "auth/signup",
  RESOLVE_LOGIN_IDENTIFIER: "auth/resolve-identifier",
  GET_OTP: "auth/otp",
  VERIFY_OTP: "auth/verify-otp",
};

export const AUTH_LEGACY_ENDPOINTS = {
  USER_SIGNUP: "user-signup",
  RESOLVE_LOGIN_IDENTIFIER: "resolve-login-identifier",
  GET_OTP: "get-otp",
  VERIFY_OTP: "verify-otp",
};

const USER_SIGNUP_TIMEOUT_MS = 15000;
const ENDPOINT_FALLBACK_STATUSES = new Set([404, 405]);
let resolveIdentifierUnavailable = false;

const shouldRetryOnLegacyEndpoint = (error) => {
  const status = Number(error?.response?.status || 0);
  return ENDPOINT_FALLBACK_STATUSES.has(status);
};

const requestWithLegacyFallback = async ({
  primaryEndpoint,
  legacyEndpoint,
  requestFactory,
} = {}) => {
  try {
    return await requestFactory(primaryEndpoint);
  } catch (error) {
    if (!legacyEndpoint || !shouldRetryOnLegacyEndpoint(error)) {
      throw error;
    }
    return requestFactory(legacyEndpoint);
  }
};

const normalizeIdentifierType = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";

  if (normalized === "username" || normalized === "email") {
    return "email_username";
  }

  return normalized;
};

export const userSignUpApi = {
  userSignup: async ({
    name,
    email,
    mobile,
    fcm_id,
    firebase_id,
    type,
    auth_intent,
    profile,
    country_code,
    registration,
    region_code,
  } = {}) => {
    const formData = new FormData();

    if (name) formData.append("name", name);
    if (email) formData.append("email", email);
    if (mobile) formData.append("mobile", mobile);
    if (fcm_id) formData.append("fcm_id", fcm_id);
    if (firebase_id) formData.append("firebase_id", firebase_id);
    if (type) formData.append("type", type);
    if (auth_intent) formData.append("auth_intent", auth_intent);
    if (region_code) formData.append("region_code", region_code);
    if (profile) formData.append("profile", profile);
    if (country_code) formData.append("country_code", country_code);
    if (registration) formData.append("registration", registration);

    return requestWithLegacyFallback({
      primaryEndpoint: AUTH_ENDPOINTS.USER_SIGNUP,
      legacyEndpoint: AUTH_LEGACY_ENDPOINTS.USER_SIGNUP,
      requestFactory: (endpoint) =>
        Api.post(endpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: USER_SIGNUP_TIMEOUT_MS,
        }),
    });
  },
};

export const authApi = {
  resolveLoginIdentifier: async ({
    identifier,
    identifier_type,
    country_code,
  } = {}) => {
    if (resolveIdentifierUnavailable) {
      return {
        status: 200,
        data: {
          error: false,
          data: null,
          message: "resolve_identifier_temporarily_unavailable",
        },
      };
    }

    const normalizedIdentifierType = normalizeIdentifierType(identifier_type);
    const formData = new FormData();
    if (identifier) formData.append("identifier", identifier);
    if (normalizedIdentifierType) {
      formData.append("identifier_type", normalizedIdentifierType);
    }
    if (country_code) formData.append("country_code", country_code);

    const requestFactory = (endpoint) =>
      Api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        validateStatus: (status) => status >= 200 && status < 500,
      });

    const primaryResponse = await requestFactory(
      AUTH_ENDPOINTS.RESOLVE_LOGIN_IDENTIFIER,
    );
    if (!ENDPOINT_FALLBACK_STATUSES.has(Number(primaryResponse?.status || 0))) {
      return primaryResponse;
    }

    const legacyResponse = await requestFactory(
      AUTH_LEGACY_ENDPOINTS.RESOLVE_LOGIN_IDENTIFIER,
    );

    if (ENDPOINT_FALLBACK_STATUSES.has(Number(legacyResponse?.status || 0))) {
      resolveIdentifierUnavailable = true;
      return {
        status: 200,
        data: {
          error: false,
          data: null,
          message: "resolve_identifier_not_supported",
        },
      };
    }

    return legacyResponse;
  },
};

export const verifyOtpApi = {
  verifyOtp: async ({ number, otp, intent, mobile, country_code, region_code } = {}) => {
    const params = {
      number,
      otp,
      intent,
      mobile,
      country_code,
      region_code,
    };

    return requestWithLegacyFallback({
      primaryEndpoint: AUTH_ENDPOINTS.VERIFY_OTP,
      legacyEndpoint: AUTH_LEGACY_ENDPOINTS.VERIFY_OTP,
      requestFactory: (endpoint) =>
        Api.get(endpoint, {
          params,
        }),
    });
  },
};

export const getOtpApi = {
  getOtp: async ({ number, intent, mobile, country_code, region_code } = {}) => {
    const params = {
      number,
      intent,
      mobile,
      country_code,
      region_code,
    };

    return requestWithLegacyFallback({
      primaryEndpoint: AUTH_ENDPOINTS.GET_OTP,
      legacyEndpoint: AUTH_LEGACY_ENDPOINTS.GET_OTP,
      requestFactory: (endpoint) =>
        Api.get(endpoint, {
          params,
        }),
    });
  },
};
