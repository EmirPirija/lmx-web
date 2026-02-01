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
  Loader2,
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
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
  ]);

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
  UI (mini)
===================== */

const GlassCard = ({ children, className, ...props }) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-3xl",
      "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
      "border border-slate-200/60 dark:border-slate-700/60",
      "shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, title, subtitle, right }) => (
  <div className="px-5 sm:px-6 pt-5 sm:pt-6 flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="shrink-0 w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      )}
      <div>
        <div className="text-base font-bold text-slate-900 dark:text-white">{title}</div>
        {subtitle && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>}
      </div>
    </div>
    {right && <div className="shrink-0">{right}</div>}
  </div>
);

const CardBody = ({ children }) => <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4">{children}</div>;

const PrimaryButton = ({ children, className, isLoading, disabled, ...props }) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    disabled={disabled || isLoading}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3",
      "bg-slate-900 text-white dark:bg-white dark:text-slate-900",
      "text-sm font-semibold shadow-lg",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    {...props}
  >
    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
  </motion.button>
);

const SecondaryButton = ({ children, className, ...props }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -1 }}
    whileTap={{ scale: 0.98 }}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5",
      "bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm",
      "text-slate-800 dark:text-slate-200 text-sm font-semibold",
      "border border-slate-200/70 dark:border-slate-700/70",
      "hover:bg-slate-200/80 dark:hover:bg-slate-700/80",
      "transition-all duration-200",
      className
    )}
    {...props}
  >
    {children}
  </motion.button>
);

const ToggleRow = ({ title, desc, checked, onCheckedChange, icon: Icon }) => (
  <div
    className={cn(
      "flex items-start justify-between gap-4 rounded-2xl p-4",
      "border border-slate-200/70 dark:border-slate-700/60",
      "bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm",
      checked && "border-blue-200/70 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-900/10"
    )}
  >
    <div className="min-w-0">
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        {Icon && <Icon className={cn("h-5 w-5", checked ? "text-blue-500" : "text-slate-400")} strokeWidth={2} />}
        {title}
      </div>
      {desc && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{desc}</div>}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

const Disclosure = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full px-4 sm:px-5 py-4 flex items-center justify-between gap-3",
          "hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
        )}
      >
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="px-4 sm:px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* =====================
  Main
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
      setAutoReplyMessage(
        s.auto_reply_message || "Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku."
      );

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
        auto_reply_message:
          s.auto_reply_message || "Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku.",
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
        toast.success("Sačuvano!");
      } else {
        toast.error(response?.data?.message || "Greška pri spremanju.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message === "TIMEOUT" ? "Timeout." : "Greška pri spremanju.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    await fetchSettings();
    toast.message("Vraćeno na zadnje sačuvano.");
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
        toast.success("Slika ažurirana!");
        setIsAvatarModalOpen(false);
        dispatch(userUpdateData({ data: response.data.data }));
      } else {
        toast.error(response?.data?.message || "Greška pri uploadu slike.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.message === "TIMEOUT" ? "Timeout." : "Greška pri uploadu slike.");
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
    toast.message("Kopirano (pon → uto–pet).");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-6">
          <div className="h-[640px] rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />
          <div className="h-[520px] rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-slate-900 dark:text-white">Greška</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{loadError}</div>
            <SecondaryButton onClick={fetchSettings} className="mt-4">
              <RefreshCw className="h-4 w-4" /> Ponovo
            </SecondaryButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  const previewSeller = { ...currentUser, profile: previewImage || currentUser?.profile_image || currentUser?.profile };
  const previewSettings = buildPayload();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Postavke prodavača</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ovdje podešavaš šta kupci vide i kako te mogu kontaktirati.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={handleReset} disabled={isSaving || isAvatarUploading}>
              <RefreshCw className="h-4 w-4" /> Poništi
            </SecondaryButton>
            <PrimaryButton
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving || isAvatarUploading || !hasChanges || !isValid}
            >
              <Save className="h-4 w-4" /> Sačuvaj
            </PrimaryButton>
          </div>
          <div className="text-xs text-slate-500">
            {!isValid ? "Ima grešaka u formi." : !hasChanges ? "Nema promjena." : "Spremno za čuvanje."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-6 items-start">
        {/* Left: Settings */}
        <div className="space-y-4">
          {/* Avatar */}
          <GlassCard>
            <CardHeader icon={Camera} title="Profilna slika" subtitle="Ovo kupci vide na kartici." />
            <CardBody>
              <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    {previewImage ? (
                      <img src={previewImage} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xs text-slate-400">Nema slike</div>
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
                    <SecondaryButton onClick={() => fileInputRef.current?.click()} disabled={isAvatarUploading}>
                      <Camera className="h-4 w-4" /> Učitaj sliku
                    </SecondaryButton>

                    <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                      <DialogTrigger asChild>
                        <PrimaryButton disabled={isAvatarUploading}>
                          <Sparkles className="h-4 w-4" /> Studio avatara
                        </PrimaryButton>
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

                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Savjet: koristi jasnu sliku lica ili logo. Ovo direktno utiče na povjerenje kupaca.
                </div>
              </div>
            </CardBody>
          </GlassCard>

          {/* Contact */}
          <Disclosure title="Kontakt opcije" icon={Phone} defaultOpen>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ToggleRow title="Telefon" desc="Prikaži broj kupcima" icon={Phone} checked={showPhone} onCheckedChange={setShowPhone} />
                <ToggleRow title="Email" desc="Prikaži email kupcima" icon={Mail} checked={showEmail} onCheckedChange={setShowEmail} />
                <ToggleRow title="WhatsApp" desc="Prikaži WhatsApp dugme" icon={MessageCircle} checked={showWhatsapp} onCheckedChange={setShowWhatsapp} />
                <ToggleRow title="Viber" desc="Prikaži Viber dugme" icon={Phone} checked={showViber} onCheckedChange={setShowViber} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">WhatsApp broj</Label>
                  <Input
                    className={cn("h-11 mt-2 rounded-2xl", submitAttempted && errors.whatsappNumber && "border-red-300")}
                    placeholder="+38761234567"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    disabled={!showWhatsapp}
                  />
                  {errors.whatsappNumber && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.whatsappNumber}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Viber broj</Label>
                  <Input
                    className={cn("h-11 mt-2 rounded-2xl", submitAttempted && errors.viberNumber && "border-red-300")}
                    placeholder="+38761234567"
                    value={viberNumber}
                    onChange={(e) => setViberNumber(e.target.value)}
                    disabled={!showViber}
                  />
                  {errors.viberNumber && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.viberNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preferirani kontakt</Label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["message", "phone", "whatsapp", "viber", "email"].map((v) => {
                    const active = preferredContact === v;
                    const label =
                      v === "message" ? "Poruka" :
                      v === "phone" ? "Poziv" :
                      v === "whatsapp" ? "WhatsApp" :
                      v === "viber" ? "Viber" : "Email";
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPreferredContact(v)}
                        className={cn(
                          "h-11 rounded-2xl border px-4 text-sm font-semibold transition-all",
                          active
                            ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Disclosure>

          {/* Availability */}
          <Disclosure title="Dostupnost i ponude" icon={Zap} defaultOpen={false}>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/50 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Vrijeme odgovora</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {responseTimeOptions.map((o) => {
                    const active = responseTime === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setResponseTime(o.value)}
                        className={cn(
                          "h-11 rounded-2xl border px-4 text-sm font-semibold transition-all",
                          active
                            ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Radno vrijeme</div>
                  <SecondaryButton onClick={copyWeekdays}>
                    <Copy className="h-4 w-4" /> Kopiraj pon
                  </SecondaryButton>
                </div>

                <div className="mt-3 space-y-3">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className={cn(
                        "rounded-2xl border p-4",
                        businessHours?.[day]?.enabled
                          ? "border-emerald-200/70 bg-emerald-50/30 dark:border-emerald-800/40 dark:bg-emerald-900/10"
                          : "border-slate-200/70 bg-slate-50/50 dark:border-slate-700/60 dark:bg-slate-800/30"
                      )}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{DAY_LABEL[day]}</div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-medium", businessHours?.[day]?.enabled ? "text-emerald-600" : "text-slate-500")}>
                              {businessHours?.[day]?.enabled ? "Otvoreno" : "Zatvoreno"}
                            </span>
                            <Switch checked={businessHours?.[day]?.enabled} onCheckedChange={(v) => setDay(day, { enabled: v })} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:w-[280px]">
                          <div>
                            <Label className="text-xs text-slate-500">Od</Label>
                            <Input
                              type="time"
                              className="h-10 mt-1 rounded-xl text-sm"
                              value={businessHours?.[day]?.open || "09:00"}
                              onChange={(e) => setDay(day, { open: e.target.value })}
                              disabled={!businessHours?.[day]?.enabled}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Do</Label>
                            <Input
                              type="time"
                              className="h-10 mt-1 rounded-xl text-sm"
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
                desc="Kupci mogu slati ponude na proizvode"
                icon={Shield}
                checked={acceptsOffers}
                onCheckedChange={setAcceptsOffers}
              />
            </div>
          </Disclosure>

          {/* Auto reply */}
          <Disclosure title="Automatski odgovor" icon={MessageCircle} defaultOpen={false}>
            <div className="space-y-3">
              <ToggleRow
                title="Uključi automatski odgovor"
                desc="Šalje se kupcu čim ti napiše poruku"
                icon={MessageCircle}
                checked={autoReplyEnabled}
                onCheckedChange={setAutoReplyEnabled}
              />
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Poruka</Label>
                <Textarea
                  className={cn("mt-2 rounded-2xl min-h-[110px]", submitAttempted && errors.autoReplyMessage && "border-red-300")}
                  value={autoReplyMessage}
                  onChange={(e) => setAutoReplyMessage(e.target.value)}
                  disabled={!autoReplyEnabled}
                />
                {errors.autoReplyMessage && <div className="mt-1 text-xs text-red-600">{errors.autoReplyMessage}</div>}
              </div>
            </div>
          </Disclosure>

          {/* Vacation */}
          <Disclosure title="Odmor / Pauza" icon={Calendar} defaultOpen={false}>
            <div className="space-y-3">
              <ToggleRow
                title="Uključi odmor"
                desc="Kupci vide da trenutno nisi dostupan"
                icon={Calendar}
                checked={vacationMode}
                onCheckedChange={setVacationMode}
              />
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Poruka</Label>
                <Textarea
                  className={cn("mt-2 rounded-2xl min-h-[110px]", submitAttempted && errors.vacationMessage && "border-red-300")}
                  value={vacationMessage}
                  onChange={(e) => setVacationMessage(e.target.value)}
                  disabled={!vacationMode}
                />
                {errors.vacationMessage && <div className="mt-1 text-xs text-red-600">{errors.vacationMessage}</div>}
              </div>
            </div>
          </Disclosure>

          {/* Info */}
          <Disclosure title="Informacije za kupce" icon={Store} defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">O meni / Opis</Label>
                <Textarea
                  className="mt-2 rounded-2xl min-h-[110px]"
                  placeholder="Napiši kratko ko si i šta prodaješ..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dostava</Label>
                <Textarea
                  className="mt-2 rounded-2xl min-h-[110px]"
                  placeholder="Kako šalješ, rokovi, cijene..."
                  value={shippingInfo}
                  onChange={(e) => setShippingInfo(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Povrat / Reklamacije</Label>
                <Textarea
                  className="mt-2 rounded-2xl min-h-[110px]"
                  placeholder="Uslovi povrata..."
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                />
              </div>
            </div>
          </Disclosure>

          {/* Social */}
          <Disclosure title="Društvene mreže" icon={Globe} defaultOpen={false}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" /> Facebook
                  </Label>
                  <Input
                    className={cn("h-11 mt-2 rounded-2xl", submitAttempted && errors.socialFacebook && "border-red-300")}
                    value={socialFacebook}
                    onChange={(e) => setSocialFacebook(e.target.value)}
                    placeholder="https://..."
                  />
                  {errors.socialFacebook && <div className="mt-1 text-xs text-red-600">{errors.socialFacebook}</div>}
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Camera className="h-4 w-4 text-pink-500" /> Instagram
                  </Label>
                  <Input
                    className={cn("h-11 mt-2 rounded-2xl", submitAttempted && errors.socialInstagram && "border-red-300")}
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    placeholder="https://..."
                  />
                  {errors.socialInstagram && <div className="mt-1 text-xs text-red-600">{errors.socialInstagram}</div>}
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">TikTok</Label>
                  <Input
                    className={cn("h-11 mt-2 rounded-2xl", submitAttempted && errors.socialTiktok && "border-red-300")}
                    value={socialTiktok}
                    onChange={(e) => setSocialTiktok(e.target.value)}
                    placeholder="https://..."
                  />
                  {errors.socialTiktok && <div className="mt-1 text-xs text-red-600">{errors.socialTiktok}</div>}
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">YouTube</Label>
                  <Input
                    className={cn("h-11 mt-2 rounded-2xl", submitAttempted && errors.socialYoutube && "border-red-300")}
                    value={socialYoutube}
                    onChange={(e) => setSocialYoutube(e.target.value)}
                    placeholder="https://..."
                  />
                  {errors.socialYoutube && <div className="mt-1 text-xs text-red-600">{errors.socialYoutube}</div>}
                </div>

                <div className="md:col-span-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Web stranica</Label>
                  <Input
                    className={cn("h-11 mt-2 rounded-2xl", submitAttempted && errors.socialWebsite && "border-red-300")}
                    value={socialWebsite}
                    onChange={(e) => setSocialWebsite(e.target.value)}
                    placeholder="https://..."
                  />
                  {errors.socialWebsite && <div className="mt-1 text-xs text-red-600">{errors.socialWebsite}</div>}
                </div>
              </div>
            </div>
          </Disclosure>

          {/* Preview prefs (local only) */}
          <Disclosure title="Prikaz kartice (lokalno)" icon={Eye} defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ToggleRow
                title="Ocjena"
                desc="Prikaži rating"
                icon={Eye}
                checked={previewPrefs.showRatings}
                onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showRatings: v }))}
              />
              <ToggleRow
                title="Bedževi"
                desc="Prikaži gamification"
                icon={Eye}
                checked={previewPrefs.showBadges}
                onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showBadges: v }))}
              />
              <ToggleRow
                title="Član od"
                desc="Prikaži datum"
                icon={Eye}
                checked={previewPrefs.showMemberSince}
                onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showMemberSince: v }))}
              />
              <ToggleRow
                title="Vrijeme odgovora"
                desc="Prikaži chip"
                icon={Eye}
                checked={previewPrefs.showResponseTime}
                onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showResponseTime: v }))}
              />

              <div className="md:col-span-2 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/50 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Stil kontakta</div>
                <div className="grid grid-cols-2 gap-2">
                  {["inline", "sheet"].map((v) => {
                    const active = previewPrefs.contactStyle === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPreviewPrefs((p) => ({ ...p, contactStyle: v }))}
                        className={cn(
                          "h-11 rounded-2xl border px-4 text-sm font-semibold transition-all",
                          active
                            ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {v === "inline" ? "Inline ikone" : "Kontakt panel"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Disclosure>
        </div>

        {/* Right: Live preview */}
        <div className="xl:sticky xl:top-6 space-y-4">
          <GlassCard>
            <CardHeader icon={Eye} title="Live preview" subtitle="Ovako izgleda kartica prodavača." />
            <CardBody>
              <SellerPreviewCard
                seller={previewSeller}
                sellerSettings={previewSettings}
                badges={[]}
                ratings={{ total: 0 }}
                isPro={false}
                isShop={false}
                uiPrefs={previewPrefs}
                onChatClick={() => toast.message("Samo prikaz.")}
                onPhoneClick={() => toast.message("Samo prikaz.")}
              />
            </CardBody>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default SellerSettings;
