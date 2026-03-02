const TRUE_VALUES = new Set([
  "1",
  "true",
  "yes",
  "y",
  "on",
  "enabled",
  "da",
  "approved",
  "verified",
  "confirm",
  "confirmed",
  "active",
  "verificiran",
  "verifikovan",
]);
const FALSE_VALUES = new Set([
  "0",
  "false",
  "no",
  "n",
  "off",
  "disabled",
  "ne",
  "unverified",
  "not_verified",
  "not verified",
  "not-verified",
  "pending",
  "rejected",
  "declined",
  "inactive",
  "unknown",
]);

const pickDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

export const toBoolLoose = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (TRUE_VALUES.has(normalized)) return true;
    if (FALSE_VALUES.has(normalized)) return false;
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) return parsed > 0;
    return fallback;
  }
  return Boolean(value);
};

export const parseCardPreferences = (raw) => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof raw === "object" ? raw : {};
};

export const resolveSellerPhone = ({ seller = {}, settings = {} } = {}) => {
  const value = pickDefined(
    seller?.mobile,
    seller?.phone,
    seller?.phone_number,
    seller?.phoneNumber,
    seller?.contact_phone,
    seller?.contactPhone,
    seller?.user?.mobile,
    seller?.user?.phone,
    seller?.user?.phone_number,
    seller?.user?.phoneNumber,
    settings?.mobile,
    settings?.phone,
    settings?.phone_number,
    settings?.phoneNumber,
    settings?.contact_phone,
    settings?.contactPhone,
    settings?.user?.mobile,
    settings?.user?.phone,
    settings?.user?.phone_number,
    settings?.user?.phoneNumber,
  );
  return String(value || "").trim();
};

const resolvePhoneVerifiedFlag = ({ seller = {}, settings = {} } = {}) => {
  const value = pickDefined(
    seller?.phone_verified,
    seller?.phoneVerified,
    seller?.mobile_verified,
    seller?.mobileVerified,
    seller?.phone_verification_status,
    seller?.mobile_verification_status,
    seller?.mark_phone_verified,
    seller?.markPhoneVerified,
    seller?.verification?.phone_verified,
    seller?.verification?.mobile_verified,
    seller?.verification?.phone_status,
    seller?.verification?.mobile_status,
    seller?.is_phone_verified,
    seller?.isPhoneVerified,
    seller?.is_mobile_verified,
    seller?.isMobileVerified,
    seller?.user?.phone_verified,
    seller?.user?.phoneVerified,
    seller?.user?.mobile_verified,
    seller?.user?.mobileVerified,
    seller?.user?.phone_verification_status,
    seller?.user?.mobile_verification_status,
    seller?.user?.mark_phone_verified,
    seller?.user?.markPhoneVerified,
    seller?.user?.verification?.phone_verified,
    seller?.user?.verification?.mobile_verified,
    seller?.user?.verification?.phone_status,
    seller?.user?.verification?.mobile_status,
    settings?.phone_verified,
    settings?.phoneVerified,
    settings?.mobile_verified,
    settings?.mobileVerified,
    settings?.phone_verification_status,
    settings?.mobile_verification_status,
    settings?.mark_phone_verified,
    settings?.markPhoneVerified,
    settings?.verification?.phone_verified,
    settings?.verification?.mobile_verified,
    settings?.verification?.phone_status,
    settings?.verification?.mobile_status,
  );

  const hasVerificationTimestamp = [
    seller?.phone_verified_at,
    seller?.mobile_verified_at,
    seller?.user?.phone_verified_at,
    seller?.user?.mobile_verified_at,
    settings?.phone_verified_at,
    settings?.mobile_verified_at,
  ].some((entry) => Boolean(entry));

  if (hasVerificationTimestamp) return true;
  if (value === undefined || value === null || value === "") return null;
  return toBoolLoose(value, false);
};

export const resolvePhoneVerificationFromSources = (...sources) => {
  const flatSources = sources
    .flat()
    .filter((source) => source && typeof source === "object");

  if (!flatSources.length) return null;

  let hasExplicitFalse = false;

  for (const source of flatSources) {
    const result = resolvePhoneVerifiedFlag({ seller: source, settings: source });
    if (result === true) return true;
    if (result === false) hasExplicitFalse = true;
  }

  return hasExplicitFalse ? false : null;
};

export const PHONE_CONTACT_STATES = {
  AVAILABLE: "available",
  HIDDEN: "hidden",
  MISSING: "missing",
  UNVERIFIED: "unverified",
  LOGIN_REQUIRED: "login_required",
  MESSAGES_ONLY: "messages_only",
};

export const PHONE_CONTACT_MESSAGES = {
  [PHONE_CONTACT_STATES.HIDDEN]: "Korisnik je sakrio broj telefona.",
  [PHONE_CONTACT_STATES.MISSING]: "Korisnik nije unio broj telefona.",
  [PHONE_CONTACT_STATES.UNVERIFIED]: "Broj telefona nije verifikovan.",
  [PHONE_CONTACT_STATES.LOGIN_REQUIRED]:
    "Broj telefona je vidljiv samo prijavljenim korisnicima.",
  [PHONE_CONTACT_STATES.MESSAGES_ONLY]:
    "Prodavač je uključio opciju 'Samo poruke'.",
};

const resolveTimeValue = (value, fallback) => {
  const normalized = String(value || "").trim();
  if (!/^\d{2}:\d{2}$/.test(normalized)) return fallback;
  const [hh, mm] = normalized.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return fallback;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return fallback;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const timeToMinutes = (value) => {
  if (!/^\d{2}:\d{2}$/.test(String(value || ""))) return null;
  const [hh, mm] = String(value).split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
};

export const isQuietHoursActive = ({
  enabled = false,
  start = "22:00",
  end = "08:00",
  now = new Date(),
} = {}) => {
  if (!enabled) return false;
  const from = timeToMinutes(start);
  const to = timeToMinutes(end);
  if (from === null || to === null || from === to) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  if (from < to) return current >= from && current < to;
  return current >= from || current < to;
};

export const resolveSellerContactPolicy = ({
  settings = {},
  fallback = {},
} = {}) => {
  const preferences = parseCardPreferences(settings?.card_preferences);

  const phoneVisibleOnlyToLoggedIn = toBoolLoose(
    pickDefined(
      preferences?.phone_visible_only_to_logged_in,
      preferences?.phone_only_for_logged_users,
      preferences?.phone_requires_login,
      settings?.phone_visible_only_to_logged_in,
      fallback?.phoneVisibleOnlyToLoggedIn,
    ),
    Boolean(fallback?.phoneVisibleOnlyToLoggedIn),
  );

  const messagesOnly = toBoolLoose(
    pickDefined(
      preferences?.messages_only_contact,
      preferences?.chat_only_contact,
      settings?.messages_only_contact,
      fallback?.messagesOnly,
    ),
    Boolean(fallback?.messagesOnly),
  );

  const quietHoursEnabled = toBoolLoose(
    pickDefined(
      preferences?.quiet_hours_enabled,
      preferences?.contact_quiet_hours_enabled,
      settings?.quiet_hours_enabled,
      fallback?.quietHoursEnabled,
    ),
    Boolean(fallback?.quietHoursEnabled),
  );

  const quietHoursStart = resolveTimeValue(
    pickDefined(
      preferences?.quiet_hours_start,
      preferences?.contact_quiet_hours_start,
      settings?.quiet_hours_start,
      fallback?.quietHoursStart,
    ),
    "22:00",
  );

  const quietHoursEnd = resolveTimeValue(
    pickDefined(
      preferences?.quiet_hours_end,
      preferences?.contact_quiet_hours_end,
      settings?.quiet_hours_end,
      fallback?.quietHoursEnd,
    ),
    "08:00",
  );

  const quietHoursMessage = String(
    pickDefined(
      preferences?.quiet_hours_message,
      preferences?.contact_quiet_hours_message,
      settings?.quiet_hours_message,
      fallback?.quietHoursMessage,
      settings?.auto_reply_message,
    ) || "",
  ).trim();

  return {
    phoneVisibleOnlyToLoggedIn,
    messagesOnly,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    quietHoursMessage,
    quietHoursActive: isQuietHoursActive({
      enabled: quietHoursEnabled,
      start: quietHoursStart,
      end: quietHoursEnd,
    }),
  };
};

export const resolveSellerPhoneContactState = ({
  seller = {},
  settings = {},
  isLoggedIn = false,
  contactPolicy = null,
  fallbackShowPhone = true,
} = {}) => {
  const phone = resolveSellerPhone({ seller, settings });
  const hasPhone = Boolean(phone);
  const isPhoneVisible = toBoolLoose(settings?.show_phone, fallbackShowPhone);
  const phoneVerified = resolvePhoneVerifiedFlag({ seller, settings });
  const policy = contactPolicy || resolveSellerContactPolicy({ settings });

  let state = PHONE_CONTACT_STATES.AVAILABLE;
  if (policy.messagesOnly) state = PHONE_CONTACT_STATES.MESSAGES_ONLY;
  else if (!isPhoneVisible) state = PHONE_CONTACT_STATES.HIDDEN;
  else if (policy.phoneVisibleOnlyToLoggedIn && !isLoggedIn)
    state = PHONE_CONTACT_STATES.LOGIN_REQUIRED;
  else if (!hasPhone) state = PHONE_CONTACT_STATES.MISSING;
  else if (phoneVerified === false) state = PHONE_CONTACT_STATES.UNVERIFIED;

  return {
    state,
    phone,
    hasPhone,
    isPhoneVisible,
    isPhoneVerified: phoneVerified,
    requiresLogin: policy.phoneVisibleOnlyToLoggedIn,
    messagesOnly: policy.messagesOnly,
    canCall:
      state === PHONE_CONTACT_STATES.AVAILABLE ||
      state === PHONE_CONTACT_STATES.UNVERIFIED,
    statusMessage: PHONE_CONTACT_MESSAGES[state] || "",
  };
};

export const resolveSellerEmailVerification = ({
  seller = {},
  settings = {},
} = {}) => {
  const value = pickDefined(
    seller?.email_verified,
    seller?.emailVerified,
    seller?.is_email_verified,
    seller?.isEmailVerified,
    seller?.user?.email_verified,
    seller?.user?.emailVerified,
    settings?.email_verified,
    settings?.emailVerified,
  );

  if (value === undefined || value === null || value === "") return null;
  return toBoolLoose(value, false);
};

export const resolvePublicQuestionsPreference = ({
  settings = {},
  fallback = true,
} = {}) => {
  const preferences = parseCardPreferences(settings?.card_preferences);
  const value = pickDefined(
    settings?.allow_public_questions_contact,
    settings?.allow_public_questions,
    settings?.public_questions_enabled,
    settings?.accept_public_questions,
    preferences?.allow_public_questions_contact,
    preferences?.allow_public_questions,
    preferences?.public_questions_enabled,
    preferences?.accept_public_questions,
  );

  return toBoolLoose(value, fallback);
};
