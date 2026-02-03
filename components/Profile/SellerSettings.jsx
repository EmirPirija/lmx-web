"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
  AlertCircle,
  Calendar,
  Camera,
  ChevronDown,
  Clock,
  Copy,
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
  Link,
  Video,
  Music,
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
import { SellerPreviewCard } from "@/components/PagesComponent/Seller/SellerDetailCard";

/* =====================
  Helperi / Utils
===================== */

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

function normalizeBusinessHours(raw) {
  let obj = raw;
  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {
      obj = null;
    }
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
  } catch {
    return false;
  }
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
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))]);

const pickFn = (obj, names) => names.map((n) => obj?.[n]).find((v) => typeof v === "function");

const ls = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

/* =====================
  UI Komponente
===================== */

const Card = ({ children, className }) => (
  <div className={cn("bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Icon size={20} className="text-slate-600" />
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

const CardBody = ({ children, className }) => <div className={cn("p-5", className)}>{children}</div>;

const Spinner = ({ className }) => (
  <RefreshCw className={cn("h-4 w-4 animate-spin", className)} />
);

const ToggleRow = ({ title, desc, checked, onCheckedChange, icon: Icon, disabled }) => (
  <div
    className={cn(
      "flex items-start justify-between gap-4 rounded-xl p-3 border transition-all",
      checked ? "border-slate-300 bg-slate-50/50" : "border-slate-200 bg-white",
      disabled && "opacity-50"
    )}
  >
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            checked ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
          )}
        >
          <Icon size={18} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        {desc && <div className="text-xs text-slate-500 mt-0.5">{desc}</div>}
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </div>
);

const Accordion = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Icon size={20} className="text-slate-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 border-t border-slate-100 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const StatusChip = ({ status, text }) => {
  const styles = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", styles[status])}>
      {status === "success" && <CheckCircle2 size={12} />}
      {status === "error" && <AlertCircle size={12} />}
      {text}
    </span>
  );
};

/* =====================
  Main Component
===================== */

const SellerSettings = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(userSignUpData);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // avatar
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // contact toggles
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [showViber, setShowViber] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [viberNumber, setViberNumber] = useState("");
  const [preferredContact, setPreferredContact] = useState("message");

  // availability / shop
  const [businessHours, setBusinessHours] = useState(defaultBusinessHours);
  const [responseTime, setResponseTime] = useState("auto");
  const [acceptsOffers, setAcceptsOffers] = useState(true);

  // auto reply / vacation
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState(
    "Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku."
  );
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationMessage, setVacationMessage] = useState("Trenutno sam na odmoru. Vratit ću se uskoro!");

  // info
  const [businessDescription, setBusinessDescription] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [shippingInfo, setShippingInfo] = useState("");

  // socials
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");

  // preview (local-only)
  const prefsKey = currentUser?.id ? `seller_card_preview_prefs_${currentUser.id}` : "seller_card_preview_prefs";
  const [previewPrefs, setPreviewPrefs] = useState({
    showRatings: true,
    showBadges: true,
    showMemberSince: true,
    showResponseTime: true,
    compactness: "normal",
    contactStyle: "inline",
  });

  const initialPayloadRef = useRef(null);

  useEffect(() => {
    const loaded = ls.get(prefsKey, null);
    if (loaded) setPreviewPrefs((p) => ({ ...p, ...loaded }));
  }, [prefsKey]);

  useEffect(() => {
    ls.set(prefsKey, previewPrefs);
  }, [prefsKey, previewPrefs]);

  useEffect(() => {
    if (currentUser?.profile_image) setPreviewImage(currentUser.profile_image);
    if (currentUser?.profile) setPreviewImage(currentUser.profile);
  }, [currentUser]);

  const responseTimeOptions = useMemo(
    () => [
      { value: "auto", label: "Automatski" },
      { value: "instant", label: "Par minuta" },
      { value: "few_hours", label: "Par sati" },
      { value: "same_day", label: "24 sata" },
      { value: "few_days", label: "Par dana" },
    ],
    []
  );

  const buildPayload = useCallback(
    () => ({
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
      business_description: businessDescription,
      return_policy: returnPolicy,
      shipping_info: shippingInfo,
      social_facebook: socialFacebook,
      social_instagram: socialInstagram,
      social_tiktok: socialTiktok,
      social_youtube: socialYoutube,
      social_website: socialWebsite,
    }),
    [
      showPhone,
      showEmail,
      showWhatsapp,
      showViber,
      whatsappNumber,
      viberNumber,
      preferredContact,
      businessHours,
      responseTime,
      acceptsOffers,
      autoReplyEnabled,
      autoReplyMessage,
      vacationMode,
      vacationMessage,
      businessDescription,
      returnPolicy,
      shippingInfo,
      socialFacebook,
      socialInstagram,
      socialTiktok,
      socialYoutube,
      socialWebsite,
    ]
  );

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
    if (vacationMode && vacationMessage.trim().length < 3) e.vacationMessage = "Poruka je prekratka.";

    return e;
  }, [
    showWhatsapp,
    whatsappNumber,
    showViber,
    viberNumber,
    socialFacebook,
    socialInstagram,
    socialTiktok,
    socialYoutube,
    socialWebsite,
    autoReplyEnabled,
    autoReplyMessage,
    vacationMode,
    vacationMessage,
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
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {}
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

  /* =====================
    Loading State
  ===================== */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-48 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
          <div className="h-[400px] rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  /* =====================
    Error State
  ===================== */

  if (loadError) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-red-100">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">Greška pri učitavanju</h3>
            <p className="text-sm text-slate-600 mt-1">{loadError}</p>
            <Button onClick={fetchSettings} variant="outline" size="sm" className="mt-4 gap-2">
              <RefreshCw size={16} /> Pokušaj ponovo
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const previewSeller = { ...currentUser, profile: previewImage || currentUser?.profile_image || currentUser?.profile };
  const previewSettings = buildPayload();

  /* =====================
    Main Render
  ===================== */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Postavke prodavača</h2>
          <p className="text-sm text-slate-500 mt-1">Podešavanja kako kupci vide tvoj profil i kako te mogu kontaktirati.</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Button onClick={handleReset} variant="outline" size="sm" disabled={isSaving || isAvatarUploading} className="gap-2">
              <RefreshCw size={16} /> Poništi
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={isSaving || isAvatarUploading || !hasChanges || !isValid}
              className="gap-2 bg-slate-900 hover:bg-slate-800"
            >
              {isSaving ? <Spinner /> : <Save size={16} />}
              Sačuvaj
            </Button>
          </div>
          <div className="text-xs">
            {!isValid && <StatusChip status="error" text="Ima grešaka u formi" />}
            {isValid && !hasChanges && <StatusChip status="info" text="Nema promjena" />}
            {isValid && hasChanges && <StatusChip status="success" text="Spremno za čuvanje" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
        {/* Left: Settings */}
        <div className="space-y-4">
          {/* Avatar */}
          <Card>
            <CardHeader icon={Camera} title="Profilna slika" subtitle="Ovo kupci vide na tvojoj kartici prodavača." />
            <CardBody>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100">
                    {previewImage ? (
                      <img src={previewImage} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Nema slike</div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" disabled={isAvatarUploading} className="gap-2">
                      <Camera size={16} /> Učitaj sliku
                    </Button>

                    <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" disabled={isAvatarUploading} className="gap-2 bg-slate-900 hover:bg-slate-800">
                          <Sparkles size={16} /> Studio avatara
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                        <LmxAvatarGenerator onSave={updateProfileImage} onCancel={() => setIsAvatarModalOpen(false)} isSaving={isAvatarUploading} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200 flex-1">
                  <strong className="text-slate-700">Savjet:</strong> Koristi jasnu sliku lica ili logo. Kvalitetna slika direktno
                  utiče na povjerenje kupaca.
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Contact */}
          <Accordion title="Kontakt opcije" icon={Phone} defaultOpen>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ToggleRow title="Telefon" desc="Prikaži broj kupcima" icon={Phone} checked={showPhone} onCheckedChange={setShowPhone} />
                <ToggleRow title="Email" desc="Prikaži email kupcima" icon={Mail} checked={showEmail} onCheckedChange={setShowEmail} />
                <ToggleRow title="WhatsApp" desc="Prikaži WhatsApp dugme" icon={MessageCircle} checked={showWhatsapp} onCheckedChange={setShowWhatsapp} />
                <ToggleRow title="Viber" desc="Prikaži Viber dugme" icon={Phone} checked={showViber} onCheckedChange={setShowViber} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">WhatsApp broj</Label>
                  <Input
                    className={cn("h-10 mt-1.5 rounded-xl", submitAttempted && errors.whatsappNumber && "border-red-300")}
                    placeholder="+38761234567"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    disabled={!showWhatsapp}
                  />
                  {errors.whatsappNumber && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.whatsappNumber}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Viber broj</Label>
                  <Input
                    className={cn("h-10 mt-1.5 rounded-xl", submitAttempted && errors.viberNumber && "border-red-300")}
                    placeholder="+38761234567"
                    value={viberNumber}
                    onChange={(e) => setViberNumber(e.target.value)}
                    disabled={!showViber}
                  />
                  {errors.viberNumber && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.viberNumber}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">Preferirani način kontakta</Label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["message", "phone", "whatsapp", "viber", "email"].map((v) => {
                    const active = preferredContact === v;
                    const label =
                      v === "message" ? "Poruka" : v === "phone" ? "Poziv" : v === "whatsapp" ? "WhatsApp" : v === "viber" ? "Viber" : "Email";
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPreferredContact(v)}
                        className={cn(
                          "h-10 rounded-xl border px-4 text-sm font-medium transition-all",
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Accordion>

          {/* Availability */}
          <Accordion title="Dostupnost i ponude" icon={Zap} defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Clock size={16} />
                  Vrijeme odgovora
                </Label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {responseTimeOptions.map((o) => {
                    const active = responseTime === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setResponseTime(o.value)}
                        className={cn(
                          "h-10 rounded-xl border px-4 text-sm font-medium transition-all",
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar size={16} />
                    Radno vrijeme
                  </Label>
                  <Button onClick={copyWeekdays} variant="outline" size="sm" className="gap-2">
                    <Copy size={14} /> Kopiraj ponedjeljak
                  </Button>
                </div>

                <div className="space-y-2">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className={cn(
                        "rounded-xl border p-3 transition-all",
                        businessHours?.[day]?.enabled
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-slate-200 bg-slate-50/50"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-slate-900 w-24">{DAY_LABEL[day]}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-xs font-medium px-2 py-1 rounded-lg",
                                businessHours?.[day]?.enabled
                                  ? "text-emerald-600 bg-emerald-100"
                                  : "text-slate-500 bg-slate-100"
                              )}
                            >
                              {businessHours?.[day]?.enabled ? "Otvoreno" : "Zatvoreno"}
                            </span>
                            <Switch checked={businessHours?.[day]?.enabled} onCheckedChange={(v) => setDay(day, { enabled: v })} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:w-[220px]">
                          <div>
                            <Label className="text-xs text-slate-500">Od</Label>
                            <Input
                              type="time"
                              className="h-9 mt-1 rounded-lg text-sm"
                              value={businessHours?.[day]?.open || "09:00"}
                              onChange={(e) => setDay(day, { open: e.target.value })}
                              disabled={!businessHours?.[day]?.enabled}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Do</Label>
                            <Input
                              type="time"
                              className="h-9 mt-1 rounded-lg text-sm"
                              value={businessHours?.[day]?.close || "17:00"}
                              onChange={(e) => setDay(day, { close: e.target.value })}
                              disabled={!businessHours?.[day]?.enabled}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ToggleRow
                title="Primam ponude"
                desc="Kupci mogu slati cjenovne ponude na tvoje proizvode"
                icon={Shield}
                checked={acceptsOffers}
                onCheckedChange={setAcceptsOffers}
              />
            </div>
          </Accordion>

          {/* Auto reply */}
          <Accordion title="Automatski odgovor" icon={MessageCircle} defaultOpen={false}>
            <div className="space-y-4">
              <ToggleRow
                title="Uključi automatski odgovor"
                desc="Automatska poruka se šalje kupcu čim ti napiše poruku"
                icon={MessageCircle}
                checked={autoReplyEnabled}
                onCheckedChange={setAutoReplyEnabled}
              />
              <div>
                <Label className="text-sm font-medium text-slate-700">Poruka automatskog odgovora</Label>
                <Textarea
                  className={cn("mt-1.5 rounded-xl min-h-[100px]", submitAttempted && errors.autoReplyMessage && "border-red-300")}
                  value={autoReplyMessage}
                  onChange={(e) => setAutoReplyMessage(e.target.value)}
                  disabled={!autoReplyEnabled}
                />
                {errors.autoReplyMessage && <p className="mt-1 text-xs text-red-600">{errors.autoReplyMessage}</p>}
              </div>
            </div>
          </Accordion>

          {/* Vacation */}
          <Accordion title="Odmor / Pauza" icon={Calendar} defaultOpen={false}>
            <div className="space-y-4">
              <ToggleRow
                title="Uključi mode odmora"
                desc="Kupci vide da trenutno nisi dostupan za brze odgovore"
                icon={Calendar}
                checked={vacationMode}
                onCheckedChange={setVacationMode}
              />
              <div>
                <Label className="text-sm font-medium text-slate-700">Poruka za kupce</Label>
                <Textarea
                  className={cn("mt-1.5 rounded-xl min-h-[100px]", submitAttempted && errors.vacationMessage && "border-red-300")}
                  value={vacationMessage}
                  onChange={(e) => setVacationMessage(e.target.value)}
                  disabled={!vacationMode}
                />
                {errors.vacationMessage && <p className="mt-1 text-xs text-red-600">{errors.vacationMessage}</p>}
              </div>
            </div>
          </Accordion>

          {/* Info */}
          <Accordion title="Informacije za kupce" icon={Store} defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">O meni / Opis djelatnosti</Label>
                <Textarea
                  className="mt-1.5 rounded-xl min-h-[100px]"
                  placeholder="Napiši kratko ko si, šta prodaješ i zašto bi kupci trebali kupovati od tebe..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Informacije o dostavi</Label>
                <Textarea
                  className="mt-1.5 rounded-xl min-h-[100px]"
                  placeholder="Kako šalješ, rokovi isporuke, cijene dostave..."
                  value={shippingInfo}
                  onChange={(e) => setShippingInfo(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Povrat i reklamacije</Label>
                <Textarea
                  className="mt-1.5 rounded-xl min-h-[100px]"
                  placeholder="Uslovi povrata, garancija, reklamacije..."
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                />
              </div>
            </div>
          </Accordion>

          {/* Social */}
          <Accordion title="Društvene mreže" icon={Globe} defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Users size={16} className="text-blue-500" /> Facebook
                </Label>
                <Input
                  className={cn("h-10 mt-1.5 rounded-xl", submitAttempted && errors.socialFacebook && "border-red-300")}
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                />
                {errors.socialFacebook && <p className="mt-1 text-xs text-red-600">{errors.socialFacebook}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Camera size={16} className="text-pink-500" /> Instagram
                </Label>
                <Input
                  className={cn("h-10 mt-1.5 rounded-xl", submitAttempted && errors.socialInstagram && "border-red-300")}
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                />
                {errors.socialInstagram && <p className="mt-1 text-xs text-red-600">{errors.socialInstagram}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Music size={16} className="text-slate-900" /> TikTok
                </Label>
                <Input
                  className={cn("h-10 mt-1.5 rounded-xl", submitAttempted && errors.socialTiktok && "border-red-300")}
                  value={socialTiktok}
                  onChange={(e) => setSocialTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@..."
                />
                {errors.socialTiktok && <p className="mt-1 text-xs text-red-600">{errors.socialTiktok}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Video size={16} className="text-red-500" /> YouTube
                </Label>
                <Input
                  className={cn("h-10 mt-1.5 rounded-xl", submitAttempted && errors.socialYoutube && "border-red-300")}
                  value={socialYoutube}
                  onChange={(e) => setSocialYoutube(e.target.value)}
                  placeholder="https://youtube.com/..."
                />
                {errors.socialYoutube && <p className="mt-1 text-xs text-red-600">{errors.socialYoutube}</p>}
              </div>

              <div className="sm:col-span-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Link size={16} className="text-emerald-500" /> Web stranica
                </Label>
                <Input
                  className={cn("h-10 mt-1.5 rounded-xl", submitAttempted && errors.socialWebsite && "border-red-300")}
                  value={socialWebsite}
                  onChange={(e) => setSocialWebsite(e.target.value)}
                  placeholder="https://..."
                />
                {errors.socialWebsite && <p className="mt-1 text-xs text-red-600">{errors.socialWebsite}</p>}
              </div>
            </div>
          </Accordion>

          {/* Preview prefs (local only) */}
          <Accordion title="Prikaz kartice (lokalno)" icon={Eye} defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Ove postavke se čuvaju samo na tvom uređaju i ne utiču na prikaz kupcima.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ToggleRow
                  title="Ocjena"
                  desc="Prikaži rating zvjezdice"
                  icon={Eye}
                  checked={previewPrefs.showRatings}
                  onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showRatings: v }))}
                />
                <ToggleRow
                  title="Bedževi"
                  desc="Prikaži gamifikacione bedževe"
                  icon={Eye}
                  checked={previewPrefs.showBadges}
                  onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showBadges: v }))}
                />
                <ToggleRow
                  title="Član od"
                  desc="Prikaži datum registracije"
                  icon={Eye}
                  checked={previewPrefs.showMemberSince}
                  onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showMemberSince: v }))}
                />
                <ToggleRow
                  title="Vrijeme odgovora"
                  desc="Prikaži chip za brzinu"
                  icon={Eye}
                  checked={previewPrefs.showResponseTime}
                  onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showResponseTime: v }))}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">Stil kontakt sekcije</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["inline", "sheet"].map((v) => {
                    const active = previewPrefs.contactStyle === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPreviewPrefs((p) => ({ ...p, contactStyle: v }))}
                        className={cn(
                          "h-10 rounded-xl border px-4 text-sm font-medium transition-all",
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        {v === "inline" ? "Inline ikone" : "Kontakt panel"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Accordion>
        </div>

        {/* Right: Live preview */}
        <div className="xl:sticky xl:top-6 space-y-4">
          <Card>
            <CardHeader icon={Eye} title="Live preview" subtitle="Ovako izgleda tvoja kartica prodavača kupcima." />
            <CardBody>
              <SellerPreviewCard
                seller={previewSeller}
                sellerSettings={previewSettings}
                badges={[]}
                ratings={{ total: 0 }}
                isPro={false}
                isShop={false}
                uiPrefs={previewPrefs}
                onChatClick={() => toast.message("Ovo je samo prikaz.")}
                onPhoneClick={() => toast.message("Ovo je samo prikaz.")}
              />
            </CardBody>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader icon={Sparkles} title="Savjeti" subtitle="Kako povećati prodaju" />
            <CardBody className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  <strong>Brzi odgovori</strong> - Prodavači koji odgovaraju u roku od sat vremena imaju 3x veću šansu za prodaju.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800">
                  <strong>Kvalitetna slika</strong> - Profili sa slikom dobijaju 50% više upita od onih bez.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                <CheckCircle2 size={18} className="text-purple-500 shrink-0 mt-0.5" />
                <p className="text-sm text-purple-800">
                  <strong>Više kontakata</strong> - Omogući WhatsApp i Viber da kupci lakše dođu do tebe.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerSettings;
