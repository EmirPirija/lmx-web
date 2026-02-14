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
} from "@/components/Common/UnifiedIconPack";
import { motion } from "framer-motion";

import { itemStatisticsApi } from "@/utils/api";
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
  const [isUnavailable, setIsUnavailable] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    setIsUnavailable(false);

    try {
      const res = await itemStatisticsApi.getSellerOverview({ period, top: 8 });
      const payload = res?.data;
      if (payload?.error === false && payload?.data) {
        setData(payload.data);
      } else {
        setData(null);
        setError(payload?.message || "Ne mogu učitati statistiku.");
      }
    } catch (e) {
      const status = Number(e?.response?.status || 0);
      // Endpoint nije dostupan na svim backend instancama.
      if (status === 404) {
        setData(null);
        setError("");
        setIsUnavailable(true);
        return;
      }

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

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard icon={Eye} label="Pregledi" value={formatInt(summary.views)} tone="blue" />
        <StatCard icon={MessageCircle} label="Kontakti + poruke" value={formatInt((summary.contacts || 0) + (summary.messages || 0))} tone="emerald" />
        <StatCard icon={Heart} label="Favoriti" value={formatInt(summary.favorites)} tone="rose" />
        <StatCard icon={Share2} label="Dijeljenja" value={formatInt(summary.shares)} tone="violet" />
        <StatCard icon={PlayCircle} label="Reel play" value={formatInt(summary.video_plays)} hint={formatPercent(summary.reel_completion_rate)} tone="amber" />
        <StatCard icon={Target} label="CTR pretrage" value={formatPercent(summary.search_ctr)} hint={`${formatInt(summary.ads_with_video)} s videom`} tone="slate" />
      </div>

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
