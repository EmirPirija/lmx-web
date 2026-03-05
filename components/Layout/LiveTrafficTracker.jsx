"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import Api from "@/api/AxiosInterceptors";
import { getIsLiveTrackingEnabled } from "@/redux/reducer/settingSlice";

const VISITOR_KEY = "lmx_live_visitor_id";
const SESSION_KEY = "lmx_live_session_id";
const LAST_SEEN_KEY = "lmx_live_session_last_seen";

const SESSION_TTL_MS = 30 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 25 * 1000;
const INTERNAL_PROXY_BASE_PATH = String(
  process.env.NEXT_PUBLIC_INTERNAL_PROXY_BASE_PATH || "/internal-api",
)
  .trim()
  .replace(/\/+$/, "");

const safeGet = (key) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (_) {
    return null;
  }
};

const safeSet = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch (_) {
    // ignore storage errors
  }
};

const createId = (prefix) => {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}_${Date.now().toString(36)}`;
};

const getVisitorId = () => {
  let visitorId = safeGet(VISITOR_KEY);
  if (!visitorId) {
    visitorId = createId("vis");
    safeSet(VISITOR_KEY, visitorId);
  }
  return visitorId;
};

const getSessionId = () => {
  const now = Date.now();
  const lastSeen = Number(safeGet(LAST_SEEN_KEY) || 0);
  let sessionId = safeGet(SESSION_KEY);

  if (!sessionId || !lastSeen || now - lastSeen > SESSION_TTL_MS) {
    sessionId = createId("sess");
    safeSet(SESSION_KEY, sessionId);
  }

  safeSet(LAST_SEEN_KEY, String(now));
  return sessionId;
};

const getDeviceType = () => {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
};

const getLiveTrackingEndpoint = () => {
  if (typeof window === "undefined") {
    return `${INTERNAL_PROXY_BASE_PATH || "/internal-api"}/track/live-session`;
  }

  return `${window.location.origin}${INTERNAL_PROXY_BASE_PATH || "/internal-api"}/track/live-session`;
};

export default function LiveTrafficTracker() {
  const isLiveTrackingEnabled = useSelector(getIsLiveTrackingEnabled);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastViewPayloadRef = useRef("");

  const pagePath = useMemo(() => {
    const path = pathname || "/";
    const query = searchParams?.toString();
    return query ? `${path}?${query}` : path;
  }, [pathname, searchParams]);

  const sendEvent = useCallback(
    async (eventType = "heartbeat") => {
      if (typeof window === "undefined") return;
      if (!isLiveTrackingEnabled) return;

      const payload = {
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        event_type: eventType,
        page_path: pagePath,
        page_url: window.location.href,
        page_title: document.title || "",
        referrer_url: document.referrer || "",
        device_type: getDeviceType(),
      };

      if (eventType === "view") {
        const viewSignature = `${payload.session_id}:${payload.page_path}`;
        if (lastViewPayloadRef.current === viewSignature) return;
        lastViewPayloadRef.current = viewSignature;
      }

      try {
        await Api.post("track/live-session", payload, { timeout: 5000 });
      } catch (_) {
        // silent: tracking must never block UX
      }
    },
    [pagePath, isLiveTrackingEnabled],
  );

  useEffect(() => {
    if (!isLiveTrackingEnabled) return;
    sendEvent("view");
  }, [sendEvent, isLiveTrackingEnabled]);

  useEffect(() => {
    if (!isLiveTrackingEnabled) return undefined;
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    let intervalId = null;

    const startHeartbeat = () => {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      if (document.visibilityState === "hidden") return;

      sendEvent("heartbeat");
      intervalId = window.setInterval(() => {
        sendEvent("heartbeat");
      }, HEARTBEAT_INTERVAL_MS);
    };

    const onPageHide = () => {
      const endpoint = getLiveTrackingEndpoint();
      const data = JSON.stringify({
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        event_type: "heartbeat",
        page_path: pagePath,
        page_url: window.location.href,
        page_title: document.title || "",
        referrer_url: document.referrer || "",
        device_type: getDeviceType(),
      });

      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([data], { type: "application/json" });
          navigator.sendBeacon(endpoint, blob);
        }
      } catch (_) {
        // no-op
      }
    };

    startHeartbeat();
    document.addEventListener("visibilitychange", startHeartbeat);
    window.addEventListener("focus", startHeartbeat);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", startHeartbeat);
      window.removeEventListener("focus", startHeartbeat);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [pagePath, sendEvent, isLiveTrackingEnabled]);

  return null;
}
