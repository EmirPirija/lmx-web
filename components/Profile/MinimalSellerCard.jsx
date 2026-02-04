"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import { userSignUpData } from "@/redux/reducer/authSlice";
import CustomImage from "@/components/Common/CustomImage";
import CustomLink from "@/components/Common/CustomLink";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import GamificationBadge from "@/components/PagesComponent/Gamification/Badge";
import { formatResponseTimeBs } from "@/utils/index";
import SavedToListButton from "@/components/Profile/SavedToListButton";
import { itemConversationApi, sendMessageApi } from "@/utils/api";

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
   SHARE POPOVER
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

  const shareOptions = [
    {
      name: "Facebook",
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank"),
      color: "hover:bg-blue-50 hover:text-blue-600",
    },
    {
      name: "WhatsApp",
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`, "_blank"),
      color: "hover:bg-green-50 hover:text-green-600",
    },
    {
      name: "Viber",
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.398.002C9.47.028 5.61.46 3.294 2.6 1.244 4.473.319 7.3.126 10.84c-.19 3.543-.24 10.182 6.29 11.838h.005l-.002 2.717s-.047.872.543 1.054c.71.217 1.13-.457 1.81-1.19.374-.404.89-.998 1.28-1.452 3.52.296 6.228-.38 6.535-.48.71-.232 4.726-.745 5.38-6.082.676-5.508-.328-8.99-2.16-10.56l-.003-.002c-.53-.524-2.673-2.433-7.737-2.673 0 0-.376-.024-.87-.008zm.105 1.764c.425-.013.753.007.753.007 4.34.205 6.168 1.74 6.608 2.188l.003.002c1.566 1.343 2.38 4.456 1.794 9.07-.56 4.59-4.016 4.887-4.612 5.08-.255.084-2.607.67-5.622.507 0 0-2.227 2.69-2.922 3.39-.11.11-.238.152-.324.132-.12-.028-.153-.147-.152-.326l.016-3.67c-5.572-1.406-5.25-6.664-5.094-9.593.167-3.037.93-5.39 2.652-6.963 1.98-1.833 5.216-2.185 6.9-2.218zm.2 1.884a.5.5 0 00-.5.51c0 .28.22.5.5.5 1.29.01 2.46.51 3.37 1.46.9.94 1.38 2.2 1.37 3.54 0 .28.22.51.5.51.28 0 .5-.23.5-.52.01-1.53-.53-3-1.58-4.12a5.92 5.92 0 00-3.93-1.88.53.53 0 00-.23-.01zm-.032 1.646a.5.5 0 00-.4.58c.05.28.31.46.58.42.74-.1 1.47.12 2.04.63a2.76 2.76 0 01.95 1.92c.02.28.26.49.54.48.28-.02.5-.26.48-.54-.07-.9-.45-1.72-1.1-2.33a3.58 3.58 0 00-2.59-.88c-.18 0-.36.06-.5.17v.56zm-3.636.42c-.17.01-.34.07-.474.18l-.02.01c-.334.29-.648.61-.937.96-.21.26-.31.57-.306.89a1.1 1.1 0 00.14.41l.01.02c.387.79.86 1.54 1.432 2.22a13.6 13.6 0 002.614 2.59l.036.027a13.5 13.5 0 003.36 1.94l.026.01c.13.06.28.09.42.14a1.16 1.16 0 00.45.03c.32-.04.6-.2.79-.46.35-.42.62-.87.9-1.15l.01-.02c.23-.28.23-.64.04-.94-.4-.62-1.08-1.02-1.77-1.43l-.22-.13c-.36-.21-.77-.19-1.1.05l-.63.48c-.163.13-.39.11-.53-.03l-.02-.02a8.5 8.5 0 01-1.2-1.26c-.33-.43-.66-.88-.94-1.35l-.01-.02a.36.36 0 01.04-.46l.53-.56c.27-.28.35-.7.2-1.07l-.06-.16c-.28-.74-.57-1.49-1.17-2.03a.94.94 0 00-.57-.23c-.05-.01-.1-.01-.16 0zm3.9.81a.5.5 0 00-.41.56c.07.49.25.96.54 1.36.3.4.69.71 1.14.9.28.1.58-.04.68-.31.1-.28-.04-.58-.31-.68a1.9 1.9 0 01-.75-.58 1.78 1.78 0 01-.35-.89.5.5 0 00-.55-.39z" />
        </svg>
      ),
      onClick: () => window.open(`viber://forward?text=${encodeURIComponent(title + " " + url)}`, "_blank"),
      color: "hover:bg-purple-50 hover:text-purple-600",
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2">
        <div className="space-y-1">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              type="button"
              onClick={option.onClick}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-slate-600",
                option.color
              )}
            >
              <option.icon />
              {option.name}
            </button>
          ))}
          <div className="h-px bg-slate-100 my-1" />
          <button
            type="button"
            onClick={copyLink}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-600"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Kopirano!" : "Kopiraj link"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
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

  const contactMethods = [
    {
      key: "message",
      show: true,
      icon: MessageCircle,
      label: "Pošalji poruku",
      description: "Poruka u inbox",
      color: "bg-primary text-white",
      onClick: onMessageClick,
    },
    {
      key: "phone",
      show: showPhone,
      icon: Phone,
      label: "Pozovi",
      description: phone,
      color: "bg-emerald-500 text-white",
      href: `tel:${phone}`,
      copyValue: phone,
    },
    {
      key: "whatsapp",
      show: showWhatsapp,
      icon: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      label: "WhatsApp",
      description: whatsappNumber,
      color: "bg-green-500 text-white",
      href: `https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}`,
      external: true,
    },
    {
      key: "viber",
      show: showViber,
      icon: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.398.002C9.47.028 5.61.46 3.294 2.6 1.244 4.473.319 7.3.126 10.84c-.19 3.543-.24 10.182 6.29 11.838h.005l-.002 2.717s-.047.872.543 1.054c.71.217 1.13-.457 1.81-1.19.374-.404.89-.998 1.28-1.452 3.52.296 6.228-.38 6.535-.48.71-.232 4.726-.745 5.38-6.082.676-5.508-.328-8.99-2.16-10.56l-.003-.002c-.53-.524-2.673-2.433-7.737-2.673 0 0-.376-.024-.87-.008zm.105 1.764c.425-.013.753.007.753.007 4.34.205 6.168 1.74 6.608 2.188l.003.002c1.566 1.343 2.38 4.456 1.794 9.07-.56 4.59-4.016 4.887-4.612 5.08-.255.084-2.607.67-5.622.507 0 0-2.227 2.69-2.922 3.39-.11.11-.238.152-.324.132-.12-.028-.153-.147-.152-.326l.016-3.67c-5.572-1.406-5.25-6.664-5.094-9.593.167-3.037.93-5.39 2.652-6.963 1.98-1.833 5.216-2.185 6.9-2.218z" />
        </svg>
      ),
      label: "Viber",
      description: viberNumber,
      color: "bg-violet-500 text-white",
      href: `viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`,
    },
    {
      key: "email",
      show: showEmail,
      icon: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: "Email",
      description: email,
      color: "bg-sky-500 text-white",
      href: `mailto:${email}`,
      copyValue: email,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Kontaktiraj prodavača</h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contact methods */}
        <div className="p-4 space-y-2">
          {contactMethods.map((method) => {
            if (!method.show) return null;

            const Icon = method.icon;
            const isComponent = typeof Icon !== "function" || Icon.$$typeof;

            const content = (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", method.color)}>
                  {isComponent ? <Icon className="w-5 h-5" /> : <Icon />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900">{method.label}</div>
                  {method.description && (
                    <div className="text-xs text-slate-500 truncate">{method.description}</div>
                  )}
                </div>
              </div>
            );

            if (method.onClick) {
              return (
                <button
                  key={method.key}
                  type="button"
                  onClick={() => {
                    method.onClick();
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {content}
                </button>
              );
            }

            return (
              <div key={method.key} className="flex items-center gap-2">
                <a
                  href={method.href}
                  target={method.external ? "_blank" : undefined}
                  rel={method.external ? "noreferrer" : undefined}
                  className="flex-1 flex items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {content}
                </a>
                {method.copyValue && (
                  <button
                    type="button"
                    onClick={() => copy(method.key, method.copyValue)}
                    className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {copiedKey === method.key ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================================================
   SEND MESSAGE MODAL
===================================================== */

const SendMessageModal = ({ open, onOpenChange, seller }) => {
  const router = useRouter();
  const currentUser = useSelector(userSignUpData);

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
      setError("Molimo unesite poruku.");
      return;
    }

    if (!currentUser?.token) {
      toast.error("Morate biti prijavljeni.");
      router.push("/login");
      return;
    }

    if (!sellerUserId) {
      setError("Prodavač nije pronađen.");
      return;
    }

    if (currentUser?.id && String(currentUser.id) === String(sellerUserId)) {
      setError("Ne možete slati poruku sami sebi.");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const checkRes = await itemConversationApi.checkDirectConversation({ user_id: sellerUserId });

      let conversationId = null;

      if (checkRes?.data?.error === false && checkRes?.data?.data?.conversation_id) {
        conversationId = checkRes.data.data.conversation_id;
      } else {
        const startRes = await itemConversationApi.startDirectConversation({ user_id: sellerUserId });

        if (startRes?.data?.error === false) {
          conversationId = startRes.data.data?.conversation_id || startRes.data.data?.item_offer_id;
        } else {
          throw new Error(startRes?.data?.message || "Nije moguće pokrenuti razgovor.");
        }
      }

      if (!conversationId) {
        throw new Error("Nije moguće kreirati razgovor.");
      }

      const sendRes = await sendMessageApi.sendMessage({
        item_offer_id: conversationId,
        message: message.trim(),
      });

      if (sendRes?.data?.error === false) {
        toast.success("Poruka poslana!");
        setMessage("");
        onOpenChange(false);
        router.push(`/chat?id=${conversationId}`);
      } else {
        throw new Error(sendRes?.data?.message || "Greška pri slanju.");
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Došlo je do greške.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Pošalji poruku</h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError("");
            }}
            placeholder="Napišite poruku..."
            rows={4}
            className={cn(
              "w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm",
              "placeholder:text-slate-400 resize-none",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              error ? "border-red-300" : "border-slate-200"
            )}
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Odustani
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSending ? "Šaljem..." : "Pošalji"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* =====================================================
   MINIMAL SELLER CARD
===================================================== */

export const MinimalSellerCard = ({
  seller,
  sellerSettings,
  badges = [],
  isPro = false,
  isShop = false,
  showProfileLink = true,
  onChatClick,
  onPhoneClick,
  shareUrl,
}) => {
  const pathname = usePathname();
  const CompanyName = useSelector(getCompanyName);

  const settings = sellerSettings || {};

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);

  if (!seller) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-slate-200 rounded w-32" />
            <div className="h-4 bg-slate-100 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  const computedShareUrl = shareUrl || (seller?.id
    ? `${process.env.NEXT_PUBLIC_WEB_URL}/seller/${seller.id}`
    : `${process.env.NEXT_PUBLIC_WEB_URL}${pathname}`);

  const title = `${seller?.name || "Prodavač"} | ${CompanyName}`;

  const responseLabel = getResponseTimeLabel({
    responseTime: settings?.response_time || "auto",
    responseTimeAvg: seller?.response_time_avg,
    settings,
  });

  const memberSince = formatMemberSince(seller?.created_at);

  const badgeList = (badges || []).slice(0, 3);

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
      />

      <div className="space-y-4">
        {/* Main Card */}
        <div className="relative">
          {/* Share button - top right */}
          <div className="absolute top-0 right-0">
            <SharePopover url={computedShareUrl} title={title} />
          </div>

          {/* Avatar + Name row */}
          <div className="flex items-start gap-3 pr-10">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50">
                <CustomImage
                  src={seller?.profile || seller?.profile_image}
                  alt={seller?.name || "Prodavač"}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              {seller?.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-sky-500 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Name + Badges */}
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {seller?.name}
              </h3>

              {/* Badges row */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {isPro && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-md">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Pro
                  </span>
                )}
                {isShop && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-md">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Trgovina
                  </span>
                )}
                {badgeList.map((b) => (
                  <GamificationBadge key={b.id} badge={b} size="sm" showName={false} showDescription={false} />
                ))}
              </div>
            </div>
          </div>

          {/* Response time + Member since */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            {responseLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Odgovara za {responseLabel}
              </span>
            )}
            {memberSince && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Član od {memberSince}
              </span>
            )}
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2">
          {/* Primary: Send message */}
          <button
            type="button"
            onClick={handleChatClick}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Pošalji poruku
          </button>

          {/* Save button */}
          <SavedToListButton
            sellerId={seller?.id}
            sellerName={seller?.name}
            variant="icon"
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50"
          />

          {/* Contact button */}
          <button
            type="button"
            onClick={handleContactClick}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-emerald-600 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* WhatsApp quick access */}
          {settings?.show_whatsapp && (settings?.whatsapp_number || seller?.mobile) && (
            <a
              href={`https://wa.me/${String(settings?.whatsapp_number || seller?.mobile).replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-green-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          )}
        </div>

        {/* Profile link */}
        {showProfileLink && (
          <CustomLink
            href={`/seller/${seller?.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Pogledaj profil
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </CustomLink>
        )}
      </div>
    </>
  );
};

export default MinimalSellerCard;