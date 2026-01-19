import { useState, useEffect, useCallback } from "react";
import {
  MdVerified,
  MdPhone,
  MdStar,
  MdContentCopy,
  MdCheck,
  MdArrowForward,
  MdClose,
  MdChatBubbleOutline,
  MdLocalOffer,
  MdWorkOutline,
  MdCalendarMonth,
  MdForum,
  MdAdd,
  MdBeachAccess,
  MdAccessTime,
  MdSchedule,
  MdStorefront
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
 
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
 
// Formatiranje datuma pridruživanja (Januar 2026)
const formatJoinDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
 
  const months = [
    "januar", "februar", "mart", "april", "maj", "juni",
    "juli", "august", "septembar", "oktobar", "novembar", "decembar"
  ];
 
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};
 
const SellerDetailCard = ({
  productDetails,
  setProductDetails,
  badges = [],
  onPhoneReveal,
  onPhoneClick,
  onWhatsAppClick,
  onViberClick,
  onMessageClick,
  onEmailClick,
  onProfileClick
}) => {
  const dispatch = useDispatch();
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${pathname}`;
  const CompanyName = useSelector(getCompanyName);

  const seller = productDetails?.user;
  const sellerSettings = seller?.seller_settings || productDetails?.seller_settings;
  const FbTitle = seller?.name + " | " + CompanyName;

  const loggedInUser = useSelector(userSignUpData);
  const isLoggedIn = useSelector(getIsLoggedIn);
  const loggedInUserId = loggedInUser?.id;
  const [IsStartingChat, setIsStartingChat] = useState(false);
  const [IsOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Provjera postojeće konverzacije
  const [existingConversation, setExistingConversation] = useState(null);
  const [isCheckingConversation, setIsCheckingConversation] = useState(false);

  // Seller settings
  const isVacationMode = sellerSettings?.vacation_mode === true || sellerSettings?.vacation_mode === 1;
  const vacationMessage = sellerSettings?.vacation_message || "Trenutno sam na odmoru. Vratit ću se uskoro!";
  const showWhatsapp = sellerSettings?.show_whatsapp === true || sellerSettings?.show_whatsapp === 1;
  const showViber = sellerSettings?.show_viber === true || sellerSettings?.show_viber === 1;
  const whatsappNumber = sellerSettings?.whatsapp_number || seller?.mobile;
  const viberNumber = sellerSettings?.viber_number || seller?.mobile;
  const responseTime = sellerSettings?.response_time;
  const businessHours = sellerSettings?.business_hours;

  // Helper za prikaz vremena odgovora
  const getResponseTimeLabel = (time) => {
    switch (time) {
      case "instant": return "Obično odgovara odmah";
      case "few_hours": return "Obično odgovara za par sati";
      case "same_day": return "Obično odgovara isti dan";
      case "few_days": return "Obično odgovara za par dana";
      default: return null;
    }
  };

  // Provjera da li je prodavač trenutno dostupan (business hours)
  const isCurrentlyOpen = useCallback(() => {
    if (!businessHours) return null;

    try {
      const hours = typeof businessHours === 'string' ? JSON.parse(businessHours) : businessHours;
      const now = new Date();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = days[now.getDay()];
      const todayHours = hours[today];

      if (!todayHours?.enabled) return false;

      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [openH, openM] = todayHours.open.split(':').map(Number);
      const [closeH, closeM] = todayHours.close.split(':').map(Number);
      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;

      return currentTime >= openTime && currentTime <= closeTime;
    } catch {
      return null;
    }
  }, [businessHours]);

  const isOpen = isCurrentlyOpen();

  // Provjeri da li postoji konverzacija za ovaj oglas
  const checkExistingConversation = useCallback(async () => {
    if (!isLoggedIn || !productDetails?.id) return;

    try {
      setIsCheckingConversation(true);
      const response = await itemConversationApi.checkConversation({
        item_id: productDetails.id
      });

      if (response?.data?.error === false && response?.data?.data) {
        setExistingConversation(response.data.data);
      } else {
        setExistingConversation(null);
      }
    } catch (error) {
      console.error("Greška pri provjeri konverzacije:", error);
      setExistingConversation(null);
    } finally {
      setIsCheckingConversation(false);
    }
  }, [isLoggedIn, productDetails?.id]);

  useEffect(() => {
    checkExistingConversation();
  }, [checkExistingConversation]);
 
  const joinDate = formatJoinDate(seller?.created_at);
 
  const isAllowedToMakeOffer =
    productDetails?.price > 0 &&
    !productDetails?.is_already_offered &&
    Number(productDetails?.category?.is_job_category) === 0 &&
    Number(productDetails?.category?.price_optional) === 0;
  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;
  const isApplied = productDetails?.is_already_job_applied;
  const item_id = productDetails?.id;
 
  const handleChat = async () => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }
    onMessageClick?.(); // Track message click
    try {
      setIsStartingChat(true);
      const response = await itemOfferApi.offer({
        item_id: productDetails?.id,
      });
      const { data } = response.data;
      navigate("/chat?activeTab=buying&chatid=" + data?.id);
    } catch (error) {
      toast.error("Nije moguće započeti chat");
      console.log(error);
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
    if (seller?.mobile) {
      navigator.clipboard.writeText(seller.mobile);
      setIsCopied(true);
      toast.success("Broj telefona kopiran!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
 
  return (
    <>
      <div 
        data-seller-card
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative group"
      >
        
        {/* Dekorativna pozadina */}
        <div className="h-20 bg-gradient-to-br from-slate-50 to-slate-100 w-full absolute top-0 left-0 z-0 border-b border-slate-100"></div>

        {/* Vacation Mode Banner */}
        {isVacationMode && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 py-3 relative z-20">
            <div className="flex items-center gap-2">
              <MdBeachAccess className="text-amber-600 text-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-800 text-sm">Na odmoru</p>
                <p className="text-xs text-amber-600 truncate">{vacationMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dijeli profil */}
        <div className="absolute top-3 right-3 z-10">
          <ShareDropdown
            url={`${process.env.NEXT_PUBLIC_WEB_URL}/seller/${seller?.id}`}
            title={FbTitle}
            headline={FbTitle}
            companyName={CompanyName}
            className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-full p-2 text-slate-500 transition-all"
          />
        </div>
 
        <div className="relative z-10 px-5 pt-6 pb-5">
          
          {/* INFO SEKCIJA */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-3 cursor-pointer group/avatar" onClick={() => { onProfileClick?.(); navigate(`/seller/${seller?.id}`); }}>
              <div className="p-1.5 bg-white rounded-full shadow-md group-hover/avatar:shadow-lg transition-shadow">
                <CustomImage
                  src={seller?.profile}
                  alt={seller?.name || "Prodavač"}
                  width={84}
                  height={84}
                  className="w-[84px] h-[84px] rounded-full object-cover border-2 border-slate-100"
                />
              </div>
              {seller?.is_verified === 1 && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1.5 rounded-full border-2 border-white shadow-sm">
                  <MdVerified className="text-white text-sm" />
                </div>
              )}
            </div>

            
                      {/* --- BADGES --- */}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              {badges.slice(0, 3).map((badge) => (
                <div key={badge.id} className="relative group">
                  <GamificationBadge badge={badge} size="sm" showName={false} showDescription={false} />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                      {badge.name}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {badges.length > 3 && (
                <span className="text-xs text-gray-500">+{badges.length - 3}</span>
              )}
            </div>
          )}
 
            <div className="mb-1">
              <CustomLink 
                href={`/seller/${seller?.id}`}
                className="text-xl font-bold text-slate-900 hover:text-primary transition-colors"
              >
                {seller?.name}
              </CustomLink>
            </div>
            
            {/* STATISTIKA I DATUM */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {seller?.average_rating > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                  <MdStar className="text-amber-500 text-base" />
                  <span className="font-bold text-slate-800 text-sm">{Number(seller?.average_rating).toFixed(1)}</span>
                  <span className="text-slate-400 text-xs">({seller?.reviews_count || 0})</span>
                </div>
              )}
              
              {joinDate && (
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100" title="Datum pridruživanja">
                  <MdCalendarMonth className="text-slate-400 text-base" />
                  <span className="font-medium text-slate-500 text-xs">Od {joinDate}</span>
                </div>
              )}
            </div>

            {/* Response time & Business Hours */}
            {(responseTime || isOpen !== null) && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                {responseTime && getResponseTimeLabel(responseTime) && (
                  <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    <MdAccessTime className="text-blue-500 text-sm" />
                    <span className="text-xs text-blue-700 font-medium">{getResponseTimeLabel(responseTime)}</span>
                  </div>
                )}
                {isOpen !== null && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border",
                    isOpen
                      ? "bg-green-50 border-green-100"
                      : "bg-slate-50 border-slate-200"
                  )}>
                    <MdSchedule className={cn("text-sm", isOpen ? "text-green-500" : "text-slate-400")} />
                    <span className={cn("text-xs font-medium", isOpen ? "text-green-700" : "text-slate-500")}>
                      {isOpen ? "Trenutno dostupan" : "Trenutno nedostupan"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-px w-full bg-slate-100 my-5"></div>

          {/* DUGMAD */}
          <div className="w-full flex flex-col gap-3">

            {/* Ako postoji konverzacija - prikaži "Vidi konverzaciju" */}
            {existingConversation && (
              <button
                onClick={() => navigate("/chat?activeTab=buying&chatid=" + existingConversation.id)}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
              >
                <MdForum className="text-xl" />
                <span>Vidi konverzaciju</span>
                {existingConversation.unread_count > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {existingConversation.unread_count}
                  </span>
                )}
              </button>
            )}

            {/* Započni chat - Glavno dugme */}
            <button
              data-chat-button
              onClick={handleChat}
              disabled={IsStartingChat || isCheckingConversation}
              className={cn(
                "flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all shadow-sm disabled:opacity-70 disabled:cursor-wait active:scale-[0.98]",
                existingConversation
                  ? "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              {existingConversation ? (
                <>
                  <MdAdd className="text-xl" />
                  <span>{IsStartingChat ? "Pokrećem..." : "Nova poruka"}</span>
                </>
              ) : (
                <>
                  <MdChatBubbleOutline className="text-xl" />
                  <span>{IsStartingChat ? "Pokrećem..." : "Pošalji poruku"}</span>
                </>
              )}
            </button>
 
            {/* Telefon */}
            {seller?.show_personal_details === 1 && seller?.mobile && (
              <button
                onClick={() => {
                  onPhoneReveal?.();
                  setIsPhoneModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm"
              >
                <MdPhone className="text-lg" />
                <span>Prikaži broj telefona</span>
              </button>
            )}

            {/* WhatsApp i Viber dugmad */}
            {(showWhatsapp || showViber) && (
              <div className="flex gap-2">
                {showWhatsapp && whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onWhatsAppClick?.()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#128C7E] active:scale-[0.98] transition-all shadow-sm"
                  >
                    <FaWhatsapp className="text-lg" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {showViber && viberNumber && (
                  <a
                    href={`viber://chat?number=${viberNumber.replace(/[^0-9]/g, '')}`}
                    onClick={() => onViberClick?.()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#7360F2] hover:bg-[#5B4AC4] active:scale-[0.98] transition-all shadow-sm"
                  >
                    <FaViber className="text-lg" />
                    <span>Viber</span>
                  </a>
                )}
              </div>
            )}

            {/* Ponudi */}
            {isAllowedToMakeOffer && (
              <button
                onClick={handleMakeOffer}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
              >
                <MdLocalOffer className="text-lg text-primary" />
                <span>Ponudi svoju cijenu</span>
              </button>
            )}
 
            {/* Apliciraj za posao */}
            {isJobCategory && (
              <button
                onClick={() => setShowApplyModal(true)}
                disabled={isApplied}
                className={cn(
                  "flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-white transition-all shadow-sm",
                  isApplied 
                    ? "bg-slate-400 cursor-not-allowed" 
                    : "bg-purple-600 hover:bg-purple-700 active:scale-[0.98]"
                )}
              >
                <MdWorkOutline className="text-lg" />
                <span>{isApplied ? "Već ste aplicirali" : "Apliciraj za posao"}</span>
              </button>
            )}
          </div>
 
          {/* Link na profil */}
          <div className="mt-5 text-center" onClick={() => onProfileClick?.()}>
            <CustomLink
              href={`/seller/${seller?.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-primary transition-colors uppercase tracking-wide"
            >
              Pogledaj profil <MdArrowForward />
            </CustomLink>
          </div>
        </div>
      </div>
 
      {/* MODAL ZA TELEFON */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-sm w-[90%] p-0 gap-0 rounded-3xl overflow-hidden bg-white border-none shadow-2xl">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 relative flex flex-col items-center justify-center">
            <button 
              onClick={() => setIsPhoneModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <MdClose size={20} />
            </button>
            
            <CustomImage
              src={seller?.profile}
              alt={seller?.name || "Prodavač"}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border-4 border-white/20 mb-3 shadow-lg"
            />
            <h3 className="font-bold text-xl">{seller?.name}</h3>
            <p className="text-slate-300 text-sm">Kontakt informacije</p>
          </div>
 
          <div className="p-6 bg-white">
            <div 
              onClick={handleCopyPhone}
              className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all group"
            >
              <p className="text-3xl font-black text-slate-800 tracking-tight group-hover:scale-105 transition-transform">
                {seller?.mobile}
              </p>
              <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-wide">
                Klikni za kopiranje
              </p>
            </div>
 
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={handleCopyPhone}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
              >
                {isCopied ? <MdCheck className="text-green-600 text-xl" /> : <MdContentCopy className="text-xl" />}
                <span>{isCopied ? "Kopirano!" : "Kopiraj"}</span>
              </button>
 
              <a
                href={`tel:${seller?.mobile}`}
                onClick={() => onPhoneClick?.()}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] transition-all shadow-lg shadow-green-200"
              >
                <MdPhone className="text-xl" />
                <span>Pozovi</span>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
 
      <MakeOfferModal
        isOpen={IsOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        productDetails={productDetails}
        key={`offer-modal-${IsOfferModalOpen}`}
      />
      <ApplyJobModal
        key={`apply-job-modal-${showApplyModal}`}
        showApplyModal={showApplyModal}
        setShowApplyModal={setShowApplyModal}
        item_id={item_id}
        setProductDetails={setProductDetails}
      />
    </>
  );
};
 
export default SellerDetailCard;