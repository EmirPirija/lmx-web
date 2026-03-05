"use client";

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { getIsFrontendObservabilityEnabled } from "@/redux/reducer/settingSlice";

const INTERNAL_PROXY_BASE_PATH = String(
  process.env.NEXT_PUBLIC_INTERNAL_PROXY_BASE_PATH || "/internal-api",
)
  .trim()
  .replace(/\/+$/, "") || "/internal-api";

const TELEMETRY_ENDPOINT = `${INTERNAL_PROXY_BASE_PATH}/telemetry`;
const MAX_BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 8_000;

const EVENT_BINDINGS = [
  { source: "lmx:request-telemetry", category: "request" },
  { source: "lmx:flow-telemetry", category: "flow" },
  { source: "lmx:internal-proxy-alert", category: "internal_proxy" },
  { source: "lmx:auth-safe-logout", category: "auth" },
];

const toRecord = (category, detail = {}) => ({
  category,
  at: new Date().toISOString(),
  detail,
});

const flushViaBeacon = (records) => {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return false;
  try {
    const payload = JSON.stringify({ events: records });
    return navigator.sendBeacon(
      TELEMETRY_ENDPOINT,
      new Blob([payload], { type: "application/json" }),
    );
  } catch {
    return false;
  }
};

const flushViaFetch = async (records) => {
  await fetch(TELEMETRY_ENDPOINT, {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ events: records }),
  });
};

const FrontendObservabilityBridge = () => {
  const isFrontendObservabilityEnabled = useSelector(
    getIsFrontendObservabilityEnabled,
  );
  const queueRef = useRef([]);
  const flushingRef = useRef(false);

  useEffect(() => {
    if (!isFrontendObservabilityEnabled) return undefined;
    if (typeof window === "undefined") return undefined;

    const flush = async ({ useBeacon = false } = {}) => {
      if (flushingRef.current) return;
      if (!queueRef.current.length) return;

      const records = queueRef.current.splice(0, MAX_BATCH_SIZE);
      flushingRef.current = true;
      try {
        if (useBeacon && flushViaBeacon(records)) {
          return;
        }
        await flushViaFetch(records);
      } catch {
        queueRef.current = [...records, ...queueRef.current].slice(
          0,
          MAX_BATCH_SIZE * 3,
        );
      } finally {
        flushingRef.current = false;
      }
    };

    const enqueue = (category, detail) => {
      queueRef.current.push(toRecord(category, detail));
      if (queueRef.current.length >= MAX_BATCH_SIZE) {
        void flush();
      }
    };

    const removers = EVENT_BINDINGS.map(({ source, category }) => {
      const handler = (event) => enqueue(category, event?.detail || {});
      window.addEventListener(source, handler);
      return () => window.removeEventListener(source, handler);
    });

    const intervalId = window.setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);

    const onPageHide = () => {
      void flush({ useBeacon: true });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flush({ useBeacon: true });
      }
    };

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      removers.forEach((remove) => remove());
      window.clearInterval(intervalId);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void flush({ useBeacon: true });
    };
  }, [isFrontendObservabilityEnabled]);

  return null;
};

export default FrontendObservabilityBridge;
