import { useState } from "react";
import { 
  MdVerified, 
  MdOutlineMail, 
  MdPhone, 
  MdStar,
  MdContentCopy,
  MdCheck,
  MdArrowForward,
  MdClose,
  MdChatBubbleOutline,
  MdLocalOffer,
  MdWorkOutline,
  MdCalendarMonth
} from "react-icons/md";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { toast } from "sonner";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { itemOfferApi } from "@/utils/api";
import MakeOfferModal from "./MakeOfferModal";
import ApplyJobModal from "./ApplyJobModal";
import { useNavigate } from "@/components/Common/useNavigate";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

// 🔥 NOVA FUNKCIJA ZA LIJEP DATUM (Januar 2026)
const formatJoinDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const months = [
        "Januar", "Februar", "Mart", "April", "Maj", "Juni",
        "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"
    ];

    return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const SellerDetailCard = ({ productDetails, setProductDetails }) => {
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${pathname}`;
  const CompanyName = useSelector(getCompanyName);
  
  const seller = productDetails?.user;
  const FbTitle = seller?.name + " | " + CompanyName;

  const loggedInUser = useSelector(userSignUpData);
  const loggedInUserId = loggedInUser?.id;
  const [IsStartingChat, setIsStartingChat] = useState(false);
  const [IsOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Koristimo novu funkciju za datum
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
    if (!loggedInUserId) {
      setIsLoginOpen(true);
      return;
    }
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
    if (!loggedInUserId) {
      setIsLoginOpen(true);
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] overflow-hidden relative group">
        
        {/* Dekorativna pozadina */}
        <div className="h-20 bg-slate-50 w-full absolute top-0 left-0 z-0 border-b border-slate-100"></div>

        <div className="absolute top-3 right-3 z-10">
          <ShareDropdown
            url={currentUrl}
            title={FbTitle}
            headline={FbTitle}
            companyName={CompanyName}
            className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-full p-2 text-slate-500 transition-all"
          />
        </div>

        <div className="relative z-10 px-5 pt-6 pb-5">
          
          {/* INFO SEKCIJA */}
          <div className="flex flex-col items-center justify-center text-center">
             <div className="relative mb-3 cursor-pointer" onClick={() => navigate(`/seller/${seller?.id}`)}>
               <div className="p-1.5 bg-white rounded-full shadow-sm">
                  <CustomImage
                    src={seller?.profile}
                    alt="Seller"
                    width={84}
                    height={84}
                    className="w-[84px] h-[84px] rounded-full object-cover border border-slate-100"
                  />
               </div>
             </div>

             <div className="mb-1">
                <CustomLink 
                    href={`/seller/${seller?.id}`}
                    className="text-xl font-bold text-slate-900 flex items-center justify-center gap-1.5 hover:text-blue-600 transition-colors"
                >
                  {seller?.name}
                  {seller?.is_verified === 1 && (
                    <MdVerified className="text-blue-500 text-lg" title="Verifikovan nalog" />
                  )}
                </CustomLink>
             </div>
             
             {/* STATISTIKA I DATUM (Sada izgleda lijepo) */}
             <div className="flex items-center justify-center gap-3 mt-2 text-sm text-slate-600">
                {seller?.average_rating > 0 && (
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100">
                        <MdStar className="text-yellow-500 text-lg" />
                        <span className="font-bold text-slate-800">{Number(seller?.average_rating).toFixed(1)}</span>
                        <span className="text-slate-400">({seller?.reviews_count || 0})</span>
                    </div>
                )}
                
                {joinDate && (
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100" title="Datum pridruživanja">
                        <MdCalendarMonth className="text-slate-400 text-lg" />
                        <span className="font-medium text-slate-600">Korisnik od: {joinDate}</span>
                    </div>
                )}
             </div>
          </div>

          <div className="h-px w-full bg-slate-100 my-5"></div>

          {/* DUGMAD U GRIDU */}
          <div className="w-full flex flex-col-reverse gap-3">
              
              <button
                onClick={handleChat}
                disabled={IsStartingChat}
                className="col-span-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm"
              >
                 <MdChatBubbleOutline className="text-xl" />
                 <span>{IsStartingChat ? "Pokrećem..." : "Započni chat"}</span>
              </button>

              {/* Telefon */}
              {seller?.show_personal_details === 1 && seller?.mobile && (
                <button
                  onClick={() => setIsPhoneModalOpen(true)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm"
                >
                  <MdPhone className="text-lg" />
                  <span>Pozovi</span>
                </button>
              )}

              {/* Ponudi */}
              {isAllowedToMakeOffer && (
                <button
                   onClick={handleMakeOffer}
                   className={cn(
                     "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all",
                     (!seller?.mobile || seller?.show_personal_details !== 1) ? "col-span-2" : ""
                   )}
                >
                   <MdLocalOffer className="text-lg text-blue-500" />
                   <span>Ponudi</span>
                </button>
              )}

              {/* Apliciraj */}
              {isJobCategory && (
                <button
                  onClick={() => setShowApplyModal(true)}
                  disabled={isApplied}
                  className={cn(
                    "col-span-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-sm",
                    isApplied ? "bg-slate-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 active:scale-[0.98]"
                  )}
                >
                   <MdWorkOutline className="text-lg" />
                   <span>{isApplied ? "Već aplicirano" : "Apliciraj"}</span>
                </button>
              )}
          </div>

          <div className="mt-5 text-center">
             <CustomLink 
               href={`/seller/${seller?.id}`}
               className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-primary transition-colors uppercase tracking-wide"
             >
                Profil korisnika <MdArrowForward />
             </CustomLink>
          </div>
        </div>
      </div>

      {/* PHONE MODAL */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-sm w-[90%] p-0 gap-0 rounded-3xl overflow-hidden bg-white border-none shadow-2xl">
            <div className="bg-slate-900 text-white p-6 relative flex flex-col items-center justify-center">
                <button 
                  onClick={() => setIsPhoneModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                   <MdClose size={20} />
                </button>
                
                <CustomImage
                    src={seller?.profile}
                    alt="Seller"
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
                      Dodirni za kopiranje
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-3 mt-6">
                    <button 
                      onClick={handleCopyPhone}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
                    >
                      {isCopied ? <MdCheck className="text-green-600 text-xl" /> : <MdContentCopy className="text-xl" />}
                      <span>{isCopied ? "Kopirano" : "Kopiraj"}</span>
                    </button>

                    <a 
                      href={`tel:${seller?.mobile}`}
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