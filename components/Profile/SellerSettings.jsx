"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

import {
  AlertCircle, Calendar, Camera, ChevronDown, Clock, Download, Eye, Globe, Mail,
  MessageCircle, Phone, RefreshCw, Save, Shield, Sparkles, Store, Users, Zap,
  CheckCircle2, Link as LinkIcon, Video, Music, QrCode, Copy, Loader2, Plane,
  Star, LayoutGrid, Settings2, Truck, RotateCcw, BadgeCheck, ExternalLink,
  Info, Smartphone, Monitor, ChevronRight,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";
import { sellerSettingsApi, updateProfileApi } from "@/utils/api";
import { userSignUpData, userUpdateData } from "@/redux/reducer/authSlice";
import LmxAvatarGenerator from "@/components/Avatar/LmxAvatarGenerator";
import CustomImage from "@/components/Common/CustomImage";

// ============================================
// CONSTANTS
// ============================================
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABEL = { monday: "Pon", tuesday: "Uto", wednesday: "Sri", thursday: "Čet", friday: "Pet", saturday: "Sub", sunday: "Ned" };

const defaultBusinessHours = {
  monday: { open: "09:00", close: "17:00", enabled: true },
  tuesday: { open: "09:00", close: "17:00", enabled: true },
  wednesday: { open: "09:00", close: "17:00", enabled: true },
  thursday: { open: "09:00", close: "17:00", enabled: true },
  friday: { open: "09:00", close: "17:00", enabled: true },
  saturday: { open: "09:00", close: "13:00", enabled: false },
  sunday: { open: "09:00", close: "13:00", enabled: false },
};

const defaultCardPreferences = {
  show_ratings: true,
  show_badges: true,
  show_member_since: false,
  show_response_time: true,
  show_business_hours: true,
  show_shipping_info: true,
  show_return_policy: true,
  max_badges: 2,
};

// ============================================
// HELPERS
// ============================================
const normalizeBusinessHours = (raw) => {
  let obj = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) obj = {};
  const out = {};
  for (const day of DAYS) {
    const base = defaultBusinessHours[day];
    const d = obj?.[day] && typeof obj[day] === "object" ? obj[day] : {};
    out[day] = { open: d.open || base.open, close: d.close || base.close, enabled: d.enabled ?? base.enabled };
  }
  return out;
};

const normalizeCardPreferences = (raw) => {
  let obj = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
  if (!obj || typeof obj !== "object") obj = {};
  return { ...defaultCardPreferences, ...obj };
};

const safeUrl = (u) => { if (!u) return true; try { new URL(u.startsWith("http") ? u : `https://${u}`); return true; } catch { return false; } };
const normalizePhone = (p) => (p || "").replace(/\s+/g, "").trim();

const stableStringify = (value) => {
  const seen = new WeakSet();
  const sorter = (v) => {
    if (v && typeof v === "object") {
      if (seen.has(v)) return v;
      seen.add(v);
      if (Array.isArray(v)) return v.map(sorter);
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = sorter(v[k]);
      return out;
    }
    return v;
  };
  return JSON.stringify(sorter(value));
};

const withTimeout = (promise, ms = 15000) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))]);
const pickFn = (obj, names) => names.map((n) => obj?.[n]).find((v) => typeof v === "function");

// ============================================
// UI COMPONENTS
// ============================================
const SettingSection = ({ icon: Icon, title, description, children, defaultOpen = true, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg"><Icon className="w-4 h-4 text-primary" /></div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              {badge && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">{badge}</span>}
            </div>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="w-4 h-4 text-slate-400" /></motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4 pt-2 border-t border-slate-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToggleRow = ({ title, description, checked, onCheckedChange, icon: Icon, disabled }) => (
  <div className={cn("flex items-start justify-between gap-3 p-3 rounded-lg border transition-all", checked ? "border-primary/20 bg-primary/5" : "border-slate-100 bg-slate-50/50", disabled && "opacity-50")}>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
        {Icon && <Icon className={cn("w-4 h-4", checked ? "text-primary" : "text-slate-400")} />}
        {title}
      </div>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </div>
);

const CompactToggle = ({ title, checked, onCheckedChange, disabled }) => (
  <div className={cn("flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-all", checked ? "border-primary/20 bg-primary/5" : "border-slate-100 bg-slate-50/50", disabled && "opacity-50")}>
    <span className="text-xs font-medium text-slate-700">{title}</span>
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="scale-90" />
  </div>
);

// ============================================
// QR CODE
// ============================================
const QRCodeSection = ({ userId, userName }) => {
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/seller/${userId}` : `/seller/${userId}`;
  const qrRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2; canvas.height = img.height * 2;
      ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `lmx-profil-${userName || userId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(profileUrl); setCopied(true); toast.success("Link kopiran"); setTimeout(() => setCopied(false), 2000); } catch { toast.error("Greška"); }
  };

  return (
    <div className="flex items-start gap-4">
      <div ref={qrRef} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
        <QRCodeSVG value={profileUrl} size={100} level="H" includeMargin={false} fgColor="#0F172A" />
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-xs text-slate-600">QR kod za brzi pristup profilu.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadQR} className="text-xs h-8"><Download className="w-3 h-3 mr-1" />Preuzmi</Button>
          <Button variant="outline" size="sm" onClick={copyLink} className="text-xs h-8">{copied ? <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" /> : <Copy className="w-3 h-3 mr-1" />}{copied ? "Kopirano!" : "Link"}</Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CARD PREFERENCES - POBOLJŠANA VERZIJA
// ============================================
const CardPreferencesSection = ({ cardPreferences, setCardPreferences }) => {
  const updatePref = (key, value) => setCardPreferences(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Kontroliši šta se prikazuje na tvojoj prodavačkoj kartici na stranicama oglasa i na profilu.</p>
      
      {/* Osnovni prikaz - na oglasima */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-xs font-semibold text-slate-700">Osnovni prikaz (na oglasima)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CompactToggle title="Ocjene" checked={cardPreferences.show_ratings} onCheckedChange={(v) => updatePref("show_ratings", v)} />
          <CompactToggle title="Bedževi" checked={cardPreferences.show_badges} onCheckedChange={(v) => updatePref("show_badges", v)} />
          <CompactToggle title="Član od" checked={cardPreferences.show_member_since} onCheckedChange={(v) => updatePref("show_member_since", v)} />
          <CompactToggle title="Vrijeme odg." checked={cardPreferences.show_response_time} onCheckedChange={(v) => updatePref("show_response_time", v)} />
        </div>
      </div>
      
      {/* Extended prikaz - na profilu */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-slate-700">Prošireni prikaz (na profilu)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CompactToggle title="Radno vrijeme" checked={cardPreferences.show_business_hours} onCheckedChange={(v) => updatePref("show_business_hours", v)} />
          <CompactToggle title="Info dostave" checked={cardPreferences.show_shipping_info} onCheckedChange={(v) => updatePref("show_shipping_info", v)} />
          <CompactToggle title="Politika povrata" checked={cardPreferences.show_return_policy} onCheckedChange={(v) => updatePref("show_return_policy", v)} />
        </div>
      </div>
      
      {cardPreferences.show_badges && (
        <div className="p-3 bg-slate-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-600">Maksimalan broj bedževa</Label>
            <span className="text-xs font-semibold text-slate-900">{cardPreferences.max_badges}</span>
          </div>
          <Slider value={[cardPreferences.max_badges]} onValueChange={([v]) => updatePref("max_badges", v)} min={1} max={5} step={1} className="w-full" />
        </div>
      )}
    </div>
  );
};

// ============================================
// LIVE PREVIEW - OSNOVNI (za oglase)
// ============================================
const BasicSellerPreview = ({ seller, settings, cardPreferences }) => {
  const showRatings = cardPreferences?.show_ratings ?? true;
  const showBadges = cardPreferences?.show_badges ?? true;
  const showMemberSince = cardPreferences?.show_member_since ?? false;
  const showResponseTime = cardPreferences?.show_response_time ?? true;

  const responseTimeLabels = {
    instant: "par minuta",
    few_hours: "par sati",
    same_day: "isti dan",
    few_days: "par dana",
    auto: "~30 min",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
            {seller?.profile || seller?.profile_image ? (
              <img
                src={seller?.profile || seller?.profile_image}
                alt={seller?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">{seller?.name?.[0]?.toUpperCase() || "P"}</span>
              </div>
            )}
          </div>
          {seller?.is_verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-sky-500 rounded-md flex items-center justify-center border-2 border-white">
              <BadgeCheck className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {seller?.name || "Tvoje ime"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {showRatings && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-medium">4.8</span>
                <span className="text-slate-400">(12)</span>
              </span>
            )}
            {showResponseTime && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Zap className="w-3 h-3 text-amber-500" />
                {responseTimeLabels[settings?.response_time] || "~30 min"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {showMemberSince && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                jan 2024
              </span>
            )}
          </div>

          {showBadges && (
            <div className="flex items-center gap-1 mt-1.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                <Star className="w-3 h-3 text-amber-600" />
              </div>
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium rounded-xl px-3 py-2.5">
          <MessageCircle className="w-4 h-4" />
          Pošalji poruku
        </button>
        {(settings?.show_phone || settings?.show_whatsapp || settings?.show_viber) && (
          <button className="flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 w-10 h-10">
            <Phone className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// LIVE PREVIEW - EXTENDED (za profil prodavača)
// ============================================
const ExtendedSellerPreview = ({ seller, settings, cardPreferences }) => {
  const showRatings = cardPreferences?.show_ratings ?? true;
  const showBadges = cardPreferences?.show_badges ?? true;
  const showMemberSince = cardPreferences?.show_member_since ?? false;
  const showResponseTime = cardPreferences?.show_response_time ?? true;
  const showBusinessHours = cardPreferences?.show_business_hours ?? true;
  const showShippingInfo = cardPreferences?.show_shipping_info ?? true;
  const showReturnPolicy = cardPreferences?.show_return_policy ?? true;

  const responseTimeLabels = {
    instant: "par minuta",
    few_hours: "par sati",
    same_day: "isti dan",
    few_days: "par dana",
    auto: "~30 min",
  };

  // Business hours helpers
  const businessHours = settings?.business_hours || {};
  const dayLabels = { monday: "Pon", tuesday: "Uto", wednesday: "Sri", thursday: "Čet", friday: "Pet", saturday: "Sub", sunday: "Ned" };
  
  const getTodayHours = () => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = days[new Date().getDay()];
    const todayHours = businessHours[today];
    if (!todayHours || !todayHours.enabled) return "Zatvoreno";
    return `${todayHours.open} – ${todayHours.close}`;
  };

  const isOpen = () => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = days[new Date().getDay()];
    const todayHours = businessHours[today];
    if (!todayHours || !todayHours.enabled) return false;
    
    const now = new Date();
    const [openH, openM] = (todayHours.open || "09:00").split(":").map(Number);
    const [closeH, closeM] = (todayHours.close || "17:00").split(":").map(Number);
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return currentMins >= (openH * 60 + openM) && currentMins <= (closeH * 60 + closeM);
  };

  return (
    <div className="space-y-3">
      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
              {seller?.profile || seller?.profile_image ? (
                <img
                  src={seller?.profile || seller?.profile_image}
                  alt={seller?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-xl">{seller?.name?.[0]?.toUpperCase() || "P"}</span>
                </div>
              )}
            </div>
            {seller?.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-sky-500 rounded-lg flex items-center justify-center border-2 border-white">
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-slate-900 truncate">
                {seller?.name || "Tvoje ime"}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {showRatings && (
                <span className="inline-flex items-center gap-1 text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-900">4.8</span>
                  <span className="text-slate-400">(12)</span>
                </span>
              )}
              {showResponseTime && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Odgovara za {responseTimeLabels[settings?.response_time] || "~30 min"}
                </span>
              )}
            </div>

            {showMemberSince && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">
                <Calendar className="w-3 h-3" />
                Član od jan 2024
              </span>
            )}

            {showBadges && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Business Hours */}
        {showBusinessHours && Object.values(businessHours).some(d => d?.enabled) && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Danas: <strong className="text-slate-900">{getTodayHours()}</strong></span>
            </div>
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
              isOpen() ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", isOpen() ? "bg-emerald-500" : "bg-slate-400")} />
              {isOpen() ? "Otvoreno" : "Zatvoreno"}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium rounded-xl px-4 py-3">
            <MessageCircle className="w-4 h-4" />
            Pošalji poruku
          </button>
          {(settings?.show_phone || settings?.show_whatsapp || settings?.show_viber || settings?.show_email) && (
            <button className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5">
              <Phone className="w-4 h-4" />
              Kontakt opcije
            </button>
          )}
        </div>
      </div>

      {/* Info Sections */}
      {(showShippingInfo || showReturnPolicy) && (settings?.shipping_info || settings?.return_policy) && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {showShippingInfo && settings?.shipping_info && (
            <div className="px-4 py-3 border-b border-slate-50">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-slate-700 mb-0.5">Dostava</div>
                  <p className="text-xs text-slate-500 line-clamp-2">{settings.shipping_info}</p>
                </div>
              </div>
            </div>
          )}
          {showReturnPolicy && settings?.return_policy && (
            <div className="px-4 py-3">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-slate-700 mb-0.5">Povrat</div>
                  <p className="text-xs text-slate-500 line-clamp-2">{settings.return_policy}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN
// ============================================
const SellerSettings = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(userSignUpData);
  const isMountedRef = useRef(true);
  
  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Avatar
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Contact
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [showViber, setShowViber] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [viberNumber, setViberNumber] = useState("");
  const [preferredContact, setPreferredContact] = useState("message");

  // Availability
  const [businessHours, setBusinessHours] = useState(defaultBusinessHours);
  const [responseTime, setResponseTime] = useState("auto");
  const [acceptsOffers, setAcceptsOffers] = useState(true);

  // Auto reply
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState("Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku.");

  // Vacation
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationMessage, setVacationMessage] = useState("Trenutno sam na odmoru.");
  const [vacationStartDate, setVacationStartDate] = useState("");
  const [vacationEndDate, setVacationEndDate] = useState("");
  const [vacationAutoActivate, setVacationAutoActivate] = useState(false);

  // Info
  const [businessDescription, setBusinessDescription] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [shippingInfo, setShippingInfo] = useState("");

  // Socials
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");

  // Card Preferences
  const [cardPreferences, setCardPreferences] = useState(defaultCardPreferences);

  const initialPayloadRef = useRef(null);

  useEffect(() => {
    if (currentUser?.profile_image) setPreviewImage(currentUser.profile_image);
    if (currentUser?.profile) setPreviewImage(currentUser.profile);
  }, [currentUser]);

  const responseTimeOptions = [
    { value: "auto", label: "Auto" },
    { value: "instant", label: "Minuti" },
    { value: "few_hours", label: "Sati" },
    { value: "same_day", label: "24h" },
    { value: "few_days", label: "Dani" },
  ];

  const buildPayload = useCallback(() => ({
    show_phone: showPhone, show_email: showEmail, show_whatsapp: showWhatsapp, show_viber: showViber,
    whatsapp_number: whatsappNumber, viber_number: viberNumber, preferred_contact_method: preferredContact,
    business_hours: businessHours, response_time: responseTime, accepts_offers: acceptsOffers,
    auto_reply_enabled: autoReplyEnabled, auto_reply_message: autoReplyMessage,
    vacation_mode: vacationMode, vacation_message: vacationMessage,
    vacation_start_date: vacationStartDate, vacation_end_date: vacationEndDate, vacation_auto_activate: vacationAutoActivate,
    business_description: businessDescription, return_policy: returnPolicy, shipping_info: shippingInfo,
    social_facebook: socialFacebook, social_instagram: socialInstagram, social_tiktok: socialTiktok,
    social_youtube: socialYoutube, social_website: socialWebsite,
    card_preferences: cardPreferences,
  }), [showPhone, showEmail, showWhatsapp, showViber, whatsappNumber, viberNumber, preferredContact,
      businessHours, responseTime, acceptsOffers, autoReplyEnabled, autoReplyMessage, vacationMode,
      vacationMessage, vacationStartDate, vacationEndDate, vacationAutoActivate, businessDescription,
      returnPolicy, shippingInfo, socialFacebook, socialInstagram, socialTiktok, socialYoutube,
      socialWebsite, cardPreferences]);

  const hasChanges = useMemo(() => {
    if (!initialPayloadRef.current) return false;
    return stableStringify(buildPayload()) !== initialPayloadRef.current;
  }, [buildPayload]);

  const errors = useMemo(() => {
    const e = {};
    if (showWhatsapp && whatsappNumber && normalizePhone(whatsappNumber).length < 6) e.whatsappNumber = "Unesite validan broj.";
    if (showViber && viberNumber && normalizePhone(viberNumber).length < 6) e.viberNumber = "Unesite validan broj.";
    if (socialFacebook && !safeUrl(socialFacebook)) e.socialFacebook = "Neispravan link.";
    if (socialInstagram && !safeUrl(socialInstagram)) e.socialInstagram = "Neispravan link.";
    if (socialWebsite && !safeUrl(socialWebsite)) e.socialWebsite = "Neispravan link.";
    return e;
  }, [showWhatsapp, whatsappNumber, showViber, viberNumber, socialFacebook, socialInstagram, socialWebsite]);

  const isValid = Object.keys(errors).length === 0;

  const fetchSettings = useCallback(async () => {
    const getFn = pickFn(sellerSettingsApi, ["getSettings", "get"]);
    if (!getFn) { setIsLoading(false); setLoadError("API nije dostupan."); return; }

    try {
      setIsLoading(true); setLoadError("");
      const response = await withTimeout(getFn(), 15000);
      if (response?.data?.error !== false || !response?.data?.data) { setLoadError(response?.data?.message || "Greška."); return; }

      const s = response.data.data;
      setShowPhone(s.show_phone ?? true);
      setShowEmail(s.show_email ?? true);
      setShowWhatsapp(s.show_whatsapp ?? false);
      setShowViber(s.show_viber ?? false);
      setWhatsappNumber(s.whatsapp_number || "");
      setViberNumber(s.viber_number || "");
      setPreferredContact(s.preferred_contact_method || "message");
      setBusinessHours(normalizeBusinessHours(s.business_hours));
      setResponseTime(s.response_time || "auto");
      setAcceptsOffers(s.accepts_offers ?? true);
      setAutoReplyEnabled(s.auto_reply_enabled ?? false);
      setAutoReplyMessage(s.auto_reply_message || "Hvala na poruci!");
      setVacationMode(s.vacation_mode ?? false);
      setVacationMessage(s.vacation_message || "Na odmoru sam.");
      setVacationStartDate(s.vacation_start_date || "");
      setVacationEndDate(s.vacation_end_date || "");
      setVacationAutoActivate(s.vacation_auto_activate ?? false);
      setBusinessDescription(s.business_description || "");
      setReturnPolicy(s.return_policy || "");
      setShippingInfo(s.shipping_info || "");
      setSocialFacebook(s.social_facebook || "");
      setSocialInstagram(s.social_instagram || "");
      setSocialTiktok(s.social_tiktok || "");
      setSocialYoutube(s.social_youtube || "");
      setSocialWebsite(s.social_website || "");
      setCardPreferences(normalizeCardPreferences(s.card_preferences));

      initialPayloadRef.current = stableStringify({
        show_phone: s.show_phone ?? true, show_email: s.show_email ?? true,
        show_whatsapp: s.show_whatsapp ?? false, show_viber: s.show_viber ?? false,
        whatsapp_number: s.whatsapp_number || "", viber_number: s.viber_number || "",
        preferred_contact_method: s.preferred_contact_method || "message",
        business_hours: normalizeBusinessHours(s.business_hours),
        response_time: s.response_time || "auto", accepts_offers: s.accepts_offers ?? true,
        auto_reply_enabled: s.auto_reply_enabled ?? false,
        auto_reply_message: s.auto_reply_message || "Hvala na poruci!",
        vacation_mode: s.vacation_mode ?? false, vacation_message: s.vacation_message || "Na odmoru sam.",
        vacation_start_date: s.vacation_start_date || "", vacation_end_date: s.vacation_end_date || "",
        vacation_auto_activate: s.vacation_auto_activate ?? false,
        business_description: s.business_description || "", return_policy: s.return_policy || "",
        shipping_info: s.shipping_info || "", social_facebook: s.social_facebook || "",
        social_instagram: s.social_instagram || "", social_tiktok: s.social_tiktok || "",
        social_youtube: s.social_youtube || "", social_website: s.social_website || "",
        card_preferences: normalizeCardPreferences(s.card_preferences),
      });
    } catch (err) {
      console.error(err);
      setLoadError(err?.message === "TIMEOUT" ? "Timeout." : "Greška.");
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSubmitAttempted(true);
    if (!isValid) { toast.error("Ispravite greške."); return; }
    if (!hasChanges) return;

    const updateFn = pickFn(sellerSettingsApi, ["updateSettings", "update"]);
    if (!updateFn) { toast.error("API nije dostupan."); return; }

    try {
      setIsSaving(true);
      const payload = buildPayload();
      const response = await withTimeout(updateFn(payload), 15000);
      if (response?.data?.error === false) {
        initialPayloadRef.current = stableStringify(payload);
        toast.success("Postavke sačuvane!");
      } else {
        toast.error(response?.data?.message || "Greška.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message === "TIMEOUT" ? "Timeout." : "Greška.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => { await fetchSettings(); toast.message("Vraćeno."); };

  const updateProfileImage = async (fileOrBlob) => {
    if (!fileOrBlob) return;
    const objectUrl = URL.createObjectURL(fileOrBlob);
    setPreviewImage(objectUrl);
    setIsAvatarUploading(true);

    try {
      const response = await withTimeout(updateProfileApi.updateProfile({
        profile: fileOrBlob, name: currentUser?.name, mobile: currentUser?.mobile,
        email: currentUser?.email, notification: currentUser?.notification ?? 0,
        show_personal_details: currentUser?.show_personal_details ?? 0, country_code: currentUser?.country_code,
      }), 20000);

      if (response?.data?.error === false) {
        toast.success("Slika ažurirana!");
        setIsAvatarModalOpen(false);
        dispatch(userUpdateData({ data: response.data.data }));
      } else {
        toast.error(response?.data?.message || "Greška.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Greška pri uploadu.");
    } finally {
      setIsAvatarUploading(false);
      try { URL.revokeObjectURL(objectUrl); } catch {}
    }
  };

  const handleFileUpload = (e) => { const file = e.target.files?.[0]; if (file) updateProfileImage(file); };

  const setDay = (day, patch) => setBusinessHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Error
  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Greška</p>
            <p className="text-xs text-red-600 mt-1">{loadError}</p>
            <Button variant="outline" size="sm" onClick={fetchSettings} className="mt-3 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />Ponovo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const previewSeller = { ...currentUser, profile: previewImage || currentUser?.profile_image || currentUser?.profile };
  const previewSettings = buildPayload();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Postavke prodavača</h2>
          <p className="text-sm text-slate-500">Kako te kupci vide</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />Poništi
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !hasChanges || !isValid} className="bg-primary">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Sačuvaj
          </Button>
        </div>
      </div>

      {hasChanges && isValid && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Nesačuvane promjene
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        {/* Settings */}
        <div className="space-y-4">
          {/* Avatar */}
          <SettingSection icon={Camera} title="Profilna slika">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                {previewImage ? <img src={previewImage} alt="Profil" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-xs text-slate-400">Nema</div>}
              </div>
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isAvatarUploading}>
                  <Camera className="w-3.5 h-3.5 mr-1" />Učitaj
                </Button>
                <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isAvatarUploading}><Sparkles className="w-3.5 h-3.5 mr-1" />Studio</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none">
                    <LmxAvatarGenerator onSave={updateProfileImage} onCancel={() => setIsAvatarModalOpen(false)} isSaving={isAvatarUploading} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </SettingSection>

          {/* Card Preferences - NEW */}
          <SettingSection icon={LayoutGrid} title="Prikaz kartice" description="Šta se prikazuje kupcima" badge="NOVO">
            <CardPreferencesSection cardPreferences={cardPreferences} setCardPreferences={setCardPreferences} />
          </SettingSection>

          {/* Contact */}
          <SettingSection icon={Phone} title="Kontakt opcije">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <CompactToggle title="Telefon" checked={showPhone} onCheckedChange={setShowPhone} />
                <CompactToggle title="Email" checked={showEmail} onCheckedChange={setShowEmail} />
                <CompactToggle title="WhatsApp" checked={showWhatsapp} onCheckedChange={setShowWhatsapp} />
                <CompactToggle title="Viber" checked={showViber} onCheckedChange={setShowViber} />
              </div>
              {(showWhatsapp || showViber) && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {showWhatsapp && (
                    <div className="space-y-1">
                      <Label className="text-xs">WhatsApp</Label>
                      <Input className={cn("h-9 text-sm", submitAttempted && errors.whatsappNumber && "border-red-300")} placeholder="+387..." value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
                    </div>
                  )}
                  {showViber && (
                    <div className="space-y-1">
                      <Label className="text-xs">Viber</Label>
                      <Input className={cn("h-9 text-sm", submitAttempted && errors.viberNumber && "border-red-300")} placeholder="+387..." value={viberNumber} onChange={(e) => setViberNumber(e.target.value)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </SettingSection>

          {/* Response time */}
          <SettingSection icon={Zap} title="Dostupnost" defaultOpen={false}>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-slate-600 mb-2 block">Vrijeme odgovora</Label>
                <div className="flex gap-1">
                  {responseTimeOptions.map((o) => (
                    <button key={o.value} type="button" onClick={() => setResponseTime(o.value)} className={cn("px-2.5 py-1 rounded text-xs font-medium transition-all", responseTime === o.value ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <ToggleRow title="Primam ponude" description="Kupci mogu slati cjenovne ponude" icon={Shield} checked={acceptsOffers} onCheckedChange={setAcceptsOffers} />
            </div>
          </SettingSection>

          {/* Business Hours */}
          <SettingSection icon={Clock} title="Radno vrijeme" defaultOpen={false}>
            <div className="space-y-2">
              {DAYS.map((day) => (
                <div key={day} className={cn("rounded-lg border p-2.5 transition-all", businessHours?.[day]?.enabled ? "border-primary/20 bg-primary/5" : "border-slate-100 bg-slate-50")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Switch checked={businessHours?.[day]?.enabled} onCheckedChange={(v) => setDay(day, { enabled: v })} className="scale-90" />
                      <span className="text-sm font-medium text-slate-900 w-12">{DAY_LABEL[day]}</span>
                    </div>
                    {businessHours?.[day]?.enabled && (
                      <div className="flex items-center gap-1.5">
                        <Input type="time" className="h-7 w-20 text-xs" value={businessHours?.[day]?.open || "09:00"} onChange={(e) => setDay(day, { open: e.target.value })} />
                        <span className="text-slate-400 text-xs">-</span>
                        <Input type="time" className="h-7 w-20 text-xs" value={businessHours?.[day]?.close || "17:00"} onChange={(e) => setDay(day, { close: e.target.value })} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SettingSection>

          {/* Info */}
          <SettingSection icon={Store} title="Informacije" defaultOpen={false}>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">O meni</Label>
                <Textarea className="min-h-[60px] text-sm" placeholder="Ko si, šta prodaješ..." value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dostava</Label>
                <Textarea className="min-h-[50px] text-sm" placeholder="Način slanja, rokovi..." value={shippingInfo} onChange={(e) => setShippingInfo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Povrat</Label>
                <Textarea className="min-h-[50px] text-sm" placeholder="Uslovi povrata..." value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} />
              </div>
            </div>
          </SettingSection>

          {/* Vacation */}
          <SettingSection icon={Plane} title="Odmor" defaultOpen={false}>
            <div className="space-y-3">
              <ToggleRow title="Aktiviraj odmor" description="Kupci vide da nisi dostupan" icon={Plane} checked={vacationMode} onCheckedChange={setVacationMode} />
              <div className="space-y-1">
                <Label className="text-xs">Poruka</Label>
                <Textarea className="min-h-[50px] text-sm" value={vacationMessage} onChange={(e) => setVacationMessage(e.target.value)} />
              </div>
            </div>
          </SettingSection>

          {/* Socials */}
          <SettingSection icon={Globe} title="Mreže" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Users className="w-3 h-3" />Facebook</Label>
                <Input className="h-9 text-sm" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="facebook.com/..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Camera className="w-3 h-3" />Instagram</Label>
                <Input className="h-9 text-sm" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="instagram.com/..." />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs flex items-center gap-1"><LinkIcon className="w-3 h-3" />Web</Label>
                <Input className="h-9 text-sm" value={socialWebsite} onChange={(e) => setSocialWebsite(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </SettingSection>

          {/* QR */}
          <SettingSection icon={QrCode} title="QR kod" defaultOpen={false}>
            <QRCodeSection userId={currentUser?.id} userName={currentUser?.name} />
          </SettingSection>
        </div>

        {/* Preview */}
        <div className="xl:sticky xl:top-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Eye className="w-4 h-4 text-primary" /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">Pregled uživo</h3>
                  <p className="text-xs text-slate-500">Kako te kupci vide</p>
                </div>
              </div>
            </div>
            
            <Tabs defaultValue="basic" className="w-full">
              <div className="px-4 pt-3">
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="basic" className="text-xs flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    Na oglasu
                  </TabsTrigger>
                  <TabsTrigger value="extended" className="text-xs flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" />
                    Na profilu
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="basic" className="p-4 pt-3">
                <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Ovako izgledaš na stranici oglasa
                </div>
                <BasicSellerPreview 
                  seller={previewSeller} 
                  settings={previewSettings}
                  cardPreferences={cardPreferences}
                />
              </TabsContent>
              
              <TabsContent value="extended" className="p-4 pt-3">
                <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Ovako izgledaš na stranici profila prodavača
                </div>
                <ExtendedSellerPreview 
                  seller={previewSeller} 
                  settings={previewSettings}
                  cardPreferences={cardPreferences}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Tips */}
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Savjeti za bolju prodaju</h4>
                <ul className="text-xs text-slate-600 mt-2 space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Brzi odgovori = 3x više prodaje</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Kvalitetna profilna slika = 50% više upita</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Više kontakt opcija = veća dostupnost</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Definirano radno vrijeme = profesionalnost</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">Gdje se prikazuju postavke?</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">Stranica oglasa</p>
                  <p className="text-[11px] text-slate-500">Osnovni podaci, ocjene, vrijeme odgovora</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-emerald-600">2</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">Profil prodavača</p>
                  <p className="text-[11px] text-slate-500">Sve informacije + dostava, povrat, radno vrijeme</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SellerSettings;