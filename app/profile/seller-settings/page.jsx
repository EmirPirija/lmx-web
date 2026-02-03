"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import ProfileLayout from "@/components/Profile/ProfileLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { userSignUpData } from "@/redux/reducer/authSlice";
import { sellerSettingsApi } from "@/utils/api";

import {
  Phone,
  MessageSquare,
  Mail,
  Clock,
  Palmtree,
  Globe,
  Eye,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  User,
  Settings,
  Shield,
  Loader2,
  MapPin,
  Calendar,
  Zap,
  Info,
  Link,
  Instagram,
  Facebook,
  TwitterIcon,
  Youtube,
  Linkedin,
  AtSign,
  Store,
} from "lucide-react";

// ============================================
// COMPONENTS
// ============================================

function SettingsSection({ icon: Icon, title, description, color = "from-primary to-orange-500", isOpen, onToggle, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center gap-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
      >
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0", `bg-gradient-to-br ${color}`)}>
          <Icon size={28} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
        >
          <ChevronDown size={20} className="text-slate-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-700">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ToggleOption({ label, description, checked, onChange, disabled }) {
  return (
    <label className={cn(
      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer",
      checked 
        ? "border-primary/30 bg-primary/5 dark:bg-primary/10" 
        : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <div className="flex-1 min-w-0 pr-4">
        <div className="font-semibold text-slate-900 dark:text-white">{label}</div>
        {description && <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="data-[state=checked]:bg-primary" />
    </label>
  );
}

function TimeRangeInput({ startValue, endValue, onStartChange, onEndChange, disabled }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Label className="text-xs text-slate-500 mb-1 block">Od</Label>
        <Input
          type="time"
          value={startValue}
          onChange={(e) => onStartChange(e.target.value)}
          disabled={disabled}
          className="h-12 rounded-xl border-2"
        />
      </div>
      <span className="text-slate-400 mt-5">—</span>
      <div className="flex-1">
        <Label className="text-xs text-slate-500 mb-1 block">Do</Label>
        <Input
          type="time"
          value={endValue}
          onChange={(e) => onEndChange(e.target.value)}
          disabled={disabled}
          className="h-12 rounded-xl border-2"
        />
      </div>
    </div>
  );
}

function SocialLinkInput({ icon: Icon, platform, value, onChange, placeholder, disabled }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <Icon size={16} className="text-slate-400" />
        {platform}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-12 rounded-xl border-2"
      />
    </div>
  );
}

function StatusBadge({ status, text }) {
  const configs = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    danger: AlertTriangle,
  };

  const IconComponent = icons[status] || CheckCircle;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold", configs[status])}>
      <IconComponent size={14} />
      {text}
    </span>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function SellerSettingsPage() {
  const userData = useSelector(userSignUpData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [openSections, setOpenSections] = useState({
    contact: true,
    availability: false,
    autoReply: false,
    vacation: false,
    customer: false,
    social: false,
    preview: false,
  });

  const [settings, setSettings] = useState({
    // Contact
    show_phone: true,
    show_email: true,
    whatsapp_enabled: false,
    viber_enabled: false,

    // Availability
    working_hours_enabled: false,
    working_hours_start: "09:00",
    working_hours_end: "17:00",
    offers_enabled: true,

    // Auto Reply
    auto_reply_enabled: false,
    auto_reply_message: "",

    // Vacation
    vacation_mode: false,
    vacation_message: "",
    vacation_start: "",
    vacation_end: "",

    // Customer Info
    show_customer_name: true,
    show_customer_email: false,
    show_customer_phone: false,
    show_customer_address: false,

    // Social Links
    website: "",
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
    linkedin: "",
    tiktok: "",

    // Preview
    show_rating: true,
    show_reviews_count: true,
    show_member_since: true,
  });

  const toggleSection = (key) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const handleChange = (key, value) => setSettings((p) => ({ ...p, [key]: value }));

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await sellerSettingsApi.getSettings();
      if (response?.data?.error === false && response?.data?.data) {
        const d = response.data.data;
        setSettings((p) => ({
          ...p,
          show_phone: Boolean(d.show_phone ?? true),
          show_email: Boolean(d.show_email ?? true),
          whatsapp_enabled: Boolean(d.whatsapp_enabled ?? false),
          viber_enabled: Boolean(d.viber_enabled ?? false),
          working_hours_enabled: Boolean(d.working_hours_enabled ?? false),
          working_hours_start: d.working_hours_start || "09:00",
          working_hours_end: d.working_hours_end || "17:00",
          offers_enabled: Boolean(d.offers_enabled ?? true),
          auto_reply_enabled: Boolean(d.auto_reply_enabled ?? false),
          auto_reply_message: d.auto_reply_message || "",
          vacation_mode: Boolean(d.vacation_mode ?? false),
          vacation_message: d.vacation_message || "",
          vacation_start: d.vacation_start || "",
          vacation_end: d.vacation_end || "",
          show_customer_name: Boolean(d.show_customer_name ?? true),
          show_customer_email: Boolean(d.show_customer_email ?? false),
          show_customer_phone: Boolean(d.show_customer_phone ?? false),
          show_customer_address: Boolean(d.show_customer_address ?? false),
          website: d.website || "",
          instagram: d.instagram || "",
          facebook: d.facebook || "",
          twitter: d.twitter || "",
          youtube: d.youtube || "",
          linkedin: d.linkedin || "",
          tiktok: d.tiktok || "",
          show_rating: Boolean(d.show_rating ?? true),
          show_reviews_count: Boolean(d.show_reviews_count ?? true),
          show_member_since: Boolean(d.show_member_since ?? true),
        }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Greška pri učitavanju postavki");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await sellerSettingsApi.updateSettings(settings);
      if (response?.data?.error === false) {
        toast.success("Postavke su uspješno sačuvane!");
      } else {
        toast.error(response?.data?.message || "Greška pri čuvanju");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Greška na serveru");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
    toast.info("Postavke su vraćene na zadnje sačuvano stanje");
  };

  if (loading) {
    return (
      <ProfileLayout title="Postavke prodavača">
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 size={48} className="animate-spin text-primary" />
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout title="Postavke prodavača" subtitle="Prilagodite kako vas kupci vide i kontaktiraju">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {settings.vacation_mode && <StatusBadge status="warning" text="Vacation mode aktivan" />}
            {settings.auto_reply_enabled && <StatusBadge status="success" text="Auto-reply uključen" />}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleReset} variant="outline" disabled={saving} className="gap-2 rounded-xl h-11">
              <RotateCcw size={18} />
              Poništi izmjene
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Sačuvaj
            </Button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Contact Options */}
          <SettingsSection
            icon={Phone}
            title="Opcije kontakta"
            description="Kako vas kupci mogu kontaktirati"
            color="from-blue-500 to-indigo-600"
            isOpen={openSections.contact}
            onToggle={() => toggleSection("contact")}
          >
            <div className="space-y-4">
              <ToggleOption
                label="Prikaži broj telefona"
                description="Kupci će vidjeti vaš broj telefona na oglasima"
                checked={settings.show_phone}
                onChange={(v) => handleChange("show_phone", v)}
              />
              <ToggleOption
                label="Prikaži email"
                description="Kupci će vidjeti vašu email adresu"
                checked={settings.show_email}
                onChange={(v) => handleChange("show_email", v)}
              />
              <ToggleOption
                label="WhatsApp"
                description="Omogućite kontakt putem WhatsApp-a"
                checked={settings.whatsapp_enabled}
                onChange={(v) => handleChange("whatsapp_enabled", v)}
              />
              <ToggleOption
                label="Viber"
                description="Omogućite kontakt putem Viber-a"
                checked={settings.viber_enabled}
                onChange={(v) => handleChange("viber_enabled", v)}
              />
            </div>
          </SettingsSection>

          {/* Availability */}
          <SettingsSection
            icon={Clock}
            title="Dostupnost i ponude"
            description="Radno vrijeme i prihvatanje ponuda"
            color="from-purple-500 to-violet-600"
            isOpen={openSections.availability}
            onToggle={() => toggleSection("availability")}
          >
            <div className="space-y-4">
              <ToggleOption
                label="Prihvatam ponude"
                description="Kupci mogu slati ponude za vaše oglase"
                checked={settings.offers_enabled}
                onChange={(v) => handleChange("offers_enabled", v)}
              />
              
              <ToggleOption
                label="Radno vrijeme"
                description="Prikažite radno vrijeme na profilu"
                checked={settings.working_hours_enabled}
                onChange={(v) => handleChange("working_hours_enabled", v)}
              />

              {settings.working_hours_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl"
                >
                  <TimeRangeInput
                    startValue={settings.working_hours_start}
                    endValue={settings.working_hours_end}
                    onStartChange={(v) => handleChange("working_hours_start", v)}
                    onEndChange={(v) => handleChange("working_hours_end", v)}
                  />
                </motion.div>
              )}
            </div>
          </SettingsSection>

          {/* Auto Reply */}
          <SettingsSection
            icon={MessageSquare}
            title="Automatski odgovor"
            description="Automatski odgovorite na poruke"
            color="from-green-500 to-emerald-600"
            isOpen={openSections.autoReply}
            onToggle={() => toggleSection("autoReply")}
          >
            <div className="space-y-4">
              <ToggleOption
                label="Omogući automatski odgovor"
                description="Automatski šalje poruku kada vas neko kontaktira"
                checked={settings.auto_reply_enabled}
                onChange={(v) => handleChange("auto_reply_enabled", v)}
              />

              {settings.auto_reply_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Poruka automatskog odgovora</Label>
                    <Textarea
                      value={settings.auto_reply_message}
                      onChange={(e) => handleChange("auto_reply_message", e.target.value)}
                      placeholder="Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku."
                      rows={4}
                      className="rounded-xl border-2"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </SettingsSection>

          {/* Vacation Mode */}
          <SettingsSection
            icon={Palmtree}
            title="Vacation mode"
            description="Privremeno pauzirajte aktivnosti"
            color="from-amber-500 to-orange-600"
            isOpen={openSections.vacation}
            onToggle={() => toggleSection("vacation")}
          >
            <div className="space-y-4">
              {settings.vacation_mode && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-200">Vacation mode je aktivan</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Vaši oglasi su privremeno neaktivni</p>
                  </div>
                </div>
              )}

              <ToggleOption
                label="Uključi vacation mode"
                description="Privremeno sakrijte sve svoje oglase"
                checked={settings.vacation_mode}
                onChange={(v) => handleChange("vacation_mode", v)}
              />

              {settings.vacation_mode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Calendar size={14} />
                        Početak
                      </Label>
                      <Input
                        type="date"
                        value={settings.vacation_start}
                        onChange={(e) => handleChange("vacation_start", e.target.value)}
                        className="h-12 rounded-xl border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Calendar size={14} />
                        Kraj
                      </Label>
                      <Input
                        type="date"
                        value={settings.vacation_end}
                        onChange={(e) => handleChange("vacation_end", e.target.value)}
                        className="h-12 rounded-xl border-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Poruka za kupce</Label>
                    <Textarea
                      value={settings.vacation_message}
                      onChange={(e) => handleChange("vacation_message", e.target.value)}
                      placeholder="Trenutno sam na odmoru. Vratit ću se uskoro!"
                      rows={3}
                      className="rounded-xl border-2"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </SettingsSection>

          {/* Customer Info */}
          <SettingsSection
            icon={User}
            title="Informacije o kupcima"
            description="Koji podaci kupaca se prikazuju vama"
            color="from-teal-500 to-cyan-600"
            isOpen={openSections.customer}
            onToggle={() => toggleSection("customer")}
          >
            <div className="space-y-4">
              <ToggleOption
                label="Ime kupca"
                description="Vidite ime kupca koji vas kontaktira"
                checked={settings.show_customer_name}
                onChange={(v) => handleChange("show_customer_name", v)}
              />
              <ToggleOption
                label="Email kupca"
                description="Vidite email adresu kupca"
                checked={settings.show_customer_email}
                onChange={(v) => handleChange("show_customer_email", v)}
              />
              <ToggleOption
                label="Telefon kupca"
                description="Vidite broj telefona kupca"
                checked={settings.show_customer_phone}
                onChange={(v) => handleChange("show_customer_phone", v)}
              />
              <ToggleOption
                label="Adresa kupca"
                description="Vidite adresu kupca"
                checked={settings.show_customer_address}
                onChange={(v) => handleChange("show_customer_address", v)}
              />
            </div>
          </SettingsSection>

          {/* Social Links */}
          <SettingsSection
            icon={Globe}
            title="Društvene mreže"
            description="Povežite vaše profile na društvenim mrežama"
            color="from-pink-500 to-rose-600"
            isOpen={openSections.social}
            onToggle={() => toggleSection("social")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SocialLinkInput
                icon={Globe}
                platform="Website"
                value={settings.website}
                onChange={(v) => handleChange("website", v)}
                placeholder="https://vasa-stranica.com"
              />
              <SocialLinkInput
                icon={Instagram}
                platform="Instagram"
                value={settings.instagram}
                onChange={(v) => handleChange("instagram", v)}
                placeholder="@username"
              />
              <SocialLinkInput
                icon={Facebook}
                platform="Facebook"
                value={settings.facebook}
                onChange={(v) => handleChange("facebook", v)}
                placeholder="facebook.com/username"
              />
              <SocialLinkInput
                icon={AtSign}
                platform="TikTok"
                value={settings.tiktok}
                onChange={(v) => handleChange("tiktok", v)}
                placeholder="@username"
              />
              <SocialLinkInput
                icon={Youtube}
                platform="YouTube"
                value={settings.youtube}
                onChange={(v) => handleChange("youtube", v)}
                placeholder="youtube.com/@username"
              />
              <SocialLinkInput
                icon={Linkedin}
                platform="LinkedIn"
                value={settings.linkedin}
                onChange={(v) => handleChange("linkedin", v)}
                placeholder="linkedin.com/in/username"
              />
            </div>
          </SettingsSection>

          {/* Preview Options */}
          <SettingsSection
            icon={Eye}
            title="Prikaz profila"
            description="Što se prikazuje na vašoj prodavačkoj kartici"
            color="from-slate-600 to-slate-800"
            isOpen={openSections.preview}
            onToggle={() => toggleSection("preview")}
          >
            <div className="space-y-4">
              <ToggleOption
                label="Prikaži ocjenu"
                description="Vaša prosječna ocjena se prikazuje na kartici"
                checked={settings.show_rating}
                onChange={(v) => handleChange("show_rating", v)}
              />
              <ToggleOption
                label="Prikaži broj recenzija"
                description="Ukupan broj recenzija se prikazuje"
                checked={settings.show_reviews_count}
                onChange={(v) => handleChange("show_reviews_count", v)}
              />
              <ToggleOption
                label="Prikaži datum članstva"
                description="Prikažite koliko dugo ste član"
                checked={settings.show_member_since}
                onChange={(v) => handleChange("show_member_since", v)}
              />
            </div>
          </SettingsSection>
        </div>

        {/* Bottom Save Button (Mobile) */}
        <div className="lg:hidden sticky bottom-4 z-10">
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="w-full h-14 gap-2 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 rounded-2xl shadow-xl shadow-primary/30 text-lg font-bold"
          >
            {saving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
            Sačuvaj postavke
          </Button>
        </div>
      </div>
    </ProfileLayout>
  );
}
