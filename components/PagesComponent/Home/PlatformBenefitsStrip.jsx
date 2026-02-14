"use client";

import { motion } from "framer-motion";
import CustomLink from "@/components/Common/CustomLink";
import {
  MdRocketLaunch,
  ShieldCheck,
  Sparkles,
  Video,
} from "@/components/Common/UnifiedIconPack";

const benefitItems = [
  {
    id: "avatar",
    icon: Sparkles,
    title: "Kreiraj svoj LMX avatar",
    description: "Uredi profil i pokaži kupcima da posluju sa pouzdanim prodavačem.",
    href: "/profile",
    tone: "from-emerald-500/15 to-cyan-500/15 border-emerald-200/80 dark:border-emerald-800/70",
    iconTone: "text-emerald-500",
  },
  {
    id: "reels",
    icon: Video,
    title: "Objavi video oglas",
    description: "Reels format podiže pregled i ubrzava kontakt sa ozbiljnim kupcima.",
    href: "/ad-listing",
    tone: "from-violet-500/15 to-indigo-500/15 border-violet-200/80 dark:border-violet-800/70",
    iconTone: "text-violet-500",
  },
  {
    id: "boost",
    icon: ShieldCheck,
    title: "Aktiviraj PRO/SHOP boost",
    description: "Dobij prioritetniji prikaz, bolju vidljivost i više kvalitetnih upita.",
    href: "/membership/upgrade",
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/85">LMX benefiti</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
            Rasti brže uz alate koji prodaju za tebe
          </h2>
        </div>
        <CustomLink
          href="/membership/upgrade"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <MdRocketLaunch size={16} className="text-primary" />
          Aktiviraj boost
        </CustomLink>
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
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
    </motion.div>
  </section>
);

export default PlatformBenefitsStrip;
