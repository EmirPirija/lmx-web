import { useState } from "react";
import { toast } from "sonner";
import { 
  MdCheckCircle, 
  MdCancel, 
  MdSell,
  MdRefresh,
  MdWarning
} from "react-icons/md";
import { chanegItemStatusApi } from "@/utils/api";
import SoldOutModal from "./SoldOutModal";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import { t } from "@/utils";
import { useNavigate } from "@/components/Common/useNavigate";
import { cn } from "@/lib/utils";


const AdsStatusChangeCards = ({
  productDetails,
  setProductDetails,
  status,
  setStatus,
}) => {
  const { navigate } = useNavigate();
  const [IsChangingStatus, setIsChangingStatus] = useState(false);
  const [showSoldOut, setShowSoldOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRadioValue, setSelectedRadioValue] = useState(null);

  const isJobAd = productDetails?.category?.is_job_category === 1;
  const isSoftRejected = productDetails?.status === "soft rejected" || productDetails?.status === "resubmitted";
  const canChangeStatus = productDetails?.status === "approved" || productDetails?.status === "inactive";
  const isShowRejectedReason = productDetails?.rejected_reason && (productDetails?.status === "soft rejected" || productDetails?.status === "permanent rejected");

  // Status options configuration
  const statusOptions = [
    {
      value: "approved",
      label: t("active") || "Aktivno",
      description: "Oglas je vidljiv svima",
      icon: MdCheckCircle,
      color: "green",
      disabled: false
    },
    {
      value: "inactive",
      label: t("deactivate") || "Deaktiviraj",
      description: "Privremeno sakrij oglas",
      icon: MdCancel,
      color: "orange",
      disabled: false
    },
    {
      value: "sold out",
      label: isJobAd ? t("jobClosed") || "Posao zatvoren" : t("soldOut") || "Prodano",
      description: isJobAd ? "Označite poziciju kao popunjenu" : "Označite artikal kao prodan",
      icon: MdSell,
      color: "blue",
      disabled: productDetails?.status === "inactive"
    }
  ];

  const resubmitAdForReview = async () => {
    try {
      const res = await chanegItemStatusApi.changeItemStatus({
        item_id: productDetails?.id,
        status: "resubmitted",
      });
      if (res?.data?.error === false) {
        toast.success(t("adResubmitted") || "Oglas ponovo poslan");
        setProductDetails((prev) => ({ ...prev, status: "resubmitted" }));
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const updateItemStatus = async () => {
    if (productDetails?.status === status) {
      toast.error(t("changeStatusToSave") || "Promijenite status da sačuvate");
      return;
    }
    if (status === "sold out") {
      setShowSoldOut(true);
      return;
    }
    try {
      setIsChangingStatus(true);
      const res = await chanegItemStatusApi.changeItemStatus({
        item_id: productDetails?.id,
        status: status === "approved" ? "active" : status,
      });
      if (res?.data?.error === false) {
        setProductDetails((prev) => ({ ...prev, status }));
        toast.success(t("statusUpdated") || "Status ažuriran");
        navigate("/my-ads");
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const makeItemSoldOut = async () => {
    try {
      setIsChangingStatus(true);
      const res = await chanegItemStatusApi.changeItemStatus({
        item_id: productDetails?.id,
        status: "sold out",
        sold_to: selectedRadioValue,
      });
      if (res?.data?.error === false) {
        toast.success(t("statusUpdated") || "Status ažuriran");
        setProductDetails((prev) => ({ ...prev, status: "sold out" }));
        setShowConfirmModal(false);
      } else {
        toast.error(t("failedToUpdateStatus") || "Greška pri ažuriranju");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsChangingStatus(false);
    }
  };

  // REJECTED VIEW
  if (isSoftRejected) {
    return (
      <>
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="bg-red-50 px-5 py-4 border-b border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <MdWarning className="text-red-600" size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{t("adWasRejectedResubmitNow") || "Oglas odbijen"}</h3>
                <p className="text-sm text-slate-600">Molimo pregledajte razlog i pošaljite ponovo</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {productDetails?.rejected_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 mb-1">
                  {t("rejectedReason") || "Razlog odbijanja"}:
                </p>
                <p className="text-sm text-red-700">{productDetails?.rejected_reason}</p>
              </div>
            )}

            <button
              className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={productDetails?.status === "resubmitted"}
              onClick={resubmitAdForReview}
            >
              <MdRefresh size={20} />
              {productDetails?.status === "resubmitted"
                ? t("resubmitted") || "Ponovo poslano"
                : t("resubmit") || "Pošalji ponovo"}
            </button>
          </div>
        </div>
      </>
    );
  }

  // NORMAL STATUS CHANGE VIEW
  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{t("changeStatus") || "Promijeni status"}</h3>
          <p className="text-sm text-slate-500 mt-0.5">Izaberite novi status za vaš oglas</p>
        </div>

        <div className="p-5 space-y-3">
          {/* Rejected Reason Warning */}
          {isShowRejectedReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-red-900 mb-1">
                {t("rejectedReason") || "Razlog odbijanja"}:
              </p>
              <p className="text-sm text-red-700">{productDetails?.rejected_reason}</p>
            </div>
          )}

          {/* Status Cards */}
          <div className="space-y-3">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = status === option.value;
              const isDisabled = !canChangeStatus || option.disabled;

              return (
                <button
                  key={option.value}
                  onClick={() => !isDisabled && setStatus(option.value)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 transition-all text-left",
                    "hover:shadow-sm active:scale-[0.99]",
                    isSelected && option.color === "green" && "border-green-500 bg-green-50",
                    isSelected && option.color === "orange" && "border-orange-500 bg-orange-50",
                    isSelected && option.color === "blue" && "border-blue-500 bg-blue-50",
                    !isSelected && !isDisabled && "border-slate-200 hover:border-slate-300",
                    isDisabled && "opacity-50 cursor-not-allowed hover:shadow-none"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      isSelected && option.color === "green" && "bg-green-100",
                      isSelected && option.color === "orange" && "bg-orange-100",
                      isSelected && option.color === "blue" && "bg-blue-100",
                      !isSelected && "bg-slate-100"
                    )}>
                      <Icon 
                        size={22} 
                        className={cn(
                          isSelected && option.color === "green" && "text-green-600",
                          isSelected && option.color === "orange" && "text-orange-600",
                          isSelected && option.color === "blue" && "text-blue-600",
                          !isSelected && "text-slate-500"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{option.label}</h4>
                        {isSelected && (
                          <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full",
                            option.color === "green" && "bg-green-100 text-green-700",
                            option.color === "orange" && "bg-orange-100 text-orange-700",
                            option.color === "blue" && "bg-blue-100 text-blue-700"
                          )}>
                            Izabrano
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Save Button */}
          <button
            className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
            onClick={updateItemStatus}
            disabled={IsChangingStatus || !canChangeStatus}
          >
            {IsChangingStatus ? "Čuvanje..." : t("save") || "Sačuvaj promjene"}
          </button>

          {/* Disabled info */}
          {!canChangeStatus && (
            <p className="text-xs text-slate-500 text-center mt-2">
              Status se može promijeniti samo kada je oglas aktivan ili deaktiviran
            </p>
          )}
        </div>
      </div>

      <SoldOutModal
        productDetails={productDetails}
        showSoldOut={showSoldOut}
        setShowSoldOut={setShowSoldOut}
        selectedRadioValue={selectedRadioValue}
        setSelectedRadioValue={setSelectedRadioValue}
        setShowConfirmModal={setShowConfirmModal}
      />

      <ReusableAlertDialog
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={makeItemSoldOut}
        title={isJobAd ? t("confirmHire") : t("confirmSoldOut")}
        description={isJobAd ? t("markAsClosedDescription") : t("cantUndoChanges")}
        cancelText={t("cancel")}
        confirmText={t("confirm")}
        confirmDisabled={IsChangingStatus}
      />
    </>
  );
};

export default AdsStatusChangeCards;