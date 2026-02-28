"use client";

import Api from "@/api/AxiosInterceptors";

export const AUTH_ENDPOINTS = {
  USER_SIGNUP: "auth/signup",
  RESOLVE_LOGIN_IDENTIFIER: "auth/resolve-identifier",
  GET_OTP: "auth/otp",
  VERIFY_OTP: "auth/verify-otp",
};

const USER_SIGNUP_TIMEOUT_MS = 15000;

export const userSignUpApi = {
  userSignup: ({
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

    return Api.post(AUTH_ENDPOINTS.USER_SIGNUP, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: USER_SIGNUP_TIMEOUT_MS,
    });
  },
};

export const authApi = {
  resolveLoginIdentifier: ({
    identifier,
    identifier_type,
    country_code,
  } = {}) => {
    const formData = new FormData();
    if (identifier) formData.append("identifier", identifier);
    if (identifier_type) formData.append("identifier_type", identifier_type);
    if (country_code) formData.append("country_code", country_code);
    return Api.post(AUTH_ENDPOINTS.RESOLVE_LOGIN_IDENTIFIER, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const verifyOtpApi = {
  verifyOtp: ({ number, otp, intent, mobile, country_code, region_code } = {}) => {
    return Api.get(AUTH_ENDPOINTS.VERIFY_OTP, {
      params: {
        number: number,
        otp: otp,
        intent: intent,
        mobile: mobile,
        country_code: country_code,
        region_code: region_code,
      },
    });
  },
};

export const getOtpApi = {
  getOtp: ({ number, intent, mobile, country_code, region_code } = {}) => {
    return Api.get(AUTH_ENDPOINTS.GET_OTP, {
      params: {
        number,
        intent,
        mobile,
        country_code,
        region_code,
      },
    });
  },
};
