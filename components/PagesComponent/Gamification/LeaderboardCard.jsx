"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { t } from "@/utils";

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

  return (
    <div 
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/seller/${user.id}`)}
    >
      <div className="flex-shrink-0 w-12 flex justify-center">
        {getMedalIcon(rank)}
      </div>

      <div className="relative w-12 h-12 flex-shrink-0">
        {user.profile ? (
          <Image
            src={user.profile}
            alt={user.name}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">
          {user.name}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {user.level && (
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">
              {t("level")} {user.level}
            </span>
          )}
          {user.badge_count > 0 && (
            <span className="text-yellow-600 dark:text-yellow-400">
              🏆 {user.badge_count}
            </span>
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
