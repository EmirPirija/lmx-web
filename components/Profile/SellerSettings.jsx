"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/utils/toastBs";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import {
  getAuth,
  linkWithCredential,
  onAuthStateChanged,
  PhoneAuthProvider,
  reload,
  sendEmailVerification,
  updatePhoneNumber,
} from "firebase/auth";


import {
  AlertCircle, Calendar, Camera, ChevronDown, Clock, Download, Eye, Globe, Mail,
  MessageCircle, Phone, RefreshCw, Save, Shield, Sparkles, Store, Users, Zap,
  CheckCircle2, Link as LinkIcon, Video, Music, QrCode, Copy, Loader2, Plane,
  Star, LayoutGrid, Settings2, Truck, RotateCcw, User,
} from "@/components/Common/UnifiedIconPack";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

import { cn } from "@/lib/utils";
import { resolveMembership } from "@/lib/membership";
import { PROMO_BENEFITS, PROMO_HEADLINE, PROMO_SUBHEAD, isPromoFreeAccessEnabled } from "@/lib/promoMode";
import {
  getOtpApi,
  verifyOtpApi,
  sellerSettingsApi,
  updateProfileApi,
  getVerificationStatusApi,
  membershipApi,
} from "@/utils/api";
import {
  loadUpdateData,
  userSignUpData,
  userUpdateData,
} from "@/redux/reducer/authSlice";
import MembershipBadge from "@/components/Common/MembershipBadge";
import PlanGateLabel from "@/components/Common/PlanGateLabel";
import CustomLink from "@/components/Common/CustomLink";
import LmxAvatarGenerator from "@/components/Avatar/LmxAvatarGenerator";
import { MinimalSellerCard } from "@/components/PagesComponent/Seller/MinimalSellerCard";
import SellerDetailCard from "@/components/PagesComponent/Seller/SellerDetailCard";
import { handleFirebaseAuthError } from "@/utils";
import { getOtpServiceProvider } from "@/redux/reducer/settingSlice";
import {
  clearRecaptchaVerifier,
  ensureRecaptchaVerifier,
  isRecaptchaRecoverableError,
} from "@/components/Auth/recaptchaManager";

// ============================================
// VERIFICATION BADGE
// ============================================
const VerificationBadge = ({ status }) => {
  const config = {
    approved: { color: "bg-green-100 text-green-700 border-green-200", label: "Verificiran" },
    pending: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Na čekanju" },
    submitted: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Na čekanju" },
    resubmitted: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Na pregledu" },
    rejected: { color: "bg-red-100 text-red-700 border-red-200", label: "Odbijeno" },
    "not applied": { color: "bg-slate-100 text-slate-600 border-slate-200", label: "Nije verificiran" },
  };
  const key = String(status || "").trim().toLowerCase();
const c = config[key] || config["not applied"];

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full border", c.color)}>
      <Shield className="w-3 h-3" />
      {c.label}
    </span>
  );
};

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
  show_online_status: true,
  show_reel_hint: true,
  highlight_contact_button: false,
  show_business_hours: true,
  show_shipping_info: true,
  show_return_policy: true,
  enable_buyer_filters: true,
  buyer_filters_show_search: true,
  buyer_filters_show_price: true,
  buyer_filters_show_video: true,
  buyer_filters_show_on_sale: true,
  buyer_filters_show_featured: true,
  max_badges: 2,
};

const SELLER_RECAPTCHA_CONTAINER_ID = "seller-verification-recaptcha-container";

// ============================================
// HELPERS
// ============================================
const toBool = (value, fallback = false) => {
  if (value == null) return fallback;
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (["1", "true", "yes"].includes(s)) return true;
    if (["0", "false", "no"].includes(s)) return false;
  }
  return Boolean(value);
};

const normalizeBusinessHours = (raw) => {
  let obj = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) obj = {};
  const out = {};
  for (const day of DAYS) {
    const base = defaultBusinessHours[day];
    const d = obj?.[day] && typeof obj[day] === "object" ? obj[day] : {};
    const enabled = d.enabled == null ? base.enabled : toBool(d.enabled, base.enabled);
    out[day] = { open: d.open || base.open, close: d.close || base.close, enabled };
  }
  return out;
};

const normalizeCardPreferences = (raw) => {
  let obj = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
  if (!obj || typeof obj !== "object") obj = {};
  return {
    ...defaultCardPreferences,
    ...obj,
    show_ratings: toBool(obj.show_ratings, defaultCardPreferences.show_ratings),
    show_badges: toBool(obj.show_badges, defaultCardPreferences.show_badges),
    show_member_since: toBool(obj.show_member_since, defaultCardPreferences.show_member_since),
    show_response_time: toBool(obj.show_response_time, defaultCardPreferences.show_response_time),
    show_online_status: toBool(obj.show_online_status, defaultCardPreferences.show_online_status),
    show_reel_hint: toBool(obj.show_reel_hint, defaultCardPreferences.show_reel_hint),
    highlight_contact_button: toBool(
      obj.highlight_contact_button,
      defaultCardPreferences.highlight_contact_button
    ),
    show_business_hours: toBool(obj.show_business_hours, defaultCardPreferences.show_business_hours),
    show_shipping_info: toBool(obj.show_shipping_info, defaultCardPreferences.show_shipping_info),
    show_return_policy: toBool(obj.show_return_policy, defaultCardPreferences.show_return_policy),
    enable_buyer_filters: toBool(
      obj.enable_buyer_filters,
      defaultCardPreferences.enable_buyer_filters
    ),
    buyer_filters_show_search: toBool(
      obj.buyer_filters_show_search,
      defaultCardPreferences.buyer_filters_show_search
    ),
    buyer_filters_show_price: toBool(
      obj.buyer_filters_show_price,
      defaultCardPreferences.buyer_filters_show_price
    ),
    buyer_filters_show_video: toBool(
      obj.buyer_filters_show_video,
      defaultCardPreferences.buyer_filters_show_video
    ),
    buyer_filters_show_on_sale: toBool(
      obj.buyer_filters_show_on_sale,
      defaultCardPreferences.buyer_filters_show_on_sale
    ),
    buyer_filters_show_featured: toBool(
      obj.buyer_filters_show_featured,
      defaultCardPreferences.buyer_filters_show_featured
    ),
  };
};

const safeUrl = (u) => { if (!u) return true; try { new URL(u.startsWith("http") ? u : `https://${u}`); return true; } catch { return false; } };
const normalizePhone = (p) => (p || "").replace(/\s+/g, "").trim();
const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

const stripCountryCodePrefix = (mobile, countryCode) => {
  const mobileDigits = digitsOnly(mobile);
  const ccDigits = digitsOnly(countryCode);
  if (!mobileDigits) return "";
  if (!ccDigits) return mobileDigits;
  if (mobileDigits.startsWith(ccDigits)) {
    return mobileDigits.slice(ccDigits.length);
  }
  return mobileDigits;
};

const toE164Phone = (countryCode, localNumber) => {
  const ccDigits = digitsOnly(countryCode);
  const numberDigits = digitsOnly(localNumber);
  if (!ccDigits || !numberDigits) return "";
  const normalizedLocal = numberDigits.startsWith(ccDigits)
    ? numberDigits.slice(ccDigits.length)
    : numberDigits;
  return `+${ccDigits}${normalizedLocal}`;
};

const extractFirebaseIdentity = (user) => {
  if (!user) return null;
  return {
    uid: user.uid || "",
    email: user.email || "",
    emailVerified: Boolean(user.emailVerified),
    phoneNumber: user.phoneNumber || "",
    providerIds: Array.isArray(user.providerData)
      ? user.providerData
          .map((provider) => provider?.providerId)
          .filter(Boolean)
      : [],
  };
};

const toBoolLoose = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "verified", "approved"].includes(normalized);
};

const normalizeMembershipTier = (value) => {
  const tier = String(value || "").trim().toLowerCase();
  if (tier.includes("shop") || tier.includes("trgovina") || tier.includes("business")) return "shop";
  if (tier.includes("pro") || tier.includes("premium")) return "pro";
  return "free";
};

const normalizeMembershipSource = (raw) => {
  if (!raw || typeof raw !== "object") return null;

  const tierCandidate =
    raw?.tier?.slug ??
    raw?.tier ??
    raw?.tier_name ??
    raw?.membership_tier ??
    raw?.membershipTier ??
    raw?.membership?.tier?.slug ??
    raw?.membership?.tier ??
    raw?.membership?.plan ??
    raw?.plan?.slug ??
    raw?.plan ??
    raw?.label ??
    "";

  const tier = normalizeMembershipTier(tierCandidate);

  return {
    ...raw,
    tier,
    membership_tier: tier,
    is_shop: raw?.is_shop ?? raw?.isShop ?? raw?.shop ?? (tier === "shop"),
    is_pro: raw?.is_pro ?? raw?.isPro ?? raw?.premium ?? (tier === "pro"),
    membership_status:
      raw?.membership_status ??
      raw?.status ??
      raw?.membership?.status ??
      "active",
  };
};

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

const ToggleRow = ({ title, description, checked, onCheckedChange, icon: Icon, disabled, gate }) => (
  <div className={cn("flex items-start justify-between gap-3 p-3 rounded-lg border transition-all", checked ? "border-primary/20 bg-primary/5" : "border-slate-100 bg-slate-50/50", disabled && "opacity-50")}>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
        {Icon && <Icon className={cn("w-4 h-4", checked ? "text-primary" : "text-slate-400")} />}
        {title}
        {gate ? gate : null}
      </div>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </div>
);

const CompactToggle = ({ title, checked, onCheckedChange, disabled, planScope, unlocked }) => (
  <div className={cn("flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-all", checked ? "border-primary/20 bg-primary/5" : "border-slate-100 bg-slate-50/50", disabled && "opacity-50")}>
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-slate-700">{title}</span>
      {planScope ? (
        <PlanGateLabel scope={planScope} unlocked={unlocked} showStatus={false} />
      ) : null}
    </div>
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
// CARD PREFERENCES
// ============================================
const CardPreferencesSection = ({ cardPreferences, setCardPreferences }) => {
  const updatePref = (key, value) => setCardPreferences(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Kontroliši šta se prikazuje na tvojoj prodavačkoj kartici.</p>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <CompactToggle title="Ocjene" checked={cardPreferences.show_ratings} onCheckedChange={(v) => updatePref("show_ratings", v)} />
          <CompactToggle title="Bedževi" checked={cardPreferences.show_badges} onCheckedChange={(v) => updatePref("show_badges", v)} />
          <CompactToggle title="Član od" checked={cardPreferences.show_member_since} onCheckedChange={(v) => updatePref("show_member_since", v)} />
          <CompactToggle title="Vrijeme odg." checked={cardPreferences.show_response_time} onCheckedChange={(v) => updatePref("show_response_time", v)} />
          <CompactToggle title="Online status" checked={cardPreferences.show_online_status} onCheckedChange={(v) => updatePref("show_online_status", v)} />
          <CompactToggle title="Reel indikator" checked={cardPreferences.show_reel_hint} onCheckedChange={(v) => updatePref("show_reel_hint", v)} />
          <CompactToggle title="Istakni kontakt" checked={cardPreferences.highlight_contact_button} onCheckedChange={(v) => updatePref("highlight_contact_button", v)} />
          <CompactToggle title="Radno vrijeme" checked={cardPreferences.show_business_hours} onCheckedChange={(v) => updatePref("show_business_hours", v)} />
          <CompactToggle title="Info dostave" checked={cardPreferences.show_shipping_info} onCheckedChange={(v) => updatePref("show_shipping_info", v)} />
          <CompactToggle title="Politika povrata" checked={cardPreferences.show_return_policy} onCheckedChange={(v) => updatePref("show_return_policy", v)} />
        </div>
      </div>
      {cardPreferences.show_badges && (
        <div className="p-3 bg-slate-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-600">Max bedževa</Label>
            <span className="text-xs font-semibold text-slate-900">{cardPreferences.max_badges}</span>
          </div>
          <Slider value={[cardPreferences.max_badges]} onValueChange={([v]) => updatePref("max_badges", v)} min={1} max={5} step={1} className="w-full" />
        </div>
      )}
    </div>
  );
};

const BuyerFiltersSection = ({ cardPreferences, setCardPreferences, isProOrShop }) => {
  const updatePref = (key, value) =>
    setCardPreferences((prev) => ({ ...prev, [key]: value }));

  const filtersEnabled = Boolean(cardPreferences.enable_buyer_filters);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-700">Premium pristup filterima</p>
          <PlanGateLabel scope="pro_or_shop" unlocked={isProOrShop} />
        </div>
        <p className="text-xs text-slate-600">
          Ovi filteri se prikazuju kupcima na tvojoj stranici prodavača i aktivni su
          samo za PRO/SHOP profile.
        </p>
      </div>

      {!isProOrShop && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Ova opcija je dostupna nakon aktivacije PRO ili SHOP paketa.
        </div>
      )}

      <ToggleRow
        title="Uključi filtere kupcima"
        description="Kupci mogu filtrirati tvoje oglase direktno na profilu."
        icon={Settings2}
        gate={<PlanGateLabel scope="pro_or_shop" unlocked={isProOrShop} showStatus={false} />}
        checked={filtersEnabled}
        onCheckedChange={(value) => updatePref("enable_buyer_filters", value)}
        disabled={!isProOrShop}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <CompactToggle
          title="Pretraga"
          checked={cardPreferences.buyer_filters_show_search}
          onCheckedChange={(value) => updatePref("buyer_filters_show_search", value)}
          disabled={!isProOrShop || !filtersEnabled}
          planScope="pro_or_shop"
          unlocked={isProOrShop}
        />
        <CompactToggle
          title="Raspon cijene"
          checked={cardPreferences.buyer_filters_show_price}
          onCheckedChange={(value) => updatePref("buyer_filters_show_price", value)}
          disabled={!isProOrShop || !filtersEnabled}
          planScope="pro_or_shop"
          unlocked={isProOrShop}
        />
        <CompactToggle
          title="Samo sa videom"
          checked={cardPreferences.buyer_filters_show_video}
          onCheckedChange={(value) => updatePref("buyer_filters_show_video", value)}
          disabled={!isProOrShop || !filtersEnabled}
          planScope="pro_or_shop"
          unlocked={isProOrShop}
        />
        <CompactToggle
          title="Samo akcija"
          checked={cardPreferences.buyer_filters_show_on_sale}
          onCheckedChange={(value) => updatePref("buyer_filters_show_on_sale", value)}
          disabled={!isProOrShop || !filtersEnabled}
          planScope="pro_or_shop"
          unlocked={isProOrShop}
        />
        <CompactToggle
          title="Samo izdvojeni"
          checked={cardPreferences.buyer_filters_show_featured}
          onCheckedChange={(value) => updatePref("buyer_filters_show_featured", value)}
          disabled={!isProOrShop || !filtersEnabled}
          planScope="pro_or_shop"
          unlocked={isProOrShop}
        />
      </div>
    </div>
  );
};

// ============================================
// PREVIEW PANEL
// ============================================
const PreviewPanel = ({
  previewSeller, previewSettings, businessHours, businessDescription,
  shippingInfo, returnPolicy, responseTime, vacationMode, vacationMessage,
  socialFacebook, socialInstagram, socialWebsite, verificationStatus, cardPreferences, membershipTier,
}) => {
  const [activeTab, setActiveTab] = useState("card");
  const membership = useMemo(() => resolveMembership({ tier: membershipTier }), [membershipTier]);

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg"><Eye className="w-4 h-4 text-primary" /></div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Pregled uživo</h3>
            <p className="text-xs text-slate-500">Promjene se vide odmah</p>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          <button type="button" onClick={() => setActiveTab("card")} className={cn("flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all", activeTab === "card" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            Kartica
          </button>
          <button type="button" onClick={() => setActiveTab("extended")} className={cn("flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all", activeTab === "extended" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            Profil prodavača
          </button>
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === "card" ? (
            <motion.div key="card" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
              <MinimalSellerCard
                seller={previewSeller}
                sellerSettings={previewSettings}
                badges={[]}
                isPro={membership.isPro}
                isShop={membership.isShop}
                showProfileLink={false}
                onChatClick={() => toast.message("Ovo je samo prikaz.")}
                onPhoneClick={() => toast.message("Ovo je samo prikaz.")}
              />
            </motion.div>
          ) : (
            <motion.div key="extended" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
              <SellerDetailCard
                seller={previewSeller}
                sellerSettings={previewSettings}
                badges={[]}
                ratings={null}
                isPro={membership.isPro}
                isShop={membership.isShop}
                onChatClick={() => toast.message("Ovo je samo prikaz.")}
                onPhoneReveal={() => toast.message("Ovo je samo prikaz.")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================
// MAIN
// ============================================
const SellerSettings = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(userSignUpData);
  const authToken = useSelector((state) => state?.UserSignup?.data?.token || "");
  const otpServiceProvider = useSelector(getOtpServiceProvider);
  const auth = useMemo(() => getAuth(), []);
  const isMountedRef = useRef(true);
  const [membershipContext, setMembershipContext] = useState(null);
  const resolvedMembership = useMemo(
    () =>
      resolveMembership(
        currentUser,
        currentUser?.membership,
        membershipContext,
        membershipContext?.membership
      ),
    [currentUser, membershipContext]
  );
  const isPromoMode = isPromoFreeAccessEnabled();
  const isProOrShop = resolvedMembership.isPremium || isPromoMode;
  
  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("not applied");

  // Avatar
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Account verification (real email + OTP phone)
  const [firebaseIdentity, setFirebaseIdentity] = useState(null);
  const [manualPhoneVerified, setManualPhoneVerified] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState("387");
  const [phoneLocalNumber, setPhoneLocalNumber] = useState("");
  const [phoneRegionCode, setPhoneRegionCode] = useState("BA");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneVerificationId, setPhoneVerificationId] = useState("");
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false);
  const [emailVerificationSending, setEmailVerificationSending] = useState(false);
  const [emailVerificationRefreshing, setEmailVerificationRefreshing] = useState(false);

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
  const normalizedCardPreferences = useMemo(
    () => normalizeCardPreferences(cardPreferences),
    [cardPreferences]
  );

  const [initialPayloadStr, setInitialPayloadStr] = useState(null);

  useEffect(() => {
    if (currentUser?.profile_image) setPreviewImage(currentUser.profile_image);
    if (currentUser?.profile) setPreviewImage(currentUser.profile);
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseIdentity(extractFirebaseIdentity(firebaseUser));
    });
    return () => {
      unsubscribe?.();
      clearRecaptchaVerifier({ containerId: SELLER_RECAPTCHA_CONTAINER_ID });
    };
  }, [auth]);

  useEffect(() => {
    const country = digitsOnly(currentUser?.country_code) || "387";
    const localNumber = stripCountryCodePrefix(currentUser?.mobile, country);
    setPhoneCountryCode(country);
    setPhoneLocalNumber(localNumber);
    setPhoneRegionCode(String(currentUser?.region_code || "BA").toUpperCase());
    setManualPhoneVerified(
      toBoolLoose(currentUser?.mobile_verified) ||
        toBoolLoose(currentUser?.phone_verified) ||
        Boolean(currentUser?.mobile_verified_at) ||
        Boolean(currentUser?.phone_verified_at),
    );
  }, [
    currentUser?.country_code,
    currentUser?.mobile,
    currentUser?.region_code,
    currentUser?.mobile_verified,
    currentUser?.phone_verified,
    currentUser?.mobile_verified_at,
    currentUser?.phone_verified_at,
  ]);

  useEffect(() => {
    if (phoneOtpTimer <= 0) return;
    const timer = window.setInterval(() => {
      setPhoneOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phoneOtpTimer]);

  const responseTimeOptions = [
    { value: "auto", label: "Auto" },
    { value: "instant", label: "Minuti" },
    { value: "few_hours", label: "Sati" },
    { value: "same_day", label: "24h" },
    { value: "few_days", label: "Dani" },
  ];

  const providerIds = useMemo(
    () => new Set(firebaseIdentity?.providerIds || []),
    [firebaseIdentity?.providerIds],
  );
  const hasPhoneProvider = useMemo(
    () => providerIds.has("phone") || Boolean(firebaseIdentity?.phoneNumber),
    [providerIds, firebaseIdentity?.phoneNumber],
  );
  const hasEmailIdentity = useMemo(
    () => Boolean(firebaseIdentity?.email || currentUser?.email),
    [firebaseIdentity?.email, currentUser?.email],
  );
  const backendEmailVerified = useMemo(
    () =>
      toBoolLoose(currentUser?.email_verified) ||
      Boolean(currentUser?.email_verified_at),
    [currentUser?.email_verified, currentUser?.email_verified_at],
  );
  const isEmailVerified = useMemo(
    () =>
      hasEmailIdentity
        ? Boolean(firebaseIdentity?.emailVerified) || backendEmailVerified
        : false,
    [firebaseIdentity?.emailVerified, backendEmailVerified, hasEmailIdentity],
  );
  const registeredViaPhone = useMemo(() => {
    if (providerIds.has("phone") && !providerIds.has("password") && !providerIds.has("google.com")) {
      return true;
    }
    if (!currentUser?.email && Boolean(currentUser?.mobile)) {
      return true;
    }
    return false;
  }, [providerIds, currentUser?.email, currentUser?.mobile]);
  const isPhoneVerified = useMemo(
    () => hasPhoneProvider || manualPhoneVerified || registeredViaPhone,
    [hasPhoneProvider, manualPhoneVerified, registeredViaPhone],
  );

  const syncProfileVerificationData = useCallback(
    async ({
      nextMobile,
      nextCountryCode,
      nextRegionCode,
      nextEmail,
      authTokenOverride,
    } = {}) => {
      const response = await withTimeout(
        updateProfileApi.updateProfile({
          mobile: nextMobile || undefined,
          country_code: nextCountryCode || undefined,
          region_code: nextRegionCode || undefined,
          email: nextEmail || undefined,
          auth_token: authTokenOverride || authToken || undefined,
        }),
        20000,
      );

      if (response?.data?.error === false && response?.data?.data) {
        dispatch(userUpdateData({ data: response.data.data }));
      }

      return response;
    },
    [authToken, dispatch],
  );

  const refreshFirebaseIdentity = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setFirebaseIdentity(null);
      return null;
    }
    await reload(firebaseUser);
    const refreshedUser = auth.currentUser;
    const identity = extractFirebaseIdentity(refreshedUser);
    setFirebaseIdentity(identity);
    return identity;
  }, [auth]);

  const sendPhoneOtpWithTwilio = useCallback(async (phoneE164) => {
    const response = await getOtpApi.getOtp({ number: phoneE164 });
    if (response?.data?.error === false) {
      setPhoneOtpTimer(60);
      setPhoneVerificationId("twilio");
      toast.success(response?.data?.message || "OTP kod je poslan.");
      return true;
    }
    toast.error(response?.data?.message || "Slanje OTP koda nije uspjelo.");
    return false;
  }, []);

  const sendPhoneOtpWithFirebase = useCallback(
    async (phoneE164) => {
      const requestOtp = async (forceRecreate = true) => {
        const verifier = ensureRecaptchaVerifier({
          auth,
          containerId: SELLER_RECAPTCHA_CONTAINER_ID,
          forceRecreate,
        });
        if (!verifier) {
          handleFirebaseAuthError("auth/recaptcha-not-enabled");
          return null;
        }
        const provider = new PhoneAuthProvider(auth);
        return provider.verifyPhoneNumber(phoneE164, verifier);
      };

      try {
        const verificationId = await requestOtp(true);
        if (!verificationId) return false;
        setPhoneVerificationId(verificationId);
        setPhoneOtpTimer(60);
        toast.success("OTP kod je poslan.");
        return true;
      } catch (error) {
        if (isRecaptchaRecoverableError(error)) {
          try {
            const retriedVerificationId = await requestOtp(true);
            if (!retriedVerificationId) return false;
            setPhoneVerificationId(retriedVerificationId);
            setPhoneOtpTimer(60);
            toast.success("OTP kod je poslan.");
            return true;
          } catch (retryError) {
            handleFirebaseAuthError(retryError);
            return false;
          }
        }
        handleFirebaseAuthError(error);
        return false;
      }
    },
    [auth],
  );

  const handleSendPhoneVerificationOtp = useCallback(async () => {
    const phoneE164 = toE164Phone(phoneCountryCode, phoneLocalNumber);
    if (!phoneE164 || digitsOnly(phoneLocalNumber).length < 6) {
      toast.error("Unesite ispravan broj telefona.");
      return;
    }

    setPhoneOtpSending(true);
    try {
      if (otpServiceProvider === "twilio") {
        await sendPhoneOtpWithTwilio(phoneE164);
      } else {
        await sendPhoneOtpWithFirebase(phoneE164);
      }
    } finally {
      setPhoneOtpSending(false);
    }
  }, [
    otpServiceProvider,
    phoneCountryCode,
    phoneLocalNumber,
    sendPhoneOtpWithTwilio,
    sendPhoneOtpWithFirebase,
  ]);

  const handleVerifyPhoneOtp = useCallback(async () => {
    const trimmedOtp = String(phoneOtp || "").trim();
    const phoneE164 = toE164Phone(phoneCountryCode, phoneLocalNumber);
    const normalizedCountryCode = digitsOnly(phoneCountryCode);
    const normalizedLocalNumber = stripCountryCodePrefix(phoneLocalNumber, normalizedCountryCode);

    if (!trimmedOtp || trimmedOtp.length < 4) {
      toast.error("Unesite važeći OTP kod.");
      return;
    }
    if (!phoneE164) {
      toast.error("Broj telefona nije validan.");
      return;
    }

    setPhoneOtpVerifying(true);
    try {
      if (otpServiceProvider === "twilio") {
        const verifyResponse = await verifyOtpApi.verifyOtp({
          number: phoneE164,
          otp: trimmedOtp,
        });

        if (verifyResponse?.data?.error !== false) {
          toast.error(verifyResponse?.data?.message || "OTP verifikacija nije uspjela.");
          return;
        }

        if (verifyResponse?.data?.token) {
          loadUpdateData(verifyResponse.data);
        } else if (verifyResponse?.data?.data) {
          dispatch(userUpdateData({ data: verifyResponse.data.data }));
        }

        await syncProfileVerificationData({
          nextMobile: normalizedLocalNumber,
          nextCountryCode: normalizedCountryCode,
          nextRegionCode: phoneRegionCode || currentUser?.region_code || "BA",
          authTokenOverride: verifyResponse?.data?.token || authToken,
        });

        setManualPhoneVerified(true);
      } else {
        if (!phoneVerificationId) {
          toast.error("Prvo pošaljite OTP kod.");
          return;
        }
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          toast.error("Sesija je istekla. Prijavite se ponovo.");
          return;
        }

        const credential = PhoneAuthProvider.credential(phoneVerificationId, trimmedOtp);
        const alreadyLinkedPhone = firebaseUser.providerData?.some(
          (provider) => provider?.providerId === "phone",
        );

        if (alreadyLinkedPhone || firebaseUser.phoneNumber) {
          await updatePhoneNumber(firebaseUser, credential);
        } else {
          await linkWithCredential(firebaseUser, credential);
        }

        await refreshFirebaseIdentity();

        await syncProfileVerificationData({
          nextMobile: normalizedLocalNumber,
          nextCountryCode: normalizedCountryCode,
          nextRegionCode: phoneRegionCode || currentUser?.region_code || "BA",
        });
      }

      setPhoneOtp("");
      setPhoneVerificationId("");
      setPhoneOtpTimer(0);
      clearRecaptchaVerifier({
        containerId: SELLER_RECAPTCHA_CONTAINER_ID,
      });
      toast.success("Broj telefona je uspješno verificiran.");
    } catch (error) {
      if (otpServiceProvider === "twilio") {
        toast.error(error?.response?.data?.message || "OTP verifikacija nije uspjela.");
      } else {
        handleFirebaseAuthError(error);
      }
    } finally {
      setPhoneOtpVerifying(false);
    }
  }, [
    auth,
    authToken,
    currentUser?.region_code,
    dispatch,
    otpServiceProvider,
    phoneCountryCode,
    phoneLocalNumber,
    phoneOtp,
    phoneRegionCode,
    phoneVerificationId,
    refreshFirebaseIdentity,
    syncProfileVerificationData,
  ]);

  const handleSendEmailVerificationNow = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email) {
      toast.error("Nema aktivne e-mail adrese za verifikaciju.");
      return;
    }
    if (firebaseUser.emailVerified) {
      toast.success("E-mail adresa je već verificirana.");
      return;
    }

    setEmailVerificationSending(true);
    try {
      await sendEmailVerification(firebaseUser);
      toast.success("Link za verifikaciju je poslan na e-mail.");
    } catch (error) {
      handleFirebaseAuthError(error);
    } finally {
      setEmailVerificationSending(false);
    }
  }, [auth]);

  const handleRefreshEmailVerification = useCallback(async () => {
    setEmailVerificationRefreshing(true);
    try {
      const identity = await refreshFirebaseIdentity();
      if (identity?.email && identity?.emailVerified) {
        await syncProfileVerificationData({
          nextEmail: identity.email,
        });
        toast.success("E-mail adresa je potvrđena.");
      } else {
        toast.info("E-mail još nije potvrđen. Otvorite link iz poruke i pokušajte ponovo.");
      }
    } catch (error) {
      handleFirebaseAuthError(error);
    } finally {
      setEmailVerificationRefreshing(false);
    }
  }, [refreshFirebaseIdentity, syncProfileVerificationData]);

  const buildPayload = useCallback(() => ({
    avatar_id: selectedAvatarId,
    show_phone: showPhone, show_email: showEmail, show_whatsapp: showWhatsapp, show_viber: showViber,
    whatsapp_number: whatsappNumber, viber_number: viberNumber, preferred_contact_method: preferredContact,
    business_hours: businessHours, response_time: responseTime, accepts_offers: acceptsOffers,
    auto_reply_enabled: autoReplyEnabled, auto_reply_message: autoReplyMessage,
    vacation_mode: vacationMode, vacation_message: vacationMessage,
    vacation_start_date: vacationStartDate, vacation_end_date: vacationEndDate, vacation_auto_activate: vacationAutoActivate,
    business_description: businessDescription, return_policy: returnPolicy, shipping_info: shippingInfo,
    social_facebook: socialFacebook, social_instagram: socialInstagram, social_tiktok: socialTiktok,
    social_youtube: socialYoutube, social_website: socialWebsite,
    card_preferences: normalizedCardPreferences,
  }), [selectedAvatarId, showPhone, showEmail, showWhatsapp, showViber, whatsappNumber, viberNumber, preferredContact,
      businessHours, responseTime, acceptsOffers, autoReplyEnabled, autoReplyMessage, vacationMode,
      vacationMessage, vacationStartDate, vacationEndDate, vacationAutoActivate, businessDescription,
      returnPolicy, shippingInfo, socialFacebook, socialInstagram, socialTiktok, socialYoutube,
      socialWebsite, normalizedCardPreferences]);

  const hasChanges = useMemo(() => {
    if (!initialPayloadStr) return false;
    return stableStringify(buildPayload()) !== initialPayloadStr;
  }, [buildPayload, initialPayloadStr]);

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

  const normalizeVerificationStatus = (res) => {
    // axios response ili već "data" objekat
    const payload = res?.data ?? res;
  
    // backend kod tebe koristi error=true kad nije aplicirano
    if (payload?.error === true) return "not applied";
  
    // podrži oba formata:
    // 1) payload.status
    // 2) payload.data.status (kao u tvom logu)
    // 3) payload.data.data.status (neki drugi backendi)
    const raw =
      payload?.status ??
      payload?.data?.status ??
      payload?.data?.data?.status;
  
    const s = String(raw || "").trim().toLowerCase();
  
    if (["approved", "pending", "submitted", "resubmitted", "rejected"].includes(s)) return s;
  
    return "not applied";
  };
  
  

  const fetchSettings = useCallback(async () => {
    const getFn = pickFn(sellerSettingsApi, ["getSettings", "get"]);
    if (!getFn) { setIsLoading(false); setLoadError("API nije dostupan."); return; }

    try {
      setIsLoading(true); setLoadError("");
      
      // Fetch both settings and verification status
      const [response, verificationRes, membershipRes] = await Promise.all([
        withTimeout(getFn(), 15000),
        getVerificationStatusApi.getVerificationStatus().catch(() => ({ error: true })),
        membershipApi.getUserMembership({}).catch(() => null),
      ]);
      
      setVerificationStatus(normalizeVerificationStatus(verificationRes));

      const membershipPayload = membershipRes?.data?.data || membershipRes?.data || null;
      const settingsPayload = response?.data?.data || null;
      const normalizedMembership =
        normalizeMembershipSource(membershipPayload) ||
        normalizeMembershipSource(settingsPayload);

      if (normalizedMembership && isMountedRef.current) {
        setMembershipContext(normalizedMembership);
      }
      

      
      
      if (response?.data?.error !== false || !response?.data?.data) { setLoadError(response?.data?.message || "Greška."); return; }

      const s = response.data.data;
      setSelectedAvatarId(s.avatar_id || "");
      setShowPhone(toBool(s.show_phone, true));
      setShowEmail(toBool(s.show_email, true));
      setShowWhatsapp(toBool(s.show_whatsapp, false));
      setShowViber(toBool(s.show_viber, false));
      setWhatsappNumber(s.whatsapp_number || "");
      setViberNumber(s.viber_number || "");
      setPreferredContact(s.preferred_contact_method || "message");
      setBusinessHours(normalizeBusinessHours(s.business_hours));
      setResponseTime(s.response_time || "auto");
      setAcceptsOffers(toBool(s.accepts_offers, true));
      setAutoReplyEnabled(toBool(s.auto_reply_enabled, false));
      setAutoReplyMessage(s.auto_reply_message || "Hvala na poruci!");
      setVacationMode(toBool(s.vacation_mode, false));
      setVacationMessage(s.vacation_message || "Na odmoru sam.");
      setVacationStartDate(s.vacation_start_date || "");
      setVacationEndDate(s.vacation_end_date || "");
      setVacationAutoActivate(toBool(s.vacation_auto_activate, false));
      setBusinessDescription(s.business_description || "");
      setReturnPolicy(s.return_policy || "");
      setShippingInfo(s.shipping_info || "");
      setSocialFacebook(s.social_facebook || "");
      setSocialInstagram(s.social_instagram || "");
      setSocialTiktok(s.social_tiktok || "");
      setSocialYoutube(s.social_youtube || "");
      setSocialWebsite(s.social_website || "");
      const normalizedPrefs = normalizeCardPreferences(s.card_preferences);
      setCardPreferences(normalizedPrefs);

      setInitialPayloadStr(stableStringify({
        avatar_id: s.avatar_id || "",
        show_phone: toBool(s.show_phone, true), show_email: toBool(s.show_email, true),
        show_whatsapp: toBool(s.show_whatsapp, false), show_viber: toBool(s.show_viber, false),
        whatsapp_number: s.whatsapp_number || "", viber_number: s.viber_number || "",
        preferred_contact_method: s.preferred_contact_method || "message",
        business_hours: normalizeBusinessHours(s.business_hours),
        response_time: s.response_time || "auto", accepts_offers: toBool(s.accepts_offers, true),
        auto_reply_enabled: toBool(s.auto_reply_enabled, false),
        auto_reply_message: s.auto_reply_message || "Hvala na poruci!",
        vacation_mode: toBool(s.vacation_mode, false), vacation_message: s.vacation_message || "Na odmoru sam.",
        vacation_start_date: s.vacation_start_date || "", vacation_end_date: s.vacation_end_date || "",
        vacation_auto_activate: toBool(s.vacation_auto_activate, false),
        business_description: s.business_description || "", return_policy: s.return_policy || "",
        shipping_info: s.shipping_info || "", social_facebook: s.social_facebook || "",
        social_instagram: s.social_instagram || "", social_tiktok: s.social_tiktok || "",
        social_youtube: s.social_youtube || "", social_website: s.social_website || "",
        card_preferences: normalizedPrefs,
      }));
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
        setInitialPayloadStr(stableStringify(payload));
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
        auth_token: authToken || undefined,
      }), 20000);

      if (response?.data?.error === false) {
        toast.success("Slika ažurirana!");
        setIsAvatarModalOpen(false);
        setSelectedAvatarId("");
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
  const previewSettings = { ...buildPayload(), verification_status: verificationStatus };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Postavke prodavača</h2>
            <MembershipBadge tier={resolvedMembership.tier} size="xs" uppercase={false} />
            <VerificationBadge status={verificationStatus} />
          </div>
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
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  {previewImage ? (
                    <img src={previewImage} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-slate-400" />
                  )}
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
                      <DialogHeader className="sr-only">
                        <DialogTitle>Avatar studio</DialogTitle>
                        <DialogDescription>Kreiranje profilne slike u avatar studiju.</DialogDescription>
                      </DialogHeader>
                      <LmxAvatarGenerator onSave={updateProfileImage} onCancel={() => setIsAvatarModalOpen(false)} isSaving={isAvatarUploading} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </SettingSection>

          <SettingSection
            icon={Shield}
            title="Verifikacija računa"
            description="Potvrda e-maila i broja telefona za sigurniji profil i veću vjerodostojnost."
            badge="SIGURNOST"
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Stanje verifikacije</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      isPhoneVerified && isEmailVerified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {isPhoneVerified && isEmailVerified ? "Potpuno verificirano" : "Djelimično verificirano"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {registeredViaPhone
                    ? "Nalog je registrovan putem broja telefona. Telefon je automatski tretiran kao verificiran."
                    : "Nalog koristi e-mail pristup. Za puni status preporučeno je potvrditi i e-mail i broj telefona."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">Verifikacija broja telefona</h4>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        isPhoneVerified
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {isPhoneVerified ? "Verificiran" : "Nije verificiran"}
                    </span>
                  </div>

                  {isPhoneVerified ? (
                    <p className="text-xs text-slate-600">
                      Broj je potvrđen. Trenutno povezan broj:{" "}
                      <span className="font-semibold text-slate-900">
                        {firebaseIdentity?.phoneNumber ||
                          (phoneLocalNumber ? `+${digitsOnly(phoneCountryCode)}${digitsOnly(phoneLocalNumber)}` : "nije dostupan")}
                      </span>
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      <p className="text-xs text-slate-600">
                        Unesi broj koji želiš potvrditi i pošalji OTP kod.
                      </p>
                      <div className="grid grid-cols-[110px_1fr] gap-2">
                        <Input
                          value={phoneCountryCode}
                          onChange={(e) => setPhoneCountryCode(digitsOnly(e.target.value))}
                          className="h-9 text-sm"
                          placeholder="387"
                        />
                        <Input
                          value={phoneLocalNumber}
                          onChange={(e) => setPhoneLocalNumber(digitsOnly(e.target.value))}
                          className="h-9 text-sm"
                          placeholder="603342996"
                        />
                      </div>
                      <Input
                        value={phoneRegionCode}
                        onChange={(e) => setPhoneRegionCode(String(e.target.value || "").toUpperCase())}
                        className="h-9 text-sm"
                        placeholder="BA"
                        maxLength={3}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSendPhoneVerificationOtp}
                          disabled={phoneOtpSending || phoneOtpTimer > 0}
                          className="h-9"
                        >
                          {phoneOtpSending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Pošalji OTP"
                          )}
                        </Button>
                        {phoneOtpTimer > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            Ponovno slanje za {phoneOtpTimer}s
                          </span>
                        ) : null}
                      </div>

                      {phoneVerificationId ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                          <Input
                            value={phoneOtp}
                            onChange={(e) => setPhoneOtp(e.target.value)}
                            className="h-9 text-sm"
                            placeholder="Unesi OTP kod"
                            maxLength={6}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleVerifyPhoneOtp}
                            disabled={phoneOtpVerifying}
                            className="h-9"
                          >
                            {phoneOtpVerifying ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Potvrdi kod"
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">Verifikacija e-mail adrese</h4>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        isEmailVerified
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {isEmailVerified ? "Verificiran" : "Nije verificiran"}
                    </span>
                  </div>

                  {hasEmailIdentity ? (
                    <div className="space-y-2.5">
                      <p className="text-xs text-slate-600">
                        Trenutni e-mail:{" "}
                        <span className="font-semibold text-slate-900">
                          {firebaseIdentity?.email || currentUser?.email}
                        </span>
                      </p>

                      {isEmailVerified ? (
                        <p className="text-xs text-emerald-700">
                          E-mail adresa je potvrđena i spremna za sigurnosne akcije.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={handleSendEmailVerificationNow}
                            disabled={emailVerificationSending}
                          >
                            {emailVerificationSending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Pošalji verifikacijski link"
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-9"
                            onClick={handleRefreshEmailVerification}
                            disabled={emailVerificationRefreshing}
                          >
                            {emailVerificationRefreshing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Provjeri status"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">
                      Nema povezane e-mail adrese na aktivnoj sesiji. Dodaj e-mail u osnovnim podacima pa pokreni verifikaciju.
                    </p>
                  )}
                </div>
              </div>

              <div id={SELLER_RECAPTCHA_CONTAINER_ID} className="hidden" />
            </div>
          </SettingSection>

          {/* Card Preferences - NEW */}
          <SettingSection icon={LayoutGrid} title="Prikaz kartice" description="Šta se prikazuje kupcima" badge="NOVO">
            <CardPreferencesSection cardPreferences={cardPreferences} setCardPreferences={setCardPreferences} />
          </SettingSection>

          <SettingSection
            icon={Settings2}
            title="Filteri na stranici prodavača"
            description="Kontroliši filtere koje kupci vide na tvojim oglasima"
            badge="PRO/SHOP"
          >
            <BuyerFiltersSection
              cardPreferences={cardPreferences}
              setCardPreferences={setCardPreferences}
              isProOrShop={isProOrShop}
            />
          </SettingSection>

          <SettingSection
            icon={Sparkles}
            title="LMX članstvo i premium alati"
            description="Promotivni režim i pristup svim naprednim funkcionalnostima"
            defaultOpen={false}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                <span className="text-xs font-medium text-slate-600">Trenutni paket</span>
                {isPromoMode ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
                    Promo: sve otključano
                  </span>
                ) : (
                  <MembershipBadge tier={resolvedMembership.tier} size="sm" uppercase={false} />
                )}
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {PROMO_HEADLINE}
                </p>
                <p className="mt-1 text-xs text-emerald-700/90 dark:text-emerald-200/90">
                  {PROMO_SUBHEAD}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PROMO_BENEFITS.map((benefit) => (
                    <span
                      key={benefit}
                      className="rounded-full border border-emerald-300/70 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-slate-900/60 dark:text-emerald-200"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-500">
                U promotivnom režimu svi alati su dostupni bez ograničenja. Iskoristite naprednu statistiku, zalihe, filtere i operativne opcije bez dodatnih troškova.
              </p>
            </div>
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
          <PreviewPanel
            previewSeller={previewSeller}
            previewSettings={previewSettings}
            businessHours={businessHours}
            businessDescription={businessDescription}
            shippingInfo={shippingInfo}
            returnPolicy={returnPolicy}
            responseTime={responseTime}
            vacationMode={vacationMode}
            vacationMessage={vacationMessage}
            socialFacebook={socialFacebook}
            socialInstagram={socialInstagram}
            socialWebsite={socialWebsite}
            verificationStatus={verificationStatus}
            cardPreferences={normalizedCardPreferences}
            membershipTier={resolvedMembership.tier}
          />

          {/* Tips */}
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Savjeti</h4>
                <ul className="text-xs text-slate-600 mt-2 space-y-1">
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-primary mt-0.5" />Brzi odgovori = 3x više prodaje</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-primary mt-0.5" />Dobra slika = 50% više upita</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-primary mt-0.5" />Više kontakt opcija = bolje</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SellerSettings;
