import { useState } from "react";
import { toast } from "sonner";
import { 
  MdCheckCircle, 
  MdPauseCircle, 
  MdSell,
  MdRefresh,
  MdWarning,
  MdArrowForward,
  MdInfo,
  MdInventory,
  MdLock,
  MdLockOpen
} from "react-icons/md";
import { chanegItemStatusApi, inventoryApi } from "@/utils/api";
import SoldOutModal from "./SoldOutModal";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import { useNavigate } from "@/components/Common/useNavigate";
import { cn } from "@/lib/utils";
import { t } from "@/utils";
 
 
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
  const [pendingAction, setPendingAction] = useState(null);
  
  // New state for enhanced sold flow
  const [pendingSaleDetails, setPendingSaleDetails] = useState(null);
 
  const isJobAd = productDetails?.category?.is_job_category === 1;
  const isSoftRejected = productDetails?.status === "soft rejected" || productDetails?.status === "resubmitted";
  const canChangeStatus = productDetails?.status === "approved" || productDetails?.status === "inactive" || productDetails?.status === "reserved";
  const isShowRejectedReason = productDetails?.rejected_reason && (productDetails?.status === "soft rejected" || productDetails?.status === "permanent rejected");
  
  const currentStatus = productDetails?.status;
  const isReserved = currentStatus === "reserved";
  
  // Check if item has inventory
  const hasInventory = productDetails?.inventory_count && productDetails?.inventory_count > 0;
  const inventoryCount = productDetails?.inventory_count || 0;
  
  // State for reservation
  const [isReserving, setIsReserving] = useState(false);
 
  // Status info za prikaz
  const statusInfo = {
    approved: { 
      label: "Aktivan", 
      color: "green", 
      icon: MdCheckCircle,
      bgClass: "bg-green-50 border-green-200",
      textClass: "text-green-700",
      dotClass: "bg-green-500"
    },
    reserved: { 
      label: "Rezervisano", 
      color: "amber", 
      icon: MdLock,
      bgClass: "bg-amber-50 border-amber-200",
      textClass: "text-amber-700",
      dotClass: "bg-amber-500"
    },
    inactive: { 
      label: "Neaktivan", 
      color: "orange", 
      icon: MdPauseCircle,
      bgClass: "bg-orange-50 border-orange-200",
      textClass: "text-orange-700",
      dotClass: "bg-orange-500"
    },
    "sold out": { 
      label: isJobAd ? "Pozicija popunjena" : "Prodano", 
      color: "blue", 
      icon: MdSell,
      bgClass: "bg-blue-50 border-blue-200",
      textClass: "text-blue-700",
      dotClass: "bg-blue-500"
    },
    review: {
      label: "Na pregledu",
      color: "yellow",
      icon: MdInfo,
      bgClass: "bg-yellow-50 border-yellow-200",
      textClass: "text-yellow-700",
      dotClass: "bg-yellow-500"
    },
    pending: {
      label: "Na čekanju",
      color: "yellow",
      icon: MdInfo,
      bgClass: "bg-yellow-50 border-yellow-200",
      textClass: "text-yellow-700",
      dotClass: "bg-yellow-500"
    }
  };
 
  const currentStatusInfo = statusInfo[currentStatus] || statusInfo.pending;
 
  const resubmitAdForReview = async () => {
    try {
      const res = await chanegItemStatusApi.changeItemStatus({
        item_id: productDetails?.id,
        status: "resubmitted",
      });
      if (res?.data?.error === false) {
        toast.success("Oglas je uspješno ponovo poslan na pregled");
        setProductDetails((prev) => ({ ...prev, status: "resubmitted" }));
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };
 
  const executeStatusChange = async (newStatus) => {
    if (newStatus === "sold out") {
      setShowSoldOut(true);
      return;
    }
    
    try {
      setIsChangingStatus(true);
      const res = await chanegItemStatusApi.changeItemStatus({
        item_id: productDetails?.id,
        status: newStatus === "approved" ? "active" : newStatus,
      });
      if (res?.data?.error === false) {
        setProductDetails((prev) => ({ ...prev, status: newStatus }));
        setStatus(newStatus);
        toast.success("Status oglasa je uspješno ažuriran");
        navigate("/my-ads");
      } else {
        toast.error(res?.data?.message || "Greška pri ažuriranju statusa");
      }
    } catch (error) {
      console.log("error", error);
      toast.error("Došlo je do greške");
    } finally {
      setIsChangingStatus(false);
      setPendingAction(null);
    }
  };
 
  const handleActionClick = (action) => {
    // Za "sold out" direktno otvori modal, ne koristi ReusableAlertDialog
    if (action === "sold out") {
      setShowSoldOut(true);
      return;
    }
    setPendingAction(action);
  };
  
  // Handle reservation
  const handleReserve = async () => {
    try {
      setIsReserving(true);
      const res = await inventoryApi.reserveItem({
        item_id: productDetails?.id,
      });
      if (res?.data?.error === false) {
        toast.success("Oglas je označen kao rezervisan");
        setProductDetails((prev) => ({ 
          ...prev, 
          status: "reserved",
          reservation_status: "reserved"
        }));
      } else {
        toast.error(res?.data?.message || "Greška pri rezervaciji");
      }
    } catch (error) {
      console.error(error);
      toast.error("Došlo je do greške");
    } finally {
      setIsReserving(false);
    }
  };
  
  // Handle remove reservation
  const handleRemoveReservation = async () => {
    try {
      setIsReserving(true);
      const res = await inventoryApi.removeReservation({
        item_id: productDetails?.id,
      });
      if (res?.data?.error === false) {
        toast.success("Rezervacija je uklonjena");
        setProductDetails((prev) => ({ 
          ...prev, 
          status: "approved",
          reservation_status: "none"
        }));
      } else {
        toast.error(res?.data?.message || "Greška pri uklanjanju rezervacije");
      }
    } catch (error) {
      console.error(error);
      toast.error("Došlo je do greške");
    } finally {
      setIsReserving(false);
    }
  };
 
  const confirmAction = () => {
    if (pendingAction) {
      executeStatusChange(pendingAction);
    }
  };
 
  const makeItemSoldOut = async (saleDetails = null) => {
    try {
      setIsChangingStatus(true);
      
      // Prepare API call with optional enhanced details
      const apiParams = {
        item_id: productDetails?.id,
        status: "sold out",
        sold_to: saleDetails?.buyerId || selectedRadioValue,
      };
      
      // Add inventory and receipt details if provided
      if (saleDetails) {
        if (saleDetails.quantitySold) {
          apiParams.quantity_sold = saleDetails.quantitySold;
        }
        if (saleDetails.receiptFile) {
          apiParams.sale_receipt = saleDetails.receiptFile;
        }
        if (saleDetails.saleNote) {
          apiParams.sale_note = saleDetails.saleNote;
        }
      }
      
      const res = await chanegItemStatusApi.changeItemStatus(apiParams);
      
      if (res?.data?.error === false) {
        toast.success(t("statusUpdated") || "Status oglasa je uspješno ažuriran");
        
        // Update local state
        const newInventoryCount = saleDetails?.remainingAfterSale ?? 0;
        const newStatus = newInventoryCount > 0 ? "approved" : "sold out";
        
        setProductDetails((prev) => ({ 
          ...prev, 
          status: newStatus,
          inventory_count: newInventoryCount,
        }));
        
        setShowConfirmModal(false);
        setPendingSaleDetails(null);
        
        // Navigate back only if fully sold out
        if (newStatus === "sold out") {
          navigate("/my-ads");
        }
      } else {
        toast.error(res?.data?.message || "Greška pri ažuriranju statusa");
      }
    } catch (error) {
      console.error(error);
      toast.error("Došlo je do greške");
    } finally {
      setIsChangingStatus(false);
    }
  };
  
  // Handler for enhanced sold flow (with receipt and inventory)
  const handleSoldWithDetails = (saleDetails) => {
    setPendingSaleDetails(saleDetails);
    setShowConfirmModal(true);
  };
  
  // Confirm sale with details
  const confirmSaleWithDetails = () => {
    makeItemSoldOut(pendingSaleDetails);
  };
 
  // ODBIJENI OGLAS - PRIKAZ
  if (isSoftRejected) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Status traka */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-3">
          <div className="flex items-center gap-2 text-white">
            <MdWarning size={20} />
            <span className="font-bold text-sm">Oglas je odbijen</span>
          </div>
        </div>
 
        <div className="p-5">
          {/* Razlog odbijanja */}
          {productDetails?.rejected_reason && (
            <div className="bg-red-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">
                Razlog odbijanja
              </p>
              <p className="text-sm text-red-700 leading-relaxed">
                {productDetails?.rejected_reason}
              </p>
            </div>
          )}
 
          {/* Info tekst */}
          <p className="text-sm text-slate-600 mb-4">
            {productDetails?.status === "resubmitted" 
              ? "Vaš oglas je poslan na ponovni pregled. Obavijestit ćemo vas o rezultatu."
              : "Ispravite oglas prema navedenom razlogu i pošaljite ga ponovo na pregled."}
          </p>
 
          {/* Dugme za ponovno slanje */}
          <button
            className={cn(
              "w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all",
              "flex items-center justify-center gap-2",
              productDetails?.status === "resubmitted"
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
            )}
            disabled={productDetails?.status === "resubmitted"}
            onClick={resubmitAdForReview}
          >
            <MdRefresh size={20} />
            {productDetails?.status === "resubmitted"
              ? "Oglas je poslan na pregled"
              : "Pošalji ponovo na pregled"}
          </button>
        </div>
      </div>
    );
  }
 
  // GLAVNI PRIKAZ - PROMJENA STATUSA
  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Trenutni status - header */}
        <div className={cn("px-5 py-4 border-b", currentStatusInfo.bgClass)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full animate-pulse", currentStatusInfo.dotClass)} />
              <div>
                <p className="text-xs text-slate-500 font-medium">Trenutni status</p>
                <p className={cn("font-bold", currentStatusInfo.textClass)}>
                  {currentStatusInfo.label}
                </p>
              </div>
            </div>
            <currentStatusInfo.icon className={cn("text-2xl", currentStatusInfo.textClass)} />
          </div>
        </div>
 
        {/* Razlog odbijanja ako postoji */}
        {isShowRejectedReason && (
          <div className="mx-5 mt-4 bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">
              Razlog odbijanja
            </p>
            <p className="text-sm text-red-700">{productDetails?.rejected_reason}</p>
          </div>
        )}
 
        {/* Brze akcije */}
        <div className="p-5">
          {canChangeStatus ? (
            <>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
                Brze akcije
              </p>
              
              <div className="space-y-2">
                {/* Aktiviraj/Deaktiviraj toggle */}
                {currentStatus === "inactive" && (
                  <button
                    onClick={() => handleActionClick("approved")}
                    disabled={IsChangingStatus}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <MdCheckCircle className="text-green-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-green-800">Aktiviraj oglas</p>
                        <p className="text-xs text-green-600">Oglas će biti vidljiv svima</p>
                      </div>
                    </div>
                    <MdArrowForward className="text-green-600 text-xl" />
                  </button>
                )}
 
                {currentStatus === "approved" && (
                  <button
                    onClick={() => handleActionClick("inactive")}
                    disabled={IsChangingStatus}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <MdPauseCircle className="text-orange-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-orange-800">Pauziraj oglas</p>
                        <p className="text-xs text-orange-600">Privremeno sakrij od posjetilaca</p>
                      </div>
                    </div>
                    <MdArrowForward className="text-orange-600 text-xl" />
                  </button>
                )}
 
                {/* Rezerviši - samo ako je aktivan */}
                {currentStatus === "approved" && !isJobAd && (
                  <button
                    onClick={handleReserve}
                    disabled={IsChangingStatus || isReserving}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <MdLock className="text-amber-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-amber-800">Rezerviši</p>
                        <p className="text-xs text-amber-600">Označi da je artikal rezervisan</p>
                      </div>
                    </div>
                    <MdArrowForward className="text-amber-600 text-xl" />
                  </button>
                )}
 
                {/* Ukloni rezervaciju - samo ako je rezervisano */}
                {currentStatus === "reserved" && (
                  <button
                    onClick={handleRemoveReservation}
                    disabled={IsChangingStatus || isReserving}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <MdLockOpen className="text-green-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-green-800">Ukloni rezervaciju</p>
                        <p className="text-xs text-green-600">Vrati oglas u aktivne</p>
                      </div>
                    </div>
                    <MdArrowForward className="text-green-600 text-xl" />
                  </button>
                )}
 
                {/* Označi kao prodano - ako je aktivan ILI rezervisan */}
                {(currentStatus === "approved" || currentStatus === "reserved") && (
                  <button
                    onClick={() => handleActionClick("sold out")}
                    disabled={IsChangingStatus}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <MdSell className="text-blue-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-blue-800">
                          {isJobAd ? "Pozicija popunjena" : "Označi kao prodano"}
                        </p>
                        <p className="text-xs text-blue-600">
                          {isJobAd ? "Zatvorite oglas za posao" : "Artikal je prodat"}
                        </p>
                      </div>
                    </div>
                    <MdArrowForward className="text-blue-600 text-xl" />
                  </button>
                )}
                
                {/* Inventory info - prikaži ako ima zalihe */}
                {hasInventory && (currentStatus === "approved" || currentStatus === "reserved") && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-sm">
                      <MdInventory className="text-slate-500" size={18} />
                      <span className="text-slate-600">{t("currentStock") || "Trenutno na zalihi"}:</span>
                      <span className="font-bold text-slate-800">{inventoryCount}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <MdInfo className="text-slate-400 text-xl" />
              </div>
              <p className="text-sm text-slate-500">
                Promjena statusa nije moguća za ovaj oglas
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Status se može mijenjati samo za aktivne ili pauzirane oglase
              </p>
            </div>
          )}
        </div>
      </div>
 
      {/* Confirmation dialog */}
      <ReusableAlertDialog
        open={!!pendingAction && pendingAction !== "sold out"}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
        title={
          pendingAction === "approved" 
            ? "Aktivirati oglas?" 
            : "Pauzirati oglas?"
        }
        description={
          pendingAction === "approved"
            ? "Oglas će ponovo biti vidljiv svim posjetiocima."
            : "Oglas će biti skriven dok ga ponovo ne aktivirate."
        }
        cancelText="Odustani"
        confirmText={pendingAction === "approved" ? "Da, aktiviraj" : "Da, pauziraj"}
        confirmDisabled={IsChangingStatus}
      />
 
      <SoldOutModal
        productDetails={productDetails}
        showSoldOut={showSoldOut}
        setShowSoldOut={setShowSoldOut}
        selectedRadioValue={selectedRadioValue}
        setSelectedRadioValue={setSelectedRadioValue}
        setShowConfirmModal={setShowConfirmModal}
        onSoldWithDetails={handleSoldWithDetails}
      />
 
      <ReusableAlertDialog
        open={showConfirmModal}
        onCancel={() => {
          setShowConfirmModal(false);
          setPendingSaleDetails(null);
        }}
        onConfirm={pendingSaleDetails ? confirmSaleWithDetails : makeItemSoldOut}
        title={isJobAd ? "Potvrdite zatvaranje pozicije" : "Potvrdite prodaju"}
        description={
          pendingSaleDetails?.remainingAfterSale > 0
            ? `Prodajete ${pendingSaleDetails.quantitySold} komad(a). Na zalihi će ostati ${pendingSaleDetails.remainingAfterSale}.${pendingSaleDetails.receiptFile ? " Račun će biti poslan kupcu." : ""}`
            : isJobAd 
              ? "Jeste li sigurni da želite zatvoriti ovu poziciju? Ova akcija se ne može poništiti."
              : "Jeste li sigurni da želite označiti artikal kao prodan? Ova akcija se ne može poništiti."
        }
        cancelText="Odustani"
        confirmText="Potvrdi"
        confirmDisabled={IsChangingStatus}
      />
    </>
  );
};
 
export default AdsStatusChangeCards;