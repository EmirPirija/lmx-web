"use client";

import { useEffect, useId, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAdaptiveMobileDock } from "@/components/Layout/AdaptiveMobileDock";

const sharedButtonClasses =
  "inline-flex flex-1 sm:flex-none items-center justify-center rounded-xl px-4 py-2.5 text-sm sm:text-base font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClasses =
  "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800";

const primaryEnabledClasses =
  "bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99]";

const primaryDisabledClasses =
  "bg-slate-200 text-slate-500 shadow-none dark:bg-slate-800 dark:text-slate-400";

const StickyActionButtons = ({
  secondaryLabel = "Nazad",
  onSecondaryClick,
  secondaryDisabled = false,
  secondaryType = "button",
  primaryLabel = "Nastavi",
  onPrimaryClick,
  primaryDisabled = false,
  primaryType = "button",
  hideSecondary = false,
  containerClassName = "",
  secondaryClassName = "",
  primaryClassName = "",
  dockPriority = 10,
}) => {
  const dock = useAdaptiveMobileDock();
  const dockId = useId();

  const buttonsContent = useMemo(
    () => (
      <div className="flex items-center gap-2 sm:gap-3 sm:justify-end">
        {!hideSecondary && (
          <button
            type={secondaryType}
            onClick={onSecondaryClick}
            disabled={secondaryDisabled}
            className={cn(sharedButtonClasses, secondaryButtonClasses, secondaryClassName)}
          >
            {secondaryLabel}
          </button>
        )}

        <button
          type={primaryType}
          onClick={onPrimaryClick}
          disabled={primaryDisabled}
          className={cn(
            sharedButtonClasses,
            primaryDisabled ? primaryDisabledClasses : primaryEnabledClasses,
            primaryClassName
          )}
        >
          {primaryLabel}
        </button>
      </div>
    ),
    [
      hideSecondary,
      secondaryType,
      onSecondaryClick,
      secondaryDisabled,
      secondaryClassName,
      secondaryLabel,
      primaryType,
      onPrimaryClick,
      primaryDisabled,
      primaryClassName,
      primaryLabel,
    ]
  );

  useEffect(() => {
    if (!dock?.ready || !dock?.isMobile) return undefined;

    dock.upsertCta(dockId, {
      priority: dockPriority,
      enabled: true,
      render: () => buttonsContent,
    });

    return () => dock.removeCta(dockId);
  }, [dock, dockId, dockPriority, buttonsContent]);

  if (dock?.ready && dock.isMobile) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 pointer-events-none",
        dock && "max-[991px]:hidden",
        containerClassName
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 sm:px-4">
        <div className="pointer-events-auto rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_-12px_35px_-22px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
          {buttonsContent}
        </div>
      </div>
    </motion.div>
  );
};

export default StickyActionButtons;
