"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

// Lucide Icons
import {
  AlertCircle,
  Calendar,
  Camera,
  ChevronDown,
  Clock,
  Download,
  Eye,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Store,
  Users,
  Zap,
  CheckCircle2,
  MapPin,
  Link as LinkIcon,
  Video,
  Music,
  QrCode,
  Share2,
  Copy,
  Loader2,
  Plane,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { sellerSettingsApi, updateProfileApi } from "@/utils/api";
import { userSignUpData, userUpdateData } from "@/redux/reducer/authSlice";

import LmxAvatarGenerator from "@/components/Avatar/LmxAvatarGenerator";
import { MinimalSellerCard } from "@/components/PagesComponent/Seller/MinimalSellerCard";

// ============================================
// CONSTANTS
// ============================================
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABEL = {
  monday: "Ponedjeljak",
  tuesday: "Utorak",
  wednesday: "Srijeda",
  thursday: "Četvrtak",
  friday: "Petak",
  saturday: "Subota",
  sunday: "Nedjelja",
};

const defaultBusinessHours = {
  monday: { open: "09:00", close: "17:00", enabled: true },
  tuesday: { open: "09:00", close: "17:00", enabled: true },
  wednesday: { open: "09:00", close: "17:00", enabled: true },
  thursday: { open: "09:00", close: "17:00", enabled: true },
  friday: { open: "09:00", close: "17:00", enabled: true },
  saturday: { open: "09:00", close: "13:00", enabled: false },
  sunday: { open: "09:00", close: "13:00", enabled: false },
};

// ============================================
// HELPERS
// ============================================
function normalizeBusinessHours(raw) {
  let obj = raw;
  if (typeof obj === "string") {
    try { obj = JSON.parse(obj); } catch { obj = null; }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) obj = {};
  const out = {};
  for (const day of DAYS) {
    const base = defaultBusinessHours[day];
    const d = obj?.[day] && typeof obj[day] === "object" ? obj[day] : {};
    out[day] = {
      open: typeof d.open === "string" ? d.open : base.open,
      close: typeof d.close === "string" ? d.close : base.close,
      enabled: typeof d.enabled === "boolean" ? d.enabled : base.enabled,
    };
  }
  return out;
}

function safeUrl(u) {
  if (!u) return true;
  try {
    const value = u.startsWith("http") ? u : `https://${u}`;
    new URL(value);
    return true;
  } catch { return false; }
}

function normalizePhone(p) {
  return (p || "").replace(/\s+/g, "").trim();
}

function stableStringify(value) {
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
}

const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
  ]);

const pickFn = (obj, names) => names.map((n) => obj?.[n]).find((v) => typeof v === "function");

// ============================================
// UI COMPONENTS
// ============================================

const SettingSection = ({ icon: Icon, title, description, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-2 border-t border-slate-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToggleRow = ({ title, description, checked, onCheckedChange, icon: Icon, disabled }) => (
  <div className={cn(
    "flex items-start justify-between gap-3 p-3 rounded-lg border transition-all",
    checked ? "border-primary/20 bg-primary/5" : "border-slate-100 bg-slate-50/50",
    disabled && "opacity-50"
  )}>
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

// ============================================
// QR CODE COMPONENT
// ============================================
const QRCodeSection = ({ userId, userName }) => {
  const profileUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/seller/${userId}` 
    : `/seller/${userId}`;
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
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Link kopiran u clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Greška pri kopiranju");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div 
          ref={qrRef}
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
        >
          <QRCodeSVG
            value={profileUrl}
            size={140}
            level="H"
            includeMargin={true}
            fgColor="#0F172A"
          />
        </div>
        
        <div className="flex-1 space-y-3">
          <p className="text-sm text-slate-600">
            Skeniraj QR kod da brzo pristupiš svom profilu prodavača. 
            Idealno za vizit kartice ili promotivne materijale.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQR}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Preuzmi QR
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="text-xs"
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-1.5" />
              )}
              {copied ? "Kopirano!" : "Kopiraj link"}
            </Button>
          </div>
          
          <div className="p-2 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 break-all">{profileUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// VACATION MODE SECTION
// ============================================
const VacationModeSection = ({
  vacationMode,
  setVacationMode,
  vacationMessage,
  setVacationMessage,
  vacationStartDate,
  setVacationStartDate,
  vacationEndDate,
  setVacationEndDate,
  vacationAutoActivate,
  setVacationAutoActivate,
  errors,
  submitAttempted,
}) => {
  const today = format(new Date(), "yyyy-MM-dd");
  
  return (
    <div className="space-y-4">
      <ToggleRow
        title="Aktiviraj odmor"
        description="Kupci će vidjeti da trenutno nisi dostupan"
        icon={Plane}
        checked={vacationMode}
        onCheckedChange={setVacationMode}
      />
      
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
        <ToggleRow
          title="Automatska aktivacija"
          description="Automatski uključi/isključi odmor prema datumima"
          icon={Calendar}
          checked={vacationAutoActivate}
          onCheckedChange={setVacationAutoActivate}
        />
        
        {vacationAutoActivate && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Početak odmora</Label>
              <Input
                type="date"
                value={vacationStartDate || ""}
                onChange={(e) => setVacationStartDate(e.target.value)}
                min={today}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Kraj odmora</Label>
              <Input
                type="date"
                value={vacationEndDate || ""}
                onChange={(e) => setVacationEndDate(e.target.value)}
                min={vacationStartDate || today}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}
        
        {vacationAutoActivate && vacationStartDate && vacationEndDate && (
          <p className="text-xs text-primary bg-primary/5 p-2 rounded-lg">
            Odmor će se automatski aktivirati {format(new Date(vacationStartDate), "dd.MM.yyyy")} 
            {" "}i deaktivirati {format(new Date(vacationEndDate), "dd.MM.yyyy")}.
          </p>
        )}
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-xs text-slate-600">Poruka za kupce</Label>
        <Textarea
          className={cn(
            "min-h-[80px] text-sm",
            submitAttempted && errors.vacationMessage && "border-red-300"
          )}
          value={vacationMessage}
          onChange={(e) => setVacationMessage(e.target.value)}
          placeholder="Npr. Trenutno sam na odmoru. Vratit ću se 15.02.2024."
        />
        {errors.vacationMessage && (
          <p className="text-xs text-red-600">{errors.vacationMessage}</p>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const SellerSettings = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(userSignUpData);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Avatar
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Contact toggles
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
  const [autoReplyMessage, setAutoReplyMessage] = useState(
    "Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku."
  );

  // Vacation
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationMessage, setVacationMessage] = useState("Trenutno sam na odmoru. Vratit ću se uskoro!");
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

  const initialPayloadRef = useRef(null);

  useEffect(() => {
    if (currentUser?.profile_image) setPreviewImage(currentUser.profile_image);
    if (currentUser?.profile) setPreviewImage(currentUser.profile);
  }, [currentUser]);

  const responseTimeOptions = [
    { value: "auto", label: "Automatski" },
    { value: "instant", label: "Par minuta" },
    { value: "few_hours", label: "Par sati" },
    { value: "same_day", label: "24 sata" },
    { value: "few_days", label: "Par dana" },
  ];

  const buildPayload = useCallback(() => ({
    show_phone: showPhone,
    show_email: showEmail,
    show_whatsapp: showWhatsapp,
    show_viber: showViber,
    whatsapp_number: whatsappNumber,
    viber_number: viberNumber,
    preferred_contact_method: preferredContact,
    business_hours: businessHours,
    response_time: responseTime,
    accepts_offers: acceptsOffers,
    auto_reply_enabled: autoReplyEnabled,
    auto_reply_message: autoReplyMessage,
    vacation_mode: vacationMode,
    vacation_message: vacationMessage,
    vacation_start_date: vacationStartDate,
    vacation_end_date: vacationEndDate,
    vacation_auto_activate: vacationAutoActivate,
    business_description: businessDescription,
    return_policy: returnPolicy,
    shipping_info: shippingInfo,
    social_facebook: socialFacebook,
    social_instagram: socialInstagram,
    social_tiktok: socialTiktok,
    social_youtube: socialYoutube,
    social_website: socialWebsite,
  }), [
    showPhone, showEmail, showWhatsapp, showViber, whatsappNumber, viberNumber,
    preferredContact, businessHours, responseTime, acceptsOffers,
    autoReplyEnabled, autoReplyMessage, vacationMode, vacationMessage,
    vacationStartDate, vacationEndDate, vacationAutoActivate,
    businessDescription, returnPolicy, shippingInfo,
    socialFacebook, socialInstagram, socialTiktok, socialYoutube, socialWebsite,
  ]);

  const hasChanges = useMemo(() => {
    if (!initialPayloadRef.current) return false;
    return stableStringify(buildPayload()) !== initialPayloadRef.current;
  }, [buildPayload]);

  const errors = useMemo(() => {
    const e = {};
    const w = normalizePhone(whatsappNumber);
    const v = normalizePhone(viberNumber);

    if (showWhatsapp && w.length > 0 && w.length < 6) e.whatsappNumber = "Unesite ispravan WhatsApp broj.";
    if (showViber && v.length > 0 && v.length < 6) e.viberNumber = "Unesite ispravan Viber broj.";

    if (socialFacebook && !safeUrl(socialFacebook)) e.socialFacebook = "Unesite ispravan link.";
    if (socialInstagram && !safeUrl(socialInstagram)) e.socialInstagram = "Unesite ispravan link.";
    if (socialTiktok && !safeUrl(socialTiktok)) e.socialTiktok = "Unesite ispravan link.";
    if (socialYoutube && !safeUrl(socialYoutube)) e.socialYoutube = "Unesite ispravan link.";
    if (socialWebsite && !safeUrl(socialWebsite)) e.socialWebsite = "Unesite ispravan link.";

    if (autoReplyEnabled && autoReplyMessage.trim().length < 3) e.autoReplyMessage = "Poruka je prekratka.";
    if ((vacationMode || vacationAutoActivate) && vacationMessage.trim().length < 3) e.vacationMessage = "Poruka je prekratka.";

    return e;
  }, [
    showWhatsapp, whatsappNumber, showViber, viberNumber,
    socialFacebook, socialInstagram, socialTiktok, socialYoutube, socialWebsite,
    autoReplyEnabled, autoReplyMessage, vacationMode, vacationAutoActivate, vacationMessage,
  ]);

  const isValid = Object.keys(errors).length === 0;

  const fetchSettings = useCallback(async () => {
    const getFn = pickFn(sellerSettingsApi, ["getSettings", "getSellerSettings", "get", "fetchSettings"]);
    if (!getFn) {
      setIsLoading(false);
      setLoadError("API metoda nije pronađena.");
      return;
    }

    try {
      setIsLoading(true);
      setLoadError("");
      const response = await withTimeout(getFn(), 15000);

      const ok = response?.data?.error === false && response?.data?.data;
      if (!ok) {
        setLoadError(response?.data?.message || "Greška pri dohvaćanju.");
        return;
      }

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
      setAutoReplyMessage(s.auto_reply_message || "Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku.");

      setVacationMode(s.vacation_mode ?? false);
      setVacationMessage(s.vacation_message || "Trenutno sam na odmoru. Vratit ću se uskoro!");
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

      initialPayloadRef.current = stableStringify({
        show_phone: s.show_phone ?? true,
        show_email: s.show_email ?? true,
        show_whatsapp: s.show_whatsapp ?? false,
        show_viber: s.show_viber ?? false,
        whatsapp_number: s.whatsapp_number || "",
        viber_number: s.viber_number || "",
        preferred_contact_method: s.preferred_contact_method || "message",
        business_hours: normalizeBusinessHours(s.business_hours),
        response_time: s.response_time || "auto",
        accepts_offers: s.accepts_offers ?? true,
        auto_reply_enabled: s.auto_reply_enabled ?? false,
        auto_reply_message: s.auto_reply_message || "Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku.",
        vacation_mode: s.vacation_mode ?? false,
        vacation_message: s.vacation_message || "Trenutno sam na odmoru. Vratit ću se uskoro!",
        vacation_start_date: s.vacation_start_date || "",
        vacation_end_date: s.vacation_end_date || "",
        vacation_auto_activate: s.vacation_auto_activate ?? false,
        business_description: s.business_description || "",
        return_policy: s.return_policy || "",
        shipping_info: s.shipping_info || "",
        social_facebook: s.social_facebook || "",
        social_instagram: s.social_instagram || "",
        social_tiktok: s.social_tiktok || "",
        social_youtube: s.social_youtube || "",
        social_website: s.social_website || "",
      });
    } catch (err) {
      console.error(err);
      setLoadError(err?.message === "TIMEOUT" ? "Server ne odgovara (timeout)." : "Greška pri dohvaćanju.");
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSubmitAttempted(true);
    if (!isValid) {
      toast.error("Provjerite polja.");
      return;
    }
    if (!hasChanges) return;

    const updateFn = pickFn(sellerSettingsApi, ["updateSettings", "update", "saveSettings", "setSettings"]);
    if (!updateFn) {
      toast.error("API metoda nije pronađena.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = buildPayload();
      const response = await withTimeout(updateFn(payload), 15000);

      if (response?.data?.error === false) {
        initialPayloadRef.current = stableStringify(payload);
        toast.success("Postavke su uspješno sačuvane!");
      } else {
        toast.error(response?.data?.message || "Greška pri spremanju.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message === "TIMEOUT" ? "Server ne odgovara. Pokušajte ponovo." : "Greška pri spremanju.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    await fetchSettings();
    toast.message("Vraćeno na zadnje sačuvano stanje.");
  };

  const updateProfileImage = async (fileOrBlob) => {
    if (!fileOrBlob) return;

    const objectUrl = URL.createObjectURL(fileOrBlob);
    setPreviewImage(objectUrl);
    setIsAvatarUploading(true);

    try {
      const response = await withTimeout(
        updateProfileApi.updateProfile({
          profile: fileOrBlob,
          name: currentUser?.name,
          mobile: currentUser?.mobile,
          email: currentUser?.email,
          notification: currentUser?.notification ?? 0,
          show_personal_details: currentUser?.show_personal_details ?? 0,
          country_code: currentUser?.country_code,
        }),
        20000
      );

      if (response?.data?.error === false) {
        toast.success("Profilna slika je uspješno ažurirana!");
        setIsAvatarModalOpen(false);
        dispatch(userUpdateData({ data: response.data.data }));
      } else {
        toast.error(response?.data?.message || "Greška pri uploadu slike.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.message === "TIMEOUT" ? "Server ne odgovara." : "Greška pri uploadu slike.");
    } finally {
      setIsAvatarUploading(false);
      try { URL.revokeObjectURL(objectUrl); } catch {}
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) updateProfileImage(file);
  };

  const setDay = (day, patch) => {
    setBusinessHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const copyWeekdays = () => {
    setBusinessHours((prev) => {
      const base = prev.monday;
      return {
        ...prev,
        tuesday: { ...prev.tuesday, open: base.open, close: base.close, enabled: base.enabled },
        wednesday: { ...prev.wednesday, open: base.open, close: base.close, enabled: base.enabled },
        thursday: { ...prev.thursday, open: base.open, close: base.close, enabled: base.enabled },
        friday: { ...prev.friday, open: base.open, close: base.close, enabled: base.enabled },
      };
    });
    toast.message("Kopirano s ponedjeljka na ostale radne dane.");
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-slate-600">Učitavanje postavki...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Greška pri učitavanju</p>
            <p className="text-xs text-red-600 mt-1">{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSettings}
              className="mt-3 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Pokušaj ponovo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const previewSeller = { ...currentUser, profile: previewImage || currentUser?.profile_image || currentUser?.profile };
  const previewSettings = buildPayload();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Postavke prodavača</h2>
          <p className="text-sm text-slate-500">Podešavanja kako kupci vide tvoj profil</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving || isAvatarUploading}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Poništi
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isAvatarUploading || !hasChanges || !isValid}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            Sačuvaj
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      {hasChanges && isValid && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Imate nesačuvane promjene
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Left: Settings */}
        <div className="space-y-4">
          {/* Profile Image */}
          <SettingSection icon={Camera} title="Profilna slika" description="Slika koju kupci vide">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                {previewImage ? (
                  <img src={previewImage} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-xs text-slate-400">Nema</div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAvatarUploading}
                  >
                    <Camera className="w-3.5 h-3.5 mr-1.5" />
                    Učitaj
                  </Button>

                  <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isAvatarUploading}>
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Studio
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                      <LmxAvatarGenerator
                        onSave={updateProfileImage}
                        onCancel={() => setIsAvatarModalOpen(false)}
                        isSaving={isAvatarUploading}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </SettingSection>

          {/* QR Code */}
          <SettingSection icon={QrCode} title="QR kod profila" description="Za vizit kartice i promociju">
            <QRCodeSection userId={currentUser?.id} userName={currentUser?.name} />
          </SettingSection>

          {/* Contact Options */}
          <SettingSection icon={Phone} title="Kontakt opcije" description="Kako te kupci mogu kontaktirati">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <ToggleRow title="Telefon" icon={Phone} checked={showPhone} onCheckedChange={setShowPhone} />
                <ToggleRow title="Email" icon={Mail} checked={showEmail} onCheckedChange={setShowEmail} />
                <ToggleRow title="WhatsApp" icon={MessageCircle} checked={showWhatsapp} onCheckedChange={setShowWhatsapp} />
                <ToggleRow title="Viber" icon={Phone} checked={showViber} onCheckedChange={setShowViber} />
              </div>

              {(showWhatsapp || showViber) && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {showWhatsapp && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-600">WhatsApp broj</Label>
                      <Input
                        className={cn("h-9 text-sm", submitAttempted && errors.whatsappNumber && "border-red-300")}
                        placeholder="+38761234567"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                      />
                      {errors.whatsappNumber && <p className="text-xs text-red-600">{errors.whatsappNumber}</p>}
                    </div>
                  )}
                  {showViber && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-600">Viber broj</Label>
                      <Input
                        className={cn("h-9 text-sm", submitAttempted && errors.viberNumber && "border-red-300")}
                        placeholder="+38761234567"
                        value={viberNumber}
                        onChange={(e) => setViberNumber(e.target.value)}
                      />
                      {errors.viberNumber && <p className="text-xs text-red-600">{errors.viberNumber}</p>}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <Label className="text-xs text-slate-600 mb-2 block">Preferirani način kontakta</Label>
                <div className="flex flex-wrap gap-2">
                  {["message", "phone", "whatsapp", "viber", "email"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPreferredContact(v)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        preferredContact === v
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      {v === "message" ? "Poruka" : v === "phone" ? "Poziv" : v === "whatsapp" ? "WhatsApp" : v === "viber" ? "Viber" : "Email"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SettingSection>

          {/* Vacation Mode */}
          <SettingSection icon={Plane} title="Odmor / Pauza" description="Auto-aktivacija i deaktivacija" defaultOpen={false}>
            <VacationModeSection
              vacationMode={vacationMode}
              setVacationMode={setVacationMode}
              vacationMessage={vacationMessage}
              setVacationMessage={setVacationMessage}
              vacationStartDate={vacationStartDate}
              setVacationStartDate={setVacationStartDate}
              vacationEndDate={vacationEndDate}
              setVacationEndDate={setVacationEndDate}
              vacationAutoActivate={vacationAutoActivate}
              setVacationAutoActivate={setVacationAutoActivate}
              errors={errors}
              submitAttempted={submitAttempted}
            />
          </SettingSection>

          {/* Auto Reply */}
          <SettingSection icon={MessageCircle} title="Automatski odgovor" description="Poruka koja se šalje automatski" defaultOpen={false}>
            <div className="space-y-3">
              <ToggleRow
                title="Uključi automatski odgovor"
                description="Automatska poruka se šalje kupcu čim ti napiše poruku"
                icon={MessageCircle}
                checked={autoReplyEnabled}
                onCheckedChange={setAutoReplyEnabled}
              />
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Poruka automatskog odgovora</Label>
                <Textarea
                  className={cn("min-h-[80px] text-sm", submitAttempted && errors.autoReplyMessage && "border-red-300")}
                  value={autoReplyMessage}
                  onChange={(e) => setAutoReplyMessage(e.target.value)}
                  disabled={!autoReplyEnabled}
                />
                {errors.autoReplyMessage && <p className="text-xs text-red-600">{errors.autoReplyMessage}</p>}
              </div>
            </div>
          </SettingSection>

          {/* Business Hours */}
          <SettingSection icon={Clock} title="Radno vrijeme" description="Kada si dostupan" defaultOpen={false}>
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs text-slate-600">Vrijeme odgovora</Label>
                <div className="flex gap-1">
                  {responseTimeOptions.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setResponseTime(o.value)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-all",
                        responseTime === o.value
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-600">Radno vrijeme po danima</Label>
                <Button variant="ghost" size="sm" onClick={copyWeekdays} className="text-xs h-7">
                  Kopiraj pon. na sve
                </Button>
              </div>

              <div className="space-y-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className={cn(
                      "rounded-lg border p-3 transition-all",
                      businessHours?.[day]?.enabled
                        ? "border-primary/20 bg-primary/5"
                        : "border-slate-100 bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={businessHours?.[day]?.enabled}
                          onCheckedChange={(v) => setDay(day, { enabled: v })}
                        />
                        <span className="text-sm font-medium text-slate-900 w-24">{DAY_LABEL[day]}</span>
                      </div>

                      {businessHours?.[day]?.enabled && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            className="h-8 w-24 text-xs"
                            value={businessHours?.[day]?.open || "09:00"}
                            onChange={(e) => setDay(day, { open: e.target.value })}
                          />
                          <span className="text-slate-400">-</span>
                          <Input
                            type="time"
                            className="h-8 w-24 text-xs"
                            value={businessHours?.[day]?.close || "17:00"}
                            onChange={(e) => setDay(day, { close: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <ToggleRow
                title="Primam ponude"
                description="Kupci mogu slati cjenovne ponude"
                icon={Shield}
                checked={acceptsOffers}
                onCheckedChange={setAcceptsOffers}
              />
            </div>
          </SettingSection>

          {/* Business Info */}
          <SettingSection icon={Store} title="Informacije za kupce" description="O tebi i tvojoj djelatnosti" defaultOpen={false}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">O meni / Opis djelatnosti</Label>
                <Textarea
                  className="min-h-[80px] text-sm"
                  placeholder="Napiši kratko ko si, šta prodaješ..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Informacije o dostavi</Label>
                <Textarea
                  className="min-h-[60px] text-sm"
                  placeholder="Kako šalješ, rokovi isporuke..."
                  value={shippingInfo}
                  onChange={(e) => setShippingInfo(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Povrat i reklamacije</Label>
                <Textarea
                  className="min-h-[60px] text-sm"
                  placeholder="Uslovi povrata, garancija..."
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                />
              </div>
            </div>
          </SettingSection>

          {/* Social Links */}
          <SettingSection icon={Globe} title="Društvene mreže" description="Tvoji profili na mrežama" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" /> Facebook
                </Label>
                <Input
                  className={cn("h-9 text-sm", submitAttempted && errors.socialFacebook && "border-red-300")}
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  placeholder="facebook.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-pink-500" /> Instagram
                </Label>
                <Input
                  className={cn("h-9 text-sm", submitAttempted && errors.socialInstagram && "border-red-300")}
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="instagram.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" /> TikTok
                </Label>
                <Input
                  className={cn("h-9 text-sm", submitAttempted && errors.socialTiktok && "border-red-300")}
                  value={socialTiktok}
                  onChange={(e) => setSocialTiktok(e.target.value)}
                  placeholder="tiktok.com/@..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-red-500" /> YouTube
                </Label>
                <Input
                  className={cn("h-9 text-sm", submitAttempted && errors.socialYoutube && "border-red-300")}
                  value={socialYoutube}
                  onChange={(e) => setSocialYoutube(e.target.value)}
                  placeholder="youtube.com/..."
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs text-slate-600 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-500" /> Web stranica
                </Label>
                <Input
                  className={cn("h-9 text-sm", submitAttempted && errors.socialWebsite && "border-red-300")}
                  value={socialWebsite}
                  onChange={(e) => setSocialWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </SettingSection>
        </div>

        {/* Right: Live Preview */}
        <div className="xl:sticky xl:top-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Pregled kartice</h3>
                <p className="text-xs text-slate-500">Kako te kupci vide</p>
              </div>
            </div>
            <div className="p-4">
              <MinimalSellerCard
                seller={previewSeller}
                sellerSettings={previewSettings}
                badges={[]}
                isPro={false}
                isShop={false}
                showProfileLink={false}
                onChatClick={() => toast.message("Ovo je samo prikaz.")}
                onPhoneClick={() => toast.message("Ovo je samo prikaz.")}
              />
            </div>
          </div>

          {/* Tips */}
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Savjeti za bolju prodaju</h4>
                <ul className="text-xs text-slate-600 mt-2 space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" />
                    Brzi odgovori povećavaju šansu za prodaju 3x
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" />
                    Kvalitetna slika dobija 50% više upita
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" />
                    Omogući više načina kontakta
                  </li>
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
