import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  MdWarning,
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
  onSaleComplete,
  sellerSettings,
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
  
  // Current step
  const [currentStep, setCurrentStep] = useState(1);
 
  const isJobAd = productDetails?.category?.is_job_category === 1;
  const hasInventory = productDetails?.inventory_count && productDetails?.inventory_count > 0;
  const inventoryCount = productDetails?.inventory_count || 1;
  const continueSellingWhenOutOfStock = sellerSettings?.continue_selling_out_of_stock || false;
  
  // Izračunaj koliko ostaje nakon prodaje
  const remainingAfterSale = Math.max(0, inventoryCount - quantitySold);
  const willBeOutOfStock = remainingAfterSale === 0;
 
  useEffect(() => {
    if (showSoldOut) {
      getBuyers();
      resetState();
    }
  }, [showSoldOut]);
 
  const resetState = () => {
    setCurrentStep(1);
    setReceiptFile(null);
    setReceiptPreview(null);
    setSaleNote("");
    setQuantitySold(1);
    setIsNoneOfAboveChecked(false);
    setSelectedRadioValue(null);
  };
 
  // Dropzone za račun
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
    resetState();
    setShowSoldOut(false);
  };
 
  const getBuyers = async () => {
    try {
      setIsLoading(true);
      const res = await getItemBuyerListApi.getItemBuyerList({
        item_id: productDetails?.id,
      });
      setBuyers(res?.data?.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleProceedToDetails = () => {
    setCurrentStep(2);
  };
 
  const handleFinalSale = () => {
    const selectedBuyer = selectedRadioValue 
      ? buyers.find((b) => b.id === selectedRadioValue)
      : null;
 
    if (onSaleComplete) {
      onSaleComplete({
        buyerId: selectedRadioValue,
        buyerName: selectedBuyer?.name || null,
        buyerEmail: selectedBuyer?.email || null,
        quantitySold: quantitySold,
        receiptFile: receiptFile,
        saleNote: saleNote,
        remainingStock: remainingAfterSale,
        willBeOutOfStock: willBeOutOfStock,
        totalPrice: productDetails?.price * quantitySold,
      });
    }
    
    handleHideModal();
  };
 
  // KORAK 1: Odabir kupca
  const renderBuyerSelection = () => (
    <>
      <div className="mt-4 flex flex-col gap-5">
        {/* Info o artiklu */}
        <div className="rounded-xl p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 flex items-center gap-4">
          <div className="relative">
            <CustomImage
              src={productDetails?.image}
              alt={productDetails?.name}
              height={80}
              width={80}
              className="h-20 w-20 rounded-lg object-cover"
            />
            {hasInventory && (
              <div className={cn(
                "absolute -top-2 -right-2 text-white text-xs font-bold px-2 py-0.5 rounded-full",
                inventoryCount <= 3 ? "bg-orange-500" : "bg-blue-500"
              )}>
                {inventoryCount}x
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-slate-800 truncate">
              {productDetails?.name}
            </h1>
            <p className="text-xl font-bold text-primary">
              {formatPriceAbbreviated(productDetails?.price)}
            </p>
            {hasInventory && (
              <p className={cn(
                "text-xs flex items-center gap-1 mt-1",
                inventoryCount <= 3 ? "text-orange-600" : "text-slate-500"
              )}>
                <MdInventory size={14} />
                Na zalihi: <span className="font-semibold">{inventoryCount}</span>
                {inventoryCount <= 3 && <span className="ml-1">(niska zaliha!)</span>}
              </p>
            )}
          </div>
        </div>
 
        {/* Upozorenje ako je uključeno "nastavi prodavati" */}
        {continueSellingWhenOutOfStock && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <MdWarning className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Prodaja bez zalihe je omogućena
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Oglas će ostati aktivan čak i kada zaliha padne na 0.
              </p>
            </div>
          </div>
        )}
 
        {/* Info tekst */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <MdInfo className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
          <p className="text-sm text-blue-800">
            {isJobAd 
              ? "Odaberite kandidata koji je zaposlen. Ako nije na listi, označite 'Niko od navedenih'."
              : "Odaberite kupca s liste. Ako kupac nije na listi, označite 'Niko od navedenih'."}
          </p>
        </div>
 
        {/* Lista kupaca */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                <div className="flex gap-3 items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
            {buyers?.length > 0 ? (
              buyers.map((buyer) => (
                <div 
                  key={buyer?.id} 
                  className={cn(
                    "flex justify-between items-center p-3 rounded-xl border-2 transition-all cursor-pointer",
                    selectedRadioValue === buyer?.id 
                      ? "bg-primary/5 border-primary shadow-sm" 
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                  onClick={() => handleRadioButtonCheck(buyer?.id)}
                >
                  <div className="flex gap-3 items-center">
                    <CustomImage
                      src={buyer?.profile}
                      width={48}
                      height={48}
                      alt="Kupac"
                      className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-800 block">
                        {buyer?.name}
                      </span>
                      {buyer?.email && (
                        <span className="text-xs text-slate-500">{buyer?.email}</span>
                      )}
                    </div>
                  </div>
                  <RadioGroup value={selectedRadioValue}>
                    <RadioGroupItem value={buyer?.id} />
                  </RadioGroup>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <CustomImage
                  src={NoDataFound}
                  alt="Nema kupaca"
                  width={120}
                  height={120}
                  className="opacity-60"
                />
                <p className="text-slate-500 mt-4 text-center">
                  {isJobAd ? "Nema prijavljenih kandidata" : "Nema registriranih kupaca"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
 
      {/* Footer */}
      <div className="pt-4 mt-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="noneOfAbove"
            checked={isNoneOfAboveChecked}
            onCheckedChange={handleNoneOfAboveChecked}
          />
          <label htmlFor="noneOfAbove" className="text-sm text-slate-600 cursor-pointer">
            Niko od navedenih
          </label>
        </div>
        <button
          className={cn(
            "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all",
            (!selectedRadioValue && !isNoneOfAboveChecked) || isLoading
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90 shadow-sm"
          )}
          disabled={(!selectedRadioValue && !isNoneOfAboveChecked) || isLoading}
          onClick={handleProceedToDetails}
        >
          Nastavi
        </button>
      </div>
    </>
  );
 
  // KORAK 2: Detalji prodaje
  const renderSaleDetails = () => {
    const selectedBuyer = selectedRadioValue 
      ? buyers.find((b) => b.id === selectedRadioValue)
      : null;
 
    return (
      <>
        <div className="mt-4 flex flex-col gap-5">
          {/* Odabrani kupac */}
          {selectedBuyer && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <MdCheck className="text-green-600" size={20} />
              <CustomImage
                src={selectedBuyer?.profile}
                width={36}
                height={36}
                alt="Kupac"
                className="h-9 w-9 rounded-full object-cover"
              />
              <div>
                <span className="text-sm text-green-700">Prodaješ:</span>
                <span className="text-sm font-bold text-green-800 ml-1">
                  {selectedBuyer?.name}
                </span>
              </div>
            </div>
          )}
 
          {/* Količina - samo ako ima inventory */}
          {hasInventory && inventoryCount > 1 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MdInventory size={18} className="text-slate-500" />
                Količina za prodaju
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    className="p-3 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    onClick={() => setQuantitySold(Math.max(1, quantitySold - 1))}
                    disabled={quantitySold <= 1}
                  >
                    <MdRemove size={20} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={inventoryCount}
                    value={quantitySold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantitySold(Math.min(Math.max(1, val), inventoryCount));
                    }}
                    className="w-16 text-center py-2 font-bold text-lg focus:outline-none"
                  />
                  <button
                    type="button"
                    className="p-3 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    onClick={() => setQuantitySold(Math.min(inventoryCount, quantitySold + 1))}
                    disabled={quantitySold >= inventoryCount}
                  >
                    <MdAdd size={20} />
                  </button>
                </div>
                <div className="text-sm text-slate-500">
                  od <span className="font-semibold">{inventoryCount}</span> na zalihi
                </div>
              </div>
              
              {/* Info o preostalom */}
              <div className={cn(
                "p-3 rounded-lg text-sm",
                willBeOutOfStock 
                  ? (continueSellingWhenOutOfStock ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800")
                  : "bg-blue-50 text-blue-800"
              )}>
                {willBeOutOfStock ? (
                  continueSellingWhenOutOfStock ? (
                    <span className="flex items-center gap-2">
                      <MdWarning size={16} />
                      Zaliha će biti 0, ali oglas ostaje aktivan.
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <MdInfo size={16} />
                      Oglas će biti označen kao "Rasprodano".
                    </span>
                  )
                ) : (
                  <span>
                    Nakon prodaje ostaje: <strong>{remainingAfterSale}</strong> na zalihi
                  </span>
                )}
              </div>
            </div>
          )}
 
          {/* Upload računa - samo ako je odabran kupac */}
          {selectedRadioValue && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MdReceipt size={18} className="text-slate-500" />
                Priloži račun
                <span className="text-slate-400 font-normal text-xs">(opcionalno)</span>
              </label>
              
              {!receiptFile ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                    isDragActive 
                      ? "border-primary bg-primary/5" 
                      : "border-slate-300 hover:border-primary hover:bg-slate-50"
                  )}
                >
                  <input {...getInputProps()} />
                  <MdCloudUpload className="mx-auto text-slate-400 mb-2" size={40} />
                  <p className="text-sm text-slate-600">
                    {isDragActive ? "Pusti ovdje..." : "Prevuci račun ili klikni za odabir"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG ili PDF (max 5MB)</p>
                </div>
              ) : (
                <div className="relative border-2 border-green-200 rounded-xl p-3 bg-green-50">
                  <div className="flex items-center gap-3">
                    {receiptPreview && !receiptFile.type.includes("pdf") ? (
                      <img
                        src={receiptPreview}
                        alt="Račun"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border">
                        <MdReceipt className="text-slate-400" size={28} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {receiptFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(receiptFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearReceipt}
                      className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                    >
                      <MdClose size={18} />
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">
                💡 Račun će biti poslan kupcu u "Moje kupovine" sekciju.
              </p>
            </div>
          )}
 
          {/* Napomena */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Poruka kupcu
              <span className="text-slate-400 font-normal text-xs ml-2">(opcionalno)</span>
            </label>
            <textarea
              value={saleNote}
              onChange={(e) => setSaleNote(e.target.value)}
              placeholder="Npr. Hvala na kupovini! Paket će biti poslan sutra."
              className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              rows={2}
            />
          </div>
 
          {/* Sažetak */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Sažetak prodaje</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Artikal:</span>
                <span className="font-medium text-slate-800">{productDetails?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Količina:</span>
                <span className="font-medium text-slate-800">{quantitySold}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cijena po kom:</span>
                <span className="font-medium text-slate-800">
                  {formatPriceAbbreviated(productDetails?.price)}
                </span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between">
                <span className="font-semibold text-slate-700">Ukupno:</span>
                <span className="font-bold text-primary text-lg">
                  {formatPriceAbbreviated(productDetails?.price * quantitySold)}
                </span>
              </div>
            </div>
          </div>
        </div>
 
        {/* Footer */}
        <div className="pt-4 mt-4 border-t flex items-center justify-between">
          <button
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            onClick={() => setCurrentStep(1)}
          >
            ← Nazad
          </button>
          <button
            className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-primary text-white hover:bg-primary/90 shadow-sm transition-all"
            onClick={handleFinalSale}
          >
            {isJobAd ? "Potvrdi zaposlenje" : "Potvrdi prodaju"}
          </button>
        </div>
      </>
    );
  };
 
  return (
    <Dialog open={showSoldOut} onOpenChange={handleHideModal}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {currentStep === 1 
              ? (isJobAd ? "Ko je zaposlen?" : "Ko je kupio?")
              : "Detalji prodaje"
            }
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
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
 
        {currentStep === 1 ? renderBuyerSelection() : renderSaleDetails()}
      </DialogContent>
    </Dialog>
  );
};
 
export default SoldOutModal;