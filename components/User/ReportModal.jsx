import { addReportReasonApi, getReportReasonsApi } from "@/utils/api";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/utils/toastBs";
import { t } from "@/utils";

const ReportModal = ({
  productDetails,
  setProductDetails,
  isReportModalOpen,
  setIsReportModalOpen,
}) => {
  const [reasons, setReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");
  const [IsSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await getReportReasonsApi.reportReasons();
      const { data } = response?.data;
      setReasons(data?.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();

    if (!selectedReason) {
      toast.error("Odaberi razlog.");
      return;
    }

    // Validation: Ensure custom reason is provided if "Other" is selected
    if (selectedReason === "other" && !customReason.trim()) {
      toast.error("Unesi razlog");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await addReportReasonApi.addReport({
        item_id: productDetails?.id,
        report_reason_id: selectedReason === "other" ? "" : selectedReason,
        other_message: customReason,
      });
      if (response.data?.error === true) {
        toast.error(response?.data?.message);
      } else {
        setProductDetails((prev) => ({ ...prev, is_already_reported: true }));
        toast.success(response?.data?.message);
        handleClose();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsReportModalOpen(false);
    setSelectedReason(null);
    setCustomReason("");
  };

  return (
    <Dialog open={isReportModalOpen} onOpenChange={handleClose}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {"Prijavi"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {/* Pre-defined reasons */}
          {reasons.map((reason) => (
            <button
              key={reason.id}
              onClick={() => setSelectedReason(reason.id)}
              className={`w-full text-base ltr:text-left rtl:text-right p-3 rounded-lg border transition-colors ${
                selectedReason === reason.id
                  ? "bg-primary text-white"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              {reason.translated_reason || reason.reason}
            </button>
          ))}

          {/* Other reason option */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setSelectedReason("other")}
              className={`w-full border ltr:text-left rtl:text-right p-3 rounded-lg transition-colors ${
                selectedReason === "other"
                  ? "bg-primary text-white"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              {"Ostalo"}
            </button>
            {selectedReason === "other" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={"Napiši razlog"}
                className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary mt-2"
                rows={3}
              />
            )}
          </div>
        </div>

        {/* Submit button */}
        <div className="flex gap-2 flex-col md:flex-row">
          <button
            className="w-full py-2 px-4 text-white  text-base font-medium  bg-[#000] rounded-md hover:bg-primary/90 transition-colors"
            onClick={handleClose}
          >
            {"Otkaži"}
          </button>
          <button
            className="w-full py-2 px-4 text-base font-medium  text-white  bg-primary rounded-md hover:bg-primary/90 transition-colors"
            onClick={handleReport}
            disabled={!selectedReason || IsSubmitting}
          >
            {IsSubmitting ? "Šaljem..." : "Pošalji"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
