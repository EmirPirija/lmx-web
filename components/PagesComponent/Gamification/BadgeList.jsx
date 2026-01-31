"use client";

import React from "react";
import Badge from "./Badge";

/**
 * BadgeList.jsx (BS ijekavica)
 * - Minimal layout, radi i za earned i za locked
 */

export default function BadgeList({
  badges,
  title,
  emptyMessage = "Nema bedževa za prikaz.",
  size = "md",
  locked = false,
  showDescription = false,
  className,
  onBadgeClick,
}) {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-slate-500 dark:text-slate-300">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title ? <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3> : null}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {badges.map((b) => (
          <Badge
            key={b?.id ?? b?.slug ?? b?.name ?? Math.random()}
            badge={b}
            size={size}
            locked={locked || Boolean(b?.locked || b?.is_locked)}
            showName={true}
            showDescription={showDescription}
            interactive={typeof onBadgeClick === "function"}
            onClick={() => onBadgeClick?.(b)}
          />
        ))}
      </div>
    </div>
  );
}