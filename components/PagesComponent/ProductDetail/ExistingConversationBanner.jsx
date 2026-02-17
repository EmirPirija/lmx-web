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
} from "@/components/Common/UnifiedIconPack";

import { cn } from "@/lib/utils";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import { itemConversationApi } from "@/utils/api";

/**
 * ExistingConversationBanner - Prikazuje poruku ako korisnik već ima aktivan razgovor
 * za oglas. Namijenjeno za prikaz unutar contact/messaging sekcije.
 */
const ExistingConversationBanner = ({ itemId, seller, className = "", showDismiss = true }) => {
  const router = useRouter();
  const currentUser = useSelector(userSignUpData);
  const isLoggedIn = useSelector(getIsLoggedIn);

  const [conversation, setConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());

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

  useEffect(() => {
    if (!conversation || isDismissed) return;
    const intervalId = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [conversation, isDismissed]);

  const handleGoToChat = () => {
    if (conversation?.id) {
      router.push(`/chat?chatid=${conversation.id}`);
    }
  };

  const formatLastMessageTime = (dateValue, nowValue = Date.now()) => {
    if (!dateValue) return "Nedavno";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Nedavno";

    const diffMs = Math.max(0, nowValue - date.getTime());
    const diffMin = Math.floor(diffMs / (1000 * 60));

    if (diffMin < 1) return "Prije manje od 1 min";
    if (diffMin < 60) return `Prije ${diffMin} min`;
    if (diffMin < 1440) return `Prije ${Math.floor(diffMin / 60)} h`;
    if (diffMin < 10080) return `Prije ${Math.floor(diffMin / 1440)} dana`;

    const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];
    return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}.`;
  };

  // Ne prikazuj ako nema konverzacije, ako je učitavanje u toku, ili ako je korisnik zatvorio obavijest
  if (isLoading || !conversation || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.99 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={cn(
          "rounded-xl border border-slate-200/80 bg-slate-50/85 p-3 dark:border-slate-700 dark:bg-slate-800/70",
          className
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <MessageCircle size={16} />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Već imate aktivan razgovor za ovaj oglas
            </h4>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                <Clock size={11} />
                {formatLastMessageTime(conversation.lastMessageTime, nowTimestamp)}
              </span>

              {conversation.unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-semibold text-red-600 dark:border-red-800/40 dark:bg-red-900/25 dark:text-red-300">
                  {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount} nepročitano
                </span>
              )}

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
                  {conversation.offerStatus === "accepted" && <CheckCircle2 size={11} />}
                  {conversation.offerStatus === "pending" && <Clock size={11} />}
                  Ponuda: {conversation.offerAmount} KM
                </span>
              )}
            </div>

            <p className="mt-2 line-clamp-2 text-xs text-slate-700 dark:text-slate-200">
              {conversation.lastMessage
                ? conversation.lastMessage
                : "Razgovor je započet. Nastavite gdje ste stali."}
            </p>
          </div>

          {showDismiss ? (
            <button
              onClick={() => setIsDismissed(true)}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Zatvori obavijest razgovora"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        <div className="mt-2.5 flex">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleGoToChat}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2",
              "bg-primary text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary/90"
            )}
          >
            Nastavi razgovor
            <ArrowRight size={14} />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExistingConversationBanner;
