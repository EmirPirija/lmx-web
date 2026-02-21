import {
  IdentificationCard,
  Layers,
  Heart,
  UserList,
  CreditCard,
  Receipt,
  BellRinging,
  Headset,
  Star,
  Trophy,
  ShieldCheck,
  Store,
  ShoppingBag,
  Medal,
  Search,
  MessageSquareMore,
  MessageSquare,
  Link2,
  Box,
  Smartphone,
  Sparkles,
} from "@/components/Common/UnifiedIconPack";
import { SOCIAL_POSTING_TEMP_UNAVAILABLE } from "@/utils/socialAvailability";

const matchPath = (pathname, href, mode = "exact") => {
  if (!pathname || !href) return false;
  if (mode === "prefix") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href;
};

export const isProfileNavItemActive = (pathname, item) => {
  return matchPath(pathname, item.href, item.match || "exact");
};

export const getProfileNavigationSections = ({
  isVerified = false,
  activeAds = 0,
  unreadNotifications = 0,
  unreadMessages = 0,
} = {}) => {
  const sections = [
    {
      title: "Račun",
      items: [
        {
          href: "/profile",
          icon: IdentificationCard,
          label: "Moj profil",
          description: "Uredi podatke i postavke",
        },
        !isVerified
          ? {
              href: "/user-verification",
              icon: ShieldCheck,
              label: "Verifikacija",
              description: "Potvrdi svoj identitet",
              isNew: true,
            }
          : null,
        {
          href: "/profile/seller-settings",
          icon: Store,
          label: "Postavke prodavača",
          description: "Prilagodi svoj profil prodavača",
          match: "prefix",
        },
        {
          href: "/profile/integrations",
          icon: Link2,
          label: "Integracije",
          description: SOCIAL_POSTING_TEMP_UNAVAILABLE
            ? "Objave na društvenim mrežama: privremeno nedostupno"
            : "Instagram, sync i zakazane objave",
          match: "prefix",
        },
        {
          href: "/profile/sessions",
          icon: Smartphone,
          label: "Uređaji i sesije",
          description: "Pregled aktivnih prijava i odjava svih uređaja",
          match: "prefix",
        },
        {
          href: "/profile/shop-ops",
          icon: Box,
          label: "Shop operacije",
          description: "Zalihe, alerti i custom domena",
          match: "prefix",
        },
      ].filter(Boolean),
    },
    {
      title: "Moji sadržaji",
      items: [
        {
          href: "/my-ads",
          icon: Layers,
          label: "Moji oglasi",
          description: activeAds > 0 ? `${activeAds} aktivnih oglasa` : "Upravljaj oglasima",
          match: "prefix",
        },
        {
          href: "/favorites",
          icon: Heart,
          label: "Spašeni oglasi",
          description: "Sačuvani oglasi",
        },
        {
          href: "/profile/saved",
          icon: UserList,
          label: "Sačuvani prodavači",
          description: "Kolekcije, bilješke i obavijesti",
          match: "prefix",
        },
        {
          href: "/profile/saved-searches",
          icon: Search,
          label: "Spašene pretrage",
          description: "Brze prečice do tvojih filtera",
        },
        {
          href: "/purchases",
          icon: ShoppingBag,
          label: "Moje kupovine",
          description: "Historija kupovina",
          match: "prefix",
        },
      ],
    },
    {
      title: "Komunikacija",
      items: [
        {
          href: "/chat",
          icon: MessageSquare,
          label: "Poruke",
          description: "Chat sa kupcima i prodavačima",
          badge: unreadMessages,
          match: "prefix",
        },
        {
          href: "/notifications",
          icon: BellRinging,
          label: "Notifikacije",
          description: "Sve obavijesti na jednom mjestu",
          badge: unreadNotifications,
          match: "prefix",
        },
        {
          href: "/profile/public-questions",
          icon: MessageSquareMore,
          label: "Javna pitanja",
          description: "Pitanja na vašim oglasima",
        },
      ],
    },
    {
      title: "Finansije",
      items: [
        {
          href: "/user-subscription",
          icon: CreditCard,
          label: "Promo pristup",
          description: "Svi planovi su trenutno aktivni kroz promo režim",
          disabled: true,
          unavailableBadge: "Promo",
        },
        {
          href: "/transactions",
          icon: Receipt,
          label: "Transakcije",
          description: "Historija transakcija",
          match: "prefix",
        },
      ],
    },
    {
      title: "Zajednica",
      items: [
        {
          href: "/reviews",
          icon: Star,
          label: "Ocjene",
          description: "Recenzije i ocjene",
          match: "prefix",
        },
        {
          href: "/profile/gamification",
          icon: Sparkles,
          label: "Gamifikacija",
          description: "Privremeno nedostupno",
          match: "prefix",
          disabled: true,
          unavailableBadge: "Nedostupno",
        },
        {
          href: "/profile/badges",
          icon: Medal,
          label: "Bedževi",
          description: "Privremeno nedostupno",
          match: "prefix",
          disabled: true,
          unavailableBadge: "Nedostupno",
        },
        {
          href: "/leaderboard",
          icon: Trophy,
          label: "Ljestvica",
          description: "Privremeno nedostupno",
          match: "prefix",
          disabled: true,
          unavailableBadge: "Nedostupno",
        },
      ],
    },
    {
      title: "Podrška",
      items: [
        {
          href: "/contact-us",
          icon: Headset,
          label: "Kontakt",
          description: "Kontaktiraj podršku",
        },
      ],
    },
  ];

  return sections;
};
