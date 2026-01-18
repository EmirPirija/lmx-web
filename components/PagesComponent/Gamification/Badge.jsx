"use client";
import React from "react";
import {
  IconRocket,
  IconShieldCheck,
  IconCrown,
  IconFlame,
  IconStar,
  IconDiamond,
  IconMedal,
  IconBolt,
  IconUsers,
  IconGift,
  IconTrendingUp,
  IconLock,
} from "@tabler/icons-react";

const BADGES = {
  early_adopter: {
    icon: IconRocket,
    gradient: "from-[#ff8c1a] via-[#ffb347] to-[#ff7a00]",
  },
  verified: {
    icon: IconShieldCheck,
    gradient: "from-[#1fd1b9] via-[#2ee5c9] to-[#0fb9b1]",
  },
  top_seller: {
    icon: IconCrown,
    gradient: "from-[#ffb703] via-[#ff9500] to-[#ff7a00]",
  },
  hot_seller: {
    icon: IconFlame,
    gradient: "from-[#ff5f6d] via-[#ff9966] to-[#ff7a00]",
  },
  featured: {
    icon: IconStar,
    gradient: "from-[#3a86ff] via-[#4ea8ff] to-[#00b4d8]",
  },
  vip: {
    icon: IconDiamond,
    gradient: "from-[#8338ec] via-[#5f27cd] to-[#341f97]",
  },
  winner: {
    icon: IconMedal,
    gradient: "from-[#ffd166] via-[#ffb703] to-[#fb8500]",
  },
  streak: {
    icon: IconBolt,
    gradient: "from-[#00f5d4] via-[#2ec4b6] to-[#06d6a0]",
  },
  community: {
    icon: IconUsers,
    gradient: "from-[#00b4d8] via-[#48cae4] to-[#90dbf4]",
  },
  generous: {
    icon: IconGift,
    gradient: "from-[#f72585] via-[#ff4d6d] to-[#ff758f]",
  },
  default: {
    icon: IconTrendingUp,
    gradient: "from-gray-500 via-gray-600 to-gray-700",
  },
};

const Badge = ({ badge, size = "md" }) => {
  const isUnlocked = badge?.unlocked || badge?.earned_at;

  const key =
    badge?.code?.toLowerCase()?.replace(/\s+/g, "_") ||
    badge?.name?.toLowerCase()?.replace(/\s+/g, "_");

  const meta = BADGES[key] || BADGES.default;
  const Icon = meta.icon;

  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        
        {/* Badge */}
        <div
          className={`
            ${sizeMap[size]}
            relative rounded-2xl
            bg-gradient-to-br ${meta.gradient}
            flex items-center justify-center
            /* shadow-xl uklonjen */
            transition-all duration-300
            ${isUnlocked ? "hover:scale-105" : "opacity-40 grayscale"}
          `}
        >
          <Icon className="w-1/2 h-1/2 text-white" />

          {!isUnlocked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
              <IconLock className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Badge;