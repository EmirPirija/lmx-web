"use client";

import { useEffect, useMemo, useState } from "react";
import { myPurchasesApi } from "@/utils/api";
import { cn } from "@/lib/utils";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import MobileSectionSelectorCard from "@/components/Profile/MobileSectionSelectorCard";
import CustomImage from "@/components/Common/CustomImage";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MdReceipt,
  MdDownload,
  MdVisibility,
  MdStorefront,
  MdCalendarToday,
  MdOpenInNew,
  IoBagHandleOutline,
  ShoppingBag,
} from "@/components/Common/UnifiedIconPack";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("bs-BA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatPrice = (price) => {
  const numeric = Number(price || 0);
  return `${new Intl.NumberFormat("bs-BA").format(numeric)} KM`;
};

const PurchaseCard = ({ purchase, onViewReceipt }) => {
  const hasReceipt = Boolean(purchase?.receipt_url);
  const itemName = purchase?.item?.name || "Kupljeni artikal";
  const sellerName = purchase?.seller?.name || "Nepoznat prodavač";

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex gap-4 p-4 sm:p-5">
        <div className="relative shrink-0">
          <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
            <CustomImage
              src={purchase?.item?.image}
              alt={itemName}
              width={112}
              height={112}
              className="h-full w-full object-cover"
            />
          </div>
          {Number(purchase?.quantity) > 1 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white shadow-sm">
              x{purchase.quantity}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
            {itemName}
          </h3>
          <p className="mt-1 text-xl font-black text-primary">{formatPrice(purchase?.total_price)}</p>

          <div className="mt-3 space-y-1.5 text-sm">
            <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <MdStorefront size={16} className="text-slate-400 dark:text-slate-500" />
              <span>Od:</span>
              <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{sellerName}</span>
            </p>
            <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <MdCalendarToday size={14} className="text-slate-400 dark:text-slate-500" />
              <span>{formatDate(purchase?.created_at)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-semibold",
              hasReceipt
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            <MdReceipt size={16} />
            <span>{hasReceipt ? "Račun dostupan" : "Račun nije priložen"}</span>
          </div>

          {hasReceipt ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewReceipt(purchase)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <MdVisibility size={16} />
                Pregledaj
              </button>
              <a
                href={purchase.receipt_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                <MdDownload size={16} />
                Preuzmi
              </a>
            </div>
          ) : null}
        </div>

        {purchase?.note ? (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 dark:border-blue-900/30 dark:bg-blue-900/20">
            <p className="mb-1 text-xs font-semibold text-blue-600 dark:text-blue-300">Poruka od prodavača:</p>
            <p className="text-sm text-blue-800 dark:text-blue-100">{purchase.note}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
};

const PurchaseSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <div className="flex gap-4 p-4 sm:p-5">
      <Skeleton className="h-24 w-24 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-6 w-28 rounded-lg" />
        <Skeleton className="h-4 w-2/3 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-lg" />
      </div>
    </div>
    <div className="border-t border-slate-100 p-4 dark:border-slate-800">
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  </div>
);

const ReceiptModal = ({ isOpen, onClose, purchase }) => {
  if (!purchase) return null;

  const isPdf = purchase?.receipt_url?.toLowerCase().endsWith(".pdf");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden border border-slate-200 bg-white p-0 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:max-w-[640px]">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MdReceipt size={18} />
            </span>
            <span className="truncate">Račun - {purchase?.item?.name || "Kupovina"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-5">
          {isPdf ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/60">
              <MdReceipt className="mx-auto mb-4 text-slate-400 dark:text-slate-500" size={56} />
              <p className="mb-4 text-slate-600 dark:text-slate-300">PDF dokument</p>
              <a
                href={purchase.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary/90"
              >
                <MdOpenInNew size={18} />
                Otvori PDF
              </a>
            </div>
          ) : (
            <img
              src={purchase.receipt_url}
              alt="Račun"
              className="max-h-[52vh] w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700"
            />
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Prodavač</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{purchase?.seller?.name || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Datum</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{formatDate(purchase?.created_at)}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Količina</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{purchase?.quantity || 1}x</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Ukupno</p>
                <p className="font-semibold text-primary">{formatPrice(purchase?.total_price)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MyPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFilter, setReceiptFilter] = useState("all");

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const res = await myPurchasesApi.getPurchases({ page: pageNum });

      if (res?.data?.error === false) {
        const data = res?.data?.data?.data || res?.data?.data || [];

        if (pageNum === 1) {
          setPurchases(data);
        } else {
          setPurchases((prev) => [...prev, ...data]);
        }

        setHasMore(res?.data?.data?.current_page < res?.data?.data?.last_page);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Greška pri dohvatanju kupovina:", error);
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseStats = useMemo(() => {
    const total = purchases.length;
    const withReceipt = purchases.filter((purchase) => Boolean(purchase?.receipt_url)).length;
    const withoutReceipt = Math.max(0, total - withReceipt);
    const totalSpent = purchases.reduce((sum, purchase) => sum + Number(purchase?.total_price || 0), 0);

    return {
      total,
      withReceipt,
      withoutReceipt,
      totalSpent,
    };
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    if (receiptFilter === "with_receipt") {
      return purchases.filter((purchase) => Boolean(purchase?.receipt_url));
    }
    if (receiptFilter === "without_receipt") {
      return purchases.filter((purchase) => !purchase?.receipt_url);
    }
    return purchases;
  }, [purchases, receiptFilter]);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchPurchases(page + 1);
    }
  };

  const handleViewReceipt = (purchase) => {
    setSelectedPurchase(purchase);
    setShowReceiptModal(true);
  };

  return (
    <>
      <BreadCrumb title2="Moje kupovine" />
      <div className="container py-6">
        <MobileSectionSelectorCard />

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShoppingBag size={22} />
                </span>
                Moje kupovine
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Pregled kupljenih artikala i računa koje ste dobili od prodavača.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Kupovina</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{purchaseStats.total}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">S računom</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{purchaseStats.withReceipt}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Bez računa</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{purchaseStats.withoutReceipt}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 dark:border-primary/30 dark:bg-primary/15">
                <p className="text-[11px] text-primary/90">Ukupno</p>
                <p className="text-sm font-bold text-primary">{formatPrice(purchaseStats.totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setReceiptFilter("all")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                receiptFilter === "all"
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              Sve kupovine
            </button>
            <button
              onClick={() => setReceiptFilter("with_receipt")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                receiptFilter === "with_receipt"
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              Samo s računom
            </button>
            <button
              onClick={() => setReceiptFilter("without_receipt")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                receiptFilter === "without_receipt"
                  ? "border-slate-800 bg-slate-800 text-white dark:border-slate-600 dark:bg-slate-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              Bez računa
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          {isLoading && purchases.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <PurchaseSkeleton key={i} />
              ))}
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-4">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
                  <IoBagHandleOutline size={42} />
                </div>
                <div className="absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20">
                  <MdReceipt size={18} />
                </div>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-700 dark:text-slate-200">Nemate kupovina</h3>
              <p className="mt-2 max-w-md text-center text-sm text-slate-500 dark:text-slate-400">
                Artikli koje kupite će se pojaviti ovdje zajedno s računima od prodavača.
              </p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-14 text-center dark:border-slate-700 dark:bg-slate-800/40">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Nema rezultata za odabrani filter</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Promijenite filter da prikažete sve kupovine.
              </p>
              <button
                onClick={() => setReceiptFilter("all")}
                className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Prikaži sve kupovine
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filteredPurchases.map((purchase) => (
                  <PurchaseCard key={purchase.id} purchase={purchase} onViewReceipt={handleViewReceipt} />
                ))}
              </div>

              {hasMore ? (
                <div className="mt-8 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-8 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {isLoading ? (
                      <span className="h-4 w-4 rounded-full border-2 border-slate-400/40 border-t-slate-500 dark:border-slate-300/30 dark:border-t-slate-100 animate-spin" />
                    ) : null}
                    <span>{isLoading ? "Učitavanje..." : "Učitaj više"}</span>
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        purchase={selectedPurchase}
      />
    </>
  );
};

export default MyPurchases;
