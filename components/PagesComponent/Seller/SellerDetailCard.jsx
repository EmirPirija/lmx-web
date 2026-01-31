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
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900">
      <ShimmerStyles />
      <div className={cn("relative", c.pad)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="rounded-full p-[3px] bg-gradient-to-br from-primary/50 via-slate-200 to-amber-300/60 dark:via-slate-700 shrink-0">
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

const ContactSheet = ({ open, setOpen, seller, settings, actionsDisabled, onPhoneReveal }) => {
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
    } catch {
      toast.error("Ne mogu kopirati.");
    }
  };

  const itemCls = cn(
    "w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
    "px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition",
    actionsDisabled && "opacity-60 pointer-events-none"
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
          "rounded-3xl p-0 overflow-hidden"
        )}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">Kontakt</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Odaberi kanal koji želiš koristiti.</div>
            </div>

            <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-5 w-5 text-slate-600 dark:text-slate-200" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
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
                    <Phone className="h-5 w-5" /> Pozovi
                  </span>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{phone}</div>
                </a>

                <button
                  type="button"
                  onClick={() => copy("phone", phone)}
                  className={cn(
                    "inline-flex items-center justify-center w-12 rounded-2xl border border-slate-200 dark:border-slate-700",
                    "hover:bg-slate-50 dark:hover:bg-slate-800 transition"
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
                  <MessageCircle className="h-5 w-5" /> WhatsApp
                </span>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{whatsappNumber}</div>
              </a>
            ) : null}

            {showViber && viberNumber ? (
              <a className={itemCls} href={`viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`}>
                <span className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <PhoneCall className="h-5 w-5" /> Viber
                </span>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{viberNumber}</div>
              </a>
            ) : null}

            {showEmail && email ? (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <a className={itemCls} href={`mailto:${email}`}>
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <Mail className="h-5 w-5" /> Email
                  </span>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{email}</div>
                </a>

                <button
                  type="button"
                  onClick={() => copy("email", email)}
                  className={cn(
                    "inline-flex items-center justify-center w-12 rounded-2xl border border-slate-200 dark:border-slate-700",
                    "hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  )}
                >
                  {copiedKey === "email" ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            ) : null}
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
    "bg-slate-900 text-white hover:opacity-95 dark:bg-white dark:text-slate-900 transition",
    "shadow-sm hover:shadow-md",
    c.btn,
    actionsDisabled && "opacity-60 cursor-not-allowed pointer-events-none"
  );

  const iconBtnCls = cn(
    "inline-flex items-center justify-center w-11 rounded-2xl",
    "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
    "text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition",
    "shadow-sm hover:shadow-md",
    c.btn,
    actionsDisabled && "opacity-60 cursor-not-allowed pointer-events-none"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900"
    >
      <ShimmerStyles />

      {/* subtle premium background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 -right-28 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className={cn("relative", c.pad)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* avatar */}
            <div className="relative shrink-0">
              <div className="rounded-full p-[3px] bg-gradient-to-br from-primary/60 via-slate-200 to-amber-300/70 dark:from-primary/50 dark:via-slate-700 dark:to-amber-400/60">
                <CustomImage
                  src={seller?.profile}
                  alt="Prodavač"
                  width={64}
                  height={64}
                  className={cn(c.avatar, "rounded-full object-cover bg-white dark:bg-slate-900")}
                />
              </div>

              {Boolean(seller?.is_verified) ? (
                <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white shadow">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              ) : null}
            </div>

            {/* name + tags */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <div className={cn("truncate font-semibold text-slate-900 dark:text-white", c.name)}>{seller?.name}</div>
                {isPro ? <Tag tone="pro">✨ Pro</Tag> : null}
                {isShop ? (
                  <Tag tone="shop">
                    <Store className="h-4 w-4" /> Prodavnica
                  </Tag>
                ) : null}
              </div>

              {(responseLabel || memberSince) ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {responseLabel ? <IconPill icon={Clock}>Odgovara za: {responseLabel}</IconPill> : null}
                  {memberSince ? <IconPill icon={Calendar}>Član od: {memberSince}</IconPill> : null}
                </div>
              ) : null}
            </div>
          </div>

          {showShare ? (
            <ShareDropdown
              url={computedShareUrl}
              title={title}
              headline={title}
              companyName={CompanyName}
              className={cn(
                "shrink-0 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 p-2",
                "text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition shadow-sm"
              )}
            >
              <Share2 className="h-5 w-5" />
            </ShareDropdown>
          ) : null}
        </div>

        {(showRatings || showBadges) ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {showRatings && ratingValue ? (
              <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/60 px-3 py-2 text-sm font-semibold shadow-sm">
                <Star className="h-5 w-5 text-amber-500" />
                <span className="text-slate-900 dark:text-white">{ratingValue}</span>
                <span className="text-slate-500 dark:text-slate-400">({ratingCount})</span>
              </span>
            ) : null}

            {showBadges
              ? badgeList.map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/60 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-sm"
                  >
                    <GamificationBadge badge={b} size="sm" showName={false} showDescription={false} />
                    <span className="hidden sm:inline">{b?.name}</span>
                  </span>
                ))
              : null}
          </div>
        ) : null}

        {/* actions */}
        <div className={cn("mt-5 flex items-center gap-3", mode === "header" && "flex-col items-stretch")}>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={primaryBtnCls}
            onClick={onChatClick}
          >
            <MessageCircle className="h-5 w-5" />
            Pošalji poruku
          </motion.button>

          <SavedToListButton sellerId={seller?.id} sellerName={seller?.name} variant="pill" />

          {mode === "compact" ? (
            contactStyle === "sheet" ? (
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={iconBtnCls}
                onClick={onPhoneClick}
                title="Kontakt"
              >
                <Phone className="h-5 w-5" />
              </motion.button>
            ) : (
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={iconBtnCls}
                  onClick={onPhoneClick}
                  title="Telefon"
                >
                  <Phone className="h-5 w-5" />
                </motion.button>

                {Boolean(settings.show_whatsapp) && (settings.whatsapp_number || seller?.mobile) ? (
                  <a
                    className={iconBtnCls}
                    href={`https://wa.me/${String(settings.whatsapp_number || seller?.mobile).replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => actionsDisabled && e.preventDefault()}
                    title="WhatsApp"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                ) : null}

                {Boolean(settings.show_viber) && (settings.viber_number || seller?.mobile) ? (
                  <a
                    className={iconBtnCls}
                    href={`viber://chat?number=${String(settings.viber_number || seller?.mobile).replace(/\D/g, "")}`}
                    onClick={(e) => actionsDisabled && e.preventDefault()}
                    title="Viber"
                  >
                    <PhoneCall className="h-5 w-5" />
                  </a>
                ) : null}
              </div>
            )
          ) : null}
        </div>

        {mode === "compact" && showProfileLink ? (
          <div className="mt-4">
            <CustomLink
              href={`/seller/${seller?.id}`}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
            >
              Detalji prodavača
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </CustomLink>
          </div>
        ) : null}
      </div>

      {showHours ? (
        <>
          <SoftDivider />
          <div className="px-5 sm:px-6 py-3 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Danas: {todayHoursText}
            </span>
            {openNow !== null ? (
              <span className="inline-flex items-center gap-2 font-semibold">
                <span className={cn("h-2 w-2 rounded-full", openNow ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")} />
                {openNow ? "Otvoreno" : "Zatvoreno"}
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </motion.div>
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

const SellerDetailCard = ({
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
        showProfileLink={false}
        onChatClick={onChatClick}
        onPhoneClick={() => setIsContactSheetOpen(true)}
        uiPrefs={{ contactStyle: "sheet" }}
      />

      <AccordionSection id="contact" title="Kontakt" icon={Phone} openId={openId} setOpenId={setOpenId}>
        <div className="flex flex-wrap gap-2">
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
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:opacity-95 dark:bg-white dark:text-slate-900 transition shadow-sm hover:shadow-md"
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
      />
    </div>
  );
};

export default SellerDetailCard;
