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
} from "@tabler/icons-react";
import { Clock, History, TrendingDown, TrendingUp, Flame } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
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

  // mobile: bottom sheets
  const [isStatusSheetOpen, setIsStatusSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  // scroll direction detection za mobile floating buttons
  const [showMobileButtons, setShowMobileButtons] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollThreshold = 10;

  // Scroll direction handler
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollDiff = currentScrollY - lastScrollY;

    // Samo reagiraj ako je scroll veći od threshold-a
    if (Math.abs(scrollDiff) < scrollThreshold) return;

    if (currentScrollY < 100) {
      // Uvijek prikaži na vrhu stranice
      setShowMobileButtons(true);
    } else if (scrollDiff > 0) {
      // Scroll down - sakrij
      setShowMobileButtons(false);
    } else {
      // Scroll up - prikaži
      setShowMobileButtons(true);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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

  // Helper za sort ikonu
  const getSortIcon = (value, size = 16, className = "text-gray-500") => {
    switch (value) {
      case "new-to-old":
        return <Clock size={size} className={className} />;
      case "old-to-new":
        return <History size={size} className={className} />;
      case "price-high-to-low":
        return <TrendingDown size={size} className={className} />;
      case "price-low-to-high":
        return <TrendingUp size={size} className={className} />;
      case "popular_items":
        return <Flame size={size} className={className} />;
      default:
        return <Clock size={size} className={className} />;
    }
  };

  const isHomeStickySpacerNeeded = isSticky;
  const isHomeStickyHeight = containerHeight ? `${containerHeight}px` : "124px";

  // Trenutni aktivni tab label
  const activeTabLabel = tabs.find((t) => t.value === status)?.label || "Aktivni";

  return (
    <>
      {/* sentinel za sticky */}
      <div
        ref={sentinelRef}
        className="absolute w-full h-px bg-transparent translate-y-[-1px]"
      />

      {isHomeStickySpacerNeeded && (
        <div
          style={{ height: isHomeStickyHeight }}
          className="hidden md:block w-full mb-3 bg-transparent"
        />
      )}

      {/* Desktop: Gornji bar (sticky) */}
      <div
        ref={containerRef}
        className={`
          hidden md:block transition-all duration-300 ease-out z-40
          ${
            isSticky
              ? "fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 py-3 rounded-none px-4 md:px-8"
              : "relative w-full bg-white rounded-xl py-3 px-4 border border-gray-100 shadow-sm"
          }
        `}
      >
        <div
          className={`flex items-center justify-between gap-6 ${
            isSticky ? "container mx-auto max-w-7xl" : ""
          }`}
        >
          {/* Desktop: Tabovi */}
          <div className="flex items-center gap-0.5">
            {tabs.map((item) => {
              const isActive = status === item.value;
              const count = statusCounts[item.value] || 0;

              return (
                <button
                  key={item.value}
                  onClick={() => handleStatusChange(item.value)}
                  className={`
                    group relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium 
                    whitespace-nowrap rounded-lg transition-all duration-200 ease-out
                    ${
                      isActive
                        ? "text-gray-900 bg-gray-100"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <span>{item.label}</span>
                  <span
                    className={`
                      flex items-center justify-center h-5 min-w-[20px] px-1.5 
                      text-[11px] font-semibold rounded-md transition-all duration-200
                      ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "bg-gray-200/70 text-gray-500 group-hover:bg-gray-200"
                      }
                    `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop: Sortiranje */}
          <div className="flex items-center">
            <Select value={sortValue} onValueChange={handleSortChange}>
              <SelectTrigger className="w-10 h-9 p-0 justify-center bg-gray-50 border-gray-200 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                {getSortIcon(sortValue, 18, "text-gray-600")}
              </SelectTrigger>
              <SelectContent
                align={isRTL ? "start" : "end"}
                className="bg-white border-gray-100 shadow-xl rounded-xl"
              >
                <SelectGroup>
                  <SelectItem value="new-to-old" className="cursor-pointer hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-500" />
                      <span>Najnovije prvo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="old-to-new" className="cursor-pointer hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-gray-500" />
                      <span>Najstarije prvo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="price-high-to-low" className="cursor-pointer hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-gray-500" />
                      <span>Cijena: najviša prvo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="price-low-to-high" className="cursor-pointer hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-gray-500" />
                      <span>Cijena: najniža prvo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="popular_items" className="cursor-pointer hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-gray-500" />
                      <span>Popularno</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* MOBILE: Floating buttons sa scroll-aware animacijom */}
      <div
        className={`
          fixed bottom-24 left-1/2 z-50 flex gap-2 -translate-x-1/2 sm:hidden
          transition-all duration-300 ease-out
          ${
            showMobileButtons
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }
        `}
      >
        {/* Filter button */}
        <button
          type="button"
          onClick={() => setIsStatusSheetOpen(true)}
          className="
            flex items-center gap-2 justify-center rounded-full 
            bg-white/95 backdrop-blur-md shadow-lg border border-gray-200/80 
            px-4 py-2.5 active:scale-95 transition-transform duration-150
          "
          aria-label="Filtriraj oglase"
        >
          <IconFilter size={18} stroke={2} className="text-gray-700" />
          <span className="text-sm font-medium text-gray-700">{activeTabLabel}</span>
          <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[11px] font-semibold rounded-full bg-gray-900 text-white">
            {statusCounts[status] || 0}
          </span>
        </button>

        {/* Sort button */}
        <button
          type="button"
          onClick={() => setIsSortSheetOpen(true)}
          className="
            flex items-center justify-center rounded-full 
            bg-white/95 backdrop-blur-md shadow-lg border border-gray-200/80 
            p-2.5 active:scale-95 transition-transform duration-150
          "
          aria-label="Sortiranje"
        >
          {getSortIcon(sortValue, 18, "text-gray-700")}
        </button>
      </div>

      {/* Multi-select bar za istekle oglase */}
      {canMultiSelect && renewIds.length > 0 && (
        <div
          className={`
            flex items-center justify-between mt-6 p-3 bg-gray-50 rounded-xl border border-gray-100
            animate-in fade-in slide-in-from-top-2 duration-300
            ${isSticky ? "pt-4" : ""}
          `}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={renewIds.length === expiredAds.length}
              onCheckedChange={handleSelectAll}
              className="data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
            />
            <span className="text-sm font-medium text-gray-700">Označi sve</span>
          </div>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{renewIds.length}</span>
            {" "}{renewIds.length === 1 ? "oglas" : "oglasa"} označeno
          </p>
        </div>
      )}

      {/* Lista oglasa */}
      <div className="grid grid-cols-2 sm:grid-cols-2 mt-6 xl:grid-cols-4 gap-3 sm:gap-4">
        {IsLoading ? (
          [...Array(8)].map((_, i) => (
            <div
              key={i}
              className="animate-in fade-in duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <ProductCardSkeleton />
            </div>
          ))
        ) : MyItems && MyItems?.length > 0 ? (
          MyItems.map((item, index) => (
            <div
              key={item?.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <AdsCard
                data={item}
                isApprovedSort={sortValue === "approved"}
                isSelected={renewIds.includes(item?.id)}
                isSelectable={renewIds.length > 0 && item.status === "expired"}
                onSelectionToggle={() => handleAdSelection(item?.id)}
                onContextMenuAction={(action, id, buyerId) =>
                  handleContextMenuAction(action, id || item?.id, buyerId)
                }
              />
            </div>
          ))
        ) : (
          <div className="col-span-full animate-in fade-in duration-500">
            <NoData name="oglasa" />
          </div>
        )}
      </div>

      {/* Load more */}
      {currentPage < lastPage && (
        <div className="flex justify-center mt-8 pb-8">
          <Button
            variant="outline"
            className="
              h-11 px-8 rounded-full border-gray-200 text-gray-700 
              hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300
              active:scale-95 transition-all duration-200
            "
            disabled={IsLoading || IsLoadMore}
            onClick={() => getMyItemsData(currentPage + 1)}
          >
            {IsLoadMore ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                Učitavanje...
              </span>
            ) : (
              "Učitaj još"
            )}
          </Button>
        </div>
      )}

      {/* Floating actions za renewal/delete */}
      {renewIds.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
          <div
            className="
              bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl 
              border border-gray-200/80 flex gap-2 pointer-events-auto
              animate-in fade-in slide-in-from-bottom-4 duration-300
            "
          >
            <Button
              onClick={handleCancelSelection}
              variant="ghost"
              className="rounded-xl px-5 hover:bg-gray-100 transition-colors duration-200"
            >
              Otkaži
            </Button>
            <Button
              onClick={() => {
                if (renewIds.length === 0) return;
                setSelectedIds([...renewIds]);
                setIsDeleteDialog(true);
              }}
              className="bg-red-50 text-red-600 hover:bg-red-100 rounded-xl px-5 transition-colors duration-200"
            >
              Ukloni
            </Button>
            <Button
              onClick={() =>
                isFreeAdListing ? handleRenew() : setIsChoosePackage(true)
              }
              disabled={isRenewingAd}
              className="bg-gray-900 text-white rounded-xl px-5 hover:bg-gray-800 transition-colors duration-200"
            >
              {isRenewingAd ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Učitavanje...
                </span>
              ) : (
                "Obnovi"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* MOBILE: Bottom sheet - Filter */}
      <div
        className={`
          sm:hidden fixed inset-0 z-50 transition-all duration-300 ease-out
          ${
            isStatusSheetOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
        onClick={() => setIsStatusSheetOpen(false)}
      >
        {/* Backdrop */}
        <div
          className={`
            absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300
            ${isStatusSheetOpen ? "opacity-100" : "opacity-0"}
          `}
        />

        {/* Sheet */}
        <div
          className={`
            absolute left-0 right-0 bottom-0 rounded-t-3xl bg-white 
            shadow-2xl transition-transform duration-300 ease-out
            ${isStatusSheetOpen ? "translate-y-0" : "translate-y-full"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-gray-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3">
            <h2 className="text-base font-semibold text-gray-900">Filtriraj oglase</h2>
            <button
              type="button"
              onClick={() => setIsStatusSheetOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Zatvori
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pb-8 space-y-1.5">
            {tabs.map((item, index) => {
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
                    w-full flex items-center justify-between rounded-xl px-4 py-3.5
                    transition-all duration-200 ease-out
                    ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-[0.98]"
                    }
                  `}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className="font-medium">{item.label}</span>
                  <span
                    className={`
                      text-sm font-semibold px-2 py-0.5 rounded-md
                      ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}
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

      {/* MOBILE: Bottom sheet - Sortiranje */}
      <div
        className={`
          sm:hidden fixed inset-0 z-50 transition-all duration-300 ease-out
          ${
            isSortSheetOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
        onClick={() => setIsSortSheetOpen(false)}
      >
        {/* Backdrop */}
        <div
          className={`
            absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300
            ${isSortSheetOpen ? "opacity-100" : "opacity-0"}
          `}
        />

        {/* Sheet */}
        <div
          className={`
            absolute left-0 right-0 bottom-0 rounded-t-3xl bg-white 
            shadow-2xl transition-transform duration-300 ease-out
            ${isSortSheetOpen ? "translate-y-0" : "translate-y-full"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-gray-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3">
            <h2 className="text-base font-semibold text-gray-900">Poredaj oglase</h2>
            <button
              type="button"
              onClick={() => setIsSortSheetOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Zatvori
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pb-8 space-y-1.5">
            {[
              { value: "new-to-old", label: "Najnovije prvo", icon: Clock },
              { value: "old-to-new", label: "Najstarije prvo", icon: History },
              { value: "price-high-to-low", label: "Cijena: najviša prvo", icon: TrendingDown },
              { value: "price-low-to-high", label: "Cijena: najniža prvo", icon: TrendingUp },
              { value: "popular_items", label: "Popularno", icon: Flame },
            ].map((item, index) => {
              const isActive = sortValue === item.value;
              const Icon = item.icon;

              return (
                <button
                  key={item.value}
                  onClick={() => {
                    handleSortChange(item.value);
                    setIsSortSheetOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 rounded-xl px-4 py-3.5
                    transition-all duration-200 ease-out
                    ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-[0.98]"
                    }
                  `}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <Icon size={18} className={isActive ? "text-white" : "text-gray-500"} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
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