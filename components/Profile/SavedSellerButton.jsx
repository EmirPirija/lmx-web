"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSavedUser } from "@/hooks/useSavedUser";

function BookmarkIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4.75C7 3.784 7.784 3 8.75 3h6.5C16.216 3 17 3.784 17 4.75V21l-5-3-5 3V4.75Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SavedSellerButton({ sellerId, className }) {
  const { saved, loading, booting, toggle } = useSavedUser(sellerId, { enabled: true });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!booting) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 280);
      return () => clearTimeout(t);
    }
  }, [saved, booting]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || !sellerId}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
        "transition-all duration-200 active:scale-[0.98]",
        saved
          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
          : "bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
        pulse && "animate-in zoom-in-95",
        className
      )}
    >
      <span className={cn("transition-transform duration-200", saved && "scale-[1.02]")}>
        <BookmarkIcon filled={saved} />
      </span>

      <span className="whitespace-nowrap">
        {saved ? "Sačuvan" : "Sačuvaj"}
      </span>

      {/* mini inline feedback bez toasta */}
      <span
        className={cn(
          "ml-1 text-xs opacity-0 translate-x-[-2px] transition-all duration-200",
          saved && "opacity-100 translate-x-0"
        )}
      >
        ✓
      </span>
    </button>
  );
}
