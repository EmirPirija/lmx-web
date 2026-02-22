"use client";

import { motion } from "framer-motion";
import {
  IoChatbubbleOutline,
  IoSearchOutline,
  Sparkles,
  Store,
} from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";

const AUTH_FEATURES = [
  {
    icon: Store,
    title: "Objava oglasa bez komplikacija",
    description:
      "Brz tok objave sa jasnim koracima za nove i napredne korisnike.",
    tone: "text-cyan-200",
  },
  {
    icon: IoSearchOutline,
    title: "Pametna pretraga i filteri",
    description:
      "Fokusiraj se na prave oglase kroz lokaciju, kategorije i precizne filtere.",
    tone: "text-emerald-200",
  },
  {
    icon: IoChatbubbleOutline,
    title: "Poruke i ponude bez haosa",
    description:
      "Centralizovan chat i ponude za jasniji dogovor sa kupcima i prodavačima.",
    tone: "text-amber-200",
  },
];

const TAGS = ["Objavi oglas", "Video priče", "PRO/SHOP alati"];

const getPanelCopy = (mode) => {
  if (mode === "register") {
    return {
      kicker: "Napravi nalog",
      title: "Sve za kupovinu i prodaju na jednom mjestu",
      subtitle:
        "Kreiraj profil i otključaj punu kontrolu nad oglasima, porukama i prodajnim alatima.",
    };
  }

  if (mode === "otp") {
    return {
      kicker: "Sigurna potvrda",
      title: "Zaštitili smo tvoj pristup",
      subtitle:
        "Potvrdi kod i nastavi rad bez prekida, uz dodatni sloj sigurnosti.",
    };
  }

  return {
    kicker: "Prijava na LMX",
    title: "Nastavi gdje si stao",
    subtitle:
      "Upravljaj oglasima, porukama i ponudama iz jednog stabilnog korisničkog prostora.",
  };
};

export const AuthCompactHighlights = ({ className }) => {
  return (
    <div
      className={cn(
        "lg:hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-3.5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Zašto LMX?
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TAGS.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

const AuthValuePanel = ({ mode = "login" }) => {
  const copy = getPanelCopy(mode);

  return (
    <div className="relative hidden h-full overflow-hidden border-r border-slate-800/40 bg-slate-950 text-white lg:block">
      <div className="absolute inset-0 bg-[linear-gradient(150deg,#020617_0%,#0b1120_52%,#111827_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(13,182,175,0.24),transparent_38%)]" />

      <div className="relative z-10 flex h-full flex-col px-8 py-8 xl:px-10 xl:py-10">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/90">
            {copy.kicker}
          </p>
          <h3 className="mt-2 text-[1.9rem] font-bold leading-tight text-white">
            {copy.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-200/80">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-8 space-y-2">
          {AUTH_FEATURES.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index, duration: 0.22 }}
                className="flex items-start gap-3 rounded-xl bg-white/[0.035] px-3 py-2.5"
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10",
                    item.tone,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-200/80">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthValuePanel;
