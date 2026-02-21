export const LMX_PHONE_ALLOWED_COUNTRIES = ["ba", "rs", "hr", "si", "me"];

export const LMX_PHONE_DIAL_CODE_BY_COUNTRY = {
  ba: "387",
  rs: "381",
  hr: "385",
  si: "386",
  me: "382",
};

const normalizeIso2 = (value = "") => String(value || "").trim().toLowerCase();

const envDefaultCountry = normalizeIso2(process.env.NEXT_PUBLIC_DEFAULT_COUNTRY);

export const LMX_PHONE_DEFAULT_COUNTRY = LMX_PHONE_ALLOWED_COUNTRIES.includes(envDefaultCountry)
  ? envDefaultCountry
  : "ba";

export const resolveLmxPhoneCountry = (value) => {
  const normalized = normalizeIso2(value);
  if (LMX_PHONE_ALLOWED_COUNTRIES.includes(normalized)) return normalized;
  return LMX_PHONE_DEFAULT_COUNTRY;
};

export const resolveLmxPhoneDialCode = (value) => {
  const normalized = resolveLmxPhoneCountry(value);
  return LMX_PHONE_DIAL_CODE_BY_COUNTRY[normalized] || LMX_PHONE_DIAL_CODE_BY_COUNTRY.ba;
};

export const LMX_PHONE_INPUT_PROPS = {
  containerClass: "lmx-phone-field !w-full",
  inputClass:
    "!w-full !h-11 !rounded-xl !border !border-border !bg-background !pl-[4.2rem] !pr-3 !text-sm !text-foreground placeholder:!text-muted-foreground focus:!border-primary focus:!ring-2 focus:!ring-primary/20",
  buttonClass:
    "!h-11 !w-[3.6rem] !rounded-l-xl !border-0 !bg-transparent hover:!bg-muted",
  dropdownClass:
    "!rounded-xl !border !border-border !bg-card !text-foreground !shadow-xl",
  searchClass:
    "!rounded-lg !border !border-border !bg-background !text-foreground",
  onlyCountries: LMX_PHONE_ALLOWED_COUNTRIES,
  preferredCountries: LMX_PHONE_ALLOWED_COUNTRIES,
  preserveOrder: ["onlyCountries", "preferredCountries"],
  localization: {
    ba: "Bosna i Hercegovina",
    rs: "Srbija",
    hr: "Hrvatska",
    si: "Slovenija",
    me: "Crna Gora",
  },
  enableLongNumbers: true,
};
