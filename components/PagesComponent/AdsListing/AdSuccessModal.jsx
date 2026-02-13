"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Home,
  MapPin,
  Share2,
  Sparkles,
  Tag,
} from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";
import CustomLink from "@/components/Common/CustomLink";

const Confetti = () => {
  const colors = ["#1A4B8C", "#F7941D", "#00A19B", "#FFD700", "#FF6B6B"];
  const pieces = Array.from({ length: 38 });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            y: -16,
            x: Math.random() * 520 - 260,
            rotate: 0,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: 520,
            x: Math.random() * 560 - 280,
            rotate: Math.random() * 720 - 360,
            opacity: 0,
          }}
          transition={{
            duration: Math.random() * 2 + 1.8,
            delay: Math.random() * 0.35,
            ease: "easeOut",
          }}
          className="absolute left-1/2 top-0"
          style={{
            width: Math.random() * 8 + 4,
            height: Math.random() * 8 + 4,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? "50%" : "0%",
          }}
        />
      ))}
    </div>
  );
};

const SummaryRow = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700/70 dark:bg-slate-900/80">
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {label}
    </div>
    <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={value}>
      {value}
    </p>
  </div>
);

const formatScheduledDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("bs-BA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const SuccessIcon = ({ isScheduled }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
    className="relative"
  >
    <motion.div
      initial={{ opacity: 0.35, scale: 0.9 }}
      animate={{ opacity: [0.45, 0.2, 0.45], scale: [1, 1.12, 1] }}
      transition={{ duration: 2.2, repeat: Infinity }}
      className={cn(
        "absolute inset-0 rounded-full blur-2xl",
        isScheduled
          ? "bg-gradient-to-br from-amber-400 to-blue-500"
          : "bg-gradient-to-br from-emerald-400 to-blue-500"
      )}
    />

    <div
      className={cn(
        "relative h-16 w-16 rounded-2xl border border-white/40 shadow-sm flex items-center justify-center",
        isScheduled
          ? "bg-gradient-to-br from-amber-500 to-blue-600"
          : "bg-gradient-to-br from-emerald-500 to-blue-600"
      )}
    >
      {isScheduled ? <Calendar className="h-9 w-9 text-white" /> : <CheckCircle2 className="h-9 w-9 text-white" />}
    </div>
  </motion.div>
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
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (openSuccessModal && !isScheduled) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [openSuccessModal, isScheduled]);

  const title = useMemo(() => (isScheduled ? "Oglas je zakazan" : "Oglas je objavljen"), [isScheduled]);

  const description = useMemo(() => {
    if (isScheduled) {
      return "Objava će biti automatski aktivirana u zakazano vrijeme.";
    }
    return "Oglas je uspješno objavljen i sada je vidljiv korisnicima.";
  }, [isScheduled]);

  const scheduledDateLabel = useMemo(() => formatScheduledDate(scheduledDate), [scheduledDate]);

  const summaryRows = useMemo(() => {
    const rows = [];

    if (adName?.trim()) rows.push({ icon: Tag, label: "Naslov", value: adName.trim() });
    if (categoryLabel?.trim()) rows.push({ icon: BadgeCheck, label: "Kategorija", value: categoryLabel.trim() });
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
      const safeScore = Math.max(0, Math.min(100, Math.round(score)));
      rows.push({
        icon: CheckCircle2,
        label: "Kvalitet",
        value: `${safeScore}%`,
      });
    }

    if (isScheduled && scheduledDateLabel) {
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
    isScheduled,
    scheduledDateLabel,
  ]);

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
        className="w-[calc(100%-1rem)] max-w-[440px] p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent shadow-2xl shadow-slate-900/15 dark:shadow-black/40"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

        <div className="relative flex h-full flex-col overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
          <div
            className={cn(
              "border-b px-4 py-4 sm:px-5",
              isScheduled
                ? "border-amber-200/70 bg-gradient-to-r from-slate-50 to-amber-50 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20"
                : "border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/90"
            )}
          >
            <div className="flex items-center gap-4">
              <SuccessIcon isScheduled={isScheduled} />
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{title}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-snug">{description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            {isScheduled && scheduledDateLabel && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-300">
                <Clock className="h-4 w-4" />
                {scheduledDateLabel}
              </div>
            )}

            {summaryRows.length > 0 && (
              <div className="grid gap-2">
                {summaryRows.map((row) => (
                  <SummaryRow key={`${row.label}-${row.value}`} icon={row.icon} label={row.label} value={row.value} />
                ))}
              </div>
            )}

            {createdAdSlug && (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100/90 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Kopirano" : "Kopiraj link"}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100/90 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Share2 className="h-4 w-4" />
                  Podijeli
                </button>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {createdAdSlug ? (
                <CustomLink
                  href={`/my-listing/${createdAdSlug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1A4B8C] to-[#00A19B] px-4 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95"
                >
                  <ExternalLink className="h-4 w-4" />
                  Pregledaj oglas
                </CustomLink>
              ) : (
                <CustomLink
                  href="/my-ads"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1A4B8C] to-[#00A19B] px-4 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95"
                >
                  <Sparkles className="h-4 w-4" />
                  Moji oglasi
                </CustomLink>
              )}

              <CustomLink
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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

export default AdSuccessModal;
