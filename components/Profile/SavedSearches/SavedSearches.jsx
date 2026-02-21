"use client";

import { useMemo, useState } from "react";
import { toast } from "@/utils/toastBs";
import { useNavigate } from "@/components/Common/useNavigate";
import { buildSavedSearchUrl, useSavedSearches } from "@/hooks/useSavedSearches";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import { IconExternalLink, IconPencil, IconTrash } from "@/components/Common/UnifiedIconPack";

function formatQueryString(qs) {
  const params = new URLSearchParams(qs || "");
  const entries = Array.from(params.entries());
  if (!entries.length) return "Svi oglasi (bez filtera)";

  const known = [];
  const query = params.get("query");
  if (query) known.push(`Pretraga: ${query}`);
  const category = params.get("category");
  if (category) known.push(`Kategorija: ${category}`);
  const location = params.get("location");
  if (location) known.push(`Lokacija: ${location}`);

  const rest = entries
    .filter(([k]) => !["query", "category", "location"].includes(k))
    .map(([k, v]) => `${k}: ${v}`);

  return [...known, ...rest].join(" • ");
}

export default function SavedSearches() {
    const { navigate } = useNavigate();
  const { savedSearches, renameSavedSearch, removeSavedSearch, clearSavedSearches } = useSavedSearches();

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [clearOpen, setClearOpen] = useState(false);

  const hasAny = savedSearches.length > 0;

  const list = useMemo(() => savedSearches, [savedSearches]);

  const openSearch = (item) => {
    navigate(buildSavedSearchUrl(item.queryString));
  };

  const startRename = (item) => {
    setRenameId(item.id);
    setRenameValue(item.naziv || "");
    setRenameOpen(true);
  };

  const confirmRename = () => {
    if (!renameId) return;
    renameSavedSearch(renameId, renameValue);
    toast.success("Naziv pretrage je sačuvan.");
    setRenameOpen(false);
    setRenameId(null);
    setRenameValue("");
  };

  const startDelete = (item) => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    removeSavedSearch(deleteTarget.id);
    toast.success("Pretraga je obrisana.");
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const confirmClear = () => {
    clearSavedSearches();
    toast.success("Sve spašene pretrage su obrisane.");
    setClearOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Sačuvane pretrage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ovdje su tvoje prečice do omiljenih filtera. Pretrage možeš sačuvati direktno na stranici “Oglasi”.
          </p>
        </div>

        {hasAny ? (
          <Button variant="destructive" onClick={() => setClearOpen(true)}>
            Obriši sve
          </Button>
        ) : null}
      </div>

      {!hasAny ? (
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle>Nemaš spašenih pretraga</CardTitle>
            <CardDescription>
              Otvori oglase, podesi filtere i klikni “Sačuvaj ovu pretragu”.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/ads")}>Idi na oglase</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {list.map((s) => (
            <Card key={s.id} className="border-slate-200/80 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{s.naziv}</CardTitle>
                    <CardDescription className="mt-1 break-words">
                      {formatQueryString(s.queryString)}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openSearch(s)}>
                      <IconExternalLink className="w-4 h-4 mr-2" />
                      Otvori
                    </Button>

                    <Button variant="ghost" size="icon" onClick={() => startRename(s)} aria-label="Preimenuj">
                      <IconPencil className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="icon" onClick={() => startDelete(s)} aria-label="Obriši">
                      <IconTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preimenuj pretragu</DialogTitle>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="savedSearchName">Naziv</Label>
            <Input
              id="savedSearchName"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Npr. Stanovi – Sarajevo – do 200.000"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={confirmRename}>Sačuvaj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ReusableAlertDialog
        open={deleteOpen}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Obrisati pretragu?"
        description="Ova radnja se ne može poništiti."
        cancelText="Otkaži"
        confirmText="Obriši"
      />

      {/* Clear confirm */}
      <ReusableAlertDialog
        open={clearOpen}
        onCancel={() => setClearOpen(false)}
        onConfirm={confirmClear}
        title="Obrisati sve spašene pretrage?"
        description="Ova radnja se ne može poništiti."
        cancelText="Otkaži"
        confirmText="Obriši sve"
      />
    </div>
  );
}
