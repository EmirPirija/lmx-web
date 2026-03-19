"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "@/utils/toastBs";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { resolveAvatarUrl } from "@/utils/avatar";
import UserAvatarMedia from "@/components/Common/UserAvatar";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { getAuth, onAuthStateChanged, updateEmail } from "firebase/auth";

import {
  User,
  Phone,
  MapPin,
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  Camera,
  BadgeCheck,
  Loader2,
  Info,
  ArrowRight,
  Link2,
} from "@/components/Common/UnifiedIconPack";

import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import CustomLink from "@/components/Common/CustomLink";
import {
  isLocationComplete,
  resolveLocationSelection,
} from "@/lib/bih-locations";
import {
  LMX_PHONE_DEFAULT_COUNTRY,
  LMX_PHONE_INPUT_PROPS,
  resolveLmxPhoneCountry,
} from "@/components/Common/phoneInputTheme";
import {
  normalizeSellerCardPreferences,
  SELLER_NAME_DISPLAY_MODES,
} from "@/lib/seller-settings-engine";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import ProfileSkeleton from "@/components/Profile/ProfileSkeleton";

import { loadUpdateUserData, userSignUpData } from "@/redux/reducer/authSlice";
import { Fcmtoken, settingsData } from "@/redux/reducer/settingSlice";

import {
  authApi,
  getUserInfoApi,
  getVerificationStatusApi,
  updateProfileApi,
  sellerSettingsApi,
} from "@/utils/api";

import { useUserLocation } from "@/hooks/useUserLocation";

// ============================================
// PROFILE AVATAR
// ============================================
function ProfileAvatar({
  customAvatarUrl,
  size = "lg",
  onImageClick,
  verificationSource = null,
  verificationSources = [],
}) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  };

  return (
    <div className="relative group">
      <UserAvatarMedia
        sources={[customAvatarUrl]}
        verificationSource={verificationSource}
        showVerifiedBadge
        verificationSources={verificationSources}
        alt="Profilna slika"
        className={`${sizeClasses[size]} rounded-2xl border-2 border-slate-100 shadow-sm dark:border-slate-700`}
        roundedClassName="rounded-2xl"
        imageClassName={`${sizeClasses[size]} object-cover`}
      />

      {onImageClick && (
        <button
          onClick={onImageClick}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
}

// ============================================
// VERIFICATION BADGE
// ============================================
function VerificationBadge({ status, reason }) {
  const configs = {
    approved: {
      icon: BadgeCheck,
      text: "Verifikovan",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    pending: {
      icon: Clock,
      text: "Na čekanju",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    resubmitted: {
      icon: Clock,
      text: "Ponovo poslano",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    rejected: {
      icon: AlertCircle,
      text: "Odbijeno",
      className: "bg-red-100 text-red-700 border-red-200",
    },
    default: {
      icon: Shield,
      text: "Verifikuj se",
      className: "bg-primary text-white border-primary",
      isLink: true,
    },
  };

  const config = configs[status] || configs.default;
  const Icon = config.icon;

  if (config.isLink) {
    return (
      <CustomLink
        href="/user-verification"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-90",
          config.className,
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.text}
      </CustomLink>
    );
  }

  return (
    <div className="space-y-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
          config.className,
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.text}
      </span>
      {status === "rejected" && reason && (
        <p className="text-xs text-red-600">{reason}</p>
      )}
    </div>
  );
}

// ============================================
// SETTING CARD
// ============================================
function SettingCard({ icon: Icon, title, description, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ============================================
// TOGGLE SETTING
// ============================================
function ToggleSetting({
  label,
  description,
  checked,
  onChange,
  disabled,
  saving,
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {saving && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled || saving}
        />
      </div>
    </div>
  );
}

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

const normalizeCountryCode = (value) => digitsOnly(value || "387");

const normalizeMobileLocal = (mobileValue, countryCodeValue) => {
  const phoneDigits = digitsOnly(mobileValue);
  const countryDigits = normalizeCountryCode(countryCodeValue);
  if (!phoneDigits) return "";
  if (countryDigits && phoneDigits.startsWith(countryDigits)) {
    return phoneDigits.slice(countryDigits.length);
  }
  return phoneDigits;
};

const isValidEmailLoose = (value) => {
  const email = String(value || "").trim();
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

const normalizeUsernameValue = (value) => String(value || "").trim();

const isValidUsernameValue = (value) =>
  USERNAME_REGEX.test(normalizeUsernameValue(value));

const splitFullName = (value) => {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!cleaned || !cleaned.includes(" ")) {
    return { firstName: "", lastName: "" };
  }
  const [firstName, ...rest] = cleaned.split(" ");
  return {
    firstName: String(firstName || "").trim(),
    lastName: String(rest.join(" ") || "").trim(),
  };
};

const parseCardPreferencesSafe = (value) => {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" ? { ...value } : {};
};

const normalizeProfileDisplayMode = (value) => {
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

const resolveProfileDisplayName = ({
  username = "",
  firstName = "",
  lastName = "",
  displayMode = SELLER_NAME_DISPLAY_MODES.USERNAME,
} = {}) => {
  const safeUsername = normalizeUsernameValue(username);
  const safeFirstName = String(firstName || "").trim();
  const safeLastName = String(lastName || "").trim();
  const safeFullName = [safeFirstName, safeLastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (displayMode === SELLER_NAME_DISPLAY_MODES.FULL_NAME && safeFullName) {
    return safeFullName;
  }
  if (displayMode === SELLER_NAME_DISPLAY_MODES.FIRST_NAME && safeFirstName) {
    return safeFirstName;
  }
  if (displayMode === SELLER_NAME_DISPLAY_MODES.LAST_NAME && safeLastName) {
    return safeLastName;
  }

  return safeUsername || safeFullName || safeFirstName || safeLastName || "";
};

const normalizeComparable = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const DUPLICATE_HINTS = [
  "already",
  "exists",
  "duplicate",
  "zauzet",
  "zauzeto",
  "već postoji",
  "vec postoji",
  "already in use",
];
const EMAIL_HINTS = ["email", "e-mail", "mail"];
const NAME_HINTS = ["name", "ime", "username", "korisnick", "nickname", "nick"];
const PHONE_HINTS = ["phone", "mobile", "telefon", "broj"];
const NOT_FOUND_HINTS = [
  "not found",
  "nije prona",
  "ne postoji",
  "not registered",
  "nije registro",
];
const NOT_FOUND_REASONS = new Set([
  "identifier_not_found",
  "email_not_found",
  "user_not_found",
  "not_found",
  "phone_not_registered",
]);

const extractErrorSearchText = (errorLike) => {
  const responseData =
    errorLike?.response?.data || errorLike?.data || errorLike || {};
  const message = String(
    responseData?.message || errorLike?.message || "",
  ).trim();
  const reason = String(
    responseData?.data?.reason || errorLike?.apiReason || "",
  ).trim();
  const fieldErrors = Object.values(responseData?.errors || {})
    .flat()
    .map((entry) => String(entry || ""))
    .join(" ");
  return normalizeComparable(`${message} ${reason} ${fieldErrors}`);
};

const inferDuplicateField = (errorLike) => {
  const text = extractErrorSearchText(errorLike);
  if (!DUPLICATE_HINTS.some((hint) => text.includes(hint))) {
    return null;
  }
  if (EMAIL_HINTS.some((hint) => text.includes(hint))) return "email";
  if (NAME_HINTS.some((hint) => text.includes(hint))) return "name";
  if (PHONE_HINTS.some((hint) => text.includes(hint))) return "phone";
  return "generic";
};

const getDuplicateMessage = (errorLike) => {
  const field = inferDuplicateField(errorLike);
  if (field === "email") return "E-mail je već zauzet.";
  if (field === "name") return "Korisničko ime je već zauzeto.";
  if (field === "phone")
    return "Broj telefona je već povezan s drugim računom.";
  if (field === "generic")
    return "Uneseni podaci već postoje. Provjerite e-mail i korisničko ime.";
  return "";
};

const extractResolvedUserId = (payload) => {
  const candidates = [
    payload?.id,
    payload?.user_id,
    payload?.userId,
    payload?.user?.id,
  ];
  const found = candidates.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );
  return found ? String(found).trim() : "";
};

const extractResolvedEmail = (payload) => {
  const candidates = [payload?.email, payload?.user?.email];
  const found = candidates.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );
  return normalizeComparable(found || "");
};

const isSameResolvedUser = ({ payload, currentUserId, currentEmail }) => {
  if (!payload || typeof payload !== "object") return false;
  const resolvedId = extractResolvedUserId(payload);
  const resolvedEmail = extractResolvedEmail(payload);
  const normalizedCurrentId = String(currentUserId || "").trim();
  const normalizedCurrentEmail = normalizeComparable(currentEmail || "");

  if (normalizedCurrentId && resolvedId && normalizedCurrentId === resolvedId) {
    return true;
  }
  if (
    normalizedCurrentEmail &&
    resolvedEmail &&
    normalizedCurrentEmail === resolvedEmail
  ) {
    return true;
  }
  return false;
};

const resolveIdentifierOwnerSafe = async ({
  identifier,
  identifierType,
} = {}) => {
  const normalizedIdentifier = String(identifier || "").trim();
  if (!normalizedIdentifier) return null;

  try {
    const response = await authApi.resolveLoginIdentifier({
      identifier: normalizedIdentifier,
      identifier_type: identifierType || undefined,
    });
    const payload = response?.data?.data;

    if (response?.data?.error === true) {
      const reason = normalizeComparable(payload?.reason || "");
      const message = normalizeComparable(response?.data?.message || "");
      if (
        NOT_FOUND_REASONS.has(reason) ||
        NOT_FOUND_HINTS.some((hint) => message.includes(hint))
      ) {
        return null;
      }
    }

    if (!payload || typeof payload !== "object") return null;
    const hasIdentity = Boolean(
      extractResolvedUserId(payload) ||
      extractResolvedEmail(payload) ||
      String(payload?.mobile || "").trim() ||
      String(payload?.identifier || "").trim() ||
      String(payload?.name || "").trim(),
    );
    return hasIdentity ? payload : null;
  } catch (error) {
    const status = Number(error?.response?.status || 0);
    const reason = normalizeComparable(
      error?.response?.data?.data?.reason || error?.apiReason || "",
    );
    const message = normalizeComparable(
      error?.response?.data?.message || error?.message || "",
    );
    if (
      status === 404 ||
      NOT_FOUND_REASONS.has(reason) ||
      NOT_FOUND_HINTS.some((hint) => message.includes(hint)) ||
      status >= 500
    ) {
      return null;
    }
    return null;
  }
};

const extractFirebaseProviderIds = (firebaseUser) =>
  Array.isArray(firebaseUser?.providerData)
    ? firebaseUser.providerData
        .map((provider) => String(provider?.providerId || "").trim())
        .filter(Boolean)
    : [];

// ============================================
// MAIN COMPONENT
// ============================================
export default function Profile() {
  const UserData = useSelector(userSignUpData);
  const IsLoggedIn = UserData !== undefined && UserData !== null;
  const settings = useSelector(settingsData);
  const fetchFCM = useSelector(Fcmtoken);
  const placeholder_image = settings?.placeholder_image;

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);

  // Profile state
  const [profileImage, setProfileImage] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [sellerSettingsData, setSellerSettingsData] = useState(null);
  const [identityData, setIdentityData] = useState({
    firstName: "",
    lastName: "",
    displayMode: SELLER_NAME_DISPLAY_MODES.USERNAME,
  });
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notification: 1,
    show_personal_details: 0,
    region_code: "",
    country_code: "",
  });

  // BiH location
  const { userLocation, saveLocation } = useUserLocation();
  const [bihLocation, setBihLocation] = useState({
    entityId: null,
    cityId: null,
    regionId: null,
    municipalityId: null,
    address: "",
    formattedAddress: "",
  });

  // Verification
  const [verificationStatus, setVerificationStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [publicProfileUrl, setPublicProfileUrl] = useState("");
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [firebaseProviderIds, setFirebaseProviderIds] = useState([]);
  const [firebaseAuthEmail, setFirebaseAuthEmail] = useState("");

  // Refs
  const initialDataRef = useRef(null);
  const initialIdentityRef = useRef({
    firstName: "",
    lastName: "",
    displayMode: SELLER_NAME_DISPLAY_MODES.USERNAME,
  });
  const fileInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Effects
  useEffect(() => {
    if (isLocationComplete(userLocation)) {
      setBihLocation(userLocation);
    }
  }, [userLocation]);

  useEffect(() => {
    const auth = getAuth();
    const syncIdentity = (firebaseUser) => {
      setFirebaseProviderIds(extractFirebaseProviderIds(firebaseUser));
      setFirebaseAuthEmail(
        String(firebaseUser?.email || "")
          .trim()
          .toLowerCase(),
      );
    };
    syncIdentity(auth.currentUser);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      syncIdentity(firebaseUser);
    });
    return () => unsubscribe?.();
  }, []);

  const isGoogleOnlyIdentity = useMemo(() => {
    const providers = new Set(firebaseProviderIds);
    return providers.has("google.com") && !providers.has("password");
  }, [firebaseProviderIds]);

  const emailChangeDisabledReason = isGoogleOnlyIdentity
    ? "Email je vezan za Google nalog i ne može se mijenjati ovdje. Promjena emaila radi se na Google računu."
    : "";
  const isEmailChangeDisabled = Boolean(emailChangeDisabledReason);
  const profileDisplayOptions = useMemo(
    () => [
      {
        value: SELLER_NAME_DISPLAY_MODES.FULL_NAME,
        label: "Ime i prezime",
      },
      {
        value: SELLER_NAME_DISPLAY_MODES.FIRST_NAME,
        label: "Samo ime",
      },
      {
        value: SELLER_NAME_DISPLAY_MODES.LAST_NAME,
        label: "Samo prezime",
      },
      {
        value: SELLER_NAME_DISPLAY_MODES.USERNAME,
        label: "Korisničko ime",
      },
    ],
    [],
  );
  const profileVisibleName = useMemo(
    () =>
      resolveProfileDisplayName({
        username: formData.name,
        firstName: identityData.firstName,
        lastName: identityData.lastName,
        displayMode: identityData.displayMode,
      }) || "Vaš profil",
    [
      formData.name,
      identityData.firstName,
      identityData.lastName,
      identityData.displayMode,
    ],
  );

  useEffect(() => {
    if (!IsLoggedIn) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      let loadedUser = null;
      let loadedSellerSettings = null;
      try {
        const [verificationRes, userRes, sellerRes] = await Promise.allSettled([
          getVerificationStatusApi.getVerificationStatus(),
          getUserInfoApi.getUserInfo(),
          sellerSettingsApi.getSettings(),
        ]);

        // Verification (non-blocking)
        if (verificationRes.status === "fulfilled") {
          if (verificationRes.value?.data?.error === true) {
            setVerificationStatus("not applied");
          } else {
            setVerificationStatus(
              verificationRes.value?.data?.data?.status || "",
            );
            setRejectionReason(
              verificationRes.value?.data?.data?.rejection_reason || "",
            );
          }
        } else {
          setVerificationStatus("not applied");
          setRejectionReason("");
          console.warn(
            "Verification status unavailable:",
            verificationRes.reason,
          );
        }

        // User data (required)
        if (
          userRes.status === "fulfilled" &&
          userRes.value?.data?.error === false
        ) {
          const d = userRes.value.data.data;
          loadedUser = d;
          const region = (d?.region_code || "ba").toLowerCase();
          const countryCode = normalizeCountryCode(d?.country_code);
          const phone = normalizeMobileLocal(d?.mobile, countryCode);

          const nextForm = {
            name: d?.name || "",
            email: d?.email || "",
            phone,
            address: d?.address || "",
            notification: d?.notification ?? 1,
            show_personal_details: Number(d?.show_personal_details) || 0,
            region_code: region,
            country_code: countryCode,
          };

          setFormData(nextForm);
          const normalizedBackendEmail = normalizeComparable(d?.email || "");
          const auth = getAuth();
          const firebaseUser = auth.currentUser;
          const normalizedFirebaseEmail = normalizeComparable(
            firebaseUser?.email || firebaseAuthEmail,
          );
          const providerIds = new Set(extractFirebaseProviderIds(firebaseUser));
          const isGoogleOnly =
            providerIds.has("google.com") && !providerIds.has("password");

          if (
            normalizedBackendEmail &&
            isValidEmailLoose(normalizedBackendEmail) &&
            firebaseUser &&
            !isGoogleOnly &&
            normalizedBackendEmail !== normalizedFirebaseEmail
          ) {
            try {
              await updateEmail(firebaseUser, normalizedBackendEmail);
              setFirebaseAuthEmail(normalizedBackendEmail);
            } catch (firebaseSyncError) {
              const code = String(firebaseSyncError?.code || "");
              if (
                code !== "auth/requires-recent-login" &&
                code !== "auth/operation-not-allowed"
              ) {
                console.warn(
                  "Neuspjelo usklađivanje Firebase e-maila:",
                  firebaseSyncError,
                );
              }
            }
          }
          setProfileImage(
            resolveAvatarUrl([d?.profile, d?.profile_image, d?.avatar], {
              placeholderImage: placeholder_image,
            }),
          );
          initialDataRef.current = { ...nextForm, bihLocation: userLocation };

          const currentFcmId = UserData?.fcm_id;
          if (!d?.fcm_id && currentFcmId) {
            loadUpdateUserData({ ...d, fcm_id: currentFcmId });
          } else {
            loadUpdateUserData(d);
          }
        } else {
          throw new Error("Neuspjelo učitavanje korisničkih podataka.");
        }

        // Seller settings
        if (
          sellerRes.status === "fulfilled" &&
          sellerRes.value?.data?.error === false &&
          sellerRes.value?.data?.data
        ) {
          loadedSellerSettings = sellerRes.value.data.data;
          setSellerSettingsData(loadedSellerSettings);
        }

        if (loadedUser) {
          const splitName = splitFullName(loadedUser?.name);
          const rawCardPreferences = parseCardPreferencesSafe(
            loadedSellerSettings?.card_preferences,
          );
          const normalizedCardPreferences =
            normalizeSellerCardPreferences(rawCardPreferences);

          const nextIdentityData = {
            firstName: String(
              normalizedCardPreferences?.identity_first_name ||
                loadedUser?.first_name ||
                splitName.firstName ||
                "",
            ).trim(),
            lastName: String(
              normalizedCardPreferences?.identity_last_name ||
                loadedUser?.last_name ||
                splitName.lastName ||
                "",
            ).trim(),
            displayMode: normalizeProfileDisplayMode(
              normalizedCardPreferences?.identity_display_mode,
            ),
          };

          setIdentityData(nextIdentityData);
          initialIdentityRef.current = nextIdentityData;
        }
      } catch (error) {
        console.error("Greška pri učitavanju podataka:", error);
        toast.error("Došlo je do greške pri učitavanju podataka");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [IsLoggedIn]);

  // Auto-save function
  const autoSave = useCallback(
    async (fieldName, skipValidation = false, options = {}) => {
      let firebaseUser = null;
      let previousFirebaseEmail = "";
      let normalizedEmail = "";
      let didUpdateFirebaseEmail = false;

      // Validation
      if (!skipValidation) {
        if (fieldName === "name") {
          const username = normalizeUsernameValue(formData.name);
          if (!username) {
            toast.error("Korisničko ime je obavezno polje.");
            return;
          }
          const initialUsername = normalizeUsernameValue(
            initialDataRef.current?.name || "",
          );
          const usernameChanged =
            normalizeComparable(username) !==
            normalizeComparable(initialUsername);
          if (usernameChanged && !isValidUsernameValue(username)) {
            toast.error(
              "Korisničko ime mora imati 3-30 znakova (slova, brojevi, ., _, -).",
            );
            return;
          }
        }

        if (fieldName === "email" && !isValidEmailLoose(formData.email)) {
          toast.error("Unesite ispravnu email adresu");
          return;
        }

        const normalizedCountryCode = normalizeCountryCode(
          formData.country_code,
        );
        const normalizedMobile = normalizeMobileLocal(
          formData.phone,
          normalizedCountryCode,
        );
        const phoneE164 = `+${normalizedCountryCode}${normalizedMobile}`;

        if (
          fieldName === "phone" &&
          normalizedMobile &&
          !isValidPhoneNumber(phoneE164)
        ) {
          toast.error("Uneseni broj telefona nije ispravan");
          return;
        }
      }

      const locationToSave = options?.location || bihLocation;
      setSavingField(fieldName);
      try {
        if (
          fieldName === "location" &&
          locationToSave?.cityId &&
          !isLocationComplete(locationToSave)
        ) {
          return;
        }

        if (fieldName === "location") {
          saveLocation(locationToSave);
        }

        const resolvedLocation = resolveLocationSelection(locationToSave);
        const formattedBase =
          locationToSave?.formattedAddress || resolvedLocation?.formatted || "";
        const formattedAddress = formattedBase
          ? `${locationToSave?.address || ""}, ${formattedBase}`
              .replace(/^,\s*/, "")
              .trim()
          : formData.address;

        const normalizedCountryCode = normalizeCountryCode(
          formData.country_code,
        );
        const normalizedMobile = normalizeMobileLocal(
          formData.phone,
          normalizedCountryCode,
        );
        const phoneE164 = `+${normalizedCountryCode}${normalizedMobile}`;
        normalizedEmail = String(formData.email || "")
          .trim()
          .toLowerCase();
        const normalizedName = normalizeUsernameValue(formData.name);
        const normalizedRegionCode = String(formData.region_code || "")
          .trim()
          .toUpperCase();
        const canSendMobile = Boolean(
          normalizedMobile &&
          normalizedCountryCode &&
          isValidPhoneNumber(phoneE164),
        );

        const initialName = normalizeComparable(
          initialDataRef.current?.name || "",
        );
        const initialEmail = normalizeComparable(
          initialDataRef.current?.email || "",
        );
        const nameChanged =
          fieldName === "name" &&
          normalizedName &&
          normalizeComparable(normalizedName) !== initialName;
        const emailChanged =
          fieldName === "email" &&
          normalizedEmail &&
          normalizeComparable(normalizedEmail) !== initialEmail;

        if (emailChanged) {
          if (isEmailChangeDisabled) {
            toast.error(emailChangeDisabledReason);
            return;
          }

          const emailOwner = await resolveIdentifierOwnerSafe({
            identifier: normalizedEmail,
            identifierType: "email",
          });
          if (
            emailOwner &&
            !isSameResolvedUser({
              payload: emailOwner,
              currentUserId: UserData?.id,
              currentEmail: UserData?.email || normalizedEmail,
            })
          ) {
            toast.error("E-mail je već zauzet.");
            return;
          }
        }

        if (nameChanged) {
          let nameOwner = await resolveIdentifierOwnerSafe({
            identifier: normalizedName,
            identifierType: "username",
          });
          if (!nameOwner) {
            nameOwner = await resolveIdentifierOwnerSafe({
              identifier: normalizedName,
            });
          }
          if (
            nameOwner &&
            !isSameResolvedUser({
              payload: nameOwner,
              currentUserId: UserData?.id,
              currentEmail: UserData?.email || normalizedEmail,
            })
          ) {
            toast.error("Korisničko ime je već zauzeto.");
            return;
          }
        }

        if (emailChanged) {
          const auth = getAuth();
          firebaseUser = auth.currentUser;
          previousFirebaseEmail = String(firebaseUser?.email || "")
            .trim()
            .toLowerCase();
          if (!previousFirebaseEmail && firebaseAuthEmail) {
            previousFirebaseEmail = firebaseAuthEmail;
          }

          if (!firebaseUser) {
            toast.error(
              "Sigurnosna sesija je istekla. Odjavite se i prijavite ponovo prije promjene e-maila.",
            );
            return;
          }

          if (
            !previousFirebaseEmail ||
            previousFirebaseEmail !== normalizedEmail
          ) {
            try {
              await updateEmail(firebaseUser, normalizedEmail);
              didUpdateFirebaseEmail = true;
            } catch (error) {
              const code = String(error?.code || "");
              if (code === "auth/requires-recent-login") {
                toast.error(
                  "Zbog sigurnosti, za promjenu e-maila se prvo ponovo prijavite pa pokušajte opet.",
                );
                return;
              }
              if (code === "auth/operation-not-allowed") {
                toast.error(
                  "Promjena e-maila nije dozvoljena za ovaj način prijave.",
                );
                return;
              }
              const message =
                error?.message ||
                "Promjena e-maila nije uspjela na sigurnosnom servisu.";
              toast.error(message);
              return;
            }
          }
        }

        const response = await updateProfileApi.updateProfile({
          name: normalizedName,
          email: normalizedEmail,
          mobile: canSendMobile ? normalizedMobile : undefined,
          address: formattedAddress,
          profile: profileFile,
          fcm_id: fetchFCM || "",
          notification: formData.notification,
          country_code: canSendMobile ? normalizedCountryCode : undefined,
          show_personal_details: formData.show_personal_details,
          region_code:
            canSendMobile && normalizedRegionCode
              ? normalizedRegionCode
              : undefined,
        });

        if (response.data.error !== true) {
          const newData = response.data.data;
          const currentFcmId = UserData?.fcm_id;

          if (!newData?.fcm_id && currentFcmId) {
            loadUpdateUserData({ ...newData, fcm_id: currentFcmId });
          } else {
            loadUpdateUserData(newData);
          }

          setProfileFile(null);
          initialDataRef.current = {
            ...(initialDataRef.current || {}),
            name: normalizedName,
            email: normalizedEmail,
            phone: normalizedMobile,
            address: formattedAddress,
            notification: formData.notification,
            show_personal_details: formData.show_personal_details,
            region_code: normalizedRegionCode.toLowerCase(),
            country_code: normalizedCountryCode,
            bihLocation: locationToSave,
          };
          toast.success("Sačuvano");
        } else {
          toast.error(response.data.message || "Greška pri čuvanju");
        }
      } catch (error) {
        console.error("Greška:", error);
        const status = error?.response?.status;

        if (didUpdateFirebaseEmail && firebaseUser) {
          if (
            previousFirebaseEmail &&
            previousFirebaseEmail !== normalizedEmail
          ) {
            try {
              await updateEmail(firebaseUser, previousFirebaseEmail);
            } catch (rollbackError) {
              console.error(
                "Greška pri vraćanju e-maila nakon neuspjelog backend snimanja:",
                rollbackError,
              );
              toast.error(
                "E-mail je promijenjen u sigurnosnom nalogu, ali profil nije sačuvan. Prijavite se ponovo i ponovite izmjenu.",
              );
              return;
            }
          } else {
            toast.error(
              "E-mail je promijenjen na sigurnosnom servisu, ali profil nije sačuvan. Prijavite se ponovo i pokušajte opet.",
            );
            return;
          }
        }

        const duplicateMessage = getDuplicateMessage(error);
        if (duplicateMessage) {
          toast.error(duplicateMessage);
          return;
        }
        const apiMessage =
          error?.response?.data?.message ||
          error?.response?.data?.errors?.mobile?.[0] ||
          error?.response?.data?.errors?.country_code?.[0] ||
          error?.response?.data?.errors?.region_code?.[0] ||
          error?.response?.data?.errors?.email?.[0] ||
          error?.message;
        if (status === 422) {
          toast.error(apiMessage || "Provjerite unesene podatke.");
        } else {
          toast.error(apiMessage || "Greška na serveru");
        }
      } finally {
        setSavingField(null);
      }
    },
    [
      formData,
      bihLocation,
      profileFile,
      fetchFCM,
      UserData?.fcm_id,
      UserData?.id,
      UserData?.email,
      firebaseAuthEmail,
      isEmailChangeDisabled,
      emailChangeDisabledReason,
      saveLocation,
    ],
  );

  // Debounced auto-save
  const debouncedSave = useCallback(
    (fieldName, options = {}) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        autoSave(fieldName, false, options);
      }, 1000);
    },
    [autoSave],
  );

  const saveIdentityPreferences = useCallback(
    async (nextIdentityCandidate = null) => {
      const nextIdentity = {
        firstName: String(
          nextIdentityCandidate?.firstName ?? identityData.firstName ?? "",
        ).trim(),
        lastName: String(
          nextIdentityCandidate?.lastName ?? identityData.lastName ?? "",
        ).trim(),
        displayMode: normalizeProfileDisplayMode(
          nextIdentityCandidate?.displayMode ?? identityData.displayMode,
        ),
      };

      const initialIdentity = initialIdentityRef.current || {};
      const isSameIdentity =
        normalizeComparable(initialIdentity.firstName) ===
          normalizeComparable(nextIdentity.firstName) &&
        normalizeComparable(initialIdentity.lastName) ===
          normalizeComparable(nextIdentity.lastName) &&
        normalizeProfileDisplayMode(initialIdentity.displayMode) ===
          nextIdentity.displayMode;

      if (isSameIdentity) return;

      setIsSavingIdentity(true);
      try {
        const currentCardPreferences = parseCardPreferencesSafe(
          sellerSettingsData?.card_preferences,
        );
        const nextCardPreferences = {
          ...currentCardPreferences,
          identity_first_name: nextIdentity.firstName,
          identity_last_name: nextIdentity.lastName,
          identity_display_mode: nextIdentity.displayMode,
        };

        const response = await sellerSettingsApi.updateSettings({
          card_preferences: nextCardPreferences,
        });

        if (response?.data?.error === false) {
          setSellerSettingsData((prev) => {
            const prevSafe = prev && typeof prev === "object" ? prev : {};
            const responseData =
              response?.data?.data && typeof response.data.data === "object"
                ? response.data.data
                : {};
            return {
              ...prevSafe,
              ...responseData,
              card_preferences: nextCardPreferences,
            };
          });
          initialIdentityRef.current = nextIdentity;
          setIdentityData(nextIdentity);
          toast.success("Sačuvano");
          return;
        }

        toast.error(response?.data?.message || "Greška pri čuvanju.");
      } catch (error) {
        console.error("Greška pri čuvanju prikaza imena:", error);
        toast.error(
          error?.response?.data?.message || "Greška pri čuvanju prikaza imena.",
        );
      } finally {
        setIsSavingIdentity(false);
      }
    },
    [identityData, sellerSettingsData],
  );

  // Handlers
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => {
    debouncedSave(field);
  };

  const handleIdentityChange = (field, value) => {
    setIdentityData((prev) => ({ ...prev, [field]: value }));
  };

  const handleIdentityBlur = () => {
    saveIdentityPreferences();
  };

  const handleDisplayModeChange = (value) => {
    const normalizedValue = normalizeProfileDisplayMode(value);
    setIdentityData((prev) => {
      const nextIdentity = { ...prev, displayMode: normalizedValue };
      window.setTimeout(() => {
        saveIdentityPreferences(nextIdentity);
      }, 80);
      return nextIdentity;
    });
  };

  const handlePhoneChange = (value, data) => {
    const dial = digitsOnly(data?.dialCode || "");
    const iso2 = data?.countryCode || "";
    const numericValue = digitsOnly(value);
    const pureMobile =
      dial && numericValue.startsWith(dial)
        ? numericValue.slice(dial.length)
        : numericValue;

    setFormData((prev) => ({
      ...prev,
      phone: pureMobile,
      country_code: dial,
      region_code: iso2,
    }));
  };

  const handleToggle = async (field) => {
    const newValue = formData[field] === 1 ? 0 : 1;
    setFormData((prev) => ({ ...prev, [field]: newValue }));

    // Immediately save toggle changes
    setTimeout(() => autoSave(field, true), 100);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Slika je prevelika. Maksimalna veličina je 5MB.");
      return;
    }

    setProfileFile(file);
    const reader = new FileReader();
    reader.onload = async () => {
      setProfileImage(reader.result);
      // Auto-save image
      setTimeout(() => autoSave("image", true), 100);
    };
    reader.readAsDataURL(file);
  };

  const handleLocationChange = (newLocation) => {
    setBihLocation(newLocation);
    debouncedSave("location", { location: newLocation });
  };

  const sellerProfilePath = UserData?.id ? `/prodavac/${UserData.id}` : "";

  useEffect(() => {
    if (!sellerProfilePath || typeof window === "undefined") {
      setPublicProfileUrl("");
      return;
    }
    setPublicProfileUrl(`${window.location.origin}${sellerProfilePath}`);
  }, [sellerProfilePath]);

  const handleCopyPublicProfileLink = useCallback(async () => {
    if (
      !publicProfileUrl ||
      typeof navigator === "undefined" ||
      !navigator.clipboard
    ) {
      toast.error("Link profila nije dostupan za kopiranje.");
      return;
    }

    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setIsLinkCopied(true);
      toast.success("Link javnog profila je kopiran.");
      window.setTimeout(() => setIsLinkCopied(false), 1500);
    } catch (error) {
      console.error("Greška pri kopiranju linka profila:", error);
      toast.error("Kopiranje nije uspjelo.");
    }
  }, [publicProfileUrl]);

  // Not logged in
  if (!IsLoggedIn) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            Niste prijavljeni
          </h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Prijavite se da biste pristupili postavkama profila
          </p>
          <CustomLink
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            Prijavi se
          </CustomLink>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl space-y-6"
    >
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.55)] dark:border-slate-700 dark:bg-slate-900/90">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/10 via-cyan-500/10 to-transparent dark:from-cyan-500/15 dark:via-slate-800/30 dark:to-transparent" />

        <div className="relative p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex items-center gap-4">
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                <ProfileAvatar
                  customAvatarUrl={profileImage}
                  size="lg"
                  onImageClick={() => fileInputRef.current?.click()}
                  verificationSource={UserData}
                  showVerifiedBadge
                  verificationSources={
                    sellerSettingsData ? [sellerSettingsData] : []
                  }
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-bold text-slate-900 dark:text-slate-100">
                    {profileVisibleName}
                  </h1>
                  <VerificationBadge
                    status={verificationStatus}
                    reason={rejectionReason}
                  />
                </div>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                  {formData.email}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-slate-600"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Promijeni sliku
                </button>
              </div>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto">
              <CustomLink
                href="/profile/seller-settings"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
              >
                <Shield className="h-3.5 w-3.5" />
                Postavke prodavača
              </CustomLink>
              {sellerProfilePath ? (
                <CustomLink
                  href={sellerProfilePath}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Pogledaj javni profil
                </CustomLink>
              ) : null}
            </div>
          </div>
        </div>

        {sellerProfilePath ? (
          <div className="border-t border-slate-200/70 bg-slate-50/70 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/40 sm:px-6 lg:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  Javni profil
                </p>
                <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {publicProfileUrl || sellerProfilePath}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyPublicProfileLink}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                  isLinkCopied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600",
                )}
              >
                {isLinkCopied ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                {isLinkCopied ? "Link kopiran" : "Kopiraj link profila"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <SettingCard
            icon={User}
            title="Osnovni podaci"
            description="Vaši lični podaci"
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="first_name"
                    className="text-xs text-slate-600 dark:text-slate-300"
                  >
                    Ime
                  </Label>
                  <Input
                    id="first_name"
                    value={identityData.firstName}
                    onChange={(e) =>
                      handleIdentityChange("firstName", e.target.value)
                    }
                    onBlur={handleIdentityBlur}
                    placeholder="Unesite ime"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="last_name"
                    className="text-xs text-slate-600 dark:text-slate-300"
                  >
                    Prezime
                  </Label>
                  <Input
                    id="last_name"
                    value={identityData.lastName}
                    onChange={(e) =>
                      handleIdentityChange("lastName", e.target.value)
                    }
                    onBlur={handleIdentityBlur}
                    placeholder="Unesite prezime"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs text-slate-600 dark:text-slate-300"
                >
                  Korisničko ime
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="korisnicko_ime"
                  className="h-10"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Prijava je putem korisničkog imena ili e-maila.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="name_display_mode"
                  className="text-xs text-slate-600 dark:text-slate-300"
                >
                  Prikaz imena na profilu
                </Label>
                <select
                  id="name_display_mode"
                  value={identityData.displayMode}
                  onChange={(event) =>
                    handleDisplayModeChange(event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {profileDisplayOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Trenutni prikaz: {profileVisibleName}
                  </p>
                  {isSavingIdentity ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Čuvanje...
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs text-slate-600 dark:text-slate-300"
                >
                  Email adresa
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled={isEmailChangeDisabled}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="email@primjer.com"
                  className={cn(
                    "h-10",
                    isEmailChangeDisabled &&
                      "opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800",
                  )}
                />
                {isEmailChangeDisabled ? (
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    {emailChangeDisabledReason}
                  </p>
                ) : null}
              </div>
            </div>
          </SettingCard>

          <SettingCard
            icon={Phone}
            title="Kontakt"
            description="Načini kontakta"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="phone"
                className="text-xs text-slate-600 dark:text-slate-300"
              >
                Broj telefona
              </Label>
              <PhoneInput
                country={resolveLmxPhoneCountry(
                  formData.region_code || LMX_PHONE_DEFAULT_COUNTRY,
                )}
                value={`${formData.country_code || ""}${formData.phone || ""}`}
                onChange={handlePhoneChange}
                onBlur={() => handleBlur("phone")}
                inputProps={{
                  id: "phone",
                  name: "phone",
                }}
                {...LMX_PHONE_INPUT_PROPS}
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Vidljiv samo ako je uključeno u postavkama privatnosti
              </p>
            </div>
          </SettingCard>

          <SettingCard
            icon={MapPin}
            title="Lokacija"
            description="Vaša lokacija"
          >
            <div className="space-y-3">
              <BiHLocationSelector
                value={bihLocation}
                onChange={handleLocationChange}
                showAddress={true}
              />

              {bihLocation.formattedAddress && (
                <div className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50 p-3 dark:border-green-500/40 dark:bg-green-500/10">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-300" />
                  <div>
                    <p className="text-xs font-medium text-green-800 dark:text-green-100">
                      Trenutna lokacija
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-200">
                      {bihLocation.formattedAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SettingCard>
        </div>

        <div className="space-y-6">
          <SettingCard
            icon={Bell}
            title="Obavijesti"
            description="Postavke notifikacija"
          >
            <div className="space-y-1">
              <ToggleSetting
                label="Email obavijesti"
                description="Primajte obavijesti na vašu email adresu"
                checked={formData.notification === 1}
                onChange={() => handleToggle("notification")}
                saving={savingField === "notification"}
              />
            </div>

            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-start gap-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Detaljne postavke kontakta (telefon, WhatsApp, Viber, radno
                    vrijeme) možete podesiti u{" "}
                    <CustomLink
                      href="/profile/seller-settings"
                      className="text-primary font-medium hover:underline"
                    >
                      Postavkama prodavača
                    </CustomLink>
                  </p>
                </div>
              </div>
            </div>
          </SettingCard>

          {verificationStatus !== "approved" ? (
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Verifikuj svoj profil
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Verificirani profili imaju veću stopu uspješnih transakcija
                    i više povjerenja kupaca.
                  </p>
                  <CustomLink
                    href="/user-verification"
                    className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Započni verifikaciju
                  </CustomLink>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700/60 dark:bg-emerald-900/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Profil je verifikovan
                  </h4>
                  <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                    Kupci vide oznaku verifikacije i imaju više povjerenja u
                    vaše oglase.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
