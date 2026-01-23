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
  MdBookmarkAdded,
  MdBookmarkRemove
} from "react-icons/md";
import { chanegItemStatusApi, inventoryApi } from "@/utils/api";
import SoldOutModal from "./SoldOutModal";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import { useNavigate } from "@/components/Common/useNavigate";
import { cn } from "@/lib/utils";
 
const AdsStatusChangeCards = ({
  productDetails,
  setProductDetails,
  status,
  setStatus,
  sellerSettings,
}) => {
  const { navigate } = useNavigate();
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showSoldOut, setShowSoldOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedRadioValue, setSelectedRadioValue] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingSaleData, setPendingSaleData] = useState(null);
 
  const isJobAd = productDetails?.category?.is_job_category === 1;
  const isSoftRejected = productDetails?.status === "soft rejected" || productDetails?.status === "resubmitted";
  const canChangeStatus = productDetails?.status === "approved" || productDetails?.status === "inactive" || productDetails?.status === "reserved";
  const isShowRejectedReason = productDetails?.rejected_reason && (productDetails?.status === "soft rejected" || productDetails?.status === "permanent rejected");
  
  const currentStatus = productDetails?.status;
  const isReserved = currentStatus === "reserved";
  const hasInventory = productDetails?.inventory_count && productDetails?.inventory_count > 0;
  const inventoryCount = productDetails?.inventory_count || 0;
  const isLowStock = inventoryCount > 0 && inventoryCount <= 3;
  const continueSellingWhenOutOfStock = sellerSettings?.continue_selling_out_of_stock || false;
 
  // Status info
  const statusInfo = {
    approved: { 
      label: "Aktivan", 
      color: "green", 
      icon: MdCheckCircle,
      bgClass: "bg-green-50 border-green-200",
      textClass: "text-green-700",
      dotClass: "bg-green-500"
    },
    inactive: { 
      label: "Neaktivan", 
      color: "orange", 
      icon: MdPauseCircle,
      bgClass: "bg-orange-50 border-orange-200",
      textClass: "text-orange-700",
      dotClass: "bg-orange-500"
    },
    reserved: { 
      label: "Rezervirano", 
      color: "purple", 
      icon: MdBookmarkAdded,
      bgClass: "bg-purple-50 border-purple-200",
      textClass: "text-purple-700",
      dotClass: "bg-purple-500"
    },
    "sold out": { 
      label: isJobAd ? "Pozicija popunjena" : "Rasprodano", 
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
    setPendingAction(action);
  };
 
  const confirmAction = () => {
    if (pendingAction) {
      executeStatusChange(pendingAction);
    }
  };
 
  // Rezervacija
  const handleReservation = async () => {
    try {
      setIsChangingStatus(true);
      const res = await inventoryApi.reserveItem({
        item_id: productDetails?.id,
      });
      if (res?.data?.error === false) {
        toast.success("Oglas je označen kao rezerviran");
        setProductDetails((prev) => ({ ...prev, status: "reserved" }));
      } else {
        toast.error(res?.data?.message || "Greška");
      }
    } catch (error) {
      toast.error("Došlo je do greške");
    } finally {
      setIsChangingStatus(false);
      setShowReservationModal(false);
    }
  };
 
  const handleRemoveReservation = async () => {
    try {
      setIsChangingStatus(true);
      const res = await inventoryApi.removeReservation({
        item_id: productDetails?.id,
      });
      if (res?.data?.error === false) {
        toast.success("Rezervacija je uklonjena");
        setProductDetails((prev) => ({ ...prev, status: "approved" }));
      } else {
        toast.error(res?.data?.message || "Greška");
      }
    } catch (error) {
      toast.error("Došlo je do greške");
    } finally {
      setIsChangingStatus(false);
    }
  };
 
  // Prodaja s detaljima
  const handleSaleComplete = async (saleData) => {
    setPendingSaleData(saleData);
    setShowConfirmModal(true);
  };
 
  const confirmSale = async () => {
    if (!pendingSaleData) return;
    
    try {
      setIsChangingStatus(true);
      
      const res = await inventoryApi.recordSale({
        item_id: productDetails?.id,
        buyer_id: pendingSaleData.buyerId,
        quantity_sold: pendingSaleData.quantitySold,
        sale_receipt: pendingSaleData.receiptFile,
        sale_note: pendingSaleData.saleNote,
        sale_price: pendingSaleData.totalPrice,
      });
 
      if (res?.data?.error === false) {
        toast.success("Prodaja je uspješno zabilježena!");
        
        // Update local state
        const newInventory = pendingSaleData.remainingStock;
        const newStatus = pendingSaleData.willBeOutOfStock && !continueSellingWhenOutOfStock 
          ? "sold out" 
          : "approved";
        
        setProductDetails((prev) => ({ 
          ...prev, 
          status: newStatus,
          inventory_count: newInventory,
        }));
        
        if (newStatus === "sold out") {
          navigate("/my-ads");
        }
      } else {
        toast.error(res?.data?.message || "Greška pri bilježenju prodaje");
      }
    } catch (error) {
      console.error(error);
      toast.error("Došlo je do greške");
    } finally {
      setIsChangingStatus(false);
      setShowConfirmModal(false);
      setPendingSaleData(null);
    }
  };
 
  // ODBIJENI OGLAS
  if (isSoftRejected) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-3">
          <div className="flex items-center gap-2 text-white">
            <MdWarning size={20} />
            <span className="font-bold text-sm">Oglas je odbijen</span>
          </div>
        </div>
 
        <div className="p-5">
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
 
          <p className="text-sm text-slate-600 mb-4">
            {productDetails?.status === "resubmitted" 
              ? "Vaš oglas je poslan na ponovni pregled."
              : "Ispravite oglas i pošaljite ponovo na pregled."}
          </p>
 
          <button
            className={cn(
              "w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
              productDetails?.status === "resubmitted"
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/90"
            )}
            disabled={productDetails?.status === "resubmitted"}
            onClick={resubmitAdForReview}
          >
            <MdRefresh size={20} />
            {productDetails?.status === "resubmitted" ? "Poslano na pregled" : "Pošalji ponovo"}
          </button>
        </div>
      </div>
    );
  }
 
  // GLAVNI PRIKAZ
  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Status header */}
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
 
        {/* Inventory info */}
        {hasInventory && (currentStatus === "approved" || currentStatus === "reserved") && (
          <div className={cn(
            "mx-5 mt-4 p-3 rounded-xl border",
            isLowStock ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MdInventory className={isLowStock ? "text-orange-600" : "text-blue-600"} size={20} />
                <span className={cn("text-sm font-medium", isLowStock ? "text-orange-800" : "text-blue-800")}>
                  Na zalihi: <strong>{inventoryCount}</strong>
                </span>
              </div>
              {isLowStock && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                  Niska zaliha!
                </span>
              )}
            </div>
            {continueSellingWhenOutOfStock && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <MdInfo size={14} />
                Prodaja nastavlja i bez zalihe
              </p>
            )}
          </div>
        )}
 
        {/* Rejected reason */}
        {isShowRejectedReason && (
          <div className="mx-5 mt-4 bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">
              Razlog odbijanja
            </p>
            <p className="text-sm text-red-700">{productDetails?.rejected_reason}</p>
          </div>
        )}
 
        {/* Akcije */}
        <div className="p-5">
          {canChangeStatus ? (
            <>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
                Brze akcije
              </p>
              
              <div className="space-y-2">
                {/* Aktiviraj (iz inactive ili reserved) */}
                {(currentStatus === "inactive" || currentStatus === "reserved") && (
                  <button
                    onClick={() => currentStatus === "reserved" ? handleRemoveReservation() : handleActionClick("approved")}
                    disabled={isChangingStatus}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <MdCheckCircle className="text-green-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-green-800">
                          {currentStatus === "reserved" ? "Ukloni rezervaciju" : "Aktiviraj oglas"}
                        </p>
                        <p className="text-xs text-green-600">
                          {currentStatus === "reserved" ? "Oglas postaje ponovo dostupan" : "Oglas će biti vidljiv"}
                        </p>
                      </div>
                    </div>
                    <MdArrowForward className="text-green-600 text-xl" />
                  </button>
                )}
 
                {/* Pauziraj */}
                {currentStatus === "approved" && (
                  <button
                    onClick={() => handleActionClick("inactive")}
                    disabled={isChangingStatus}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <MdPauseCircle className="text-orange-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-orange-800">Pauziraj oglas</p>
                        <p className="text-xs text-orange-600">Privremeno sakrij</p>
                      </div>
                    </div>
                    <MdArrowForward className="text-orange-600 text-xl" />
                  </button>
                )}
 
                {/* Rezerviraj */}
                {currentStatus === "approved" && (
                  <button
                    onClick={() => setShowReservationModal(true)}
                    disabled={isChangingStatus}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <MdBookmarkAdded className="text-purple-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-purple-800">Rezerviraj</p>
                        <p className="text-xs text-purple-600">Označi kao rezervirano</p>
                      </div>
                    </div>
                    <MdArrowForward className="text-purple-600 text-xl" />
                  </button>
                )}
 
                {/* Prodaj */}
                {(currentStatus === "approved" || currentStatus === "reserved") && (
                  <button
                  onClick={() => setShowSoldOut(true)} 
                    disabled={isChangingStatus}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <MdSell className="text-blue-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-blue-800">
                          {isJobAd ? "Pozicija popunjena" : "Označi prodaju"}
                        </p>
                        <p className="text-xs text-blue-600">
                          {isJobAd ? "Zatvorite oglas" : "Zabilježi prodaju"}
                        </p>
                      </div>
                    </div>
                    <MdArrowForward className="text-blue-600 text-xl" />
                  </button>
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
            </div>
          )}
        </div>
      </div>
 
      {/* Confirmation za aktivaciju/pauziranje */}
      <ReusableAlertDialog
        open={!!pendingAction && pendingAction !== "sold out"}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
        title={pendingAction === "approved" ? "Aktivirati oglas?" : "Pauzirati oglas?"}
        description={
          pendingAction === "approved"
            ? "Oglas će ponovo biti vidljiv svim posjetiocima."
            : "Oglas će biti skriven dok ga ponovo ne aktivirate."
        }
        cancelText="Odustani"
        confirmText={pendingAction === "approved" ? "Da, aktiviraj" : "Da, pauziraj"}
        confirmDisabled={isChangingStatus}
      />
 
      {/* Rezervacija modal */}
      <ReusableAlertDialog
        open={showReservationModal}
        onCancel={() => setShowReservationModal(false)}
        onConfirm={handleReservation}
        title="Rezervirati oglas?"
        description="Oglas će biti označen kao 'REZERVIRANO'. Kupci će i dalje moći vidjeti oglas, ali će znati da je trenutno rezerviran."
        cancelText="Odustani"
        confirmText="Da, rezerviraj"
        confirmDisabled={isChangingStatus}
      />
 
      {/* SoldOutModal */}
      <SoldOutModal
        productDetails={productDetails}
        showSoldOut={showSoldOut}
        setShowSoldOut={setShowSoldOut}
        selectedRadioValue={selectedRadioValue}
        setSelectedRadioValue={setSelectedRadioValue}
        setShowConfirmModal={setShowConfirmModal}
        onSaleComplete={handleSaleComplete}
        sellerSettings={sellerSettings}
      />
 
      {/* Confirm prodaja */}
      <ReusableAlertDialog
        open={showConfirmModal && pendingSaleData}
        onCancel={() => {
          setShowConfirmModal(false);
          setPendingSaleData(null);
        }}
        onConfirm={confirmSale}
        title="Potvrdite prodaju"
        description={
          pendingSaleData?.willBeOutOfStock
            ? continueSellingWhenOutOfStock
              ? `Prodajete ${pendingSaleData?.quantitySold} kom. Zaliha će biti 0, ali oglas ostaje aktivan.`
              : `Prodajete ${pendingSaleData?.quantitySold} kom. Oglas će biti označen kao rasprodano.`
            : `Prodajete ${pendingSaleData?.quantitySold} kom. Na zalihi ostaje ${pendingSaleData?.remainingStock}.`
        }
        cancelText="Odustani"
        confirmText="Potvrdi prodaju"
        confirmDisabled={isChangingStatus}
      />
    </>
  );
};
 
export default AdsStatusChangeCards;