"use client";

import { RecaptchaVerifier } from "firebase/auth";

const GLOBAL_VERIFIER_KEY = "__lmxRecaptchaVerifier";
const GLOBAL_CONTAINER_KEY = "__lmxRecaptchaContainerId";
const DEFAULT_CONTAINER_ID = "recaptcha-container";

const isBrowser = () => typeof window !== "undefined";

const getContainer = (containerId = DEFAULT_CONTAINER_ID) => {
  if (!isBrowser()) return null;
  return document.getElementById(containerId);
};

const setGlobalVerifier = (verifier, containerId = "") => {
  if (!isBrowser()) return;
  window[GLOBAL_VERIFIER_KEY] = verifier || null;
  window[GLOBAL_CONTAINER_KEY] = containerId || null;
};

const getGlobalVerifier = () => {
  if (!isBrowser()) return null;
  return window[GLOBAL_VERIFIER_KEY] || null;
};

const getGlobalContainerId = () => {
  if (!isBrowser()) return null;
  return window[GLOBAL_CONTAINER_KEY] || null;
};

const getErrorCode = (errorLike) => {
  if (!errorLike) return "";
  if (typeof errorLike === "string") return errorLike;
  return (
    errorLike?.code ||
    errorLike?.error?.code ||
    errorLike?.customData?._tokenResponse?.error?.message ||
    ""
  );
};

const getErrorMessage = (errorLike) => {
  if (!errorLike) return "";
  if (typeof errorLike === "string") return errorLike;
  return (
    errorLike?.message ||
    errorLike?.error?.message ||
    errorLike?.customData?._tokenResponse?.error?.message ||
    ""
  );
};

export const isFirebaseInvalidAppCredentialError = (errorLike) => {
  const code = String(getErrorCode(errorLike) || "").trim().toLowerCase();
  const message = String(getErrorMessage(errorLike) || "").toLowerCase();
  return (
    code === "auth/invalid-app-credential" ||
    message.includes("auth/invalid-app-credential")
  );
};

export const isRecaptchaRecoverableError = (errorLike) => {
  const code = String(getErrorCode(errorLike) || "").trim().toLowerCase();
  const message = String(getErrorMessage(errorLike) || "").toLowerCase();

  if (message.includes("already been rendered")) return true;
  if (isFirebaseInvalidAppCredentialError(errorLike)) return true;

  return [
    "auth/captcha-check-failed",
    "auth/invalid-recaptcha-token",
    "auth/missing-recaptcha-token",
    "auth/missing-app-credential",
  ].includes(code);
};

export const clearRecaptchaVerifier = ({
  containerId = DEFAULT_CONTAINER_ID,
  clearContainer = true,
} = {}) => {
  if (!isBrowser()) return;

  const existing = getGlobalVerifier();
  if (existing?.clear) {
    try {
      existing.clear();
    } catch (error) {
      console.warn("Ne mogu očistiti postojeći reCAPTCHA verifier:", error);
    }
  }

  setGlobalVerifier(null, "");

  if (!clearContainer) return;

  const container = getContainer(containerId);
  if (container) {
    container.innerHTML = "";
  }
};

export const ensureRecaptchaVerifier = ({
  auth,
  containerId = DEFAULT_CONTAINER_ID,
  forceRecreate = false,
} = {}) => {
  if (!isBrowser() || !auth) return null;

  const container = getContainer(containerId);
  if (!container) {
    console.error(`Container element '${containerId}' not found.`);
    return null;
  }

  const existing = getGlobalVerifier();
  const existingContainerId = getGlobalContainerId();

  if (existing && !forceRecreate) {
    return existing;
  }

  if (existing && (forceRecreate || existingContainerId !== containerId)) {
    clearRecaptchaVerifier({ containerId: existingContainerId || containerId });
  }

  if (container.childElementCount > 0) {
    container.innerHTML = "";
  }

  const createVerifier = () =>
    new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
    });

  try {
    const verifier = createVerifier();
    setGlobalVerifier(verifier, containerId);
    return verifier;
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("already been rendered")) {
      try {
        container.innerHTML = "";
      } catch {
        // noop
      }
      try {
        const verifier = createVerifier();
        setGlobalVerifier(verifier, containerId);
        return verifier;
      } catch (retryError) {
        console.error(
          "Error initializing RecaptchaVerifier after retry:",
          retryError?.message || retryError,
        );
        return null;
      }
    }
    console.error(
      "Error initializing RecaptchaVerifier:",
      error?.message || error,
    );
    return null;
  }
};
