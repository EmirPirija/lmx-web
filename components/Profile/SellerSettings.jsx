"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { sellerSettingsApi, updateProfileApi } from "@/utils/api";
import { userSignUpData, userUpdateData } from "@/redux/reducer/authSlice";
import { cn } from "@/lib/utils";
import LmxAvatarGenerator from "@/components/Avatar/LmxAvatarGenerator";
// 1. IMPORTUJEMO TVOJU NOVU KOMPONENTU (Marketplace Stil)
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";
// 2. IMPORTUJEMO HELPER ZA KONVERZIJU REACT KOMPONENTE U STRING
import { renderToStaticMarkup } from "react-dom/server";

import {
  MdPhone,
  MdEmail,
  MdWhatsapp,
  MdAutorenew,
  MdBeachAccess,
  MdStorefront,
  MdLocalShipping,
  MdAssignmentReturn,
  MdSave,
  MdExpandMore,
  MdExpandLess,
  MdInfo,
  MdContactPhone,
  MdMessage,
  MdShare,
  MdSchedule,
  MdLocalOffer,
  MdAutoAwesome,
  MdPerson,
  MdEdit,
  MdCloudUpload,
} from "react-icons/md";
import { FaViber, FaFacebook, FaInstagram, FaTiktok, FaYoutube, FaGlobe } from "react-icons/fa";

/* =========================================================
   Helpers
========================================================= */

// Helper za konverziju SVG Stringa u Blob (Sliku)
const svgStringToBlob = (svgString) => {
  return new Promise((resolve) => {
    const img = new Image();
    
    // Dodajemo xmlns i dimenzije ako fale
    let stringToLoad = svgString;
    if (!stringToLoad.includes("xmlns")) {
        stringToLoad = stringToLoad.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    // Ako nema width/height, dodajemo ih da canvas zna dimenzije
    if (!stringToLoad.includes("width=")) {
         stringToLoad = stringToLoad.replace("<svg", '<svg width="500" height="500"');
    }

    const svgBlob = new Blob([stringToLoad], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 500, 500);

      canvas.toBlob((blob) => {
        resolve(blob);
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = url;
  });
};

function payloadFromServer(s) {
  return {
    avatar_id: s.avatar_id || "lmx-01",
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
  };
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

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
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    obj = {};
  }
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

// Lista dostupnih avatara (Marketplace tema - imena odgovaraju switch-u u LmxAvatarSvg)
const AVATARS = [
  { id: "lmx-01", name: "Shop" },
  { id: "lmx-02", name: "Rocket" },
  { id: "lmx-03", name: "Tag" },
  { id: "lmx-04", name: "Gem" },
  { id: "lmx-05", name: "Bolt" },
  { id: "lmx-06", name: "Heart" },
  { id: "lmx-07", name: "Star" },
  { id: "lmx-08", name: "Box" },
];

/* =========================================================
   UI components
========================================================= */

const SettingsSection = ({ icon: Icon, title, description, children, defaultOpen = true, badge = null }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <button
        type="button"
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
        {isOpen ? <MdExpandLess className="text-2xl text-slate-400" /> : <MdExpandMore className="text-2xl text-slate-400" />}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <div className="pt-5 space-y-5">{children}</div>
        </div>
      )}
    </div>
  );
};

const SettingSwitch = ({ label, description, checked, onChange, icon: Icon, disabled = false }) => (
  <div
    className={cn(
      "flex items-start justify-between gap-4 p-4 rounded-xl transition-colors",
      checked ? "bg-green-50/50 border border-green-100" : "bg-slate-50/50 border border-slate-100",
      disabled && "opacity-50"
    )}
  >
    <div className="flex items-start gap-3">
      {Icon && (
        <div className={cn("p-2 rounded-lg mt-0.5", checked ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500")}>
          <Icon className="text-lg" />
        </div>
      )}
      <div>
        <p className="font-medium text-slate-800">{label}</p>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="flex-shrink-0" />
  </div>
);

const SettingInput = ({ label, placeholder, value, onChange, icon: Icon, type = "text", disabled = false }) => (
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

/* =========================================================
   Main Component
========================================================= */

const SellerSettings = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(userSignUpData);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Avatar states
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const initialPayloadRef = useRef(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Settings states
  const [avatarId, setAvatarId] = useState("lmx-01");
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

  // Sync previewImage kad se currentUser učita
  useEffect(() => {
    if (currentUser?.profile_image) {
      setPreviewImage(currentUser.profile_image);
    }
  }, [currentUser]);

  const responseTimeOptions = useMemo(
    () => [
      { value: "auto", label: "Automatski", desc: "Sistem će pratiti i prikazati vaše prosječno vrijeme", icon: MdAutoAwesome, highlight: true },
      { value: "instant", label: "Odmah", desc: "Obično odgovaram za par minuta" },
      { value: "few_hours", label: "Par sati", desc: "Odgovaram u roku od nekoliko sati" },
      { value: "same_day", label: "Isti dan", desc: "Odgovaram u roku od 24 sata" },
      { value: "few_days", label: "Par dana", desc: "Može potrajati nekoliko dana" },
    ],
    []
  );

  const contactMethodOptions = useMemo(
    () => [
      { value: "message", label: "Poruka u aplikaciji", icon: MdMessage },
      { value: "phone", label: "Telefonski poziv", icon: MdPhone },
      { value: "whatsapp", label: "WhatsApp", icon: MdWhatsapp },
      { value: "viber", label: "Viber", icon: FaViber },
      { value: "email", label: "Email", icon: MdEmail },
    ],
    []
  );

  const buildPayload = useCallback(() => {
    return {
      avatar_id: avatarId,
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
    avatarId,
    showPhone, showEmail, showWhatsapp, showViber,
    whatsappNumber, viberNumber, preferredContact,
    businessHours, responseTime, acceptsOffers,
    autoReplyEnabled, autoReplyMessage,
    vacationMode, vacationMessage,
    businessDescription, returnPolicy, shippingInfo,
    socialFacebook, socialInstagram, socialTiktok, socialYoutube, socialWebsite
  ]);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      const response = await sellerSettingsApi.getSettings();

      if (response?.data?.error === false && response?.data?.data) {
        const s = response.data.data;

        setAvatarId(s.avatar_id || "lmx-01");
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

        initialPayloadRef.current = JSON.stringify(payloadFromServer(s));
        setHasChanges(false);
      } else {
        setLoadError(response?.data?.message || "Ne mogu dohvatiti postavke.");
      }
    } catch (error) {
      setLoadError("Greška pri dohvaćanju postavki.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!initialPayloadRef.current) return;
    const now = JSON.stringify(buildPayload());
    setHasChanges(now !== initialPayloadRef.current);
  }, [buildPayload]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = buildPayload();
      const response = await sellerSettingsApi.updateSettings(payload);

      if (response?.data?.error === false) {
        toast.success("Postavke su uspješno sačuvane!");
        initialPayloadRef.current = JSON.stringify(payload);
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

  // --- FUNKCIJA ZA AŽURIRANJE SLIKE (Generator + Upload + Ikone) ---
  const updateProfileImage = async (fileOrBlob) => {
    if (!fileOrBlob) return;

    // Instant Preview
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
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      updateProfileImage(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // --- GLAVNA LOGIKA: PRETVARANJE UVEZENE KOMPONENTE U SLIKU ---
  const handleDefaultIconSelect = async (id) => {
    setAvatarId(id);

    // 1. Renderujemo UVEZENU React komponentu u statički HTML string
    // Ovo osigurava da je slika identična onome što se vidi na ekranu
    const svgString = renderToStaticMarkup(<LmxAvatarSvg avatarId={id} />);

    // 2. Konvertujemo u sliku i šaljemo
    const blob = await svgStringToBlob(svgString);
    updateProfileImage(blob);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <p className="font-semibold">Ne mogu učitati Seller Settings</p>
          <p className="text-sm mt-1">{loadError}</p>
        </div>
        <Button onClick={fetchSettings} variant="outline">
          Pokušaj ponovo
        </Button>
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

        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <MdSave className="text-lg" />
            )}
            <span>Sačuvaj</span>
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
          <Button variant="outline" size="sm" onClick={() => setVacationMode(false)} className="border-amber-300 text-amber-700 hover:bg-amber-100">
            Isključi
          </Button>
        </div>
      )}

      {/* SEKCIJA: Avatar & Izgled */}
      <SettingsSection
        icon={MdPerson}
        title="Avatar & Izgled"
        description="Izaberite sliku s uređaja ili kreirajte jedinstveni avatar"
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Lijeva strana: Trenutni prikaz i Dugmad */}
          <div className="flex flex-col gap-4 items-center p-6 bg-slate-50 rounded-xl border border-slate-100 min-w-[200px]">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
              {/* Prioritet: Preview Image (Nova) -> Current User Image (Stara) -> Fallback SVG */}
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/20">
                  {/* Prikazujemo UVEZENU komponentu kao fallback */}
                  <LmxAvatarSvg avatarId={avatarId} className="w-24 h-24" />
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              {/* INPUT TYPE FILE (Skriven) */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />

              {/* DUGME 1: Upload Slike */}
              <Button
                onClick={triggerFileInput}
                variant="outline"
                className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5"
                disabled={isAvatarUploading}
              >
                <MdCloudUpload size={18} /> Odaberi sliku
              </Button>

              {/* DUGME 2: Avatar Generator */}
              <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                    <MdEdit size={16} /> Kreiraj Svoj Avatar
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

          {/* Desna strana: Fallback opcije (Ikone) */}
          <div className="flex-1 space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Brzi izbor (Ikone)</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {AVATARS.map((a) => {
                  const selected = a.id === avatarId;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleDefaultIconSelect(a.id)}
                      className={cn(
                        "aspect-square rounded-xl border bg-white flex items-center justify-center transition-all p-1",
                        selected
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                      title={a.name}
                    >
                      <div className="w-full h-full">
                        {/* Prikazujemo UVEZENU komponentu u gridu */}
                        <LmxAvatarSvg avatarId={a.id} className="w-full h-full" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 flex gap-2">
              <MdInfo className="text-lg flex-shrink-0 mt-0.5" />
              <p>
                Bilo da izaberete sliku, kreirate avatar ili kliknete na jedan od gotovih avatara – vaša profilna slika
                će se ažurirati na cijelom sajtu.
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

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
          <Label className="text-sm font-medium text-slate-700">Preferirani način kontakta</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {contactMethodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
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
          <Label className="text-sm font-medium text-slate-700">Koliko brzo obično odgovarate?</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {responseTimeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setResponseTime(option.value)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
                  responseTime === option.value
                    ? option.highlight
                      ? "bg-purple-50 border-purple-300"
                      : "bg-green-50 border-green-300"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300",
                  option.highlight && responseTime !== option.value && "border-dashed"
                )}
              >
                <div className="flex items-center gap-2">
                  {option.icon && (
                    <option.icon
                      className={cn(
                        "text-lg",
                        responseTime === option.value
                          ? option.highlight
                            ? "text-purple-600"
                            : "text-green-600"
                          : "text-slate-400"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "font-semibold",
                      responseTime === option.value
                        ? option.highlight
                          ? "text-purple-700"
                          : "text-green-700"
                        : "text-slate-700"
                    )}
                  >
                    {option.label}
                  </span>
                  {option.highlight && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold rounded uppercase">
                      Preporučeno
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1",
                    responseTime === option.value
                      ? option.highlight
                        ? "text-purple-600"
                        : "text-green-600"
                      : "text-slate-500"
                  )}
                >
                  {option.desc}
                </span>
              </button>
            ))}
          </div>

          {responseTime === "auto" && (
            <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-100 rounded-xl">
              <MdInfo className="text-purple-500 text-lg flex-shrink-0 mt-0.5" />
              <p className="text-xs text-purple-700">
                Sistem će automatski pratiti koliko brzo odgovarate na poruke i prikazati to kupcima.
              </p>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* SEKCIJA 3: Ponude */}
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

      {/* SEKCIJA 4: Auto-reply */}
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
            <Label className="text-sm font-medium text-slate-700">Poruka automatskog odgovora</Label>
            <Textarea
              value={autoReplyMessage}
              onChange={(e) => setAutoReplyMessage(e.target.value)}
              placeholder="Napišite poruku koja će se automatski slati..."
              rows={3}
              maxLength={300}
              className="resize-none"
            />
            <p className="text-xs text-slate-400 text-right">{autoReplyMessage.length}/300</p>
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
            <Label className="text-sm font-medium text-slate-700">Poruka za kupce</Label>
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

      {/* SEKCIJA 6: Poslovne informacije */}
      <SettingsSection
        icon={MdStorefront}
        title="Poslovne informacije"
        description="Dodatne informacije o vašem poslovanju"
        defaultOpen={false}
      >
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">O meni / O mom poslovanju</Label>
          <Textarea
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            placeholder="Opišite sebe ili svoje poslovanje..."
            rows={4}
            maxLength={500}
            className="resize-none"
          />
          <p className="text-xs text-slate-400 text-right">{businessDescription.length}/500</p>
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

      {/* SEKCIJA 7: Društvene mreže */}
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

      {/* Sticky Save Button (mobile) */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg z-50 lg:hidden">
          <Button onClick={handleSave} disabled={isSaving} className="w-full flex items-center justify-center gap-2">
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