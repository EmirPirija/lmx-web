"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  SearchX,
  Sparkles,
} from "@/components/Common/UnifiedIconPack";

const VARIANT_MAP = {
  empty: {
    title: "Nema rezultata",
    description: "Pokušaj prilagoditi filtere ili provjeri ponovo malo kasnije.",
    icon: SearchX,
    iconTone:
      "bg-slate-100 text-slate-600 dark:bg-slate-800/90 dark:text-slate-200",
    panelTone:
      "border-slate-200/90 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(148,163,184,0.18),rgba(255,255,255,0.92)_58%)] dark:border-slate-700 dark:bg-[radial-gradient(120%_120%_at_50%_0%,rgba(71,85,105,0.35),rgba(2,6,23,0.86)_58%)]",
  },
  loading: {
    title: "Učitavanje podataka",
    description: "Pripremamo sadržaj i osvježavamo prikaz.",
    icon: Loader2,
    iconTone:
      "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground",
    panelTone:
      "border-primary/25 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(16,185,129,0.12),rgba(255,255,255,0.93)_58%)] dark:border-primary/35 dark:bg-[radial-gradient(120%_120%_at_50%_0%,rgba(16,185,129,0.25),rgba(2,6,23,0.86)_58%)]",
  },
  error: {
    title: "Došlo je do greške",
    description: "Nismo uspjeli završiti zahtjev. Pokušaj ponovo.",
    icon: AlertCircle,
    iconTone:
      "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-200",
    panelTone:
      "border-rose-200/90 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(251,113,133,0.16),rgba(255,255,255,0.93)_58%)] dark:border-rose-700/70 dark:bg-[radial-gradient(120%_120%_at_50%_0%,rgba(190,24,93,0.26),rgba(2,6,23,0.86)_58%)]",
  },
};

const StateSurface = ({
  variant = "empty",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  contentClassName,
  iconClassName,
  titleClassName,
  descriptionClassName,
  actionsClassName,
  primaryActionClassName,
  secondaryActionClassName,
  icon: IconOverride,
  busy = false,
  compact = false,
  children,
}) => {
  const resolvedVariant = VARIANT_MAP[variant] || VARIANT_MAP.empty;
  const Icon = IconOverride || resolvedVariant.icon;
  const isLoading = variant === "loading";

  return (
    <section
      role={isLoading ? "status" : "region"}
      aria-live={isLoading ? "polite" : undefined}
      className={cn(
        "mx-auto w-full max-w-3xl rounded-3xl border p-6 text-center shadow-sm sm:p-8",
        resolvedVariant.panelTone,
        compact ? "max-w-xl p-5 sm:p-6" : "min-h-[240px] sm:min-h-[280px]",
        className,
      )}
    >
      <div className={cn("mx-auto flex max-w-xl flex-col items-center gap-4 sm:gap-5", contentClassName)}>
        <div
          className={cn(
            "inline-flex h-16 w-16 items-center justify-center rounded-2xl",
            "ring-1 ring-black/5 dark:ring-white/10",
            resolvedVariant.iconTone,
            iconClassName,
          )}
        >
          <Icon className={cn("h-8 w-8", isLoading && "animate-spin")} />
        </div>

        <div className="space-y-2">
          <h3 className={cn("text-lg font-semibold text-slate-900 dark:text-slate-50 sm:text-xl", titleClassName)}>
            {title || resolvedVariant.title}
          </h3>
          <p className={cn("text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base", descriptionClassName)}>
            {description || resolvedVariant.description}
          </p>
        </div>

        {(actionLabel || secondaryActionLabel) && (
          <div
            className={cn(
              "flex w-full flex-col items-stretch justify-center gap-2 sm:w-auto sm:flex-row sm:items-center",
              actionsClassName,
            )}
          >
            {actionLabel ? (
              <Button
                type="button"
                onClick={onAction}
                disabled={busy || !onAction}
                className={cn("h-11 rounded-2xl px-5", primaryActionClassName)}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {actionLabel}
              </Button>
            ) : null}
            {secondaryActionLabel ? (
              <Button
                type="button"
                variant="outline"
                onClick={onSecondaryAction}
                disabled={busy || !onSecondaryAction}
                className={cn("h-11 rounded-2xl px-5", secondaryActionClassName)}
              >
                <Sparkles className="h-4 w-4" />
                {secondaryActionLabel}
              </Button>
            ) : null}
          </div>
        )}

        {children}
      </div>
    </section>
  );
};

export default StateSurface;
