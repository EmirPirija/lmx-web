"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@/components/Common/UnifiedIconPack";

import { cn } from "@/lib/utils";
import {
  useControllableLayerState,
  useGlobalModalLayerLock,
} from "@/components/ui/modal-layer-manager";

const focusFirstInteractiveElement = (container) => {
  if (!(container instanceof HTMLElement)) return false;

  const selectors = [
    "[data-autofocus]",
    "[autofocus]",
    "input:not([type='hidden']):not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    "button:not([disabled])",
    "a[href]",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  const candidate = container.querySelector(selectors);
  if (!(candidate instanceof HTMLElement)) return false;

  candidate.focus({ preventScroll: true });
  return true;
};

const Dialog = ({
  open,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  ...props
}) => {
  const layerState = useControllableLayerState({
    open,
    defaultOpen,
    onOpenChange,
  });

  useGlobalModalLayerLock(layerState.open);

  return (
    <DialogPrimitive.Root
      modal={modal}
      open={layerState.open}
      onOpenChange={layerState.onOpenChange}
      {...props}
    />
  );
};

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;
const DIALOG_TITLE_DISPLAY_NAME =
  DialogPrimitive.Title.displayName || "DialogTitle";
const DIALOG_DESCRIPTION_DISPLAY_NAME =
  DialogPrimitive.Description.displayName || "DialogDescription";

const containsComponentByDisplayName = (nodes, targetDisplayName) => {
  let hasMatch = false;

  React.Children.forEach(nodes, (child) => {
    if (hasMatch || !React.isValidElement(child)) return;

    const childDisplayName =
      child.type?.displayName || child.type?.render?.displayName;

    if (childDisplayName === targetDisplayName) {
      hasMatch = true;
      return;
    }

    if (child.props?.children) {
      hasMatch = containsComponentByDisplayName(
        child.props.children,
        targetDisplayName,
      );
    }
  });

  return hasMatch;
};

/* ─── Overlay ────────────────────────────────────────────────────────────── */
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 !z-[40000] bg-slate-950/72 backdrop-blur-[2px]",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      "duration-300 ease-out",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/* ─── Content ────────────────────────────────────────────────────────────── */
/*  Mobile  → bottom-sheet (slides up from bottom, rounded top corners)
 *  Desktop → centered modal (classic centered card)
 *  Stilski usklađeno sa LMX dizajnom: zaobljeni uglovi, meke sjenke,
 *  teal akcenti, čist bijeli background.
 */
const DialogContent = React.forwardRef(
  (
    {
      className,
      children,
      showCloseButton = true,
      size = "default",
      fallbackTitle = "Dialog",
      fallbackDescription = "Sadrzaj dijaloga",
      "aria-describedby": ariaDescribedBy,
      "aria-labelledby": ariaLabelledBy,
      onOpenAutoFocus,
      ...props
    },
    ref,
  ) => {
    const sizeClasses = {
      sm: "sm:max-w-[440px]",
      default: "sm:max-w-[580px]",
      lg: "sm:max-w-[720px]",
      xl: "sm:max-w-[900px]",
      full: "sm:max-w-[calc(100vw-3rem)]",
    };
    const hasDialogTitle = containsComponentByDisplayName(
      children,
      DIALOG_TITLE_DISPLAY_NAME,
    );
    const hasDialogDescription = containsComponentByDisplayName(
      children,
      DIALOG_DESCRIPTION_DISPLAY_NAME,
    );

    const handleOpenAutoFocus = React.useCallback(
      (event) => {
        onOpenAutoFocus?.(event);
        if (event.defaultPrevented) return;

        const focused = focusFirstInteractiveElement(event.currentTarget);
        if (focused) {
          event.preventDefault();
        }
      },
      [onOpenAutoFocus],
    );

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          data-lmx-modal-content="dialog"
          onOpenAutoFocus={handleOpenAutoFocus}
          aria-describedby={ariaDescribedBy ?? undefined}
          aria-labelledby={ariaLabelledBy ?? undefined}
          className={cn(
            /* ── Base ── */
            "fixed !z-[40010] grid w-full bg-white outline-none",

            /* ── Mobile: bottom-sheet ── */
            "inset-x-0 bottom-0 top-auto",
            "max-h-[92dvh]",
            "rounded-t-[20px]",

            /* ── Desktop: centered modal ── */
            "sm:inset-auto sm:left-[50%] sm:top-[50%]",
            "sm:translate-x-[-50%] sm:translate-y-[-50%]",
            "sm:max-h-[min(90dvh,800px)]",
            "sm:rounded-2xl",
            sizeClasses[size] || sizeClasses.default,

            /* ── Sjenke & border ── */
            "shadow-[0_-4px_40px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]",
            "sm:shadow-[0_20px_60px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]",

            /* ── Scrolling ── */
            "overflow-y-auto overscroll-contain",
            "[webkit-overflow-scrolling:touch] touch-pan-y",

            /* ── Animacija: Mobile – slide from bottom ── */
            "duration-300 ease-out",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:slide-in-from-bottom-[40%] data-[state=closed]:slide-out-to-bottom-[40%]",

            /* ── Animacija: Desktop – zoom + fade ── */
            "sm:data-[state=open]:slide-in-from-bottom-[2%] sm:data-[state=closed]:slide-out-to-bottom-[2%]",
            "sm:data-[state=open]:zoom-in-[0.97] sm:data-[state=closed]:zoom-out-[0.97]",

            className,
          )}
          {...props}
        >
          {/* ── Mobile drag indicator ── */}
          <div className="flex justify-center pt-3 pb-0 sm:hidden" aria-hidden>
            <div className="h-1 w-10 rounded-full bg-gray-300/80" />
          </div>

          {/* ── Content wrapper with padding ── */}
          <div className="px-5 pb-6 pt-3 sm:px-7 sm:pb-7 sm:pt-6 overflow-auto">
            {!hasDialogTitle && (
              <DialogPrimitive.Title className="sr-only">
                {fallbackTitle}
              </DialogPrimitive.Title>
            )}
            {!hasDialogDescription && (
              <DialogPrimitive.Description className="sr-only">
                {fallbackDescription}
              </DialogPrimitive.Description>
            )}
            {children}
          </div>

          {/* ── Close button ── */}
          {showCloseButton && (
            <DialogPrimitive.Close
              className={cn(
                "absolute right-3 top-3 sm:right-4 sm:top-4",
                "flex h-9 w-9 items-center justify-center rounded-full",
                "bg-gray-100/80 text-gray-500",
                "transition-all duration-200 ease-out",
                "hover:bg-gray-200/90 hover:text-gray-700",
                "active:scale-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A19B]/40 focus-visible:ring-offset-2",
                "rtl:right-auto rtl:left-3 sm:rtl:left-4",
              )}
            >
              <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              <span className="sr-only">Zatvori</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

/* ─── Header ─────────────────────────────────────────────────────────────── */
const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col gap-1.5",
      "pr-10 rtl:pr-0 rtl:pl-10",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/* ─── Footer ─────────────────────────────────────────────────────────────── */
/*  Mobile  → stacked dugmad (full-width), primary on top
 *  Desktop → horizontalan red, desno poravnato
 */
const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "mt-6 flex flex-col-reverse gap-2.5",
      "sm:mt-7 sm:flex-row sm:justify-end sm:gap-3",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

/* ─── Title ──────────────────────────────────────────────────────────────── */
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-[1.125rem] font-semibold leading-snug tracking-[-0.01em] text-gray-900",
      "sm:text-xl",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/* ─── Description ────────────────────────────────────────────────────────── */
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-[0.8125rem] leading-relaxed text-gray-500",
      "sm:text-sm",
      className,
    )}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

/* ─── Separator (utility) ────────────────────────────────────────────────── */
const DialogSeparator = ({ className }) => (
  <div
    className={cn(
      "my-4 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent",
      "sm:my-5",
      className,
    )}
    aria-hidden
  />
);
DialogSeparator.displayName = "DialogSeparator";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogSeparator,
};
