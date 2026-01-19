"use client";
import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  MdPhone,
  MdEmail,
  MdWhatsapp,
  MdAccessTime,
  MdAutorenew,
  MdBeachAccess,
  MdStorefront,
  MdLocalShipping,
  MdAssignmentReturn,
  MdLink,
  MdSave,
  MdExpandMore,
  MdExpandLess,
  MdInfo,
  MdCheck,
  MdClose,
  MdSettings,
  MdContactPhone,
  MdMessage,
  MdShare,
  MdSchedule,
  MdQuestionAnswer,
  MdLocalOffer
} from "react-icons/md";
import {
  FaViber,
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaGlobe
} from "react-icons/fa";
import { sellerSettingsApi } from "@/utils/api";
import { userSignUpData, setUserData } from "@/redux/reducer/authSlice";
import { cn } from "@/lib/utils";

// Sekcija wrapper komponenta
const SettingsSection = ({
  icon: Icon,
  title,
  description,
  children,
  defaultOpen = true,
  badge = null
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
            <Icon className="text-primary text-xl" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800">{title}</h3>
              {badge && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        {isOpen ? (
          <MdExpandLess className="text-2xl text-slate-400" />
        ) : (
          <MdExpandMore className="text-2xl text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <div className="pt-5 space-y-5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

// Switch sa labelom
const SettingSwitch = ({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
  disabled = false
}) => (
  <div className={cn(
    "flex items-start justify-between gap-4 p-4 rounded-xl transition-colors",
    checked ? "bg-green-50/50 border border-green-100" : "bg-slate-50/50 border border-slate-100",
    disabled && "opacity-50"
  )}>
    <div className="flex items-start gap-3">
      {Icon && (
        <div className={cn(
          "p-2 rounded-lg mt-0.5",
          checked ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500"
        )}>
          <Icon className="text-lg" />
        </div>
      )}
      <div>
        <p className="font-medium text-slate-800">{label}</p>
        {description && (
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      className="flex-shrink-0"
    />
  </div>
);

// Input polje sa ikonom
const SettingInput = ({
  label,
  placeholder,
  value,
  onChange,
  icon: Icon,
  type = "text",
  disabled = false
}) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-slate-700">{label}</Label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon className="text-lg" />
        </div>
      )}
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn("h-11", Icon && "pl-10")}
      />
    </div>
  </div>
);

// Glavna komponenta
const SellerSettings = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(userSignUpData);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Kontakt postavke
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [showViber, setShowViber] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [viberNumber, setViberNumber] = useState("");
  const [preferredContact, setPreferredContact] = useState("message");

  // Radno vrijeme
  const [businessHours, setBusinessHours] = useState({
    monday: { open: "09:00", close: "17:00", enabled: true },
    tuesday: { open: "09:00", close: "17:00", enabled: true },
    wednesday: { open: "09:00", close: "17:00", enabled: true },
    thursday: { open: "09:00", close: "17:00", enabled: true },
    friday: { open: "09:00", close: "17:00", enabled: true },
    saturday: { open: "09:00", close: "13:00", enabled: false },
    sunday: { open: "09:00", close: "13:00", enabled: false },
  });
  const [responseTime, setResponseTime] = useState("few_hours");

  // Ponude
  const [acceptsOffers, setAcceptsOffers] = useState(true);

  // Auto-reply
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState(
    "Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku."
  );

  // Vacation mode
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationMessage, setVacationMessage] = useState(
    "Trenutno sam na odmoru. Vratit ću se uskoro!"
  );

  // Poslovne informacije
  const [businessDescription, setBusinessDescription] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [shippingInfo, setShippingInfo] = useState("");

  // Društvene mreže
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");

  // Dohvati postavke
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await sellerSettingsApi.getSettings();

      if (response?.data?.error === false && response?.data?.data) {
        const settings = response.data.data;

        // Postavi vrijednosti
        setShowPhone(settings.show_phone ?? true);
        setShowEmail(settings.show_email ?? true);
        setShowWhatsapp(settings.show_whatsapp ?? false);
        setShowViber(settings.show_viber ?? false);
        setWhatsappNumber(settings.whatsapp_number || "");
        setViberNumber(settings.viber_number || "");
        setPreferredContact(settings.preferred_contact_method || "message");

        if (settings.business_hours) {
          try {
            const hours = typeof settings.business_hours === 'string'
              ? JSON.parse(settings.business_hours)
              : settings.business_hours;
            setBusinessHours(hours);
          } catch {}
        }

        setResponseTime(settings.response_time || "few_hours");
        setAcceptsOffers(settings.accepts_offers ?? true);
        setAutoReplyEnabled(settings.auto_reply_enabled ?? false);
        setAutoReplyMessage(settings.auto_reply_message || "Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku.");
        setVacationMode(settings.vacation_mode ?? false);
        setVacationMessage(settings.vacation_message || "Trenutno sam na odmoru. Vratit ću se uskoro!");
        setBusinessDescription(settings.business_description || "");
        setReturnPolicy(settings.return_policy || "");
        setShippingInfo(settings.shipping_info || "");
        setSocialFacebook(settings.social_facebook || "");
        setSocialInstagram(settings.social_instagram || "");
        setSocialTiktok(settings.social_tiktok || "");
        setSocialYoutube(settings.social_youtube || "");
        setSocialWebsite(settings.social_website || "");
      }
    } catch (error) {
      console.error("Greška pri dohvaćanju postavki:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Sačuvaj postavke
  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await sellerSettingsApi.updateSettings({
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
      });

      if (response?.data?.error === false) {
        toast.success("Postavke su uspješno sačuvane!");
        setHasChanges(false);
      } else {
        toast.error(response?.data?.message || "Greška pri čuvanju postavki");
      }
    } catch (error) {
      toast.error("Greška pri čuvanju postavki");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Pratimo promjene
  useEffect(() => {
    if (!isLoading) {
      setHasChanges(true);
    }
  }, [
    showPhone, showEmail, showWhatsapp, showViber,
    whatsappNumber, viberNumber, preferredContact,
    businessHours, responseTime, acceptsOffers, autoReplyEnabled, autoReplyMessage,
    vacationMode, vacationMessage, businessDescription,
    returnPolicy, shippingInfo, socialFacebook, socialInstagram,
    socialTiktok, socialYoutube, socialWebsite
  ]);

  const responseTimeOptions = [
    { value: "instant", label: "Odmah", desc: "Obično odgovaram za par minuta" },
    { value: "few_hours", label: "Par sati", desc: "Odgovaram u roku od nekoliko sati" },
    { value: "same_day", label: "Isti dan", desc: "Odgovaram u roku od 24 sata" },
    { value: "few_days", label: "Par dana", desc: "Može potrajati nekoliko dana" },
  ];

  const contactMethodOptions = [
    { value: "message", label: "Poruka u aplikaciji", icon: MdMessage },
    { value: "phone", label: "Telefonski poziv", icon: MdPhone },
    { value: "whatsapp", label: "WhatsApp", icon: MdWhatsapp },
    { value: "viber", label: "Viber", icon: FaViber },
    { value: "email", label: "Email", icon: MdEmail },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Postavke prodavača</h2>
          <p className="text-slate-500 mt-1">Prilagodite kako kupci kontaktiraju i vide vaš profil</p>
        </div>

        {hasChanges && !isLoading && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <MdSave className="text-lg" />
            )}
            <span>Sačuvaj promjene</span>
          </Button>
        )}
      </div>

      {/* Vacation Mode Alert */}
      {vacationMode && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <MdBeachAccess className="text-2xl text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">Vacation mode je aktivan</p>
            <p className="text-sm text-amber-600">Kupci će vidjeti poruku da ste na odmoru</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVacationMode(false)}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Isključi
          </Button>
        </div>
      )}

      {/* SEKCIJA 1: Kontakt opcije */}
      <SettingsSection
        icon={MdContactPhone}
        title="Kontakt opcije"
        description="Kontrolirajte kako vas kupci mogu kontaktirati"
      >
        <SettingSwitch
          icon={MdPhone}
          label="Prikaži broj telefona"
          description="Kupci mogu vidjeti vaš broj telefona na oglasima"
          checked={showPhone}
          onChange={setShowPhone}
        />

        <SettingSwitch
          icon={MdEmail}
          label="Prikaži email"
          description="Kupci mogu vidjeti vašu email adresu"
          checked={showEmail}
          onChange={setShowEmail}
        />

        <SettingSwitch
          icon={MdWhatsapp}
          label="WhatsApp kontakt"
          description="Omogući kontakt putem WhatsApp-a"
          checked={showWhatsapp}
          onChange={setShowWhatsapp}
        />

        {showWhatsapp && (
          <div className="ml-11">
            <SettingInput
              label="WhatsApp broj"
              placeholder="+387 61 234 567"
              value={whatsappNumber}
              onChange={setWhatsappNumber}
              icon={MdWhatsapp}
            />
          </div>
        )}

        <SettingSwitch
          icon={FaViber}
          label="Viber kontakt"
          description="Omogući kontakt putem Viber-a"
          checked={showViber}
          onChange={setShowViber}
        />

        {showViber && (
          <div className="ml-11">
            <SettingInput
              label="Viber broj"
              placeholder="+387 61 234 567"
              value={viberNumber}
              onChange={setViberNumber}
              icon={FaViber}
            />
          </div>
        )}

        {/* Preferirani način kontakta */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            Preferirani način kontakta
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {contactMethodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferredContact(option.value)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium",
                  preferredContact === option.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                <option.icon className="text-lg" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* SEKCIJA 2: Vrijeme odgovora */}
      <SettingsSection
        icon={MdSchedule}
        title="Vrijeme odgovora"
        description="Postavite očekivano vrijeme odgovora na poruke"
      >
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            Koliko brzo obično odgovarate?
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {responseTimeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setResponseTime(option.value)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
                  responseTime === option.value
                    ? "bg-green-50 border-green-300"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                )}
              >
                <span className={cn(
                  "font-semibold",
                  responseTime === option.value ? "text-green-700" : "text-slate-700"
                )}>
                  {option.label}
                </span>
                <span className={cn(
                  "text-xs mt-1",
                  responseTime === option.value ? "text-green-600" : "text-slate-500"
                )}>
                  {option.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* SEKCIJA 3: Ponude i pregovaranje */}
      <SettingsSection
        icon={MdLocalOffer}
        title="Ponude i pregovaranje"
        description="Postavke za primanje ponuda od kupaca"
      >
        <SettingSwitch
          icon={MdLocalOffer}
          label="Prihvatam ponude"
          description="Kupci mogu slati ponude za vaše oglase"
          checked={acceptsOffers}
          onChange={setAcceptsOffers}
        />
      </SettingsSection>

      {/* SEKCIJA 4: Automatski odgovori */}
      <SettingsSection
        icon={MdAutorenew}
        title="Automatski odgovori"
        description="Automatski odgovarajte na nove poruke"
        badge="Pro"
      >
        <SettingSwitch
          icon={MdAutorenew}
          label="Automatski odgovor"
          description="Šalje automatsku poruku kada primite novu poruku"
          checked={autoReplyEnabled}
          onChange={setAutoReplyEnabled}
        />

        {autoReplyEnabled && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Poruka automatskog odgovora
            </Label>
            <Textarea
              value={autoReplyMessage}
              onChange={(e) => setAutoReplyMessage(e.target.value)}
              placeholder="Napišite poruku koja će se automatski slati..."
              rows={3}
              maxLength={300}
              className="resize-none"
            />
            <p className="text-xs text-slate-400 text-right">
              {autoReplyMessage.length}/300
            </p>
          </div>
        )}
      </SettingsSection>

      {/* SEKCIJA 5: Vacation mode */}
      <SettingsSection
        icon={MdBeachAccess}
        title="Vacation mode"
        description="Obavijestite kupce da ste privremeno nedostupni"
      >
        <SettingSwitch
          icon={MdBeachAccess}
          label="Vacation mode"
          description="Aktivirajte kada ste na odmoru ili privremeno nedostupni"
          checked={vacationMode}
          onChange={setVacationMode}
        />

        {vacationMode && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Poruka za kupce
            </Label>
            <Textarea
              value={vacationMessage}
              onChange={(e) => setVacationMessage(e.target.value)}
              placeholder="Napišite poruku koju će kupci vidjeti..."
              rows={2}
              maxLength={200}
              className="resize-none"
            />
          </div>
        )}
      </SettingsSection>

      {/* SEKCIJA 6: Radno vrijeme (Business Hours) */}
      <SettingsSection
        icon={MdSchedule}
        title="Radno vrijeme"
        description="Postavite kada ste dostupni za kupce"
        badge="Pro / Shop"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Kupci će vidjeti da li ste trenutno dostupni na osnovu vašeg radnog vremena.
          </p>

          {/* Dan po dan kalendar */}
          <div className="space-y-3">
            {[
              { key: 'monday', label: 'Ponedjeljak' },
              { key: 'tuesday', label: 'Utorak' },
              { key: 'wednesday', label: 'Srijeda' },
              { key: 'thursday', label: 'Četvrtak' },
              { key: 'friday', label: 'Petak' },
              { key: 'saturday', label: 'Subota' },
              { key: 'sunday', label: 'Nedjelja' },
            ].map(({ key, label }) => (
              <div
                key={key}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  businessHours[key]?.enabled
                    ? "bg-green-50/50 border-green-200"
                    : "bg-slate-50 border-slate-200"
                )}
              >
                {/* Toggle za dan */}
                <Switch
                  checked={businessHours[key]?.enabled ?? false}
                  onCheckedChange={(checked) => {
                    setBusinessHours(prev => ({
                      ...prev,
                      [key]: { ...prev[key], enabled: checked }
                    }));
                  }}
                />

                {/* Naziv dana */}
                <span className={cn(
                  "w-24 font-medium text-sm",
                  businessHours[key]?.enabled ? "text-slate-800" : "text-slate-400"
                )}>
                  {label}
                </span>

                {/* Vrijeme */}
                {businessHours[key]?.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={businessHours[key]?.open || "09:00"}
                      onChange={(e) => {
                        setBusinessHours(prev => ({
                          ...prev,
                          [key]: { ...prev[key], open: e.target.value }
                        }));
                      }}
                      className="w-28 h-9 text-sm"
                    />
                    <span className="text-slate-400">-</span>
                    <Input
                      type="time"
                      value={businessHours[key]?.close || "17:00"}
                      onChange={(e) => {
                        setBusinessHours(prev => ({
                          ...prev,
                          [key]: { ...prev[key], close: e.target.value }
                        }));
                      }}
                      className="w-28 h-9 text-sm"
                    />
                  </div>
                ) : (
                  <span className="flex-1 text-sm text-slate-400 italic">Zatvoreno</span>
                )}
              </div>
            ))}
          </div>

          {/* Brzi presets */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                const defaultWorkday = { open: "09:00", close: "17:00", enabled: true };
                setBusinessHours({
                  monday: defaultWorkday,
                  tuesday: defaultWorkday,
                  wednesday: defaultWorkday,
                  thursday: defaultWorkday,
                  friday: defaultWorkday,
                  saturday: { open: "09:00", close: "13:00", enabled: false },
                  sunday: { open: "09:00", close: "13:00", enabled: false },
                });
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              Radni dani (Pon-Pet)
            </button>
            <button
              type="button"
              onClick={() => {
                const allDay = { open: "00:00", close: "23:59", enabled: true };
                setBusinessHours({
                  monday: allDay,
                  tuesday: allDay,
                  wednesday: allDay,
                  thursday: allDay,
                  friday: allDay,
                  saturday: allDay,
                  sunday: allDay,
                });
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              Uvijek dostupan
            </button>
            <button
              type="button"
              onClick={() => {
                const disabled = { open: "09:00", close: "17:00", enabled: false };
                setBusinessHours({
                  monday: disabled,
                  tuesday: disabled,
                  wednesday: disabled,
                  thursday: disabled,
                  friday: disabled,
                  saturday: disabled,
                  sunday: disabled,
                });
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              Resetuj
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* SEKCIJA 7: Poslovne informacije */}
      <SettingsSection
        icon={MdStorefront}
        title="Poslovne informacije"
        description="Dodatne informacije o vašem poslovanju"
        defaultOpen={false}
      >
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            O meni / O mom poslovanju
          </Label>
          <Textarea
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            placeholder="Opišite sebe ili svoje poslovanje..."
            rows={4}
            maxLength={500}
            className="resize-none"
          />
          <p className="text-xs text-slate-400 text-right">
            {businessDescription.length}/500
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            <div className="flex items-center gap-2">
              <MdAssignmentReturn className="text-lg text-slate-500" />
              <span>Politika povrata</span>
            </div>
          </Label>
          <Textarea
            value={returnPolicy}
            onChange={(e) => setReturnPolicy(e.target.value)}
            placeholder="Opišite vašu politiku povrata proizvoda..."
            rows={3}
            maxLength={300}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            <div className="flex items-center gap-2">
              <MdLocalShipping className="text-lg text-slate-500" />
              <span>Informacije o dostavi</span>
            </div>
          </Label>
          <Textarea
            value={shippingInfo}
            onChange={(e) => setShippingInfo(e.target.value)}
            placeholder="Opišite opcije dostave koje nudite..."
            rows={3}
            maxLength={300}
            className="resize-none"
          />
        </div>
      </SettingsSection>

      {/* SEKCIJA 8: Društvene mreže */}
      <SettingsSection
        icon={MdShare}
        title="Društvene mreže"
        description="Povežite vaše profile na društvenim mrežama"
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingInput
            label="Facebook"
            placeholder="https://facebook.com/..."
            value={socialFacebook}
            onChange={setSocialFacebook}
            icon={FaFacebook}
          />

          <SettingInput
            label="Instagram"
            placeholder="https://instagram.com/..."
            value={socialInstagram}
            onChange={setSocialInstagram}
            icon={FaInstagram}
          />

          <SettingInput
            label="TikTok"
            placeholder="https://tiktok.com/@..."
            value={socialTiktok}
            onChange={setSocialTiktok}
            icon={FaTiktok}
          />

          <SettingInput
            label="YouTube"
            placeholder="https://youtube.com/..."
            value={socialYoutube}
            onChange={setSocialYoutube}
            icon={FaYoutube}
          />

          <SettingInput
            label="Web stranica"
            placeholder="https://..."
            value={socialWebsite}
            onChange={setSocialWebsite}
            icon={FaGlobe}
          />
        </div>
      </SettingsSection>

      {/* Sticky Save Button na mobilnim */}
      {hasChanges && !isLoading && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg z-50 lg:hidden">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <MdSave className="text-lg" />
            )}
            <span>Sačuvaj promjene</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default SellerSettings;
