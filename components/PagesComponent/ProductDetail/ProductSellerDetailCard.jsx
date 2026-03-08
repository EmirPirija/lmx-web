"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  ChevronRight,
  Shield,
  Truck,
  RotateCcw,
  ExternalLink,
} from "@/components/Common/UnifiedIconPack";

import { cn } from "@/lib/utils";
import { resolveMembership } from "@/lib/membership";
import { isSellerVerified } from "@/lib/seller-verification";
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
import ShareDropdown from "@/components/Common/ShareDropdown";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import GamificationBadge from "@/components/PagesComponent/Gamification/Badge";
import { formatResponseTimeBs } from "@/utils/index";
import {
  allItemApi,
  itemConversationApi,
  sendMessageApi,
  itemOfferApi,
} from "@/utils/api";
import ReelUploadModal from "@/components/PagesComponent/Seller/ReelUploadModal";
import ReelViewerModal from "@/components/PagesComponent/Seller/ReelViewerModal";
import ReelRingStyles from "@/components/PagesComponent/Seller/ReelRingStyles";
import ExistingConversationBanner from "@/components/PagesComponent/ProductDetail/ExistingConversationBanner";
import { resolveAvatarUrl } from "@/utils/avatar";
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

const toBool = (v) => {
  if (v === true) return true;
  if (v === false || v == null) return false;

  if (typeof v === "number") return v > 0;

  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "yes", "y", "approved", "verified", "active"].includes(s))
      return true;

    // hvata "1", "2", "3"...
    const n = Number(s);
    if (!Number.isNaN(n)) return n > 0;

    return false;
  }

  return Boolean(v);
};

const formatMemberSince = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS_BS[d.getMonth()]} ${d.getFullYear()}`;
};

const resolveSellerAvatar = (seller = {}) =>
  resolveAvatarUrl([
    seller?.profile,
    seller?.profile_image,
    seller?.profileImage,
    seller?.avatar,
    seller?.avatar_url,
    seller?.image,
    seller?.photo,
    seller?.svg_avatar,
  ]);

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

const responseTimeLabels = {
  instant: "par minuta",
  few_hours: "par sati",
  same_day: "isti dan",
  few_days: "par dana",
};

const normalizeCardPreferences = (raw) => normalizeSellerCardPreferences(raw);

const getResponseTimeLabel = ({ responseTime, responseTimeAvg, settings }) => {
  const direct =
    settings?.response_time_label || settings?.response_time_text || null;
  if (direct) return direct;
  if (!responseTime) return null;
  if (responseTime === "auto") return formatResponseTimeBs(responseTimeAvg);
  return responseTimeLabels[responseTime] || null;
};

const MOBILE_SHEET_DIALOG_CLASS =
  "w-screen max-w-none gap-0 overflow-hidden rounded-t-[1.35rem] border-x-0 border-b-0 border-slate-200 bg-white p-0 shadow-[0_-24px_52px_-34px_rgba(15,23,42,0.5)] dark:border-slate-700 dark:bg-slate-900 sm:w-full sm:max-w-sm sm:rounded-2xl sm:border sm:shadow-xl [&>div:nth-child(2)]:max-h-[calc(86dvh-0.75rem)] [&>div:nth-child(2)]:overflow-y-auto [&>div:nth-child(2)]:px-0 [&>div:nth-child(2)]:pb-[max(1rem,env(safe-area-inset-bottom))] [&>div:nth-child(2)]:pt-0";

/* =====================================================
   CONTACT MODAL
===================================================== */

const ContactModal = ({
  open,
  onOpenChange,
  seller,
  settings,
  isLoggedIn,
  onMessageClick,
  onPhoneCall,
}) => {
  const [copiedKey, setCopiedKey] = useState("");
  const primaryActionRef = useRef(null);
  const focusPrimaryAction = useCallback((event) => {
    event.preventDefault();
    requestAnimationFrame(() => {
      primaryActionRef.current?.focus();
    });
  }, []);

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
        onOpenAutoFocus={focusPrimaryAction}
        className={cn(MOBILE_SHEET_DIALOG_CLASS, "sm:max-w-md")}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Kontakt
          </h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5 p-4">
          <button
            ref={primaryActionRef}
            type="button"
            onClick={() => {
              onMessageClick?.();
              onOpenChange(false);
            }}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-4 text-base font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <MessageCircle className="w-4 h-4" />
            Poruka
          </button>

          {showPhone && (
            <div className="flex items-center gap-2">
              <a
                href={`tel:${phoneRaw}`}
                onClick={() => onPhoneCall?.()}
                className="flex h-12 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
              >
                <Phone className="h-4 w-4 text-emerald-500" />
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                  {phoneDisplay}
                </span>
              </a>
              <button
                type="button"
                onClick={() => copy("phone", phoneRaw)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {copiedKey === "phone" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
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
              className="flex h-12 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
            >
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                WhatsApp
              </span>
            </a>
          )}

          {showViber && (
            <a
              href={`viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`}
              className="flex h-12 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
            >
              <div className="w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                <Phone className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Viber
              </span>
            </a>
          )}

          {showEmail && (
            <div className="flex items-center gap-2">
              <a
                href={`mailto:${email}`}
                className="flex h-12 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
              >
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                  {email}
                </span>
              </a>
              <button
                type="button"
                onClick={() => copy("email", email)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {copiedKey === "email" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
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
  const messageInputRef = useRef(null);
  const focusMessageInput = useCallback((event) => {
    event.preventDefault();
    requestAnimationFrame(() => {
      messageInputRef.current?.focus();
    });
  }, []);

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
          if (startRes?.data?.error === false)
            conversationId = extractId(startRes.data.data);
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
          if (startRes?.data?.error === false)
            conversationId = extractId(startRes.data.data);
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
        onOpenAutoFocus={focusMessageInput}
        className={cn(MOBILE_SHEET_DIALOG_CLASS, "sm:max-w-sm")}
      >
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
              <UserAvatarMedia
                src={resolveSellerAvatar(seller)}
                verificationSource={seller}
                showVerifiedBadge
                alt={sellerDisplayName || "Prodavač"}
                className="w-8 h-8 rounded-lg"
                roundedClassName="rounded-lg"
                imageClassName="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {sellerDisplayName}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {itemId ? (
            <ExistingConversationBanner
              itemId={itemId}
              seller={seller}
              className="mb-1"
              showDismiss={false}
            />
          ) : null}
          <textarea
            ref={messageInputRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError("");
            }}
            placeholder="Napišite poruku..."
            rows={3}
            className={cn(
              "w-full rounded-xl border bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm resize-none text-slate-900 dark:text-slate-100",
              "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              error
                ? "border-red-300 dark:border-red-700/60"
                : "border-slate-200 dark:border-slate-700",
            )}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
            >
              Odustani
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl disabled:opacity-50"
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
  const amountInputRef = useRef(null);
  const focusAmountInput = useCallback((event) => {
    event.preventDefault();
    requestAnimationFrame(() => {
      amountInputRef.current?.focus();
    });
  }, []);

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
        onOpenAutoFocus={focusAmountInput}
        className={cn(MOBILE_SHEET_DIALOG_CLASS, "sm:max-w-xs")}
      >
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Pošalji ponudu
          </h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {itemPrice && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Cijena</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {typeof itemPrice === "number"
                  ? `${itemPrice.toFixed(2)} KM`
                  : itemPrice}
              </span>
            </div>
          )}
          <div className="relative">
            <input
              ref={amountInputRef}
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
                "w-full rounded-xl border bg-slate-50 dark:bg-slate-800 px-3 py-2.5 pr-12 text-lg font-semibold text-slate-900 dark:text-slate-100",
                "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                error
                  ? "border-red-300 dark:border-red-700/60"
                  : "border-slate-200 dark:border-slate-700",
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
            className="w-full px-3 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
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
  showVerifiedAvatarBadge = false,
  avatarVerified = null,
  disableContactActions = false,
  contactBlockedMessage = "",
  onOverlayStateChange = () => {},
}) => {
  const pathname = usePathname();
  const CompanyName = useSelector(getCompanyName);

  // Merge seller payloads so contact data is consistent with seller page.
  const seller = useMemo(() => {
    const fromProductUser =
      productDetails?.user && typeof productDetails.user === "object"
        ? productDetails.user
        : {};
    const fromProductSeller =
      productDetails?.seller && typeof productDetails.seller === "object"
        ? productDetails.seller
        : {};
    const fromProp =
      sellerProp && typeof sellerProp === "object" ? sellerProp : {};
    const nestedFromProp =
      fromProp?.seller && typeof fromProp.seller === "object"
        ? fromProp.seller
        : {};

    const merged = {
      ...fromProductSeller,
      ...fromProductUser,
      ...nestedFromProp,
      ...fromProp,
    };

    return Object.keys(merged).length > 0 ? merged : null;
  }, [productDetails?.seller, productDetails?.user, sellerProp]);
  const ratings = ratingsProp || productDetails?.ratings;
  const itemId = itemIdProp || productDetails?.id;
  const itemPrice = itemPriceProp || productDetails?.price;

  const settings = useMemo(() => {
    const fromProductUserSettings =
      productDetails?.user_settings &&
      typeof productDetails.user_settings === "object"
        ? productDetails.user_settings
        : {};
    const fromProductSellerSettings =
      productDetails?.seller_settings &&
      typeof productDetails.seller_settings === "object"
        ? productDetails.seller_settings
        : {};
    const fromSellerPayload =
      seller?.seller_settings && typeof seller.seller_settings === "object"
        ? seller.seller_settings
        : {};
    const fromProp =
      sellerSettings && typeof sellerSettings === "object"
        ? sellerSettings
        : {};

    return {
      ...fromProductUserSettings,
      ...fromProductSellerSettings,
      ...fromSellerPayload,
      ...fromProp,
    };
  }, [
    productDetails?.seller_settings,
    productDetails?.user_settings,
    seller?.seller_settings,
    sellerSettings,
  ]);

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
        settings,
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
    ],
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
    [isShopProp, seller, productDetails?.user, sellerSettings, settings],
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
    [isProProp, seller, productDetails?.user, sellerSettings, settings],
  );

  const membershipTier = forceShopTier
    ? "shop"
    : forceProTier
      ? "pro"
      : membership?.tier;
  const hasMembershipBadge =
    membershipTier === "shop" || membershipTier === "pro";
  const resolvedAvatarVerified = useMemo(() => {
    if (typeof avatarVerified === "boolean") return avatarVerified;
    return isSellerVerified(
      seller,
      settings,
      sellerSettings,
      productDetails?.seller,
      productDetails?.user,
    );
  }, [
    avatarVerified,
    seller,
    settings,
    sellerSettings,
    productDetails?.seller,
    productDetails?.user,
  ]);

  const acceptsOffers =
    acceptsOffersProp ||
    productDetails?.accepts_offers ||
    sellerSettings?.accepts_offers;

  const [hasReel, setHasReel] = useState(
    Boolean(
      hasSellerActiveReel(seller) ||
      hasSellerActiveReel(settings) ||
      hasSellerActiveReel(sellerSettings),
    ),
  );

  useEffect(() => {
    setHasReel(
      Boolean(
        hasSellerActiveReel(seller) ||
        hasSellerActiveReel(settings) ||
        hasSellerActiveReel(sellerSettings),
      ),
    );
  }, [seller, settings, sellerSettings]);
  const ringMotion = undefined;
  const ringTransition = undefined;

  // Card preferences from seller settings - parse if string
  const mergedPrefs = normalizeCardPreferences(settings?.card_preferences);
  const sellerDisplayName = useMemo(
    () => resolveSellerDisplayName({ seller, settings }),
    [seller, settings],
  );
  const showRatings = mergedPrefs.show_ratings;
  const showBadges = mergedPrefs.show_badges;
  const showResponseTime = mergedPrefs.show_response_time;
  const showMemberSince = mergedPrefs.show_member_since;
  const showReelHint = mergedPrefs.show_reel_hint;
  const highlightContactButton = mergedPrefs.highlight_contact_button;
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
  const isLoggedIn = useSelector(getIsLoggedIn);

  useEffect(() => {
    const hasOverlayOpen =
      isContactOpen ||
      isMessageOpen ||
      isOfferOpen ||
      isReelModalOpen ||
      isReelViewerOpen;

    onOverlayStateChange(hasOverlayOpen);

    return () => {
      onOverlayStateChange(false);
    };
  }, [
    isContactOpen,
    isMessageOpen,
    isOfferOpen,
    isReelModalOpen,
    isReelViewerOpen,
    onOverlayStateChange,
  ]);

  if (!seller) return <ProductSellerCardSkeleton />;

  // Use user_id if available, fallback to id, then to productDetails.user_id
  const sellerId = seller?.user_id ?? seller?.id ?? productDetails?.user_id;
  const isOwner = Boolean(
    currentUser?.id && String(currentUser.id) === String(sellerId),
  );
  const hasVideo = Boolean(hasItemVideo(productDetails));
  const showStoryRing = Boolean(hasReel || hasVideo);
  const canManageReels = Boolean(enableOwnerReelControls && isOwner);

  const shareUrl = sellerId
    ? `${process.env.NEXT_PUBLIC_WEB_URL}/seller/${sellerId}`
    : `${process.env.NEXT_PUBLIC_WEB_URL}${pathname}`;

  const title = `${sellerDisplayName || "Prodavač"} | ${CompanyName}`;

  const responseLabel = showResponseTime
    ? getResponseTimeLabel({
        responseTime: settings?.response_time || "auto",
        responseTimeAvg: seller?.response_time_avg,
        settings,
      })
    : null;

  const memberSince = showMemberSince
    ? formatMemberSince(seller?.created_at)
    : "";
  const sellerAvatar = resolveSellerAvatar(seller);
  const lastSeenDate = parseLastSeenDate(seller);
  const seenAgoLabel = formatSeenAgoLabel(lastSeenDate);
  const seenInfoLabel =
    lastSeenDate && seenAgoLabel ? `Na mreži ${seenAgoLabel}` : null;
  const contactEngine = resolveSellerContactEngine({
    seller,
    settings,
    isLoggedIn,
  });
  const { contactPolicy, phoneContact, emailVerified } = contactEngine;
  const quietHoursActive = contactPolicy.quietHoursActive;

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

  // Badges
  const badgeList = useMemo(
    () => (badges || []).slice(0, maxBadges),
    [badges, maxBadges],
  );

  // Info sections
  const shippingInfo = showShippingInfo ? settings.shipping_info : null;
  const returnPolicy = showReturnPolicy ? settings.return_policy : null;

  // Can make offer
  const canMakeOffer = acceptsOffers || settings?.accepts_offers;

  // Has contact options
  const hasContactOptions = contactEngine.hasDirectContactOptions;
  const blockedContactCopy =
    contactBlockedMessage ||
    "Oglas je rasprodan. Kontakt opcije su trenutno onemogućene.";

  const handleChatClick = () => {
    if (disableContactActions) {
      toast.info(blockedContactCopy);
      return;
    }
    if (onChatClick) {
      onChatClick();
    } else {
      setIsMessageOpen(true);
    }
  };

  const handleContactClick = () => {
    if (disableContactActions) {
      toast.info(blockedContactCopy);
      return;
    }
    onPhoneReveal?.();
    setIsContactOpen(true);
  };

  const handleOfferClick = () => {
    if (disableContactActions) {
      toast.info(blockedContactCopy);
      return;
    }
    setIsOfferOpen(true);
  };

  const handleReelOpen = useCallback(async () => {
    if (!sellerId) {
      toast.info("Nema aktivnih videa.");
      return;
    }

    try {
      const res = await allItemApi.getItems({
        user_id: sellerId,
        has_video: 1,
        status: "approved",
        limit: 1,
        sort_by: "new-to-old",
      });
      const rawItems =
        res?.data?.data?.data || res?.data?.data || res?.data?.items || [];
      const list = Array.isArray(rawItems) ? rawItems : [];
      const hasAnyVideo = list.some((entry) => hasItemVideo(entry));

      if (hasAnyVideo) {
        setHasReel(true);
        setIsReelViewerOpen(true);
        return;
      }
      setHasReel(false);
    } catch {
      // silent fallback to user message
    }

    toast.info("Nema aktivnih videa.");
  }, [sellerId]);

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
        onPhoneCall={onPhoneClick}
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
                  onClick={handleReelOpen}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleReelOpen();
                    }
                  }}
                  className="focus:outline-none"
                  aria-label="Otvori reelove"
                >
                  <motion.div
                    className={cn(
                      showStoryRing
                        ? "reel-ring"
                        : "rounded-[14px] p-[2px] bg-transparent",
                    )}
                    animate={ringMotion}
                    transition={ringTransition}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 overflow-hidden bg-slate-100 dark:bg-slate-800",
                        showStoryRing ? "reel-ring-inner" : "rounded-xl",
                        showStoryRing
                          ? "border-white/70 dark:border-slate-700/80"
                          : "border-slate-200/60 dark:border-slate-700/60 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors",
                      )}
                    >
                      <UserAvatarMedia
                        src={sellerAvatar}
                        verificationSource={seller}
                        showVerifiedBadge={showVerifiedAvatarBadge}
                        verified={resolvedAvatarVerified}
                        alt={sellerDisplayName || "Prodavač"}
                        className="w-full h-full rounded-xl"
                        roundedClassName="rounded-xl"
                        imageClassName="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                </div>
                {showVerifiedAvatarBadge && resolvedAvatarVerified ? (
                  <span className="pointer-events-none absolute -top-1 -right-1 z-30 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm dark:border-slate-900">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                ) : null}
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
                    <span className="text-lg leading-none text-[#1e3a8a]">
                      +
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="relative isolate flex-shrink-0">
                  <motion.div
                    className={cn(
                      showStoryRing
                        ? "reel-ring"
                        : "rounded-[14px] p-[2px] bg-transparent",
                    )}
                    animate={ringMotion}
                    transition={ringTransition}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 overflow-hidden bg-slate-100 dark:bg-slate-800",
                        showStoryRing ? "reel-ring-inner" : "rounded-xl",
                        showStoryRing
                          ? "border border-white/70 dark:border-slate-700/80"
                          : "border border-slate-200/60 dark:border-slate-700/60",
                      )}
                    >
                      <UserAvatarMedia
                        src={sellerAvatar}
                        verificationSource={seller}
                        showVerifiedBadge={showVerifiedAvatarBadge}
                        verified={resolvedAvatarVerified}
                        alt={sellerDisplayName || "Prodavač"}
                        className="w-full h-full rounded-xl"
                        roundedClassName="rounded-xl"
                        imageClassName="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                </div>
                {showVerifiedAvatarBadge && resolvedAvatarVerified ? (
                  <span className="pointer-events-none absolute -top-1 -right-1 z-30 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm dark:border-slate-900">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                ) : null}
              </>
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
                    <span className="truncate">{sellerDisplayName}</span>
                    {hasMembershipBadge && (
                      <MembershipBadge tier={membershipTier} size="xs" />
                    )}
                  </CustomLink>
                ) : (
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                    <span className="truncate">{sellerDisplayName}</span>
                    {hasMembershipBadge && (
                      <MembershipBadge tier={membershipTier} size="xs" />
                    )}
                  </span>
                )}

                <ShareDropdown
                  url={shareUrl}
                  title={title}
                  headline={title}
                  companyName={CompanyName}
                >
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
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
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">
                        •
                      </span>
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
              <ContactTrustBadges
                className="mt-1"
                hasPhone={phoneContact.hasPhone}
                phoneState={phoneContact.state}
                phoneVerified={phoneContact.isPhoneVerified}
                hasEmail={Boolean(seller?.email)}
                emailVerified={emailVerified}
                responseLabel={responseLabel || ""}
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

          {/* Actions — inline like MinimalSellerCard */}
          {disableContactActions ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-200">
              {blockedContactCopy}
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-seller-chat-button
              onClick={handleChatClick}
              disabled={disableContactActions}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-900 dark:disabled:hover:bg-slate-100"
            >
              <MessageCircle className="w-4 h-4" />
              Poruka
            </button>

            {canMakeOffer && itemId && (
              <button
                type="button"
                onClick={handleOfferClick}
                disabled={disableContactActions}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors",
                  disableContactActions
                    ? "bg-emerald-300 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700",
                )}
              >
                Ponuda
              </button>
            )}

            {hasContactOptions && (
              <button
                type="button"
                data-seller-contact-button
                onClick={handleContactClick}
                disabled={disableContactActions}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl border transition-colors",
                  disableContactActions
                    ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                    : highlightContactButton
                      ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
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
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-0.5">
                      Dostava
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {shippingInfo}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {returnPolicy && (
              <div className="px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <RotateCcw className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-0.5">
                      Povrat
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {returnPolicy}
                    </p>
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
