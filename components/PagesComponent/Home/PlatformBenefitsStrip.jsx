"use client";

import { motion } from "framer-motion";
import CustomLink from "@/components/Common/CustomLink";
import {
  MdRocketLaunch,
  ShieldCheck,
  Video,
  MessageCircle,
  Search,
  Layers,
} from "@/components/Common/UnifiedIconPack";
import { PROMO_BENEFITS, PROMO_HEADLINE, PROMO_SUBHEAD } from "@/lib/promoMode";

const benefitItems = [
  {
    id: "listing-flow",
    icon: Layers,
    title: "Brzo objavi i upravljaj oglasima",
    description: "Jednostavan workflow za kreiranje, uređivanje i praćenje performansi oglasa.",
    href: "/ad-listing",
    tone: "from-cyan-500/15 to-blue-500/15 border-cyan-200/80 dark:border-cyan-800/70",
    iconTone: "text-cyan-500",
  },
  {
    id: "reels",
    icon: Video,
    title: "Video i vizuelna promocija",
    description: "Istakni ponudu kroz video format i ubrzaj kontakt sa ozbiljnim kupcima.",
    href: "/ad-listing",
    tone: "from-violet-500/15 to-indigo-500/15 border-violet-200/80 dark:border-violet-800/70",
    iconTone: "text-violet-500",
  },
  {
    id: "discover",
    icon: Search,
    title: "Pametna pretraga i bolja vidljivost",
    description: "Napredni filteri i bolji prikaz oglasa olakšavaju pronalazak pravih kupaca.",
    href: "/ads",
    tone: "from-emerald-500/15 to-teal-500/15 border-emerald-200/80 dark:border-emerald-800/70",
    iconTone: "text-emerald-500",
  },
  {
    id: "communication",
    icon: MessageCircle,
    title: "Sigurna komunikacija kupac-prodavac",
    description: "Poruke i obavijesti drže obje strane usklađene tokom cijelog procesa kupoprodaje.",
    href: "/chat",
    tone: "from-amber-500/15 to-orange-500/15 border-amber-200/80 dark:border-amber-800/70",
    iconTone: "text-amber-500",
  },
];

const PlatformBenefitsStrip = () => (
  <section className="container py-4 sm:py-6">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-slate-200/85 bg-gradient-to-br from-white via-slate-50/85 to-cyan-50/60 p-4 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.45)] dark:border-slate-700/85 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-cyan-950/25 sm:p-5 lg:p-6"
    >
      <div className="pointer-events-none absolute -top-14 right-1/3 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/20" />
      <div className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/20" />

      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/85">Šta aplikacija nudi</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
            Moderan, intuitivan i stabilan prostor za sigurnu kupoprodaju
          </h2>
        </div>
        <CustomLink
          href="/ad-listing"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <MdRocketLaunch size={16} className="text-primary" />
          Započni odmah
        </CustomLink>
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {benefitItems.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.34, delay: idx * 0.05 }}
            whileHover={{ y: -3 }}
            className={`rounded-2xl border bg-gradient-to-br p-3.5 shadow-sm transition-all duration-200 dark:bg-slate-900/75 ${item.tone}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className={`grid h-9 w-9 place-items-center rounded-lg bg-white/90 shadow-sm dark:bg-slate-900 ${item.iconTone}`}>
                <item.icon size={17} />
              </div>
              <CustomLink
                href={item.href}
                className="text-[11px] font-semibold text-slate-500 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-primary"
              >
                Saznaj više
              </CustomLink>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{item.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="relative mt-4 rounded-2xl border border-emerald-200/85 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-4 dark:border-emerald-700/60 dark:from-emerald-900/25 dark:via-slate-900/90 dark:to-cyan-900/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">
              Promotivna ponuda
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{PROMO_HEADLINE}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{PROMO_SUBHEAD}</p>
          </div>
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PROMO_BENEFITS.map((benefit) => (
            <span
              key={benefit}
              className="rounded-full border border-emerald-300/80 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/35 dark:bg-slate-900 dark:text-emerald-200"
            >
              {benefit}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  </section>
);

export default PlatformBenefitsStrip;
