"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Camera,
  Check,
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
  BadgeCheck,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
  Tag,
  HandCoins,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import { userSignUpData } from "@/redux/reducer/authSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import GamificationBadge from "@/components/PagesComponent/Gamification/Badge";
import { formatResponseTimeBs } from "@/utils/index";
import { itemConversationApi, sendMessageApi, itemOfferApi } from "@/utils/api";

/* =====================
  Animacije
===================== */

const fadeInUp = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const shimmerCss = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
.shimmer { position: relative; overflow: hidden; }
.shimmer::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
  animation: shimmer 1.5s infinite ease-in-out;
}
.dark .shimmer::after {
  background: linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.15) 50%, transparent 100%);
}
.glow-pulse {
  animation: pulse-glow 2s infinite ease-in-out;
}
`;

const ShimmerStyles = () => <style jsx global>{shimmerCss}</style>;

/* =====================
  Helperi
===================== */

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
  normal: { pad: "p-5 sm:p-6", avatar: "w-16 h-16", name: "text-lg", meta: "text-xs", btn: "h-11" },
  cozy: { pad: "p-6 sm:p-8", avatar: "w-20 h-20", name: "text-xl", meta: "text-sm", btn: "h-12" },
};

/* =====================
  UI komponente
===================== */

const GlassCard = ({ children, className, ...props }) => (
  <motion.div
    {...fadeInUp}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className={cn(
      "relative overflow-hidden rounded-3xl",
      "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
      "border border-slate-200/60 dark:border-slate-700/60",
      "shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40",
      "hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50",
      "transition-all duration-500 ease-out",
      className
    )}
    {...props}
  >
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl glow-pulse" />
      <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gradient-to-tr from-amber-500/15 to-rose-500/15 blur-3xl glow-pulse" />
    </div>
    {children}
  </motion.div>
);

const IconPill = ({ icon: Icon, children, className, tone = "default" }) => {
  const toneStyles = {
    default: "border-slate-200/70 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300",
    success: "border-emerald-200/70 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-200/70 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    info: "border-blue-200/70 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm",
        toneStyles[tone],
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />}
      {children}
    </motion.span>
  );
};

const StatusBadge = ({ children, variant = "default", icon: Icon }) => {
  const variants = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700",
    pro: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-800 dark:text-amber-200 border-amber-200/70 dark:border-amber-700/50",
    shop: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-200 border-blue-200/70 dark:border-blue-700/50",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
      variants[variant]
    )}>
      {Icon && <Icon className="h-3 w-3" strokeWidth={2.5} />}
      {children}
    </span>
  );
};

const PrimaryButton = ({ children, className, isLoading, disabled, ...props }) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    disabled={disabled || isLoading}
    className={cn(
      "relative inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3",
      "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white",
      "text-white dark:text-slate-900 text-sm font-semibold",
      "shadow-lg shadow-slate-900/25 dark:shadow-white/20",
      "hover:shadow-xl hover:shadow-slate-900/30 dark:hover:shadow-white/25",
      "transition-all duration-300 ease-out",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
      "overflow-hidden",
      className
    )}
    {...props}
  >
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[100%] transition-transform duration-700" />
    </span>

    {isLoading ? (
      <Loader2 className="h-5 w-5 animate-spin" />
    ) : (
      children
    )}
  </motion.button>
);

const SecondaryButton = ({ children, className, ...props }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -1 }}
    whileTap={{ scale: 0.98 }}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5",
      "bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm",
      "text-slate-700 dark:text-slate-200 text-sm font-medium",
      "border border-slate-200/70 dark:border-slate-700/70",
      "hover:bg-slate-200/80 dark:hover:bg-slate-700/80",
      "shadow-sm hover:shadow-md",
      "transition-all duration-200",
      className
    )}
    {...props}
  >
    {children}
  </motion.button>
);

const IconButton = ({ children, className, ...props }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={cn(
      "inline-flex items-center justify-center w-11 h-11 rounded-2xl",
      "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
      "border border-slate-200/70 dark:border-slate-700/70",
      "text-slate-600 dark:text-slate-300",
      "hover:bg-slate-100 dark:hover:bg-slate-700",
      "hover:text-slate-900 dark:hover:text-white",
      "shadow-sm hover:shadow-md",
      "transition-all duration-200",
      className
    )}
    {...props}
  >
    {children}
  </motion.button>
);

/* =====================
  Skeleton
===================== */

export const SellerPreviewSkeleton = ({ compactness = "normal" }) => {
  const c = compactnessMap[compactness] || compactnessMap.normal;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
      <ShimmerStyles />
      <div className={cn("relative", c.pad)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="rounded-full p-1 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 shrink-0">
              <div className={cn(c.avatar, "rounded-full bg-slate-200 dark:bg-slate-700 shimmer")} />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-5 w-40 rounded-full bg-slate-200 dark:bg-slate-700 shimmer" />
              <div className="flex gap-2">
                <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-700 shimmer" />
                <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700 shimmer" />
              </div>
            </div>
          </div>

          <div className="h-11 w-11 rounded-2xl bg-slate-200 dark:bg-slate-700 shimmer" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <div className="h-8 w-32 rounded-full bg-slate-200 dark:bg-slate-700 shimmer" />
          <div className="h-8 w-28 rounded-full bg-slate-200 dark:bg-slate-700 shimmer" />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 shimmer" />
          <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-700 shimmer" />
        </div>
      </div>
    </div>
  );
};

/* =====================
  Modali
===================== */

// Modal za slanje poruke
const SendMessageModal = ({ open, setOpen, seller, itemId, onSuccess }) => {
  const router = useRouter();
  const currentUser = useSelector(userSignUpData);

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!message.trim()) {
      setError("Unesite poruku prije slanja.");
      return;
    }

    if (!currentUser?.token) {
      toast.error("Morate biti prijavljeni da biste poslali poruku.");
      router.push("/login");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      let conversationId = null;

      // Ako imamo item_id, provjeri/kreiraj konverzaciju za taj proizvod
      if (itemId) {
        const checkRes = await itemConversationApi.checkDirectConversation({ user_id: sellerUserId });

        if (checkRes?.data?.error === false && checkRes?.data?.data?.conversation_id) {
          conversationId = checkRes.data.data.conversation_id;
        } else {
          const startRes = await itemConversationApi.startDirectConversation({ user_id: sellerUserId });


          if (startRes?.data?.error === false) {
            conversationId = startRes.data.data?.conversation_id || startRes.data.data?.item_offer_id;
          } else {
            throw new Error(startRes?.data?.message || "Ne mogu pokrenuti razgovor o proizvodu.");
          }
        }
      } else {
                const sellerUserId = seller?.user_id ?? seller?.id;
                if (!sellerUserId) {
                  throw new Error("Greška: Prodavač nije pronađen.");
               }
                if (currentUser?.id && String(currentUser.id) === String(sellerUserId)) {
                  throw new Error("Ne možete poslati poruku sami sebi.");
                }
              }
      if (!conversationId) {
        throw new Error("Nije moguće kreirati razgovor.");
      }

      // Pošalji poruku
      const sendRes = await sendMessageApi.sendMessage({
        item_offer_id: conversationId,
        message: message.trim(),
      });

      if (sendRes?.data?.error === false) {
        toast.success("Poruka je uspješno poslana!");
        setMessage("");
        setOpen(false);
        onSuccess?.();
        router.push(`/chat?id=${conversationId}`);
      } else {
        throw new Error(sendRes?.data?.message || "Greška pri slanju poruke.");
      }
    } catch (err) {
      console.error("Send message error:", err);
      setError(err?.message || "Došlo je do greške pri slanju poruke.");
      toast.error(err?.message || "Greška pri slanju poruke.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-0 overflow-hidden shadow-2xl">
        <motion.div {...fadeInUp} className="p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                  <CustomImage
                    src={seller?.profile || seller?.profile_image}
                    alt={seller?.name || "Prodavač"}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                {seller?.is_verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-slate-900 rounded-full p-0.5">
                    <BadgeCheck className="h-4 w-4 text-blue-500" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Pošalji poruku
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {seller?.name || "Prodavač"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Vaša poruka
              </label>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setError("");
                }}
                placeholder="Napišite poruku prodavaču..."
                rows={4}
                className={cn(
                  "w-full rounded-2xl border bg-white dark:bg-slate-800",
                  "px-4 py-3 text-sm text-slate-900 dark:text-white",
                  "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
                  "transition-all duration-200 resize-none",
                  error ? "border-red-300 dark:border-red-700" : "border-slate-200 dark:border-slate-700"
                )}
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <SecondaryButton type="button" onClick={() => setOpen(false)}>
                Odustani
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={handleSend}
                isLoading={isSending}
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4" />
                Pošalji
              </PrimaryButton>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// Modal za slanje ponude
const SendOfferModal = ({ open, setOpen, seller, itemId, itemPrice, onSuccess }) => {
  const router = useRouter();
  const currentUser = useSelector(userSignUpData);

  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Unesite validan iznos ponude.");
      return;
    }

    if (!currentUser?.token) {
      toast.error("Morate biti prijavljeni da biste poslali ponudu.");
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
        toast.success("Ponuda je uspješno poslana!");
        setAmount("");
        setOpen(false);
        onSuccess?.();

        // Preusmjeri na chat ako postoji conversation_id
        const conversationId = res?.data?.data?.conversation_id || res?.data?.data?.item_offer_id;
        if (conversationId) {
          router.push(`/chat?id=${conversationId}`);
        }
      } else {
        throw new Error(res?.data?.message || "Greška pri slanju ponude.");
      }
    } catch (err) {
      console.error("Send offer error:", err);
      setError(err?.message || "Došlo je do greške pri slanju ponude.");
      toast.error(err?.message || "Greška pri slanju ponude.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-0 overflow-hidden shadow-2xl">
        <motion.div {...fadeInUp} className="p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
                <HandCoins className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Pošalji ponudu
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {seller?.name || "Prodavač"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {itemPrice && (
            <div className="mb-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Trenutna cijena</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {typeof itemPrice === 'number' ? `${itemPrice.toFixed(2)} KM` : itemPrice}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Vaša ponuda (KM)
              </label>
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
                    "w-full rounded-2xl border bg-white dark:bg-slate-800",
                    "px-4 py-3 pr-12 text-lg font-semibold text-slate-900 dark:text-white",
                    "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500",
                    "transition-all duration-200",
                    error ? "border-red-300 dark:border-red-700" : "border-slate-200 dark:border-slate-700"
                  )}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  KM
                </span>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <SecondaryButton type="button" onClick={() => setOpen(false)}>
                Odustani
              </SecondaryButton>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleSend}
                disabled={isSending || !amount}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3",
                  "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600",
                  "text-white text-sm font-semibold",
                  "shadow-lg shadow-emerald-500/25",
                  "hover:shadow-xl hover:shadow-emerald-500/30",
                  "transition-all duration-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <HandCoins className="h-4 w-4" />
                    Pošalji ponudu
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// Contact Sheet Modal
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
      setTimeout(() => setCopiedKey(""), 1500);
      toast.success("Kopirano u međuspremnik");
    } catch {
      toast.error("Kopiranje nije uspjelo");
    }
  };

  const contactMethods = [
    {
      key: "phone",
      show: showPhone && phone,
      icon: Phone,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      label: "Pozovi",
      value: phone,
      href: `tel:${phone}`,
      onClick: onPhoneReveal,
      copyable: true,
    },
    {
      key: "whatsapp",
      show: showWhatsapp && whatsappNumber,
      icon: MessageCircle,
      iconColor: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      label: "WhatsApp",
      value: whatsappNumber,
      href: `https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}`,
      external: true,
    },
    {
      key: "viber",
      show: showViber && viberNumber,
      icon: PhoneCall,
      iconColor: "text-violet-500",
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
      label: "Viber",
      value: viberNumber,
      href: `viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`,
    },
    {
      key: "email",
      show: showEmail && email,
      icon: Mail,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      label: "Email",
      value: email,
      href: `mailto:${email}`,
      copyable: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-0 overflow-hidden shadow-2xl">
        <motion.div {...fadeInUp} className="p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Kontaktiraj prodavača
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Odaberi način kontaktiranja
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="space-y-3">
            {contactMethods.map((method) => {
              if (!method.show) return null;

              const Icon = method.icon;

              return (
                <motion.div
                  key={method.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <a
                    href={method.href}
                    target={method.external ? "_blank" : undefined}
                    rel={method.external ? "noreferrer" : undefined}
                    onClick={() => method.onClick?.()}
                    className={cn(
                      "flex-1 flex items-center gap-3 p-4 rounded-2xl",
                      "border border-slate-200/70 dark:border-slate-700/70",
                      "bg-white dark:bg-slate-800/80",
                      "hover:bg-slate-50 dark:hover:bg-slate-700/80",
                      "transition-all duration-200",
                      actionsDisabled && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className={cn("p-2.5 rounded-xl", method.bgColor)}>
                      <Icon className={cn("h-5 w-5", method.iconColor)} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {method.label}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {method.value}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </a>

                  {method.copyable && (
                    <button
                      type="button"
                      onClick={() => copy(method.key, method.value)}
                      className={cn(
                        "p-3 rounded-xl border border-slate-200 dark:border-slate-700",
                        "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700",
                        "transition-all duration-200"
                      )}
                    >
                      {copiedKey === method.key ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Copy className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })}

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              type="button"
              onClick={() => {
                onChatClick?.();
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-center gap-2 p-4 rounded-2xl mt-4",
                "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600",
                "text-white font-semibold",
                "shadow-lg shadow-blue-500/30",
                "hover:shadow-xl hover:shadow-blue-500/40",
                "transition-all duration-300"
              )}
            >
              <MessageCircle className="h-5 w-5" />
              Pošalji poruku
            </motion.button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================
  SellerPreviewCard
===================== */

export const SellerPreviewCard = ({
  seller,
  sellerSettings,
  badges,
  ratings,
  isPro = false,
  isShop = false,
  mode = "compact",
  actionsDisabled = false,
  showProfileLink = true,
  uiPrefs,
  onChatClick,
  onPhoneClick,
  shareUrl,
  itemId,
  itemPrice,
  acceptsOffers = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const CompanyName = useSelector(getCompanyName);
  const currentUser = useSelector(userSignUpData);

  const settings = sellerSettings || {};
  const prefs = uiPrefs || {};

  const compactness = prefs.compactness || settings?.card_preferences?.compactness || "normal";
  const contactStyle = prefs.contactStyle || settings?.card_preferences?.contactStyle || "inline";

  const showRatings = prefs.showRatings ?? true;
  const showBadges = prefs.showBadges ?? true;
  const showMemberSince = prefs.showMemberSince ?? true;
  const showResponseTime = prefs.showResponseTime ?? true;
  const showShare = prefs.showShare ?? true;

  const c = compactnessMap[compactness] || compactnessMap.normal;

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);

  if (!seller) return <SellerPreviewSkeleton compactness={compactness} />;

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

  const canMakeOffer = acceptsOffers || settings?.accepts_offers;

  const handleChatClick = () => {
    if (onChatClick) {
      onChatClick();
    } else {
      setIsMessageModalOpen(true);
    }
  };

  const handlePhoneClick = () => {
    if (onPhoneClick) {
      onPhoneClick();
    } else if (contactStyle === "sheet") {
      setIsContactSheetOpen(true);
    }
  };

  const handleOfferClick = () => {
    setIsOfferModalOpen(true);
  };

  return (
    <>
      <SendMessageModal
        open={isMessageModalOpen}
        setOpen={setIsMessageModalOpen}
        seller={seller}
        itemId={itemId}
      />

      <SendOfferModal
        open={isOfferModalOpen}
        setOpen={setIsOfferModalOpen}
        seller={seller}
        itemId={itemId}
        itemPrice={itemPrice}
      />

      <ContactSheet
        open={isContactSheetOpen}
        setOpen={setIsContactSheetOpen}
        seller={seller}
        settings={settings}
        actionsDisabled={actionsDisabled}
        onPhoneReveal={onPhoneClick}
        onChatClick={handleChatClick}
      />

      <GlassCard>
        <ShimmerStyles />

        <div className={cn("relative z-10", c.pad)}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar */}
              <div className="relative shrink-0">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="rounded-full p-0.5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
                >
                  <div className="rounded-full p-0.5 bg-white dark:bg-slate-900">
                    <CustomImage
                      src={seller?.profile || seller?.profile_image}
                      alt={seller?.name || "Prodavač"}
                      width={64}
                      height={64}
                      className={cn(c.avatar, "rounded-full object-cover")}
                    />
                  </div>
                </motion.div>

                {seller?.is_verified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-1 shadow-md"
                  >
                    <BadgeCheck className="h-5 w-5 text-blue-500" strokeWidth={2.5} />
                  </motion.div>
                )}
              </div>

              {/* Name & badges */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={cn("font-bold text-slate-900 dark:text-white truncate", c.name)}>
                    {seller?.name}
                  </h3>
                  {isPro && <StatusBadge variant="pro" icon={Sparkles}>Pro</StatusBadge>}
                  {isShop && <StatusBadge variant="shop" icon={Store}>Trgovina</StatusBadge>}
                </div>

                {/* Meta info */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {showRatings && ratingValue && (
                    <IconPill icon={Star} tone="warning">
                      {ratingValue} ({ratingCount})
                    </IconPill>
                  )}
                  {responseLabel && (
                    <IconPill icon={Zap} tone="info">
                      Odgovara za {responseLabel}
                    </IconPill>
                  )}
                  {memberSince && (
                    <IconPill icon={Calendar}>
                      Član od {memberSince}
                    </IconPill>
                  )}
                </div>

                {/* Badges */}
                {showBadges && badgeList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {badgeList.map((b) => (
                      <GamificationBadge key={b.id} badge={b} size="sm" showName={false} showDescription={false} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Share button */}
            {showShare && (
              <ShareDropdown
                url={computedShareUrl}
                title={title}
                headline={title}
                companyName={CompanyName}
              >
                <IconButton>
                  <Share2 className="h-5 w-5" strokeWidth={2} />
                </IconButton>
              </ShareDropdown>
            )}
          </div>

          {/* Business hours (for shops) */}
          {showHours && todayHoursText && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Clock className="h-4 w-4" strokeWidth={2} />
                <span>Danas: {todayHoursText}</span>
              </div>
              {openNow !== null && (
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                  openNow
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", openNow ? "bg-emerald-500" : "bg-slate-400")} />
                  {openNow ? "Otvoreno" : "Zatvoreno"}
                </span>
              )}
            </motion.div>
          )}

          {/* Action buttons */}
          <div className={cn(
            "mt-6 flex flex-wrap items-center gap-3",
            mode === "header" && "flex-col items-stretch"
          )}>
            <PrimaryButton
              onClick={handleChatClick}
              disabled={actionsDisabled}
              className="flex-1 min-w-[140px]"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={2} />
              Pošalji poruku
            </PrimaryButton>

            {canMakeOffer && itemId && (
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOfferClick}
                disabled={actionsDisabled}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3",
                  "bg-gradient-to-r from-emerald-600 to-teal-600",
                  "text-white text-sm font-semibold",
                  "shadow-lg shadow-emerald-500/25",
                  "hover:shadow-xl hover:shadow-emerald-500/30",
                  "transition-all duration-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <HandCoins className="h-5 w-5" strokeWidth={2} />
                Pošalji ponudu
              </motion.button>
            )}

            {contactStyle === "sheet" ? (
              <IconButton onClick={handlePhoneClick} disabled={actionsDisabled}>
                <Phone className="h-5 w-5" strokeWidth={2} />
              </IconButton>
            ) : (
              <>
                {settings?.show_phone && seller?.mobile && (
                  <IconButton
                    as="a"
                    href={`tel:${seller.mobile}`}
                    onClick={handlePhoneClick}
                    disabled={actionsDisabled}
                  >
                    <Phone className="h-5 w-5 text-emerald-500" strokeWidth={2} />
                  </IconButton>
                )}
                {settings?.show_whatsapp && (settings?.whatsapp_number || seller?.mobile) && (
                  <IconButton
                    as="a"
                    href={`https://wa.me/${String(settings?.whatsapp_number || seller?.mobile).replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    disabled={actionsDisabled}
                  >
                    <MessageCircle className="h-5 w-5 text-green-500" strokeWidth={2} />
                  </IconButton>
                )}
              </>
            )}
          </div>

          {/* Profile link */}
          {mode === "compact" && showProfileLink && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
            >
              <CustomLink
                href={`/seller/${seller?.id}`}
                className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Pogledaj profil
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </CustomLink>
            </motion.div>
          )}
        </div>
      </GlassCard>
    </>
  );
};

/* =====================
  Accordion
===================== */

const useLocalStorageState = (key, initialValue) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(raw);
    } catch {}
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpenId(isOpen ? "" : id)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors",
          "hover:bg-slate-50/80 dark:hover:bg-slate-800/60",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
        )}
      >
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 text-slate-600 dark:text-slate-300">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
      setTimeout(() => setCopied(false), 1500);
      toast.success("Link kopiran");
    } catch {
      toast.error("Kopiranje nije uspjelo");
    }
  };

  return (
    <motion.a
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-2xl",
        "border border-slate-200/70 dark:border-slate-700/60",
        "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
        "px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200",
        "hover:border-blue-300 dark:hover:border-blue-700",
        "hover:shadow-md transition-all duration-200"
      )}
    >
      <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" strokeWidth={2} />
      <span className="truncate max-w-[8rem]">{label}</span>

      <button
        type="button"
        onClick={copy}
        className={cn(
          "ml-1 p-1.5 rounded-lg",
          "hover:bg-slate-100 dark:hover:bg-slate-700",
          "opacity-0 group-hover:opacity-100 transition-opacity"
        )}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Copy className="h-4 w-4 text-slate-400" />
        )}
      </button>
    </motion.a>
  );
};

/* =====================
  Main ProductSellerDetailCard
===================== */

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
  itemId,
  itemPrice,
  acceptsOffers = false,
}) => {
  const settings = sellerSettings || {};
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

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

  const canMakeOffer = acceptsOffers || settings?.accepts_offers;

  const handleChatClick = () => {
    if (onChatClick) {
      onChatClick();
    } else {
      setIsMessageModalOpen(true);
    }
  };

  if (!seller) return <SellerPreviewSkeleton />;

  return (
    <div className="space-y-4">
      <SendMessageModal
        open={isMessageModalOpen}
        setOpen={setIsMessageModalOpen}
        seller={seller}
        itemId={itemId}
      />

      <SendOfferModal
        open={isOfferModalOpen}
        setOpen={setIsOfferModalOpen}
        seller={seller}
        itemId={itemId}
        itemPrice={itemPrice}
      />

      <SellerPreviewCard
        seller={seller}
        sellerSettings={settings}
        badges={badges}
        ratings={ratings}
        isPro={isPro}
        isShop={isShop}
        mode="header"
        showProfileLink={false}
        onChatClick={handleChatClick}
        onPhoneClick={() => setIsContactSheetOpen(true)}
        uiPrefs={{ contactStyle: "sheet" }}
        itemId={itemId}
        itemPrice={itemPrice}
        acceptsOffers={canMakeOffer}
      />

      {/* Contact accordion */}
      <AccordionSection
        id="contact"
        title="Kontakt"
        icon={Phone}
        openId={openId}
        setOpenId={setOpenId}
      >
        <div className="flex flex-wrap gap-3">
          <SecondaryButton onClick={() => setIsContactSheetOpen(true)}>
            <Phone className="h-5 w-5" strokeWidth={2} />
            Kontakt opcije
          </SecondaryButton>

          <PrimaryButton onClick={handleChatClick}>
            <MessageCircle className="h-5 w-5" strokeWidth={2} />
            Pošalji poruku
          </PrimaryButton>

          {canMakeOffer && itemId && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsOfferModalOpen(true)}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5",
                "bg-gradient-to-r from-emerald-600 to-teal-600",
                "text-white text-sm font-semibold",
                "shadow-md hover:shadow-lg transition-all"
              )}
            >
              <HandCoins className="h-5 w-5" strokeWidth={2} />
              Pošalji ponudu
            </motion.button>
          )}
        </div>

        {hasSocialLinks && (
          <div className="mt-5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
              Društvene mreže
            </div>
            <div className="flex flex-wrap gap-2">
              {socialFacebook && <SocialPill icon={Users} label="Facebook" href={socialFacebook} />}
              {socialInstagram && <SocialPill icon={Camera} label="Instagram" href={socialInstagram} />}
              {socialTiktok && <SocialPill icon={Music2} label="TikTok" href={socialTiktok} />}
              {socialYoutube && <SocialPill icon={Play} label="YouTube" href={socialYoutube} />}
              {socialWebsite && <SocialPill icon={Globe} label="Web stranica" href={socialWebsite} />}
            </div>
          </div>
        )}
      </AccordionSection>

      {/* Business hours accordion */}
      {showHours && (
        <AccordionSection
          id="hours"
          title="Radno vrijeme"
          icon={Clock}
          openId={openId}
          setOpenId={setOpenId}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Danas</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {todayHoursText}
                </span>
                {openNow !== null && (
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                    openNow
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", openNow ? "bg-emerald-500" : "bg-slate-400")} />
                    {openNow ? "Otvoreno" : "Zatvoreno"}
                  </span>
                )}
              </div>
            </div>

            {tomorrowHoursText && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Sutra</span>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {tomorrowHoursText}
                </span>
              </div>
            )}
          </div>
        </AccordionSection>
      )}

      {/* Info accordion */}
      {(shippingInfo || returnPolicy || businessDescription) && (
        <AccordionSection
          id="info"
          title="Informacije"
          icon={Shield}
          openId={openId}
          setOpenId={setOpenId}
        >
          <div className="space-y-4">
            {shippingInfo && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100/50 dark:border-blue-800/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  <Zap className="h-4 w-4" />
                  Dostava
                </div>
                <p className="text-sm text-blue-700/80 dark:text-blue-300/80 whitespace-pre-line">
                  {shippingInfo}
                </p>
              </div>
            )}

            {returnPolicy && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100/50 dark:border-amber-800/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  <Shield className="h-4 w-4" />
                  Povrat
                </div>
                <p className="text-sm text-amber-700/80 dark:text-amber-300/80 whitespace-pre-line">
                  {returnPolicy}
                </p>
              </div>
            )}

            {businessDescription && (
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/30">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  O prodavaču
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
                  {businessDescription}
                </p>
              </div>
            )}
          </div>
        </AccordionSection>
      )}

      {/* Profile link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <CustomLink
          href={`/seller/${seller?.id}`}
          onClick={onProfileClick}
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Pogledaj kompletan profil
          <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </CustomLink>
      </motion.div>

      <ContactSheet
        open={isContactSheetOpen}
        setOpen={setIsContactSheetOpen}
        seller={seller}
        settings={settings}
        actionsDisabled={false}
        onPhoneReveal={onPhoneReveal}
        onChatClick={handleChatClick}
      />
    </div>
  );
};

export default ProductSellerDetailCard;
