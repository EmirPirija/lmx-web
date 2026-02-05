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
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import CustomImage from "@/components/Common/CustomImage";
import CustomLink from "@/components/Common/CustomLink";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import GamificationBadge from "@/components/PagesComponent/Gamification/Badge";
import { formatResponseTimeBs } from "@/utils/index";
import SavedToListButton from "@/components/Profile/SavedToListButton";
import { itemConversationApi, sendMessageApi, itemOfferApi } from "@/utils/api";

/* =====================================================
   HELPER FUNKCIJE
===================================================== */

const MONTHS_BS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];

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

const getResponseTimeLabel = ({ responseTime, responseTimeAvg, settings }) => {
  const direct = settings?.response_time_label || settings?.response_time_text || null;
  if (direct) return direct;
  if (!responseTime) return null;
  if (responseTime === "auto") return formatResponseTimeBs(responseTimeAvg);
  return responseTimeLabels[responseTime] || null;
};

/* =====================================================
   SHARE POPOVER (kompaktniji)
===================================================== */

const SharePopover = ({ url, title }) => {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link kopiran");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopiranje nije uspjelo");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1.5">
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md hover:bg-slate-50 text-slate-600"
          >
            Facebook
          </button>
          <button
            type="button"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`, "_blank")}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md hover:bg-slate-50 text-slate-600"
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md hover:bg-slate-50 text-slate-600"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? "Kopirano!" : "Kopiraj link"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* =====================================================
   CONTACT MODAL (kompaktniji)
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
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-1.5">
          {/* Message - always first */}
          <button
            type="button"
            onClick={() => {
              onMessageClick?.();
              onOpenChange(false);
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Pošalji poruku
          </button>

          {showPhone && (
            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${phone}`}
                className="flex-1 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-sm"
              >
                <Phone className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-700">{phone}</span>
              </a>
              <button
                type="button"
                onClick={() => copy("phone", phone)}
                className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50"
              >
                {copiedKey === "phone" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          )}

          {showWhatsapp && (
            <a
              href={`https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-sm"
            >
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-slate-700">WhatsApp</span>
            </a>
          )}

          {showViber && (
            <a
              href={`viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-sm"
            >
              <div className="w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                <Phone className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-slate-700">Viber</span>
            </a>
          )}

          {showEmail && (
            <div className="flex items-center gap-1.5">
              <a
                href={`mailto:${email}`}
                className="flex-1 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-sm truncate"
              >
                <span className="text-slate-700 truncate">{email}</span>
              </a>
              <button
                type="button"
                onClick={() => copy("email", email)}
                className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50"
              >
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
    if (open) {
      setMessage("");
      setError("");
    }
  }, [open]);

  const handleSend = async () => {
    const sellerUserId = seller?.user_id ?? seller?.id;

    if (!message.trim()) {
      setError("Unesite poruku.");
      return;
    }

    if (!isLoggedIn || !currentUser?.id) {
      toast.error("Morate biti prijavljeni.");
      router.push("/login");
      return;
    }

    if (!sellerUserId) {
      setError("Prodavač nije pronađen.");
      return;
    }

    if (String(currentUser.id) === String(sellerUserId)) {
      setError("Ne možete slati poruku sebi.");
      return;
    }

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
          if (startRes?.data?.error === false) {
            conversationId = extractId(startRes.data.data);
          }
        }
      } else {
        const checkRes = await itemConversationApi.checkDirectConversation({ user_id: sellerUserId });
        if (checkRes?.data?.error === false && extractId(checkRes?.data?.data)) {
          conversationId = extractId(checkRes.data.data);
        } else {
          const startRes = await itemConversationApi.startDirectConversation({ user_id: sellerUserId });
          if (startRes?.data?.error === false) {
            conversationId = extractId(startRes.data.data);
          }
        }
      }

      if (!conversationId) throw new Error("Nije moguće kreirati razgovor.");

      const sendRes = await sendMessageApi.sendMessage({
        item_offer_id: conversationId,
        message: message.trim(),
      });

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
              <CustomImage
                src={seller?.profile || seller?.profile_image}
                alt={seller?.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-semibold text-slate-900">{seller?.name}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError("");
            }}
            placeholder="Napišite poruku..."
            rows={3}
            className={cn(
              "w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm resize-none",
              "placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              error ? "border-red-300" : "border-slate-200"
            )}
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Odustani
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
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
    if (open) {
      setAmount("");
      setError("");
    }
  }, [open]);

  const handleSend = async () => {
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Unesite validan iznos.");
      return;
    }

    if (!isLoggedIn || !currentUser?.id) {
      toast.error("Morate biti prijavljeni.");
      router.push("/login");
      return;
    }

    if (!itemId) {
      setError("Proizvod nije pronađen.");
      return;
    }

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
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {itemPrice && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Cijena</span>
              <span className="font-semibold text-slate-900">
                {typeof itemPrice === 'number' ? `${itemPrice.toFixed(2)} KM` : itemPrice}
              </span>
            </div>
          )}

          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={cn(
                "w-full rounded-xl border bg-slate-50 px-3 py-2.5 pr-12 text-lg font-semibold",
                "placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                error ? "border-red-300" : "border-slate-200"
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">KM</span>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSend}
            disabled={!amount || isSending}
            className="w-full px-3 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
          >
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

export const MinimalSellerCardSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-28" />
        <div className="h-3 bg-slate-100 rounded w-20" />
      </div>
    </div>
    <div className="flex gap-2">
      <div className="flex-1 h-10 bg-slate-200 rounded-xl" />
      <div className="w-10 h-10 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

/* =====================================================
   MINIMAL SELLER CARD - GLAVNI COMPONENT
===================================================== */

export const MinimalSellerCard = ({
  seller,
  sellerSettings,
  badges = [],
  ratings,
  isPro = false,
  isShop = false,
  showProfileLink = true,
  onChatClick,
  onPhoneClick,
  shareUrl,
  // Product context
  itemId,
  itemPrice,
  acceptsOffers = false,
  // UI Preferences (from SellerSettings)
  variant = "default", // "default" | "compact" | "inline"
}) => {
  const pathname = usePathname();
  const CompanyName = useSelector(getCompanyName);

  const settings = sellerSettings || {};
  
  // Card preferences from seller settings
  const cardPrefs = settings?.card_preferences || {};
  const showRatings = cardPrefs.show_ratings ?? true;
  const showBadges = cardPrefs.show_badges ?? true;
  const showMemberSince = cardPrefs.show_member_since ?? false; // Default off for cleaner look
  const showResponseTime = cardPrefs.show_response_time ?? true;
  const maxBadges = cardPrefs.max_badges ?? 2;

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);

  // Skeleton
  if (!seller) {
    return <MinimalSellerCardSkeleton />;
  }

  const computedShareUrl = shareUrl || (seller?.id
    ? `${process.env.NEXT_PUBLIC_WEB_URL}/seller/${seller.id}`
    : `${process.env.NEXT_PUBLIC_WEB_URL}${pathname}`);

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

  // Badges - limit display
  const badgeList = useMemo(() => (badges || []).slice(0, maxBadges), [badges, maxBadges]);

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
    if (onPhoneClick) {
      onPhoneClick();
    } else {
      setIsContactOpen(true);
    }
  };

  return (
    <>
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

      <div className={cn(
        "space-y-3",
        variant === "compact" && "space-y-2"
      )}>
        {/* Header: Avatar + Info */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <CustomLink href={`/seller/${seller?.id}`} className="relative flex-shrink-0 group">
            <div className={cn(
              "rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60",
              "group-hover:border-slate-300 transition-colors",
              variant === "compact" ? "w-10 h-10" : "w-12 h-12"
            )}>
              <CustomImage
                src={seller?.profile || seller?.profile_image}
                alt={seller?.name || "Prodavač"}
                width={variant === "compact" ? 40 : 48}
                height={variant === "compact" ? 40 : 48}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Verified badge */}
            {seller?.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-sky-500 rounded-md flex items-center justify-center border-2 border-white">
                <BadgeCheck className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </CustomLink>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name row with share */}
            <div className="flex items-center justify-between gap-2">
              <CustomLink 
                href={`/seller/${seller?.id}`}
                className="text-sm font-semibold text-slate-900 hover:text-primary truncate transition-colors"
              >
                {seller?.name}
              </CustomLink>
              
              <SharePopover url={computedShareUrl} title={title} />
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {/* Rating */}
              {showRatings && ratingValue && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{ratingValue}</span>
                  <span className="text-slate-400">({ratingCount})</span>
                </span>
              )}

              {/* Response time */}
              {responseLabel && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Zap className="w-3 h-3 text-amber-500" />
                  {responseLabel}
                </span>
              )}

              {/* Member since - only if enabled */}
              {memberSince && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {memberSince}
                </span>
              )}

              {/* Pro/Shop badge inline */}
              {isPro && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">
                  PRO
                </span>
              )}
              {isShop && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded">
                  SHOP
                </span>
              )}
            </div>

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
                  <span className="text-[10px] text-slate-400 ml-0.5">
                    +{badges.length - maxBadges}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Primary: Send message */}
          <button
            type="button"
            onClick={handleChatClick}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "bg-slate-900 hover:bg-slate-800 text-white",
              "text-sm font-medium rounded-xl transition-colors",
              variant === "compact" ? "px-3 py-2" : "px-4 py-2.5"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            Pošalji poruku
          </button>

          {/* Make offer - if allowed and has item */}
          {canMakeOffer && itemId && (
            <button
              type="button"
              onClick={() => setIsOfferOpen(true)}
              className={cn(
                "flex items-center justify-center gap-1.5",
                "bg-emerald-600 hover:bg-emerald-700 text-white",
                "text-sm font-medium rounded-xl transition-colors",
                variant === "compact" ? "px-3 py-2" : "px-4 py-2.5"
              )}
            >
              Ponuda
            </button>
          )}

          {/* Contact options */}
          {hasContactOptions && (
            <button
              type="button"
              onClick={handleContactClick}
              className={cn(
                "flex items-center justify-center rounded-xl border border-slate-200",
                "hover:bg-slate-50 text-slate-600 transition-colors",
                variant === "compact" ? "w-9 h-9" : "w-10 h-10"
              )}
            >
              <Phone className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Profile link */}
        {showProfileLink && (
          <CustomLink
            href={`/seller/${seller?.id}`}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors group"
          >
            Pogledaj kompletan profil
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </CustomLink>
        )}
      </div>
    </>
  );
};

export default MinimalSellerCard;