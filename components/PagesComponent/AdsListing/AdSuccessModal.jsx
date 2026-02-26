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
  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </div>
    <p className="mt-1 line-clamp-2 break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100" title={value}>
      {value}
    </p>
  </div>
);

const AdSuccessModal = ({
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

  const title = isScheduled ? "Oglas je zakazan" : "Oglas je objavljen";
  const description = isScheduled
    ? "Objava će biti automatski aktivirana u zakazano vrijeme."
    : "Sve je spremno. Oglas je sada vidljiv korisnicima na platformi.";

  return (
    <Dialog open={openSuccessModal} onOpenChange={closeSuccessModal}>
      <DialogContent
        showCloseButton={false}
        className="max-lg:fixed max-lg:inset-0 max-lg:!m-0 max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:rounded-none max-lg:border-0 w-[min(96vw,480px)] max-h-[92dvh] overflow-hidden rounded-2xl bg-white p-0 dark:bg-slate-950 lg:dark:bg-slate-900"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex h-full max-h-[100dvh] flex-col lg:max-h-[92dvh]">
          <div className="shrink-0 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0ab6af]/10">
                {isScheduled ? <Calendar className="h-6 w-6 text-[#0ab6af]" /> : <CheckCircle2 className="h-6 w-6 text-[#0ab6af]" />}
              </div>
              <button
                type="button"
                onClick={closeSuccessModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                aria-label="Zatvori"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>

            {scheduledDateLabel ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <Clock className="h-3.5 w-3.5" />
                {scheduledDateLabel}
              </div>
            ) : null}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
            {summary.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {summary.map((item) => (
                  <SummaryItem key={`${item.label}-${item.value}`} icon={item.icon} label={item.label} value={item.value} />
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              {createdAdSlug ? (
                <CustomLink
                  href={`/my-listing/${createdAdSlug}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0ab6af] text-sm font-semibold text-white transition-colors hover:bg-[#09a8a2]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Pregledaj oglas
                </CustomLink>
              ) : (
                <CustomLink
                  href="/my-ads"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0ab6af] text-sm font-semibold text-white transition-colors hover:bg-[#09a8a2]"
                >
                  <Sparkles className="h-4 w-4" />
                  Moji oglasi
                </CustomLink>
              )}

              <div className="grid grid-cols-2 gap-2">
                {createdAdSlug && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Copy className={cn("h-4 w-4", copied && "text-emerald-500")} />
                      {copied ? "Kopirano" : "Kopiraj"}
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Share2 className="h-4 w-4" />
                      Podijeli
                    </button>
                  </>
                )}
              </div>

              <CustomLink
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Home className="h-4 w-4" />
                Početna
              </CustomLink>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdSuccessModal;
