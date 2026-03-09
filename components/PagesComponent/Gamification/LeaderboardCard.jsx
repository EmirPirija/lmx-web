"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  BarChart3,
  Video,
  Store,
  ShoppingBag,
} from "@/components/Common/UnifiedIconPack";

import UserAvatarMedia from "@/components/Common/UserAvatar";
import { cn } from "@/lib/utils";

const RankMark = ({ rank }) => {
  const r = Number(rank || 0);

  if (r === 1)
    return <span className="text-xl font-black text-amber-500">#1</span>;
  if (r === 2)
    return (
      <span className="text-xl font-black text-slate-500 dark:text-slate-300">
        #2
      </span>
    );
  if (r === 3)
    return <span className="text-xl font-black text-orange-500">#3</span>;

  return (
    <span className="text-lg font-bold text-slate-600 dark:text-slate-300">
      #{r}
    </span>
  );
};

const Pill = ({ icon: Icon, children, tone = "slate" }) => {
  const tones = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    violet:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tones[tone] || tones.slate,
      )}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {children}
    </span>
  );
};

export default function LeaderboardCard({ user, rank }) {
  const router = useRouter();

  const isVerified =
    Boolean(user?.is_verified) ||
    Boolean(user?.verified) ||
    user?.verification_status === "verified" ||
    user?.verification === "verified";

  const points = Number(user?.total_points || 0);
  const periodPoints = Number(user?.period_points || 0);

  return (
    <button
      type="button"
      onClick={() => router.push(`/prodavac/${user.id}`)}
      className={cn(
        "w-full text-left rounded-3xl border p-4",
        "border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-900/60",
        "transition hover:shadow-md",
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex w-11 flex-shrink-0 justify-center">
          <RankMark rank={rank} />
        </div>

        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-200/70 dark:border-slate-700/70 bg-slate-100 dark:bg-slate-800">
          <UserAvatarMedia
            sources={[user?.profile, user?.profile_image, user?.avatar]}
            verificationSource={user}
            showVerifiedBadge
            alt={user?.name || "Korisnik"}
            className="h-12 w-12"
            imageClassName="h-12 w-12 object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {user?.name || "Korisnik"}
            </p>
            {isVerified ? <Pill tone="emerald">Verifikovan</Pill> : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Pill tone="slate">Nivo {user?.level || 1}</Pill>
            {Number(user?.streak_days || 0) > 0 ? (
              <Pill icon={Flame} tone="rose">
                {user.streak_days}d zaredom
              </Pill>
            ) : null}
            {Number(user?.reel_count || 0) > 0 ? (
              <Pill icon={Video} tone="violet">
                {user.reel_count} reel
              </Pill>
            ) : null}
            {Number(user?.seller_score || 0) > 0 ? (
              <Pill icon={Store} tone="amber">
                Prodavac {user.seller_score}
              </Pill>
            ) : null}
            {Number(user?.buyer_score || 0) > 0 ? (
              <Pill icon={ShoppingBag} tone="sky">
                Kupac {user.buyer_score}
              </Pill>
            ) : null}
            {Number(user?.momentum_score || 0) > 0 ? (
              <Pill icon={BarChart3} tone="emerald">
                Zamah {user.momentum_score}
              </Pill>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {points.toLocaleString("bs-BA")}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            bodova
          </div>
          {periodPoints > 0 ? (
            <div className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
              +{periodPoints.toLocaleString("bs-BA")} u periodu
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}
