import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { t } from "@/utils";
import { formatPriceAbbreviated } from "@/utils";
import { getItemBuyerListApi } from "@/utils/api";
import NoDataFound from "../../../public/assets/no_data_found_illustrator.svg";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import CustomImage from "@/components/Common/CustomImage";
import { useDropzone } from "react-dropzone";
import { 
  MdClose, 
  MdReceipt, 
  MdInventory, 
  MdRemove, 
  MdAdd,
  MdCloudUpload,
  MdCheck,
  MdInfo
} from "react-icons/md";
import { cn } from "@/lib/utils";

const SoldOutModal = ({
  productDetails,
  showSoldOut,
  setShowSoldOut,
  selectedRadioValue,
  setSelectedRadioValue,
  setShowConfirmModal,
  onBuyerSelected,
  onSoldWithDetails,
}) => {
  const [buyers, setBuyers] = useState([]);
  const [isNoneOfAboveChecked, setIsNoneOfAboveChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Receipt state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [saleNote, setSaleNote] = useState("");
  
  // Inventory state
  const [quantitySold, setQuantitySold] = useState(1);
  
  // Current step in modal
  const [currentStep, setCurrentStep] = useState(1); // 1: Select buyer, 2: Add details

  const isJobAd = productDetails?.category?.is_job_category === 1;
  const hasInventory = productDetails?.inventory_count && productDetails?.inventory_count > 0;
  const remainingInventory = hasInventory ? productDetails.inventory_count : 1;

  // Reset state when modal opens
  useEffect(() => {
    if (showSoldOut) {
      getBuyers();
      setCurrentStep(1);
      setReceiptFile(null);
      setReceiptPreview(null);
      setSaleNote("");
      setQuantitySold(1);
    }
  }, [showSoldOut]);

  // Dropzone for receipt
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const clearReceipt = () => {
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleNoneOfAboveChecked = (checked) => {
    if (selectedRadioValue !== null) {
      setSelectedRadioValue(null);
    }
    setIsNoneOfAboveChecked(checked);
  };

  const handleRadioButtonCheck = (value) => {
    if (isNoneOfAboveChecked) {
      setIsNoneOfAboveChecked(false);
    }
    setSelectedRadioValue(value);
  };

  const handleHideModal = () => {
    setIsNoneOfAboveChecked(false);
    setSelectedRadioValue(null);
    setShowSoldOut(false);
    setCurrentStep(1);
    clearReceipt();
  };

  const getBuyers = async () => {
    try {
      setIsLoading(true);
      const res = await getItemBuyerListApi.getItemBuyerList({
        item_id: productDetails?.id,
      });
      setBuyers(res?.data?.data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Proceed to details step
  const handleProceedToDetails = () => {
    setCurrentStep(2);
  };

  // Final submission
  const handleFinalSoldOut = () => {
    const selectedBuyer = selectedRadioValue 
      ? buyers.find((b) => b.id === selectedRadioValue)
      : null;

    // If we have onSoldWithDetails callback (new enhanced flow)
    if (onSoldWithDetails) {
      onSoldWithDetails({
        buyerId: selectedRadioValue,
        buyerName: selectedBuyer?.name || null,
        quantitySold: quantitySold,
        receiptFile: receiptFile,
        saleNote: saleNote,
        remainingAfterSale: remainingInventory - quantitySold,
      });
      handleHideModal();
      return;
    }

    // Legacy flow - if buyer selected, trigger review
    if (selectedRadioValue && onBuyerSelected) {
      onBuyerSelected({
        id: selectedRadioValue,
        name: selectedBuyer?.name || "Kupac",
        quantitySold,
        receiptFile,
        saleNote,
      });
      setShowSoldOut(false);
      return;
    }

    // Standard flow - open confirm modal
    setShowSoldOut(false);
    setShowConfirmModal(true);
  };

  // Step 1: Select buyer
  const renderBuyerSelection = () => (
    <>
      <div className="mt-4 flex flex-col gap-6">
        {/* INVENTORY STATUS - Prominent display */}
        {hasInventory && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <MdInventory size={28} />
                </div>
                <div>
                  <p className="text-sm text-blue-100">Trenutno na zalihi</p>
                  <p className="text-3xl font-black">{remainingInventory} <span className="text-lg font-normal text-blue-200">kom.</span></p>
                </div>
              </div>
              {remainingInventory <= 3 && (
                <div className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full">
                  ⚠️ Niska zaliha
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product info card */}
        <div className="rounded-xl p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 flex items-center gap-4">
          <div className="relative">
            <CustomImage
              src={productDetails?.image}
              alt={productDetails?.name}
              height={80}
              width={80}
              className="h-20 w-20 rounded-lg object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-slate-800 truncate">{productDetails?.name}</h1>
            <p className="text-xl font-bold text-primary">
              {formatPriceAbbreviated(productDetails?.price)}
            </p>
          </div>
        </div>

        {/* Info text */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <MdInfo className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
          <p className="text-sm text-amber-800">
            {isJobAd ? t("selectHiredApplicant") : t("selectBuyerFromList")}
          </p>
        </div>

        {/* Buyers list */}
        {isLoading ? (
          <>
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                <div className="flex gap-4 items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            ))}
          </>
        ) : (
          <div className="max-h-[280px] overflow-y-auto space-y-2">
            {buyers?.length > 0 ? (
              buyers?.map((buyer) => (
                <div 
                  key={buyer?.id} 
                  className={cn(
                    "flex justify-between items-center p-3 rounded-lg border transition-all cursor-pointer",
                    selectedRadioValue === buyer?.id 
                      ? "bg-primary/5 border-primary" 
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  )}
                  onClick={() => handleRadioButtonCheck(buyer?.id)}
                >
                  <div className="flex gap-3 items-center">
                    <CustomImage
                      src={buyer?.profile}
                      width={48}
                      height={48}
                      alt="Ad Buyer"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-800">{buyer?.name}</span>
                      {buyer?.email && (
                        <p className="text-xs text-slate-500">{buyer?.email}</p>
                      )}
                    </div>
                  </div>
                  <RadioGroup
                    onValueChange={(value) => handleRadioButtonCheck(value)}
                    value={selectedRadioValue}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={buyer?.id}
                        id={`buyer-${buyer?.id}`}
                      />
                    </div>
                  </RadioGroup>
                </div>
              ))
            ) : (
              <div className="flex justify-center flex-col items-center gap-4 py-8">
                <CustomImage
                  src={NoDataFound}
                  alt="no_img"
                  width={150}
                  height={150}
                />
                <h3 className="text-lg font-medium text-slate-600">
                  {isJobAd ? t("noApplicantsFound") : t("noBuyersFound")}
                </h3>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with None of above checkbox */}
      <div className="pt-4 mt-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="noneOfAbove"
            checked={isNoneOfAboveChecked}
            onCheckedChange={(checked) => handleNoneOfAboveChecked(checked)}
          />
          <label
            htmlFor="noneOfAbove"
            className="text-sm text-slate-600 cursor-pointer"
          >
            {t("noneOfAbove")}
          </label>
        </div>
        <button
          className={cn(
            "px-5 py-2.5 rounded-lg font-semibold text-sm transition-all",
            (!selectedRadioValue && !isNoneOfAboveChecked) || isLoading
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90"
          )}
          disabled={(!selectedRadioValue && !isNoneOfAboveChecked) || isLoading}
          onClick={handleProceedToDetails}
        >
          {t("next")}
        </button>
      </div>
    </>
  );

  // Step 2: Add receipt and details
  const renderDetailsStep = () => {
    const selectedBuyer = selectedRadioValue 
      ? buyers.find((b) => b.id === selectedRadioValue)
      : null;

    return (
      <>
        <div className="mt-4 flex flex-col gap-5">
          {/* INVENTORY STATUS - Mini version for step 2 */}
          {hasInventory && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <MdInventory className="text-blue-600" size={20} />
                <span className="text-sm text-blue-800">Na zalihi:</span>
                <span className="text-lg font-bold text-blue-700">{remainingInventory}</span>
              </div>
              {quantitySold > 0 && (
                <div className="text-sm text-blue-600">
                  Nakon prodaje: <span className="font-bold">{remainingInventory - quantitySold}</span>
                </div>
              )}
            </div>
          )}

          {/* Selected buyer info */}
          {selectedBuyer && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <MdCheck className="text-green-600" size={20} />
              <div className="flex items-center gap-2">
                <CustomImage
                  src={selectedBuyer?.profile}
                  width={32}
                  height={32}
                  alt="Buyer"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-green-800">
                  {t("sellingTo")}: <span className="font-bold">{selectedBuyer?.name}</span>
                </span>
              </div>
            </div>
          )}

          {/* Quantity selector - only if inventory > 1 */}
          {hasInventory && remainingInventory > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <MdInventory size={18} className="text-slate-500" />
                {t("quantitySold")}
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-slate-300 rounded-lg">
                  <button
                    type="button"
                    className="p-2 hover:bg-slate-100 rounded-l-lg transition-colors disabled:opacity-50"
                    onClick={() => setQuantitySold(Math.max(1, quantitySold - 1))}
                    disabled={quantitySold <= 1}
                  >
                    <MdRemove size={20} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={remainingInventory}
                    value={quantitySold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantitySold(Math.min(Math.max(1, val), remainingInventory));
                    }}
                    className="w-16 text-center border-x border-slate-300 py-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="p-2 hover:bg-slate-100 rounded-r-lg transition-colors disabled:opacity-50"
                    onClick={() => setQuantitySold(Math.min(remainingInventory, quantitySold + 1))}
                    disabled={quantitySold >= remainingInventory}
                  >
                    <MdAdd size={20} />
                  </button>
                </div>
                <span className="text-sm text-slate-500">
                  {t("of")} {remainingInventory} {t("available")}
                </span>
              </div>
              {quantitySold < remainingInventory && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <MdInfo size={14} />
                  {t("remainingAfterSale")}: {remainingInventory - quantitySold}
                </p>
              )}
            </div>
          )}

          {/* Receipt upload - only show if buyer selected */}
          {selectedRadioValue && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <MdReceipt size={18} className="text-slate-500" />
                {t("uploadReceipt")} <span className="text-slate-400 font-normal">({t("optional")})</span>
              </label>
              
              {!receiptFile ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                    isDragActive 
                      ? "border-primary bg-primary/5" 
                      : "border-slate-300 hover:border-primary hover:bg-slate-50"
                  )}
                >
                  <input {...getInputProps()} />
                  <MdCloudUpload className="mx-auto text-slate-400 mb-2" size={36} />
                  <p className="text-sm text-slate-600">
                    {isDragActive ? t("dropReceiptHere") : t("dragAndDropReceipt")}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG, PDF</p>
                </div>
              ) : (
                <div className="relative border rounded-lg p-3 bg-slate-50">
                  <div className="flex items-center gap-3">
                    {receiptPreview && !receiptFile.type.includes("pdf") ? (
                      <img
                        src={receiptPreview}
                        alt="Receipt"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                        <MdReceipt className="text-red-500" size={28} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{receiptFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(receiptFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearReceipt}
                      className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                    >
                      <MdClose size={18} />
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">
                {t("receiptWillBeSentToBuyer")}
              </p>
            </div>
          )}

          {/* Sale note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {t("saleNote")} <span className="text-slate-400 font-normal">({t("optional")})</span>
            </label>
            <textarea
              value={saleNote}
              onChange={(e) => setSaleNote(e.target.value)}
              placeholder={t("saleNotePlaceholder")}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Footer with back and confirm buttons */}
        <div className="pt-4 mt-4 border-t flex items-center justify-between">
          <button
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            onClick={() => setCurrentStep(1)}
          >
            {t("back")}
          </button>
          <button
            className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-primary text-white hover:bg-primary/90 transition-all"
            onClick={handleFinalSoldOut}
          >
            {isJobAd ? t("jobClosed") : t("confirmSale")}
          </button>
        </div>
      </>
    );
  };

  return (
    <Dialog open={showSoldOut} onOpenChange={handleHideModal}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {currentStep === 1 
              ? (isJobAd ? t("whoWasHired") : t("whoMadePurchase"))
              : t("saleDetails")
            }
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              currentStep >= 1 ? "bg-primary" : "bg-slate-200"
            )} />
            <div className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              currentStep >= 2 ? "bg-primary" : "bg-slate-200"
            )} />
          </div>
        </DialogHeader>

        {currentStep === 1 ? renderBuyerSelection() : renderDetailsStep()}
      </DialogContent>
    </Dialog>
  );
};

export default SoldOutModal;
