import {
  isPromoFreeAccessEnabledSetting,
  readArraySetting,
  readSettingValue,
} from "@/lib/backendControls";

export const PROMO_FREE_ACCESS_ENABLED =
  String(process.env.NEXT_PUBLIC_PROMO_FREE_ACCESS ?? "").trim().toLowerCase() !==
  "false";

export const PROMO_WELCOME_DISMISS_KEY = "lmx_promo_welcome_dismissed_v1";

export const PROMO_HEADLINE = "Svi planovi su trenutno dostupni besplatno.";

export const PROMO_SUBHEAD =
  "Uživajte u punom pristupu bez troškova i bez ograničenja - do daljnjeg.";

export const PROMO_BENEFITS = [
  "Besplatno do daljnjeg",
  "Bez obaveza",
  "Bez unosa kartice",
];

export const isPromoFreeAccessEnabled = (settings = null) =>
  isPromoFreeAccessEnabledSetting(settings);

export const getPromoHeadline = (settings = null) =>
  String(
    readSettingValue(
      ["promo_headline", "promo_title", "promo_mode_headline"],
      PROMO_HEADLINE,
      settings,
    ) || PROMO_HEADLINE,
  );

export const getPromoSubhead = (settings = null) =>
  String(
    readSettingValue(
      ["promo_subhead", "promo_subtitle", "promo_mode_subhead"],
      PROMO_SUBHEAD,
      settings,
    ) || PROMO_SUBHEAD,
  );

export const getPromoBenefits = (settings = null) =>
  readArraySetting(
    ["promo_benefits", "promo_mode_benefits"],
    PROMO_BENEFITS,
    settings,
  );
