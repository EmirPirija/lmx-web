"use client";
import React from "react";
import { Crown, Store } from "lucide-react";

const MembershipBadge = ({ tier, size = "sm", showLabel = true, className = "" }) => {
  if (!tier || tier === "free") return null;

  const configs = {
    pro: {
      icon: Crown,
      gradient: "from-amber-400 to-yellow-600",
      text: "LMX Pro",
      ringColor: "ring-amber-400/30",
      shadowColor: "shadow-amber-500/20",
    },
    shop: {
      icon: Store,
      gradient: "from-blue-500 to-indigo-600",
      text: "LMX Shop",
      ringColor: "ring-blue-400/30",
      shadowColor: "shadow-blue-500/20",
    },
  };

  const config = configs[tier?.toLowerCase()] || configs.pro;
  const Icon = config.icon;

  const sizeClasses = {
    xs: "w-4 h-4 p-0.5",
    sm: "w-5 h-5 p-1",
    md: "w-6 h-6 p-1",
    lg: "w-8 h-8 p-1.5",
    xl: "w-10 h-10 p-2",
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 18,
    xl: 22,
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          bg-gradient-to-br ${config.gradient}
          rounded-full
          flex items-center justify-center
          ring-2 ${config.ringColor}
          shadow-lg ${config.shadowColor}
          animate-pulse-subtle
        `}
        title={config.text}
      >
        <Icon size={iconSizes[size]} className="text-white" strokeWidth={2.5} />
      </div>
      {showLabel && (
        <span className={`font-semibold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
          {config.text}
        </span>
      )}
    </div>
  );
};

export default MembershipBadge;
