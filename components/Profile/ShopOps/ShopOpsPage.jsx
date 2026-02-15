"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { shopOpsApi } from "@/utils/api";
import { toast } from "@/utils/toastBs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Globe,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Store,
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

const resolveStockState = (item) => {
  if (item?.is_out_of_stock) {
    return { key: "out", label: "Nema na stanju" };
  }
  if (item?.is_low_stock) {
    return { key: "low", label: "Niska zaliha" };
  }
  return { key: "ok", label: "Dostupno" };
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

  useEffect(() => {
    fetchInventory();
    fetchDomain();
  }, [fetchDomain, fetchInventory]);

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
            }}
            className="h-10 rounded-xl gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Osvježi
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
