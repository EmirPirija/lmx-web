"use client";

import { motion } from "framer-motion";
import {
  Crown,
  IoChatbubbleOutline,
  IoSearchOutline,
  IoStorefrontOutline,
  Shield,
  Sparkles,
  Store,
} from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";

const AUTH_FEATURES = [
  {
    icon: Store,
    title: "Objavi oglas bez komplikacija",
    description: "Vođeni koraci za objavu i uređivanje oglasa, prilagođeni i početnicima i profesionalcima.",
  },
  {
    icon: IoSearchOutline,
    title: "Pametna pretraga i filteri",
    description: "Brzo nađi relevantne oglase kroz napredne filtere, lokaciju i prilagodljive opcije.",
  },
  {
    icon: IoChatbubbleOutline,
    title: "Poruke, ponude i sigurna komunikacija",
    description: "Direktna razmjena poruka sa korisnicima i jasniji tok prodaje kroz ponude.",
  },
  {
    icon: Crown,
    title: "PRO i SHOP alati",
    description: "Napredna statistika, zalihe, interna šifra proizvoda i račun kupcu za SHOP profile.",
  },
];

const TAGS = ["Objavi oglas", "Mapa i lokacija", "Video priče", "PRO/SHOP alati"];

const ROLE_BLOCKS = [
  {
    icon: IoStorefrontOutline,
    title: "Za prodavače",
    text: "Objavi, uredi i promoviraj oglase kroz jasan korak-po-korak tok.",
  },
  {
    icon: IoSearchOutline,
    title: "Za kupce",
    text: "Filtriraj ponudu po lokaciji, cijeni i kategorijama koje te zanimaju.",
  },
];

const getPanelCopy = (mode) => {
  if (mode === "register") {
    return {
      kicker: "Napravi nalog",
      title: "Dobrodošao u LMX ekosistem",
      subtitle: "Sve što ti treba za modernu kupovinu i prodaju na jednom mjestu.",
    };
  }

  if (mode === "otp") {
    return {
      kicker: "Sigurna potvrda",
      title: "Zaštitili smo tvoj pristup",
      subtitle: "Potvrdi kod i nastavi gdje si stao bez gubitka podataka.",
    };
  }

  return {
    kicker: "Prijava na LMX",
    title: "Nastavi tamo gdje si stao",
    subtitle: "Upravljaj oglasima, porukama, ponudama i članstvom iz jednog korisničkog prostora.",
  };
};

export const AuthCompactHighlights = ({ className }) => {
  return (
    <div className={cn("lg:hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        Zašto LMX?
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {TAGS.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
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
    <div className="relative hidden h-full overflow-hidden bg-slate-900 text-white lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(13,182,175,0.4),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(247,148,29,0.28),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(170deg,#0f172a_0%,#111827_100%)] opacity-95" />

      <div className="relative z-10 flex h-full flex-col p-8 xl:p-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/90">
            {copy.kicker}
          </p>
          <h3 className="mt-2 text-3xl font-bold leading-tight text-white">{copy.title}</h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-200/85">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {AUTH_FEATURES.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-200/80">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {ROLE_BLOCKS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.25 }}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-3"
              >
                <div className="flex items-center gap-2 text-cyan-200">
                  <Icon className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/90">
                    {item.title}
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-200/80">{item.text}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-auto">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-200/90">
            <Shield className="h-4 w-4 text-emerald-300" />
            Sigurnost, brzina i transparentan workflow
          </div>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-200">
            <Sparkles className="h-4 w-4" />
            Premium iskustvo za korisnike svih nivoa
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthValuePanel;
