"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { itemStatisticsApi } from "@/utils/api";
import {
  IoEyeOutline,
  IoTrendingUp,
  IoTrendingDown,
  IoPhonePortraitOutline,
  IoDesktopOutline,
  IoTabletPortraitOutline,
  IoShareSocialOutline,
  IoHeartOutline,
  IoCallOutline,
  IoChatbubbleOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoChevronDown,
  IoInformationCircleOutline,
  IoRefreshOutline,
  IoCalendarOutline,
  IoFlashOutline,
} from "react-icons/io5";
import { FaWhatsapp, FaViber } from "react-icons/fa";
import { MdOutlineEmail, MdTouchApp } from "react-icons/md";
import { HiOutlineExternalLink } from "react-icons/hi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ============================================
// CONSTANTS
// ============================================
const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  cyan: "#06b6d4",
};

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

// ============================================
// HELPERS
// ============================================
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
};

const formatDuration = (seconds) => {
  if (!seconds) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

// ============================================
// SHIMMER SKELETON
// ============================================
const ShimmerSkeleton = ({ className }) => (
  <div className={`relative overflow-hidden bg-slate-100 rounded-xl ${className}`}>
    <div
      className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }}
    />
  </div>
);

// ============================================
// CUSTOM TOOLTIP
// ============================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-slate-100">
      <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-sm text-slate-500">{entry.name}:</span>
          <span className="text-sm font-semibold text-slate-800">{formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// STAT CARD
// ============================================
const StatCard = ({ icon: Icon, label, value, subValue, trend, trendLabel, color = "blue", tooltip, large = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const colorConfig = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
    green: { bg: "bg-emerald-50", icon: "text-emerald-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600" },
    red: { bg: "bg-red-50", icon: "text-red-600" },
    cyan: { bg: "bg-cyan-50", icon: "text-cyan-600" },
  };

  const c = colorConfig[color];

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 8px 30px -10px rgba(0,0,0,0.1)" }}
      className={`relative bg-white rounded-2xl border border-slate-100 ${large ? "p-6" : "p-5"} transition-shadow`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`${large ? "w-12 h-12" : "w-10 h-10"} rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={large ? 24 : 20} className={c.icon} />
        </div>
        {tooltip && (
          <button
            className="text-slate-300 hover:text-slate-500 transition-colors relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <IoInformationCircleOutline size={18} />
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-6 right-0 z-10 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[180px] text-left whitespace-normal"
                >
                  {tooltip}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>

      <div>
        <p className={`${large ? "text-sm" : "text-xs"} font-medium text-slate-500 mb-1`}>{label}</p>
        <div className="flex items-baseline gap-2">
          <span className={`${large ? "text-3xl" : "text-2xl"} font-bold text-slate-800`}>{formatNumber(value)}</span>
          {subValue && <span className="text-sm text-slate-400">{subValue}</span>}
        </div>

        {trend !== undefined && trend !== null && trend !== 0 && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 mt-2">
            {trend > 0 ? <IoTrendingUp className="text-emerald-500" size={16} /> : <IoTrendingDown className="text-red-500" size={16} />}
            <span className={`text-sm font-semibold ${trend > 0 ? "text-emerald-600" : "text-red-600"}`}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
            {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// MINI STAT
// ============================================
const MiniStat = ({ icon: Icon, label, value, color = "slate" }) => {
  const iconColors = {
    blue: "text-blue-500 bg-blue-50",
    green: "text-emerald-500 bg-emerald-50",
    purple: "text-purple-500 bg-purple-50",
    orange: "text-orange-500 bg-orange-50",
    slate: "text-slate-400 bg-slate-50",
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[color]}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-slate-800">{formatNumber(value)}</p>
      </div>
    </div>
  );
};

// ============================================
// PERIOD SELECTOR
// ============================================
const PeriodSelector = ({ value, onChange }) => {
  const periods = [
    { value: 7, label: "7 dana" },
    { value: 14, label: "14 dana" },
    { value: 30, label: "30 dana" },
    { value: 90, label: "90 dana" },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
            value === p.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

// ============================================
// COLLAPSIBLE SECTION
// ============================================
const CollapsibleSection = ({ title, icon: Icon, iconColor, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
      >
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Icon className={iconColor} size={20} />
          {title}
        </h3>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <IoChevronDown className="text-slate-400" size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// VIEWS CHART
// ============================================
const ViewsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-[280px] flex items-center justify-center text-slate-400">Nema podataka za prikaz</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.15} />
            <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="formatted_date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dx={-10} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="views"
          name="Pregledi"
          stroke={COLORS.primary}
          strokeWidth={2.5}
          fill="url(#viewsGrad)"
          dot={false}
          activeDot={{ r: 6, fill: COLORS.primary, strokeWidth: 2, stroke: "#fff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ============================================
// SOURCES CHART
// ============================================
const SourcesChart = ({ data }) => {
  if (!data) return null;

  const chartData = [...(data.internal || []), ...(data.external || [])].filter((s) => s.value > 0).slice(0, 8);

  if (chartData.length === 0) {
    return <div className="h-[200px] flex items-center justify-center text-slate-400">Nema podataka o izvorima</div>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="w-[160px] h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatNumber(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2 w-full">
        {chartData.map((source, index) => (
          <div key={source.name} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
            <span className="text-sm text-slate-600 flex-1 truncate">{source.name}</span>
            <span className="text-sm font-semibold text-slate-800">{source.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// DEVICES CHART
// ============================================
const DevicesChart = ({ data }) => {
  if (!data) return null;

  const devices = [
    { name: "Mobitel", value: data.mobile?.value || 0, percent: data.mobile?.percent || 0, icon: IoPhonePortraitOutline, color: COLORS.primary },
    { name: "Desktop", value: data.desktop?.value || 0, percent: data.desktop?.percent || 0, icon: IoDesktopOutline, color: COLORS.secondary },
    { name: "Tablet", value: data.tablet?.value || 0, percent: data.tablet?.percent || 0, icon: IoTabletPortraitOutline, color: COLORS.success },
  ];

  const total = devices.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <div className="h-[120px] flex items-center justify-center text-slate-400">Nema podataka o uređajima</div>;
  }

  return (
    <div className="space-y-4">
      {devices.map((device) => {
        const Icon = device.icon;
        return (
          <div key={device.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">{device.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{formatNumber(device.value)}</span>
                <span className="text-xs text-slate-400">({device.percent}%)</span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${device.percent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: device.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// CONTACT STATS
// ============================================
const ContactStats = ({ data }) => {
  if (!data) return null;

  const contacts = [
    { icon: IoCallOutline, label: "Pozivi", value: data.phone_clicks || 0, color: "blue" },
    { icon: FaWhatsapp, label: "WhatsApp", value: data.whatsapp_clicks || 0, color: "green" },
    { icon: FaViber, label: "Viber", value: data.viber_clicks || 0, color: "purple" },
    { icon: IoChatbubbleOutline, label: "Poruke", value: data.messages || 0, color: "blue" },
    { icon: MdOutlineEmail, label: "Email", value: data.email_clicks || 0, color: "orange" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {contacts.map((contact) => (
        <MiniStat key={contact.label} icon={contact.icon} label={contact.label} value={contact.value} color={contact.color} />
      ))}
    </div>
  );
};

// ============================================
// ENGAGEMENT FUNNEL
// ============================================
const EngagementFunnel = ({ data }) => {
  const funnelArr = Array.isArray(data) ? data : data?.funnel;
  if (!funnelArr?.length) {
    return <div className="h-[160px] flex items-center justify-center text-slate-400">Nema podataka o konverziji</div>;
  }

  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500"];
  const conversionRate = data?.conversion_rate || 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {funnelArr.map((stage, index) => (
          <motion.div
            key={stage.stage}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: `${100 - index * 15}%`, opacity: 1 }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            className={`h-14 ${colors[index % colors.length]} rounded-xl flex items-center justify-between px-4 text-white`}
          >
            <span className="text-sm font-medium">{stage.stage}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{formatNumber(stage.value)}</span>
              <span className="text-xs opacity-75">({stage.percent}%)</span>
            </div>
          </motion.div>
        ))}
      </div>
      {conversionRate > 0 && (
        <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
          <p className="text-xs text-emerald-700 uppercase tracking-wide">Stopa konverzije</p>
          <p className="text-2xl font-bold text-emerald-800">{conversionRate}%</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// FEATURED COMPARISON
// ============================================
const FeaturedComparison = ({ featured, nonFeatured, improvement }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-medium text-amber-800">Istaknuto</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{formatNumber(featured?.avg_views_per_day || 0)}</p>
          <p className="text-xs text-amber-600 mt-1">pregleda/dan ({featured?.days || 0} dana)</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📋</span>
            <span className="text-sm font-medium text-slate-600">Normalno</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatNumber(nonFeatured?.avg_views_per_day || 0)}</p>
          <p className="text-xs text-slate-500 mt-1">pregleda/dan ({nonFeatured?.days || 0} dana)</p>
        </div>
      </div>

      {improvement > 0 && (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
          <p className="text-sm text-emerald-700">
            Isticanje povećava preglede za <span className="font-bold text-emerald-800">+{improvement}%</span>
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// TODAY VS YESTERDAY
// ============================================
const TodayYesterdayComparison = ({ summary }) => {
  const today = summary?.today || {};
  const yesterday = summary?.yesterday || {};

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <motion.div whileHover={{ scale: 1.01 }} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <IoFlashOutline className="text-blue-600" size={18} />
          <h4 className="text-sm font-semibold text-blue-800">Danas</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-blue-900">{today.views || 0}</p>
            <p className="text-[10px] text-blue-600 uppercase tracking-wide">Pregleda</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-900">{today.messages || 0}</p>
            <p className="text-[10px] text-blue-600 uppercase tracking-wide">Poruka</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-900">{today.favorites || 0}</p>
            <p className="text-[10px] text-blue-600 uppercase tracking-wide">Favorita</p>
          </div>
        </div>
      </motion.div>

      <motion.div whileHover={{ scale: 1.01 }} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <IoCalendarOutline className="text-slate-500" size={18} />
          <h4 className="text-sm font-semibold text-slate-600">Jučer</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-800">{yesterday.views || 0}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Pregleda</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{yesterday.messages || 0}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Poruka</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{yesterday.favorites || 0}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Favorita</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// LOADING STATE
// ============================================
const LoadingState = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <ShimmerSkeleton className="h-6 w-48" />
          <ShimmerSkeleton className="h-4 w-32" />
        </div>
        <ShimmerSkeleton className="h-10 w-48" />
      </div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <ShimmerSkeleton key={i} className="h-32" />
      ))}
    </div>
    <ShimmerSkeleton className="h-80" />
  </div>
);

// ============================================
// ERROR STATE
// ============================================
const ErrorState = ({ onRetry }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-8">
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
        <IoRefreshOutline size={32} className="text-red-500" />
      </div>
      <div className="text-center">
        <p className="text-slate-600 font-medium mb-1">Greška pri učitavanju</p>
        <p className="text-sm text-slate-400">Nije moguće dohvatiti statistiku</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
      >
        <IoRefreshOutline size={18} />
        Pokušaj ponovo
      </button>
    </div>
  </div>
);

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-8">
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
        <IoStatsChartOutline size={32} className="text-slate-400" />
      </div>
      <div className="text-center">
        <p className="text-slate-600 font-medium mb-1">Nema statistike</p>
        <p className="text-sm text-slate-400">Podaci će biti dostupni nakon prvih pregleda</p>
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const ItemStatisticsDashboard = ({ itemId, itemName }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);

  const fetchStats = useCallback(async () => {
    if (!itemId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await itemStatisticsApi.getStatistics({ itemId, period });
      const payload = response?.data;

      const ok =
        payload?.error === false ||
        payload?.error === 0 ||
        payload?.success === true ||
        payload?.status === true ||
        payload?.ok === true;

      if (ok || payload?.data) {
        setStats(payload?.data ?? null);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error("Stats error:", err);
      setError("Greška pri učitavanju");
    } finally {
      setLoading(false);
    }
  }, [itemId, period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={fetchStats} />;
  if (!stats) return <EmptyState />;

  const { summary, daily, sources, devices, funnel } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <IoStatsChartOutline className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">Statistika oglasa</h2>
              {itemName && <p className="text-sm text-slate-500 truncate max-w-xs">{itemName}</p>}
            </div>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={IoEyeOutline}
          label="Ukupno pregleda"
          value={summary?.period?.views || 0}
          subValue={summary?.period?.unique_views ? `(${summary.period.unique_views} jedin.)` : null}
          trend={summary?.trends?.views_vs_yesterday}
          trendLabel="vs jučer"
          color="blue"
          tooltip="Ukupan broj pregleda u odabranom periodu"
          large
        />
        <StatCard icon={MdTouchApp} label="Kontakti" value={(summary?.period?.phone_clicks || 0) + (summary?.period?.messages || 0)} color="green" tooltip="Pozivi, poruke, WhatsApp, Viber" large />
        <StatCard icon={IoHeartOutline} label="Favoriti" value={summary?.period?.favorites || 0} color="red" tooltip="Broj korisnika koji su dodali oglas u favorite" large />
        <StatCard icon={IoShareSocialOutline} label="Dijeljenja" value={summary?.period?.shares || 0} color="purple" tooltip="Broj dijeljenja na društvenim mrežama" large />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <IoTimeOutline size={14} />
            <span className="text-xs font-medium">Prosj. vrijeme</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{formatDuration(summary?.period?.avg_time_on_page || 0)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <IoEyeOutline size={14} />
            <span className="text-xs font-medium">Pregleda/dan</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{summary?.period?.avg_views_per_day || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <HiOutlineExternalLink size={14} />
            <span className="text-xs font-medium">Search CTR</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{summary?.period?.search_ctr || 0}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <IoStatsChartOutline size={14} />
            <span className="text-xs font-medium">Konverzija</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{funnel?.conversion_rate || 0}%</p>
        </div>
      </div>

      {/* Views Chart */}
      <CollapsibleSection title="Pregledi po danima" icon={IoEyeOutline} iconColor="text-blue-500" defaultOpen={true}>
        <ViewsChart data={daily} />
      </CollapsibleSection>

      {/* Contacts */}
      <CollapsibleSection title="Kontakti po tipu" icon={IoCallOutline} iconColor="text-emerald-500" defaultOpen={true}>
        <ContactStats data={summary?.period} />
      </CollapsibleSection>

      {/* Two Column */}
      <div className="grid lg:grid-cols-2 gap-6">
        <CollapsibleSection title="Izvori prometa" icon={IoLocationOutline} iconColor="text-purple-500" defaultOpen={true}>
          <SourcesChart data={sources} />
        </CollapsibleSection>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-5">
            <IoPhonePortraitOutline className="text-cyan-500" size={20} />
            Uređaji
          </h3>
          <DevicesChart data={devices} />
        </div>
      </div>

      {/* Engagement Funnel */}
      <CollapsibleSection title="Funnel konverzije" icon={IoTrendingUp} iconColor="text-emerald-500" defaultOpen={false}>
        <EngagementFunnel data={funnel} />
      </CollapsibleSection>

      {/* Featured */}
      {(summary?.featured?.days > 0 || summary?.non_featured?.days > 0) && (
        <CollapsibleSection title="Efekt isticanja" icon={IoStatsChartOutline} iconColor="text-amber-500" defaultOpen={false}>
          <FeaturedComparison featured={summary?.featured} nonFeatured={summary?.non_featured} improvement={summary?.featured_improvement_percent} />
        </CollapsibleSection>
      )}

      {/* Today vs Yesterday */}
      <TodayYesterdayComparison summary={summary} />
    </div>
  );
};

export default ItemStatisticsDashboard;