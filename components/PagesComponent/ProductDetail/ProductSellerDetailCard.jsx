"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "@/utils/toastBs";

import {
  Phone,
  MessageCircle,
  Share2,
  Zap,
  Calendar,
  Copy,
  Check,
  X,
  Star,
  MdVerified,
  ChevronRight,
  Clock,
  Shield,
  Truck,
  RotateCcw,
  ExternalLink,
  Info,
} from "@/components/Common/UnifiedIconPack";

import { cn } from "@/lib/utils";
import { resolveMembership } from "@/lib/membership";
import { hasItemVideo, hasSellerActiveReel } from "@/lib/seller-reel";
import { isSellerVerified } from "@/lib/seller-verification";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import MembershipBadge from "@/components/Common/MembershipBadge";
import CustomImage from "@/components/Common/CustomImage";
import CustomLink from "@/components/Common/CustomLink";
import ShareDropdown from "@/components/Common/ShareDropdown";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import GamificationBadge from "@/components/PagesComponent/Gamification/Badge";
import { formatResponseTimeBs } from "@/utils/index";
import { itemConversationApi, sendMessageApi, itemOfferApi } from "@/utils/api";
import ReelUploadModal from "@/components/PagesComponent/Seller/ReelUploadModal";
import ReelViewerModal from "@/components/PagesComponent/Seller/ReelViewerModal";
import ReelRingStyles from "@/components/PagesComponent/Seller/ReelRingStyles";

/* =====================================================
   HELPER FUNKCIJE
===================================================== */

const MONTHS_BS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];

const toBool = (v) => {
  if (v === true) return true;
  if (v === false || v == null) return false;

  if (typeof v === "number") return v > 0;

  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "yes", "y", "approved", "verified", "active"].includes(s)) return true;

    // hvata "1", "2", "3"...
    const n = Number(s);
    if (!Number.isNaN(n)) return n > 0;

    return false;
  }

  return Boolean(v);
};

const getVerifiedStatus = (...sources) => {
  return isSellerVerified(...sources);
};

const VerifiedAvatarBadge = ({ avatarSize = 48, verifiedSize = 10, className = "" }) => {
  const badgeSize = Math.max(14, Math.round(avatarSize * 0.33));

  return (
    <span
      className={cn(
        "absolute -bottom-0.5 -right-0.5 z-20 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-md",
        className
      )}
      style={{ width: badgeSize, height: badgeSize }}
    >
      <MdVerified className="text-white" size={verifiedSize} />
    </span>
  );
};



const formatMemberSince = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS_BS[d.getMonth()]} ${d.getFullYear()}`;
};

const resolveSellerAvatar = (seller = {}) =>
  (
    seller?.profile ||
    seller?.profile_image ||
    seller?.profileImage ||
    seller?.avatar ||
    seller?.avatar_url ||
    seller?.image ||
    seller?.photo ||
    seller?.svg_avatar ||
    ""
  )
    .toString()
    .trim();

const parseLastSeenDate = (seller = {}) => {
  const raw =
    seller?.last_seen ||
    seller?.lastSeen ||
    seller?.last_activity_at ||
    seller?.lastActiveAt ||
    seller?.updated_at;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getBsCountForm = (value, one, few, many) => {
  const n = Math.abs(Number(value) || 0);
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

const formatSeenAgoLabel = (lastSeenDate) => {
  if (!lastSeenDate) return "";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - lastSeenDate.getTime()) / 1000));
  if (diffSeconds < 60) return "upravo sada";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `prije ${diffMinutes} ${getBsCountForm(diffMinutes, "minutu", "minute", "minuta")}`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `prije ${diffHours} ${getBsCountForm(diffHours, "sat", "sata", "sati")}`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `prije ${diffDays} ${getBsCountForm(diffDays, "dan", "dana", "dana")}`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `prije ${diffMonths} ${getBsCountForm(diffMonths, "mjesec", "mjeseca", "mjeseci")}`;
  }
  const diffYears = Math.floor(diffMonths / 12);
  return `prije ${diffYears} ${getBsCountForm(diffYears, "godinu", "godine", "godina")}`;
};

const responseTimeLabels = {
  instant: "par minuta",
  few_hours: "par sati",
  same_day: "isti dan",
  few_days: "par dana",
};

const defaultCardPreferences = {
  show_ratings: true,
  show_badges: true,
  show_member_since: false,
  show_response_time: true,
  show_online_status: true,
  show_reel_hint: true,
  highlight_contact_button: false,
  show_business_hours: true,
  show_shipping_info: true,
  show_return_policy: true,
  max_badges: 2,
};

const normalizePrefBool = (value, fallback) => {
  if (value == null) return fallback;
  return toBool(value);
};

const normalizeCardPreferences = (raw) => {
  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = {};
    }
  }

  const merged = { ...defaultCardPreferences, ...(obj || {}) };
  return {
    ...merged,
    show_ratings: normalizePrefBool(obj?.show_ratings, defaultCardPreferences.show_ratings),
    show_badges: normalizePrefBool(obj?.show_badges, defaultCardPreferences.show_badges),
    show_member_since: normalizePrefBool(obj?.show_member_since, defaultCardPreferences.show_member_since),
    show_response_time: normalizePrefBool(obj?.show_response_time, defaultCardPreferences.show_response_time),
    show_online_status: normalizePrefBool(obj?.show_online_status, defaultCardPreferences.show_online_status),
    show_reel_hint: normalizePrefBool(obj?.show_reel_hint, defaultCardPreferences.show_reel_hint),
    highlight_contact_button: normalizePrefBool(
      obj?.highlight_contact_button,
      defaultCardPreferences.highlight_contact_button
    ),
    show_business_hours: normalizePrefBool(obj?.show_business_hours, defaultCardPreferences.show_business_hours),
    show_shipping_info: normalizePrefBool(obj?.show_shipping_info, defaultCardPreferences.show_shipping_info),
    show_return_policy: normalizePrefBool(obj?.show_return_policy, defaultCardPreferences.show_return_policy),
  };
};

const getResponseTimeLabel = ({ responseTime, responseTimeAvg, settings }) => {
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

const isCurrentlyOpen = (businessHours) => {
  if (!businessHours) return null;
  const now = new Date();
  const todayKey = getDayKeyByIndex(now.getDay());
  const todayHours = businessHours[todayKey];
  if (!todayHours || todayHours.closed || !todayHours.enabled) return false;
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = (todayHours.open || "09:00").split(":").map(Number);
  const [closeHour, closeMin] = (todayHours.close || "17:00").split(":").map(Number);
  return currentTime >= (openHour * 60 + openMin) && currentTime <= (closeHour * 60 + closeMin);
};

/* =====================================================
   CONTACT MODAL
===================================================== */

const ContactModal = ({ open, onOpenChange, seller, settings, onMessageClick, onPhoneCall }) => {
  const [copiedKey, setCopiedKey] = useState("");

  const copy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 2000);
      toast.success("Kopirano");
    } catch {
      toast.error("Kopiranje nije uspjelo");
    }
  };

  const showPhone = Boolean(settings?.show_phone && seller?.mobile);
  const showWhatsapp = Boolean(settings?.show_whatsapp && (settings?.whatsapp_number || seller?.mobile));
  const showViber = Boolean(settings?.show_viber && (settings?.viber_number || seller?.mobile));
  const showEmail = Boolean(settings?.show_email && seller?.email);

  const phone = seller?.mobile;
  const whatsappNumber = settings?.whatsapp_number || seller?.mobile;
  const viberNumber = settings?.viber_number || seller?.mobile;
  const email = seller?.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Kontakt</h3>
          <button type="button" onClick={() => onOpenChange(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-1.5">
          <button
            type="button"
            onClick={() => { onMessageClick?.(); onOpenChange(false); }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Pošalji poruku
          </button>

          {showPhone && (
            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${phone}`}
                onClick={() => onPhoneCall?.()}
                className="flex-1 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-sm"
              >
                <Phone className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-700">{phone}</span>
              </a>
              <button type="button" onClick={() => copy("phone", phone)} className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50">
                {copiedKey === "phone" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          )}

          {showWhatsapp && (
            <a href={`https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-sm">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-slate-700">WhatsApp</span>
            </a>
          )}

          {showViber && (
            <a href={`viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-sm">
              <div className="w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                <Phone className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-slate-700">Viber</span>
            </a>
          )}

          {showEmail && (
            <div className="flex items-center gap-1.5">
              <a href={`mailto:${email}`} className="flex-1 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-sm truncate">
                <span className="text-slate-700 truncate">{email}</span>
              </a>
              <button type="button" onClick={() => copy("email", email)} className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50">
                {copiedKey === "email" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================================================
   SEND MESSAGE MODAL
===================================================== */

const SendMessageModal = ({ open, onOpenChange, seller, itemId }) => {
  const router = useRouter();
  const currentUser = useSelector(userSignUpData);
  const isLoggedIn = useSelector(getIsLoggedIn);

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (open) { setMessage(""); setError(""); }
  }, [open]);

  const handleSend = async () => {
    const sellerUserId = seller?.user_id ?? seller?.id;

    if (!message.trim()) { setError("Unesite poruku."); return; }
    if (!isLoggedIn || !currentUser?.id) { toast.error("Morate biti prijavljeni."); router.push("/login"); return; }
    if (!sellerUserId) { setError("Prodavač nije pronađen."); return; }
    if (String(currentUser.id) === String(sellerUserId)) { setError("Ne možete slati poruku sebi."); return; }

    setIsSending(true);
    setError("");

    try {
      let conversationId = null;
      const extractId = (data) => data?.conversation_id || data?.item_offer_id || data?.id || null;

      if (itemId) {
        const checkRes = await itemConversationApi.checkConversation({ item_id: itemId });
        if (checkRes?.data?.error === false && extractId(checkRes?.data?.data)) {
          conversationId = extractId(checkRes.data.data);
        } else {
          const startRes = await itemConversationApi.startItemConversation({ item_id: itemId });
          if (startRes?.data?.error === false) conversationId = extractId(startRes.data.data);
        }
      } else {
        const checkRes = await itemConversationApi.checkDirectConversation({ user_id: sellerUserId });
        if (checkRes?.data?.error === false && extractId(checkRes?.data?.data)) {
          conversationId = extractId(checkRes.data.data);
        } else {
          const startRes = await itemConversationApi.startDirectConversation({ user_id: sellerUserId });
          if (startRes?.data?.error === false) conversationId = extractId(startRes.data.data);
        }
      }

      if (!conversationId) throw new Error("Nije moguće kreirati razgovor.");

      const sendRes = await sendMessageApi.sendMessage({ item_offer_id: conversationId, message: message.trim() });
      if (sendRes?.data?.error === false) {
        toast.success("Poruka poslana!");
        setMessage("");
        onOpenChange(false);
      } else {
        throw new Error(sendRes?.data?.message || "Greška pri slanju.");
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Greška.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100">
              <CustomImage src={resolveSellerAvatar(seller)} alt={seller?.name} width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-semibold text-slate-900">{seller?.name}</span>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => { setMessage(e.target.value); setError(""); }}
            placeholder="Napišite poruku..."
            rows={3}
            className={cn(
              "w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm resize-none",
              "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              error ? "border-red-300" : "border-slate-200"
            )}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">
              Odustani
            </button>
            <button type="button" onClick={handleSend} disabled={!message.trim() || isSending} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl disabled:opacity-50">
              {isSending ? "..." : "Pošalji"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================================================
   SEND OFFER MODAL
===================================================== */

const SendOfferModal = ({ open, onOpenChange, seller, itemId, itemPrice }) => {
  const router = useRouter();
  const currentUser = useSelector(userSignUpData);
  const isLoggedIn = useSelector(getIsLoggedIn);

  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (open) { setAmount(""); setError(""); }
  }, [open]);

  const handleSend = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) { setError("Unesite validan iznos."); return; }
    if (!isLoggedIn || !currentUser?.id) { toast.error("Morate biti prijavljeni."); router.push("/login"); return; }
    if (!itemId) { setError("Proizvod nije pronađen."); return; }

    setIsSending(true);
    setError("");

    try {
      const res = await itemOfferApi.offer({ item_id: itemId, amount: numAmount });
      if (res?.data?.error === false) {
        toast.success("Ponuda poslana!");
        setAmount("");
        onOpenChange(false);
      } else {
        throw new Error(res?.data?.message || "Greška.");
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Greška.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Pošalji ponudu</h3>
          <button type="button" onClick={() => onOpenChange(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {itemPrice && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Cijena</span>
              <span className="font-semibold text-slate-900">{typeof itemPrice === 'number' ? `${itemPrice.toFixed(2)} KM` : itemPrice}</span>
            </div>
          )}
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={cn(
                "w-full rounded-xl border bg-slate-50 px-3 py-2.5 pr-12 text-lg font-semibold",
                "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                error ? "border-red-300" : "border-slate-200"
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">KM</span>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="button" onClick={handleSend} disabled={!amount || isSending} className="w-full px-3 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50">
            {isSending ? "..." : "Pošalji ponudu"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================================================
   SKELETON
===================================================== */

export const ProductSellerCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 space-y-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] dark:border-slate-700/80 dark:bg-slate-900/85">
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="h-11 rounded-xl" />
    <Skeleton className="h-11 rounded-xl" />
  </div>
);

/* =====================================================
   PRODUCT SELLER DETAIL CARD
===================================================== */

const ProductSellerDetailCard = ({
  productDetails,
  seller: sellerProp,
  ratings: ratingsProp,
  badges,
  sellerSettings,
  isPro: isProProp = false,
  isShop: isShopProp = false,
  onChatClick,
  onPhoneReveal,
  onPhoneClick,
  itemId: itemIdProp,
  itemPrice: itemPriceProp,
  acceptsOffers: acceptsOffersProp = false,
  enableOwnerReelControls = true,
}) => {
  const pathname = usePathname();
  const CompanyName = useSelector(getCompanyName);

  // Extract from productDetails or use props
  const seller = sellerProp || productDetails?.user;
  const ratings = ratingsProp || productDetails?.ratings;
  const itemId = itemIdProp || productDetails?.id;
  const itemPrice = itemPriceProp || productDetails?.price;

  const settings = useMemo(() => {
    const a = productDetails?.user_settings && typeof productDetails.user_settings === "object"
      ? productDetails.user_settings
      : {};
    const b = sellerSettings && typeof sellerSettings === "object"
      ? sellerSettings
      : {};
    return { ...a, ...b }; // sellerSettings override, ali ne briše a
  }, [productDetails?.user_settings, sellerSettings]);

  const membership = useMemo(
    () =>
      resolveMembership(
        { is_pro: isProProp, is_shop: isShopProp },
        seller,
        productDetails?.user,
        sellerProp?.membership,
        productDetails?.membership,
        productDetails?.user?.membership,
        productDetails?.user_settings,
        sellerSettings,
        settings
      ),
    [
      isProProp,
      isShopProp,
      seller,
      productDetails?.user,
      sellerProp?.membership,
      productDetails?.membership,
      productDetails?.user?.membership,
      productDetails?.user_settings,
      sellerSettings,
      settings,
    ]
  );

  const forceShopTier = useMemo(
    () =>
      [
        isShopProp,
        seller?.is_shop,
        seller?.isShop,
        productDetails?.user?.is_shop,
        productDetails?.user?.isShop,
        sellerSettings?.is_shop,
        sellerSettings?.isShop,
        settings?.is_shop,
        settings?.isShop,
      ].some((value) => toBool(value)),
    [isShopProp, seller, productDetails?.user, sellerSettings, settings]
  );

  const forceProTier = useMemo(
    () =>
      [
        isProProp,
        seller?.is_pro,
        seller?.isPro,
        seller?.is_premium,
        seller?.premium,
        productDetails?.user?.is_pro,
        productDetails?.user?.isPro,
        productDetails?.user?.is_premium,
        productDetails?.user?.premium,
        sellerSettings?.is_pro,
        sellerSettings?.isPro,
        sellerSettings?.is_premium,
        sellerSettings?.premium,
        settings?.is_pro,
        settings?.isPro,
        settings?.is_premium,
        settings?.premium,
      ].some((value) => toBool(value)),
    [isProProp, seller, productDetails?.user, sellerSettings, settings]
  );

  const membershipTier = forceShopTier ? "shop" : forceProTier ? "pro" : membership?.tier;
  const hasMembershipBadge = membershipTier === "shop" || membershipTier === "pro";
  

    const acceptsOffers = acceptsOffersProp || productDetails?.accepts_offers || sellerSettings?.accepts_offers;


  const isVerified = useMemo(() => {
      return getVerifiedStatus(seller, settings, sellerSettings, productDetails?.user);
    }, [seller, settings, sellerSettings, productDetails?.user]);

  const [hasReel, setHasReel] = useState(
    Boolean(hasItemVideo(productDetails) || hasSellerActiveReel(seller))
  );

  useEffect(() => {
    setHasReel(Boolean(hasItemVideo(productDetails) || hasSellerActiveReel(seller)));
  }, [productDetails, seller]);
  const ringMotion = undefined;
  const ringTransition = undefined;
    
    
  
  // Card preferences from seller settings - parse if string
  const mergedPrefs = normalizeCardPreferences(settings?.card_preferences);
  const showRatings = mergedPrefs.show_ratings;
  const showBadges = mergedPrefs.show_badges;
  const showResponseTime = mergedPrefs.show_response_time;
  const showMemberSince = mergedPrefs.show_member_since;
  const showReelHint = mergedPrefs.show_reel_hint;
  const highlightContactButton = mergedPrefs.highlight_contact_button;
  const showBusinessHours = mergedPrefs.show_business_hours;
  const showShippingInfo = mergedPrefs.show_shipping_info;
  const showReturnPolicy = mergedPrefs.show_return_policy;
  const maxBadges = mergedPrefs.max_badges ?? 2;
  const showExtendedSections = false;

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [isReelViewerOpen, setIsReelViewerOpen] = useState(false);
  const currentUser = useSelector(userSignUpData);

  if (!seller) return <ProductSellerCardSkeleton />;

  // Use user_id if available, fallback to id, then to productDetails.user_id
  const sellerId = seller?.user_id ?? seller?.id ?? productDetails?.user_id;
  const isOwner = Boolean(
    currentUser?.id && String(currentUser.id) === String(sellerId)
  );
  const hasVideo = Boolean(hasItemVideo(productDetails));
  const canManageReels = Boolean(enableOwnerReelControls && isOwner);

  const shareUrl = sellerId
    ? `${process.env.NEXT_PUBLIC_WEB_URL}/seller/${sellerId}`
    : `${process.env.NEXT_PUBLIC_WEB_URL}${pathname}`;

  const title = `${seller?.name || "Prodavač"} | ${CompanyName}`;

  const responseLabel = showResponseTime
    ? getResponseTimeLabel({
        responseTime: settings?.response_time || "auto",
        responseTimeAvg: seller?.response_time_avg,
        settings,
      })
    : null;

  const memberSince = showMemberSince ? formatMemberSince(seller?.created_at) : "";
  const sellerAvatar = resolveSellerAvatar(seller);
  const lastSeenDate = parseLastSeenDate(seller);
  const seenAgoLabel = formatSeenAgoLabel(lastSeenDate);
  const seenInfoLabel = lastSeenDate && seenAgoLabel ? `Viđen ${seenAgoLabel}` : null;

  // Rating
  const ratingValue = useMemo(
    () => (seller?.average_rating != null ? Number(seller.average_rating).toFixed(1) : null),
    [seller?.average_rating]
  );
  const ratingCount = useMemo(() => ratings?.total || ratings?.count || seller?.ratings_count || 0, [ratings, seller]);

  // Badges
  const badgeList = useMemo(() => (badges || []).slice(0, maxBadges), [badges, maxBadges]);

  // Business hours
  const businessHours = parseBusinessHours(settings.business_hours);
  const hasBusinessHours = Boolean(businessHours && Object.values(businessHours).some(d => d?.enabled) && showBusinessHours);
  const todayHoursText = hasBusinessHours ? getTodayHours(businessHours) : null;
  const openNow = hasBusinessHours ? isCurrentlyOpen(businessHours) : null;

  // Info sections
  const shippingInfo = showShippingInfo ? settings.shipping_info : null;
  const returnPolicy = showReturnPolicy ? settings.return_policy : null;

  // Can make offer
  const canMakeOffer = acceptsOffers || settings?.accepts_offers;

  // Has contact options
  const hasContactOptions = settings?.show_phone || settings?.show_whatsapp || settings?.show_viber || settings?.show_email;

  const handleChatClick = () => {
    if (onChatClick) {
      onChatClick();
    } else {
      setIsMessageOpen(true);
    }
  };

  const handleContactClick = () => {
    onPhoneReveal?.();
    setIsContactOpen(true);
  };

  return (
    <>
      <ReelRingStyles />

      <ContactModal
        open={isContactOpen}
        onOpenChange={setIsContactOpen}
        seller={seller}
        settings={settings}
        onMessageClick={handleChatClick}
        onPhoneCall={onPhoneClick}
      />

      <SendMessageModal
        open={isMessageOpen}
        onOpenChange={setIsMessageOpen}
        seller={seller}
        itemId={itemId}
      />

      <SendOfferModal
        open={isOfferOpen}
        onOpenChange={setIsOfferOpen}
        seller={seller}
        itemId={itemId}
        itemPrice={itemPrice}
      />

      <ReelUploadModal
        open={isReelModalOpen}
        onOpenChange={setIsReelModalOpen}
        onUploaded={(payload) => setHasReel(Boolean(payload?.hasAnyVideo))}
      />

      <ReelViewerModal
        open={isReelViewerOpen}
        onOpenChange={setIsReelViewerOpen}
        userId={sellerId}
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Main Card */}
        <div className="p-4 space-y-3">
          {/* Header: Avatar + Info — identical layout to MinimalSellerCard */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            {sellerId ? (
              <div className="relative isolate flex-shrink-0 group cursor-pointer">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsReelViewerOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setIsReelViewerOpen(true);
                    }
                  }}
                  className="focus:outline-none"
                  aria-label="Otvori reelove"
                >
                  <motion.div
                    className={cn(
                      "rounded-[14px] p-[2px]",
                      hasReel ? "reel-ring" : "bg-transparent"
                    )}
                    animate={ringMotion}
                    transition={ringTransition}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 reel-ring-inner",
                        hasReel
                          ? "border border-white/70 dark:border-slate-700/80"
                          : "border border-slate-200/60 dark:border-slate-700/60 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"
                      )}
                    >
                      <CustomImage
                        src={sellerAvatar}
                        alt={seller?.name || "Prodavač"}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                  {isVerified && (
                    <VerifiedAvatarBadge avatarSize={48} verifiedSize={10} />
                  )}
                </div>
                {canManageReels && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsReelModalOpen(true);
                    }}
                    className="absolute -top-1 -right-1 z-30 w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center border border-slate-200 dark:border-slate-700"
                    aria-label="Dodaj video"
                  >
                    <span className="text-lg leading-none text-[#1e3a8a]">+</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="relative isolate flex-shrink-0">
                <motion.div
                  className={cn(
                    "rounded-[14px] p-[2px]",
                    hasReel ? "reel-ring" : "bg-transparent"
                  )}
                  animate={ringMotion}
                  transition={ringTransition}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 reel-ring-inner",
                      hasReel
                        ? "border border-white/70 dark:border-slate-700/80"
                        : "border border-slate-200/60 dark:border-slate-700/60"
                    )}
                  >
                    <CustomImage
                      src={sellerAvatar}
                      alt={seller?.name || "Prodavač"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
                {isVerified && (
                  <VerifiedAvatarBadge avatarSize={48} verifiedSize={10} />
                )}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name row with share */}
              <div className="flex items-center justify-between gap-2">
                {sellerId ? (
                  <CustomLink 
                    href={`/seller/${sellerId}`}
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-primary truncate transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="truncate">{seller?.name}</span>
                    {hasMembershipBadge && <MembershipBadge tier={membershipTier} size="xs" />}
                  </CustomLink>
                ) : (
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                    <span className="truncate">{seller?.name}</span>
                    {hasMembershipBadge && <MembershipBadge tier={membershipTier} size="xs" />}
                  </span>
                )}
                
                <ShareDropdown url={shareUrl} title={title} headline={title} companyName={CompanyName}>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </ShareDropdown>
              </div>

              {/* Meta rows */}
              <div className="mt-0.5 space-y-0.5">
                {(showRatings && ratingValue) || memberSince ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {showRatings && ratingValue && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{ratingValue}</span>
                      </span>
                    )}

                    {showRatings && ratingValue && memberSince && (
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                    )}

                    {memberSince && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        Član od {memberSince}
                      </span>
                    )}
                  </div>
                ) : null}

                {responseLabel && (
                  <div className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
                    {/* <Zap className="w-3 h-3 text-amber-500" /> */}
                    <span>Prosječno vrijeme odgovora: {responseLabel}</span>
                  </div>
                )}
              </div>

              {seenInfoLabel && (
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {seenInfoLabel}
                </p>
              )}

              {/* {canManageReels && !hasVideo && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#11b7b0]/40 bg-[#11b7b0]/10 px-3 py-1 text-xs font-semibold text-[#0f766e]">
                  Dodaj video preko + ikone na avataru
                </div>
              )} */}

              {/* Gamification badges */}
              {/* {showBadges && badgeList.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  {badgeList.map((b) => (
                    <GamificationBadge 
                      key={b.id} 
                      badge={b} 
                      size="xs" 
                      showName={false} 
                      showDescription={false}
                      className="w-5 h-5" 
                    />
                  ))}
                  {badges.length > maxBadges && (
                    <span className="text-[10px] text-slate-400 ml-0.5">+{badges.length - maxBadges}</span>
                  )}
                </div>
              )} */}
            </div>
          </div>

          {/* Business hours */}
          {showExtendedSections && hasBusinessHours && todayHoursText && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span>Danas: <strong className="text-slate-900 dark:text-slate-100">{todayHoursText}</strong></span>
              </div>
              {openNow !== null && (
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
                  openNow
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", openNow ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500")} />
                  {openNow ? "Otvoreno" : "Zatvoreno"}
                </span>
              )}
            </div>
          )}

          {/* Actions — inline like MinimalSellerCard */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleChatClick}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Pošalji poruku
            </button>

            {canMakeOffer && itemId && (
              <button
                type="button"
                onClick={() => setIsOfferOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Ponuda
              </button>
            )}

            {hasContactOptions && (
              <button
                type="button"
                onClick={handleContactClick}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl border transition-colors",
                  highlightContactButton
                    ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                )}
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Profile link */}
          {/* {sellerId && (
            <CustomLink
              href={`/seller/${sellerId}`}
              className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors group cursor-pointer"
            >
              Pogledaj kompletan profil
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </CustomLink>
          )} */}
        </div>

        {/* Info sections */}
        {showExtendedSections && (shippingInfo || returnPolicy) && (
          <div className="border-t border-slate-100 dark:border-slate-800">
            {shippingInfo && (
              <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-0.5">Dostava</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{shippingInfo}</p>
                  </div>
                </div>
              </div>
            )}

            {returnPolicy && (
              <div className="px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <RotateCcw className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-0.5">Povrat</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{returnPolicy}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductSellerDetailCard;
