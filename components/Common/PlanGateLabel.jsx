"use client";

import { cn } from "@/lib/utils";
import MembershipBadge from "@/components/Common/MembershipBadge";

const PlanGateLabel = ({
  scope = "shop",
  unlocked = false,
  showStatus = true,
  className,
}) => {
  const isProOrShop = scope === "pro_or_shop";

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {isProOrShop ? (
        <>
          <MembershipBadge tier="pro" size="xs" uppercase />
          <MembershipBadge tier="shop" size="xs" uppercase />
        </>
      ) : (
        <MembershipBadge tier="shop" size="xs" uppercase />
      )}

      {showStatus ? (
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            unlocked
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-100 text-slate-500"
          )}
        >
          {unlocked ? "Otključano" : "Zaključano"}
        </span>
      ) : null}
    </div>
  );
};

export default PlanGateLabel;

