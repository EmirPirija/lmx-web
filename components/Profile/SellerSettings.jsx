"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  FiClock,
  FiEye,
  FiImage,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSave,
  FiSliders,
  FiSmartphone,
  FiMonitor,
  FiChevronDown,
} from "react-icons/fi";

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

const ShakerStyles = () => (
  <style jsx global>{`
    @keyframes shake {
      0% {
        transform: translateX(0);
      }
      20% {
        transform: translateX(-4px);
      }
      40% {
        transform: translateX(4px);
      }
      60% {
        transform: translateX(-3px);
      }
      80% {
        transform: translateX(3px);
      }
      100% {
        transform: translateX(0);
      }
    }
    .shake {
      animation: shake 260ms ease-in-out;
    }
  `}</style>
);

/* -----------------------------
  Pretty UI blocks
----------------------------- */

const Card = ({ className, children }) => (
  <div
    className={cn(
      "rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900",
      "shadow-sm hover:shadow-md transition-shadow",
      className
    )}
  >
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, title, subtitle, right }) => (
  <div className="px-5 sm:px-6 pt-5 sm:pt-6 flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      {Icon ? (
        <div className="shrink-0 w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center">
          <Icon className="text-lg" />
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
        {Icon ? <Icon className="text-lg" /> : null}
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
            <Icon className="text-lg" />
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
        </span>
        <FiChevronDown className={cn("text-lg text-slate-500 transition-transform", open && "rotate-180")} />
      </button>

      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden px-4 sm:px-5 pb-5">{children}</div>
      </div>
    </div>
  );
};


/* -----------------------------
  Main Component
----------------------------- */

const SellerSettings = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(userSignUpData);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [shakeTick, setShakeTick] = useState(0);

  // Avatar upload / generator
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Form state
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
  // Preview mode
  const [previewMode, setPreviewMode] = useState("desktop"); // desktop | mobile

  const [activeTab, setActiveTab] = useState("profile");
  const initialPayloadRef = useRef(null);
  const undoBackupRef = useRef(null);

  // Sync preview image with user
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
      { value: "auto", label: "Auto" },
      { value: "instant", label: "Par minuta" },
      { value: "few_hours", label: "Par sati" },
      { value: "same_day", label: "24 sata" },
      { value: "few_days", label: "Par dana" },
    ],
    []
  );

  const buildPayload = useCallback(() => {
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
    acceptsOffers,
    autoReplyEnabled,
    autoReplyMessage,
    businessDescription,
    businessHours,
    preferredContact,
    responseTime,
    returnPolicy,
    shippingInfo,
    showEmail,
    showPhone,
    showViber,
    showWhatsapp,
    socialFacebook,
    socialInstagram,
    socialTiktok,
    socialWebsite,
    socialYoutube,
    vacationMessage,
    vacationMode,
    viberNumber,
    whatsappNumber,
  ]);

  const hasChanges = useMemo(() => {
    if (!initialPayloadRef.current) return false;
    return stableStringify(buildPayload()) !== initialPayloadRef.current;
  }, [buildPayload]);

  // Validation
  const errors = useMemo(() => {
    const e = {};
    if (showWhatsapp && normalizePhone(whatsappNumber).length < 6) e.whatsappNumber = "Unesite validan WhatsApp broj.";
    if (showViber && normalizePhone(viberNumber).length < 6) e.viberNumber = "Unesite validan Viber broj.";

    if (!safeUrl(socialFacebook)) e.socialFacebook = "Link nije validan.";
    if (!safeUrl(socialInstagram)) e.socialInstagram = "Link nije validan.";
    if (!safeUrl(socialTiktok)) e.socialTiktok = "Link nije validan.";
    if (!safeUrl(socialYoutube)) e.socialYoutube = "Link nije validan.";
    if (!safeUrl(socialWebsite)) e.socialWebsite = "Link nije validan.";

    if (autoReplyEnabled && autoReplyMessage.trim().length < 3) e.autoReplyMessage = "Poruka je prekratka.";
    if (vacationMode && vacationMessage.trim().length < 3) e.vacationMessage = "Poruka je prekratka.";

    return e;
  }, [
    autoReplyEnabled,
    autoReplyMessage,
    showViber,
    showWhatsapp,
    socialFacebook,
    socialInstagram,
    socialTiktok,
    socialWebsite,
    socialYoutube,
    vacationMessage,
    vacationMode,
    viberNumber,
    whatsappNumber,
  ]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      const response = await sellerSettingsApi.getSettings();

      if (response?.data?.error === false && response?.data?.data) {
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

        const payloadStable = stableStringify({
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

        initialPayloadRef.current = payloadStable;
      } else {
        setLoadError(response?.data?.message || "Ne mogu dohvatiti postavke.");
      }
    } catch (error) {
      console.error(error);
      setLoadError("Greška pri dohvaćanju postavki.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSubmitAttempted(true);

    if (!isValid) {
      setShakeTick((v) => v + 1);
      toast.error("Provjeri polja prije čuvanja.");
      return;
    }
    if (!hasChanges) return;

    // prepare undo backup from last saved (initialPayloadRef)
    try {
      undoBackupRef.current = initialPayloadRef.current ? JSON.parse(initialPayloadRef.current) : null;
    } catch {
      undoBackupRef.current = null;
    }

    try {
      setIsSaving(true);
      const payload = buildPayload();
      const response = await sellerSettingsApi.updateSettings(payload);

      if (response?.data?.error === false) {
        initialPayloadRef.current = stableStringify(payload);

        toast.success("Sačuvano.", {
          action: undoBackupRef.current
            ? {
                label: "Undo",
                onClick: async () => {
                  try {
                    const backup = undoBackupRef.current;
                    if (!backup) return;

                    await sellerSettingsApi.updateSettings(backup);
                    toast.message("Vraćeno na prethodno.");
                    await fetchSettings();
                  } catch (e) {
                    console.error(e);
                    toast.error("Ne mogu vratiti.");
                  }
                },
              }
            : undefined,
        });
      } else {
        toast.error(response?.data?.message || "Greška pri čuvanju postavki");
      }
    } catch (error) {
      console.error(error);
      toast.error("Greška pri čuvanju postavki");
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
      const response = await updateProfileApi.updateProfile({
        profile: fileOrBlob,
        name: currentUser?.name,
        mobile: currentUser?.mobile,
        email: currentUser?.email,
        notification: currentUser?.notification ?? 0,
        show_personal_details: currentUser?.show_personal_details ?? 0,
        country_code: currentUser?.country_code,
      });

      if (response?.data?.error === false) {
        toast.success("Profilna slika je ažurirana!");
        setIsAvatarModalOpen(false);
        dispatch(userUpdateData({ data: response.data.data }));
      } else {
        toast.error(response?.data?.message || "Greška pri ažuriranju slike.");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Došlo je do greške pri uploadu.");
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

  // Business hours helpers
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

  const isPro = Boolean(currentUser?.is_pro ?? currentUser?.isPro);
  const isShop = Boolean(currentUser?.is_shop ?? currentUser?.isShop);

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
          <FiRefreshCw /> Pokušaj ponovo
        </Button>
      </Card>
    );
  }

  const previewSeller = {
    ...currentUser,
    profile: previewImage || currentUser?.profile_image || currentUser?.profile,
  };

  const previewSettings = buildPayload();

  const saveDisabledReason = !isValid
    ? "Provjeri greške (npr. WhatsApp broj)."
    : !hasChanges
    ? "Nema promjena."
    : null;

  return (
    <div className="relative">
      <ShakerStyles />

      {/* top bar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Postavke prodavača</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Preview desno se ažurira odmah.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Button onClick={handleReset} variant="outline" disabled={isSaving || isAvatarUploading} className="gap-2 rounded-2xl">
              <FiRefreshCw /> Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isAvatarUploading || !hasChanges || !isValid} className="gap-2 rounded-2xl">
              {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave />}
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
                <CardHeader icon={FiImage} title="Profilna slika" subtitle="Avatar i verified izgledaju premium." />
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 items-start">
                    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 p-4">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                          {previewImage ? (
                            <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Nema slike</div>
                          )}
                        </div>

                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                        <Button onClick={triggerFileInput} variant="outline" className="w-full gap-2 rounded-2xl" disabled={isAvatarUploading}>
                          Upload
                        </Button>

                        <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full gap-2 rounded-2xl" disabled={isAvatarUploading}>
                              Avatar studio
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                            <LmxAvatarGenerator onSave={updateProfileImage} onCancel={() => setIsAvatarModalOpen(false)} isSaving={isAvatarUploading} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Preview desno je identičan kartici na stranici proizvoda (layout + akcije). Customizer ispod utiče samo na preview.
                    </div>
                  </div>
                </CardBody>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="mt-4 space-y-4">
              <Card>
                <CardHeader icon={FiPhone} title="Kontakt opcije" subtitle="Kontroliši šta je vidljivo na kartici." />
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ToggleRow title="Telefon" desc="Prikaži broj" icon={FiPhone} checked={showPhone} onCheckedChange={setShowPhone} />
                    <ToggleRow title="Email" desc="Prikaži email" icon={FiMail} checked={showEmail} onCheckedChange={setShowEmail} />

                    <ToggleRow title="WhatsApp" desc="Dugme u kontaktima" checked={showWhatsapp} onCheckedChange={setShowWhatsapp} />
                    <ToggleRow title="Viber" desc="Dugme u kontaktima" checked={showViber} onCheckedChange={setShowViber} />
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">WhatsApp broj</Label>
                      <Input
                        key={`wa-${shakeTick}`}
                        className={cn(
                          "h-11 mt-2 rounded-2xl",
                          submitAttempted && errors.whatsappNumber ? "border-red-300 dark:border-red-700 shake" : ""
                        )}
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
                        key={`vb-${shakeTick}`}
                        className={cn(
                          "h-11 mt-2 rounded-2xl",
                          submitAttempted && errors.viberNumber ? "border-red-300 dark:border-red-700 shake" : ""
                        )}
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
                <CardHeader icon={FiClock} title="Vrijeme odgovora" subtitle="Na kartici se prikazuje kao “Odgovara: …”." />
                <CardBody>
                  <Segmented value={responseTime} onChange={setResponseTime} options={responseTimeOptions} />
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  icon={FiClock}
                  title="Radno vrijeme"
                  subtitle="Kupci vide status (Otvoreno/Zatvoreno) kada si Shop."
                  right={
                    <Button variant="outline" size="sm" className="gap-2 rounded-2xl" onClick={copyWeekdays} type="button">
                      <FiRefreshCw /> Kopiraj radne dane
                    </Button>
                  }
                />
                <CardBody>
                  <Disclosure title="Uredi radno vrijeme" icon={FiClock}>
                    <div className="space-y-2">
                      {DAYS.map((day) => {
                        const d = businessHours[day];
                        return (
                          <div key={day} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">{DAY_LABEL[day]}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{d.enabled ? `${d.open}–${d.close}` : "Zatvoreno"}</div>
                              </div>
                              <Switch checked={d.enabled} onCheckedChange={(v) => setDay(day, { enabled: v })} />
                            </div>

                            {d.enabled ? (
                              <div className="mt-3 grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs text-slate-600 dark:text-slate-300">Od</Label>
                                  <Input type="time" className="h-10 mt-1 rounded-2xl" value={d.open} onChange={(e) => setDay(day, { open: e.target.value })} />
                                </div>
                                <div>
                                  <Label className="text-xs text-slate-600 dark:text-slate-300">Do</Label>
                                  <Input type="time" className="h-10 mt-1 rounded-2xl" value={d.close} onChange={(e) => setDay(day, { close: e.target.value })} />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </Disclosure>

                  <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Automatski odgovor</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Pošalji kratku poruku odmah.</div>
                      </div>
                      <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
                    </div>

                    <div className={cn("grid transition-all duration-300", autoReplyEnabled ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]")}>
                      <div className="overflow-hidden">
                        <Textarea className="resize-none rounded-2xl" rows={3} maxLength={300} value={autoReplyMessage} onChange={(e) => setAutoReplyMessage(e.target.value)} />
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{errors.autoReplyMessage ? <span className="text-red-600 dark:text-red-400">{errors.autoReplyMessage}</span> : null}</span>
                          <span>{autoReplyMessage.length}/300</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Vacation mode</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Poruka kupcima u chatu (nije na kartici).</div>
                      </div>
                      <Switch checked={vacationMode} onCheckedChange={setVacationMode} />
                    </div>

                    <div className={cn("grid transition-all duration-300", vacationMode ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]")}>
                      <div className="overflow-hidden">
                        <Textarea className="resize-none rounded-2xl" rows={2} maxLength={200} value={vacationMessage} onChange={(e) => setVacationMessage(e.target.value)} />
                        {errors.vacationMessage ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.vacationMessage}</div> : null}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </TabsContent>

            <TabsContent value="policies" className="mt-4 space-y-4">
              <Card>
                <CardHeader
                  icon={FiSliders}
                  title="Ponude"
                  subtitle="Da li kupci mogu slati ponude."
                  right={<Switch checked={acceptsOffers} onCheckedChange={setAcceptsOffers} />}
                />
                <div className="h-3" />
              </Card>

              <Card>
                <CardHeader icon={FiSliders} title="Opis" subtitle="Kratko o tebi / poslovanju." />
                <CardBody>
                  <Textarea className="resize-none rounded-2xl" rows={4} maxLength={500} value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} />
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 text-right">{businessDescription.length}/500</div>
                </CardBody>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader icon={FiSliders} title="Politika povrata" />
                  <CardBody>
                    <Textarea className="resize-none rounded-2xl" rows={3} maxLength={300} value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader icon={FiSliders} title="Dostava" />
                  <CardBody>
                    <Textarea className="resize-none rounded-2xl" rows={3} maxLength={300} value={shippingInfo} onChange={(e) => setShippingInfo(e.target.value)} />
                  </CardBody>
                </Card>
              </div>

              <Card>
                <CardHeader icon={FiSliders} title="Društvene mreže" subtitle="Opcionalno." />
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Facebook</Label>
                      <Input className="h-11 mt-2 rounded-2xl" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="https://facebook.com/..." />
                      {errors.socialFacebook ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.socialFacebook}</div> : null}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Instagram</Label>
                      <Input className="h-11 mt-2 rounded-2xl" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="https://instagram.com/..." />
                      {errors.socialInstagram ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.socialInstagram}</div> : null}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">TikTok</Label>
                      <Input className="h-11 mt-2 rounded-2xl" value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} placeholder="https://tiktok.com/@..." />
                      {errors.socialTiktok ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.socialTiktok}</div> : null}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">YouTube</Label>
                      <Input className="h-11 mt-2 rounded-2xl" value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} placeholder="https://youtube.com/..." />
                      {errors.socialYoutube ? <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.socialYoutube}</div> : null}
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Website</Label>
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
              icon={FiEye}
              title="Preview"
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
                    <FiSmartphone /> Mobile
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
                    <FiMonitor /> Desktop
                  </button>
                </div>
              }
            />
            <CardBody>
              <div
                className={cn(
                  "mx-auto",
                  previewMode === "mobile"
                    ? "max-w-[380px] rounded-[34px] bg-slate-100 dark:bg-slate-950 p-3"
                    : "max-w-none"
                )}
              >
                <SellerPreviewCard
                  seller={previewSeller}
                  sellerSettings={previewSettings}
                  badges={currentUser?.badges || []}
                  ratings={currentUser?.ratings || null}
                  isPro={isPro}
                  isShop={isShop}
                  actionsDisabled
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex-1 gap-2 rounded-2xl" onClick={handleReset} disabled={isSaving || isAvatarUploading}>
            <FiRefreshCw /> Reset
          </Button>
          <Button className="flex-1 gap-2 rounded-2xl" onClick={handleSave} disabled={isSaving || isAvatarUploading || !hasChanges || !isValid}>
            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave />}
            Sačuvaj
          </Button>
        </div>
      </div>

      <div className="sm:hidden h-16" />
    </div>
  );
};

export default SellerSettings;