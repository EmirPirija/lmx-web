import { parsePhoneNumberFromString } from "libphonenumber-js/max";

const sanitizeCountryCode = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return `+${raw.slice(1).replace(/\D/g, "")}`;
  return `+${raw.replace(/\D/g, "")}`;
};

const sanitizeLocalDigits = (value = "") => {
  return String(value || "").replace(/\D/g, "");
};

export const buildPhoneE164 = (countryCode = "", formattedNumber = "") => {
  const normalizedCountryCode = sanitizeCountryCode(countryCode);
  const normalizedLocal = sanitizeLocalDigits(formattedNumber);
  const fallback = `${normalizedCountryCode}${normalizedLocal}`;

  if (!normalizedCountryCode || !normalizedLocal) {
    return fallback;
  }

  const parsed = parsePhoneNumberFromString(fallback);
  if (parsed?.isValid() || parsed?.isPossible()) {
    return parsed.number;
  }

  return fallback;
};

export const maskPhoneForDebug = (value = "") => {
  const digits = sanitizeLocalDigits(value);
  if (!digits) return "unknown";
  if (digits.length <= 4) return "*".repeat(digits.length);
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
};
