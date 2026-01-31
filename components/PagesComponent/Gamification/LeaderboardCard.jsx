"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * LeaderboardCard.jsx (BS ijekavica)
 * - neutral/premium (bez šarenila)
 * - "Verificiran" label
 */

const CheckSeal = ({ label = "Verificiran" }) => (
  <span
    title={label}
    className={cn(
      "inline-flex items-center gap-1.5 select-none",
      "h-6 px-2.5 text-xs font-semibold rounded-full",
      "border border-slate-200/70 dark:border-slate-700/70",
      "bg-white/70 dark:bg-slate-900/60",
      "text-slate-800 dark:text-slate-100"
    )}
  >
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.6l2.3 1.3 2.6-.2 1.3 2.3 2.3 1.3-.2 2.6 1.3 2.3-1.3 2.3.2 2.6-2.3 1.3-1.3 2.3-2.6-.2L12 21.4l-2.3-1.3-2.6.2-1.3-2.3-2.3-1.3.2-2.6L2.6 12l1.3-2.3-.2-2.6 2.3-1.3 1.3-2.3 2.6.2L12 2.6z"
        className="fill-current opacity-15"
      />
      <path
        d="M9.3 12.2l1.7 1.7 3.7-4.1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <span className="leading-none">{label}</span>
  </span>
);

const RankMark = ({ rank }) => {
  const r = Number(rank);
  if (r === 1) return <span className="text-xl font-extrabold text-slate-900 dark:text-white">#1</span>;
  if (r === 2) return <span className="text-xl font-extrabold text-slate-900/80 dark:text-white/90">#2</span>;
  if (r === 3) return <span className="text-xl font-extrabold text-slate-900/70 dark:text-white/80">#3</span>;
  return <span className="text-lg font-bold text-slate-600 dark:text-slate-300">#{r}</span>;
};

export default function LeaderboardCard({ user, rank }) {
  const router = useRouter();

  const isVerified =
    Boolean(user?.is_verified) ||
    Boolean(user?.verified) ||
    user?.verification_status === "verified" ||
    user?.verification === "verified";

  return (
    <button
      type="button"
      onClick={() => router.push(`/seller/${user.id}`)}
      className={cn(
        "w-full text-left flex items-center gap-4 p-4 rounded-3xl",
        "border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60",
        "shadow-sm hover:shadow-md transition"
      )}
    >
      <div className="flex-shrink-0 w-12 flex justify-center">
        <RankMark rank={rank} />
      </div>

      <div className="relative w-12 h-12 flex-shrink-0">
        {user?.profile ? (
          <Image src={user.profile} alt={user.name} fill className="rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}

        {isVerified ? (
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-slate-100 shadow-sm">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M8.3 10.6l1.1 1.2 2.9-3.2"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
          {isVerified ? <CheckSeal /> : null}
        </div>

        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
          {user?.level ? (
            <span className="rounded-full border border-slate-200/70 dark:border-slate-700/70 bg-white/60 dark:bg-slate-900/40 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
              Nivo {user.level}
            </span>
          ) : null}

          {user?.badge_count > 0 ? (
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {user.badge_count} bedževa
            </span>
          ) : null}
        </div>
      </div>

      <div className="text-right">
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {Number(user?.total_points || 0).toLocaleString("bs-BA")}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-300">bodova</p>
      </div>
    </button>
  );
}