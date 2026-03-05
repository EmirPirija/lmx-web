"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useAdaptiveMobileDock } from "@/components/Layout/AdaptiveMobileDock";

const mobileButtonClasses =
  "inline-flex h-11 min-h-[44px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-xl px-3.5 py-2 text-[14px] font-semibold transition-transform duration-200 will-change-transform sm:text-[15px] disabled:cursor-not-allowed disabled:opacity-60";

const desktopButtonClasses =
  "inline-flex h-11 min-h-[44px] touch-manipulation items-center justify-center rounded-xl px-5 py-2 text-[14px] font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 will-change-transform sm:text-[15px] disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClasses =
  "border border-slate-200 bg-white text-slate-700 shadow-sm shadow-transparent hover:border-slate-300 hover:bg-slate-100 active:scale-[0.985] dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800";

const primaryEnabledClasses =
  "bg-[#0ab6af] text-white shadow-sm shadow-[#0ab6af]/35 hover:bg-[#09a8a2] hover:scale-[1.01] active:scale-[0.99]";

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
  forceMobileVisible = true,
  desktopMaxWidth,
}) => {
  const dock = useAdaptiveMobileDock();
  const dockId = useId();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const mobileButtonsContent = useMemo(
    () => (
      <div className="flex items-center gap-2">
        {!hideSecondary && (
          <button
            type={secondaryType}
            onClick={onSecondaryClick}
            disabled={secondaryDisabled}
            className={cn(
              mobileButtonClasses,
              secondaryButtonClasses,
              secondaryClassName
            )}
          >
            {secondaryLabel}
          </button>
        )}

        <button
          type={primaryType}
          onClick={onPrimaryClick}
          disabled={primaryDisabled}
          className={cn(
            mobileButtonClasses,
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

  const desktopButtonsContent = useMemo(
    () => (
      <div className="flex items-center justify-end gap-3">
        {!hideSecondary && (
          <button
            type={secondaryType}
            onClick={onSecondaryClick}
            disabled={secondaryDisabled}
            className={cn(
              desktopButtonClasses,
              "min-w-[148px]",
              secondaryButtonClasses,
              secondaryClassName
            )}
          >
            {secondaryLabel}
          </button>
        )}

        <button
          type={primaryType}
          onClick={onPrimaryClick}
          disabled={primaryDisabled}
          className={cn(
            desktopButtonClasses,
            "min-w-[220px]",
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
      preventAutoHide: forceMobileVisible,
      render: () => mobileButtonsContent,
    });

    return () => dock.removeCta(dockId);
  }, [dock, dockId, dockPriority, mobileButtonsContent, forceMobileVisible]);

  if (dock?.ready && dock.isMobile) {
    return null;
  }

  if (!isClient) {
    return null;
  }

  const desktopNode = (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 bottom-3 z-[90] pointer-events-none px-3 sm:px-4 lg:px-6",
        dock && "max-[991px]:hidden",
        containerClassName
      )}
    >
      <div
        className="mx-auto w-full max-w-[1080px] pb-[max(env(safe-area-inset-bottom),0.4rem)]"
        style={
          desktopMaxWidth
            ? { maxWidth: `${desktopMaxWidth}px` }
            : undefined
        }
      >
        <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-900">
          {desktopButtonsContent}
        </div>
      </div>
    </motion.div>
  );

  return createPortal(desktopNode, document.body);
};

export default StickyActionButtons;
