import { useNavigate } from "@/components/Common/useNavigate";
import NoData from "@/components/EmptyStates/NoData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getIsShowBankDetails,
  hideBankDetails,
} from "@/redux/reducer/globalStateSlice";
import { t } from "@/utils";
import { createPaymentIntentApi } from "@/utils/api";
import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "@/utils/toastBs";

const BankDetailsModal = ({ packageId, bankDetails }) => {
  const { navigate } = useNavigate();
  const IsShowBankDetails = useSelector(getIsShowBankDetails);
  const IsBankDetails = bankDetails && Object.keys(bankDetails).length > 0;
  const [IsConfirmingPayment, setIsConfirmingPayment] = useState(false);

  const handleConfirmPayment = async () => {
    try {
      setIsConfirmingPayment(true);
      const res = await createPaymentIntentApi.createIntent({
        package_id: packageId,
        payment_method: "bankTransfer",
      });
      if (res?.data?.error === false) {
        toast.success("Uplata potvrđena");
        hideBankDetails();
        navigate("/transactions");
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.log("Failed to confirm Payment", error);
    } finally {
      setIsConfirmingPayment(false);
    }
  };
  return (
    <Dialog open={IsShowBankDetails} onOpenChange={hideBankDetails}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {"Podaci bankovnog računa"}
          </DialogTitle>
          <DialogDescription className="!text-base">
            {"Uplati iznos na sljedeći račun"}
          </DialogDescription>
          {IsBankDetails ? (
            <>
              <div className="flex flex-col gap-3 !mt-8">
                <div className="flex items-center gap-2">
                  <p className="w-[35%] opacity-60 font-medium text-base">
                    {"Vlasnik računa"}
                  </p>
                  <p className="text-base px-3 py-2 bg-muted w-[75%] rounded">
                    {bankDetails?.account_holder_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="w-[35%] opacity-60 font-medium text-base">
                    {"Broj računa"}
                  </p>
                  <p className="text-base px-3 py-2 bg-muted w-[75%] rounded">
                    {bankDetails?.account_number}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="w-[35%] opacity-60 font-medium text-base">
                    {"Naziv banke"}
                  </p>
                  <p className="text-base px-3 py-2 bg-muted w-[75%] rounded">
                    {bankDetails?.bank_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="w-[35%] opacity-60 font-medium text-base">
                    SWIFT/IFSC Code
                  </p>
                  <p className="text-base px-3 py-2 bg-muted w-[75%] rounded">
                    {bankDetails?.ifsc_swift_code}
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-4 !mt-8">
                <button
                  className="px-4 py-2 border flex-1 rounded whitespace-nowrap"
                  onClick={hideBankDetails}
                >
                  {"Otkaži"}
                </button>
                <button
                  className="px-4 py-2 bg-primary flex-1 text-white rounded whitespace-nowrap disabled:opacity-66"
                  onClick={handleConfirmPayment}
                  disabled={IsConfirmingPayment}
                >
                  {IsConfirmingPayment
                    ? "Potvrđujem uplatu"
                    : "Potvrdi uplatu"}
                </button>
              </div>
            </>
          ) : (
            <NoData name={"Podaci bankovnog računa"} />
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default BankDetailsModal;
