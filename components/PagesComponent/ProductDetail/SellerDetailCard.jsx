"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, MessageCircle, Phone, PhoneCall, Tag, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";

import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { getIsLoggedIn } from "@/redux/reducer/authSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { itemConversationApi } from "@/utils/api";

import MakeOfferModal from "./MakeOfferModal";
import ApplyJobModal from "./ApplyJobModal";
import { useNavigate } from "@/components/Common/useNavigate";

// ✅ Preview mora biti identičan svuda
import { SellerPreviewCard } from "@/components/PagesComponent/Seller/SellerDetailCard";

const ProductSellerDetailCard = ({
  productDetails,
  setProductDetails, // optional
  isPro,
  isShop,
  sellerSettings,
  badges,
  ratings,
  isAllowedToMakeOffer,
  isJobCategory,
  isApplied,
}) => {
  const dispatch = useDispatch();
  const { navigate } = useNavigate();

  const isLoggedIn = useSelector(getIsLoggedIn);

  const seller = productDetails?.user || productDetails?.seller || null;
  const settings = sellerSettings || {};

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [existingConversation, setExistingConversation] = useState(null);
  const [isCheckingConversation, setIsCheckingConversation] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const [isCopied, setIsCopied] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  const showWhatsapp = Boolean(settings.show_whatsapp);
  const showViber = Boolean(settings.show_viber);
  const whatsappNumber = settings.whatsapp_number || seller?.mobile;
  const viberNumber = settings.viber_number || seller?.mobile;

  const shareUrl = useMemo(
    () => (seller?.id ? `${process.env.NEXT_PUBLIC_WEB_URL}/seller/${seller.id}` : undefined),
    [seller?.id]
  );

  const requireAuthOrOpenLogin = () => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return false;
    }
    return true;
  };

  const handleOfferModalChange = (v) => {
    // MakeOfferModal zove onClose(bool) iz Dialog-a, ali i onClose() bez args nakon submit-a
    setIsOfferModalOpen(Boolean(v));
  };

  const handleMakeOffer = () => {
    if (!requireAuthOrOpenLogin()) return;

    if (!productDetails?.id) {
      toast.error("Ne mogu poslati ponudu: nedostaje ID proizvoda.");
      return;
    }
    if (!seller?.id) {
      toast.error("Ne mogu poslati ponudu: prodavač nije dostupan.");
      return;
    }
    setIsOfferModalOpen(true);
  };

  const handleChat = async () => {
    if (!requireAuthOrOpenLogin()) return;

    if (!seller?.id) {
      toast.error("Ne mogu otvoriti chat: prodavač nije dostupan.");
      return;
    }
    if (!productDetails?.id) {
      toast.error("Ne mogu otvoriti chat: nedostaje ID proizvoda.");
      return;
    }

    try {
      setIsStartingChat(true);

      const chatId = existingConversation?.id;
      if (chatId) {
        navigate(`/chat?activeTab=buying&chatid=${chatId}`);
        return;
      }

      const response = await itemConversationApi.createConversation({
        user_id: seller.id,
        item_id: productDetails.id,
      });

      const newId = response?.data?.data?.id;
      if (response?.data?.error === false && newId) {
        navigate(`/chat?activeTab=buying&chatid=${newId}`);
      } else {
        toast.error(response?.data?.message || "Ne mogu otvoriti chat.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Greška pri otvaranju chata.");
    } finally {
      setIsStartingChat(false);
    }
  };

  const checkExistingConversation = useCallback(async () => {
    if (!isLoggedIn || !seller?.id || !productDetails?.id) {
      setExistingConversation(null);
      return;
    }

    try {
      setIsCheckingConversation(true);
      const response = await itemConversationApi.checkConversation({
        user_id: seller.id,
        item_id: productDetails.id,
      });
      if (response?.data?.error === false) setExistingConversation(response?.data?.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingConversation(false);
    }
  }, [isLoggedIn, seller?.id, productDetails?.id]);

  useEffect(() => {
    checkExistingConversation();
  }, [checkExistingConversation]);

  const handleCopyPhone = async () => {
    if (!seller?.mobile) return;

    try {
      await navigator.clipboard.writeText(seller.mobile);
      setIsCopied(true);
      toast.success("Broj telefona je kopiran.");
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      toast.error("Ne mogu kopirati broj telefona.");
    }
  };

  if (!seller) return null;

  const chatBtnLabel = isStartingChat
    ? "Otvaram chat..."
    : existingConversation?.id
    ? "Otvori chat"
    : "Pošalji poruku";

  return (
    <>
      <SellerPreviewCard
        seller={seller}
        sellerSettings={settings}
        badges={badges}
        ratings={ratings}
        isPro={isPro}
        isShop={isShop}
        shareUrl={shareUrl}
        onChatClick={handleChat}
      />

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-5 space-y-2 shadow-sm"
      >
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleChat}
          disabled={isStartingChat || isCheckingConversation}
          className={cn(
            "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition",
            "bg-slate-900 text-white hover:opacity-95 dark:bg-white dark:text-slate-900",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          <MessageCircle className="h-5 w-5" />
          {chatBtnLabel}
        </motion.button>

        {Boolean(isAllowedToMakeOffer) ? (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleMakeOffer}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition",
              "bg-primary text-white hover:opacity-95"
            )}
          >
            <Tag className="h-5 w-5" />
            Pošalji ponudu
          </motion.button>
        ) : null}

        {Boolean(isJobCategory) ? (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowApplyModal(true)}
            disabled={Boolean(isApplied)}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition",
              isApplied
                ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 cursor-not-allowed"
                : "bg-slate-900 text-white hover:opacity-95 dark:bg-white dark:text-slate-900"
            )}
          >
            {isApplied ? "Već ste se prijavili" : "Prijavi se"}
          </motion.button>
        ) : null}

        <div className="pt-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Kontakt</div>

          <div className="flex flex-wrap items-center gap-2">
            {seller?.mobile ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold transition"
                >
                  <Phone className="h-5 w-5" />
                  Telefon
                </button>

                <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
                  <DialogContent className="max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">Broj telefona</div>
                        <div className="mt-1 text-slate-600 dark:text-slate-300">{seller.mobile}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPhoneModalOpen(false)}
                        className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <X className="h-5 w-5 text-slate-600 dark:text-slate-200" />
                      </button>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <a
                        href={`tel:${seller.mobile}`}
                        className="flex-1 text-center rounded-2xl px-4 py-3 font-semibold bg-primary text-white hover:opacity-95 transition"
                      >
                        Pozovi
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition"
                      >
                        {isCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        Kopiraj
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : null}

            {showWhatsapp && whatsappNumber ? (
              <a
                href={`https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold transition"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>
            ) : null}

            {showViber && viberNumber ? (
              <a
                href={`viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold transition"
              >
                <PhoneCall className="h-5 w-5" />
                Viber
              </a>
            ) : null}
          </div>

          <div className="mt-3">
            <CustomLink href={`/seller/${seller?.id}`} className="text-sm font-semibold text-primary hover:underline">
              Pogledaj profil prodavača
            </CustomLink>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <MakeOfferModal
        isOpen={isOfferModalOpen}
        onClose={handleOfferModalChange}
        productDetails={productDetails}
        {...(typeof setProductDetails === "function" ? { setProductDetails } : {})}
      />

      <ApplyJobModal open={showApplyModal} setOpen={setShowApplyModal} item_id={productDetails?.id} />
    </>
  );
};

export default ProductSellerDetailCard;
