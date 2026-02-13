"use client";

import { Crown, Store } from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";
import { resolveMembership } from "@/lib/membership";

const sizeClasses = {
  xs: "text-[10px] px-2 py-0.5 gap-1",
  sm: "text-xs px-2.5 py-1 gap-1.5",
  md: "text-sm px-3 py-1.5 gap-1.5",
};

const tierClasses = {
  pro: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-700/45",
  shop:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/25 dark:text-indigo-300 dark:border-indigo-700/45",
};

export default function MembershipBadge({
  tier,
  source,
  size = "xs",
  uppercase = true,
  showLabel = true,
  className,
}) {
  const resolved = source ? resolveMembership(source) : resolveMembership({ tier });
  if (!resolved?.isPremium) return null;

  const key = resolved.tier === "shop" ? "shop" : "pro";
  const Icon = key === "shop" ? Store : Crown;
  const label = key === "shop" ? "SHOP" : "PRO";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold tracking-wide",
        sizeClasses[size] || sizeClasses.xs,
        tierClasses[key],
        className
      )}
    >
      <Icon
        size={size === "xs" ? 10 : 12}
        color="currentColor"
        secondaryColor="currentColor"
      />
      {showLabel ? <span>{uppercase ? label : label.toLowerCase()}</span> : null}
    </span>
  );
}
