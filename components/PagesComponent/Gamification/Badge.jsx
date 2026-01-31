"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Badge.jsx (BS ijekavica)
 * - Custom "domaće" ikonice (inline SVG)
 * - Minimal / premium, bez šarenila
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

function clampTier(n) {
  if (n == null) return 1;
  if (n >= 10000) return 5;
  if (n >= 1000) return 4;
  if (n >= 100) return 3;
  if (n >= 10) return 2;
  return 1;
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
  if (!n || n <= 0) return "1 godina";
  if (n === 1) return "1 godina";
  if (n >= 2 && n <= 4) return `${n} godine`;
  return `${n} godina`;
}

function getTierClasses(tier = 1, locked = false) {
  // Monochrome tiers: border weight + subtle shadow (no colors)
  const base = locked
    ? "opacity-55 grayscale"
    : "opacity-100";
  if (tier >= 5) return cn(base, "border-slate-900/20 shadow-sm");
  if (tier === 4) return cn(base, "border-slate-900/15 shadow-sm");
  if (tier === 3) return cn(base, "border-slate-300 dark:border-slate-700 shadow-[0_10px_30px_rgba(0,0,0,0.06)]");
  if (tier === 2) return cn(base, "border-slate-200 dark:border-slate-700 shadow-sm");
  return cn(base, "border-slate-200/70 dark:border-slate-800 shadow-sm");
}

/* -----------------------------
  Custom “domaće” ikonice (SVG)
  Sve su linijske / neutralne da ne bude šareno.
----------------------------- */

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

const Ljiljan = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M12 3c1.6 2 2.4 3.8 2.4 5.6 0 1.2-.4 2.2-1.1 3 2.2-.3 3.8-1.6 4.7-4.1 1.2 2.1.9 4.4-.8 6.2-.8.9-1.9 1.5-3.3 1.8.8.7 1.2 1.6 1.2 2.8V21H9v-2.2c0-1.2.4-2.1 1.2-2.8-1.4-.3-2.5-.9-3.3-1.8-1.7-1.8-2-4.1-.8-6.2.9 2.5 2.5 3.8 4.7 4.1-.7-.8-1.1-1.8-1.1-3C9.6 6.8 10.4 5 12 3z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const Most = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M4 18h16M6 18c0-4.4 2.7-8 6-8s6 3.6 6 8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M7 18V9.5c0-1 .8-1.8 1.8-1.8H9M17 18V9.5c0-1-.8-1.8-1.8-1.8H15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const Stecak = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M7.5 9.5l4.5-3 4.5 3v9.5H7.5V9.5z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M9 12.3h6M10.2 15.1h3.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const Dzezva = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M7 10h8l-1 9H8l-1-9z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M15 11.2h2.2c1 0 1.8.8 1.8 1.8v1c0 1-.8 1.8-1.8 1.8H15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M9 6h7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const Medalja = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M8 3h3l1 4-2 2-2-2 0-4zM13 3h3v4l-2 2-2-2 1-4z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M12 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M12 13.2l.8 1.7 1.9.2-1.4 1.2.4 1.9-1.7-1-1.7 1 .4-1.9-1.4-1.2 1.9-.2.8-1.7z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

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

/* -----------------------------
  Catalog (BS ijekavica)
----------------------------- */

function resolveBadgeCopy(badge, locked = false) {
  const key = pickBadgeKey(badge);
  const n = extractNumber(badge);

  // Dynamic: tenure (years)
  if (key === "tenure") {
    const years = n || 1;
    const tier = Math.min(5, Math.max(1, years)); // 1..5
    return {
      key: `tenure_${years}`,
      title: `${years}. godina s nama`,
      description: years === 1 ? "Prva godišnjica na platformi." : "Godišnjica registracije na platformi.",
      Icon: Ljiljan,
      tier,
    };
  }

  // Dynamic: counts
  if (key === "sales") {
    const count = n ?? 1;
    return {
      key: `sales_${count}`,
      title: `Prodaje: ${formatCompactNumber(count)}`,
      description: "Uspješno zaključene prodaje i dogovori (milestone).",
      Icon: Medalja,
      tier: clampTier(count),
    };
  }
  if (key === "reviews") {
    const count = n ?? 1;
    return {
      key: `reviews_${count}`,
      title: `Ocjene: ${formatCompactNumber(count)}`,
      description: "Ocjene i povratne informacije od kupaca (milestone).",
      Icon: Stecak,
      tier: clampTier(count),
    };
  }
  if (key === "listings") {
    const count = n ?? 1;
    return {
      key: `listings_${count}`,
      title: `Oglasi: ${formatCompactNumber(count)}`,
      description: "Broj objavljenih oglasa i ponuda (milestone).",
      Icon: Most,
      tier: clampTier(count),
    };
  }
  if (key === "messages") {
    const count = n ?? 1;
    return {
      key: `messages_${count}`,
      title: `Poruke: ${formatCompactNumber(count)}`,
      description: "Aktivna komunikacija i briga o kupcima (milestone).",
      Icon: Dzezva,
      tier: clampTier(count),
    };
  }
  if (key === "streak") {
    const days = n ?? 7;
    return {
      key: `streak_${days}`,
      title: `Niz aktivnosti: ${days} dana`,
      description: "Kontinuirano prisustvo i aktivnost (milestone).",
      Icon: Ljiljan,
      tier: clampTier(days),
    };
  }

  // Static
  const staticCatalog = {
    verified: {
      title: "Verificiran korisnik",
      description: "Identitet je potvrđen. Kupci imaju više povjerenja.",
      Icon: Ljiljan,
      tier: 3,
    },
    pro: { title: "Pro", description: "Napredni profil sa dodatnim pogodnostima.", Icon: Medalja, tier: 4 },
    shop: { title: "Shop", description: "Registrovana radnja / brend.", Icon: Most, tier: 4 },
    early_adopter: {
      title: "Rani usvojitelj",
      description: "Bio/la si među prvima koji su koristili platformu.",
      Icon: Stecak,
      tier: 2,
    },
    top_seller: {
      title: "Top prodavač",
      description: "Odlični rezultati i aktivnost u zajednici.",
      Icon: Medalja,
      tier: 5,
    },
    trusted: { title: "Pouzdan prodavač", description: "Dosljedan i korektan u komunikaciji.", Icon: Ljiljan, tier: 4 },
    fast_reply: { title: "Brz odgovor", description: "Odgovara brzo na upite kupaca.", Icon: Dzezva, tier: 3 },
  };

  const picked = staticCatalog[key] || {
    title: "Postignuće",
    description: locked ? "Otključaj ispunjavanjem uslova." : "Nastavi graditi svoj profil.",
    Icon: Medalja,
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
};

const MILESTONES = {
  tenure: [1, 2, 3, 5, 7, 10],
  sales: [1, 10, 25, 50, 100, 250, 500, 1000],
  reviews: [1, 5, 10, 25, 50, 100, 250, 500],
  listings: [1, 5, 10, 25, 50, 100, 250, 500],
  messages: [25, 100, 250, 500, 1000, 2500, 5000],
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

  if (kind === "tenure") return `Automatski — dodjeljuje se nakon ${v} ${v === 1 ? "godine" : "godina"} od registracije.`;
  if (kind === "sales") return `Dodjeljuje se nakon najmanje ${v} ${v === 1 ? "zaključene prodaje" : "zaključenih prodaja"}.`;
  if (kind === "reviews") return `Dodjeljuje se nakon najmanje ${v} ${v === 1 ? "ocjene" : "ocjena"} od kupaca.`;
  if (kind === "listings") return `Dodjeljuje se nakon najmanje ${v} ${v === 1 ? "objavljenog oglasa" : "objavljenih oglasa"}.`;
  if (kind === "messages") return `Dodjeljuje se nakon najmanje ${v} ${v === 1 ? "razmijenjene poruke" : "razmijenjenih poruka"} (aktivnost u komunikaciji).`;
  if (kind === "streak") return `Dodjeljuje se nakon ${v} dana uzastopne aktivnosti.`;
  return "Otključaj ispunjavanjem uslova.";
}

function meaningText(kind) {
  if (kind === "tenure") return "Ovaj bedž pokazuje koliko dugo si dio zajednice i koliko si stabilan član platforme.";
  if (kind === "sales") return "Ovaj bedž govori o tvom iskustvu u prodaji i sposobnosti da uspješno zaključiš dogovor.";
  if (kind === "reviews") return "Ovaj bedž predstavlja povjerenje kupaca i kvalitet iskustva koje ostavljaš nakon kupovine.";
  if (kind === "listings") return "Ovaj bedž pokazuje koliko si aktivan u objavljivanju ponuda i održavanju profila ažurnim.";
  if (kind === "messages") return "Ovaj bedž govori o tvojoj komunikaciji — briga o kupcima se najčešće vidi kroz poruke.";
  if (kind === "streak") return "Ovaj bedž nagrađuje kontinuitet — redovna aktivnost je znak ozbiljnosti i pouzdanosti.";
  return "Bedževi su kratki znakovi postignuća koji pomažu kupcima da brže steknu dojam o profilu.";
}

function staticMeaning(key) {
  if (key === "verified") {
    return {
      category: "identity",
      meaning: "Identitet je potvrđen. Kupci lakše stiču povjerenje jer je profil verifikovan.",
      how: ["Završi proces verifikacije (identitet/dokumenti).", "Nakon potvrde, bedž je trajno vezan za profil."],
    };
  }
  if (key === "pro") {
    return {
      category: "business",
      meaning: "Pro označava napredan profil sa dodatnim opcijama i boljim isticanjem.",
      how: ["Aktiviraj Pro paket u postavkama (pretplata ili uslov kampanje)."],
    };
  }
  if (key === "shop") {
    return {
      category: "business",
      meaning: "Shop označava radnju/brend. Profil dobija poslovne informacije, radno vrijeme i ozbiljniji nastup.",
      how: ["Registruj radnju (Shop) i popuni poslovne podatke.", "Potvrdi kontakt i/ili dokumente ako je potrebno."],
    };
  }
  if (key === "early_adopter") {
    return {
      category: "loyalty",
      meaning: "Rani usvojitelj znači da si bio/la među prvim korisnicima platforme.",
      how: ["Dodjeljuje se automatski prema datumu registracije (historijski bedž)."],
    };
  }
  if (key === "top_seller") {
    return {
      category: "reputation",
      meaning: "Top prodavač je signal odličnih rezultata i pouzdanosti kroz aktivnost i kvalitet.",
      how: [
        "Visok broj uspješnih prodaja i dobra reputacija.",
        "Niska stopa problema (otkazivanja/pritužbi) i aktivna komunikacija.",
      ],
    };
  }
  if (key === "trusted") {
    return {
      category: "reputation",
      meaning: "Pouzdan prodavač je znak korektnosti: jasna komunikacija, isporuka i fer odnos prema kupcima.",
      how: ["Održavaj visok kvalitet usluge i dobru reputaciju kroz vrijeme."],
    };
  }
  if (key === "fast_reply") {
    return {
      category: "activity",
      meaning: "Brz odgovor pomaže kupcima: znači da se upiti rješavaju brzo i profesionalno.",
      how: ["Redovno odgovaraj na poruke i održavaj dobar prosjek vremena odgovora."],
    };
  }
  return { category: "general", meaning: meaningText("generic"), how: ["Nastavi koristiti platformu i otključavat ćeš nova postignuća."] };
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
        next ? `Sljedeći cilj: ${next}. godina s nama.` : "Dosegnuo/la si najviše dostupne godišnjice.",
      ],
    };
  }

  if (["sales", "reviews", "listings", "messages", "streak"].includes(baseKey)) {
    const kind = baseKey;
    const val = n ?? 1;
    const next = nextMilestone(kind, val);
    const cat =
      kind === "sales" ? "business" :
      kind === "reviews" ? "reputation" :
      kind === "listings" ? "activity" :
      kind === "messages" ? "activity" :
      "activity";

    return {
      ...meta,
      category: cat,
      categoryLabel: CATEGORY_LABEL[cat] || CATEGORY_LABEL.general,
      tierLabel: TIER_LABEL[meta.tier] || TIER_LABEL[1],
      meaning: meaningText(kind),
      howToEarn: [
        criteriaText(kind, val),
        next ? `Sljedeći cilj: ${next}.` : "Dosegnuo/la si najviši poznati nivo u ovom tipu bedža.",
      ],
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
  const Icon = meta.Icon || Medalja;

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
        interactive ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-500/50 dark:focus-visible:ring-offset-slate-950" : "",
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