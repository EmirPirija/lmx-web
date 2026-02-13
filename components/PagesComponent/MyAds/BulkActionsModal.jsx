"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/utils/toastBs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  RefreshCw,
  Percent,
  Archive,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";

import {
  renewItemApi,
  deleteItemApi,
  chanegItemStatusApi,
  editItemApi,
} from "@/utils/api";

// ============================================
// BULK ACTIONS TYPES
// ============================================
const BULK_ACTIONS = {
  RENEW: "renew",
  PRICE_CHANGE: "price_change",
  ARCHIVE: "archive",
  DELETE: "delete",
  ACTIVATE: "activate",
  DEACTIVATE: "deactivate",
};

// ============================================
// PRICE CHANGE COMPONENT
// ============================================
const PriceChangePanel = ({
  percentage,
  setPercentage,
  isIncrease,
  setIsIncrease,
  applyRounding,
  setApplyRounding,
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <Button
        type="button"
        variant={isIncrease ? "default" : "outline"}
        size="sm"
        onClick={() => setIsIncrease(true)}
        className={cn(
          "flex-1",
          isIncrease && "bg-green-600 hover:bg-green-700"
        )}
      >
        <ArrowUp className="w-4 h-4 mr-1.5" />
        Povećaj
      </Button>
      <Button
        type="button"
        variant={!isIncrease ? "default" : "outline"}
        size="sm"
        onClick={() => setIsIncrease(false)}
        className={cn(
          "flex-1",
          !isIncrease && "bg-red-600 hover:bg-red-700"
        )}
      >
        <ArrowDown className="w-4 h-4 mr-1.5" />
        Smanji
      </Button>
    </div>

    <div className="space-y-2">
      <Label className="text-sm text-slate-700">Procenat promjene (%)</Label>
      <div className="relative">
        <Input
          type="number"
          value={percentage}
          onChange={(e) => setPercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
          min="0"
          max="100"
          step="1"
          placeholder="10"
          className="h-11 pr-10"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
      </div>
    </div>

    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">Zaokruži cijene</p>
        <p className="text-xs text-slate-500">Zaokruži na najbližu cjelobrojnu vrijednost</p>
      </div>
      <Switch checked={applyRounding} onCheckedChange={setApplyRounding} />
    </div>

    {percentage > 0 && (
      <div className={cn(
        "p-3 rounded-xl text-sm",
        isIncrease ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      )}>
        <p className="font-medium">
          Cijene će biti {isIncrease ? "povećane" : "smanjene"} za {percentage}%
        </p>
        <p className="text-xs mt-1 opacity-80">
          Npr. 100 KM → {isIncrease ? 100 + (100 * percentage / 100) : 100 - (100 * percentage / 100)} KM
        </p>
      </div>
    )}
  </div>
);

// ============================================
// ACTION BUTTON COMPONENT
// ============================================
const ActionButton = ({ icon: Icon, label, description, onClick, variant = "default", isActive }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left",
      isActive
        ? "border-primary bg-primary/5"
        : variant === "danger"
        ? "border-red-200 bg-red-50 hover:border-red-300"
        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
    )}
  >
    <div className={cn(
      "p-2 rounded-lg",
      isActive
        ? "bg-primary/10 text-primary"
        : variant === "danger"
        ? "bg-red-100 text-red-600"
        : "bg-slate-100 text-slate-600"
    )}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn(
        "text-sm font-medium",
        isActive ? "text-primary" : variant === "danger" ? "text-red-700" : "text-slate-900"
      )}>
        {label}
      </p>
      <p className={cn(
        "text-xs mt-0.5",
        isActive ? "text-primary/70" : variant === "danger" ? "text-red-500" : "text-slate-500"
      )}>
        {description}
      </p>
    </div>
  </button>
);

// ============================================
// MAIN COMPONENT
// ============================================
const BulkActionsModal = ({
  isOpen,
  onClose,
  selectedItems = [],
  onSuccess,
  isFreeAdListing = false,
}) => {
  const [activeAction, setActiveAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Price change state
  const [percentage, setPercentage] = useState(10);
  const [isIncrease, setIsIncrease] = useState(true);
  const [applyRounding, setApplyRounding] = useState(true);

  const itemCount = selectedItems.length;

  const mapRenewErrorMessage = (message) => {
    const raw = String(message || "").trim();
    if (!raw) return "Greška pri obnavljanju oglasa.";
    const lower = raw.toLowerCase();
    if (
      lower.includes("has not expired yet") ||
      lower.includes("cannot be renewed") ||
      lower.includes("not expired")
    ) {
      return "Neki oglasi još nisu spremni za obnovu pozicije. Obnova je dostupna svakih 15 dana.";
    }
    if (lower.includes("please select package")) {
      return "Odaberi paket za obnovu isteklih oglasa.";
    }
    if (lower.includes("you have not purchased this package")) {
      return "Odabrani paket nije aktivan na tvom računu.";
    }
    return raw;
  };

  const resetState = () => {
    setActiveAction(null);
    setProgress(0);
    setPercentage(10);
    setIsIncrease(true);
    setApplyRounding(true);
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetState();
      onClose();
    }
  };

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const handleBulkRenew = async () => {
    if (selectedItems.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const itemIds = selectedItems.map((item) => item.id).join(",");
      
      const payload = {
        item_ids: itemIds,
        ...(isFreeAdListing ? {} : { package_id: 1 }),
      };

      const response = await renewItemApi.renewItem(payload);

      if (response?.data?.error === false) {
        toast.success(`${itemCount} oglasa uspješno obnovljeno!`);
        onSuccess?.();
        handleClose();
      } else {
        toast.error(mapRenewErrorMessage(response?.data?.message));
      }
    } catch (error) {
      console.error("Bulk renew error:", error);
      toast.error(mapRenewErrorMessage(error?.response?.data?.message || error?.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPriceChange = async () => {
    if (selectedItems.length === 0 || percentage <= 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const total = selectedItems.length;
      let successCount = 0;

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const currentPrice = Number(item.price) || 0;
        
        if (currentPrice <= 0) {
          setProgress(((i + 1) / total) * 100);
          continue;
        }

        let newPrice = isIncrease
          ? currentPrice * (1 + percentage / 100)
          : currentPrice * (1 - percentage / 100);

        if (applyRounding) {
          newPrice = Math.round(newPrice);
        } else {
          newPrice = Math.round(newPrice * 100) / 100;
        }

        // Ensure price is not negative
        newPrice = Math.max(0, newPrice);

        try {
          const response = await editItemApi.editItem({
            id: item.id,
            price: newPrice,
          });

          if (response?.data?.error === false) {
            successCount++;
          }
        } catch (err) {
          console.error(`Error updating item ${item.id}:`, err);
        }

        setProgress(((i + 1) / total) * 100);
      }

      if (successCount > 0) {
        toast.success(`Cijene ažurirane za ${successCount} od ${total} oglasa!`);
        onSuccess?.();
        handleClose();
      } else {
        toast.error("Nije moguće ažurirati cijene");
      }
    } catch (error) {
      console.error("Bulk price change error:", error);
      toast.error("Greška pri promjeni cijena");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedItems.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const total = selectedItems.length;
      let successCount = 0;

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];

        try {
          const response = await chanegItemStatusApi.changeItemStatus({
            item_id: item.id,
            status: newStatus,
          });

          if (response?.data?.error === false) {
            successCount++;
          }
        } catch (err) {
          console.error(`Error updating item ${item.id}:`, err);
        }

        setProgress(((i + 1) / total) * 100);
      }

      const statusLabels = {
        inactive: "arhivirani",
        active: "aktivirani",
      };

      if (successCount > 0) {
        toast.success(`${successCount} oglasa ${statusLabels[newStatus] || "ažurirano"}!`);
        onSuccess?.();
        handleClose();
      } else {
        toast.error("Nije moguće ažurirati oglase");
      }
    } catch (error) {
      console.error("Bulk status change error:", error);
      toast.error("Greška pri ažuriranju statusa");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const itemIds = selectedItems.map((item) => item.id).join(",");
      const response = await deleteItemApi.deleteItem({ item_ids: itemIds });

      if (response?.data?.error === false) {
        toast.success(`${itemCount} oglasa uspješno obrisano!`);
        onSuccess?.();
        handleClose();
      } else {
        toast.error(response?.data?.message || "Greška pri brisanju oglasa");
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Greška pri brisanju oglasa");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAction = () => {
    switch (activeAction) {
      case BULK_ACTIONS.RENEW:
        handleBulkRenew();
        break;
      case BULK_ACTIONS.PRICE_CHANGE:
        handleBulkPriceChange();
        break;
      case BULK_ACTIONS.ARCHIVE:
      case BULK_ACTIONS.DEACTIVATE:
        handleBulkStatusChange("inactive");
        break;
      case BULK_ACTIONS.ACTIVATE:
        handleBulkStatusChange("active");
        break;
      case BULK_ACTIONS.DELETE:
        handleBulkDelete();
        break;
      default:
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Grupne akcije
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            {itemCount} {itemCount === 1 ? "oglas" : itemCount < 5 ? "oglasa" : "oglasa"} odabrano
          </p>
        </DialogHeader>

        <div className="p-5">
          {/* Processing State */}
          {isProcessing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900">Obrada u toku...</p>
                  <p className="text-xs text-slate-500 mt-1">{Math.round(progress)}% završeno</p>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          ) : activeAction ? (
            <div className="space-y-4">
              {/* Action-specific content */}
              {activeAction === BULK_ACTIONS.PRICE_CHANGE && (
                <PriceChangePanel
                  percentage={percentage}
                  setPercentage={setPercentage}
                  isIncrease={isIncrease}
                  setIsIncrease={setIsIncrease}
                  applyRounding={applyRounding}
                  setApplyRounding={setApplyRounding}
                />
              )}

              {activeAction === BULK_ACTIONS.DELETE && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Jeste li sigurni da želite obrisati {itemCount} oglasa?
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Ova akcija je nepovratna i ne može se poništiti.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(activeAction === BULK_ACTIONS.ARCHIVE || activeAction === BULK_ACTIONS.DEACTIVATE) && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-start gap-3">
                    <Archive className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Arhiviraj {itemCount} oglasa
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Oglasi će biti sakriveni sa platforme, ali možete ih ponovo aktivirati.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeAction === BULK_ACTIONS.ACTIVATE && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Aktiviraj {itemCount} oglasa
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Oglasi će postati vidljivi na platformi.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeAction === BULK_ACTIONS.RENEW && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Obnovi {itemCount} oglasa
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Istekli oglasi će biti obnovljeni i ponovo aktivirani.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveAction(null)}
                  className="flex-1"
                >
                  Nazad
                </Button>
                <Button
                  onClick={executeAction}
                  className={cn(
                    "flex-1",
                    activeAction === BULK_ACTIONS.DELETE
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-primary hover:bg-primary/90"
                  )}
                >
                  Potvrdi
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <ActionButton
                icon={RefreshCw}
                label="Obnovi oglase"
                description="Obnovi istekle oglase"
                onClick={() => setActiveAction(BULK_ACTIONS.RENEW)}
              />
              <ActionButton
                icon={Percent}
                label="Promijeni cijene"
                description="Masovna promjena cijena u procentima"
                onClick={() => setActiveAction(BULK_ACTIONS.PRICE_CHANGE)}
              />
              <ActionButton
                icon={CheckCircle2}
                label="Aktiviraj"
                description="Aktiviraj sakrivene oglase"
                onClick={() => setActiveAction(BULK_ACTIONS.ACTIVATE)}
              />
              <ActionButton
                icon={Archive}
                label="Arhiviraj"
                description="Sakrij oglase sa platforme"
                onClick={() => setActiveAction(BULK_ACTIONS.ARCHIVE)}
              />
              <ActionButton
                icon={Trash2}
                label="Obriši"
                description="Trajno obriši oglase"
                onClick={() => setActiveAction(BULK_ACTIONS.DELETE)}
                variant="danger"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkActionsModal;
