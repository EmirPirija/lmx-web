"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "sonner";

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
  BadgeCheck,
  Play,
  ChevronRight,
  Clock,
  Shield,
  Truck,
  RotateCcw,
  ExternalLink,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import CustomImage from "@/components/Common/CustomImage";
import CustomLink from "@/components/Common/CustomLink";
import ShareDropdown from "@/components/Common/ShareDropdown";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import GamificationBadge from "@/components/PagesComponent/Gamification/Badge";
import { formatResponseTimeBs } from "@/utils/index";
import { itemConversationApi, sendMessageApi, itemOfferApi } from "@/utils/api";
import ReelUploadModal from "@/components/PagesComponent/Seller/ReelUploadModal";
import ReelViewerModal from "@/components/PagesComponent/Seller/ReelViewerModal";

/* =====================================================
   HELPER FUNKCIJE
===================================================== */

const MONTHS_BS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];

const reelRingCss = `
@keyframes reel-glow {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}
.reel-ring {
  position: relative;
  padding: 3px;
  border-radius: 16px;
  background: conic-gradient(from 0deg, #11b7b0, #f97316, #1e3a8a, #11b7b0);
}
.reel-ring::after {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: conic-gradient(from 180deg, #11b7b0, #f97316, #1e3a8a, #11b7b0);
  filter: blur(8px);
  opacity: 0.45;
  animation: reel-glow 3.2s ease-in-out infinite;
  z-index: 0;
}
.reel-ring-inner {
  position: relative;
  z-index: 1;
}
`;

const ReelRingStyles = () => <style jsx global>{reelRingCss}</style>;


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

const hasVerifiedBadge = (seller) => {
  const list = Array.isArray(seller?.badges) ? seller.badges : [];
  return list.some((b) => {
    const id = String(b?.id || "").toLowerCase();
    // SAMO ako imate badge koji znači "profil verified"
    return id === "seller_verified" || id === "kyc_verified" || id === "account_verified";
  });
};




const normalize = (v) => String(v ?? "").trim().toLowerCase();
const looksLikeVerifiedKey = (k) => {
  const key = String(k || "").toLowerCase();
  return (
    key.includes("verif") ||
    key.includes("verified") ||
    key.includes("kyc") ||
    key.includes("approve") ||
    key.includes("approval")
  );
};

const scanForVerified = (obj) => {
  if (!obj || typeof obj !== "object") return false;

  // 1 nivo
  for (const [k, v] of Object.entries(obj)) {
    if (looksLikeVerifiedKey(k) && toBool(v)) return true;

    // 2 nivo (ako je nested)
    if (v && typeof v === "object") {
      for (const [k2, v2] of Object.entries(v)) {
        if (looksLikeVerifiedKey(k2) && toBool(v2)) return true;
        if (looksLikeVerifiedKey(`${k}.${k2}`) && toBool(v2)) return true;
      }
    }
  }
  return false;
};

const getVerifiedStatus = (seller, settings) => {
  const status = normalize(
    settings?.verification_status ??
      settings?.verificationStatus ??
      settings?.verified_status ??
      settings?.verifiedStatus ??
      settings?.kyc_status ??
      seller?.verification_status ??
      seller?.verificationStatus ??
      seller?.verified_status ??
      seller?.verifiedStatus ??
      seller?.kyc_status ??
      seller?.status ??
      settings?.status
  );

  // NEGATIVNI statusi - prvo!
if (
  status.includes("not") ||
  status.includes("unver") ||
  status.includes("reject") ||
  status.includes("declin") ||
  status.includes("pend") ||
  status.includes("wait")
) {
  return false;
}

// POZITIVNI statusi - strogo
if (
  status === "approved" ||
  status === "verified" ||
  status === "active" ||
  status === "kyc_approved" ||
  status === "approved_kyc"
) {
  return true;
}


  // prvo tvoji standardni flagovi
  const direct =
    toBool(seller?.is_verified) ||
    toBool(seller?.verified) ||
    toBool(seller?.isVerified) ||
    toBool(seller?.is_verified_status) ||
    toBool(seller?.is_kyc_verified) ||
    toBool(seller?.kyc_verified) ||
    toBool(settings?.is_verified) ||
    toBool(settings?.verified) ||
    toBool(settings?.isVerified);

  if (direct) return true;

  // catch-all: skeniraj sve moguće key-eve
  return false;

};



const formatMemberSince = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS_BS[d.getMonth()]} ${d.getFullYear()}`;
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

const ContactModal = ({ open, onOpenChange, seller, settings, onMessageClick }) => {
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
              <a href={`tel:${phone}`} className="flex-1 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-sm">
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
              <CustomImage src={seller?.profile || seller?.profile_image} alt={seller?.name} width={32} height={32} className="w-full h-full object-cover" />
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
  <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-3 bg-slate-100 rounded w-24" />
      </div>
    </div>
    <div className="h-11 bg-slate-200 rounded-xl" />
    <div className="h-11 bg-slate-100 rounded-xl" />
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
  itemId: itemIdProp,
  itemPrice: itemPriceProp,
  acceptsOffers: acceptsOffersProp = false,
}) => {
  const pathname = usePathname();
  const CompanyName = useSelector(getCompanyName);

  // Extract from productDetails or use props
  const seller = sellerProp || productDetails?.user;
  const ratings = ratingsProp || productDetails?.ratings;
  const isShop = Boolean(isShopProp || productDetails?.user?.is_shop);
  const isPro = Boolean(!isShop && (isProProp || productDetails?.user?.is_pro));
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
  

    const acceptsOffers = acceptsOffersProp || productDetails?.accepts_offers || sellerSettings?.accepts_offers;


  const isVerified = useMemo(() => {
      // plava kvačica = samo pravi verified account/kyc
      return toBool(seller?.is_verified) || getVerifiedStatus(seller, settings);
      // ako imate baš badge koji znači account verified, onda dodaj:
      // || hasVerifiedBadge(seller)
    }, [seller, settings]);

  const showReelRing = Boolean(
    productDetails?.video ||
      productDetails?.video_link ||
      seller?.has_reel ||
      seller?.reel_video
  );
    
    
  
  // Card preferences from seller settings - parse if string
  const mergedPrefs = normalizeCardPreferences(settings?.card_preferences);
  const showRatings = mergedPrefs.show_ratings;
  const showBadges = mergedPrefs.show_badges;
  const showResponseTime = mergedPrefs.show_response_time;
  const showMemberSince = mergedPrefs.show_member_since;
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
  const hasVideo = Boolean(productDetails?.video || productDetails?.video_link);

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
    if (onPhoneReveal) {
      onPhoneReveal();
    } else {
      setIsContactOpen(true);
    }
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
      />

      <ReelViewerModal
        open={isReelViewerOpen}
        onOpenChange={setIsReelViewerOpen}
        userId={sellerId}
      />

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {/* Main Card */}
        <div className="p-4 space-y-3">
          {/* Header: Avatar + Info — identical layout to MinimalSellerCard */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            {sellerId ? (
              <div className="relative flex-shrink-0 group cursor-pointer">
                <button
                  type="button"
                  onClick={() => setIsReelViewerOpen(true)}
                  className="focus:outline-none"
                  aria-label="Otvori reelove"
                >
                  <div
                    className={cn(
                      "rounded-[14px] p-[2px]",
                      showReelRing ? "reel-ring" : "bg-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl overflow-hidden bg-slate-100 reel-ring-inner",
                        showReelRing
                          ? "border border-white/70"
                          : "border border-slate-200/60 group-hover:border-slate-300 transition-colors"
                      )}
                    >
                      <CustomImage
                        src={seller?.profile || seller?.profile_image}
                        alt={seller?.name || "Prodavač"}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  {showReelRing && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center">
                      <Play className="w-3 h-3 text-[#1e3a8a]" />
                    </div>
                  )}
                </button>
                {isOwner && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsReelModalOpen(true);
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center border border-slate-200"
                    aria-label="Dodaj video"
                  >
                    <span className="text-lg leading-none text-[#1e3a8a]">+</span>
                  </button>
                )}
                {isVerified && (
                  <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-sky-500 rounded-md flex items-center justify-center border-2 border-white">
                    <BadgeCheck className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative flex-shrink-0">
                <div
                  className={cn(
                    "rounded-[14px] p-[2px]",
                    showReelRing ? "reel-ring" : "bg-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl overflow-hidden bg-slate-100 reel-ring-inner",
                      showReelRing
                        ? "border border-white/70"
                        : "border border-slate-200/60"
                    )}
                  >
                    <CustomImage
                      src={seller?.profile || seller?.profile_image}
                      alt={seller?.name || "Prodavač"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {showReelRing && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center">
                    <Play className="w-3 h-3 text-[#1e3a8a]" />
                  </div>
                )}
                {isVerified && (
                  <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-sky-500 rounded-md flex items-center justify-center border-2 border-white">
                    <BadgeCheck className="w-2.5 h-2.5 text-white" />
                  </div>
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
                    className="text-sm font-semibold text-slate-900 hover:text-primary truncate transition-colors cursor-pointer"
                  >
                    {seller?.name}
                  </CustomLink>
                ) : (
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {seller?.name}
                  </span>
                )}
                
                <ShareDropdown url={shareUrl} title={title} headline={title} companyName={CompanyName}>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </ShareDropdown>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {showRatings && ratingValue && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{ratingValue}</span>
                    <span className="text-slate-400">({ratingCount})</span>
                  </span>
                )}

                {responseLabel && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {responseLabel}
                  </span>
                )}

                {memberSince && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {memberSince}
                  </span>
                )}

                {isPro && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">PRO</span>
                )}
                {isShop && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded">SHOP</span>
                )}
              </div>

              {isOwner && !hasVideo && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#11b7b0]/40 bg-[#11b7b0]/10 px-3 py-1 text-xs font-semibold text-[#0f766e]">
                  Dodaj video preko + ikone na avataru
                </div>
              )}

              {/* Gamification badges */}
              {showBadges && badgeList.length > 0 && (
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
              )}
            </div>
          </div>

          {/* Business hours */}
          {showExtendedSections && hasBusinessHours && todayHoursText && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Danas: <strong className="text-slate-900">{todayHoursText}</strong></span>
              </div>
              {openNow !== null && (
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
                  openNow ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", openNow ? "bg-emerald-500" : "bg-slate-400")} />
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
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
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Profile link */}
          {sellerId && (
            <CustomLink
              href={`/seller/${sellerId}`}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors group cursor-pointer"
            >
              Pogledaj kompletan profil
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </CustomLink>
          )}
        </div>

        {/* Info sections */}
        {showExtendedSections && (shippingInfo || returnPolicy) && (
          <div className="border-t border-slate-100">
            {shippingInfo && (
              <div className="px-4 py-3 border-b border-slate-50">
                <div className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-700 mb-0.5">Dostava</div>
                    <p className="text-xs text-slate-500 line-clamp-2">{shippingInfo}</p>
                  </div>
                </div>
              </div>
            )}

            {returnPolicy && (
              <div className="px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <RotateCcw className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-700 mb-0.5">Povrat</div>
                    <p className="text-xs text-slate-500 line-clamp-2">{returnPolicy}</p>
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
