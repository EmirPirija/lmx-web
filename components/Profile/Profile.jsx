"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  Eye,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Camera,
  ChevronRight,
  Layers,
  MessageSquare,
  Heart,
  Star,
  BadgeCheck,
  HelpCircle,
  Plus,
} from "lucide-react";

import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import CustomLink from "@/components/Common/CustomLink";
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
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

// ===== HELPER KOMPONENTE =====

// Avatar komponenta
function ProfileAvatar({ customAvatarUrl, avatarId, size = "lg", onImageClick }) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = Boolean(customAvatarUrl) && !imgErr;

  const sizeClasses = {
    sm: "w-14 h-14",
    md: "w-18 h-18",
    lg: "w-20 h-20 sm:w-24 sm:h-24",
    xl: "w-28 h-28 sm:w-32 sm:h-32",
  };

  return (
    <div className="relative group">
      {showImg ? (
        <img
          src={customAvatarUrl}
          alt="Profilna slika"
          className={`${sizeClasses[size]} rounded-2xl object-cover border-2 border-white shadow-lg ring-2 ring-slate-100`}
          onError={() => setImgErr(true)}
          loading="lazy"
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-2xl bg-slate-900 flex items-center justify-center border-2 border-white shadow-lg ring-2 ring-slate-100`}
        >
          <LmxAvatarSvg avatarId={avatarId || "lmx-01"} className="w-2/3 h-2/3 text-white" />
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

// Statistika kartica
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}

// Navigacijska kartica (mobilna)
function NavCard({ id, label, icon: Icon, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 w-full text-left",
        isActive
          ? "bg-slate-900 border-slate-900 text-white"
          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
      )}
    >
      <div className={cn("p-2 rounded-lg", isActive ? "bg-white/15" : "bg-slate-100")}>
        <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-600")} />
      </div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-300")} />
    </button>
  );
}

// Sekcija forma
function FormSection({ title, description, icon: Icon, children, isEditing, onEdit, onSave, onCancel, isSaving }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Zaglavlje */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Icon className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving} className="gap-2">
                  <X className="w-4 h-4" />
                  Otkaži
                </Button>
                <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-2 bg-slate-900 hover:bg-slate-800">
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Čuvanje...
                    </span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Sačuvaj
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={onEdit} className="gap-2">
                <Edit3 className="w-4 h-4" />
                Uredi
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sadržaj */}
      <div className="p-5">{children}</div>
    </div>
  );
}

// Toggle polje
function ToggleField({ label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors">
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

// Badge verifikacije
function VerificationBadge({ status, reason }) {
  const configs = {
    approved: {
      icon: BadgeCheck,
      text: "Verifikovan",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
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
      className: "bg-slate-900 text-white border-slate-900",
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
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:opacity-90",
          config.className
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.text}
      </CustomLink>
    );
  }

  return (
    <div className="space-y-1">
      <span
        className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border", config.className)}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.text}
      </span>
      {status === "rejected" && reason && <p className="text-xs text-red-600">{reason}</p>}
    </div>
  );
}

// ===== GLAVNA KOMPONENTA =====
export default function Profile() {
  const UserData = useSelector(userSignUpData);
  const IsLoggedIn = UserData !== undefined && UserData !== null;
  const settings = useSelector(settingsData);
  const fetchFCM = useSelector(Fcmtoken);
  const placeholder_image = settings?.placeholder_image;

  // Stanje
  const [activeSection, setActiveSection] = useState("osnovno");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(true);

  // Profil stanje
  const [profileImage, setProfileImage] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [sellerAvatarId, setSellerAvatarId] = useState("lmx-01");

  // Režim uređivanja
  const [isEditing, setIsEditing] = useState({
    osnovno: false,
    kontakt: false,
    lokacija: false,
    privatnost: false,
    notifikacije: false,
  });

  // Podaci forme
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

  // BiH lokacija
  const { userLocation, saveLocation } = useUserLocation();
  const [bihLocation, setBihLocation] = useState({
    entityId: null,
    regionId: null,
    municipalityId: null,
    address: "",
    formattedAddress: "",
  });

  // Verifikacija
  const [verificationStatus, setVerificationStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Reference
  const initialDataRef = useRef(null);
  const fileInputRef = useRef(null);

  // Navigacijske stavke
  const navItems = useMemo(
    () => [
      { id: "osnovno", label: "Osnovni podaci", icon: User },
      { id: "kontakt", label: "Kontakt", icon: Phone },
      { id: "lokacija", label: "Lokacija", icon: MapPin },
      { id: "privatnost", label: "Privatnost", icon: Eye },
      { id: "notifikacije", label: "Obavijesti", icon: Bell },
      { id: "verifikacija", label: "Verifikacija", icon: Shield },
    ],
    []
  );

  // Statistike
  const stats = useMemo(
    () => [
      {
        icon: Layers,
        label: "Aktivni oglasi",
        value: UserData?.active_ads || 0,
        color: "bg-blue-500",
      },
      {
        icon: MessageSquare,
        label: "Poruke",
        value: UserData?.unread_messages || 0,
        color: "bg-emerald-500",
      },
      {
        icon: Heart,
        label: "Favoriti",
        value: UserData?.favorites_count || 0,
        color: "bg-pink-500",
      },
      {
        icon: Star,
        label: "Ocjena",
        value: UserData?.avg_rating ? UserData.avg_rating.toFixed(1) : "0.0",
        color: "bg-amber-500",
      },
    ],
    [UserData]
  );

  // Efekti
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

        // Verifikacija
        if (verificationRes?.data?.error === true) {
          setVerificationStatus("not applied");
        } else {
          setVerificationStatus(verificationRes?.data?.data?.status || "");
          setRejectionReason(verificationRes?.data?.data?.rejection_reason || "");
        }

        // Korisnički podaci
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

        // Postavke prodavca
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

  // Handleri
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value, data) => {
    const dial = data?.dialCode || "";
    const iso2 = data?.countryCode || "";
    const pureMobile = value.startsWith(dial) ? value.slice(dial.length) : value;

    setFormData((prev) => ({
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
    // Validacija
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
        setIsEditing((prev) => ({ ...prev, [section]: false }));
        toast.success("Promjene su uspješno sačuvane");
      } else {
        toast.error(response.data.message || "Greška pri čuvanju");
      }
    } catch (error) {
      console.error("Greška:", error);
      toast.error("Greška na serveru");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (section) => {
    setIsEditing((prev) => ({ ...prev, [section]: true }));
  };

  const cancelEditing = (section) => {
    setIsEditing((prev) => ({ ...prev, [section]: false }));
  };

  // Ako nije prijavljen
  if (!IsLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Niste prijavljeni</h2>
          <p className="text-slate-600 text-sm mb-4">Prijavite se da biste pristupili postavkama profila</p>
          <CustomLink
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Prijavi se
          </CustomLink>
        </div>
      </div>
    );
  }

  // Učitavanje
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Učitavanje profila...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Zaglavlje profila */}
      <div className="mb-6">
        {/* Korisničke informacije */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
          <ProfileAvatar
            customAvatarUrl={profileImage}
            avatarId={sellerAvatarId}
            size="lg"
            onImageClick={() => fileInputRef.current?.click()}
          />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{formData.name || "Vaš profil"}</h1>
              <VerificationBadge status={verificationStatus} reason={rejectionReason} />
            </div>
            <p className="text-slate-500 text-sm truncate">{formData.email}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-900 hover:underline font-medium flex items-center gap-1 mt-2"
            >
              <Camera className="w-3.5 h-3.5" />
              Promijeni sliku
            </button>
          </div>
        </div>

        {/* Statistike */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>

      {/* Glavni sadržaj */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop navigacija */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <nav className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Postavke</h3>
              <div className="space-y-0.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-left",
                      activeSection === item.id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Brzi linkovi */}
            <div className="bg-slate-900 rounded-2xl p-4 text-white">
              <h4 className="text-sm font-semibold mb-3">Brze akcije</h4>
              <div className="space-y-2">
                <CustomLink
                  href="/ad-listing"
                  className="flex items-center gap-2 text-xs text-white/80 hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Dodaj novi oglas
                </CustomLink>
                <CustomLink
                  href="/user-verification"
                  className="flex items-center gap-2 text-xs text-white/80 hover:text-white transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Verifikuj profil
                </CustomLink>
                <CustomLink
                  href="/faqs"
                  className="flex items-center gap-2 text-xs text-white/80 hover:text-white transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Pomoć i podrška
                </CustomLink>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobilna navigacija */}
        <div className="lg:hidden">
          <AnimatePresence>
            {showMobileNav && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 space-y-1.5"
              >
                {navItems.map((item) => (
                  <NavCard
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    icon={item.icon}
                    isActive={activeSection === item.id}
                    onClick={(id) => {
                      setActiveSection(id);
                      setShowMobileNav(false);
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!showMobileNav && (
            <button
              onClick={() => setShowMobileNav(true)}
              className="w-full flex items-center justify-between p-3 mb-4 bg-white rounded-xl border border-slate-200/80 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {navItems.find((item) => item.id === activeSection)?.icon && (
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {(() => {
                      const Icon = navItems.find((item) => item.id === activeSection)?.icon;
                      return Icon ? <Icon className="w-4 h-4 text-slate-600" /> : null;
                    })()}
                  </div>
                )}
                <span className="font-medium text-slate-900">{navItems.find((item) => item.id === activeSection)?.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Sadržaj sekcija */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* Osnovni podaci */}
          {activeSection === "osnovno" && (
            <FormSection
              title="Osnovni podaci"
              description="Vaši lični podaci i informacije o nalogu"
              icon={User}
              isEditing={isEditing.osnovno}
              onEdit={() => startEditing("osnovno")}
              onSave={() => handleSave("osnovno")}
              onCancel={() => cancelEditing("osnovno")}
              isSaving={isSaving}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Ime i prezime *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Unesite vaše puno ime"
                    disabled={!isEditing.osnovno}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email adresa
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@primjer.com"
                    disabled={!isEditing.osnovno}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>
            </FormSection>
          )}

          {/* Kontakt */}
          {activeSection === "kontakt" && (
            <FormSection
              title="Kontakt informacije"
              description="Načini na koje vas drugi korisnici mogu kontaktirati"
              icon={Phone}
              isEditing={isEditing.kontakt}
              onEdit={() => startEditing("kontakt")}
              onSave={() => handleSave("kontakt")}
              onCancel={() => cancelEditing("kontakt")}
              isSaving={isSaving}
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                    Broj telefona
                  </Label>
                  <PhoneInput
                    country={formData.region_code || "ba"}
                    value={`${formData.country_code || ""}${formData.phone || ""}`}
                    onChange={handlePhoneChange}
                    inputStyle={{
                      width: "100%",
                      height: "40px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "14px",
                    }}
                    buttonStyle={{
                      borderRadius: "12px 0 0 12px",
                      border: "1px solid #e2e8f0",
                    }}
                    disabled={!isEditing.kontakt}
                  />
                  <p className="text-xs text-slate-500">
                    Broj telefona je vidljiv samo ako ste to dozvolili u postavkama privatnosti
                  </p>
                </div>
              </div>
            </FormSection>
          )}

          {/* Lokacija */}
          {activeSection === "lokacija" && (
            <FormSection
              title="Lokacija"
              description="Odaberite vašu lokaciju za bolje pronalaženje oglasa"
              icon={MapPin}
              isEditing={isEditing.lokacija}
              onEdit={() => startEditing("lokacija")}
              onSave={() => handleSave("lokacija")}
              onCancel={() => cancelEditing("lokacija")}
              isSaving={isSaving}
            >
              <div className="space-y-4">
                <BiHLocationSelector value={bihLocation} onChange={setBihLocation} showAddress={true} disabled={!isEditing.lokacija} />

                {bihLocation.formattedAddress && (
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">Trenutna lokacija</p>
                      <p className="text-sm text-emerald-700 mt-0.5">{bihLocation.formattedAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>
          )}

          {/* Privatnost */}
          {activeSection === "privatnost" && (
            <FormSection
              title="Privatnost i sigurnost"
              description="Kontrolišite ko može vidjeti vaše podatke"
              icon={Eye}
              isEditing={isEditing.privatnost}
              onEdit={() => startEditing("privatnost")}
              onSave={() => handleSave("privatnost")}
              onCancel={() => cancelEditing("privatnost")}
              isSaving={isSaving}
            >
              <div className="space-y-3">
                <ToggleField
                  label="Prikaži kontakt podatke"
                  description="Omogućite drugim korisnicima da vide vaš broj telefona i email"
                  checked={formData.show_personal_details === 1}
                  onChange={() => handleChange("show_personal_details", formData.show_personal_details === 1 ? 0 : 1)}
                  disabled={!isEditing.privatnost}
                />
                <ToggleField
                  label="Online status"
                  description="Prikazujte kada ste online na platformi"
                  checked={false}
                  onChange={() => {}}
                  disabled={!isEditing.privatnost}
                />
              </div>
            </FormSection>
          )}

          {/* Obavijesti */}
          {activeSection === "notifikacije" && (
            <FormSection
              title="Obavijesti"
              description="Upravljajte kako i kada primate obavijesti"
              icon={Bell}
              isEditing={isEditing.notifikacije}
              onEdit={() => startEditing("notifikacije")}
              onSave={() => handleSave("notifikacije")}
              onCancel={() => cancelEditing("notifikacije")}
              isSaving={isSaving}
            >
              <div className="space-y-3">
                <ToggleField
                  label="Email obavijesti"
                  description="Primajte obavijesti na vašu email adresu"
                  checked={formData.notification === 1}
                  onChange={() => handleChange("notification", formData.notification === 1 ? 0 : 1)}
                  disabled={!isEditing.notifikacije}
                />
                <ToggleField
                  label="Push obavijesti"
                  description="Obavijesti na vašem uređaju u realnom vremenu"
                  checked={true}
                  onChange={() => {}}
                  disabled={!isEditing.notifikacije}
                />
              </div>
            </FormSection>
          )}

          {/* Verifikacija */}
          {activeSection === "verifikacija" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Shield className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Verifikacija profila</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Povećajte povjerenje i vjerodostojnost</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">Status verifikacije</p>
                    <p className="text-sm text-slate-600 mt-0.5">Verifikovani profili imaju veću stopu uspješnih transakcija</p>
                  </div>
                  <VerificationBadge status={verificationStatus} reason={rejectionReason} />
                </div>

                {/* Prednosti */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <BadgeCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="font-medium text-slate-900 text-sm mb-0.5">Povećano povjerenje</p>
                    <p className="text-xs text-slate-500">Korisnici više vjeruju verifikovanim profilima</p>
                  </div>

                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <MessageSquare className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="font-medium text-slate-900 text-sm mb-0.5">Više poruka</p>
                    <p className="text-xs text-slate-500">Verifikovani profili dobijaju više upita</p>
                  </div>

                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Star className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="font-medium text-slate-900 text-sm mb-0.5">Bolje pozicije</p>
                    <p className="text-xs text-slate-500">Oglasi se prikazuju na boljim pozicijama</p>
                  </div>
                </div>

                {/* CTA */}
                {verificationStatus !== "approved" && (
                  <div className="text-center pt-2">
                    <CustomLink
                      href="/user-verification"
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Započni verifikaciju
                    </CustomLink>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
