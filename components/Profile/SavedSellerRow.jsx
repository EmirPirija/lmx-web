"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { savedCollectionsApi } from "@/utils/api";

function Dot({ open }) {
  return <span className={cn("inline-block w-2 h-2 rounded-full", open ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")} />;
}

function formatMonthYear(date) {
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("bs-BA", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function SavedSellerRow({ item, listId, onRemoved, onUpdated }) {
  const seller = item?.saved_user || item?.savedUser || item?.saved_user_data || item?.savedUserData || item?.savedUser;
  const sellerId = item?.saved_user_id || seller?.id;

  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(item?.note || "");
  const [saving, setSaving] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);

  const debounceRef = useRef(null);
  const lastSentRef = useRef(note);

  useEffect(() => {
    setNote(item?.note || "");
  }, [item?.note]);

  const saveNow = async (next) => {
    if (!sellerId) return;
    setSaving(true);
    try {
      const res = await savedCollectionsApi.updateNote({ listId, saved_user_id: sellerId, note: next });
      lastSentRef.current = next;
      setSavedPulse(true);
      setTimeout(() => setSavedPulse(false), 550);
      onUpdated?.(res?.data?.data);
    } finally {
      setSaving(false);
    }
  };

  const scheduleSave = (next) => {
    setNote(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (lastSentRef.current !== next) saveNow(next);
    }, 650);
  };

  const remove = async () => {
    if (!sellerId) return;
    await savedCollectionsApi.removeFromList({ listId, saved_user_id: sellerId });
    onRemoved?.(sellerId);
  };

  const memberSince = useMemo(() => formatMonthYear(seller?.created_at), [seller?.created_at]);

  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 shrink-0">
            {seller?.profile || seller?.profile_image ? (
              <img src={seller?.profile || seller?.profile_image} alt={seller?.name || ""} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Nema</div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-extrabold text-slate-900 dark:text-white truncate">{seller?.name || "Korisnik"}</div>
              {memberSince ? (
                <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs font-semibold border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200">
                  Član od: {memberSince}
                </span>
              ) : null}

              {Boolean(seller?.is_pro) ? (
                <span className="inline-flex items-center h-7 px-3 rounded-full text-xs font-semibold border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200">
                  Pro
                </span>
              ) : null}
              {Boolean(seller?.is_shop) ? (
                <span className="inline-flex items-center h-7 px-3 rounded-full text-xs font-semibold border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200">
                  Shop
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Dot open={true} />
              <span>Sačuvano u kolekciji</span>
              {saving ? <span className="ml-2">• čuvam…</span> : savedPulse ? <span className="ml-2 text-slate-700 dark:text-slate-200">• sačuvano ✓</span> : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="rounded-2xl" onClick={() => setEditing((v) => !v)}>
            {editing ? "Zatvori" : "Bilješka"}
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={remove}>
            Ukloni
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Privatna bilješka</div>
          <Textarea
            value={note}
            onChange={(e) => scheduleSave(e.target.value)}
            placeholder="Npr. Koja cijena je dogovorena, šta traži kupac, posebni uslovi…"
            className="mt-2 min-h-[86px] rounded-2xl resize-none"
          />
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Auto-save nakon kratke pauze. Ne vidi niko osim tebe.
          </div>
        </div>
      ) : null}
    </div>
  );
}
