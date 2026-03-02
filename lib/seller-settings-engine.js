import {
  PHONE_CONTACT_STATES,
  isQuietHoursActive,
  parseCardPreferences,
  resolvePublicQuestionsPreference,
  resolveSellerContactNumber,
  resolveSellerContactPolicy,
  resolveSellerEmailVerification,
  resolveSellerPhoneContactState,
  toBoolLoose,
} from "@/lib/seller-contact";

export const SELLER_SETTINGS_ENGINE_VERSION = 2;

export const SELLER_NAME_DISPLAY_MODES = {
  FULL_NAME: "full_name",
  FIRST_NAME: "first_name",
  LAST_NAME: "last_name",
  USERNAME: "username",
};

export const SELLER_CARD_PREFERENCES_DEFAULTS = {
  show_ratings: true,
  show_badges: true,
  show_member_since: false,
  show_response_time: true,
  show_online_status: true,
  show_reel_hint: true,
  highlight_contact_button: false,
  show_business_hours: true,
  show_shipping_info: true,
  show_return_policy: true,
  enable_buyer_filters: true,
  buyer_filters_show_search: true,
  buyer_filters_show_category: true,
  buyer_filters_show_price: true,
  buyer_filters_show_video: true,
  buyer_filters_show_on_sale: true,
  buyer_filters_show_featured: true,
  phone_visible_only_to_logged_in: false,
  messages_only_contact: false,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
  quiet_hours_message: "Posaljite poruku, odgovaram cim budem dostupan.",
  allow_public_questions_contact: true,
  max_badges: 2,
  identity_first_name: "",
  identity_last_name: "",
  identity_display_mode: SELLER_NAME_DISPLAY_MODES.USERNAME,
};

const BOOL_PREF_KEYS = [
  "show_ratings",
  "show_badges",
  "show_member_since",
  "show_response_time",
  "show_online_status",
  "show_reel_hint",
  "highlight_contact_button",
  "show_business_hours",
  "show_shipping_info",
  "show_return_policy",
  "enable_buyer_filters",
  "buyer_filters_show_search",
  "buyer_filters_show_category",
  "buyer_filters_show_price",
  "buyer_filters_show_video",
  "buyer_filters_show_on_sale",
  "buyer_filters_show_featured",
  "phone_visible_only_to_logged_in",
  "messages_only_contact",
  "quiet_hours_enabled",
  "allow_public_questions_contact",
];

const clamp = (value, min, max, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
};

const normalizeTime = (value, fallback) => {
  const source = String(value || "").trim();
  if (!/^\d{2}:\d{2}$/.test(source)) return fallback;
  const [hh, mm] = source.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return fallback;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return fallback;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const normalizeIdentityDisplayMode = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === SELLER_NAME_DISPLAY_MODES.FULL_NAME) {
    return SELLER_NAME_DISPLAY_MODES.FULL_NAME;
  }
  if (normalized === SELLER_NAME_DISPLAY_MODES.FIRST_NAME) {
    return SELLER_NAME_DISPLAY_MODES.FIRST_NAME;
  }
  if (normalized === SELLER_NAME_DISPLAY_MODES.LAST_NAME) {
    return SELLER_NAME_DISPLAY_MODES.LAST_NAME;
  }
  return SELLER_NAME_DISPLAY_MODES.USERNAME;
};

const normalizePreferenceAliases = (preferences = {}) => {
  const next = { ...preferences };

  if (next.phone_visible_only_to_logged_in == null) {
    next.phone_visible_only_to_logged_in =
      next.phone_only_for_logged_users ?? next.phone_requires_login;
  }
  if (next.messages_only_contact == null) {
    next.messages_only_contact = next.chat_only_contact;
  }
  if (next.quiet_hours_enabled == null) {
    next.quiet_hours_enabled = next.contact_quiet_hours_enabled;
  }
  if (!next.quiet_hours_start) {
    next.quiet_hours_start = next.contact_quiet_hours_start;
  }
  if (!next.quiet_hours_end) {
    next.quiet_hours_end = next.contact_quiet_hours_end;
  }
  if (!next.quiet_hours_message) {
    next.quiet_hours_message = next.contact_quiet_hours_message;
  }
  if (next.allow_public_questions_contact == null) {
    next.allow_public_questions_contact =
      next.allow_public_questions ??
      next.public_questions_enabled ??
      next.accept_public_questions;
  }

  return next;
};

export const normalizeSellerCardPreferences = (
  raw,
  { targetVersion = SELLER_SETTINGS_ENGINE_VERSION } = {},
) => {
  const parsed = normalizePreferenceAliases(parseCardPreferences(raw));
  const merged = { ...SELLER_CARD_PREFERENCES_DEFAULTS, ...parsed };

  const normalized = { ...merged };
  for (const key of BOOL_PREF_KEYS) {
    normalized[key] = toBoolLoose(
      parsed[key],
      SELLER_CARD_PREFERENCES_DEFAULTS[key],
    );
  }

  normalized.quiet_hours_start = normalizeTime(
    parsed.quiet_hours_start,
    SELLER_CARD_PREFERENCES_DEFAULTS.quiet_hours_start,
  );
  normalized.quiet_hours_end = normalizeTime(
    parsed.quiet_hours_end,
    SELLER_CARD_PREFERENCES_DEFAULTS.quiet_hours_end,
  );
  normalized.quiet_hours_message =
    typeof parsed.quiet_hours_message === "string"
      ? parsed.quiet_hours_message
      : SELLER_CARD_PREFERENCES_DEFAULTS.quiet_hours_message;
  normalized.max_badges = clamp(
    parsed.max_badges,
    1,
    5,
    SELLER_CARD_PREFERENCES_DEFAULTS.max_badges,
  );
  normalized.identity_first_name =
    typeof parsed.identity_first_name === "string"
      ? parsed.identity_first_name.trim()
      : SELLER_CARD_PREFERENCES_DEFAULTS.identity_first_name;
  normalized.identity_last_name =
    typeof parsed.identity_last_name === "string"
      ? parsed.identity_last_name.trim()
      : SELLER_CARD_PREFERENCES_DEFAULTS.identity_last_name;
  normalized.identity_display_mode = normalizeIdentityDisplayMode(
    parsed.identity_display_mode,
  );
  normalized.settings_version = targetVersion;

  return normalized;
};

export const normalizeSellerSettingsWithEngine = (
  settings = {},
  { targetVersion = SELLER_SETTINGS_ENGINE_VERSION } = {},
) => {
  const source = settings && typeof settings === "object" ? settings : {};
  const normalizedPrefs = normalizeSellerCardPreferences(
    source.card_preferences,
    {
      targetVersion,
    },
  );

  const sourceVersion = clamp(
    source.settings_version ?? source.settingsVersion ?? source.version,
    1,
    999,
    1,
  );
  const settingsVersion = Math.max(sourceVersion, targetVersion);

  return {
    ...source,
    card_preferences: normalizedPrefs,
    settings_version: settingsVersion,
  };
};

export const buildSellerSettingsPayloadWithEngine = (
  payload = {},
  { targetVersion = SELLER_SETTINGS_ENGINE_VERSION } = {},
) => {
  const normalized = normalizeSellerSettingsWithEngine(payload, {
    targetVersion,
  });
  return {
    ...payload,
    card_preferences: normalized.card_preferences,
    settings_version: normalized.settings_version,
  };
};

export const CONTACT_REASON_CODES = {
  PHONE_HIDDEN: "PHONE_HIDDEN",
  PHONE_MISSING: "PHONE_MISSING",
  PHONE_UNVERIFIED: "PHONE_UNVERIFIED",
  PHONE_LOGIN_REQUIRED: "PHONE_LOGIN_REQUIRED",
  PHONE_VISIBLE_FOR_LOGGED_ONLY: "PHONE_VISIBLE_FOR_LOGGED_ONLY",
  MESSAGES_ONLY: "MESSAGES_ONLY",
  QUIET_HOURS_ENABLED: "QUIET_HOURS_ENABLED",
  QUIET_HOURS_ACTIVE: "QUIET_HOURS_ACTIVE",
};

export const CONTACT_REASON_META = {
  [CONTACT_REASON_CODES.PHONE_HIDDEN]: {
    label: "Broj skriven",
    title: "Telefon",
    message: "Korisnik je sakrio broj telefona.",
    tone: "neutral",
    icon: "phone",
  },
  [CONTACT_REASON_CODES.PHONE_MISSING]: {
    label: "Broj nedostaje",
    title: "Telefon",
    message: "Korisnik nema dodan broj telefona.",
    tone: "neutral",
    icon: "phone",
  },
  [CONTACT_REASON_CODES.PHONE_UNVERIFIED]: {
    label: "Broj nije verifikovan",
    title: "Telefon",
    message: "Broj telefona nije verifikovan.",
    tone: "warning",
    icon: "phone",
  },
  [CONTACT_REASON_CODES.PHONE_LOGIN_REQUIRED]: {
    label: "Broj uz prijavu",
    title: "Telefon",
    message: "Broj telefona je vidljiv samo prijavljenim korisnicima.",
    tone: "info",
    icon: "phone",
  },
  [CONTACT_REASON_CODES.PHONE_VISIBLE_FOR_LOGGED_ONLY]: {
    label: "Broj uz prijavu",
    title: "Telefon",
    message: "Prodavac je ukljucio prikaz broja samo prijavljenima.",
    tone: "info",
    icon: "phone",
  },
  [CONTACT_REASON_CODES.MESSAGES_ONLY]: {
    label: "Samo poruke",
    title: "Kontakt",
    message: "Poziv, WhatsApp i Viber su skriveni. Dostupna je samo poruka.",
    tone: "info",
    icon: "message",
  },
  [CONTACT_REASON_CODES.QUIET_HOURS_ENABLED]: {
    label: "Quiet hours",
    title: "Kontakt",
    message: "Prodavac je postavio period tiseg kontaktiranja.",
    tone: "neutral",
    icon: "clock",
  },
  [CONTACT_REASON_CODES.QUIET_HOURS_ACTIVE]: {
    label: "Quiet hours aktivan",
    title: "Kontakt",
    message: "Trenutno je aktivan period tiseg kontaktiranja.",
    tone: "warning",
    icon: "clock",
  },
};

export const resolveContactReasonMeta = (reasonCode) =>
  CONTACT_REASON_META[reasonCode] || null;

const mapPhoneStateReason = (state) => {
  switch (state) {
    case PHONE_CONTACT_STATES.HIDDEN:
      return CONTACT_REASON_CODES.PHONE_HIDDEN;
    case PHONE_CONTACT_STATES.MISSING:
      return CONTACT_REASON_CODES.PHONE_MISSING;
    case PHONE_CONTACT_STATES.UNVERIFIED:
      return CONTACT_REASON_CODES.PHONE_UNVERIFIED;
    case PHONE_CONTACT_STATES.LOGIN_REQUIRED:
      return CONTACT_REASON_CODES.PHONE_LOGIN_REQUIRED;
    default:
      return null;
  }
};

export const resolveSellerContactEngine = ({
  seller = {},
  settings = {},
  isLoggedIn = false,
  fallbackShowPhone = true,
} = {}) => {
  const normalizedSettings = normalizeSellerSettingsWithEngine(settings);
  const contactPolicy = resolveSellerContactPolicy({
    settings: normalizedSettings,
  });
  const phoneContact = resolveSellerPhoneContactState({
    seller,
    settings: normalizedSettings,
    isLoggedIn,
    contactPolicy,
    fallbackShowPhone,
  });

  const emailVerified = resolveSellerEmailVerification({
    seller,
    settings: normalizedSettings,
  });

  const whatsappNumber = resolveSellerContactNumber({
    value: normalizedSettings?.whatsapp_number || seller?.mobile || "",
    seller,
    settings: normalizedSettings,
  });
  const viberNumber = resolveSellerContactNumber({
    value: normalizedSettings?.viber_number || seller?.mobile || "",
    seller,
    settings: normalizedSettings,
  });

  const channels = {
    chat: true,
    call: phoneContact.canCall,
    whatsapp: Boolean(
      !contactPolicy.messagesOnly &&
      normalizedSettings?.show_whatsapp &&
      whatsappNumber,
    ),
    viber: Boolean(
      !contactPolicy.messagesOnly &&
      normalizedSettings?.show_viber &&
      viberNumber,
    ),
    email: Boolean(
      !contactPolicy.messagesOnly &&
      normalizedSettings?.show_email &&
      seller?.email,
    ),
  };

  const hasDirectContactOptions =
    channels.call || channels.whatsapp || channels.viber || channels.email;

  const reasonCodes = [];
  const phoneStateReason = mapPhoneStateReason(phoneContact.state);
  if (phoneStateReason) reasonCodes.push(phoneStateReason);
  if (contactPolicy.phoneVisibleOnlyToLoggedIn) {
    reasonCodes.push(CONTACT_REASON_CODES.PHONE_VISIBLE_FOR_LOGGED_ONLY);
  }
  if (contactPolicy.messagesOnly) {
    reasonCodes.push(CONTACT_REASON_CODES.MESSAGES_ONLY);
  }
  if (contactPolicy.quietHoursEnabled) {
    reasonCodes.push(CONTACT_REASON_CODES.QUIET_HOURS_ENABLED);
    if (
      isQuietHoursActive({
        enabled: contactPolicy.quietHoursEnabled,
        start: contactPolicy.quietHoursStart,
        end: contactPolicy.quietHoursEnd,
      })
    ) {
      reasonCodes.push(CONTACT_REASON_CODES.QUIET_HOURS_ACTIVE);
    }
  }

  const uniqueReasonCodes = Array.from(new Set(reasonCodes));
  const publicQuestionsEnabled = resolvePublicQuestionsPreference({
    settings: normalizedSettings,
    fallback: true,
  });

  return {
    settings: normalizedSettings,
    settingsVersion: normalizedSettings.settings_version,
    cardPreferences: normalizedSettings.card_preferences,
    contactPolicy,
    phoneContact,
    emailVerified,
    whatsappNumber,
    viberNumber,
    channels,
    hasDirectContactOptions,
    reasonCodes: uniqueReasonCodes,
    publicQuestionsEnabled,
  };
};

export const resolveSellerPublicQuestionsEngine = ({
  settings = {},
  fallback = true,
} = {}) => {
  const normalizedSettings = normalizeSellerSettingsWithEngine(settings);
  return resolvePublicQuestionsPreference({
    settings: normalizedSettings,
    fallback,
  });
};

const safeText = (value) => String(value || "").trim();

export const resolveSellerDisplayIdentity = ({
  seller = {},
  settings = {},
} = {}) => {
  const normalizedSettings = normalizeSellerSettingsWithEngine(settings);
  const cardPreferences = normalizeSellerCardPreferences(
    normalizedSettings?.card_preferences,
  );

  const firstName = safeText(
    cardPreferences.identity_first_name ||
      seller?.first_name ||
      seller?.firstName,
  );
  const lastName = safeText(
    cardPreferences.identity_last_name || seller?.last_name || seller?.lastName,
  );
  const username = safeText(
    seller?.username || seller?.user_name || seller?.nickname || seller?.name,
  );
  const fullName = safeText([firstName, lastName].filter(Boolean).join(" "));

  return {
    firstName,
    lastName,
    username,
    fullName,
    displayMode: normalizeIdentityDisplayMode(
      cardPreferences.identity_display_mode,
    ),
  };
};

export const resolveSellerDisplayName = ({
  seller = {},
  settings = {},
} = {}) => {
  const identity = resolveSellerDisplayIdentity({ seller, settings });

  if (
    identity.displayMode === SELLER_NAME_DISPLAY_MODES.FULL_NAME &&
    identity.fullName
  ) {
    return identity.fullName;
  }
  if (
    identity.displayMode === SELLER_NAME_DISPLAY_MODES.FIRST_NAME &&
    identity.firstName
  ) {
    return identity.firstName;
  }
  if (
    identity.displayMode === SELLER_NAME_DISPLAY_MODES.LAST_NAME &&
    identity.lastName
  ) {
    return identity.lastName;
  }

  return identity.username || identity.fullName || "Prodavač";
};
