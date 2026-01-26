"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconArrowsSort,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconCurrencyDollar,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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

const MyAds = () => {
  const { navigate } = useNavigate();
  const searchParams = useSearchParams();
  const isRTL = useSelector(getIsRtl);

  const sortValue = searchParams.get("sort") || "new-to-old";
  const status = searchParams.get("status") || "approved";

  const [MyItems, setMyItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [IsLoading, setIsLoading] = useState(true);
  const [IsLoadMore, setIsLoadMore] = useState(false);

  const [statusCounts, setStatusCounts] = useState({
    approved: 0,
    inactive: 0,
    "sold out": 0,
    featured: 0,
    expired: 0,
    resubmitted: 0,
  });

  const isFreeAdListing = useSelector(getIsFreAdListing);
  const [ItemPackages, setItemPackages] = useState([]);
  const [renewIds, setRenewIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [IsDeleting, setIsDeleting] = useState(false);
  const [IsDeleteDialog, setIsDeleteDialog] = useState(false);
  const [IsChoosePackage, setIsChoosePackage] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [isRenewingAd, setIsRenewingAd] = useState(false);

  // sticky header
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef(null);
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // mobile: dva bottom sheeta (filter + sort)
  const [isStatusSheetOpen, setIsStatusSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.offsetHeight);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && entry.boundingClientRect.top <= 0) {
          setIsSticky(true);
        } else {
          setIsSticky(false);
        }
      },
      { root: null, threshold: 0 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => {
      if (sentinelRef.current) observer.unobserve(sentinelRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchAllCounts = async () => {
      const statusesToCheck = [
        "approved",
        "inactive",
        "sold out",
        "featured",
        "expired",
        "resubmitted",
      ];

      const promises = statusesToCheck.map(async (s) => {
        try {
          const res = await getMyItemsApi.getMyItems({
            status: s,
            page: 1,
            sort_by: "new-to-old",
          });
          return { status: s, count: res?.data?.data?.total || 0 };
        } catch {
          return { status: s, count: 0 };
        }
      });

      try {
        const results = await Promise.all(promises);
        const newCounts = {};
        results.forEach((item) => {
          newCounts[item.status] = item.count;
        });
        setStatusCounts((prev) => ({ ...prev, ...newCounts }));
      } catch (error) {
        console.error("Greška pri učitavanju brojača:", error);
      }
    };

    fetchAllCounts();
  }, []);

  const getMyItemsData = async (page = 1) => {
    try {
      const params = { page, sort_by: sortValue };
      if (status !== "all") {
        params.status = status;
      }

      if (page > 1) setIsLoadMore(true);
      else setIsLoading(true);

      const res = await getMyItemsApi.getMyItems(params);
      const data = res?.data;

      if (data?.error === false) {
        if (status !== "all") {
          setStatusCounts((prev) => ({
            ...prev,
            [status]: data?.data?.total,
          }));
        }

        page > 1
          ? setMyItems((prevData) => [...prevData, ...data?.data?.data])
          : setMyItems(data?.data?.data);
        setCurrentPage(data?.data?.current_page);
        setLastPage(data?.data?.last_page);
      } else {
        console.log("Error", data.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
      setIsLoadMore(false);
    }
  };

  useEffect(() => {
    getMyItemsData(1);
  }, [sortValue, status]);

  const updateURLParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    window.history.pushState(null, "", `?${params.toString()}`);
  };

  const handleSortChange = (value) => updateURLParams("sort", value);
  const handleStatusChange = (value) => updateURLParams("status", value);

  const expiredAds = MyItems.filter((item) => item.status === "expired");
  const canMultiSelect = expiredAds.length > 1;

  const handleAdSelection = (adId) => {
    const ad = MyItems.find((item) => item.id === adId);
    if (ad?.status !== "expired") return;
    setRenewIds((prev) =>
      prev.includes(adId)
        ? prev.filter((id) => id !== adId)
        : [...prev, adId]
    );
  };

  const handleSelectAll = () =>
    renewIds.length === expiredAds.length
      ? setRenewIds([])
      : setRenewIds(expiredAds.map((item) => item.id));

  const handleCancelSelection = () => setRenewIds([]);

  const handleRemove = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsDeleting(true);
      const payload = { item_ids: selectedIds.join(",") };
      const res = await deleteItemApi.deleteItem(payload);
      if (res?.data?.error === false) {
        toast.success(res?.data?.message);
        setIsDeleteDialog(false);
        setSelectedIds([]);
        setRenewIds([]);
        await getMyItemsData(1);
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const renewAds = async ({ ids, packageId }) => {
    try {
      setIsRenewingAd(true);
      let payload = {};
      if (Array.isArray(ids)) {
        payload = {
          item_ids: ids.join(","),
          ...(isFreeAdListing ? {} : { package_id: packageId }),
        };
      } else {
        payload = {
          item_ids: ids,
          ...(isFreeAdListing ? {} : { package_id: packageId }),
        };
      }
      const res = await renewItemApi.renewItem(payload);
      if (res?.data?.error === false) {
        toast.success(res?.data?.message);
        setIsChoosePackage(false);
        setRenewIds([]);
        await getMyItemsData(1);
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsRenewingAd(false);
    }
  };

  const handleRenew = (ids) => {
    const idsToRenew = Array.isArray(ids) ? ids : renewIds;
    if (isFreeAdListing) {
      renewAds({ ids: idsToRenew });
    } else {
      if (!selectedPackageId) {
        toast.error("Molimo odaberite paket.");
        return;
      }
      const subPackage = ItemPackages.find(
        (p) => Number(p.id) === Number(selectedPackageId)
      );
      if (!subPackage?.is_active) {
        toast.error("Prvo morate kupiti paket.");
        navigate("/user-subscription");
        return;
      }
      renewAds({ ids: idsToRenew, packageId: selectedPackageId });
    }
  };

  const handleDeactivateAd = async (adId) => {
    try {
      const res = await chanegItemStatusApi.changeItemStatus({
        item_id: adId,
        status: "inactive",
      });

      if (res?.data?.error === false) {
        toast.success("Oglas je skriven.");

        const currentItem = MyItems.find((item) => item.id === adId);

        if (status === "approved" || status === "featured") {
          setMyItems((prevItems) =>
            prevItems.filter((item) => item.id !== adId)
          );
        } else {
          setMyItems((prevItems) =>
            prevItems.map((item) =>
              item.id === adId ? { ...item, status: "inactive" } : item
            )
          );
        }

        setStatusCounts((prev) => ({
          ...prev,
          approved: Math.max(0, prev.approved - 1),
          featured: currentItem?.is_feature
            ? Math.max(0, prev.featured - 1)
            : prev.featured,
          inactive: prev.inactive + 1,
        }));
      } else {
        toast.error(
          res?.data?.message || "Došlo je do greške pri skrivanju oglasa."
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Došlo je do greške pri skrivanju oglasa.");
    }
  };

  const handleActivateAd = async (adId) => {
    try {
      const res = await chanegItemStatusApi.changeItemStatus({
        item_id: adId,
        status: "active",
      });

      if (res?.data?.error === false) {
        toast.success("Oglas je aktiviran.");

        if (status === "inactive") {
          setMyItems((prevItems) =>
            prevItems.filter((item) => item.id !== adId)
          );
        } else {
          setMyItems((prevItems) =>
            prevItems.map((item) =>
              item.id === adId ? { ...item, status: "approved" } : item
            )
          );
        }

        setStatusCounts((prev) => ({
          ...prev,
          inactive: Math.max(0, prev.inactive - 1),
          approved: prev.approved + 1,
        }));
      } else {
        toast.error(
          res?.data?.message || "Došlo je do greške pri aktiviranju oglasa."
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Došlo je do greške pri aktiviranju oglasa.");
    }
  };

  const handleMarkAsSoldOut = async (adId, buyerId = null) => {
    try {
      const payload = {
        item_id: adId,
        status: "sold out",
      };

      if (buyerId) {
        payload.sold_to = buyerId;
      }

      const res = await chanegItemStatusApi.changeItemStatus(payload);

      if (res?.data?.error === false) {
        const currentItem = MyItems.find((item) => item.id === adId);
        const isJobCategory =
          Number(currentItem?.category?.is_job_category) === 1;

        toast.success(
          isJobCategory
            ? "Posao je označen kao popunjen."
            : "Oglas je označen kao prodat."
        );

        setMyItems((prevItems) =>
          prevItems.map((item) =>
            item.id === adId
              ? { ...item, status: "sold out", sold_to: buyerId }
              : item
          )
        );

        setStatusCounts((prev) => ({
          ...prev,
          approved: Math.max(0, prev.approved - 1),
          featured: currentItem?.is_feature
            ? Math.max(0, prev.featured - 1)
            : prev.featured,
          "sold out": prev["sold out"] + 1,
        }));

        if (status !== "sold out") {
          updateURLParams("status", "sold out");
        }
      } else {
        toast.error(
          res?.data?.message || "Došlo je do greške pri označavanju oglasa."
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Došlo je do greške pri označavanju oglasa.");
    }
  };

  const handleContextMenuAction = (action, adId, buyerId = null) => {
    const ad = MyItems.find((item) => item.id === adId);

    switch (action) {
      case "select":
        if (ad && ad.status === "expired") handleAdSelection(adId);
        break;

      case "edit":
        navigate(`/edit-listing/${adId}`);
        break;

      case "deactivate":
        handleDeactivateAd(adId);
        break;

      case "activate":
        handleActivateAd(adId);
        break;

      case "markAsSoldOut":
        handleMarkAsSoldOut(adId, buyerId);
        break;

      case "renew":
        isFreeAdListing
          ? handleRenew([adId])
          : (setRenewIds([adId]), setIsChoosePackage(true));
        break;

      case "delete":
        setSelectedIds([adId]);
        setIsDeleteDialog(true);
        break;

      default:
        break;
    }
  };

  const tabs = [
    { value: "approved", label: "Aktivni" },
    { value: "inactive", label: "Skriveni" },
    { value: "sold out", label: "Završeni" },
    { value: "featured", label: "Istaknuti" },
    { value: "expired", label: "Istekli" },
    { value: "resubmitted", label: "Za obnovu" },
  ];

  const isHomeStickySpacerNeeded = isSticky;
  const isHomeStickyHeight = containerHeight ? `${containerHeight}px` : "124px";

  return (
    <>
      {/* sentinel za sticky */}
      <div
        ref={sentinelRef}
        className="absolute w-full h-px bg-transparent translate-y-[-1px]"
      />

      {isHomeStickySpacerNeeded && (
        <div
          style={{
            height: isHomeStickyHeight,
          }}
          className="hidden md:block w-full mb-3 bg-transparent"
        />
      )}

      {/* Gornji bar (desktop sticky) */}
      <div
        ref={containerRef}
        className={`
          hidden md:block
          transition-all duration-500 ease-in-out z-40
          ${
            isSticky
              ? "fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200 py-3 rounded-none px-4 md:px-8"
              : "relative w-full bg-muted rounded-lg py-3 px-4 gap-4 border border-transparent"
          }
        `}
      >
        <div
          className={`flex flex-row-reverse justify-between gap-4 ${
            isSticky ? "container mx-auto max-w-7xl" : ""
          }`}
        >
          {/* Desktop: sortiranje */}
          <div className="hidden md:flex flex-row items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <IconArrowsSort size={22} className="text-gray-500" />
                <span className="whitespace-nowrap text-sm font-medium text-gray-600">
                  Poredaj po
                </span>
              </div>

              <Select value={sortValue} onValueChange={handleSortChange}>
                <SelectTrigger
                  className={`w-[200px] transition-all duration-300 ${
                    isSticky
                      ? "bg-white border-gray-300 h-9 text-xs shadow-sm"
                      : "bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 h-10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconArrowsSort className="h-3.5 w-3.5 text-gray-500" />
                    <SelectValue placeholder="Poredaj po" />
                  </div>
                </SelectTrigger>
                <SelectContent
                  align={isRTL ? "start" : "end"}
                  className="bg-white border-gray-100 shadow-md"
                >
                  <SelectGroup>
                    <SelectItem
                      value="new-to-old"
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <IconSortDescending
                          size={16}
                          className="text-gray-500"
                        />
                        <span>Najnovije prvo</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="old-to-new"
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <IconSortAscending
                          size={16}
                          className="text-gray-500"
                        />
                        <span>Najstarije prvo</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="price-high-to-low"
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <IconCurrencyDollar
                          size={16}
                          className="text-gray-500"
                        />
                        <span>Cijena: najviša prvo</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="price-low-to-high"
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <IconCurrencyDollar
                          size={16}
                          className="text-gray-500"
                        />
                        <span>Cijena: najniža prvo</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="popular_items"
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <IconTrendingUp
                          size={16}
                          className="text-gray-500"
                        />
                        <span>Popularno</span>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop: TABOVI (statusi) */}
          <div className="hidden md:flex gap-2 pb-1 overflow-x-auto max-w-full">
            {tabs.map((item) => {
              const isActive = status === item.value;
              const count = statusCounts[item.value] || 0;

              return (
                <button
                  key={item.value}
                  onClick={() => handleStatusChange(item.value)}
                  className={`
                    group relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 shrink-0 border
                    ${
                      isActive
                        ? "bg-black text-white border-black shadow-md"
                        : isSticky
                        ? "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  <span>{item.label}</span>
                  <span
                    className={`
                      flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] rounded-full transition-colors
                      ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                      }
                    `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MOBILE: dva plutajuća dugmeta (samo ikonice) */}
      <div className="fixed bottom-24 left-1/2 z-50 flex gap-3 -translate-x-1/2 sm:hidden">
        {/* FILTER */}
        <button
  type="button"
  onClick={() => setIsStatusSheetOpen(true)}
  className="flex items-center gap-2 justify-center rounded-full bg-white shadow-lg border border-gray-200 px-4 py-3"
  aria-label="Filtriraj oglase"
  style={{ gap: "5px" }}
>
  <IconFilter stroke={2} />
  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtriraj oglase</span>
</button>


        {/* SORT */}
        <button
          type="button"
          onClick={() => setIsSortSheetOpen(true)}
          className="flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 p-3"
          aria-label="Sortiranje"
          style={{ gap: "5px" }}
        >
          <IconArrowsSort stroke={2} />
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Poredaj po</span>
        </button>
      </div>

      {/* Multi-select info bar za istekle oglase */}
      {canMultiSelect && renewIds.length > 0 && (
        <div
          className={`flex items-center justify-between mt-[30px] ${
            isSticky ? "pt-[20px]" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={renewIds.length === expiredAds.length}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm font-medium">Označi sve</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {renewIds.length} {renewIds.length === 1 ? "oglas" : "oglasa"}{" "}
            označeno
          </p>
        </div>
      )}

      {/* Lista oglasa */}
      <div className="grid grid-cols-2 sm:grid-cols-2 mt-[30px] xl:grid-cols-4 gap-4">
        {IsLoading ? (
          [...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)
        ) : MyItems && MyItems?.length > 0 ? (
          MyItems.map((item) => (
            <AdsCard
              key={item?.id}
              data={item}
              isApprovedSort={sortValue === "approved"}
              isSelected={renewIds.includes(item?.id)}
              isSelectable={renewIds.length > 0 && item.status === "expired"}
              onSelectionToggle={() => handleAdSelection(item?.id)}
              onContextMenuAction={(action, id, buyerId) =>
                handleContextMenuAction(action, id || item?.id, buyerId)
              }
            />
          ))
        ) : (
          <div className="col-span-full">
            <NoData name="oglasa" />
          </div>
        )}
      </div>

      {/* Load more */}
      {currentPage < lastPage && (
        <div className="text-center mt-8 pb-8">
          <Button
            variant="outline"
            className="h-11 px-8 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-black transition-all"
            disabled={IsLoading || IsLoadMore}
            onClick={() => getMyItemsData(currentPage + 1)}
          >
            {IsLoadMore ? "Učitavanje..." : "Učitaj još"}
          </Button>
        </div>
      )}

      {/* Floating actions za istaknute / brisanje / obnovu isteklh oglasa */}
      {renewIds.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="bg-white p-2 rounded-full shadow-xl border border-gray-200 flex gap-2 pointer-events-auto">
            <Button
              onClick={handleCancelSelection}
              variant="ghost"
              className="rounded-full px-6 hover:bg-gray-100"
            >
              Otkaži
            </Button>
            <Button
              onClick={() => {
                if (renewIds.length === 0) return;
                setSelectedIds([...renewIds]);
                setIsDeleteDialog(true);
              }}
              className="bg-red-50 text-red-600 hover:bg-red-100 rounded-full px-6"
            >
              Ukloni
            </Button>
            <Button
              onClick={() =>
                isFreeAdListing ? handleRenew() : setIsChoosePackage(true)
              }
              disabled={isRenewingAd}
              className="bg-black text-white rounded-full px-6 hover:bg-gray-800"
            >
              {isRenewingAd ? "Učitavanje..." : "Obnovi"}
            </Button>
          </div>
        </div>
      )}

      {/* MOBILE: bottom sheet - filter (statusi) */}
      <div
        className={`
          sm:hidden fixed inset-0 z-50 transition-opacity duration-300
          ${
            isStatusSheetOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
        onClick={() => setIsStatusSheetOpen(false)}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div
          className={`
            absolute left-0 right-0 bottom-0
            rounded-t-2xl bg-white p-4 shadow-2xl
            transition-transform duration-300 ease-out
            ${isStatusSheetOpen ? "translate-y-0" : "translate-y-full"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex justify-center">
            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Filter oglasa</h2>
            <button
              type="button"
              onClick={() => setIsStatusSheetOpen(false)}
              className="text-xs text-muted-foreground"
            >
              Zatvori
            </button>
          </div>

          <div className="space-y-2">
            {tabs.map((item) => {
              const isActive = status === item.value;
              const count = statusCounts[item.value] || 0;

              return (
                <button
                  key={item.value}
                  onClick={() => {
                    handleStatusChange(item.value);
                    setIsStatusSheetOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between rounded-lg border px-3 py-2 text-xs
                    ${
                      isActive
                        ? "bg-black text-white border-black"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }
                  `}
                >
                  <span>{item.label}</span>
                  <span className="text-[11px]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MOBILE: bottom sheet - sortiranje */}
      <div
        className={`
          sm:hidden fixed inset-0 z-50 transition-opacity duration-300
          ${
            isSortSheetOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
        onClick={() => setIsSortSheetOpen(false)}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div
          className={`
            absolute left-0 right-0 bottom-0
            rounded-t-2xl bg-white p-4 shadow-2xl
            transition-transform duration-300 ease-out
            ${isSortSheetOpen ? "translate-y-0" : "translate-y-full"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex justify-center">
            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Poredaj oglase</h2>
            <button
              type="button"
              onClick={() => setIsSortSheetOpen(false)}
              className="text-xs text-muted-foreground"
            >
              Zatvori
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Poredaj po
            </span>

            <Select
              value={sortValue}
              onValueChange={(value) => {
                handleSortChange(value);
              }}
            >
              <SelectTrigger className="h-9 w-full bg-white shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <IconArrowsSort className="h-3.5 w-3.5 text-gray-500" />
                  <SelectValue placeholder="Poredaj oglase" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-100 shadow-md">
                <SelectGroup>
                  <SelectItem
                    value="new-to-old"
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <IconSortDescending
                        size={16}
                        className="text-gray-500"
                      />
                      <span>Najnovije prvo</span>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="old-to-new"
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <IconSortAscending
                        size={16}
                        className="text-gray-500"
                      />
                      <span>Najstarije prvo</span>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="price-high-to-low"
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <IconCurrencyDollar
                        size={16}
                        className="text-gray-500"
                      />
                      <span>Cijena: najviša prvo</span>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="price-low-to-high"
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <IconCurrencyDollar
                        size={16}
                        className="text-gray-500"
                      />
                      <span>Cijena: najniža prvo</span>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="popular_items"
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <IconTrendingUp size={16} className="text-gray-500" />
                      <span>Popularno</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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
        description={
          selectedIds.length === 1
            ? "Jeste li sigurni da želite obrisati ovaj oglas?"
            : "Jeste li sigurni da želite obrisati ove oglase?"
        }
        cancelText="Otkaži"
        confirmText="Da"
        confirmDisabled={IsDeleting}
      />
    </>
  );
};

export default MyAds;
