"use client";

export const SOCIAL_OAUTH_MESSAGE_TYPE = "lmx-social-oauth";

const POPUP_WIDTH = 560;
const POPUP_HEIGHT = 760;

const getOriginFromUrl = (value) => {
  if (!value) return null;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : undefined;
    return new URL(value, base).origin;
  } catch {
    return null;
  }
};

const getAllowedOrigins = (authUrl) => {
  const origins = new Set();

  if (typeof window !== "undefined") {
    origins.add(window.location.origin);
  }

  const apiOrigin = getOriginFromUrl(process.env.NEXT_PUBLIC_API_URL);
  if (apiOrigin) origins.add(apiOrigin);

  const authOrigin = getOriginFromUrl(authUrl);
  if (authOrigin) origins.add(authOrigin);

  return origins;
};

const openCenteredPopup = (url, name) => {
  const dualLeft = window.screenLeft ?? window.screenX ?? 0;
  const dualTop = window.screenTop ?? window.screenY ?? 0;
  const width = window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;
  const height = window.innerHeight ?? document.documentElement.clientHeight ?? screen.height;

  const left = Math.max(0, dualLeft + (width - POPUP_WIDTH) / 2);
  const top = Math.max(0, dualTop + (height - POPUP_HEIGHT) / 2);

  return window.open(
    url,
    name,
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );
};

export const runSocialOAuthPopup = ({ platform, authUrl, timeoutMs = 180000 } = {}) => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OAuth povezivanje je dostupno samo u browseru."));
  }

  if (!authUrl) {
    return Promise.reject(new Error("Nedostaje OAuth URL."));
  }

  const popup = openCenteredPopup(authUrl, `lmx-social-${platform || "oauth"}`);
  if (!popup) {
    return Promise.reject(new Error("Popup je blokiran. Dozvolite popup prozore i pokušajte ponovo."));
  }

  const allowedOrigins = getAllowedOrigins(authUrl);

  return new Promise((resolve, reject) => {
    let finished = false;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(closeWatcher);
      window.clearTimeout(timeout);
    };

    const finishWithError = (message) => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error(message));
    };

    const finishWithSuccess = (payload) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(payload);
    };

    const closeWatcher = window.setInterval(() => {
      if (popup.closed) {
        finishWithError("OAuth prozor je zatvoren prije završetka povezivanja.");
      }
    }, 350);

    const timeout = window.setTimeout(() => {
      try {
        popup.close();
      } catch {}
      finishWithError("Povezivanje je isteklo. Pokrenite povezivanje ponovo.");
    }, timeoutMs);

    const onMessage = (event) => {
      if (event?.origin && !allowedOrigins.has(event.origin) && event.origin !== "null") {
        return;
      }

      const payload = event?.data;
      if (!payload || typeof payload !== "object") return;
      if (payload.type !== SOCIAL_OAUTH_MESSAGE_TYPE) return;
      if (platform && payload.platform && payload.platform !== platform) return;

      try {
        popup.close();
      } catch {}

      if (payload.success) {
        finishWithSuccess(payload);
      } else {
        finishWithError(payload.message || "Povezivanje nije uspjelo.");
      }
    };

    window.addEventListener("message", onMessage);
    popup.focus();
  });
};
