"use client";

import React from "react";
import { Check, Crown, Store } from "lucide-react";
import { formatPriceAbbreviated } from "@/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TIER_THEMES = {
  pro: {
    icon: Crown,
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    ring: "ring-amber-300/50 dark:ring-amber-500/40",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  },
  shop: {
    icon: Store,
    gradient: "from-sky-500 via-blue-600 to-indigo-600",
    ring: "ring-sky-300/50 dark:ring-sky-500/40",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  },
  default: {
    icon: Crown,
    gradient: "from-slate-500 via-slate-600 to-slate-700",
    ring: "ring-slate-300/50 dark:ring-slate-500/40",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
  },
};

const formatPermissionLabel = (permissionKey) =>
  permissionKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeFeatures = (tier) => {
  if (Array.isArray(tier?.features) && tier.features.length > 0) {
    return tier.features
      .map((feature) => {
        if (typeof feature === "string") return feature;
        if (feature && typeof feature === "object") {
          return feature.label || feature.name || feature.value || null;
        }
        return null;
      })
      .filter(Boolean);
  }

  if (tier?.permissions && typeof tier.permissions === "object") {
    return Object.entries(tier.permissions)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => formatPermissionLabel(key));
  }

  return [];
};

const MembershipTierSelector = ({ tiers = [], selectedTier, onSelectTier }) => {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {tiers.map((tier) => {
        const tierSlug = String(tier?.slug || "").toLowerCase();
        const theme = TIER_THEMES[tierSlug] || TIER_THEMES.default;
        const Icon = theme.icon;
        const features = normalizeFeatures(tier);
        const isSelected = selectedTier?.id === tier?.id;
        const durationLabel =
          Number(tier?.duration_days) > 0 ? `${tier.duration_days} dana` : "Bez isteka";

        return (
          <div
            key={tier?.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectTier?.(tier)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectTier?.(tier);
              }
            }}
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-2xl border text-left transition-all",
              "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600",
              isSelected && [
                "border-transparent ring-2 ring-offset-2",
                "ring-offset-white dark:ring-offset-slate-950",
                theme.ring,
              ]
            )}
          >
            <div className={cn("bg-gradient-to-br p-6 text-white", theme.gradient)}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
                    Membership
                  </p>
                  <h3 className="text-2xl font-bold">{tier?.name || "Plan"}</h3>
                  <p className="text-sm text-white/85">
                    {tier?.description || "Nadogradite svoj profil i dobijte napredne mogućnosti."}
                  </p>
                </div>
                <span className="rounded-xl bg-white/15 p-2.5 backdrop-blur-sm">
                  <Icon className="h-6 w-6" />
                </span>
              </div>

              <div className="mt-5 flex items-end gap-1">
                <span className="text-3xl font-extrabold tabular-nums">
                  {formatPriceAbbreviated(Number(tier?.price || 0))}
                </span>
                <span className="pb-1 text-sm text-white/80">/{durationLabel}</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-5 p-5">
              <div className="flex min-h-[138px] flex-col gap-2.5">
                {features.length > 0 ? (
                  features.slice(0, 8).map((feature, index) => (
                    <div key={`${tier?.id}-feature-${index}`} className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-200">{feature}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Ovaj plan nema dodatne feature stavke.
                  </p>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between gap-3">
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", theme.badge)}>
                  {isSelected ? "Odabran plan" : "Dostupan plan"}
                </span>

                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "min-w-[132px] rounded-full",
                    isSelected
                      ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      : "bg-primary text-white hover:bg-primary/90"
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectTier?.(tier);
                  }}
                >
                  {isSelected ? "Odabrano" : "Odaberi plan"}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MembershipTierSelector;
