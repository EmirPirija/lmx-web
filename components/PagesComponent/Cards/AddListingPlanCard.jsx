import { FaArrowRight, FaCheck } from "@/components/Common/UnifiedIconPack";
import { formatPriceAbbreviated, t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";
import { isPromoFreeAccessEnabled } from "@/lib/promoMode";

const AddListingPlanCard = ({ pckg, handlePurchasePackage }) => {
  const descriptionItems =
    pckg?.translated_description || pckg?.description
      ? (pckg?.translated_description || pckg?.description).split("\r\n")
      : [];

  const isActive = pckg?.is_active == 1;
  const promoEnabled = isPromoFreeAccessEnabled();

  return (
    <div
      className={`rounded-xl relative p-6 sm:p-8 border transition-all duration-300 ${
        isActive 
          ? "bg-primary !text-white shadow-lg scale-[1.02]" 
          : "bg-white shadow-sm hover:shadow-xl hover:-translate-y-1"
      }`}
    >
      {/* Sale Badge */}
      {pckg?.discount_in_percentage > 0 && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
          <span className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-lg">
            {t("save")} {pckg?.discount_in_percentage}% {t("off")}
          </span>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`rounded-xl overflow-hidden ${isActive ? 'ring-2 ring-white/30' : 'ring-1 ring-gray-200'}`}>
          <CustomImage
            height={80}
            width={80}
            src={pckg.icon}
            alt={pckg?.translated_name || pckg?.name}
            className="aspect-square"
          />
        </div>
        <div className="flex flex-col gap-2 overflow-hidden flex-1">
          <h2 className="text-xl font-semibold line-clamp-2">
            {pckg?.translated_name || pckg?.name}
          </h2>
          <div className="flex items-baseline gap-2">
            {!promoEnabled && pckg?.final_price !== 0 ? (
              <p className="text-2xl font-bold">
                {formatPriceAbbreviated(pckg?.final_price)}
              </p>
            ) : (
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-300">
                Besplatno do daljnjeg
              </p>
            )}
            {!promoEnabled && pckg?.price > pckg?.final_price && (
              <p className={`text-lg line-through ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                {formatPriceAbbreviated(pckg?.price)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Divider with gradient effect */}
      <div className={`h-px mb-6 ${isActive ? 'bg-white/20' : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'}`}></div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={`p-3 rounded-lg text-center ${isActive ? 'bg-white/10' : 'bg-gray-50'}`}>
          <div className={`text-2xl font-bold ${isActive ? 'text-white' : 'text-primary'}`}>
            {pckg?.duration === "unlimited" ? "∞" : pckg?.duration}
          </div>
          <div className={`text-xs uppercase tracking-wide ${isActive ? 'text-white/80' : 'text-gray-600'}`}>
            {t("days")}
          </div>
        </div>
        <div className={`p-3 rounded-lg text-center ${isActive ? 'bg-white/10' : 'bg-gray-50'}`}>
          <div className={`text-2xl font-bold ${isActive ? 'text-white' : 'text-primary'}`}>
            {pckg?.item_limit === "unlimited" ? "∞" : pckg?.item_limit}
          </div>
          <div className={`text-xs uppercase tracking-wide ${isActive ? 'text-white/80' : 'text-gray-600'}`}>
            {t("adsListing")}
          </div>
        </div>
      </div>

      {/* Feature List */}
      <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-2 mb-6 scrollbar-thin">
        {descriptionItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
              isActive ? 'bg-white/20' : 'bg-primary/10'
            }`}>
              <FaCheck 
                size={12}
                className={isActive ? "text-white" : "text-primary"}
              />
            </div>
            <span className={`text-sm leading-relaxed ${isActive ? 'text-white/90' : 'text-gray-700'}`}>
              {item}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={() => handlePurchasePackage(pckg)}
        disabled={isActive}
        className={`w-full py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-3 transition-all duration-300 ${
          isActive 
            ? "bg-white/20 cursor-default" 
            : "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white hover:shadow-lg active:scale-95"
        }`}
      >
        <span className="text-base">
          {isActive
            ? t("currentPlan") || "Current Plan"
            : promoEnabled
            ? "Aktiviraj besplatno"
            : t("choosePlan")}
        </span>
        {!isActive && (
          <FaArrowRight size={18} className="rtl:scale-x-[-1] group-hover:translate-x-1 transition-transform" />
        )}
      </button>
    </div>
  );
};

export default AddListingPlanCard;
