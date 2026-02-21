"use client";
import { toast } from "@/utils/toastBs";
import { getAppStore } from "../redux/store/storeRef";
import enTranslation from "./locale/en.json";
import { generateKeywords } from "./generateKeywords";
import { getCountryCallingCode } from "react-phone-number-input";
import {
  extractAreaM2FromItem,
  inferRealEstatePerSquareMode,
  toPositiveNumber,
} from "@/utils/realEstatePricing";

const getSafeState = () => {
  const appStore = getAppStore();
  if (!appStore || typeof appStore.getState !== "function") return null;
  return appStore.getState();
};

export const t = (label) => {
  const state = getSafeState();
  if (!state) {
    return enTranslation[label] || label;
  }

  const langData = state.CurrentLanguage?.language?.file_name?.[label];
  if (langData) {
    return langData;
  } else {
    return enTranslation[label] || label;
  }
};

// check user login
// is login user check
export const isLogin = () => {
  // Use the selector to access user data
  const userData = getSafeState()?.UserSignup?.data;
  // Check if the token exists
  if (userData?.token) {
    return true;
  }

  return false;
};

export const IsLandingPageOn = () => {
  const settings = getSafeState()?.Settings?.data?.data;
  return Number(settings?.show_landing_page);
};

export const getDefaultLatLong = () => {
  const settings = getSafeState()?.Settings?.data?.data;
  const default_latitude = Number(settings?.default_latitude);
  const default_longitude = Number(settings?.default_longitude);

  const defaultLetLong = {
    latitude: default_latitude,
    longitude: default_longitude,
  };
  return defaultLetLong;
};

export const getPlaceApiKey = () => {
  const settings = getSafeState()?.Settings?.data?.data;
  return settings?.place_api_key;
};

export const getSlug = (pathname) => {
  const segments = pathname.split("/");
  return segments[segments.length - 1];
};



export const formatDate = (createdAt) => {
  const date = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days === 0) {
    return "Danas";
  } else if (days === 1) {
    return "Jučer";
  } else if (days < 30) {
    return `${days} ${"dana"}`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} ${months > 1 ? "mjeseci" : "mjesec"} ${"prije"}`;
  } else {
    const years = Math.floor(days / 365);
    return `${years} ${years > 1 ? "godine" : "godina"} ${"prije"}`;
  }
};

export const languageLocaleMap = {
  af: "af-ZA", // Afrikaans
  am: "am-ET", // Amharic
  ar: "ar-SA", // Arabic
  az: "az-AZ", // Azerbaijani
  be: "be-BY", // Belarusian
  bg: "bg-BG", // Bulgarian
  bn: "bn-BD", // Bengali
  bs: "bs-BA", // Bosnian
  ca: "ca-ES", // Catalan
  cs: "cs-CZ", // Czech
  cy: "cy-GB", // Welsh
  da: "da-DK", // Danish
  de: "de-DE", // German
  dz: "dz-BT", // Dzongkha
  el: "el-GR", // Greek
  en: "en-US", // English
  eo: "eo-001", // Esperanto
  es: "es-ES", // Spanish
  et: "et-EE", // Estonian
  eu: "eu-ES", // Basque
  fa: "fa-IR", // Persian
  fi: "fi-FI", // Finnish
  fr: "fr-FR", // French
  ga: "ga-IE", // Irish
  gl: "gl-ES", // Galician
  gu: "gu-IN", // Gujarati
  he: "he-IL", // Hebrew
  hi: "hi-IN", // Hindi
  hr: "hr-HR", // Croatian
  hu: "hu-HU", // Hungarian
  hy: "hy-AM", // Armenian
  id: "id-ID", // Indonesian
  is: "is-IS", // Icelandic
  it: "it-IT", // Italian
  ja: "ja-JP", // Japanese
  jv: "jv-ID", // Javanese
  ka: "ka-GE", // Georgian
  kk: "kk-KZ", // Kazakh
  km: "km-KH", // Khmer
  kn: "kn-IN", // Kannada
  ko: "ko-KR", // Korean
  ky: "ky-KG", // Kyrgyz
  lo: "lo-LA", // Lao
  lt: "lt-LT", // Lithuanian
  lv: "lv-LV", // Latvian
  mk: "mk-MK", // Macedonian
  ml: "ml-IN", // Malayalam
  mn: "mn-MN", // Mongolian
  mr: "mr-IN", // Marathi
  ms: "ms-MY", // Malay
  mt: "mt-MT", // Maltese
  my: "my-MM", // Burmese
  ne: "ne-NP", // Nepali
  nl: "nl-NL", // Dutch
  no: "no-NO", // Norwegian
  or: "or-IN", // Odia
  pa: "pa-IN", // Punjabi
  pl: "pl-PL", // Polish
  ps: "ps-AF", // Pashto
  pt: "pt-PT", // Portuguese
  ro: "ro-RO", // Romanian
  ru: "ru-RU", // Russian
  rw: "rw-RW", // Kinyarwanda
  si: "si-LK", // Sinhala
  sk: "sk-SK", // Slovak
  sl: "sl-SI", // Slovenian
  so: "so-SO", // Somali
  sq: "sq-AL", // Albanian
  sr: "sr-RS", // Serbian
  sv: "sv-SE", // Swedish
  sw: "sw-TZ", // Swahili
  ta: "ta-IN", // Tamil
  te: "te-IN", // Telugu
  tg: "tg-TJ", // Tajik
  th: "th-TH", // Thai
  tk: "tk-TM", // Turkmen
  tr: "tr-TR", // Turkish
  uk: "uk-UA", // Ukrainian
  ur: "ur-PK", // Urdu
  uz: "uz-UZ", // Uzbek
  vi: "vi-VN", // Vietnamese
  xh: "xh-ZA", // Xhosa
  yi: "yi-001", // Yiddish
  yo: "yo-NG", // Yoruba
  zh: "zh-CN", // Chinese (Simplified)
  zu: "zu-ZA", // Zulu
};

export const countryLocaleMap = {
  AF: "ps-AF", // Afghanistan
  AL: "sq-AL", // Albania
  DZ: "ar-DZ", // Algeria
  AS: "en-AS", // American Samoa
  AD: "ca-AD", // Andorra
  AO: "pt-AO", // Angola
  AI: "en-AI", // Anguilla
  AG: "en-AG", // Antigua and Barbuda
  AR: "es-AR", // Argentina
  AM: "hy-AM", // Armenia
  AU: "en-AU", // Australia
  AT: "de-AT", // Austria
  AZ: "az-AZ", // Azerbaijan
  BS: "en-BS", // Bahamas
  BH: "ar-BH", // Bahrain
  BD: "bn-BD", // Bangladesh
  BB: "en-BB", // Barbados
  BY: "be-BY", // Belarus
  BE: "nl-BE", // Belgium
  BZ: "en-BZ", // Belize
  BJ: "fr-BJ", // Benin
  BM: "en-BM", // Bermuda
  BT: "dz-BT", // Bhutan
  BO: "es-BO", // Bolivia
  BA: "bs-BA", // Bosnia and Herzegovina
  BW: "en-BW", // Botswana
  BR: "pt-BR", // Brazil
  BN: "ms-BN", // Brunei
  BG: "bg-BG", // Bulgaria
  BF: "fr-BF", // Burkina Faso
  BI: "fr-BI", // Burundi
  KH: "km-KH", // Cambodia
  CM: "fr-CM", // Cameroon
  CA: "en-CA", // Canada
  CV: "pt-CV", // Cape Verde
  KY: "en-KY", // Cayman Islands
  CF: "fr-CF", // Central African Republic
  TD: "fr-TD", // Chad
  CL: "es-CL", // Chile
  CN: "zh-CN", // China
  CO: "es-CO", // Colombia
  KM: "ar-KM", // Comoros
  CG: "fr-CG", // Congo
  CR: "es-CR", // Costa Rica
  HR: "hr-HR", // Croatia
  CU: "es-CU", // Cuba
  CY: "el-CY", // Cyprus
  CZ: "cs-CZ", // Czech Republic
  DK: "da-DK", // Denmark
  DJ: "fr-DJ", // Djibouti
  DM: "en-DM", // Dominica
  DO: "es-DO", // Dominican Republic
  EC: "es-EC", // Ecuador
  EG: "ar-EG", // Egypt
  SV: "es-SV", // El Salvador
  GQ: "es-GQ", // Equatorial Guinea
  ER: "ti-ER", // Eritrea
  EE: "et-EE", // Estonia
  SZ: "en-SZ", // Eswatini
  ET: "am-ET", // Ethiopia
  FJ: "en-FJ", // Fiji
  FI: "fi-FI", // Finland
  FR: "fr-FR", // France
  GA: "fr-GA", // Gabon
  GM: "en-GM", // Gambia
  GE: "ka-GE", // Georgia
  DE: "de-DE", // Germany
  GH: "en-GH", // Ghana
  GR: "el-GR", // Greece
  GD: "en-GD", // Grenada
  GU: "en-GU", // Guam
  GT: "es-GT", // Guatemala
  GN: "fr-GN", // Guinea
  GW: "pt-GW", // Guinea-Bissau
  GY: "en-GY", // Guyana
  HT: "fr-HT", // Haiti
  HN: "es-HN", // Honduras
  HU: "hu-HU", // Hungary
  IS: "is-IS", // Iceland
  IN: "en-IN", // India
  ID: "id-ID", // Indonesia
  IR: "fa-IR", // Iran
  IQ: "ar-IQ", // Iraq
  IE: "en-IE", // Ireland
  IL: "he-IL", // Israel
  IT: "it-IT", // Italy
  JM: "en-JM", // Jamaica
  JP: "ja-JP", // Japan
  JO: "ar-JO", // Jordan
  KZ: "kk-KZ", // Kazakhstan
  KE: "en-KE", // Kenya
  KI: "en-KI", // Kiribati
  KP: "ko-KP", // North Korea
  KR: "ko-KR", // South Korea
  KW: "ar-KW", // Kuwait
  KG: "ky-KG", // Kyrgyzstan
  LA: "lo-LA", // Laos
  LV: "lv-LV", // Latvia
  LB: "ar-LB", // Lebanon
  LS: "en-LS", // Lesotho
  LR: "en-LR", // Liberia
  LY: "ar-LY", // Libya
  LI: "de-LI", // Liechtenstein
  LT: "lt-LT", // Lithuania
  LU: "fr-LU", // Luxembourg
  MG: "fr-MG", // Madagascar
  MW: "en-MW", // Malawi
  MY: "ms-MY", // Malaysia
  MV: "dv-MV", // Maldives
  ML: "fr-ML", // Mali
  MT: "mt-MT", // Malta
  MH: "en-MH", // Marshall Islands
  MR: "ar-MR", // Mauritania
  MU: "en-MU", // Mauritius
  MX: "es-MX", // Mexico
  FM: "en-FM", // Micronesia
  MD: "ro-MD", // Moldova
  MC: "fr-MC", // Monaco
  MN: "mn-MN", // Mongolia
  ME: "sr-ME", // Montenegro
  MA: "ar-MA", // Morocco
  MZ: "pt-MZ", // Mozambique
  MM: "my-MM", // Myanmar
  NA: "en-NA", // Namibia
  NR: "en-NR", // Nauru
  NP: "ne-NP", // Nepal
  NL: "nl-NL", // Netherlands
  NZ: "en-NZ", // New Zealand
  NI: "es-NI", // Nicaragua
  NE: "fr-NE", // Niger
  NG: "en-NG", // Nigeria
  NO: "no-NO", // Norway
  OM: "ar-OM", // Oman
  PK: "ur-PK", // Pakistan
  PW: "en-PW", // Palau
  PS: "ar-PS", // Palestine
  PA: "es-PA", // Panama
  PG: "en-PG", // Papua New Guinea
  PY: "es-PY", // Paraguay
  PE: "es-PE", // Peru
  PH: "en-PH", // Philippines
  PL: "pl-PL", // Poland
  PT: "pt-PT", // Portugal
  QA: "ar-QA", // Qatar
  RO: "ro-RO", // Romania
  RU: "ru-RU", // Russia
  RW: "rw-RW", // Rwanda
  KN: "en-KN", // Saint Kitts and Nevis
  LC: "en-LC", // Saint Lucia
  VC: "en-VC", // Saint Vincent and the Grenadines
  WS: "en-WS", // Samoa
  SM: "it-SM", // San Marino
  ST: "pt-ST", // Sao Tome and Principe
  SA: "ar-SA", // Saudi Arabia
  SN: "fr-SN", // Senegal
  RS: "sr-RS", // Serbia
  SC: "en-SC", // Seychelles
  SL: "en-SL", // Sierra Leone
  SG: "en-SG", // Singapore
  SK: "sk-SK", // Slovakia
  SI: "sl-SI", // Slovenia
  SB: "en-SB", // Solomon Islands
  SO: "so-SO", // Somalia
  ZA: "en-ZA", // South Africa
  ES: "es-ES", // Spain
  LK: "si-LK", // Sri Lanka
  SD: "ar-SD", // Sudan
  SR: "nl-SR", // Suriname
  SE: "sv-SE", // Sweden
  CH: "de-CH", // Switzerland
  SY: "ar-SY", // Syria
  TW: "zh-TW", // Taiwan
  TJ: "tg-TJ", // Tajikistan
  TZ: "sw-TZ", // Tanzania
  TH: "th-TH", // Thailand
  TG: "fr-TG", // Togo
  TO: "en-TO", // Tonga
  TT: "en-TT", // Trinidad and Tobago
  TN: "ar-TN", // Tunisia
  TR: "tr-TR", // Turkey
  TM: "tk-TM", // Turkmenistan
  UG: "en-UG", // Uganda
  UA: "uk-UA", // Ukraine
  AE: "ar-AE", // United Arab Emirates
  GB: "en-GB", // United Kingdom
  US: "en-US", // United States
  UY: "es-UY", // Uruguay
  UZ: "uz-UZ", // Uzbekistan
  VU: "en-VU", // Vanuatu
  VE: "es-VE", // Venezuela
  VN: "vi-VN", // Vietnam
  YE: "ar-YE", // Yemen
  ZM: "en-ZM", // Zambia
  ZW: "en-ZW", // Zimbabwe
};

// Function to format large numbers as strings with K, M, and B abbreviations
export const formatPriceAbbreviated = (price) => {
  if (
    price === null ||
    price === undefined ||
    (typeof price === "string" && price.trim() === "")
  ) {
    return "";
  }

  if (Number(price) === 0) {
    return "Na upit";
  }

  const settingsData = getSafeState()?.Settings?.data?.data;
  const currencySymbol = settingsData?.currency_symbol;
  const currencyPosition = settingsData?.currency_symbol_position;
  const countryCode =
    process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toUpperCase() || "US";
  const locale = countryLocaleMap[countryCode] || "en-US";

  const formattedNumber = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(Number(price));

  return currencyPosition === "right"
    ? `${formattedNumber} ${currencySymbol}`
    : `${currencySymbol} ${formattedNumber}`;
};

export const formatSalaryRange = (minSalary, maxSalary) => {
  const hasMin =
    minSalary !== undefined && minSalary !== null && minSalary !== "";
  const hasMax =
    maxSalary !== undefined && maxSalary !== null && maxSalary !== "";

  if (hasMin && hasMax) {
    return `${formatPriceAbbreviated(minSalary)} – ${formatPriceAbbreviated(
      maxSalary
    )}`;
  }

  if (hasMin) {
    return `${"Od"} ${formatPriceAbbreviated(minSalary)}`;
  }

  if (hasMax) {
    return `${"Do"} ${formatPriceAbbreviated(maxSalary)}`;
  }

  return "";
};

// utils/stickyNote.js
export const createStickyNote = () => {
  // Check if sticky note already exists - prevent duplicates
  if (document.getElementById("firebase-sticky-note")) {
    return;
  }

  const stickyNote = document.createElement("div");
  stickyNote.id = "firebase-sticky-note";
  stickyNote.style.position = "fixed";
  stickyNote.style.bottom = "0";
  stickyNote.style.width = "100%";
  stickyNote.style.backgroundColor = "#ffffff";
  stickyNote.style.color = "#000000";
  stickyNote.style.padding = "10px";
  stickyNote.style.textAlign = "center";
  stickyNote.style.fontSize = "14px";
  stickyNote.style.zIndex = "99999";

  const closeButton = document.createElement("span");
  closeButton.setAttribute("data-sticky-close", "true"); // Add identifier
  closeButton.style.cursor = "pointer";
  closeButton.style.float = "right";
  closeButton.innerHTML = "&times;";
  closeButton.fontSize = "20px";

  closeButton.onclick = function () {
    document.body.removeChild(stickyNote);
  };

  const playStoreLink = getSafeState()?.Settings?.data?.data?.play_store_link;
  const appStoreLink = getSafeState()?.Settings?.data?.data?.app_store_link;

  const message = document.createElement("span");
  message.setAttribute("data-sticky-message", "true");
  message.innerText = "Chat i obavještenja nisu podržani u ovom pregledniku. Koristi mobilnu aplikaciju.";

  const linkContainer = document.createElement("div"); // Changed to 'div' for better spacing
  linkContainer.style.display = "inline-block"; // Keeps links inline while allowing space

  const linkStyle = "text-decoration: underline !important; color: #3498db";

  if (playStoreLink) {
    const playStoreAnchor = document.createElement("a");
    playStoreAnchor.setAttribute("data-sticky-playstore", "true"); // Add identifier
    playStoreAnchor.style.cssText = linkStyle;
    playStoreAnchor.innerText = "Play Store-a";
    playStoreAnchor.href = playStoreLink;
    playStoreAnchor.target = "_blank";
    linkContainer.appendChild(playStoreAnchor);
  }

  if (appStoreLink) {
    const appStoreAnchor = document.createElement("a");
    appStoreAnchor.setAttribute("data-sticky-appstore", "true"); // Add identifier
    appStoreAnchor.style.cssText = linkStyle;
    appStoreAnchor.style.marginLeft = "5px"; // Space before this link
    appStoreAnchor.innerText = "App Store-a";
    appStoreAnchor.href = appStoreLink;
    appStoreAnchor.target = "_blank";
    linkContainer.appendChild(appStoreAnchor);
  }

  stickyNote.appendChild(closeButton);
  stickyNote.appendChild(message);
  stickyNote.appendChild(linkContainer);

  document.body.appendChild(stickyNote);
};

// Simple function to update sticky note translations
export const updateStickyNoteTranslations = () => {
  const note = document.getElementById("firebase-sticky-note");
  if (!note) return;

  // Use data attributes to find the correct elements
  const message = note.querySelector("[data-sticky-message]");
  const playStoreLink = note.querySelector("[data-sticky-playstore]");
  const appStoreLink = note.querySelector("[data-sticky-appstore]");

  if (message) {
    message.innerText = "Chat i obavještenja nisu podržani u ovom pregledniku. Koristi mobilnu aplikaciju.";
  }
  if (playStoreLink) {
    playStoreLink.innerText = "Play Store-a";
  }
  if (appStoreLink) {
    appStoreLink.innerText = "App Store-a";
  }
};

const ERROR_CODES = {
  "auth/user-not-found": "Korisnik nije pronađen",
  "auth/wrong-password": "Neispravna lozinka",
  "auth/email-already-in-use": "E-mail je već zauzet.",
  "auth/invalid-email": "Neispravan e-mail.",
  "auth/user-disabled": "Račun je onemogućen",
  "auth/too-many-requests": "Previše zahtjeva. Pokušaj kasnije.",
  "auth/operation-not-allowed": "Operacija nije dozvoljena",
  "auth/internal-error": "Došlo je do interne greške",
  "auth/invalid-login-credentials": "Podaci nisu tačni. Pokušaj ponovo.",
  "auth/invalid-credential": "Podaci nisu tačni. Pokušaj ponovo.",
  "auth/admin-restricted-operation": "Samo za admina",
  "auth/already-initialized": "Već inicijalizovano",
  "auth/app-not-authorized": "Aplikacija nije autorizovana",
  "auth/app-not-installed": "Aplikacija nije instalirana",
  "auth/argument-error": "Greška u argumentu",
  "auth/captcha-check-failed": "CAPTCHA provjera nije uspjela",
  "auth/code-expired": "Kod je istekao",
  "auth/cordova-not-ready": "Cordova nije spremna",
  "auth/cors-unsupported": "CORS nije podržan",
  "auth/credential-already-in-use": "Podaci za prijavu su već u upotrebi",
  "auth/custom-token-mismatch": "Token se ne poklapa",
  "auth/requires-recent-login": "Ponovno se prijavi",
  "auth/dependent-sdk-initialized-before-auth": "SDK pokrenut prije autentifikacije",
  "auth/dynamic-link-not-activated": "Dinamički link nije aktiviran",
  "auth/email-change-needs-verification": "Promjena e-maila traži potvrdu",
  "auth/emulator-config-failed": "Konfiguracija emulatora nije uspjela",
  "auth/expired-action-code": "Link/kod je istekao",
  "auth/cancelled-popup-request": "Zahtjev za pop-up je istekao",
  "auth/invalid-api-key": "Neispravan API ključ",
  "auth/invalid-app-credential": "Neispravna aplikacijska vjerodajnica",
  "auth/invalid-app-id": "Neispravan ID aplikacije",
  "auth/invalid-user-token": "Neispravna autentifikacija",
  "auth/invalid-auth-event": "Neispravan auth događaj",
  "auth/invalid-cert-hash": "Neispravan cert hash",
  "auth/invalid-verification-code": "Neispravan kod",
  "auth/invalid-continue-uri": "Neispravan continue URL",
  "auth/invalid-cordova-configuration": "Neispravna Cordova konfiguracija",
  "auth/invalid-custom-token": "Neispravan custom token",
  "auth/invalid-dynamic-link-domain": "Neispravan domen dinamičkog linka",
  "auth/invalid-emulator-scheme": "Neispravna emulator šema",
  "auth/invalid-message-payload": "Neispravan sadržaj poruke",
  "auth/invalid-multi-factor-session": "Neispravna MFA sesija",
  "auth/invalid-oauth-client-id": "Neispravan OAuth Client ID",
  "auth/invalid-oauth-provider": "Neispravan OAuth provider",
  "auth/invalid-action-code": "Neispravan kod",
  "auth/unauthorized-domain": "Neispravan origin",
  "auth/invalid-persistence-type": "Neispravna persistencija",
  "auth/invalid-phone-number": "Neispravan broj telefona",
  "auth/invalid-provider-id": "Neispravan provider ID",
  "auth/invalid-recaptcha-action": "Neispravna reCAPTCHA akcija",
  "auth/invalid-recaptcha-token": "Neispravan reCAPTCHA token",
  "auth/invalid-recaptcha-version": "Neispravna reCAPTCHA verzija",
  "auth/invalid-recipient-email": "Neispravan e-mail primaoca",
  "auth/invalid-req-type": "Neispravan tip zahtjeva",
  "auth/invalid-sender": "Neispravan pošiljalac",
  "auth/invalid-verification-id": "Neispravne informacije sesije",
  "auth/invalid-tenant-id": "Neispravan tenant ID",
  "auth/multi-factor-info-not-found": "MFA info nije pronađen",
  "auth/multi-factor-auth-required": "Potrebna MFA",
  "auth/missing-android-pkg-name": "Nedostaje Android paket",
  "auth/missing-app-credential": "Nedostaje aplikacijska vjerodajnica",
  "auth/auth-domain-config-required": "Nedostaje auth domen",
  "auth/missing-client-type": "Nedostaje tip klijenta",
  "auth/missing-verification-code": "Nedostaje kod",
  "auth/missing-continue-uri": "Nedostaje continue URL",
  "auth/missing-iframe-start": "Nedostaje iframe start",
  "auth/missing-ios-bundle-id": "Nedostaje iOS Bundle ID",
  "auth/missing-multi-factor-info": "Nedostaje MFA info",
  "auth/missing-multi-factor-session": "Nedostaje MFA sesija",
  "auth/missing-or-invalid-nonce": "Nonce nedostaje ili je neispravan",
  "auth/missing-phone-number": "Nedostaje broj telefona",
  "auth/missing-recaptcha-token": "Nedostaje reCAPTCHA token",
  "auth/missing-recaptcha-version": "Nedostaje reCAPTCHA verzija",
  "auth/missing-verification-id": "Nedostaje info sesije",
  "auth/app-deleted": "Aplikacija je obrisana",
  "auth/account-exists-with-different-credential": "Račun postoji s drugim načinom prijave",
  "auth/network-request-failed": "Mrežni zahtjev nije uspio",
  "auth/no-auth-event": "Nema auth događaja",
  "auth/no-such-provider": "Provider ne postoji",
  "auth/null-user": "Korisnik ne postoji",
  "auth/operation-not-supported-in-this-environment": "Operacija nije podržana u ovom okruženju",
  "auth/popup-blocked": "Pop-up je blokiran",
  "auth/popup-closed-by-user": "Pop-up zatvoren",
  "auth/provider-already-linked": "Provider je već povezan",
  "auth/quota-exceeded": "Kvota je premašena. Pokušaj kasnije.",
  "auth/recaptcha-not-enabled": "reCAPTCHA nije uključena",
  "auth/redirect-cancelled-by-user": "Preusmjeravanje otkazano",
  "auth/redirect-operation-pending": "Preusmjeravanje u toku",
  "auth/rejected-credential": "Vjerodajnica odbijena",
  "auth/second-factor-already-in-use": "Drugi faktor je već aktivan",
  "auth/maximum-second-factor-count-exceeded": "Prekoračen limit drugog faktora",
  "auth/tenant-id-mismatch": "Tenant ID se ne poklapa",
  "auth/timeout": "Isteklo vrijeme",
  "auth/user-token-expired": "Token je istekao",
  "auth/unauthorized-continue-uri": "Neautorizovan URL",
  "auth/unsupported-first-factor": "Nepodržan prvi faktor",
  "auth/unsupported-persistence-type": "Nepodržana persistencija",
  "auth/unsupported-tenant-operation": "Nepodržana tenant operacija",
  "auth/unverified-email": "E-mail nije potvrđen",
  "auth/user-cancelled": "Otkazano",
  "auth/user-mismatch": "Korisnik se ne poklapa",
  "auth/user-signed-out": "Korisnik odjavljen",
  "auth/weak-password": "Lozinka je preslaba.",
  "auth/web-storage-unsupported": "Web storage nije podržan",
  "auth/missing-email": "E-mail je obavezan. Unesi e-mail i pokušaj ponovo.",
};

const getFirebaseAuthErrorDetails = (errorLike) => {
  if (!errorLike) return { code: "", message: "" };

  if (typeof errorLike === "string") {
    return { code: errorLike, message: "" };
  }

  const code =
    errorLike?.code ||
    errorLike?.error?.code ||
    errorLike?.customData?._tokenResponse?.error?.message ||
    "";
  const message =
    errorLike?.message ||
    errorLike?.error?.message ||
    errorLike?.customData?._tokenResponse?.error?.message ||
    "";

  return { code, message };
};

// Error handling function
export const handleFirebaseAuthError = (errorLike) => {
  const { code, message } = getFirebaseAuthErrorDetails(errorLike);
  const resolvedCode = typeof code === "string" ? code.trim() : "";

  // Always log full auth failure details for production debugging.
  console.error("Firebase auth error", {
    code: resolvedCode || null,
    message: message || null,
    raw: errorLike,
  });

  if (resolvedCode && ERROR_CODES.hasOwnProperty(resolvedCode)) {
    toast.error(ERROR_CODES[resolvedCode]);
    return;
  }

  // Keep the user-facing toast clean even for non-Firebase/runtime errors.
  const fallbackMessage = "Neočekivana greška. Pokušaj ponovo." || "Došlo je do greške.";
  toast.error(fallbackMessage);

};

export const truncate = (text, maxLength) => {
  // Check if text is undefined or null
  if (!text) {
    return ""; // or handle the case as per your requirement
  }

  const stringText = String(text);

  // If the text length is less than or equal to maxLength, return the original text
  if (stringText.length <= maxLength) {
    return text;
  } else {
    // Otherwise, truncate the text to maxLength characters and append ellipsis
    return stringText?.slice(0, maxLength) + "...";
  }
};

export const loadStripeApiKey = () => {
  const STRIPEData = getSafeState()?.Settings;
  const StripeKey = STRIPEData?.data?.stripe_publishable_key;
  if (StripeKey) {
    ``;
    return StripeKey;
  }
  return false;
};

export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove all characters that are not lowercase letters, digits, spaces, or hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading or trailing hyphens
};

export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};

// Create a temporary element to measure the width of category names

export const measureCategoryWidth = (categoryName) => {
  const tempElement = document.createElement("span");
  tempElement.style.display = "inline-block";
  tempElement.style.visibility = "hidden";
  tempElement.style.position = "absolute";
  tempElement.innerText = categoryName;
  document.body.appendChild(tempElement);
  const width = tempElement.offsetWidth + 15; //icon width(12) + gap(3) between category and icon
  document.body.removeChild(tempElement);
  return width;
};

export const calculateRatingPercentages = (ratings) => {
  // Initialize counters for each star rating
  const ratingCount = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  // Count the number of each star rating
  ratings?.forEach((rating) => {
    const roundedRating = Math.round(rating?.ratings); // Round down to the nearest whole number
    if (roundedRating >= 1 && roundedRating <= 5) {
      ratingCount[roundedRating] += 1;
    }
  });

  // Get the total number of ratings
  const totalRatings = ratings.length;

  // Calculate the percentage for each rating
  const ratingPercentages = {
    5: (ratingCount[5] / totalRatings) * 100,
    4: (ratingCount[4] / totalRatings) * 100,
    3: (ratingCount[3] / totalRatings) * 100,
    2: (ratingCount[2] / totalRatings) * 100,
    1: (ratingCount[1] / totalRatings) * 100,
  };

  return { ratingCount, ratingPercentages };
};

export const isPdf = (url) => url?.toLowerCase().endsWith(".pdf");

export const extractYear = (dateString) => {
  const date = new Date(dateString);
  return date.getFullYear();
};

export const isValidURL = (url) => {
  const pattern = /^(ftp|http|https):\/\/[^ "]+$/;
  return pattern.test(url);
};

export const formatResponseTimeBs = (avgMinutes) => {
  if (avgMinutes == null) return null;

  const minutesRaw = Number(avgMinutes);
  if (!Number.isFinite(minutesRaw) || minutesRaw <= 0) return null;

  const plural = (n, one, few, many) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
    return many;
  };

  if (minutesRaw < 60) {
    const m = Math.max(1, Math.round(minutesRaw));
    return `${m} ${plural(m, "minutu", "minute", "minuta")}`;
  }

  if (minutesRaw < 60 * 24) {
    const h = Math.max(1, Math.round(minutesRaw / 60));
    return `${h} ${plural(h, "sat", "sata", "sati")}`;
  }

  const d = Math.max(1, Math.round(minutesRaw / (60 * 24)));
  return `${d} ${plural(d, "dan", "dana", "dana")}`;
};


export const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return "Sada";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays === 1) {
    return "Jučer";
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths}mo`;
  } else {
    return `${diffInYears}y`;
  }
};

export const formatChatMessageTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const langCode = store
    .getState()
    ?.CurrentLanguage?.language?.code?.toLowerCase();
  const locale = languageLocaleMap?.[langCode] || "en-US";

  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24h format
  });
};

export const formatDateMonthYear = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);

  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatMessageDate = (dateString) => {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return "Danas";
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Jučer";
  } else {
    return formatDateMonthYear(dateString); // d/m/yyyy
  }
};

export const getYouTubeVideoId = (url) => {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url?.match(regExp);
  if (match) {
    return match && match[2].length === 11 ? match[2] : null;
  } else {
    return false;
  }
};

export const validateExtraDetails = ({
  languages,
  defaultLangId,
  extraDetails,
  customFields,
  filePreviews,
}) => {
  for (const lang of languages) {
    const current = extraDetails?.[lang.id] || {};
    const previews = filePreviews?.[lang.id] || {};
    const isDefaultLang = lang.id === defaultLangId;
    const langLabel = isDefaultLang ? "" : `${lang.name}: `;

    for (const field of customFields) {
      const { id, name, type, required, is_required, min_length } = field;

      const requiredValue = required ?? is_required ?? 0;

      // Skip non-textbox fields in non-default languages
      if (!isDefaultLang && type !== "textbox") continue;

      const value = current[id];

      const isValueEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);

      const isRequired = isDefaultLang && requiredValue === 1;
      const shouldValidate = isRequired || (!isValueEmpty && !isDefaultLang);

      if (!shouldValidate) continue;

      const showError = (msg) => {
        toast.error(`${langLabel}${msg}`);
      };

      // === Required Validation
      const isMissing =
        (["textbox", "number", "radio", "dropdown"].includes(type) &&
          isValueEmpty) ||
        (type === "checkbox" &&
          (!Array.isArray(value) || value.length === 0)) ||
        (type === "fileinput" && !value && !previews[id]);

      if (isRequired && isMissing) {
        const key = ["checkbox", "radio"].includes(type)
          ? "Odaberi barem jednu vrijednost za"
          : "Popuni detalje za";
        showError(`${key} ${name}.`);
        return false;
      }

      // === Min Length Validation
      if (value && min_length && ["textbox", "number"].includes(type)) {
        const valStr = String(type === "textbox" ? value.trim() : value);
        if (valStr.length < min_length) {
          const lengthError =
            type === "number"
              ? `${"mora imati najmanje"} ${min_length} ${"cifara"}`
              : `${"mora imati najmanje"} ${min_length} ${"znakova"}`;
          showError(`${name} ${lengthError}`);
          return false;
        }
      }
    }
  }

  return true;
};

const urlToFile = async (url, filename) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

export const prefillExtraDetails = ({
  data,
  languages,
  defaultLangId,
  extraFieldValue,
  setFilePreviews,
}) => {
  const tempExtraDetails = {};

  languages.forEach((lang) => {
    const isDefault = lang.id === defaultLangId;
    const perLang = {};
    data.forEach(async (field) => {
      const fieldId = field.id;

      if (!isDefault && field.type !== "textbox") return;

      const extraField = extraFieldValue.find(
        (item) => item.language_id === lang.id && item.id === fieldId
      );
      const fieldValue = extraField?.value || null;

      switch (field.type) {
        case "checkbox":
          perLang[fieldId] = fieldValue || [];
          break;

        case "radio":
          perLang[fieldId] = fieldValue ? fieldValue[0] : "";
          break;

        case "fileinput":
          if (isDefault && fieldValue?.length) {
            const fileUrl = fieldValue[0];

            // update preview immediately
            setFilePreviews?.((prev) => ({
              ...prev,
              [fieldId]: {
                url: fileUrl,
                isPdf: isPdf(fileUrl),
              },
            }));

            // convert URL → File (binary) for payload
            const file = await urlToFile(fileUrl, `prefilled-${fieldId}`);
            perLang[fieldId] = file;
          } else {
            perLang[fieldId] = "";
          }
          break;

        default:
          perLang[fieldId] = fieldValue ? fieldValue[0] : "";
      }
    });

    tempExtraDetails[lang.id] = perLang;
  });

  return tempExtraDetails;
};

export const prefillVerificationDetails = ({
  data,
  languages,
  defaultLangId,
  extraFieldValue,
  setFilePreviews,
}) => {
  const tempExtraDetails = {};

  languages.forEach((lang) => {
    const isDefault = lang.id === defaultLangId;
    const perLang = {};
    data.forEach((field) => {
      const fieldId = field.id;

      if (!isDefault && field.type !== "textbox") return;

      const extraField = extraFieldValue.find(
        (item) => item.language_id === lang.id && item.id === fieldId
      );
      const fieldValue = extraField?.value || null;
      switch (field.type) {
        case "checkbox":
          perLang[fieldId] = fieldValue || [];
          break;

        case "radio":
          perLang[fieldId] = fieldValue ? fieldValue[0] : "";
          break;

        case "fileinput":
          if (isDefault && fieldValue?.length) {
            setFilePreviews?.((prev) => ({
              ...prev,
              [fieldId]: {
                url: fieldValue[0],
                isPdf: isPdf(fieldValue[0]),
              },
            }));
          }
          perLang[fieldId] = "";
          break;

        default:
          perLang[fieldId] = fieldValue ? fieldValue[0] : "";
      }
    });

    tempExtraDetails[lang.id] = perLang;
  });

  return tempExtraDetails;
};

export const getMainDetailsTranslations = (
  listingData,
  languages,
  defaultLangId
) => {
  const parseBooleanSetting = (value, fallback = false) => {
    if (value === true || value === 1 || value === "1") return true;
    if (value === false || value === 0 || value === "0") return false;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "da", "yes", "on", "enabled"].includes(normalized)) return true;
      if (["false", "ne", "no", "off", "disabled"].includes(normalized)) return false;
    }
    return fallback;
  };

  const translations = {};
  const areaM2 = extractAreaM2FromItem(listingData);
  const initialPerSquare = toPositiveNumber(listingData?.price_per_unit);
  const hasPersistedPrice =
    listingData?.price !== undefined &&
    listingData?.price !== null &&
    String(listingData?.price).trim() !== "";
  const inferredPriceOnRequestFromPrice = hasPersistedPrice && Number(listingData?.price) === 0;
  const inferredPerSquareMode = inferRealEstatePerSquareMode({
    perSquarePrice: listingData?.price_per_unit,
    totalPrice: listingData?.price,
    areaM2,
  });

  // Fill translations for all languages
  languages.forEach((lang) => {
    const isDefault = lang.id === defaultLangId;

    if (isDefault) {
      const region = listingData?.region_code?.toUpperCase() || ""; // react-phone-number-input expects uppercase region code
      const countryCodeFromRegion = region ? getCountryCallingCode(region) : "";

      // Default language gets full data
      translations[lang.id] = {
        name: listingData?.name || "",
        description: listingData?.description || "",
        price: listingData?.price || "",
        contact: listingData?.contact || "",
        video_link: listingData?.video_link || "",
        slug: listingData?.slug || "",
        min_salary: listingData?.min_salary || "",
        max_salary: listingData?.max_salary || "",
        region_code: listingData?.region_code?.toLowerCase() || "",
        country_code: countryCodeFromRegion,
        price_on_request: parseBooleanSetting(
          listingData?.price_on_request ??
            listingData?.is_price_on_request ??
            listingData?.translated_item?.price_on_request ??
            listingData?.translated_item?.is_price_on_request ??
            inferredPriceOnRequestFromPrice,
          false
        ),
        is_on_sale: listingData?.is_on_sale || false,
        old_price: listingData?.old_price || "",
        inventory_count:
          listingData?.inventory_count !== undefined && listingData?.inventory_count !== null
            ? String(listingData.inventory_count)
            : "",
        price_per_unit:
          listingData?.price_per_unit !== undefined && listingData?.price_per_unit !== null
            ? String(listingData.price_per_unit)
            : "",
        show_price_per_m2: Boolean(initialPerSquare),
        price_per_m2_mode: initialPerSquare ? inferredPerSquareMode : "auto",
        minimum_order_quantity:
          listingData?.minimum_order_quantity !== undefined && listingData?.minimum_order_quantity !== null
            ? String(listingData.minimum_order_quantity)
            : "",
        stock_alert_threshold:
          listingData?.stock_alert_threshold !== undefined && listingData?.stock_alert_threshold !== null
            ? String(listingData.stock_alert_threshold)
            : "",
        seller_product_code: listingData?.seller_product_code || "",
        scarcity_enabled: parseBooleanSetting(
          listingData?.scarcity_enabled ??
          listingData?.is_scarcity_enabled ??
          listingData?.translated_item?.scarcity_enabled ??
          false
        ),
        scarcity_toggle_locked_until:
          listingData?.scarcity_toggle_locked_until ||
          listingData?.translated_item?.scarcity_toggle_locked_until ||
          "",
        scarcity_last_toggled_at:
          listingData?.scarcity_last_toggled_at ||
          listingData?.translated_item?.scarcity_last_toggled_at ||
          "",
      };
    } else {
      // Other languages: get translation if available
      const translated = listingData?.translations?.find(
        (tr) => tr.language_id === lang.id
      );

      translations[lang.id] = {
        name: translated?.name || "",
        description: translated?.description || "",
      };
    }
  });

  return translations;
};

export const filterNonDefaultTranslations = (translations, defaultLangId) => {
  const result = {};

  for (const langId in translations) {
    if (Number(langId) === Number(defaultLangId)) continue;

    const fields = translations[langId];
    const filteredFields = {};

    for (const key in fields) {
      const value = fields[key];
      if (
        value !== undefined &&
        value !== null &&
        typeof value === "string" &&
        value.trim() !== ""
      ) {
        filteredFields[key] = value.trim();
      }
    }

    if (Object.keys(filteredFields).length > 0) {
      result[langId] = filteredFields;
    }
  }

  return JSON.stringify(result);
};

export const prepareCustomFieldTranslations = (extraDetails = {}) => {
  const result = {};

  for (const langId in extraDetails) {
    const fields = extraDetails[langId];
    const cleanedFields = {};

    for (const fieldId in fields) {
      const value = fields[fieldId];

      if (
        Array.isArray(value) &&
        value.length > 0 &&
        !(value[0] instanceof File)
      ) {
        cleanedFields[fieldId] = value;
      } else if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(value instanceof File)
      ) {
        cleanedFields[fieldId] = [String(value)];
      }
    }

    if (Object.keys(cleanedFields).length > 0) {
      result[langId] = cleanedFields;
    }
  }

  return JSON.stringify(result);
};

export const prepareCustomFieldFiles = (extraDetails, defaultLangId) => {
  const customFieldFiles = [];
  const defaultLangFields = extraDetails?.[defaultLangId] || {};

  Object.entries(defaultLangFields).forEach(([fieldId, value]) => {
    if (value instanceof File) {
      customFieldFiles.push({ key: fieldId, files: [value] });
    } else if (Array.isArray(value) && value[0] instanceof File) {
      customFieldFiles.push({ key: fieldId, files: value });
    }
  });

  return customFieldFiles;
};

export const handleKeyDown = (e, maxLength) => {
  if (maxLength === null || maxLength === undefined) {
    return;
  }
  const value = e.target.value;
  // Allow control keys (Backspace, Delete, Arrow keys, etc.)
  const controlKeys = [
    "Backspace",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Delete",
    "Tab",
  ];

  if (value.length >= maxLength && !controlKeys.includes(e.key)) {
    e.preventDefault();
  }
};

export const inpNum = (e) => {
  e = e || window.event;
  var charCode = typeof e.which == "undefined" ? e.keyCode : e.which;
  var charStr = String.fromCharCode(charCode);
  if (!charStr.match(/^[0-9]+$/)) {
    e.preventDefault();
  }
};

export const getFilteredCustomFields = (
  allTranslatedFields,
  currentLanguageId
) => {
  const fields = Array.isArray(allTranslatedFields) ? allTranslatedFields : [];
  const fieldMap = new Map();

  for (const field of fields) {
    const id = field.id;
    const val =
      field.type === "fileinput"
        ? field.value
        : field.translated_selected_values;

    const isEmpty =
      val === null ||
      val === "" ||
      (Array.isArray(val) &&
        (val.length === 0 ||
          (val.length === 1 && (val[0] === "" || val[0] === null))));

    if (isEmpty) continue;

    // Prefer current language or store the first available
    if (!fieldMap.has(id) || field.language_id === currentLanguageId) {
      fieldMap.set(id, field);
    }
  }

  return Array.from(fieldMap.values());
};

export const updateMetadata = ({ title, description }) => {
  if (title) {
    document.title = title;
  }
  if (description) {
    // Update description meta
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement("meta");
      descTag.name = "description";
      document.head.appendChild(descTag);
    }
    descTag.setAttribute("content", description);
    // Generate keywords from description
    const keywords = generateKeywords(description);
    if (keywords) {
      let keywordsTag = document.querySelector('meta[name="keywords"]');
      if (!keywordsTag) {
        keywordsTag = document.createElement("meta");
        keywordsTag.name = "keywords";
        document.head.appendChild(keywordsTag);
      }
      keywordsTag.setAttribute("content", keywords);
    }
  }
};
