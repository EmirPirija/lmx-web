"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
const durationOptionsSet = new Set(durationOptions);
const DEFAULT_PLACEMENT = "category_home";
const DEFAULT_DURATION = 30;
const PLACEMENT_TO_POSITIONS = {
  category: "category",
  home: "home",
  category_home: "category_home",
};

const isValidPlacement = (value) =>
  placementOptions.some((option) => option.value === value);

const normalizePlacement = (value) =>
  isValidPlacement(value) ? value : DEFAULT_PLACEMENT;

const normalizeDuration = (value) => {
  const parsed = Number(value);
  return durationOptionsSet.has(parsed) ? parsed : DEFAULT_DURATION;
};

const getApiErrorMessage = (payload, fallback) => {
  if (!payload || typeof payload !== "object") return fallback;
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  const errors = payload.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === "string" && first.trim()) return first;
    if (first && typeof first.message === "string" && first.message.trim()) {
      return first.message;
    }
  }

  if (errors && typeof errors === "object") {
    const firstKey = Object.keys(errors)[0];
    const firstValue = firstKey ? errors[firstKey] : null;
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
      return firstValue[0];
    }
    if (typeof firstValue === "string" && firstValue.trim()) {
      return firstValue;
    }
  }

  return fallback;
};

const MakeFeaturedAd = ({
  item_id,
  setProductDetails,
  open,
  onOpenChange,
  hideTrigger = false,
  onSuccess,
  initialPlacement = DEFAULT_PLACEMENT,
  initialDuration = DEFAULT_DURATION,
  isAlreadyFeatured = false,
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(DEFAULT_PLACEMENT);
  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION);
  const [portalReady, setPortalReady] = useState(false);
  const submitLockRef = useRef(false);

  const isControlled = typeof open === "boolean";
  const isModalOpen = isControlled ? open : internalModalOpen;

  const setModalOpen = useCallback(
    (nextOpen) => {
      if (!isControlled) {
        setInternalModalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setModalOpen(false);
  }, [isSubmitting, setModalOpen]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    if (typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal]);

  const selectedPlacementMeta = useMemo(
    () =>
      placementOptions.find((option) => option.value === selectedPlacement) ||
      placementOptions.find((option) => option.value === DEFAULT_PLACEMENT),
    [selectedPlacement]
  );

  useEffect(() => {
    if (!isModalOpen) return;
    setSelectedPlacement(normalizePlacement(initialPlacement));
    setSelectedDuration(normalizeDuration(initialDuration));
  }, [initialDuration, initialPlacement, isModalOpen]);

  const handleCreateFeaturedAd = async () => {
    if (isSubmitting || submitLockRef.current) return;
    if (!item_id) {
      toast.error("ID oglasa nije validan.");
      return;
    }

    const normalizedPlacement = normalizePlacement(selectedPlacement);
    const normalizedDuration = normalizeDuration(selectedDuration);

    submitLockRef.current = true;
    try {
      setIsSubmitting(true);
      const positions = PLACEMENT_TO_POSITIONS[normalizedPlacement] || normalizedPlacement;
      const res = await createFeaturedItemApi.createFeaturedItem({
        item_id,
        positions,
        placement: normalizedPlacement,
        duration_days: normalizedDuration,
      });

      if (res?.data?.error === false) {
        toast.success(res?.data?.message || "Oglas je uspješno izdvojen.");
        const featuredPayload = res?.data?.data || {};
        const featuredUntil = featuredPayload?.featured_until || null;
        const featuredExpiresAt = featuredPayload?.featured_expires_at || null;
        const remainingDaysRaw = Number(featuredPayload?.featured_days_left);
        const remainingSecondsRaw = Number(featuredPayload?.featured_seconds_left);
        const remainingDays = Number.isFinite(remainingDaysRaw) ? Math.max(remainingDaysRaw, 0) : null;
        const remainingSeconds = Number.isFinite(remainingSecondsRaw) ? Math.max(remainingSecondsRaw, 0) : null;
        setProductDetails((prev) => ({
          ...prev,
          is_feature: true,
          is_feature_any: true,
          is_feature_home: normalizedPlacement === "home" || normalizedPlacement === "category_home",
          is_feature_category:
            normalizedPlacement === "category" || normalizedPlacement === "category_home",
          featured_placement: normalizedPlacement,
          positions,
          featured_duration_days: normalizedDuration,
          featured_end_date: featuredUntil,
          featured_until: featuredUntil,
          featured_expires_at:
            featuredExpiresAt ||
            (featuredUntil ? `${featuredUntil}T23:59:59` : prev?.featured_expires_at || null),
          featured_days_left: remainingDays,
          featured_seconds_left: remainingSeconds,
        }));
        onSuccess?.(res?.data?.data || null, {
          positions,
          placement: normalizedPlacement,
          duration_days: normalizedDuration,
        });
        closeModal();
        return;
      }

      toast.error(
        getApiErrorMessage(
          res?.data,
          "Izdvajanje nije uspjelo. Provjeri paket/limite i pokušaj ponovo."
        )
      );
    } catch (error) {
      console.error("create featured ad error", error);
      toast.error(
        getApiErrorMessage(
          error?.response?.data,
          error?.message || "Došlo je do greške prilikom izdvajanja oglasa."
        )
      );
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!hideTrigger && (
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
                  {isAlreadyFeatured
                    ? "Uredi postojeće izdvajanje i produži trajanje."
                    : "Podigni oglas na vrh i povećaj vidljivost."}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                  Limiti: standard korisnik do 8 izdvojenih, Pro/Shop do 20 aktivnih oglasa.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setModalOpen(true)}
              className="h-11 w-full rounded-xl bg-amber-500 font-semibold text-white hover:bg-amber-600 sm:w-auto"
            >
              <MdRocketLaunch className="mr-2 text-lg" />
              {isAlreadyFeatured ? "Uredi izdvajanje" : "Izdvoji oglas"}
            </Button>
          </div>
        </div>
      )}

      {portalReady &&
        isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
              disabled={isSubmitting}
              aria-label="Zatvori modal"
            />

            <div className="relative z-10 w-full max-w-xl rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Postavke izdvajanja</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {isAlreadyFeatured
                      ? "Promijeni poziciju i produži trajanje trenutnog izdvajanja."
                      : "Odaberi gdje će oglas biti istaknut i koliko dugo."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
                          onClick={() => setSelectedPlacement(normalizePlacement(option.value))}
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
                          onClick={() => setSelectedDuration(normalizeDuration(days))}
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
                    onClick={closeModal}
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
                    {isSubmitting
                      ? "Spremam..."
                      : isAlreadyFeatured
                      ? "Sačuvaj izdvajanje"
                      : "Objavi izdvajanje"}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default MakeFeaturedAd;
