"use client";

import React, { useState, useMemo } from "react";
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
  Play,
  ChevronRight,
  MoreHorizontal,
} from "@/components/Common/UnifiedIconPack";

import { cn } from "@/lib/utils";
import { resolveMembership } from "@/lib/membership";
import { hasItemVideo, hasSellerActiveReel } from "@/lib/seller-reel";
import { PHONE_CONTACT_STATES } from "@/lib/seller-contact";
import {
  normalizeSellerCardPreferences,
  resolveSellerContactEngine,
  resolveSellerDisplayName,
} from "@/lib/seller-settings-engine";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import MembershipBadge from "@/components/Common/MembershipBadge";
import CustomImage from "@/components/Common/CustomImage";
import UserAvatarMedia from "@/components/Common/UserAvatar";
import CustomLink from "@/components/Common/CustomLink";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import GamificationBadge from "@/components/PagesComponent/Gamification/Badge";
import { formatResponseTimeBs } from "@/utils/index";
import SavedToListButton from "@/components/Profile/SavedToListButton";
import { itemConversationApi, sendMessageApi, itemOfferApi } from "@/utils/api";
import ReelRingStyles from "@/components/PagesComponent/Seller/ReelRingStyles";
import { Skeleton } from "@/components/ui/skeleton";
import ContactTrustBadges from "@/components/Common/ContactTrustBadges";

/* =====================================================
   HELPER FUNKCIJE
===================================================== */

const MONTHS_BS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "maj",
  "jun",
  "jul",
  "avg",
  "sep",
  "okt",
  "nov",
  "dec",
];

const formatMemberSince = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS_BS[d.getMonth()]} ${d.getFullYear()}`;
};

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
  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - lastSeenDate.getTime()) / 1000),
  );
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
  if (diffDays < 30)
    return `prije ${diffDays} ${getBsCountForm(diffDays, "dan", "dana", "dana")}`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `prije ${diffMonths} ${getBsCountForm(diffMonths, "mjesec", "mjeseca", "mjeseci")}`;
  }
  const diffYears = Math.floor(diffMonths / 12);
  return `prije ${diffYears} ${getBsCountForm(diffYears, "godinu", "godine", "godina")}`;
};

const toBool = (v) => {
  if (v === true || v === 1) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes";
  }
  return false;
};

const normalizeCardPreferences = (raw) => normalizeSellerCardPreferences(raw);

const responseTimeLabels = {
  instant: "par minuta",
  few_hours: "par sati",
  same_day: "isti dan",
  few_days: "par dana",
};

const getResponseTimeLabel = ({ responseTime, responseTimeAvg, settings }) => {
  const direct =
    settings?.response_time_label || settings?.response_time_text || null;
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
            onClick={() =>
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                "_blank",
              )
            }
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md hover:bg-slate-50 text-slate-600"
          >
            Facebook
          </button>
          <button
            type="button"
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
                "_blank",
              )
            }
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md hover:bg-slate-50 text-slate-600"
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md hover:bg-slate-50 text-slate-600"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
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

const ContactModal = ({
  open,
  onOpenChange,
  seller,
  settings,
  isLoggedIn,
  onMessageClick,
}) => {
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

  const contactEngine = resolveSellerContactEngine({
    seller,
    settings,
    isLoggedIn,
  });
  const { contactPolicy, phoneContact, channels, whatsappNumber, viberNumber } =
    contactEngine;
  const showPhone = channels.call;
  const showWhatsapp = channels.whatsapp;
  const showViber = channels.viber;
  const showEmail = channels.email;

  const phoneRaw = phoneContact.phone;
  const phoneDisplay = phoneContact.formattedPhone || phoneRaw;
  const email = seller?.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xs p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Kontakt
          </h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
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
            Poruka
          </button>

          {showPhone && (
            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${phoneRaw}`}
                className="flex-1 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
              >
                <Phone className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-700 dark:text-slate-200">
                  {phoneDisplay}
                </span>
              </a>
              <button
                type="button"
                onClick={() => copy("phone", phoneRaw)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {copiedKey === "phone" ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          )}

          {phoneContact.state !== PHONE_CONTACT_STATES.AVAILABLE &&
            phoneContact.statusMessage && (
              <div
                className={cn(
                  "rounded-lg border px-2.5 py-2 text-xs",
                  phoneContact.state === PHONE_CONTACT_STATES.UNVERIFIED
                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-300"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {phoneContact.statusMessage}
              </div>
            )}
          {contactPolicy.quietHoursEnabled && (
            <div
              className={cn(
                "rounded-lg border px-2.5 py-2 text-xs",
                contactPolicy.quietHoursActive
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-300"
                  : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              Quiet hours: {contactPolicy.quietHoursStart} -{" "}
              {contactPolicy.quietHoursEnd}
              {contactPolicy.quietHoursMessage
                ? ` · ${contactPolicy.quietHoursMessage}`
                : ""}
            </div>
          )}

          {showWhatsapp && (
            <a
              href={`https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
            >
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-slate-700 dark:text-slate-200">
                WhatsApp
              </span>
            </a>
          )}

          {showViber && (
            <a
              href={`viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
            >
              <div className="w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                <Phone className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-slate-700 dark:text-slate-200">Viber</span>
            </a>
          )}

          {showEmail && (
            <div className="flex items-center gap-1.5">
              <a
                href={`mailto:${email}`}
                className="flex-1 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm truncate"
              >
                <span className="text-slate-700 dark:text-slate-200 truncate">
                  {email}
                </span>
              </a>
              <button
                type="button"
                onClick={() => copy("email", email)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {copiedKey === "email" ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
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

const SendMessageModal = ({ open, onOpenChange, seller, settings, itemId }) => {
  const router = useRouter();
  const currentUser = useSelector(userSignUpData);
  const isLoggedIn = useSelector(getIsLoggedIn);
  const sellerDisplayName = resolveSellerDisplayName({ seller, settings });

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

      const extractId = (data) =>
        data?.conversation_id || data?.item_offer_id || data?.id || null;

      if (itemId) {
        const checkRes = await itemConversationApi.checkConversation({
          item_id: itemId,
        });
        if (
          checkRes?.data?.error === false &&
          extractId(checkRes?.data?.data)
        ) {
          conversationId = extractId(checkRes.data.data);
        } else {
          const startRes = await itemConversationApi.startItemConversation({
            item_id: itemId,
          });
          if (startRes?.data?.error === false) {
            conversationId = extractId(startRes.data.data);
          }
        }
      } else {
        const checkRes = await itemConversationApi.checkDirectConversation({
          user_id: sellerUserId,
        });
        if (
          checkRes?.data?.error === false &&
          extractId(checkRes?.data?.data)
        ) {
          conversationId = extractId(checkRes.data.data);
        } else {
          const startRes = await itemConversationApi.startDirectConversation({
            user_id: sellerUserId,
          });
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
      const errorMessage =
        err?.response?.data?.message || err?.message || "Greška.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm p-0 gap-0 overflow-hidden rounded-2xl"
      >
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100">
              <UserAvatarMedia
                sources={[
                  seller?.profile,
                  seller?.profile_image,
                  seller?.avatar,
                ]}
                verificationSource={seller}
                alt={sellerDisplayName || "Prodavač"}
                className="w-8 h-8 rounded-lg"
                roundedClassName="rounded-lg"
                imageClassName="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {sellerDisplayName}
            </span>
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
              error ? "border-red-300" : "border-slate-200",
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
      const res = await itemOfferApi.offer({
        item_id: itemId,
        amount: numAmount,
      });

      if (res?.data?.error === false) {
        toast.success("Ponuda poslana!");
        setAmount("");
        onOpenChange(false);
      } else {
        throw new Error(res?.data?.message || "Greška.");
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Greška.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xs p-0 gap-0 overflow-hidden rounded-2xl"
      >
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Pošalji ponudu
          </h3>
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
                {typeof itemPrice === "number"
                  ? `${itemPrice.toFixed(2)} KM`
                  : itemPrice}
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
                error ? "border-red-300" : "border-slate-200",
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              KM
            </span>
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
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton className="flex-1 h-10 rounded-xl" />
      <Skeleton className="w-10 h-10 rounded-xl" />
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
  productDetails,
  acceptsOffers = false,
  // UI Preferences (from SellerSettings)
  variant = "default", // "default" | "compact" | "inline"
}) => {
  const pathname = usePathname();
  const CompanyName = useSelector(getCompanyName);
  const isLoggedIn = useSelector(getIsLoggedIn);

  const settings = sellerSettings || {};
  const resolvedMembership = resolveMembership(
    { is_pro: isPro, is_shop: isShop },
    seller,
    settings?.membership,
  );

  const hasReel = useMemo(
    () =>
      Boolean(
        hasSellerActiveReel(seller) ||
        hasSellerActiveReel(settings) ||
        hasItemVideo(seller) ||
        hasItemVideo(settings) ||
        hasItemVideo(productDetails),
      ),
    [productDetails, seller, settings],
  );

  // Card preferences from seller settings - parse if JSON string
  const cardPrefs = normalizeCardPreferences(settings?.card_preferences);
  const sellerDisplayName = useMemo(
    () => resolveSellerDisplayName({ seller, settings }),
    [seller, settings],
  );
  const showRatings = cardPrefs.show_ratings;
  const showBadges = cardPrefs.show_badges;
  const showMemberSince = cardPrefs.show_member_since;
  const showResponseTime = cardPrefs.show_response_time;
  const showReelHint = cardPrefs.show_reel_hint;
  const highlightContactButton = cardPrefs.highlight_contact_button;
  const maxBadges = cardPrefs.max_badges ?? 2;

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);

  // Skeleton
  if (!seller) {
    return <MinimalSellerCardSkeleton />;
  }

  const computedShareUrl =
    shareUrl ||
    (seller?.id
      ? `${process.env.NEXT_PUBLIC_WEB_URL}/seller/${seller.id}`
      : `${process.env.NEXT_PUBLIC_WEB_URL}${pathname}`);

  const title = `${sellerDisplayName || "Prodavač"} | ${CompanyName}`;

  const responseLabel = showResponseTime
    ? getResponseTimeLabel({
        responseTime: settings?.response_time || "auto",
        responseTimeAvg: seller?.response_time_avg,
        settings,
      })
    : null;
  const lastSeenDate = parseLastSeenDate(seller);
  const seenAgoLabel = formatSeenAgoLabel(lastSeenDate);
  const seenInfoLabel =
    lastSeenDate && seenAgoLabel ? `Na mreži ${seenAgoLabel}` : "";

  const memberSince = showMemberSince
    ? formatMemberSince(seller?.created_at)
    : "";

  // Rating
  const ratingValue = useMemo(
    () =>
      seller?.average_rating != null
        ? Number(seller.average_rating).toFixed(1)
        : null,
    [seller?.average_rating],
  );
  const ratingCount = useMemo(
    () => ratings?.total || ratings?.count || seller?.ratings_count || 0,
    [ratings, seller],
  );

  // Badges - limit display
  const badgeList = useMemo(
    () => (badges || []).slice(0, maxBadges),
    [badges, maxBadges],
  );

  // Can make offer
  const canMakeOffer = acceptsOffers || settings?.accepts_offers;

  // Has contact options
  const contactEngine = resolveSellerContactEngine({
    seller,
    settings,
    isLoggedIn,
  });
  const { contactPolicy, phoneContact, emailVerified } = contactEngine;
  const quietHoursActive = contactPolicy.quietHoursActive;
  const hasContactOptions = contactEngine.hasDirectContactOptions;

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
      <ReelRingStyles />

      <ContactModal
        open={isContactOpen}
        onOpenChange={setIsContactOpen}
        seller={seller}
        settings={settings}
        isLoggedIn={isLoggedIn}
        onMessageClick={handleChatClick}
      />

      <SendMessageModal
        open={isMessageOpen}
        onOpenChange={setIsMessageOpen}
        seller={seller}
        settings={settings}
        itemId={itemId}
      />

      <SendOfferModal
        open={isOfferOpen}
        onOpenChange={setIsOfferOpen}
        seller={seller}
        itemId={itemId}
        itemPrice={itemPrice}
      />

      <div className={cn("space-y-3", variant === "compact" && "space-y-2")}>
        {/* Header: Avatar + Info */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <CustomLink
            href={`/seller/${seller?.id}`}
            className="relative isolate flex-shrink-0 group"
          >
            <div
              className={cn(
                hasReel
                  ? "reel-ring"
                  : cn(
                      variant === "compact"
                        ? "rounded-[12px]"
                        : "rounded-[14px]",
                      "p-[2px] bg-transparent",
                    ),
              )}
            >
              <div
                className={cn(
                  "overflow-hidden bg-slate-100",
                  hasReel ? "reel-ring-inner" : "",
                  "border border-slate-200/60 group-hover:border-slate-300 transition-colors",
                  hasReel && "border-white/70 dark:border-slate-700/80",
                  variant === "compact"
                    ? "w-10 h-10 rounded-[10px]"
                    : "w-12 h-12 rounded-xl",
                )}
              >
                <UserAvatarMedia
                  sources={[
                    seller?.profile,
                    seller?.profile_image,
                    seller?.avatar,
                  ]}
                  verificationSource={seller}
                  phoneVerifiedBadgeClassName={
                    hasReel ? "-left-0.5 !right-auto" : ""
                  }
                  alt={sellerDisplayName || "Prodavač"}
                  className="w-full h-full"
                  roundedClassName={
                    variant === "compact" ? "rounded-[10px]" : "rounded-xl"
                  }
                  imageClassName="w-full h-full object-cover"
                />
              </div>
            </div>

            {hasReel && (
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 z-20 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center",
                  variant === "compact" ? "w-[18px] h-[18px]" : "w-5 h-5",
                )}
              >
                <Play
                  className={cn(
                    "text-[#1e3a8a]",
                    variant === "compact" ? "w-2.5 h-2.5" : "w-3 h-3",
                  )}
                />
              </div>
            )}
          </CustomLink>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name row with share */}
            <div className="flex items-center justify-between gap-2">
              <CustomLink
                href={`/seller/${seller?.id}`}
                className="text-sm font-semibold text-slate-900 hover:text-primary truncate transition-colors flex items-center gap-1.5"
              >
                <span className="truncate">{sellerDisplayName}</span>
                <MembershipBadge tier={resolvedMembership.tier} size="xs" />
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
                  {/* <span className="text-slate-400">({ratingCount})</span> */}
                </span>
              )}

              {/* Response time */}
              {responseLabel && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Prosječno vrijeme odgovora: {responseLabel}
                </span>
              )}

              {/* Member since - only if enabled */}
              {memberSince && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  Član od {memberSince}
                </span>
              )}

              {showReelHint && hasReel && (
                <span className="inline-flex items-center gap-1 text-xs text-indigo-600">
                  <Play className="w-3 h-3" />
                  Ima video story
                </span>
              )}
            </div>
            <ContactTrustBadges
              className="mt-1"
              hasPhone={phoneContact.hasPhone}
              phoneState={phoneContact.state}
              phoneVerified={phoneContact.isPhoneVerified}
              hasEmail={Boolean(seller?.email)}
              emailVerified={emailVerified}
              responseLabel={responseLabel || ""}
              seenInfoLabel={seenInfoLabel}
              phoneVisibleOnlyToLoggedIn={
                contactPolicy.phoneVisibleOnlyToLoggedIn
              }
              messagesOnly={contactPolicy.messagesOnly}
              quietHoursEnabled={contactPolicy.quietHoursEnabled}
              quietHoursStart={contactPolicy.quietHoursStart}
              quietHoursEnd={contactPolicy.quietHoursEnd}
              quietHoursActive={quietHoursActive}
              quietHoursMessage={contactPolicy.quietHoursMessage}
              reasonCodes={contactEngine.reasonCodes}
            />

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
                  <span className="text-[10px] text-slate-400 ml-0.5">
                    +{badges.length - maxBadges}
                  </span>
                )}
              </div>
            )} */}
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
              variant === "compact" ? "px-3 py-2" : "px-4 py-2.5",
            )}
          >
            <MessageCircle className="w-4 h-4" />
            Poruka
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
                variant === "compact" ? "px-3 py-2" : "px-4 py-2.5",
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
                highlightContactButton
                  ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15"
                  : "hover:bg-slate-50 text-slate-600",
                "transition-colors",
                variant === "compact" ? "w-9 h-9" : "w-10 h-10",
              )}
            >
              <Phone className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MinimalSellerCard;
