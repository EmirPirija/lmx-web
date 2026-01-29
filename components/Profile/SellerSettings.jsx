/* FULL CONTENT GENERATED FROM YOUR UPLOAD WITH DARK MODE + PREVIEW
   (SellerSettings.fixed.jsx) */

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
   import { formatResponseTimeBs } from "@/utils/index";
   import LmxAvatarGenerator from "@/components/Avatar/LmxAvatarGenerator";
   import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";
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
     MdVerified,
     MdAccessTime,
   } from "react-icons/md";
   import { FaViber, FaFacebook, FaInstagram, FaTiktok, FaYoutube, FaGlobe } from "react-icons/fa";
   
   /* =========================================================
      Helpers
   ========================================================= */
   
   const svgStringToBlob = (svgString) => {
     return new Promise((resolve) => {
       const img = new Image();
   
       let stringToLoad = svgString;
       if (!stringToLoad.includes("xmlns")) {
         stringToLoad = stringToLoad.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
       }
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
       <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
         <button
           type="button"
           onClick={() => setIsOpen(!isOpen)}
           className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
         >
           <div className="flex items-center gap-3">
             <div className="p-2.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
               <Icon className="text-primary text-xl" />
             </div>
             <div className="text-left">
               <div className="flex items-center gap-2">
                 <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                 {badge && (
                   <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full dark:bg-amber-500/15 dark:text-amber-200">
                     {badge}
                   </span>
                 )}
               </div>
               <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
             </div>
           </div>
           {isOpen ? (
             <MdExpandLess className="text-2xl text-slate-400" />
           ) : (
             <MdExpandMore className="text-2xl text-slate-400" />
           )}
         </button>
   
         {isOpen && (
           <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800">
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
         checked
           ? "bg-emerald-50/60 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20"
           : "bg-slate-50/50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800",
         disabled && "opacity-50"
       )}
     >
       <div className="flex items-start gap-3">
         {Icon && (
           <div
             className={cn(
               "p-2 rounded-lg mt-0.5",
               checked
                 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                 : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
             )}
           >
             <Icon className="text-lg" />
           </div>
         )}
         <div>
           <p className="font-medium text-slate-800 dark:text-slate-100">{label}</p>
           {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
         </div>
       </div>
       <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="flex-shrink-0" />
     </div>
   );
   
   const SettingInput = ({ label, placeholder, value, onChange, icon: Icon, type = "text", disabled = false }) => (
     <div className="space-y-2">
       <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</Label>
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
      Preview helpers (Seller card)
   ========================================================= */
   
   const responseTimeLabels = {
     instant: "par minuta",
     few_hours: "par sati",
     same_day: "24 sata",
     few_days: "par dana",
   };
   
   const formatJoinDateShort = (dateString) => {
     if (!dateString) return "";
     const d = new Date(dateString);
     if (Number.isNaN(d.getTime())) return "";
     const months = [
       "januar",
       "februar",
       "mart",
       "april",
       "maj",
       "juni",
       "juli",
       "august",
       "septembar",
       "oktembar",
       "novembar",
       "decembar",
     ];
     return `${months[d.getMonth()]} ${d.getFullYear()}`;
   };
   
   const SellerCardPreview = ({ user, previewImage, settings }) => {
     const name = user?.name || "Prodavač";
     const isVerified = Boolean(user?.is_verified);
     const joinDate = formatJoinDateShort(user?.created_at);
   
     const responseTime = settings?.response_time || "auto";
     const autoText = formatResponseTimeBs(user?.response_time_avg);
   
     const responseTimeText =
       responseTime === "auto"
         ? autoText ?? "Vrijeme odgovora se računa automatski"
         : responseTimeLabels[responseTime];
   
     const showPhone = Boolean(settings?.show_phone);
     const showEmail = Boolean(settings?.show_email);
     const showWhatsapp = Boolean(settings?.show_whatsapp);
     const showViber = Boolean(settings?.show_viber);
   
     const vacationMode = Boolean(settings?.vacation_mode);
     const vacationMessage = settings?.vacation_message || "Trenutno sam na odmoru. Vratit ću se uskoro!";
   
     const autoReplyEnabled = Boolean(settings?.auto_reply_enabled);
     const autoReplyMessage =
       settings?.auto_reply_message || "Hvala na poruci! Odgovorit ću vam u najkraćem mogućem roku.";
   
     return (
       <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 overflow-hidden">
         <div className="h-14 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent dark:from-primary/20 dark:via-primary/10" />
   
         <div className="-mt-7 px-4 pb-4">
           <div className="flex items-end justify-between gap-3">
             <div className="flex items-center gap-3 min-w-0">
               <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center">
                 {previewImage ? (
                   <img src={previewImage} alt={name} className="w-full h-full object-cover" />
                 ) : (
                   <LmxAvatarSvg avatarId={settings?.avatar_id || "lmx-01"} className="w-10 h-10" />
                 )}
               </div>
   
               <div className="min-w-0">
                 <div className="flex items-center gap-2 min-w-0">
                   <p className="font-extrabold text-slate-900 dark:text-white truncate">{name}</p>
                   {isVerified && <MdVerified className="text-primary text-lg" title="Verificiran" />}
                 </div>
                 <p className="text-xs text-slate-500 dark:text-slate-400">{joinDate ? `Član od ${joinDate}` : "—"}</p>
               </div>
             </div>
   
             <div className="flex items-center gap-1">
               <span
                 className={cn(
                   "inline-flex items-center justify-center w-9 h-9 rounded-xl border text-sm",
                   showPhone
                     ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-200"
                     : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-white/10 dark:text-slate-500"
                 )}
                 title={showPhone ? "Telefon prikazan" : "Telefon sakriven"}
               >
                 <MdPhone />
               </span>
               <span
                 className={cn(
                   "inline-flex items-center justify-center w-9 h-9 rounded-xl border text-sm",
                   showEmail
                     ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-200"
                     : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-white/10 dark:text-slate-500"
                 )}
                 title={showEmail ? "Email prikazan" : "Email sakriven"}
               >
                 <MdEmail />
               </span>
               <span
                 className={cn(
                   "inline-flex items-center justify-center w-9 h-9 rounded-xl border text-sm",
                   showWhatsapp
                     ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-200"
                     : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-white/10 dark:text-slate-500"
                 )}
                 title={showWhatsapp ? "WhatsApp uključen" : "WhatsApp isključen"}
               >
                 <MdWhatsapp />
               </span>
               <span
                 className={cn(
                   "inline-flex items-center justify-center w-9 h-9 rounded-xl border text-sm",
                   showViber
                     ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-200"
                     : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-white/10 dark:text-slate-500"
                 )}
                 title={showViber ? "Viber uključen" : "Viber isključen"}
               >
                 <FaViber />
               </span>
             </div>
           </div>
   
           <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
             <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-3">
               <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                 <MdAccessTime />
                 <span className="text-xs font-semibold">Vrijeme odgovora</span>
               </div>
               <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                 {responseTime === "auto" && !autoText ? responseTimeText : `Obično odgovara za ${responseTimeText}`}
               </div>
             </div>
   
             <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-3">
               <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                 <MdLocalOffer />
                 <span className="text-xs font-semibold">Ponude</span>
               </div>
               <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                 {settings?.accepts_offers ? "Prihvatam ponude" : "Ne prihvatam ponude"}
               </div>
             </div>
           </div>
   
           {autoReplyEnabled && (
             <div className="mt-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 p-3">
               <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                 <MdAutorenew className="text-lg" />
                 <span className="text-xs font-bold">Automatski odgovor</span>
               </div>
               <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{autoReplyMessage}</p>
             </div>
           )}
   
           {vacationMode && (
             <div className="mt-2 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-3">
               <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                 <MdBeachAccess className="text-lg" />
                 <span className="text-xs font-bold">Na odmoru</span>
               </div>
               <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80 line-clamp-2">{vacationMessage}</p>
             </div>
           )}
         </div>
       </div>
     );
   };
   
   /* =========================================================
      Main Component
   ========================================================= */
   
   const SellerSettings = () => {
     const dispatch = useDispatch();
     const currentUser = useSelector(userSignUpData);
   
     const [isLoading, setIsLoading] = useState(true);
     const [loadError, setLoadError] = useState("");
     const [isSaving, setIsSaving] = useState(false);
   
     const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
     const [isAvatarUploading, setIsAvatarUploading] = useState(false);
     const [previewImage, setPreviewImage] = useState(null);
     const fileInputRef = useRef(null);
   
     const initialPayloadRef = useRef(null);
     const [hasChanges, setHasChanges] = useState(false);
   
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
   
     useEffect(() => {
       if (currentUser?.profile_image) setPreviewImage(currentUser.profile_image);
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
   
     const updateProfileImage = async (fileOrBlob) => {
       if (!fileOrBlob) return;
   
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
       if (file) updateProfileImage(file);
     };
   
     const triggerFileInput = () => {
       if (fileInputRef.current) fileInputRef.current.click();
     };
   
     const handleDefaultIconSelect = async (id) => {
       setAvatarId(id);
       const svgString = renderToStaticMarkup(<LmxAvatarSvg avatarId={id} />);
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
           <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-200">
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
             <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Postavke prodavača</h2>
             <p className="text-slate-500 dark:text-slate-400 mt-1">Prilagodite kako kupci kontaktiraju i vide vaš profil</p>
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
           <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-500/10 dark:border-amber-500/20">
             <MdBeachAccess className="text-2xl text-amber-600 dark:text-amber-200 flex-shrink-0" />
             <div className="flex-1">
               <p className="font-medium text-amber-800 dark:text-amber-200">Vacation mode je aktivan</p>
               <p className="text-sm text-amber-600 dark:text-amber-300">Kupci će vidjeti poruku da ste na odmoru</p>
             </div>
             <Button variant="outline" size="sm" onClick={() => setVacationMode(false)} className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:text-amber-200 dark:hover:bg-amber-500/10">
               Isključi
             </Button>
           </div>
         )}
   
         {/* Avatar & Izgled */}
         <SettingsSection icon={MdPerson} title="Avatar & Izgled" description="Izaberite sliku s uređaja ili kreirajte jedinstveni avatar">
           <div className="flex flex-col md:flex-row gap-6">
             <div className="flex flex-col gap-4 items-center p-6 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 min-w-[200px]">
               <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-950 shadow-md bg-white dark:bg-slate-950">
                 {previewImage ? (
                   <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-primary/20">
                     <LmxAvatarSvg avatarId={avatarId} className="w-24 h-24" />
                   </div>
                 )}
               </div>
   
               <div className="w-full space-y-2">
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
   
                 <Button
                   onClick={triggerFileInput}
                   variant="outline"
                   className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5"
                   disabled={isAvatarUploading}
                 >
                   <MdCloudUpload size={18} /> Odaberi sliku
                 </Button>
   
                 <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                   <DialogTrigger asChild>
                     <Button className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                       <MdEdit size={16} /> Kreiraj Svoj Avatar
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                     <LmxAvatarGenerator onSave={updateProfileImage} onCancel={() => setIsAvatarModalOpen(false)} isSaving={isAvatarUploading} />
                   </DialogContent>
                 </Dialog>
               </div>
             </div>
   
             <div className="flex-1 space-y-4">
               <div>
                 <Label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 block">Brzi izbor (Ikone)</Label>
                 <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                   {AVATARS.map((a) => {
                     const selected = a.id === avatarId;
                     return (
                       <button
                         key={a.id}
                         type="button"
                         onClick={() => handleDefaultIconSelect(a.id)}
                         className={cn(
                           "aspect-square rounded-xl border bg-white dark:bg-slate-950 flex items-center justify-center transition-all p-1",
                           selected
                             ? "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
                             : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                         )}
                         title={a.name}
                       >
                         <div className="w-full h-full">
                           <LmxAvatarSvg avatarId={a.id} className="w-full h-full" />
                         </div>
                       </button>
                     );
                   })}
                 </div>
               </div>
   
               <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 flex gap-2 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-500/20">
                 <MdInfo className="text-lg flex-shrink-0 mt-0.5" />
                 <p>
                   Bilo da izaberete sliku, kreirate avatar ili kliknete na jedan od gotovih avatara – vaša profilna slika
                   će se ažurirati na cijelom sajtu.
                 </p>
               </div>
             </div>
           </div>
         </SettingsSection>
   
         {/* Kontakt opcije */}
         <SettingsSection icon={MdContactPhone} title="Kontakt opcije" description="Kontrolirajte kako vas kupci mogu kontaktirati">
           <SettingSwitch icon={MdPhone} label="Prikaži broj telefona" description="Kupci mogu vidjeti vaš broj telefona na oglasima" checked={showPhone} onChange={setShowPhone} />
           <SettingSwitch icon={MdEmail} label="Prikaži email" description="Kupci mogu vidjeti vašu email adresu" checked={showEmail} onChange={setShowEmail} />
           <SettingSwitch icon={MdWhatsapp} label="WhatsApp kontakt" description="Omogući kontakt putem WhatsApp-a" checked={showWhatsapp} onChange={setShowWhatsapp} />
   
           {showWhatsapp && (
             <div className="ml-11">
               <SettingInput label="WhatsApp broj" placeholder="+387 61 234 567" value={whatsappNumber} onChange={setWhatsappNumber} icon={MdWhatsapp} />
             </div>
           )}
   
           <SettingSwitch icon={FaViber} label="Viber kontakt" description="Omogući kontakt putem Viber-a" checked={showViber} onChange={setShowViber} />
   
           {showViber && (
             <div className="ml-11">
               <SettingInput label="Viber broj" placeholder="+387 61 234 567" value={viberNumber} onChange={setViberNumber} icon={FaViber} />
             </div>
           )}
   
           <div className="space-y-3">
             <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Preferirani način kontakta</Label>
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
                       : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-200 dark:hover:border-slate-700"
                   )}
                 >
                   <option.icon className="text-lg" />
                   <span>{option.label}</span>
                 </button>
               ))}
             </div>
           </div>
         </SettingsSection>
   
         {/* Vrijeme odgovora */}
         <SettingsSection icon={MdSchedule} title="Vrijeme odgovora" description="Postavite očekivano vrijeme odgovora na poruke">
           <div className="space-y-3">
             <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Koliko brzo obično odgovarate?</Label>
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
                         ? "bg-purple-50 border-purple-300 dark:bg-purple-500/10 dark:border-purple-500/30"
                         : "bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30"
                       : "bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-800 dark:hover:border-slate-700",
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
                               ? "text-purple-700 dark:text-purple-200"
                               : "text-emerald-700 dark:text-emerald-200"
                             : "text-slate-500 dark:text-slate-400"
                         )}
                       />
                     )}
                     <span
                       className={cn(
                         "font-semibold",
                         responseTime === option.value
                           ? option.highlight
                             ? "text-purple-700 dark:text-purple-200"
                             : "text-emerald-700 dark:text-emerald-200"
                           : "text-slate-700 dark:text-slate-200"
                       )}
                     >
                       {option.label}
                     </span>
                     {option.highlight && (
                       <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold rounded uppercase dark:bg-purple-500/20 dark:text-purple-200">
                         Preporučeno
                       </span>
                     )}
                   </div>
                   <span className={cn("text-xs mt-1", responseTime === option.value ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400")}>
                     {option.desc}
                   </span>
                 </button>
               ))}
             </div>
   
             {responseTime === "auto" && (
               <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-100 rounded-xl dark:bg-purple-500/10 dark:border-purple-500/20">
                 <MdInfo className="text-purple-600 dark:text-purple-200 text-lg flex-shrink-0 mt-0.5" />
                 <p className="text-xs text-purple-700 dark:text-purple-200">
                   Sistem će automatski pratiti koliko brzo odgovarate na poruke i prikazati to kupcima.
                 </p>
               </div>
             )}
   
             {/* ✅ PREVIEW */}
             <div className="pt-2 space-y-2">
               <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Pregled kartice na oglasu</Label>
   
               <SellerCardPreview
                 user={currentUser}
                 previewImage={previewImage}
                 settings={{
                   avatar_id: avatarId,
                   show_phone: showPhone,
                   show_email: showEmail,
                   show_whatsapp: showWhatsapp,
                   show_viber: showViber,
                   preferred_contact_method: preferredContact,
                   response_time: responseTime,
                   accepts_offers: acceptsOffers,
                   auto_reply_enabled: autoReplyEnabled,
                   auto_reply_message: autoReplyMessage,
                   vacation_mode: vacationMode,
                   vacation_message: vacationMessage,
                 }}
               />
             </div>
           </div>
         </SettingsSection>
   
         {/* Ponude */}
         <SettingsSection icon={MdLocalOffer} title="Ponude i pregovaranje" description="Postavke za primanje ponuda od kupaca">
           <SettingSwitch icon={MdLocalOffer} label="Prihvatam ponude" description="Kupci mogu slati ponude za vaše oglase" checked={acceptsOffers} onChange={setAcceptsOffers} />
         </SettingsSection>
   
         {/* Auto-reply */}
         <SettingsSection icon={MdAutorenew} title="Automatski odgovori" description="Automatski odgovarajte na nove poruke" badge="Pro">
           <SettingSwitch icon={MdAutorenew} label="Automatski odgovor" description="Šalje automatsku poruku kada primite novu poruku" checked={autoReplyEnabled} onChange={setAutoReplyEnabled} />
   
           {autoReplyEnabled && (
             <div className="space-y-2">
               <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Poruka automatskog odgovora</Label>
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
   
         {/* Vacation mode */}
         <SettingsSection icon={MdBeachAccess} title="Vacation mode" description="Obavijestite kupce da ste privremeno nedostupni">
           <SettingSwitch icon={MdBeachAccess} label="Vacation mode" description="Aktivirajte kada ste na odmoru ili privremeno nedostupni" checked={vacationMode} onChange={setVacationMode} />
   
           {vacationMode && (
             <div className="space-y-2">
               <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Poruka za kupce</Label>
               <Textarea value={vacationMessage} onChange={(e) => setVacationMessage(e.target.value)} placeholder="Napišite poruku koju će kupci vidjeti..." rows={2} maxLength={200} className="resize-none" />
             </div>
           )}
         </SettingsSection>
   
         {/* Poslovne informacije */}
         <SettingsSection icon={MdStorefront} title="Poslovne informacije" description="Dodatne informacije o vašem poslovanju" defaultOpen={false}>
           <div className="space-y-2">
             <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">O meni / O mom poslovanju</Label>
             <Textarea value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} placeholder="Opišite sebe ili svoje poslovanje..." rows={4} maxLength={500} className="resize-none" />
             <p className="text-xs text-slate-400 text-right">{businessDescription.length}/500</p>
           </div>
   
           <div className="space-y-2">
             <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
               <div className="flex items-center gap-2">
                 <MdAssignmentReturn className="text-lg text-slate-500" />
                 <span>Politika povrata</span>
               </div>
             </Label>
             <Textarea value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} placeholder="Opišite vašu politiku povrata proizvoda..." rows={3} maxLength={300} className="resize-none" />
           </div>
   
           <div className="space-y-2">
             <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
               <div className="flex items-center gap-2">
                 <MdLocalShipping className="text-lg text-slate-500" />
                 <span>Informacije o dostavi</span>
               </div>
             </Label>
             <Textarea value={shippingInfo} onChange={(e) => setShippingInfo(e.target.value)} placeholder="Opišite opcije dostave koje nudite..." rows={3} maxLength={300} className="resize-none" />
           </div>
         </SettingsSection>
   
         {/* Društvene mreže */}
         <SettingsSection icon={MdShare} title="Društvene mreže" description="Povežite vaše profile na društvenim mrežama" defaultOpen={false}>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <SettingInput label="Facebook" placeholder="https://facebook.com/..." value={socialFacebook} onChange={setSocialFacebook} icon={FaFacebook} />
             <SettingInput label="Instagram" placeholder="https://instagram.com/..." value={socialInstagram} onChange={setSocialInstagram} icon={FaInstagram} />
             <SettingInput label="TikTok" placeholder="https://tiktok.com/@..." value={socialTiktok} onChange={setSocialTiktok} icon={FaTiktok} />
             <SettingInput label="YouTube" placeholder="https://youtube.com/..." value={socialYoutube} onChange={setSocialYoutube} icon={FaYoutube} />
             <SettingInput label="Web stranica" placeholder="https://..." value={socialWebsite} onChange={setSocialWebsite} icon={FaGlobe} />
           </div>
         </SettingsSection>
   
         {/* Sticky Save Button (mobile) */}
         {hasChanges && (
           <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-lg z-50 lg:hidden">
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
   