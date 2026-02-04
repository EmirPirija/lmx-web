"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js/max";

import {
  User,
  Mail,
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
} from "lucide-react";

import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import CustomLink from "@/components/Common/CustomLink";
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";

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
          className={`${sizeClasses[size]} rounded-2xl object-cover border-2 border-slate-100 shadow-sm`}
          onError={() => setImgErr(true)}
          loading="lazy"
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-slate-100 shadow-sm`}>
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
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500">{description}</p>}
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
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
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

  // Not logged in
  if (!IsLoggedIn) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Niste prijavljeni</h2>
          <p className="text-sm text-slate-600 mb-4">Prijavite se da biste pristupili postavkama profila</p>
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
          <p className="text-sm text-slate-600">Učitavanje profila...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Profile Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
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
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-lg font-bold text-slate-900 truncate">
              {formData.name || "Vaš profil"}
            </h1>
            <VerificationBadge status={verificationStatus} reason={rejectionReason} />
          </div>
          <p className="text-sm text-slate-500 truncate">{formData.email}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 mt-2"
          >
            <Camera className="w-3.5 h-3.5" />
            Promijeni sliku
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <SettingCard
        icon={User}
        title="Osnovni podaci"
        description="Vaši lični podaci"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs text-slate-600">Ime i prezime</Label>
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
            <Label htmlFor="email" className="text-xs text-slate-600">Email adresa</Label>
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

      {/* Contact */}
      <SettingCard
        icon={Phone}
        title="Kontakt"
        description="Načini kontakta"
      >
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs text-slate-600">Broj telefona</Label>
          <PhoneInput
            country={formData.region_code || "ba"}
            value={`${formData.country_code || ""}${formData.phone || ""}`}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur("phone")}
            inputStyle={{
              width: "100%",
              height: "40px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "14px",
            }}
            buttonStyle={{
              borderRadius: "8px 0 0 8px",
              border: "1px solid #e2e8f0",
            }}
          />
          <p className="text-xs text-slate-400 mt-1">
            Vidljiv samo ako je uključeno u postavkama privatnosti
          </p>
        </div>
      </SettingCard>

      {/* Location */}
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
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-green-800">Trenutna lokacija</p>
                <p className="text-xs text-green-700">{bihLocation.formattedAddress}</p>
              </div>
            </div>
          )}
        </div>
      </SettingCard>

      {/* Privacy & Notifications */}
      <SettingCard
        icon={Bell}
        title="Privatnost i obavijesti"
        description="Postavke privatnosti"
      >
        <div className="space-y-1 divide-y divide-slate-100">
          <ToggleSetting
            label="Prikaži kontakt podatke"
            description="Omogućite drugim korisnicima da vide vaš broj telefona"
            checked={formData.show_personal_details === 1}
            onChange={() => handleToggle("show_personal_details")}
            saving={savingField === "show_personal_details"}
          />
          <ToggleSetting
            label="Email obavijesti"
            description="Primajte obavijesti na vašu email adresu"
            checked={formData.notification === 1}
            onChange={() => handleToggle("notification")}
            saving={savingField === "notification"}
          />
        </div>
      </SettingCard>

      {/* Verification CTA */}
      {verificationStatus !== "approved" && (
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900">Verifikuj svoj profil</h4>
              <p className="text-xs text-slate-600 mt-1">
                Verifikovani profili imaju veću stopu uspješnih transakcija i više povjerenja kupaca.
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
      )}
    </motion.div>
  );
}
