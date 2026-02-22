"use client";

const STORAGE_KEY = "lmx_device_login_profiles_v1";
const REMEMBER_KEY = "lmx_device_login_remember_v1";
const LAST_USED_PROFILE_KEY = "lmx_device_login_last_used_profile_v1";
const MAX_PROFILES = 6;

const isBrowser = () => typeof window !== "undefined";

const safeParse = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeText = (value) => String(value || "").trim();

const getStoredLastUsedKey = () => {
  if (!isBrowser()) return "";
  return normalizeText(window.localStorage.getItem(LAST_USED_PROFILE_KEY));
};

const setStoredLastUsedKey = (value) => {
  if (!isBrowser()) return;
  const normalized = normalizeText(value);
  if (!normalized) {
    window.localStorage.removeItem(LAST_USED_PROFILE_KEY);
    return;
  }
  window.localStorage.setItem(LAST_USED_PROFILE_KEY, normalized);
};

const normalizeProfile = (profile = {}) => ({
  key:
    normalizeText(profile.key) ||
    normalizeText(profile.email)?.toLowerCase() ||
    normalizeText(profile.mobile) ||
    normalizeText(profile.userId),
  userId: normalizeText(profile.userId),
  name: normalizeText(profile.name),
  email: normalizeText(profile.email).toLowerCase(),
  mobile: normalizeText(profile.mobile),
  profile: normalizeText(profile.profile),
  method: normalizeText(profile.method) || "email",
  identifier:
    normalizeText(profile.identifier) ||
    normalizeText(profile.email).toLowerCase() ||
    normalizeText(profile.mobile),
  lastUsedAt: Number(profile.lastUsedAt) || Date.now(),
});

const cleanupProfiles = (profiles = []) => {
  const next = profiles
    .map((profile) => normalizeProfile(profile))
    .filter((profile) => profile.key && (profile.email || profile.mobile || profile.identifier));

  const deduped = [];
  const seen = new Set();

  for (const profile of next.sort((a, b) => b.lastUsedAt - a.lastUsedAt)) {
    if (seen.has(profile.key)) continue;
    seen.add(profile.key);
    deduped.push(profile);
    if (deduped.length >= MAX_PROFILES) break;
  }

  return deduped;
};

const orderProfiles = (profiles = [], lastUsedKey = "") => {
  const normalizedKey = normalizeText(lastUsedKey);
  const ordered = [...profiles].sort((a, b) => {
    const aPinned = Boolean(normalizedKey) && a.key === normalizedKey;
    const bPinned = Boolean(normalizedKey) && b.key === normalizedKey;

    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1;
    }

    return b.lastUsedAt - a.lastUsedAt;
  });

  return ordered.slice(0, MAX_PROFILES);
};

export const getRememberMePreference = () => {
  if (!isBrowser()) return true;
  const raw = window.localStorage.getItem(REMEMBER_KEY);
  if (raw == null) return true;
  return raw === "1";
};

export const setRememberMePreference = (value) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(REMEMBER_KEY, value ? "1" : "0");
};

export const getDeviceLoginProfiles = () => {
  if (!isBrowser()) return [];
  const profiles = safeParse(window.localStorage.getItem(STORAGE_KEY));
  const cleaned = cleanupProfiles(profiles);

  let lastUsedKey = getStoredLastUsedKey();
  const hasLastUsedInList = lastUsedKey
    ? cleaned.some((profile) => profile.key === lastUsedKey)
    : false;

  if (!hasLastUsedInList && cleaned.length > 0) {
    lastUsedKey = cleaned[0].key;
    setStoredLastUsedKey(lastUsedKey);
  } else if (!cleaned.length) {
    setStoredLastUsedKey("");
  }

  const ordered = orderProfiles(cleaned, lastUsedKey);

  if (JSON.stringify(ordered) !== JSON.stringify(profiles)) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ordered));
  }
  return ordered;
};

export const getLastUsedDeviceProfileKey = () => {
  if (!isBrowser()) return "";
  return getStoredLastUsedKey();
};

export const removeDeviceLoginProfile = (profileKey) => {
  if (!isBrowser()) return [];
  const key = normalizeText(profileKey);
  if (!key) return getDeviceLoginProfiles();

  const next = getDeviceLoginProfiles().filter((profile) => profile.key !== key);
  const lastUsedKey = getStoredLastUsedKey();
  if (lastUsedKey === key) {
    setStoredLastUsedKey(next[0]?.key || "");
  }
  const ordered = orderProfiles(next, getStoredLastUsedKey());
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ordered));
  return ordered;
};

export const upsertDeviceLoginProfile = (payload, meta = {}) => {
  if (!isBrowser()) return [];

  const rememberMe = meta?.rememberMe !== false;

  const user = payload?.data || payload || {};
  const name = normalizeText(meta?.nameOverride || user?.name || user?.displayName);
  const email = normalizeText(meta?.identifier || user?.email).toLowerCase();
  const mobile = normalizeText(user?.mobile);
  const profile = normalizeText(user?.profile || user?.image);
  const userId = normalizeText(user?.id);

  const key = email || mobile || userId;

  if (!key) return getDeviceLoginProfiles();

  // Ako korisnik ne želi "zapamti me", ukloni postojeći zapis i izađi.
  if (!rememberMe) {
    const filtered = getDeviceLoginProfiles().filter((item) => item.key !== key);
    if (getStoredLastUsedKey() === key) {
      setStoredLastUsedKey(filtered[0]?.key || "");
    }
    const ordered = orderProfiles(filtered, getStoredLastUsedKey());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ordered));
    return ordered;
  }

  const profileRecord = normalizeProfile({
    key,
    userId,
    name,
    email,
    mobile,
    profile,
    method: normalizeText(meta?.method || "email"),
    identifier: email || mobile,
    lastUsedAt: Date.now(),
  });

  const existing = getDeviceLoginProfiles();
  const merged = cleanupProfiles([
    profileRecord,
    ...existing.filter((item) => item.key !== profileRecord.key),
  ]);
  setStoredLastUsedKey(profileRecord.key);
  const ordered = orderProfiles(merged, profileRecord.key);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ordered));
  return ordered;
};
