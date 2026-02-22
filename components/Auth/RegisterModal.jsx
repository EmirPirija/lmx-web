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
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
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
  getOtpApi,
  updateProfileApi,
  userSignUpApi,
} from "@/utils/api";

import AuthValuePanel, { AuthCompactHighlights } from "./AuthValuePanel";
import OtpScreen from "./OtpScreen";
import TermsAndPrivacyLinks from "./TermsAndPrivacyLinks";
import RegisterAuthInputField from "./RegisterAuthInputField";
import LmxAvatarGenerator from "@/components/Avatar/LmxAvatarGenerator";
import { buildPhoneE164, maskPhoneForDebug } from "./phoneAuthUtils";
import {
  clearRecaptchaVerifier,
  ensureRecaptchaVerifier,
  isRecaptchaRecoverableError,
} from "./recaptchaManager";

const STEP_META = [
  "Izvor registracije",
  "Potvrda pristupa",
  "Ime profila",
  "Avatar i završetak",
];

const EMAIL_REGEX = /\S+@\S+\.\S+/;
const AVATAR_CROP_FRAME_SIZE = 272;
const AVATAR_OUTPUT_SIZE = 512;

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

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

const RegisterModal = ({
  setIsMailSentSuccess,
  IsRegisterModalOpen,
  setIsRegisterModalOpen,
}) => {
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
  const [countryCode, setCountryCode] = useState("");
  const [regionCode, setRegionCode] = useState("");

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
    setCountryCode("");
    setRegionCode("");

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
    clearRecaptchaVerifier({ containerId: "recaptcha-container" });
  };

  const OnHide = async () => {
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
      clearRecaptchaVerifier({ containerId: "recaptcha-container" });
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
    setGoogleAvatarIsLoading(Boolean(String(googleDraft?.photoURL || "").trim()));
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
    setCropX((prev) => clamp(prev, -cropMaxOffsetX, cropMaxOffsetX));
  }, [cropMaxOffsetX]);

  useEffect(() => {
    setCropY((prev) => clamp(prev, -cropMaxOffsetY, cropMaxOffsetY));
  }, [cropMaxOffsetY]);

  const sendOtpWithTwillio = async (phoneE164) => {
    try {
      const response = await getOtpApi.getOtp({ number: phoneE164 });
      if (response?.data?.error === false) {
        toast.success("OTP poslan");
        setStep("otp");
        setResendTimer(60);
      } else {
        toast.error(response?.data?.message || "Slanje OTP koda nije uspjelo.");
      }
    } catch (error) {
      console.error("Greška pri slanju OTP-a:", error);
      toast.error("Slanje OTP koda nije uspjelo.");
    }
  };

  const sendOtpWithFirebase = async (phoneE164) => {
    const requestOtp = async (forceRecreate = true) => {
      const appVerifier = generateRecaptcha({ forceRecreate });
      if (!appVerifier) {
        handleFirebaseAuthError("auth/recaptcha-not-enabled");
        return null;
      }
      return signInWithPhoneNumber(auth, phoneE164, appVerifier);
    };

    try {
      let confirmation = await requestOtp(true);
      if (!confirmation) {
        return;
      }
      if (!confirmation?.verificationId) {
        toast.error("Slanje OTP koda nije potvrđeno. Pokušaj ponovo.");
        return;
      }

      console.info("[Auth][Firebase] OTP request accepted", {
        phone: maskPhoneForDebug(phoneE164),
        verificationId: confirmation?.verificationId || null,
      });
      setConfirmationResult(confirmation);
      toast.success("OTP poslan");
      setResendTimer(60);
      setStep("otp");
    } catch (error) {
      if (isRecaptchaRecoverableError(error)) {
        try {
          const retriedConfirmation = await requestOtp(true);
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
          handleFirebaseAuthError(retryError);
          return;
        }
      }
      handleFirebaseAuthError(error);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    const phoneE164 = buildPhoneE164(countryCode, formattedNumber);

    if (!isValidPhoneNumber(phoneE164)) {
      toast.error("Neispravan broj telefona");
      return;
    }

    setIsBusy(true);
    try {
      if (otp_service_provider === "twilio") {
        await sendOtpWithTwillio(phoneE164);
      } else {
        await sendOtpWithFirebase(phoneE164);
      }
    } finally {
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

      const response = await userSignUpApi.userSignup({
        name: googleUser?.displayName || "",
        email: googleUser?.email || "",
        firebase_id: googleUser?.uid,
        fcm_id: fetchFCM ? fetchFCM : "",
        type: "google",
      });

      const data = response?.data;

      if (data?.error === true) {
        toast.error(data?.message || "Google registracija nije uspjela.");
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
      handleFirebaseAuthError(error);
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

    const normalizedEmail = String(email || "").trim().toLowerCase();

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
      const emailNameGuess = normalizedEmail.split("@")[0]?.replace(/[._-]+/g, " ") || "";
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
    const normalizedName = String(profileName || "").trim();
    if (!normalizedName) {
      toast.error("Ime je obavezno");
      return;
    }
    setProfileName(normalizedName);
    setStep("avatar");
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
    if (!pendingUploadFile || !cropMeta.naturalWidth || !cropMeta.naturalHeight) {
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
        (cropMeta.naturalHeight - sourceCropHeight) / 2 - cropY / effectiveScale,
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
        toast.warning("Google slika nije dostupna, nastavak bez profilne slike.");
        return null;
      }
    }

    return null;
  };

  const finalizeEmailRegistration = async () => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(profileName || "").trim();

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      toast.error("Unesi ispravan e-mail");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Lozinka mora imati najmanje 6 znakova");
      return;
    }
    if (!normalizedName) {
      toast.error("Ime je obavezno");
      return;
    }

    setIsBusy(true);
    try {
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

      const response = await userSignUpApi.userSignup({
        name: normalizedName,
        email: normalizedEmail,
        firebase_id: firebaseUser.uid,
        type: "email",
        registration: true,
        profile: selectedAvatarFile,
      });

      if (response?.data?.error === true) {
        toast.error(response?.data?.message || "Registracija nije uspjela.");
        return;
      }

      await sendEmailVerification(firebaseUser);
      try {
        await auth.signOut();
      } catch {
        // Firebase odjava ovdje nije kritična.
      }

      toast.success(response?.data?.message || "Račun je kreiran. Potvrdi e-mail.");
      await OnHide();
      setIsMailSentSuccess(true);
    } catch (error) {
      handleFirebaseAuthError(error);
    } finally {
      setIsBusy(false);
    }
  };

  const finalizeAuthenticatedRegistration = async () => {
    const normalizedName = String(profileName || "").trim();

    if (!normalizedName) {
      toast.error("Ime je obavezno");
      return;
    }

    if (!authPayload?.token && !authPayload?.data?.id) {
      toast.error("Sesija nije spremna. Pokušaj ponovo.");
      return;
    }

    setIsBusy(true);
    try {
      const selectedAvatarFile = await resolveSelectedAvatarFile();

      const response = await updateProfileApi.updateProfile({
        name: normalizedName,
        profile: selectedAvatarFile,
        fcm_id: fetchFCM || "",
      });

      if (response?.data?.error === true) {
        toast.error(response?.data?.message || "Završetak registracije nije uspio.");
        return;
      }

      const updatedUser = response?.data?.data;
      if (updatedUser) {
        loadUpdateUserData(updatedUser);
      }

      toast.success("Registracija je uspješno završena.");
      await OnHide();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Greška pri završetku registracije.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleFinalize = async () => {
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
w-[calc(100vw-0.75rem)]
sm:w-full sm:max-w-6xl
xl:max-w-7xl
2xl:max-w-[1600px]
max-w-none
h-[calc(100dvh-0.75rem)]
sm:h-auto
max-h-[calc(100dvh-0.75rem)]
sm:max-h-[calc(100dvh-2rem)]
overflow-hidden
touch-pan-y
gap-0
rounded-[24px] sm:rounded-[28px]
border border-border/80
bg-background
shadow-[0_30px_90px_-45px_rgba(15,23,42,0.55)]
"
        >
          <div className="grid h-full min-h-0 lg:grid-cols-[0.95fr_1.25fr]">
            <AuthValuePanel mode={step === "otp" ? "otp" : "register"} />

            <div className="min-h-0 overflow-y-auto overscroll-contain touch-pan-y [webkit-overflow-scrolling:touch] bg-gradient-to-b from-background via-background to-muted/35 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
              <div className="mx-auto w-full max-w-[620px]">
                <DialogHeader className="space-y-3">
                  <div className="inline-flex w-max items-center rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {settings?.company_name || "LMX"}
                  </div>

                  <DialogTitle className="text-left text-2xl font-semibold leading-tight text-foreground sm:text-[2rem]">
                    Registracija korisničkog računa
                  </DialogTitle>

                  <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    U nekoliko jasnih koraka podesi račun, profil i avatar. Već imaš račun?{" "}
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

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STEP_META.map((label, idx) => {
                    const isDone = idx < activeStepIndex;
                    const isActive = idx === activeStepIndex;
                    return (
                      <motion.div
                        key={label}
                        animate={{ scale: isActive ? 1.015 : 1, y: isActive ? -1 : 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        className={cn(
                          "rounded-xl border px-2.5 py-2 text-center transition-all",
                          isActive
                            ? "border-primary bg-primary/10 text-primary shadow-[0_10px_30px_-22px_rgba(20,184,166,0.8)]"
                            : isDone
                              ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "border-border bg-muted/40 text-muted-foreground",
                        )}
                      >
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                          Korak {idx + 1}
                        </div>
                        <p className="text-[11px] font-medium leading-tight">{label}</p>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/70">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary/70 via-primary to-cyan-400/90"
                    animate={{ width: `${registerStepProgress}%` }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  />
                </div>

                <AuthCompactHighlights className="mt-4" />

                {!hasAnyMethodEnabled ? (
                  <div className="mt-5 rounded-2xl border border-red-300/60 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
                    Trenutno nijedan metod registracije nije aktivan. Kontaktiraj administratora.
                  </div>
                ) : null}

                <AnimatePresence mode="wait" initial={false}>
                  {step === "method" ? (
                    <motion.div
                      key="register-step-method"
                      {...registerPrimaryStepMotion}
                      className="mt-5 space-y-4"
                    >
                      <div className="rounded-2xl border border-border/80 bg-card/70 p-4 sm:p-5">
                        <p className="mb-3 text-sm font-semibold text-foreground">
                          Odaberi način registracije
                        </p>

                        <div className="grid gap-2.5 sm:grid-cols-3">
                          <button
                            type="button"
                            disabled={!availableMethods.email || isBusy}
                            onClick={() => handleMethodContinue("email")}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
                              availableMethods.email
                                ? "border-border bg-background hover:border-primary/60 hover:bg-primary/5"
                                : "cursor-not-allowed border-border/60 bg-muted/40 opacity-50",
                            )}
                          >
                            <MdOutlineEmail className="h-6 w-6 text-primary" />
                            <span className="text-sm font-semibold text-foreground">E-mail</span>
                            <span className="text-xs text-muted-foreground">Klasična prijava lozinkom</span>
                          </button>

                          <button
                            type="button"
                            disabled={!availableMethods.phone || isBusy}
                            onClick={() => handleMethodContinue("phone")}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
                              availableMethods.phone
                                ? "border-border bg-background hover:border-primary/60 hover:bg-primary/5"
                                : "cursor-not-allowed border-border/60 bg-muted/40 opacity-50",
                            )}
                          >
                            <MdOutlineLocalPhone className="h-6 w-6 text-primary" />
                            <span className="text-sm font-semibold text-foreground">Mobitel</span>
                            <span className="text-xs text-muted-foreground">Brza potvrda putem OTP-a</span>
                          </button>

                          <button
                            type="button"
                            disabled={!availableMethods.google || isBusy}
                            onClick={() => handleMethodContinue("google")}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
                              availableMethods.google
                                ? "border-border bg-background hover:border-primary/60 hover:bg-primary/5"
                                : "cursor-not-allowed border-border/60 bg-muted/40 opacity-50",
                            )}
                          >
                            <FcGoogle className="h-6 w-6" />
                            <span className="text-sm font-semibold text-foreground">Google</span>
                            <span className="text-xs text-muted-foreground">Nastavak postojećim Google profilom</span>
                          </button>
                        </div>
                      </div>

                      <TermsAndPrivacyLinks settings={settings} OnHide={OnHide} />
                    </motion.div>
                  ) : null}

                  {step === "email_credentials" ? (
                    <motion.div
                      key="register-step-email"
                      {...registerPrimaryStepMotion}
                      className="mt-5"
                    >
                      <form
                        className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card/70 p-4 sm:p-5"
                        onSubmit={handleEmailCredentials}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">Unesi pristupne podatke</p>
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
                              onClick={() => setIsPasswordVisible((prev) => !prev)}
                            >
                              {isPasswordVisible ? "Sakrij" : "Prikaži"}
                            </button>
                          </div>
                        </div>

                        <Button type="submit" className="h-11 rounded-xl text-sm font-semibold">
                          Nastavi
                        </Button>
                      </form>

                      <TermsAndPrivacyLinks settings={settings} OnHide={OnHide} />
                    </motion.div>
                  ) : null}

                  {step === "phone_credentials" ? (
                    <motion.div
                      key="register-step-phone"
                      {...registerPrimaryStepMotion}
                      className="mt-5"
                    >
                      <form
                        className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card/70 p-4 sm:p-5"
                        onSubmit={handleSendOtp}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">Potvrdi broj mobitela</p>
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
                            setRegionCode(data?.countryCode?.toLowerCase() || "");
                          }}
                          setCountryCode={setCountryCode}
                        />

                        <Button
                          type="submit"
                          className="h-11 rounded-xl text-sm font-semibold"
                          disabled={isBusy}
                        >
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pošalji OTP"}
                        </Button>
                      </form>

                      <TermsAndPrivacyLinks settings={settings} OnHide={OnHide} />
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
                      className="mt-5 rounded-2xl border border-border/80 bg-card/70 p-6 text-center"
                    >
                      <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm font-semibold text-foreground">Povezujem Google nalog...</p>
                      <p className="mt-1 text-xs text-muted-foreground">Sačekaj trenutak, pripremamo sljedeći korak.</p>
                    </motion.div>
                  ) : null}

                  {step === "profile_name" ? (
                    <motion.div
                      key="register-step-profile-name"
                      {...registerPrimaryStepMotion}
                      className="mt-5"
                    >
                      <form
                        className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card/70 p-4 sm:p-5"
                        onSubmit={handleNameContinue}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">Kako želiš da te drugi vide?</p>
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
                            Ime profila
                          </Label>
                          <Input
                            type="text"
                            value={profileName}
                            placeholder="Unesi ime ili korisničko ime"
                            onChange={(e) => setProfileName(e.target.value)}
                            className="h-11 rounded-xl border-border bg-background"
                            autoFocus
                          />
                        </div>

                        {registerMethod === "google" && googleDraft?.name ? (
                          <button
                            type="button"
                            onClick={() => setProfileName(googleDraft.name)}
                            className="inline-flex w-max items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Zadrži Google ime: {googleDraft.name}
                          </button>
                        ) : null}

                        <Button type="submit" className="h-11 rounded-xl text-sm font-semibold">
                          Nastavi na avatar
                        </Button>
                      </form>
                    </motion.div>
                  ) : null}

                  {step === "avatar" ? (
                    <motion.div
                      key="register-step-avatar"
                      {...registerPrimaryStepMotion}
                      className="mt-5 space-y-4"
                    >
                      <div className="rounded-2xl border border-border/80 bg-card/70 p-4 sm:p-5">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Odaberi profilnu sliku</p>
                            <p className="text-xs text-muted-foreground">
                              Možeš dodati svoju sliku, uzeti Google sliku ili kreirati avatar.
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

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <button
                            type="button"
                            onClick={() => handleAvatarModeSelect("none")}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-all",
                              avatarMode === "none"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background hover:border-primary/50",
                            )}
                          >
                            Bez slike
                          </button>
                          <button
                            type="button"
                            onClick={handleUploadModeSelect}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-all",
                              avatarMode === "upload"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background hover:border-primary/50",
                            )}
                          >
                            Vlastita slika
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAvatarModeSelect("google")}
                            disabled={!hasGooglePhotoUrl || googleAvatarLoadError}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-all",
                              avatarMode === "google"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background hover:border-primary/50",
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
                              "rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-all",
                              avatarMode === "studio"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background hover:border-primary/50",
                            )}
                          >
                            Avatar studio
                          </button>
                        </div>

                        <div className="mt-3 rounded-xl border border-border bg-background p-3 sm:p-4">
                          {avatarMode === "none" ? (
                            <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">Profil bez slike</p>
                                <p className="text-xs text-muted-foreground">
                                  Možeš kasnije dodati profilnu sliku iz postavki profila.
                                </p>
                              </div>
                            </div>
                          ) : null}

                          {avatarMode === "upload" ? (
                            <>
                              {uploadPreview ? (
                                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 p-3">
                                  <img
                                    src={uploadPreview}
                                    alt="Pregled odabrane slike"
                                    className="h-20 w-20 rounded-xl border border-border object-cover"
                                  />
                                  <div className="min-w-[180px] flex-1">
                                    <p className="text-sm font-semibold text-foreground">Vlastita slika je spremna</p>
                                    <p className="text-xs text-muted-foreground">
                                      Ako želiš, izreži kadar i podešavaj zum prije završetka.
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
                                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-7 text-center hover:border-primary/50 hover:bg-primary/5"
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
                                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 p-3">
                                  <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
                                    {googleAvatarIsLoading ? (
                                      <Skeleton className="absolute inset-0 h-full w-full rounded-none border-0" />
                                    ) : null}
                                    <img
                                      src={googleDraft.photoURL}
                                      alt="Google profilna slika"
                                      className={cn(
                                        "h-20 w-20 rounded-xl object-cover transition-opacity duration-200",
                                        googleAvatarIsLoading ? "opacity-0" : "opacity-100",
                                      )}
                                      loading="lazy"
                                      referrerPolicy="no-referrer"
                                      onLoad={() => setGoogleAvatarIsLoading(false)}
                                      onError={() => {
                                        setGoogleAvatarLoadError(true);
                                        setGoogleAvatarIsLoading(false);
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-[180px] flex-1">
                                    <p className="text-sm font-semibold text-foreground">Google profilna slika</p>
                                    <p className="text-xs text-muted-foreground">
                                      Koristi se slika preuzeta s Google naloga.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      Google slika nije dostupna
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Odaberi vlastitu sliku ili kreiraj avatar u studiju.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : null}

                          {avatarMode === "studio" ? (
                            <>
                              {studioPreview ? (
                                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 p-3">
                                  <img
                                    src={studioPreview}
                                    alt="Studio avatar"
                                    className="h-20 w-20 rounded-xl border border-border object-cover"
                                  />
                                  <div className="min-w-[180px] flex-1">
                                    <p className="text-sm font-semibold text-foreground">Studio avatar je spreman</p>
                                    <p className="text-xs text-muted-foreground">
                                      Možeš ga ponovo urediti prije završetka registracije.
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9"
                                    onClick={() => setShowStudio(true)}
                                  >
                                    Uredi avatar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 p-3">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">Kreiraj studio avatar</p>
                                    <p className="text-xs text-muted-foreground">
                                      Otvori studio i napravi avatar u par klikova.
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9"
                                    onClick={() => setShowStudio(true)}
                                  >
                                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                    Otvori studio
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : null}
                        </div>

                        <div className="mt-3 rounded-xl border border-border bg-background p-3">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">Avatar studio</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => setShowStudio((prev) => !prev)}
                            >
                              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                              {showStudio ? "Sakrij studio" : "Otvori studio"}
                            </Button>
                          </div>

                          {showStudio ? (
                            <div className="mt-2 rounded-xl border border-border bg-muted/40 p-2">
                              <LmxAvatarGenerator
                                onSave={handleStudioSave}
                                onCancel={() => setShowStudio(false)}
                                isSaving={false}
                              />
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Studio je opcionalan i možeš ga koristiti kad god želiš.
                            </p>
                          )}
                        </div>

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
                            disabled={isBusy}
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

                      <TermsAndPrivacyLinks settings={settings} OnHide={OnHide} />
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
                    onError={() => toast.error("Sliku nije moguće učitati za obradu.")}
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
                    setCropX(clamp(values?.[0] || 0, -cropMaxOffsetX, cropMaxOffsetX))
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
                    setCropY(clamp(values?.[0] || 0, -cropMaxOffsetY, cropMaxOffsetY))
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
