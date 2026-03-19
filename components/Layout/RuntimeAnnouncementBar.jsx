"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { runtimeAnnouncements } from "@/redux/reducer/runtimeConfigSlice";
import { runtimeApi } from "@/utils/api";
import { getIsLoggedIn } from "@/redux/reducer/authSlice";

const DISMISS_STORAGE_KEY = "lmx_runtime_announcements_dismissed_v1";

const levelStyles = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  critical: "bg-rose-50 border-rose-200 text-rose-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
};

const normalizePlacement = (value) =>
  String(value || "").trim().toLowerCase() || "global_top";

const safeParseStorage = (raw) => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export default function RuntimeAnnouncementBar() {
  const announcements = useSelector(runtimeAnnouncements);
  const isLoggedIn = useSelector(getIsLoggedIn);
  const [dismissedMap, setDismissedMap] = useState({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissedMap(
      safeParseStorage(window.localStorage.getItem(DISMISS_STORAGE_KEY)),
    );
  }, []);

  const visibleAnnouncements = useMemo(() => {
    return (announcements || [])
      .filter((entry) => normalizePlacement(entry?.placement) === "global_top")
      .filter((entry) => !dismissedMap[String(entry?.key || entry?.id || "")])
      .slice(0, 3);
  }, [announcements, dismissedMap]);

  const handleDismiss = async (announcement) => {
    const key = String(announcement?.key || announcement?.id || "").trim();
    if (!key) return;

    const nextDismissed = {
      ...dismissedMap,
      [key]: Date.now(),
    };
    setDismissedMap(nextDismissed);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        DISMISS_STORAGE_KEY,
        JSON.stringify(nextDismissed),
      );
    }

    if (isLoggedIn && announcement?.id) {
      try {
        await runtimeApi.markAnnouncementRead(announcement.id);
      } catch {
        // no-op: local dismiss remains valid even if API ack fails
      }
    }
  };

  if (!visibleAnnouncements.length) {
    return null;
  }

  return (
    <div className="w-full px-3 lg:px-6 pt-3 space-y-2">
      {visibleAnnouncements.map((announcement) => {
        const style =
          levelStyles[String(announcement?.level || "").toLowerCase()] ||
          levelStyles.info;

        return (
          <div
            key={announcement?.key || announcement?.id}
            role="status"
            aria-live={
              String(announcement?.level || "").toLowerCase() === "critical"
                ? "assertive"
                : "polite"
            }
            className={`w-full border rounded-xl px-4 py-3 ${style}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {announcement?.title ? (
                  <p className="font-semibold leading-6">{announcement.title}</p>
                ) : null}
                <p className="text-sm leading-5 mt-1 whitespace-pre-wrap">
                  {announcement?.message}
                </p>
                {announcement?.action_url && announcement?.action_label ? (
                  <Link
                    href={announcement.action_url}
                    className="inline-flex mt-2 text-sm font-semibold underline"
                  >
                    {announcement.action_label}
                  </Link>
                ) : null}
              </div>
              {announcement?.is_dismissible ? (
                <button
                  type="button"
                  onClick={() => handleDismiss(announcement)}
                  className="inline-flex items-center justify-center rounded-md border border-current/25 px-2 py-1 text-xs font-semibold"
                  aria-label="Zatvori obavijest"
                >
                  X
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
