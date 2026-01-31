"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Mail,
  Phone,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Smartphone,
  Monitor,
  ChevronDown,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";
import { sellerSettingsApi, updateProfileApi } from "@/utils/api";
import { userSignUpData, userUpdateData } from "@/redux/reducer/authSlice";

import LmxAvatarGenerator from "@/components/Avatar/LmxAvatarGenerator";
import { SellerPreviewCard, SellerPreviewSkeleton } from "@/components/PagesComponent/Seller/SellerDetailCard";

/* -----------------------------
  Helpers
----------------------------- */

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
    // eslint-disable-next-line no-new
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

/* -----------------------------
  Premium UI blocks
----------------------------- */

const Card = ({ className, children }) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ type: "spring", stiffness: 260, damping: 22 }}
    className={cn(
      "rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900",
      "shadow-sm hover:shadow-md transition-shadow",
      className
    )}
  >
    {children}
  </motion.div>
);

const CardHeader = ({ icon: Icon, title, subtitle, right }) => (
  <div className="px-5 sm:px-6 pt-5 sm:pt-6 flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      {Icon ? (
        <div className="shrink-0 w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div>
        <div className="text-base font-semibold text-slate-900 dark:text-white">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
      </div>
    </div>
    {right ? <div className="shrink-0">{right}</div> : null}
  </div>
);

const CardBody = ({ children }) => <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4">{children}</div>;

const ToggleRow = ({ title, desc, checked, onCheckedChange, icon: Icon }) => (
  <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
    <div className="min-w-0">
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        {Icon ? <Icon className="h-5 w-5" /> : null}
        {title}
      </div>
      {desc ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{desc}</div> : null}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

const Segmented = ({ value, onChange, options }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {options.map((o) => {
      const active = value === o.value;
      return (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-11 rounded-2xl border px-4 text-sm font-semibold transition",
            active
              ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
          )}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

const Disclosure = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 sm:px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
      >
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
        </span>
        <ChevronDown className={cn("h-5 w-5 text-slate-500 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="px-4 sm:px-5 pb-5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

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

/* -----------------------------
  Main
----------------------------- */

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

  // Avatar upload / generator
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Form state (čuvam postojeću logiku/polja)
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [showViber, setShowViber] = useState(false);

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [viberNumber, setViberNumber] = useState("");

  const [preferredContact, setPreferredContact] = useState("message");

  const [businessHours, setBusinessHours] = useState(defaultBusinessHours);
  const [responseTime, setResponseTime] = useState("auto");

  const [acceptsOffers, setAcceptsOffers] = useState(true);

  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState("Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku.");

  const [vacationMode, setVacationMode] = useState(false);
  const [vacationMessage, setVacationMessage] = useState("Trenutno sam na odmoru. Vratit ću se uskoro!");

  const [businessDescription, setBusinessDescription] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [shippingInfo, setShippingInfo] = useState("");

  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");

  // Preview prefs (lokalno)
  const prefsKey = currentUser?.id ? `seller_card_preview_prefs_${currentUser.id}` : "seller_card_preview_prefs";
  const [previewPrefs, setPreviewPrefs] = useState({
    showRatings: true,
    showBadges: true,
    showMemberSince: true,
    showResponseTime: true,
    compactness: "normal",
    contactStyle: "inline",
  });

  const [previewMode, setPreviewMode] = useState("desktop");
  const [activeTab, setActiveTab] = useState("profile");

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

  const contactMethodOptions = useMemo(
    () => [
      { value: "message", label: "Poruka" },
      { value: "phone", label: "Poziv" },
      { value: "whatsapp", label: "WhatsApp" },
      { value: "viber", label: "Viber" },
      { value: "email", label: "Email" },
    ],
    []
  );

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

  const buildPayload = useCallback(() => {
    // ✅ zadržano kao u tvom fajlu (booleans + objekt)
    return {
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
    };
  }, [
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
  ]);

  const hasChanges = useMemo(() => {
    if (!initialPayloadRef.current) return false;
    return stableStringify(buildPayload()) !== initialPayloadRef.current;
  }, [buildPayload]);

  const errors = useMemo(() => {
    const e = {};

    if (showWhatsapp && normalizePhone(whatsappNumber).length > 0 && normalizePhone(whatsappNumber).length < 6) {
      e.whatsappNumber = "Unesite ispravan WhatsApp broj (npr. +38761234567).";
    }
    if (showViber && normalizePhone(viberNumber).length > 0 && normalizePhone(viberNumber).length < 6) {
      e.viberNumber = "Unesite ispravan Viber broj (npr. +38761234567).";
    }

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
      setLoadError("API metoda za učitavanje postavki nije pronađena (sellerSettingsApi).");
      return;
    }

    try {
      setIsLoading(true);
      setLoadError("");

      // ✅ ključni fix: timeout da ne može vječno visiti
      const response = await withTimeout(getFn(), 15000);

      const ok = response?.data?.error === false && response?.data?.data;
      if (!ok) {
        setLoadError(response?.data?.message || "Ne mogu dohvatiti postavke.");
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

      // stable snapshot (za hasChanges)
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

      const msg =
        err?.message === "TIMEOUT"
          ? "Server ne odgovara (timeout). Pokušaj ponovo."
          : "Greška pri dohvaćanju postavki.";

      setLoadError(msg);
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
      toast.error("Provjeri polja prije čuvanja.");
      return;
    }
    if (!hasChanges) return;

    const updateFn = pickFn(sellerSettingsApi, ["updateSettings", "update", "saveSettings", "setSettings"]);
    if (!updateFn) {
      toast.error("API metoda za čuvanje postavki nije pronađena (sellerSettingsApi).");
      return;
    }

    try {
      setIsSaving(true);
      const payload = buildPayload();

      const response = await withTimeout(updateFn(payload), 15000);

      if (response?.data?.error === false) {
        initialPayloadRef.current = stableStringify(payload);
        toast.success("Sačuvano.");
      } else {
        toast.error(response?.data?.message || "Greška pri čuvanju postavki.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message === "TIMEOUT" ? "Server ne odgovara (timeout)." : "Greška pri čuvanju postavki.");
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
        toast.success("Profilna slika je ažurirana!");
        setIsAvatarModalOpen(false);
        dispatch(userUpdateData({ data: response.data.data }));
      } else {
        toast.error(response?.data?.message || "Greška pri ažuriranju slike.");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(error?.message === "TIMEOUT" ? "Upload traje predugo (timeout)." : "Došlo je do greške pri uploadu.");
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

  const triggerFileInput = () => fileInputRef.current?.click();

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
    toast.message("Kopirano.");
  };

  if (isLoading) {
    return (
      <div className="py-10">
        <SellerPreviewSkeleton />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="p-6">
        <div className="text-base font-semibold text-slate-900 dark:text-white">Ne mogu učitati postavke</div>
        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{loadError}</div>
        <Button onClick={fetchSettings} variant="outline" className="mt-4 gap-2 rounded-2xl">
          <RefreshCw className="h-4 w-4" /> Pokušaj ponovo
        </Button>
      </Card>
    );
  }

  const previewSeller = {
    ...currentUser,
    profile: previewImage || currentUser?.profile_image || currentUser?.profile,
  };

  // Preview settings: uzimam payload (kao backend), ali ubacujem i preview prefs kroz uiPrefs na kartici
  const previewSettings = buildPayload();

  const saveDisabledReason = !isValid ? "Provjeri greške (npr. WhatsApp broj)." : !hasChanges ? "Nema promjena." : null;

  return (
    <div className="relative">
      {/* top bar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Postavke prodavača</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Prikaz se ažurira odmah. Postavke prikaza se čuvaju lokalno (na ovom uređaju).
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Button onClick={handleReset} variant="outline" disabled={isSaving || isAvatarUploading} className="gap-2 rounded-2xl">
              <RefreshCw className="h-4 w-4" /> Poništi
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isAvatarUploading || !hasChanges || !isValid} className="gap-2 rounded-2xl">
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Sačuvaj
            </Button>
          </div>

          {saveDisabledReason ? <div className="text-xs text-slate-500 dark:text-slate-400">{saveDisabledReason}</div> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-6 items-start">
        {/* LEFT */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 h-auto bg-transparent p-0">
              <TabsTrigger value="profile" className="py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                Profil
              </TabsTrigger>
              <TabsTrigger value="contact" className="py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                Kontakt
              </TabsTrigger>
              <TabsTrigger value="availability" className="py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                Dostupnost
              </TabsTrigger>
              <TabsTrigger value="policies" className="py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4 space-y-4">
              <Card>
                <CardHeader icon={ImageIcon} title="Profilna slika" subtitle="Avatar i verifikacija izgledaju premium." />
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 items-start">
                    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 p-4">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                          {previewImage ? (
                            <img src={previewImage} alt="Profil" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Nema slike</div>
                          )}
                        </div>

                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                        <Button onClick={triggerFileInput} variant="outline" className="w-full gap-2 rounded-2xl" disabled={isAvatarUploading}>
                          Učitaj sliku
                        </Button>

                        <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full gap-2 rounded-2xl" disabled={isAvatarUploading}>
                              Studio avatara
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                            <LmxAvatarGenerator onSave={updateProfileImage} onCancel={() => setIsAvatarModalOpen(false)} isSaving={isAvatarUploading} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Desno vidiš identičnu karticu kao na proizvodu. Podešavanja ispod utiču na kontakt, dostupnost i informacije.
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader icon={SlidersHorizontal} title="Prikaz kartice" subtitle="Ovo se čuva lokalno (na ovom uređaju)." />
                <CardBody>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ToggleRow
                      title="Ocjena"
                      desc="Prikaži prosječnu ocjenu"
                      icon={previewPrefs.showRatings ? Eye : EyeOff}
                      checked={previewPrefs.showRatings}
                      onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showRatings: v }))}
                    />
                    <ToggleRow
                      title="Bedževi"
                      desc="Gamification bedževi"
                      icon={previewPrefs.showBadges ? Eye : EyeOff}
                      checked={previewPrefs.showBadges}
                      onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showBadges: v }))}
                    />
                    <ToggleRow
                      title="Član od"
                      desc="Meta chip s datumom"
                      icon={previewPrefs.showMemberSince ? Eye : EyeOff}
                      checked={previewPrefs.showMemberSince}
                      onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showMemberSince: v }))}
                    />
                    <ToggleRow
                      title="Odgovara"
                      desc="Meta chip s vremenom odgovora"
                      icon={previewPrefs.showResponseTime ? Eye : EyeOff}
                      checked={previewPrefs.showResponseTime}
                      onCheckedChange={(v) => setPreviewPrefs((p) => ({ ...p, showResponseTime: v }))}
                    />
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Stil kontakta</div>
                    <div className="mt-3">
                      <Segmented
                        value={previewPrefs.contactStyle}
                        onChange={(v) => setPreviewPrefs((p) => ({ ...p, contactStyle: v }))}
                        options={[
                          { value: "inline", label: "Inline ikone" },
                          { value: "sheet", label: "Kontakt panel" },
                        ]}
                      />
                    </div>
                    <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kontakt panel je odličan na mobitelu i izgleda “premium”.</div>
                  </div>
                </CardBody>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="mt-4 space-y-4">
              <Card>
                <CardHeader icon={Phone} title="Kontakt opcije" subtitle="Kontroliši šta je vidljivo kupcima." />
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ToggleRow title="Telefon" desc="Prikaži broj" icon={Phone} checked={showPhone} onCheckedChange={setShowPhone} />
                    <ToggleRow title="Email" desc="Prikaži email" icon={Mail} checked={showEmail} onCheckedChange={setShowEmail} />
                    <ToggleRow title="WhatsApp" desc="Dugme u kontaktima" checked={showWhatsapp} onCheckedChange={setShowWhatsapp} />
                    <ToggleRow title="Viber" desc="Dugme u kontaktima" checked={showViber} onCheckedChange={setShowViber} />
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">WhatsApp broj</Label>
                      <Input
                        className={cn("h-11 mt-2 rounded-2xl", submitAttempted && errors.whatsappNumber ? "border-red-300 dark:border-red-700" : "")}
                        placeholder="+38761234567"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        disabled={!showWhatsapp}
                      />
                      {errors.whatsappNumber ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.whatsappNumber}</div> : null}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Viber broj</Label>
                      <Input
                        className={cn("h-11 mt-2 rounded-2xl", submitAttempted && errors.viberNumber ? "border-red-300 dark:border-red-700" : "")}
                        placeholder="+38761234567"
                        value={viberNumber}
                        onChange={(e) => setViberNumber(e.target.value)}
                        disabled={!showViber}
                      />
                      {errors.viberNumber ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.viberNumber}</div> : null}
                    </div>
                  </div>

                  <div className="mt-5">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preferirani kontakt</Label>
                    <div className="mt-3">
                      <Segmented value={preferredContact} onChange={setPreferredContact} options={contactMethodOptions} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </TabsContent>

            <TabsContent value="availability" className="mt-4 space-y-4">
              <Card>
                <CardHeader icon={Clock} title="Vrijeme odgovora" subtitle='Na kartici se prikazuje kao “Odgovara za: …”.' />
                <CardBody>
                  <Segmented value={responseTime} onChange={setResponseTime} options={responseTimeOptions} />
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  icon={Clock}
                  title="Radno vrijeme"
                  subtitle="Kupci vide status (Otvoreno/Zatvoreno) kada si Shop."
                  right={
                    <Button variant="outline" size="sm" className="gap-2 rounded-2xl" onClick={copyWeekdays} type="button">
                      <RefreshCw className="h-4 w-4" /> Kopiraj radne dane
                    </Button>
                  }
                />
                <CardBody>
                  <div className="space-y-3">
                    {DAYS.map((day) => (
                      <div key={day} className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{DAY_LABEL[day]}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Otvoreno</span>
                              <Switch checked={businessHours?.[day]?.enabled} onCheckedChange={(v) => setDay(day, { enabled: v })} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 md:w-[280px]">
                            <div>
                              <Label className="text-xs text-slate-500 dark:text-slate-400">Od</Label>
                              <Input
                                type="time"
                                className="h-11 mt-1 rounded-2xl"
                                value={businessHours?.[day]?.open || "09:00"}
                                onChange={(e) => setDay(day, { open: e.target.value })}
                                disabled={!businessHours?.[day]?.enabled}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-slate-500 dark:text-slate-400">Do</Label>
                              <Input
                                type="time"
                                className="h-11 mt-1 rounded-2xl"
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
                </CardBody>
              </Card>

              <Card>
                <CardHeader icon={SlidersHorizontal} title="Ponude" subtitle="Kontroliši da li želiš primati ponude." />
                <CardBody>
                  <ToggleRow
                    title="Primam ponude"
                    desc="Kupci mogu slati ponude na tvoje proizvode"
                    checked={acceptsOffers}
                    onCheckedChange={setAcceptsOffers}
                  />
                </CardBody>
              </Card>

              <Disclosure title="Automatski odgovor" icon={Clock}>
                <div className="space-y-3">
                  <ToggleRow
                    title="Uključi automatski odgovor"
                    desc="Automatska poruka kada ti neko piše"
                    checked={autoReplyEnabled}
                    onCheckedChange={setAutoReplyEnabled}
                  />
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Poruka</Label>
                    <Textarea className="mt-2 rounded-2xl min-h-[110px]" value={autoReplyMessage} onChange={(e) => setAutoReplyMessage(e.target.value)} />
                    {errors.autoReplyMessage ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.autoReplyMessage}</div> : null}
                  </div>
                </div>
              </Disclosure>

              <Disclosure title="Odmor (Vacation mode)" icon={Clock}>
                <div className="space-y-3">
                  <ToggleRow
                    title="Uključi odmor"
                    desc="Obavijesti kupce da trenutno nisi dostupan/na"
                    checked={vacationMode}
                    onCheckedChange={setVacationMode}
                  />
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Poruka</Label>
                    <Textarea className="mt-2 rounded-2xl min-h-[110px]" value={vacationMessage} onChange={(e) => setVacationMessage(e.target.value)} />
                    {errors.vacationMessage ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.vacationMessage}</div> : null}
                  </div>
                </div>
              </Disclosure>
            </TabsContent>

            <TabsContent value="policies" className="mt-4 space-y-4">
              <Card>
                <CardHeader icon={SlidersHorizontal} title="Informacije za kupce" subtitle="Ovo se prikazuje na profilu prodavača." />
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Opis</Label>
                      <Textarea className="mt-2 rounded-2xl min-h-[120px]" value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dostava</Label>
                      <Textarea className="mt-2 rounded-2xl min-h-[120px]" value={shippingInfo} onChange={(e) => setShippingInfo(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Povrat</Label>
                      <Textarea className="mt-2 rounded-2xl min-h-[120px]" value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader icon={SlidersHorizontal} title="Društvene mreže" subtitle="Dodaj linkove (opcionalno)." />
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Facebook</Label>
                      <Input className="h-11 mt-2 rounded-2xl" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="https://..." />
                      {errors.socialFacebook ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.socialFacebook}</div> : null}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Instagram</Label>
                      <Input className="h-11 mt-2 rounded-2xl" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="https://..." />
                      {errors.socialInstagram ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.socialInstagram}</div> : null}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">TikTok</Label>
                      <Input className="h-11 mt-2 rounded-2xl" value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} placeholder="https://..." />
                      {errors.socialTiktok ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.socialTiktok}</div> : null}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">YouTube</Label>
                      <Input className="h-11 mt-2 rounded-2xl" value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} placeholder="https://..." />
                      {errors.socialYoutube ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.socialYoutube}</div> : null}
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Web stranica</Label>
                      <Input className="h-11 mt-2 rounded-2xl" value={socialWebsite} onChange={(e) => setSocialWebsite(e.target.value)} placeholder="https://..." />
                      {errors.socialWebsite ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.socialWebsite}</div> : null}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT: preview */}
        <div className="xl:sticky xl:top-6 space-y-4">
          <Card>
            <CardHeader
              icon={Eye}
              title="Prikaz"
              subtitle="Uživo prikaz kartice."
              right={
                <div className="inline-flex items-center rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("mobile")}
                    className={cn(
                      "px-3 py-2 text-sm font-semibold inline-flex items-center gap-2 transition",
                      previewMode === "mobile"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <Smartphone className="h-4 w-4" /> Telefon
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("desktop")}
                    className={cn(
                      "px-3 py-2 text-sm font-semibold inline-flex items-center gap-2 transition",
                      previewMode === "desktop"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <Monitor className="h-4 w-4" /> Računar
                  </button>
                </div>
              }
            />
            <CardBody>
              <div className={cn("mx-auto", previewMode === "mobile" ? "max-w-[380px]" : "max-w-none")}>
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
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerSettings;
