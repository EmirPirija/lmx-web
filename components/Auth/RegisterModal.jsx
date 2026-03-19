"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useSelector } from "react-redux";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { AnimatePresence, motion } from "framer-motion";

import {
  FcGoogle,
  Loader2,
  MdOutlineEmail,
  MdOutlineLocalPhone,
  Check,
  ChevronLeft,
  Camera,
  Sparkles,
  User,
} from "@/components/Common/UnifiedIconPack";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "@/utils/toastBs";
import { handleFirebaseAuthError } from "@/utils";

import {
  Fcmtoken,
  getOtpServiceProvider,
  settingsData,
} from "@/redux/reducer/settingSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { loadUpdateData, loadUpdateUserData } from "@/redux/reducer/authSlice";
import {
  authApi,
  getOtpApi,
  updateProfileApi,
  userSignUpApi,
} from "@/utils/api";

import AuthValuePanel from "./AuthValuePanel";
import OtpScreen from "./OtpScreen";
import TermsAndPrivacyLinks from "./TermsAndPrivacyLinks";
import RegisterAuthInputField from "./RegisterAuthInputField";
import LmxAvatarGenerator from "@/components/Avatar/LmxAvatarGenerator";
import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import {
  LMX_PHONE_DEFAULT_COUNTRY,
  resolveLmxPhoneDialCode,
} from "@/components/Common/phoneInputTheme";
import { getCanonicalPhonePayload, maskPhoneForDebug } from "./phoneAuthUtils";
import {
  isLocationComplete,
  resolveLocationSelection,
} from "@/lib/bih-locations";
import {
  clearRecaptchaVerifier,
  ensureRecaptchaVerifier,
  isFirebaseDomainConfigurationError,
  isRecaptchaRecoverableError,
} from "./recaptchaManager";

const STEP_META = [
  "Izvor registracije",
  "Potvrda pristupa",
  "Korisničko ime",
  "Avatar i završetak",
];

const EMAIL_REGEX = /\S+@\S+\.\S+/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;
const AVATAR_CROP_FRAME_SIZE = 272;
const AVATAR_OUTPUT_SIZE = 512;
const REGISTER_LOCATION_STORAGE_KEY = "user_bih_location";
const EMPTY_REGISTER_LOCATION = {
  entityId: null,
  cityId: null,
  regionId: null,
  municipalityId: null,
  address: "",
  formattedAddress: "",
};

const DEFAULT_REGISTER_REGION = String(
  LMX_PHONE_DEFAULT_COUNTRY || "ba",
).toLowerCase();
const DEFAULT_REGISTER_COUNTRY_CODE = `+${resolveLmxPhoneDialCode(DEFAULT_REGISTER_REGION)}`;

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const isGatewayOrTimeoutError = (error) => {
  const status = Number(error?.response?.status || 0);
  const code = String(error?.code || "").toUpperCase();
  return (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT"
  );
};

const AUTH_SYNC_RETRYABLE_STATUSES = new Set([502, 503]);
const sleep = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const avatarBlobToFile = (blob, fileName = `avatar-${Date.now()}.png`) => {
  if (!blob) return null;
  return new File([blob], fileName, { type: blob.type || "image/png" });
};

const urlToImageFile = async (url, fileName = `avatar-${Date.now()}.jpg`) => {
  if (!url) return null;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Ne mogu preuzeti sliku sa vanjskog izvora.");
  }
  const blob = await response.blob();
  if (!blob?.type?.startsWith("image/")) {
    throw new Error("Odabrani izvor nije validna slika.");
  }
  return new File([blob], fileName, { type: blob.type });
};

const getStepIndex = (step) => {
  if (step === "method") return 0;
  if (
    step === "email_credentials" ||
    step === "phone_credentials" ||
    step === "otp" ||
    step === "google_connecting"
  ) {
    return 1;
  }
  if (step === "profile_name") return 2;
  return 3;
};

const normalizeComparable = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeProfileNameValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "");

const isValidProfileUsername = (value) =>
  USERNAME_REGEX.test(normalizeProfileNameValue(value));

const DUPLICATE_HINTS = [
  "already",
  "exists",
  "duplicate",
  "zauzet",
  "zauzeto",
  "vec postoji",
  "već postoji",
  "već registrovan",
  "already registered",
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
  if (field === "email") {
    return "E-mail je već zauzet. Koristite prijavu ili drugi e-mail.";
  }
  if (field === "name") {
    return "Korisničko ime je već zauzeto. Odaberite drugo korisničko ime.";
  }
  if (field === "phone") {
    return "Broj telefona je već povezan s drugim računom.";
  }
  if (field === "generic") {
    return "Uneseni podaci već postoje. Provjerite e-mail i korisničko ime.";
  }
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

const resolveIdentifierOwner = async ({ identifier, identifierType } = {}) => {
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

    if (status === 429) {
      const rateLimitError = new Error("RATE_LIMIT");
      rateLimitError.code = "RATE_LIMIT";
      throw rateLimitError;
    }

    if (
      status === 404 ||
      NOT_FOUND_REASONS.has(reason) ||
      NOT_FOUND_HINTS.some((hint) => message.includes(hint))
    ) {
      return null;
    }

    if (status >= 500) {
      console.warn("Provjera identiteta je preskočena (server error):", error);
      return null;
    }

    if (inferDuplicateField(error)) {
      return { duplicate_hint: true };
    }

    return null;
  }
};

const RegisterModal = ({ IsRegisterModalOpen, setIsRegisterModalOpen }) => {
  const settings = useSelector(settingsData);
  const auth = getAuth();
  const fetchFCM = useSelector(Fcmtoken);
  const otp_service_provider = useSelector(getOtpServiceProvider);

  const isDemoMode = Number(settings?.demo_mode) === 1;

  const mobile_authentication = Number(settings?.mobile_authentication);
  const google_authentication = Number(settings?.google_authentication);
  const email_authentication = Number(settings?.email_authentication);

  const availableMethods = useMemo(
    () => ({
      email: email_authentication === 1,
      phone: mobile_authentication === 1,
      google: google_authentication === 1,
    }),
    [email_authentication, mobile_authentication, google_authentication],
  );

  const [step, setStep] = useState("method");
  const [registerMethod, setRegisterMethod] = useState("email");
  const [isBusy, setIsBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [number, setNumber] = useState(isDemoMode ? "38761111222" : "");
  const [countryCode, setCountryCode] = useState(DEFAULT_REGISTER_COUNTRY_CODE);
  const [regionCode, setRegionCode] = useState(DEFAULT_REGISTER_REGION);

  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  const [googleDraft, setGoogleDraft] = useState({
    name: "",
    email: "",
    photoURL: "",
    uid: "",
  });

  const [authPayload, setAuthPayload] = useState(null);

  const [profileName, setProfileName] = useState("");

  const [avatarMode, setAvatarMode] = useState("none"); // none | upload | studio | google
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [googleAvatarLoadError, setGoogleAvatarLoadError] = useState(false);
  const [googleAvatarIsLoading, setGoogleAvatarIsLoading] = useState(false);

  const [studioBlob, setStudioBlob] = useState(null);
  const [studioPreview, setStudioPreview] = useState("");
  const [showStudio, setShowStudio] = useState(false);
  const [locationSetupMode, setLocationSetupMode] = useState("later"); // now | later
  const [registerLocation, setRegisterLocation] = useState(() => ({
    ...EMPTY_REGISTER_LOCATION,
  }));

  const [showCropDialog, setShowCropDialog] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState(null);
  const [pendingUploadPreview, setPendingUploadPreview] = useState("");
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [cropMeta, setCropMeta] = useState({
    naturalWidth: 0,
    naturalHeight: 0,
    baseScale: 1,
    baseWidth: 0,
    baseHeight: 0,
  });

  const objectUrlRef = useRef({ upload: "", studio: "", pendingUpload: "" });
  const uploadInputRef = useRef(null);
  const cropPreviewImgRef = useRef(null);
  const otpSendInFlightRef = useRef(false);

  const countryCodeDigitsOnly = countryCode.replace(/\D/g, "");
  const startsWithCountryCode = number.startsWith(countryCodeDigitsOnly);
  const formattedNumber = startsWithCountryCode
    ? number.substring(countryCodeDigitsOnly.length)
    : number;

  const activeStepIndex = getStepIndex(step);
  const registerStepProgress = ((activeStepIndex + 1) / STEP_META.length) * 100;

  const registerPrimaryStepMotion = {
    initial: { opacity: 0, y: 16, scale: 0.992, filter: "blur(3px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, y: -10, scale: 0.996, filter: "blur(2px)" },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  };

  const cropMaxOffsetX = useMemo(() => {
    if (!cropMeta.baseWidth) return 0;
    const renderedWidth = cropMeta.baseWidth * cropZoom;
    return Math.max((renderedWidth - AVATAR_CROP_FRAME_SIZE) / 2, 0);
  }, [cropMeta.baseWidth, cropZoom]);

  const cropMaxOffsetY = useMemo(() => {
    if (!cropMeta.baseHeight) return 0;
    const renderedHeight = cropMeta.baseHeight * cropZoom;
    return Math.max((renderedHeight - AVATAR_CROP_FRAME_SIZE) / 2, 0);
  }, [cropMeta.baseHeight, cropZoom]);

  const revokeObjectUrl = (key) => {
    if (!objectUrlRef.current[key]) return;
    URL.revokeObjectURL(objectUrlRef.current[key]);
    objectUrlRef.current[key] = "";
  };

  const cleanupObjectUrls = () => {
    revokeObjectUrl("upload");
    revokeObjectUrl("studio");
    revokeObjectUrl("pendingUpload");
  };

  const resetState = () => {
    cleanupObjectUrls();
    otpSendInFlightRef.current = false;

    const defaultMethod = availableMethods.email
      ? "email"
      : availableMethods.phone
        ? "phone"
        : "google";

    setStep("method");
    setRegisterMethod(defaultMethod);
    setIsBusy(false);

    setEmail("");
    setPassword("");
    setIsPasswordVisible(false);

    setNumber(isDemoMode ? "38761111222" : "");
    setCountryCode(DEFAULT_REGISTER_COUNTRY_CODE);
    setRegionCode(DEFAULT_REGISTER_REGION);

    setConfirmationResult(null);
    setResendTimer(0);

    setGoogleDraft({ name: "", email: "", photoURL: "", uid: "" });
    setAuthPayload(null);

    setProfileName("");

    setAvatarMode("none");
    setUploadFile(null);
    setUploadPreview("");
    setGoogleAvatarLoadError(false);
    setGoogleAvatarIsLoading(false);
    setStudioBlob(null);
    setStudioPreview("");
    setShowStudio(false);
    setLocationSetupMode("later");
    setRegisterLocation({ ...EMPTY_REGISTER_LOCATION });
    setShowCropDialog(false);
    setPendingUploadFile(null);
    setPendingUploadPreview("");
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    setIsApplyingCrop(false);
    setCropMeta({
      naturalWidth: 0,
      naturalHeight: 0,
      baseScale: 1,
      baseWidth: 0,
      baseHeight: 0,
    });
  };

  const recaptchaClear = async () => {
    clearRecaptchaVerifier({
      containerId: "recaptcha-container",
      replaceContainer: true,
    });
  };

  const OnHide = async ({ preserveSession = false } = {}) => {
    const shouldRollbackGoogleSession =
      !preserveSession &&
      registerMethod === "google" &&
      step !== "method" &&
      Boolean(auth.currentUser);

    if (shouldRollbackGoogleSession) {
      try {
        await signOut(auth);
      } catch (_) {}
    }
    await recaptchaClear();
    resetState();
    setIsRegisterModalOpen(false);
  };

  const handleDialogOpenChange = async (isOpen) => {
    if (!isOpen) {
      await OnHide();
      return;
    }
    setIsRegisterModalOpen(true);
  };

  const generateRecaptcha = (options = {}) => {
    return ensureRecaptchaVerifier({
      auth,
      containerId: "recaptcha-container",
      forceRecreate: Boolean(options?.forceRecreate),
    });
  };

  useEffect(() => {
    return () => {
      cleanupObjectUrls();
      clearRecaptchaVerifier({
        containerId: "recaptcha-container",
        replaceContainer: true,
      });
    };
  }, []);

  useEffect(() => {
    if (!IsRegisterModalOpen) {
      resetState();
      return;
    }

    const defaultMethod = availableMethods.email
      ? "email"
      : availableMethods.phone
        ? "phone"
        : "google";

    setRegisterMethod(defaultMethod);
    setStep("method");
  }, [
    IsRegisterModalOpen,
    isDemoMode,
    availableMethods.email,
    availableMethods.phone,
    availableMethods.google,
  ]);

  useEffect(() => {
    setGoogleAvatarLoadError(false);
    setGoogleAvatarIsLoading(
      Boolean(String(googleDraft?.photoURL || "").trim()),
    );
  }, [googleDraft?.photoURL]);

  useEffect(() => {
    if (avatarMode === "google") {
      const hasPhotoUrl = Boolean(String(googleDraft?.photoURL || "").trim());
      if (!hasPhotoUrl || googleAvatarLoadError) {
        setAvatarMode("none");
      }
    }
  }, [avatarMode, googleDraft?.photoURL, googleAvatarLoadError]);

  useEffect(() => {
    if (avatarMode !== "studio" && showStudio) {
      setShowStudio(false);
    }
  }, [avatarMode, showStudio]);

  useEffect(() => {
    setCropX((prev) => clamp(prev, -cropMaxOffsetX, cropMaxOffsetX));
  }, [cropMaxOffsetX]);

  useEffect(() => {
    setCropY((prev) => clamp(prev, -cropMaxOffsetY, cropMaxOffsetY));
  }, [cropMaxOffsetY]);

  const sendOtpWithTwillio = async ({
    phoneE164,
    localNumber,
    countryCodeDigits,
  }) => {
    try {
      const response = await getOtpApi.getOtp({
        number: phoneE164,
        intent: "register",
        mobile: localNumber,
        country_code: countryCodeDigits,
        region_code: String(regionCode || "").toUpperCase(),
      });
      if (response?.data?.error === false) {
        toast.success("OTP poslan");
        setStep("otp");
        setResendTimer(60);
      } else {
        toast.error(response?.data?.message || "Slanje OTP koda nije uspjelo.");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Slanje OTP koda nije uspjelo.",
      );
    }
  };

  const sendOtpWithFirebase = async ({
    phoneE164,
    localNumber,
    countryCodeDigits,
  }) => {
    const requestOtp = async () => {
      const appVerifier = generateRecaptcha({ forceRecreate: true });
      if (!appVerifier) {
        handleFirebaseAuthError("auth/recaptcha-not-enabled");
        return null;
      }
      return signInWithPhoneNumber(auth, phoneE164, appVerifier);
    };

    try {
      let confirmation = await requestOtp();
      if (!confirmation) {
        return;
      }
      if (!confirmation?.verificationId) {
        toast.error("Slanje OTP koda nije potvrđeno. Pokušaj ponovo.");
        return;
      }

      setConfirmationResult(confirmation);
      toast.success("OTP poslan");
      setResendTimer(60);
      setStep("otp");
    } catch (error) {
      if (isRecaptchaRecoverableError(error)) {
        try {
          const retriedConfirmation = await requestOtp();
          if (retriedConfirmation) {
            if (!retriedConfirmation?.verificationId) {
              toast.error("Slanje OTP koda nije potvrđeno. Pokušaj ponovo.");
              return;
            }
            console.info("[Auth][Firebase] OTP request accepted after retry", {
              phone: maskPhoneForDebug(phoneE164),
              verificationId: retriedConfirmation?.verificationId || null,
            });
            setConfirmationResult(retriedConfirmation);
            toast.success("OTP poslan");
            setResendTimer(60);
            setStep("otp");
            return;
          }
        } catch (retryError) {
          if (isFirebaseDomainConfigurationError(retryError)) {
            try {
              setConfirmationResult(null);
              toast.info(
                "Firebase verifikacija nije dostupna. Prelazimo na rezervni OTP kanal.",
              );
              await sendOtpWithTwillio({
                phoneE164,
                localNumber,
                countryCodeDigits,
              });
              return;
            } catch (_) {
              // final handler below
            }
          }
          handleFirebaseAuthError(retryError);
          return;
        }
      }
      if (isFirebaseDomainConfigurationError(error)) {
        try {
          setConfirmationResult(null);
          toast.info(
            "Firebase verifikacija nije dostupna. Prelazimo na rezervni OTP kanal.",
          );
          await sendOtpWithTwillio({
            phoneE164,
            localNumber,
            countryCodeDigits,
          });
          return;
        } catch (_) {
          // final handler below
        }
      }
      handleFirebaseAuthError(error);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (isBusy || otpSendInFlightRef.current) {
      return;
    }

    const effectiveCountryCode =
      String(countryCode || "").trim() || DEFAULT_REGISTER_COUNTRY_CODE;
    const effectiveLocalNumber =
      String(formattedNumber || "").trim() || String(number || "").trim();
    const phonePayload = getCanonicalPhonePayload(
      effectiveCountryCode,
      effectiveLocalNumber,
    );
    const phoneE164 = phonePayload.e164;

    if (!isValidPhoneNumber(phoneE164)) {
      toast.error("Neispravan broj telefona");
      return;
    }

    if (!countryCode) {
      setCountryCode(effectiveCountryCode);
    }

    otpSendInFlightRef.current = true;
    setIsBusy(true);
    try {
      // Pre-check: block already-registered numbers before sending OTP
      try {
        const phoneOwner = await resolveIdentifierOwner({
          identifier: phoneE164,
          identifierType: "phone",
        });
        if (phoneOwner) {
          toast.error(
            "Ovaj broj telefona je već registrovan. Prijavite se umjesto registracije.",
          );
          return;
        }
      } catch (resolveError) {
        if (resolveError?.code === "RATE_LIMIT") {
          toast.error("Previše pokušaja. Sačekajte kratko i pokušajte ponovo.");
          return;
        }
        // On unexpected errors, allow OTP send to proceed so registration isn't blocked
      }

      if (otp_service_provider === "twilio") {
        await sendOtpWithTwillio({
          phoneE164,
          localNumber: phonePayload.local,
          countryCodeDigits: phonePayload.countryCode,
        });
      } else {
        await sendOtpWithFirebase({
          phoneE164,
          localNumber: phonePayload.local,
          countryCodeDigits: phonePayload.countryCode,
        });
      }
    } finally {
      otpSendInFlightRef.current = false;
      setIsBusy(false);
    }
  };

  const handleGoogleRegistration = async () => {
    const provider = new GoogleAuthProvider();
    setStep("google_connecting");
    setIsBusy(true);

    try {
      const popupResponse = await signInWithPopup(auth, provider);
      const googleUser = popupResponse.user;
      const isIdentityUnique = await ensureRegistrationIdentityIsUnique({
        emailValue: googleUser?.email || "",
        profileNameValue: googleUser?.displayName || "",
        checkEmail: true,
      });
      if (!isIdentityUnique) {
        await signOut(auth).catch(() => {});
        setStep("method");
        return;
      }

      const response = await userSignUpApi.userSignup({
        name: googleUser?.displayName || "",
        email: googleUser?.email || "",
        firebase_id: googleUser?.uid,
        fcm_id: fetchFCM ? fetchFCM : "",
        type: "google",
        auth_intent: "register",
      });

      const data = response?.data;

      if (data?.error === true) {
        toast.error(
          getDuplicateMessage({ data }) ||
            data?.message ||
            "Google registracija nije uspjela.",
        );
        await signOut(auth).catch(() => {});
        setStep("method");
        return;
      }

      loadUpdateData(data);
      setAuthPayload(data);
      setGoogleDraft({
        name: googleUser?.displayName || data?.data?.name || "",
        email: googleUser?.email || data?.data?.email || "",
        photoURL: googleUser?.photoURL || "",
        uid: googleUser?.uid || "",
      });

      setProfileName(googleUser?.displayName || data?.data?.name || "");
      setAvatarMode(googleUser?.photoURL ? "google" : "none");
      setGoogleAvatarLoadError(false);
      setStep("profile_name");
      toast.success("Google nalog je povezan. Dovrši profil.");
    } catch (error) {
      await signOut(auth).catch(() => {});
      if (isGatewayOrTimeoutError(error)) {
        toast.error(
          "Registracija trenutno nije dostupna. Backend autentifikacija kasni (504/timeout).",
        );
      } else {
        handleFirebaseAuthError(error);
      }
      setStep("method");
    } finally {
      setIsBusy(false);
    }
  };

  const handleMethodContinue = async (method) => {
    setRegisterMethod(method);

    if (method === "google") {
      await handleGoogleRegistration();
      return;
    }

    if (method === "phone") {
      setStep("phone_credentials");
      return;
    }

    setStep("email_credentials");
  };

  const handleEmailCredentials = (e) => {
    e.preventDefault();

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      toast.error("Unesi ispravan e-mail");
      return;
    }
    if (!password) {
      toast.error("Lozinka je obavezna");
      return;
    }
    if (password.length < 6) {
      toast.error("Lozinka mora imati najmanje 6 znakova");
      return;
    }

    setEmail(normalizedEmail);
    if (!profileName.trim()) {
      const emailNameGuess =
        normalizedEmail
          .split("@")[0]
          ?.replace(/[^a-zA-Z0-9._-]+/g, "")
          .slice(0, 30) || "";
      setProfileName(emailNameGuess);
    }
    setStep("profile_name");
  };

  const handlePhoneOtpSuccess = (payload) => {
    setAuthPayload(payload);
    const nextName = String(payload?.data?.name || "").trim();
    if (nextName) {
      setProfileName(nextName);
    }
    setStep("profile_name");
    toast.info("Broj je potvrđen. Nastavi s podešavanjem profila.");
  };

  const handleNameContinue = (e) => {
    e.preventDefault();
    const normalizedName = normalizeProfileNameValue(profileName);
    if (!normalizedName) {
      toast.error("Korisničko ime je obavezno.");
      return;
    }
    if (!isValidProfileUsername(normalizedName)) {
      toast.error(
        "Korisničko ime mora imati 3-30 znakova (slova, brojevi, ., _, -).",
      );
      return;
    }
    setProfileName(normalizedName);
    setStep("avatar");
  };

  const ensureRegistrationIdentityIsUnique = async ({
    emailValue = "",
    profileNameValue = "",
    checkEmail = true,
    currentUserId = null,
    currentEmail = "",
  } = {}) => {
    const normalizedEmail = normalizeComparable(emailValue);
    const normalizedProfileName = normalizeProfileNameValue(profileNameValue);

    if (checkEmail && normalizedEmail) {
      try {
        const signInMethods = await fetchSignInMethodsForEmail(
          auth,
          normalizedEmail,
        );
        if (Array.isArray(signInMethods) && signInMethods.length > 0) {
          toast.error(
            "E-mail je već zauzet. Koristite prijavu ili drugi e-mail.",
          );
          return false;
        }
      } catch (error) {
        console.warn("Preskačem Firebase email uniqueness check:", error);
      }

      try {
        const emailOwner = await resolveIdentifierOwner({
          identifier: normalizedEmail,
          identifierType: "email",
        });
        if (
          emailOwner &&
          !isSameResolvedUser({
            payload: emailOwner,
            currentUserId,
            currentEmail,
          })
        ) {
          toast.error(
            "E-mail je već zauzet. Koristite prijavu ili drugi e-mail.",
          );
          return false;
        }
      } catch (error) {
        if (error?.code === "RATE_LIMIT") {
          toast.error("Previše pokušaja provjere. Pokušajte ponovo za minutu.");
          return false;
        }
      }
    }

    if (normalizedProfileName) {
      try {
        let nameOwner = await resolveIdentifierOwner({
          identifier: normalizedProfileName,
          identifierType: "email_username",
        });

        if (
          nameOwner &&
          !isSameResolvedUser({
            payload: nameOwner,
            currentUserId,
            currentEmail,
          })
        ) {
          toast.error(
            "Korisničko ime je već zauzeto. Odaberite drugo korisničko ime.",
          );
          return false;
        }
      } catch (error) {
        if (error?.code === "RATE_LIMIT") {
          toast.error("Previše pokušaja provjere. Pokušajte ponovo za minutu.");
          return false;
        }
      }
    }

    return true;
  };

  const resetUploadCropDraft = () => {
    setPendingUploadFile(null);
    setPendingUploadPreview("");
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    setIsApplyingCrop(false);
    setCropMeta({
      naturalWidth: 0,
      naturalHeight: 0,
      baseScale: 1,
      baseWidth: 0,
      baseHeight: 0,
    });
    revokeObjectUrl("pendingUpload");
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handleCropDialogOpenChange = (isOpen) => {
    if (isOpen) {
      setShowCropDialog(true);
      return;
    }
    setShowCropDialog(false);
    resetUploadCropDraft();
  };

  const handleCropImageLoad = (event) => {
    const imageElement = event.currentTarget;
    const naturalWidth = Number(imageElement?.naturalWidth || 0);
    const naturalHeight = Number(imageElement?.naturalHeight || 0);
    if (!naturalWidth || !naturalHeight) {
      toast.error("Ne mogu učitati sliku za obradu.");
      return;
    }

    const baseScale = Math.max(
      AVATAR_CROP_FRAME_SIZE / naturalWidth,
      AVATAR_CROP_FRAME_SIZE / naturalHeight,
    );

    setCropMeta({
      naturalWidth,
      naturalHeight,
      baseScale,
      baseWidth: naturalWidth * baseScale,
      baseHeight: naturalHeight * baseScale,
    });
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
  };

  const applyCroppedUpload = async () => {
    if (
      !pendingUploadFile ||
      !cropMeta.naturalWidth ||
      !cropMeta.naturalHeight
    ) {
      toast.error("Sliku nije moguće obraditi. Pokušaj ponovo.");
      return;
    }

    const img = cropPreviewImgRef.current;
    if (!img) {
      toast.error("Pregled slike nije spreman. Pokušaj ponovo.");
      return;
    }

    setIsApplyingCrop(true);
    try {
      const effectiveScale = cropMeta.baseScale * cropZoom;
      const sourceCropWidth = AVATAR_CROP_FRAME_SIZE / effectiveScale;
      const sourceCropHeight = AVATAR_CROP_FRAME_SIZE / effectiveScale;

      const sourceX = clamp(
        (cropMeta.naturalWidth - sourceCropWidth) / 2 - cropX / effectiveScale,
        0,
        Math.max(cropMeta.naturalWidth - sourceCropWidth, 0),
      );
      const sourceY = clamp(
        (cropMeta.naturalHeight - sourceCropHeight) / 2 -
          cropY / effectiveScale,
        0,
        Math.max(cropMeta.naturalHeight - sourceCropHeight, 0),
      );

      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_OUTPUT_SIZE;
      canvas.height = AVATAR_OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("Obrada slike trenutno nije dostupna.");
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceCropWidth,
        sourceCropHeight,
        0,
        0,
        AVATAR_OUTPUT_SIZE,
        AVATAR_OUTPUT_SIZE,
      );

      const croppedBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Ne mogu sačuvati izrezanu sliku."));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.92,
        );
      });

      const croppedFile = new File([croppedBlob], `avatar-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      revokeObjectUrl("upload");
      const preview = URL.createObjectURL(croppedFile);
      objectUrlRef.current.upload = preview;

      setUploadFile(croppedFile);
      setUploadPreview(preview);
      setAvatarMode("upload");
      setShowCropDialog(false);
      resetUploadCropDraft();
      toast.success("Profilna slika je pripremljena.");
    } catch (error) {
      console.error("Greška pri obradi slike:", error);
      toast.error("Obrada slike nije uspjela. Pokušaj ponovo.");
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const handleUploadChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file?.type?.startsWith("image/")) {
      toast.error("Odaberi sliku (JPG, PNG ili JPEG)");
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Slika je prevelika. Maksimalna veličina je 5MB.");
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    revokeObjectUrl("pendingUpload");
    const preview = URL.createObjectURL(file);
    objectUrlRef.current.pendingUpload = preview;

    setPendingUploadFile(file);
    setPendingUploadPreview(preview);
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    setCropMeta({
      naturalWidth: 0,
      naturalHeight: 0,
      baseScale: 1,
      baseWidth: 0,
      baseHeight: 0,
    });
    setShowCropDialog(true);

    if (event.target) {
      event.target.value = "";
    }
  };

  const handleStudioSave = (blob) => {
    if (!blob) return;

    revokeObjectUrl("studio");
    const preview = URL.createObjectURL(blob);
    objectUrlRef.current.studio = preview;

    setStudioBlob(blob);
    setStudioPreview(preview);
    setAvatarMode("studio");
    setShowStudio(false);
    toast.success("Avatar je pripremljen.");
  };

  const resolveSelectedAvatarFile = async () => {
    if (avatarMode === "upload" && uploadFile) {
      return uploadFile;
    }

    if (avatarMode === "studio" && studioBlob) {
      return avatarBlobToFile(studioBlob);
    }

    if (avatarMode === "google" && googleDraft?.photoURL) {
      try {
        return await urlToImageFile(googleDraft.photoURL);
      } catch (error) {
        console.error("Greška pri preuzimanju Google slike:", error);
        toast.warning(
          "Google slika nije dostupna, nastavak bez profilne slike.",
        );
        return null;
      }
    }

    return null;
  };

  const resolveRegisterLocationAddress = (locationValue) => {
    if (!isLocationComplete(locationValue)) return "";
    const resolved = resolveLocationSelection(locationValue);
    const addressLine = String(locationValue.address || "").trim();
    const formattedLine = String(
      locationValue.formattedAddress || resolved?.formatted || "",
    ).trim();
    if (addressLine && formattedLine) return `${addressLine}, ${formattedLine}`;
    return addressLine || formattedLine || "";
  };

  const persistRegisterLocation = (userId, locationValue) => {
    if (typeof window === "undefined") return;
    if (!userId || !isLocationComplete(locationValue)) return;
    try {
      window.localStorage.setItem(
        REGISTER_LOCATION_STORAGE_KEY,
        JSON.stringify({
          userId,
          location: locationValue,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      console.error("Greška pri spremanju lokacije registracije:", error);
    }
  };

  const persistProfileSetup = async ({
    name,
    email,
    profileFile,
    countryCodeValue,
    regionCodeValue,
    mobileValue,
    addressValue,
    authToken,
  }) => {
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await updateProfileApi.updateProfile({
          name: String(name || "").trim(),
          email: String(email || "")
            .trim()
            .toLowerCase(),
          profile: profileFile || undefined,
          country_code:
            String(countryCodeValue || "").replace(/\D/g, "") || undefined,
          region_code: String(regionCodeValue || "").toUpperCase() || undefined,
          mobile: String(mobileValue || "").trim() || undefined,
          address: String(addressValue || "").trim() || undefined,
          fcm_id: fetchFCM || "",
          auth_token: authToken || undefined,
        });

        if (response?.data?.error === false) {
          if (response?.data?.data) {
            loadUpdateUserData(response.data.data);
          }
          return { ok: true, response };
        }
        const responseError = new Error(
          response?.data?.message || "Spremanje profila nije uspjelo.",
        );
        responseError.data = response?.data || null;
        return { ok: false, error: responseError };
      } catch (error) {
        const status = Number(error?.response?.status || 0);
        const isRetryable = AUTH_SYNC_RETRYABLE_STATUSES.has(status);
        const isLastAttempt = attempt === maxRetries;
        if (!isRetryable || isLastAttempt) {
          return { ok: false, error };
        }
        await sleep(320 * (attempt + 1));
      }
    }

    return { ok: false };
  };

  const syncEmailSessionToken = async (payload) => {
    let lastError = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        return await userSignUpApi.userSignup(payload);
      } catch (error) {
        lastError = error;
        const status = Number(error?.response?.status || 0);
        const isRetryable = AUTH_SYNC_RETRYABLE_STATUSES.has(status);
        const isLastAttempt = attempt === maxRetries;

        if (!isRetryable || isLastAttempt) break;
        await sleep(450 * (attempt + 1));
      }
    }

    throw lastError;
  };

  const finalizeEmailRegistration = async () => {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const normalizedName = normalizeProfileNameValue(profileName);
    const locationAddress =
      locationSetupMode === "now"
        ? resolveRegisterLocationAddress(registerLocation)
        : "";

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      toast.error("Unesi ispravan e-mail");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Lozinka mora imati najmanje 6 znakova");
      return;
    }
    if (!normalizedName) {
      toast.error("Korisničko ime je obavezno.");
      return;
    }
    if (!isValidProfileUsername(normalizedName)) {
      toast.error(
        "Korisničko ime mora imati 3-30 znakova (slova, brojevi, ., _, -).",
      );
      return;
    }

    setIsBusy(true);
    try {
      const isIdentityUnique = await ensureRegistrationIdentityIsUnique({
        emailValue: normalizedEmail,
        profileNameValue: normalizedName,
        checkEmail: true,
      });
      if (!isIdentityUnique) {
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );
      const firebaseUser = userCredential?.user;

      if (!firebaseUser?.uid) {
        toast.error("Registracija nije završena. Pokušaj ponovo.");
        return;
      }

      const selectedAvatarFile = await resolveSelectedAvatarFile();
      const signupPayload = {
        name: normalizedName,
        email: normalizedEmail,
        firebase_id: firebaseUser.uid,
        fcm_id: fetchFCM || "",
        type: "email",
        auth_intent: "register",
        profile: selectedAvatarFile,
      };

      const signupResponse = await userSignUpApi.userSignup(signupPayload);
      let authData = signupResponse?.data;

      if (authData?.error === true) {
        toast.error(
          getDuplicateMessage({ data: authData }) ||
            authData?.message ||
            "Registracija nije uspjela.",
        );
        return;
      }

      if (!authData?.token) {
        const fallbackResponse = await syncEmailSessionToken({
          ...signupPayload,
          auth_intent: "login",
        });
        authData = fallbackResponse?.data;
      }

      if (!authData?.token || authData?.error === true) {
        toast.error(
          getDuplicateMessage({ data: authData }) ||
            authData?.message ||
            "Račun je kreiran, ali automatska prijava nije uspjela. Pokušaj prijavu ručno.",
        );
        return;
      }

      loadUpdateData(authData);

      await new Promise((resolve) => setTimeout(resolve, 0));
      const profileSync = await persistProfileSetup({
        name: normalizedName,
        email: normalizedEmail,
        profileFile: selectedAvatarFile,
        addressValue: locationAddress,
        authToken: authData?.token,
      });
      if (!profileSync?.ok) {
        const duplicateMessage = getDuplicateMessage(profileSync?.error);
        if (duplicateMessage) {
          toast.error(duplicateMessage);
          return;
        }
        toast.warning(
          "Račun je kreiran, ali dio podataka profila nije potvrđeno sačuvan. Možeš ih doraditi u postavkama.",
        );
      }

      if (locationSetupMode === "now" && isLocationComplete(registerLocation)) {
        persistRegisterLocation(authData?.data?.id, registerLocation);
      }

      sendEmailVerification(firebaseUser).catch(() => {
        // Email verifikacija je opcionalna nakon registracije.
      });

      toast.success(
        authData?.message ||
          "Račun je kreiran. E-mail možeš verificirati kasnije u postavkama.",
      );
      await OnHide({ preserveSession: true });
    } catch (error) {
      const duplicateMessage = getDuplicateMessage(error);
      if (duplicateMessage) {
        toast.error(duplicateMessage);
        return;
      }
      if (isGatewayOrTimeoutError(error)) {
        toast.error(
          "Račun je kreiran na Firebase strani, ali backend ne odgovara (504/timeout). Pokušaj prijavu za 1-2 minute.",
        );
        try {
          await signOut(auth);
        } catch (_) {}
      } else {
        handleFirebaseAuthError(error);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const finalizeAuthenticatedRegistration = async () => {
    const normalizedName = normalizeProfileNameValue(profileName);
    const locationAddress =
      locationSetupMode === "now"
        ? resolveRegisterLocationAddress(registerLocation)
        : "";

    if (!normalizedName) {
      toast.error("Korisničko ime je obavezno.");
      return;
    }
    if (!isValidProfileUsername(normalizedName)) {
      toast.error(
        "Korisničko ime mora imati 3-30 znakova (slova, brojevi, ., _, -).",
      );
      return;
    }

    if (!authPayload?.token && !authPayload?.data?.id) {
      toast.error("Sesija nije spremna. Pokušaj ponovo.");
      return;
    }

    setIsBusy(true);
    try {
      const isIdentityUnique = await ensureRegistrationIdentityIsUnique({
        profileNameValue: normalizedName,
        checkEmail: false,
        currentUserId: authPayload?.data?.id,
        currentEmail: authPayload?.data?.email || "",
      });
      if (!isIdentityUnique) {
        return;
      }

      const selectedAvatarFile = await resolveSelectedAvatarFile();
      const normalizedMobile = String(
        authPayload?.data?.mobile || formattedNumber || "",
      ).trim();
      const normalizedCountryCode = String(
        authPayload?.data?.country_code || countryCode || "",
      ).replace(/\D/g, "");
      const normalizedRegionCode = String(
        authPayload?.data?.region_code || regionCode || "",
      ).toUpperCase();

      const profileSync = await persistProfileSetup({
        name: normalizedName,
        email: authPayload?.data?.email || "",
        profileFile: selectedAvatarFile,
        mobileValue: normalizedMobile,
        countryCodeValue: normalizedCountryCode,
        regionCodeValue: normalizedRegionCode,
        addressValue: locationAddress,
        authToken: authPayload?.token,
      });

      if (!profileSync?.ok) {
        toast.error(
          getDuplicateMessage(profileSync?.error) ||
            "Završetak registracije nije uspio. Pokušaj ponovo.",
        );
        return;
      }

      if (locationSetupMode === "now" && isLocationComplete(registerLocation)) {
        persistRegisterLocation(authPayload?.data?.id, registerLocation);
      }

      toast.success("Registracija je uspješno završena.");
      await OnHide({ preserveSession: true });
    } catch (error) {
      toast.error(
        getDuplicateMessage(error) ||
          error?.response?.data?.message ||
          "Greška pri završetku registracije.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleFinalize = async () => {
    if (locationSetupMode === "now" && !isLocationComplete(registerLocation)) {
      toast.error(
        "Odaberi lokaciju ili nastavi opcijom 'Kasnije u postavkama'.",
      );
      return;
    }
    if (registerMethod === "email") {
      await finalizeEmailRegistration();
      return;
    }

    await finalizeAuthenticatedRegistration();
  };

  const handleBack = () => {
    if (step === "email_credentials" || step === "phone_credentials") {
      setStep("method");
      return;
    }

    if (step === "otp") {
      setStep("phone_credentials");
      return;
    }

    if (step === "profile_name") {
      if (registerMethod === "email") {
        setStep("email_credentials");
      } else if (registerMethod === "phone") {
        setStep("otp");
      } else {
        setStep("method");
      }
      return;
    }

    if (step === "avatar") {
      setStep("profile_name");
    }
  };

  const hasAnyMethodEnabled =
    availableMethods.email || availableMethods.phone || availableMethods.google;

  const hasGooglePhotoUrl = Boolean(String(googleDraft?.photoURL || "").trim());
  const canShowGoogleAvatar = hasGooglePhotoUrl && !googleAvatarLoadError;
  const canFinalizeAvatarSelection =
    avatarMode !== "studio" || Boolean(studioBlob);
  const canFinalizeLocationSelection =
    locationSetupMode !== "now" || isLocationComplete(registerLocation);
  const canFinalizeRegistration =
    canFinalizeAvatarSelection && canFinalizeLocationSelection;

  const openUploadPicker = () => {
    uploadInputRef.current?.click?.();
  };

  const handleAvatarModeSelect = (mode) => {
    if (mode === "google" && !hasGooglePhotoUrl) {
      toast.info("Google profilna slika nije dostupna.");
      return;
    }
    if (mode === "google" && googleAvatarLoadError) {
      toast.info("Google profilna slika se ne može učitati.");
      return;
    }
    if (mode === "google") {
      setGoogleAvatarIsLoading(true);
    }
    if (mode === "studio") {
      setShowStudio(true);
    }
    setAvatarMode(mode);
  };

  const handleUploadModeSelect = () => {
    if (uploadPreview) {
      setAvatarMode("upload");
    }
    openUploadPicker();
  };

  const openCropDialogForCurrentUpload = () => {
    if (!uploadFile) {
      openUploadPicker();
      return;
    }
    revokeObjectUrl("pendingUpload");
    const preview = URL.createObjectURL(uploadFile);
    objectUrlRef.current.pendingUpload = preview;
    setPendingUploadFile(uploadFile);
    setPendingUploadPreview(preview);
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    setCropMeta({
      naturalWidth: 0,
      naturalHeight: 0,
      baseScale: 1,
      baseWidth: 0,
      baseHeight: 0,
    });
    setShowCropDialog(true);
  };

  return (
    <>
      <Dialog open={IsRegisterModalOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="
w-screen max-w-none
h-dvh max-h-dvh
overflow-hidden touch-pan-y
!p-0 gap-0
rounded-none border-0
sm:w-[calc(100vw-1.2rem)]
sm:h-[calc(100dvh-1.2rem)]
sm:max-h-[calc(100dvh-1.2rem)]
sm:rounded-[22px]
sm:border-0
sm:shadow-[0_24px_80px_-40px_rgba(15,23,42,0.62)]
lg:max-w-6xl
xl:max-w-7xl
2xl:max-w-[1520px]
"
        >
          <div className="grid h-full min-h-0 lg:grid-cols-[0.95fr_1.25fr]">
            <AuthValuePanel mode={step === "otp" ? "otp" : "register"} />

            <div className="h-full min-h-0 overflow-y-auto overscroll-contain touch-pan-y [webkit-overflow-scrolling:touch] bg-background px-4 py-4 sm:px-7 sm:py-6 lg:px-8 lg:py-7">
              <div className="mx-auto w-full max-w-[620px]">
                <DialogHeader className="space-y-3">
                  <div className="inline-flex w-max items-center rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {settings?.company_name || "LMX"}
                  </div>

                  <DialogTitle className="text-left text-2xl font-semibold leading-tight text-foreground sm:text-[2rem]">
                    Registracija korisničkog računa
                  </DialogTitle>

                  <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    U nekoliko jasnih koraka podesi račun, profil i avatar. Već
                    imaš račun?{" "}
                    <span
                      className="cursor-pointer font-semibold text-primary underline"
                      onClick={async () => {
                        await OnHide();
                        setIsLoginOpen(true);
                      }}
                    >
                      Prijavi se
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-muted/35 px-3 py-2">
                  <p className="text-xs font-medium text-foreground">
                    {STEP_META[activeStepIndex]}
                  </p>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {activeStepIndex + 1}/{STEP_META.length}
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/70">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{ width: `${registerStepProgress}%` }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  />
                </div>

                {!hasAnyMethodEnabled ? (
                  <div className="mt-5 rounded-2xl border border-red-300/60 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
                    Trenutno nijedan metod registracije nije aktivan.
                    Kontaktiraj administratora.
                  </div>
                ) : null}

                <AnimatePresence mode="wait" initial={false}>
                  {step === "method" ? (
                    <motion.div
                      key="register-step-method"
                      {...registerPrimaryStepMotion}
                      className="mt-5 space-y-4"
                    >
                      <div className="space-y-3">
                        <p className="mb-3 text-sm font-semibold text-foreground">
                          Odaberi način registracije
                        </p>

                        <div className="grid gap-2.5 sm:grid-cols-3">
                          <button
                            type="button"
                            disabled={!availableMethods.email || isBusy}
                            onClick={() => handleMethodContinue("email")}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-xl border border-transparent bg-muted/40 p-3 text-center transition-all",
                              availableMethods.email
                                ? "hover:border-primary/40 hover:bg-primary/5"
                                : "cursor-not-allowed opacity-50",
                            )}
                          >
                            <MdOutlineEmail className="h-6 w-6 text-primary" />
                            <span className="text-sm font-semibold text-foreground">
                              E-mail
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Klasična prijava lozinkom
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={!availableMethods.phone || isBusy}
                            onClick={() => handleMethodContinue("phone")}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-xl border border-transparent bg-muted/40 p-3 text-center transition-all",
                              availableMethods.phone
                                ? "hover:border-primary/40 hover:bg-primary/5"
                                : "cursor-not-allowed opacity-50",
                            )}
                          >
                            <MdOutlineLocalPhone className="h-6 w-6 text-primary" />
                            <span className="text-sm font-semibold text-foreground">
                              Mobitel
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Brza potvrda putem OTP-a
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={!availableMethods.google || isBusy}
                            onClick={() => handleMethodContinue("google")}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-xl border border-transparent bg-muted/40 p-3 text-center transition-all",
                              availableMethods.google
                                ? "hover:border-primary/40 hover:bg-primary/5"
                                : "cursor-not-allowed opacity-50",
                            )}
                          >
                            <FcGoogle className="h-6 w-6" />
                            <span className="text-sm font-semibold text-foreground">
                              Google
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Nastavak postojećim Google profilom
                            </span>
                          </button>
                        </div>
                      </div>

                      <TermsAndPrivacyLinks
                        settings={settings}
                        OnHide={OnHide}
                      />
                    </motion.div>
                  ) : null}

                  {step === "email_credentials" ? (
                    <motion.div
                      key="register-step-email"
                      {...registerPrimaryStepMotion}
                      className="mt-5"
                    >
                      <form
                        className="flex flex-col gap-4"
                        onSubmit={handleEmailCredentials}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            Unesi pristupne podatke
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="h-8 px-2.5 text-xs"
                          >
                            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                            Nazad
                          </Button>
                        </div>

                        <div>
                          <Label className="mb-1.5 block text-sm font-semibold text-foreground">
                            E-mail
                          </Label>
                          <Input
                            type="email"
                            placeholder="Unesi e-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            className="h-11 rounded-xl border-border bg-background"
                            autoFocus
                          />
                        </div>

                        <div>
                          <Label className="mb-1.5 block text-sm font-semibold text-foreground">
                            Lozinka
                          </Label>
                          <div className="relative">
                            <Input
                              type={isPasswordVisible ? "text" : "password"}
                              placeholder="Unesi lozinku"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              autoComplete="new-password"
                              className="h-11 rounded-xl border-border bg-background pr-11"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setIsPasswordVisible((prev) => !prev)
                              }
                            >
                              {isPasswordVisible ? "Sakrij" : "Prikaži"}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="h-11 rounded-xl text-sm font-semibold"
                        >
                          Nastavi
                        </Button>
                      </form>

                      <TermsAndPrivacyLinks
                        settings={settings}
                        OnHide={OnHide}
                      />
                    </motion.div>
                  ) : null}

                  {step === "phone_credentials" ? (
                    <motion.div
                      key="register-step-phone"
                      {...registerPrimaryStepMotion}
                      className="mt-5"
                    >
                      <form
                        className="flex flex-col gap-4"
                        onSubmit={handleSendOtp}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            Potvrdi broj mobitela
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="h-8 px-2.5 text-xs"
                          >
                            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                            Nazad
                          </Button>
                        </div>

                        <RegisterAuthInputField
                          type="phone"
                          label="Broj mobitela"
                          placeholder="Unesi broj mobitela"
                          value={number}
                          handleInputChange={(value, data) => {
                            setNumber(value);
                            setCountryCode("+" + (data?.dialCode || ""));
                            setRegionCode(
                              data?.countryCode?.toLowerCase() || "",
                            );
                          }}
                          setCountryCode={setCountryCode}
                        />

                        <Button
                          type="submit"
                          className="h-11 rounded-xl text-sm font-semibold"
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Pošalji OTP"
                          )}
                        </Button>
                      </form>

                      <TermsAndPrivacyLinks
                        settings={settings}
                        OnHide={OnHide}
                      />
                    </motion.div>
                  ) : null}

                  {step === "otp" ? (
                    <motion.div
                      key="register-step-otp"
                      {...registerPrimaryStepMotion}
                      className="mt-5"
                    >
                      <div className="mb-3 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleBack}
                          className="h-8 px-2.5 text-xs"
                        >
                          <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                          Nazad
                        </Button>
                      </div>

                      <OtpScreen
                        OnHide={OnHide}
                        generateRecaptcha={generateRecaptcha}
                        countryCode={countryCode}
                        formattedNumber={formattedNumber}
                        confirmationResult={confirmationResult}
                        setConfirmationResult={setConfirmationResult}
                        setResendTimer={setResendTimer}
                        resendTimer={resendTimer}
                        regionCode={regionCode}
                        authIntent="register"
                        onAuthSuccess={handlePhoneOtpSuccess}
                        autoCloseOnSuccess={false}
                        key={`${IsRegisterModalOpen}-register-otp`}
                      />
                    </motion.div>
                  ) : null}

                  {step === "google_connecting" ? (
                    <motion.div
                      key="register-step-google-connecting"
                      {...registerPrimaryStepMotion}
                      className="mt-5 rounded-xl bg-muted/35 p-5 text-center"
                    >
                      <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm font-semibold text-foreground">
                        Povezujem Google nalog...
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sačekaj trenutak, pripremamo sljedeći korak.
                      </p>
                    </motion.div>
                  ) : null}

                  {step === "profile_name" ? (
                    <motion.div
                      key="register-step-profile-name"
                      {...registerPrimaryStepMotion}
                      className="mt-5"
                    >
                      <form
                        className="flex flex-col gap-4"
                        onSubmit={handleNameContinue}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            Kako želiš da te drugi vide?
                          </p>
                          {registerMethod !== "google" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleBack}
                              className="h-8 px-2.5 text-xs"
                            >
                              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                              Nazad
                            </Button>
                          ) : null}
                        </div>

                        <div>
                          <Label className="mb-1.5 block text-sm font-semibold text-foreground">
                            Korisničko ime
                          </Label>
                          <Input
                            type="text"
                            value={profileName}
                            placeholder="Unesi korisničko ime"
                            onChange={(e) => setProfileName(e.target.value)}
                            className="h-11 rounded-xl border-border bg-background"
                            autoFocus
                          />
                        </div>

                        {registerMethod === "google" && googleDraft?.name ? (
                          <button
                            type="button"
                            onClick={() =>
                              setProfileName(
                                normalizeProfileNameValue(googleDraft.name),
                              )
                            }
                            className="inline-flex w-max items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Predloži iz Google naloga:{" "}
                            {normalizeProfileNameValue(googleDraft.name)}
                          </button>
                        ) : null}

                        <Button
                          type="submit"
                          className="h-11 rounded-xl text-sm font-semibold"
                        >
                          Nastavi na avatar
                        </Button>
                      </form>
                    </motion.div>
                  ) : null}

                  {step === "avatar" ? (
                    <motion.div
                      key="register-step-avatar"
                      {...registerPrimaryStepMotion}
                      className="mt-5 space-y-3"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Odaberi profilnu sliku
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Učitaj svoju sliku, koristi Google sliku ili
                              kreiraj vlastiti avatar.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="h-8 px-2.5 text-xs"
                          >
                            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                            Nazad
                          </Button>
                        </div>

                        <input
                          ref={uploadInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleUploadChange}
                        />

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleAvatarModeSelect("none")}
                            className={cn(
                              "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                              avatarMode === "none"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted/60 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            Bez slike
                          </button>
                          <button
                            type="button"
                            onClick={handleUploadModeSelect}
                            className={cn(
                              "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                              avatarMode === "upload"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted/60 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            Vlastita slika
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAvatarModeSelect("google")}
                            disabled={
                              !hasGooglePhotoUrl || googleAvatarLoadError
                            }
                            className={cn(
                              "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                              avatarMode === "google"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted/60 text-muted-foreground hover:text-foreground",
                              !hasGooglePhotoUrl || googleAvatarLoadError
                                ? "cursor-not-allowed opacity-50"
                                : "",
                            )}
                          >
                            Google slika
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAvatarModeSelect("studio")}
                            className={cn(
                              "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                              avatarMode === "studio"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted/60 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            Avatar studio
                          </button>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                          <div className="mb-2">
                            <p className="text-sm font-semibold text-foreground">
                              Lokacija profila (opcionalno)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Lokaciju možeš postaviti odmah ili kasnije iz
                              postavki profila.
                            </p>
                          </div>

                          <div className="mb-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setLocationSetupMode("now")}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                                locationSetupMode === "now"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted/60 text-muted-foreground hover:text-foreground",
                              )}
                            >
                              Postavi sada
                            </button>
                            <button
                              type="button"
                              onClick={() => setLocationSetupMode("later")}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                                locationSetupMode === "later"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted/60 text-muted-foreground hover:text-foreground",
                              )}
                            >
                              Kasnije u postavkama
                            </button>
                          </div>

                          {locationSetupMode === "now" ? (
                            <BiHLocationSelector
                              value={registerLocation}
                              onChange={setRegisterLocation}
                              compact
                              showAddress
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Lokaciju možeš bez problema dodati kasnije u
                              sekciji profila.
                            </p>
                          )}
                        </div>

                        <div className="mt-2 space-y-3">
                          {avatarMode === "none" ? (
                            <div className="flex items-center gap-3 rounded-lg px-1 py-1">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  Nastavak bez slike
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Možeš kasnije dodati profilnu sliku iz
                                  postavki profila.
                                </p>
                              </div>
                            </div>
                          ) : null}

                          {avatarMode === "upload" ? (
                            <>
                              {uploadPreview ? (
                                <div className="flex flex-wrap items-center gap-3 rounded-lg px-1 py-1">
                                  <img
                                    src={uploadPreview}
                                    alt="Pregled odabrane slike"
                                    className="h-20 w-20 rounded-xl object-cover"
                                  />
                                  <div className="min-w-[180px] flex-1">
                                    <p className="text-sm font-semibold text-foreground">
                                      Vlastita slika je spremna
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Ako želiš, izreži kadar i podešavaj zum
                                      prije završetka.
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-9"
                                      onClick={openCropDialogForCurrentUpload}
                                    >
                                      Izreži i zumiraj
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-9"
                                      onClick={openUploadPicker}
                                    >
                                      Promijeni sliku
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={openUploadPicker}
                                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 bg-background px-4 py-7 text-center hover:border-primary/40 hover:bg-primary/5"
                                >
                                  <Camera className="h-5 w-5 text-primary" />
                                  <span className="text-sm font-semibold text-foreground">
                                    Dodaj vlastitu profilnu sliku
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    JPG, PNG ili JPEG, preporučeno do 5MB.
                                  </span>
                                </button>
                              )}
                            </>
                          ) : null}

                          {avatarMode === "google" ? (
                            <>
                              {canShowGoogleAvatar ? (
                                <div className="flex flex-wrap items-center gap-3 rounded-lg px-1 py-1">
                                  <div className="relative h-20 w-20 overflow-hidden rounded-xl">
                                    {googleAvatarIsLoading ? (
                                      <Skeleton className="absolute inset-0 h-full w-full rounded-none border-0" />
                                    ) : null}
                                    <img
                                      src={googleDraft.photoURL}
                                      alt="Google profilna slika"
                                      className={cn(
                                        "h-20 w-20 rounded-xl object-cover transition-opacity duration-200",
                                        googleAvatarIsLoading
                                          ? "opacity-0"
                                          : "opacity-100",
                                      )}
                                      loading="lazy"
                                      referrerPolicy="no-referrer"
                                      onLoad={() =>
                                        setGoogleAvatarIsLoading(false)
                                      }
                                      onError={() => {
                                        setGoogleAvatarLoadError(true);
                                        setGoogleAvatarIsLoading(false);
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-[180px] flex-1">
                                    <p className="text-sm font-semibold text-foreground">
                                      Google profilna slika
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Koristi se slika preuzeta s Google naloga.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 rounded-lg px-1 py-1">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      Google slika nije dostupna
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Odaberi vlastitu sliku ili kreiraj avatar
                                      u studiju.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : null}

                          {avatarMode === "studio" ? (
                            <>
                              {studioPreview && !showStudio ? (
                                <div className="flex flex-wrap items-center gap-3 rounded-lg px-1 py-1">
                                  <img
                                    src={studioPreview}
                                    alt="Studio avatar"
                                    className="h-20 w-20 rounded-xl object-cover"
                                  />
                                  <div className="min-w-[180px] flex-1">
                                    <p className="text-sm font-semibold text-foreground">
                                      Studio avatar je spreman
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Možeš ga ponovo urediti prije završetka
                                      registracije.
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9"
                                    onClick={() => setShowStudio(true)}
                                  >
                                    Uredi
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-1 py-1">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      Kreiraj studio avatar
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Otvori studio i napravi avatar u par
                                      klikova.
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9"
                                    onClick={() =>
                                      setShowStudio((prev) => !prev)
                                    }
                                  >
                                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                    {showStudio
                                      ? "Sakrij studio"
                                      : "Otvori studio"}
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : null}
                        </div>

                        {avatarMode === "studio" && showStudio ? (
                          <div className="mt-3">
                            <LmxAvatarGenerator
                              onSave={handleStudioSave}
                              onCancel={() => setShowStudio(false)}
                              isSaving={false}
                              compact
                            />
                          </div>
                        ) : null}

                        {!canFinalizeAvatarSelection ? (
                          <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                            Prije završetka klikni "Sačuvaj" unutar avatar
                            studija.
                          </p>
                        ) : null}
                        {locationSetupMode === "now" &&
                        !isLocationComplete(registerLocation) ? (
                          <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                            Odaberi lokaciju ili prebaci na opciju "Kasnije u
                            postavkama".
                          </p>
                        ) : null}

                        <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-full rounded-xl sm:w-auto"
                            onClick={() => setAvatarMode("none")}
                            disabled={isBusy}
                          >
                            Preskoči sliku
                          </Button>
                          <Button
                            type="button"
                            className="h-10 w-full rounded-xl font-semibold sm:w-auto"
                            onClick={handleFinalize}
                            disabled={isBusy || !canFinalizeRegistration}
                          >
                            {isBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : registerMethod === "email" ? (
                              "Kreiraj račun"
                            ) : (
                              "Završi registraciju"
                            )}
                          </Button>
                        </div>
                      </div>

                      <TermsAndPrivacyLinks
                        settings={settings}
                        OnHide={OnHide}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCropDialog} onOpenChange={handleCropDialogOpenChange}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(e) => {
            if (isApplyingCrop) {
              e.preventDefault();
            }
          }}
          className="max-w-[560px] rounded-2xl border-border bg-background p-4 sm:p-5"
        >
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-left text-lg font-semibold text-foreground">
              Uredi profilnu sliku
            </DialogTitle>
            <DialogDescription className="text-left text-xs text-muted-foreground">
              Podešavaj kadar i zum, pa potvrdi spremanje slike.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-4">
            <div className="mx-auto rounded-2xl border border-border bg-muted/30 p-3">
              <div
                className="relative overflow-hidden rounded-xl border border-border bg-black/5 dark:bg-black/25"
                style={{
                  width: `${AVATAR_CROP_FRAME_SIZE}px`,
                  height: `${AVATAR_CROP_FRAME_SIZE}px`,
                }}
              >
                {pendingUploadPreview ? (
                  <img
                    ref={cropPreviewImgRef}
                    src={pendingUploadPreview}
                    alt="Uređivanje profilne slike"
                    className="absolute left-1/2 top-1/2 max-w-none"
                    style={{
                      width: `${cropMeta.baseWidth || AVATAR_CROP_FRAME_SIZE}px`,
                      height: `${cropMeta.baseHeight || AVATAR_CROP_FRAME_SIZE}px`,
                      transform: `translate(-50%, -50%) translate(${cropX}px, ${cropY}px) scale(${cropZoom})`,
                      transformOrigin: "center center",
                    }}
                    onLoad={handleCropImageLoad}
                    onError={() =>
                      toast.error("Sliku nije moguće učitati za obradu.")
                    }
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Nema odabrane slike
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Zum</span>
                  <span>{cropZoom.toFixed(2)}x</span>
                </div>
                <Slider
                  min={1}
                  max={3}
                  step={0.01}
                  value={[cropZoom]}
                  onValueChange={(values) => setCropZoom(values?.[0] || 1)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Pomjeranje vodoravno</span>
                  <span>{Math.round(cropX)} px</span>
                </div>
                <Slider
                  min={-cropMaxOffsetX}
                  max={cropMaxOffsetX}
                  step={1}
                  disabled={cropMaxOffsetX <= 0}
                  value={[cropX]}
                  onValueChange={(values) =>
                    setCropX(
                      clamp(values?.[0] || 0, -cropMaxOffsetX, cropMaxOffsetX),
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Pomjeranje uspravno</span>
                  <span>{Math.round(cropY)} px</span>
                </div>
                <Slider
                  min={-cropMaxOffsetY}
                  max={cropMaxOffsetY}
                  step={1}
                  disabled={cropMaxOffsetY <= 0}
                  value={[cropY]}
                  onValueChange={(values) =>
                    setCropY(
                      clamp(values?.[0] || 0, -cropMaxOffsetY, cropMaxOffsetY),
                    )
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                onClick={() => handleCropDialogOpenChange(false)}
                disabled={isApplyingCrop}
              >
                Otkaži
              </Button>
              <Button
                type="button"
                className="h-10 rounded-xl font-semibold"
                onClick={applyCroppedUpload}
                disabled={isApplyingCrop || !pendingUploadPreview}
              >
                {isApplyingCrop ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sačuvaj izrez"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RegisterModal;
