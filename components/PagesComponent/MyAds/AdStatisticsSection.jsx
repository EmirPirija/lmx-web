"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { itemStatisticsApi, membershipApi } from "@/utils/api";
import {
  IoEyeOutline,
  IoTrendingUp,
  IoTrendingDown,
  IoChevronDown,
  IoChevronUp,
  IoHeartOutline,
  IoCallOutline,
  IoChatbubbleOutline,
  IoShareSocialOutline,
  IoTimeOutline,
  IoSearchOutline,
  IoStatsChartOutline,
  IoLockClosedOutline,
  IoPhonePortraitOutline,
  IoDesktopOutline,
  IoTabletPortraitOutline,
  IoRefreshOutline,
  IoInformationCircleOutline,
  IoFlashOutline,
  IoCalendarOutline,
  IoGlobeOutline,
} from "react-icons/io5";
import { FaWhatsapp, FaViber, FaCrown, FaStore } from "react-icons/fa";
import { MdOutlineEmail, MdTouchApp, MdAutorenew } from "react-icons/md";
import { HiOutlineExternalLink, HiOutlineSparkles } from "react-icons/hi";
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

// ============================================
// KONSTANTE
// ============================================
const MEMBERSHIP_TIERS = {
  FREE: "free",
  PRO: "pro",
  SHOP: "shop",
};

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  slate: "#64748b",
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
// HELPER FUNKCIJE
// ============================================
const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const formatDuration = (seconds) => {
  if (!seconds) return "0s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
};

const formatPercent = (value) => {
  if (value === null || value === undefined) return "0%";
  return `${Number(value).toFixed(1)}%`;
};

const getTrendIcon = (value) => {
  if (value > 0) return <IoTrendingUp className="text-green-500" size={14} />;
  if (value < 0) return <IoTrendingDown className="text-red-500" size={14} />;
  return null;
};

const getTrendColor = (value) => {
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "text-slate-500";
};

// ============================================
// KOMPONENTE - Period Selector
// ============================================
const PeriodSelector = ({ value, onChange }) => {
  const periods = [
    { value: 1, label: "Danas" },
    { value: 7, label: "7 dana" },
    { value: 30, label: "30 dana" },
    { value: 90, label: "90 dana" },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
            value === period.value
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

// ============================================
// KOMPONENTE - Lock Overlay
// ============================================
const LockOverlay = ({ tier, currentTier }) => {
  const tierLabels = {
    [MEMBERSHIP_TIERS.PRO]: "Pro",
    [MEMBERSHIP_TIERS.SHOP]: "Shop",
  };

  const tierIcons = {
    [MEMBERSHIP_TIERS.PRO]: <FaCrown className="text-amber-500" size={20} />,
    [MEMBERSHIP_TIERS.SHOP]: <FaStore className="text-purple-500" size={20} />,
  };

  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
      <div className="flex items-center gap-2 mb-2">
        {tierIcons[tier]}
        <span className="text-sm font-semibold text-slate-700">
          {tierLabels[tier]} funkcija
        </span>
      </div>
      <p className="text-xs text-slate-500 text-center px-4">
        Nadogradite na {tierLabels[tier]} za pristup ovoj statistici
      </p>
      <a
        href="/user-subscription"
        className="mt-3 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full hover:shadow-lg transition-all"
      >
        Nadogradi sada
      </a>
    </div>
  );
};

// ============================================
// KOMPONENTE - Section Header
// ============================================
const SectionHeader = ({
  title,
  icon: Icon,
  iconColor,
  isExpanded,
  onToggle,
  badge,
  locked,
  lockTier,
}) => (
  <button
    onClick={onToggle}
    disabled={locked}
    className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl ${
      locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
    }`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}
      >
        <Icon size={18} className="text-white" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {badge && (
        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
          {badge}
        </span>
      )}
      {locked && (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
          <IoLockClosedOutline size={12} />
          {lockTier === MEMBERSHIP_TIERS.PRO ? "Pro" : "Shop"}
        </span>
      )}
    </div>
    {!locked && (
      <div className="text-slate-400">
        {isExpanded ? <IoChevronUp size={20} /> : <IoChevronDown size={20} />}
      </div>
    )}
  </button>
);

// ============================================
// KOMPONENTE - Stat Card
// ============================================
const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  trendLabel,
  color = "blue",
  tooltip,
  small = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    cyan: "bg-cyan-50 text-cyan-600",
    amber: "bg-amber-50 text-amber-600",
  };

  if (small) {
    return (
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
        <Icon className={colorClasses[color].split(" ")[1]} size={18} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 truncate">{label}</p>
          <p className="text-sm font-semibold text-slate-700">
            {formatNumber(value)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-2">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}
        >
          <Icon size={20} />
        </div>
        {tooltip && (
          <button
            className="text-slate-300 hover:text-slate-500 transition-colors"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <IoInformationCircleOutline size={16} />
          </button>
        )}
        {showTooltip && tooltip && (
          <div className="absolute top-12 right-2 z-20 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[180px]">
            {tooltip}
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-800">
            {formatNumber(value)}
          </span>
          {subValue && (
            <span className="text-xs text-slate-400">{subValue}</span>
          )}
        </div>

        {trend !== undefined && trend !== null && (
          <div className="flex items-center gap-1 pt-0.5">
            {getTrendIcon(trend)}
            <span className={`text-xs font-medium ${getTrendColor(trend)}`}>
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
            {trendLabel && (
              <span className="text-xs text-slate-400">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// KOMPONENTE - Views Chart
// ============================================
const ViewsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
        Nema podataka za prikaz
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-100">
        <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-500">{entry.name}:</span>
            <span className="text-xs font-semibold text-slate-800">
              {formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15} />
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          vertical={false}
        />
        <XAxis
          dataKey="formatted_date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          dx={-5}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="views"
          name="Pregledi"
          stroke={COLORS.primary}
          strokeWidth={2}
          fill="url(#viewsGrad)"
          dot={false}
          activeDot={{ r: 4, fill: COLORS.primary, strokeWidth: 2, stroke: "#fff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ============================================
// KOMPONENTE - Sources Chart
// ============================================
const SourcesChart = ({ data }) => {
  if (!data) return null;

  const chartData = [
    ...(data.internal || []).filter((s) => s.value > 0),
    ...(data.external || []).filter((s) => s.value > 0),
  ].slice(0, 6);

  if (chartData.length === 0) {
    return (
      <div className="h-[150px] flex items-center justify-center text-slate-400 text-sm">
        Nema podataka o izvorima
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="w-[140px] h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatNumber(value)}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {chartData.map((source, index) => (
          <div key={source.name} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
            />
            <span className="text-xs text-slate-600 flex-1 truncate">
              {source.name}
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {source.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// KOMPONENTE - Devices Chart
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
      <div className="h-[100px] flex items-center justify-center text-slate-400 text-sm">
        Nema podataka o uređajima
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => {
        const Icon = device.icon;
        return (
          <div key={device.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-600">
                  {device.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-800">
                  {formatNumber(device.value)}
                </span>
                <span className="text-xs text-slate-400">
                  ({device.percent}%)
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${device.percent}%`,
                  backgroundColor: device.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// KOMPONENTE - Contact Stats
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
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {contacts.map((contact) => (
        <StatCard
          key={contact.label}
          icon={contact.icon}
          label={contact.label}
          value={contact.value}
          color={contact.color}
          small
        />
      ))}
    </div>
  );
};

// ============================================
// KOMPONENTE - Search Terms List (PRO)
// ============================================
const SearchTermsList = ({ terms }) => {
  if (!terms || terms.length === 0) {
    return (
      <div className="text-center text-slate-400 text-sm py-4">
        Nema podataka o pojmovima pretrage
      </div>
    );
  }

  const maxCount = Math.max(...terms.map((t) => t.count || 0));

  return (
    <div className="space-y-2">
      {terms.slice(0, 10).map((term, index) => (
        <div key={term.query || index} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-5">{index + 1}.</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-700 font-medium truncate max-w-[200px]">
                {term.query || "Nepoznato"}
              </span>
              <span className="text-xs text-slate-500">{term.count} pretraga</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{
                  width: `${maxCount ? (term.count / maxCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// KOMPONENTE - Search Positions (PRO)
// ============================================
const SearchPositions = ({ positions }) => {
  if (!positions || positions.length === 0) {
    return (
      <div className="text-center text-slate-400 text-sm py-4">
        Nema podataka o pozicijama
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {positions.slice(0, 6).map((pos, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
        >
          <span className="text-xs text-slate-500">{pos.page}. stranica</span>
          <span className="text-sm font-semibold text-slate-800">
            {pos.count}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// KOMPONENTE - Featured Comparison (PRO)
// ============================================
const FeaturedComparison = ({ featured, nonFeatured, improvement }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineSparkles className="text-amber-500" size={16} />
            <span className="text-xs font-medium text-amber-800">Istaknuto</span>
          </div>
          <p className="text-xl font-bold text-amber-900">
            {formatNumber(featured?.avg_views_per_day || 0)}
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            pregleda/dan ({featured?.days || 0} dana)
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <IoCalendarOutline className="text-slate-400" size={16} />
            <span className="text-xs font-medium text-slate-600">Normalno</span>
          </div>
          <p className="text-xl font-bold text-slate-800">
            {formatNumber(nonFeatured?.avg_views_per_day || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            pregleda/dan ({nonFeatured?.days || 0} dana)
          </p>
        </div>
      </div>

      {improvement > 0 && (
        <div className="bg-green-50 rounded-xl p-3 border border-green-100 text-center">
          <p className="text-sm text-green-700">
            Isticanje povećava preglede za{" "}
            <span className="font-bold text-green-800">+{improvement}%</span>
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// KOMPONENTE - Engagement Funnel (PRO)
// ============================================
const EngagementFunnel = ({ data }) => {
  const funnelArr = Array.isArray(data) ? data : data?.funnel;
  if (!funnelArr?.length) return null;

  return (
    <div className="space-y-2">
      {funnelArr.map((stage, index) => {
        const width = Math.max(stage.percent, 25);
        const isFirst = index === 0;
        const isLast = index === funnelArr.length - 1;

        return (
          <div key={stage.stage} className="relative">
            <div
              className={`relative h-12 rounded-lg flex items-center justify-between px-3 transition-all duration-500 ${
                isFirst
                  ? "bg-blue-500"
                  : isLast
                  ? "bg-green-500"
                  : "bg-slate-200"
              }`}
              style={{ width: `${width}%` }}
            >
              <span
                className={`text-xs font-medium ${
                  isFirst || isLast ? "text-white" : "text-slate-700"
                }`}
              >
                {stage.stage}
              </span>
              <div
                className={`flex items-center gap-1.5 ${
                  isFirst || isLast ? "text-white" : "text-slate-700"
                }`}
              >
                <span className="text-sm font-bold">
                  {formatNumber(stage.value)}
                </span>
                <span className="text-xs opacity-75">({stage.percent}%)</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// KOMPONENTE - Today/Yesterday Quick Stats
// ============================================
const QuickStats = ({ today, yesterday }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <h4 className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1.5">
          <IoCalendarOutline size={14} />
          Danas
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-lg font-bold text-blue-900">{today?.views || 0}</p>
            <p className="text-[10px] text-blue-600">Pregleda</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-900">{today?.messages || 0}</p>
            <p className="text-[10px] text-blue-600">Poruka</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-900">{today?.favorites || 0}</p>
            <p className="text-[10px] text-blue-600">Favorita</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <h4 className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5">
          <IoCalendarOutline size={14} />
          Jučer
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-lg font-bold text-slate-800">{yesterday?.views || 0}</p>
            <p className="text-[10px] text-slate-500">Pregleda</p>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{yesterday?.messages || 0}</p>
            <p className="text-[10px] text-slate-500">Poruka</p>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{yesterday?.favorites || 0}</p>
            <p className="text-[10px] text-slate-500">Favorita</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const AdStatisticsSection = ({ itemId, itemName, className = "" }) => {
  const userData = useSelector(userSignUpData);

  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);
  const [membershipTier, setMembershipTier] = useState(MEMBERSHIP_TIERS.FREE);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    views: true,
    contacts: false,
    sources: false,
    devices: false,
    search: false,
    featured: false,
    funnel: false,
  });

  // Fetch membership tier
  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const response = await membershipApi.getUserMembership({});
        const membershipData = response?.data?.data;
        if (membershipData) {
          const tier = membershipData.tier?.toLowerCase() || MEMBERSHIP_TIERS.FREE;
          if (tier === "shop" || membershipData.is_shop) {
            setMembershipTier(MEMBERSHIP_TIERS.SHOP);
          } else if (tier === "pro" || membershipData.is_pro) {
            setMembershipTier(MEMBERSHIP_TIERS.PRO);
          } else {
            setMembershipTier(MEMBERSHIP_TIERS.FREE);
          }
        }
      } catch (err) {
        console.error("Error fetching membership:", err);
        setMembershipTier(MEMBERSHIP_TIERS.FREE);
      }
    };

    if (userData?.id) {
      fetchMembership();
    }
  }, [userData?.id]);

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!itemId || !isExpanded) return;

      setLoading(true);
      setError(null);

      try {
        const response = await itemStatisticsApi.getStatistics({
          itemId,
          period,
        });

        const payload = response?.data;
        const ok =
          payload?.error === false ||
          payload?.error === 0 ||
          payload?.success === true ||
          payload?.status === true;

        if (ok && payload?.data) {
          setStats(payload.data);
        } else {
          setError("Nije moguće učitati statistiku");
        }
      } catch (err) {
        console.error("Stats error:", err);
        setError("Greška pri učitavanju statistike");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [itemId, period, isExpanded]);

  // Toggle section
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Check access
  const hasProAccess =
    membershipTier === MEMBERSHIP_TIERS.PRO ||
    membershipTier === MEMBERSHIP_TIERS.SHOP;
  const hasShopAccess = membershipTier === MEMBERSHIP_TIERS.SHOP;

  // Destructure stats
  const { summary, daily, sources, devices, funnel, search_terms, search_positions } =
    stats || {};

  // Collapsed view - Quick Stats
  if (!isExpanded) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <IoStatsChartOutline className="text-white" size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-base font-semibold text-slate-800">
                Statistika oglasa
              </h3>
              <p className="text-xs text-slate-500">
                Klikni za detaljnu analizu
              </p>
            </div>
          </div>
          <IoChevronDown className="text-slate-400" size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <button
          onClick={() => setIsExpanded(false)}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <IoStatsChartOutline className="text-white" size={20} />
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-slate-800">
              Statistika oglasa
            </h3>
            {itemName && (
              <p className="text-xs text-slate-500 truncate max-w-[200px]">
                {itemName}
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <IoChevronUp className="text-slate-400" size={20} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-500">Učitavanje statistike...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-8 flex flex-col items-center justify-center">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button
            onClick={() => setPeriod((p) => p)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
          >
            <IoRefreshOutline size={16} />
            Pokušaj ponovo
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && stats && (
        <div className="p-4 space-y-4">
          {/* ============================================ */}
          {/* BASIC STATS - Available to ALL users */}
          {/* ============================================ */}

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={IoEyeOutline}
              label="Ukupno pregleda"
              value={summary?.period?.views || 0}
              subValue={`(${summary?.period?.unique_views || 0} jedinstvenih)`}
              trend={summary?.trends?.views_vs_yesterday}
              trendLabel="vs jučer"
              color="blue"
              tooltip="Ukupan broj pregleda vašeg oglasa u odabranom periodu"
            />
            <StatCard
              icon={MdTouchApp}
              label="Kontakti"
              value={
                (summary?.period?.phone_clicks || 0) +
                (summary?.period?.messages || 0) +
                (summary?.period?.whatsapp_clicks || 0) +
                (summary?.period?.viber_clicks || 0)
              }
              color="green"
              tooltip="Ukupan broj kontakata (pozivi, poruke, WhatsApp, Viber)"
            />
            <StatCard
              icon={IoHeartOutline}
              label="Favoriti"
              value={summary?.period?.favorites || 0}
              color="red"
              tooltip="Koliko puta je oglas dodan u favorite"
            />
            <StatCard
              icon={IoShareSocialOutline}
              label="Dijeljenja"
              value={summary?.period?.shares || 0}
              color="purple"
              tooltip="Koliko puta je oglas podijeljen"
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <IoTimeOutline size={14} />
                <span className="text-xs font-medium">Prosj. vrijeme</span>
              </div>
              <p className="text-base font-bold text-slate-800">
                {formatDuration(summary?.period?.avg_time_on_page || 0)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <IoEyeOutline size={14} />
                <span className="text-xs font-medium">Pregleda/dan</span>
              </div>
              <p className="text-base font-bold text-slate-800">
                {summary?.period?.avg_views_per_day || 0}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <HiOutlineExternalLink size={14} />
                <span className="text-xs font-medium">Search CTR</span>
              </div>
              <p className="text-base font-bold text-slate-800">
                {formatPercent(summary?.period?.search_ctr)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <IoStatsChartOutline size={14} />
                <span className="text-xs font-medium">Konverzija</span>
              </div>
              <p className="text-base font-bold text-slate-800">
                {formatPercent(funnel?.conversion_rate)}
              </p>
            </div>
          </div>

          {/* Today vs Yesterday */}
          <QuickStats today={summary?.today} yesterday={summary?.yesterday} />

          {/* Views Chart Section */}
          <div className="bg-slate-50 rounded-xl overflow-hidden">
            <SectionHeader
              title="Pregledi po danima"
              icon={IoEyeOutline}
              iconColor="bg-blue-500"
              isExpanded={expandedSections.views}
              onToggle={() => toggleSection("views")}
            />
            {expandedSections.views && (
              <div className="px-4 pb-4">
                <ViewsChart data={daily} />
              </div>
            )}
          </div>

          {/* Contacts Section */}
          <div className="bg-slate-50 rounded-xl overflow-hidden">
            <SectionHeader
              title="Kontakti po tipu"
              icon={IoCallOutline}
              iconColor="bg-green-500"
              isExpanded={expandedSections.contacts}
              onToggle={() => toggleSection("contacts")}
            />
            {expandedSections.contacts && (
              <div className="px-4 pb-4">
                <ContactStats data={summary?.period} />
              </div>
            )}
          </div>

          {/* Sources & Devices */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl overflow-hidden">
              <SectionHeader
                title="Izvori prometa"
                icon={IoGlobeOutline}
                iconColor="bg-purple-500"
                isExpanded={expandedSections.sources}
                onToggle={() => toggleSection("sources")}
              />
              {expandedSections.sources && (
                <div className="px-4 pb-4">
                  <SourcesChart data={sources} />
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl overflow-hidden">
              <SectionHeader
                title="Uređaji"
                icon={IoPhonePortraitOutline}
                iconColor="bg-cyan-500"
                isExpanded={expandedSections.devices}
                onToggle={() => toggleSection("devices")}
              />
              {expandedSections.devices && (
                <div className="px-4 pb-4">
                  <DevicesChart data={devices} />
                </div>
              )}
            </div>
          </div>

          {/* ============================================ */}
          {/* PRO STATS - Available to PRO and SHOP users */}
          {/* ============================================ */}

          {/* Search Terms (PRO) */}
          <div className="relative bg-slate-50 rounded-xl overflow-hidden">
            <SectionHeader
              title="Pojmovi u pretrazi"
              icon={IoSearchOutline}
              iconColor="bg-amber-500"
              isExpanded={expandedSections.search}
              onToggle={() => toggleSection("search")}
              badge="Pro"
              locked={!hasProAccess}
              lockTier={MEMBERSHIP_TIERS.PRO}
            />
            {expandedSections.search && hasProAccess && (
              <div className="px-4 pb-4 space-y-4">
                <SearchTermsList terms={search_terms} />
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-medium text-slate-600 mb-3">
                    Pozicija u pretrazi
                  </h4>
                  <SearchPositions positions={search_positions} />
                </div>
              </div>
            )}
            {!hasProAccess && (
              <LockOverlay tier={MEMBERSHIP_TIERS.PRO} currentTier={membershipTier} />
            )}
          </div>

          {/* Featured Comparison (PRO) */}
          {(summary?.featured?.days > 0 || summary?.non_featured?.days > 0) && (
            <div className="relative bg-slate-50 rounded-xl overflow-hidden">
              <SectionHeader
                title="Efekt isticanja"
                icon={HiOutlineSparkles}
                iconColor="bg-amber-500"
                isExpanded={expandedSections.featured}
                onToggle={() => toggleSection("featured")}
                badge="Pro"
                locked={!hasProAccess}
                lockTier={MEMBERSHIP_TIERS.PRO}
              />
              {expandedSections.featured && hasProAccess && (
                <div className="px-4 pb-4">
                  <FeaturedComparison
                    featured={summary?.featured}
                    nonFeatured={summary?.non_featured}
                    improvement={summary?.featured_improvement_percent}
                  />
                </div>
              )}
              {!hasProAccess && (
                <LockOverlay tier={MEMBERSHIP_TIERS.PRO} currentTier={membershipTier} />
              )}
            </div>
          )}

          {/* Engagement Funnel (PRO) */}
          <div className="relative bg-slate-50 rounded-xl overflow-hidden">
            <SectionHeader
              title="Funnel konverzije"
              icon={IoTrendingUp}
              iconColor="bg-green-500"
              isExpanded={expandedSections.funnel}
              onToggle={() => toggleSection("funnel")}
              badge="Pro"
              locked={!hasProAccess}
              lockTier={MEMBERSHIP_TIERS.PRO}
            />
            {expandedSections.funnel && hasProAccess && (
              <div className="px-4 pb-4">
                <EngagementFunnel data={funnel} />
              </div>
            )}
            {!hasProAccess && (
              <LockOverlay tier={MEMBERSHIP_TIERS.PRO} currentTier={membershipTier} />
            )}
          </div>

          {/* ============================================ */}
          {/* SHOP STATS - Available only to SHOP users */}
          {/* ============================================ */}

          {/* Competitive Analysis Placeholder (SHOP) */}
          <div className="relative bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500 flex items-center justify-center">
                <FaStore className="text-white" size={16} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-purple-800">
                  Shop analitika
                </h3>
                <p className="text-xs text-purple-600">
                  Napredna analitika za Shop članove
                </p>
              </div>
              {!hasShopAccess && (
                <span className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
                  <IoLockClosedOutline size={12} />
                  Shop
                </span>
              )}
            </div>

            {hasShopAccess ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xs text-purple-600 mb-1">Rang u kategoriji</p>
                  <p className="text-lg font-bold text-purple-800">
                    #{summary?.category_rank || "N/A"}
                  </p>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xs text-purple-600 mb-1">Prosjek kategorije</p>
                  <p className="text-lg font-bold text-purple-800">
                    {formatNumber(summary?.category_avg_views || 0)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-purple-700 mb-3">
                  Nadogradite na Shop za pristup naprednoj analitici, uključujući
                  rang u kategoriji i komparativnu analizu.
                </p>
                <a
                  href="/user-subscription"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-full hover:bg-purple-700 transition-colors"
                >
                  <FaStore size={14} />
                  Nadogradi na Shop
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdStatisticsSection;
