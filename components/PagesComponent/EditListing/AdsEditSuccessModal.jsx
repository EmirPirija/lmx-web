"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Home,
  Share2,
  Sparkles,
  Tag,
  MapPin,
  Layers,
  X,
} from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";
import CustomLink from "@/components/Common/CustomLink";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("bs-BA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const SummaryItem = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span>{label}</span>
    </div>
    <p className="mt-1.5 line-clamp-2 break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100 sm:line-clamp-1" title={value}>
      {value}
    </p>
  </div>
);

const AdsEditSuccessModal = ({
  openSuccessModal,
  setOpenSuccessModal,
  createdAdSlug,
  isScheduled = false,
  scheduledDate = null,
  adName = "",
  categoryLabel = "",
  priceLabel = "",
  locationLabel = "",
  publishToInstagram,
  completenessScore,
  isFeatured,
}) => {
  const [copied, setCopied] = useState(false);

  const closeSuccessModal = () => {
    setOpenSuccessModal(false);
  };

  const adUrl = useMemo(() => {
    if (!createdAdSlug) return "";
    if (typeof window === "undefined") return `/my-listing/${createdAdSlug}`;
    return `${window.location.origin}/my-listing/${createdAdSlug}`;
  }, [createdAdSlug]);

  const scheduledDateLabel = useMemo(
    () => (isScheduled ? formatDateTime(scheduledDate) : ""),
    [isScheduled, scheduledDate]
  );

  const summary = useMemo(() => {
    const rows = [];

    if (adName?.trim()) rows.push({ icon: Tag, label: "Naslov", value: adName.trim() });
    if (categoryLabel?.trim()) rows.push({ icon: Layers, label: "Kategorija", value: categoryLabel.trim() });
    if (priceLabel?.trim()) rows.push({ icon: Sparkles, label: "Cijena", value: priceLabel.trim() });
    if (locationLabel?.trim()) rows.push({ icon: MapPin, label: "Lokacija", value: locationLabel.trim() });

    if (typeof publishToInstagram === "boolean") {
      rows.push({
        icon: Share2,
        label: "Instagram",
        value: publishToInstagram ? "Uključeno" : "Isključeno",
      });
    }

    if (typeof isFeatured === "boolean") {
      rows.push({
        icon: Sparkles,
        label: "Istaknuto",
        value: isFeatured ? "Da" : "Ne",
      });
    }

    const score = Number(completenessScore);
    if (Number.isFinite(score)) {
      rows.push({
        icon: CheckCircle2,
        label: "Kvalitet oglasa",
        value: `${Math.max(0, Math.min(100, Math.round(score)))}%`,
      });
    }

    if (scheduledDateLabel) {
      rows.push({
        icon: Clock,
        label: "Zakazano",
        value: scheduledDateLabel,
      });
    }

    return rows;
  }, [
    adName,
    categoryLabel,
    priceLabel,
    locationLabel,
    publishToInstagram,
    isFeatured,
    completenessScore,
    scheduledDateLabel,
  ]);

  const handleCopyLink = async () => {
    if (!adUrl || !navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(adUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (!adUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: adName || "LMX oglas",
          url: adUrl,
        });
      } catch {
        // User cancelled sharing.
      }
      return;
    }
    handleCopyLink();
  };

  const title = isScheduled ? "Izmjene su spremljene i zakazane" : "Izmjene su uspješno sačuvane";
  const description = isScheduled
    ? "Oglas će biti automatski objavljen u zakazano vrijeme."
    : "Tvoj oglas je ažuriran i promjene su aktivne.";

  return (
    <Dialog open={openSuccessModal} onOpenChange={closeSuccessModal}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(96vw,560px)] max-h-[92dvh] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:rounded-3xl dark:border-slate-700 dark:bg-slate-900"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex max-h-[92dvh] flex-col">
          <div className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:px-5 sm:py-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {isScheduled ? <Calendar className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {isScheduled ? "Zakazana izmjena" : "Uspješna izmjena"}
              </div>
              <button
                type="button"
                onClick={closeSuccessModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Zatvori modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>

            {scheduledDateLabel ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
                <Clock className="h-3.5 w-3.5" />
                {scheduledDateLabel}
              </div>
            ) : null}
          </div>

          <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            {summary.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {summary.map((item) => (
                  <SummaryItem key={`${item.label}-${item.value}`} icon={item.icon} label={item.label} value={item.value} />
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {createdAdSlug ? (
                <CustomLink
                  href={`/my-listing/${createdAdSlug}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                >
                  <ExternalLink className="h-4 w-4" />
                  Pregledaj oglas
                </CustomLink>
              ) : (
                <CustomLink
                  href="/my-ads"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                >
                  <Sparkles className="h-4 w-4" />
                  Moji oglasi
                </CustomLink>
              )}

              <CustomLink
                href="/"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Home className="h-4 w-4" />
                Početna
              </CustomLink>
            </div>

            {createdAdSlug ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Copy className={cn("h-4 w-4", copied && "text-emerald-500")} />
                  {copied ? "Kopirano" : "Kopiraj link"}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Share2 className="h-4 w-4" />
                  Podijeli
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdsEditSuccessModal;
