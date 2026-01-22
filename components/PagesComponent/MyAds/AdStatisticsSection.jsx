"use client";
 
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { itemStatisticsApi, membershipApi } from "@/utils/api";
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
} from "react-icons/io5";
import { FaGoogle, FaFacebookF, FaViber, FaWhatsapp } from "react-icons/fa";
import { HiOutlineExternalLink } from "react-icons/hi";
import { MdOutlineEmail, MdTouchApp } from "react-icons/md";
import { Crown, Store, Lock, Sparkles } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import Link from "next/link";
 
// ============================================
// HELPER FUNKCIJE
// ============================================
const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};
 
const formatDuration = (seconds) => {
  if (!seconds) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};
 
// ============================================
// BOJE
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
// CUSTOM TOOLTIP ZA GRAFOVE
// ============================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-100 text-sm">
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-800">{formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};
 
// ============================================
// LOCK OVERLAY - Za zaključane feature
// ============================================
const LockOverlay = ({ tier = "pro", feature = "" }) => {
  const tierConfig = {
    pro: {
      icon: Crown,
      gradient: "from-amber-400 to-yellow-600",
      name: "LMX Pro",
    },
    shop: {
      icon: Store,
      gradient: "from-blue-500 to-indigo-600",
      name: "LMX Shop",
    },
  };
 
  const config = tierConfig[tier];
  const Icon = config.icon;
 
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white/95 via-white/80 to-white/60 rounded-xl z-10">
      <div className="text-center p-6">
        <div className={`w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="text-white" size={24} />
        </div>
        <h4 className="font-bold text-slate-800 mb-1">{feature || "Napredna statistika"}</h4>
        <p className="text-sm text-slate-500 mb-4 max-w-[200px]">
          Ova funkcija je dostupna samo za {config.name} korisnike
        </p>
        <Link href="/membership/upgrade">
          <Button size="sm" className={`bg-gradient-to-r ${config.gradient} text-white border-0 shadow-md hover:shadow-lg transition-shadow`}>
            <Sparkles size={14} className="mr-1" />
            Nadogradi na {config.name}
          </Button>
        </Link>
      </div>
    </div>
  );
};
 
// ============================================
// LOADING SKELETON
// ============================================
const StatisticsSkeleton = () => (
  <div className="p-4 space-y-4 animate-pulse">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-100 rounded-xl" />
      ))}
    </div>
    <div className="h-48 bg-slate-100 rounded-xl" />
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-100 rounded-xl" />
      ))}
    </div>
  </div>
);
 
// ============================================
// ERROR STATE
// ============================================
const StatisticsError = ({ onRetry }) => (
  <div className="p-8 text-center">
    <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
      <IoAlertCircleOutline className="text-red-500" size={32} />
    </div>
    <h4 className="font-semibold text-slate-800 mb-2">Greška pri učitavanju statistike</h4>
    <p className="text-sm text-slate-500 mb-4">Nije moguće dohvatiti podatke. Pokušajte ponovo.</p>
    <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
      <IoRefreshOutline size={16} />
      Pokušaj ponovo
    </Button>
  </div>
);
 
// ============================================
// EMPTY STATE
// ============================================
const StatisticsEmpty = () => (
  <div className="p-8 text-center">
    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
      <IoStatsChartOutline className="text-slate-400" size={32} />
    </div>
    <h4 className="font-semibold text-slate-800 mb-2">Nema dostupne statistike</h4>
    <p className="text-sm text-slate-500">Statistika će biti dostupna nakon što oglas dobije preglede.</p>
  </div>
);
 
// ============================================
// SEKCIJA: PREGLEDI PO VREMENSKOM PERIODU
// ============================================
const ViewsOverviewSection = ({ summary }) => {
  const today = summary?.today?.views || 0;
  const yesterday = summary?.yesterday?.views || 0;
  const last7Days = summary?.period?.views || 0;
  const avgPerDay = summary?.period?.avg_views_per_day || 0;
  const trend = summary?.trends?.views_vs_yesterday || 0;
 
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <p className="text-blue-100 text-sm font-medium">Danas</p>
        <p className="text-3xl font-bold mt-1">{today}</p>
      </div>
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <p className="text-slate-500 text-sm font-medium">Jučer</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{yesterday}</p>
      </div>
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <p className="text-slate-500 text-sm font-medium">Period</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{formatNumber(last7Days)}</p>
        {trend !== 0 && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
            {trend > 0 ? <IoTrendingUp size={12} /> : <IoTrendingDown size={12} />}
            {trend > 0 ? "+" : ""}{trend}%
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <p className="text-slate-500 text-sm font-medium">Prosječno/dan</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{avgPerDay}</p>
      </div>
    </div>
  );
};
 
// ============================================
// SEKCIJA: GRAF PREGLEDA
// ============================================
const ViewsChartSection = ({ daily }) => {
  if (!daily || daily.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <IoEyeOutline className="text-blue-500" />
          Pregledi po danima
        </h4>
        <div className="h-[200px] flex items-center justify-center text-slate-400">
          Nema podataka za prikaz grafa
        </div>
      </div>
    );
  }
 
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <IoEyeOutline className="text-blue-500" />
        Pregledi po danima
      </h4>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="formatted_date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="views"
              name="Pregledi"
              stroke={COLORS.primary}
              strokeWidth={2}
              fill="url(#viewsGrad)"
              dot={false}
              activeDot={{ r: 5, fill: COLORS.primary }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
 
// ============================================
// SEKCIJA: INTERAKCIJE (BASIC)
// ============================================
const InteractionsSection = ({ summary }) => {
  const period = summary?.period || {};
 
  const items = [
    { icon: IoChatbubbleOutline, label: "Poruke", value: period.messages || 0, color: "text-blue-500" },
    { icon: IoHelpCircleOutline, label: "Javna pitanja", value: period.public_questions || 0, color: "text-purple-500" },
    { icon: IoHeartOutline, label: "Sačuvano", value: period.favorites || 0, color: "text-red-500" },
    { icon: MdTouchApp, label: "Kontakti", value: (period.phone_clicks || 0) + (period.whatsapp_clicks || 0) + (period.viber_clicks || 0) + (period.email_clicks || 0), color: "text-green-500" },
  ];
 
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="bg-white rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Icon className={item.color} size={14} />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{formatNumber(item.value)}</p>
          </div>
        );
      })}
    </div>
  );
};
 
// ============================================
// SEKCIJA: PROMOCIJA/ISTICANJE (BASIC)
// ============================================
const PromotionSection = ({ summary }) => {
  const featured = summary?.featured;
  const nonFeatured = summary?.non_featured;
  const improvement = summary?.featured_improvement_percent || 0;
 
  if (!featured?.days && !nonFeatured?.days) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <IoRocketOutline className="text-amber-600" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800">Istaknite svoj oglas</h4>
            <p className="text-sm text-amber-600">Povećajte vidljivost i dobijte do 5x više pregleda</p>
          </div>
        </div>
      </div>
    );
  }
 
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-4">
      <h4 className="font-semibold text-amber-800 mb-4 flex items-center gap-2">
        <IoRocketOutline className="text-amber-600" />
        Statistika isticanja
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/80 rounded-lg p-3">
          <p className="text-xs text-amber-700">Pregledi (istaknuto)</p>
          <p className="text-xl font-bold text-amber-900">{featured?.total_views || 0}</p>
        </div>
        <div className="bg-white/80 rounded-lg p-3">
          <p className="text-xs text-amber-700">Prosječno/dan</p>
          <p className="text-xl font-bold text-amber-900">{featured?.avg_views_per_day || 0}</p>
        </div>
        <div className="bg-white/80 rounded-lg p-3">
          <p className="text-xs text-amber-700">Poboljšanje</p>
          <p className="text-xl font-bold text-green-600">{improvement > 0 ? `+${improvement}%` : "N/A"}</p>
        </div>
        <div className="bg-white/80 rounded-lg p-3">
          <p className="text-xs text-amber-700">Dana istaknuto</p>
          <p className="text-xl font-bold text-amber-900">{featured?.days || 0}</p>
        </div>
      </div>
    </div>
  );
};
 
// ============================================
// SEKCIJA: IZVORI PROMETA (BASIC)
// ============================================
const TrafficSourcesSection = ({ sources }) => {
  const allSources = [
    ...(sources?.internal || []),
    ...(sources?.external || []),
  ].filter((s) => s.value > 0).slice(0, 6);
 
  if (allSources.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <IoLocationOutline className="text-purple-500" />
          Posjete po izvorima
        </h4>
        <div className="h-[180px] flex items-center justify-center text-slate-400">
          Nema podataka o izvorima
        </div>
      </div>
    );
  }
 
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <IoLocationOutline className="text-purple-500" />
        Posjete po izvorima
      </h4>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[160px] h-[160px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={allSources} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                {allSources.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          {allSources.map((source, index) => (
            <div key={source.name} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
              <span className="text-sm text-slate-600 truncate flex-1">{source.name}</span>
              <span className="text-sm font-semibold text-slate-800">{source.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
 
// ============================================
// SEKCIJA: PLATFORME/UREĐAJI (BASIC)
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
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <IoPhonePortraitOutline className="text-cyan-500" />
          Posjete po platformama
        </h4>
        <div className="h-[120px] flex items-center justify-center text-slate-400">
          Nema podataka o platformama
        </div>
      </div>
    );
  }
 
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <IoPhonePortraitOutline className="text-cyan-500" />
        Posjete po platformama
      </h4>
      <div className="space-y-3">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const value = platform.data?.value || 0;
          const percent = platform.data?.percent || 0;
          return (
            <div key={platform.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">{platform.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{formatNumber(value)}</span>
                  <span className="text-xs text-slate-400">({percent}%)</span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: platform.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
 
// ============================================
// SEKCIJA: KONTAKTI PO TIPU (PRO)
// ============================================
const ContactBreakdownSection = ({ summary }) => {
  const period = summary?.period || {};
 
  const contacts = [
    { icon: IoCallOutline, label: "Pozivi", value: period.phone_clicks || 0, color: "text-blue-500" },
    { icon: FaWhatsapp, label: "WhatsApp", value: period.whatsapp_clicks || 0, color: "text-green-500" },
    { icon: FaViber, label: "Viber", value: period.viber_clicks || 0, color: "text-purple-500" },
    { icon: MdOutlineEmail, label: "Email", value: period.email_clicks || 0, color: "text-orange-500" },
  ];
 
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <MdTouchApp className="text-green-500" />
        Kontakti po tipu
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {contacts.map((contact) => {
          const Icon = contact.icon;
          return (
            <div key={contact.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Icon className={contact.color} size={18} />
              <div>
                <p className="text-xs text-slate-500">{contact.label}</p>
                <p className="text-lg font-bold text-slate-800">{contact.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
 
// ============================================
// SEKCIJA: POJMOVI PRETRAGE (PRO)
// ============================================
const SearchTermsSection = ({ searchTerms }) => {
  if (!searchTerms || searchTerms.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <IoSearchOutline className="text-indigo-500" />
          Pojmovi u pretrazi
        </h4>
        <div className="h-[200px] flex items-center justify-center text-slate-400">
          Nema podataka o pretrazi
        </div>
      </div>
    );
  }
 
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <IoSearchOutline className="text-indigo-500" />
        Pojmovi u pretrazi
      </h4>
      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
        {searchTerms.slice(0, 10).map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <span className="text-sm text-slate-700 font-medium">"{item.term}"</span>
            <span className="text-sm text-slate-500">{item.count} pretraga</span>
          </div>
        ))}
      </div>
    </div>
  );
};
 
// ============================================
// SEKCIJA: POZICIJA NA PRETRAZI (PRO)
// ============================================
const SearchPositionSection = ({ searchPositions }) => {
  if (!searchPositions || searchPositions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <IoLayersOutline className="text-orange-500" />
          Stranica na pretrazi
        </h4>
        <div className="h-[200px] flex items-center justify-center text-slate-400">
          Nema podataka o poziciji
        </div>
      </div>
    );
  }
 
  const maxViews = Math.max(...searchPositions.map((d) => d.views || d.count || 0));
 
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <IoLayersOutline className="text-orange-500" />
        Stranica na pretrazi
      </h4>
      <div className="space-y-2">
        {searchPositions.slice(0, 8).map((item, index) => {
          const views = item.views || item.count || 0;
          const widthPercent = maxViews > 0 ? (views / maxViews) * 100 : 0;
          return (
            <div key={index} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-24 flex-shrink-0">{item.page}. stranica</span>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                  style={{ width: `${Math.max(widthPercent, 15)}%` }}
                >
                  <span className="text-xs text-white font-medium">{views}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
 
// ============================================
// SEKCIJA: VRIJEME PREGLEDA (SHOP)
// ============================================
const ViewsByTimeSection = ({ hourlyData }) => {
  if (!hourlyData || hourlyData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <IoTimeOutline className="text-teal-500" />
          Pregledi po vremenu dana
        </h4>
        <div className="h-[180px] flex items-center justify-center text-slate-400">
          Nema podataka
        </div>
      </div>
    );
  }
 
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <IoTimeOutline className="text-teal-500" />
        Pregledi po vremenu dana
      </h4>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="views" name="Pregledi" fill={COLORS.cyan} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
 
// ============================================
// SEKCIJA: KONVERZIJA FUNNEL (SHOP)
// ============================================
const ConversionSection = ({ funnel }) => {
  const funnelArray = Array.isArray(funnel) ? funnel : funnel?.funnel || [];
 
  if (funnelArray.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-4">
        <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
          <IoTrendingUp className="text-green-600" />
          Konverzija
        </h4>
        <div className="h-[120px] flex items-center justify-center text-green-600/60">
          Nema podataka o konverziji
        </div>
      </div>
    );
  }
 
  const conversionRate = funnel?.conversion_rate || 0;
 
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-4">
      <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
        <IoTrendingUp className="text-green-600" />
        Konverzija
      </h4>
      <div className="space-y-2 mb-4">
        {funnelArray.map((stage, index) => {
          const widthPercent = Math.max(stage.percent || 0, 20);
          const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500"];
          return (
            <div key={stage.stage} className={`relative ${index > 0 ? "ml-" + index * 4 : ""}`}>
              <div
                className={`h-12 ${colors[index % colors.length]} rounded-lg flex items-center justify-between px-4 text-white transition-all duration-500`}
                style={{ width: `${100 - index * 15}%` }}
              >
                <span className="font-medium text-sm">{stage.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatNumber(stage.value)}</span>
                  <span className="text-xs opacity-75">({stage.percent}%)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-white/70 rounded-lg p-3 text-center">
        <p className="text-xs text-green-700">Ukupna stopa konverzije</p>
        <p className="text-2xl font-bold text-green-800">{conversionRate}%</p>
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
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            value === period.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};
 
// ============================================
// GLAVNA KOMPONENTA: AdStatisticsSection
// ============================================
const AdStatisticsSection = ({ itemId, itemName }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);
  const [membershipTier, setMembershipTier] = useState("free");
 
  const userData = useSelector(userSignUpData);
 
  // Dohvati membership tier
  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const response = await membershipApi.getUserMembership({});
        const tier = response?.data?.data?.tier?.slug || response?.data?.data?.membership_tier || "free";
        setMembershipTier(tier.toLowerCase());
      } catch (err) {
        // Ako API ne radi, provjeri userData
        const tier = userData?.membership_tier || userData?.membership?.tier?.slug || "free";
        setMembershipTier(tier.toLowerCase());
      }
    };
    fetchMembership();
  }, [userData]);
 
  // Dohvati statistiku
  const fetchStatistics = async () => {
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
 
      if (isOk && payload?.data) {
        setStats(payload.data);
      } else if (payload?.data) {
        setStats(payload.data);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("Greška pri učitavanju statistike");
    } finally {
      setLoading(false);
    }
  };
 
  // Fetch kada se expand-a ili promijeni period
  useEffect(() => {
    if (isExpanded) {
      fetchStatistics();
    }
  }, [isExpanded, period, itemId]);
 
  const isPro = membershipTier === "pro" || membershipTier === "shop";
  const isShop = membershipTier === "shop";
 
  // Brzi pregled za header (uvijek dohvati quick stats)
  const [quickStats, setQuickStats] = useState(null);
 
  useEffect(() => {
    const fetchQuickStats = async () => {
      if (!itemId) return;
      try {
        const response = await itemStatisticsApi.getQuickStats({ itemId });
        if (response?.data?.data) {
          setQuickStats(response.data.data);
        }
      } catch (err) {
        // Ignore
      }
    };
    fetchQuickStats();
  }, [itemId]);
 
  const todayViews = quickStats?.today_views ?? stats?.summary?.today?.views ?? 0;
  const totalViews = quickStats?.total_views ?? stats?.summary?.period?.views ?? 0;
 
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* HEADER - Uvijek vidljiv */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <IoStatsChartOutline className="text-white" size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800">Statistika oglasa</h3>
            <p className="text-sm text-slate-500">
              {todayViews} pregleda danas • {formatNumber(totalViews)} ukupno
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPro && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${isShop ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
              {isShop ? "Shop" : "Pro"}
            </span>
          )}
          {isExpanded ? <IoChevronUp className="text-slate-400" size={20} /> : <IoChevronDown className="text-slate-400" size={20} />}
        </div>
      </button>
 
      {/* CONTENT - Expandable */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-6">
          {/* Period Selector */}
          <div className="flex justify-end">
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
              {/* ========== BASIC TIER - Svi korisnici ========== */}
              <div className="space-y-4">
                <ViewsOverviewSection summary={stats.summary} />
                <ViewsChartSection daily={stats.daily} />
                <InteractionsSection summary={stats.summary} />
                <PromotionSection summary={stats.summary} />
                <div className="grid lg:grid-cols-2 gap-4">
                  <TrafficSourcesSection sources={stats.sources} />
                  <PlatformsSection devices={stats.devices} />
                </div>
              </div>
 
              {/* ========== PRO TIER ========== */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="text-amber-500" size={18} />
                  <h4 className="font-semibold text-slate-800">Pro statistika</h4>
                  {!isPro && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Lock size={12} /> Zaključano
                    </span>
                  )}
                </div>
 
                <div className="relative">
                  {!isPro && <LockOverlay tier="pro" feature="Pro statistika" />}
                  <div className={`space-y-4 ${!isPro ? "blur-sm pointer-events-none" : ""}`}>
                    <ContactBreakdownSection summary={stats.summary} />
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SearchTermsSection searchTerms={stats.search_terms} />
                      <SearchPositionSection searchPositions={stats.search_positions} />
                    </div>
                  </div>
                </div>
              </div>
 
              {/* ========== SHOP TIER ========== */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Store className="text-blue-500" size={18} />
                  <h4 className="font-semibold text-slate-800">Shop statistika</h4>
                  {!isShop && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Lock size={12} /> Ekskluzivno za Shop
                    </span>
                  )}
                </div>
 
                <div className="relative">
                  {!isShop && <LockOverlay tier="shop" feature="Shop statistika" />}
                  <div className={`space-y-4 ${!isShop ? "blur-sm pointer-events-none" : ""}`}>
                    <ViewsByTimeSection hourlyData={stats.hourly} />
                    <ConversionSection funnel={stats.funnel} />
                  </div>
                </div>
              </div>
 
              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-400">Zadnje ažurirano: upravo sada</span>
                {!isShop && (
                  <Link href="/membership/upgrade" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Sparkles size={14} />
                    Nadogradi za više statistika
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
 
export default AdStatisticsSection;