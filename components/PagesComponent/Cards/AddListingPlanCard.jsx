import { FaArrowRight, FaCheck } from "react-icons/fa";
import { formatPriceAbbreviated, t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";

const AddListingPlanCard = ({ pckg, handlePurchasePackage }) => {
  const descriptionItems =
    pckg?.translated_description || pckg?.description
      ? (pckg?.translated_description || pckg?.description).split("\r\n")
      : [];

  return (
    <div
      className={`rounded-lg relative p-4 sm:p-8 shadow-sm border text-color ${
        pckg?.is_active == 1 ? "bg-primary !text-white" : "bg-white"
      }`}
    >
      {/* Sale Badge */}
      {pckg?.discount_in_percentage > 0 && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
          <span className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap">
            {t("save")} {pckg?.discount_in_percentage}% {t("off")}
          </span>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-center gap-4">
        <CustomImage
          height={80}
          width={80}
          src={pckg.icon}
          alt="Bronze medal"
          className="aspect-square rounded-lg"
        />
        <div className="flex flex-col gap-2 overflow-hidden">
          <h2 className="text-xl font-medium mb-1 line-clamp-2 overflow-hidden">
            {pckg?.translated_name || pckg?.name}
          </h2>
          <div className="flex items-center gap-1">
            {pckg?.final_price !== 0 ? (
              <p className="text-xl font-bold">
                {formatPriceAbbreviated(pckg?.final_price)}
              </p>
            ) : (
              t("Free")
            )}
            {pckg?.price > pckg?.final_price && (
              <p className="text-xl font-bold line-through text-gray-500">
                {formatPriceAbbreviated(pckg?.price)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-6"></div>

      {/* Feature List */}
      <div className="flex flex-col gap-2 h-[250px] overflow-y-auto p-4 text-sm">
        <div className="flex items-center gap-3">
          <span
            className={`${
              pckg?.is_active == 1 ? "text-white" : "text-primary"
            }`}
          >
            <FaCheck />
          </span>
          <span className="text-normal ">
            {pckg?.duration === "unlimited" ? t("unlimited") : pckg?.duration}{" "}
            {t("days")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`${
              pckg?.is_active == 1 ? "text-white" : "text-primary"
            }`}
          >
            <FaCheck />
          </span>
          <span className="text-normal ">
            {pckg?.item_limit === "unlimited"
              ? t("unlimited")
              : pckg?.item_limit}{" "}
            {t("adsListing")}
          </span>
        </div>
        {descriptionItems.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span
              className={`${
                pckg?.is_active == 1 ? "text-white" : "text-primary"
              }`}
            >
              <FaCheck />
            </span>
            <span className="text-normal ">{item}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center h-12 max-h-12 p-4 md:p-0">
        <button
          onClick={() => handlePurchasePackage(pckg)}
          className={` w-full ${
            pckg?.is_active == 1 ? "hidden" : "flex"
          } py-1 px-3 md:py-2 md:px-4 lg:py-3 lg:px-6 rounded-lg  items-center text-primary  justify-center hover:bg-primary border hover:text-white transition-all duration-300`}
        >
          <span className="font-light text-lg">{t("choosePlan")}</span>
          <span className="ml-2">
            <FaArrowRight size={20} className="rtl:scale-x-[-1]" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default AddListingPlanCard;
