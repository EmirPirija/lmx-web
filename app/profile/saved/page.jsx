"use client";

import React, { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import SavedSellerRow from "@/components/Profile/SavedSellerRow";
import { savedCollectionsApi } from "@/utils/api";

/**
 * NOTE (anti-hydration):
 * - Ne koristimo toLocaleDateString (server vs browser locale mismatch).
 * - Ne koristimo Date.now/Math.random u renderu.
 */

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
      <div className="h-4 w-44 rounded bg-slate-200/60 dark:bg-slate-700/40 animate-pulse" />
      <div className="mt-3 h-3 w-64 rounded bg-slate-200/50 dark:bg-slate-700/30 animate-pulse" />
      <div className="mt-6 h-20 w-full rounded-2xl bg-slate-200/40 dark:bg-slate-700/25 animate-pulse" />
    </div>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-9 px-3 rounded-2xl border text-sm font-semibold transition shadow-sm",
        "border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-900/60",
        "text-slate-800 dark:text-slate-100 hover:shadow-md",
        active ? "ring-2 ring-slate-300/70 dark:ring-slate-600/50" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function SavedPage() {
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [activeListId, setActiveListId] = useState(null);

  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const activeList = useMemo(() => lists.find((l) => l.id === activeListId) || null, [lists, activeListId]);

  const fetchLists = async () => {
    setLoadingLists(true);
    try {
      const res = await savedCollectionsApi.lists();
      const data = res?.data?.data || [];
      setLists(data);
      if (!activeListId && data?.length) setActiveListId(data[0].id);
    } catch {
      setLists([]);
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchItems = async (listId) => {
    if (!listId) return;
    setLoadingItems(true);
    try {
      const res = await savedCollectionsApi.listItems({ listId, q, page: 1, per_page: 24 });
      const data = res?.data?.data;
      setItems(data?.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeListId) return;
    fetchItems(activeListId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeListId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Sačuvani prodavači
          </div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Kolekcije, privatne bilješke i obavijesti — sve na jednom mjestu.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => {
              fetchLists();
              if (activeListId) fetchItems(activeListId);
            }}
          >
            Osvježi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 items-start">
        {/* Lists */}
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 shadow-sm xl:sticky xl:top-6">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">Kolekcije</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{lists?.length || 0}</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {loadingLists ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Učitavam…</div>
            ) : lists?.length ? (
              lists.map((l) => (
                <Chip key={l.id} active={l.id === activeListId} onClick={() => setActiveListId(l.id)}>
                  {l.name} <span className="ml-2 text-xs opacity-70">({l.items_count ?? 0})</span>
                </Chip>
              ))
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Nema listi. Kreiraj listu kroz dugme "Sačuvaj" na profilu prodavača.
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200/70 dark:border-slate-800 p-3 bg-white dark:bg-slate-900/30">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Pretraga unutar liste</div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Traži po imenu…"
                className="h-10 rounded-xl"
              />
              <Button className="rounded-xl" onClick={() => activeListId && fetchItems(activeListId)}>
                Traži
              </Button>
            </div>
            {activeList ? (
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Aktivna lista: <span className="font-semibold text-slate-700 dark:text-slate-200">{activeList.name}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {loadingItems ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : items?.length ? (
            items.map((it) => (
              <SavedSellerRow
                key={it?.id || `${it?.list_id}-${it?.saved_user_id}`}
                item={it}
                listId={activeListId}
                onRemoved={() => activeListId && fetchItems(activeListId)}
                onUpdated={() => {}}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-10 text-center shadow-sm">
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">Lista je prazna</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Idi na prodavača i klikni "Sačuvaj" → odaberi kolekciju.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
