"use client";

import { toast as sonnerToast } from "sonner";

const DEFAULT_BY_TYPE = {
  success: "Radnja je uspješno završena.",
  error: "Došlo je do greške. Pokušajte ponovo.",
  warning: "Provjerite unesene podatke.",
  info: "Obavijest je ažurirana.",
  loading: "Učitavanje u toku...",
  default: "Obavijest je ažurirana.",
};

const DIRECT_MAP = {
  // ključevi/slugovi
  errorOccurred: "Došlo je do greške.",
  pleaseSelectReason: "Odaberite razlog.",
  pleaseProvideReason: "Unesite razlog.",
  permissionRequired: "Potrebna je dozvola za ovu radnju.",
  uploadMainPicture: "Dodajte glavnu fotografiju.",
  completeDetails: "Popunite sva obavezna polja.",
  invalidPhoneNumber: "Unesite ispravan broj telefona.",
  enterValidSalaryMin: "Unesite ispravan minimalni iznos plate.",
  enterValidSalaryMax: "Unesite ispravan maksimalni iznos plate.",
  salaryMinCannotBeEqualMax: "Minimalna i maksimalna plata ne mogu biti iste.",
  salaryMinCannotBeGreaterThanMax: "Minimalna plata ne može biti veća od maksimalne.",
  enterValidPrice: "Unesite ispravnu cijenu.",
  addValidSlug: "Unesite ispravan slug.",
  enterValidUrl: "Unesite ispravan URL.",
  pleaseSelectCity: "Odaberite grad.",
  selectCategory: "Odaberite kategoriju.",
  notAllowedFile: "Format datoteke nije dozvoljen.",
  locationNotGranted: "Dozvola za lokaciju nije odobrena.",
  geoLocationNotSupported: "Geolokacija nije podržana u ovom pregledniku.",
  locationSaved: "Lokacija je sačuvana.",
  pleaseSelectLocation: "Odaberite lokaciju.",
  errorFetchingAds: "Greška pri učitavanju oglasa.",
  openLocationSettings: "Otvorite postavke lokacije.",
  useLocationModal: "Koristite prozor za promjenu lokacije.",
  failedToLike: "Ažuriranje omiljenih nije uspjelo.",
  userNotFound: "Korisnik nije pronađen.",
  emailRequired: "E-mail je obavezan.",
  emailInvalid: "Unesite ispravan e-mail.",
  usernameRequired: "Korisničko ime je obavezno.",
  passwordRequired: "Lozinka je obavezna.",
  passwordTooShort: "Lozinka je prekratka.",
  verifyEmailFirst: "Prvo potvrdite e-mail adresu.",
  resetPassword: "Link za reset lozinke je poslan.",
  otpSentSuccess: "OTP kod je uspješno poslan.",
  failedToSendOtp: "Slanje OTP koda nije uspjelo.",
  otpmissing: "Unesite OTP kod.",
  invalidPhoneNumberOrEmail: "Unesite ispravan broj telefona ili e-mail.",
  failedToLoadPackages: "Greška pri učitavanju paketa.",
  pleaseSelectPackage: "Odaberite paket.",
  purchasePackageFirst: "Prvo kupite odgovarajući paket.",
  thankForContacting: "Hvala vam na javljanju.",
  signOutSuccess: "Uspješno ste odjavljeni.",
  purchasePlan: "Za ovu opciju potrebno je aktivno članstvo.",
  userDeleteSuccess: "Račun je uspješno obrisan.",
  deletePop: "Brisanje računa nije uspjelo.",
  offerSentSuccessfully: "Ponuda je uspješno poslana.",
  unableToSendOffer: "Ponudu trenutno nije moguće poslati.",
  paymentSuccess: "Plaćanje je uspješno završeno.",
  paymentCancelled: "Plaćanje je otkazano.",
  paymentFailed: "Plaćanje nije uspjelo.",
  paymentConfirmed: "Uplata je potvrđena.",
  receiptUploaded: "Potvrda uplate je uspješno učitana.",
  errorProcessingPayment: "Došlo je do greške pri obradi plaćanja.",
  addMobileNumberToProceed: "Dodajte broj telefona da nastavite.",
  statusUpdated: "Status je uspješno ažuriran.",
  verificationDoneAlready: "Verifikacija je već završena.",
  verificationAlreadyInReview: "Verifikacija je već u procesu pregleda.",
  copyToClipboard: "Kopirano u međuspremnik.",
  microphoneAccessDenied: "Pristup mikrofonu je odbijen.",
  noMicrophoneFound: "Mikrofon nije pronađen.",
  somethingWentWrong: "Došlo je do neočekivane greške.",

  // često korištene engleske fraze
  "Failed to complete signup": "Registracija nije dovršena. Pokušajte ponovo.",
  "Failed to process recording": "Obrada audio snimka nije uspjela.",
  "Failed to send message": "Slanje poruke nije uspjelo.",
  "Error sending message": "Greška pri slanju poruke.",
  "Link copied": "Link je kopiran.",
  "Link copied to clipboard": "Link je kopiran u međuspremnik.",
  Copied: "Kopirano.",
  Loading: "Učitavanje...",
  Start: "Početak",
  "User logged in successfully": "Uspješno ste prijavljeni.",
  "User logged in succesfully": "Uspješno ste prijavljeni.",
  "Logged in successfully": "Uspješno ste prijavljeni.",
  "Logged in succesfully": "Uspješno ste prijavljeni.",
  "Successfully logged in": "Uspješno ste prijavljeni.",
  "Login successful": "Uspješno ste prijavljeni.",
  "User logged out successfully": "Uspješno ste odjavljeni.",
  "Logged out successfully": "Uspješno ste odjavljeni.",
  "User registered successfully": "Račun je uspješno kreiran.",
  "Registered successfully": "Račun je uspješno kreiran.",
  "Registration successful": "Račun je uspješno kreiran.",
  "OTP sent successfully": "OTP kod je uspješno poslan.",
  "Verification code sent successfully": "Verifikacijski kod je uspješno poslan.",
  "Invalid credentials": "Uneseni podaci nisu ispravni.",
  "Invalid credential": "Uneseni podaci nisu ispravni.",
  Unauthorized: "Nemate dozvolu za ovu radnju.",
  unauthorised: "Nemate dozvolu za ovu radnju.",
};

const ENGLISH_REGEX = /\b(failed|error|success|succes|successful|saved|deleted|updated|created|invalid|please|try again|loading|copied|signup|login|logged|logout|upload|download|message|payment|cancelled|not found|unable|required|warning|credentials|unauthorized|forbidden|verification code)\b/i;

const BOSNIAN_HINT_REGEX = /[čćžšđ]|\b(grešk|uspješ|uspješn|pokušaj|molimo|obavez|učitav|sačuv|obri|poruk|račun|odjav|prijav|ne može|nije usp|dodat|ažur|lokacij|pretr|članst|ponud|plaćan|verifik|potvrd|upit|obavijest)\b/i;

const isObjectLike = (value) => value !== null && typeof value === "object";

const normalizeWhitespace = (text) =>
  String(text || "")
    .replace(/\s+/g, " ")
    .trim();

const maybeKey = (text) => /^[a-z][a-zA-Z0-9_\-]{2,}$/.test(text);

const fallbackByType = (type) => DEFAULT_BY_TYPE[type] || DEFAULT_BY_TYPE.default;

export const toBosnianToastMessage = (input, type = "default") => {
  if (typeof input !== "string") {
    return input ?? fallbackByType(type);
  }

  const msg = normalizeWhitespace(input);
  if (!msg) return fallbackByType(type);

  if (DIRECT_MAP[msg]) return DIRECT_MAP[msg];

  const lower = msg.toLowerCase();
  if (DIRECT_MAP[lower]) return DIRECT_MAP[lower];

  if (maybeKey(msg) && DIRECT_MAP[msg]) {
    return DIRECT_MAP[msg];
  }

  // Backend čestice na engleskom
  if (
    (lower.includes("logged in") || lower.includes("log in")) &&
    (lower.includes("success") || lower.includes("succes"))
  ) {
    return "Uspješno ste prijavljeni.";
  }
  if (
    (lower.includes("logged out") || lower.includes("log out")) &&
    (lower.includes("success") || lower.includes("succes"))
  ) {
    return "Uspješno ste odjavljeni.";
  }
  if (
    (lower.includes("register") || lower.includes("sign up")) &&
    (lower.includes("success") || lower.includes("succes"))
  ) {
    return "Račun je uspješno kreiran.";
  }
  if (
    lower.includes("otp") &&
    (lower.includes("sent") || lower.includes("send")) &&
    (lower.includes("success") || lower.includes("succes") || lower.includes("accepted"))
  ) {
    return "OTP kod je uspješno poslan.";
  }
  if (lower.includes("invalid credential")) {
    return "Uneseni podaci nisu ispravni.";
  }
  if (lower.includes("insufficient") && lower.includes("balance")) {
    return "Nemate dovoljno sredstava za ovu radnju.";
  }
  if (lower.includes("unauthorized") || lower.includes("forbidden")) {
    return "Nemate dozvolu za ovu radnju.";
  }
  if (lower.includes("not found")) {
    return "Traženi podatak nije pronađen.";
  }
  if (lower.includes("too many requests")) {
    return "Previše zahtjeva u kratkom periodu. Pokušajte ponovo za trenutak.";
  }

  if (BOSNIAN_HINT_REGEX.test(msg)) {
    return msg;
  }

  if (ENGLISH_REGEX.test(msg)) {
    return fallbackByType(type);
  }

  // Ako je poruka nepoznata, ali nije očigledno engleska, ostavi je.
  return msg;
};

const wrapMethod = (method, type) => (message, ...rest) =>
  sonnerToast[method](toBosnianToastMessage(message, type), ...rest);

const normalizePromiseMessages = (messages) => {
  if (typeof messages === "string") {
    return toBosnianToastMessage(messages, "info");
  }

  if (!isObjectLike(messages)) {
    return messages;
  }

  const normalized = { ...messages };

  if (typeof normalized.loading === "string") {
    normalized.loading = toBosnianToastMessage(normalized.loading, "loading");
  }

  if (typeof normalized.success === "string") {
    normalized.success = toBosnianToastMessage(normalized.success, "success");
  } else if (typeof normalized.success === "function") {
    const original = normalized.success;
    normalized.success = (...args) => toBosnianToastMessage(original(...args), "success");
  }

  if (typeof normalized.error === "string") {
    normalized.error = toBosnianToastMessage(normalized.error, "error");
  } else if (typeof normalized.error === "function") {
    const original = normalized.error;
    normalized.error = (...args) => toBosnianToastMessage(original(...args), "error");
  }

  return normalized;
};

const toast = (message, ...rest) => sonnerToast(toBosnianToastMessage(message, "default"), ...rest);

toast.success = wrapMethod("success", "success");
toast.error = wrapMethod("error", "error");
toast.warning = wrapMethod("warning", "warning");
toast.info = wrapMethod("info", "info");
toast.loading = wrapMethod("loading", "loading");

toast.promise = (promise, messages, ...rest) =>
  sonnerToast.promise(promise, normalizePromiseMessages(messages), ...rest);

toast.custom = sonnerToast.custom;
toast.dismiss = sonnerToast.dismiss;
toast.message = wrapMethod("message", "default");

toast.toBosnianToastMessage = toBosnianToastMessage;

export { toast };
