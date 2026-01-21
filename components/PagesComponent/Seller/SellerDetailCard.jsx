"use client";
 
import { useMemo, useState } from "react";
import {
  MdOutlineMail,
  MdPhone,
  MdCalendarMonth,
  MdStar,
  MdContentCopy,
  MdCheck,
  MdVerified,
  MdBeachAccess,
  MdAccessTime,
  MdStorefront,
  MdWorkspacePremium,
  MdSchedule,
  MdLocalShipping,
  MdAssignmentReturn,
  MdOpenInNew,
} from "react-icons/md";
import { FaWhatsapp, FaViber, FaFacebook, FaInstagram, FaTiktok, FaYoutube, FaGlobe } from "react-icons/fa";
import { extractYear } from "@/utils";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import GamificationBadge from "@/components/PagesComponent/Gamification/Badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
 
// Helper za parsiranje radnog vremena
const parseBusinessHours = (hours) => {
  if (!hours) return null;
  try {
    return typeof hours === 'string' ? JSON.parse(hours) : hours;
  } catch {
    return null;
  }
};
 
// Helper za provjeru da li je trenutno otvoreno
const isCurrentlyOpen = (businessHours) => {
  if (!businessHours) return null;
  
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const todayHours = businessHours[today];
  
  if (!todayHours || todayHours.closed || !todayHours.enabled) return false;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = (todayHours.open || '09:00').split(':').map(Number);
  const [closeHour, closeMin] = (todayHours.close || '17:00').split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
};
 
// Helper za formatiranje radnog vremena danas
const getTodayHours = (businessHours) => {
  if (!businessHours) return null;
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  const todayHours = businessHours[today];
  
  if (!todayHours || todayHours.closed || !todayHours.enabled) return "Zatvoreno";
  return `${todayHours.open} - ${todayHours.close}`;
};
 
// Helper za formatiranje vremena
const formatLastSeen = (timestamp) => {
  if (!timestamp) return "";
  const now = new Date();
  const lastSeen = new Date(timestamp);
  if (isNaN(lastSeen.getTime())) return "";
 
  const diffInSeconds = Math.floor((now - lastSeen) / 1000);
 
  if (diffInSeconds < 60) return "Upravo sada";
  if (diffInSeconds < 3600) return `Prije ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Prije ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 172800) return "Jučer";
 
  return lastSeen.toLocaleDateString("bs-BA", { day: "numeric", month: "numeric", year: "numeric" });
};
 
// Response time labele
const responseTimeLabels = {
  auto: null, // ne prikazujemo ako je auto
  instant: "par minuta",
  few_hours: "par sati",
  same_day: "24 sata",
  few_days: "par dana",
};
 
const SellerDetailCard = ({
  seller,
  ratings,
  onPhoneReveal,
  onPhoneClick,
  badges,
  onEmailClick,
  onProfileClick,
  sellerSettings,
  isPro = false,
  isShop = false,
}) => {
  const pathname = usePathname();
  const CompanyName = useSelector(getCompanyName);
 
  const memberSinceYear = seller?.created_at ? extractYear(seller.created_at) : "";
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${pathname}`;
  const FbTitle = `${seller?.name || "Prodavač"} | ${CompanyName}`;
 
  const [isCopied, setIsCopied] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
 
  const isOnline = Boolean(seller?.is_online);
  const lastSeenText = !isOnline && seller?.last_seen ? formatLastSeen(seller.last_seen) : null;
 
  const ratingValue = useMemo(() => Number(seller?.average_rating || 0).toFixed(1), [seller?.average_rating]);
  const ratingCount = useMemo(() => ratings?.total || ratings?.data?.length || 0, [ratings]);
  
  // Seller settings
  const settings = sellerSettings || {};
  const vacationMode = Boolean(settings.vacation_mode);
  const vacationMessage = settings.vacation_message || "Prodavač je trenutno na godišnjem odmoru.";
  const responseTime = settings.response_time || null;
  const businessHours = parseBusinessHours(settings.business_hours);
  const currentlyOpen = isShop && businessHours ? isCurrentlyOpen(businessHours) : null;
  const todayHoursText = isShop && businessHours ? getTodayHours(businessHours) : null;
  
  // Contact options
  const showWhatsapp = Boolean(settings.show_whatsapp);
  const showViber = Boolean(settings.show_viber);
  const whatsappNumber = settings.whatsapp_number || seller?.mobile;
  const viberNumber = settings.viber_number || seller?.mobile;
  
  // Business info
  const businessDescription = settings.business_description || null;
  const returnPolicy = settings.return_policy || null;
  const shippingInfo = settings.shipping_info || null;
  
  // Social media
  const socialFacebook = settings.social_facebook || null;
  const socialInstagram = settings.social_instagram || null;
  const socialTiktok = settings.social_tiktok || null;
  const socialYoutube = settings.social_youtube || null;
  const socialWebsite = settings.social_website || null;
  
  const hasSocialLinks = socialFacebook || socialInstagram || socialTiktok || socialYoutube || socialWebsite;
  const hasBusinessInfo = businessDescription || returnPolicy || shippingInfo;
 
  const handleCopyPhone = () => {
    if (!seller?.mobile) return;
    navigator.clipboard.writeText(seller.mobile);
    setIsCopied(true);
    toast.success("Broj telefona je kopiran!");
    setTimeout(() => setIsCopied(false), 1800);
  };
 
  const handleOpenPhoneModal = () => {
    setIsPhoneModalOpen(true);
    if (onPhoneReveal) onPhoneReveal();
  };
 
  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden relative">
        {/* HERO HEADER */}
        <div className="relative h-28 bg-gradient-to-r from-primary/14 via-primary/8 to-transparent">
          <svg className="absolute inset-0 w-full h-full opacity-[0.10]" viewBox="0 0 400 120" fill="none">
            <path d="M0 80 C60 30 120 120 200 70 C270 30 320 110 400 60" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          </svg>
 
          <div className="absolute top-3 right-3">
            <ShareDropdown
              url={currentUrl}
              title={FbTitle}
              headline={FbTitle}
              companyName={CompanyName}
              className="bg-white/90 backdrop-blur-sm hover:bg-white border border-slate-100 rounded-full p-2 text-slate-700 transition-all"
            />
          </div>
        </div>
 
        <div className="px-6 pb-6 -mt-10 flex flex-col items-center">
          {/* AVATAR */}
          <div className="relative">
            <div className="p-1.5 rounded-full bg-white border border-slate-100">
              <CustomImage
                src={seller?.profile}
                alt="Prodavač"
                width={108}
                height={108}
                className="w-[108px] h-[108px] rounded-full object-cover"
              />
            </div>
            <span
              className={cn(
                "absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white",
                isOnline ? "bg-emerald-500" : "bg-slate-300"
              )}
              title={isOnline ? "Na mreži" : "Van mreže"}
            />
          </div>
 
          {/* GAMIFICATION BADGES */}
          {badges?.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {badges.slice(0, 3).map((badge) => (
                <div key={badge.id} className="relative group">
                  <div className="rounded-xl border border-slate-100 bg-white px-1.5 py-1">
                    <GamificationBadge badge={badge} size="sm" showName={false} showDescription={false} />
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                      {badge.name}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-4 border-transparent border-t-slate-900" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {badges.length > 3 && (
                <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-full">
                  +{badges.length - 3}
                </span>
              )}
            </div>
          )}
 
          {/* NAME + BADGES */}
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {seller?.name}
              </h3>
 
              {seller?.is_verified === 1 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-semibold">
                  <MdVerified className="text-base" />
                  Verifikovan
                </span>
              )}
              
              {/* MEMBERSHIP BADGE - Shop ima prioritet */}
              {isShop ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2.5 py-1 text-xs font-bold shadow-sm">
                  <MdStorefront className="text-base" />
                  Shop
                </span>
              ) : isPro ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 text-xs font-bold shadow-sm">
                  <MdWorkspacePremium className="text-base" />
                  Pro
                </span>
              ) : null}
            </div>
 
            {/* ONLINE STATUS */}
            <div className="mt-1 h-6">
              {isOnline ? (
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Na mreži
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  {lastSeenText ? `Na mreži: ${lastSeenText}` : "Van mreže"}
                </span>
              )}
            </div>
            
            {/* BUSINESS HOURS za Shop */}
            {isShop && businessHours && currentlyOpen !== null && (
              <div className="mt-2 flex flex-col items-center gap-1">
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full",
                  currentlyOpen 
                    ? "bg-green-50 text-green-700 border border-green-100" 
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                )}>
                  <MdSchedule className="text-sm" />
                  {currentlyOpen ? "Otvoreno" : "Zatvoreno"}
                </span>
                {todayHoursText && (
                  <span className="text-xs text-slate-500">
                    Danas: {todayHoursText}
                  </span>
                )}
              </div>
            )}
            
            {/* RESPONSE TIME */}
            {responseTime && responseTime !== 'auto' && responseTimeLabels[responseTime] && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <MdAccessTime className="text-sm" />
                  Obično odgovara za {responseTimeLabels[responseTime]}
                </span>
              </div>
            )}
          </div>
          
          {/* VACATION MODE ALERT */}
          {(isPro || isShop) && vacationMode && (
            <div className="mt-4 w-full">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <MdBeachAccess className="text-amber-600 text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">Na godišnjem odmoru</p>
                    <p className="text-amber-700 text-xs mt-1">{vacationMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
 
          {/* STATS ROW */}
          <div className="mt-5 w-full flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-100">
              <MdStar className="text-yellow-500 text-lg" />
              <span className="font-extrabold text-slate-900">{ratingValue}</span>
              <span className="text-xs text-slate-500">({ratingCount})</span>
            </div>
 
            {memberSinceYear && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-slate-100">
                <MdCalendarMonth className="text-slate-400 text-lg" />
                <span className="text-sm font-semibold text-slate-700">{memberSinceYear}</span>
              </div>
            )}
          </div>
 
          {/* CONTACT BUTTONS */}
          {seller?.show_personal_details === 1 && (seller?.email || seller?.mobile) && (
            <div className="mt-6 flex flex-col gap-3 w-full">
              <div className="grid grid-cols-2 gap-3">
                {seller?.mobile ? (
                  <button
                    onClick={handleOpenPhoneModal}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all"
                  >
                    <MdPhone className="text-xl" />
                    <span>Pozovi</span>
                  </button>
                ) : (
                  <button disabled className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">
                    <MdPhone className="text-xl" />
                    <span>Nema broj</span>
                  </button>
                )}
 
                {seller?.email ? (
                  <a
                    href={`mailto:${seller?.email}`}
                    onClick={onEmailClick}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold bg-white border border-slate-200 text-slate-800 hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-[0.98] transition-all"
                  >
                    <MdOutlineMail className="text-xl" />
                    <span>Email</span>
                  </a>
                ) : (
                  <button disabled className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">
                    <MdOutlineMail className="text-xl" />
                    <span>Nema email</span>
                  </button>
                )}
              </div>
              
              {/* WhatsApp */}
              {showWhatsapp && whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold bg-[#25D366] text-white hover:bg-[#1da851] active:scale-[0.98] transition-all"
                >
                  <FaWhatsapp className="text-xl" />
                  <span>WhatsApp</span>
                </a>
              )}
              
              {/* Viber */}
              {showViber && viberNumber && (
                <a
                  href={`viber://chat?number=${viberNumber.replace(/[^0-9]/g, '')}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold bg-[#7360f2] text-white hover:bg-[#5a4abf] active:scale-[0.98] transition-all"
                >
                  <FaViber className="text-xl" />
                  <span>Viber</span>
                </a>
              )}
            </div>
          )}
          
          {/* BUSINESS INFO */}
          {hasBusinessInfo && (
            <div className="mt-6 w-full space-y-3">
              <div className="h-px w-full bg-slate-100" />
              
              {businessDescription && (
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">O prodavaču</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{businessDescription}</p>
                </div>
              )}
              
              {(returnPolicy || shippingInfo) && (
                <div className="grid grid-cols-1 gap-3">
                  {shippingInfo && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <MdLocalShipping className="text-blue-500 text-lg flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-blue-700">Dostava</p>
                        <p className="text-xs text-blue-600 mt-0.5">{shippingInfo}</p>
                      </div>
                    </div>
                  )}
                  
                  {returnPolicy && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <MdAssignmentReturn className="text-green-500 text-lg flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-green-700">Povrat</p>
                        <p className="text-xs text-green-600 mt-0.5">{returnPolicy}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* SOCIAL MEDIA LINKS */}
          {hasSocialLinks && (
            <div className="mt-6 w-full">
              <div className="h-px w-full bg-slate-100 mb-4" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 text-center">Pratite na mrežama</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {socialFacebook && (
                  <a
                    href={socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
                    title="Facebook"
                  >
                    <FaFacebook className="text-lg" />
                  </a>
                )}
                {socialInstagram && (
                  <a
                    href={socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white hover:opacity-90 transition-opacity"
                    title="Instagram"
                  >
                    <FaInstagram className="text-lg" />
                  </a>
                )}
                {socialTiktok && (
                  <a
                    href={socialTiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-black text-white hover:opacity-90 transition-opacity"
                    title="TikTok"
                  >
                    <FaTiktok className="text-lg" />
                  </a>
                )}
                {socialYoutube && (
                  <a
                    href={socialYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#FF0000] text-white hover:opacity-90 transition-opacity"
                    title="YouTube"
                  >
                    <FaYoutube className="text-lg" />
                  </a>
                )}
                {socialWebsite && (
                  <a
                    href={socialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700 text-white hover:opacity-90 transition-opacity"
                    title="Web stranica"
                  >
                    <FaGlobe className="text-lg" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
 
        {/* FOOTER */}
        <div className="px-4 pb-4">
          <CustomLink
            href={`/seller/${seller?.id}`}
            onClick={onProfileClick}
            className="block w-full text-center text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3 hover:bg-white hover:border-slate-200 transition-colors"
          >
            Pogledaj sve oglase ovog korisnika →
          </CustomLink>
        </div>
      </div>
 
      {/* PHONE MODAL */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-sm w-[92%] rounded-3xl p-0 overflow-hidden bg-white border border-slate-100">
          <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-primary/12 to-transparent border-b border-slate-100 flex flex-col items-center">
            <div className="p-1.5 rounded-full bg-white border border-slate-100">
              <CustomImage src={seller?.profile} alt="Prodavač" width={72} height={72} className="w-16 h-16 rounded-full object-cover" />
            </div>
            <h3 className="mt-3 font-extrabold text-lg text-slate-900">{seller?.name}</h3>
            <p className="text-slate-500 text-sm">Kontakt telefon</p>
          </div>
 
          <div className="p-6 space-y-4">
            <button
              type="button"
              onClick={handleCopyPhone}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-100 active:scale-[0.99] transition-all"
            >
              <p className="text-2xl font-extrabold text-slate-900 tracking-wide">{seller?.mobile}</p>
              <p className="text-xs text-slate-500 mt-1">Klikni da kopiraš broj</p>
            </button>
 
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopyPhone}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                {isCopied ? <MdCheck className="text-emerald-600 text-xl" /> : <MdContentCopy className="text-xl" />}
                <span>{isCopied ? "Kopirano" : "Kopiraj"}</span>
              </button>
 
              <a
                href={`tel:${seller?.mobile}`}
                onClick={onPhoneClick}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                <MdPhone className="text-xl" />
                <span>Pozovi</span>
              </a>
            </div>
 
            <button
              type="button"
              onClick={() => setIsPhoneModalOpen(false)}
              className="w-full text-sm font-semibold text-slate-600 hover:text-slate-900 py-2"
            >
              Zatvori
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
 
export default SellerDetailCard;