"use client";

import { useMemo, useState } from "react";
import { toast } from "@/utils/toastBs";
import { MdRocketLaunch } from "@/components/Common/UnifiedIconPack";
import { CalendarDays, Home, Layers3, Sparkles, X } from "@/components/Common/UnifiedIconPack";

import { Button } from "@/components/ui/button";
import { createFeaturedItemApi } from "@/utils/api";

const placementOptions = [
  {
    value: "category",
    label: "Samo kategorija",
    description: "Istakni oglas unutar njegove kategorije.",
    icon: Layers3,
  },
  {
    value: "home",
    label: "Samo naslovna",
    description: "Istakni oglas na naslovnoj stranici.",
    icon: Home,
  },
  {
    value: "category_home",
    label: "Kategorija + naslovna",
    description: "Maksimalna vidljivost na oba mjesta.",
    icon: Sparkles,
  },
];

const durationOptions = [7, 15, 30, 45, 60, 90];

const MakeFeaturedAd = ({ item_id, setProductDetails }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState("category_home");
  const [selectedDuration, setSelectedDuration] = useState(30);

  const selectedPlacementMeta = useMemo(
    () => placementOptions.find((option) => option.value === selectedPlacement),
    [selectedPlacement]
  );

  const handleCreateFeaturedAd = async () => {
    try {
      setIsSubmitting(true);
      const res = await createFeaturedItemApi.createFeaturedItem({
        item_id,
        placement: selectedPlacement,
        duration_days: selectedDuration,
      });

      if (res?.data?.error === false) {
        toast.success(res?.data?.message || "Oglas je uspješno izdvojen.");
        setProductDetails((prev) => ({
          ...prev,
          is_feature: true,
        }));
        setIsModalOpen(false);
        return;
      }

      toast.error(res?.data?.message || "Greška pri izdvajanju oglasa.");
    } catch (error) {
      console.error("create featured ad error", error);
      toast.error("Došlo je do greške prilikom izdvajanja oglasa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              <MdRocketLaunch className="text-2xl" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">
                Izdvajanje oglasa
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
                Podigni oglas na vrh i povećaj vidljivost.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Limiti: standard korisnik do 8 izdvojenih, Pro/Shop do 20 aktivnih oglasa.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-11 w-full rounded-xl bg-amber-500 font-semibold text-white hover:bg-amber-600 sm:w-auto"
          >
            <MdRocketLaunch className="mr-2 text-lg" />
            Izdvoji oglas
          </Button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-xl rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Postavke izdvajanja</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Odaberi gdje će oglas biti istaknut i koliko dugo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Pozicija izdvajanja
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {placementOptions.map((option) => {
                    const isActive = option.value === selectedPlacement;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedPlacement(option.value)}
                        className={[
                          "rounded-2xl border p-3 text-left transition-all",
                          isActive
                            ? "border-primary bg-primary/10 shadow-sm dark:border-primary dark:bg-primary/20"
                            : "border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600",
                        ].join(" ")}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Icon
                            className={[
                              "h-4 w-4",
                              isActive ? "text-primary" : "text-slate-500 dark:text-slate-400",
                            ].join(" ")}
                          />
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {option.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Trajanje
                </p>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((days) => {
                    const isActive = days === selectedDuration;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setSelectedDuration(days)}
                        className={[
                          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all",
                          isActive
                            ? "border-primary bg-primary/10 text-primary dark:border-primary dark:bg-primary/20"
                            : "border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600",
                        ].join(" ")}
                      >
                        <CalendarDays className="h-4 w-4" />
                        {days} dana
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Odabrano: {selectedPlacementMeta?.label} • {selectedDuration} dana
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Nakon potvrde, oglas će biti aktiviran prema ovom planu (ako imaš aktivan paket).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 rounded-xl border-slate-300 dark:border-slate-700"
                  disabled={isSubmitting}
                >
                  Zatvori
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateFeaturedAd}
                  className="h-11 rounded-xl bg-amber-500 font-semibold text-white hover:bg-amber-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Aktiviram..." : "Objavi izdvajanje"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MakeFeaturedAd;
