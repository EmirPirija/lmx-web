"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Eye,
  MessageCircle,
  Heart,
  Share2,
  PlayCircle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Target,
  Trophy,
  Video,
  Clock3,
  Search,
  RefreshCw,
  ShieldCheck,
  Medal,
  Rocket,
  Gauge,
} from "@/components/Common/UnifiedIconPack";
import { motion } from "framer-motion";

import { itemStatisticsApi, gamificationApi } from "@/utils/api";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: 7, label: "7 dana" },
  { value: 30, label: "30 dana" },
  { value: 90, label: "90 dana" },
];

const SELLER_OVERVIEW_ENABLED =
  String(process.env.NEXT_PUBLIC_SELLER_OVERVIEW_ENABLED || "").toLowerCase() === "true" ||
  String(process.env.NEXT_PUBLIC_SELLER_OVERVIEW_ENABLED || "") === "1";

const formatInt = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("bs-BA");
};

const formatPercent = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0%";
  return `${num.toFixed(1)}%`;
};

const formatCurrencyKm = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  return `${num.toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM`;
};

const StatCard = ({ icon: Icon, label, value, hint, tone = "slate" }) => {
  const tones = {
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100",
    emerald: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    rose: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
    violet: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
    amber: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300">
        <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div> : null}
    </div>
  );
};

const TrendPill = ({ value, label }) => {
  const trend = Number(value || 0);
  const positive = trend >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        positive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-300"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {positive ? "+" : ""}
      {trend}% {label}
    </div>
  );
};

const ActionBadge = ({ priority }) => {
  const map = {
    high: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  const label = priority === "high" ? "Visok prioritet" : priority === "medium" ? "Srednji" : "Nizak";

  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", map[priority] || map.low)}>{label}</span>;
};

export default function SellerAnalyticsOverview() {
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [slaData, setSlaData] = useState(null);
  const [boostRoiData, setBoostRoiData] = useState(null);
  const [gamificationData, setGamificationData] = useState(null);
  const [isUnavailable, setIsUnavailable] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    setIsUnavailable(false);

    try {
      const [overviewResult, slaResult, roiResult, gamificationResult] = await Promise.allSettled([
        itemStatisticsApi.getSellerOverview({ period, top: 8 }),
        itemStatisticsApi.getSellerSla(),
        itemStatisticsApi.getSellerBoostRoi({ period, top: 5 }),
        gamificationApi.getOverview(),
      ]);

      let overviewError = "";
      let overviewUnavailable = false;
      let overviewData = null;

      if (overviewResult.status === "fulfilled") {
        const payload = overviewResult.value?.data;
        if (payload?.error === false) {
          overviewData = payload?.data || {};
        } else {
          overviewError = payload?.message || "Ne mogu učitati statistiku.";
        }
      } else {
        const status = Number(overviewResult?.reason?.response?.status || 0);
        if (status === 404) {
          overviewUnavailable = true;
        } else {
          overviewError = "Ne mogu učitati statistiku.";
          console.error("Seller overview error", overviewResult.reason);
        }
      }

      const unwrapData = (result) => {
        if (result.status !== "fulfilled") return null;
        const payload = result.value?.data;
        return payload?.error === false ? payload?.data || null : null;
      };

      const nextSlaData = unwrapData(slaResult);
      const nextBoostRoiData = unwrapData(roiResult);
      const nextGamificationData = unwrapData(gamificationResult);

      setSlaData(nextSlaData);
      setBoostRoiData(nextBoostRoiData);
      setGamificationData(nextGamificationData);

      const hasAnyData = Boolean(overviewData || nextSlaData || nextBoostRoiData || nextGamificationData);
      if (overviewUnavailable && !hasAnyData) {
        setData(null);
        setError("");
        setIsUnavailable(true);
        return;
      }

      if (overviewError && !hasAnyData) {
        setData(null);
        setError(overviewError);
        return;
      }

      setData(overviewData || {});
    } catch (e) {
      console.error("Seller overview error", e);
      setData(null);
      setError("Ne mogu učitati statistiku.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!SELLER_OVERVIEW_ENABLED) return;
    fetchOverview();
  }, [fetchOverview]);

  const summary = data?.summary || {};
  const trends = data?.trends || {};
  const quickActions = data?.quick_actions || [];
  const topAds = data?.top_ads || [];
  const reels = data?.reels || {};
  const sources = data?.sources || { internal: [], external: [], total: 0 };
  const devices = data?.devices || {};

  const topSource = useMemo(() => {
    const all = [...(sources.internal || []), ...(sources.external || [])];
    return all.sort((a, b) => (b.value || 0) - (a.value || 0))[0] || null;
  }, [sources]);

  const deviceMix = useMemo(() => {
    return [
      { key: "mobile", label: "Mobitel", value: devices?.mobile?.value || 0, percent: devices?.mobile?.percent || 0 },
      { key: "desktop", label: "Desktop", value: devices?.desktop?.value || 0, percent: devices?.desktop?.percent || 0 },
      { key: "tablet", label: "Tablet", value: devices?.tablet?.value || 0, percent: devices?.tablet?.percent || 0 },
    ];
  }, [devices]);

  const slaBadge = slaData?.badge || {};
  const slaTier = String(slaBadge?.tier || "no_data");
  const slaTone =
    slaTier === "fast"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300"
      : slaTier === "reliable"
        ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700/60 dark:bg-sky-900/30 dark:text-sky-300"
        : slaTier === "slow"
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

  const boostSummary = boostRoiData?.summary || {};
  const boostTrend = boostRoiData?.trend || [];

  const gamification = useMemo(() => {
    if (gamificationData) {
      const score = Number(gamificationData?.score || 0);
      const rank = gamificationData?.rank || "Novi profil";
      const metrics = Array.isArray(gamificationData?.metrics)
        ? gamificationData.metrics.slice(0, 4).map((metric) => {
            const key = metric?.key || metric?.label || "metric";
            const label = metric?.label || "Metrika";
            const metricScore = Number(metric?.score || 0);
            const icon =
              key.includes("response")
                ? Clock3
                : key.includes("ads")
                  ? Activity
                  : key.includes("success")
                    ? Rocket
                    : Medal;
            return { key, label, score: metricScore, icon };
          })
        : [];

      return {
        total: score,
        rank,
        metrics,
      };
    }

    const avgResponse = Number(slaData?.avg_response_minutes);
    const responseScore = Number.isFinite(avgResponse)
      ? avgResponse <= 15
        ? 100
        : avgResponse <= 60
          ? 75
          : avgResponse <= 180
            ? 45
            : 20
      : 0;

    const contacts = Number(summary.contacts || 0) + Number(summary.messages || 0);
    const views = Number(summary.views || 0);
    const conversionRate = views > 0 ? (contacts / views) * 100 : 0;
    const conversionScore = Math.min(100, Math.round(conversionRate * 3));

    const activityScore = Math.min(100, Math.round((Number(summary.views || 0) / 1500) * 100));
    const trustScore = Math.min(
      100,
      Math.round(((Number(summary.favorites || 0) + Number(summary.shares || 0)) / 250) * 100)
    );

    const total = Math.round((responseScore + conversionScore + activityScore + trustScore) / 4);
    const rank = total >= 80 ? "Elite prodavač" : total >= 60 ? "Pro rast" : total >= 35 ? "Aktivan profil" : "U razvoju";

    return {
      total,
      rank,
      metrics: [
        { key: "response", label: "Brzina odgovora", score: responseScore, icon: Clock3 },
        { key: "conversion", label: "Efikasnost", score: conversionScore, icon: Rocket },
        { key: "activity", label: "Aktivnost", score: activityScore, icon: Activity },
        { key: "trust", label: "Povjerenje", score: trustScore, icon: Medal },
      ],
    };
  }, [gamificationData, slaData?.avg_response_minutes, summary.contacts, summary.favorites, summary.messages, summary.shares, summary.views]);

  if (!SELLER_OVERVIEW_ENABLED) {
    return null;
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-900/60 p-6">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <RefreshCw className="h-4 w-4 animate-spin" /> Učitavanje statistike prodavača...
        </div>
      </div>
    );
  }

  if (isUnavailable) {
    return null;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-900/20 p-6">
        <div className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</div>
        <button
          type="button"
          onClick={fetchOverview}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-600 dark:text-rose-300"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Pokušaj ponovo
        </button>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-200/80 dark:border-slate-700/70 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-900/90 p-4 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Activity className="h-4 w-4" />
            Centar analitike prodavaca
          </div>
          <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">Brza kontrola performansi oglasa</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sve metrike i preporuke na jednom mjestu, ukljucujuci reel statistiku.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                period === opt.value
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TrendPill label="pregledi" value={trends.views_vs_prev_period} />
        <TrendPill label="kontakti" value={trends.contacts_vs_prev_period} />
        <TrendPill label="reel pregledi" value={trends.reel_plays_vs_prev_period} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/70 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              SLA odgovor
            </div>
            <span className={cn("rounded-full border px-2 py-1 text-[11px] font-semibold", slaTone)}>
              {slaBadge?.label || "Nema podataka"}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {slaData?.formatted || "U prosjeku odgovarate: nema dovoljno podataka"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {slaBadge?.tooltip || "SLA se računa iz poruka i lead upita."}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Gauge className="h-4 w-4 text-sky-500" />
            Boost ROI
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
              <p className="text-slate-500 dark:text-slate-400">Dodatni kontakti</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                +{formatInt(boostSummary.additional_contacts)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
              <p className="text-slate-500 dark:text-slate-400">Cijena / kontakt</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {boostSummary.cost_per_contact !== null && boostSummary.cost_per_contact !== undefined
                  ? formatCurrencyKm(boostSummary.cost_per_contact)
                  : "N/A"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Ukupno kontakata: {formatInt(boostSummary.total_contacts || 0)} • Boost kontakti:{" "}
            {formatInt(boostSummary.boost_contacts || 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/70 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Gamification score
            </div>
            <span className="rounded-full bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              {gamification.rank}
            </span>
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {gamification.total}/100
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
            {gamification.metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.key}
                  className="flex items-center justify-between rounded-lg border border-slate-200/80 px-2 py-1 dark:border-slate-700"
                >
                  <span className="inline-flex items-center gap-1">
                    <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    {metric.label}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{metric.score}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard icon={Eye} label="Pregledi" value={formatInt(summary.views)} tone="blue" />
        <StatCard icon={MessageCircle} label="Kontakti + poruke" value={formatInt((summary.contacts || 0) + (summary.messages || 0))} tone="emerald" />
        <StatCard icon={Heart} label="Favoriti" value={formatInt(summary.favorites)} tone="rose" />
        <StatCard icon={Share2} label="Dijeljenja" value={formatInt(summary.shares)} tone="violet" />
        <StatCard icon={PlayCircle} label="Reel play" value={formatInt(summary.video_plays)} hint={formatPercent(summary.reel_completion_rate)} tone="amber" />
        <StatCard icon={Target} label="CTR pretrage" value={formatPercent(summary.search_ctr)} hint={`${formatInt(summary.ads_with_video)} s videom`} tone="slate" />
      </div>

      {boostTrend.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/70 dark:bg-slate-900/60">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Kontakti kroz vrijeme (Boost vs organik)</div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Zadnjih {boostTrend.length} dana</span>
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {boostTrend.slice(-10).map((row) => {
              const boost = Number(row?.boost_contacts || 0);
              const organic = Number(row?.organic_contacts || 0);
              const max = Math.max(boost, organic, 1);
              return (
                <div key={row?.date} className="flex flex-col items-center gap-1">
                  <div className="flex h-20 w-full items-end justify-center gap-1 rounded-md bg-slate-100 px-1 dark:bg-slate-800">
                    <div
                      className="w-2 rounded-sm bg-sky-500"
                      style={{ height: `${Math.max(8, Math.round((boost / max) * 100))}%` }}
                      title={`Boost: ${boost}`}
                    />
                    <div
                      className="w-2 rounded-sm bg-slate-500"
                      style={{ height: `${Math.max(8, Math.round((organic / max) * 100))}%` }}
                      title={`Organik: ${organic}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {(row?.date || "").slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Boost
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              Organik
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-amber-500" /> Brze akcije za rast
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Najbolje preporuke</span>
          </div>

          <div className="space-y-3">
            {quickActions.length ? (
              quickActions.map((action) => (
                <div key={action.id} className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-slate-50/80 dark:bg-slate-800/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{action.title}</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{action.description}</div>
                    </div>
                    <ActionBadge priority={action.priority} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-300">Nema dodatnih preporuka za ovaj period.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Video className="h-4 w-4 text-indigo-500" /> Reel puls
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3">
              <div className="text-slate-500 dark:text-slate-300">Ukupno reel oglasa</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{formatInt(reels.total_reels)}</div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3">
              <div className="text-slate-500 dark:text-slate-300">Completion</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{formatPercent(reels.completion_rate)}</div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {(reels.top_reels || []).slice(0, 3).map((row) => (
              <div key={row.item_id} className="flex items-center justify-between rounded-lg border border-slate-200/70 dark:border-slate-700/70 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{row.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{formatInt(row.plays)} pregleda • {formatPercent(row.completion_rate)}</div>
                </div>
                {row.slug ? (
                  <Link
                    href={`/my-ads/${row.slug}/statistics`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Detalji
                  </Link>
                ) : null}
              </div>
            ))}
            {!reels?.top_reels?.length && (
              <div className="text-xs text-slate-500 dark:text-slate-400">Jos nema reel podataka za prikaz.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Trophy className="h-4 w-4 text-amber-500" /> Najbolji oglasi za ovaj period
          </div>

          <div className="space-y-2">
            {topAds.slice(0, 6).map((row) => (
              <div key={row.item_id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{row.name}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <span>{formatInt(row.stats?.views)} pregleda</span>
                    <span>{formatInt(row.stats?.contacts)} kontakta</span>
                    <span>{formatPercent(row.stats?.contact_rate)} kontakt stopa</span>
                    <span>
                      {row.has_video
                        ? `Video: ${
                            row.video_source === "upload"
                              ? "direktni upload"
                              : row.video_source === "youtube"
                              ? "YouTube"
                              : "vanjski link"
                          }`
                        : "Bez videa"}
                    </span>
                  </div>
                </div>
                {row.slug ? (
                  <Link href={`/my-ads/${row.slug}/statistics`} className="text-xs font-semibold text-primary hover:underline">
                    Otvori
                  </Link>
                ) : null}
              </div>
            ))}

            {!topAds.length && (
              <div className="text-xs text-slate-500 dark:text-slate-400">Nema oglasa sa statistikom u izabranom periodu.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Search className="h-4 w-4 text-sky-500" /> Izvori i uredjaji
          </div>

          <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3">
            <div className="text-xs text-slate-500 dark:text-slate-300">Najjaci izvor</div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {topSource ? `${topSource.name} (${formatPercent(topSource.percent)})` : "Nema podataka"}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {deviceMix.map((device) => (
              <div key={device.key} className="rounded-lg border border-slate-200/70 dark:border-slate-700/70 px-3 py-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>{device.label}</span>
                  <span>{formatInt(device.value)} • {formatPercent(device.percent)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-slate-900 dark:bg-white" style={{ width: `${Math.min(100, Number(device.percent || 0))}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock3 className="h-3.5 w-3.5" />
            Zadnje osvjezenje: upravo sada
          </div>
        </div>
      </div>
    </motion.section>
  );
}
