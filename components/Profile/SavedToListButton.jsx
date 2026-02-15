"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/utils/toastBs";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { savedCollectionsApi } from "@/utils/api";
import { useSavedCollections } from "@/hooks/useSavedCollections";

function BookmarkIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4.75C7 3.784 7.784 3 8.75 3h6.5C16.216 3 17 3.784 17 4.75V21l-5-3-5 3V4.75Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SavedToListButton({
  sellerId,
  sellerName,
  className,
}) {
  const { lists, loadingLists, refreshLists, createList } = useSavedCollections();

  const [open, setOpen] = useState(false);
  const [membership, setMembership] = useState([]); // list ids
  const [loadingMembership, setLoadingMembership] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");

  const [quickNote, setQuickNote] = useState(""); // optional note on add
  const [saving, setSaving] = useState(false);

  const mountedRef = useRef(false);

  const hasAny = membership.length > 0;

  const ensureMembership = async () => {
    if (!sellerId) return;
    setLoadingMembership(true);
    try {
      const res = await savedCollectionsApi.membership({ saved_user_id: sellerId });
      setMembership(res?.data?.data?.list_ids || []);
    } catch {
      setMembership([]);
    } finally {
      setLoadingMembership(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (!mountedRef.current) mountedRef.current = true;
    refreshLists();
    ensureMembership();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleInList = async (listId) => {
    if (!sellerId || !listId) return;
    const inList = membership.includes(listId);
    setSaving(true);

    // optimistic
    setMembership((prev) => (inList ? prev.filter((x) => x !== listId) : [...prev, listId]));

    try {
      if (inList) {
        await savedCollectionsApi.removeFromList({ listId, saved_user_id: sellerId });
        toast.success("Uklonjeno iz liste.");
      } else {
        await savedCollectionsApi.addToList({ listId, saved_user_id: sellerId, note: quickNote || undefined });
        toast.success("Sačuvano u listu.");
      }
    } catch (e) {
      // revert
      setMembership((prev) => (inList ? [...prev, listId] : prev.filter((x) => x !== listId)));
      toast.error(e?.response?.data?.message || "Ne mogu sačuvati trenutno.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateList = async () => {
    const clean = newListName.trim();
    if (clean.length < 2) return;
    setCreating(true);
    const created = await createList(clean);
    setCreating(false);
    setNewListName("");
    if (created?.id) {
      // Auto-add into the new list
      await toggleInList(created.id);
    }
  };

  const title = useMemo(() => {
    if (hasAny) return sellerName ? `Sačuvan prodavač: ${sellerName}` : "Prodavač je sačuvan";
    if (sellerName) return `Sačuvaj prodavača: ${sellerName}`;
    return "Sačuvaj prodavača";
  }, [hasAny, sellerName]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all",
            "shadow-sm hover:shadow-md active:scale-[0.98]",
            hasAny
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
            "p-2.5 w-10 h-10 justify-center",
            className
          )}
          aria-label={title}
          title={title}
        >
          <BookmarkIcon active={hasAny} />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[340px] rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-xl" align="end">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">Spasi u listu</div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Odaberi jednu ili više kolekcija. Ovo je privatno — vidiš samo ti.
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {loadingMembership ? "…" : `${membership.length} liste`}
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Brza bilješka (opcionalno)</div>
          <Input
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Npr. ‘Odgovara brzo’, ‘Dobri uslovi’, …"
            className="mt-2 h-10 rounded-2xl"
          />
        </div>

        <div className="mt-3 max-h-[220px] overflow-auto pr-1 space-y-1">
          {loadingLists ? (
            <div className="p-3 text-sm text-slate-500 dark:text-slate-400">Učitavam liste…</div>
          ) : lists?.length ? (
            lists.map((l) => {
              const active = membership.includes(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  disabled={saving}
                  onClick={() => toggleInList(l.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all",
                    "border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60",
                    active && "ring-2 ring-slate-200 dark:ring-slate-700"
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{l.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{l.items_count ?? 0} sačuvanih</div>
                  </div>
                  <div className={cn("shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center", active ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 dark:border-slate-800 text-slate-400")}>
                    {active ? <CheckIcon /> : null}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-3 text-sm text-slate-500 dark:text-slate-400">Još nemaš listi. Kreiraj prvu ispod.</div>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-900/30">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Kreiraj novu listu</div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Npr. ‘Favoriti’, ‘Za saradnju’…"
              className="h-10 rounded-2xl"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateList();
                }
              }}
            />
            <Button onClick={handleCreateList} disabled={creating || newListName.trim().length < 2} className="rounded-2xl">
              {creating ? "…" : "Kreiraj"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
