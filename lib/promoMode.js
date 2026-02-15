export const PROMO_FREE_ACCESS_ENABLED =
  process.env.NEXT_PUBLIC_PROMO_FREE_ACCESS !== "false";

export const PROMO_WELCOME_DISMISS_KEY = "lmx_promo_welcome_dismissed_v1";

export const PROMO_HEADLINE = "Svi planovi su trenutno dostupni besplatno.";

export const PROMO_SUBHEAD =
  "Uživajte u punom pristupu bez troškova i bez ograničenja - do daljnjeg.";

export const PROMO_BENEFITS = [
  "Besplatno do daljnjeg",
  "Bez obaveza",
  "Bez unosa kartice",
];

export const isPromoFreeAccessEnabled = () => PROMO_FREE_ACCESS_ENABLED;
