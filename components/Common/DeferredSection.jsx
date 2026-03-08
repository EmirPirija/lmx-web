"use client";

import { useEffect, useRef, useState } from "react";

const DeferredSection = ({
  children,
  placeholder = null,
  className = "",
  rootMargin = "480px 0px",
  threshold = 0.01,
  minHeight = 0,
  idleTimeoutMs = 2200,
}) => {
  const hostRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return undefined;
    if (typeof window === "undefined") {
      setShouldRender(true);
      return undefined;
    }

    let observer = null;
    let timeoutId = null;
    let idleId = null;
    let activated = false;

    const activate = () => {
      if (activated) return;
      activated = true;
      setShouldRender(true);
    };

    if ("IntersectionObserver" in window && hostRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            activate();
            observer?.disconnect();
          }
        },
        { root: null, rootMargin, threshold },
      );
      observer.observe(hostRef.current);
    }

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(
        () => {
          activate();
        },
        { timeout: idleTimeoutMs },
      );
    } else {
      timeoutId = window.setTimeout(() => {
        activate();
      }, idleTimeoutMs);
    }

    return () => {
      observer?.disconnect();
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [idleTimeoutMs, rootMargin, shouldRender, threshold]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={minHeight ? { minHeight } : undefined}
    >
      {shouldRender ? children : placeholder}
    </div>
  );
};

export default DeferredSection;
