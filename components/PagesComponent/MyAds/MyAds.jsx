"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdsCard from "./MyAdsCard.jsx";
import SellerAnalyticsOverview from "./SellerAnalyticsOverview";
import {
  deleteItemApi,
  getMyItemsApi,
  renewItemApi,
  chanegItemStatusApi,
  createFeaturedItemApi,
  inventoryApi,
} from "@/utils/api";
import { useSelector } from "react-redux";
import ProductCardSkeleton from "@/components/Common/ProductCardSkeleton.jsx";
import NoData from "@/components/EmptyStates/NoData";
import { Button } from "@/components/ui/button";
import { getIsRtl } from "@/redux/reducer/languageSlice.js";
import { Checkbox } from "@/components/ui/checkbox";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog.jsx";
import { toast } from "@/utils/toastBs";
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
  Layers,
} from "@/components/Common/UnifiedIconPack";

// ============================================
// COMPONENTS
// ============================================

function StatusTab({ item, count, isActive, onClick, compact = false, scope = "desktop" }) {
  const icons = {
    approved: CheckCircle,
    inactive: EyeOff,
    "sold out": ShoppingBag,
    featured: Star,
    expired: AlertTriangle,
    resubmitted: RefreshCw,
    renew_due: RefreshCw,
  };
  const Icon = icons[item.value] || Layers;
  const tones = {
    approved: "text-emerald-600 dark:text-emerald-400",
    inactive: "text-amber-600 dark:text-amber-400",
    "sold out": "text-slate-500 dark:text-slate-400",
    featured: "text-violet-600 dark:text-violet-400",
    expired: "text-rose-600 dark:text-rose-400",
    resubmitted: "text-sky-600 dark:text-sky-400",
    renew_due: "text-sky-600 dark:text-sky-400",
  };
  const toneClass = tones[item.value] || "text-slate-600 dark:text-slate-300";

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden inline-flex items-center gap-2.5 whitespace-nowrap rounded-2xl transition-all duration-200",
        compact ? "px-3 py-2.5" : "px-3.5 py-2.5",
        isActive
          ? "text-white dark:text-slate-900 shadow-[0_18px_42px_-28px_rgba(15,23,42,0.75)]"
          : "border border-slate-200/80 dark:border-slate-700 bg-white/85 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-900"
      )}
    >
      {isActive && (
        <motion.span
          layoutId={`myads-status-active-${scope}`}
          className="absolute inset-0 rounded-2xl bg-slate-900 dark:bg-slate-100"
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
        />
      )}

      <span className={cn("relative z-10", isActive ? "text-white dark:text-slate-900" : toneClass)}>
        <Icon size={compact ? 16 : 17} strokeWidth={2.2} />
      </span>
      <span className={cn("relative z-10 font-semibold", compact ? "text-[13px]" : "text-sm")}>{item.label}</span>
      <span
        className={cn(
          "relative z-10 min-w-[24px] h-6 px-2 inline-flex items-center justify-center rounded-full text-xs font-bold border transition-all",
          isActive
            ? "bg-white/15 border-white/20 text-white dark:bg-slate-900/10 dark:border-slate-300 dark:text-slate-900"
            : "bg-slate-100 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
        )}
      >
        {count}
      </span>
    </motion.button>
  );
}

function SortButton({ value, onChange, isRTL, fullWidth = false, showLabelOnMobile = false }) {
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
      <SelectTrigger
        className={cn(
          "h-11 px-3.5 gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-all",
          fullWidth && "w-full"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
            <CurrentIcon size={16} />
          </span>
          <span
            className={cn(
              "truncate text-sm font-medium text-slate-700 dark:text-slate-300",
              showLabelOnMobile ? "inline" : "hidden sm:inline"
            )}
          >
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

// ============================================
// MAIN COMPONENT
// ============================================

const RENEW_DUE_STATUS = "renew_due";
const POSITION_RENEW_COOLDOWN_DAYS = 15;
const SELLER_OVERVIEW_ENABLED =
  String(process.env.NEXT_PUBLIC_SELLER_OVERVIEW_ENABLED || "").toLowerCase() === "true" ||
  String(process.env.NEXT_PUBLIC_SELLER_OVERVIEW_ENABLED || "") === "1";

const parseDateSafe = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const numeric = new Date(value);
    if (!Number.isNaN(numeric.getTime())) return numeric;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  if (typeof value === "string" && value.includes(" ")) {
    const normalized = new Date(value.replace(" ", "T"));
    if (!Number.isNaN(normalized.getTime())) return normalized;
  }

  return null;
};

const getRenewBaselineDate = (item) => {
  if (!item || typeof item !== "object") return null;

  const hasLastRenewedAtField = Object.prototype.hasOwnProperty.call(item, "last_renewed_at");
  if (hasLastRenewedAtField) {
    return parseDateSafe(item?.last_renewed_at) || parseDateSafe(item?.created_at);
  }

  // Backend fallback when DB does not have last_renewed_at column.
  return parseDateSafe(item?.updated_at) || parseDateSafe(item?.created_at);
};

const getRenewNextAllowedDate = (item) => {
  if (!item || typeof item !== "object") return null;

  const candidates = [
    item?.next_position_renew_at,
    item?.next_renewal_at,
    item?.position_renew_available_at,
    item?.renew_available_at,
    item?.renewal_available_at,
    item?.next_refresh_at,
  ];

  for (const candidate of candidates) {
    const parsed = parseDateSafe(candidate);
    if (parsed) return parsed;
  }

  return null;
};

const isAdEligibleForPositionRenew = (item, now = new Date()) => {
  if (!item) return false;

  const status = String(item?.status || "").toLowerCase();
  const isApproved = status === "approved" || status === "featured";
  if (!isApproved) return false;
  if (item?.is_feature) return false;

  const expiryDate = parseDateSafe(item?.expiry_date);
  if (expiryDate && expiryDate <= now) return false;

  const nextAllowedFromApi = getRenewNextAllowedDate(item);
  const nextAllowed = nextAllowedFromApi
    ? nextAllowedFromApi
    : (() => {
        const baseline = getRenewBaselineDate(item);
        if (!baseline) return null;
        const computed = new Date(baseline);
        computed.setDate(computed.getDate() + POSITION_RENEW_COOLDOWN_DAYS);
        return computed;
      })();
  if (!nextAllowed) return false;

  return now >= nextAllowed;
};

const MyAds = () => {
  const { navigate } = useNavigate();
  const searchParams = useSearchParams();
  const isRTL = useSelector(getIsRtl);
  const isFreeAdListing = useSelector(getIsFreAdListing);

  const sortValue = searchParams.get("sort") || "new-to-old";
  const rawStatus = searchParams.get("status") || "approved";
  const status = rawStatus === "resubmitted" ? RENEW_DUE_STATUS : rawStatus;

  const [MyItems, setMyItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [IsLoading, setIsLoading] = useState(true);
  const [IsLoadMore, setIsLoadMore] = useState(false);

  const [statusCounts, setStatusCounts] = useState({
    approved: 0, inactive: 0, "sold out": 0, featured: 0, expired: 0, [RENEW_DUE_STATUS]: 0,
  });

  const [ItemPackages, setItemPackages] = useState([]);
  const [renewIds, setRenewIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [IsDeleting, setIsDeleting] = useState(false);
  const [IsDeleteDialog, setIsDeleteDialog] = useState(false);
  const [IsChoosePackage, setIsChoosePackage] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [isRenewingAd, setIsRenewingAd] = useState(false);

  const tabs = useMemo(() => [
    { value: "approved", label: "Aktivni" },
    { value: "inactive", label: "Skriveni" },
    { value: "sold out", label: "Završeni" },
    { value: "featured", label: "Istaknuti" },
    { value: "expired", label: "Istekli" },
    { value: RENEW_DUE_STATUS, label: "Za obnovu" },
  ], []);

  const expiredAds = useMemo(() => MyItems.filter((item) => item.status === "expired"), [MyItems]);
  const canMultiSelect = expiredAds.length > 1;

  const getPositionRenewHint = useCallback(
    (itemId) => {
      const item = MyItems.find((entry) => String(entry?.id) === String(itemId));
      if (!item) {
        return "Oglas možeš obnoviti poziciju svakih 15 dana.";
      }

      const nextAllowedFromApi = getRenewNextAllowedDate(item);
      const nextAllowed = nextAllowedFromApi
        ? nextAllowedFromApi
        : (() => {
            const baseline = getRenewBaselineDate(item);
            if (!baseline) return null;
            const computed = new Date(baseline);
            computed.setDate(computed.getDate() + POSITION_RENEW_COOLDOWN_DAYS);
            return computed;
          })();
      if (!nextAllowed) {
        return "Oglas možeš obnoviti poziciju svakih 15 dana.";
      }

      if (Date.now() >= nextAllowed.getTime()) {
        return "API server još nema aktiviranu obnovu pozicije za aktivne oglase. Potreban je backend deploy za endpoint renew-item.";
      }

      return `Oglas možeš obnoviti svakih 15 dana. Sljedeća obnova: ${nextAllowed.toLocaleString("bs-BA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}.`;
    },
    [MyItems]
  );

  const mapRenewErrorMessage = useCallback(
    (message, itemId) => {
      const raw = String(message || "").trim();
      if (!raw) return "Obnova oglasa nije uspjela.";
      const lower = raw.toLowerCase();

      if (
        lower.includes("has not expired yet") ||
        lower.includes("cannot be renewed") ||
        lower.includes("not expired")
      ) {
        return getPositionRenewHint(itemId);
      }

      if (lower.includes("please select package")) {
        return "Odaberi paket za obnovu isteklog oglasa.";
      }

      if (lower.includes("you have not purchased this package")) {
        return "Odabrani paket nije aktivan na tvom računu.";
      }

      return raw;
    },
    [getPositionRenewHint]
  );

  const fetchRenewDueItems = useCallback(
    async ({ sortBy = sortValue } = {}) => {
      const approvedItems = [];
      let page = 1;
      let lastPage = 1;
      let safetyCounter = 0;

      do {
        const res = await getMyItemsApi.getMyItems({
          status: "approved",
          page,
          sort_by: sortBy,
        });
        const payload = res?.data?.data;
        const rows = payload?.data || [];

        approvedItems.push(...rows);
        lastPage = Number(payload?.last_page || 1);
        page += 1;
        safetyCounter += 1;
      } while (page <= lastPage && safetyCounter < 100);

      const now = new Date();
      return approvedItems.filter((item) => isAdEligibleForPositionRenew(item, now));
    },
    [sortValue]
  );

  // Fetch counts
  useEffect(() => {
    const fetchAllCounts = async () => {
      const regularTabs = tabs.filter((t) => t.value !== RENEW_DUE_STATUS);
      const promises = regularTabs.map(async (t) => {
        try {
          const res = await getMyItemsApi.getMyItems({ status: t.value, page: 1, sort_by: "new-to-old" });
          return { status: t.value, count: res?.data?.data?.total || 0 };
        } catch { return { status: t.value, count: 0 }; }
      });
      const results = await Promise.all(promises);
      const newCounts = {};
      results.forEach((item) => { newCounts[item.status] = item.count; });
      try {
        const renewDueItems = await fetchRenewDueItems({ sortBy: "new-to-old" });
        newCounts[RENEW_DUE_STATUS] = renewDueItems.length;
      } catch {
        newCounts[RENEW_DUE_STATUS] = 0;
      }
      setStatusCounts((prev) => ({ ...prev, ...newCounts }));
    };
    fetchAllCounts();
  }, [tabs, fetchRenewDueItems]);

  // Fetch items
  const getMyItemsData = useCallback(async (page = 1) => {
    try {
      page > 1 ? setIsLoadMore(true) : setIsLoading(true);

      if (status === RENEW_DUE_STATUS) {
        if (page > 1) return;

        const renewDueItems = await fetchRenewDueItems({ sortBy: sortValue });
        setMyItems(renewDueItems);
        setCurrentPage(1);
        setLastPage(1);
        setStatusCounts((prev) => ({ ...prev, [RENEW_DUE_STATUS]: renewDueItems.length }));
        return;
      }

      const params = { page, sort_by: sortValue };
      if (status !== "all") params.status = status;

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
  }, [sortValue, status, fetchRenewDueItems]);

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

  const renewAds = async ({ ids, packageId, contextItemId }) => {
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
      } else {
        toast.error(
          mapRenewErrorMessage(
            res?.data?.message,
            contextItemId || (Array.isArray(ids) ? ids[0] : ids)
          )
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(
        mapRenewErrorMessage(
          error?.response?.data?.message || error?.message,
          contextItemId || (Array.isArray(ids) ? ids[0] : ids)
        )
      );
    }
    finally { setIsRenewingAd(false); }
  };

  const handleRenew = (ids, { allowWithoutPackage = false, contextItemId } = {}) => {
    const idsToRenew = Array.isArray(ids) ? ids : renewIds;
    if (isFreeAdListing || allowWithoutPackage) {
      renewAds({ ids: idsToRenew, contextItemId });
    } else {
      if (!selectedPackageId) { toast.error("Molimo odaberite paket."); return; }
      const subPackage = ItemPackages.find((p) => Number(p.id) === Number(selectedPackageId));
      if (!subPackage?.is_active) { toast.error("Prvo morate kupiti paket."); navigate("/user-subscription"); return; }
      renewAds({ ids: idsToRenew, packageId: selectedPackageId, contextItemId });
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

  const handleMarkAsSoldOut = async (adId, salePayload = null) => {
    try {
      const buyerId = salePayload?.buyerId ?? null;
      const payload = {
        item_id: adId,
        status: "sold out",
        ...(buyerId ? { sold_to: buyerId } : {}),
      };

      if (salePayload?.quantitySold) {
        payload.quantity_sold = salePayload.quantitySold;
      }
      if (salePayload?.receiptFile) {
        payload.sale_receipt = salePayload.receiptFile;
      }
      if (salePayload?.saleNote !== undefined && salePayload?.saleNote !== null) {
        payload.sale_note = salePayload.saleNote;
      }
      if (salePayload?.totalPrice !== undefined && salePayload?.totalPrice !== null) {
        payload.sale_price = salePayload.totalPrice;
      }

      const res = await chanegItemStatusApi.changeItemStatus(payload);
      if (res?.data?.error === false) {
        const responseData = res?.data?.data || {};
        const newStatus = responseData?.status || "sold out";
        const newInventory =
          responseData?.inventory_count !== undefined && responseData?.inventory_count !== null
            ? Number(responseData.inventory_count)
            : undefined;
        const currentItem = MyItems.find((item) => item.id === adId);
        const isJob = Number(currentItem?.category?.is_job_category) === 1;
        toast.success(
          res?.data?.message ||
            (isJob ? "Pozicija je uspješno ažurirana." : "Prodaja je uspješno evidentirana.")
        );
        setMyItems((prev) =>
          prev.map((item) =>
            item.id === adId
              ? {
                  ...item,
                  status: newStatus,
                  sold_to: buyerId,
                  ...(newInventory !== undefined ? { inventory_count: newInventory } : {}),
                }
              : item
          )
        );
        setStatusCounts((prev) => ({
          ...prev,
          approved: Math.max(
            0,
            prev.approved - (newStatus === "sold out" ? 1 : 0)
          ),
          featured: currentItem?.is_feature ? Math.max(0, prev.featured - 1) : prev.featured,
          "sold out": Math.max(
            0,
            prev["sold out"] + (newStatus === "sold out" ? 1 : 0)
          ),
        }));
        if (newStatus === "sold out" && status !== "sold out") {
          updateURLParams("status", "sold out");
        }
      } else toast.error(res?.data?.message || "Greška pri označavanju oglasa.");
    } catch (error) { console.error(error); toast.error("Greška pri označavanju oglasa."); }
  };

  const handleFeatureAd = async (adId, options = {}) => {
    try {
      const placement = options?.placement || "category_home";
      const durationDays = Number(options?.duration_days || 30);

      const res = await createFeaturedItemApi.createFeaturedItem({
        item_id: adId,
        placement,
        duration_days: durationDays,
      });

      if (res?.data?.error === false) {
        toast.success(res?.data?.message || "Oglas je uspješno izdvojen.");
        setMyItems((prev) =>
          prev.map((item) => (item.id === adId ? { ...item, is_feature: true } : item))
        );

        try {
          const featuredRes = await getMyItemsApi.getMyItems({
            status: "featured",
            page: 1,
            sort_by: "new-to-old",
          });
          const featuredCount = Number(featuredRes?.data?.data?.total);
          if (Number.isFinite(featuredCount)) {
            setStatusCounts((prev) => ({ ...prev, featured: featuredCount }));
          }
        } catch {}

        await getMyItemsData(1);
      } else {
        toast.error(res?.data?.message || "Greška pri izdvajanju oglasa.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Greška pri izdvajanju oglasa.");
    }
  };

  const handleReserveAd = async (adId) => {
    try {
      const res = await inventoryApi.reserveItem({ item_id: adId });
      if (res?.data?.error === false) {
        toast.success(res?.data?.message || "Oglas je označen kao rezervisan.");
        setMyItems((prev) =>
          prev.map((item) =>
            item.id === adId
              ? {
                  ...item,
                  reservation_status: "reserved",
                }
              : item
          )
        );
      } else {
        toast.error(res?.data?.message || "Greška pri rezervaciji oglasa.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Greška pri rezervaciji oglasa.");
    }
  };

  const handleUnreserveAd = async (adId) => {
    try {
      const res = await inventoryApi.removeReservation({ item_id: adId });
      if (res?.data?.error === false) {
        toast.success(res?.data?.message || "Rezervacija je uklonjena.");
        setMyItems((prev) =>
          prev.map((item) =>
            item.id === adId
              ? {
                  ...item,
                  reservation_status: "none",
                }
              : item
          )
        );
      } else {
        toast.error(res?.data?.message || "Greška pri uklanjanju rezervacije.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Greška pri uklanjanju rezervacije.");
    }
  };

  const handleContextMenuAction = (action, adId, payload = null) => {
    switch (action) {
      case "select": if (MyItems.find((i) => i.id === adId)?.status === "expired") handleAdSelection(adId); break;
      case "edit": navigate(`/edit-listing/${adId}`); break;
      case "deactivate": handleDeactivateAd(adId); break;
      case "activate": handleActivateAd(adId); break;
      case "markAsSoldOut": handleMarkAsSoldOut(adId, payload || null); break;
      case "feature": handleFeatureAd(adId, payload || {}); break;
      case "reserve": handleReserveAd(adId); break;
      case "unreserve": handleUnreserveAd(adId); break;
      case "renew": {
        const currentItem = MyItems.find((i) => i.id === adId);
        const isExpired = currentItem?.status === "expired";
        if (isExpired) {
          isFreeAdListing
            ? handleRenew([adId], { contextItemId: adId })
            : (setRenewIds([adId]), setIsChoosePackage(true));
        } else {
          if (!isAdEligibleForPositionRenew(currentItem)) {
            toast.error(getPositionRenewHint(adId));
            break;
          }
          handleRenew([adId], { allowWithoutPackage: true, contextItemId: adId });
        }
        break;
      }
      case "delete": setSelectedIds([adId]); setIsDeleteDialog(true); break;
    }
  };

  return (
    <div className="space-y-6">
      {SELLER_OVERVIEW_ENABLED ? <SellerAnalyticsOverview /> : null}

      {/* Filter Bar */}
      <div className="space-y-3">
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_18px_60px_-46px_rgba(15,23,42,0.65)] p-3 sm:p-4">
          <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_270px] lg:items-center lg:gap-3">
            <div className="min-w-0 overflow-x-auto scrollbar-none">
              <div className="flex w-max items-center gap-2 pr-1">
                {tabs.map((tab) => (
                  <StatusTab
                    key={tab.value}
                    item={tab}
                    count={statusCounts[tab.value] || 0}
                    isActive={status === tab.value}
                    onClick={() => handleStatusChange(tab.value)}
                    scope="desktop"
                  />
                ))}
              </div>
            </div>
            <SortButton value={sortValue} onChange={handleSortChange} isRTL={isRTL} fullWidth />
          </div>

          <div className="lg:hidden space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Status oglasa</p>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {tabs.find((t) => t.value === status)?.label}: {statusCounts[status] || 0}
              </span>
            </div>
            <div className="overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
              <div className="flex w-max items-center gap-2">
                {tabs.map((tab) => (
                  <StatusTab
                    key={tab.value}
                    item={tab}
                    count={statusCounts[tab.value] || 0}
                    isActive={status === tab.value}
                    onClick={() => handleStatusChange(tab.value)}
                    compact
                    scope="mobile"
                  />
                ))}
              </div>
            </div>
            <SortButton
              value={sortValue}
              onChange={handleSortChange}
              isRTL={isRTL}
              fullWidth
              showLabelOnMobile
            />
          </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 items-stretch gap-4 lg:gap-6">
        {IsLoading ? (
          [...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
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
              className="h-full"
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
