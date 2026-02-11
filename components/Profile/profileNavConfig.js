import {
  IoPersonOutline,
  IoLayersOutline,
  IoHeartOutline,
  IoBookmarkOutline,
  IoCardOutline,
  IoReceiptOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoStarOutline,
  IoTrophyOutline,
  IoShieldCheckmarkOutline,
  IoStorefrontOutline,
  IoBagHandleOutline,
  IoRibbonOutline,
  IoSearchOutline,
  IoChatbubbleEllipsesOutline,
  IoChatbubbleOutline,
} from "react-icons/io5";

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
          icon: IoPersonOutline,
          label: "Moj profil",
          description: "Uredi podatke i postavke",
        },
        !isVerified
          ? {
              href: "/user-verification",
              icon: IoShieldCheckmarkOutline,
              label: "Verifikacija",
              description: "Potvrdi svoj identitet",
              isNew: true,
            }
          : null,
        {
          href: "/profile/seller-settings",
          icon: IoStorefrontOutline,
          label: "Postavke prodavača",
          description: "Prilagodi svoj profil prodavača",
          match: "prefix",
        },
      ].filter(Boolean),
    },
    {
      title: "Moji sadržaji",
      items: [
        {
          href: "/my-ads",
          icon: IoLayersOutline,
          label: "Moji oglasi",
          description: activeAds > 0 ? `${activeAds} aktivnih oglasa` : "Upravljaj oglasima",
          match: "prefix",
        },
        {
          href: "/favorites",
          icon: IoHeartOutline,
          label: "Spašeni oglasi",
          description: "Sačuvani oglasi",
        },
        {
          href: "/profile/saved",
          icon: IoBookmarkOutline,
          label: "Sačuvani prodavači",
          description: "Kolekcije, bilješke i obavijesti",
          match: "prefix",
        },
        {
          href: "/profile/saved-searches",
          icon: IoSearchOutline,
          label: "Spašene pretrage",
          description: "Brze prečice do tvojih filtera",
        },
        {
          href: "/purchases",
          icon: IoBagHandleOutline,
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
          icon: IoChatbubbleOutline,
          label: "Poruke",
          description: "Chat sa kupcima i prodavačima",
          badge: unreadMessages,
          match: "prefix",
        },
        {
          href: "/notifications",
          icon: IoNotificationsOutline,
          label: "Notifikacije",
          description: "Sve obavijesti na jednom mjestu",
          badge: unreadNotifications,
          match: "prefix",
        },
        {
          href: "/profile/public-questions",
          icon: IoChatbubbleEllipsesOutline,
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
          icon: IoCardOutline,
          label: "Pretplata",
          description: "Upravljaj pretplatom",
        },
        {
          href: "/transactions",
          icon: IoReceiptOutline,
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
          icon: IoStarOutline,
          label: "Ocjene",
          description: "Recenzije i ocjene",
          match: "prefix",
        },
        {
          href: "/profile/badges",
          icon: IoRibbonOutline,
          label: "Bedževi",
          description: "Tvoja postignuća",
          match: "prefix",
        },
        {
          href: "/leaderboard",
          icon: IoTrophyOutline,
          label: "Ljestvica",
          description: "Rangiranje korisnika",
          match: "prefix",
        },
      ],
    },
    {
      title: "Podrška",
      items: [
        {
          href: "/contact-us",
          icon: IoHelpCircleOutline,
          label: "Kontaktirajte nas",
          description: "Kontaktiraj podršku",
        },
      ],
    },
  ];

  return sections;
};
