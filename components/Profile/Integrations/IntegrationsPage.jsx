"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { socialMediaApi } from "@/utils/api";
import { runSocialOAuthPopup } from "@/utils/socialOAuth";
import { toast } from "@/utils/toastBs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Link2,
  Link as Link2Off,
  Clock3,
  XCircle,
  RefreshCcw as Repeat2,
  CalendarClock,
  Instagram,
  Facebook,
  Music2,
} from "@/components/Common/UnifiedIconPack";

const PLATFORM_META = {
  instagram: { label: "Instagram", icon: Instagram, accent: "text-pink-600" },
  facebook: { label: "Facebook", icon: Facebook, accent: "text-blue-600" },
  tiktok: { label: "TikTok", icon: Music2, accent: "text-slate-800 dark:text-slate-200" },
};

const SCHEDULE_STATUS_OPTIONS = [
  { value: "", label: "Sve" },
  { value: "pending", label: "Na čekanju" },
  { value: "processing", label: "U obradi" },
  { value: "published", label: "Objavljeno" },
  { value: "failed", label: "Greška" },
  { value: "cancelled", label: "Otkazano" },
];

const STATUS_LABELS = {
  pending: "Na čekanju",
  processing: "U obradi",
  published: "Objavljeno",
  failed: "Greška",
  cancelled: "Otkazano",
};

const ACCOUNT_STATUS_LABELS = {
  connected: "Povezan",
  action_required: "Potrebna akcija",
  token_expired: "Token istekao",
  not_connected: "Nije povezan",
};

const getAccountStatusClassName = (status) => {
  switch (status) {
    case "connected":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
    case "token_expired":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    case "action_required":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300";
    default:
      return "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  }
};

const formatRelativeSync = (value) => {
  if (!value) return "Nema sinhronizacije";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nema sinhronizacije";
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / (1000 * 60));
  if (min < 1) return "Sinhronizirano upravo";
  if (min < 60) return `Sinhronizirano prije ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Sinhronizirano prije ${h} h`;
  const d = Math.floor(h / 24);
  return `Sinhronizirano prije ${d} dana`;
};

const formatDateTime = (value) => {
  if (!value) return "Nije zakazano";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nije zakazano";
  return date.toLocaleString("bs-BA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function IntegrationsPage() {
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [syncingPlatform, setSyncingPlatform] = useState("");
  const [mutatingPlatform, setMutatingPlatform] = useState("");

  const [scheduleFilter, setScheduleFilter] = useState("");
  const [scheduledLoading, setScheduledLoading] = useState(true);
  const [scheduledRows, setScheduledRows] = useState([]);

  const fetchAccounts = useCallback(async () => {
    try {
      setAccountsLoading(true);
      const res = await socialMediaApi.getConnectedAccounts();
      const rows = res?.data?.data?.accounts || [];
      setAccounts(Array.isArray(rows) ? rows : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Greška pri dohvatu integracija.");
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const fetchScheduled = useCallback(async (status = "") => {
    try {
      setScheduledLoading(true);
      const res = await socialMediaApi.getScheduledPosts({ status: status || undefined, page: 1 });
      const rows = res?.data?.data?.data || [];
      setScheduledRows(Array.isArray(rows) ? rows : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Greška pri dohvatu zakazanih objava.");
      setScheduledRows([]);
    } finally {
      setScheduledLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchScheduled("");
  }, [fetchAccounts, fetchScheduled]);

  const accountMap = useMemo(() => {
    const map = new Map();
    accounts.forEach((account) => map.set(account.platform, account));
    return map;
  }, [accounts]);

  const handleConnect = async (platform) => {
    try {
      setMutatingPlatform(platform);
      const res = await socialMediaApi.connectAccount({ platform, mode: "oauth" });
      const authUrl = res?.data?.data?.auth_url;
      if (!authUrl) {
        throw new Error(res?.data?.message || "OAuth link nije dostupan.");
      }

      await runSocialOAuthPopup({ platform, authUrl });
      toast.success("Nalog je uspješno povezan.");
      await fetchAccounts();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Povezivanje nije uspjelo.");
    } finally {
      setMutatingPlatform("");
    }
  };

  const handleDisconnect = async (platform) => {
    const ok = window.confirm("Jeste li sigurni da želite prekinuti povezivanje?");
    if (!ok) return;

    try {
      setMutatingPlatform(platform);
      const res = await socialMediaApi.disconnectAccount({ platform });
      toast.success(res?.data?.message || "Povezivanje je prekinuto.");
      await fetchAccounts();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Prekid povezivanja nije uspio.");
    } finally {
      setMutatingPlatform("");
    }
  };

  const handleSync = async (platform) => {
    try {
      setSyncingPlatform(platform);
      const res = await socialMediaApi.syncAccount({ platform });
      toast.success(res?.data?.message || "Sinhronizacija je pokrenuta.");
      await fetchAccounts();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Sinhronizacija nije uspjela.");
    } finally {
      setSyncingPlatform("");
    }
  };

  const handleCancelScheduled = async (id) => {
    try {
      const res = await socialMediaApi.cancelScheduledPost({ id });
      toast.success(res?.data?.message || "Objava je otkazana.");
      await fetchScheduled(scheduleFilter);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Otkazivanje nije uspjelo.");
    }
  };

  const handleRetryScheduled = async (id) => {
    try {
      const res = await socialMediaApi.retryScheduledPost({ id });
      toast.success(res?.data?.message || "Objava je vraćena u red za slanje.");
      await fetchScheduled(scheduleFilter);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ponovno slanje nije uspjelo.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Integracije i društvene mreže</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upravljaj povezivanjem naloga, ručnom sinhronizacijom i zakazanim objavama.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(PLATFORM_META).map(([platform, meta]) => {
            const account = accountMap.get(platform);
            const connected = Boolean(account?.connected);
            const accountStatus = account?.status || (connected ? "connected" : "not_connected");
            const Icon = meta.icon;
            const mutating = mutatingPlatform === platform;
            const syncing = syncingPlatform === platform;

            return (
              <div
                key={platform}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", meta.accent)} />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{meta.label}</span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold",
                      getAccountStatusClassName(accountStatus)
                    )}
                  >
                    {ACCOUNT_STATUS_LABELS[accountStatus] || "Nije povezan"}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {formatRelativeSync(account?.last_synced_at)}
                </p>
                {account?.account_name ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Nalog: <span className="font-medium text-slate-700 dark:text-slate-300">{account.account_name}</span>
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {!connected ? (
                    <Button
                      size="sm"
                      className="h-8 rounded-xl"
                      onClick={() => handleConnect(platform)}
                      disabled={accountsLoading || mutating}
                    >
                      {mutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                      Poveži
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl"
                        onClick={() => handleSync(platform)}
                        disabled={accountsLoading || syncing}
                      >
                        {syncing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Sinhronizuj sada
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        onClick={() => handleDisconnect(platform)}
                        disabled={accountsLoading || mutating}
                      >
                        {mutating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Link2Off className="mr-2 h-4 w-4" />
                        )}
                        Prekini povezivanje
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Zakazane objave</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Status objava: na čekanju, objavljeno ili greška.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SCHEDULE_STATUS_OPTIONS.map((option) => (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => {
                  setScheduleFilter(option.value);
                  fetchScheduled(option.value);
                }}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                  scheduleFilter === option.value
                    ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {scheduledLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
              Učitavanje zakazanih objava...
            </div>
          ) : scheduledRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
              Nema zakazanih objava za odabrani filter.
            </div>
          ) : (
            scheduledRows.map((row) => {
              const isPending = row?.status === "pending" || row?.status === "processing";
              const isFailed = row?.status === "failed" || row?.status === "cancelled";

              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {row?.item?.name || "Objava bez naziva oglasa"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {formatDateTime(row?.scheduled_at)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          Status: {STATUS_LABELS[row?.status] || row?.status}
                        </span>
                        {Array.isArray(row?.platforms) && row.platforms.length > 0 ? (
                          <span>Platforme: {row.platforms.join(", ")}</span>
                        ) : null}
                      </div>
                      {row?.error_message ? (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{row.error_message}</p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                          onClick={() => handleCancelScheduled(row.id)}
                        >
                          <XCircle className="mr-1.5 h-4 w-4" />
                          Otkaži
                        </Button>
                      ) : null}

                      {isFailed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl"
                          onClick={() => handleRetryScheduled(row.id)}
                        >
                          <Repeat2 className="mr-1.5 h-4 w-4" />
                          Ponovno pošalji
                        </Button>
                      ) : null}

                      {row?.status === "published" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Objavljeno
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
