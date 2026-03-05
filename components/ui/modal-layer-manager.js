"use client";

import * as React from "react";

const MODAL_OPEN_CLASS = "lmx-modal-open";
let openModalDepth = 0;
const BACKGROUND_LOCK_SELECTORS = ["#__next", ".lmx-app-surface"];
const focusRestoreStack = [];

let scrollLockOffsetY = 0;
let bodyStyleSnapshot = null;
let htmlStyleSnapshot = null;

const getSupportsInert = () =>
  typeof HTMLElement !== "undefined" && "inert" in HTMLElement.prototype;

const snapshotByNode = new WeakMap();

const snapshotNodeState = (node) => ({
  ariaHidden: node.getAttribute("aria-hidden"),
  hadInert: node.hasAttribute("inert"),
  pointerEvents: node.style.pointerEvents,
  userSelect: node.style.userSelect,
  hadFallbackAttr: node.hasAttribute("data-lmx-inert-fallback"),
});

const restoreNodeState = (node, snapshot) => {
  if (!snapshot) return;

  if (snapshot.ariaHidden === null) {
    node.removeAttribute("aria-hidden");
  } else {
    node.setAttribute("aria-hidden", snapshot.ariaHidden);
  }

  if (snapshot.hadInert) {
    node.setAttribute("inert", "");
  } else {
    node.removeAttribute("inert");
  }

  if (snapshot.hadFallbackAttr) {
    node.setAttribute("data-lmx-inert-fallback", "true");
  } else {
    node.removeAttribute("data-lmx-inert-fallback");
  }

  node.style.pointerEvents = snapshot.pointerEvents;
  node.style.userSelect = snapshot.userSelect;
};

const lockDocumentScroll = () => {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const { body, documentElement } = document;
  if (!(body instanceof HTMLElement) || !(documentElement instanceof HTMLElement)) {
    return;
  }

  scrollLockOffsetY = window.scrollY || window.pageYOffset || 0;
  bodyStyleSnapshot = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflowY: body.style.overflowY,
    overscrollBehaviorY: body.style.overscrollBehaviorY,
  };
  htmlStyleSnapshot = {
    overscrollBehaviorY: documentElement.style.overscrollBehaviorY,
  };

  body.style.position = "fixed";
  body.style.top = `-${scrollLockOffsetY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflowY = "scroll";
  body.style.overscrollBehaviorY = "none";
  documentElement.style.overscrollBehaviorY = "none";
};

const unlockDocumentScroll = () => {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const { body, documentElement } = document;
  if (!(body instanceof HTMLElement) || !(documentElement instanceof HTMLElement)) {
    return;
  }

  if (bodyStyleSnapshot) {
    body.style.position = bodyStyleSnapshot.position;
    body.style.top = bodyStyleSnapshot.top;
    body.style.left = bodyStyleSnapshot.left;
    body.style.right = bodyStyleSnapshot.right;
    body.style.width = bodyStyleSnapshot.width;
    body.style.overflowY = bodyStyleSnapshot.overflowY;
    body.style.overscrollBehaviorY = bodyStyleSnapshot.overscrollBehaviorY;
  } else {
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.overflowY = "";
    body.style.overscrollBehaviorY = "";
  }

  if (htmlStyleSnapshot) {
    documentElement.style.overscrollBehaviorY = htmlStyleSnapshot.overscrollBehaviorY;
  } else {
    documentElement.style.overscrollBehaviorY = "";
  }

  const restoreY = scrollLockOffsetY;
  bodyStyleSnapshot = null;
  htmlStyleSnapshot = null;
  scrollLockOffsetY = 0;

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: restoreY, left: 0, behavior: "auto" });
  });
};

const captureActiveElementForRestore = () => {
  if (typeof document === "undefined") return;
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    focusRestoreStack.push(active);
    return;
  }
  focusRestoreStack.push(null);
};

const restoreCapturedFocus = () => {
  if (typeof document === "undefined") return;
  const target = focusRestoreStack.pop();
  if (!(target instanceof HTMLElement) || !target.isConnected) return;

  window.requestAnimationFrame(() => {
    if (!target.isConnected) return;
    try {
      target.focus({ preventScroll: true });
    } catch {
      target.focus();
    }
  });
};

const lockBackgroundForModal = () => {
  if (typeof document === "undefined") return;
  const supportsInert = getSupportsInert();
  const nodes = new Set();

  BACKGROUND_LOCK_SELECTORS.forEach((selector) => {
    const node = document.querySelector(selector);
    if (node instanceof HTMLElement) {
      nodes.add(node);
    }
  });

  nodes.forEach((node) => {
    if (!snapshotByNode.has(node)) {
      snapshotByNode.set(node, snapshotNodeState(node));
    }

    node.setAttribute("aria-hidden", "true");

    if (supportsInert) {
      node.setAttribute("inert", "");
    } else {
      node.setAttribute("data-lmx-inert-fallback", "true");
      node.style.pointerEvents = "none";
      node.style.userSelect = "none";
    }
  });
};

const unlockBackgroundForModal = () => {
  if (typeof document === "undefined") return;

  BACKGROUND_LOCK_SELECTORS.forEach((selector) => {
    const node = document.querySelector(selector);
    if (!(node instanceof HTMLElement)) return;
    restoreNodeState(node, snapshotByNode.get(node));
    snapshotByNode.delete(node);
  });
};

const applyModalOpenClass = () => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.add(MODAL_OPEN_CLASS);
  document.body.classList.add(MODAL_OPEN_CLASS);
  lockDocumentScroll();
  lockBackgroundForModal();
};

const removeModalOpenClass = () => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(MODAL_OPEN_CLASS);
  document.body.classList.remove(MODAL_OPEN_CLASS);
  unlockDocumentScroll();
  unlockBackgroundForModal();
};

const incrementModalDepth = () => {
  captureActiveElementForRestore();
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
  restoreCapturedFocus();
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
