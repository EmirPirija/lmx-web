"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useNavigate } from "@/components/Common/useNavigate";
import { useSavedSearches } from "@/hooks/useSavedSearches";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const normalizeQueryString = (sp) => {
  const params = new URLSearchParams(sp);

  // Ne računamo lang kao “filter promjenu”
  params.delete("lang");

  // Ako ikad dodaš paginaciju kroz query, obično ne želiš da to utiče na saved search:
  params.delete("page");

  // Sort možeš ostaviti (ja ostavljam), jer je dio “pretrage”
  // params.delete("sort_by");

  // Stabilan poredak
  const entries = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const normalized = new URLSearchParams();
  for (const [k, v] of entries) normalized.append(k, v);

  return normalized.toString();
};

export default function SavedSearchControls() {
  const searchParams = useSearchParams();
  const { navigate } = useNavigate();

  const {
    savedSearches,
    isLoading,
    createSavedSearch,
    renameSavedSearch,
    deleteSavedSearch,
  } = useSavedSearches({ context: "ads" });

  const [isOpen, setIsOpen] = useState(false);
  const [naziv, setNaziv] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renamingValue, setRenamingValue] = useState("");

  const currentQueryString = useMemo(() => {
    return normalizeQueryString(searchParams);
  }, [searchParams]);

  const hasAnyRealParams = useMemo(() => {
    return currentQueryString.trim().length > 0;
  }, [currentQueryString]);

  const alreadySaved = useMemo(() => {
    if (!currentQueryString) return false;
    return savedSearches.some((s) => (s?.query_string || "") === currentQueryString);
  }, [savedSearches, currentQueryString]);

  const selectedValue = useMemo(() => {
    const match = savedSearches.find(
      (s) => (s?.query_string || "") === currentQueryString
    );
    return match ? String(match.id) : "";
  }, [savedSearches, currentQueryString]);

  const handleApply = (id) => {
    const s = savedSearches.find((x) => String(x.id) === String(id));
    if (!s) return;

    const qs = s.query_string ? `?${s.query_string}` : "";
    navigate(`/ads${qs}`);
  };

  const handleSave = async () => {
    if (!hasAnyRealParams) {
      toast.error("Nemaš šta sačuvati — prvo promijeni filtere.");
      return;
    }
    const cleanName = naziv.trim();
    if (!cleanName) {
      toast.error("Upiši naziv pretrage.");
      return;
    }

    try {
      await createSavedSearch({
        name: cleanName,
        query_string: currentQueryString,
      });
      toast.success("Pretraga je sačuvana.");
      setNaziv("");
      setIsOpen(false);
    } catch (e) {
      toast.error("Nisam uspio sačuvati pretragu.");
    }
  };

  const startRename = (s) => {
    setRenamingId(s.id);
    setRenamingValue(s.name || "");
  };

  const submitRename = async () => {
    const name = renamingValue.trim();
    if (!name) {
      toast.error("Naziv ne može biti prazan.");
      return;
    }
    try {
      await renameSavedSearch({ id: renamingId, name });
      toast.success("Pretraga je preimenovana.");
      setRenamingId(null);
      setRenamingValue("");
    } catch {
      toast.error("Nisam uspio preimenovati pretragu.");
    }
  };

  const submitDelete = async (id) => {
    try {
      await deleteSavedSearch({ id });
      toast.success("Pretraga je obrisana.");
    } catch {
      toast.error("Nisam uspio obrisati pretragu.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* LISTA SAČUVANIH */}
      <Select value={selectedValue} onValueChange={handleApply} disabled={isLoading}>
        <SelectTrigger className="w-[210px] h-10 border-gray-200 bg-white focus:ring-1 focus:ring-primary/20 font-medium">
          <SelectValue placeholder={isLoading ? "Učitavam..." : "Sačuvane pretrage"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {savedSearches.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Nemaš sačuvanih pretraga.
              </div>
            ) : (
              savedSearches.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* ⭐ “FINISHING TOUCH” — badge samo kad je nešto promijenjeno/nesačuvano */}
      {hasAnyRealParams && !alreadySaved && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Badge className="cursor-pointer select-none px-3 py-2 h-10 flex items-center gap-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100">
              ⭐ Sačuvaj
            </Badge>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Sačuvaj pretragu</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Ova pretraga će se sačuvati sa trenutnim filterima i sortiranjem.
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Naziv</label>
                <Input
                  value={naziv}
                  onChange={(e) => setNaziv(e.target.value)}
                  placeholder="npr. Stanovi do 1000 KM u Sarajevu"
                />
              </div>

              <div className="rounded-lg border bg-gray-50 px-3 py-2 text-xs text-gray-600 break-all">
                <span className="font-medium">Query:</span>{" "}
                {currentQueryString || "(prazno)"}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Odustani
              </Button>
              <Button onClick={handleSave}>Sačuvaj</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* UPRAVLJANJE (brzo, bez posebne stranice) */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="h-10">
            Upravljaj
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Sačuvane pretrage</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-gray-500">Učitavam pretrage...</div>
            ) : savedSearches.length === 0 ? (
              <div className="text-sm text-gray-500">
                Još nemaš sačuvanih pretraga.
              </div>
            ) : (
              savedSearches.map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    {renamingId === s.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <Input
                          value={renamingValue}
                          onChange={(e) => setRenamingValue(e.target.value)}
                        />
                        <Button onClick={submitRename}>Sačuvaj</Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRenamingId(null);
                            setRenamingValue("");
                          }}
                        >
                          Otkaži
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium">{s.name}</div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleApply(String(s.id))}
                          >
                            Otvori
                          </Button>
                          <Button variant="outline" onClick={() => startRename(s)}>
                            Preimenuj
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => submitDelete(s.id)}
                          >
                            Obriši
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 break-all bg-gray-50 border rounded-md p-2">
                    {s.query_string ? `?${s.query_string}` : "/ads"}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline">Zatvori</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
