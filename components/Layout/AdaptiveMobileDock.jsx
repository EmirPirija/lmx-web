"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
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
  const [navRegistry, setNavRegistry] = useState({});
  const [ctaRegistry, setCtaRegistry] = useState({});
  const [suspendRegistry, setSuspendRegistry] = useState({});
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isDockInteracting, setIsDockInteracting] = useState(false);
  const rowRef = useRef(null);
  const lastScrollYRef = useRef(0);
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

  const setSuspended = useCallback((id, suspended = true) => {
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
        [id]: Date.now(),
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

  const hasNav = Boolean(ready && isMobile && activeNav);
  const hasCta = Boolean(ready && isMobile && activeCta);
  const showDock = hasNav || hasCta;

  useEffect(() => {
    if (!hasCta || !hasNav) {
      setIsNavExpanded(false);
    }
  }, [hasCta, hasNav]);

  useEffect(() => {
    if (!isMobile) {
      setIsNavExpanded(false);
      setIsDockCollapsed(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isSuspended) {
      setIsNavExpanded(false);
      setIsDockCollapsed(false);
    }
  }, [isSuspended]);

  useEffect(() => {
    if (!isDockInteracting) return;
    setIsDockCollapsed(false);
  }, [isDockInteracting]);

  useEffect(() => {
    if (!ready || !isMobile || !showDock || isSuspended || isNavExpanded || isDockInteracting) {
      setIsDockCollapsed(false);
      return undefined;
    }
    if (typeof window === "undefined") return undefined;

    let ticking = false;
    lastScrollYRef.current = window.scrollY || 0;

    const collapseEnterThreshold = 120;
    const deltaThreshold = 6;

    const updateCollapsedState = () => {
      const currentY = window.scrollY || 0;
      const deltaY = currentY - lastScrollYRef.current;
      const isScrollingDown = deltaY > deltaThreshold;
      const isScrollingUp = deltaY < -deltaThreshold;

      setIsDockCollapsed((prev) => {
        if (currentY <= 32) return false;
        if (!prev && isScrollingDown && currentY > collapseEnterThreshold) return true;
        if (prev && isScrollingUp) return false;
        return prev;
      });

      lastScrollYRef.current = currentY;
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
  }, [ready, isMobile, showDock, isSuspended, isNavExpanded, isDockInteracting]);

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
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;

    if (!showDock || isSuspended || isDockCollapsed) {
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
  }, [showDock, hasCta, hasNav, isNavExpanded, activeNav, activeCta, isSuspended, isDockCollapsed]);

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
    }, 180);
  }, []);

  const contextValue = useMemo(
    () => ({
      ready,
      isMobile,
      isSuspended,
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
      isSuspended,
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
            {hasCta && hasNav && isNavExpanded && !isSuspended && (
              <motion.button
                type="button"
                aria-label="Zatvori meni"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeNav}
                onPointerDown={beginDockInteraction}
                onPointerUp={endDockInteraction}
                onPointerCancel={endDockInteraction}
                onPointerLeave={endDockInteraction}
                className="fixed inset-0 z-[64] bg-slate-950/20 backdrop-blur-[1.5px] lg:hidden"
              />
            )}

            <motion.div
              initial={{ y: 22, opacity: 0 }}
              animate={
                isSuspended
                  ? { y: "120%", opacity: 0 }
                  : isDockCollapsed && !isNavExpanded
                    ? { y: "115%", opacity: 0 }
                    : { y: 0, opacity: 1 }
              }
              exit={{ y: 14, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-[65] pointer-events-none lg:hidden"
              style={{ bottom: "var(--lmx-mobile-viewport-bottom-offset, 0px)" }}
            >
              <div
                ref={rowRef}
                className="mx-auto w-full max-w-7xl px-3 pt-2 sm:px-4"
                style={{
                  paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)",
                }}
              >
                <LayoutGroup id="adaptive-mobile-dock">
                  <div className="relative">
                    <AnimatePresence>
                      {hasCta && hasNav && isNavExpanded && !isSuspended && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.24 }}
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
                      className={`rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_-12px_35px_-22px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 ${
                        isSuspended ? "pointer-events-none" : "pointer-events-auto"
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
