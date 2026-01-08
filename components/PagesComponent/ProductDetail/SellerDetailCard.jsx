import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MdVerifiedUser } from "react-icons/md";
import { IoMdStar } from "react-icons/io";
import { FaArrowRight, FaPaperPlane } from "react-icons/fa";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { extractYear, t } from "@/utils";
import CustomLink from "@/components/Common/CustomLink";
import { BiPhoneCall } from "react-icons/bi";
import { itemOfferApi } from "@/utils/api";
import { toast } from "sonner";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { Gift } from "lucide-react";
import MakeOfferModal from "./MakeOfferModal";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import ApplyJobModal from "./ApplyJobModal";
import CustomImage from "@/components/Common/CustomImage";
import Link from "next/link";
import { useNavigate } from "@/components/Common/useNavigate";
import { IoClose } from "react-icons/io5";

const SellerDetailCard = ({ productDetails, setProductDetails }) => {
  const { navigate } = useNavigate();
  const userData = productDetails && productDetails?.user;
  const memberSinceYear = productDetails?.created_at
    ? extractYear(productDetails.created_at)
    : "";
  const [IsStartingChat, setIsStartingChat] = useState(false);
  const loggedInUser = useSelector(userSignUpData);
  const loggedInUserId = loggedInUser?.id;
  const [IsOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const isAllowedToMakeOffer =
    productDetails?.price > 0 &&
    !productDetails?.is_already_offered &&
    Number(productDetails?.category?.is_job_category) === 0 &&
    Number(productDetails?.category?.price_optional) === 0;
  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;
  const isApplied = productDetails?.is_already_job_applied;
  const item_id = productDetails?.id;

  const offerData = {
    itemPrice: productDetails?.price,
    itemId: productDetails?.id,
  };

  const handleChat = async () => {
    if (!loggedInUserId) {
      setIsLoginOpen(true);
      return;
    }
    try {
      setIsStartingChat(true);
      const response = await itemOfferApi.offer({
        item_id: offerData.itemId,
      });
      const { data } = response.data;
      navigate("/chat?activeTab=buying&chatid=" + data?.id);
    } catch (error) {
      toast.error(t("unableToStartChat"));
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

  const handlePhoneClick = () => {
    if (!loggedInUserId) {
      setIsLoginOpen(true);
      return;
    }
    setShowPhoneModal(true);
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-overlay {
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          animation: slideUp 0.3s ease-out;
        }

        .action-btn {
          transition: all 0.2s ease;
        }

        .action-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .action-btn:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Seller Info - Minimal Clean */}
        <div className="p-5">
          <div className="flex items-center gap-3">
            {/* Profile Image */}
            <CustomImage
              onClick={() => navigate(`/seller/${productDetails?.user?.id}`)}
              src={productDetails?.user?.profile}
              alt="Seller"
              width={64}
              height={64}
              className="w-16 h-16 rounded-xl cursor-pointer object-cover border border-gray-200 hover:border-blue-400 transition-all"
            />

            {/* Name & Verified */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CustomLink
                  href={`/seller/${productDetails?.user?.id}`}
                  className="font-bold text-lg text-gray-900 hover:text-blue-600 transition-colors truncate"
                >
                  {productDetails?.user?.name}
                </CustomLink>
                {productDetails?.user?.is_verified == 1 && (
                  <MdVerifiedUser className="text-orange-500 flex-shrink-0" size={20} />
                )}
              </div>

              {/* Rating • Reviews • Member Since */}
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1 flex-wrap">
                {productDetails?.user?.reviews_count > 0 &&
                  productDetails?.user?.average_rating && (
                    <>
                      <div className="flex items-center gap-1">
                        <IoMdStar className="text-yellow-500" size={16} />
                        <span className="font-semibold text-gray-900">
                          {Number(productDetails?.user?.average_rating).toFixed(1)}
                        </span>
                      </div>
                      {memberSinceYear && <span></span>}
                    </>
                  )}
                {memberSinceYear && (
                  <span>{t("Član od")} {memberSinceYear}</span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <CustomLink
              href={`/seller/${productDetails?.user?.id}`}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowRight size={18} className="text-gray-600 rtl:scale-x-[-1]" />
            </CustomLink>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Action Buttons */}
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            {/* Chat */}
            <button
              onClick={handleChat}
              disabled={IsStartingChat}
              className="action-btn flex-1 min-w-[120px] bg-black text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50"
            >
              <IoChatboxEllipsesOutline size={20} />
              {IsStartingChat ? t("startingChat") : t("chat")}
            </button>

            {/* Call */}
            {productDetails?.user?.show_personal_details === 1 &&
              productDetails?.user?.mobile && (
                <button
                  onClick={handlePhoneClick}
                  className="action-btn flex-1 min-w-[120px] bg-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <BiPhoneCall size={20} />
                  {t("Nazovi")}
                </button>
              )}

            {/* Make Offer */}
            {isAllowedToMakeOffer && (
              <button
                onClick={handleMakeOffer}
                className="action-btn flex-1 min-w-[120px] bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <Gift size={19} />
                {t("offer")}
              </button>
            )}

            {/* Apply Job */}
            {isJobCategory && (
              <button
                className={`action-btn flex-1 min-w-[120px] px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white ${
                  isApplied ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600"
                }`}
                disabled={isApplied}
                onClick={() => setShowApplyModal(true)}
              >
                <FaPaperPlane size={18} />
                {isApplied ? t("applied") : t("apply")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div 
          className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPhoneModal(false)}
        >
          <div 
            className="modal-content bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowPhoneModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <IoClose size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <BiPhoneCall size={32} className="text-green-600" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              {"Kontaktiraj prodavača"}
            </h3>

            {/* Seller Name */}
            <p className="text-center text-gray-600 mb-6">
              {productDetails?.user?.name}
            </p>

            {/* Phone Number - Hyperlink */}
            <a
              href={`tel:+${productDetails?.user?.country_code}${productDetails?.user?.mobile}`}
              className="block w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl text-center font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
            >
              +{productDetails?.user?.country_code}{productDetails?.user?.mobile}
            </a>

            {/* Helper Text */}
            <p className="text-center text-xs text-gray-500 mt-4">
              {"Klik od poziva!"}
            </p>
          </div>
        </div>
      )}

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