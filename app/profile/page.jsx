"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js/max";

import ProfileLayout from "@/components/Profile/ProfileLayout";
import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import { loadUpdateUserData, userSignUpData } from "@/redux/reducer/authSlice";
import { Fcmtoken, settingsData } from "@/redux/reducer/settingSlice";
import { getUserInfoApi, getVerificationStatusApi, updateProfileApi } from "@/utils/api";
import { useUserLocation } from "@/hooks/useUserLocation";

import {
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Eye,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Camera,
  Shield,
  Sparkles,
  BadgeCheck,
  Upload,
  Loader2,
  Package,
  MessageSquare,
  Heart,
  Star,
} from "lucide-react";

// ============================================
// KOMPONENTE
// ============================================

function StatCard({ icon: Icon, label, value, color, trend }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full -mr-16 -mt-16" 
           style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
      
      <div className="relative z-10">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4", `bg-gradient-to-br ${color}`)}>
          <Icon size={28} className="text-white" />
        </div>
        <div className="text-4xl font-black text-slate-900 dark:text-white">{value}</div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</div>
      </div>
    </motion.div>
  );
}

function SectionCard({ icon: Icon, title, description, isEditing, onEdit, onSave, onCancel, isSaving, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Icon size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button onClick={onCancel} variant="ghost" size="sm" disabled={isSaving} className="gap-2">
                  <X size={16} />
                  Otkaži
                </Button>
                <Button onClick={onSave} size="sm" disabled={isSaving} className="gap-2 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Sačuvaj
                </Button>
              </>
            ) : (
              <Button onClick={onEdit} variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
                <Edit3 size={16} />
                Uredi
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

function ToggleCard({ label, description, checked, onChange, disabled }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300",
      checked 
        ? "border-primary/30 bg-primary/5 dark:bg-primary/10" 
        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
    )}>
      <div className="flex-1 min-w-0 pr-4">
        <div className="font-semibold text-slate-900 dark:text-white">{label}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="data-[state=checked]:bg-primary" />
    </div>
  );
}

function VerificationBadge({ status, reason }) {
  const configs = {
    approved: { icon: BadgeCheck, text: "Verifikovan", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    pending: { icon: Clock, text: "Na čekanju", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    resubmitted: { icon: Clock, text: "Ponovo poslano", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    rejected: { icon: AlertCircle, text: "Odbijeno", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    default: { icon: Shield, text: "Verifikuj se", color: "bg-primary/10 text-primary", isLink: true },
  };

  const config = configs[status] || configs.default;
  const Icon = config.icon;

  if (config.isLink) {
    return (
      <CustomLink href="/user-verification" className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-80", config.color)}>
        <Icon size={16} />
        {config.text}
      </CustomLink>
    );
  }

  return (
    <div className="space-y-2">
      <span className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold", config.color)}>
        <Icon size={16} />
        {config.text}
      </span>
      {status === "rejected" && reason && <p className="text-sm text-red-600 dark:text-red-400">{reason}</p>}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ProfilePage() {
  const userData = useSelector(userSignUpData);
  const IsLoggedIn = userData !== undefined && userData !== null;
  const settings = useSelector(settingsData);
  const fetchFCM = useSelector(Fcmtoken);
  const placeholder_image = settings?.placeholder_image;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const [profileImage, setProfileImage] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState({
    osnovno: false,
    kontakt: false,
    lokacija: false,
    privatnost: false,
    notifikacije: false,
  });

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

  const { userLocation, saveLocation } = useUserLocation();
  const [bihLocation, setBihLocation] = useState({
    entityId: null,
    regionId: null,
    municipalityId: null,
    address: "",
    formattedAddress: "",
  });

  const [verificationStatus, setVerificationStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const stats = useMemo(() => [
    { icon: Package, label: "Aktivni oglasi", value: userData?.active_ads || 0, color: "from-blue-500 to-indigo-600" },
    { icon: MessageSquare, label: "Poruke", value: userData?.unread_messages || 0, color: "from-green-500 to-emerald-600" },
    { icon: Heart, label: "Favoriti", value: userData?.favorites_count || 0, color: "from-pink-500 to-rose-600" },
    { icon: Star, label: "Ocjena", value: userData?.avg_rating ? Number(userData.avg_rating).toFixed(1) : "0.0", color: "from-amber-500 to-orange-600" },
  ], [userData]);

  // Load user location
  useEffect(() => {
    if (userLocation?.municipalityId) {
      setBihLocation(userLocation);
    }
  }, [userLocation]);

  // Load data
  useEffect(() => {
    if (!IsLoggedIn) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [verificationRes, userRes] = await Promise.all([
          getVerificationStatusApi.getVerificationStatus(),
          getUserInfoApi.getUserInfo(),
        ]);

        if (verificationRes?.data?.error === true) {
          setVerificationStatus("not applied");
        } else {
          setVerificationStatus(verificationRes?.data?.data?.status || "");
          setRejectionReason(verificationRes?.data?.data?.rejection_reason || "");
        }

        if (userRes?.data?.error === false) {
          const d = userRes.data.data;
          setFormData({
            name: d?.name || "",
            email: d?.email || "",
            phone: d?.mobile || "",
            address: d?.address || "",
            notification: d?.notification ?? 1,
            show_personal_details: Number(d?.show_personal_details) || 0,
            region_code: (d?.region_code || "ba").toLowerCase(),
            country_code: d?.country_code?.replace("+", "") || "387",
          });
          setProfileImage(d?.profile || placeholder_image);
          loadUpdateUserData(d);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Greška pri učitavanju profila");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [IsLoggedIn]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value, data) => {
    const dial = data?.dialCode || "";
    const iso2 = data?.countryCode || "";
    const pureMobile = value.startsWith(dial) ? value.slice(dial.length) : value;
    setFormData((prev) => ({ ...prev, phone: pureMobile, country_code: dial, region_code: iso2 }));
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
      toast.success("Slika odabrana. Kliknite 'Sačuvaj' za upload.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (section) => {
    if (section === "osnovno" && !formData.name.trim()) {
      toast.error("Ime je obavezno polje");
      return;
    }
    if (section === "kontakt" && formData.phone && !isValidPhoneNumber(`+${formData.country_code}${formData.phone}`)) {
      toast.error("Uneseni broj telefona nije ispravan");
      return;
    }
    if (section === "lokacija" && !bihLocation.municipalityId) {
      toast.error("Molimo odaberite lokaciju");
      return;
    }

    setIsSaving(true);
    try {
      if (section === "lokacija") saveLocation(bihLocation);

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
        loadUpdateUserData(response.data.data);
        setProfileFile(null);
        setIsEditing((prev) => ({ ...prev, [section]: false }));
        toast.success("Promjene su uspješno sačuvane!");
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

  if (!IsLoggedIn) {
    return (
      <ProfileLayout title="Moj profil">
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
              <User size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Niste prijavljeni</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Prijavite se da pristupite svom profilu</p>
            <CustomLink href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-orange-500 text-white font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
              Prijavi se
            </CustomLink>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  if (isLoading) {
    return (
      <ProfileLayout title="Moj profil">
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Učitavanje profila...</p>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout title="Moj profil" subtitle="Upravljajte vašim ličnim podacima i postavkama">
      <div className="space-y-8">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-accent via-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('/assets/pattern.svg')] opacity-10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative group">
                <div className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-sm border-4 border-white/30 overflow-hidden shadow-2xl">
                  {profileImage ? (
                    <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={48} className="text-white/60" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <Camera size={28} className="text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black">{formData.name || "Vaš profil"}</h1>
                  <VerificationBadge status={verificationStatus} reason={rejectionReason} />
                </div>
                <p className="text-white/70 text-lg">{formData.email}</p>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all"
                  >
                    <Upload size={16} />
                    Promijeni sliku
                  </button>
                  {verificationStatus !== "approved" && (
                    <CustomLink
                      href="/user-verification"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-accent rounded-xl text-sm font-semibold hover:bg-white/90 transition-all"
                    >
                      <Shield size={16} />
                      Verifikuj profil
                    </CustomLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Basic Info */}
          <SectionCard
            icon={User}
            title="Osnovni podaci"
            description="Vaše ime i email adresa"
            isEditing={isEditing.osnovno}
            onEdit={() => setIsEditing((p) => ({ ...p, osnovno: true }))}
            onSave={() => handleSave("osnovno")}
            onCancel={() => setIsEditing((p) => ({ ...p, osnovno: false }))}
            isSaving={isSaving}
          >
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ime i prezime *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Unesite vaše puno ime"
                  disabled={!isEditing.osnovno}
                  className="h-12 rounded-xl border-2 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email adresa</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@primjer.com"
                  disabled={!isEditing.osnovno}
                  className="h-12 rounded-xl border-2 focus:border-primary"
                />
              </div>
            </div>
          </SectionCard>

          {/* Contact */}
          <SectionCard
            icon={Phone}
            title="Kontakt informacije"
            description="Broj telefona za kontakt"
            isEditing={isEditing.kontakt}
            onEdit={() => setIsEditing((p) => ({ ...p, kontakt: true }))}
            onSave={() => handleSave("kontakt")}
            onCancel={() => setIsEditing((p) => ({ ...p, kontakt: false }))}
            isSaving={isSaving}
          >
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Broj telefona</Label>
              <PhoneInput
                country={formData.region_code || "ba"}
                value={`${formData.country_code || ""}${formData.phone || ""}`}
                onChange={handlePhoneChange}
                inputStyle={{ width: "100%", height: "48px", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "16px" }}
                buttonStyle={{ borderRadius: "12px 0 0 12px", border: "2px solid #e2e8f0" }}
                disabled={!isEditing.kontakt}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Broj telefona je vidljiv samo ako ste to dozvolili u postavkama privatnosti
              </p>
            </div>
          </SectionCard>

          {/* Location */}
          <SectionCard
            icon={MapPin}
            title="Lokacija"
            description="Vaša lokacija za oglase"
            isEditing={isEditing.lokacija}
            onEdit={() => setIsEditing((p) => ({ ...p, lokacija: true }))}
            onSave={() => handleSave("lokacija")}
            onCancel={() => setIsEditing((p) => ({ ...p, lokacija: false }))}
            isSaving={isSaving}
          >
            <div className="space-y-4">
              <BiHLocationSelector value={bihLocation} onChange={setBihLocation} showAddress={true} disabled={!isEditing.lokacija} />
              {bihLocation.formattedAddress && (
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                  <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-300">Trenutna lokacija</p>
                    <p className="text-sm text-green-700 dark:text-green-400">{bihLocation.formattedAddress}</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Privacy */}
          <SectionCard
            icon={Eye}
            title="Privatnost"
            description="Kontrolišite vidljivost vaših podataka"
            isEditing={isEditing.privatnost}
            onEdit={() => setIsEditing((p) => ({ ...p, privatnost: true }))}
            onSave={() => handleSave("privatnost")}
            onCancel={() => setIsEditing((p) => ({ ...p, privatnost: false }))}
            isSaving={isSaving}
          >
            <div className="space-y-4">
              <ToggleCard
                label="Prikaži kontakt podatke"
                description="Omogućite drugim korisnicima da vide vaš broj telefona i email"
                checked={formData.show_personal_details === 1}
                onChange={() => handleChange("show_personal_details", formData.show_personal_details === 1 ? 0 : 1)}
                disabled={!isEditing.privatnost}
              />
            </div>
          </SectionCard>

          {/* Notifications */}
          <SectionCard
            icon={Bell}
            title="Obavijesti"
            description="Upravljajte email obavijestima"
            isEditing={isEditing.notifikacije}
            onEdit={() => setIsEditing((p) => ({ ...p, notifikacije: true }))}
            onSave={() => handleSave("notifikacije")}
            onCancel={() => setIsEditing((p) => ({ ...p, notifikacije: false }))}
            isSaving={isSaving}
          >
            <div className="space-y-4">
              <ToggleCard
                label="Email obavijesti"
                description="Primajte obavijesti o novim porukama i aktivnostima"
                checked={formData.notification === 1}
                onChange={() => handleChange("notification", formData.notification === 1 ? 0 : 1)}
                disabled={!isEditing.notifikacije}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </ProfileLayout>
  );
}

