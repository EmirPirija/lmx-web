"use client";

import { itemStatisticsApi } from "@/utils/api";
import { useState, useEffect, useMemo } from "react";
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
  IoChevronUp,
  IoInformationCircleOutline,
  IoCloseOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import { 
  FaWhatsapp, 
  FaViber, 
  FaFacebookF, 
  FaGoogle,
  FaInstagram,
} from "react-icons/fa";
import { MdOutlineEmail, MdTouchApp } from "react-icons/md";
import { HiOutlineExternalLink } from "react-icons/hi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

// ============================================
// API FUNKCIJE
// ============================================
const fetchItemStatistics = async (itemId, period = 30) => {
    try {
      const response = await itemStatisticsApi.getStatistics({ itemId, period });
      const payload = response?.data;
  
      // Debug jednom da vidiš šta stiže
      console.log("STAT payload:", payload);
  
      // podrži više formata:
      const ok =
        payload?.error === false ||
        payload?.error === 0 ||
        payload?.success === true ||
        payload?.status === true ||
        payload?.ok === true;
  
      if (ok) return payload?.data ?? null;
  
      // fallback: ako backend ne šalje flags
      return payload?.data ?? null;
    } catch (error) {
      console.error("Stats error:", error?.response?.status, error?.response?.data);
      return null;
    }
  };
  

// ============================================
// HELPER FUNKCIJE
// ============================================
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
};

const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const getTrendIcon = (value) => {
  if (value > 0) return <IoTrendingUp className="text-green-500" />;
  if (value < 0) return <IoTrendingDown className="text-red-500" />;
  return null;
};

const getTrendColor = (value) => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-slate-500';
};

// ============================================
// CHART BOJE
// ============================================
const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  slate: '#64748b',
};

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

// ============================================
// KOMPONENTE
// ============================================

// Stat Card komponenta
const StatCard = ({ icon: Icon, label, value, subValue, trend, trendLabel, color = "blue", tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  };

  return (
    <div className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClasses[color]} border transition-transform group-hover:scale-105`}>
          <Icon size={22} />
        </div>
        {tooltip && (
          <button 
            className="text-slate-300 hover:text-slate-500 transition-colors"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <IoInformationCircleOutline size={18} />
          </button>
        )}
        {showTooltip && tooltip && (
          <div className="absolute top-12 right-4 z-10 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[200px]">
            {tooltip}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-800">{formatNumber(value)}</span>
          {subValue && <span className="text-sm text-slate-400">{subValue}</span>}
        </div>
        
        {(trend !== undefined && trend !== null) && (
          <div className="flex items-center gap-1.5 pt-1">
            {getTrendIcon(trend)}
            <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// Mini Stat komponenta
const MiniStat = ({ icon: Icon, label, value, color = "slate" }) => {
  const iconColors = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    slate: 'text-slate-400',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <Icon className={iconColors[color]} size={18} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 truncate">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{formatNumber(value)}</p>
      </div>
    </div>
  );
};

// Period Selector komponenta
const PeriodSelector = ({ value, onChange }) => {
  const periods = [
    { value: 7, label: '7 dana' },
    { value: 14, label: '14 dana' },
    { value: 30, label: '30 dana' },
    { value: 90, label: '90 dana' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            value === period.value
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

// Custom Tooltip za grafove
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
      <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-slate-500">{entry.name}:</span>
          <span className="text-sm font-semibold text-slate-800">{formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

// Views Chart komponenta
const ViewsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-slate-400">
        Nema podataka za prikaz
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15} />
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="uniqueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.15} />
            <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis 
          dataKey="formatted_date" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          dy={10}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="views"
          name="Pregledi"
          stroke={COLORS.primary}
          strokeWidth={2.5}
          fill="url(#viewsGradient)"
          dot={false}
          activeDot={{ r: 6, fill: COLORS.primary, strokeWidth: 2, stroke: '#fff' }}
        />
        <Area
          type="monotone"
          dataKey="unique_views"
          name="Jedinstveni"
          stroke={COLORS.secondary}
          strokeWidth={2}
          fill="url(#uniqueGradient)"
          dot={false}
          activeDot={{ r: 5, fill: COLORS.secondary, strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Sources Chart komponenta
const SourcesChart = ({ data }) => {
  if (!data) return null;

  const chartData = [
    ...(data.internal || []).filter(s => s.value > 0),
    ...(data.external || []).filter(s => s.value > 0),
  ].slice(0, 8);

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-400">
        Nema podataka o izvorima
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-[180px] h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => formatNumber(value)}
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {chartData.map((source, index) => (
          <div key={source.name} className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
            />
            <span className="text-sm text-slate-600 flex-1 truncate">{source.name}</span>
            <span className="text-sm font-semibold text-slate-800">{source.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Devices Chart komponenta
const DevicesChart = ({ data }) => {
  if (!data) return null;

  const devices = [
    { name: 'Mobitel', value: data.mobile?.value || 0, percent: data.mobile?.percent || 0, icon: IoPhonePortraitOutline, color: COLORS.primary },
    { name: 'Desktop', value: data.desktop?.value || 0, percent: data.desktop?.percent || 0, icon: IoDesktopOutline, color: COLORS.secondary },
    { name: 'Tablet', value: data.tablet?.value || 0, percent: data.tablet?.percent || 0, icon: IoTabletPortraitOutline, color: COLORS.success },
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
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${device.percent}%`, 
                  backgroundColor: device.color 
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Contact Stats komponenta
const ContactStats = ({ data }) => {
  if (!data) return null;

  const contacts = [
    { icon: IoCallOutline, label: 'Pozivi', value: data.phone_clicks || 0, color: 'blue' },
    { icon: FaWhatsapp, label: 'WhatsApp', value: data.whatsapp_clicks || 0, color: 'green' },
    { icon: FaViber, label: 'Viber', value: data.viber_clicks || 0, color: 'purple' },
    { icon: IoChatbubbleOutline, label: 'Poruke', value: data.messages || 0, color: 'blue' },
    { icon: MdOutlineEmail, label: 'Email', value: data.email_clicks || 0, color: 'orange' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

const EngagementFunnel = ({ data }) => {
    const funnelArr = Array.isArray(data) ? data : data?.funnel;
    if (!funnelArr?.length) return null;
  
    return (
      <div className="space-y-3">
        {funnelArr.map((stage, index) => {
          const width = Math.max(stage.percent, 20);
          const isFirst = index === 0;
          const isLast = index === funnelArr.length - 1;
  
          return (
            <div key={stage.stage} className="relative">
              <div
                className={`relative h-14 rounded-xl flex items-center justify-between px-4 transition-all duration-500 ${
                  isFirst ? "bg-blue-500" : isLast ? "bg-green-500" : "bg-slate-200"
                }`}
                style={{ width: `${width}%` }}
              >
                <span className={`text-sm font-medium ${isFirst || isLast ? "text-white" : "text-slate-700"}`}>
                  {stage.stage}
                </span>
                <div className={`flex items-center gap-2 ${isFirst || isLast ? "text-white" : "text-slate-700"}`}>
                  <span className="text-sm font-bold">{formatNumber(stage.value)}</span>
                  <span className="text-xs opacity-75">({stage.percent}%)</span>
                </div>
              </div>
              {index < funnelArr.length - 1 && (
                <div className="absolute -bottom-2 left-4 w-0.5 h-4 bg-slate-300" />
              )}
            </div>
          );
        })}
      </div>
    );
  };
  

// Featured Comparison komponenta
const FeaturedComparison = ({ featured, nonFeatured, improvement }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600 text-lg">⭐</span>
            <span className="text-sm font-medium text-amber-800">Istaknuto</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{formatNumber(featured?.avg_views_per_day || 0)}</p>
          <p className="text-xs text-amber-600 mt-1">pregleda/dan ({featured?.days || 0} dana)</p>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-slate-500 text-lg">📋</span>
            <span className="text-sm font-medium text-slate-600">Normalno</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatNumber(nonFeatured?.avg_views_per_day || 0)}</p>
          <p className="text-xs text-slate-500 mt-1">pregleda/dan ({nonFeatured?.days || 0} dana)</p>
        </div>
      </div>
      
      {improvement > 0 && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
          <p className="text-sm text-green-700">
            Isticanje povećava preglede za{' '}
            <span className="font-bold text-green-800">+{improvement}%</span>
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ItemStatisticsDashboard = ({ itemId, itemName }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);
  const [expandedSections, setExpandedSections] = useState({
    views: true,
    contacts: true,
    sources: true,
    engagement: false,
    featured: false,
  });

  // Fetch podataka
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      
      const data = await fetchItemStatistics(itemId, period);
      
      if (data) {
        setStats(data);
      } else {
        setError('Nije moguće učitati statistiku');
      }
      
      setLoading(false);
    };

    if (itemId) {
      loadStats();
    }
  }, [itemId, period]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Učitavanje statistike...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <IoCloseOutline size={32} className="text-red-500" />
          </div>
          <p className="text-slate-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <IoRefreshOutline size={18} />
            Pokušaj ponovo
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!stats) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <IoStatsChartOutline size={32} className="text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">Nema dostupne statistike</p>
          <p className="text-sm text-slate-400">Statistika će biti dostupna nakon što oglas dobije preglede</p>
        </div>
      </div>
    );
  }

  const { summary, daily, sources, devices, funnel } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <IoStatsChartOutline className="text-blue-500" />
              Statistika oglasa
            </h2>
            {itemName && (
              <p className="text-sm text-slate-500 mt-1 truncate max-w-md">{itemName}</p>
            )}
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          value={(summary?.period?.phone_clicks || 0) + (summary?.period?.messages || 0)}
          trend={null}
          color="green"
          tooltip="Ukupan broj kontakata (pozivi, poruke, WhatsApp, Viber)"
        />
        <StatCard
          icon={IoHeartOutline}
          label="Favoriti"
          value={summary?.period?.favorites || 0}
          subValue={summary?.period?.favorites_removed ? `(-${summary.period.favorites_removed})` : null}
          color="red"
          tooltip="Koliko puta je oglas dodan u favorite"
        />
        <StatCard
          icon={IoShareSocialOutline}
          label="Dijeljenja"
          value={summary?.period?.shares || 0}
          color="purple"
          tooltip="Koliko puta je oglas podijeljen na društvenim mrežama"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <IoTimeOutline size={16} />
            <span className="text-xs font-medium">Prosj. vrijeme</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {formatDuration(summary?.period?.avg_time_on_page || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <IoEyeOutline size={16} />
            <span className="text-xs font-medium">Pregleda/dan</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {summary?.period?.avg_views_per_day || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <HiOutlineExternalLink size={16} />
            <span className="text-xs font-medium">Search CTR</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {summary?.period?.search_ctr || 0}%
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <IoStatsChartOutline size={16} />
            <span className="text-xs font-medium">Konverzija</span>
          </div>
          <p className="text-lg font-bold text-slate-800">
            {funnel?.conversion_rate || 0}%
          </p>
        </div>
      </div>

      {/* Views Chart Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button 
          onClick={() => toggleSection('views')}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <IoEyeOutline className="text-blue-500" />
            Pregledi po danima
          </h3>
          {expandedSections.views ? <IoChevronUp className="text-slate-400" /> : <IoChevronDown className="text-slate-400" />}
        </button>
        {expandedSections.views && (
          <div className="px-5 pb-5">
            <ViewsChart data={daily} />
          </div>
        )}
      </div>

      {/* Contacts Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button 
          onClick={() => toggleSection('contacts')}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <IoCallOutline className="text-green-500" />
            Kontakti po tipu
          </h3>
          {expandedSections.contacts ? <IoChevronUp className="text-slate-400" /> : <IoChevronDown className="text-slate-400" />}
        </button>
        {expandedSections.contacts && (
          <div className="px-5 pb-5">
            <ContactStats data={summary?.period} />
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sources Section */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button 
            onClick={() => toggleSection('sources')}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <IoLocationOutline className="text-purple-500" />
              Izvori prometa
            </h3>
            {expandedSections.sources ? <IoChevronUp className="text-slate-400" /> : <IoChevronDown className="text-slate-400" />}
          </button>
          {expandedSections.sources && (
            <div className="px-5 pb-5">
              <SourcesChart data={sources} />
            </div>
          )}
        </div>

        {/* Devices Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-5">
            <IoPhonePortraitOutline className="text-cyan-500" />
            Uređaji
          </h3>
          <DevicesChart data={devices} />
        </div>
      </div>

      {/* Engagement Funnel Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button 
          onClick={() => toggleSection('engagement')}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <IoTrendingUp className="text-green-500" />
            Funnel konverzije
          </h3>
          {expandedSections.engagement ? <IoChevronUp className="text-slate-400" /> : <IoChevronDown className="text-slate-400" />}
        </button>
        {expandedSections.engagement && (
          <div className="px-5 pb-5">
            <EngagementFunnel data={funnel} />
          </div>
        )}
      </div>

      {/* Featured Comparison Section */}
      {(summary?.featured?.days > 0 || summary?.non_featured?.days > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button 
            onClick={() => toggleSection('featured')}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              ⭐ Efekt isticanja
            </h3>
            {expandedSections.featured ? <IoChevronUp className="text-slate-400" /> : <IoChevronDown className="text-slate-400" />}
          </button>
          {expandedSections.featured && (
            <div className="px-5 pb-5">
              <FeaturedComparison 
                featured={summary?.featured}
                nonFeatured={summary?.non_featured}
                improvement={summary?.featured_improvement_percent}
              />
            </div>
          )}
        </div>
      )}

      {/* Today vs Yesterday Quick Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800 mb-3">📅 Danas</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-900">{summary?.today?.views || 0}</p>
              <p className="text-xs text-blue-600">Pregleda</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{summary?.today?.messages || 0}</p>
              <p className="text-xs text-blue-600">Poruka</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{summary?.today?.favorites || 0}</p>
              <p className="text-xs text-blue-600">Favorita</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <h4 className="text-sm font-medium text-slate-600 mb-3">📆 Jučer</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-800">{summary?.yesterday?.views || 0}</p>
              <p className="text-xs text-slate-500">Pregleda</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{summary?.yesterday?.messages || 0}</p>
              <p className="text-xs text-slate-500">Poruka</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{summary?.yesterday?.favorites || 0}</p>
              <p className="text-xs text-slate-500">Favorita</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemStatisticsDashboard;