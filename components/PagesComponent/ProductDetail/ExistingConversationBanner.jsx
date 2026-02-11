"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import { itemConversationApi } from "@/utils/api";

/**
 * ExistingConversationBanner - Prikazuje banner ako korisnik ima postojeći razgovor
 * o ovom proizvodu. Koristi se na stranici oglasa.
 */
const ExistingConversationBanner = ({ itemId, seller }) => {
  const router = useRouter();
  const currentUser = useSelector(userSignUpData);
  const isLoggedIn = useSelector(getIsLoggedIn);

  const [conversation, setConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkExistingConversation = async () => {
      // Ako korisnik nije prijavljen ili nema itemId, ne provjervaj
      if (!isLoggedIn || !currentUser?.id || !itemId) {
        setIsLoading(false);
        return;
      }

      // Ako je korisnik vlasnik oglasa, ne prikazuj
      const sellerId = seller?.user_id || seller?.id;
      if (sellerId && String(currentUser.id) === String(sellerId)) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await itemConversationApi.checkConversation({ item_id: itemId });

        if (res?.data?.error === false && res?.data?.data) {
          const data = res.data.data;
          // Provjeri da li postoji conversation_id, item_offer_id ili id
          const conversationId = data.conversation_id || data.item_offer_id || data.id;

          if (conversationId) {
            const rawLastMessage = data.last_message || data.message;
            const normalizedLastMessage =
              typeof rawLastMessage === "string"
                ? rawLastMessage
                : rawLastMessage?.message || "";

            setConversation({
              id: conversationId,
              lastMessage: normalizedLastMessage,
              lastMessageTime: data.updated_at || data.created_at,
              unreadCount: data.unread_count || 0,
              hasOffer: data.has_offer || data.offer_amount > 0,
              offerAmount: data.offer_amount,
              offerStatus: data.offer_status,
            });
          }
        }
      } catch (err) {
        console.error("Error checking existing conversation:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingConversation();
  }, [itemId, currentUser?.id, isLoggedIn, seller?.id, seller?.user_id]);

  const handleGoToChat = () => {
    if (conversation?.id) {
      router.push(`/chat?chatid=${conversation.id}`);
    }
  };

  const formatLastMessageTime = (dateValue) => {
    if (!dateValue) return "Upravo sada";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Upravo sada";

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / (1000 * 60)));

    if (diffMin < 60) return `Prije ${diffMin} min`;
    if (diffMin < 1440) return `Prije ${Math.floor(diffMin / 60)} h`;
    if (diffMin < 10080) return `Prije ${Math.floor(diffMin / 1440)} dana`;

    const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];
    return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}.`;
  };

  // Ne prikazuj ako nema konverzacije, ako je učitavanje u toku, ili ako je korisnik zatvorio banner
  if (isLoading || !conversation || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden rounded-2xl border p-4 sm:p-5",
          "border-slate-200/80 dark:border-slate-800",
          "bg-white/95 dark:bg-slate-900/85 backdrop-blur-sm",
          "shadow-[0_16px_36px_-28px_rgba(15,23,42,0.5)]"
        )}
      >
        {/* Soft ambient */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-14 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-300/10" />
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-lg border border-slate-200/70 bg-white/80 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          aria-label="Zatvori zadnje poruke"
        >
          <X size={15} />
        </button>

        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={cn(
                  "flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center",
                  "bg-primary/10 text-primary border border-primary/20"
                )}
              >
                <MessageCircle size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Zadnje poruke
                </p>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Već imate aktivan razgovor za ovaj oglas
                </h4>
              </div>
            </div>

            {conversation.unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:border-red-800/40 dark:bg-red-900/25 dark:text-red-300">
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount} nepročitano
              </span>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/60 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Posljednja poruka
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2">
              {conversation.lastMessage
                ? conversation.lastMessage
                : "Razgovor je započet. Nastavite gdje ste stali."}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Clock size={13} />
                {formatLastMessageTime(conversation.lastMessageTime)}
              </span>

              {conversation.hasOffer && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                    conversation.offerStatus === "accepted"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : conversation.offerStatus === "rejected"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  )}
                >
                  {conversation.offerStatus === "accepted" && <CheckCircle2 size={12} />}
                  {conversation.offerStatus === "pending" && <Clock size={12} />}
                  Ponuda: {conversation.offerAmount} KM
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoToChat}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5",
                "bg-primary hover:bg-primary/90 text-white text-sm font-semibold",
                "shadow-[0_14px_28px_-18px_rgba(13,148,136,0.65)] transition-colors duration-200"
              )}
            >
              Nastavi razgovor
              <ArrowRight size={16} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExistingConversationBanner;
