"use client";
import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { X } from "@/components/Common/UnifiedIconPack";

import { cn } from "@/lib/utils";
import {
  useControllableLayerState,
  useGlobalModalLayerLock,
} from "@/components/ui/modal-layer-manager";
import {
  LMX_LAYER_CLOSE_CLASS,
  LMX_LAYER_OVERLAY_CLASS,
  LMX_LAYER_SURFACE_CLASS,
} from "@/components/ui/layer-styles";

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

const Sheet = ({
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
    <SheetPrimitive.Root
      modal={modal}
      open={layerState.open}
      onOpenChange={layerState.onOpenChange}
      {...props}
    />
  );
};

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      LMX_LAYER_OVERLAY_CLASS,
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed !z-[40010] gap-4 p-6 duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=open]:animate-in data-[state=closed]:animate-out lmx-layer-surface-sheet",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 rounded-b-2xl data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
        bottom:
          "inset-x-0 bottom-0 rounded-t-2xl data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 sm:max-w-sm data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
        right:
          "inset-y-0 right-0 h-full w-3/4 sm:max-w-sm data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

const SheetContent = React.forwardRef(
  (
    {
      side = "right",
      className,
      children,
      overlayClassName,
      onOpenAutoFocus,
      onCloseAutoFocus,
      ...props
    },
    ref,
  ) => {
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

    const handleCloseAutoFocus = React.useCallback(
      (event) => {
        onCloseAutoFocus?.(event);
        if (!event.defaultPrevented) {
          event.preventDefault();
        }
      },
      [onCloseAutoFocus],
    );

    return (
      <SheetPortal>
        <SheetOverlay className={overlayClassName} />
        <SheetPrimitive.Content
          ref={ref}
          data-lmx-modal-content="sheet"
          onOpenAutoFocus={handleOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
          className={cn(LMX_LAYER_SURFACE_CLASS, sheetVariants({ side }), className)}
          {...props}
        >
          <SheetPrimitive.Title className="sr-only">Panel</SheetPrimitive.Title>
          <SheetPrimitive.Description className="sr-only">
            Podesivi sadržaj bočnog panela.
          </SheetPrimitive.Description>
          {children}
          <SheetPrimitive.Close
            className={cn(
              LMX_LAYER_CLOSE_CLASS,
              "top-4 bg-slate-100 dark:bg-slate-800",
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Zatvori</span>
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
