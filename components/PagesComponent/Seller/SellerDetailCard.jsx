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

import { formatResponseTimeBs } from "@/utils/index";

/* ===================== helpers ===================== */

const parseBusinessHours = (hours) => {
  if (!hours) return null;
  try {
    return typeof hours === "string" ? JSON.parse(hours) : hours;
  } catch {
    return null;
  }
};

const isCurrentlyOpen = (businessHours) => {
  if (!businessHours) return null;

  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[now.getDay()];
  const todayHours = businessHours[today];

  if (!todayHours || todayHours.closed || !todayHours.enabled) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = (todayHours.open || "09:00").split(":").map(Number);
  const [closeHour, closeMin] = (todayHours.close || "17:00").split(":").map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
};

const getTodayHours = (businessHours) => {
  if (!businessHours) return null;
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[new Date().getDay()];
  const todayHours = businessHours[today];
  if (!todayHours || todayHours.closed || !todayHours.enabled) return "Zatvoreno";
  return `${todayHours.open} - ${todayHours.close}`;
};

const formatLastSeen = (timestamp) => {
  if (!timestamp) return "";
  const now = new Date();
  const lastSeen = new Date(timestamp);
  if (Number.isNaN(lastSeen.getTime())) return "";

  const diffInSeconds = Math.floor((now - lastSeen) / 1000);

  if (diffInSeconds < 60) return "Upravo sada";
  if (diffInSeconds < 3600) return `Prije ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Prije ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 172800) return "Jučer";

  return lastSeen.toLocaleDateString("bs-BA", { day: "numeric", month: "numeric", year: "numeric" });
};

const responseTimeLabels = {
  instant: "par minuta",
  few_hours: "par sati",
  same_day: "24 sata",
  few_days: "par dana",
};

/* ===================== component ===================== */

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

  const settings = sellerSettings || {};
  const vacationMode = Boolean(settings.vacation_mode);
  const vacationMessage = settings.vacation_message || "Prodavač je trenutno na godišnjem odmoru.";
  const responseTime = settings.response_time || "auto";

  const businessHours = parseBusinessHours(settings.business_hours);
  const currentlyOpen = isShop && businessHours ? isCurrentlyOpen(businessHours) : null;
  const todayHoursText = isShop && businessHours ? getTodayHours(businessHours) : null;

  // ✅ NEW: real auto text from avg
  const autoText = formatResponseTimeBs(seller?.response_time_avg);

  // ✅ as you requested
  const responseTimeText =
    responseTime === "auto"
      ? autoText ?? "Vrijeme odgovora se računa automatski"
      : responseTimeLabels[responseTime];

  const responseTimeDisplayText =
    responseTime === "auto"
      ? autoText
        ? `Obično odgovara za ${autoText}`
        : responseTimeText
      : responseTimeText
        ? `Obično odgovara za ${responseTimeText}`
        : null;

  const showWhatsapp = Boolean(settings.show_whatsapp);
  const showViber = Boolean(settings.show_viber);
  const whatsappNumber = settings.whatsapp_number || seller?.mobile;
  const viberNumber = settings.viber_number || seller?.mobile;

  const businessDescription = settings.business_description || null;
  const returnPolicy = settings.return_policy || null;
  const shippingInfo = settings.shipping_info || null;

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

  if (!seller) return null;

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
        {/* HERO HEADER */}
        <div className="relative h-28 bg-gradient-to-r from-primary/14 via-primary/8 to-transparent dark:from-primary/20 dark:via-primary/10">
          <svg className="absolute inset-0 w-full h-full opacity-[0.10]" viewBox="0 0 400 120" fill="none">
            <path
              d="M0 80 C60 30 120 120 200 70 C270 30 320 110 400 60"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute top-3 right-3">
            <ShareDropdown
              url={currentUrl}
              title={FbTitle}
              headline={FbTitle}
              companyName={CompanyName}
              className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full p-2 text-slate-700 dark:text-slate-200 transition-all"
            />
          </div>
        </div>

        <div className="px-6 pb-6 -mt-10 flex flex-col items-center">
          {/* AVATAR */}
          <div className="relative">
            <div className="p-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
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
                "absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900",
                isOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
              )}
              title={isOnline ? "Na mreži" : "Van mreže"}
            />
          </div>

          {/* NAME */}
          <div className="mt-3 flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{seller?.name}</h1>
            {Boolean(seller?.is_verified) && <MdVerified className="text-primary text-2xl" title="Verificiran" />}
          </div>

          {/* STATUS */}
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isOnline ? "Online" : lastSeenText ? `Posljednji put viđen: ${lastSeenText}` : ""}
          </div>

          {/* TIER */}
          {(isPro || isShop) && (
            <div className="mt-3 flex items-center gap-2">
              {isShop ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20">
                  <MdStorefront className="text-base" /> Shop
                </span>
              ) : null}
              {isPro ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
                  <MdWorkspacePremium className="text-base" /> Pro
                </span>
              ) : null}
            </div>
          )}

          {/* BADGES */}
          {badges?.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {badges.slice(0, 6).map((badge) => (
                <div
                  key={badge.id}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-1.5 py-1"
                >
                  <GamificationBadge badge={badge} size="sm" showName={false} showDescription={false} />
                </div>
              ))}
            </div>
          )}

          {/* STATS */}
          <div className="mt-5 w-full grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-200">
                <MdStar />
                <span className="text-xs font-semibold">Ocjena</span>
              </div>
              <div className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{ratingValue}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{ratingCount} recenzija</div>
            </div>

            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-200">
                <MdCalendarMonth />
                <span className="text-xs font-semibold">Član od</span>
              </div>
              <div className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{memberSinceYear || "—"}</div>
            </div>

            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-200">
                <MdAccessTime />
                <span className="text-xs font-semibold">Odgovor</span>
              </div>
              <div className="mt-1 text-[12px] leading-snug font-extrabold text-slate-900 dark:text-white">
                {responseTimeDisplayText || "—"}
              </div>
            </div>
          </div>

          {/* BUSINESS HOURS */}
          {isShop && businessHours && (
            <div className="mt-4 w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <MdSchedule />
                    <span className="text-sm font-bold">Radno vrijeme</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{todayHoursText}</div>
                </div>
                {currentlyOpen !== null && (
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold",
                      currentlyOpen
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    )}
                  >
                    {currentlyOpen ? "Otvoreno" : "Zatvoreno"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* VACATION */}
          {vacationMode && (
            <div className="mt-4 w-full rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <MdBeachAccess />
                <span className="text-sm font-bold">Na odmoru</span>
              </div>
              <div className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">{vacationMessage}</div>
            </div>
          )}

          {/* CONTACTS */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {seller?.mobile && (
              <>
                <button
                  type="button"
                  onClick={handleOpenPhoneModal}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  <MdPhone className="text-xl" />
                  Telefon
                </button>

                <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
                  <DialogContent className="max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="text-lg font-extrabold text-slate-900 dark:text-white">Kontakt telefon</div>
                    <div className="mt-1 text-slate-600 dark:text-slate-300">{seller.mobile}</div>

                    <div className="mt-4 flex gap-2">
                      <a
                        href={`tel:${seller.mobile}`}
                        onClick={onPhoneClick}
                        className="flex-1 text-center rounded-xl px-4 py-3 font-bold bg-primary text-white hover:opacity-95"
                      >
                        Pozovi
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                      >
                        {isCopied ? <MdCheck className="text-xl" /> : <MdContentCopy className="text-xl" />}
                        Kopiraj
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {showWhatsapp && whatsappNumber && (
              <a
                href={`https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <FaWhatsapp className="text-xl" />
                WhatsApp
              </a>
            )}

            {showViber && viberNumber && (
              <a
                href={`viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <FaViber className="text-xl" />
                Viber
              </a>
            )}

            {seller?.email && (
              <button
                type="button"
                onClick={onEmailClick}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <MdOutlineMail className="text-xl" />
                Email
              </button>
            )}
          </div>

          {/* SOCIAL LINKS */}
          {hasSocialLinks && (
            <div className="mt-5 flex items-center justify-center gap-3 text-slate-600 dark:text-slate-300">
              {socialFacebook && (
                <a href={socialFacebook} target="_blank" rel="noreferrer" className="hover:text-primary">
                  <FaFacebook className="text-xl" />
                </a>
              )}
              {socialInstagram && (
                <a href={socialInstagram} target="_blank" rel="noreferrer" className="hover:text-primary">
                  <FaInstagram className="text-xl" />
                </a>
              )}
              {socialTiktok && (
                <a href={socialTiktok} target="_blank" rel="noreferrer" className="hover:text-primary">
                  <FaTiktok className="text-xl" />
                </a>
              )}
              {socialYoutube && (
                <a href={socialYoutube} target="_blank" rel="noreferrer" className="hover:text-primary">
                  <FaYoutube className="text-xl" />
                </a>
              )}
              {socialWebsite && (
                <a href={socialWebsite} target="_blank" rel="noreferrer" className="hover:text-primary">
                  <FaGlobe className="text-xl" />
                </a>
              )}
            </div>
          )}

          {/* BUSINESS INFO */}
          {hasBusinessInfo && (
            <div className="mt-6 w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">Informacije</div>

              {shippingInfo && (
                <div className="mt-3 flex items-start gap-2 text-slate-700 dark:text-slate-200">
                  <MdLocalShipping className="text-xl mt-0.5" />
                  <div>
                    <div className="text-sm font-bold">Dostava</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{shippingInfo}</div>
                  </div>
                </div>
              )}

              {returnPolicy && (
                <div className="mt-3 flex items-start gap-2 text-slate-700 dark:text-slate-200">
                  <MdAssignmentReturn className="text-xl mt-0.5" />
                  <div>
                    <div className="text-sm font-bold">Povrat</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{returnPolicy}</div>
                  </div>
                </div>
              )}

              {businessDescription && (
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{businessDescription}</div>
              )}
            </div>
          )}

          {/* PROFILE LINK */}
          <div className="mt-6">
            <CustomLink
              href={`/seller/${seller?.id}`}
              onClick={onProfileClick}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              Pogledaj profil <MdOpenInNew />
            </CustomLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default SellerDetailCard;
