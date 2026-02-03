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
  Loader2,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import { itemConversationApi } from "@/utils/api";
import CustomImage from "@/components/Common/CustomImage";

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
      if (seller?.id && String(currentUser.id) === String(seller.id)) {
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
            setConversation({
              id: conversationId,
              lastMessage: data.last_message || data.message,
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
  }, [itemId, currentUser?.id, isLoggedIn, seller?.id]);

  const handleGoToChat = () => {
    if (conversation?.id) {
      router.push(`/chat?chatid=${conversation.id}`);
    }
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
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50",
          "dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-indigo-950/40",
          "border border-indigo-200/60 dark:border-indigo-800/40",
          "shadow-lg shadow-indigo-500/10 dark:shadow-indigo-900/20",
          "p-4"
        )}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-transparent rounded-full blur-2xl" />

        {/* Dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <X size={16} className="text-slate-400" />
        </button>

        <div className="relative flex items-center gap-4">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-indigo-500 to-blue-600",
            "shadow-lg shadow-indigo-500/30"
          )}>
            <MessageCircle size={24} className="text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
              Imate aktivan razgovor
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
              {conversation.lastMessage
                ? `Zadnja poruka: "${conversation.lastMessage.substring(0, 40)}${conversation.lastMessage.length > 40 ? '...' : ''}"`
                : "Razgovor je započet"
              }
            </p>

            {/* Offer status if exists */}
            {conversation.hasOffer && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  conversation.offerStatus === 'accepted'
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : conversation.offerStatus === 'rejected'
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                )}>
                  {conversation.offerStatus === 'accepted' && <CheckCircle2 size={12} />}
                  {conversation.offerStatus === 'pending' && <Clock size={12} />}
                  Ponuda: {conversation.offerAmount} KM
                </span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoToChat}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl",
              "bg-indigo-600 hover:bg-indigo-700",
              "text-white text-sm font-semibold",
              "shadow-lg shadow-indigo-500/25",
              "transition-colors duration-200"
            )}
          >
            Otvori chat
            <ArrowRight size={16} />
          </motion.button>
        </div>

        {/* Unread badge */}
        {conversation.unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <span className="text-white text-xs font-bold">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ExistingConversationBanner;
