"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { FiUser, FiLayers, FiMessageSquare, FiHeart, FiStar } from "react-icons/fi";


import {
  MdInfoOutline,
  MdCheckCircle,
  MdWarningAmber,
  MdVerifiedUser,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdNotifications,
  MdVisibility,
  MdVisibilityOff,
  MdEdit,
  MdSave,
  MdCancel,
} from "react-icons/md";

import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import CustomLink from "@/components/Common/CustomLink";
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

import { loadUpdateUserData, userSignUpData } from "@/redux/reducer/authSlice";
import { Fcmtoken, settingsData } from "@/redux/reducer/settingSlice";

import {
  getUserInfoApi,
  getVerificationStatusApi,
  updateProfileApi,
  sellerSettingsApi,
} from "@/utils/api";

import { useUserLocation } from "@/hooks/useUserLocation";

// Avatar Component
function SellerAvatar({ customAvatarUrl, avatarId, size = "lg" }) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = Boolean(customAvatarUrl) && !imgErr;

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-40 h-40",
  };

  if (showImg) {
    return (
      <img
        src={customAvatarUrl}
        alt="Avatar"
        className={`${sizeClasses[size]} rounded-full object-cover border-4 border-white shadow-lg`}
        onError={() => setImgErr(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-4 border-white shadow-lg`}>
      <LmxAvatarSvg avatarId={avatarId || "lmx-01"} className="w-3/4 h-3/4 text-white" />
    </div>
  );
}

// Profile Section Component
const ProfileSection = ({ 
  title, 
  description, 
  icon: Icon,
  children,
  action,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  hasChanges = false
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-primary/30 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600 mt-1">{description}</p>
          </div>
        </div>
        
        {action && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  className="border-slate-300 hover:border-slate-400"
                >
                  <MdCancel className="w-4 h-4 mr-1" />
                  Otkaži
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={!hasChanges}
                >
                  <MdSave className="w-4 h-4 mr-1" />
                  Sačuvaj
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="border-primary/30 text-primary hover:bg-primary/5"
              >
                <MdEdit className="w-4 h-4 mr-1" />
                Uredi
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, color }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-primary/30 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500 mt-1">{label}</p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const UserData = useSelector(userSignUpData);
  const IsLoggedIn = UserData !== undefined && UserData !== null;
  const settings = useSelector(settingsData);
  const fetchFCM = useSelector(Fcmtoken);
  const placeholder_image = settings?.placeholder_image;

  // State
  const [activeSection, setActiveSection] = useState("osnovno");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile states
  const [profileImage, setProfileImage] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [sellerAvatarId, setSellerAvatarId] = useState("lmx-01");
  
  // Form states
  const [isEditing, setIsEditing] = useState({
    osnovno: false,
    kontakt: false,
    lokacija: false,
    privatnost: false,
    notifikacije: false,
  });
  
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

  // Effects
  useEffect(() => {
    if (userLocation?.municipalityId) {
      setBihLocation(userLocation);
    }
  }, [userLocation]);

  // Fetch user data
  useEffect(() => {
    if (!IsLoggedIn) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [verificationRes, userRes, sellerRes] = await Promise.all([
          getVerificationStatusApi.getVerificationStatus(),
          getUserInfoApi.getUserInfo(),
          sellerSettingsApi.getSettings(),
        ]);

        // Handle verification
        if (verificationRes?.data?.error === true) {
          setVerificationStatus("not applied");
        } else {
          setVerificationStatus(verificationRes?.data?.data?.status || "");
          setRejectionReason(verificationRes?.data?.data?.rejection_reason || "");
        }

        // Handle user info
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

        // Handle seller settings
        if (sellerRes?.data?.error === false && sellerRes.data.data) {
          setSellerAvatarId(sellerRes.data.data.avatar_id || "lmx-01");
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Došlo je do greške pri učitavanju podataka");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [IsLoggedIn]);

  // Handlers
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Slika je prevelika. Maksimalna veličina je 5MB.");
      return;
    }

    setProfileFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result);
      toast.success("Slika profila je odabrana");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (section) => {
    // Validation
    if (section === "osnovno" && !formData.name.trim()) {
      toast.error("Ime je obavezno polje");
      return;
    }

    if (section === "lokacija" && !bihLocation.municipalityId) {
      toast.error("Molimo odaberite lokaciju");
      return;
    }

    if (section === "kontakt" && formData.phone && !isValidPhoneNumber(`+${formData.country_code}${formData.phone}`)) {
      toast.error("Uneseni broj telefona nije ispravan");
      return;
    }

    setIsSaving(true);
    try {
      if (section === "lokacija") {
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
        setIsEditing(prev => ({ ...prev, [section]: false }));
        toast.success("Promjene su uspješno sačuvane");
      } else {
        toast.error(response.data.message || "Greška pri čuvanju");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Greška na serveru");
    } finally {
      setIsSaving(false);
    }
  };

  // Verification badge
  const getVerificationBadge = () => {
    const baseClass = "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium";
    
    switch (verificationStatus) {
      case "approved":
        return (
          <span className={`${baseClass} bg-green-100 text-green-800`}>
            <MdVerifiedUser className="w-4 h-4" />
            Verifikovan
          </span>
        );
      case "pending":
      case "resubmitted":
        return (
          <span className={`${baseClass} bg-amber-100 text-amber-800`}>
            <MdWarningAmber className="w-4 h-4" />
            Na čekanju
          </span>
        );
      case "rejected":
        return (
          <div className="space-y-2">
            <span className={`${baseClass} bg-red-100 text-red-800`}>
              <MdWarningAmber className="w-4 h-4" />
              Odbijen
            </span>
            {rejectionReason && (
              <p className="text-sm text-red-600">{rejectionReason}</p>
            )}
          </div>
        );
      default:
        return (
          <CustomLink
            href="/user-verification"
            className={`${baseClass} bg-primary text-white hover:bg-primary/90`}
          >
            Verifikuj profil
          </CustomLink>
        );
    }
  };

  // Navigation items
  const navItems = [
    { id: "osnovno", label: "Osnovno", icon: MdEdit },
    { id: "kontakt", label: "Kontakt", icon: MdEmail },
    { id: "lokacija", label: "Lokacija", icon: MdLocationOn },
    { id: "privatnost", label: "Privatnost", icon: MdVisibility },
    { id: "notifikacije", label: "Notifikacije", icon: MdNotifications },
    { id: "verifikacija", label: "Verifikacija", icon: MdVerifiedUser },
  ];

  if (!IsLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Niste prijavljeni</h2>
          <p className="text-slate-600 mb-6">Prijavite se da biste pristupili profilu</p>
          <CustomLink href="/login" className="btn-primary">
            Prijavi se
          </CustomLink>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
      {/* Loading */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <SellerAvatar 
              customAvatarUrl={profileImage} 
              avatarId={sellerAvatarId} 
              size="lg"
            />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                {formData.name || "Vaš profil"}
              </h1>
              <p className="text-slate-600 mt-1">{formData.email}</p>
              <div className="flex items-center gap-3 mt-3">
                {getVerificationBadge()}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Promijeni sliku
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-slate-300 hover:border-slate-400"
              onClick={() => window.print()}
            >
              Štampaj profil
            </Button>
            <Button onClick={() => handleSave(activeSection)} disabled={isSaving}>
              {isSaving ? "Čuvanje..." : "Sačuvaj sve promjene"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon={FiLayers}
          label="Aktivni oglasi"
          value={UserData?.active_ads || 0}
          color="bg-blue-500"
        />
        <StatsCard
          icon={FiMessageSquare}
          label="Nepročitane poruke"
          value={UserData?.unread_messages || 0}
          color="bg-green-500"
        />
        <StatsCard
          icon={FiHeart}
          label="Favoriti"
          value={UserData?.favorites_count || 0}
          color="bg-pink-500"
        />
        <StatsCard
          icon={FiStar}
          label="Prosječna ocjena"
          value={UserData?.avg_rating ? UserData.avg_rating.toFixed(1) : "0.0"}
          color="bg-amber-500"
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation */}
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="sticky top-24 bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Postavke profila
            </h3>
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200",
                    "text-left",
                    activeSection === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-slate-700 hover:bg-slate-50 hover:text-primary"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Quick Links */}
          <div className="mt-4 bg-gradient-to-br from-primary to-primary/90 rounded-xl p-5 text-white">
            <h4 className="font-semibold mb-3">Brzi linkovi</h4>
            <div className="space-y-2">
              <CustomLink 
                href="/my-ads/new" 
                className="block text-sm text-white/90 hover:text-white"
              >
                + Dodaj novi oglas
              </CustomLink>
              <CustomLink 
                href="/user-verification" 
                className="block text-sm text-white/90 hover:text-white"
              >
                Verifikuj profil
              </CustomLink>
              <CustomLink 
                href="/help" 
                className="block text-sm text-white/90 hover:text-white"
              >
                Pomoć i podrška
              </CustomLink>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {/* Osnovno */}
          {activeSection === "osnovno" && (
            <ProfileSection
              title="Osnovne informacije"
              description="Vaši lični podaci i informacije o nalogu"
              icon={MdEdit}
              action
              isEditing={isEditing.osnovno}
              onEdit={() => setIsEditing(prev => ({ ...prev, osnovno: true }))}
              onSave={() => handleSave("osnovno")}
              onCancel={() => setIsEditing(prev => ({ ...prev, osnovno: false }))}
              hasChanges={true}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-slate-700">Ime i prezime *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Unesite vaše puno ime"
                    className="mt-2"
                    disabled={!isEditing.osnovno}
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-700">Email adresa</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="primer@email.com"
                    className="mt-2"
                    disabled={!isEditing.osnovno}
                  />
                </div>
              </div>
            </ProfileSection>
          )}

          {/* Kontakt */}
          {activeSection === "kontakt" && (
            <ProfileSection
              title="Kontakt informacije"
              description="Načini na koji vas drugi korisnici mogu kontaktirati"
              icon={MdPhone}
              action
              isEditing={isEditing.kontakt}
              onEdit={() => setIsEditing(prev => ({ ...prev, kontakt: true }))}
              onSave={() => handleSave("kontakt")}
              onCancel={() => setIsEditing(prev => ({ ...prev, kontakt: false }))}
              hasChanges={true}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone" className="text-slate-700">Broj telefona</Label>
                  <div className="mt-2">
                    <PhoneInput
                      country={formData.region_code || "ba"}
                      value={`${formData.country_code || ""}${formData.phone || ""}`}
                      onChange={handlePhoneChange}
                      inputStyle={{
                        width: "100%",
                        height: "42px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                      buttonStyle={{
                        borderRadius: "8px 0 0 8px",
                        border: "1px solid #e5e7eb",
                      }}
                      disabled={!isEditing.kontakt}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Broj telefona je vidljiv samo ukoliko ste to dozvolili u postavkama privatnosti
                  </p>
                </div>
              </div>
            </ProfileSection>
          )}

          {/* Lokacija */}
          {activeSection === "lokacija" && (
            <ProfileSection
              title="Lokacija"
              description="Odaberite vašu lokaciju za bolje pronalaženje oglasa"
              icon={MdLocationOn}
              action
              isEditing={isEditing.lokacija}
              onEdit={() => setIsEditing(prev => ({ ...prev, lokacija: true }))}
              onSave={() => handleSave("lokacija")}
              onCancel={() => setIsEditing(prev => ({ ...prev, lokacija: false }))}
              hasChanges={true}
            >
              <div className="space-y-4">
                <BiHLocationSelector
                  value={bihLocation}
                  onChange={setBihLocation}
                  showAddress={true}
                  disabled={!isEditing.lokacija}
                />
                
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <MdCheckCircle className="text-green-500" />
                    <span className="font-medium">Trenutna lokacija:</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    {bihLocation.formattedAddress || "Nije odabrana lokacija"}
                  </p>
                </div>
              </div>
            </ProfileSection>
          )}

          {/* Privatnost */}
          {activeSection === "privatnost" && (
            <ProfileSection
              title="Privatnost i sigurnost"
              description="Kontrolišite ko može vidjeti vaše podatke"
              icon={MdVisibility}
              action
              isEditing={isEditing.privatnost}
              onEdit={() => setIsEditing(prev => ({ ...prev, privatnost: true }))}
              onSave={() => handleSave("privatnost")}
              onCancel={() => setIsEditing(prev => ({ ...prev, privatnost: false }))}
              hasChanges={true}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Prikaži kontakt podatke</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Omogućite drugim korisnicima da vide vaš broj telefona i email
                    </p>
                  </div>
                  <Switch
                    checked={formData.show_personal_details === 1}
                    onCheckedChange={() => handleChange(
                      "show_personal_details", 
                      formData.show_personal_details === 1 ? 0 : 1
                    )}
                    disabled={!isEditing.privatnost}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Online status</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Prikazujte kada ste online na platformi
                    </p>
                  </div>
                  <Switch disabled={!isEditing.privatnost} />
                </div>
              </div>
            </ProfileSection>
          )}

          {/* Notifikacije */}
          {activeSection === "notifikacije" && (
            <ProfileSection
              title="Notifikacije"
              description="Upravljajte kako i kada primate obavijesti"
              icon={MdNotifications}
              action
              isEditing={isEditing.notifikacije}
              onEdit={() => setIsEditing(prev => ({ ...prev, notifikacije: true }))}
              onSave={() => handleSave("notifikacije")}
              onCancel={() => setIsEditing(prev => ({ ...prev, notifikacije: false }))}
              hasChanges={true}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Email notifikacije</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Primajte obavijesti na vašu email adresu
                    </p>
                  </div>
                  <Switch
                    checked={formData.notification === 1}
                    onCheckedChange={() => handleChange(
                      "notification", 
                      formData.notification === 1 ? 0 : 1
                    )}
                    disabled={!isEditing.notifikacije}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Push notifikacije</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Obavijesti na vašem uređaju
                    </p>
                  </div>
                  <Switch disabled={!isEditing.notifikacije} />
                </div>
              </div>
            </ProfileSection>
          )}

          {/* Verifikacija */}
          {activeSection === "verifikacija" && (
            <div className="space-y-6">
              <ProfileSection
                title="Verifikacija profila"
                description="Povećajte povjerenje i vjerodostojnost vašeg profila"
                icon={MdVerifiedUser}
              >
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">Status verifikacije</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Verifikovani profili imaju veću stopu uspješnih transakcija
                        </p>
                      </div>
                      {getVerificationBadge()}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border border-slate-200 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MdVerifiedUser className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="font-medium text-slate-900 mb-1">Povećano povjerenje</p>
                      <p className="text-sm text-slate-600">Korisnici više vjeruju verifikovanim profilima</p>
                    </div>
                    
                    <div className="text-center p-4 border border-slate-200 rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiMessageSquare className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="font-medium text-slate-900 mb-1">Više poruka</p>
                      <p className="text-sm text-slate-600">Verifikovani profili dobijaju više upita</p>
                    </div>
                    
                    <div className="text-center p-4 border border-slate-200 rounded-lg">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiStar className="w-6 h-6 text-amber-600" />
                      </div>
                      <p className="font-medium text-slate-900 mb-1">Bolje pozicije</p>
                      <p className="text-sm text-slate-600">Oglasi se prikazuju na boljim pozicijama</p>
                    </div>
                  </div>
                  
                  <div className="text-center pt-4">
                    <CustomLink href="/user-verification" className="btn-primary px-8">
                      Započni verifikaciju
                    </CustomLink>
                  </div>
                </div>
              </ProfileSection>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}