"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

import {
  CalendarDays,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  EyeOff,
  Home,
  Layers3,
  MoreVertical,
  Rocket,
  RotateCcw,
  Sparkles,
  TransferHorizontalLine,
  Trash2,
  X,
  Youtube,
} from "@/components/Common/UnifiedIconPack";

import CustomImage from "@/components/Common/CustomImage";

import SoldOutModal from "../../PagesComponent/ProductDetail/SoldOutModal";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { formatPriceAbbreviated, formatSalaryRange } from "@/utils";
import { useMediaQuery } from "usehooks-ts";

// ============================================
// POMOĆNE FUNKCIJE
// ============================================

const POSITION_RENEW_COOLDOWN_DAYS = 15;

const parseDateSafe = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const numeric = new Date(value);
    if (!Number.isNaN(numeric.getTime())) return numeric;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  if (typeof value === "string" && value.includes(" ")) {
    const normalized = new Date(value.replace(" ", "T"));
    if (!Number.isNaN(normalized.getTime())) return normalized;
  }

  return null;
};

const getRenewBaselineDate = (item) => {
  if (!item || typeof item !== "object") return null;

  const hasLastRenewedAtField = Object.prototype.hasOwnProperty.call(item, "last_renewed_at");
  if (hasLastRenewedAtField) {
    return parseDateSafe(item?.last_renewed_at) || parseDateSafe(item?.created_at);
  }

  // Backend fallback when DB does not have last_renewed_at column.
  return parseDateSafe(item?.updated_at) || parseDateSafe(item?.created_at);
};

const getRenewNextAllowedDate = (item) => {
  if (!item || typeof item !== "object") return null;

  const candidates = [
    item?.next_position_renew_at,
    item?.next_renewal_at,
    item?.position_renew_available_at,
    item?.renew_available_at,
    item?.renewal_available_at,
    item?.next_refresh_at,
  ];

  for (const candidate of candidates) {
    const parsed = parseDateSafe(candidate);
    if (parsed) return parsed;
  }

  return null;
};

const formatBosnianDays = (days) => {
  if (days === 1) return "1 dan";
  if (days >= 2 && days <= 4) return `${days} dana`;
  return `${days} dana`;
};

const featuredPlacementOptions = [
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

const featuredDurationOptions = [7, 15, 30, 45, 60, 90];

const getKeyAttributes = (item) => {
  const attributes = [];
  const customFields = item?.translated_custom_fields || [];

  const findValue = (keys) => {
    const field = customFields.find((f) => {
      const name = normalizeText(f?.translated_name || f?.name || "");
      return keys.some((key) => name === normalizeText(key));
    });

    return (
      field?.translated_selected_values?.[0] ||
      field?.selected_values?.[0] ||
      field?.value?.[0] ||
      field?.value
    );
  };

  const year = findValue(["godište", "godiste"]);
  if (year) attributes.push(year);

  const fuel = findValue(["gorivo"]);
  if (fuel) attributes.push(fuel);

  const transmission = findValue(["mjenjač", "mjenjac"]);
  if (transmission) attributes.push(transmission);

  return attributes;
};

const getConditionLabel = (item) => {
  const customFields = item?.translated_custom_fields || [];
  const field = customFields.find((f) => {
    const name = normalizeText(f?.translated_name || f?.name || "");
    return ["stanje oglasa", "stanje", "condition", "item condition"].includes(name);
  });

  const rawValue =
    field?.translated_selected_values?.[0] ||
    field?.selected_values?.[0] ||
    field?.value?.[0] ||
    field?.value;
  if (!rawValue) return "";

  const normalized = normalizeText(rawValue);
  if (["novo", "new", "nekoristeno", "unused"].includes(normalized)) return "Novo";
  if (["koristeno", "used", "polovno", "rabljeno"].includes(normalized)) return "Korišteno";
  return String(rawValue).trim();
};

// Funkcija koja vraća najviše 3 tačke za indikaciju
const getThreeDots = (total, current) => {
  if (total <= 3) {
    return Array.from({ length: total }, (_, i) => i);
  }

  if (current === 0) {
    return [0, 1, 2];
  }

  if (current === total - 1) {
    return [total - 3, total - 2, total - 1];
  }

  return [current - 1, current, current + 1];
};

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const toBoolean = (value) => {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;

  const normalized = normalizeText(value);
  if (!normalized) return null;

  if (
    [
      "true",
      "yes",
      "da",
      "odmah",
      "dostupno",
      "dostupan",
      "moguce",
      "moguca",
      "moze",
      "ukljuceno",
      "enabled",
      "on",
      "active",
      "aktivan",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "no",
      "ne",
      "nije",
      "nedostupno",
      "nedostupan",
      "nemoguce",
      "nemoguca",
      "ne moze",
      "iskljuceno",
      "disabled",
      "off",
      "inactive",
      "neaktivan",
    ].includes(normalized)
  ) {
    return false;
  }

  return null;
};

const parseJsonSafe = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const readBooleanFromCustomFields = (customFieldsValue, keys = []) => {
  const keysSet = new Set(keys);
  const customFields = parseJsonSafe(customFieldsValue);
  if (!customFields || typeof customFields !== "object") return null;

  const walk = (node) => {
    if (!node || typeof node !== "object") return null;

    for (const [key, value] of Object.entries(node)) {
      if (keysSet.has(key)) {
        const parsed = toBoolean(value);
        if (parsed !== null) return parsed;
      }

      if (value && typeof value === "object") {
        const nested = walk(value);
        if (nested !== null) return nested;
      }
    }

    return null;
  };

  return walk(customFields);
};

const readAvailableFromTranslatedFields = (item = {}) => {
  const fields = [
    ...(Array.isArray(item?.translated_custom_fields) ? item.translated_custom_fields : []),
    ...(Array.isArray(item?.all_translated_custom_fields) ? item.all_translated_custom_fields : []),
  ];

  for (const field of fields) {
    const fieldName = normalizeText(field?.translated_name || field?.name || "");
    if (!fieldName) continue;
    if (!["dostup", "available", "odmah", "isporuk", "ready"].some((hint) => fieldName.includes(hint))) {
      continue;
    }

    const values = [
      field?.translated_selected_values,
      field?.selected_values,
      field?.value,
      field?.translated_value,
      field?.selected_value,
      field?.translated_selected_value,
    ];

    for (const candidate of values) {
      if (Array.isArray(candidate)) {
        for (const nested of candidate) {
          const parsedNested = toBoolean(nested);
          if (parsedNested !== null) return parsedNested;
        }
      } else {
        const parsed = toBoolean(candidate);
        if (parsed !== null) return parsed;
      }
    }
  }

  return null;
};

const readAvailableNow = (item = {}) => {
  const directCandidates = [
    item?.available_now,
    item?.is_available,
    item?.is_avaible,
    item?.isAvailable,
    item?.availableNow,
    item?.dostupno_odmah,
    item?.ready_for_pickup,
    item?.translated_item?.available_now,
    item?.translated_item?.is_available,
    item?.translated_item?.is_avaible,
    item?.translated_item?.isAvailable,
    item?.translated_item?.availableNow,
    item?.translated_item?.dostupno_odmah,
    item?.translated_item?.ready_for_pickup,
  ];

  for (const candidate of directCandidates) {
    const parsed = toBoolean(candidate);
    if (parsed !== null) return parsed;
  }

  const fromCustomFields = readBooleanFromCustomFields(item?.custom_fields, [
    "available_now",
    "is_available",
    "is_avaible",
    "isAvailable",
    "availableNow",
    "dostupno_odmah",
    "ready_for_pickup",
  ]);
  if (fromCustomFields !== null) return fromCustomFields;

  const fromTranslatedFields = readAvailableFromTranslatedFields(item);
  if (fromTranslatedFields !== null) return fromTranslatedFields;

  return null;
};

const readExchangeFromTranslatedFields = (item = {}) => {
  const fields = [
    ...(Array.isArray(item?.translated_custom_fields) ? item.translated_custom_fields : []),
    ...(Array.isArray(item?.all_translated_custom_fields) ? item.all_translated_custom_fields : []),
  ];

  for (const field of fields) {
    const fieldName = normalizeText(field?.translated_name || field?.name || "");
    if (!fieldName) continue;
    if (!["zamjen", "zamena", "exchange", "trade", "swap"].some((hint) => fieldName.includes(hint))) {
      continue;
    }

    const values = [
      field?.translated_selected_values,
      field?.selected_values,
      field?.value,
      field?.translated_value,
      field?.selected_value,
      field?.translated_selected_value,
    ];

    for (const candidate of values) {
      if (Array.isArray(candidate)) {
        for (const nested of candidate) {
          const parsedNested = toBoolean(nested);
          if (parsedNested !== null) return parsedNested;
        }
      } else {
        const parsed = toBoolean(candidate);
        if (parsed !== null) return parsed;
      }
    }
  }

  return null;
};

const readExchangePossible = (item = {}) => {
  const directCandidates = [
    item?.exchange_possible,
    item?.is_exchange,
    item?.is_exchange_possible,
    item?.allow_exchange,
    item?.exchange,
    item?.zamjena,
    item?.zamena,
    item?.translated_item?.exchange_possible,
    item?.translated_item?.is_exchange,
    item?.translated_item?.allow_exchange,
    item?.translated_item?.zamjena,
  ];

  for (const candidate of directCandidates) {
    const parsed = toBoolean(candidate);
    if (parsed !== null) return parsed;
  }

  const fromCustomFields = readBooleanFromCustomFields(item?.custom_fields, [
    "exchange_possible",
    "is_exchange",
    "is_exchange_possible",
    "allow_exchange",
    "exchange",
    "zamjena",
    "zamena",
    "trade",
    "swap",
  ]);
  if (fromCustomFields !== null) return fromCustomFields;

  const fromTranslatedFields = readExchangeFromTranslatedFields(item);
  if (fromTranslatedFields !== null) return fromTranslatedFields;

  return false;
};

// ============================================
// UI KOMPONENTE
// ============================================

const OverlayPill = ({ icon: Icon, children, className }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5",
      "px-2 py-1 rounded-lg border text-[11px] font-semibold",
      "bg-white/90 backdrop-blur-sm",
      "shadow-sm",
      className
    )}
  >
    {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
    {children}
  </div>
);

const formatPriceOrInquiry = (price) => {
  if (price === null || price === undefined) return "Na upit";
  if (typeof price === "string" && price.trim() === "") return "Na upit";
  if (Number(price) === 0) return "Na upit";
  return formatPriceAbbreviated(Number(price));
};

// ============================================
// FEATURED PLAN MODAL
// ============================================

const FeaturedPlanModal = ({
  isOpen,
  onClose,
  placement,
  duration,
  onPlacementChange,
  onDurationChange,
  onConfirm,
  isSubmitting = false,
}) => {
  const selectedPlacementMeta = useMemo(
    () => featuredPlacementOptions.find((option) => option.value === placement),
    [placement]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 26, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Postavke izdvajanja</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Odaberi gdje će oglas biti istaknut i koliko dugo.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
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
                {featuredPlacementOptions.map((option) => {
                  const isActive = option.value === placement;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onPlacementChange(option.value)}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition-all",
                        isActive
                          ? "border-primary bg-primary/10 shadow-sm dark:border-primary dark:bg-primary/20"
                          : "border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600"
                      )}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isActive ? "text-primary" : "text-slate-500 dark:text-slate-400"
                          )}
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
                {featuredDurationOptions.map((days) => {
                  const isActive = days === duration;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => onDurationChange(days)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all",
                        isActive
                          ? "border-primary bg-primary/10 text-primary dark:border-primary dark:bg-primary/20"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                      )}
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
                Odabrano: {selectedPlacementMeta?.label} • {duration} dana
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Nakon potvrde, oglas će biti aktiviran prema ovom planu (ako imaš aktivan paket).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 rounded-xl border-slate-300 dark:border-slate-700"
                disabled={isSubmitting}
              >
                Zatvori
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                className="h-11 rounded-xl bg-amber-500 font-semibold text-white hover:bg-amber-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Aktiviram..." : "Objavi izdvajanje"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// ============================================
// SMART QUICK ACTIONS KOMPONENTA
// ============================================

const SmartQuickActionsPanel = ({
  isVisible,
  isMobile,
  onClose,
  onSelect,
  onFeature,
  onReserve,
  onRemoveReservation,
  onEdit,
  onDelete,
  onHide,
  onSold,
  onActivate,
  onRenew,
  isSelected,
  isApproved,
  isEditable,
  isSoldOut,
  isInactive,
  isExpired,
  isFeatureAd,
  isReserved,
  canPositionRenew,
  renewAvailabilityHint,
}) => {
  const actions = useMemo(
    () =>
      [
        {
          key: "renew",
          icon: RotateCcw,
          label: isExpired ? "Obnovi oglas" : "Obnovi poziciju",
          description: isExpired
            ? "Vrati oglas među aktivne i produži trajanje."
            : "Podigni oglas na vrh ne-istaknutih oglasa.",
          onClick: onRenew,
          show: isExpired || canPositionRenew,
          tone: "violet",
          kind: "normal",
        },
        {
          key: "activate",
          icon: Eye,
          label: "Aktiviraj",
          description: "Ponovo prikaži oglas kupcima.",
          onClick: onActivate,
          show: isInactive,
          tone: "emerald",
          kind: "normal",
        },
        {
          key: "hide",
          icon: EyeOff,
          label: "Sakrij",
          description: "Privremeno sakrij oglas iz pretrage.",
          onClick: onHide,
          show: isApproved && !isInactive,
          tone: "amber",
          kind: "normal",
        },
        {
          key: "feature",
          icon: Rocket,
          label: "Izdvoji oglas",
          description: "Povećaj vidljivost na kategoriji i/ili naslovnoj.",
          onClick: onFeature,
          show: isApproved && !isSoldOut && !isFeatureAd,
          tone: "amber",
          kind: "normal",
        },
        {
          key: "reserve",
          icon: Clock,
          label: "Označi rezervisano",
          description: "Privremeno rezerviši oglas za dogovorenog kupca.",
          onClick: onReserve,
          show: isApproved && !isSoldOut && !isInactive && !isReserved,
          tone: "slate",
          kind: "normal",
        },
        {
          key: "unreserve",
          icon: X,
          label: "Ukloni rezervaciju",
          description: "Vrati oglas u standardno aktivno stanje.",
          onClick: onRemoveReservation,
          show: isReserved,
          tone: "slate",
          kind: "normal",
        },
        {
          key: "edit",
          icon: Edit,
          label: "Uredi oglas",
          description: "Promijeni naslov, cijenu i detalje oglasa.",
          onClick: onEdit,
          show: isEditable,
          tone: "blue",
          kind: "normal",
        },
        {
          key: "sold",
          icon: CheckCircle,
          label: "Označi kao prodano",
          description: "Zaključi oglas i spremi ishod prodaje.",
          onClick: onSold,
          show: isApproved && !isSoldOut,
          tone: "teal",
          kind: "normal",
        },
        {
          key: "select",
          icon: CheckSquare,
          label: isSelected ? "Poništi odabir" : "Odaberi za bulk",
          description: "Dodaj oglas u grupne akcije.",
          onClick: onSelect,
          show: isExpired,
          tone: "slate",
          kind: "normal",
        },
        {
          key: "delete",
          icon: Trash2,
          label: "Izbriši oglas",
          description: "Trajno ukloni oglas iz profila.",
          onClick: onDelete,
          show: true,
          tone: "rose",
          kind: "danger",
        },
      ].filter((action) => action.show),
    [
      canPositionRenew,
      isApproved,
      isEditable,
      isExpired,
      isFeatureAd,
      isInactive,
      isReserved,
      isSelected,
      isSoldOut,
      onActivate,
      onDelete,
      onEdit,
      onFeature,
      onHide,
      onRemoveReservation,
      onRenew,
      onReserve,
      onSelect,
      onSold,
    ]
  );

  const recommendedActionKey = isExpired
    ? "renew"
    : isInactive
      ? "activate"
      : isReserved
        ? "unreserve"
      : isApproved && !isSoldOut && !isFeatureAd
        ? "feature"
      : isApproved && !isSoldOut && isEditable
        ? "edit"
        : canPositionRenew
          ? "renew"
          : "delete";

  const recommendedAction =
    actions.find((action) => action.key === recommendedActionKey) || actions[0] || null;

  const secondaryActions = actions.filter(
    (action) => action.key !== recommendedAction?.key && action.kind !== "danger"
  );
  const dangerActions = actions.filter((action) => action.kind === "danger");

  const panelHint = isExpired
    ? "Oglas je istekao, obnova je sada najvažnija."
    : isInactive
      ? "Oglas je skriven, aktiviraj ga kad budeš spreman."
      : "Biraj akcije prema cilju: uređivanje, prodaja ili optimizacija pozicije.";

  const toneClass = {
    blue: "border-blue-200/80 bg-blue-50/90 text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/80 dark:bg-blue-950/45 dark:text-blue-200 dark:hover:bg-blue-900/45",
    emerald:
      "border-emerald-200/80 bg-emerald-50/90 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900/80 dark:bg-emerald-950/45 dark:text-emerald-200 dark:hover:bg-emerald-900/45",
    amber:
      "border-amber-200/80 bg-amber-50/90 text-amber-700 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-900/80 dark:bg-amber-950/45 dark:text-amber-200 dark:hover:bg-amber-900/45",
    violet:
      "border-violet-200/80 bg-violet-50/90 text-violet-700 hover:border-violet-300 hover:bg-violet-100 dark:border-violet-900/80 dark:bg-violet-950/45 dark:text-violet-200 dark:hover:bg-violet-900/45",
    teal: "border-teal-200/80 bg-teal-50/90 text-teal-700 hover:border-teal-300 hover:bg-teal-100 dark:border-teal-900/80 dark:bg-teal-950/45 dark:text-teal-200 dark:hover:bg-teal-900/45",
    slate:
      "border-slate-200/90 bg-slate-50/90 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700/80",
    rose: "border-rose-200/80 bg-rose-50/90 text-rose-700 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/80 dark:bg-rose-950/45 dark:text-rose-200 dark:hover:bg-rose-900/45",
  };

  const runAction = (event, action) => {
    event.preventDefault();
    event.stopPropagation();
    action.onClick?.();
    onClose();
  };

  useEffect(() => {
    if (!isVisible) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isVisible]);

  return (
    typeof document === "undefined"
      ? null
      : createPortal(
          <AnimatePresence>
            {isVisible ? (
              <>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[85] bg-slate-950/45 backdrop-blur-[2px]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }}
                  aria-label="Zatvori panel akcija"
                />

                <div
                  className={cn(
                    "fixed left-1/2 top-1/2 z-[90] -translate-x-1/2 -translate-y-1/2",
                    isMobile
                      ? "w-[min(560px,calc(100vw-1.5rem))]"
                      : "w-[min(560px,calc(100vw-2.5rem))]"
                  )}
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.98 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "overflow-hidden border border-slate-200/90 bg-white/95 p-3 shadow-[0_32px_70px_-40px_rgba(15,23,42,0.7)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 sm:p-4",
                      isMobile
                        ? "max-h-[82vh] overflow-y-auto rounded-2xl"
                        : "max-h-[80vh] overflow-y-auto rounded-3xl"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Pametne akcije oglasa
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{panelHint}</p>
                      {renewAvailabilityHint ? (
                        <p className="mt-1 text-[11px] font-medium text-violet-600 dark:text-violet-300">
                          {renewAvailabilityHint}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose();
                      }}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:scale-105 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      aria-label="Zatvori brze akcije"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {recommendedAction ? (
                    <button
                      type="button"
                      onClick={(e) => runAction(e, recommendedAction)}
                      className={cn(
                        "group mb-3 flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                        toneClass[recommendedAction.tone]
                      )}
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm dark:bg-slate-900/70">
                        <recommendedAction.icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">Preporučeno: {recommendedAction.label}</span>
                        <span className="block text-xs opacity-80">{recommendedAction.description}</span>
                      </span>
                    </button>
                  ) : null}

                  {secondaryActions.length ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {secondaryActions.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          onClick={(e) => runAction(e, action)}
                          className={cn(
                            "group flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                            toneClass[action.tone]
                          )}
                        >
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm dark:bg-slate-900/70">
                            <action.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold leading-tight">{action.label}</span>
                            <span className="block text-[11px] opacity-80">{action.description}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {dangerActions.length ? (
                    <div className="mt-3 border-t border-slate-200/80 pt-3 dark:border-slate-700">
                      {dangerActions.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          onClick={(e) => runAction(e, action)}
                          className={cn(
                            "group flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50",
                            toneClass[action.tone]
                          )}
                        >
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm dark:bg-slate-900/70">
                            <action.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold leading-tight">{action.label}</span>
                            <span className="block text-[11px] opacity-80">{action.description}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  </motion.div>
                </div>
              </>
            ) : null}
          </AnimatePresence>,
          document.body
        )
  );
};

// ============================================
// KARTICA
// ============================================

const MyAdsCard = ({
  data,
  isApprovedSort,
  isSelected = false,
  isSelectable = false,
  onSelectionToggle,
  onContextMenuAction,
}) => {
  const isJobCategory = Number(data?.category?.is_job_category) === 1;
  const translatedItem = data?.translated_item;

  const keyAttributes = getKeyAttributes(data);
  const conditionLabel = getConditionLabel(data);
  const availableNow = readAvailableNow(data);
  const topStatusCount = [Boolean(conditionLabel), Boolean(availableNow)].filter(Boolean).length;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardShellRef = useRef(null);
  const isMobile = useMediaQuery("(max-width: 639px)");
  
  // NOVI STATE ZA QUICK ACTIONS
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isFeaturedPlanOpen, setIsFeaturedPlanOpen] = useState(false);
  const [selectedFeaturePlacement, setSelectedFeaturePlacement] = useState("category_home");
  const [selectedFeatureDuration, setSelectedFeatureDuration] = useState(30);

  // MODAL ZA PRODANO
  const [isSoldOutDialogOpen, setIsSoldOutDialogOpen] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);

  // Refovi za dodir/klizanje
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  // Long press za mobilne
  const longPressTimer = useRef(null);
  const [, setIsLongPressing] = useState(false);

  useEffect(() => {
    if (!showQuickActions) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowQuickActions(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showQuickActions]);

  const status = data?.status;
  const isExpired = status === "expired";
  const isInactive = status === "inactive";
  const isSoldOut = status === "sold out";
  const isReserved =
    status === "reserved" || data?.reservation_status === "reserved";
  const isApproved =
    status === "approved" || status === "featured" || status === "reserved";
  const isEditable = isApproved;
  const isFeatureAd = Boolean(data?.is_feature);
  const nextPositionRenewAtFromApi = getRenewNextAllowedDate(data);
  const baselineRenewDate = getRenewBaselineDate(data);
  const nextPositionRenewAt = nextPositionRenewAtFromApi
    ? nextPositionRenewAtFromApi
    : baselineRenewDate
      ? new Date(
          baselineRenewDate.getTime() +
            POSITION_RENEW_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
        )
      : null;
  const isPositionRenewWindowOpen = nextPositionRenewAt ? Date.now() >= nextPositionRenewAt.getTime() : false;
  const canPositionRenew =
    isApproved &&
    !isSoldOut &&
    !isExpired &&
    !isFeatureAd &&
    !isReserved &&
    isPositionRenewWindowOpen;
  const shouldShowPositionRenewHint =
    isApproved &&
    !isSoldOut &&
    !isExpired &&
    !isFeatureAd &&
    !isReserved &&
    Boolean(nextPositionRenewAt) &&
    !isPositionRenewWindowOpen;
  const positionRenewDaysLeft = nextPositionRenewAt
    ? Math.max(1, Math.ceil((nextPositionRenewAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;
  const shouldShowRenewHint =
    isApproved &&
    !isSoldOut &&
    !isExpired &&
    !isFeatureAd &&
    !isReserved &&
    Boolean(nextPositionRenewAt);
  const renewAvailabilityHint = shouldShowRenewHint
    ? isPositionRenewWindowOpen
      ? "Besplatna obnova pozicije je dostupna sada."
      : `Besplatna obnova pozicije za ${formatBosnianDays(positionRenewDaysLeft)}.`
    : null;

  const hasVideo = !!(data?.video_link && String(data?.video_link).trim() !== "");
  const exchangePossible = readExchangePossible(data);
  const isHidePrice = isJobCategory
    ? [data?.min_salary, data?.max_salary].every(
        (val) =>
          val === null ||
          val === undefined ||
          (typeof val === "string" && val.trim() === "")
      )
    : data?.price === null ||
      data?.price === undefined ||
      (typeof data?.price === "string" && data?.price.trim() === "");

  // Logika za sniženje
  const isOnSale = data?.is_on_sale === true || data?.is_on_sale === 1;
  const oldPrice = data?.old_price;
  const currentPrice = data?.price;

  const discountPercentage = useMemo(() => {
    const explicit = Number(data?.discount_percentage || 0);
    if (explicit > 0) return explicit;

    if (!isOnSale) return 0;
    if (!oldPrice || !currentPrice) return 0;

    const oldN = Number(oldPrice);
    const curN = Number(currentPrice);
    if (!Number.isFinite(oldN) || !Number.isFinite(curN) || oldN <= curN) return 0;

    return Math.round(((oldN - curN) / oldN) * 100);
  }, [data?.discount_percentage, isOnSale, oldPrice, currentPrice]);

  // Priprema slajdova (slike + "pogledaj više")
  const slides = useMemo(() => {
    const s = [];
    const seen = new Set();

    const pushImage = (src) => {
      if (!src) return;
      if (seen.has(src)) return;
      seen.add(src);
      s.push({ type: "image", src });
    };

    pushImage(data?.image);

    if (Array.isArray(data?.gallery_images) && data.gallery_images.length) {
      data.gallery_images.forEach((img) => {
        const src = img?.image || img;
        pushImage(src);
      });
    }

    s.push({ type: "viewMore" });
    return s;
  }, [data?.image, data?.gallery_images]);

  const totalSlides = slides.length;

  const isViewMoreSlide = slides[currentSlide]?.type === "viewMore";

  const threeDots = useMemo(
    () => getThreeDots(totalSlides, currentSlide),
    [totalSlides, currentSlide]
  );

  // Kontrole za slajder
  const handlePrevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleNextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const goToSlide = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(index);
  };

  // Logika za dodir
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX || 0;
    
    // Long press logic
    if (!isSelectable) {
      setIsLongPressing(true);
      longPressTimer.current = setTimeout(() => {
        setShowQuickActions(true);
        setIsLongPressing(false);
      }, 500); // 500ms za long press
    }
  };
  
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches?.[0]?.clientX || 0;
    
    // Otkaži long press ako korisnik pomjera prst
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      setIsLongPressing(false);
    }
  };
  
  const handleTouchEnd = () => {
    // Otkaži long press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      setIsLongPressing(false);
    }
    
    if (isSelectable) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    if (Math.abs(swipeDistance) <= 50) return;

    if (swipeDistance > 0 && currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else if (swipeDistance < 0 && currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSoldOutClick = () => {
    setIsSoldOutDialogOpen(true);
  };

  const handleSoldOutAction = (salePayload = null) => {
    const payload = salePayload && typeof salePayload === "object"
      ? salePayload
      : { buyerId: selectedBuyerId ?? null };
    onContextMenuAction?.("markAsSoldOut", data?.id, payload);
    setIsSoldOutDialogOpen(false);
  };

  const handleFeatureSubmit = () => {
    onContextMenuAction?.("feature", data?.id, {
      placement: selectedFeaturePlacement,
      duration_days: selectedFeatureDuration,
    });
    setIsFeaturedPlanOpen(false);
  };

  const title = translatedItem?.name || data?.name;

  const cardContent = (
    <div
      className={cn(
        "group relative flex flex-col h-full overflow-hidden",
        "bg-white rounded-xl border border-slate-100",
        "transition-all duration-200",
        isSelected ? "ring-2 ring-primary/70 bg-primary/5 shadow-sm" : "hover:shadow-sm",
        "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (isSoldOutDialogOpen || isFeaturedPlanOpen) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (isSelectable) {
          e.preventDefault();
          onSelectionToggle?.();
        } else if (showQuickActions) {
          e.preventDefault();
          setShowQuickActions(false);
        } else {
          // Normalan klik - idi na link
          window.location.href = `/my-listing/${data?.slug}`;
        }
      }}
      onDoubleClick={(e) => {
        if (!isSelectable) {
          e.preventDefault();
          setShowQuickActions(true);
        }
      }}
      onContextMenu={(e) => {
        if (!isSelectable) {
          e.preventDefault();
          setShowQuickActions(true);
        }
      }}
    >
      {/* MEDIJ */}
      <div
        className={cn("relative overflow-visible", "rounded-t-xl", "touch-pan-y")}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative aspect-square bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {slides[currentSlide].type === "image" ? (
                <CustomImage
                  src={slides[currentSlide].src}
                  width={420}
                  height={420}
                  className="w-full h-full object-cover"
                  alt={title || "listing"}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-primary/5">
                  <motion.div
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/15"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </motion.div>
                  <p className="text-sm font-semibold text-slate-900 text-center">Detalji</p>
                  <p className="text-xs text-slate-500 text-center mt-1">Otvori oglas</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Odabir */}
          {isSelectable && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="absolute top-2 left-2 z-30"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelectionToggle}
                className={cn(
                  "h-5 w-5",
                  "bg-white shadow-sm border border-slate-200",
                  "data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                )}
              />
            </motion.div>
          )}

          {/* Dugme za quick actions gore-desno */}
          <div className="absolute top-2 right-2 z-30">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQuickActions((prev) => !prev);
                }}
                className={cn(
                  "h-8 w-8 rounded-full",
                  "bg-white/90 backdrop-blur-sm dark:bg-slate-900/90",
                  "border-slate-200 dark:border-slate-700 shadow-sm",
                  "transition-all duration-200",
                  isMobile || isHovered || showQuickActions
                    ? "opacity-100"
                    : "pointer-events-none opacity-0",
                  "hover:bg-white dark:hover:bg-slate-900 hover:border-primary/30",
                  showQuickActions &&
                    "border-primary/40 bg-white text-primary dark:bg-slate-900 dark:border-primary/40 dark:text-primary"
                )}
                title={showQuickActions ? "Zatvori brze akcije" : "Prikaži brze akcije"}
                aria-label={showQuickActions ? "Zatvori brze akcije" : "Prikaži brze akcije"}
                aria-expanded={showQuickActions}
              >
                <motion.span
                  animate={{ rotate: showQuickActions ? 90 : 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="inline-flex"
                >
                  <MoreVertical
                    className={cn(
                      "w-4 h-4 transition-colors",
                      showQuickActions
                        ? "text-primary"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                  />
                </motion.span>
              </Button>
            </motion.div>
          </div>

          {/* Meta informacije dolje-lijevo */}
          {!isViewMoreSlide && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-2 right-2 z-20 flex items-center gap-2"
            >
              {hasVideo ? (
                <OverlayPill icon={Youtube} className="text-red-700 bg-red-100/90 border-red-200">
                  Video
                </OverlayPill>
              ) : null}
            </motion.div>
          )}

          {/* Status strip na prijelomu slike i donjeg bijelog dijela */}
          {!isViewMoreSlide && (conditionLabel || availableNow) ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="pointer-events-none absolute left-2 right-2 -bottom-3 z-30 flex flex-wrap items-center gap-1.5"
            >
              {conditionLabel ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1",
                    "text-[10px] font-semibold leading-none",
                    "border-slate-300 bg-white/95 text-slate-700 shadow-sm",
                    "dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-200"
                  )}
                >
                  {conditionLabel}
                </span>
              ) : null}

              {availableNow ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1",
                    "text-[10px] font-semibold leading-none",
                    "border-emerald-300 bg-emerald-100/95 text-emerald-800 shadow-sm",
                    "dark:border-emerald-700/70 dark:bg-emerald-900/40 dark:text-emerald-200"
                  )}
                >
                  Dostupno
                </span>
              ) : null}
            </motion.div>
          ) : null}

          {/* Tačkice */}
          {/* {totalSlides > 1 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "absolute bottom-2 right-2 z-20 hidden sm:flex items-center gap-1.5 transition-all duration-200",
                isHovered || showQuickActions
                  ? "opacity-100"
                  : "pointer-events-none translate-y-1 opacity-0"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  "px-2 py-1 rounded-full",
                  "bg-black/20 backdrop-blur-sm",
                  "border border-white/15"
                )}
              >
                {threeDots.map((index) => {
                  const isActive = index === currentSlide;
                  return (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={(e) => goToSlide(e, index)}
                      className={cn(
                        "h-1.5 rounded-full",
                        isActive ? "bg-white" : "bg-white/70"
                      )}
                      aria-label={`Slide ${index + 1}`}
                      initial={false}
                      animate={{
                        width: isActive ? 24 : 6
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  );
                })}
              </div>
            </motion.div>
          ) : null} */}

          {/* Strelice za prethodnu/sljedeću sliku */}
          {totalSlides > 1 && (
            <>
              {currentSlide > 0 && (
                <motion.button
                  type="button"
                  onClick={handlePrevSlide}
                  className={cn(
                    "absolute ltr:left-2 rtl:right-2 top-1/2 -translate-y-1/2 z-20",
                    "hidden sm:flex items-center justify-center",
                    "w-8 h-8 rounded-full",
                    "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm",
                    "transition-all duration-200",
                    isHovered
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 ltr:-translate-x-3 rtl:translate-x-3",
                    isSelectable ? "pointer-events-none opacity-0" : ""
                  )}
                  aria-label="Prethodna slika"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    x: isHovered ? 0 : -20
                  }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-4 h-4 text-slate-700 rtl:rotate-180" />
                </motion.button>
              )}

              {currentSlide < totalSlides - 1 && (
                <motion.button
                  type="button"
                  onClick={handleNextSlide}
                  className={cn(
                    "absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 z-20",
                    "hidden sm:flex items-center justify-center",
                    "w-8 h-8 rounded-full",
                    "bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm",
                    "transition-all duration-200",
                    isHovered
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 ltr:translate-x-3 rtl:-translate-x-3",
                    isSelectable ? "pointer-events-none opacity-0" : ""
                  )}
                  aria-label="Sljedeća slika"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    x: isHovered ? 0 : 20
                  }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-4 h-4 text-slate-700 rtl:rotate-180" />
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>

      {/* SADRŽAJ */}
      <div
        className={cn(
          "flex flex-col gap-2 p-3 flex-1",
          topStatusCount >= 2 ? "pt-5" : topStatusCount >= 1 ? "pt-8" : null
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <motion.h3
            whileHover={{ color: "hsl(var(--primary))" }}
            className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors"
          >
            {title}
          </motion.h3>
          {data?.is_feature ? (
            <span
              className="mt-0.5 inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center text-slate-500 dark:text-slate-300"
              title="Istaknuti oglas"
              aria-label="Istaknuti oglas"
            >
              <Rocket className="h-4 w-4 text-amber-500 dark:text-amber-300" />
            </span>
          ) : null}
        </div>

        {Array.isArray(keyAttributes) && keyAttributes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {keyAttributes.map((attr, index) => (
              <motion.span
                key={`${attr}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "inline-flex items-center",
                  "px-2 py-0.5 rounded-md border",
                  "bg-slate-50 text-slate-700 border-slate-100",
                  "text-[10px] font-semibold"
                )}
              >
                {attr}
              </motion.span>
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            "mt-auto pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center",
            exchangePossible && !isHidePrice ? "justify-between" : "justify-end"
          )}
        >
          {exchangePossible && !isHidePrice ? (
            <span
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-full border",
                "border-cyan-300 bg-cyan-100/95 text-cyan-700 shadow-sm",
                "dark:border-cyan-700/70 dark:bg-cyan-900/40 dark:text-cyan-200"
              )}
              title="Zamjena moguća"
              aria-label="Zamjena moguća"
            >
              <TransferHorizontalLine className="h-4 w-4" />
            </span>
          ) : null}

          {!isHidePrice ? (
            isJobCategory ? (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-bold text-slate-900 dark:text-slate-100"
              >
                {formatSalaryRange(data?.min_salary, data?.max_salary)}
              </motion.span>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-end leading-none"
              >
                {isOnSale && Number(oldPrice) > 0 && Number(currentPrice) > 0 && Number(oldPrice) > Number(currentPrice) ? (
                  <span className="text-[11px] font-semibold text-slate-400 line-through tabular-nums">
                    {formatPriceAbbreviated(Number(oldPrice))}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    isOnSale &&
                      Number(oldPrice) > 0 &&
                      Number(currentPrice) > 0 &&
                      Number(oldPrice) > Number(currentPrice)
                      ? "text-rose-600"
                      : "text-slate-900 dark:text-slate-100"
                  )}
                  title={formatPriceOrInquiry(data?.price)}
                >
                  {formatPriceOrInquiry(data?.price)}
                </span>
              </motion.div>
            )
          ) : null}
        </div>
      </div>

      {/* MODAL ZA PRODANO */}
      <SoldOutModal
        productDetails={data}
        showSoldOut={isSoldOutDialogOpen}
        setShowSoldOut={setIsSoldOutDialogOpen}
        selectedRadioValue={selectedBuyerId}
        setSelectedRadioValue={setSelectedBuyerId}
        onSaleComplete={handleSoldOutAction}
      />
    </div>
  );

  return (
    <motion.div ref={cardShellRef} layout className="relative h-full">
      {cardContent}

      <SmartQuickActionsPanel
        isVisible={showQuickActions}
        isMobile={isMobile}
        onClose={() => setShowQuickActions(false)}
        onSelect={() => onContextMenuAction?.("select", data?.id)}
        onFeature={() => {
          setShowQuickActions(false);
          setIsFeaturedPlanOpen(true);
        }}
        onReserve={() => onContextMenuAction?.("reserve", data?.id)}
        onRemoveReservation={() => onContextMenuAction?.("unreserve", data?.id)}
        onEdit={() => onContextMenuAction?.("edit", data?.id)}
        onDelete={() => onContextMenuAction?.("delete", data?.id)}
        onHide={() => onContextMenuAction?.("deactivate", data?.id)}
        onActivate={() => onContextMenuAction?.("activate", data?.id)}
        onSold={handleSoldOutClick}
        onRenew={() => onContextMenuAction?.("renew", data?.id)}
        isSelected={isSelected}
        isApproved={isApproved}
        isEditable={isEditable}
        isSoldOut={isSoldOut}
        isInactive={isInactive}
        isExpired={isExpired}
        isFeatureAd={isFeatureAd}
        isReserved={isReserved}
        canPositionRenew={canPositionRenew}
        renewAvailabilityHint={renewAvailabilityHint}
      />

      <FeaturedPlanModal
        isOpen={isFeaturedPlanOpen}
        onClose={() => setIsFeaturedPlanOpen(false)}
        placement={selectedFeaturePlacement}
        duration={selectedFeatureDuration}
        onPlacementChange={setSelectedFeaturePlacement}
        onDurationChange={setSelectedFeatureDuration}
        onConfirm={handleFeatureSubmit}
      />
    </motion.div>
  );
};

export default MyAdsCard;
