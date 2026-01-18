"use client";
import React from "react";
import { t } from "@/utils";

const UserLevel = ({ userPoints, showProgress = true }) => {
  if (!userPoints) return null;

  const {
    total_points = 0,
    level = 1,
    level_name = "",
    points_to_next_level = 0,
    current_level_points = 0,
  } = userPoints;

  const progressPercentage = points_to_next_level > 0
    ? (current_level_points / points_to_next_level) * 100
    : 100;

  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold">{t("level")} {level}</h3>
          {level_name && (
            <p className="text-purple-100 text-sm">{level_name}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{total_points.toLocaleString()}</p>
          <p className="text-purple-100 text-sm">{t("totalPoints")}</p>
        </div>
      </div>

      {showProgress && points_to_next_level > 0 && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>{current_level_points} / {points_to_next_level} {t("points")}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-purple-700 rounded-full h-3">
            <div
              className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-purple-100 text-sm mt-2">
            {points_to_next_level - current_level_points} {t("pointsToNextLevel")}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserLevel;
