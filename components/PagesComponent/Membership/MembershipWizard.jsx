"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  Store,
} from "@/components/Common/UnifiedIconPack";
import { toast } from "@/utils/toastBs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { membershipApi } from "@/utils/api";
import { setUserMembership } from "@/redux/reducer/membershipSlice";
import { extractApiData } from "@/lib/membership";
import {
  getRealMembershipBenefits,
  resolveMembershipTierSlug,
} from "@/lib/membershipBenefits";
import {
  isPromoFreeAccessEnabled,
  getPromoHeadline,
  getPromoSubhead,
} from "@/lib/promoMode";
import MembershipBadge from "@/components/Common/MembershipBadge";

// ─── animation variants ───────────────────────────────────────────────────────

const stepVariants = {
  initial: { opacity: 0, y: 22, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -16,
    filter: "blur(4px)",
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

const listVariants = {
  animate: { transition: { staggerChildren: 0.055, delayChildren: 0.12 } },
};

const itemVariants = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

// ─── static data ──────────────────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
  { value: "stripe", label: "Kreditna / debitna kartica (Stripe)" },
  { value: "bank_transfer", label: "Bankovni prijenos" },
  { value: "paypal", label: "PayPal" },
];

const TIER_META = {
  shop: {
    Icon: Store,
    gradient: "from-sky-500 via-blue-600 to-indigo-600",
    gradientSubtle:
      "from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40",
    ring: "ring-sky-400/50 dark:ring-sky-500/40",
    badge:
      "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-700/40",
    glow: "shadow-sky-500/25",
    name: "LMX Shop",
    tagline: "Vodite cijeli shop direktno s LMX platforme.",
    description:
      "LMX Shop je namijenjen prodavačima koji žele profesionalno upravljati asortimanom: zalihe, SKU šifre, računi kupcima i detaljne shop statistike.",
  },
  pro: {
    Icon: Crown,
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    gradientSubtle:
      "from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40",
    ring: "ring-amber-400/50 dark:ring-amber-500/40",
    badge:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-700/40",
    glow: "shadow-amber-500/25",
    name: "LMX Pro",
    tagline: "Napredni alati i veća vidljivost vaših oglasa.",
    description:
      "LMX Pro daje vam detaljnu statistiku oglasa, PRO oznaku na profilu, filtere kupcima i prioritetni prikaz u pretrazi.",
  },
};

const STEPS = ["Dobrodošlica", "Plan", "Potvrda", "Aktivirano"];

// ─── step indicator ───────────────────────────────────────────────────────────

const StepIndicator = ({ currentStep, tierMeta }) => (
  <div className="mb-8 flex items-start justify-center gap-0">
    {STEPS.map((label, index) => {
      const stepNum = index + 1;
      const isCompleted = currentStep > stepNum;
      const isActive = currentStep === stepNum;

      return (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              animate={
                isActive
                  ? { scale: [1, 1.12, 1], transition: { duration: 0.4 } }
                  : {}
              }
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                isCompleted
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                  : isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
              )}
            >
              {isCompleted ? <Check size={13} strokeWidth={2.5} /> : stepNum}
            </motion.div>
            <span
              className={cn(
                "hidden text-[11px] font-medium sm:block transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : isCompleted
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              {label}
            </span>
          </div>

          {index < STEPS.length - 1 && (
            <div className="relative mx-1 mb-4 h-0.5 w-8 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 sm:w-14">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: isCompleted ? "100%" : "0%" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── step 1: welcome ──────────────────────────────────────────────────────────

const StepWelcome = ({ tier, meta, onNext }) => {
  const { Icon, gradient, gradientSubtle, name, tagline, description } = meta;
  const benefits = getRealMembershipBenefits(tier);

  return (
    <motion.div
      key="step-welcome"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-2xl"
    >
      {/* hero card */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-xl sm:p-8",
          gradient,
          "shadow-lg"
        )}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Icon size={30} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                {tier === "shop" ? "LMX Shop paket" : "LMX Pro paket"}
              </p>
              <h2 className="mt-0.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {name}
              </h2>
              <p className="mt-1 text-sm text-white/85">{tagline}</p>
            </div>
          </div>

          <p className="relative mt-5 text-sm leading-relaxed text-white/90">
            {description}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
            <CheckCircle2 size={13} />
            Objava oglasa je besplatna za sve korisnike — {name} je nadogradnja za profesionalce
          </div>
        </div>
      </div>

      {/* benefits */}
      <div
        className={cn(
          "mt-4 rounded-2xl border bg-gradient-to-br p-5 sm:p-6",
          gradientSubtle,
          "border-slate-200/80 dark:border-slate-700/60"
        )}
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Šta dobijate uz {name}
        </p>
        <motion.ul
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="grid gap-2.5 sm:grid-cols-2"
        >
          {benefits.map((benefit, i) => (
            <motion.li
              key={i}
              variants={itemVariants}
              className="flex items-start gap-2.5"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                <Check size={12} strokeWidth={2.5} />
              </span>
              <span className="text-sm leading-snug text-slate-700 dark:text-slate-200">
                {benefit}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      <div className="mt-5 flex justify-end">
        <Button size="lg" className="h-12 rounded-full px-8 text-base" onClick={onNext}>
          Nastavi
          <ArrowRight size={18} className="ml-1" />
        </Button>
      </div>
    </motion.div>
  );
};

// ─── step 2: plan selection ───────────────────────────────────────────────────

const StepSelectPlan = ({ tier, tiers, selectedTier, onSelectTier, onNext, onBack }) => {
  const promoEnabled = isPromoFreeAccessEnabled();

  const displayTiers = useMemo(() => {
    if (!Array.isArray(tiers) || tiers.length === 0) return [];
    const filtered = tiers.filter((t) => resolveMembershipTierSlug(t) === tier);
    return filtered.length > 0 ? filtered : tiers;
  }, [tiers, tier]);

  return (
    <motion.div
      key="step-plan"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-2xl"
    >
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
          Odaberite paket
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pregledajte dostupne opcije i odaberite paket koji odgovara vašim potrebama.
        </p>
      </div>

      {promoEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10"
        >
          <p className="font-semibold text-emerald-800 dark:text-emerald-200">
            {getPromoHeadline()}
          </p>
          <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
            {getPromoSubhead()}
          </p>
        </motion.div>
      )}

      <motion.div
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        {displayTiers.map((t) => {
          const slug = resolveMembershipTierSlug(t);
          const meta = TIER_META[slug] || TIER_META.pro;
          const { Icon, gradient, ring, badge, glow } = meta;
          const isSelected = selectedTier?.id === t?.id;
          const benefits = getRealMembershipBenefits(slug);

          return (
            <motion.div
              key={t?.id}
              variants={itemVariants}
              role="button"
              tabIndex={0}
              onClick={() => onSelectTier(t)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectTier(t);
                }
              }}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300",
                isSelected
                  ? cn(
                      "border-transparent ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950",
                      ring,
                      "shadow-lg",
                      glow
                    )
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
              )}
            >
              {/* gradient header */}
              <div className={cn("flex items-center gap-3 bg-gradient-to-r p-4 text-white sm:gap-4 sm:p-5", gradient)}>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight">{t?.name || meta.name}</p>
                  <p className="mt-0.5 truncate text-xs text-white/80">
                    {t?.description || meta.tagline}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {promoEnabled ? (
                    <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-sm font-bold">
                      Besplatno
                    </span>
                  ) : (
                    <div>
                      <p className="text-xl font-extrabold tabular-nums">
                        {t?.price ? `${t.price} EUR` : "0 EUR"}
                      </p>
                      <p className="text-xs text-white/70">
                        / {t?.duration_days || 30} dana
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* benefits */}
              <div className="p-4 sm:p-5">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {benefits.slice(0, 4).map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200"
                    >
                      <Check
                        size={13}
                        strokeWidth={2.5}
                        className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      />
                      <span className="leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      badge
                    )}
                  >
                    {isSelected ? "Odabran plan" : "Dostupan plan"}
                  </span>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
                      >
                        <Check size={14} strokeWidth={2.5} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" className="h-11 rounded-full px-6" onClick={onBack}>
          Nazad
        </Button>
        <Button
          size="lg"
          className="h-12 rounded-full px-8"
          onClick={onNext}
          disabled={!selectedTier}
        >
          Nastavi
          <ArrowRight size={17} className="ml-1" />
        </Button>
      </div>
    </motion.div>
  );
};

// ─── step 3: confirm ──────────────────────────────────────────────────────────

const StepConfirm = ({
  tier,
  selectedTier,
  paymentMethod,
  onPaymentMethodChange,
  onSubmit,
  isProcessing,
  onBack,
}) => {
  const promoEnabled = isPromoFreeAccessEnabled();
  const slug = selectedTier ? resolveMembershipTierSlug(selectedTier) : tier;
  const meta = TIER_META[slug] || TIER_META.pro;
  const { Icon, gradient, gradientSubtle } = meta;
  const benefits = getRealMembershipBenefits(slug);

  return (
    <motion.div
      key="step-confirm"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-xl"
    >
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
          Potvrda aktivacije
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pregledajte detalje paketa i potvrdite aktivaciju.
        </p>
      </div>

      {/* plan summary */}
      <div
        className={cn(
          "relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg sm:p-6",
          gradient
        )}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Icon size={26} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
              Odabrani plan
            </p>
            <p className="mt-0.5 truncate text-xl font-extrabold">
              {selectedTier?.name || meta.name}
            </p>
            {selectedTier?.description && (
              <p className="mt-0.5 truncate text-xs text-white/75">
                {selectedTier.description}
              </p>
            )}
          </div>
          {promoEnabled ? (
            <div className="shrink-0 rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-center backdrop-blur-sm">
              <p className="text-sm font-extrabold">Besplatno</p>
            </div>
          ) : (
            <div className="shrink-0 rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-center backdrop-blur-sm">
              <p className="text-xl font-extrabold tabular-nums">
                {selectedTier?.price ? `${selectedTier.price} EUR` : "0 EUR"}
              </p>
              <p className="text-xs text-white/70">
                / {selectedTier?.duration_days || 30} dana
              </p>
            </div>
          )}
        </div>
      </div>

      {/* benefits checklist */}
      <div
        className={cn(
          "mb-5 rounded-2xl border bg-gradient-to-br p-4 sm:p-5",
          gradientSubtle,
          "border-slate-200/80 dark:border-slate-700/60"
        )}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Što je uključeno
        </p>
        <motion.ul
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          {benefits.map((b, i) => (
            <motion.li
              key={i}
              variants={itemVariants}
              className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200"
            >
              <Check
                size={13}
                strokeWidth={2.5}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              />
              <span className="leading-snug">{b}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* payment */}
      {promoEnabled ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10"
        >
          <p className="font-semibold text-emerald-800 dark:text-emerald-200">
            Promotivni režim — nema plaćanja ni unosa kartice.
          </p>
          <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
            Klikom na dugme ispod potvrđujete besplatnu aktivaciju paketa.
          </p>
        </motion.div>
      ) : (
        <div className="mb-5">
          <label
            htmlFor="wizard-payment-method"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Način plaćanja
          </label>
          <div className="relative">
            <CreditCard className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <select
              id="wizard-payment-method"
              value={paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              className={cn(
                "h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900",
                "outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20",
                "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-primary"
              )}
            >
              {PAYMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          className="h-11 rounded-full px-6"
          onClick={onBack}
          disabled={isProcessing}
        >
          Nazad
        </Button>
        <Button
          size="lg"
          className="h-12 flex-1 rounded-full text-base sm:flex-none sm:px-10"
          onClick={onSubmit}
          disabled={isProcessing}
        >
          {isProcessing
            ? "Obrada..."
            : promoEnabled
            ? "Aktiviraj besplatno"
            : "Potvrdi i aktiviraj"}
        </Button>
      </div>
    </motion.div>
  );
};

// ─── step 4: success ──────────────────────────────────────────────────────────

const StepSuccess = ({ tier, selectedTier }) => {
  const router = useRouter();
  const slug = selectedTier ? resolveMembershipTierSlug(selectedTier) : tier;
  const meta = TIER_META[slug] || TIER_META.pro;
  const { Icon, gradient, name } = meta;

  return (
    <motion.div
      key="step-success"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-lg text-center"
    >
      {/* success icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
        className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-500/20 dark:bg-emerald-500/20"
      >
        <CheckCircle2 size={44} className="text-emerald-600 dark:text-emerald-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-3xl">
          Dobrodošli u {name}!
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Vaše članstvo je uspješno aktivirano. Badge se odmah pojavljuje na vašem profilu.
        </p>
      </motion.div>

      {/* badge preview card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.32, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "my-6 inline-flex w-full items-center gap-4 rounded-2xl bg-gradient-to-br p-5 text-white shadow-xl sm:p-6",
          gradient
        )}
      >
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <Icon size={26} />
        </span>
        <div className="flex-1 text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Vaš badge
          </p>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="text-xl font-extrabold">{name}</span>
            <MembershipBadge tier={slug} size="sm" uppercase />
          </div>
        </div>
      </motion.div>

      {/* actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.3 }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Button
          size="lg"
          className="h-12 rounded-full"
          onClick={() => router.push("/membership/manage")}
        >
          Upravljaj članstvom
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-12 rounded-full"
          onClick={() =>
            router.push(slug === "shop" ? "/profile/shop-ops" : "/my-ads")
          }
        >
          {slug === "shop" ? "Otvori Shop" : "Moji oglasi"}
        </Button>
      </motion.div>
    </motion.div>
  );
};

// ─── main wizard ──────────────────────────────────────────────────────────────

const MembershipWizard = ({ tier = "shop", tiers = [], currentMembership }) => {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState(() => {
    if (!Array.isArray(tiers) || tiers.length === 0) return null;
    return (
      tiers.find((t) => resolveMembershipTierSlug(t) === tier) ||
      tiers[0] ||
      null
    );
  });
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [isProcessing, setIsProcessing] = useState(false);

  const meta = TIER_META[tier] || TIER_META.pro;

  const syncedTier = useMemo(() => {
    if (selectedTier) return selectedTier;
    if (!Array.isArray(tiers) || tiers.length === 0) return null;
    return (
      tiers.find((t) => resolveMembershipTierSlug(t) === tier) ||
      tiers[0] ||
      null
    );
  }, [selectedTier, tier, tiers]);

  const handleSubmit = async () => {
    const promoEnabled = isPromoFreeAccessEnabled();

    if (promoEnabled) {
      toast.success(
        "Promotivni režim je aktivan — sve funkcionalnosti su besplatno dostupne."
      );
      dispatch(setUserMembership({ tier, is_active: true }));
      setStep(4);
      return;
    }

    if (!syncedTier?.id) {
      toast.error("Odaberite plan prije nastavka.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await membershipApi.upgradeMembership({
        tier_id: syncedTier.id,
        payment_method: paymentMethod,
      });

      if (res?.data?.error === false) {
        try {
          const membershipRes = await membershipApi.getUserMembership();
          const payload = extractApiData(membershipRes);
          dispatch(
            setUserMembership(
              payload && typeof payload === "object" ? payload : null
            )
          );
        } catch {
          // silent refresh failure
        }
        toast.success("Članstvo je uspješno aktivirano!");
        setStep(4);
        return;
      }

      toast.error(
        res?.data?.message || "Aktivacija nije uspjela. Pokušajte ponovo."
      );
    } catch {
      toast.error("Greška pri aktivaciji članstva.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-0">
      {/* heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-2 text-center"
      >
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          {meta.name} onboarding
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Završite aktivaciju u nekoliko jednostavnih koraka.
        </p>
      </motion.div>

      <StepIndicator currentStep={step} tierMeta={meta} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepWelcome
            tier={tier}
            meta={meta}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <StepSelectPlan
            tier={tier}
            tiers={tiers}
            selectedTier={syncedTier}
            onSelectTier={setSelectedTier}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepConfirm
            tier={tier}
            selectedTier={syncedTier}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <StepSuccess
            tier={tier}
            selectedTier={syncedTier}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MembershipWizard;
