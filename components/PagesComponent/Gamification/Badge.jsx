"use client";
import React from "react";
import Image from "next/image";
import { t } from "@/utils";

const Badge = ({ badge, size = "md", showName = true, showDescription = false, className = "" }) => {
  const sizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  const isUnlocked = badge?.unlocked || badge?.earned_at;
  
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`relative ${sizes[size]} ${!isUnlocked ? "opacity-40 grayscale" : ""}`}>
        {badge?.icon ? (
          <Image
            src={badge.icon}
            alt={badge.name}
            fill
            className="object-contain"
          />
        ) : (
          <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center`}>
            <span className="text-white text-2xl font-bold">
              {badge?.name?.charAt(0) || "?"}
            </span>
          </div>
        )}
        
        {/* Locked overlay */}
        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {showName && (
        <div className="text-center">
          <p className={`font-semibold ${!isUnlocked ? "text-gray-400" : "text-gray-900 dark:text-white"}`}>
            {badge?.name || t("unknownBadge")}
          </p>
          {badge?.earned_at && (
            <p className="text-xs text-gray-500">
              {new Date(badge.earned_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {showDescription && badge?.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs">
          {badge.description}
        </p>
      )}
    </div>
  );
};

export default Badge;
