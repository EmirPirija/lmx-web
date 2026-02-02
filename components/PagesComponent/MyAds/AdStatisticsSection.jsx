"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { itemStatisticsApi, membershipApi } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoChevronDown,
  IoChevronUp,
  IoEyeOutline,
  IoHeartOutline,
  IoChatbubbleOutline,
  IoHelpCircleOutline,
  IoTrendingUp,
  IoTrendingDown,
  IoPhonePortraitOutline,
  IoDesktopOutline,
  IoTabletPortraitOutline,
  IoSearchOutline,
  IoLayersOutline,
  IoRocketOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoCallOutline,
  IoRefreshOutline,
  IoAlertCircleOutline,
  IoStatsChartOutline,
  IoSparkles,
  IoLockClosed,
} from "react-icons/io5";
import { FaWhatsapp, FaViber } from "react-icons/fa";
import { MdOutlineEmail, MdTouchApp } from "react-icons/md";
import { Crown, Store, Sparkles } from "lucide-react";
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
  BarChart,
  Bar,
} from "recharts";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#06b6d4", "#ec4899"];

// ============================================
// HELPERS
// ============================================
const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const calculateRate = (value, total) => {
  if (!total) return 0;
  return (value / total) * 100;
};

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
};

const getTopSource = (sources) => {
  const data = [...(sources?.internal || []), ...(sources?.external || [])];
  if (!data.length) return null;
  return data.reduce((max, current) => (current.value > max.value ? current : max), data[0]);
};

const getTopDevice = (devices) => {
  const list = [
    { label: "Mobitel", value: devices?.mobile?.value || 0, percent: devices?.mobile?.percent || 0 },
    { label: "Desktop", value: devices?.desktop?.value || 0, percent: devices?.desktop?.percent || 0 },
    { label: "Tablet", value: devices?.tablet?.value || 0, percent: devices?.tablet?.percent || 0 },
  ];
  return list.reduce((max, current) => (current.value > max.value ? current : max), list[0]);
};

const getPeakDay = (daily) => {
  if (!daily?.length) return null;
  return daily.reduce((max, current) => (current.views > max.views ? current : max), daily[0]);
};

// ============================================
// CUSTOM TOOLTIP
// ============================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg border border-slate-100 text-sm">
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-semibold text-slate-800">{formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// LOCK OVERLAY
// ============================================
const LockOverlay = ({ tier = "pro", feature = "" }) => {
  const config = {
    pro: { icon: Crown, gradient: "from-amber-400 to-yellow-500", name: "LMX Pro", bg: "from-amber-50 to-yellow-50" },
    shop: { icon: Store, gradient: "from-blue-500 to-indigo-600", name: "LMX Shop", bg: "from-blue-50 to-indigo-50" },
  }[tier];

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white via-white/90 to-white/70 backdrop-blur-[2px] rounded-2xl z-10"
    >
      <div className="text-center p-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
        >
          <Icon className="text-white" size={22} />
        </motion.div>
        <h4 className="font-bold text-slate-800 text-sm mb-1">{feature || "Napredna statistika"}</h4>
        <p className="text-xs text-slate-500 mb-3 max-w-[180px] mx-auto leading-relaxed">
          Dostupno za {config.name} korisnike
        </p>
        <Link href="/membership/upgrade">
          <Button
            size="sm"
            className={`bg-gradient-to-r ${config.gradient} text-white border-0 shadow-md hover:shadow-lg transition-all text-xs h-8 px-3`}
          >
            <Sparkles size={12} className="mr-1.5" />
            Nadogradi
          </Button>
        </Link>
      </div>
    </motion.div>
  );
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

const StatisticsSkeleton = () => (
  <div className="p-4 space-y-4">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <ShimmerSkeleton key={i} className="h-24" />
      ))}
    </div>
    <ShimmerSkeleton className="h-48" />
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <ShimmerSkeleton key={i} className="h-16" />
      ))}
    </div>
  </div>
);

// ============================================
// ERROR STATE
// ============================================
const StatisticsError = ({ onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-8 text-center"
  >
    <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
      <IoAlertCircleOutline className="text-red-500" size={28} />
    </div>
    <h4 className="font-semibold text-slate-800 mb-1">Greška pri učitavanju</h4>
    <p className="text-sm text-slate-500 mb-4">Nije moguće dohvatiti statistiku</p>
    <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
      <IoRefreshOutline size={16} />
      Pokušaj ponovo
    </Button>
  </motion.div>
);

// ============================================
// EMPTY STATE
// ============================================
const StatisticsEmpty = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-8 text-center"
  >
    <div className="w-14 h-14 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
      <IoStatsChartOutline className="text-slate-400" size={28} />
    </div>
    <h4 className="font-semibold text-slate-800 mb-1">Nema statistike</h4>
    <p className="text-sm text-slate-500">Podaci će biti dostupni nakon prvih pregleda</p>
  </motion.div>
);

// ============================================
// STAT CARD - Mini version
// ============================================
const StatCard = ({ icon: Icon, label, value, subValue, trend, color = "blue", highlight = false }) => {
  const colorMap = {
    blue: { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600" },
    green: { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600" },
    purple: { bg: "bg-purple-500", light: "bg-purple-50", text: "text-purple-600" },
    orange: { bg: "bg-orange-500", light: "bg-orange-50", text: "text-orange-600" },
    red: { bg: "bg-red-500", light: "bg-red-50", text: "text-red-600" },
  };

  const c = colorMap[color];

  if (highlight) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`${c.bg} rounded-2xl p-4 text-white relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2 text-white/80">
            <Icon size={16} />
            <span className="text-xs font-medium">{label}</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(value)}</p>
          {subValue && <p className="text-xs text-white/70 mt-1">{subValue}</p>}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-2 text-slate-500">
        <div className={`w-7 h-7 rounded-lg ${c.light} flex items-center justify-center`}>
          <Icon size={14} className={c.text} />
        </div>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-800">{formatNumber(value)}</p>
          {subValue && <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>}
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend > 0 ? <IoTrendingUp size={14} /> : <IoTrendingDown size={14} />}
            {trend > 0 ? "+" : ""}{trend}%
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// VIEWS CHART
// ============================================
const ViewsChartSection = ({ daily }) => {
  if (!daily || daily.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
          <IoEyeOutline className="text-blue-500" />
          Pregledi po danima
        </h4>
        <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
          Nema podataka za graf
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
        <IoEyeOutline className="text-blue-500" />
        Pregledi po danima
      </h4>
      <div className="h-[180px] sm:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={daily} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <defs>
              <linearGradient id="viewsGradFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.2} />
                <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="formatted_date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="views"
              name="Pregledi"
              stroke={COLORS.primary}
              strokeWidth={2}
              fill="url(#viewsGradFill)"
              dot={false}
              activeDot={{ r: 4, fill: COLORS.primary, strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ============================================
// INTERACTIONS GRID
// ============================================
const InteractionsSection = ({ summary }) => {
  const period = summary?.period || {};

  const items = [
    { icon: IoChatbubbleOutline, label: "Poruke", value: period.messages || 0, color: "blue" },
    { icon: IoHelpCircleOutline, label: "Pitanja", value: period.public_questions || 0, color: "purple" },
    { icon: IoHeartOutline, label: "Favoriti", value: period.favorites || 0, color: "red" },
    {
      icon: MdTouchApp,
      label: "Kontakti",
      value: (period.phone_clicks || 0) + (period.whatsapp_clicks || 0) + (period.viber_clicks || 0) + (period.email_clicks || 0),
      color: "green",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        const colorMap = {
          blue: "text-blue-500 bg-blue-50",
          purple: "text-purple-500 bg-purple-50",
          red: "text-red-500 bg-red-50",
          green: "text-emerald-500 bg-emerald-50",
        };
        return (
          <motion.div
            key={item.label}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl p-3 border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorMap[item.color]}`}>
                <Icon size={12} />
              </div>
              <span className="text-xs text-slate-500 font-medium">{item.label}</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{formatNumber(item.value)}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

// ============================================
// ENGAGEMENT RATES
// ============================================
const EngagementRatesSection = ({ summary }) => {
  const period = summary?.period || {};
  const views = period.views || 0;
  const contacts =
    (period.phone_clicks || 0) +
    (period.whatsapp_clicks || 0) +
    (period.viber_clicks || 0) +
    (period.email_clicks || 0);

  const rates = [
    { label: "Stopa kontakta", value: calculateRate(contacts, views), color: "bg-emerald-500" },
    { label: "Stopa poruka", value: calculateRate(period.messages || 0, views), color: "bg-blue-500" },
    { label: "Stopa favorita", value: calculateRate(period.favorites || 0, views), color: "bg-rose-500" },
    { label: "Stopa dijeljenja", value: calculateRate(period.shares || 0, views), color: "bg-violet-500" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
        <IoSparkles className="text-indigo-500" />
        Kvalitet angažmana
      </h4>
      <div className="space-y-3">
        {rates.map((rate) => (
          <div key={rate.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span>{rate.label}</span>
              <span>{formatPercent(rate.value)}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(rate.value, 100)}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={`h-full rounded-full ${rate.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// HIGHLIGHTS
// ============================================
const HighlightsSection = ({ sources, devices, daily }) => {
  const topSource = getTopSource(sources);
  const topDevice = getTopDevice(devices);
  const peakDay = getPeakDay(daily);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
        <IoSparkles className="text-amber-500" />
        Highlighti publike
      </h4>
      <div className="grid gap-3">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Najjači izvor</p>
          <p className="text-sm font-bold text-slate-800">{topSource?.name || "Nema podataka"}</p>
          {topSource && (
            <p className="text-xs text-slate-400">
              {formatNumber(topSource.value)} posjeta · {topSource.percent}%
            </p>
          )}
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Najjači uređaj</p>
          <p className="text-sm font-bold text-slate-800">{topDevice?.label || "Nema podataka"}</p>
          {topDevice && (
            <p className="text-xs text-slate-400">
              {formatNumber(topDevice.value)} posjeta · {topDevice.percent}%
            </p>
          )}
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Najbolji dan</p>
          <p className="text-sm font-bold text-slate-800">{peakDay?.formatted_date || "—"}</p>
          <p className="text-xs text-slate-400">{formatNumber(peakDay?.views || 0)} pregleda</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PROMOTION SECTION
// ============================================
const PromotionSection = ({ summary }) => {
  const featured = summary?.featured;
  const improvement = summary?.featured_improvement_percent || 0;

  if (!featured?.days) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border border-amber-100/50 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
            <IoRocketOutline className="text-white" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 text-sm">Istaknite oglas</h4>
            <p className="text-xs text-amber-700/80">Do 5x više pregleda</p>
          </div>
          <Link href="/featured">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8">
              Istakni
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border border-amber-100/50 p-4">
      <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2 text-sm">
        <IoRocketOutline className="text-amber-600" />
        Statistika isticanja
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Pregledi", value: featured?.total_views || 0 },
          { label: "Prosječno/dan", value: featured?.avg_views_per_day || 0 },
          { label: "Poboljšanje", value: improvement > 0 ? `+${improvement}%` : "N/A", highlight: true },
          { label: "Dana", value: featured?.days || 0 },
        ].map((item, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
            <p className="text-[10px] text-amber-700 uppercase tracking-wide font-medium">{item.label}</p>
            <p className={`text-lg font-bold ${item.highlight ? "text-emerald-600" : "text-amber-900"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// TRAFFIC SOURCES
// ============================================
const TrafficSourcesSection = ({ sources }) => {
  const allSources = [...(sources?.internal || []), ...(sources?.external || [])]
    .filter((s) => s.value > 0)
    .slice(0, 6);

  if (allSources.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4 h-full">
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
          <IoLocationOutline className="text-purple-500" />
          Izvori prometa
        </h4>
        <div className="h-[140px] flex items-center justify-center text-slate-400 text-sm">
          Nema podataka
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 h-full">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
        <IoLocationOutline className="text-purple-500" />
        Izvori prometa
      </h4>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-[120px] h-[120px] flex-shrink-0 mx-auto sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={allSources} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2} dataKey="value">
                {allSources.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          {allSources.map((source, index) => (
            <div key={source.name} className="flex items-center gap-2 text-sm">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
              <span className="text-slate-600 truncate flex-1 text-xs">{source.name}</span>
              <span className="font-semibold text-slate-800 text-xs">{source.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// PLATFORMS/DEVICES
// ============================================
const PlatformsSection = ({ devices }) => {
  if (!devices) return null;

  const platforms = [
    { name: "Mobitel", data: devices.mobile, icon: IoPhonePortraitOutline, color: COLORS.primary },
    { name: "Desktop", data: devices.desktop, icon: IoDesktopOutline, color: COLORS.secondary },
    { name: "Tablet", data: devices.tablet, icon: IoTabletPortraitOutline, color: COLORS.success },
  ];

  const total = platforms.reduce((sum, p) => sum + (p.data?.value || 0), 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4 h-full">
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
          <IoPhonePortraitOutline className="text-cyan-500" />
          Uređaji
        </h4>
        <div className="h-[140px] flex items-center justify-center text-slate-400 text-sm">
          Nema podataka
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 h-full">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
        <IoPhonePortraitOutline className="text-cyan-500" />
        Uređaji
      </h4>
      <div className="space-y-3">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const value = platform.data?.value || 0;
          const percent = platform.data?.percent || 0;
          return (
            <div key={platform.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-slate-400" />
                  <span className="text-slate-600 font-medium">{platform.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">{formatNumber(value)}</span>
                  <span className="text-slate-400">({percent}%)</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: platform.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// CONTACT BREAKDOWN (PRO)
// ============================================
const ContactBreakdownSection = ({ summary }) => {
  const period = summary?.period || {};

  const contacts = [
    { icon: IoCallOutline, label: "Pozivi", value: period.phone_clicks || 0, color: "text-blue-500 bg-blue-50" },
    { icon: FaWhatsapp, label: "WhatsApp", value: period.whatsapp_clicks || 0, color: "text-green-500 bg-green-50" },
    { icon: FaViber, label: "Viber", value: period.viber_clicks || 0, color: "text-purple-500 bg-purple-50" },
    { icon: MdOutlineEmail, label: "Email", value: period.email_clicks || 0, color: "text-orange-500 bg-orange-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {contacts.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}>
              <Icon size={14} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{c.label}</p>
              <p className="text-sm font-bold text-slate-800">{c.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// SEARCH TERMS (PRO)
// ============================================
const SearchTermsSection = ({ searchTerms }) => {
  if (!searchTerms || searchTerms.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4 h-full">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
          <IoSearchOutline className="text-indigo-500" />
          Pojmovi pretrage
        </h4>
        <div className="h-[160px] flex items-center justify-center text-slate-400 text-sm">
          Nema podataka
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 h-full">
      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
        <IoSearchOutline className="text-indigo-500" />
        Pojmovi pretrage
      </h4>
      <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
        {searchTerms.slice(0, 8).map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <span className="text-xs text-slate-700 font-medium truncate flex-1">"{item.term}"</span>
            <span className="text-xs text-slate-500 ml-2">{item.count}x</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// SEARCH POSITION (PRO)
// ============================================
const SearchPositionSection = ({ searchPositions }) => {
  if (!searchPositions || searchPositions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4 h-full">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
          <IoLayersOutline className="text-orange-500" />
          Pozicija u pretrazi
        </h4>
        <div className="h-[160px] flex items-center justify-center text-slate-400 text-sm">
          Nema podataka
        </div>
      </div>
    );
  }

  const maxViews = Math.max(...searchPositions.map((d) => d.views || d.count || 0));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 h-full">
      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
        <IoLayersOutline className="text-orange-500" />
        Pozicija u pretrazi
      </h4>
      <div className="space-y-2">
        {searchPositions.slice(0, 6).map((item, index) => {
          const views = item.views || item.count || 0;
          const widthPercent = maxViews > 0 ? (views / maxViews) * 100 : 0;
          return (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-16 flex-shrink-0">{item.page}. str</span>
              <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(widthPercent, 15)}%` }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-end pr-2"
                >
                  <span className="text-[10px] text-white font-medium">{views}</span>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// VIEWS BY TIME (SHOP)
// ============================================
const ViewsByTimeSection = ({ hourlyData }) => {
  if (!hourlyData || hourlyData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
          <IoTimeOutline className="text-teal-500" />
          Pregledi po satima
        </h4>
        <div className="h-[160px] flex items-center justify-center text-slate-400 text-sm">
          Nema podataka
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
        <IoTimeOutline className="text-teal-500" />
        Pregledi po satima
      </h4>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="views" name="Pregledi" fill={COLORS.cyan} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ============================================
// CONVERSION FUNNEL (SHOP)
// ============================================
const ConversionSection = ({ funnel }) => {
  const funnelArray = Array.isArray(funnel) ? funnel : funnel?.funnel || [];

  if (funnelArray.length === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-4">
        <h4 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2 text-sm">
          <IoTrendingUp className="text-emerald-600" />
          Konverzija
        </h4>
        <div className="h-[100px] flex items-center justify-center text-emerald-600/60 text-sm">
          Nema podataka
        </div>
      </div>
    );
  }

  const conversionRate = funnel?.conversion_rate || 0;
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500"];

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-4">
      <h4 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2 text-sm">
        <IoTrendingUp className="text-emerald-600" />
        Konverzija
      </h4>
      <div className="space-y-2 mb-4">
        {funnelArray.map((stage, index) => (
          <motion.div
            key={stage.stage}
            initial={{ width: 0 }}
            animate={{ width: `${100 - index * 15}%` }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            className={`h-10 ${colors[index % colors.length]} rounded-lg flex items-center justify-between px-3 text-white`}
          >
            <span className="text-xs font-medium truncate">{stage.stage}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold">{formatNumber(stage.value)}</span>
              <span className="text-[10px] opacity-75">({stage.percent}%)</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
        <p className="text-[10px] text-emerald-700 uppercase tracking-wide">Stopa konverzije</p>
        <p className="text-2xl font-bold text-emerald-800">{conversionRate}%</p>
      </div>
    </div>
  );
};

// ============================================
// PERIOD SELECTOR
// ============================================
const PeriodSelector = ({ value, onChange }) => {
  const periods = [
    { value: 7, label: "7d" },
    { value: 14, label: "14d" },
    { value: 30, label: "30d" },
    { value: 90, label: "90d" },
  ];

  return (
    <div className="flex items-center gap-0.5 p-1 bg-slate-100 rounded-xl">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
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
// SECTION HEADER
// ============================================
const SectionHeader = ({ icon: Icon, title, iconColor, badge, locked }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className={iconColor} size={18} />
    <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
    {badge && (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )}
    {locked && (
      <span className="flex items-center gap-1 text-[10px] text-slate-400">
        <IoLockClosed size={10} /> Zaključano
      </span>
    )}
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const AdStatisticsSection = ({ itemId, itemName }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);
  const [membershipTier, setMembershipTier] = useState("free");

  const userData = useSelector(userSignUpData);

  // Fetch membership
  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const response = await membershipApi.getUserMembership({});
        const tier = response?.data?.data?.tier?.slug || response?.data?.data?.membership_tier || "free";
        setMembershipTier(tier.toLowerCase());
      } catch {
        const tier = userData?.membership_tier || userData?.membership?.tier?.slug || "free";
        setMembershipTier(tier.toLowerCase());
      }
    };
    fetchMembership();
  }, [userData]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    if (!itemId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await itemStatisticsApi.getStatistics({ itemId, period });
      const payload = response?.data;

      const isOk =
        payload?.error === false ||
        payload?.error === 0 ||
        payload?.success === true ||
        payload?.status === true ||
        payload?.ok === true;

      if ((isOk || payload?.data) && payload?.data) {
        setStats(payload.data);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("Greška pri učitavanju");
    } finally {
      setLoading(false);
    }
  }, [itemId, period]);

  useEffect(() => {
    if (isExpanded) {
      fetchStatistics();
    }
  }, [isExpanded, fetchStatistics]);

  const isPro = membershipTier === "pro" || membershipTier === "shop";
  const isShop = membershipTier === "shop";

  // Quick stats
  const [quickStats, setQuickStats] = useState(null);

  useEffect(() => {
    const fetchQuickStats = async () => {
      if (!itemId) return;
      try {
        const response = await itemStatisticsApi.getQuickStats({ itemId });
        if (response?.data?.data) {
          setQuickStats(response.data.data);
        }
      } catch {}
    };
    fetchQuickStats();
  }, [itemId]);

  const todayViews = quickStats?.today_views ?? stats?.summary?.today?.views ?? 0;
  const totalViews = quickStats?.total_views ?? stats?.summary?.period?.views ?? 0;
  const trend = quickStats?.views_trend ?? stats?.summary?.trends?.views_vs_yesterday ?? 0;

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* HEADER */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <IoStatsChartOutline className="text-white" size={22} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800 text-sm">Statistika oglasa</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">{todayViews} danas</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">{formatNumber(totalViews)} ukupno</span>
              {trend !== 0 && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {trend > 0 ? <IoTrendingUp size={12} /> : <IoTrendingDown size={12} />}
                  {trend > 0 ? "+" : ""}{trend}%
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPro && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isShop ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
              {isShop ? "Shop" : "Pro"}
            </span>
          )}
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <IoChevronDown className="text-slate-400" size={20} />
          </motion.div>
        </div>
      </button>

      {/* CONTENT */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-5 border-t border-slate-100">
              {/* Period Selector */}
              <div className="flex justify-end pt-3">
                <PeriodSelector value={period} onChange={setPeriod} />
              </div>

              {/* Loading */}
              {loading && <StatisticsSkeleton />}

              {/* Error */}
              {!loading && error && <StatisticsError onRetry={fetchStatistics} />}

              {/* Empty */}
              {!loading && !error && !stats && <StatisticsEmpty />}

              {/* Data */}
              {!loading && !error && stats && (
                <>
                  {/* BASIC TIER */}
                  <div className="space-y-4">
                    {/* Main stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <StatCard
                        icon={IoEyeOutline}
                        label="Danas"
                        value={stats.summary?.today?.views || 0}
                        color="blue"
                        highlight
                      />
                      <StatCard
                        icon={IoEyeOutline}
                        label="Jučer"
                        value={stats.summary?.yesterday?.views || 0}
                        color="blue"
                      />
                      <StatCard
                        icon={IoEyeOutline}
                        label="Period"
                        value={stats.summary?.period?.views || 0}
                        trend={stats.summary?.trends?.views_vs_yesterday}
                        color="blue"
                      />
                      <StatCard
                        icon={IoEyeOutline}
                        label="Prosječno/dan"
                        value={stats.summary?.period?.avg_views_per_day || 0}
                        color="blue"
                      />
                    </div>

                    <ViewsChartSection daily={stats.daily} />
                    <InteractionsSection summary={stats.summary} />
                    <PromotionSection summary={stats.summary} />

                    <div className="grid lg:grid-cols-2 gap-4">
                      <EngagementRatesSection summary={stats.summary} />
                      <HighlightsSection sources={stats.sources} devices={stats.devices} daily={stats.daily} />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                      <TrafficSourcesSection sources={stats.sources} />
                      <PlatformsSection devices={stats.devices} />
                    </div>
                  </div>

                  {/* PRO TIER */}
                  <div className="pt-4 border-t border-slate-100">
                    <SectionHeader
                      icon={Crown}
                      title="Pro statistika"
                      iconColor="text-amber-500"
                      badge={isPro ? { text: "Aktivno", color: "bg-amber-100 text-amber-700" } : null}
                      locked={!isPro}
                    />

                    <div className="relative">
                      {!isPro && <LockOverlay tier="pro" feature="Pro statistika" />}
                      <div className={`space-y-4 ${!isPro ? "blur-sm pointer-events-none select-none" : ""}`}>
                        <ContactBreakdownSection summary={stats.summary} />
                        <div className="grid lg:grid-cols-2 gap-4">
                          <SearchTermsSection searchTerms={stats.search_terms} />
                          <SearchPositionSection searchPositions={stats.search_positions} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SHOP TIER */}
                  <div className="pt-4 border-t border-slate-100">
                    <SectionHeader
                      icon={Store}
                      title="Shop statistika"
                      iconColor="text-blue-500"
                      badge={isShop ? { text: "Aktivno", color: "bg-blue-100 text-blue-700" } : null}
                      locked={!isShop}
                    />

                    <div className="relative">
                      {!isShop && <LockOverlay tier="shop" feature="Shop statistika" />}
                      <div className={`space-y-4 ${!isShop ? "blur-sm pointer-events-none select-none" : ""}`}>
                        <ViewsByTimeSection hourlyData={stats.hourly} />
                        <ConversionSection funnel={stats.funnel} />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Ažurirano: upravo sada</span>
                    {!isShop && (
                      <Link href="/membership/upgrade" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        <IoSparkles size={12} />
                        Više statistika
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdStatisticsSection;