"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  BadgeCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Home,
  MapPin,
  Share2,
  Tag,
  Wallet,
  X,
} from "@/components/Common/UnifiedIconPack";
import CustomLink from "@/components/Common/CustomLink";

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/85">
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
    </div>
    <span className="min-w-0 truncate text-right text-sm font-semibold text-slate-900 dark:text-slate-100" title={value}>
      {value}
    </span>
  </div>
);

const EditSuccessIcon = () => (
  <motion.div
    initial={{ scale: 0.85, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="relative"
  >
    <motion.div
      initial={{ opacity: 0.35, scale: 0.9 }}
      animate={{ opacity: [0.45, 0.2, 0.45], scale: [1, 1.14, 1] }}
      transition={{ duration: 2.2, repeat: Infinity }}
      className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 blur-2xl"
    />
    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-br from-emerald-500 to-blue-600 shadow-sm">
      <CheckCircle2 className="h-8 w-8 text-white" />
    </div>
  </motion.div>
);

const AdsEditSuccessModal = ({
  openSuccessModal,
  setOpenSuccessModal,
  createdAdSlug,
  adName = "",
  categoryLabel = "",
  priceLabel = "",
  locationLabel = "",
}) => {
  const [copied, setCopied] = useState(false);

  const detailRows = useMemo(() => {
    const rows = [];

    if (adName?.trim()) rows.push({ icon: Tag, label: "Naslov", value: adName.trim() });
    if (categoryLabel?.trim()) rows.push({ icon: BadgeCheck, label: "Kategorija", value: categoryLabel.trim() });
    if (priceLabel?.trim()) rows.push({ icon: Wallet, label: "Cijena", value: priceLabel.trim() });
    if (locationLabel?.trim()) rows.push({ icon: MapPin, label: "Lokacija", value: locationLabel.trim() });

    return rows;
  }, [adName, categoryLabel, priceLabel, locationLabel]);

  const adUrl = useMemo(() => {
    if (!createdAdSlug) return "";
    if (typeof window === "undefined") return `/my-listing/${createdAdSlug}`;
    return `${window.location.origin}/my-listing/${createdAdSlug}`;
  }, [createdAdSlug]);

  const closeSuccessModal = () => {
    setOpenSuccessModal(false);
  };

  const handleCopyLink = async () => {
    if (!adUrl || !navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(adUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (!adUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: adName || "Pogledajte moj oglas",
          url: adUrl,
        });
      } catch {
        // User cancelled sharing.
      }
      return;
    }

    handleCopyLink();
  };

  return (
    <Dialog open={openSuccessModal} onOpenChange={closeSuccessModal}>
      <DialogContent
        className="w-[calc(100%-1rem)] max-w-[460px] overflow-hidden rounded-2xl border border-slate-200 bg-transparent p-0 shadow-2xl shadow-slate-900/15 dark:border-slate-700 dark:shadow-black/40"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex h-full flex-col overflow-hidden bg-white/95 backdrop-blur-xl dark:bg-slate-900/95">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/90">
            <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Izmjena oglasa
              </p>
              <button
                type="button"
                onClick={closeSuccessModal}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Zatvori modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 px-4 pb-3">
              <EditSuccessIcon />
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">USPJESNO UREDJEN!!</h2>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">Oglas je uspješno uređen i izmjene su sačuvane.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            {detailRows.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white p-2.5 dark:border-slate-700 dark:from-slate-900/70 dark:to-slate-900"
              >
                <p className="px-0.5 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Sačuvani detalji
                </p>
                <div className="space-y-2">
                  {detailRows.map((row) => (
                    <DetailRow key={`${row.label}-${row.value}`} icon={row.icon} label={row.label} value={row.value} />
                  ))}
                </div>
              </motion.div>
            )}

            {createdAdSlug && (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Kopirano" : "Kopiraj link"}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Share2 className="h-4 w-4" />
                  Podijeli
                </button>
              </div>
            )}

            <div className="space-y-2">
              {createdAdSlug ? (
                <CustomLink
                  href={`/my-listing/${createdAdSlug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 py-3 font-semibold text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:scale-[1.01]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Pregledaj oglas
                </CustomLink>
              ) : (
                <CustomLink
                  href="/my-ads"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 py-3 font-semibold text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:scale-[1.01]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Moji oglasi
                </CustomLink>
              )}

              <CustomLink
                href="/"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Home className="h-4 w-4" />
                Nazad na početnu
              </CustomLink>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdsEditSuccessModal;
