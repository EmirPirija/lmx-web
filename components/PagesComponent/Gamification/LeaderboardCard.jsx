"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { t } from "@/utils";

/** Cute, creative verification badge */
const VerificationBadge = ({ label = "Verified", size = "sm" }) => {
  const sizes = {
    sm: { wrap: "h-6 px-2.5 text-xs", icon: "w-4 h-4" },
    xs: { wrap: "h-5 px-2 text-[11px]", icon: "w-3.5 h-3.5" },
  };
  const s = sizes[size] ?? sizes.sm;

  return (
    <span
      title={label}
      className={[
        "inline-flex items-center gap-1.5 select-none",
        s.wrap,
        "rounded-full",
        "bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500",
        "text-white font-semibold",
        "shadow-[0_8px_18px_rgba(16,185,129,0.35)]",
        "ring-1 ring-white/30",
        "transition-transform duration-200",
        "hover:-translate-y-[1px] hover:shadow-[0_12px_22px_rgba(16,185,129,0.45)]",
      ].join(" ")}
    >
      {/* Sparkle coin */}
      <span className="relative inline-flex">
        <svg className={s.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2.75l1.2 3.6c.18.55.6.97 1.15 1.15l3.6 1.2-3.6 1.2c-.55.18-.97.6-1.15 1.15L12 15.65l-1.2-3.6a1.9 1.9 0 0 0-1.15-1.15l-3.6-1.2 3.6-1.2c.55-.18.97-.6 1.15-1.15L12 2.75z"
            fill="rgba(255,255,255,0.95)"
          />
          <path
            d="M9.2 16.6l1.0 2.2c.14.31.4.56.72.7l2.28 1.0-2.28 1.0c-.32.14-.58.39-.72.7l-1.0 2.2-1.0-2.2a1.2 1.2 0 0 0-.72-.7l-2.28-1.0 2.28-1.0c.32-.14.58-.39.72-.7l1.0-2.2z"
            fill="rgba(255,255,255,0.75)"
          />
        </svg>

        {/* tiny twinkle dot */}
        <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-white/80 blur-[0.2px]" />
      </span>

      <span className="leading-none">{label}</span>
    </span>
  );
};

/** Badge that sits on the avatar (award-style) */
const AvatarSeal = ({ title = "Verified" }) => {
  return (
    <span
      title={title}
      className={[
        "absolute -bottom-1 -right-1",
        "w-6 h-6 rounded-full",
        "bg-gradient-to-br from-amber-400 via-pink-500 to-indigo-500",
        "ring-2 ring-white dark:ring-gray-800",
        "shadow-[0_10px_18px_rgba(99,102,241,0.35)]",
        "flex items-center justify-center",
        "transition-transform duration-200",
        "group-hover:rotate-6 group-hover:scale-105",
      ].join(" ")}
    >
      {/* Fun “stamp” check */}
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M8.3 10.6l1.1 1.2 2.9-3.2"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

const LeaderboardCard = ({ user, rank }) => {
  const router = useRouter();

  const getMedalColor = (rank) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-700";
    return "text-gray-600";
  };

  const getMedalIcon = (rank) => {
    if (rank <= 3) {
      return (
        <svg className={`w-8 h-8 ${getMedalColor(rank)}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return <span className="text-xl font-bold text-gray-600">#{rank}</span>;
  };

  // Be flexible with whatever field you have in API
  const isVerified =
    Boolean(user?.is_verified) ||
    Boolean(user?.verified) ||
    user?.verification_status === "verified" ||
    user?.verification === "verified";

  const verificationLabel = t?.("verified") ?? "Verified";

  return (
    <div
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/seller/${user.id}`)}
    >
      <div className="flex-shrink-0 w-12 flex justify-center">{getMedalIcon(rank)}</div>

      {/* Avatar */}
      <div className="relative w-12 h-12 flex-shrink-0 group">
        {user.profile ? (
          <Image src={user.profile} alt={user.name} fill className="rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
        )}

        {/* Fancy seal on avatar */}
        {isVerified && <AvatarSeal title={verificationLabel} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>

          {/* Cute fun badge next to name */}
          {isVerified && <VerificationBadge label={verificationLabel} size="xs" />}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          {user.level && (
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">
              {t("level")} {user.level}
            </span>
          )}
          {user.badge_count > 0 && (
            <span className="text-yellow-600 dark:text-yellow-400">🏆 {user.badge_count}</span>
          )}
        </div>
      </div>

      <div className="text-right">
        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {user.total_points?.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500">{t("points")}</p>
      </div>
    </div>
  );
};

export default LeaderboardCard;
