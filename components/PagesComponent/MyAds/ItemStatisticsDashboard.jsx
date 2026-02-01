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
  IoRefreshOutline,
  IoCalendarOutline,
  IoFlashOutline,
  IoSparkles,
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

const PIE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

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

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
};

const calculateRate = (value, total) => {
  if (!total) return 0;
  return (value / total) * 100;
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

const getPeakHour = (hourly) => {
  if (!hourly?.length) return null;
  return hourly.reduce((max, current) => (current.views > max.views ? current : max), hourly[0]);
};

// ============================================
// BENTO BOX COMPONENT (NOVI DIZAJN OKVIRA)
// ============================================
const BentoBox = ({ title, icon: Icon, children, className }) => (
  <div
    className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-6 ${className}`}
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600">
        <Icon size={20} />
      </div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    </div>
    {children}
  </div>
);

// ============================================
// SHIMMER SKELETON
// ============================================
const ShimmerSkeleton = ({ className }) => (
  <div
    className={`relative overflow-hidden bg-slate-100 rounded-xl ${className}`}
  >
    <div
      className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
      }}
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
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-slate-500">{entry.name}:</span>
          <span className="text-sm font-semibold text-slate-800">
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// STAT CARD (NOVI HERO DIZAJN)
// ============================================
const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color = "blue",
  large = false,
}) => {
  // Dizajni za kartice
  const designs = {
    blue: "from-blue-500 to-indigo-600 text-white shadow-blue-200",
    green: "from-emerald-400 to-teal-500 text-white shadow-emerald-200",
    purple: "from-violet-500 to-fuchsia-600 text-white shadow-violet-200",
    orange: "from-orange-400 to-amber-500 text-white shadow-orange-200",
    red: "from-rose-500 to-pink-600 text-white shadow-rose-200",
    white: "bg-white text-slate-800 border border-slate-100 shadow-slate-100",
  };

  const styleClass = large ? designs[color] : designs["white"];
  const iconClass = large
    ? "text-white/90 bg-white/20"
    : `text-${color}-500 bg-${color}-50`;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`relative rounded-3xl p-6 ${
        large
          ? `bg-gradient-to-br ${styleClass} shadow-xl`
          : `${styleClass} shadow-lg`
      } overflow-hidden`}
    >
      {/* Dekoracije za velike kartice */}
      {large && (
        <>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 rounded-full bg-black/5 blur-xl"></div>
        </>
      )}

      <div className="relative z-10 flex justify-between items-start">
        <div className={`p-3 rounded-2xl ${iconClass} backdrop-blur-sm`}>
          <Icon size={24} />
        </div>
        {trend !== undefined && trend !== null && trend !== 0 && (
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              large
                ? "bg-white/20 text-white backdrop-blur-md border border-white/20"
                : trend > 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {trend > 0 ? (
              <IoTrendingUp size={12} />
            ) : (
              <IoTrendingDown size={12} />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="relative z-10 mt-4">
        <p
          className={`text-sm font-medium ${
            large ? "text-white/80" : "text-slate-500"
          }`}
        >
          {label}
        </p>
        <div className="flex items-end gap-2 mt-1">
          <h3 className="text-4xl font-bold tracking-tight">
            {formatNumber(value)}
          </h3>
          {subValue && (
            <span
              className={`text-sm mb-1 ${
                large ? "text-white/60" : "text-slate-400"
              }`}
            >
              {subValue}
            </span>
          )}
        </div>
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
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColors[color]}`}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className="text-xl font-bold text-slate-800">
          {formatNumber(value)}
        </p>
      </div>
    </div>
  );
};

// ============================================
// INSIGHT CARD
// ============================================
const InsightCard = ({ icon: Icon, label, value, hint, tone = "slate" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-violet-50 text-violet-600 border-violet-100",
    orange: "bg-amber-50 text-amber-600 border-amber-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="text-xs text-slate-500 mt-3 uppercase tracking-wide font-semibold">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
};

// ============================================
// RATE ROW
// ============================================
const RateRow = ({ label, value, color = "bg-blue-500" }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
      <span>{label}</span>
      <span>{formatPercent(value)}</span>
    </div>
    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  </div>
);

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
            value === p.value
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

// ============================================
// VIEWS CHART (S GLOW EFEKTOM)
// ============================================
const ViewsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400">
        Nema podataka za prikaz
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <filter id="shadow" height="200%">
              <feDropShadow
                dx="0"
                dy="5"
                stdDeviation="5"
                floodColor="#6366f1"
                floodOpacity="0.3"
              />
            </filter>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />
          <XAxis
            dataKey="formatted_date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="views"
            name="Pregledi"
            stroke="#6366f1"
            strokeWidth={3}
            fill="url(#colorViews)"
            filter="url(#shadow)"
            activeDot={{
              r: 6,
              fill: "#6366f1",
              strokeWidth: 4,
              stroke: "#fff",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================
// SOURCES CHART
// ============================================
const SourcesChart = ({ data }) => {
  if (!data) return null;

  const chartData = [
    ...(data.internal || []),
    ...(data.external || []),
  ]
    .filter((s) => s.value > 0)
    .slice(0, 8);

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-400">
        Nema podataka o izvorima
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-[200px] h-[200px] mb-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              cornerRadius={6}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                  strokeWidth={0}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatNumber(value)} />
          </PieChart>
        </ResponsiveContainer>
        {/* Centrirani tekst */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-sm text-slate-400 font-medium">Ukupno</span>
          <span className="text-2xl font-bold text-slate-800">
            {chartData.reduce((a, b) => a + b.value, 0)}
          </span>
        </div>
      </div>

      <div className="w-full space-y-2">
        {chartData.slice(0, 4).map((source, index) => (
          <div key={source.name} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
              }}
            />
            <span className="text-sm text-slate-600 flex-1 truncate">
              {source.name}
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {source.percent}%
            </span>
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
    {
      name: "Mobitel",
      value: data.mobile?.value || 0,
      percent: data.mobile?.percent || 0,
      icon: IoPhonePortraitOutline,
      color: COLORS.primary,
    },
    {
      name: "Desktop",
      value: data.desktop?.value || 0,
      percent: data.desktop?.percent || 0,
      icon: IoDesktopOutline,
      color: COLORS.secondary,
    },
    {
      name: "Tablet",
      value: data.tablet?.value || 0,
      percent: data.tablet?.percent || 0,
      icon: IoTabletPortraitOutline,
      color: COLORS.success,
    },
  ];

  const total = devices.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center text-slate-400">
        Nema podataka o uređajima
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {devices.map((device) => {
        const Icon = device.icon;
        return (
          <div key={device.name} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                  <Icon size={20} />
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {device.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-800">
                  {formatNumber(device.value)}
                </span>
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                  {device.percent}%
                </span>
              </div>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${device.percent}%` }}
                transition={{ duration: 1, ease: "circOut" }}
                className="h-full rounded-full relative overflow-hidden"
                style={{ backgroundColor: device.color }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
              </motion.div>
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
    {
      icon: IoCallOutline,
      label: "Pozivi",
      value: data.phone_clicks || 0,
      color: "blue",
    },
    {
      icon: FaWhatsapp,
      label: "WhatsApp",
      value: data.whatsapp_clicks || 0,
      color: "green",
    },
    {
      icon: FaViber,
      label: "Viber",
      value: data.viber_clicks || 0,
      color: "purple",
    },
    {
      icon: IoChatbubbleOutline,
      label: "Poruke",
      value: data.messages || 0,
      color: "blue",
    },
    {
      icon: MdOutlineEmail,
      label: "Email",
      value: data.email_clicks || 0,
      color: "orange",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {contacts.map((contact) => (
        <MiniStat
          key={contact.label}
          icon={contact.icon}
          label={contact.label}
          value={contact.value}
          color={contact.color}
        />
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
    return (
      <div className="h-[160px] flex items-center justify-center text-slate-400">
        Nema podataka o konverziji
      </div>
    );
  }

  const colors = [
    "bg-gradient-to-r from-blue-500 to-blue-400",
    "bg-gradient-to-r from-indigo-500 to-indigo-400",
    "bg-gradient-to-r from-purple-500 to-purple-400",
    "bg-gradient-to-r from-emerald-500 to-emerald-400",
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {funnelArr.map((stage, index) => (
          <motion.div
            key={stage.stage}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: `${100 - index * 10}%`, opacity: 1 }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            className={`h-14 ${
              colors[index % colors.length]
            } rounded-2xl flex items-center justify-between px-5 text-white shadow-md relative overflow-hidden group`}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-sm font-semibold">{stage.stage}</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                {formatNumber(stage.value)}
              </span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">
                {stage.percent}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
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
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200/20 rounded-full blur-xl -mr-4 -mt-4"></div>
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <span className="text-xl">⭐</span>
            <span className="text-sm font-bold text-amber-800">Istaknuto</span>
          </div>
          <p className="text-3xl font-bold text-amber-900 relative z-10">
            {formatNumber(featured?.avg_views_per_day || 0)}
          </p>
          <p className="text-xs text-amber-700 mt-1 font-medium relative z-10">
            pregleda/dan ({featured?.days || 0} dana)
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📋</span>
            <span className="text-sm font-bold text-slate-600">Normalno</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {formatNumber(nonFeatured?.avg_views_per_day || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            pregleda/dan ({nonFeatured?.days || 0} dana)
          </p>
        </div>
      </div>

      {improvement > 0 && (
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-center">
          <p className="text-sm text-emerald-700 font-medium">
            Isticanje povećava preglede za{" "}
            <span className="font-bold text-2xl ml-1 text-emerald-600">
              +{improvement}%
            </span>
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
    <div className="grid sm:grid-cols-2 gap-6">
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
            <IoFlashOutline size={18} />
          </div>
          <h4 className="text-base font-bold text-blue-900">Današnja aktivnost</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/60 p-3 rounded-xl">
            <p className="text-2xl font-bold text-blue-900">
              {today.views || 0}
            </p>
            <p className="text-[10px] text-blue-600 uppercase tracking-wide font-bold">
              Pregleda
            </p>
          </div>
          <div className="bg-white/60 p-3 rounded-xl">
            <p className="text-2xl font-bold text-blue-900">
              {today.messages || 0}
            </p>
            <p className="text-[10px] text-blue-600 uppercase tracking-wide font-bold">
              Poruka
            </p>
          </div>
          <div className="bg-white/60 p-3 rounded-xl">
            <p className="text-2xl font-bold text-blue-900">
              {today.favorites || 0}
            </p>
            <p className="text-[10px] text-blue-600 uppercase tracking-wide font-bold">
              Favorita
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-white rounded-xl text-slate-500 shadow-sm">
            <IoCalendarOutline size={18} />
          </div>
          <h4 className="text-base font-bold text-slate-700">Jučer</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-800">
              {yesterday.views || 0}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">
              Pregleda
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">
              {yesterday.messages || 0}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">
              Poruka
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">
              {yesterday.favorites || 0}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">
              Favorita
            </p>
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
  <div className="space-y-8">
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-3">
          <ShimmerSkeleton className="h-8 w-64 rounded-lg" />
          <ShimmerSkeleton className="h-4 w-40 rounded-lg" />
        </div>
        <ShimmerSkeleton className="h-10 w-48 rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <ShimmerSkeleton key={i} className="h-48 rounded-3xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ShimmerSkeleton className="lg:col-span-2 h-96 rounded-3xl" />
      <ShimmerSkeleton className="h-96 rounded-3xl" />
    </div>
  </div>
);

// ============================================
// ERROR STATE
// ============================================
const ErrorState = ({ onRetry }) => (
  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <IoRefreshOutline size={36} className="text-red-500" />
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">
      Ups, došlo je do greške
    </h3>
    <p className="text-slate-500 mb-8 max-w-md mx-auto">
      Nismo uspjeli učitati statistiku za tvoj oglas. Molimo provjeri internet
      konekciju ili pokušaj ponovo.
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium shadow-lg shadow-slate-200"
    >
      <IoRefreshOutline size={20} />
      Pokušaj ponovo
    </button>
  </div>
);

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = () => (
  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
    <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
      <IoStatsChartOutline size={40} className="text-slate-400" />
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">
      Nema dostupne statistike
    </h3>
    <p className="text-slate-500 max-w-md mx-auto">
      Tvoj oglas još uvijek nema zabilježenih aktivnosti. Podijeli ga na
      društvenim mrežama da povećaš vidljivost!
    </p>
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

  const { summary, daily, sources, devices, funnel, hourly } = stats;

  const periodViews = summary?.period?.views || 0;
  const periodFavorites = summary?.period?.favorites || 0;
  const periodShares = summary?.period?.shares || 0;
  const periodMessages = summary?.period?.messages || 0;
  const periodPhone = summary?.period?.phone_clicks || 0;
  const periodWhatsapp = summary?.period?.whatsapp_clicks || 0;
  const periodViber = summary?.period?.viber_clicks || 0;
  const periodEmail = summary?.period?.email_clicks || 0;
  const periodContacts = periodPhone + periodWhatsapp + periodViber + periodEmail;
  const periodInteractions = periodContacts + periodMessages;

  const engagementRate = calculateRate(periodInteractions, periodViews);
  const contactRate = calculateRate(periodContacts, periodViews);
  const messageRate = calculateRate(periodMessages, periodViews);
  const favoriteRate = calculateRate(periodFavorites, periodViews);
  const shareRate = calculateRate(periodShares, periodViews);

  const topSource = getTopSource(sources);
  const topDevice = getTopDevice(devices);
  const peakDay = getPeakDay(daily);
  const peakHour = getPeakHour(hourly);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-200">
              <IoStatsChartOutline className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Analitika oglasa
              </h2>
              {itemName && (
                <p className="text-sm text-slate-500 truncate max-w-md font-medium">
                  {itemName}
                </p>
              )}
            </div>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* HERO METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={IoEyeOutline}
          label="Ukupno pregleda"
          value={summary?.period?.views || 0}
          trend={summary?.trends?.views_vs_yesterday}
          color="blue"
          large={true}
        />
        <StatCard
          icon={MdTouchApp}
          label="Interakcije"
          value={
            (summary?.period?.phone_clicks || 0) +
            (summary?.period?.messages || 0)
          }
          color="green"
          large={true}
        />
        <StatCard
          icon={IoHeartOutline}
          label="Favoriti"
          value={summary?.period?.favorites || 0}
          color="red"
          large={true}
        />
        <StatCard
          icon={IoShareSocialOutline}
          label="Dijeljenja"
          value={summary?.period?.shares || 0}
          color="purple"
          large={true}
        />
      </div>

      {/* SECONDARY METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            Vrijeme na stranici
          </span>
          <span className="text-lg font-bold text-slate-800">
            {formatDuration(summary?.period?.avg_time_on_page || 0)}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            Pregleda/dan
          </span>
          <span className="text-lg font-bold text-slate-800">
            {summary?.period?.avg_views_per_day || 0}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            Search CTR
          </span>
          <span className="text-lg font-bold text-slate-800">
            {summary?.period?.search_ctr || 0}%
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            Konverzija
          </span>
          <span className="text-lg font-bold text-slate-800">
            {funnel?.conversion_rate || 0}%
          </span>
        </div>
      </div>

      {/* INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BentoBox title="Kvalitet angažmana" icon={IoSparkles} className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <RateRow label="Stopa angažmana" value={engagementRate} color="bg-emerald-500" />
              <RateRow label="Stopa kontakta" value={contactRate} color="bg-blue-500" />
              <RateRow label="Stopa poruka" value={messageRate} color="bg-indigo-500" />
              <RateRow label="Stopa favorita" value={favoriteRate} color="bg-rose-500" />
              <RateRow label="Stopa dijeljenja" value={shareRate} color="bg-violet-500" />
            </div>
            <div className="grid gap-4">
              <InsightCard
                icon={IoTimeOutline}
                label="Prosječno vrijeme"
                value={formatDuration(summary?.period?.avg_time_on_page || 0)}
                hint="Vrijeme na stranici"
                tone="blue"
              />
              <InsightCard
                icon={IoTrendingUp}
                label="Search CTR"
                value={`${summary?.period?.search_ctr || 0}%`}
                hint="Pretrage → klik"
                tone="purple"
              />
              <InsightCard
                icon={IoStatsChartOutline}
                label="Konverzija"
                value={`${funnel?.conversion_rate || 0}%`}
                hint="Interakcije → kontakt"
                tone="green"
              />
            </div>
          </div>
        </BentoBox>

        <BentoBox title="Publika i timing" icon={IoLocationOutline}>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                Najjači izvor
              </p>
              <p className="text-base font-bold text-slate-800">
                {topSource?.name || "Nema podataka"}
              </p>
              {topSource && (
                <p className="text-xs text-slate-400">
                  {formatNumber(topSource.value)} posjeta · {topSource.percent}%
                </p>
              )}
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                Najjači uređaj
              </p>
              <p className="text-base font-bold text-slate-800">
                {topDevice?.label || "Nema podataka"}
              </p>
              {topDevice && (
                <p className="text-xs text-slate-400">
                  {formatNumber(topDevice.value)} posjeta · {topDevice.percent}%
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
                  Najjači dan
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {peakDay?.formatted_date || "—"}
                </p>
                <p className="text-xs text-slate-400">{formatNumber(peakDay?.views || 0)} pregleda</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
                  Peak sat
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {peakHour?.hour ? `${peakHour.hour}:00` : "—"}
                </p>
                <p className="text-xs text-slate-400">{formatNumber(peakHour?.views || 0)} pregleda</p>
              </div>
            </div>
          </div>
        </BentoBox>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CHART - 2/3 Width */}
        <BentoBox
          title="Analiza pregleda"
          icon={IoStatsChartOutline}
          className="lg:col-span-2"
        >
          <ViewsChart data={daily} />
        </BentoBox>

        {/* CONTACT STATS - 1/3 Width */}
        <BentoBox title="Kontakti i Angažman" icon={IoCallOutline}>
          <div className="h-full flex flex-col justify-between gap-4">
            <ContactStats data={summary?.period} />
            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Najčešći kanal</p>
              <p className="text-sm font-bold text-slate-800">
                Poziv putem mobitela
              </p>
            </div>
          </div>
        </BentoBox>

        {/* TRAFFIC SOURCES */}
        <BentoBox title="Izvori prometa" icon={IoLocationOutline}>
          <SourcesChart data={sources} />
        </BentoBox>

        {/* DEVICES & TECH */}
        <BentoBox
          title="Uređaji i Tehnologija"
          icon={IoPhonePortraitOutline}
          className="lg:col-span-2"
        >
          <div className="grid sm:grid-cols-2 gap-10">
            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">
                Distribucija
              </h4>
              <DevicesChart data={devices} />
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center">
               <h4 className="text-sm font-bold text-slate-800 mb-2">Jeste li znali?</h4>
               <p className="text-sm text-slate-500 leading-relaxed">
                 Većina vaših korisnika ({devices?.mobile?.percent || 0}%) dolazi putem mobilnih uređaja. Osigurajte da su vaše slike jasne na manjim ekranima.
               </p>
            </div>
          </div>
        </BentoBox>
      </div>

      {/* FUNNEL & PROMOTION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BentoBox title="Konverzijski lijevak" icon={IoTrendingUp}>
          <EngagementFunnel data={funnel} />
        </BentoBox>

        {(summary?.featured?.days > 0 || summary?.non_featured?.days > 0) ? (
          <BentoBox title="Efekt isticanja" icon={IoFlashOutline}>
            <FeaturedComparison
              featured={summary?.featured}
              nonFeatured={summary?.non_featured}
              improvement={summary?.featured_improvement_percent}
            />
          </BentoBox>
        ) : (
             <TodayYesterdayComparison summary={summary} />
        )}
      </div>
      
      {/* FALLBACK FOR COMPARISON IF NOT FEATURED */}
      {(summary?.featured?.days > 0 || summary?.non_featured?.days > 0) && (
         <TodayYesterdayComparison summary={summary} />
      )}
      
      <div className="text-center pb-6">
        <p className="text-xs text-slate-400 font-medium">
          Podaci se ažuriraju u stvarnom vremenu. Posljednje ažuriranje: Upravo sada.
        </p>
      </div>
    </div>
  );
};

export default ItemStatisticsDashboard;
