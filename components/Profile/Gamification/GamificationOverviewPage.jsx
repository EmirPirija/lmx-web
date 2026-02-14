"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CustomLink from "@/components/Common/CustomLink";
import { gamificationApi } from "@/utils/api";
import { cn } from "@/lib/utils";
import { toast } from "@/utils/toastBs";
import {
  Activity,
  Clock3,
  Medal,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "@/components/Common/UnifiedIconPack";

const metricIconMap = {
  response_speed: Clock3,
  seller_success: Rocket,
  ads_volume: Activity,
  positive_reviews: Star,
};

const missionStatusTone = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  pending: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

const missionStatusLabel = {
  completed: "Završeno",
  in_progress: "U toku",
  pending: "Početak",
};

const rarityTone = {
  epic: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-700/60 dark:bg-violet-900/30 dark:text-violet-300",
  rare: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700/60 dark:bg-sky-900/30 dark:text-sky-300",
  common: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

const formatNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString("bs-BA") : "0";
};

const formatMetricValue = (metric) => {
  const value = metric?.value;
  const unit = metric?.unit ? String(metric.unit).trim() : "";

  if (value === null || value === undefined || value === "") {
    return "Nema podataka";
  }

  if (typeof value === "number") {
    if (!unit) return value.toLocaleString("bs-BA");
    return `${value.toLocaleString("bs-BA")} ${unit}`;
  }

  return unit ? `${value} ${unit}` : String(value);
};

export default function GamificationOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [avatarOptions, setAvatarOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchOverview = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const [overviewResult, avatarResult] = await Promise.allSettled([
        gamificationApi.getOverview(),
        gamificationApi.getAvatarOptions(),
      ]);

      let nextOverview = null;
      let nextAvatars = [];
      let nextError = "";

      if (overviewResult.status === "fulfilled") {
        const payload = overviewResult.value?.data;
        if (payload?.error === false) {
          nextOverview = payload?.data || null;
        } else {
          nextError = payload?.message || "Ne mogu učitati gamification podatke.";
        }
      } else {
        nextError = "Ne mogu učitati gamification podatke.";
      }

      if (avatarResult.status === "fulfilled") {
        const payload = avatarResult.value?.data;
        if (payload?.error === false && Array.isArray(payload?.data)) {
          nextAvatars = payload.data;
        }
      }

      if (nextOverview && Array.isArray(nextOverview?.avatar_options) && nextAvatars.length === 0) {
        nextAvatars = nextOverview.avatar_options;
      }

      setOverview(nextOverview);
      setAvatarOptions(nextAvatars);

      if (!nextOverview) {
        setError(nextError || "Nema dostupnih podataka za gamifikaciju.");
      }
    } catch (err) {
      console.error("Gamification overview fetch error", err);
      setOverview(null);
      setAvatarOptions([]);
      setError("Ne mogu učitati gamification podatke.");
      if (silent) {
        toast.error("Ne mogu osvježiti gamification podatke.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const points = overview?.points || {};
  const metrics = Array.isArray(overview?.metrics) ? overview.metrics : [];
  const missions = Array.isArray(overview?.missions) ? overview.missions : [];
  const stats = overview?.stats || {};
  const score = Number(overview?.score || 0);

  const responseMetric = metrics.find((metric) => metric?.key === "response_speed");
  const responseMinutes = Number(responseMetric?.value);
  const responseBadge = Number.isFinite(responseMinutes)
    ? responseMinutes <= 15
      ? "Brz prodavač"
      : responseMinutes <= 60
        ? "Pouzdan odgovor"
        : "Potrebna optimizacija"
    : "SLA bez podataka";

  const scoreTone = useMemo(() => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-300";
    if (score >= 60) return "text-sky-600 dark:text-sky-300";
    if (score >= 40) return "text-amber-600 dark:text-amber-300";
    return "text-rose-600 dark:text-rose-300";
  }, [score]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 text-sm text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300">
        <span className="inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Učitavam gamification sekciju...
        </span>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-white p-5 dark:border-slate-700/70 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-900/90">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <Sparkles className="h-4 w-4 text-violet-500" />
              LMX gamifikacija
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">Performanse prodavača na jednom mjestu</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Score je baziran na brzini odgovora, uspješnosti, broju oglasa i pozitivnim ocjenama.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOverview({ silent: true })}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Osvježi
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/70 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">Ukupni gamification score</div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {overview?.rank || "Novi profil"}
              </span>
            </div>
            <div className={cn("mt-2 text-4xl font-extrabold", scoreTone)}>{Number.isFinite(score) ? score : 0}/100</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-slate-900 transition-all dark:bg-white" style={{ width: `${Math.max(3, Math.min(100, score))}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                {responseBadge}
              </span>
              <CustomLink
                href="/my-ads?tab=analytics"
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Otvori analitiku
              </CustomLink>
              <CustomLink
                href="/profile/badges"
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Bedževi
              </CustomLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/70 dark:bg-slate-900/60">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Bodovi</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{formatNumber(points?.total_points)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/70 dark:bg-slate-900/60">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nivo</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{formatNumber(points?.level)}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{points?.level_name || "Beginner"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/70 dark:bg-slate-900/60">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Aktivni oglasi</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{formatNumber(stats?.active_ads)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/70 dark:bg-slate-900/60">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pozitivne ocjene</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{formatNumber(stats?.positive_ratings)}</p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/70 dark:bg-slate-900/70">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Target className="h-4 w-4 text-amber-500" />
            Ključne metrike
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.length ? (
              metrics.map((metric) => {
                const MetricIcon = metricIconMap[metric?.key] || Medal;
                const scoreValue = Number(metric?.score || 0);
                return (
                  <div key={metric?.key || metric?.label} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-700/70 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <MetricIcon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        {metric?.label || "Metrika"}
                      </p>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">{Math.max(0, Math.min(100, scoreValue))}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-slate-900 dark:bg-white" style={{ width: `${Math.max(3, Math.min(100, scoreValue))}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatMetricValue(metric)}</p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Nema metrika za prikaz.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/70 dark:bg-slate-900/70">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Trophy className="h-4 w-4 text-amber-500" />
            Aktivne misije
          </div>

          <div className="space-y-2.5">
            {missions.length ? (
              missions.map((mission) => (
                <div key={mission?.id || mission?.title} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-700/70 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{mission?.title || "Misija"}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        missionStatusTone[mission?.status] || missionStatusTone.pending
                      )}
                    >
                      {missionStatusLabel[mission?.status] || missionStatusLabel.pending}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{mission?.hint || "Nastavi aktivnosti da otključaš ovu misiju."}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Trenutno nema aktivnih misija.
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <CustomLink
              href="/leaderboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Ljestvica
            </CustomLink>
            <CustomLink
              href="/profile/avatar"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              LMX avatar
            </CustomLink>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/70 dark:bg-slate-900/70">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Avatar opcije
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {avatarOptions.length ? (
            avatarOptions.slice(0, 8).map((avatar) => {
              const rarity = String(avatar?.rarity || "common").toLowerCase();
              return (
                <div
                  key={avatar?.id || avatar?.name}
                  className={cn(
                    "rounded-2xl border p-3",
                    rarityTone[rarity] || rarityTone.common
                  )}
                >
                  <p className="text-sm font-semibold">{avatar?.name || avatar?.label || avatar?.id || "Avatar"}</p>
                  <p className="mt-1 text-xs opacity-80">{avatar?.style || "LMX stil"}</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide">{rarity}</p>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Avatar opcije trenutno nisu dostupne.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
