"use client";

import { useMemo, useState } from "react";
import {
  MdAccessTime,
  MdVerified,
  MdPhone,
  MdOutlineMail,
  MdChatBubbleOutline,
  MdLocalOffer,
  MdContentCopy,
  MdCheck,
  MdInfoOutline,
} from "react-icons/md";
import { FaWhatsapp, FaViber } from "react-icons/fa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CustomImage from "@/components/Common/CustomImage";
import CustomLink from "@/components/Common/CustomLink";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ShareDropdown from "@/components/Common/ShareDropdown";
import { useSelector } from "react-redux";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import { usePathname } from "next/navigation";
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";
import { formatResponseTimeBs } from "@/utils/index";

const responseTimeLabels = {
  instant: "par minuta",
  few_hours: "par sati",
  same_day: "24 sata",
  few_days: "par dana",
};

const SellerDetailCard = ({
  productDetails,
  seller: sellerProp,
  sellerSettings: sellerSettingsProp,
  ratings,
  onPhoneReveal,
  onPhoneClick,
  onEmailClick,
  onProfileClick,

  checkExistingConversation,
  handleCreateConversation,
  handleMakeOffer,

  isCheckingConversation = false,
  isCreatingConversation = false,
  isMakingOffer = false,

  preview = false,
}) => {
  const pathname = usePathname();
  const CompanyName = useSelector(getCompanyName);

  const seller =
    sellerProp ||
    productDetails?.seller ||
    productDetails?.user ||
    productDetails?.item?.user ||
    productDetails?.data?.seller ||
    null;

  const sellerSettings =
    sellerSettingsProp ||
    productDetails?.seller_settings ||
    productDetails?.sellerSettings ||
    productDetails?.data?.seller_settings ||
    null;

  const settings = sellerSettings || {};

  const memberSinceText = useMemo(() => {
    const createdAt = seller?.created_at || seller?.createdAt;
    if (!createdAt) return null;
    try {
      const d = new Date(createdAt);
      const month = d.toLocaleString("bs-BA", { month: "long" });
      const year = d.getFullYear();
      return `Član od ${month} ${year}`;
    } catch {
      return null;
    }
  }, [seller]);

  const responseTime = settings.response_time || "auto";

  const autoText = formatResponseTimeBs(seller?.response_time_avg);

  const responseTimeText =
    responseTime === "auto"
      ? autoText ?? "Vrijeme odgovora se računa automatski"
      : responseTimeLabels[responseTime];

  const responseTimeDisplay =
    responseTime === "auto"
      ? autoText
        ? `Obično odgovara za ${autoText}`
        : "Vrijeme odgovora se računa automatski"
      : responseTimeText
        ? `Obično odgovara za ${responseTimeText}`
        : "Vrijeme odgovora se računa automatski";

  const acceptsOffers = Boolean(settings.accepts_offers);
  const autoReplyEnabled = Boolean(settings.auto_reply_enabled);
  const autoReplyMessage = settings.auto_reply_message || "";

  const showPhone = Boolean(settings.show_phone);
  const showEmail = Boolean(settings.show_email);
  const showWhatsapp = Boolean(settings.show_whatsapp);
  const showViber = Boolean(settings.show_viber);

  const whatsappNumber = settings.whatsapp_number || seller?.mobile || "";
  const viberNumber = settings.viber_number || seller?.mobile || "";

  const canCall = showPhone && Boolean(seller?.mobile);
  const canEmail = showEmail && Boolean(seller?.email);
  const canWhatsapp = showWhatsapp && Boolean(whatsappNumber);
  const canViber = showViber && Boolean(viberNumber);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const currentUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, [pathname]);

  const FbTitle = useMemo(() => {
    const name = seller?.name || "Prodavač";
    return `${name} • ${CompanyName || "LMX"}`;
  }, [seller, CompanyName]);

  const handleOpenPhoneModal = () => {
    if (!canCall) return;
    setIsPhoneModalOpen(true);
    onPhoneReveal?.();
  };

  const handleCopyPhone = async () => {
    if (!seller?.mobile) return;
    try {
      await navigator.clipboard.writeText(seller.mobile);
      setIsCopied(true);
      toast.success("Broj telefona je kopiran!");
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      toast.error("Ne mogu kopirati broj telefona.");
    }
  };

  const handleMessageClick = async () => {
    if (preview) return;
    try {
      if (checkExistingConversation) {
        await checkExistingConversation(productDetails?.id, seller?.id);
        return;
      }
      if (handleCreateConversation) {
        await handleCreateConversation(productDetails?.id, seller?.id);
        return;
      }
      toast.error("Nedostaje handler za poruku.");
    } catch (e) {
      console.error(e);
      toast.error("Greška pri otvaranju razgovora.");
    }
  };

  const handleOfferClick = async () => {
    if (preview) return;
    try {
      if (typeof handleMakeOffer !== "function") {
        toast.error("Nedostaje handler za ponudu.");
        return;
      }
      // kompatibilno sa bilo kojim signature-om
      await handleMakeOffer(productDetails?.id, seller?.id, productDetails);
    } catch (e) {
      console.error(e);
      toast.error("Greška pri kreiranju ponude.");
    }
  };

  if (!seller) return null;

  const ActionIcon = ({ title, disabled, onClick, href, children }) => {
    const base =
      "inline-flex items-center justify-center w-10 h-10 rounded-full border transition-all";
    const enabledCls =
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15";
    const disabledCls =
      "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-950 dark:text-slate-600";

    if (href && !disabled) {
      return (
        <a
          href={href}
          onClick={onClick}
          title={title}
          className={cn(base, enabledCls)}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer" : undefined}
        >
          {children}
        </a>
      );
    }

    return (
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        title={title}
        disabled={disabled}
        className={cn(base, disabled ? disabledCls : enabledCls)}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1 rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
            {settings?.avatar_id ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <LmxAvatarSvg avatarId={settings.avatar_id} />
              </div>
            ) : (
              <CustomImage
                src={seller?.profile}
                alt={seller?.name || "Prodavač"}
                width={64}
                height={64}
                className="w-14 h-14 rounded-xl object-cover"
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-base font-extrabold text-slate-900 truncate dark:text-white">
                {seller?.name}
              </div>
              {Boolean(seller?.is_verified) && (
                <MdVerified className="text-primary text-xl shrink-0" />
              )}
            </div>

            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              {memberSinceText || "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ActionIcon title="Pozovi" disabled={!canCall} onClick={handleOpenPhoneModal}>
            <MdPhone className="text-lg" />
          </ActionIcon>

          <ActionIcon
            title="Email"
            disabled={!canEmail}
            onClick={onEmailClick}
            href={canEmail ? `mailto:${seller?.email}` : undefined}
          >
            <MdOutlineMail className="text-lg" />
          </ActionIcon>

          <ActionIcon
            title="WhatsApp"
            disabled={!canWhatsapp}
            href={canWhatsapp ? `https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}` : undefined}
          >
            <FaWhatsapp className="text-lg" />
          </ActionIcon>

          <ActionIcon
            title="Viber"
            disabled={!canViber}
            href={canViber ? `viber://chat?number=${String(viberNumber).replace(/\D/g, "")}` : undefined}
          >
            <FaViber className="text-lg" />
          </ActionIcon>

          {!preview && (
            <ShareDropdown
              url={currentUrl}
              title={FbTitle}
              headline={FbTitle}
              companyName={CompanyName}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            />
          )}
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200">
              <MdAccessTime className="text-lg" />
              <span className="text-sm font-bold">Vrijeme odgovora</span>
            </div>
            <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
              {responseTimeDisplay}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200">
              <MdLocalOffer className="text-lg" />
              <span className="text-sm font-bold">Ponude</span>
            </div>
            <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
              {acceptsOffers ? "Prihvatam ponude" : "Ne prihvatam ponude"}
            </div>
          </div>
        </div>

        {autoReplyEnabled && autoReplyMessage ? (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200">
              <MdChatBubbleOutline className="text-lg" />
              <span className="text-sm font-bold">Automatski odgovor</span>
            </div>
            <div className="mt-1 text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
              {autoReplyMessage}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <MdInfoOutline className="text-lg" />
              <span className="text-sm font-semibold">Automatski odgovor nije uključen</span>
            </div>
          </div>
        )}

        {!preview && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleMessageClick}
              disabled={isCheckingConversation || isCreatingConversation}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-extrabold transition",
                "bg-primary text-white hover:opacity-95",
                (isCheckingConversation || isCreatingConversation) && "opacity-70 cursor-not-allowed"
              )}
            >
              <MdChatBubbleOutline className="text-xl" />
              {isCheckingConversation || isCreatingConversation ? "Otvaram..." : "Pošalji poruku"}
            </button>

            <button
              type="button"
              onClick={handleOfferClick}
              disabled={!acceptsOffers || isMakingOffer}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-extrabold transition",
                acceptsOffers
                  ? "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500",
                isMakingOffer && "opacity-70 cursor-not-allowed"
              )}
            >
              <MdLocalOffer className="text-xl" />
              {isMakingOffer ? "Šaljem..." : "Pošalji ponudu"}
            </button>
          </div>
        )}

        {!preview && (
          <div className="mt-4 text-center">
            <CustomLink
              href={`/seller/${seller?.id}`}
              onClick={onProfileClick}
              className="inline-flex items-center justify-center text-sm font-semibold text-primary hover:underline"
            >
              Pogledaj profil
            </CustomLink>
          </div>
        )}
      </div>

      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <div className="text-lg font-extrabold text-slate-900 dark:text-white">Kontakt telefon</div>
          <div className="mt-1 text-slate-600 dark:text-slate-300">{seller?.mobile}</div>

          <div className="mt-4 flex gap-2">
            <a
              href={`tel:${seller?.mobile}`}
              onClick={onPhoneClick}
              className="flex-1 text-center rounded-xl px-4 py-3 font-bold bg-primary text-white hover:opacity-95"
            >
              Pozovi
            </a>
            <button
              type="button"
              onClick={handleCopyPhone}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              {isCopied ? <MdCheck className="text-xl" /> : <MdContentCopy className="text-xl" />}
              Kopiraj
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerDetailCard;
