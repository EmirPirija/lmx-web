"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MessageCircle,
  Music2,
  Phone,
  PhoneCall,
  Play,
  Share2,
  Star,
  Store,
  Users,
  X,
  Heart,
  MapPin,
  Verified,
  User,
  ShoppingCart,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import GamificationBadge from "@/components/PagesComponent/Gamification/Badge";
import { formatResponseTimeBs } from "@/utils/index";
import SavedToListButton from "@/components/Profile/SavedToListButton";

/* =====================
  Helpers
===================== */

const MONTHS_BS = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

const formatMemberSince = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS_BS[d.getMonth()]} ${d.getFullYear()}`;
};

const responseTimeLabels = {
  instant: "par minuta",
  few_hours: "par sati",
  same_day: "24 sata",
  few_days: "par dana",
};

export const getResponseTimeLabel = ({ responseTime, responseTimeAvg, settings }) => {
  const direct = settings?.response_time_label || settings?.response_time_text || null;
  if (direct) return direct;

  if (!responseTime) return null;
  if (responseTime === "auto") return formatResponseTimeBs(responseTimeAvg);
  return responseTimeLabels[responseTime] || null;
};

const parseBusinessHours = (hours) => {
  if (!hours) return null;
  try {
    return typeof hours === "string" ? JSON.parse(hours) : hours;
  } catch {
    return null;
  }
};

const dayOrder = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const getDayKeyByIndex = (idx) => dayOrder[idx % 7];

const getHoursText = (d) => {
  if (!d || d.closed || !d.enabled) return "Zatvoreno";
  return `${d.open} – ${d.close}`;
};

const getTodayHours = (businessHours) => {
  if (!businessHours) return null;
  const todayKey = getDayKeyByIndex(new Date().getDay());
  return getHoursText(businessHours[todayKey]);
};

const getTomorrowHours = (businessHours) => {
  if (!businessHours) return null;
  const tomorrowKey = getDayKeyByIndex(new Date().getDay() + 1);
  return getHoursText(businessHours[tomorrowKey]);
};

const isCurrentlyOpen = (businessHours) => {
  if (!businessHours) return null;

  const now = new Date();
  const todayKey = getDayKeyByIndex(now.getDay());
  const todayHours = businessHours[todayKey];

  if (!todayHours || todayHours.closed || !todayHours.enabled) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = (todayHours.open || "09:00").split(":").map(Number);
  const [closeHour, closeMin] = (todayHours.close || "17:00").split(":").map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
};

const compactnessMap = {
  dense: { pad: "p-4 sm:p-5", avatar: "w-14 h-14", name: "text-base", meta: "text-xs", btn: "h-10" },
  normal: { pad: "p-5 sm:p-6", avatar: "w-16 h-16", name: "text-base sm:text-lg", meta: "text-xs", btn: "h-11" },
  cozy: { pad: "p-6 sm:p-7", avatar: "w-16 h-16", name: "text-lg sm:text-xl", meta: "text-sm", btn: "h-12" },
};

const SoftDivider = () => (
  <div className="h-px bg-gradient-to-r from-transparent via-slate-200/70 dark:via-slate-700/70 to-transparent" />
);

const IconPill = ({ icon: Icon, children, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 rounded-full border border-slate-200/70 dark:border-slate-700/70",
      "bg-white/70 dark:bg-slate-900/60 backdrop-blur px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200",
      className
    )}
  >
    {Icon ? <Icon className="h-4 w-4" /> : null}
    {children}
  </span>
);

const Tag = ({ children, tone = "neutral" }) => {
  const cls =
    tone === "pro"
      ? "border-amber-200/70 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200"
      : tone === "shop"
      ? "border-primary/25 bg-primary/10 text-primary dark:bg-primary/15"
      : "border-slate-200/70 bg-white/70 text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200";

  return <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", cls)}>{children}</span>;
};

const shimmerCss = `
@keyframes shimmer { 0% { transform: translateX(-70%); } 100% { transform: translateX(70%); } }
.shimmer { position: relative; overflow: hidden; }
.shimmer::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-70%);
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 90%);
  animation: shimmer 1.4s infinite;
}
.dark .shimmer::after {
  background: linear-gradient(90deg, rgba(2,6,23,0) 0%, rgba(148,163,184,0.18) 45%, rgba(2,6,23,0) 90%);
}
`;

const ShimmerStyles = () => <style jsx global>{shimmerCss}</style>;

export const SellerPreviewSkeleton = ({ compactness = "normal" }) => {
  const c = compactnessMap[compactness] || compactnessMap.normal;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-300">
      <ShimmerStyles />
      <div className={cn("relative", c.pad)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="rounded-full p-[3px] bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 shrink-0">
              <div className={cn(c.avatar, "rounded-full bg-slate-200 dark:bg-slate-800 shimmer")} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="h-4 w-44 rounded-full bg-slate-200 dark:bg-slate-800 shimmer" />
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="h-7 w-36 rounded-full bg-slate-200 dark:bg-slate-800 shimmer" />
                <div className="h-7 w-28 rounded-full bg-slate-200 dark:bg-slate-800 shimmer" />
              </div>
            </div>
          </div>

          <div className="h-10 w-10 rounded-2xl bg-slate-200 dark:bg-slate-800 shimmer" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <div className="h-10 w-28 rounded-2xl bg-slate-200 dark:bg-slate-800 shimmer" />
          <div className="h-10 w-32 rounded-2xl bg-slate-200 dark:bg-slate-800 shimmer" />
          <div className="h-10 w-28 rounded-2xl bg-slate-200 dark:bg-slate-800 shimmer" />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className={cn("flex-1 rounded-2xl bg-slate-200 dark:bg-slate-800 shimmer", c.btn)} />
          <div className={cn("w-11 rounded-2xl bg-slate-200 dark:bg-slate-800 shimmer", c.btn)} />
          <div className={cn("w-11 rounded-2xl bg-slate-200 dark:bg-slate-800 shimmer", c.btn)} />
        </div>

        <div className="mt-4 h-4 w-52 rounded-full bg-slate-200 dark:bg-slate-800 shimmer" />
      </div>
    </div>
  );
};

/* =====================
  Contact sheet
===================== */

const ContactSheet = ({ open, setOpen, seller, settings, actionsDisabled, onPhoneReveal, onChatClick }) => {
  const showWhatsapp = Boolean(settings?.show_whatsapp);
  const showViber = Boolean(settings?.show_viber);
  const showEmail = Boolean(settings?.show_email);
  const showPhone = Boolean(settings?.show_phone);

  const whatsappNumber = settings?.whatsapp_number || seller?.mobile;
  const viberNumber = settings?.viber_number || seller?.mobile;

  const phone = seller?.mobile;
  const email = seller?.email;

  const [copiedKey, setCopiedKey] = useState("");

  const copy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 1100);
      toast.success("Kopirano u clipboard");
    } catch {
      toast.error("Ne mogu kopirati.");
    }
  };

  const itemCls = cn(
    "w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
    "px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200",
    actionsDisabled && "opacity-60 pointer-events-none"
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
          "rounded-3xl p-0 overflow-hidden shadow-2xl"
        )}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">Kontaktiraj prodavača</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Odaberi kanal za kontakt.</div>
            </div>

            <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="h-5 w-5 text-slate-600 dark:text-slate-200" />
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {showPhone && phone ? (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <a
                  className={itemCls}
                  href={`tel:${phone}`}
                  onClick={() => {
                    try {
                      onPhoneReveal?.();
                    } catch {}
                  }}
                >
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Phone className="h-5 w-5 text-green-600" /> Pozovi
                  </span>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{phone}</div>
                </a>

                <button
                  type="button"
                  onClick={() => copy("phone", phone)}
                  className={cn(
                    "inline-flex items-center justify-center w-12 rounded-2xl border border-slate-200 dark:border-slate-700",
                    "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  )}
                >
                  {copiedKey === "phone" ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            ) : null}

            {showWhatsapp && whatsappNumber ? (
              <a
                className={itemCls}
                href={`https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp
                </span>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{whatsappNumber}</div>
              </a>
            ) : null}

            {showViber && viberNumber ? (
              <a className={itemCls} href={`viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`}>
                <span className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <PhoneCall className="h-5 w-5 text-violet-500" /> Viber
                </span>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{viberNumber}</div>
              </a>
            ) : null}

            {showEmail && email ? (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <a className={itemCls} href={`mailto:${email}`}>
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Mail className="h-5 w-5 text-blue-500" /> Email
                  </span>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{email}</div>
                </a>

                <button
                  type="button"
                  onClick={() => copy("email", email)}
                  className={cn(
                    "inline-flex items-center justify-center w-12 rounded-2xl border border-slate-200 dark:border-slate-700",
                    "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  )}
                >
                  {copiedKey === "email" ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                onChatClick && onChatClick();
                setOpen(false);
              }}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700",
                "bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-4 hover:opacity-90 transition-opacity"
              )}
            >
              <MessageCircle className="h-5 w-5" /> Pošalji poruku
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================
  Shared premium card
===================== */

export const SellerPreviewCard = ({
  seller,
  sellerSettings,
  badges,
  ratings,
  isPro = false,
  isShop = false,

  mode = "compact", // "compact" | "header"
  actionsDisabled = false,
  showProfileLink = true,

  uiPrefs,
  onChatClick,
  onPhoneClick,

  // backwards/optional
  shareUrl,
}) => {
  const pathname = usePathname();
  const CompanyName = useSelector(getCompanyName);

  const settings = sellerSettings || {};
  const prefs = uiPrefs || {};

  const compactness = prefs.compactness || settings?.card_preferences?.compactness || settings?.compactness || "normal";
  const contactStyle = prefs.contactStyle || settings?.card_preferences?.contactStyle || settings?.contact_style || "inline";

  const showRatings = prefs.showRatings ?? true;
  const showBadges = prefs.showBadges ?? true;
  const showMemberSince = prefs.showMemberSince ?? true;
  const showResponseTime = prefs.showResponseTime ?? true;
  const showShare = prefs.showShare ?? true;

  const c = compactnessMap[compactness] || compactnessMap.normal;

  if (!seller) return <SellerPreviewSkeleton compactness={compactness} />;

  const computedShareUrl =
    shareUrl ||
    (seller?.id ? `${process.env.NEXT_PUBLIC_WEB_URL}/seller/${seller.id}` : `${process.env.NEXT_PUBLIC_WEB_URL}${pathname}`);

  const title = `${seller?.name || "Prodavač"} | ${CompanyName}`;

  const responseLabel = showResponseTime
    ? getResponseTimeLabel({
        responseTime: settings?.response_time || "auto",
        responseTimeAvg: seller?.response_time_avg,
        settings,
      })
    : null;

  const memberSince = showMemberSince ? formatMemberSince(seller?.created_at) : "";

  const ratingValue = useMemo(
    () => (seller?.average_rating != null ? Number(seller.average_rating).toFixed(1) : null),
    [seller?.average_rating]
  );
  const ratingCount = useMemo(() => ratings?.total || ratings?.count || 0, [ratings]);

  const badgeList = (badges || []).slice(0, 3);

  const businessHours = parseBusinessHours(settings.business_hours);
  const showHours = Boolean(isShop && businessHours);
  const todayHoursText = showHours ? getTodayHours(businessHours) : null;
  const openNow = showHours ? isCurrentlyOpen(businessHours) : null;

  const primaryBtnCls = cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold",
    "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-95 transition-all duration-300",
    "shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
    c.btn,
    actionsDisabled && "opacity-60 cursor-not-allowed pointer-events-none"
  );

  const secondaryBtnCls = cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium",
    "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors",
    c.btn,
    actionsDisabled && "opacity-60 cursor-not-allowed pointer-events-none"
  );

  const iconBtnCls = cn(
    "inline-flex items-center justify-center w-11 rounded-2xl",
    "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200",
    "shadow-sm hover:shadow-md",
    actionsDisabled && "opacity-60 cursor-not-allowed pointer-events-none"
  );

  const [contactSheetOpen, setContactSheetOpen] = useState(false);

  const handlePhoneClick = () => {
    onPhoneClick?.();
  };

  const handleChatClick = () => {
    onChatClick?.();
  };

  return (
    <>
      <ContactSheet
        open={contactSheetOpen}
        setOpen={setContactSheetOpen}
        seller={seller}
        settings={settings}
        actionsDisabled={actionsDisabled}
        onPhoneReveal={handlePhoneClick}
        onChatClick={handleChatClick}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900",
          "shadow-xl hover:shadow-2xl transition-all duration-300"
        )}
      >
        <div className={cn("relative", c.pad)}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-md opacity-30"></div>
                <div className="relative rounded-full p-[3px] bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600">
                  <CustomImage
                    src={seller?.profile || seller?.profile_image}
                    fallback={<User className="h-8 w-8 text-slate-400" />}
                    className={cn(c.avatar, "rounded-full object-cover")}
                    width={64}
                    height={64}
                    alt={`${seller?.name || "Prodavač"} avatar`}
                  />
                </div>
                {seller?.is_verified && (
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-700">
                    <Verified className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={cn("font-bold text-slate-900 dark:text-white truncate", c.name)}>
                    {seller?.name || "Prodavač"}
                  </h3>
                  {seller?.is_verified && (
                    <Verified className="h-4 w-4 text-blue-500 shrink-0" aria-label="Verifikovan" />
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {showRatings && ratingValue && (
                    <div className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {ratingValue}
                      {ratingCount > 0 && <span className="text-slate-500 dark:text-slate-400">({ratingCount})</span>}
                    </div>
                  )}

                  {showMemberSince && memberSince && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">Član od {memberSince}</div>
                  )}

                  {showResponseTime && responseLabel && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">Odgovara za {responseLabel}</div>
                  )}

                  {showHours && todayHoursText && (
                    <div className={cn("text-xs font-medium", openNow ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {todayHoursText}
                      {openNow && <span className="ml-1">• Otvoreno</span>}
                    </div>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {isPro && <Tag tone="pro">PRO</Tag>}
                  {isShop && <Tag tone="shop">SHOP</Tag>}
                  {badgeList.map((b, i) => b && <GamificationBadge key={i} badge={b} size="xs" tone="subtle" />)}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                {showShare ? (
                  <ShareDropdown
                    url={computedShareUrl}
                    title={title}
                    description={seller?.bio || `Profil prodavača ${seller?.name || "nepoznat"}`}
                    trigger={
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className={iconBtnCls}
                      >
                        <Share2 className="h-5 w-5 text-slate-600 dark:text-slate-200" />
                      </motion.button>
                    }
                  />
                ) : null}

                {showProfileLink && (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={`/seller/${seller?.id}`}
                    className={iconBtnCls}
                  >
                    <ExternalLink className="h-5 w-5 text-slate-600 dark:text-slate-200" />
                  </motion.a>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className={iconBtnCls}
                >
                  <Heart className="h-5 w-5 text-slate-600 dark:text-slate-200" />
                </motion.button>
              </div>

              <div className="flex items-center gap-2">
                {settings?.show_phone && seller?.mobile && contactStyle === "inline" && (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={`tel:${seller.mobile}`}
                    className={cn(iconBtnCls, "h-11 w-11")}
                  >
                    <Phone className="h-5 w-5 text-green-600" />
                  </motion.a>
                )}

                {settings?.show_whatsapp && seller?.mobile && contactStyle === "inline" && (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={`https://wa.me/${String(seller?.mobile).replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(iconBtnCls, "h-11 w-11")}
                  >
                    <MessageCircle className="h-5 w-5 text-green-500" />
                  </motion.a>
                )}
              </div>
            </div>
          </div>

          {/* Meta */}
          {Boolean(seller?.location || seller?.city) && (
            <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="truncate">{seller?.location || seller?.city || "Lokacija nije navedena"}</span>
            </div>
          )}

          {Boolean(seller?.about || seller?.bio) && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{seller?.about || seller?.bio}</p>
          )}

          {/* Actions */}
          {contactStyle !== "inline" ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setContactSheetOpen(true)}
                className={primaryBtnCls}
                disabled={actionsDisabled}
              >
                <MessageCircle className="h-5 w-5" />
                Kontaktiraj prodavača
              </motion.button>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleChatClick}
                className={primaryBtnCls}
                disabled={actionsDisabled}
              >
                <MessageCircle className="h-5 w-5" />
                Pošalji poruku
              </motion.button>

              {settings?.show_phone && seller?.mobile && (
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={`tel:${seller.mobile}`}
                  className={secondaryBtnCls}
                >
                  <Phone className="h-5 w-5" />
                  Pozovi
                </motion.a>
              )}

              {settings?.show_whatsapp && seller?.mobile && (
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={`https://wa.me/${String(seller?.mobile).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className={secondaryBtnCls}
                >
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  WhatsApp
                </motion.a>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

/* =====================
  Accordion (animated)
===================== */

const useLocalStorageState = (key, initialValue) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(raw);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = (v) => {
    setValue(v);
    try {
      if (v == null) localStorage.removeItem(key);
      else localStorage.setItem(key, String(v));
    } catch {}
  };

  return [value, set];
};

const AccordionSection = ({ id, title, icon: Icon, openId, setOpenId, children }) => {
  const isOpen = openId === id;

  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpenId(isOpen ? "" : id)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition",
          "hover:bg-slate-50 dark:hover:bg-slate-800/60",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        )}
      >
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
        </span>
        <ChevronDown className={cn("h-5 w-5 text-slate-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const SocialPill = ({ icon: Icon, label, href }) => {
  const [copied, setCopied] = useState(false);

  const copy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {
      toast.error("Ne mogu kopirati link.");
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700",
        "bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200",
        "hover:shadow-md hover:border-primary/30 dark:hover:border-primary/30 transition",
        "hover:bg-slate-50 dark:hover:bg-slate-800"
      )}
      title={href}
    >
      <Icon className="h-5 w-5" />
      <span className="truncate max-w-[10rem]">{label}</span>

      <button
        type="button"
        onClick={copy}
        className={cn(
          "ml-1 inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700",
          "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition",
          "opacity-0 group-hover:opacity-100"
        )}
        aria-label="Kopiraj link"
      >
        {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
      </button>

      <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition">
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-amber-400/10 blur-xl" />
      </span>
    </a>
  );
};

const ProductSellerDetailCard = ({
  seller,
  ratings,
  badges,
  sellerSettings,
  isPro = false,
  isShop = false,

  onChatClick,
  onProfileClick,
  onPhoneReveal,
}) => {
  const settings = sellerSettings || {};
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);

  const businessDescription = settings.business_description || "";
  const returnPolicy = settings.return_policy || "";
  const shippingInfo = settings.shipping_info || "";

  const socialFacebook = settings.social_facebook || "";
  const socialInstagram = settings.social_instagram || "";
  const socialTiktok = settings.social_tiktok || "";
  const socialYoutube = settings.social_youtube || "";
  const socialWebsite = settings.social_website || "";

  const businessHours = parseBusinessHours(settings.business_hours);
  const showHours = Boolean(isShop && businessHours);
  const todayHoursText = showHours ? getTodayHours(businessHours) : null;
  const tomorrowHoursText = showHours ? getTomorrowHours(businessHours) : null;
  const openNow = showHours ? isCurrentlyOpen(businessHours) : null;

  const hasSocialLinks = Boolean(socialFacebook || socialInstagram || socialTiktok || socialYoutube || socialWebsite);

  const storageKey = seller?.id ? `seller_accordion_open_${seller.id}` : "seller_accordion_open";
  const [openId, setOpenId] = useLocalStorageState(storageKey, "contact");

  if (!seller) return <SellerPreviewSkeleton />;

  return (
    <div className="space-y-4">
      <SellerPreviewCard
        seller={seller}
        sellerSettings={settings}
        badges={badges}
        ratings={ratings}
        isPro={isPro}
        isShop={isShop}
        mode="header"
        uiPrefs={{ contactStyle: "sheet" }}
        onChatClick={onChatClick}
        onPhoneClick={() => setIsContactSheetOpen(true)}
      />

      <AccordionSection id="contact" title="Kontakt" icon={Phone} openId={openId} setOpenId={setOpenId}>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsContactSheetOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm hover:shadow-md"
          >
            <Phone className="h-5 w-5" /> Kontakt opcije
          </button>

          <button
            type="button"
            onClick={onChatClick}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2.5 text-sm font-semibold hover:opacity-95 transition shadow-sm hover:shadow-md"
          >
            <MessageCircle className="h-5 w-5" /> Pošalji poruku
          </button>
        </div>

        {hasSocialLinks ? (
          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Društvene mreže</div>
            <div className="flex flex-wrap gap-2">
              {socialFacebook ? <SocialPill icon={Users} label="Facebook" href={socialFacebook} /> : null}
              {socialInstagram ? <SocialPill icon={Camera} label="Instagram" href={socialInstagram} /> : null}
              {socialTiktok ? <SocialPill icon={Music2} label="TikTok" href={socialTiktok} /> : null}
              {socialYoutube ? <SocialPill icon={Play} label="YouTube" href={socialYoutube} /> : null}
              {socialWebsite ? <SocialPill icon={Globe} label="Web stranica" href={socialWebsite} /> : null}
            </div>
          </div>
        ) : null}
      </AccordionSection>

      {showHours ? (
        <AccordionSection id="hours" title="Radno vrijeme" icon={Calendar} openId={openId} setOpenId={setOpenId}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Danas: {todayHoursText}</div>
            {openNow !== null ? (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className={cn("h-2 w-2 rounded-full", openNow ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")} />
                {openNow ? "Otvoreno" : "Zatvoreno"}
              </span>
            ) : null}
          </div>

          {tomorrowHoursText ? (
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Sutra: <span className="font-semibold text-slate-900 dark:text-white">{tomorrowHoursText}</span>
            </div>
          ) : null}
        </AccordionSection>
      ) : null}

      {(shippingInfo || returnPolicy || businessDescription) ? (
        <AccordionSection id="info" title="Informacije" icon={Star} openId={openId} setOpenId={setOpenId}>
          <div className="space-y-4">
            {shippingInfo ? (
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Dostava</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{shippingInfo}</div>
              </div>
            ) : null}

            {returnPolicy ? (
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Povrat</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{returnPolicy}</div>
              </div>
            ) : null}

            {businessDescription ? (
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Opis</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{businessDescription}</div>
              </div>
            ) : null}
          </div>
        </AccordionSection>
      ) : null}

      <CustomLink
        href={`/seller/${seller?.id}`}
        onClick={onProfileClick}
        className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
      >
        Pogledaj profil
        <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-y-[-1px]" />
      </CustomLink>

      <ContactSheet
        open={isContactSheetOpen}
        setOpen={setIsContactSheetOpen}
        seller={seller}
        settings={settings}
        actionsDisabled={false}
        onPhoneReveal={onPhoneReveal}
        onChatClick={onChatClick}
      />
    </div>
  );
};

export default ProductSellerDetailCard;