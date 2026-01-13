import {
  formatDateMonthYear,
  formatPriceAbbreviated,
  formatSalaryRange,
  t,
} from "@/utils/index";
import { FaBriefcase, FaRegCalendarCheck, FaRegHeart } from "react-icons/fa";
import { IoEyeOutline, IoClose, IoStatsChart } from "react-icons/io5";
import { MdLocalOffer } from "react-icons/md";
import { FiPercent } from "react-icons/fi";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { deleteItemApi } from "@/utils/api";
import CustomLink from "@/components/Common/CustomLink";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import { useState } from "react";
import JobApplicationModal from "./JobApplicationModal";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import { useNavigate } from "@/components/Common/useNavigate";
import { TrendingUp, TrendingDown, MessageSquare, Share2, Calendar, MapPin } from "lucide-react";
 
const MyAdsListingDetailCard = ({ productDetails }) => {
  const { navigate } = useNavigate();
  const CompanyName = useSelector(getCompanyName);
 
  const [IsDeleteAccount, setIsDeleteAccount] = useState(false);
  const [IsDeletingAccount, setIsDeletingAccount] = useState(false);
  const [IsShowJobApplications, setIsShowJobApplications] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
 
  const productName =
    productDetails?.translated_item?.name || productDetails?.name;
  
  // share variables
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ad-details/${productDetails?.slug}`;
  const FbTitle = productName + " | " + CompanyName;
  const headline = `🚀 Discover the perfect deal! Explore "${productName}" from ${CompanyName} and grab it before it's gone. Shop now at`;
  
  const isEditable =
    productDetails?.status &&
    !["permanent rejected", "inactive", "sold out", "expired"].includes(
      productDetails.status
    );
 
  // job application variables
  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;
  const isShowReceivedJobApplications =
    isJobCategory &&
    (productDetails?.status === "approved" ||
      productDetails?.status === "featured" ||
      productDetails?.status === "sold out");
 
  // 🔥 AKCIJA/SALE Logic
  const isOnSale = productDetails?.is_on_sale === true || productDetails?.is_on_sale === 1;
  const oldPrice = productDetails?.old_price;
  const currentPrice = productDetails?.price;
  const discountPercentage = productDetails?.discount_percentage || (
    isOnSale && oldPrice && currentPrice && Number(oldPrice) > Number(currentPrice)
      ? Math.round(((Number(oldPrice) - Number(currentPrice)) / Number(oldPrice)) * 100)
      : 0
  );
  const savings = isOnSale && oldPrice && currentPrice 
    ? Math.max(0, Number(oldPrice) - Number(currentPrice)) 
    : 0;
 
  const deleteAd = async () => {
    try {
      setIsDeletingAccount(true);
      const res = await deleteItemApi.deleteItem({
        item_id: productDetails?.id,
      });
      if (res?.data?.error === false) {
        toast.success(t("adDeleted"));
        navigate("/my-ads");
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsDeletingAccount(false);
    }
  };
 
  // Calculate statistics
  const calculateStats = () => {
    const views = productDetails?.clicks || 0;
    const likes = productDetails?.total_likes || 0;
    const shares = productDetails?.total_shares || 0;
    const chatOffers = productDetails?.total_offers || 0;
    const createdDate = new Date(productDetails?.created_at);
    const today = new Date();
    const daysActive = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
    const avgViewsPerDay = daysActive > 0 ? (views / daysActive).toFixed(1) : 0;
    const engagementRate = views > 0 ? (((likes + chatOffers) / views) * 100).toFixed(1) : 0;
    const likeToViewRatio = views > 0 ? ((likes / views) * 100).toFixed(1) : 0;
    
    return {
      views,
      likes,
      shares,
      chatOffers,
      daysActive,
      avgViewsPerDay,
      engagementRate,
      likeToViewRatio,
    };
  };
 
  const stats = calculateStats();
 
  // 🔥 PRICE DISPLAY COMPONENT
  const PriceDisplay = ({ size = "large" }) => {
    const isLarge = size === "large";
    
    if (isJobCategory) {
      return (
        <h2
          className={`text-primary font-bold break-all text-balance line-clamp-2 ${isLarge ? 'text-3xl' : 'text-xl'}`}
          title={formatSalaryRange(productDetails?.min_salary, productDetails?.max_salary)}
        >
          {formatSalaryRange(productDetails?.min_salary, productDetails?.max_salary)}
        </h2>
      );
    }
 
    // 🔥 AKCIJA/SALE Price Display
    if (isOnSale && oldPrice && discountPercentage > 0) {
      return (
        <div className="flex flex-col gap-2">
          {/* Sale Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md animate-pulse">
              <MdLocalOffer size={16} />
              AKCIJA
            </span>
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm font-bold px-3 py-1.5 rounded-full">
              <FiPercent size={14} />
              -{discountPercentage}%
            </span>
          </div>
          
          {/* Prices */}
          <div className="flex items-baseline gap-3 flex-wrap">
            {/* Old Price - crossed out */}
            <span 
              className={`text-gray-400 line-through decoration-red-500 decoration-2 ${isLarge ? 'text-xl' : 'text-base'}`}
              title={formatPriceAbbreviated(oldPrice)}
            >
              {formatPriceAbbreviated(oldPrice)}
            </span>
            
            {/* New/Current Price - highlighted */}
            <h2
              className={`font-black text-red-600 ${isLarge ? 'text-3xl' : 'text-xl'}`}
              title={formatPriceAbbreviated(currentPrice)}
            >
              {formatPriceAbbreviated(currentPrice)}
            </h2>
          </div>
          
          {/* Savings info */}
          {savings > 0 && (
            <p className="text-sm text-green-600 font-medium">
              🎉 {t("ustedite") || "Uštedite"} {formatPriceAbbreviated(savings)}
            </p>
          )}
        </div>
      );
    }
 
    // Regular Price Display
    return (
      <h2
        className={`text-primary font-bold break-all text-balance line-clamp-2 ${isLarge ? 'text-3xl' : 'text-xl'}`}
        title={formatPriceAbbreviated(productDetails?.price)}
      >
        {formatPriceAbbreviated(productDetails?.price)}
      </h2>
    );
  };
 
  // Statistics Modal Component
  const StatisticsModal = () => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={() => setShowStatistics(false)}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IoStatsChart className="text-white" size={24} />
                <h3 className="text-xl font-bold text-white">
                  {t("statistics") || "Ad Statistics"}
                </h3>
              </div>
              <p className="text-blue-100 text-sm line-clamp-1">
                {productName}
              </p>
              {/* 🔥 Show AKCIJA badge in stats modal too */}
              {isOnSale && discountPercentage > 0 && (
                <span className="inline-flex items-center gap-1 mt-2 bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                  <MdLocalOffer size={12} />
                  AKCIJA -{discountPercentage}%
                </span>
              )}
            </div>
            <button
              onClick={() => setShowStatistics(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <IoClose size={24} className="text-white" />
            </button>
          </div>
        </div>
 
        {/* Content */}
        <div className="p-6">
          {/* 🔥 Price Info Card (if on sale) */}
          {isOnSale && discountPercentage > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-xl border border-red-200 mb-6">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MdLocalOffer className="text-red-600" size={20} />
                {t("saleInfo") || "Akcijska ponuda"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border border-red-100">
                  <p className="text-xs text-gray-500 mb-1">{t("oldPrice") || "Stara cijena"}</p>
                  <p className="text-lg font-bold text-gray-400 line-through">{formatPriceAbbreviated(oldPrice)}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                  <p className="text-xs text-gray-500 mb-1">{t("newPrice") || "Nova cijena"}</p>
                  <p className="text-lg font-bold text-red-600">{formatPriceAbbreviated(currentPrice)}</p>
                </div>
                <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 mb-1">{t("savings") || "Ušteda"}</p>
                  <p className="text-lg font-bold text-green-700">{formatPriceAbbreviated(savings)}</p>
                </div>
              </div>
            </div>
          )}
 
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Views */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <IoEyeOutline className="text-blue-600" size={20} />
                <span className="text-xs font-medium text-blue-900">{t("views")}</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.views}</p>
              <p className="text-xs text-blue-600 mt-1">{stats.avgViewsPerDay}/day</p>
            </div>
 
            {/* Likes */}
            <div className="bg-gradient-to-br from-pink-50 to-red-50 p-4 rounded-xl border border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <FaRegHeart className="text-pink-600" size={18} />
                <span className="text-xs font-medium text-pink-900">{t("favorites")}</span>
              </div>
              <p className="text-2xl font-bold text-pink-900">{stats.likes}</p>
              <p className="text-xs text-pink-600 mt-1">{stats.likeToViewRatio}% of views</p>
            </div>
 
            {/* Chat/Offers */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="text-green-600" size={18} />
                <span className="text-xs font-medium text-green-900">{t("offers") || "Offers"}</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{stats.chatOffers}</p>
              <p className="text-xs text-green-600 mt-1">{t("interactions")}</p>
            </div>
 
            {/* Shares */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="text-purple-600" size={18} />
                <span className="text-xs font-medium text-purple-900">{t("shares")}</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{stats.shares}</p>
              <p className="text-xs text-purple-600 mt-1">{t("social")}</p>
            </div>
          </div>
 
          {/* Engagement Metrics */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-5 rounded-xl border border-orange-200 mb-6">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-orange-600" size={20} />
              {t("engagementMetrics") || "Engagement Metrics"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{t("engagementRate") || "Engagement Rate"}:</span>
                <span className="text-lg font-bold text-orange-600">{stats.engagementRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{t("daysActive") || "Days Active"}:</span>
                <span className="text-lg font-bold text-orange-600">{stats.daysActive}</span>
              </div>
            </div>
          </div>
 
          {/* Ad Details */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6">
            <h4 className="font-bold text-gray-900 mb-4">{t("adDetails") || "Ad Details"}</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="text-gray-600" size={18} />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{t("postedOn")}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDateMonthYear(productDetails?.created_at)}
                  </p>
                </div>
              </div>
              
              {productDetails?.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-600" size={18} />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{t("location")}</p>
                    <p className="text-sm font-semibold text-gray-900">{productDetails?.address}</p>
                  </div>
                </div>
              )}
 
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  productDetails?.status === 'approved' ? 'bg-green-500' :
                  productDetails?.status === 'featured' ? 'bg-blue-500' :
                  productDetails?.status === 'pending' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{t("status")}</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {productDetails?.status}
                  </p>
                </div>
              </div>
 
              {productDetails?.category?.name && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{t("category")}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {productDetails?.category?.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
 
          {/* Performance Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-200">
            <h4 className="font-bold text-gray-900 mb-3">💡 {t("tips") || "Tips to Improve"}</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {stats.views < 50 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{t("tipLowViews") || "Share your ad on social media to get more visibility"}</span>
                </li>
              )}
              {stats.likeToViewRatio < 5 && stats.views > 20 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{t("tipLowLikes") || "Add better photos to increase engagement"}</span>
                </li>
              )}
              {stats.chatOffers === 0 && stats.views > 30 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{t("tipNoOffers") || "Consider adjusting your price to attract buyers"}</span>
                </li>
              )}
              {stats.avgViewsPerDay < 2 && stats.daysActive > 7 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{t("tipLowActivity") || "Refresh your ad to boost visibility"}</span>
                </li>
              )}
              {/* 🔥 Sale-specific tip */}
              {isOnSale && discountPercentage > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span className="text-green-700 font-medium">
                    {t("tipOnSale") || `Vaš oglas je na akciji sa ${discountPercentage}% popusta - to privlači više kupaca!`}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
 
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
      `}</style>
    </div>
  );
 
  return (
    <>
      <div className="flex flex-col border rounded-lg overflow-hidden">
        {/* 🔥 AKCIJA BANNER - Top Banner when on sale */}
        {isOnSale && discountPercentage > 0 && (
          <div className="bg-gradient-to-r from-red-500 via-orange-500 to-red-500 px-4 py-2 flex items-center justify-center gap-2 animate-pulse">
            <MdLocalOffer className="text-white" size={18} />
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              AKCIJA - Uštedite {discountPercentage}%
            </span>
            <MdLocalOffer className="text-white" size={18} />
          </div>
        )}
 
        <div className="flex w-full flex-col gap-4 p-4 border-b">
          <div className="flex justify-between max-w-full">
            <div className="flex items-start gap-2 flex-1">
              <h1 className="text-2xl font-medium word-break-all line-clamp-2" title={productName}>
                {productName}
              </h1>
              {/* 🔥 Small AKCIJA badge next to title */}
              {isOnSale && discountPercentage > 0 && (
                <span className="shrink-0 inline-flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{discountPercentage}%
                </span>
              )}
            </div>
            {productDetails?.status === "approved" && (
              <ShareDropdown
                url={currentUrl}
                title={FbTitle}
                headline={headline}
                companyName={CompanyName}
                className="rounded-full size-10 flex items-center justify-center p-2 border shrink-0"
              />
            )}
          </div>
          <div className="flex justify-between items-end w-full">
            {/* 🔥 Use PriceDisplay component */}
            <PriceDisplay size="large" />
            {/* <p className="text-sm text-muted-foreground whitespace-nowrap">
              {t("adId")} #{productDetails?.id}
            </p> */}
          </div>
        </div>
 
        <div className="flex items-center justify-center text-muted-foreground flex-wrap">
          {/* <div className="text-sm flex items-center gap-1">
            <FaRegCalendarCheck size={14} />
            {t("postedOn")}: {formatDateMonthYear(productDetails?.created_at)}
          </div>
          <div className="ltr:border-l rtl:border-r gap-1 flex items-center text-sm px-2">
            <IoEyeOutline size={14} />
            {t("views")}: {productDetails?.clicks}
          </div>
          <div className="ltr:border-l rtl:border-r gap-1 flex items-center text-sm px-2">
            <FaRegHeart size={14} />
            {t("favorites")}: {productDetails?.total_likes}
          </div> */}
          {/* 🔥 Show sale indicator in stats bar */}
          {isOnSale && discountPercentage > 0 && (
            <div className="ltr:border-l rtl:border-r gap-1 flex items-center text-sm px-2 text-green-600 font-medium">
              <MdLocalOffer size={14} />
              {t("onSale") || "Na akciji"}
            </div>
          )}
        </div>
 
        <div className="p-4 flex items-center gap-4 flex-wrap">
          <button
            className="py-2 px-4 flex-1 min-w-[120px] rounded-md bg-black text-white font-medium hover:bg-gray-800 transition-colors"
            onClick={() => setIsDeleteAccount(true)}
          >
            {t("delete")}
          </button>
 
          {isEditable && (
            <CustomLink
              href={`/edit-listing/${productDetails?.id}`}
              className="bg-primary py-2 px-4 flex-1 min-w-[120px] rounded-md text-white font-medium text-center hover:opacity-90 transition-opacity"
            >
              {t("edit")}
            </CustomLink>
          )}
 
          <button
            onClick={() => setShowStatistics(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 py-2 px-4 flex-1 min-w-[120px] rounded-md text-white font-medium flex items-center gap-2 justify-center hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            <IoStatsChart size={18} />
            {t("statistics") || "Statistics"}
          </button>
 
          {isShowReceivedJobApplications && (
            <button
              onClick={() => setIsShowJobApplications(true)}
              className="bg-black py-2 px-4 flex-1 min-w-[120px] rounded-md text-white font-medium whitespace-nowrap flex items-center gap-2 justify-center hover:bg-gray-800 transition-colors"
            >
              <FaBriefcase />
              {t("jobApplications")}
            </button>
          )}
        </div>
      </div>
 
      {/* Statistics Modal */}
      {showStatistics && <StatisticsModal />}
 
      <JobApplicationModal
        IsShowJobApplications={IsShowJobApplications}
        setIsShowJobApplications={setIsShowJobApplications}
        listingId={productDetails?.id}
        isJobFilled={productDetails?.status === "sold out"}
      />
      <ReusableAlertDialog
        open={IsDeleteAccount}
        onCancel={() => setIsDeleteAccount(false)}
        onConfirm={deleteAd}
        title={t("areYouSure")}
        description={t("youWantToDeleteThisAd")}
        cancelText={t("cancel")}
        confirmText={t("yes")}
        confirmDisabled={IsDeletingAccount}
      />
    </>
  );
};
 
export default MyAdsListingDetailCard;