import { useState, useEffect, useCallback } from "react";
import {
  MdVerified,
  MdStar,
  MdContentCopy,
  MdCheck,
  MdChatBubbleOutline,
  MdLocalOffer,
  MdCalendarMonth,
  MdBeachAccess,
  MdStorefront,
  MdWorkspacePremium,
  MdSchedule,
  MdAccessTime,
  MdClose,
} from "react-icons/md";
import { FaWhatsapp, FaViber } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { toast } from "sonner";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { itemOfferApi, itemConversationApi } from "@/utils/api";
import MakeOfferModal from "./MakeOfferModal";
import ApplyJobModal from "./ApplyJobModal";
import { useNavigate } from "@/components/Common/useNavigate";
import { cn } from "@/lib/utils";
import GamificationBadge from "@/components/PagesComponent/Gamification/Badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatResponseTimeBs } from "@/utils/index";

/* ===================== helpers ===================== */

const formatJoinDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const months = [
    "januar",
    "februar",
    "mart",
    "april",
    "maj",
    "juni",
    "juli",
    "august",
    "septembar",
    "oktobar",
    "novembar",
    "decembar",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const parseBusinessHours = (hours) => {
  if (!hours) return null;
  try {
    return typeof hours === "string" ? JSON.parse(hours) : hours;
  } catch {
    return null;
  }
};

const isCurrentlyOpen = (businessHours) => {
  if (!businessHours) return null;
  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[now.getDay()];
  const todayHours = businessHours[today];

  if (!todayHours || todayHours.closed || !todayHours.enabled) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = (todayHours.open || "09:00").split(":").map(Number);
  const [closeHour, closeMin] = (todayHours.close || "17:00").split(":").map(Number);

  return currentTime >= openHour * 60 + openMin && currentTime <= closeHour * 60 + closeMin;
};

const getTodayHours = (businessHours) => {
  if (!businessHours) return null;
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[new Date().getDay()];
  const todayHours = businessHours[today];
  if (!todayHours || todayHours.closed || !todayHours.enabled) return "Zatvoreno";
  return `${todayHours.open} - ${todayHours.close}`;
};

const responseTimeLabels = {
  instant: "par minuta",
  few_hours: "par sati",
  same_day: "24 sata",
  few_days: "par dana",
};

const responseTimeFromAvg = (avgMin) => {
  if (avgMin == null) return null;
  const min = Number(avgMin);
  if (Number.isNaN(min)) return null;

  if (min <= 15) return "par minuta";
  if (min <= 180) return "par sati";
  if (min <= 1440) return "24 sata";
  return "par dana";
};

/* ===================== component ===================== */

const SellerDetailCard = ({ productDetails, setProductDetails, badges }) => {
  const dispatch = useDispatch();
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const CompanyName = useSelector(getCompanyName);

  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${pathname}`;
  const seller = productDetails?.user;
  const FbTitle = `${seller?.name || "Prodavač"} | ${CompanyName}`;

  const sellerSettings = productDetails?.seller_settings || seller?.seller_settings || {};

  // Pro/Shop status (robust)
  let isPro = Boolean(productDetails?.is_pro || seller?.is_pro);
  let isShop = Boolean(productDetails?.is_shop || seller?.is_shop);

  const membership = productDetails?.membership || seller?.membership;
  if (membership) {
    const tier = String(membership.tier || membership.tier_name || membership.plan || "").toLowerCase();
    const status = String(membership.status || "").toLowerCase();
    if (status === "active") {
      if (tier.includes("shop") || tier.includes("business")) {
        isPro = true;
        isShop = true;
      } else if (tier.includes("pro") || tier.includes("premium")) {
        isPro = true;
        isShop = false;
      }
    }
  }

  // Settings
  const vacationMode = Boolean(sellerSettings?.vacation_mode);
  const vacationMessage = sellerSettings?.vacation_message || "Prodavač je trenutno na godišnjem odmoru.";

  const responseTime = sellerSettings?.response_time || null;
  const responseTimeAutoLabel = responseTime === "auto" ? responseTimeFromAvg(seller?.response_time_avg) : null;

  const responseTimeDisplayText =
    responseTime === "auto"
      ? responseTimeAutoLabel
        ? `Obično odgovara za ${responseTimeAutoLabel}`
        : "Vrijeme odgovora se računa automatski"
      : responseTime && responseTimeLabels[responseTime]
        ? `Obično odgovara za ${responseTimeLabels[responseTime]}`
        : null;

  const businessHours = parseBusinessHours(sellerSettings?.business_hours);
  const currentlyOpen = isShop && businessHours ? isCurrentlyOpen(businessHours) : null;
  const todayHoursText = isShop && businessHours ? getTodayHours(businessHours) : null;

  // Contact options
  const showWhatsapp = Boolean(sellerSettings?.show_whatsapp);
  const showViber = Boolean(sellerSettings?.show_viber);
  const whatsappNumber = sellerSettings?.whatsapp_number || seller?.mobile;
  const viberNumber = sellerSettings?.viber_number || seller?.mobile;

  const loggedInUser = useSelector(userSignUpData);
  const isLoggedIn = useSelector(getIsLoggedIn);

  const [IsStartingChat, setIsStartingChat] = useState(false);
  const [IsOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [existingConversation, setExistingConversation] = useState(null);
  const [isCheckingConversation, setIsCheckingConversation] = useState(false);

  const checkExistingConversation = useCallback(async () => {
    if (!isLoggedIn || !productDetails?.id) return;
    try {
      setIsCheckingConversation(true);
      const response = await itemConversationApi.checkConversation({ item_id: productDetails.id });
      if (response?.data?.error === false && response?.data?.data) {
        setExistingConversation(response.data.data);
      } else {
        setExistingConversation(null);
      }
    } catch {
      setExistingConversation(null);
    } finally {
      setIsCheckingConversation(false);
    }
  }, [isLoggedIn, productDetails?.id]);

  useEffect(() => {
    checkExistingConversation();
  }, [checkExistingConversation]);

  const joinDate = formatJoinDate(seller?.created_at);

  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;
  const isApplied = Boolean(productDetails?.is_already_job_applied);

  const isAllowedToMakeOffer =
    Number(productDetails?.price) > 0 &&
    !productDetails?.is_already_offered &&
    Number(productDetails?.category?.is_job_category) === 0 &&
    Number(productDetails?.category?.price_optional) === 0;

  const handleChat = async () => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }
    try {
      setIsStartingChat(true);

      // Ako već postoji conversation (check endpoint), idi direktno
      if (existingConversation?.id) {
        navigate("/chat?activeTab=buying&chatid=" + existingConversation.id);
        return;
      }

      // Inicijalizuj item-offer/chat
      const response = await itemOfferApi.offer({ item_id: productDetails?.id });
      const { data } = response.data;
      navigate("/chat?activeTab=buying&chatid=" + data?.id);
    } catch {
      toast.error("Nije moguće započeti chat");
    } finally {
      setIsStartingChat(false);
    }
  };

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
    toast.success("Broj telefona kopiran!");
    setTimeout(() => setIsCopied(false), 1800);
  };

  if (!seller) return null;

  return (
    <>
      <div
        data-seller-card
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative"
      >
        {/* header */}
        <div className="h-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 w-full absolute top-0 left-0 z-0 border-b border-slate-100 dark:border-slate-800" />

        <div className="absolute top-3 right-3 z-10">
          <ShareDropdown
            url={`${process.env.NEXT_PUBLIC_WEB_URL}/seller/${seller?.id}`}
            title={FbTitle}
            headline={FbTitle}
            companyName={CompanyName}
            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full p-2 text-slate-600 dark:text-slate-200 transition-all"
          />
        </div>

        <div className="relative z-10 px-5 pt-6 pb-5">
          <div className="flex flex-col items-center justify-center text-center">
            {/* avatar */}
            <div className="relative mb-3">
              <div className="p-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                <CustomImage
                  src={seller?.profile}
                  alt="Prodavač"
                  width={88}
                  height={88}
                  className="w-[88px] h-[88px] rounded-full object-cover"
                />
              </div>
            </div>

            {/* name + badges */}
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{seller?.name}</h3>
              {Boolean(seller?.is_verified) && <MdVerified className="text-primary text-xl" title="Verificiran" />}
            </div>

            {(isPro || isShop) && (
              <div className="mt-2 flex items-center gap-2">
                {isShop ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20">
                    <MdStorefront className="text-base" /> Shop
                  </span>
                ) : null}
                {isPro ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
                    <MdWorkspacePremium className="text-base" /> Pro
                  </span>
                ) : null}
              </div>
            )}

            {/* gamification badges */}
            {badges?.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {badges.slice(0, 3).map((badge) => (
                  <div
                    key={badge.id}
                    className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-1.5 py-1"
                  >
                    <GamificationBadge badge={badge} size="sm" showName={false} showDescription={false} />
                  </div>
                ))}
              </div>
            )}

            {/* meta */}
            <div className="mt-4 grid grid-cols-2 gap-2 w-full">
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-left">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200">
                  <MdCalendarMonth />
                  <span className="text-xs font-semibold">Član od</span>
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{joinDate || "—"}</div>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-left">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200">
                  <MdAccessTime />
                  <span className="text-xs font-semibold">Vrijeme odgovora</span>
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {responseTimeDisplayText || "—"}
                </div>
              </div>
            </div>

            {/* business hours (shop only) */}
            {isShop && businessHours && (
              <div className="mt-2 w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <MdSchedule />
                      <span className="text-sm font-bold">Radno vrijeme</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{todayHoursText}</div>
                  </div>
                  {currentlyOpen !== null && (
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold",
                        currentlyOpen
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      )}
                    >
                      {currentlyOpen ? "Otvoreno" : "Zatvoreno"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* vacation */}
            {vacationMode && (
              <div className="mt-3 w-full rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-left">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <MdBeachAccess />
                  <span className="text-sm font-bold">Na odmoru</span>
                </div>
                <div className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/80">{vacationMessage}</div>
              </div>
            )}

            {/* actions */}
            <div className="mt-4 w-full grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={handleChat}
                disabled={IsStartingChat || isCheckingConversation}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition",
                  "bg-primary text-white hover:opacity-95 disabled:opacity-60"
                )}
              >
                <MdChatBubbleOutline className="text-xl" />
                {IsStartingChat ? "Pokrećem chat..." : existingConversation?.id ? "Otvori chat" : "Pošalji poruku"}
              </button>

              {isAllowedToMakeOffer && (
                <button
                  type="button"
                  onClick={handleMakeOffer}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition bg-slate-900 text-white hover:opacity-95 dark:bg-white dark:text-slate-900"
                >
                  <MdLocalOffer className="text-xl" />
                  Pošalji ponudu
                </button>
              )}

              {isJobCategory && (
                <button
                  type="button"
                  onClick={() => setShowApplyModal(true)}
                  disabled={isApplied}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition",
                    isApplied
                      ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 cursor-not-allowed"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                  )}
                >
                  {isApplied ? "Već ste aplicirali" : "Apliciraj"}
                </button>
              )}
            </div>

            {/* contacts */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {seller?.mobile && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPhoneModalOpen(true)}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    title="Telefon"
                  >
                    <MdAccessTime className="opacity-0 w-0 h-0" />
                    {/* (ne koristimo MdPhone ovdje da ne širimo imports, telefon ide u modal) */}
                    <MdContentCopy className="opacity-0 w-0 h-0" />
                    <span className="text-sm font-bold">☎</span>
                  </button>

                  <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
                    <DialogContent className="max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-extrabold text-slate-900 dark:text-white">Kontakt telefon</div>
                          <div className="mt-1 text-slate-600 dark:text-slate-300">{seller.mobile}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPhoneModalOpen(false)}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200"
                        >
                          <MdClose className="text-xl" />
                        </button>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <a
                          href={`tel:${seller.mobile}`}
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
                </>
              )}

              {showWhatsapp && whatsappNumber && (
                <a
                  href={`https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  title="WhatsApp"
                >
                  <FaWhatsapp className="text-xl" />
                </a>
              )}

              {showViber && viberNumber && (
                <a
                  href={`viber://chat?number=${String(viberNumber).replace(/\D/g, "")}`}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  title="Viber"
                >
                  <FaViber className="text-xl" />
                </a>
              )}
            </div>

            {/* link to profile */}
            <div className="mt-4">
              <CustomLink
                href={`/seller/${seller?.id}`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Pogledaj profil prodavača
              </CustomLink>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MakeOfferModal
        open={IsOfferModalOpen}
        setOpen={setIsOfferModalOpen}
        productDetails={productDetails}
        setProductDetails={setProductDetails}
      />

      <ApplyJobModal open={showApplyModal} setOpen={setShowApplyModal} item_id={productDetails?.id} />
    </>
  );
};

export default SellerDetailCard;
