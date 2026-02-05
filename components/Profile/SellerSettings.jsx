"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { motion } from "framer-motion";

import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Shield,
  Truck,
  RotateCcw,
  Globe,
  Camera,
  Save,
  RefreshCw,
  Loader2,
  AlertCircle,
  BadgeCheck,
  Eye,
  EyeOff,
  Star,
  Calendar,
  Zap,
  Store,
  ChevronRight,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { sellerSettingsApi, updateProfileApi } from "@/utils/api";
import { userSignUpData, userUpdateData } from "@/redux/reducer/authSlice";

// ============================================
// KONSTANTE
// ============================================
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = {
  monday: "Ponedjeljak",
  tuesday: "Utorak",
  wednesday: "Srijeda",
  thursday: "Četvrtak",
  friday: "Petak",
  saturday: "Subota",
  sunday: "Nedjelja",
};

const defaultBusinessHours = DAYS.reduce((acc, day) => {
  acc[day] = { open: "09:00", close: "17:00", enabled: day !== "saturday" && day !== "sunday" };
  return acc;
}, {});

const defaultCardPreferences = {
  show_ratings: true,
  show_badges: true,
  show_member_since: true,
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
  let obj = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
  if (!obj || typeof obj !== "object") obj = {};
  return DAYS.reduce((acc, day) => {
    const base = defaultBusinessHours[day];
    const d = obj?.[day] || {};
    acc[day] = { open: d.open || base.open, close: d.close || base.close, enabled: d.enabled ?? base.enabled };
    return acc;
  }, {});
};

const normalizeCardPreferences = (raw) => {
  let obj = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
  return { ...defaultCardPreferences, ...(obj || {}) };
};

const stableStringify = (value) => JSON.stringify(value, Object.keys(value).sort());

// ============================================
// UI KOMPONENTE
// ============================================
const SettingRow = ({ icon: Icon, title, description, checked, onChange, disabled }) => (
  <div className={cn(
    "flex items-center justify-between gap-4 p-4 rounded-xl border transition-all",
    checked ? "bg-primary/5 border-primary/20" : "bg-slate-50 border-slate-100",
    disabled && "opacity-50"
  )}>
    <div className="flex items-center gap-3 min-w-0">
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
        checked ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

const SectionTitle = ({ children, badge }) => (
  <div className="flex items-center gap-2 mb-4">
    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{children}</h3>
    {badge && (
      <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">
        {badge}
      </span>
    )}
  </div>
);

const StatusBadge = ({ verified, className }) => (
  <div className={cn(
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
    verified 
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
      : "bg-slate-100 text-slate-600 border border-slate-200",
    className
  )}>
    <BadgeCheck className={cn("w-3.5 h-3.5", verified ? "text-emerald-500" : "text-slate-400")} />
    {verified ? "Verificiran" : "Nije verificiran"}
  </div>
);

// ============================================
// GLAVNA KOMPONENTA
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

  // Kontakt postavke
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [showViber, setShowViber] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [viberNumber, setViberNumber] = useState("");

  // Dostupnost
  const [businessHours, setBusinessHours] = useState(defaultBusinessHours);
  const [responseTime, setResponseTime] = useState("auto");
  const [acceptsOffers, setAcceptsOffers] = useState(true);

  // Informacije
  const [businessDescription, setBusinessDescription] = useState("");
  const [shippingInfo, setShippingInfo] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");

  // Društvene mreže
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");

  // Prikaz kartice - šta kupci vide
  const [cardPreferences, setCardPreferences] = useState(defaultCardPreferences);

  // Odmor
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationMessage, setVacationMessage] = useState("");

  const initialPayloadRef = useRef(null);

  const buildPayload = useCallback(() => ({
    show_phone: showPhone,
    show_email: showEmail,
    show_whatsapp: showWhatsapp,
    show_viber: showViber,
    whatsapp_number: whatsappNumber,
    viber_number: viberNumber,
    business_hours: businessHours,
    response_time: responseTime,
    accepts_offers: acceptsOffers,
    business_description: businessDescription,
    shipping_info: shippingInfo,
    return_policy: returnPolicy,
    social_facebook: socialFacebook,
    social_instagram: socialInstagram,
    social_website: socialWebsite,
    card_preferences: cardPreferences,
    vacation_mode: vacationMode,
    vacation_message: vacationMessage,
  }), [
    showPhone, showEmail, showWhatsapp, showViber, whatsappNumber, viberNumber,
    businessHours, responseTime, acceptsOffers, businessDescription, shippingInfo,
    returnPolicy, socialFacebook, socialInstagram, socialWebsite, cardPreferences,
    vacationMode, vacationMessage
  ]);

  const hasChanges = useMemo(() => {
    if (!initialPayloadRef.current) return false;
    return stableStringify(buildPayload()) !== initialPayloadRef.current;
  }, [buildPayload]);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError("");
      const response = await sellerSettingsApi.getSettings();
      
      if (response?.data?.error !== false || !response?.data?.data) {
        setLoadError(response?.data?.message || "Greška pri učitavanju postavki.");
        return;
      }

      const s = response.data.data;
      setShowPhone(s.show_phone ?? true);
      setShowEmail(s.show_email ?? true);
      setShowWhatsapp(s.show_whatsapp ?? false);
      setShowViber(s.show_viber ?? false);
      setWhatsappNumber(s.whatsapp_number || "");
      setViberNumber(s.viber_number || "");
      setBusinessHours(normalizeBusinessHours(s.business_hours));
      setResponseTime(s.response_time || "auto");
      setAcceptsOffers(s.accepts_offers ?? true);
      setBusinessDescription(s.business_description || "");
      setShippingInfo(s.shipping_info || "");
      setReturnPolicy(s.return_policy || "");
      setSocialFacebook(s.social_facebook || "");
      setSocialInstagram(s.social_instagram || "");
      setSocialWebsite(s.social_website || "");
      setCardPreferences(normalizeCardPreferences(s.card_preferences));
      setVacationMode(s.vacation_mode ?? false);
      setVacationMessage(s.vacation_message || "");

      initialPayloadRef.current = stableStringify({
        show_phone: s.show_phone ?? true,
        show_email: s.show_email ?? true,
        show_whatsapp: s.show_whatsapp ?? false,
        show_viber: s.show_viber ?? false,
        whatsapp_number: s.whatsapp_number || "",
        viber_number: s.viber_number || "",
        business_hours: normalizeBusinessHours(s.business_hours),
        response_time: s.response_time || "auto",
        accepts_offers: s.accepts_offers ?? true,
        business_description: s.business_description || "",
        shipping_info: s.shipping_info || "",
        return_policy: s.return_policy || "",
        social_facebook: s.social_facebook || "",
        social_instagram: s.social_instagram || "",
        social_website: s.social_website || "",
        card_preferences: normalizeCardPreferences(s.card_preferences),
        vacation_mode: s.vacation_mode ?? false,
        vacation_message: s.vacation_message || "",
      });
    } catch (err) {
      console.error(err);
      setLoadError("Greška pri učitavanju postavki.");
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setIsSaving(true);
      const payload = buildPayload();
      const response = await sellerSettingsApi.updateSettings(payload);
      
      if (response?.data?.error === false) {
        initialPayloadRef.current = stableStringify(payload);
        toast.success("Postavke uspješno sačuvane!");
      } else {
        toast.error(response?.data?.message || "Greška pri spremanju.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Greška pri spremanju postavki.");
    } finally {
      setIsSaving(false);
    }
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
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error
  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">Greška</p>
            <p className="text-sm text-red-700 mt-1">{loadError}</p>
            <Button variant="outline" size="sm" onClick={fetchSettings} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Pokušaj ponovo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isVerified = currentUser?.is_verified === 1 || currentUser?.is_verified === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Postavke prodavača</h1>
          <p className="text-slate-500 mt-1">Upravljaj kako te kupci vide i kontaktiraju</p>
          <div className="mt-3">
            <StatusBadge verified={isVerified} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-xs text-primary font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Nesačuvane izmjene
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Sačuvaj
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lijeva kolona */}
        <div className="space-y-8">
          {/* Prikaz kartice */}
          <section>
            <SectionTitle badge="Važno">Šta kupci vide</SectionTitle>
            <p className="text-xs text-slate-500 mb-4">
              Kontroliši koje informacije se prikazuju na tvojoj prodavačkoj kartici na oglasima i profilu.
            </p>
            <div className="space-y-3">
              <SettingRow
                icon={Star}
                title="Ocjene i recenzije"
                description="Prikaži prosječnu ocjenu i broj recenzija"
                checked={cardPreferences.show_ratings}
                onChange={(v) => updateCardPref("show_ratings", v)}
              />
              <SettingRow
                icon={BadgeCheck}
                title="Bedževi"
                description="Prikaži osvojene bedževe"
                checked={cardPreferences.show_badges}
                onChange={(v) => updateCardPref("show_badges", v)}
              />
              <SettingRow
                icon={Calendar}
                title="Datum registracije"
                description="Prikaži kada si se registrovao"
                checked={cardPreferences.show_member_since}
                onChange={(v) => updateCardPref("show_member_since", v)}
              />
              <SettingRow
                icon={Zap}
                title="Vrijeme odgovora"
                description="Prikaži koliko brzo odgovaraš"
                checked={cardPreferences.show_response_time}
                onChange={(v) => updateCardPref("show_response_time", v)}
              />
              <SettingRow
                icon={Clock}
                title="Radno vrijeme"
                description="Prikaži radno vrijeme (samo za trgovine)"
                checked={cardPreferences.show_business_hours}
                onChange={(v) => updateCardPref("show_business_hours", v)}
              />
              <SettingRow
                icon={Truck}
                title="Informacije o dostavi"
                description="Prikaži način i uslove dostave"
                checked={cardPreferences.show_shipping_info}
                onChange={(v) => updateCardPref("show_shipping_info", v)}
              />
              <SettingRow
                icon={RotateCcw}
                title="Politika povrata"
                description="Prikaži uslove povrata"
                checked={cardPreferences.show_return_policy}
                onChange={(v) => updateCardPref("show_return_policy", v)}
              />
            </div>
          </section>

          {/* Kontakt */}
          <section>
            <SectionTitle>Kontakt opcije</SectionTitle>
            <p className="text-xs text-slate-500 mb-4">
              Odaberi koje kontakt opcije kupci mogu koristiti.
            </p>
            <div className="space-y-3">
              <SettingRow
                icon={Phone}
                title="Telefon"
                description="Kupci mogu vidjeti tvoj broj"
                checked={showPhone}
                onChange={setShowPhone}
              />
              <SettingRow
                icon={Mail}
                title="Email"
                description="Kupci mogu vidjeti tvoj email"
                checked={showEmail}
                onChange={setShowEmail}
              />
              <SettingRow
                icon={MessageCircle}
                title="WhatsApp"
                description="Omogući kontakt putem WhatsApp-a"
                checked={showWhatsapp}
                onChange={setShowWhatsapp}
              />
              {showWhatsapp && (
                <div className="pl-14">
                  <Input
                    placeholder="+387 61 123 456"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="h-10"
                  />
                </div>
              )}
              <SettingRow
                icon={Phone}
                title="Viber"
                description="Omogući kontakt putem Viber-a"
                checked={showViber}
                onChange={setShowViber}
              />
              {showViber && (
                <div className="pl-14">
                  <Input
                    placeholder="+387 61 123 456"
                    value={viberNumber}
                    onChange={(e) => setViberNumber(e.target.value)}
                    className="h-10"
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Desna kolona */}
        <div className="space-y-8">
          {/* Informacije */}
          <section>
            <SectionTitle>Informacije</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">O tebi</label>
                <Textarea
                  placeholder="Ukratko o sebi i šta prodaješ..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Dostava</label>
                <Textarea
                  placeholder="Način slanja, rokovi, cijene dostave..."
                  value={shippingInfo}
                  onChange={(e) => setShippingInfo(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Povrat</label>
                <Textarea
                  placeholder="Uslovi povrata i zamjene..."
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div>
            </div>
          </section>

          {/* Vrijeme odgovora */}
          <section>
            <SectionTitle>Dostupnost</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">Prosječno vrijeme odgovora</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "auto", label: "Automatski" },
                    { value: "instant", label: "Par minuta" },
                    { value: "few_hours", label: "Par sati" },
                    { value: "same_day", label: "Isti dan" },
                    { value: "few_days", label: "Par dana" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setResponseTime(opt.value)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        responseTime === opt.value
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <SettingRow
                icon={Shield}
                title="Primam ponude"
                description="Dopusti kupcima da šalju cjenovne ponude"
                checked={acceptsOffers}
                onChange={setAcceptsOffers}
              />
            </div>
          </section>

          {/* Društvene mreže */}
          <section>
            <SectionTitle>Društvene mreže</SectionTitle>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Facebook</label>
                <Input
                  placeholder="facebook.com/tvojprofil"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Instagram</label>
                <Input
                  placeholder="instagram.com/tvojprofil"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Web stranica</label>
                <Input
                  placeholder="https://tvojasstranica.ba"
                  value={socialWebsite}
                  onChange={(e) => setSocialWebsite(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Odmor */}
          <section>
            <SectionTitle>Način odmora</SectionTitle>
            <div className="space-y-3">
              <SettingRow
                icon={EyeOff}
                title="Aktiviraj odmor"
                description="Kupci će vidjeti da trenutno nisi dostupan"
                checked={vacationMode}
                onChange={setVacationMode}
              />
              {vacationMode && (
                <Textarea
                  placeholder="Poruka za kupce dok si na odmoru..."
                  value={vacationMessage}
                  onChange={(e) => setVacationMessage(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Radno vrijeme - puna širina */}
      <section className="pt-4 border-t border-slate-100">
        <SectionTitle>Radno vrijeme</SectionTitle>
        <p className="text-xs text-slate-500 mb-4">
          Postavi radno vrijeme ako imaš fizičku lokaciju ili definisan raspored.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DAYS.map((day) => (
            <div
              key={day}
              className={cn(
                "p-4 rounded-xl border transition-all",
                businessHours[day]?.enabled
                  ? "bg-white border-slate-200"
                  : "bg-slate-50 border-slate-100"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-900">
                  {DAY_LABELS[day]}
                </span>
                <Switch
                  checked={businessHours[day]?.enabled}
                  onCheckedChange={(v) => setDay(day, { enabled: v })}
                />
              </div>
              {businessHours[day]?.enabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={businessHours[day]?.open || "09:00"}
                    onChange={(e) => setDay(day, { open: e.target.value })}
                    className="h-9 text-sm"
                  />
                  <span className="text-slate-400">-</span>
                  <Input
                    type="time"
                    value={businessHours[day]?.close || "17:00"}
                    onChange={(e) => setDay(day, { close: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default SellerSettings;
