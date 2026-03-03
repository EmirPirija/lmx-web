"use client";

import * as React from "react";

const MODAL_OPEN_CLASS = "lmx-modal-open";
let openModalDepth = 0;

const applyModalOpenClass = () => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.add(MODAL_OPEN_CLASS);
  document.body.classList.add(MODAL_OPEN_CLASS);
};

const removeModalOpenClass = () => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(MODAL_OPEN_CLASS);
  document.body.classList.remove(MODAL_OPEN_CLASS);
};

const incrementModalDepth = () => {
  openModalDepth += 1;
  if (openModalDepth === 1) {
    applyModalOpenClass();
  }
};

const decrementModalDepth = () => {
  openModalDepth = Math.max(0, openModalDepth - 1);
  if (openModalDepth === 0) {
    removeModalOpenClass();
  }
};

export const useGlobalModalLayerLock = (isOpen) => {
  const wasOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof document === "undefined") return undefined;

    if (isOpen && !wasOpenRef.current) {
      incrementModalDepth();
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      decrementModalDepth();
      wasOpenRef.current = false;
    }

    return () => {
      if (wasOpenRef.current) {
        decrementModalDepth();
        wasOpenRef.current = false;
      }
    };
  }, [isOpen]);
};

export const useControllableLayerState = ({
  open,
  defaultOpen = false,
  onOpenChange,
}) => {
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(Boolean(defaultOpen));

  const effectiveOpen = isControlled ? Boolean(open) : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      if (!isControlled) {
        setUncontrolledOpen(Boolean(nextOpen));
      }
      onOpenChange?.(Boolean(nextOpen));
    },
    [isControlled, onOpenChange],
  );

  return {
    open: effectiveOpen,
    onOpenChange: handleOpenChange,
  };
};
