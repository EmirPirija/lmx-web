"use client";

import { useState, useEffect, useCallback } from "react";
import { FiCopy, FiCheck, FiX, FiTag } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";

import { getIsLoggedIn } from "@/redux/reducer/authSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { itemConversationApi } from "@/utils/api";

import MakeOfferModal from "./MakeOfferModal";
import ApplyJobModal from "./ApplyJobModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { SellerPreviewCard, SellerPreviewSkeleton } from "@/components/PagesComponent/Seller/SellerDetailCard";
import SavedToListButton from "@/components/Profile/SavedToListButton";
import SavedSellerButton from "@/components/Profile/SavedSellerButton";



const SellerDetailCard = ({
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
  const isLoggedIn = useSelector(getIsLoggedIn);

  const seller = productDetails?.user || productDetails?.seller || null;

  const [existingConversation, setExistingConversation] = useState(null);
  const [isCheckingConversation, setIsCheckingConversation] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleChat = async () => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }
    if (!seller?.id) return;

    try {
      setIsStartingChat(true);

      if (existingConversation?.id) {
        window.location.href = `/messages?conversation=${existingConversation.id}`;
        return;
      }

      const response = await itemConversationApi.createConversation({
        user_id: seller.id,
        item_id: productDetails?.id,
      });

      if (response?.data?.error === false && response?.data?.data?.id) {
        window.location.href = `/messages?conversation=${response.data.data.id}`;
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
    if (!isLoggedIn || !seller?.id || !productDetails?.id) return;
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

  const handleMakeOffer = () => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }
    setIsOfferModalOpen(true);
  };

  const handleCopyPhone = () => {
    if (!seller?.mobile) return;
    navigator.clipboard.writeText(seller.mobile);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1100);
    toast.success("Broj kopiran.");
  };

  // Use optional card preferences if backend ever provides it
  const prefs = sellerSettings?.card_preferences || {};
  const uiPrefs = {
    compactness: prefs.compactness,
    contactStyle: prefs.contactStyle || prefs.contact_style,
  };

  if (!seller) return <SellerPreviewSkeleton compactness={uiPrefs.compactness || "normal"} />;

  return (
    <>
      <SellerPreviewCard
        seller={seller}
        sellerSettings={sellerSettings || {}}
        badges={badges}
        ratings={ratings}
        isPro={isPro}
        isShop={isShop}
        mode="compact"
        onChatClick={handleChat}
        onPhoneClick={() => setIsPhoneModalOpen(true)}
        uiPrefs={uiPrefs}
      />

      {/* Phone modal (used when inline icon is visible) */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">Kontakt telefon</div>
              <div className="mt-1 text-slate-600 dark:text-slate-300">{seller?.mobile}</div>

            </div>
            <button
              type="button"
              onClick={() => setIsPhoneModalOpen(false)}
              className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FiX className="text-xl text-slate-600 dark:text-slate-200" />
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <a
              href={`tel:${seller?.mobile}`}
              className="flex-1 text-center rounded-2xl px-4 py-3 text-sm font-semibold bg-slate-900 text-white hover:opacity-95 dark:bg-white dark:text-slate-900"
            >
              Pozovi
            </a>
            <button
              type="button"
              onClick={handleCopyPhone}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {isCopied ? <FiCheck className="text-lg text-emerald-600" /> : <FiCopy className="text-lg" />}
              {isCopied ? "Kopirano" : "Kopiraj"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Optional actions below */}
      {(isAllowedToMakeOffer || isJobCategory) ? (
        <div className="mt-4 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
          {isAllowedToMakeOffer ? (
            <button
              type="button"
              onClick={handleMakeOffer}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-2xl px-5 text-sm font-semibold bg-slate-900 text-white hover:opacity-95 dark:bg-white dark:text-slate-900 shadow-sm hover:shadow-md transition"
            >
              <FiTag className="text-lg" />
              Pošalji ponudu
            </button>
          ) : null}

          {isJobCategory ? (
            <button
              type="button"
              onClick={() => setShowApplyModal(true)}
              disabled={isApplied}
              className="w-full inline-flex items-center justify-center h-11 rounded-2xl px-5 text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition"
            >
              {isApplied ? "Već ste aplicirali" : "Apliciraj"}
            </button>
          ) : null}
        </div>
      ) : null}

      <MakeOfferModal
        open={isOfferModalOpen}
        setOpen={setIsOfferModalOpen}
        productDetails={productDetails}
        {...(typeof setProductDetails === "function" ? { setProductDetails } : {})}
      />

      <ApplyJobModal open={showApplyModal} setOpen={setShowApplyModal} item_id={productDetails?.id} />

      <SavedToListButton
    sellerId={seller?.id}
    sellerName={seller?.name}
    variant="icon" // kompaktno za product page
  />

<div className="absolute top-3 right-3">
  <SavedSellerButton sellerId={seller?.id} />
</div>
      
    </>
  );
};

export default SellerDetailCard;