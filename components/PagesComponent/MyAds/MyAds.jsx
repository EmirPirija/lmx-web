"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdsCard from "./MyAdsCard.jsx";
import {
  deleteItemApi,
  getMyItemsApi,
  renewItemApi,
  chanegItemStatusApi,
} from "@/utils/api";
import { useSelector } from "react-redux";
import ProductCardSkeleton from "@/components/Common/ProductCardSkeleton.jsx";
import NoData from "@/components/EmptyStates/NoData";
import { Button } from "@/components/ui/button";
import { getIsRtl } from "@/redux/reducer/languageSlice.js";
import { Checkbox } from "@/components/ui/checkbox";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog.jsx";
import { toast } from "sonner";
import ChoosePackageModal from "./ChoosePackageModal.jsx";
import { getIsFreAdListing } from "@/redux/reducer/settingSlice.js";
import { useNavigate } from "@/components/Common/useNavigate";
import { cn } from "@/lib/utils";

import {
  Clock,
  History,
  TrendingDown,
  TrendingUp,
  Flame,
  Filter,
  ArrowUpDown,
  CheckCircle,
  EyeOff,
  ShoppingBag,
  Star,
  AlertTriangle,
  RefreshCw,
  X,
  Trash2,
  RotateCcw,
  Loader2,
  ChevronDown,
  Layers,
  Package,
} from "lucide-react";

// ============================================
// COMPONENTS
// ============================================

function StatusTab({ item, count, isActive, onClick }) {
  const icons = {
    approved: CheckCircle,
    inactive: EyeOff,
    "sold out": ShoppingBag,
    featured: Star,
    expired: AlertTriangle,
    resubmitted: RefreshCw,
  };
  const Icon = icons[item.value] || Layers;

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap",
        isActive
          ? "bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/30"
          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
      )}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      <span className="font-semibold text-sm">{item.label}</span>
      <span
        className={cn(
          "min-w-[24px] h-6 px-2 flex items-center justify-center text-xs font-bold rounded-full transition-all",
          isActive
            ? "bg-white/20 text-white"
            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
        )}
      >
        {count}
      </span>
    </motion.button>
  );
}

function SortButton({ value, onChange, isRTL }) {
  const sortOptions = [
    { value: "new-to-old", label: "Najnovije prvo", icon: Clock },
    { value: "old-to-new", label: "Najstarije prvo", icon: History },
    { value: "price-high-to-low", label: "Cijena: najviša", icon: TrendingDown },
    { value: "price-low-to-high", label: "Cijena: najniža", icon: TrendingUp },
    { value: "popular_items", label: "Popularno", icon: Flame },
  ];

  const currentOption = sortOptions.find((o) => o.value === value) || sortOptions[0];
  const CurrentIcon = currentOption.icon;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-12 px-4 gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-primary/50 transition-all">
        <div className="flex items-center gap-2">
          <CurrentIcon size={18} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
            {currentOption.label}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent align={isRTL ? "start" : "end"} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-700">
        <SelectGroup>
          {sortOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value} className="cursor-pointer rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700">
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-slate-500" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function SelectionBar({ count, onSelectAll, onCancel, allSelected, onDelete, onRenew, isRenewing }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="sticky top-0 z-30 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border-2 border-amber-200 dark:border-amber-800 mb-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5"
            />
            <span className="font-semibold text-amber-900 dark:text-amber-100">Označi sve</span>
          </label>
          <span className="text-amber-700 dark:text-amber-300">
            <span className="font-bold text-amber-900 dark:text-amber-100">{count}</span> oglas{count === 1 ? "" : "a"} označeno
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={onCancel} variant="ghost" className="flex-1 sm:flex-none gap-2 rounded-xl">
            <X size={16} />
            Otkaži
          </Button>
          <Button onClick={onDelete} variant="outline" className="flex-1 sm:flex-none gap-2 rounded-xl border-red-300 text-red-600 hover:bg-red-50">
            <Trash2 size={16} />
            Ukloni
          </Button>
          <Button onClick={onRenew} disabled={isRenewing} className="flex-1 sm:flex-none gap-2 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:opacity-90">
            {isRenewing ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            Obnovi
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function MobileFilterSheet({ isOpen, onClose, tabs, status, statusCounts, onStatusChange }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2rem] z-50 max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Filter statusa</h3>
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const isActive = status === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => { onStatusChange(tab.value); onClose(); }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all",
                        isActive
                          ? "bg-gradient-to-r from-primary to-orange-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      <span className="font-semibold">{tab.label}</span>
                      <span className={cn("font-bold", isActive ? "text-white" : "text-slate-500")}>{statusCounts[tab.value] || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const MyAds = () => {
  const { navigate } = useNavigate();
  const searchParams = useSearchParams();
  const isRTL = useSelector(getIsRtl);
  const isFreeAdListing = useSelector(getIsFreAdListing);

  const sortValue = searchParams.get("sort") || "new-to-old";
  const status = searchParams.get("status") || "approved";

  const [MyItems, setMyItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [IsLoading, setIsLoading] = useState(true);
  const [IsLoadMore, setIsLoadMore] = useState(false);

  const [statusCounts, setStatusCounts] = useState({
    approved: 0, inactive: 0, "sold out": 0, featured: 0, expired: 0, resubmitted: 0,
  });

  const [ItemPackages, setItemPackages] = useState([]);
  const [renewIds, setRenewIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [IsDeleting, setIsDeleting] = useState(false);
  const [IsDeleteDialog, setIsDeleteDialog] = useState(false);
  const [IsChoosePackage, setIsChoosePackage] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [isRenewingAd, setIsRenewingAd] = useState(false);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const tabs = useMemo(() => [
    { value: "approved", label: "Aktivni" },
    { value: "inactive", label: "Skriveni" },
    { value: "sold out", label: "Završeni" },
    { value: "featured", label: "Istaknuti" },
    { value: "expired", label: "Istekli" },
    { value: "resubmitted", label: "Za obnovu" },
  ], []);

  const expiredAds = useMemo(() => MyItems.filter((item) => item.status === "expired"), [MyItems]);
  const canMultiSelect = expiredAds.length > 1;

  // Fetch counts
  useEffect(() => {
    const fetchAllCounts = async () => {
      const promises = tabs.map(async (t) => {
        try {
          const res = await getMyItemsApi.getMyItems({ status: t.value, page: 1, sort_by: "new-to-old" });
          return { status: t.value, count: res?.data?.data?.total || 0 };
        } catch { return { status: t.value, count: 0 }; }
      });
      const results = await Promise.all(promises);
      const newCounts = {};
      results.forEach((item) => { newCounts[item.status] = item.count; });
      setStatusCounts((prev) => ({ ...prev, ...newCounts }));
    };
    fetchAllCounts();
  }, []);

  // Fetch items
  const getMyItemsData = useCallback(async (page = 1) => {
    try {
      const params = { page, sort_by: sortValue };
      if (status !== "all") params.status = status;
      page > 1 ? setIsLoadMore(true) : setIsLoading(true);

      const res = await getMyItemsApi.getMyItems(params);
      const data = res?.data;

      if (data?.error === false) {
        if (status !== "all") setStatusCounts((prev) => ({ ...prev, [status]: data?.data?.total }));
        page > 1 ? setMyItems((prev) => [...prev, ...data?.data?.data]) : setMyItems(data?.data?.data);
        setCurrentPage(data?.data?.current_page);
        setLastPage(data?.data?.last_page);
      }
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); setIsLoadMore(false); }
  }, [sortValue, status]);

  useEffect(() => { getMyItemsData(1); }, [getMyItemsData]);

  const updateURLParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    window.history.pushState(null, "", `?${params.toString()}`);
  };

  const handleSortChange = (value) => updateURLParams("sort", value);
  const handleStatusChange = (value) => updateURLParams("status", value);

  const handleAdSelection = (adId) => {
    const ad = MyItems.find((item) => item.id === adId);
    if (ad?.status !== "expired") return;
    setRenewIds((prev) => prev.includes(adId) ? prev.filter((id) => id !== adId) : [...prev, adId]);
  };

  const handleSelectAll = () => renewIds.length === expiredAds.length ? setRenewIds([]) : setRenewIds(expiredAds.map((item) => item.id));
  const handleCancelSelection = () => setRenewIds([]);

  const handleRemove = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsDeleting(true);
      const res = await deleteItemApi.deleteItem({ item_ids: selectedIds.join(",") });
      if (res?.data?.error === false) {
        toast.success(res?.data?.message);
        setIsDeleteDialog(false);
        setSelectedIds([]);
        setRenewIds([]);
        await getMyItemsData(1);
      } else toast.error(res?.data?.message);
    } catch (error) { console.error(error); }
    finally { setIsDeleting(false); }
  };

  const renewAds = async ({ ids, packageId }) => {
    try {
      setIsRenewingAd(true);
      const payload = {
        item_ids: Array.isArray(ids) ? ids.join(",") : ids,
        ...(isFreeAdListing ? {} : { package_id: packageId }),
      };
      const res = await renewItemApi.renewItem(payload);
      if (res?.data?.error === false) {
        toast.success(res?.data?.message);
        setIsChoosePackage(false);
        setRenewIds([]);
        await getMyItemsData(1);
      } else toast.error(res?.data?.message);
    } catch (error) { console.error(error); }
    finally { setIsRenewingAd(false); }
  };

  const handleRenew = (ids) => {
    const idsToRenew = Array.isArray(ids) ? ids : renewIds;
    if (isFreeAdListing) {
      renewAds({ ids: idsToRenew });
    } else {
      if (!selectedPackageId) { toast.error("Molimo odaberite paket."); return; }
      const subPackage = ItemPackages.find((p) => Number(p.id) === Number(selectedPackageId));
      if (!subPackage?.is_active) { toast.error("Prvo morate kupiti paket."); navigate("/user-subscription"); return; }
      renewAds({ ids: idsToRenew, packageId: selectedPackageId });
    }
  };

  const handleDeactivateAd = async (adId) => {
    try {
      const res = await chanegItemStatusApi.changeItemStatus({ item_id: adId, status: "inactive" });
      if (res?.data?.error === false) {
        toast.success("Oglas je skriven.");
        const currentItem = MyItems.find((item) => item.id === adId);
        if (status === "approved" || status === "featured") {
          setMyItems((prev) => prev.filter((item) => item.id !== adId));
        } else {
          setMyItems((prev) => prev.map((item) => item.id === adId ? { ...item, status: "inactive" } : item));
        }
        setStatusCounts((prev) => ({
          ...prev,
          approved: Math.max(0, prev.approved - 1),
          featured: currentItem?.is_feature ? Math.max(0, prev.featured - 1) : prev.featured,
          inactive: prev.inactive + 1,
        }));
      } else toast.error(res?.data?.message || "Greška pri skrivanju oglasa.");
    } catch (error) { console.error(error); toast.error("Greška pri skrivanju oglasa."); }
  };

  const handleActivateAd = async (adId) => {
    try {
      const res = await chanegItemStatusApi.changeItemStatus({ item_id: adId, status: "active" });
      if (res?.data?.error === false) {
        toast.success("Oglas je aktiviran.");
        if (status === "inactive") setMyItems((prev) => prev.filter((item) => item.id !== adId));
        else setMyItems((prev) => prev.map((item) => item.id === adId ? { ...item, status: "approved" } : item));
        setStatusCounts((prev) => ({ ...prev, inactive: Math.max(0, prev.inactive - 1), approved: prev.approved + 1 }));
      } else toast.error(res?.data?.message || "Greška pri aktiviranju oglasa.");
    } catch (error) { console.error(error); toast.error("Greška pri aktiviranju oglasa."); }
  };

  const handleMarkAsSoldOut = async (adId, buyerId = null) => {
    try {
      const payload = { item_id: adId, status: "sold out", ...(buyerId && { sold_to: buyerId }) };
      const res = await chanegItemStatusApi.changeItemStatus(payload);
      if (res?.data?.error === false) {
        const currentItem = MyItems.find((item) => item.id === adId);
        const isJob = Number(currentItem?.category?.is_job_category) === 1;
        toast.success(isJob ? "Posao je označen kao popunjen." : "Oglas je označen kao prodat.");
        setMyItems((prev) => prev.map((item) => item.id === adId ? { ...item, status: "sold out", sold_to: buyerId } : item));
        setStatusCounts((prev) => ({
          ...prev,
          approved: Math.max(0, prev.approved - 1),
          featured: currentItem?.is_feature ? Math.max(0, prev.featured - 1) : prev.featured,
          "sold out": prev["sold out"] + 1,
        }));
        if (status !== "sold out") updateURLParams("status", "sold out");
      } else toast.error(res?.data?.message || "Greška pri označavanju oglasa.");
    } catch (error) { console.error(error); toast.error("Greška pri označavanju oglasa."); }
  };

  const handleContextMenuAction = (action, adId, buyerId = null) => {
    switch (action) {
      case "select": if (MyItems.find((i) => i.id === adId)?.status === "expired") handleAdSelection(adId); break;
      case "edit": navigate(`/edit-listing/${adId}`); break;
      case "deactivate": handleDeactivateAd(adId); break;
      case "activate": handleActivateAd(adId); break;
      case "markAsSoldOut": handleMarkAsSoldOut(adId, buyerId); break;
      case "renew": isFreeAdListing ? handleRenew([adId]) : (setRenewIds([adId]), setIsChoosePackage(true)); break;
      case "delete": setSelectedIds([adId]); setIsDeleteDialog(true); break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col gap-4">
        {/* Desktop Tabs */}
        <div className="hidden lg:flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {tabs.map((tab) => (
              <StatusTab
                key={tab.value}
                item={tab}
                count={statusCounts[tab.value] || 0}
                isActive={status === tab.value}
                onClick={() => handleStatusChange(tab.value)}
              />
            ))}
          </div>
          <SortButton value={sortValue} onChange={handleSortChange} isRTL={isRTL} />
        </div>

        {/* Mobile Filters */}
        <div className="lg:hidden flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex-1 flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <Filter size={20} className="text-slate-500" />
              <span className="font-semibold text-slate-900 dark:text-white">
                {tabs.find((t) => t.value === status)?.label || "Aktivni"}
              </span>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-full text-sm">
              {statusCounts[status] || 0}
            </span>
          </button>
          <SortButton value={sortValue} onChange={handleSortChange} isRTL={isRTL} />
        </div>
      </div>

      {/* Selection Bar */}
      <AnimatePresence>
        {canMultiSelect && renewIds.length > 0 && (
          <SelectionBar
            count={renewIds.length}
            allSelected={renewIds.length === expiredAds.length}
            onSelectAll={handleSelectAll}
            onCancel={handleCancelSelection}
            onDelete={() => { setSelectedIds([...renewIds]); setIsDeleteDialog(true); }}
            onRenew={() => isFreeAdListing ? handleRenew() : setIsChoosePackage(true)}
            isRenewing={isRenewingAd}
          />
        )}
      </AnimatePresence>

      {/* Ads Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {IsLoading ? (
          [...Array(8)].map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <ProductCardSkeleton />
            </motion.div>
          ))
        ) : MyItems?.length > 0 ? (
          MyItems.map((item, index) => (
            <motion.div
              key={item?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <AdsCard
                data={item}
                isApprovedSort={sortValue === "approved"}
                isSelected={renewIds.includes(item?.id)}
                isSelectable={renewIds.length > 0 && item.status === "expired"}
                onSelectionToggle={() => handleAdSelection(item?.id)}
                onContextMenuAction={(action, id, buyerId) => handleContextMenuAction(action, id || item?.id, buyerId)}
              />
            </motion.div>
          ))
        ) : (
          <div className="col-span-full">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-16">
              <NoData name="oglasa" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Load More */}
      {currentPage < lastPage && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={() => getMyItemsData(currentPage + 1)}
            disabled={IsLoading || IsLoadMore}
            className="h-12 px-8 rounded-2xl border-2 gap-2 hover:border-primary/50"
          >
            {IsLoadMore ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Učitavanje...
              </>
            ) : (
              "Učitaj još"
            )}
          </Button>
        </div>
      )}

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        tabs={tabs}
        status={status}
        statusCounts={statusCounts}
        onStatusChange={handleStatusChange}
      />

      {/* Modals */}
      <ChoosePackageModal
        key={IsChoosePackage}
        selectedPackageId={selectedPackageId}
        setSelectedPackageId={setSelectedPackageId}
        ItemPackages={ItemPackages}
        setItemPackages={setItemPackages}
        IsChoosePackage={IsChoosePackage}
        setIsChoosePackage={setIsChoosePackage}
        handleRenew={handleRenew}
        isRenewingAd={isRenewingAd}
      />

      <ReusableAlertDialog
        open={IsDeleteDialog}
        onCancel={() => setIsDeleteDialog(false)}
        onConfirm={handleRemove}
        title="Jeste li sigurni?"
        description={selectedIds.length === 1 ? "Jeste li sigurni da želite obrisati ovaj oglas?" : "Jeste li sigurni da želite obrisati ove oglase?"}
        cancelText="Otkaži"
        confirmText="Da"
        confirmDisabled={IsDeleting}
      />
    </div>
  );
};

export default MyAds;
