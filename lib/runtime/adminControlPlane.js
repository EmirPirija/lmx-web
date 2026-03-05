const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

const toBooleanFlag = (value, fallback = false) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const normalized = String(value).trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (normalized === "0" || normalized === "false" || normalized === "off") {
    return false;
  }
  return fallback;
};

const toStringValue = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  const trimmed = String(value).trim();
  return trimmed || fallback;
};

const normalizeSettingsPayload = (payload) => {
  if (!payload || typeof payload !== "object") return {};
  const maybeData = payload?.data;
  if (maybeData && typeof maybeData === "object" && !Array.isArray(maybeData)) {
    return maybeData;
  }
  return payload;
};

export const extractAdminControlPlane = (payload) => {
  const settings = normalizeSettingsPayload(payload);

  return {
    maintenanceMode: toBooleanFlag(settings.maintenance_mode),
    forceUpdate: toBooleanFlag(settings.force_update),
    showLandingPage: toBooleanFlag(settings.show_landing_page),
    authProviders: {
      email: toBooleanFlag(settings.email_authentication, true),
      mobile: toBooleanFlag(settings.mobile_authentication, true),
      google: toBooleanFlag(settings.google_authentication, true),
      apple: toBooleanFlag(settings.apple_authentication ?? settings.apple_authenticaion, false),
    },
    mapProvider: toStringValue(settings.map_provider, "google_places"),
    freeAdListing: toBooleanFlag(settings.free_ad_listing),
    otpServiceProvider: toStringValue(settings.otp_service_provider, "firebase"),
    features: {
      realtimeEventsEnabled: toBooleanFlag(settings.realtime_events_enabled, true),
      pushNotificationsEnabled: toBooleanFlag(settings.push_notifications_enabled, true),
      liveTrackingEnabled: toBooleanFlag(settings.live_tracking_enabled, true),
      engagementTrackingEnabled: toBooleanFlag(settings.engagement_tracking_enabled, true),
      frontendObservabilityEnabled: toBooleanFlag(
        settings.frontend_observability_enabled,
        true,
      ),
    },
    branding: {
      companyName: toStringValue(settings.company_name, "LMX"),
      webThemeColor: toStringValue(settings.web_theme_color, ""),
      faviconIcon: toStringValue(settings.favicon_icon, ""),
      placeholderImage: toStringValue(settings.placeholder_image, ""),
    },
    appLinks: {
      appStoreLink: toStringValue(settings.app_store_link, ""),
      playStoreLink: toStringValue(settings.play_store_link, ""),
      deepLinkScheme: toStringValue(settings.deep_link_scheme, ""),
    },
  };
};

export const normalizeSystemSettingsEnvelope = (payload) => {
  const settings = normalizeSettingsPayload(payload);
  return {
    error: false,
    data: settings,
  };
};
