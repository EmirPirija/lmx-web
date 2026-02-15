"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { shopFeedApi, shopOpsApi } from "@/utils/api";
import { toast } from "@/utils/toastBs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  FileText,
  Globe,
  Link2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Store,
  UploadCloud,
} from "@/components/Common/UnifiedIconPack";

const DOMAIN_STATUS_LABELS = {
  none: "Nije podešeno",
  pending_dns: "Čeka DNS",
  verified: "Verifikovano",
  error: "Greška",
};

const DOMAIN_STATUS_TONES = {
  none: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  pending_dns:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300",
  verified:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300",
  error: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-300",
};

const STOCK_TONE = {
  out: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-300",
  low: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const MODE_OPTIONS = [
  { value: "set", label: "Postavi tačno" },
  { value: "add", label: "Dodaj" },
  { value: "subtract", label: "Oduzmi" },
];

const FEED_MODE_OPTIONS = [
  { value: "api", label: "API feed" },
  { value: "csv", label: "CSV feed" },
  { value: "xml", label: "XML feed" },
];

const IMPORT_STATUS_TONES = {
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300",
  queued:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300",
  processing:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700/60 dark:bg-sky-900/30 dark:text-sky-300",
  failed:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-300",
  error:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-300",
};

const IMPORT_STATUS_LABELS = {
  completed: "Završeno",
  success: "Uspješno",
  pending: "Na čekanju",
  queued: "U redu čekanja",
  processing: "U obradi",
  failed: "Neuspješno",
  error: "Greška",
};

const URL_REGEX = /^https?:\/\/[^\s]+$/i;

const resolveStockState = (item) => {
  if (item?.is_out_of_stock) {
    return { key: "out", label: "Nema na stanju" };
  }
  if (item?.is_low_stock) {
    return { key: "low", label: "Niska zaliha" };
  }
  return { key: "ok", label: "Dostupno" };
};

const toUniqueUrls = (rawValues = []) => {
  const urlSet = new Set();
  rawValues.forEach((value) => {
    const candidate = String(value || "").trim();
    if (URL_REGEX.test(candidate)) {
      urlSet.add(candidate);
    }
  });
  return Array.from(urlSet);
};

const parseManualUrls = (value = "") =>
  toUniqueUrls(
    String(value)
      .split(/[\n,]/g)
      .map((item) => item.trim())
      .filter(Boolean)
  );

const parseCsvUrls = (csvText = "") => {
  const rows = String(csvText)
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length === 0) return [];

  const splitRow = (line) =>
    line
      .split(/[,;\t|]/g)
      .map((cell) => String(cell || "").replace(/^["']|["']$/g, "").trim());

  const headerCells = splitRow(rows[0]).map((cell) => cell.toLowerCase());
  const detectedUrlColumn = headerCells.findIndex((cell) =>
    /(url|link|source|feed)/.test(cell)
  );
  const startsFrom = detectedUrlColumn >= 0 ? 1 : 0;

  const urls = [];
  rows.slice(startsFrom).forEach((row) => {
    const cells = splitRow(row);
    if (detectedUrlColumn >= 0) {
      const possibleUrl = cells[detectedUrlColumn];
      if (possibleUrl && URL_REGEX.test(possibleUrl)) urls.push(possibleUrl);
      return;
    }
    cells.forEach((cell) => {
      if (URL_REGEX.test(cell)) urls.push(cell);
    });
  });

  return toUniqueUrls(urls);
};

const parseXmlUrls = (xmlText = "") => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(String(xmlText), "application/xml");
  const parserError = xmlDoc.querySelector("parsererror");
  if (parserError) {
    throw new Error("XML datoteka nije validna.");
  }

  const urls = [];
  const selectors = ["loc", "link", "url", "source_url", "product_url", "item_url"];
  selectors.forEach((selector) => {
    xmlDoc.querySelectorAll(selector).forEach((node) => {
      const candidate = String(node?.textContent || "").trim();
      if (URL_REGEX.test(candidate)) urls.push(candidate);
    });
  });

  return toUniqueUrls(urls);
};

const normalizeImportHistoryPayload = (payload) => {
  const candidates = [
    payload?.data?.data?.data,
    payload?.data?.data?.history,
    payload?.data?.history,
    payload?.data?.data,
    payload?.data,
  ];

  let rows = [];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      rows = candidate;
      break;
    }
    if (Array.isArray(candidate?.data)) {
      rows = candidate.data;
      break;
    }
  }

  const pagingSource = payload?.data?.data || payload?.data || {};
  const currentPage = Number(pagingSource?.current_page || 1);
  const lastPage = Number(pagingSource?.last_page || 1);

  return { rows, currentPage, lastPage };
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("bs-BA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ShopOpsPage() {
  const [thresholdInput, setThresholdInput] = useState("");
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState({ summary: null, items: [] });
  const [quantityDraft, setQuantityDraft] = useState({});
  const [modeDraft, setModeDraft] = useState({});
  const [inventorySavingId, setInventorySavingId] = useState(null);

  const [domainLoading, setDomainLoading] = useState(true);
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainVerifying, setDomainVerifying] = useState(false);
  const [domainData, setDomainData] = useState(null);
  const [domainInput, setDomainInput] = useState("");

  const [feedMode, setFeedMode] = useState("api");
  const [feedUrl, setFeedUrl] = useState("");
  const [feedCategoryId, setFeedCategoryId] = useState("");
  const [feedUrlsText, setFeedUrlsText] = useState("");
  const [feedFileName, setFeedFileName] = useState("");
  const [feedFileObject, setFeedFileObject] = useState(null);
  const [feedFileUrls, setFeedFileUrls] = useState([]);
  const [feedImportLoading, setFeedImportLoading] = useState(false);
  const [feedImportUnavailable, setFeedImportUnavailable] = useState(false);
  const [importHistoryLoading, setImportHistoryLoading] = useState(true);
  const [importHistoryRows, setImportHistoryRows] = useState([]);
  const [importHistoryPage, setImportHistoryPage] = useState(1);
  const [importHistoryLastPage, setImportHistoryLastPage] = useState(1);

  const fetchInventory = useCallback(async (nextThreshold) => {
    try {
      setInventoryLoading(true);
      const thresholdNumber =
        nextThreshold !== undefined && nextThreshold !== null && String(nextThreshold).trim() !== ""
          ? Number(nextThreshold)
          : undefined;
      const res = await shopOpsApi.getInventoryAlerts({
        threshold: Number.isFinite(thresholdNumber) ? thresholdNumber : undefined,
      });
      const payload = res?.data;
      if (payload?.error === false) {
        const summary = payload?.data?.summary || null;
        const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
        setInventoryData({ summary, items });
        setQuantityDraft((prev) => {
          const draft = { ...prev };
          items.forEach((item) => {
            if (draft[item.id] === undefined) {
              draft[item.id] = item?.inventory_count ?? 0;
            }
          });
          return draft;
        });
        setModeDraft((prev) => {
          const draft = { ...prev };
          items.forEach((item) => {
            if (!draft[item.id]) {
              draft[item.id] = "set";
            }
          });
          return draft;
        });
      } else {
        setInventoryData({ summary: null, items: [] });
        toast.error(payload?.message || "Ne mogu učitati stanje zaliha.");
      }
    } catch (error) {
      setInventoryData({ summary: null, items: [] });
      toast.error(error?.response?.data?.message || "Greška pri učitavanju zaliha.");
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  const fetchDomain = useCallback(async () => {
    try {
      setDomainLoading(true);
      const res = await shopOpsApi.getDomainSettings();
      const payload = res?.data;
      if (payload?.error === false) {
        const nextData = payload?.data || null;
        setDomainData(nextData);
        setDomainInput(nextData?.domain || "");
      } else {
        setDomainData(null);
        toast.error(payload?.message || "Ne mogu učitati postavke domene.");
      }
    } catch (error) {
      setDomainData(null);
      toast.error(error?.response?.data?.message || "Greška pri učitavanju domene.");
    } finally {
      setDomainLoading(false);
    }
  }, []);

  const fetchImportHistory = useCallback(async (page = 1) => {
    try {
      setImportHistoryLoading(true);
      const res = await shopFeedApi.getImportHistory({ page });
      const payload = res?.data;
      setFeedImportUnavailable(false);
      if (payload?.error === true) {
        setImportHistoryRows([]);
        toast.error(payload?.message || "Ne mogu učitati historiju importa.");
        return;
      }
      const normalized = normalizeImportHistoryPayload(payload);
      setImportHistoryRows(Array.isArray(normalized.rows) ? normalized.rows : []);
      setImportHistoryPage(normalized.currentPage || 1);
      setImportHistoryLastPage(normalized.lastPage || 1);
    } catch (error) {
      if (error?.response?.status === 404) {
        setFeedImportUnavailable(true);
        setImportHistoryRows([]);
        setImportHistoryPage(1);
        setImportHistoryLastPage(1);
        return;
      }
      setImportHistoryRows([]);
      toast.error(error?.response?.data?.message || "Greška pri učitavanju historije importa.");
    } finally {
      setImportHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchDomain();
    fetchImportHistory(1);
  }, [fetchDomain, fetchImportHistory, fetchInventory]);

  const summary = inventoryData?.summary || {};
  const inventoryItems = inventoryData?.items || [];

  const lowStockItems = useMemo(
    () => inventoryItems.filter((item) => item?.is_low_stock),
    [inventoryItems]
  );
  const outOfStockItems = useMemo(
    () => inventoryItems.filter((item) => item?.is_out_of_stock),
    [inventoryItems]
  );
  const manualFeedUrls = useMemo(() => parseManualUrls(feedUrlsText), [feedUrlsText]);
  const resolvedFeedUrls = useMemo(
    () => toUniqueUrls([...feedFileUrls, ...manualFeedUrls]),
    [feedFileUrls, manualFeedUrls]
  );

  const handleInventorySave = async (itemId) => {
    const quantityRaw = quantityDraft[itemId];
    const mode = modeDraft[itemId] || "set";
    const quantity = Number(quantityRaw);

    if (!Number.isFinite(quantity) || quantity < 0) {
      toast.error("Unesite ispravnu količinu (0 ili više).");
      return;
    }

    try {
      setInventorySavingId(itemId);
      const res = await shopOpsApi.updateInventory({
        item_id: itemId,
        quantity,
        mode,
      });
      const payload = res?.data;
      if (payload?.error === false) {
        toast.success(payload?.message || "Zaliha je ažurirana.");
        await fetchInventory(thresholdInput);
      } else {
        toast.error(payload?.message || "Ažuriranje zalihe nije uspjelo.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Greška pri ažuriranju zalihe.");
    } finally {
      setInventorySavingId(null);
    }
  };

  const handleSaveDomain = async () => {
    const nextDomain = String(domainInput || "").trim();
    if (!nextDomain) {
      toast.error("Unesite domen prije snimanja.");
      return;
    }

    try {
      setDomainSaving(true);
      const res = await shopOpsApi.updateDomain({ domain: nextDomain });
      const payload = res?.data;
      if (payload?.error === false) {
        toast.success(payload?.message || "Domena je sačuvana.");
        await fetchDomain();
      } else {
        toast.error(payload?.message || "Domena nije sačuvana.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Greška pri snimanju domene.");
    } finally {
      setDomainSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    try {
      setDomainVerifying(true);
      const res = await shopOpsApi.verifyDomain();
      const payload = res?.data;
      if (payload?.error === false) {
        toast.success(payload?.message || "Verifikacija domene je završena.");
        await fetchDomain();
      } else {
        toast.error(payload?.message || "Verifikacija nije uspjela.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Greška pri verifikaciji domene.");
    } finally {
      setDomainVerifying(false);
    }
  };

  const handleFeedModeChange = (mode) => {
    setFeedMode(mode);
    setFeedFileName("");
    setFeedFileObject(null);
    setFeedFileUrls([]);
  };

  const handleFeedFileChange = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    setFeedFileName(file.name);
    setFeedFileObject(file);
    try {
      const content = await file.text();
      const parsedUrls = feedMode === "xml" ? parseXmlUrls(content) : parseCsvUrls(content);

      if (parsedUrls.length === 0) {
        setFeedFileUrls([]);
        toast.info("URL-ovi nisu automatski prepoznati, ali datoteka će se poslati backendu.");
        return;
      }

      setFeedFileUrls(parsedUrls);
      toast.success(`Učitano URL-ova iz datoteke: ${parsedUrls.length}.`);
    } catch (error) {
      setFeedFileObject(null);
      setFeedFileUrls([]);
      toast.error(error?.message || "Datoteku nije moguće obraditi.");
    } finally {
      event.target.value = "";
    }
  };

  const handleFeedImport = async () => {
    if (feedImportUnavailable) {
      toast.info("Feed import endpoint trenutno nije dostupan na backendu.");
      return;
    }

    const sourceUrl = String(feedUrl || "").trim();
    const categoryIdRaw = String(feedCategoryId || "").trim();
    const categoryId = categoryIdRaw === "" ? undefined : Number(categoryIdRaw);

    if (categoryIdRaw !== "" && !Number.isFinite(categoryId)) {
      toast.error("Kategorija mora biti broj.");
      return;
    }

    if (!sourceUrl && resolvedFeedUrls.length === 0 && !feedFileObject) {
      toast.error("Unesi URL feeda, dodaj URL-ove proizvoda ili uploadaj datoteku.");
      return;
    }

    try {
      setFeedImportLoading(true);
      const res = await shopFeedApi.importFeed({
        source_url: sourceUrl || undefined,
        source_urls: resolvedFeedUrls,
        category_id: Number.isFinite(categoryId) ? categoryId : undefined,
        feed_file: feedFileObject || undefined,
        format: feedMode,
      });
      const payload = res?.data;
      if (payload?.error === false || payload?.error === undefined) {
        toast.success(payload?.message || "Import je pokrenut.");
        await fetchImportHistory(1);
      } else {
        toast.error(payload?.message || "Import nije uspio.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Greška pri importu feeda.");
    } finally {
      setFeedImportLoading(false);
    }
  };

  const feedUrlPlaceholder =
    feedMode === "xml"
      ? "https://shop.tvojdomen.ba/feed.xml"
      : feedMode === "csv"
      ? "https://shop.tvojdomen.ba/feed.csv"
      : "https://shop.tvojdomen.ba/api/products";
  const fileAccept = feedMode === "xml" ? ".xml,text/xml,application/xml" : ".csv,text/csv";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Shop operacije</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Upravljanje zalihama, alertima i custom domenom za storefront.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              fetchInventory(thresholdInput);
              fetchDomain();
              fetchImportHistory(importHistoryPage);
            }}
            className="h-10 rounded-xl gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Osvježi
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Shop feed import (API/CSV/XML)
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Uvezi oglase iz vanjskog shop sistema kroz feed URL, CSV ili XML datoteku.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-700/60 dark:bg-sky-900/30 dark:text-sky-300">
            <Link2 className="h-3.5 w-3.5" />
            Bez ručnog unosa artikala
          </div>
        </div>

        {feedImportUnavailable ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200">
            Feed import endpoint trenutno nije dostupan na backendu. Provjeri API rute i pokušaj ponovo.
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {FEED_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleFeedModeChange(option.value)}
              disabled={feedImportUnavailable}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
                feedMode === option.value
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <Input
                type="url"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder={feedUrlPlaceholder}
                className="h-10 rounded-xl"
                disabled={feedImportUnavailable}
              />
              <Input
                type="number"
                min={1}
                value={feedCategoryId}
                onChange={(e) => setFeedCategoryId(e.target.value)}
                placeholder="Kategorija ID"
                className="h-10 rounded-xl"
                disabled={feedImportUnavailable}
              />
            </div>

            {(feedMode === "csv" || feedMode === "xml") && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-900/60">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Upload {feedMode.toUpperCase()} datoteke
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="shop-feed-file"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Odaberi datoteku
                  </label>
                  <input
                    id="shop-feed-file"
                    type="file"
                    accept={fileAccept}
                    className="hidden"
                    onChange={handleFeedFileChange}
                    disabled={feedImportUnavailable}
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {feedFileName || "Nema odabrane datoteke"}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dodatni URL-ovi (jedan po redu)
              </label>
              <textarea
                value={feedUrlsText}
                onChange={(e) => setFeedUrlsText(e.target.value)}
                rows={4}
                placeholder={"https://shop.tvojdomen.ba/proizvod-1\nhttps://shop.tvojdomen.ba/proizvod-2"}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
                disabled={feedImportUnavailable}
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Iz datoteke: {feedFileUrls.length}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Ručno uneseno: {manualFeedUrls.length}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300">
                Ukupno spremno za import: {resolvedFeedUrls.length + (feedUrl ? 1 : 0)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleFeedImport}
                className="h-10 rounded-xl"
                disabled={feedImportLoading || feedImportUnavailable}
              >
                {feedImportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pokreni import"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchImportHistory(importHistoryPage)}
                className="h-10 rounded-xl"
                disabled={importHistoryLoading}
              >
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Osvježi historiju
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              Tips za feed
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Za CSV/XML možeš unijeti URL feeda ili uploadati datoteku.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                <span>Ako feed ima URL kolonu, sistem je automatski prepoznaje.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                <span>Ako import padne, provjeri da feed URL vraća javno dostupne podatke.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/70">
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2">Izvor</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Uvezeno</th>
                <th className="px-3 py-2">Greške</th>
                <th className="px-3 py-2">Vrijeme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {importHistoryLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-center text-slate-500 dark:text-slate-400">
                    Učitavanje historije importa...
                  </td>
                </tr>
              ) : importHistoryRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-center text-slate-500 dark:text-slate-400">
                    Nema import zapisa. Pokreni prvi import.
                  </td>
                </tr>
              ) : (
                importHistoryRows.map((row, index) => {
                  const status = String(row?.status || row?.state || "pending").toLowerCase();
                  const statusLabel = IMPORT_STATUS_LABELS[status] || status;
                  const source =
                    row?.source_url || row?.feed_url || row?.url || row?.source || row?.meta?.source_url || "—";
                  const importedCount =
                    row?.imported_count ?? row?.success_count ?? row?.imported ?? row?.processed_success ?? 0;
                  const failedCount =
                    row?.failed_count ?? row?.error_count ?? row?.failed ?? row?.processed_failed ?? 0;

                  return (
                    <tr key={row?.id || row?.uuid || `${source}-${index}`} className="bg-white dark:bg-slate-900/60">
                      <td className="max-w-[360px] px-3 py-3">
                        <p className="truncate font-medium text-slate-800 dark:text-slate-200">{source}</p>
                        {row?.message ? (
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{row.message}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-1 text-xs font-semibold",
                            IMPORT_STATUS_TONES[status] ||
                              "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          )}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-emerald-700 dark:text-emerald-300">
                        {importedCount}
                      </td>
                      <td className="px-3 py-3 font-semibold text-rose-700 dark:text-rose-300">{failedCount}</td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                        {formatDateTime(row?.created_at || row?.started_at || row?.updated_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg px-3 text-xs"
            onClick={() => fetchImportHistory(Math.max(1, importHistoryPage - 1))}
            disabled={importHistoryLoading || importHistoryPage <= 1}
          >
            Prethodna
          </Button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Stranica {importHistoryPage} / {importHistoryLastPage}
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg px-3 text-xs"
            onClick={() => fetchImportHistory(Math.min(importHistoryLastPage, importHistoryPage + 1))}
            disabled={importHistoryLoading || importHistoryPage >= importHistoryLastPage}
          >
            Sljedeća
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Inventory alerts</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Auto status: kad je zaliha 0, oglas ide u “Nema na stanju”.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              placeholder={`Prag (${summary?.global_threshold || 3})`}
              className="h-10 w-36 rounded-xl"
            />
            <Button
              type="button"
              onClick={() => fetchInventory(thresholdInput)}
              className="h-10 rounded-xl"
              disabled={inventoryLoading}
            >
              Primijeni prag
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">Praćenih artikala</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              {summary?.tracked_items ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-700/60 dark:bg-amber-900/30">
            <p className="text-xs text-amber-700 dark:text-amber-300">Niska zaliha</p>
            <p className="mt-1 text-lg font-bold text-amber-800 dark:text-amber-200">
              {summary?.low_stock ?? lowStockItems.length}
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-700/60 dark:bg-rose-900/30">
            <p className="text-xs text-rose-700 dark:text-rose-300">Nema na stanju</p>
            <p className="mt-1 text-lg font-bold text-rose-800 dark:text-rose-200">
              {summary?.out_of_stock ?? outOfStockItems.length}
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/70">
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2">Artikal</th>
                <th className="px-3 py-2">Zaliha</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Brza akcija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {inventoryLoading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-5 text-center text-slate-500 dark:text-slate-400">
                    Učitavanje zaliha...
                  </td>
                </tr>
              ) : inventoryItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-5 text-center text-slate-500 dark:text-slate-400">
                    Nema artikala za prikaz.
                  </td>
                </tr>
              ) : (
                inventoryItems.map((item) => {
                  const stockState = resolveStockState(item);
                  return (
                    <tr key={item.id} className="bg-white dark:bg-slate-900/60">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                            <Box className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{item?.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Ostalo još {item?.inventory_count ?? 0} komada
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item?.inventory_count ?? 0}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("inline-flex rounded-full border px-2 py-1 text-xs font-semibold", STOCK_TONE[stockState.key])}>
                          {stockState.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            value={quantityDraft[item.id] ?? 0}
                            onChange={(e) =>
                              setQuantityDraft((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            className="h-9 w-20 rounded-lg"
                          />
                          <select
                            value={modeDraft[item.id] || "set"}
                            onChange={(e) =>
                              setModeDraft((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                          >
                            {MODE_OPTIONS.map((mode) => (
                              <option key={mode.value} value={mode.value}>
                                {mode.label}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            onClick={() => handleInventorySave(item.id)}
                            className="h-9 rounded-lg px-3 text-xs"
                            disabled={inventorySavingId === item.id}
                          >
                            {inventorySavingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Dodaj zalihu"
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-2">
          <Globe className="mt-0.5 h-5 w-5 text-primary" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Custom domain</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Podržano: `shopname.lmx.ba` i `shop.tvojdomen.ba` preko CNAME zapisa.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <Input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="npr. shop.mojdomen.ba"
            className="h-11 rounded-xl"
            disabled={domainLoading}
          />
          <Button
            type="button"
            onClick={handleSaveDomain}
            className="h-11 rounded-xl"
            disabled={domainSaving || domainLoading}
          >
            {domainSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sačuvaj domen"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleVerifyDomain}
            className="h-11 rounded-xl"
            disabled={domainVerifying || domainLoading}
          >
            {domainVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verifikuj DNS"}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">Status domene</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full border px-2 py-1 text-xs font-semibold",
                  DOMAIN_STATUS_TONES[String(domainData?.status || "none")] || DOMAIN_STATUS_TONES.none
                )}
              >
                {DOMAIN_STATUS_LABELS[String(domainData?.status || "none")] || "Nije podešeno"}
              </span>
              {domainData?.ssl_enabled ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  SSL aktivan
                </span>
              ) : null}
            </div>
            {domainData?.error ? (
              <p className="mt-2 inline-flex items-start gap-1 text-xs text-rose-600 dark:text-rose-300">
                <AlertTriangle className="mt-[1px] h-3.5 w-3.5 shrink-0" />
                {domainData.error}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">DNS instrukcije</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              CNAME target: {domainData?.cname_target || "shops.lmx.ba"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Nakon DNS izmjene, klikni “Verifikuj DNS”. SSL će se automatski aktivirati nakon verifikacije.
            </p>
          </div>
        </div>

        {domainLoading ? (
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Učitavanje postavki domene...
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-700/50 dark:bg-emerald-900/20">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          <div className="space-y-1 text-sm text-emerald-800 dark:text-emerald-200">
            <p className="font-semibold">Auto status je aktivan</p>
            <p>
              Kad zaliha padne na 0, artikl prelazi u stanje “Nema na stanju”. Kad dopunite zalihu, sistem ga vraća
              u dostupno stanje.
            </p>
            <p className="inline-flex items-center gap-1 text-xs">
              <Store className="h-3.5 w-3.5" />
              Prag niske zalihe trenutno: {summary?.global_threshold ?? 3}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
