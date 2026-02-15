"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { SOCIAL_POSTING_TEMP_UNAVAILABLE } from "@/utils/socialAvailability";
import { PROMO_BENEFITS, PROMO_HEADLINE, PROMO_SUBHEAD, isPromoFreeAccessEnabled } from "@/lib/promoMode";
import {
  CheckCircle2,
  Globe,
  Layers,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Store,
} from "@/components/Common/UnifiedIconPack";

const PLAN_FEATURES = {
  shop: [
    "Storefront za tvoje proizvode i oglase",
    "Cijena po komadu + zalihe + auto status",
    "Osnovna analitika prodaje i pregleda",
    SOCIAL_POSTING_TEMP_UNAVAILABLE
      ? "Instagram/Facebook/TikTok objave: privremeno nedostupno"
      : "Instagram povezivanje i ručni sync",
  ],
  pro: [
    "Custom domena i napredni brending shopa",
    "Boost ROI dashboard i detaljne metrike",
    "Bulk alati: izdvajanje, obnova, pauza, relist",
    "SLA badge i istaknuta reputacija prodavača",
  ],
};

const FAQ_ITEMS = [
  {
    q: "Kako radi custom domena?",
    a: "Uneseš domen u postavkama, dodaš CNAME zapis i pokreneš verifikaciju. Nakon verifikacije SSL se aktivira automatski.",
  },
  {
    q: "Mogu li objaviti i na Instagramu?",
    a: SOCIAL_POSTING_TEMP_UNAVAILABLE
      ? "Instagram/Facebook/TikTok objave su privremeno nedostupne. Hvala na razumijevanju."
      : "Da. Povežeš Instagram u Integracijama, a zatim uključiš opciju objave direktno iz oglasa.",
  },
  {
    q: "Šta se dešava kad zaliha padne na 0?",
    a: "Sistem automatski prebacuje artikl na “Nema na stanju” i onemogućava narudžbu, dok ne dopuniš zalihu.",
  },
  {
    q: "Kako biram između Shop i Pro?",
    a: "Shop je za stabilan početak prodaje. Pro je za rast, ROI optimizaciju, domen i naprednu automatizaciju.",
  },
];

export default function PlansShowcase({ mode = "pricing" }) {
  const promoEnabled = isPromoFreeAccessEnabled();
  const isShop = mode === "shop";
  const isPro = mode === "pro";
  const activePlan = isShop ? "shop" : isPro ? "pro" : null;

  return (
    <div className="container py-8 lg:py-12">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {promoEnabled ? "Promotivni režim" : "LMX Shop & Ads"}
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 lg:text-4xl">
              {isShop
                ? "Pokreni svoj LMX Shop danas"
                : isPro
                  ? "Pređi na LMX Pro i skaliraj prodaju"
                  : "Odaberi plan koji prati rast tvog shopa"}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 lg:text-base">
              Stabilna prodaja, jači branding i bolja konverzija kroz jedan workflow: objava, analitika, zalihe i promocija.
            </p>
            {promoEnabled ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-200">
                <p className="font-semibold">{PROMO_HEADLINE}</p>
                <p className="mt-1">{PROMO_SUBHEAD}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PROMO_BENEFITS.map((benefit) => (
                    <span
                      key={benefit}
                      className="rounded-full border border-emerald-300/80 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/35 dark:bg-slate-900 dark:text-emerald-200"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {SOCIAL_POSTING_TEMP_UNAVAILABLE ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                Instagram/Facebook/TikTok objave su privremeno nedostupne. Hvala na razumijevanju.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Link
                href="/ad-listing"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" />
                Istraži funkcionalnosti
              </Link>
              <Link
                href="/profile/integrations"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <MessageCircle className="h-4 w-4" />
                Integracije
              </Link>
            </div>
          </div>

          <div className="grid w-full gap-3 lg:max-w-md">
            {(activePlan ? [activePlan] : ["shop", "pro"]).map((plan) => (
              <div
                key={plan}
                className={cn(
                  "rounded-2xl border p-4",
                  plan === "pro"
                    ? "border-sky-200 bg-sky-50/70 dark:border-sky-700/60 dark:bg-sky-900/20"
                    : "border-emerald-200 bg-emerald-50/70 dark:border-emerald-700/60 dark:bg-emerald-900/20"
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  {plan === "shop" ? <Store className="h-4 w-4 text-emerald-600" /> : <ShieldCheck className="h-4 w-4 text-sky-600" />}
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {plan === "shop" ? "Shop plan" : "Pro plan"}
                  </p>
                </div>
                {promoEnabled ? (
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
                    Besplatno do daljnjeg
                  </p>
                ) : null}
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {PLAN_FEATURES[plan].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!activePlan ? (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 lg:p-8">
          <div className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
            <Layers className="h-5 w-5 text-primary" />
            Usporedba planova
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/70">
                <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Funkcionalnost</th>
                  <th className="px-4 py-3">Shop</th>
                  <th className="px-4 py-3">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {[
                  ["Storefront + proizvodi", true, true],
                  ["Cijena po komadu + zalihe", true, true],
                  ["Bulk akcije", false, true],
                  ["Custom domena", false, true],
                  ["Boost ROI analitika", false, true],
                  ["SLA badge prodavača", false, true],
                ].map(([label, shop, pro]) => (
                  <tr key={label}>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{label}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{shop ? "Da" : "Ne"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{pro ? "Da" : "Ne"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 lg:p-8">
        <div className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <Globe className="h-5 w-5 text-primary" />
          FAQ
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ_ITEMS.map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{faq.q}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
