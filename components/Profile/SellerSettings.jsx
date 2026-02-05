"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import {
  IoCallOutline,
  IoMailOutline,
  IoLogoWhatsapp,
  IoTimeOutline,
  IoShieldCheckmarkOutline,
  IoAirplaneOutline,
  IoSaveOutline,
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoEyeOutline,
  IoStarOutline,
  IoCalendarOutline,
  IoFlashOutline,
  IoCarOutline,
  IoReturnDownBackOutline,
  IoLogoFacebook,
  IoLogoInstagram,
  IoLinkOutline,
  IoInformationCircleOutline,
  IoHourglassOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import { Loader2 } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";
import { sellerSettingsApi, getVerificationStatusApi } from "@/utils/api";
import { userSignUpData } from "@/redux/reducer/authSlice";

// ============================================
// KONSTANTE
// ============================================
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = {
  monday: "Pon",
  tuesday: "Uto",
  wednesday: "Sri",
  thursday: "Čet",
  friday: "Pet",
  saturday: "Sub",
  sunday: "Ned",
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
// HELPERI
// ============================================
const normalizeBusinessHours = (raw) => {
  let obj = raw;
  if (typeof raw === "string") {
    try { obj = JSON.parse(raw); } catch { obj = null; }
  }
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
  let obj = raw;
  if (typeof raw === "string") {
    try { obj = JSON.parse(raw); } catch { obj = null; }
  }
  if (!obj || typeof obj !== "object") obj = {};
  return { ...defaultCardPreferences, ...obj };
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

const withTimeout = (promise, ms = 15000) => 
  Promise.race([
    promise, 
    new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))
  ]);

// ============================================
// UI KOMPONENTE - ProfileDropdown stil
// ============================================
const MenuSection = ({ title, children }) => (
  <div className="py-1.5">
    {title && (
      <p className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </p>
    )}
    <div className="space-y-0.5">{children}</div>
  </div>
);

const MenuDivider = () => <div className="h-px bg-slate-100 mx-3 my-1" />;

const SettingRow = ({ icon: Icon, label, description, checked, onChange, disabled }) => (
  <div
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
      checked ? "bg-primary/5" : "hover:bg-slate-50/80",
      disabled && "opacity-50"
    )}
  >
    <div
      className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
        checked ? "bg-primary/10" : "bg-slate-100"
      )}
    >
      <Icon size={18} className={cn(checked ? "text-primary" : "text-slate-500")} />
    </div>
    <div className="flex-1 min-w-0">
      <span className="text-sm font-medium text-slate-700 block">{label}</span>
      {description && <span className="text-[11px] text-slate-400 block">{description}</span>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

const InputRow = ({ icon: Icon, label, placeholder, value, onChange, type = "text" }) => (
  <div className="flex items-start gap-3 px-3 py-2.5">
    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-100 flex-shrink-0">
      <Icon size={18} className="text-slate-500" />
    </div>
    <div className="flex-1 min-w-0">
      <span className="text-sm font-medium text-slate-700 block mb-1.5">{label}</span>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-sm"
      />
    </div>
  </div>
);

const TextareaRow = ({ icon: Icon, label, placeholder, value, onChange }) => (
  <div className="flex items-start gap-3 px-3 py-2.5">
    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-100 flex-shrink-0 mt-0.5">
      <Icon size={18} className="text-slate-500" />
    </div>
    <div className="flex-1 min-w-0">
      <span className="text-sm font-medium text-slate-700 block mb-1.5">{label}</span>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[60px] text-sm resize-none"
      />
    </div>
  </div>
);

const QuickStat = ({ icon: Icon, value, label, color = "blue" }) => {
  const colors = {
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-500 bg-green-50",
    amber: "text-amber-500 bg-amber-50",
    purple: "text-purple-500 bg-purple-50",
  };

  return (
    <div className="flex flex-col items-center gap-1 p-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <span className="text-sm font-bold text-slate-800">{value}</span>
      <span className="text-[10px] text-slate-400 font-medium">{label}</span>
    </div>
  );
};

const ResponseTimeButton = ({ label, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "px-3 py-2 rounded-lg text-xs font-medium transition-all",
      isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    )}
  >
    {label}
  </button>
);

const VerificationBadge = ({ status }) => {
  const config = {
    approved: { icon: IoCheckmarkCircleOutline, text: "Verificiran", bg: "bg-green-50", border: "border-green-200", textColor: "text-green-700", iconColor: "text-green-500" },
    pending: { icon: IoHourglassOutline, text: "Na čekanju", bg: "bg-amber-50", border: "border-amber-200", textColor: "text-amber-700", iconColor: "text-amber-500" },
    submitted: { icon: IoHourglassOutline, text: "Na čekanju", bg: "bg-amber-50", border: "border-amber-200", textColor: "text-amber-700", iconColor: "text-amber-500" },
    resubmitted: { icon: IoHourglassOutline, text: "Na pregledu", bg: "bg-amber-50", border: "border-amber-200", textColor: "text-amber-700", iconColor: "text-amber-500" },
    rejected: { icon: IoAlertCircleOutline, text: "Odbijeno", bg: "bg-red-50", border: "border-red-200", textColor: "text-red-700", iconColor: "text-red-500" },
    "not applied": { icon: IoAlertCircleOutline, text: "Nije verificiran", bg: "bg-slate-50", border: "border-slate-200", textColor: "text-slate-600", iconColor: "text-slate-400" },
  };

  const c = config[status] || config["not applied"];
  const Icon = c.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border", c.bg, c.border, c.textColor)}>
      <Icon size={12} className={c.iconColor} />
      {c.text}
    </span>
  );
};

// ============================================
// GLAVNA KOMPONENTA
// ============================================
const SellerSettings = () => {
  const currentUser = useSelector(userSignUpData);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Verification status
  const [verificationStatus, setVerificationStatus] = useState("not applied");

  // Kontakt
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [showViber, setShowViber] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [viberNumber, setViberNumber] = useState("");
  const [preferredContact, setPreferredContact] = useState("message");

  // Dostupnost
  const [businessHours, setBusinessHours] = useState(defaultBusinessHours);
  const [responseTime, setResponseTime] = useState("auto");
  const [acceptsOffers, setAcceptsOffers] = useState(true);

  // Auto reply
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState("Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku.");

  // Odmor
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationMessage, setVacationMessage] = useState("Trenutno sam na odmoru.");
  const [vacationStartDate, setVacationStartDate] = useState("");
  const [vacationEndDate, setVacationEndDate] = useState("");
  const [vacationAutoActivate, setVacationAutoActivate] = useState(false);

  // Informacije
  const [businessDescription, setBusinessDescription] = useState("");
  const [shippingInfo, setShippingInfo] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");

  // Socijalne mreže
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");

  // Card preferences
  const [cardPreferences, setCardPreferences] = useState(defaultCardPreferences);

  const initialPayloadRef = useRef(null);

  // Build payload - ISTO KAO ORIGINALNA VERZIJA
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
    card_preferences: cardPreferences,
  }), [
    showPhone, showEmail, showWhatsapp, showViber, whatsappNumber, viberNumber, preferredContact,
    businessHours, responseTime, acceptsOffers, autoReplyEnabled, autoReplyMessage,
    vacationMode, vacationMessage, vacationStartDate, vacationEndDate, vacationAutoActivate,
    businessDescription, returnPolicy, shippingInfo,
    socialFacebook, socialInstagram, socialTiktok, socialYoutube, socialWebsite,
    cardPreferences
  ]);

  const hasChanges = useMemo(() => {
    if (!initialPayloadRef.current) return false;
    return stableStringify(buildPayload()) !== initialPayloadRef.current;
  }, [buildPayload]);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      const [verificationRes, settingsRes] = await Promise.all([
        getVerificationStatusApi.getVerificationStatus().catch(() => ({ data: { error: true } })),
        sellerSettingsApi.getSettings(),
      ]);

      // Verifikacija
      if (verificationRes?.data?.error === true) {
        setVerificationStatus("not applied");
      } else {
        setVerificationStatus(verificationRes?.data?.data?.status || "not applied");
      }

      // Postavke
      console.log("========================================");
      console.log("📥 SELLER SETTINGS - LOAD RESPONSE");
      console.log("========================================");
      console.log("Full response:", settingsRes);
      console.log("Response data:", settingsRes?.data);
      console.log("Settings object:", settingsRes?.data?.data);
      
      if (settingsRes?.data?.error !== false) {
        const errMsg = settingsRes?.data?.message || "Greška pri učitavanju.";
        console.error("❌ Greška pri učitavanju:", errMsg);
        setLoadError(errMsg);
        return;
      }

      const s = settingsRes.data.data || {};
      console.log("✅ Učitane postavke:", s);
      
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

      // Spremi inicijalno stanje
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
        auto_reply_message: s.auto_reply_message || "Hvala na poruci!",
        vacation_mode: s.vacation_mode ?? false,
        vacation_message: s.vacation_message || "Na odmoru sam.",
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
        card_preferences: normalizeCardPreferences(s.card_preferences),
      });
    } catch (err) {
      console.error("Greška pri učitavanju:", err);
      setLoadError("Greška pri učitavanju postavki.");
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // SAVE
  const handleSave = async () => {
    if (!hasChanges) {
      console.log("⚠️ Nema promjena za spremiti");
      return;
    }

    try {
      setIsSaving(true);
      const payload = buildPayload();
      
      console.log("========================================");
      console.log("📤 SELLER SETTINGS - SAVE REQUEST");
      console.log("========================================");
      console.log("Payload:", JSON.stringify(payload, null, 2));
      
      // Direktan poziv API funkcije
      const response = await sellerSettingsApi.updateSettings(payload);
      
      console.log("========================================");
      console.log("📥 SELLER SETTINGS - SERVER RESPONSE");
      console.log("========================================");
      console.log("Full response:", response);
      console.log("Response data:", response?.data);
      console.log("Error field:", response?.data?.error);
      console.log("Message field:", response?.data?.message);
      
      if (response?.data?.error === false) {
        initialPayloadRef.current = stableStringify(payload);
        toast.success("Postavke sačuvane!");
        console.log("✅ Postavke uspješno sačuvane!");
      } else {
        const errMsg = response?.data?.message || "Nepoznata greška od servera";
        toast.error(errMsg);
        console.error("❌ Server vratio grešku:", errMsg);
      }
    } catch (err) {
      console.log("========================================");
      console.error("❌ SELLER SETTINGS - EXCEPTION");
      console.log("========================================");
      console.error("Error object:", err);
      console.error("Error message:", err?.message);
      console.error("Error response:", err?.response?.data);
      toast.error("Greška pri spremanju: " + (err?.message || "Nepoznata greška"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    await fetchSettings();
    toast.success("Postavke vraćene.");
  };

  const updateCardPref = (key, value) => {
    setCardPreferences(prev => ({ ...prev, [key]: value }));
  };

  const setDay = (day, patch) => {
    setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

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
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-100">
            <IoAlertCircleOutline size={18} className="text-red-500" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-red-800 block">Greška</span>
            <span className="text-[11px] text-red-600 block">{loadError}</span>
          </div>
          <button onClick={fetchSettings} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors">
            Ponovo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Postavke prodavača</h2>
          <p className="text-[11px] text-slate-400">Kontroliše prikaz na tvojim oglasima</p>
        </div>
        <div className="flex items-center gap-2">
          <VerificationBadge status={verificationStatus} />
          {hasChanges && (
            <button onClick={handleReset} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
              <IoRefreshOutline size={16} className="text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* QUICK STATS */}
        <div className="px-4 py-3 bg-gradient-to-br from-slate-50/50 to-white border-b border-slate-100">
          <div className="grid grid-cols-4 gap-1 bg-white rounded-xl p-2 border border-slate-100">
            <QuickStat icon={IoEyeOutline} value={cardPreferences.show_ratings ? "Da" : "Ne"} label="Ocjene" color="amber" />
            <QuickStat icon={IoStarOutline} value={cardPreferences.show_badges ? "Da" : "Ne"} label="Bedževi" color="purple" />
            <QuickStat icon={IoFlashOutline} value={cardPreferences.show_response_time ? "Da" : "Ne"} label="Odgovor" color="blue" />
            <QuickStat icon={IoCalendarOutline} value={cardPreferences.show_member_since ? "Da" : "Ne"} label="Član od" color="green" />
          </div>
        </div>

        {/* SAVE BUTTON */}
        {hasChanges && (
          <div className="px-4 py-3 border-b border-slate-100">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <IoSaveOutline size={16} />}
              Sačuvaj promjene
            </button>
          </div>
        )}

        <div className="px-2 pb-2">
          {/* CARD PREFERENCES */}
          <MenuSection title="Šta kupci vide na tvojim oglasima">
            <SettingRow icon={IoStarOutline} label="Ocjene i recenzije" description="Prosječna ocjena i broj recenzija" checked={cardPreferences.show_ratings} onChange={(v) => updateCardPref("show_ratings", v)} />
            <SettingRow icon={IoShieldCheckmarkOutline} label="Bedževi" description="Osvojeni bedževi" checked={cardPreferences.show_badges} onChange={(v) => updateCardPref("show_badges", v)} />
            <SettingRow icon={IoCalendarOutline} label="Datum registracije" description="Kada si se registrovao" checked={cardPreferences.show_member_since} onChange={(v) => updateCardPref("show_member_since", v)} />
            <SettingRow icon={IoFlashOutline} label="Vrijeme odgovora" description="Koliko brzo odgovaraš" checked={cardPreferences.show_response_time} onChange={(v) => updateCardPref("show_response_time", v)} />
            <SettingRow icon={IoTimeOutline} label="Radno vrijeme" description="Samo za trgovine" checked={cardPreferences.show_business_hours} onChange={(v) => updateCardPref("show_business_hours", v)} />
            <SettingRow icon={IoCarOutline} label="Info o dostavi" description="Način i uslovi dostave" checked={cardPreferences.show_shipping_info} onChange={(v) => updateCardPref("show_shipping_info", v)} />
            <SettingRow icon={IoReturnDownBackOutline} label="Politika povrata" description="Uslovi povrata" checked={cardPreferences.show_return_policy} onChange={(v) => updateCardPref("show_return_policy", v)} />
          </MenuSection>

          <MenuDivider />

          {/* CONTACT */}
          <MenuSection title="Kontakt opcije">
            <SettingRow icon={IoCallOutline} label="Telefon" description="Kupci vide tvoj broj" checked={showPhone} onChange={setShowPhone} />
            <SettingRow icon={IoMailOutline} label="Email" description="Kupci vide tvoj email" checked={showEmail} onChange={setShowEmail} />
            <SettingRow icon={IoLogoWhatsapp} label="WhatsApp" description="Kontakt putem WhatsApp-a" checked={showWhatsapp} onChange={setShowWhatsapp} />
            {showWhatsapp && <InputRow icon={IoLogoWhatsapp} label="WhatsApp broj" placeholder="+387 61 123 456" value={whatsappNumber} onChange={setWhatsappNumber} />}
            <SettingRow icon={IoCallOutline} label="Viber" description="Kontakt putem Viber-a" checked={showViber} onChange={setShowViber} />
            {showViber && <InputRow icon={IoCallOutline} label="Viber broj" placeholder="+387 61 123 456" value={viberNumber} onChange={setViberNumber} />}
          </MenuSection>

          <MenuDivider />

          {/* AVAILABILITY */}
          <MenuSection title="Dostupnost">
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-100">
                  <IoFlashOutline size={18} className="text-slate-500" />
                </div>
                <span className="text-sm font-medium text-slate-700">Vrijeme odgovora</span>
              </div>
              <div className="flex flex-wrap gap-2 ml-12">
                {[{ value: "auto", label: "Auto" }, { value: "instant", label: "Minuti" }, { value: "few_hours", label: "Sati" }, { value: "same_day", label: "24h" }, { value: "few_days", label: "Dani" }].map((opt) => (
                  <ResponseTimeButton key={opt.value} label={opt.label} isActive={responseTime === opt.value} onClick={() => setResponseTime(opt.value)} />
                ))}
              </div>
            </div>
            <SettingRow icon={IoShieldCheckmarkOutline} label="Primam ponude" description="Kupci mogu slati cjenovne ponude" checked={acceptsOffers} onChange={setAcceptsOffers} />
          </MenuSection>

          <MenuDivider />

          {/* INFO */}
          <MenuSection title="Informacije">
            <TextareaRow icon={IoInformationCircleOutline} label="O tebi" placeholder="Ukratko o sebi i šta prodaješ..." value={businessDescription} onChange={setBusinessDescription} />
            <TextareaRow icon={IoCarOutline} label="Dostava" placeholder="Način slanja, rokovi, cijene..." value={shippingInfo} onChange={setShippingInfo} />
            <TextareaRow icon={IoReturnDownBackOutline} label="Povrat" placeholder="Uslovi povrata i zamjene..." value={returnPolicy} onChange={setReturnPolicy} />
          </MenuSection>

          <MenuDivider />

          {/* SOCIAL */}
          <MenuSection title="Društvene mreže">
            <InputRow icon={IoLogoFacebook} label="Facebook" placeholder="facebook.com/tvojprofil" value={socialFacebook} onChange={setSocialFacebook} />
            <InputRow icon={IoLogoInstagram} label="Instagram" placeholder="instagram.com/tvojprofil" value={socialInstagram} onChange={setSocialInstagram} />
            <InputRow icon={IoLinkOutline} label="Web stranica" placeholder="https://tvojasstranica.ba" value={socialWebsite} onChange={setSocialWebsite} />
          </MenuSection>

          <MenuDivider />

          {/* VACATION */}
          <MenuSection title="Odmor">
            <SettingRow icon={IoAirplaneOutline} label="Aktiviraj odmor" description="Kupci vide da nisi dostupan" checked={vacationMode} onChange={setVacationMode} />
            {vacationMode && <TextareaRow icon={IoAirplaneOutline} label="Poruka za odmor" placeholder="Poruka za kupce dok si na odmoru..." value={vacationMessage} onChange={setVacationMessage} />}
          </MenuSection>

          <MenuDivider />

          {/* BUSINESS HOURS */}
          <MenuSection title="Radno vrijeme">
            <div className="px-3 py-2.5 space-y-2">
              {DAYS.map((day) => (
                <div key={day} className={cn("flex items-center gap-3 p-2.5 rounded-xl border transition-all", businessHours[day]?.enabled ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100")}>
                  <Switch checked={businessHours[day]?.enabled} onCheckedChange={(v) => setDay(day, { enabled: v })} />
                  <span className="text-sm font-medium text-slate-700 w-10">{DAY_LABELS[day]}</span>
                  {businessHours[day]?.enabled && (
                    <div className="flex items-center gap-2 flex-1">
                      <Input type="time" value={businessHours[day]?.open || "09:00"} onChange={(e) => setDay(day, { open: e.target.value })} className="h-8 text-xs w-24" />
                      <span className="text-slate-400 text-xs">-</span>
                      <Input type="time" value={businessHours[day]?.close || "17:00"} onChange={(e) => setDay(day, { close: e.target.value })} className="h-8 text-xs w-24" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </MenuSection>
        </div>
      </div>
    </div>
  );
};

export default SellerSettings;
