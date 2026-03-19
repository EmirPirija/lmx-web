"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { X } from "@/components/Common/UnifiedIconPack";
import { runtimePromoBanners } from "@/redux/reducer/runtimeConfigSlice";
import { cn } from "@/lib/utils";

const DISMISS_STORAGE_KEY = "lmx_runtime_promo_banners_dismissed_v1";

const levelStyles = {
  info: "border-sky-200/80 bg-gradient-to-r from-sky-50 to-cyan-50 text-slate-900 dark:border-sky-700/50 dark:from-slate-900 dark:to-slate-800 dark:text-slate-100",
  success:
    "border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50 text-slate-900 dark:border-emerald-700/50 dark:from-slate-900 dark:to-slate-800 dark:text-slate-100",
  warning:
    "border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 text-slate-900 dark:border-amber-700/50 dark:from-slate-900 dark:to-slate-800 dark:text-slate-100",
  critical:
    "border-rose-200/80 bg-gradient-to-r from-rose-50 to-fuchsia-50 text-slate-900 dark:border-rose-700/50 dark:from-slate-900 dark:to-slate-800 dark:text-slate-100",
};

const safeParseStorage = (raw) => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const normalizeSlot = (value) => String(value || "").trim().toLowerCase();

const resolveBannerSlot = (banner = {}) =>
  normalizeSlot(banner?.slot || banner?.placement || "global_top");

export default function RuntimePromoBannerBar({
  slot = "global_top",
  maxItems = 2,
  className = "",
}) {
  const banners = useSelector(runtimePromoBanners);
  const [dismissedMap, setDismissedMap] = useState({});
  const normalizedSlot = normalizeSlot(slot || "global_top");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissedMap(
      safeParseStorage(window.localStorage.getItem(DISMISS_STORAGE_KEY)),
    );
  }, []);

  const visibleBanners = useMemo(() => {
    const source = Array.isArray(banners) ? banners : [];

    return source
      .filter((entry) => resolveBannerSlot(entry) === normalizedSlot)
      .filter((entry) => {
        if (!entry?.is_dismissible) return true;
        const key = String(entry?.key || "").trim();
        if (!key) return true;
        return !dismissedMap[key];
      })
      .slice(0, Math.max(1, Number(maxItems) || 1));
  }, [banners, dismissedMap, maxItems, normalizedSlot]);

  const handleDismiss = (banner) => {
    const key = String(banner?.key || "").trim();
    if (!key) return;

    const nextMap = {
      ...dismissedMap,
      [key]: Date.now(),
    };
    setDismissedMap(nextMap);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(nextMap));
    }
  };

  if (!visibleBanners.length) return null;

  return (
    <div className={cn("container mt-3 space-y-2.5", className)}>
      {visibleBanners.map((banner) => {
        const key = String(banner?.key || "banner");
        const level = String(banner?.level || "info").toLowerCase();
        const style = levelStyles[level] || levelStyles.info;
        const ctaLabel = String(banner?.cta_label || "").trim();
        const ctaUrl = String(banner?.cta_url || "").trim();
        const metadata =
          banner?.metadata && typeof banner.metadata === "object"
            ? banner.metadata
            : {};
        const badgeLabel = String(metadata?.badge || "").trim();
        const iconLabel = String(metadata?.icon || "").trim();

        return (
          <article
            key={key}
            role="status"
            aria-live={level === "critical" ? "assertive" : "polite"}
            className={cn(
              "relative overflow-hidden rounded-2xl border px-4 py-3.5 sm:px-5",
              "shadow-[0_16px_34px_-28px_rgba(2,8,23,0.55)]",
              "transition-colors duration-200",
              style,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {iconLabel ? (
                    <span
                      className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-current/15 bg-white/70 px-2 text-sm dark:bg-slate-900/70"
                      aria-hidden="true"
                    >
                      {iconLabel}
                    </span>
                  ) : null}
                  {badgeLabel ? (
                    <span className="inline-flex items-center rounded-full border border-current/20 bg-white/75 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] dark:bg-slate-900/65">
                      {badgeLabel}
                    </span>
                  ) : null}
                  {banner?.title ? (
                    <h3 className="text-sm font-semibold sm:text-base">{banner.title}</h3>
                  ) : null}
                </div>

                {banner?.message ? (
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                    {banner.message}
                  </p>
                ) : null}

                {ctaLabel && ctaUrl ? (
                  <Link
                    href={ctaUrl}
                    className="mt-2 inline-flex items-center rounded-xl border border-current/25 bg-white/70 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900"
                  >
                    {ctaLabel}
                  </Link>
                ) : null}
              </div>

              {banner?.is_dismissible ? (
                <button
                  type="button"
                  onClick={() => handleDismiss(banner)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/20 bg-white/75 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                  aria-label="Zatvori promo poruku"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
