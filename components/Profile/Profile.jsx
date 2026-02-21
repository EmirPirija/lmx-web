"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "@/utils/toastBs";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js/max";

import {
  User,
  Phone,
  MapPin,
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  Camera,
  BadgeCheck,
  Loader2,
  Info,
  ArrowRight,
  Link2,
} from "@/components/Common/UnifiedIconPack";

import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import CustomLink from "@/components/Common/CustomLink";
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";
import {
  LMX_PHONE_DEFAULT_COUNTRY,
  LMX_PHONE_INPUT_PROPS,
  resolveLmxPhoneCountry,
} from "@/components/Common/phoneInputTheme";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";

import { loadUpdateUserData, userSignUpData } from "@/redux/reducer/authSlice";
import { Fcmtoken, settingsData } from "@/redux/reducer/settingSlice";

import {
  getUserInfoApi,
  getVerificationStatusApi,
  updateProfileApi,
  sellerSettingsApi,
} from "@/utils/api";

import { useUserLocation } from "@/hooks/useUserLocation";

// ============================================
// PROFILE AVATAR
// ============================================
function ProfileAvatar({ customAvatarUrl, avatarId, size = "lg", onImageClick }) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = Boolean(customAvatarUrl) && !imgErr;

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  };

  return (
    <div className="relative group">
      {showImg ? (
        <img
          src={customAvatarUrl}
          alt="Profilna slika"
          className={`${sizeClasses[size]} rounded-2xl object-cover border-2 border-slate-100 shadow-sm dark:border-slate-700`}
          onError={() => setImgErr(true)}
          loading="lazy"
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-slate-100 shadow-sm dark:border-slate-700 dark:bg-primary/20`}>
          <LmxAvatarSvg avatarId={avatarId || "lmx-01"} className="w-2/3 h-2/3 text-primary" />
        </div>
      )}
      
      {onImageClick && (
        <button
          onClick={onImageClick}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
}

// ============================================
// VERIFICATION BADGE
// ============================================
function VerificationBadge({ status, reason }) {
  const configs = {
    approved: {
      icon: BadgeCheck,
      text: "Verifikovan",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    pending: {
      icon: Clock,
      text: "Na čekanju",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    resubmitted: {
      icon: Clock,
      text: "Ponovo poslano",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    rejected: {
      icon: AlertCircle,
      text: "Odbijeno",
      className: "bg-red-100 text-red-700 border-red-200",
    },
    default: {
      icon: Shield,
      text: "Verifikuj se",
      className: "bg-primary text-white border-primary",
      isLink: true,
    },
  };

  const config = configs[status] || configs.default;
  const Icon = config.icon;

  if (config.isLink) {
    return (
      <CustomLink
        href="/user-verification"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-90",
          config.className
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.text}
      </CustomLink>
    );
  }

  return (
    <div className="space-y-2">
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.className
      )}>
        <Icon className="w-3.5 h-3.5" />
        {config.text}
      </span>
      {status === "rejected" && reason && (
        <p className="text-xs text-red-600">{reason}</p>
      )}
    </div>
  );
}

// ============================================
// SETTING CARD
// ============================================
function SettingCard({ icon: Icon, title, description, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// ============================================
// TOGGLE SETTING
// ============================================
function ToggleSetting({ label, description, checked, onChange, disabled, saving }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {saving && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled || saving}
        />
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Profile() {
  const UserData = useSelector(userSignUpData);
  const IsLoggedIn = UserData !== undefined && UserData !== null;
  const settings = useSelector(settingsData);
  const fetchFCM = useSelector(Fcmtoken);
  const placeholder_image = settings?.placeholder_image;

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);
  
  // Profile state
  const [profileImage, setProfileImage] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [sellerAvatarId, setSellerAvatarId] = useState("lmx-01");
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notification: 1,
    show_personal_details: 0,
    region_code: "",
    country_code: "",
  });
  
  // BiH location
  const { userLocation, saveLocation } = useUserLocation();
  const [bihLocation, setBihLocation] = useState({
    entityId: null,
    regionId: null,
    municipalityId: null,
    address: "",
    formattedAddress: "",
  });
  
  // Verification
  const [verificationStatus, setVerificationStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [publicProfileUrl, setPublicProfileUrl] = useState("");
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  
  // Refs
  const initialDataRef = useRef(null);
  const fileInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Effects
  useEffect(() => {
    if (userLocation?.municipalityId) {
      setBihLocation(userLocation);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!IsLoggedIn) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [verificationRes, userRes, sellerRes] = await Promise.all([
          getVerificationStatusApi.getVerificationStatus(),
          getUserInfoApi.getUserInfo(),
          sellerSettingsApi.getSettings(),
        ]);

        // Verification
        if (verificationRes?.data?.error === true) {
          setVerificationStatus("not applied");
        } else {
          setVerificationStatus(verificationRes?.data?.data?.status || "");
          setRejectionReason(verificationRes?.data?.data?.rejection_reason || "");
        }

        // User data
        if (userRes?.data?.error === false) {
          const d = userRes.data.data;
          const region = (d?.region_code || "ba").toLowerCase();
          const countryCode = d?.country_code?.replace("+", "") || "387";

          const nextForm = {
            name: d?.name || "",
            email: d?.email || "",
            phone: d?.mobile || "",
            address: d?.address || "",
            notification: d?.notification ?? 1,
            show_personal_details: Number(d?.show_personal_details) || 0,
            region_code: region,
            country_code: countryCode,
          };

          setFormData(nextForm);
          setProfileImage(d?.profile || placeholder_image);
          initialDataRef.current = { ...nextForm, bihLocation: userLocation };
          
          const currentFcmId = UserData?.fcm_id;
          if (!d?.fcm_id && currentFcmId) {
            loadUpdateUserData({ ...d, fcm_id: currentFcmId });
          } else {
            loadUpdateUserData(d);
          }
        }

        // Seller settings
        if (sellerRes?.data?.error === false && sellerRes.data.data) {
          setSellerAvatarId(sellerRes.data.data.avatar_id || "lmx-01");
        }
      } catch (error) {
        console.error("Greška pri učitavanju podataka:", error);
        toast.error("Došlo je do greške pri učitavanju podataka");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [IsLoggedIn]);

  // Auto-save function
  const autoSave = useCallback(async (fieldName, skipValidation = false) => {
    // Validation
    if (!skipValidation) {
      if (fieldName === "name" && !formData.name.trim()) {
        toast.error("Ime je obavezno polje");
        return;
      }

      if (fieldName === "phone" && formData.phone && !isValidPhoneNumber(`+${formData.country_code}${formData.phone}`)) {
        toast.error("Uneseni broj telefona nije ispravan");
        return;
      }
    }

    setSavingField(fieldName);
    try {
      if (fieldName === "location") {
        saveLocation(bihLocation);
      }

      const formattedAddress = bihLocation?.formattedAddress 
        ? `${bihLocation.address || ""}, ${bihLocation.formattedAddress}`.trim()
        : formData.address;

      const response = await updateProfileApi.updateProfile({
        name: formData.name,
        email: formData.email,
        mobile: formData.phone || "",
        address: formattedAddress,
        profile: profileFile,
        fcm_id: fetchFCM || "",
        notification: formData.notification,
        country_code: formData.country_code,
        show_personal_details: formData.show_personal_details,
        region_code: formData.region_code.toUpperCase(),
      });

      if (response.data.error !== true) {
        const newData = response.data.data;
        const currentFcmId = UserData?.fcm_id;
        
        if (!newData?.fcm_id && currentFcmId) {
          loadUpdateUserData({ ...newData, fcm_id: currentFcmId });
        } else {
          loadUpdateUserData(newData);
        }

        setProfileFile(null);
        toast.success("Sačuvano");
      } else {
        toast.error(response.data.message || "Greška pri čuvanju");
      }
    } catch (error) {
      console.error("Greška:", error);
      toast.error("Greška na serveru");
    } finally {
      setSavingField(null);
    }
  }, [formData, bihLocation, profileFile, fetchFCM, UserData?.fcm_id, saveLocation]);

  // Debounced auto-save
  const debouncedSave = useCallback((fieldName) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(fieldName);
    }, 1000);
  }, [autoSave]);

  // Handlers
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => {
    debouncedSave(field);
  };

  const handlePhoneChange = (value, data) => {
    const dial = data?.dialCode || "";
    const iso2 = data?.countryCode || "";
    const pureMobile = value.startsWith(dial) ? value.slice(dial.length) : value;
    
    setFormData(prev => ({
      ...prev,
      phone: pureMobile,
      country_code: dial,
      region_code: iso2,
    }));
  };

  const handleToggle = async (field) => {
    const newValue = formData[field] === 1 ? 0 : 1;
    setFormData(prev => ({ ...prev, [field]: newValue }));
    
    // Immediately save toggle changes
    setTimeout(() => autoSave(field, true), 100);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Slika je prevelika. Maksimalna veličina je 5MB.");
      return;
    }

    setProfileFile(file);
    const reader = new FileReader();
    reader.onload = async () => {
      setProfileImage(reader.result);
      // Auto-save image
      setTimeout(() => autoSave("image", true), 100);
    };
    reader.readAsDataURL(file);
  };

  const handleLocationChange = (newLocation) => {
    setBihLocation(newLocation);
    debouncedSave("location");
  };

  const sellerProfilePath = UserData?.id ? `/seller/${UserData.id}` : "";

  useEffect(() => {
    if (!sellerProfilePath || typeof window === "undefined") {
      setPublicProfileUrl("");
      return;
    }
    setPublicProfileUrl(`${window.location.origin}${sellerProfilePath}`);
  }, [sellerProfilePath]);

  const handleCopyPublicProfileLink = useCallback(async () => {
    if (!publicProfileUrl || typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Link profila nije dostupan za kopiranje.");
      return;
    }

    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setIsLinkCopied(true);
      toast.success("Link javnog profila je kopiran.");
      window.setTimeout(() => setIsLinkCopied(false), 1500);
    } catch (error) {
      console.error("Greška pri kopiranju linka profila:", error);
      toast.error("Kopiranje nije uspjelo.");
    }
  }, [publicProfileUrl]);

  // Not logged in
  if (!IsLoggedIn) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">Niste prijavljeni</h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Prijavite se da biste pristupili postavkama profila</p>
          <CustomLink 
            href="/login" 
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            Prijavi se
          </CustomLink>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300">Učitavanje profila...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl space-y-6"
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5 sm:p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <ProfileAvatar
                customAvatarUrl={profileImage}
                avatarId={sellerAvatarId}
                size="lg"
                onImageClick={() => fileInputRef.current?.click()}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formData.name || "Vaš profil"}
                  </h1>
                  <VerificationBadge status={verificationStatus} reason={rejectionReason} />
                </div>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{formData.email}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Promijeni sliku
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <CustomLink
                href="/profile/seller-settings"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
              >
                <Shield className="h-3.5 w-3.5" />
                Postavke prodavača
              </CustomLink>
              {sellerProfilePath ? (
                <CustomLink
                  href={sellerProfilePath}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Pogledaj javni profil
                </CustomLink>
              ) : null}
            </div>
          </div>
        </div>

        {sellerProfilePath ? (
          <div className="border-t border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Javni profil prodavača
                </p>
                <p className="truncate text-sm text-slate-700 dark:text-slate-200">{publicProfileUrl || sellerProfilePath}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyPublicProfileLink}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                  isLinkCopied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
                )}
              >
                {isLinkCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                {isLinkCopied ? "Link kopiran" : "Kopiraj link profila"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <SettingCard
            icon={User}
            title="Osnovni podaci"
            description="Vaši lični podaci"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-slate-600 dark:text-slate-300">Ime i prezime</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="Unesite vaše puno ime"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-slate-600 dark:text-slate-300">Email adresa</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="email@primjer.com"
                  className="h-10"
                />
              </div>
            </div>
          </SettingCard>

          <SettingCard
            icon={Phone}
            title="Kontakt"
            description="Načini kontakta"
          >
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs text-slate-600 dark:text-slate-300">Broj telefona</Label>
              <PhoneInput
                country={resolveLmxPhoneCountry(formData.region_code || LMX_PHONE_DEFAULT_COUNTRY)}
                value={`${formData.country_code || ""}${formData.phone || ""}`}
                onChange={handlePhoneChange}
                onBlur={() => handleBlur("phone")}
                inputProps={{
                  id: "phone",
                  name: "phone",
                }}
                {...LMX_PHONE_INPUT_PROPS}
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Vidljiv samo ako je uključeno u postavkama privatnosti
              </p>
            </div>
          </SettingCard>

          <SettingCard
            icon={MapPin}
            title="Lokacija"
            description="Vaša lokacija"
          >
            <div className="space-y-3">
              <BiHLocationSelector
                value={bihLocation}
                onChange={handleLocationChange}
                showAddress={true}
              />

              {bihLocation.formattedAddress && (
                <div className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50 p-3 dark:border-green-500/40 dark:bg-green-500/10">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-300" />
                  <div>
                    <p className="text-xs font-medium text-green-800 dark:text-green-100">Trenutna lokacija</p>
                    <p className="text-xs text-green-700 dark:text-green-200">{bihLocation.formattedAddress}</p>
                  </div>
                </div>
              )}
            </div>
          </SettingCard>
        </div>

        <div className="space-y-6">
          <SettingCard
            icon={Bell}
            title="Obavijesti"
            description="Postavke notifikacija"
          >
            <div className="space-y-1">
              <ToggleSetting
                label="Email obavijesti"
                description="Primajte obavijesti na vašu email adresu"
                checked={formData.notification === 1}
                onChange={() => handleToggle("notification")}
                saving={savingField === "notification"}
              />
            </div>

            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-start gap-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Detaljne postavke kontakta (telefon, WhatsApp, Viber, radno vrijeme) možete podesiti u{" "}
                    <CustomLink href="/profile/seller-settings" className="text-primary font-medium hover:underline">
                      Postavkama prodavača
                    </CustomLink>
                  </p>
                </div>
              </div>
            </div>
          </SettingCard>

          {verificationStatus !== "approved" ? (
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Verifikuj svoj profil</h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Verificirani profili imaju veću stopu uspješnih transakcija i više povjerenja kupaca.
                  </p>
                  <CustomLink
                    href="/user-verification"
                    className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Započni verifikaciju
                  </CustomLink>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700/60 dark:bg-emerald-900/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Profil je verifikovan</h4>
                  <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                    Kupci vide oznaku verifikacije i imaju više povjerenja u vaše oglase.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
