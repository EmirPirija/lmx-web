"use client";

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout/Layout";
import Checkauth from "@/components/HOC/Checkauth";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { savedCollectionsApi } from "@/utils/api";
import { useSavedCollections } from "@/hooks/useSavedCollections";
import SavedSellerRow from "@/components/SavedCollections/SavedSellerRow";

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
      <div className="h-4 w-40 rounded bg-slate-200/60 dark:bg-slate-700/40 animate-pulse" />
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
      className={cn(
        "h-9 px-3 rounded-2xl border text-sm font-semibold transition shadow-sm",
        "border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-900/60",
        "text-slate-800 dark:text-slate-100 hover:shadow-md",
        active ? "ring-2 ring-slate-300/70 dark:ring-slate-600/50" : ""
      )}
    >
      {children}
    </button>
  );
}

function SavedPage() {
  const { lists, loadingLists, refreshLists } = useSavedCollections();
  const [activeListId, setActiveListId] = useState(null);

  const [q, setQ] = useState(""); // search within list
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [pageInfo, setPageInfo] = useState(null);

  useEffect(() => {
    if (!loadingLists && lists?.length && !activeListId) {
      setActiveListId(lists[0].id);
    }
  }, [lists, loadingLists, activeListId]);

  const activeList = useMemo(() => lists.find((l) => l.id === activeListId) || null, [lists, activeListId]);

  const loadItems = async ({ listId, reset = false } = {}) => {
    if (!listId) return;
    setLoadingItems(true);
    try {
      const res = await savedCollectionsApi.listItems({ listId, q, page: 1, per_page: 24 });
      const data = res?.data?.data;
      setItems(data?.data || []);
      setPageInfo({ total: data?.total, last_page: data?.last_page });
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (!activeListId) return;
    loadItems({ listId: activeListId, reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeListId]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Sačuvani prodavači</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Kolekcije, privatne bilješke i obavijesti — sve na jednom mjestu.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => { refreshLists(); if (activeListId) loadItems({ listId: activeListId, reset: true }); }}>
              Osvježi
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 items-start">
          {/* Lists */}
          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm xl:sticky xl:top-6">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">Kolekcije</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{lists?.length || 0}</div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {loadingLists ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">Učitavam…</div>
              ) : (
                (lists || []).map((l) => (
                  <Chip key={l.id} active={l.id === activeListId} onClick={() => setActiveListId(l.id)}>
                    {l.name} <span className="ml-2 text-xs opacity-70">({l.items_count ?? 0})</span>
                  </Chip>
                ))
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-900/30">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Pretraga unutar liste</div>
              <div className="mt-2 flex items-center gap-2">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Traži po imenu…" className="h-10 rounded-2xl" />
                <Button className="rounded-2xl" onClick={() => activeListId && loadItems({ listId: activeListId, reset: true })}>
                  Traži
                </Button>
              </div>
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
                  onRemoved={() => loadItems({ listId: activeListId, reset: true })}
                  onUpdated={() => {}}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-10 text-center shadow-sm">
                <div className="text-lg font-extrabold text-slate-900 dark:text-white">Lista je prazna</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Idi na prodavača i klikni “Sačuvaj” → odaberi kolekciju.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const GuardedSavedPage = Checkauth(SavedPage);
export default GuardedSavedPage;
