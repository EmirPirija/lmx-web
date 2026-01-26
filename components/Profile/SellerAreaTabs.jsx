"use client";

import { usePathname } from "next/navigation";
import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import { FiGrid, FiSettings } from "react-icons/fi";

const tabs = [
  { href: "/profile/seller", label: "Dashboard", icon: FiGrid },
  { href: "/profile/seller-settings", label: "Postavke", icon: FiSettings },
];

export default function SellerAreaTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          {tabs.map((t) => {
            const active = pathname === t.href;
            const Icon = t.icon;

            return (
              <CustomLink
                key={t.href}
                href={t.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border text-sm font-semibold",
                  active
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Icon size={16} className={active ? "text-white" : "text-slate-500"} />
                <span>{t.label}</span>
              </CustomLink>
            );
          })}
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Sve vezano za prodaju na jednom mjestu: pregled, status, poruke i Pro/Shop.
      </div>
    </div>
  );
}
