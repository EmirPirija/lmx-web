"use client";

import { cn } from "@/lib/utils";
import MembershipBadge from "@/components/Common/MembershipBadge";
import { isPromoFreeAccessEnabled } from "@/lib/promoMode";

const PlanGateLabel = ({
  scope = "shop",
  unlocked = false,
  showStatus = true,
  className,
}) => {
  const promoEnabled = isPromoFreeAccessEnabled();
  const effectiveUnlocked = promoEnabled || unlocked;
  const isProOrShop = scope === "pro_or_shop";

  if (promoEnabled) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200">
          Promo režim
        </span>
        {showStatus ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
            Besplatno otključano
          </span>
        ) : null}
      </div>
    );
  }

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
            effectiveUnlocked
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-100 text-slate-500"
          )}
        >
          {effectiveUnlocked ? "Otključano" : "Zaključano"}
        </span>
      ) : null}
    </div>
  );
};

export default PlanGateLabel;
