"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "sonner";

// Lucide ikone
import {
  User as UserCircle,
  BadgeCheck as Verified,
  Star,
  Calendar,
  Clock,
  Phone,
  MessageCircle as ChatRound,
  Mail as Letter,
  Share2 as Share,
  Copy,
  CheckCircle2 as CheckCircle,
  XCircle as CloseCircle,
  Building2 as Buildings2,
  Crown,
  Zap as Lightning,
  Shield,
  MapPin as MapPoint,
  Globe as Global,
  Camera,
  Play,
  Music2 as MusicNote2,
  Users,
  ArrowRight,
  Link as LinkIcon,
  Send as Send2,
  Banknote as HandMoney,
  Info as InfoCircle,
  RefreshCw as Refresh,
  Tag,
  Loader2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import GamificationBadge from "@/components/PagesComponent/Gamification/Badge";
import { formatResponseTimeBs } from "@/utils/index";
import { itemConversationApi, sendMessageApi, itemOfferApi } from "@/utils/api";

/* =====================================================
   ANIMACIJE I STILOVI
===================================================== */

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
};

/* Removed shimmer effects for cleaner design */

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

/* =====================================================
   UI KOMPONENTE
===================================================== */

const GlassCard = ({ children, className, ...props }) => (
  <motion.div
    {...fadeInUp}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className={cn(
      "relative overflow-hidden rounded-2xl",
      "bg-white dark:bg-slate-900",
      "border border-slate-200 dark:border-slate-800",
      "shadow-sm hover:shadow-md",
      "transition-shadow duration-250",
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);

const IconPill = ({ icon: Icon, children, className, tone = "default" }) => {
  const toneStyles = {
    default: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    success: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    info: "border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneStyles[tone],
        className
      )}
    >
      {Icon && <Icon size={13} />}
      {children}
    </motion.span>
  );
};

const StatusBadge = ({ children, variant = "default", icon: Icon }) => {
  const variants = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700",
    pro: "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/30 dark:via-orange-900/25 dark:to-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200/60 dark:border-amber-700/40",
    shop: "bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-900/30 dark:via-blue-900/25 dark:to-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-200/60 dark:border-indigo-700/40",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm",
        variants[variant]
      )}
    >
      {Icon && <Icon size={12} />}
      {children}
    </motion.span>
  );
};

const PrimaryButton = ({ children, className, isLoading, disabled, ...props }) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    disabled={disabled || isLoading}
    className={cn(
      "group relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3",
      "bg-slate-900 dark:bg-white",
      "text-white dark:text-slate-900 text-sm font-semibold",
      "shadow-sm hover:shadow-md",
      "transition-all duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    {...props}
  >
    {isLoading ? (
      <Refresh size={18} className="animate-spin" />
    ) : (
      children
    )}
  </motion.button>
);

const SecondaryButton = ({ children, className, ...props }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5",
      "bg-slate-100 dark:bg-slate-800",
      "text-slate-700 dark:text-slate-200 text-sm font-medium",
      "border border-slate-200 dark:border-slate-700",
      "hover:bg-slate-200 dark:hover:bg-slate-700",
      "shadow-sm hover:shadow",
      "transition-all duration-200",
      className
    )}
    {...props}
  >
    {children}
  </motion.button>
);

const IconButton = React.forwardRef(
  ({ children, className, active, as, href, disabled, onClick, ...props }, ref) => {
    const isLink = as === "a" || typeof href === "string";
    const Comp = isLink ? motion.a : motion.button;

    const handleClick = (e) => {
      if (disabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick?.(e);
    };

    return (
      <Comp
        ref={ref}
        whileHover={disabled ? undefined : { scale: 1.05 }}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        href={isLink ? href : undefined}
        onClick={handleClick}
        aria-disabled={disabled ? true : undefined}
        tabIndex={disabled && isLink ? -1 : undefined}
        className={cn(
          "inline-flex items-center justify-center w-10 h-10 rounded-xl",
          "bg-white dark:bg-slate-900",
          "border border-slate-200 dark:border-slate-700",
          "text-slate-600 dark:text-slate-300",
          "hover:bg-slate-50 dark:hover:bg-slate-800",
          "hover:text-slate-900 dark:hover:text-white",
          "shadow-sm hover:shadow",
          "transition-all duration-200",
          active && "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
        {...(!isLink ? { disabled } : {})}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
IconButton.displayName = "IconButton";

/* =====================================================
   SKELETON KOMPONENTA
===================================================== */

export const SellerPreviewSkeleton = ({ compactness = "normal" }) => {
  const c = compactnessMap[compactness] || compactnessMap.normal;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className={cn("relative", c.pad)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="rounded-full p-1 bg-slate-200 dark:bg-slate-700 shrink-0">
              <div className={cn(c.avatar, "rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse")} />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-6 w-44 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <div className="h-8 w-28 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-8 w-32 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   MODAL ZA SLANJE PORUKE
===================================================== */

const SendMessageModal = ({ open, setOpen, seller, itemId, onSuccess }) => {
  const router = useRouter();
  const currentUser = useSelector(userSignUpData);
  const isLoggedIn = useSelector(getIsLoggedIn);

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMessage("");
      setError("");
    }
  }, [open]);

  const handleSend = async () => {
    // Izvuci seller ID PRIJE svega
    const sellerUserId = seller?.user_id ?? seller?.id;

    console.log("📤 SendMessageModal - Starting send:", {
      itemId,
      sellerUserId,
      message: message.trim(),
      currentUserId: currentUser?.id
    });

    // Validacija
    if (!message.trim()) {
      setError("Molimo unesite poruku prije slanja.");
      return;
    }

    if (!isLoggedIn || !currentUser?.id) {
      toast.error("Morate biti prijavljeni da biste poslali poruku.");
      router.push("/login");
      return;
    }

    if (!sellerUserId) {
      setError("Greška: Prodavač nije pronađen.");
      return;
    }

    if (currentUser?.id && String(currentUser.id) === String(sellerUserId)) {
      setError("Ne možete slati poruku sami sebi.");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      let conversationId = null;

      // Helper za izvlačenje conversation ID iz responsa
      const extractConversationId = (data) => {
        const id = data?.conversation_id || data?.item_offer_id || data?.id || null;
        console.log("📋 extractConversationId:", { data, extractedId: id });
        return id;
      };

      // Ako imamo item_id, provjeri konverzaciju za taj proizvod
      if (itemId) {
        console.log("🔍 Checking item conversation for item_id:", itemId);
        const checkRes = await itemConversationApi.checkConversation({ item_id: itemId });
        console.log("📥 checkConversation response:", checkRes?.data);

        if (checkRes?.data?.error === false && extractConversationId(checkRes?.data?.data)) {
          conversationId = extractConversationId(checkRes.data.data);
          console.log("✅ Found existing conversation:", conversationId);
        } else {
          // Kreiraj novu konverzaciju za proizvod
          console.log("🆕 Starting new item conversation for item_id:", itemId);
          const startRes = await itemConversationApi.startItemConversation({ item_id: itemId });
          console.log("📥 startItemConversation response:", startRes?.data);

          if (startRes?.data?.error === false) {
            conversationId = extractConversationId(startRes.data.data);
            console.log("✅ Created new conversation:", conversationId);
          } else {
            throw new Error(startRes?.data?.message || "Nije moguće pokrenuti razgovor o proizvodu.");
          }
        }
      } else {
        // Direktna konverzacija sa prodavačem
        console.log("🔍 Checking direct conversation for user_id:", sellerUserId);
        const checkRes = await itemConversationApi.checkDirectConversation({ user_id: sellerUserId });
        console.log("📥 checkDirectConversation response:", checkRes?.data);

        if (checkRes?.data?.error === false && extractConversationId(checkRes?.data?.data)) {
          conversationId = extractConversationId(checkRes.data.data);
          console.log("✅ Found existing direct conversation:", conversationId);
        } else {
          console.log("🆕 Starting new direct conversation for user_id:", sellerUserId);
          const startRes = await itemConversationApi.startDirectConversation({ user_id: sellerUserId });
          console.log("📥 startDirectConversation response:", startRes?.data);

          if (startRes?.data?.error === false) {
            conversationId = extractConversationId(startRes.data.data);
            console.log("✅ Created new direct conversation:", conversationId);
          } else {
            throw new Error(startRes?.data?.message || "Nije moguće pokrenuti razgovor.");
          }
        }
      }

      if (!conversationId) {
        throw new Error("Nije moguće kreirati razgovor.");
      }

      // Pošalji poruku
      console.log("📤 Sending message to conversation:", conversationId);
      const sendRes = await sendMessageApi.sendMessage({
        item_offer_id: conversationId,
        message: message.trim(),
      });
      console.log("📥 sendMessage response:", sendRes?.data);

      if (sendRes?.data?.error === false) {
        toast.success("Poruka je uspješno poslana!");
        setMessage("");
        setOpen(false);
        onSuccess?.();
        // ISPRAVKA: Koristi chatid umjesto id
        // router.push(`/chat?chatid=${conversationId}`);
      } else {
        throw new Error(sendRes?.data?.message || "Greška pri slanju poruke.");
      }
    } catch (err) {
      console.error("❌ Greška pri slanju poruke:", err);
      console.error("❌ Error response:", err?.response?.data);
      const errorMessage = err?.response?.data?.message || err?.message || "Došlo je do greške pri slanju poruke.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 rounded-[28px] p-0 overflow-hidden shadow-2xl">
        <motion.div {...fadeInUp} transition={{ duration: 0.4 }} className="p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-200/60 dark:border-slate-700/60 shadow-lg">
                  <CustomImage
                    src={seller?.profile || seller?.profile_image}
                    alt={seller?.name || "Prodavač"}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                {seller?.is_verified && (
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-lg p-0.5 shadow-md">
                    <Verified size={18} className="text-sky-500" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pošalji poruku
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {seller?.name || "Prodavač"}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setOpen(false)}
              className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <CloseCircle size={20} className="text-slate-500" />
            </motion.button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
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
                  "w-full rounded-2xl border bg-white/90 dark:bg-slate-800/90",
                  "px-4 py-3.5 text-sm text-slate-900 dark:text-white",
                  "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                  "focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500",
                  "transition-all duration-250 resize-none",
                  error ? "border-red-300 dark:border-red-700" : "border-slate-200/70 dark:border-slate-700/70"
                )}
              />
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="mt-2.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-2"
                  >
                    <InfoCircle size={16} />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <SecondaryButton type="button" onClick={() => setOpen(false)}>
                Odustani
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={handleSend}
                isLoading={isSending}
                disabled={!message.trim()}
              >
                <Send2 size={18} />
                Pošalji poruku
              </PrimaryButton>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================================================
   MODAL ZA SLANJE PONUDE
===================================================== */

const SendOfferModal = ({ open, setOpen, seller, itemId, itemPrice, onSuccess }) => {
  const router = useRouter();
  const currentUser = useSelector(userSignUpData);
  const isLoggedIn = useSelector(getIsLoggedIn);

  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setError("");
    }
  }, [open]);

  const handleSend = async () => {
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Molimo unesite validan iznos ponude.");
      return;
    }

    if (!isLoggedIn || !currentUser?.id) {
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

    console.log("📤 SendOfferModal - Sending offer:", { itemId, amount: numAmount });

    try {
      const res = await itemOfferApi.offer({
        item_id: itemId,
        amount: numAmount,
      });

      console.log("📥 itemOffer response:", res?.data);

      if (res?.data?.error === false) {
        toast.success("Ponuda je uspješno poslana!");
        setAmount("");
        setOpen(false);
        onSuccess?.();

        // Izvuci conversation ID iz bilo kojeg mogućeg polja
        const data = res?.data?.data;
        const conversationId = data?.conversation_id || data?.item_offer_id || data?.id;
        console.log("✅ Offer created, conversation ID:", conversationId);
        if (conversationId) {
          // ISPRAVKA: Koristi chatid umjesto id
          // router.push(`/chat?chatid=${conversationId}`);
        }
      } else {
        throw new Error(res?.data?.message || "Greška pri slanju ponude.");
      }
    } catch (err) {
      console.error("Greška pri slanju ponude:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Došlo je do greške pri slanju ponude.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 rounded-[28px] p-0 overflow-hidden shadow-2xl">
        <motion.div {...fadeInUp} transition={{ duration: 0.4 }} className="p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border border-emerald-200/50 dark:border-emerald-700/40 shadow-lg">
                <HandMoney size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pošalji ponudu
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {seller?.name || "Prodavač"}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setOpen(false)}
              className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <CloseCircle size={20} className="text-slate-500" />
            </motion.button>
          </div>

          {itemPrice && (
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-slate-50/90 to-slate-100/90 dark:from-slate-800/70 dark:to-slate-800/50 border border-slate-200/50 dark:border-slate-700/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Tag size={16} />
                  Trenutna cijena
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {typeof itemPrice === 'number' ? `${itemPrice.toFixed(2)} KM` : itemPrice}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
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
                    "w-full rounded-2xl border bg-white/90 dark:bg-slate-800/90",
                    "px-4 py-3.5 pr-14 text-lg font-bold text-slate-900 dark:text-white",
                    "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500",
                    "transition-all duration-250",
                    error ? "border-red-300 dark:border-red-700" : "border-slate-200/70 dark:border-slate-700/70"
                  )}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  KM
                </span>
              </div>
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="mt-2.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-2"
                  >
                    <InfoCircle size={16} />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <SecondaryButton type="button" onClick={() => setOpen(false)}>
                Odustani
              </SecondaryButton>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleSend}
                disabled={isSending || !amount}
                className={cn(
                  "inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5",
                  "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600",
                  "text-white text-sm font-semibold tracking-wide",
                  "shadow-xl shadow-emerald-500/25",
                  "hover:shadow-2xl hover:shadow-emerald-500/35",
                  "transition-all duration-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSending ? (
                  <Refresh size={20} className="animate-spin" />
                ) : (
                  <>
                    <HandMoney size={18} />
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

/* =====================================================
   CONTACT SHEET MODAL
===================================================== */

const ContactSheet = ({
  open,
  setOpen,
  seller,
  settings,
  actionsDisabled,
  onPhoneReveal,
  onChatClick,
  onWhatsAppClick,
  onViberClick,
}) => {
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
      setTimeout(() => setCopiedKey(""), 2000);
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
      bgColor: "bg-emerald-50 dark:bg-emerald-900/25",
      borderColor: "border-emerald-100 dark:border-emerald-800/40",
      label: "Pozovi",
      value: phone,
      href: `tel:${phone}`,
      onClick: onPhoneReveal,
      copyable: true,
    },
    {
      key: "whatsapp",
      show: showWhatsapp && whatsappNumber,
      icon: ChatRound,
      iconColor: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/25",
      borderColor: "border-green-100 dark:border-green-800/40",
      label: "WhatsApp",
      value: whatsappNumber,
      href: `https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}`,
      external: true,
      onClick: onWhatsAppClick,
    },
    {
      key: "viber",
      show: showViber && viberNumber,
      icon: Phone,
      iconColor: "text-violet-500",
      bgColor: "bg-violet-50 dark:bg-violet-900/25",
      borderColor: "border-violet-100 dark:border-violet-800/40",
      label: "Viber",
      value: viberNumber,
      href: `viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`,
      onClick: onViberClick,
    },
    {
      key: "email",
      show: showEmail && email,
      icon: Letter,
      iconColor: "text-sky-500",
      bgColor: "bg-sky-50 dark:bg-sky-900/25",
      borderColor: "border-sky-100 dark:border-sky-800/40",
      label: "Email",
      value: email,
      href: `mailto:${email}`,
      copyable: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 rounded-[28px] p-0 overflow-hidden shadow-2xl">
        <motion.div {...fadeInUp} transition={{ duration: 0.4 }} className="p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Kontaktiraj prodavača
              </h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Odaberi način kontaktiranja
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setOpen(false)}
              className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <CloseCircle size={20} className="text-slate-500" />
            </motion.button>
          </div>

          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
            {contactMethods.map((method, idx) => {
              if (!method.show) return null;

              const Icon = method.icon;

              return (
                <motion.div
                  key={method.key}
                  variants={fadeInUp}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-2.5"
                >
                  <a
                    href={method.href}
                    target={method.external ? "_blank" : undefined}
                    rel={method.external ? "noreferrer" : undefined}
                    onClick={() => method.onClick?.()}
                    className={cn(
                      "flex-1 flex items-center gap-3.5 p-4 rounded-2xl",
                      "border",
                      method.borderColor,
                      "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
                      "hover:bg-slate-50 dark:hover:bg-slate-700/80",
                      "hover:border-slate-300 dark:hover:border-slate-600",
                      "transition-all duration-250",
                      "shadow-sm hover:shadow-md",
                      actionsDisabled && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className={cn("p-3 rounded-xl border", method.bgColor, method.borderColor)}>
                      <Icon size={20} className={method.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {method.label}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {method.value}
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-400 flex-shrink-0" />
                  </a>

                  {method.copyable && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => copy(method.key, method.value)}
                      className={cn(
                        "p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70",
                        "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm",
                        "hover:bg-slate-50 dark:hover:bg-slate-700",
                        "transition-all duration-200 shadow-sm hover:shadow-md"
                      )}
                    >
                      {copiedKey === method.key ? (
                        <CheckCircle size={18} className="text-emerald-500" />
                      ) : (
                        <Copy size={18} className="text-slate-400" />
                      )}
                    </motion.button>
                  )}
                </motion.div>
              );
            })}

            <motion.button
              variants={fadeInUp}
              type="button"
              onClick={() => {
                onChatClick?.();
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 p-4 rounded-2xl mt-4",
                "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600",
                "text-white font-semibold",
                "shadow-xl shadow-indigo-500/25",
                "hover:shadow-2xl hover:shadow-indigo-500/35",
                "transition-all duration-300"
              )}
            >
              <ChatRound size={20} />
              Pošalji poruku
            </motion.button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================================================
   SELLER PREVIEW CARD
===================================================== */

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
  const contactStyle = prefs.contactStyle || settings?.card_preferences?.contactStyle || settings?.contact_style || "inline";

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
        <div className={cn("relative z-10", c.pad)}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar */}
              <div className="relative shrink-0">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <CustomImage
                    src={seller?.profile || seller?.profile_image}
                    alt={seller?.name || "Prodavač"}
                    width={64}
                    height={64}
                    className={cn(c.avatar, "object-cover")}
                  />
                </motion.div>

                {seller?.is_verified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
                    className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700"
                  >
                    <Verified size={16} className="text-sky-500" />
                  </motion.div>
                )}
              </div>

              {/* Name & badges */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className={cn("font-bold text-slate-900 dark:text-white truncate", c.name)}>
                    {seller?.name}
                  </h3>
                  {isPro && (
                    <StatusBadge variant="pro" icon={Crown}>Pro</StatusBadge>
                  )}
                  {isShop && (
                    <StatusBadge variant="shop" icon={Buildings2}>Trgovina</StatusBadge>
                  )}
                </div>

                {/* Meta info */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {showRatings && ratingValue && (
                    <IconPill icon={Star} tone="warning">
                      {ratingValue} ({ratingCount})
                    </IconPill>
                  )}
                  {responseLabel && (
                    <IconPill icon={Lightning} tone="info">
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
                  <Share size={18} />
                </IconButton>
              </ShareDropdown>
            )}
          </div>

          {/* Business hours (for shops) */}
          {showHours && todayHoursText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-5 flex items-center justify-between p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/40"
            >
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <Clock size={16} />
                <span>Danas: <strong className="text-slate-900 dark:text-white">{todayHoursText}</strong></span>
              </div>
              {openNow !== null && (
                <span className={cn(
                  "inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full",
                  openNow
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/40"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-300/50 dark:border-slate-600/50"
                )}>
                  <span className={cn("h-2 w-2 rounded-full", openNow ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
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
              <ChatRound size={18} />
              Pošalji poruku
            </PrimaryButton>

            {canMakeOffer && itemId && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOfferClick}
                disabled={actionsDisabled}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3",
                  "bg-emerald-600 hover:bg-emerald-700",
                  "text-white text-sm font-semibold",
                  "shadow-sm hover:shadow-md",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <HandMoney size={18} />
                Pošalji ponudu
              </motion.button>
            )}

            {contactStyle === "sheet" ? (
              <IconButton onClick={handlePhoneClick} disabled={actionsDisabled}>
                <Phone size={18} />
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
                    <Phone size={18} className="text-emerald-500" />
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
                    <ChatRound size={18} className="text-green-500" />
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
              transition={{ delay: 0.4 }}
              className="mt-5"
            >
              <CustomLink
                href={`/seller/${seller?.id}`}
                className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Pogledaj profil
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </CustomLink>
            </motion.div>
          )}
        </div>
      </GlassCard>
    </>
  );
};

/* =====================================================
   ACCORDION KOMPONENTE
===================================================== */

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] border border-slate-200/60 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden shadow-lg"
    >
      <button
        type="button"
        onClick={() => setOpenId(isOpen ? "" : id)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors",
          "hover:bg-slate-50/90 dark:hover:bg-slate-800/70",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30"
        )}
      >
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <Icon size={20} />
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ArrowRight size={18} className="rotate-90 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
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
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link kopiran");
    } catch {
      toast.error("Kopiranje nije uspjelo");
    }
  };

  return (
    <motion.a
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group relative inline-flex items-center gap-2.5 rounded-2xl",
        "border border-slate-200/60 dark:border-slate-700/50",
        "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm",
        "px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200",
        "hover:border-indigo-300 dark:hover:border-indigo-700",
        "hover:shadow-lg transition-all duration-250"
      )}
    >
      <Icon size={18} className="text-slate-500 dark:text-slate-400" />
      <span className="truncate max-w-[8rem]">{label}</span>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={copy}
        className={cn(
          "ml-1 p-1.5 rounded-lg",
          "hover:bg-slate-100 dark:hover:bg-slate-700",
          "opacity-0 group-hover:opacity-100 transition-opacity"
        )}
      >
        {copied ? (
          <CheckCircle size={14} className="text-emerald-500" />
        ) : (
          <Copy size={14} className="text-slate-400" />
        )}
      </motion.button>
    </motion.a>
  );
};

/* =====================================================
   GLAVNI PRODUCT SELLER DETAIL CARD
===================================================== */

const ProductSellerDetailCard = ({
  productDetails,
  setProductDetails,
  seller: sellerProp,
  ratings: ratingsProp,
  badges,
  sellerSettings,
  isPro: isProProp = false,
  isShop: isShopProp = false,
  onChatClick,
  onProfileClick,
  onPhoneReveal,
  onPhoneClick,
  onWhatsAppClick,
  onViberClick,
  onMessageClick,
  itemId: itemIdProp,
  itemPrice: itemPriceProp,
  acceptsOffers: acceptsOffersProp = false,
}) => {
  // Izvuci seller iz productDetails ili koristi direktni prop
  const seller = sellerProp || productDetails?.user;
  const ratings = ratingsProp || productDetails?.ratings;
  const isPro = isProProp || productDetails?.user?.is_pro;
  const isShop = isShopProp || productDetails?.user?.is_shop;
  const itemId = itemIdProp || productDetails?.id;
  const itemPrice = itemPriceProp || productDetails?.price;
  const acceptsOffers = acceptsOffersProp || productDetails?.accepts_offers || sellerSettings?.accepts_offers;

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
    onMessageClick?.();
    if (onChatClick) {
      onChatClick();
    } else {
      setIsMessageModalOpen(true);
    }
  };

  const handlePhoneReveal = () => {
    onPhoneReveal?.();
    onPhoneClick?.();
    setIsContactSheetOpen(true);
  };

  if (!seller) return <SellerPreviewSkeleton />;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
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
        onPhoneClick={handlePhoneReveal}
        uiPrefs={{ contactStyle: "sheet" }}
        itemId={itemId}
        itemPrice={itemPrice}
        acceptsOffers={canMakeOffer}
      />

      {/* Profile link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <CustomLink
          href={`/seller/${seller?.id}`}
          onClick={onProfileClick}
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Pogledaj kompletan profil
          <LinkIcon size={16} className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
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
        onWhatsAppClick={onWhatsAppClick}
        onViberClick={onViberClick}
      />
    </motion.div>
  );
};

export default ProductSellerDetailCard;