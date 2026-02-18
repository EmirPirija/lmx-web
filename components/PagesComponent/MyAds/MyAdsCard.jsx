"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

import {
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock2Fill,
  Edit,
  Eye,
  EyeOff,
  Home,
  Layers3,
  MoreVertical,
  Rocket,
  RotateCcw,
  Sparkles,
  TransferFill,
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
import { getFeaturedMeta } from "@/utils/featuredPlacement";
import { resolveRealEstateDisplayPricing } from "@/utils/realEstatePricing";
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

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";

  const now = new Date();
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return "Upravo sada";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return diffInMinutes === 1 ? "Prije 1 minut" : `Prije ${diffInMinutes} minuta`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return diffInHours === 1 ? "Prije 1 sat" : `Prije ${diffInHours} sati`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return diffInDays === 1 ? "Prije 1 dan" : `Prije ${diffInDays} dana`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return diffInMonths === 1 ? "Prije 1 mjesec" : `Prije ${diffInMonths} mjeseci`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return diffInYears === 1 ? "Prije 1 godina" : `Prije ${diffInYears} godina`;
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
const featuredDurationOptionsSet = new Set(featuredDurationOptions);

const normalizeFeaturedPlacementValue = (value) =>
  ["category", "home", "category_home"].includes(String(value || "").toLowerCase())
    ? String(value).toLowerCase()
    : "category_home";

const normalizeFeaturedDurationValue = (value) => {
  const parsed = Number(value);
  return featuredDurationOptionsSet.has(parsed) ? parsed : 30;
};

const getKeyAttributes = (item) => {
  const attributes = [];
  const customFields = item?.translated_custom_fields || [];
  const realEstatePricing = resolveRealEstateDisplayPricing(item || {});
  const isRealEstate = Boolean(realEstatePricing?.isRealEstate);

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

  const formatAreaNoSpace = (rawValue) => {
    if (rawValue === null || rawValue === undefined || rawValue === "") return null;
    const cleaned = String(rawValue).trim().replace(/\s*(m2|m²)$/i, "");
    if (!cleaned) return null;
    return `${cleaned.replace(/\s/g, "")}m2`;
  };

  const formatMileageNoSpace = (rawValue) => {
    if (rawValue === null || rawValue === undefined || rawValue === "") return null;
    const cleaned = String(rawValue)
      .trim()
      .replace(/^kilometraza\s*\(km\)\s*[:\-]?\s*/i, "")
      .replace(/^kilometraža\s*\(km\)\s*[:\-]?\s*/i, "")
      .replace(/^mileage\s*[:\-]?\s*/i, "")
      .replace(/\s*(km|kilometraza|kilometraža)$/i, "");
    if (!cleaned) return null;
    return `${cleaned.replace(/\s/g, "")}km`;
  };

  const pushUnique = (value) => {
    if (!value) return;
    const normalized = String(value).trim();
    if (!normalized) return;
    if (attributes.some((entry) => normalizeText(entry) === normalizeText(normalized))) return;
    attributes.push(normalized);
  };

  if (isRealEstate) {
    const listingType = findValue([
      "tip oglasa",
      "tip nekretnine",
      "tip ponude",
      "vrsta ponude",
      "offer type",
      "listing type",
      "type",
    ]);
    const rooms = findValue([
      "broj soba",
      "sobe",
      "broj prostorija",
      "rooms",
      "room count",
    ]);
    const propertyType = findValue([
      "vrsta objekta",
      "tip objekta",
      "objekat",
      "object type",
      "property type",
    ]);
    const areaRaw =
      realEstatePricing?.areaM2 ??
      findValue([
        "kvadratura",
        "kvadratura (m2)",
        "povrsina",
        "površina",
        "m²",
        "quadrature",
        "surface",
        "area",
      ]);
    const area = formatAreaNoSpace(areaRaw);

    pushUnique(listingType);
    pushUnique(rooms);
    pushUnique(propertyType);
    pushUnique(area);

    if (attributes.length > 0) {
      return attributes;
    }
  }

  const year = findValue(["godište", "godiste"]);
  pushUnique(year);

  const fuel = findValue(["gorivo"]);
  pushUnique(fuel);

  const transmission = findValue(["mjenjač", "mjenjac"]);
  pushUnique(transmission);

  const mileageRaw = findValue([
    "kilometraza (km)",
    "kilometraža (km)",
    "kilometraza",
    "kilometraža",
    "predena kilometraza",
    "pređena kilometraža",
    "mileage",
    "km",
  ]);
  pushUnique(formatMileageNoSpace(mileageRaw));

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
  featuredMeta,
  isFeatureAd = false,
  onPlacementChange,
  onDurationChange,
  onConfirm,
  isSubmitting = false,
}) => {
  const handleClose = () => {
    if (isSubmitting) return;
    onClose?.();
  };

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
          onClick={handleClose}
          disabled={isSubmitting}
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
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5">
            <div
              className={cn(
                "rounded-2xl border p-3",
                isFeatureAd
                  ? featuredMeta?.isExpired
                    ? "border-rose-200 bg-rose-50/70 dark:border-rose-800/70 dark:bg-rose-950/30"
                    : "border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/70 dark:bg-emerald-950/30"
                  : "border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/70"
              )}
            >
              {isFeatureAd ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <Rocket className="h-4 w-4 text-amber-500 dark:text-amber-300" />
                    Trenutni status izdvajanja
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                      <p className="text-slate-500 dark:text-slate-400">Pozicija</p>
                      <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                        {featuredMeta?.placementLabel || "Nije određeno"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                      <p className="text-slate-500 dark:text-slate-400">Status</p>
                      <p
                        className={cn(
                          "mt-0.5 font-semibold",
                          featuredMeta?.isExpired
                            ? "text-rose-700 dark:text-rose-300"
                            : "text-emerald-700 dark:text-emerald-300"
                        )}
                      >
                        {featuredMeta?.isExpired ? "Isteklo" : "Aktivno"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                      <p className="text-slate-500 dark:text-slate-400">Preostalo</p>
                      <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                        {featuredMeta?.isUnlimited
                          ? "Bez isteka"
                          : featuredMeta?.remainingLabel || "-"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                      <p className="text-slate-500 dark:text-slate-400">Ističe</p>
                      <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                        {featuredMeta?.endAtLabel || "Nema vremenskog ograničenja"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Ovaj oglas trenutno nije izdvojen. Odaberi poziciju i trajanje da ga istakneš.
                </div>
              )}
            </div>

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
                onClick={handleClose}
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
  onFeature,
  onReserve,
  onRemoveReservation,
  onEdit,
  onDelete,
  onHide,
  onSold,
  onActivate,
  onRenew,
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
          label: isFeatureAd ? "Uredi izdvajanje" : "Izdvoji oglas",
          description: isFeatureAd
            ? "Promijeni poziciju izdvajanja ili produži trajanje."
            : "Povećaj vidljivost na kategoriji i/ili naslovnoj.",
          onClick: onFeature,
          show: isApproved && !isSoldOut && !isReserved && !isInactive,
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
      isSoldOut,
      onActivate,
      onDelete,
      onEdit,
      onFeature,
      onHide,
      onRemoveReservation,
      onRenew,
      onReserve,
      onSold,
    ]
  );

  const recommendedActionKey = isExpired
    ? "renew"
    : isInactive
      ? "activate"
      : isReserved
        ? "unreserve"
        : isApproved && !isSoldOut && !isInactive && !isReserved
          ? "feature"
          : isApproved && !isSoldOut && isEditable
            ? "edit"
            : canPositionRenew
              ? "renew"
              : "delete";

  const recommendedAction =
    actions.find((action) => action.key === recommendedActionKey) || actions[0] || null;

  const secondaryOrder = ["hide", "reserve", "unreserve", "edit", "sold", "activate", "renew"];
  const secondaryActions = secondaryOrder
    .map((key) => actions.find((action) => action.key === key))
    .filter((action) => action && action.key !== recommendedAction?.key && action.kind !== "danger");
  const dangerActions = actions.filter((action) => action.kind === "danger");

  const panelHint = "Biraj akcije prema cilju: uređivanje, prodaja ili optimizacija pozicije.";
  const renewInfoText =
    renewAvailabilityHint ||
    (canPositionRenew || isExpired
      ? "Besplatna obnova pozicije je dostupna odmah."
      : `Besplatna obnova pozicije za ${POSITION_RENEW_COOLDOWN_DAYS} dana.`);

  const toneClass = {
    blue: "border-blue-200 bg-blue-50/85 text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/70 dark:bg-blue-950/35 dark:text-blue-200 dark:hover:bg-blue-900/35",
    emerald:
      "border-emerald-200 bg-emerald-50/85 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-200 dark:hover:bg-emerald-900/35",
    amber:
      "border-amber-200 bg-amber-50/85 text-amber-800 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200 dark:hover:bg-amber-900/35",
    violet:
      "border-violet-200 bg-violet-50/85 text-violet-700 hover:border-violet-300 hover:bg-violet-100 dark:border-violet-900/70 dark:bg-violet-950/35 dark:text-violet-200 dark:hover:bg-violet-900/35",
    teal: "border-teal-200 bg-teal-50/85 text-teal-800 hover:border-teal-300 hover:bg-teal-100 dark:border-teal-900/70 dark:bg-teal-950/35 dark:text-teal-200 dark:hover:bg-teal-900/35",
    slate:
      "border-slate-200 bg-slate-50/90 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700/70",
    rose: "border-rose-200 bg-rose-50/85 text-rose-700 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/70 dark:bg-rose-950/35 dark:text-rose-200 dark:hover:bg-rose-900/35",
  };

  const runAction = async (event, action) => {
    event.preventDefault();
    event.stopPropagation();
    const result = await action.onClick?.();
    if (result !== false) {
      onClose();
    }
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
                      ? "w-[min(680px,calc(100vw-1rem))]"
                      : "w-[min(1040px,calc(100vw-3rem))]"
                  )}
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.98 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "overflow-hidden border border-slate-200 bg-white/95 p-5 shadow-[0_35px_80px_-42px_rgba(15,23,42,0.7)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 sm:p-6",
                      isMobile
                        ? "max-h-[88vh] overflow-y-auto rounded-[28px]"
                        : "max-h-[88vh] overflow-y-auto rounded-[34px]"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                          Pametne akcije oglasa
                        </p>
                        <p className="mt-1 text-[clamp(15px,1.25vw,24px)] text-slate-600 dark:text-slate-300">
                          {panelHint}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-violet-600 dark:text-violet-300">
                          {renewInfoText}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onClose();
                        }}
                        className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-600 transition-all hover:scale-[1.03] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Zatvori brze akcije"
                      >
                        <X className="h-7 w-7" />
                      </button>
                    </div>

                    {recommendedAction ? (
                      <button
                        type="button"
                        onClick={(e) => runAction(e, recommendedAction)}
                        className={cn(
                          "group mb-4 flex w-full items-start gap-4 rounded-[28px] border px-5 py-5 text-left transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                          toneClass[recommendedAction.tone]
                        )}
                      >
                        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-slate-900/70">
                          <recommendedAction.icon className="h-7 w-7" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[clamp(21px,1.65vw,31px)] font-semibold leading-tight">
                            Preporučeno: {recommendedAction.label}
                          </span>
                          <span className="mt-1 block text-[clamp(14px,0.95vw,19px)] opacity-90">
                            {recommendedAction.description}
                          </span>
                        </span>
                      </button>
                    ) : null}

                    {secondaryActions.length ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {secondaryActions.map((action) => (
                          <button
                            key={action.key}
                            type="button"
                            onClick={(e) => runAction(e, action)}
                            className={cn(
                              "group flex min-h-[124px] items-start gap-4 rounded-[28px] border px-5 py-5 text-left transition-all duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                              toneClass[action.tone]
                            )}
                          >
                            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-slate-900/70">
                              <action.icon className="h-6 w-6" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[clamp(18px,1.35vw,26px)] font-semibold leading-tight">
                                {action.label}
                              </span>
                              <span className="mt-1 block text-[clamp(13px,0.9vw,17px)] opacity-90">
                                {action.description}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {dangerActions.length ? (
                      <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700">
                        {dangerActions.map((action) => (
                          <button
                            key={action.key}
                            type="button"
                            onClick={(e) => runAction(e, action)}
                            className={cn(
                              "group flex w-full items-start gap-4 rounded-[24px] border px-5 py-4 text-left transition-all duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50",
                              toneClass[action.tone]
                            )}
                          >
                            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-slate-900/70">
                              <action.icon className="h-6 w-6" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[clamp(19px,1.4vw,27px)] font-semibold leading-tight">
                                {action.label}
                              </span>
                              <span className="mt-1 block text-[clamp(13px,0.9vw,17px)] opacity-90">
                                {action.description}
                              </span>
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
  onFeatureAction,
}) => {
  const isJobCategory = Number(data?.category?.is_job_category) === 1;
  const translatedItem = data?.translated_item;
  const publishedAgo = formatRelativeTime(data?.created_at || translatedItem?.created_at);

  const keyAttributes = getKeyAttributes(data);
  const conditionLabel = getConditionLabel(data);
  const availableNow = readAvailableNow(data);
  const topStatusCount = [Boolean(conditionLabel), Boolean(availableNow)].filter(Boolean).length;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardShellRef = useRef(null);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const defaultFeaturePlacement = useMemo(
    () =>
      normalizeFeaturedPlacementValue(
        data?.featured_placement || data?.positions || data?.placement || "category_home"
      ),
    [data?.featured_placement, data?.placement, data?.positions]
  );
  const defaultFeatureDuration = useMemo(
    () =>
      normalizeFeaturedDurationValue(
        data?.featured_duration_days || data?.duration_days || data?.featured_days
      ),
    [data?.duration_days, data?.featured_days, data?.featured_duration_days]
  );
  
  // NOVI STATE ZA QUICK ACTIONS
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isFeaturedPlanOpen, setIsFeaturedPlanOpen] = useState(false);
  const [selectedFeaturePlacement, setSelectedFeaturePlacement] = useState(defaultFeaturePlacement);
  const [selectedFeatureDuration, setSelectedFeatureDuration] = useState(defaultFeatureDuration);
  const [isFeatureSubmitting, setIsFeatureSubmitting] = useState(false);
  const featureSubmitLockRef = useRef(false);

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

  useEffect(() => {
    if (!isFeaturedPlanOpen) {
      setSelectedFeaturePlacement(defaultFeaturePlacement);
      setSelectedFeatureDuration(defaultFeatureDuration);
      return;
    }

    setSelectedFeaturePlacement(defaultFeaturePlacement);
    setSelectedFeatureDuration(defaultFeatureDuration);
  }, [defaultFeatureDuration, defaultFeaturePlacement, isFeaturedPlanOpen]);

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
  const featuredMeta = useMemo(() => getFeaturedMeta(data), [data]);
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
  const realEstatePricing = useMemo(() => resolveRealEstateDisplayPricing(data), [data]);
  const showRealEstatePerM2 = !isJobCategory && realEstatePricing?.showPerM2;

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

  const handleFeatureSubmit = async () => {
    if (isFeatureSubmitting || featureSubmitLockRef.current) return;

    featureSubmitLockRef.current = true;
    setIsFeatureSubmitting(true);
    try {
      const normalizedPlacement = normalizeFeaturedPlacementValue(selectedFeaturePlacement);
      const normalizedDuration = normalizeFeaturedDurationValue(selectedFeatureDuration);
      const payload = {
        placement: normalizedPlacement,
        duration_days: normalizedDuration,
      };

      const result = onFeatureAction
        ? await onFeatureAction(data?.id, payload)
        : await onContextMenuAction?.("feature", data?.id, payload);

      if (result !== false) {
        setIsFeaturedPlanOpen(false);
      }
    } finally {
      featureSubmitLockRef.current = false;
      setIsFeatureSubmitting(false);
    }
  };

  const title = translatedItem?.name || data?.name;
  const internalCode = String(data?.seller_product_code || "").trim();

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
        <div className="relative aspect-[16/10] bg-slate-50">
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
                  {/* Video */}
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
          topStatusCount >= 2 ? "pt-5" : topStatusCount >= 1 ? "pt-5" : null
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <motion.h3
            whileHover={{ color: "hsl(var(--primary))" }}
            className="text-sm font-semibold text-slate-900 dark:text-slate-300 line-clamp-2 leading-snug group-hover:text-primary transition-colors"
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

        {internalCode ? (
          <div className="flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-50/90 px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-900/70">
            <span className="font-medium text-slate-500 dark:text-slate-400">Interna šifra:</span>
            <span className="truncate font-semibold text-slate-800 dark:text-slate-100">{internalCode}</span>
          </div>
        ) : null}

        {Array.isArray(keyAttributes) && keyAttributes.length > 0 ? (
          <div className="flex flex-wrap">
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
          className="mt-auto flex flex-col-reverse items-center justify-between gap-2 border-t border-slate-100 pt-2 sm:flex-row dark:border-slate-800"
        >
          {publishedAgo ? (
            <div className="flex min-w-0 items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              {/* <Clock2Fill className="h-3.5 w-3.5 shrink-0 text-primary" /> */}
              <span className="truncate">{publishedAgo}</span>
            </div>
          ) : !isHidePrice ? (
            <span className="w-px" aria-hidden="true" />
          ) : null}

          {!isHidePrice ? (
            isJobCategory ? (
              <div className="flex items-center gap-2">
                {exchangePossible ? (
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                    title="Zamjena moguća"
                    aria-label="Zamjena moguća"
                  >
                    <TransferFill className="h-4 w-4 text-primary" />
                  </span>
                ) : null}
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  {formatSalaryRange(data?.min_salary, data?.max_salary)}
                </motion.span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {exchangePossible ? (
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                    title="Zamjena moguća"
                    aria-label="Zamjena moguća"
                  >
                    <TransferFill className="h-4 w-4 text-primary" />
                  </span>
                ) : null}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center leading-none sm:items-end"
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
                  {showRealEstatePerM2 ? (
                    <span className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                      {formatPriceAbbreviated(Number(realEstatePricing.perM2Value))} / m²
                    </span>
                  ) : null}
                </motion.div>
              </div>
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
        featuredMeta={featuredMeta}
        isFeatureAd={isFeatureAd}
        onPlacementChange={setSelectedFeaturePlacement}
        onDurationChange={setSelectedFeatureDuration}
        onConfirm={handleFeatureSubmit}
        isSubmitting={isFeatureSubmitting}
      />
    </motion.div>
  );
};

export default MyAdsCard;
