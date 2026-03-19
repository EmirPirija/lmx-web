"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { categoryApi, instagramApi, socialMediaApi } from "@/utils/api";
import { runSocialOAuthPopup } from "@/utils/socialOAuth";
import {
  SOCIAL_POSTING_TEMP_UNAVAILABLE,
  SOCIAL_POSTING_UNAVAILABLE_MESSAGE,
} from "@/utils/socialAvailability";
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

const parseImportUrls = (rawValue) => {
  if (!rawValue || typeof rawValue !== "string") return [];
  const tokens = rawValue
    .split(/\r?\n|,|;|\s+/g)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const seen = new Set();
  const valid = [];
  tokens.forEach((token) => {
    try {
      const url = new URL(token);
      if (!["http:", "https:"].includes(url.protocol)) return;
      const normalized = url.toString();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      valid.push(normalized);
    } catch {
      // ignore invalid urls
    }
  });
  return valid;
};

const normalizePriceForPayload = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = String(value).replace(/[^\d.,-]/g, "").trim();
  if (!normalized) return null;
  const candidate = Number(normalized.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(candidate)) return null;
  return candidate;
};

const formatPricePreview = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return `${numeric.toLocaleString("bs-BA")} KM`;
};

const qualityBadgeClassName = (level) => {
  if (level === "high") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  }
  if (level === "medium") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  }
  return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300";
};

export default function IntegrationsPage() {
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [syncingPlatform, setSyncingPlatform] = useState("");
  const [mutatingPlatform, setMutatingPlatform] = useState("");

  const [scheduleFilter, setScheduleFilter] = useState("");
  const [scheduledLoading, setScheduledLoading] = useState(true);
  const [scheduledRows, setScheduledRows] = useState([]);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [importUrlsText, setImportUrlsText] = useState("");
  const [wizardCategoryId, setWizardCategoryId] = useState("");
  const [wizardMaxEntries, setWizardMaxEntries] = useState(15);
  const [apiProfilesJson, setApiProfilesJson] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPayload, setPreviewPayload] = useState(null);
  const [previewEntries, setPreviewEntries] = useState([]);
  const [commitImportLoading, setCommitImportLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [importHistory, setImportHistory] = useState([]);

  const fetchAccounts = useCallback(async () => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      setAccounts([]);
      setAccountsLoading(false);
      return;
    }

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
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      setScheduledRows([]);
      setScheduledLoading(false);
      return;
    }

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

  const fetchCategoryOptions = useCallback(async () => {
    try {
      setCategoryLoading(true);
      const res = await categoryApi.getCategory({
        page: 1,
        per_page: 150,
        tree_depth: 0,
        include_counts: false,
      });

      const rows = res?.data?.data?.data;
      const mapped = Array.isArray(rows)
        ? rows
            .map((row) => ({
              id: Number(row?.id),
              name: String(row?.translated_name || row?.name || "").trim(),
            }))
            .filter((row) => Number.isFinite(row.id) && row.id > 0 && row.name)
        : [];

      setCategoryOptions(mapped);
    } catch {
      setCategoryOptions([]);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  const fetchImportHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await instagramApi.getImportHistory({ page: 1 });
      const rows = res?.data?.data?.data;
      setImportHistory(Array.isArray(rows) ? rows : []);
    } catch {
      setImportHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchScheduled("");
    fetchCategoryOptions();
    fetchImportHistory();
  }, [fetchAccounts, fetchScheduled, fetchCategoryOptions, fetchImportHistory]);

  const accountMap = useMemo(() => {
    const map = new Map();
    accounts.forEach((account) => map.set(account.platform, account));
    return map;
  }, [accounts]);

  const handleConnect = async (platform) => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      toast.info(SOCIAL_POSTING_UNAVAILABLE_MESSAGE);
      return;
    }

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
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      toast.info(SOCIAL_POSTING_UNAVAILABLE_MESSAGE);
      return;
    }

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
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      toast.info(SOCIAL_POSTING_UNAVAILABLE_MESSAGE);
      return;
    }

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
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      toast.info(SOCIAL_POSTING_UNAVAILABLE_MESSAGE);
      return;
    }

    try {
      const res = await socialMediaApi.cancelScheduledPost({ id });
      toast.success(res?.data?.message || "Objava je otkazana.");
      await fetchScheduled(scheduleFilter);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Otkazivanje nije uspjelo.");
    }
  };

  const handleRetryScheduled = async (id) => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      toast.info(SOCIAL_POSTING_UNAVAILABLE_MESSAGE);
      return;
    }

    try {
      const res = await socialMediaApi.retryScheduledPost({ id });
      toast.success(res?.data?.message || "Objava je vraćena u red za slanje.");
      await fetchScheduled(scheduleFilter);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ponovno slanje nije uspjelo.");
    }
  };

  const selectedPreviewCount = useMemo(
    () => previewEntries.filter((entry) => Boolean(entry?.selected)).length,
    [previewEntries],
  );

  const readyPreviewCount = useMemo(
    () => previewEntries.filter((entry) => Boolean(entry?.is_ready)).length,
    [previewEntries],
  );

  const updatePreviewEntry = useCallback((previewId, patch) => {
    setPreviewEntries((prev) =>
      prev.map((entry) =>
        entry?.preview_id === previewId ? { ...entry, ...patch } : entry,
      ),
    );
  }, []);

  const applyGlobalCategoryToSelected = useCallback(() => {
    const parsedCategory = Number(wizardCategoryId);
    if (!Number.isFinite(parsedCategory) || parsedCategory <= 0) {
      toast.info("Odaberi globalnu kategoriju prije primjene.");
      return;
    }

    setPreviewEntries((prev) =>
      prev.map((entry) =>
        entry?.selected ? { ...entry, category_id: parsedCategory } : entry,
      ),
    );
    toast.success("Globalna kategorija primijenjena na odabrane stavke.");
  }, [wizardCategoryId]);

  const handleGeneratePreview = async () => {
    const urls = parseImportUrls(importUrlsText);
    if (urls.length === 0) {
      toast.error("Unesi barem jedan validan URL proizvoda.");
      return;
    }

    let apiProfilesPayload;
    if (apiProfilesJson.trim()) {
      try {
        const parsed = JSON.parse(apiProfilesJson);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("invalid");
        }
        apiProfilesPayload = parsed;
      } catch {
        toast.error("API profili JSON nije validan.");
        return;
      }
    }

    try {
      setPreviewLoading(true);
      const parsedCategory = Number(wizardCategoryId);
      const response = await instagramApi.previewImport({
        source_urls: urls,
        category_id:
          Number.isFinite(parsedCategory) && parsedCategory > 0
            ? parsedCategory
            : undefined,
        max_entries_per_source: wizardMaxEntries,
        api_profiles: apiProfilesPayload,
      });

      const payload = response?.data?.data?.preview || {};
      const rows = Array.isArray(payload?.entries) ? payload.entries : [];

      const normalizedRows = rows.map((entry, idx) => {
        const suggestedCategoryId = Number(
          entry?.selected_category_id || entry?.category_suggestion?.id || 0,
        );
        const normalizedImages = Array.isArray(entry?.images)
          ? entry.images.filter((img) => typeof img === "string" && img.trim())
          : [];
        const fallbackImage =
          (typeof entry?.image === "string" && entry.image.trim()) || normalizedImages[0] || "";
        return {
          ...entry,
          image: fallbackImage || undefined,
          images: normalizedImages,
          preview_id: entry?.preview_id || `preview-${idx + 1}`,
          selected: Boolean(entry?.is_ready ?? true),
          category_id:
            Number.isFinite(suggestedCategoryId) && suggestedCategoryId > 0
              ? suggestedCategoryId
              : Number.isFinite(parsedCategory) && parsedCategory > 0
                ? parsedCategory
                : "",
        };
      });

      setPreviewPayload({
        ...payload,
        queued_urls: response?.data?.data?.queued_urls || urls,
      });
      setPreviewEntries(normalizedRows);

      if (normalizedRows.length === 0) {
        toast.info("Preview je završen, ali nisu pronađeni uvozivi proizvodi.");
        return;
      }

      toast.success(`Preview spreman: ${normalizedRows.length} pronađenih proizvoda.`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Generisanje preview-a nije uspjelo.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCommitPreviewImport = async () => {
    const selectedEntries = previewEntries.filter((entry) => Boolean(entry?.selected));
    if (selectedEntries.length === 0) {
      toast.info("Odaberi barem jedan proizvod za import.");
      return;
    }

    const payloadEntries = selectedEntries.map((entry) => ({
      selected: true,
      source_url: entry?.source_url || undefined,
      title: entry?.title || "",
      description: entry?.description || "",
      price: normalizePriceForPayload(entry?.price),
      old_price: normalizePriceForPayload(entry?.old_price),
      image: entry?.image || undefined,
      images: Array.isArray(entry?.images) ? entry.images : [],
      video: entry?.video || undefined,
      specs: Array.isArray(entry?.specs) ? entry.specs : [],
      category_id: Number(entry?.category_id) > 0 ? Number(entry?.category_id) : undefined,
    }));

    try {
      setCommitImportLoading(true);
      const parsedCategory = Number(wizardCategoryId);
      const response = await instagramApi.commitImport({
        entries: payloadEntries,
        category_id:
          Number.isFinite(parsedCategory) && parsedCategory > 0
            ? parsedCategory
            : undefined,
        source_urls:
          previewPayload?.queued_urls && Array.isArray(previewPayload.queued_urls)
            ? previewPayload.queued_urls
            : parseImportUrls(importUrlsText),
        format: "api",
      });

      const summary = response?.data?.data?.summary || {};
      const imported = Number(summary?.imported_count || 0);
      const failed = Number(summary?.failed_count || 0);

      toast.success(
        response?.data?.message ||
          `Import završen. Uvezeno: ${imported}, neuspjelo: ${failed}.`,
      );

      await fetchImportHistory();

      const importedUrlSet = new Set(
        (Array.isArray(summary?.results) ? summary.results : [])
          .filter((row) => row?.ok)
          .map((row) => row?.source_url)
          .filter(Boolean),
      );

      setPreviewEntries((prev) =>
        prev.map((entry) =>
          importedUrlSet.has(entry?.source_url)
            ? { ...entry, selected: false, imported: true }
            : entry,
        ),
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Import iz preview-a nije uspio.");
    } finally {
      setCommitImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Integracije i društvene mreže</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upravljaj povezivanjem naloga, ručnom sinhronizacijom i zakazanim objavama.
        </p>
        {SOCIAL_POSTING_TEMP_UNAVAILABLE ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
            Instagram/Facebook/TikTok objave su privremeno nedostupne. Hvala na razumijevanju.
          </div>
        ) : null}

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
                  {SOCIAL_POSTING_TEMP_UNAVAILABLE ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl"
                      disabled
                    >
                      Privremeno nedostupno
                    </Button>
                  ) : !connected ? (
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Wizard za uvoz proizvoda u oglase
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Zalijepi URL-ove proizvoda sa drugih web shopova, pregledaj ekstrakciju i potvrdi import.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 font-medium dark:bg-slate-800">
              Ready: {readyPreviewCount}
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 font-medium dark:bg-slate-800">
              Odabrano: {selectedPreviewCount}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              URL proizvoda (jedan po redu ili odvojen zarezom)
            </label>
            <textarea
              rows={5}
              value={importUrlsText}
              onChange={(event) => setImportUrlsText(event.target.value)}
              placeholder={[
                "https://doper.ba/proizvod/...",
                "https://imtec.ba/laptopi/...",
              ].join("\n")}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-3 lg:col-span-5">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Globalna kategorija (opcionalno)
              </label>
              <select
                value={wizardCategoryId}
                onChange={(event) => setWizardCategoryId(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                disabled={categoryLoading}
              >
                <option value="">Auto-detekcija kategorije</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Max stavki po izvoru
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={wizardMaxEntries}
                onChange={(event) =>
                  setWizardMaxEntries(
                    Math.max(1, Math.min(50, Number(event.target.value) || 1)),
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                API profili (JSON, opcionalno)
              </label>
              <textarea
                rows={4}
                value={apiProfilesJson}
                onChange={(event) => setApiProfilesJson(event.target.value)}
                placeholder={[
                  "{",
                  '  "imtec.ba": { "provider": "prestashop", "base_url": "https://imtec.ba", "api_key": "WS_KEY" },',
                  '  "doper.ba": { "provider": "woocommerce", "base_url": "https://doper.ba", "consumer_key": "ck_...", "consumer_secret": "cs_..." }',
                  "}",
                ].join("\n")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="h-10 rounded-xl"
                onClick={handleGeneratePreview}
                disabled={previewLoading}
              >
                {previewLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generiši preview
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                onClick={applyGlobalCategoryToSelected}
                disabled={previewEntries.length === 0}
              >
                Primijeni kategoriju
              </Button>
              <Button
                type="button"
                className="h-10 rounded-xl"
                onClick={handleCommitPreviewImport}
                disabled={commitImportLoading || selectedPreviewCount === 0}
              >
                {commitImportLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Importuj odabrano
              </Button>
            </div>
          </div>
        </div>

        {previewPayload ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Izvori: {previewPayload?.requested_sources || 0}
              </span>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Uspješni izvori: {previewPayload?.success_sources || 0}
              </span>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Stavke: {previewPayload?.entries_total || 0}
              </span>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Ready: {previewPayload?.entries_ready || 0}
              </span>
            </div>

            {Array.isArray(previewPayload?.source_results) &&
            previewPayload.source_results.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {previewPayload.source_results.map((source) => (
                  <div
                    key={source?.source_url}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  >
                    <p className="truncate font-semibold text-slate-700 dark:text-slate-200">
                      {source?.source_host || source?.source_url}
                    </p>
                    <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                      {source?.message || "Status nije dostupan"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {previewEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-300">
              Još nema preview rezultata. Unesi URL-ove i klikni “Generiši preview”.
            </div>
          ) : (
            previewEntries.map((entry) => {
              const previewImage =
                (typeof entry?.image === "string" && entry.image.trim()) ||
                (Array.isArray(entry?.images) ? entry.images[0] : "");
              const qualityClass = qualityBadgeClassName(entry?.quality_level);
              const categoryCandidateMap = new Map();
              if (Number(entry?.category_id) > 0) {
                categoryCandidateMap.set(Number(entry.category_id), {
                  id: Number(entry.category_id),
                  name:
                    categoryOptions.find((option) => option.id === Number(entry.category_id))
                      ?.name || "Odabrana kategorija",
                });
              }

              if (Array.isArray(entry?.category_candidates)) {
                entry.category_candidates.forEach((candidate) => {
                  const id = Number(candidate?.id);
                  const name = String(candidate?.name || "").trim();
                  if (id > 0 && name) categoryCandidateMap.set(id, { id, name });
                });
              }

              categoryOptions.slice(0, 100).forEach((option) => {
                if (!categoryCandidateMap.has(option.id)) {
                  categoryCandidateMap.set(option.id, option);
                }
              });

              const categoryChoices = Array.from(categoryCandidateMap.values());

              return (
                <div
                  key={entry?.preview_id}
                  className={cn(
                    "rounded-xl border bg-white p-3 dark:bg-slate-950",
                    entry?.selected
                      ? "border-slate-300 dark:border-slate-700"
                      : "border-slate-200 opacity-80 dark:border-slate-800",
                  )}
                >
                  <div className="flex flex-col gap-3 lg:flex-row">
                    <div className="lg:w-44">
                      {previewImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewImage}
                          alt={entry?.title || "Uvezeni proizvod"}
                          className="h-36 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-300">
                          Bez slike
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            qualityClass,
                          )}
                        >
                          Kvalitet: {entry?.quality_score ?? 0}
                        </span>
                        {entry?.imported ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            Uvezeno
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                            checked={Boolean(entry?.selected)}
                            onChange={(event) =>
                              updatePreviewEntry(entry.preview_id, {
                                selected: event.target.checked,
                              })
                            }
                          />
                          Uključi u import
                        </label>
                        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {entry?.source_host || entry?.source_url}
                        </span>
                      </div>

                      <input
                        value={entry?.title || ""}
                        onChange={(event) =>
                          updatePreviewEntry(entry.preview_id, {
                            title: event.target.value,
                          })
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        placeholder="Naziv proizvoda"
                      />

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <input
                          value={entry?.price ?? ""}
                          onChange={(event) =>
                            updatePreviewEntry(entry.preview_id, {
                              price: event.target.value,
                            })
                          }
                          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          placeholder="Cijena"
                        />
                        <input
                          value={entry?.old_price ?? ""}
                          onChange={(event) =>
                            updatePreviewEntry(entry.preview_id, {
                              old_price: event.target.value,
                            })
                          }
                          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          placeholder="Stara cijena"
                        />
                        <select
                          value={entry?.category_id || ""}
                          onChange={(event) =>
                            updatePreviewEntry(entry.preview_id, {
                              category_id: event.target.value ? Number(event.target.value) : "",
                            })
                          }
                          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        >
                          <option value="">Odaberi kategoriju</option>
                          {categoryChoices.map((choice) => (
                            <option key={`${entry.preview_id}-${choice.id}`} value={choice.id}>
                              {choice.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <textarea
                        rows={3}
                        value={entry?.description || ""}
                        onChange={(event) =>
                          updatePreviewEntry(entry.preview_id, {
                            description: event.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        placeholder="Opis proizvoda"
                      />

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>Cijena: {formatPricePreview(entry?.price)}</span>
                        <span>Slike: {Array.isArray(entry?.images) ? entry.images.length : 0}</span>
                        <span>Specifikacije: {Array.isArray(entry?.specs) ? entry.specs.length : 0}</span>
                      </div>

                      {Array.isArray(entry?.warnings) && entry.warnings.length > 0 ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                          {entry.warnings.join(" ")}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Historija uvoza proizvoda</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Zadnje wizard/feed import sesije i njihovi rezultati.
        </p>

        <div className="mt-3 space-y-2">
          {historyLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
              Učitavanje historije importa...
            </div>
          ) : importHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-300">
              Još nema import sesija.
            </div>
          ) : (
            importHistory.slice(0, 10).map((row) => (
              <div
                key={row?.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                    {row?.source_url || "Više izvora"}
                  </p>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      row?.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : row?.status === "partial"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
                    )}
                  >
                    {row?.status || "unknown"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Uvezeno: {row?.products_imported || 0} / {row?.products_requested || 0} | Greške:{" "}
                  {row?.products_failed || 0}
                </p>
              </div>
            ))
          )}
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
                disabled={SOCIAL_POSTING_TEMP_UNAVAILABLE}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
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
          {SOCIAL_POSTING_TEMP_UNAVAILABLE ? (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
              {SOCIAL_POSTING_UNAVAILABLE_MESSAGE}
            </div>
          ) : scheduledLoading ? (
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
