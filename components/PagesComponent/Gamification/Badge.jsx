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

// LMx palette (iz tvog logo-a)
const LMX = {
  blueDeep: "#042361",
  blue: "#093f88",
  orange: "#fe8414",
  teal: "#10b8b0",
  tealDeep: "#0e8b86",
};

const BADGES = {
  early_adopter: {
    icon: IconRocket,
    colors: [LMX.blueDeep, LMX.orange, LMX.teal],
  },
  verified: {
    icon: IconShieldCheck,
    colors: [LMX.tealDeep, LMX.teal, LMX.blue],
  },
  top_seller: {
    icon: IconCrown,
    colors: [LMX.orange, LMX.teal, LMX.blue],
  },
  hot_seller: {
    icon: IconFlame,
    colors: [LMX.orange, LMX.orange, LMX.teal],
  },
  featured: {
    icon: IconStar,
    colors: [LMX.blue, LMX.teal, LMX.orange],
  },
  vip: {
    icon: IconDiamond,
    colors: [LMX.blueDeep, LMX.blue, LMX.orange],
  },
  winner: {
    icon: IconMedal,
    colors: [LMX.orange, LMX.teal, LMX.orange],
  },
  streak: {
    icon: IconBolt,
    colors: [LMX.teal, LMX.tealDeep, LMX.blue],
  },
  community: {
    icon: IconUsers,
    colors: [LMX.blue, LMX.teal, LMX.blueDeep],
  },
  generous: {
    icon: IconGift,
    colors: [LMX.orange, LMX.teal, LMX.orange],
  },
  default: {
    icon: IconTrendingUp,
    colors: ["#6b7280", "#4b5563", "#374151"], // gray-500 -> gray-700
  },
};

const buildGradient = (colors = []) => {
  const stops = (colors.length ? colors : ["#6b7280", "#4b5563", "#374151"]).join(", ");
  return `linear-gradient(135deg, ${stops})`;
};

const Badge = ({ badge, size = "md" }) => {
  const isUnlocked = Boolean(badge?.unlocked || badge?.earned_at);

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
        <div
          style={{ backgroundImage: buildGradient(meta.colors) }}
          className={`
            ${sizeMap[size]}
            relative rounded-2xl
            flex items-center justify-center
            transition-all duration-300
            ${isUnlocked ? "hover:scale-105" : "opacity-40 grayscale"}
            ring-1 ring-white/15
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
