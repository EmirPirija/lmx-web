"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileLayout from "@/components/Profile/ProfileLayout";
import Checkauth from "@/HOC/Checkauth";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import SavedSellerRow from "@/components/Profile/SavedSellerRow";
import { savedCollectionsApi } from "@/utils/api";

import {
  Bookmark,
  Search,
  RefreshCw,
  Folder,
  Users,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ============================================
// COMPONENTS
// ============================================

function CollectionChip({ collection, isActive, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 h-11 px-4 rounded-2xl border-2 text-sm font-semibold transition-all",
        isActive
          ? "border-primary bg-primary/10 text-primary shadow-md shadow-primary/10"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary/50"
      )}
    >
      <Folder size={16} className={isActive ? "text-primary" : "text-slate-400"} />
      {collection.name}
      <span className={cn(
        "px-2 py-0.5 rounded-full text-xs font-bold",
        isActive ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
      )}>
        {collection.items_count ?? 0}
      </span>
    </motion.button>
  );
}

function EmptyState({ message, submessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-xl shadow-primary/20">
        <Bookmark size={40} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{message}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{submessage}</p>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

function SavedPage() {
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
  }, []);

  useEffect(() => {
    if (!activeListId) return;
    fetchItems(activeListId);
  }, [activeListId]);

  const handleRefresh = () => {
    fetchLists();
    if (activeListId) fetchItems(activeListId);
  };

  const handleSearch = () => {
    if (activeListId) fetchItems(activeListId);
  };

  return (
    <ProfileLayout title="Sačuvani kontakti" subtitle="Kolekcije, privatne bilješke i obavijesti na jednom mjestu">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Users size={18} />
            <span className="text-sm font-medium">
              {lists.reduce((sum, l) => sum + (l.items_count || 0), 0)} kontakata ukupno
            </span>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loadingLists || loadingItems}
            className="gap-2 rounded-xl"
          >
            <RefreshCw size={16} className={loadingLists ? "animate-spin" : ""} />
            Osvježi
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
          {/* Collections Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 xl:sticky xl:top-6 h-fit"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Folder size={20} className="text-primary" />
                Kolekcije
              </h3>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                {lists?.length || 0}
              </span>
            </div>

            {/* Collections List */}
            <div className="flex flex-wrap gap-2 mb-6">
              {loadingLists ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Učitavam kolekcije...</span>
                </div>
              ) : lists?.length ? (
                lists.map((l) => (
                  <CollectionChip
                    key={l.id}
                    collection={l}
                    isActive={l.id === activeListId}
                    onClick={() => setActiveListId(l.id)}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nema kolekcija. Sačuvaj prodavača da kreiraš prvu kolekciju.
                </p>
              )}
            </div>

            {/* Search */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pretraga unutar liste</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Traži po imenu..."
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-11 rounded-xl border-2"
                />
                <Button onClick={handleSearch} className="h-11 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:opacity-90">
                  Traži
                </Button>
              </div>
              {activeList && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Aktivna lista: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeList.name}</span>
                </p>
              )}
            </div>
          </motion.div>

          {/* Items List */}
          <div className="space-y-4">
            {loadingItems ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : items?.length ? (
              <AnimatePresence>
                {items.map((it, index) => (
                  <motion.div
                    key={it?.id || `${it?.list_id}-${it?.saved_user_id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SavedSellerRow
                      item={it}
                      listId={activeListId}
                      onRemoved={() => activeListId && fetchItems(activeListId)}
                      onUpdated={() => {}}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <EmptyState
                message="Lista je prazna"
                submessage="Idi na profil prodavača i klikni 'Sačuvaj' da dodaš kontakt u kolekciju."
              />
            )}
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}

const GuardedSavedPage = Checkauth(SavedPage);
export default GuardedSavedPage;
