"use client";

import { Crown, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveMembership } from "@/lib/membership";

const sizeClasses = {
  xs: "text-[10px] px-2 py-0.5 gap-1",
  sm: "text-xs px-2.5 py-1 gap-1.5",
  md: "text-sm px-3 py-1.5 gap-1.5",
};

const tierClasses = {
  pro: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/35 dark:text-amber-300 dark:border-amber-700/45",
  shop: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/35 dark:text-blue-300 dark:border-blue-700/45",
};

export default function MembershipBadge({
  tier,
  source,
  size = "xs",
  uppercase = true,
  className,
}) {
  const resolved = source ? resolveMembership(source) : resolveMembership({ tier });
  if (!resolved?.isPremium) return null;

  const key = resolved.tier === "shop" ? "shop" : "pro";
  const Icon = key === "shop" ? Store : Crown;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        sizeClasses[size] || sizeClasses.xs,
        tierClasses[key],
        className
      )}
    >
      <Icon size={size === "xs" ? 10 : 12} />
      <span>{uppercase ? resolved.label.toUpperCase() : resolved.label}</span>
    </span>
  );
}

