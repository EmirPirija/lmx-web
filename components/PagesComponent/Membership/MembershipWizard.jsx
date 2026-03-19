"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Zap,
} from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/utils/toastBs";
import { membershipApi } from "@/utils/api";
import { setUserMembership } from "@/redux/reducer/membershipSlice";
import { extractApiData, resolveMembership } from "@/lib/membership";
import { userSignUpData } from "@/redux/reducer/authSlice";
import {
  getPromoBenefits,
  getPromoHeadline,
  isPromoFreeAccessEnabled,
} from "@/lib/promoMode";

/* ─────────────────────────────────────────────
   KONSTANTE
───────────────────────────────────────────── */

const PAYMENT_OPTIONS = [
  { value: "stripe", label: "Stripe (kartica)" },
  { value: "bank_transfer", label: "Bankovni prijenos" },
  { value: "paypal", label: "PayPal" },
];

const SHOP_BENEFITS = [
  "Izlog s tvojim artiklima i branding prodavača",
  "Praćenje zaliha + automatski status 'Nema na stanju'",
  "Cijena po komadu i minimalna količina narudžbe",
  "Interna šifra artikla (SKU) za lakše upravljanje",
  "Osnovna analitika pregleda i interakcija",
  "SHOP oznaka na profilu — veće povjerenje kupaca",
];

const PRO_BENEFITS = [
  "Sve Shop pogodnosti uključene",
  "Prilagođena domena i napredni brending",
  "Napredna ROI analitika i konverzije",
  "Skupne akcije: pause, obnova, izdvajanje, obnova",
  "SLA oznaka i istaknuta reputacija prodavača",
  "PRO oznaka na profilu — premium vidljivost",
];

const PRO_GOALS = [
  { id: "visibility", label: "Veća vidljivost", icon: Zap },
  { id: "analytics", label: "ROI analitika", icon: TrendingUp },
  { id: "domain", label: "Vlastita domena", icon: Target },
  { id: "bulk", label: "Skupne akcije", icon: Sparkles },
];

/* ─────────────────────────────────────────────
   UTILITY KOMPONENTE
───────────────────────────────────────────── */

function StepIndicator({ steps, currentStep }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                  isDone
                    ? "border-primary bg-primary text-white"
                    : isActive
                      ? "border-primary bg-white text-primary dark:bg-slate-900"
                      : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                )}
              >
                {isDone ? <Check size={14} /> : stepNum}
              </div>
              <span
                className={cn(
                  "hidden text-[10px] font-semibold uppercase tracking-wide sm:block",
                  isActive
                    ? "text-primary"
                    : isDone
                      ? "text-slate-500"
                      : "text-slate-400 dark:text-slate-600"
                )}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "mb-5 h-0.5 w-12 transition-all duration-300 sm:w-16",
                  isDone ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function BenefitList({ benefits, tierColor = "emerald" }) {
  const colorMap = {
    emerald: "text-emerald-500",
    indigo: "text-indigo-500",
    amber: "text-amber-500",
  };
  return (
    <ul className="space-y-2.5">
      {benefits.map((benefit) => (
        <li key={benefit} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
          <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", colorMap[tierColor])} />
          {benefit}
        </li>
      ))}
    </ul>
  );
}

function TierBadgePreview({ tier }) {
  if (tier === "shop") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold tracking-wide text-indigo-700 dark:border-indigo-700/45 dark:bg-indigo-900/25 dark:text-indigo-300">
        <Store size={11} />
        SHOP
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold tracking-wide text-amber-700 dark:border-amber-700/45 dark:bg-amber-900/25 dark:text-amber-300">
      <Crown size={11} />
      PRO
    </span>
  );
}

/* ─────────────────────────────────────────────
   WIZARD KORACI — SHOP
───────────────────────────────────────────── */

function ShopStep1({ onNext }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/25">
          <Store className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          Dobrodošao u LMX Shop
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          LMX Shop ti daje sve alate za ozbiljnu online prodaju — zalihe, analitiku, SKU i SHOP oznaku na profilu.
        </p>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 dark:border-indigo-800/40 dark:bg-indigo-900/15">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Šta dobijaš
        </p>
        <BenefitList benefits={SHOP_BENEFITS} tierColor="indigo" />
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Svi oglasi su i dalje besplatni. Shop je nadogradnja za napredne alate prodaje.
        </p>
      </div>

      <Button
        size="lg"
        className="h-12 w-full rounded-full bg-indigo-600 hover:bg-indigo-700"
        onClick={onNext}
      >
        Kreni dalje
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function ShopStep2({ formData, onChange, onNext, onBack }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
          Podesi shop profil
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ove informacije pomažu kupcima da te prepoznaju i kontaktiraju.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Naziv shopa / ime prodavača
          </label>
          <input
            type="text"
            value={formData.shopName}
            onChange={(e) => onChange("shopName", e.target.value)}
            placeholder="npr. Moda by Amra"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Tip prodavača
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "individual", label: "Privatna osoba" },
              { value: "company", label: "Firma / Obrt" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange("sellerType", opt.value)}
                className={cn(
                  "h-11 rounded-xl border text-sm font-semibold transition-all",
                  formData.sellerType === opt.value
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Kratki opis shopa{" "}
            <span className="text-xs font-normal text-slate-400">(opciono)</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Prodajem ručno rađenu odjeću i modni nakit..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="h-12 flex-1 rounded-full" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Nazad
        </Button>
        <Button
          size="lg"
          className="h-12 flex-1 rounded-full bg-indigo-600 hover:bg-indigo-700"
          onClick={onNext}
        >
          Nastavi
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   WIZARD KORACI — PRO
───────────────────────────────────────────── */

function ProStep1({ onNext }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/25">
          <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          Postani LMX Pro
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          LMX Pro je za ozbiljne prodavače koji žele naprednu analitiku, vlastitu domenu i alate za skaliranje prodaje.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 dark:border-amber-800/40 dark:bg-amber-900/15">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Sve što dobijaš
        </p>
        <BenefitList benefits={PRO_BENEFITS} tierColor="amber" />
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pro uključuje sve Shop funkcionalnosti plus napredne Pro-only alate.
        </p>
      </div>

      <Button
        size="lg"
        className="h-12 w-full rounded-full bg-amber-500 hover:bg-amber-600"
        onClick={onNext}
      >
        Kreni dalje
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function ProStep2({ formData, onChange, onNext, onBack }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
          Šta je tvoj primarni cilj?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Odaberi fokus i prilagodićemo ti onboarding. Možeš odabrati više opcija.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PRO_GOALS.map(({ id, label, icon: Icon }) => {
          const isSelected = formData.goals.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                const newGoals = isSelected
                  ? formData.goals.filter((g) => g !== id)
                  : [...formData.goals, id];
                onChange("goals", newGoals);
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition-all",
                isSelected
                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              )}
            >
              <Icon className={cn("h-6 w-6", isSelected ? "text-amber-500" : "text-slate-400")} />
              {label}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        Izbor nije obavezan — možeš nastaviti bez odabira.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" className="h-12 flex-1 rounded-full" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Nazad
        </Button>
        <Button
          size="lg"
          className="h-12 flex-1 rounded-full bg-amber-500 hover:bg-amber-600"
          onClick={onNext}
        >
          Nastavi
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ZAJEDNIČKI KORAK — PLAĆANJE
───────────────────────────────────────────── */

function PaymentStep({ tier, tiers, paymentMethod, onPaymentChange, onSubmit, onBack, isProcessing }) {
  const promoEnabled = isPromoFreeAccessEnabled();

  const matchedTier = useMemo(() => {
    if (!Array.isArray(tiers) || tiers.length === 0) return null;
    return (
      tiers.find((t) =>
        [t?.slug, t?.tier, t?.name]
          .map((v) => String(v ?? "").toLowerCase())
          .some((v) => v === tier || v.includes(tier))
      ) || tiers[0]
    );
  }, [tiers, tier]);

  const isShop = tier === "shop";
  const accentColor = isShop ? "indigo" : "amber";
  const tierLabel = isShop ? "LMX Shop" : "LMX Pro";

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
          Potvrda i plaćanje
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Provjeri detalje i završi aktivaciju paketa {tierLabel}.
        </p>
      </div>

      {/* Sažetak paketa */}
      <div
        className={cn(
          "rounded-2xl border p-5",
          isShop
            ? "border-indigo-100 bg-indigo-50/60 dark:border-indigo-800/40 dark:bg-indigo-900/15"
            : "border-amber-100 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-900/15"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isShop ? (
              <Store className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{tierLabel}</p>
              <p className="text-xs text-slate-500">
                {matchedTier?.duration_days || 30} dana • automatska obnova
              </p>
            </div>
          </div>
          <TierBadgePreview tier={tier} />
        </div>

        <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-slate-700/50">
          {promoEnabled ? (
            <div>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                Besplatno
              </p>
              <p className="text-xs text-slate-500">{getPromoHeadline()}</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                {matchedTier?.price ? `${matchedTier.price} EUR` : "Kontaktiraj nas"}
              </p>
              <p className="text-xs text-slate-500">
                po {matchedTier?.duration_days || 30} dana
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Badge preview */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Tvoj badge nakon aktivacije
        </p>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
            <span className="text-xs font-bold text-slate-500">TI</span>
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Tvoje ime
          </span>
          <TierBadgePreview tier={tier} />
        </div>
      </div>

      {/* Plaćanje */}
      {!promoEnabled ? (
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Način plaćanja
          </label>
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPaymentChange(opt.value)}
                className={cn(
                  "flex h-12 w-full items-center gap-3 rounded-xl border px-4 text-sm font-semibold transition-all",
                  paymentMethod === opt.value
                    ? isShop
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                )}
              >
                <CreditCard className="h-4 w-4 shrink-0" />
                {opt.label}
                {paymentMethod === opt.value && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-200">
          Promotivni period: nema plaćanja. Aktivacija je besplatna bez unosa kartice.
          <div className="mt-1.5 flex flex-wrap gap-1">
            {getPromoBenefits().slice(0, 3).map((b) => (
              <span key={b} className="rounded-full border border-emerald-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/35 dark:bg-slate-900/60 dark:text-emerald-200">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="h-12 flex-1 rounded-full" onClick={onBack} disabled={isProcessing}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Nazad
        </Button>
        <Button
          size="lg"
          className={cn(
            "h-12 flex-1 rounded-full",
            isShop ? "bg-indigo-600 hover:bg-indigo-700" : "bg-amber-500 hover:bg-amber-600"
          )}
          onClick={onSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? (
            "Aktivacija..."
          ) : promoEnabled ? (
            `Aktiviraj besplatno`
          ) : (
            `Aktiviraj ${tierLabel}`
          )}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   KORAK USPJEHA
───────────────────────────────────────────── */

function SuccessStep({ tier, onContinue }) {
  const isShop = tier === "shop";

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div
          className={cn(
            "mx-auto flex h-20 w-20 items-center justify-center rounded-full",
            isShop
              ? "bg-indigo-100 dark:bg-indigo-900/30"
              : "bg-amber-100 dark:bg-amber-900/30"
          )}
        >
          {isShop ? (
            <Store className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Crown className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {isShop ? "Shop je aktivan!" : "PRO je aktivan!"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isShop
              ? "Sada možeš upravljati zalihama, SKU-ovima i pratiti analitiku prodaje."
              : "Sada imaš pristup naprednoj analitici, domeni i skupnim alatima."}
          </p>
        </div>
      </div>

      {/* Badge prikaz */}
      <div className="mx-auto max-w-xs rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Tvoj profil sada izgleda ovako
        </p>
        <div className="flex items-center justify-center gap-2">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isShop
                ? "bg-indigo-100 dark:bg-indigo-900/40"
                : "bg-amber-100 dark:bg-amber-900/40"
            )}
          >
            {isShop ? (
              <Store className="h-5 w-5 text-indigo-600" />
            ) : (
              <Crown className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Tvoje ime
          </span>
          <TierBadgePreview tier={tier} />
        </div>
      </div>

      {/* Sljedeći koraci */}
      <div
        className={cn(
          "rounded-2xl border p-4 text-left",
          isShop
            ? "border-indigo-100 bg-indigo-50/60 dark:border-indigo-800/40 dark:bg-indigo-900/15"
            : "border-amber-100 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-900/15"
        )}
      >
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Preporučeni sljedeći koraci
        </p>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          {isShop ? (
            <>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                Uključi praćenje zaliha u Shop operacijama
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                Objavi ili uredi oglase s cijenama po komadu
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                Provjeri Shop analitiku pregleda
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                Podesi prilagođenu domenu u postavkama
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                Istraži naprednu ROI analitiku
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                Koristi skupne akcije za upravljanje oglasima
              </li>
            </>
          )}
        </ul>
      </div>

      <Button
        size="lg"
        className={cn(
          "h-12 w-full rounded-full",
          isShop ? "bg-indigo-600 hover:bg-indigo-700" : "bg-amber-500 hover:bg-amber-600"
        )}
        onClick={onContinue}
      >
        {isShop ? "Otvori Shop operacije" : "Upravljaj Pro članstvom"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GLAVNI WIZARD
───────────────────────────────────────────── */

export default function MembershipWizard({ tier = "shop", tiers = [], currentMembership = null }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const userData = useSelector(userSignUpData);
  const promoEnabled = isPromoFreeAccessEnabled();

  const isShop = tier === "shop";

  // Koraci ovisno o tieru
  const shopSteps = ["Uvod", "Profil", "Plaćanje", "Aktivno"];
  const proSteps = ["Uvod", "Ciljevi", "Plaćanje", "Aktivno"];
  const steps = isShop ? shopSteps : proSteps;

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");

  // Podaci forme
  const [shopForm, setShopForm] = useState({
    shopName: userData?.name || "",
    sellerType: "individual",
    description: "",
  });

  const [proForm, setProForm] = useState({
    goals: [],
  });

  const handleShopFormChange = useCallback((field, value) => {
    setShopForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleProFormChange = useCallback((field, value) => {
    setProForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const goNext = useCallback(() => setCurrentStep((s) => s + 1), []);
  const goBack = useCallback(() => setCurrentStep((s) => s - 1), []);

  // Pronađi pravi tier iz liste
  const matchedTier = useMemo(() => {
    if (!Array.isArray(tiers) || tiers.length === 0) return null;
    return (
      tiers.find((t) =>
        [t?.slug, t?.tier, t?.name]
          .map((v) => String(v ?? "").toLowerCase())
          .some((v) => v === tier || v.includes(tier))
      ) || tiers[0]
    );
  }, [tiers, tier]);

  const handleSubmit = useCallback(async () => {
    if (promoEnabled) {
      toast.success("Promotivni režim: sve funkcionalnosti su aktivne.");
      if (isShop) {
        router.push("/profile/shop-ops");
      } else {
        router.push("/membership/manage");
      }
      return;
    }

    if (!matchedTier?.id) {
      toast.error("Greška: plan nije pronađen. Pokušaj osvježiti stranicu.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await membershipApi.upgradeMembership({
        tier_id: matchedTier.id,
        payment_method: paymentMethod,
      });

      if (res?.data?.error === false || res?.data?.success) {
        const membershipRes = await membershipApi.getUserMembership().catch(() => null);
        if (membershipRes) {
          const payload = extractApiData(membershipRes);
          dispatch(setUserMembership(payload));
        }
        toast.success(`${isShop ? "LMX Shop" : "LMX Pro"} je uspješno aktiviran!`);
        setCurrentStep(steps.length); // Success korak
        return;
      }

      toast.error(res?.data?.message || "Aktivacija nije uspjela. Pokušaj ponovo.");
    } catch (error) {
      console.error("Greška pri aktivaciji:", error);
      toast.error("Greška pri aktivaciji. Pokušaj ponovo.");
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch, isShop, matchedTier, paymentMethod, promoEnabled, router, steps.length]);

  const handleContinueAfterSuccess = useCallback(() => {
    if (isShop) {
      router.push("/profile/shop-ops");
    } else {
      router.push("/membership/manage");
    }
  }, [isShop, router]);

  // Render step content
  const renderStep = () => {
    const totalSteps = steps.length;
    const isLastBeforeSuccess = currentStep === totalSteps - 1;
    const isSuccessStep = currentStep === totalSteps;

    if (isSuccessStep) {
      return <SuccessStep tier={tier} onContinue={handleContinueAfterSuccess} />;
    }

    if (isShop) {
      if (currentStep === 1) return <ShopStep1 onNext={goNext} />;
      if (currentStep === 2)
        return (
          <ShopStep2
            formData={shopForm}
            onChange={handleShopFormChange}
            onNext={goNext}
            onBack={goBack}
          />
        );
      if (isLastBeforeSuccess)
        return (
          <PaymentStep
            tier={tier}
            tiers={tiers}
            paymentMethod={paymentMethod}
            onPaymentChange={setPaymentMethod}
            onSubmit={handleSubmit}
            onBack={goBack}
            isProcessing={isProcessing}
          />
        );
    } else {
      if (currentStep === 1) return <ProStep1 onNext={goNext} />;
      if (currentStep === 2)
        return (
          <ProStep2
            formData={proForm}
            onChange={handleProFormChange}
            onNext={goNext}
            onBack={goBack}
          />
        );
      if (isLastBeforeSuccess)
        return (
          <PaymentStep
            tier={tier}
            tiers={tiers}
            paymentMethod={paymentMethod}
            onPaymentChange={setPaymentMethod}
            onSubmit={handleSubmit}
            onBack={goBack}
            isProcessing={isProcessing}
          />
        );
    }

    return null;
  };

  const isSuccessStep = currentStep === steps.length;

  return (
    <div className="mx-auto max-w-xl">
      {!isSuccessStep && (
        <StepIndicator steps={steps} currentStep={currentStep} />
      )}
      <div
        className={cn(
          "rounded-3xl border bg-white p-6 shadow-sm dark:bg-slate-950 sm:p-8",
          isShop
            ? "border-indigo-100 dark:border-indigo-900/30"
            : "border-amber-100 dark:border-amber-900/30"
        )}
      >
        {renderStep()}
      </div>
    </div>
  );
}
