"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
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

const isTextualInputElement = (node) => {
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
  const enableAutoCollapse = false;
  const [navRegistry, setNavRegistry] = useState({});
  const [ctaRegistry, setCtaRegistry] = useState({});
  const [suspendRegistry, setSuspendRegistry] = useState({});
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isDockInteracting, setIsDockInteracting] = useState(false);
  const [isTextInputActive, setIsTextInputActive] = useState(false);
  const [isVirtualKeyboardVisible, setIsVirtualKeyboardVisible] =
    useState(false);
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
  const shouldLockDockVisible = Boolean(activeCta?.preventAutoHide);
  const isSuspended = useMemo(
    () => Object.keys(suspendRegistry).length > 0,
    [suspendRegistry],
  );
  const keepNavDuringSuspend = useMemo(
    () =>
      Object.values(suspendRegistry).some((entry) =>
        Boolean(entry?.keepNavOpen),
      ),
    [suspendRegistry],
  );
  const isUiAutoSuspended = isTextInputActive;
  const effectiveSuspended = isSuspended || isUiAutoSuspended;
  const shouldKeepNavWhileSuspended =
    isSuspended && keepNavDuringSuspend && !isUiAutoSuspended;

  const hasNav = Boolean(ready && isMobile && activeNav);
  const hasCta = Boolean(ready && isMobile && activeCta);
  const showDock = hasNav || hasCta;

  useEffect(() => {
    if (typeof window === "undefined" || !isMobile) return undefined;

    const STALE_SUSPEND_TTL_MS = 3 * 60 * 1000;
    const intervalId = window.setInterval(() => {
      setSuspendRegistry((prev) => {
        if (!prev || Object.keys(prev).length === 0) return prev;

        const now = Date.now();
        let mutated = false;
        const next = {};

        Object.entries(prev).forEach(([id, entry]) => {
          const at = Number(entry?.at || 0);
          if (at > 0 && now - at > STALE_SUSPEND_TTL_MS) {
            mutated = true;
            return;
          }
          next[id] = entry;
        });

        return mutated ? next : prev;
      });
    }, 45000);

    return () => window.clearInterval(intervalId);
  }, [isMobile]);

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
    if (typeof document === "undefined") return undefined;
    if (typeof MutationObserver === "undefined") return undefined;

    const root = document.documentElement;
    let rafId = null;
    const revealDock = () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        if (!ready || !isMobile || !showDock) return;
        dockCollapsedRef.current = false;
        setIsDockCollapsed(false);
      });
    };

    const observer = new MutationObserver((mutations) => {
      const hasThemeMutation = mutations.some(
        (mutation) =>
          mutation.attributeName === "class" ||
          mutation.attributeName === "data-theme",
      );
      if (!hasThemeMutation) return;
      revealDock();
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => {
      observer.disconnect();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [ready, isMobile, showDock]);

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
    if (
      !enableAutoCollapse ||
      !ready ||
      !isMobile ||
      !showDock ||
      effectiveSuspended ||
      isNavExpanded ||
      isDockInteracting ||
      shouldLockDockVisible
    ) {
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
  }, [
    enableAutoCollapse,
    ready,
    isMobile,
    showDock,
    effectiveSuspended,
    isNavExpanded,
    isDockInteracting,
    shouldLockDockVisible,
  ]);

  const dockRootTransition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0.01 }
        : {
            y: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
            scale: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
          },
    [prefersReducedMotion],
  );

  const dockSheetTransition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0.01 }
        : {
            y: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
            scale: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
          },
    [prefersReducedMotion],
  );

  const dockFadeTransition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0.01 }
        : { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
    [prefersReducedMotion],
  );

  useEffect(
    () => () => {
      if (interactionReleaseTimerRef.current) {
        window.clearTimeout(interactionReleaseTimerRef.current);
        interactionReleaseTimerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty(
          "--adaptive-mobile-dock-space",
          "0px",
        );
        document.documentElement.style.setProperty(
          "--lmx-mobile-viewport-bottom-offset",
          "0px",
        );
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined")
      return undefined;

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
          Math.round(
            window.innerHeight - (viewport.height + viewport.offsetTop),
          ),
        );
        root.style.setProperty(
          "--lmx-mobile-viewport-bottom-offset",
          `${bottomOffset}px`,
        );
        const focusedTextInput = isTextualInputElement(document.activeElement);
        const keyboardVisible =
          isMobile &&
          (bottomOffset > 170 || (bottomOffset > 80 && focusedTextInput));
        setIsVirtualKeyboardVisible((prev) =>
          prev === keyboardVisible ? prev : keyboardVisible,
        );
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
      window.removeEventListener(
        "orientationchange",
        updateViewportBottomOffset,
      );
      root.style.setProperty("--lmx-mobile-viewport-bottom-offset", "0px");
    };
  }, [isMobile]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const syncInputState = () => {
      const active = document.activeElement;
      setIsTextInputActive((prev) => {
        const next = isTextualInputElement(active);
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
    if (!isMobile) return undefined;
    if (!isVirtualKeyboardVisible) return undefined;
    if (isSuspended) return undefined;
    if (isTextInputActive) return undefined;

    const timeoutId = window.setTimeout(() => {
      setIsVirtualKeyboardVisible(false);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [isMobile, isSuspended, isTextInputActive, isVirtualKeyboardVisible]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;

    if (!showDock || effectiveSuspended || isDockCollapsed) {
      root.style.setProperty("--adaptive-mobile-dock-space", "0px");
      return undefined;
    }

    const updateDockSpace = () => {
      const nextHeight = rowRef.current?.getBoundingClientRect?.().height || 0;
      root.style.setProperty(
        "--adaptive-mobile-dock-space",
        `${Math.ceil(nextHeight)}px`,
      );
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
  }, [
    showDock,
    hasCta,
    hasNav,
    isNavExpanded,
    activeNav,
    activeCta,
    effectiveSuspended,
    isDockCollapsed,
  ]);

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
    }, 140);
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
    ],
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
                className="fixed inset-0 z-[119] bg-slate-950/45 lg:hidden"
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
                  : isDockCollapsed && !isNavExpanded && !shouldLockDockVisible
                    ? { y: "calc(100% + 10px)", opacity: 0, scale: 0.988 }
                    : { y: 0, opacity: 1, scale: 1 }
              }
              exit={
                prefersReducedMotion
                  ? { y: 0, opacity: 0, scale: 1 }
                  : { y: "calc(100% + 14px)", opacity: 0, scale: 0.985 }
              }
              transition={dockRootTransition}
              className="fixed inset-x-0 bottom-0 z-[120] pointer-events-none px-0 lg:hidden"
              style={{
                bottom: "var(--lmx-mobile-viewport-bottom-offset, 0px)",
                willChange: "transform, opacity",
                transform: "translateZ(0)",
                transformOrigin: "50% 100%",
              }}
            >
              <div ref={rowRef} className="mx-auto w-full max-w-none">
                <LayoutGroup id="adaptive-mobile-dock">
                  <div className="relative">
                    <AnimatePresence>
                      {hasCta &&
                        hasNav &&
                        isNavExpanded &&
                        (!effectiveSuspended ||
                          shouldKeepNavWhileSuspended) && (
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
                              className="relative overflow-hidden rounded-none border border-b-0 border-x-0 border-slate-200 bg-white p-2 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-900"
                            >
                              <motion.span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent"
                                animate={{ opacity: [0.4, 0.9, 0.4] }}
                                transition={{
                                  duration: 2.8,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />
                              <motion.span
                                aria-hidden="true"
                                className="pointer-events-none absolute -left-20 top-0 h-24 w-40 rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-500/20"
                                animate={{
                                  x: [0, 26, 0],
                                  opacity: [0.2, 0.36, 0.2],
                                }}
                                transition={{
                                  duration: 4.2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />
                              <div className="relative z-[1]">
                                {activeNav?.renderFull?.({ closeNav })}
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                      initial={false}
                      animate={{
                        boxShadow: isNavExpanded
                          ? "0 -22px 44px -28px rgba(15,23,42,0.56)"
                          : "0 -18px 40px -26px rgba(15,23,42,0.42)",
                      }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0.01 }
                          : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }
                      }
                      className={`relative overflow-hidden rounded-none border border-b-0 border-x-0 border-slate-200 bg-white px-2 py-2 shadow-[0_-18px_40px_-26px_rgba(15,23,42,0.42)] dark:border-slate-700 dark:bg-slate-900 ${
                        effectiveSuspended
                          ? "pointer-events-none"
                          : "pointer-events-auto"
                      }`}
                      onPointerDownCapture={beginDockInteraction}
                      onPointerUpCapture={endDockInteraction}
                      onPointerCancelCapture={endDockInteraction}
                      onPointerLeaveCapture={endDockInteraction}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/65 to-transparent"
                        animate={{ opacity: [0.4, 0.88, 0.4] }}
                        transition={{
                          duration: 2.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.span
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-12 left-1/3 h-20 w-24 rounded-full bg-emerald-300/30 blur-2xl dark:bg-emerald-500/20"
                        animate={{
                          x: [-8, 18, -8],
                          opacity: [0.22, 0.4, 0.22],
                        }}
                        transition={{
                          duration: 4.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <div className="relative z-[1] flex items-center gap-2">
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
                                whileHover={
                                  prefersReducedMotion
                                    ? undefined
                                    : { y: -1, scale: 1.01 }
                                }
                                whileTap={
                                  prefersReducedMotion
                                    ? undefined
                                    : { scale: 0.96 }
                                }
                                className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-200 dark:hover:bg-slate-700"
                                aria-label="Otvori meni"
                              >
                                <motion.span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/35 to-transparent dark:via-white/15"
                                  animate={{ opacity: [0.25, 0.62, 0.25] }}
                                  transition={{
                                    duration: 2.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                />
                                {activeNav?.renderCompact?.({
                                  isExpanded: false,
                                }) || <Menu className="h-5 w-5" />}
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
                    </motion.div>
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

export const useAdaptiveMobileDock = () =>
  useContext(AdaptiveMobileDockContext);
