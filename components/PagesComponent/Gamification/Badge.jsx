"use client";

import React, { useMemo } from "react";
import {
  Award,
  BadgeCheck,
  CalendarCheck,
  Crown,
  Flame,
  Gem,
  Handshake,
  ListChecks,
  Medal,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Badge.jsx (BS ijekavica)
 * - Lucide ikonice
 * - Minimal / premium, bez "hajpa"
 * - Podržava dinamičke bedževe: godine, prodaje, poruke, ocjene, oglasi, streak...
 */

/* -----------------------------
  Utils
----------------------------- */

const normalize = (v) => String(v || "").trim().toLowerCase();

function pickBadgeKey(badge) {
  const candidates = [
    badge?.slug,
    badge?.key,
    badge?.code,
    badge?.type,
    badge?.category,
    badge?.group,
    badge?.name,
    badge?.title,
    badge?.label,
  ]
    .map(normalize)
    .filter(Boolean);

  const joined = candidates.join(" ");

  // explicit slugs
  if (candidates.includes("verified") || candidates.includes("verified_user")) return "verified";
  if (candidates.includes("pro")) return "pro";
  if (candidates.includes("shop")) return "shop";
  if (joined.includes("early") || joined.includes("adopter") || joined.includes("rani")) return "early_adopter";
  if (joined.includes("top")) return "top_seller";
  if (joined.includes("trusted") || joined.includes("pouzdan")) return "trusted";
  if (joined.includes("fast") || joined.includes("brz")) return "fast_reply";

  // dynamic patterns (e.g. tenure_y3, sales_100, reviews_50, listings_25, messages_1000, streak_30)
  const raw = candidates[0] || "";
  if (raw.match(/(tenure|member|years?|godin)/)) return "tenure";
  if (raw.match(/(sale|sales|sold|prodaj)/)) return "sales";
  if (raw.match(/(review|reviews|rating|ocjen)/)) return "reviews";
  if (raw.match(/(listing|listings|oglas|oglasi)/)) return "listings";
  if (raw.match(/(message|messages|poruk)/)) return "messages";
  if (raw.match(/(streak|niz)/)) return "streak";

  return "generic";
}

function extractNumber(badge) {
  const numberFields = [
    badge?.value,
    badge?.count,
    badge?.current,
    badge?.level,
    badge?.milestone,
    badge?.goal,
    badge?.progress?.value,
    badge?.progress?.current,
    badge?.progress?.target,
  ];
  for (const field of numberFields) {
    const num = Number(field);
    if (Number.isFinite(num) && num > 0) return num;
  }

  const s =
    badge?.slug ||
    badge?.key ||
    badge?.code ||
    badge?.type ||
    badge?.name ||
    badge?.title ||
    "";

  const m = String(s).match(/(\d{1,6})/);
  return m ? Number(m[1]) : null;
}

function formatCompactNumber(n) {
  if (n == null) return "";
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  if (num >= 1000000) return `${Math.round(num / 100000) / 10}M`;
  if (num >= 1000) return `${Math.round(num / 100) / 10}k`;
  return String(num);
}

function formatYears(n) {
  // nominativ: "1 godina", "2 godine", "5 godina"
  if (!n || n <= 0) return "1 godina";
  if (n === 1) return "1 godina";
  if (n >= 2 && n <= 4) return `${n} godine`;
  return `${n} godina`;
}

function formatYearsDuration(n) {
  // trajanje u rečenici: "već 1 godinu", "već 2 godine", "već 5 godina"
  if (!n || n <= 0) return "1 godinu";
  if (n === 1) return "1 godinu";
  if (n >= 2 && n <= 4) return `${n} godine`;
  return `${n} godina`;
}

function formatYearsAfter(n) {
  // "nakon 1 godine", "nakon 2 godine", "nakon 5 godina"
  if (!n || n <= 0) return "1 godine";
  if (n === 1) return "1 godine";
  if (n >= 2 && n <= 4) return `${n} godine`;
  return `${n} godina`;
}

function formatNoun(value, one, few, many) {
  if (value === 1) return one;
  if (value >= 2 && value <= 4) return few;
  return many;
}

function formatCount(n, suffix) {
  if (n == null) return "";
  const value = Number(n);
  if (!Number.isFinite(value)) return "";
  if (!suffix) return formatCompactNumber(value);
  return `${formatCompactNumber(value)} ${suffix}`;
}

function getTierClasses(tier = 1, locked = false) {
  // Monochrome tiers: border weight + subtle shadow (no colors)
  const base = locked ? "opacity-55 grayscale" : "opacity-100";
  if (tier >= 5) return cn(base, "border-slate-900/20 shadow-sm");
  if (tier === 4) return cn(base, "border-slate-900/15 shadow-sm");
  if (tier === 3)
    return cn(
      base,
      "border-slate-300 dark:border-slate-700 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
    );
  if (tier === 2) return cn(base, "border-slate-200 dark:border-slate-700 shadow-sm");
  return cn(base, "border-slate-200/70 dark:border-slate-800 shadow-sm");
}

const LockMini = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M7.5 11V9.2A4.5 4.5 0 0 1 12 4.7a4.5 4.5 0 0 1 4.5 4.5V11"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M7.5 11h9V20h-9v-9z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const IconWrap = ({ children, className }) => (
  <span
    className={cn(
      "inline-flex items-center justify-center rounded-2xl border border-slate-200/70 dark:border-slate-700/70",
      "bg-white dark:bg-slate-900/60",
      className
    )}
  >
    {children}
  </span>
);

const MILESTONE_CONFIG = {
  tenure: {
    milestones: [1, 2, 3, 5, 7, 10],
    icons: [CalendarCheck, Star, Medal, Trophy, Crown, Gem],
    label: "godina",
  },
  sales: {
    milestones: [2, 5, 10, 25, 50, 100, 250, 500, 1000],
    icons: [Handshake, Star, Medal, Trophy, Crown, Gem, Rocket, ShieldCheck, Award],
    label: "prodaja",
  },
  reviews: {
    milestones: [2, 5, 10, 25, 50, 100, 250, 500],
    icons: [BadgeCheck, Star, Medal, Trophy, Crown, Gem, ShieldCheck, Award],
    label: "ocjena",
  },
  listings: {
    milestones: [5, 10, 25, 50, 100, 250, 500, 1000],
    icons: [ListChecks, Star, Medal, Trophy, Crown, Gem, Rocket, ShieldCheck],
    label: "oglas",
  },
  messages: {
    milestones: [25, 50, 100, 250, 500, 1000, 2500, 5000],
    icons: [MessageCircle, Zap, Flame, Rocket, Crown, Gem, ShieldCheck, Award],
    label: "poruka",
  },
  streak: {
    milestones: [7, 14, 30, 60, 90, 180, 365],
    icons: [Flame, Zap, Trophy, Rocket, Crown, Gem, Award],
    label: "dan",
  },
};

function getMilestoneMeta(kind, value) {
  const config = MILESTONE_CONFIG[kind];
  const numeric = Number(value || 0);

  if (!config) {
    return { milestone: numeric || 1, Icon: Sparkles, tier: 1, label: "" };
  }

  const milestones = config.milestones;
  let milestone = milestones[0];
  for (const m of milestones) {
    if (numeric >= m) milestone = m;
  }

  const index = Math.max(0, milestones.indexOf(milestone));
  const Icon = config.icons[Math.min(index, config.icons.length - 1)] || Sparkles;

  // 1..5 tier raspodjela po progresu kroz milestone listu
  const tier = Math.min(5, Math.max(1, Math.ceil(((index + 1) / milestones.length) * 5)));

  return { milestone, Icon, tier, label: config.label };
}

/* -----------------------------
  Catalog (BS ijekavica) — copy bez "cringe"
----------------------------- */

function resolveBadgeCopy(badge, locked = false) {
  const key = pickBadgeKey(badge);
  const n = extractNumber(badge);

  // Dynamic: tenure (years)
  if (key === "tenure") {
    const years = n || 1;
    const meta = getMilestoneMeta("tenure", years);
    return {
      key: `tenure_${years}`,
      title: `Članstvo: ${formatYears(years)}`,
      description:
        years === 1
          ? "Na platformi si najmanje godinu dana."
          : `Na platformi si već ${formatYearsDuration(years)}.`,
      Icon: meta.Icon,
      tier: meta.tier,
    };
  }

  // Dynamic: counts
  if (key === "sales") {
    const count = n ?? 1;
    const meta = getMilestoneMeta("sales", count);
    return {
      key: `sales_${count}`,
      title: `Zaključene prodaje: ${formatCompactNumber(count)}`,
      description: `${formatCount(count, formatNoun(count, "prodaja", "prodaje", "prodaja"))} uspješno završeno.`,
      Icon: meta.Icon,
      tier: meta.tier,
    };
  }

  if (key === "reviews") {
    const count = n ?? 1;
    const meta = getMilestoneMeta("reviews", count);
    return {
      key: `reviews_${count}`,
      title: `Ocjene kupaca: ${formatCompactNumber(count)}`,
      description: `Povratne informacije: ${formatCount(count, formatNoun(count, "ocjena", "ocjene", "ocjena"))}.`,
      Icon: meta.Icon,
      tier: meta.tier,
    };
  }

  if (key === "listings") {
    const count = n ?? 1;
    const meta = getMilestoneMeta("listings", count);
    return {
      key: `listings_${count}`,
      title: `Objavljeni oglasi: ${formatCompactNumber(count)}`,
      description: "Aktivan profil sa urednom ponudom.",
      Icon: meta.Icon,
      tier: meta.tier,
    };
  }

  if (key === "messages") {
    const count = n ?? 1;
    const meta = getMilestoneMeta("messages", count);
    return {
      key: `messages_${count}`,
      title: `Razmijenjene poruke: ${formatCompactNumber(count)}`,
      description: "Kontinuirana i korektna komunikacija.",
      Icon: meta.Icon,
      tier: meta.tier,
    };
  }

  if (key === "streak") {
    const days = n ?? 7;
    const meta = getMilestoneMeta("streak", days);
    return {
      key: `streak_${days}`,
      title: `Aktivnost u nizu: ${days} dana`,
      description: "Kontinuirana aktivnost bez prekida.",
      Icon: meta.Icon,
      tier: meta.tier,
    };
  }

  // Static
  const staticCatalog = {
    verified: {
      title: "Verifikovan profil",
      description: "Identitet potvrđen.",
      Icon: BadgeCheck,
      tier: 3,
    },
    pro: {
      title: "Pro profil",
      description: "Dodatne opcije i bolje isticanje profila.",
      Icon: Crown,
      tier: 4,
    },
    shop: {
      title: "Radnja",
      description: "Registrovana radnja ili brend.",
      Icon: Store,
      tier: 4,
    },
    early_adopter: {
      title: "Rani korisnik",
      description: "Među prvim korisnicima platforme.",
      Icon: Sparkles,
      tier: 2,
    },
    top_seller: {
      title: "Istaknuti prodavač",
      description: "Visok učinak i stabilna reputacija.",
      Icon: Trophy,
      tier: 5,
    },
    trusted: {
      title: "Pouzdan prodavač",
      description: "Dosljedan pristup i korektna saradnja.",
      Icon: ShieldCheck,
      tier: 4,
    },
    fast_reply: {
      title: "Brz odgovor",
      description: "U prosjeku odgovara brzo na upite.",
      Icon: Zap,
      tier: 3,
    },
  };

  const picked = staticCatalog[key] || {
    title: "Bedž",
    description: locked ? "Otključaj ispunjavanjem uslova." : "Nastavi graditi profil.",
    Icon: Award,
    tier: 1,
  };

  return { key, ...picked };
}

/* -----------------------------
  Detaljna značenja (BS ijekavica)
  - Koristi se za: tooltip / modal / profil stranicu
  - Ne zavisi od backenda za tekstove
----------------------------- */

const CATEGORY_LABEL = {
  identity: "Identitet",
  reputation: "Reputacija",
  activity: "Aktivnost",
  loyalty: "Vjernost",
  business: "Poslovanje",
  general: "Općenito",
};

const TIER_LABEL = {
  1: "Osnovno",
  2: "Bronza",
  3: "Srebro",
  4: "Zlato",
  5: "Platinasto",
  // Ako hoćeš potpuno neutralno:
  // 1: "Nivo 1", 2: "Nivo 2", 3: "Nivo 3", 4: "Nivo 4", 5: "Nivo 5",
};

const MILESTONES = {
  tenure: [1, 2, 3, 5, 7, 10],
  sales: [2, 5, 10, 25, 50, 100, 250, 500, 1000],
  reviews: [2, 5, 10, 25, 50, 100, 250, 500],
  listings: [5, 10, 25, 50, 100, 250, 500, 1000],
  messages: [25, 50, 100, 250, 500, 1000, 2500, 5000],
  streak: [7, 14, 30, 60, 90, 180, 365],
};

function nextMilestone(kind, current) {
  const arr = MILESTONES[kind] || [];
  const c = Number(current || 0);
  for (const m of arr) if (m > c) return m;
  return null;
}

function criteriaText(kind, value) {
  const v = Number(value || 0);

  if (kind === "tenure") return `Automatski — dodjeljuje se nakon ${formatYearsAfter(v)} od registracije.`;
  if (kind === "sales") return `Dodjeljuje se nakon najmanje ${v} ${v === 1 ? "zaključene prodaje" : "zaključenih prodaja"}.`;
  if (kind === "reviews") return `Dodjeljuje se nakon najmanje ${v} ${v === 1 ? "ocjene" : "ocjena"} od kupaca.`;
  if (kind === "listings") return `Dodjeljuje se nakon najmanje ${v} ${v === 1 ? "objavljenog oglasa" : "objavljenih oglasa"}.`;
  if (kind === "messages") return `Dodjeljuje se nakon najmanje ${v} ${v === 1 ? "razmijenjene poruke" : "razmijenjenih poruka"}.`;
  if (kind === "streak") return `Dodjeljuje se nakon ${v} dana uzastopne aktivnosti.`;
  return "Otključaj ispunjavanjem uslova.";
}

function meaningText(kind) {
  if (kind === "tenure") return "Pokazuje koliko dugo je profil aktivan na platformi.";
  if (kind === "sales") return "Pokazuje iskustvo u uspješno završenim prodajama.";
  if (kind === "reviews") return "Sažetak povjerenja kroz ocjene kupaca.";
  if (kind === "listings") return "Pokazuje aktivnost i urednost ponude oglasa.";
  if (kind === "messages") return "Pokazuje kontinuitet komunikacije i dostupnost.";
  if (kind === "streak") return "Pokazuje kontinuitet aktivnosti u zadanim periodima.";
  return "Bedževi su kratki pokazatelji aktivnosti i povjerenja na profilu.";
}

function staticMeaning(key) {
  if (key === "verified") {
    return {
      category: "identity",
      meaning: "Profil je verifikovan, što olakšava povjerenje prilikom dogovora.",
      how: ["Završi proces verifikacije (identitet/dokumenti).", "Nakon potvrde, bedž je vezan za profil."],
    };
  }
  if (key === "pro") {
    return {
      category: "business",
      meaning: "Pro profil donosi dodatne opcije i jasnije isticanje profila.",
      how: ["Aktiviraj Pro paket u postavkama (pretplata ili kampanja)."],
    };
  }
  if (key === "shop") {
    return {
      category: "business",
      meaning: "Označava registrovanu radnju ili brend sa poslovnim informacijama.",
      how: ["Registruj radnju (Shop) i popuni poslovne podatke.", "Potvrdi kontakt i/ili dokumente ako je potrebno."],
    };
  }
  if (key === "early_adopter") {
    return {
      category: "loyalty",
      meaning: "Dodjeljuje se profilima koji su među prvim korisnicima platforme.",
      how: ["Automatski, prema datumu registracije (historijski bedž)."],
    };
  }
  if (key === "top_seller") {
    return {
      category: "reputation",
      meaning: "Označava stabilan učinak i dobru reputaciju kroz vrijeme.",
      how: ["Više uspješnih prodaja uz dobru reputaciju.", "Dosljedna komunikacija i mali broj problema/pritužbi."],
    };
  }
  if (key === "trusted") {
    return {
      category: "reputation",
      meaning: "Signal korektne saradnje i pouzdanosti u komunikaciji i isporuci.",
      how: ["Održavaj kvalitet usluge i dobru reputaciju kroz vrijeme."],
    };
  }
  if (key === "fast_reply") {
    return {
      category: "activity",
      meaning: "Prosječno vrijeme odgovora je kratko u odnosu na ostale profile.",
      how: ["Odgovaraj redovno na poruke i drži dobar prosjek vremena odgovora."],
    };
  }
  return {
    category: "general",
    meaning: meaningText("generic"),
    how: ["Nastavi koristiti platformu i otključavat ćeš nova postignuća."],
  };
}

/**
 * Public helper: vraća kompletne detalje za bedž (naslov, opis, značenje, kriterij).
 * Namjena: badges page, tooltipovi, modal.
 */
export function getBadgeDetails(badge, locked = false) {
  const meta = resolveBadgeCopy(badge, locked);
  const baseKey = pickBadgeKey(badge);
  const n = extractNumber(badge);

  // dynamic details
  if (baseKey === "tenure") {
    const years = Math.max(1, Math.min(50, n ?? 1));
    const next = nextMilestone("tenure", years);
    return {
      ...meta,
      category: "loyalty",
      categoryLabel: CATEGORY_LABEL.loyalty,
      tierLabel: TIER_LABEL[meta.tier] || TIER_LABEL[1],
      meaning: meaningText("tenure"),
      howToEarn: [
        criteriaText("tenure", years),
        next ? `Sljedeći cilj: ${next}. godina članstva.` : "Dosegnuo/la si najvišu dostupnu godišnjicu.",
      ],
    };
  }

  if (["sales", "reviews", "listings", "messages", "streak"].includes(baseKey)) {
    const kind = baseKey;
    const val = n ?? 1;
    const next = nextMilestone(kind, val);
    const cat =
      kind === "sales"
        ? "business"
        : kind === "reviews"
        ? "reputation"
        : kind === "listings"
        ? "activity"
        : kind === "messages"
        ? "activity"
        : "activity";

    return {
      ...meta,
      category: cat,
      categoryLabel: CATEGORY_LABEL[cat] || CATEGORY_LABEL.general,
      tierLabel: TIER_LABEL[meta.tier] || TIER_LABEL[1],
      meaning: meaningText(kind),
      howToEarn: [criteriaText(kind, val), next ? `Sljedeći cilj: ${next}.` : "Dosegnuo/la si najviši poznati nivo ovog bedža."],
    };
  }

  // static
  const staticInfo = staticMeaning(baseKey);
  return {
    ...meta,
    category: staticInfo.category,
    categoryLabel: CATEGORY_LABEL[staticInfo.category] || CATEGORY_LABEL.general,
    tierLabel: TIER_LABEL[meta.tier] || TIER_LABEL[1],
    meaning: staticInfo.meaning,
    howToEarn: staticInfo.how,
  };
}

/* -----------------------------
  Component
----------------------------- */

const SIZE = {
  sm: { icon: "w-12 h-12", iconSvg: "w-6 h-6", title: "text-sm", desc: "text-xs", pad: "p-3" },
  md: { icon: "w-14 h-14", iconSvg: "w-7 h-7", title: "text-sm", desc: "text-xs", pad: "p-4" },
  lg: { icon: "w-16 h-16", iconSvg: "w-8 h-8", title: "text-base", desc: "text-xs", pad: "p-4" },
};

export default function Badge({
  badge,
  size = "md",
  showName = true,
  showDescription = false,
  locked = false,
  className,
  onClick,
  interactive = false,
}) {
  const s = SIZE[size] || SIZE.md;

  const meta = useMemo(() => resolveBadgeCopy(badge, locked), [badge, locked]);
  const Icon = meta.Icon || Award;

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.(e);
              }
            }
          : undefined
      }
      className={cn(
        "group relative rounded-3xl border bg-white dark:bg-slate-900/60",
        interactive
          ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-500/50 dark:focus-visible:ring-offset-slate-950"
          : "",
        "transition-all hover:-translate-y-[1px] hover:shadow-md",
        interactive ? "hover:bg-slate-50/60 dark:hover:bg-slate-900/70" : "",
        "border-slate-200/70 dark:border-slate-800",
        getTierClasses(meta.tier, locked),
        s.pad,
        className
      )}
      title={showName ? meta.title : undefined}
    >
      {/* Icon bubble */}
      <div className="flex items-center justify-center">
        <IconWrap className={cn(s.icon, "text-slate-800 dark:text-slate-100")}>
          <Icon className={cn(s.iconSvg)} />
        </IconWrap>

        {locked ? (
          <span className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200">
            <LockMini className="w-4 h-4" />
          </span>
        ) : null}
      </div>

      {showName ? (
        <div className={cn("mt-3 text-center font-semibold text-slate-900 dark:text-white", s.title)}>
          {meta.title}
        </div>
      ) : null}

      {showDescription ? (
        <div className={cn("mt-1 text-center text-slate-500 dark:text-slate-300", s.desc)}>
          {meta.description}
        </div>
      ) : null}
    </div>
  );
}
