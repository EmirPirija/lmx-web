"use client";
import React from "react";
import Badge from "./Badge";
import { t } from "@/utils";

const BadgeList = ({ badges, title, emptyMessage, size = "md" }) => {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          {emptyMessage || t("noBadgesYet")}
        </p>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h3 className="text-xl font-bold mb-4 dark:text-white">{title}</h3>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {badges.map((badge) => (
          <Badge
            key={badge.id}
            badge={badge}
            size={size}
            showName={true}
            showDescription={false}
          />
        ))}
      </div>
    </div>
  );
};

export default BadgeList;
