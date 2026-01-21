"use client";

import { useState, useEffect } from "react";
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
} from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import { itemStatisticsApi } from "@/utils/api";

// ============================================
// API FUNKCIJA
// ============================================
const fetchQuickStats = async (itemId) => {
  try {
    const response = await itemStatisticsApi.getQuickStats({ itemId });
    
    // Podrži različite formate odgovora
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
    console.error('Error fetching quick stats:', error);
    return null;
  }
};

// ============================================
// HELPER
// ============================================
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
};

// ============================================
// MINI STAT KOMPONENTA
// ============================================
const MiniStatItem = ({ icon: Icon, value, label, color = "slate" }) => {
  const colorClasses = {
    blue: "text-blue-500",
    green: "text-green-500",
    red: "text-red-500",
    purple: "text-purple-500",
    slate: "text-slate-400",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        <Icon className={colorClasses[color]} size={14} />
        <span className="text-sm font-bold text-slate-800">{formatNumber(value)}</span>
      </div>
      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
  );
};

// ============================================
// ITEM STATISTICS CARD - COMPACT VERSION
// Za prikaz u listi oglasa (My Ads)
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
      <div className="bg-slate-50 rounded-xl p-4 animate-pulse">
        <div className="h-12 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const trend = stats.views_trend || 0;

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl p-4 border border-slate-100">
      {/* Header sa trendom */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <IoStatsChartOutline className="text-blue-500" size={16} />
          <span className="text-xs font-semibold text-slate-600">Statistika</span>
        </div>
        
        {trend !== 0 && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend > 0 ? <IoTrendingUp size={12} /> : <IoTrendingDown size={12} />}
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-2">
        <MiniStatItem 
          icon={IoEyeOutline} 
          value={stats.total_views} 
          label="Pregleda" 
          color="blue"
        />
        <MiniStatItem 
          icon={IoHeartOutline} 
          value={stats.total_favorites} 
          label="Favorita" 
          color="red"
        />
        <MiniStatItem 
          icon={IoCallOutline} 
          value={stats.total_phone_clicks} 
          label="Poziva" 
          color="green"
        />
        <MiniStatItem 
          icon={IoChatbubbleOutline} 
          value={stats.total_messages} 
          label="Poruka" 
          color="blue"
        />
        <MiniStatItem 
          icon={IoShareSocialOutline} 
          value={stats.total_shares} 
          label="Dijeljenja" 
          color="purple"
        />
      </div>

      {/* View Full Stats Link */}
      <Link 
        href={`/my-ads/${itemSlug}/statistics`}
        className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        Pogledaj detaljnu statistiku
        <IoChevronForward size={14} />
      </Link>
    </div>
  );
};

// ============================================
// ITEM STATISTICS INLINE - SUPER COMPACT
// Za prikaz u jednoj liniji
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

  return (
    <div className="flex items-center gap-4 text-xs text-slate-500">
      <span className="flex items-center gap-1">
        <IoEyeOutline size={14} />
        {formatNumber(stats.total_views)}
      </span>
      <span className="flex items-center gap-1">
        <IoHeartOutline size={14} />
        {formatNumber(stats.total_favorites)}
      </span>
      <span className="flex items-center gap-1">
        <IoCallOutline size={14} />
        {formatNumber(stats.total_phone_clicks)}
      </span>
      <span className="flex items-center gap-1">
        <IoChatbubbleOutline size={14} />
        {formatNumber(stats.total_messages)}
      </span>
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
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
      <IoEyeOutline size={12} />
      {stats.today_views} danas
    </div>
  );
};

export default ItemStatisticsCard;