"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoEyeOutline,
  IoHeartOutline,
  IoCallOutline,
  IoChatbubbleOutline,
  IoShareSocialOutline,
  IoTrendingUp,
  IoTrendingDown,
  IoChevronForward,
  IoStatsChartOutline,
  IoSparkles,
} from "react-icons/io5";
import Link from "next/link";
import { itemStatisticsApi } from "@/utils/api";

// ============================================
// API
// ============================================
const fetchQuickStats = async (itemId) => {
  try {
    const response = await itemStatisticsApi.getQuickStats({ itemId });
    const payload = response?.data;
    const ok =
      payload?.error === false ||
      payload?.error === 0 ||
      payload?.success === true ||
      payload?.status === true ||
      payload?.ok === true;

    if (ok || payload?.data) {
      return payload?.data ?? null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching quick stats:", error);
    return null;
  }
};

// ============================================
// HELPERS
// ============================================
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
};

// ============================================
// SHIMMER SKELETON
// ============================================
const ShimmerSkeleton = ({ className }) => (
  <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
    <div
      className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }}
    />
  </div>
);

// ============================================
// MINI STAT
// ============================================
const MiniStatItem = ({ icon: Icon, value, label, color = "slate" }) => {
  const colorClasses = {
    blue: "text-blue-500",
    green: "text-emerald-500",
    red: "text-red-500",
    purple: "text-purple-500",
    slate: "text-slate-400",
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <Icon className={colorClasses[color]} size={12} />
        <span className="text-sm font-bold text-slate-800">{formatNumber(value)}</span>
      </div>
      <span className="text-[9px] text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
};

// ============================================
// ITEM STATISTICS CARD - COMPACT
// ============================================
const ItemStatisticsCard = ({ itemId, itemSlug }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchQuickStats(itemId);
      setStats(data);
      setLoading(false);
    };

    if (itemId) {
      loadStats();
    }
  }, [itemId]);

  if (loading) {
    return (
      <div className="bg-slate-50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <ShimmerSkeleton className="w-5 h-5 rounded-lg" />
          <ShimmerSkeleton className="w-16 h-3 rounded" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <ShimmerSkeleton className="w-8 h-4 rounded" />
              <ShimmerSkeleton className="w-10 h-2 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const trend = stats.views_trend || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 rounded-xl p-3 border border-slate-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
            <IoStatsChartOutline className="text-blue-600" size={12} />
          </div>
          <span className="text-xs font-semibold text-slate-600">Statistika</span>
        </div>

        {trend !== 0 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              trend > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {trend > 0 ? <IoTrendingUp size={10} /> : <IoTrendingDown size={10} />}
            {trend > 0 ? "+" : ""}
            {trend}%
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-1">
        <MiniStatItem icon={IoEyeOutline} value={stats.total_views} label="Pregleda" color="blue" />
        <MiniStatItem icon={IoHeartOutline} value={stats.total_favorites} label="Favorita" color="red" />
        <MiniStatItem icon={IoCallOutline} value={stats.total_phone_clicks} label="Poziva" color="green" />
        <MiniStatItem icon={IoChatbubbleOutline} value={stats.total_messages} label="Poruka" color="blue" />
        <MiniStatItem icon={IoShareSocialOutline} value={stats.total_shares} label="Dijeli" color="purple" />
      </div>

      {stats?.reel?.has_video && (
        <div className="mt-2 rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 text-[10px] text-indigo-700 font-semibold">
          Reel: {formatNumber(stats?.reel?.plays || 0)} play • {(stats?.reel?.completion_rate || 0).toFixed(1)}% completion
        </div>
      )}

      {stats?.suggested_action?.title && (
        <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1.5">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700">
            <IoSparkles size={10} />
            Brza akcija
          </div>
          <p className="mt-0.5 text-[10px] text-amber-800 leading-snug">{stats.suggested_action.title}</p>
        </div>
      )}

      {/* Link */}
      <Link
        href={`/my-ads/${itemSlug}/statistics`}
        className="mt-3 flex items-center justify-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700 transition-colors py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg"
      >
        Detaljna statistika
        <IoChevronForward size={12} />
      </Link>
    </motion.div>
  );
};

// ============================================
// ITEM STATISTICS INLINE - SUPER COMPACT
// ============================================
export const ItemStatisticsInline = ({ itemId }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchQuickStats(itemId);
      setStats(data);
    };

    if (itemId) {
      loadStats();
    }
  }, [itemId]);

  if (!stats) return null;

  const items = [
    { icon: IoEyeOutline, value: stats.total_views },
    { icon: IoHeartOutline, value: stats.total_favorites },
    { icon: IoCallOutline, value: stats.total_phone_clicks },
    { icon: IoChatbubbleOutline, value: stats.total_messages },
  ];

  return (
    <div className="flex items-center gap-3 text-xs text-slate-500">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <span key={i} className="flex items-center gap-1">
            <Icon size={13} className="text-slate-400" />
            <span className="font-medium">{formatNumber(item.value)}</span>
          </span>
        );
      })}
    </div>
  );
};

// ============================================
// TODAY STATS BADGE
// ============================================
export const TodayStatsBadge = ({ itemId }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchQuickStats(itemId);
      setStats(data);
    };

    if (itemId) {
      loadStats();
    }
  }, [itemId]);

  if (!stats || stats.today_views === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-semibold rounded-full shadow-sm"
    >
      <IoEyeOutline size={11} />
      {stats.today_views} danas
    </motion.div>
  );
};

// ============================================
// QUICK STATS ROW - New component
// ============================================
export const QuickStatsRow = ({ itemId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchQuickStats(itemId);
      setStats(data);
      setLoading(false);
    };

    if (itemId) {
      loadStats();
    }
  }, [itemId]);

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        {[...Array(4)].map((_, i) => (
          <ShimmerSkeleton key={i} className="w-12 h-4 rounded" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const trend = stats.views_trend || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-4 flex-wrap"
    >
      <div className="flex items-center gap-1.5 text-sm">
        <IoEyeOutline className="text-blue-500" size={14} />
        <span className="font-semibold text-slate-800">{formatNumber(stats.total_views)}</span>
        <span className="text-slate-400 text-xs">pregleda</span>
        {trend !== 0 && (
          <span className={`flex items-center text-xs font-medium ${trend > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend > 0 ? <IoTrendingUp size={12} /> : <IoTrendingDown size={12} />}
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>

      <div className="h-4 w-px bg-slate-200" />

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <IoHeartOutline size={12} className="text-red-400" />
          {formatNumber(stats.total_favorites)}
        </span>
        <span className="flex items-center gap-1">
          <IoCallOutline size={12} className="text-emerald-400" />
          {formatNumber(stats.total_phone_clicks)}
        </span>
        <span className="flex items-center gap-1">
          <IoChatbubbleOutline size={12} className="text-blue-400" />
          {formatNumber(stats.total_messages)}
        </span>
      </div>
    </motion.div>
  );
};

// ============================================
// STATS MINI CARD - New compact card
// ============================================
export const StatsMiniCard = ({ itemId, showLink = true, itemSlug }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchQuickStats(itemId);
      setStats(data);
      setLoading(false);
    };

    if (itemId) {
      loadStats();
    }
  }, [itemId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
        <ShimmerSkeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-1">
          <ShimmerSkeleton className="w-20 h-3 rounded" />
          <ShimmerSkeleton className="w-32 h-2 rounded" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const trend = stats.views_trend || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-xl border border-slate-100"
    >
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
        <IoStatsChartOutline className="text-white" size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{formatNumber(stats.total_views)}</span>
          <span className="text-xs text-slate-400">pregleda</span>
          {trend !== 0 && (
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${trend > 0 ? "text-emerald-600" : "text-red-500"}`}>
              {trend > 0 ? <IoTrendingUp size={10} /> : <IoTrendingDown size={10} />}
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
          <span>{formatNumber(stats.total_favorites)} favorita</span>
          <span>•</span>
          <span>{formatNumber(stats.total_messages)} poruka</span>
        </div>
      </div>

      {showLink && itemSlug && (
        <Link
          href={`/my-ads/${itemSlug}/statistics`}
          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-colors"
        >
          <IoChevronForward size={14} />
        </Link>
      )}
    </motion.div>
  );
};

export default ItemStatisticsCard;
