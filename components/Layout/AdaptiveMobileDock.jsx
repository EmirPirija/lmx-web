"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Menu } from "@/components/Common/UnifiedIconPack";

const AdaptiveMobileDockContext = createContext(null);

const pickActiveItem = (registry) =>
  Object.values(registry)
    .filter((item) => item?.enabled !== false)
    .sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    })[0] || null;

const useMobileViewport = (query = "(max-width: 991px)") => {
  const [state, setState] = useState({ ready: false, isMobile: false });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia(query);
    const update = () => setState({ ready: true, isMobile: media.matches });
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, [query]);

  return state;
};

export const AdaptiveMobileDockProvider = ({ children }) => {
  const { ready, isMobile } = useMobileViewport("(max-width: 991px)");
  const prefersReducedMotion = useReducedMotion();
  const [navRegistry, setNavRegistry] = useState({});
  const [ctaRegistry, setCtaRegistry] = useState({});
  const [suspendRegistry, setSuspendRegistry] = useState({});
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isDockInteracting, setIsDockInteracting] = useState(false);
  const [isTextInputActive, setIsTextInputActive] = useState(false);
  const [isVirtualKeyboardVisible, setIsVirtualKeyboardVisible] = useState(false);
  const rowRef = useRef(null);
  const scrollStateRef = useRef({
    lastY: 0,
    downAccum: 0,
    upAccum: 0,
    lockUntil: 0,
  });
  const dockCollapsedRef = useRef(false);
  const interactionReleaseTimerRef = useRef(null);

  const upsertNav = useCallback((id, payload) => {
    if (!id) return;
    setNavRegistry((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        ...payload,
        updatedAt: Date.now(),
      },
    }));
  }, []);

  const removeNav = useCallback((id) => {
    if (!id) return;
    setNavRegistry((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const upsertCta = useCallback((id, payload) => {
    if (!id) return;
    setCtaRegistry((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        ...payload,
        updatedAt: Date.now(),
      },
    }));
  }, []);

  const removeCta = useCallback((id) => {
    if (!id) return;
    setCtaRegistry((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const setSuspended = useCallback((id, suspended = true, options = {}) => {
    if (!id) return;
    setSuspendRegistry((prev) => {
      if (!suspended) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }

      return {
        ...prev,
        [id]: {
          at: Date.now(),
          keepNavOpen: Boolean(options?.keepNavOpen),
        },
      };
    });
  }, []);

  const clearSuspended = useCallback((id) => {
    if (!id) return;
    setSuspendRegistry((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const activeNav = useMemo(() => pickActiveItem(navRegistry), [navRegistry]);
  const activeCta = useMemo(() => pickActiveItem(ctaRegistry), [ctaRegistry]);
  const isSuspended = useMemo(() => Object.keys(suspendRegistry).length > 0, [suspendRegistry]);
  const keepNavDuringSuspend = useMemo(
    () => Object.values(suspendRegistry).some((entry) => Boolean(entry?.keepNavOpen)),
    [suspendRegistry]
  );
  const isUiAutoSuspended = isTextInputActive || isVirtualKeyboardVisible;
  const effectiveSuspended = isSuspended || isUiAutoSuspended;
  const shouldKeepNavWhileSuspended = isSuspended && keepNavDuringSuspend && !isUiAutoSuspended;

  const hasNav = Boolean(ready && isMobile && activeNav);
  const hasCta = Boolean(ready && isMobile && activeCta);
  const showDock = hasNav || hasCta;

  useEffect(() => {
    dockCollapsedRef.current = isDockCollapsed;
  }, [isDockCollapsed]);

  useEffect(() => {
    if (!hasCta || !hasNav) {
      setIsNavExpanded(false);
    }
  }, [hasCta, hasNav]);

  useEffect(() => {
    if (!isMobile) {
      setIsNavExpanded(false);
      setIsDockCollapsed(false);
      setIsTextInputActive(false);
      setIsVirtualKeyboardVisible(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (effectiveSuspended) {
      if (!shouldKeepNavWhileSuspended) {
        setIsNavExpanded(false);
      }
      setIsDockCollapsed(false);
    }
  }, [effectiveSuspended, shouldKeepNavWhileSuspended]);

  useEffect(() => {
    if (!isDockInteracting) return;
    setIsDockCollapsed(false);
  }, [isDockInteracting]);

  useEffect(() => {
    if (!ready || !isMobile || !showDock || effectiveSuspended || isNavExpanded || isDockInteracting) {
      setIsDockCollapsed(false);
      return undefined;
    }
    if (typeof window === "undefined") return undefined;

    let ticking = false;
    scrollStateRef.current.lastY = window.scrollY || 0;
    scrollStateRef.current.downAccum = 0;
    scrollStateRef.current.upAccum = 0;
    scrollStateRef.current.lockUntil = 0;

    const collapseEnterY = 108;
    const collapseDistance = 42;
    const expandDistance = 26;
    const topSnapY = 26;
    const minStepDelta = 2;
    const settleWindowMs = 140;

    const setCollapsedSafely = (nextValue) => {
      if (dockCollapsedRef.current === nextValue) return;
      dockCollapsedRef.current = nextValue;
      setIsDockCollapsed(nextValue);
    };

    const updateCollapsedState = () => {
      const now = performance.now();
      const state = scrollStateRef.current;
      const currentY = window.scrollY || 0;
      const deltaY = currentY - state.lastY;
      state.lastY = currentY;

      if (Math.abs(deltaY) < minStepDelta) return;
      if (now < state.lockUntil) return;

      if (deltaY > 0) {
        state.downAccum += deltaY;
        state.upAccum = 0;
      } else {
        state.upAccum += Math.abs(deltaY);
        state.downAccum = 0;
      }

      const currentlyCollapsed = dockCollapsedRef.current;

      if (!currentlyCollapsed) {
        if (currentY > collapseEnterY && state.downAccum >= collapseDistance) {
          setCollapsedSafely(true);
          state.downAccum = 0;
          state.upAccum = 0;
          state.lockUntil = now + settleWindowMs;
        }
        return;
      }

      if (currentY <= topSnapY || state.upAccum >= expandDistance) {
        setCollapsedSafely(false);
        state.downAccum = 0;
        state.upAccum = 0;
        state.lockUntil = now + settleWindowMs;
      }
    };

    updateCollapsedState();

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateCollapsedState();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ready, isMobile, showDock, effectiveSuspended, isNavExpanded, isDockInteracting]);

  const dockRootTransition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0.01 }
        : {
            y: { type: "spring", stiffness: 360, damping: 34, mass: 0.78, restDelta: 0.001 },
            scale: { type: "spring", stiffness: 320, damping: 31, mass: 0.8, restDelta: 0.001 },
            opacity: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
          },
    [prefersReducedMotion]
  );

  const dockSheetTransition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0.01 }
        : {
            y: { type: "spring", stiffness: 340, damping: 30, mass: 0.76, restDelta: 0.001 },
            scale: { type: "spring", stiffness: 300, damping: 27, mass: 0.78, restDelta: 0.001 },
            opacity: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
          },
    [prefersReducedMotion]
  );

  const dockFadeTransition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0.01 }
        : { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
    [prefersReducedMotion]
  );

  useEffect(() => () => {
    if (interactionReleaseTimerRef.current) {
      window.clearTimeout(interactionReleaseTimerRef.current);
      interactionReleaseTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--adaptive-mobile-dock-space", "0px");
        document.documentElement.style.setProperty("--lmx-mobile-viewport-bottom-offset", "0px");
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;

    const root = document.documentElement;
    const viewport = window.visualViewport;

    if (!viewport) {
      root.style.setProperty("--lmx-mobile-viewport-bottom-offset", "0px");
      setIsVirtualKeyboardVisible(false);
      return undefined;
    }

    let rafId = null;
    const updateViewportBottomOffset = () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const bottomOffset = Math.max(
          0,
          Math.round(window.innerHeight - (viewport.height + viewport.offsetTop))
        );
        root.style.setProperty("--lmx-mobile-viewport-bottom-offset", `${bottomOffset}px`);
        const keyboardVisible = isMobile && bottomOffset > 80;
        setIsVirtualKeyboardVisible((prev) => (prev === keyboardVisible ? prev : keyboardVisible));
      });
    };

    updateViewportBottomOffset();
    viewport.addEventListener("resize", updateViewportBottomOffset);
    viewport.addEventListener("scroll", updateViewportBottomOffset);
    window.addEventListener("orientationchange", updateViewportBottomOffset);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      viewport.removeEventListener("resize", updateViewportBottomOffset);
      viewport.removeEventListener("scroll", updateViewportBottomOffset);
      window.removeEventListener("orientationchange", updateViewportBottomOffset);
      root.style.setProperty("--lmx-mobile-viewport-bottom-offset", "0px");
    };
  }, [isMobile]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const isTextualInput = (node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (node.isContentEditable) return true;

      const tag = String(node.tagName || "").toLowerCase();
      if (tag === "textarea") return true;
      if (tag !== "input") return false;

      const type = String(node.getAttribute("type") || "text").toLowerCase();
      return ![
        "checkbox",
        "radio",
        "button",
        "submit",
        "reset",
        "file",
        "range",
        "color",
        "date",
        "month",
        "week",
        "time",
        "datetime-local",
        "hidden",
      ].includes(type);
    };

    const syncInputState = () => {
      const active = document.activeElement;
      setIsTextInputActive((prev) => {
        const next = isTextualInput(active);
        return prev === next ? prev : next;
      });
    };

    const onFocusOut = () => {
      window.requestAnimationFrame(syncInputState);
    };

    syncInputState();
    document.addEventListener("focusin", syncInputState);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      document.removeEventListener("focusin", syncInputState);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;

    if (!showDock || effectiveSuspended || isDockCollapsed) {
      root.style.setProperty("--adaptive-mobile-dock-space", "0px");
      return undefined;
    }

    const updateDockSpace = () => {
      const nextHeight = rowRef.current?.getBoundingClientRect?.().height || 0;
      root.style.setProperty("--adaptive-mobile-dock-space", `${Math.ceil(nextHeight)}px`);
    };

    updateDockSpace();

    let observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => updateDockSpace());
      if (rowRef.current) {
        observer.observe(rowRef.current);
      }
    }

    return () => {
      observer?.disconnect?.();
    };
  }, [showDock, hasCta, hasNav, isNavExpanded, activeNav, activeCta, effectiveSuspended, isDockCollapsed]);

  const closeNav = useCallback(() => setIsNavExpanded(false), []);

  const beginDockInteraction = useCallback(() => {
    if (interactionReleaseTimerRef.current) {
      window.clearTimeout(interactionReleaseTimerRef.current);
      interactionReleaseTimerRef.current = null;
    }
    setIsDockInteracting(true);
    setIsDockCollapsed(false);
  }, []);

  const endDockInteraction = useCallback(() => {
    if (interactionReleaseTimerRef.current) {
      window.clearTimeout(interactionReleaseTimerRef.current);
    }
    interactionReleaseTimerRef.current = window.setTimeout(() => {
      setIsDockInteracting(false);
      interactionReleaseTimerRef.current = null;
    }, 110);
  }, []);

  const contextValue = useMemo(
    () => ({
      ready,
      isMobile,
      isSuspended: effectiveSuspended,
      upsertNav,
      removeNav,
      upsertCta,
      removeCta,
      setSuspended,
      clearSuspended,
      closeNav,
    }),
    [
      ready,
      isMobile,
      effectiveSuspended,
      upsertNav,
      removeNav,
      upsertCta,
      removeCta,
      setSuspended,
      clearSuspended,
      closeNav,
    ]
  );

  return (
    <AdaptiveMobileDockContext.Provider value={contextValue}>
      {children}

      <AnimatePresence>
        {showDock && (
          <>
            {hasCta && hasNav && isNavExpanded && !effectiveSuspended && (
              <motion.button
                type="button"
                aria-label="Zatvori meni"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={dockFadeTransition}
                onClick={closeNav}
                onPointerDown={beginDockInteraction}
                onPointerUp={endDockInteraction}
                onPointerCancel={endDockInteraction}
                onPointerLeave={endDockInteraction}
                className="fixed inset-0 z-[64] bg-slate-950/20 backdrop-blur-[1.5px] lg:hidden"
              />
            )}

            <motion.div
              initial={
                prefersReducedMotion
                  ? { y: 0, opacity: 1, scale: 1 }
                  : { y: "calc(100% + 14px)", opacity: 0, scale: 0.985 }
              }
              animate={
                effectiveSuspended
                  ? { y: "calc(100% + 18px)", opacity: 0, scale: 0.98 }
                  : isDockCollapsed && !isNavExpanded
                    ? { y: "calc(100% + 10px)", opacity: 0, scale: 0.988 }
                    : { y: 0, opacity: 1, scale: 1 }
              }
              exit={
                prefersReducedMotion
                  ? { y: 0, opacity: 0, scale: 1 }
                  : { y: "calc(100% + 14px)", opacity: 0, scale: 0.985 }
              }
              transition={dockRootTransition}
              className="fixed inset-x-0 bottom-0 z-[65] pointer-events-none lg:hidden"
              style={{
                bottom: "var(--lmx-mobile-viewport-bottom-offset, 0px)",
                willChange: "transform, opacity",
                transform: "translateZ(0)",
                transformOrigin: "50% 100%",
              }}
            >
              <div
                ref={rowRef}
                className="mx-auto w-full max-w-7xl sm:px-4"
              >
                <LayoutGroup id="adaptive-mobile-dock">
                  <div className="relative">
                    <AnimatePresence>
                      {hasCta && hasNav && isNavExpanded && (!effectiveSuspended || shouldKeepNavWhileSuspended) && (
                        <motion.div
                          initial={
                            prefersReducedMotion
                              ? { opacity: 1, y: 0, scale: 1 }
                              : { opacity: 0, y: 22, scale: 0.972 }
                          }
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={
                            prefersReducedMotion
                              ? { opacity: 0, y: 0, scale: 1 }
                              : { opacity: 0, y: 16, scale: 0.98 }
                          }
                          transition={dockSheetTransition}
                          className="pointer-events-auto absolute inset-x-0 bottom-full mb-2"
                          onPointerDownCapture={beginDockInteraction}
                          onPointerUpCapture={endDockInteraction}
                          onPointerCancelCapture={endDockInteraction}
                          onPointerLeaveCapture={endDockInteraction}
                        >
                          <motion.div
                            layoutId="adaptive-dock-nav-shell"
                            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
                          >
                            {activeNav?.renderFull?.({ closeNav })}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div
                      className={`rounded-t-3xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_-18px_40px_-26px_rgba(15,23,42,0.42)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 ${
                        effectiveSuspended ? "pointer-events-none" : "pointer-events-auto"
                      }`}
                      onPointerDownCapture={beginDockInteraction}
                      onPointerUpCapture={endDockInteraction}
                      onPointerCancelCapture={endDockInteraction}
                      onPointerLeaveCapture={endDockInteraction}
                    >
                      <div className="flex items-center gap-2">
                        {hasCta && (
                          <motion.div layout className="min-w-0 flex-1">
                            {activeCta?.render?.({ closeNav })}
                          </motion.div>
                        )}

                        {hasNav &&
                          (hasCta ? (
                            !isNavExpanded && (
                              <motion.button
                                type="button"
                                layoutId="adaptive-dock-nav-shell"
                                onClick={() => setIsNavExpanded(true)}
                                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                                className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-200 dark:hover:bg-slate-700"
                                aria-label="Otvori meni"
                              >
                                {activeNav?.renderCompact?.({ isExpanded: false }) || <Menu className="h-5 w-5" />}
                              </motion.button>
                            )
                          ) : (
                            <motion.div
                              layoutId="adaptive-dock-nav-shell"
                              className="min-w-0 flex-1 rounded-xl"
                            >
                              {activeNav?.renderFull?.({ closeNav })}
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  </div>
                </LayoutGroup>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdaptiveMobileDockContext.Provider>
  );
};

export const useAdaptiveMobileDock = () => useContext(AdaptiveMobileDockContext);
