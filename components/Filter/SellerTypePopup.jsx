"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useNavigate } from "../Common/useNavigate";
import {
  BadgeCheck,
  Check,
  Crown,
  RotateCcw,
  Store,
  User,
  Users,
  X,
} from "@/components/Common/UnifiedIconPack";

const SELLER_TYPE_OPTIONS = [
  {
    value: "",
    label: "Svi prodavači",
    description: "Prikaži sve oglase bez ograničenja tipa profila.",
    icon: Users,
  },
  {
    value: "shop",
    label: "Samo SHOP",
    description: "Prikaži oglase trgovina i shop profila.",
    icon: Store,
  },
  {
    value: "pro",
    label: "Samo PRO",
    description: "Prikaži oglase premium individualnih prodavača.",
    icon: Crown,
  },
  {
    value: "free",
    label: "Samo obični",
    description: "Prikaži oglase standardnih korisničkih profila.",
    icon: User,
  },
  {
    value: "premium",
    label: "PRO + SHOP",
    description: "Prikaži sve premium profile zajedno.",
    icon: BadgeCheck,
  },
];

const SellerTypePopup = ({ onClose }) => {
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sellerType, setSellerType] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    setSellerType((searchParams.get("seller_type") || "").toLowerCase());
    setVerifiedOnly(searchParams.get("seller_verified") === "1");
  }, [searchParams]);

  const pushUrl = (params) => {
    if (params.has("page")) params.set("page", "1");
    const url = `/ads?${params.toString()}`;
    if (pathname.startsWith("/ads")) {
      window.history.pushState(null, "", url);
      return;
    }
    navigate(url);
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    if (sellerType) params.set("seller_type", sellerType);
    else params.delete("seller_type");

    if (verifiedOnly) params.set("seller_verified", "1");
    else params.delete("seller_verified");

    pushUrl(params);
    onClose();
  };

  const handleReset = () => {
    setSellerType("");
    setVerifiedOnly(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Tip prodavača
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fokusiraj rezultate po tipu profila.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-4">
          {SELLER_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = sellerType === option.value;
            return (
              <button
                key={option.value || "all"}
                onClick={() => setSellerType(option.value)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? "border-cyan-400 bg-cyan-50/70 dark:border-cyan-500/70 dark:bg-cyan-900/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`rounded-xl border p-2 ${
                        isActive
                          ? "border-cyan-300 bg-cyan-100 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
                          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {option.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="rounded-full bg-cyan-500 p-1 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          <button
            onClick={() => setVerifiedOnly((prev) => !prev)}
            className={`flex w-full items-center justify-between rounded-2xl border p-4 transition ${
              verifiedOnly
                ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-900/20"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
            }`}
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Samo verificirani prodavači
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Prikaži samo profile sa potvrđenim statusom.
              </p>
            </div>
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                verifiedOnly ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  verifiedOnly ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </span>
          </button>
        </div>

        <div className="flex gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70">
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            Poništi
          </button>
          <button
            onClick={handleApply}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500"
          >
            Primijeni filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerTypePopup;
