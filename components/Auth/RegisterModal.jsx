"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { handleFirebaseAuthError, t } from "@/utils";
import {
  Fcmtoken,
  getOtpServiceProvider,
  settingsData,
} from "@/redux/reducer/settingSlice";
import { useSelector } from "react-redux";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  sendEmailVerification,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import { Button } from "../ui/button";
import { getOtpApi, userSignUpApi } from "@/utils/api";
import { loadUpdateData } from "@/redux/reducer/authSlice";
import { toast } from "@/utils/toastBs";
import {
  FcGoogle,
  MdOutlineEmail,
  MdOutlineLocalPhone,
} from "@/components/Common/UnifiedIconPack";
import OtpScreen from "./OtpScreen";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import TermsAndPrivacyLinks from "./TermsAndPrivacyLinks";
import RegPasswordForm from "./RegPasswordForm";
import RegisterAuthInputField from "./RegisterAuthInputField";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
import AuthValuePanel, { AuthCompactHighlights } from "./AuthValuePanel";
import { AnimatePresence, motion } from "framer-motion";
import { buildPhoneE164, maskPhoneForDebug } from "./phoneAuthUtils";
import { cn } from "@/lib/utils";

const RegisterModal = ({
  setIsMailSentSuccess,
  IsRegisterModalOpen,
  setIsRegisterModalOpen,
}) => {
  // Get Global data
  const settings = useSelector(settingsData);
  const auth = getAuth();
  const fetchFCM = useSelector(Fcmtoken);
  const isDemoMode = settings?.demo_mode;
  const otp_service_provider = useSelector(getOtpServiceProvider);

  // Different screens states
  const [IsLoginScreen, setIsLoginScreen] = useState(true);
  const [IsPasswordScreen, setIsPasswordScreen] = useState(false);
  const [IsOTPScreen, setIsOTPScreen] = useState(false);

  // Password visible or not
  const [IsPasswordVisible, setIsPasswordVisible] = useState(false);

  // Common input change value
  const [inputValue, setInputValue] = useState("");
  const [registerMethod, setRegisterMethod] = useState("email");

  // Register with mobile number states
  const [number, setNumber] = useState(isDemoMode ? "38761111222" : "");
  const [countryCode, setCountryCode] = useState("");
  const [regionCode, setRegionCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Loaders
  const [showLoader, setShowLoader] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Register with email states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // Active authentication methods
  const mobile_authentication = Number(settings?.mobile_authentication);
  const google_authentication = Number(settings?.google_authentication);
  const email_authentication = Number(settings?.email_authentication);

  // Remove any non-digit characters from the country code
  const countryCodeDigitsOnly = countryCode.replace(/\D/g, "");

  // Check if the entered number starts with the selected country code
  const startsWithCountryCode = number.startsWith(countryCodeDigitsOnly);

  // If the number starts with the country code, remove it
  const formattedNumber = startsWithCountryCode
    ? number.substring(countryCodeDigitsOnly.length)
    : number;

  const hasBothCredentialMethods =
    mobile_authentication === 1 && email_authentication === 1;

  const activeRegisterMethod =
    email_authentication === 1 && mobile_authentication === 0
      ? "email"
      : mobile_authentication === 1 && email_authentication === 0
        ? "phone"
        : registerMethod;

  const handleEmailInputChange = (value) => {
    setInputValue(value);
    setEmail(value);
  };

  const handlePhoneInputChange = (value, data) => {
    setNumber(value);
    setCountryCode("+" + (data?.dialCode || ""));
    setRegionCode(data?.countryCode.toLowerCase() || "");
  };

  const handleLoginSubmit = async (e) => {
    setShowLoader(true);
    e.preventDefault();

    if (activeRegisterMethod === "email") {
      const normalizedEmail = String(inputValue || email || "").trim();
      if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
        toast.error("Unesi ispravan e-mail");
        setShowLoader(false);
        return;
      }
      setEmail(normalizedEmail);
      setIsPasswordScreen(true);
      setIsLoginScreen(false);
      setShowLoader(false);
      return;
    }

    const phoneE164 = buildPhoneE164(countryCode, formattedNumber);
    if (activeRegisterMethod === "phone") {
      if (isValidPhoneNumber(phoneE164)) {
        await sendOTP(phoneE164);
      } else {
        toast.error("Neispravan broj telefona");
        setShowLoader(false);
      }
      return;
    }

    setShowLoader(false);
    if (email_authentication === 0 && mobile_authentication === 1) {
      toast.error("Neispravan broj telefona");
    } else {
      toast.error("Unesi ispravan broj ili e-mail");
    }
  };

  const handleMethodChange = (method) => {
    setRegisterMethod(method);
    if (method === "email") {
      setNumber(isDemoMode ? "38761111222" : "");
      setCountryCode("");
      setRegionCode("");
    } else {
      setInputValue("");
      setEmail("");
    }
  };

  const OnHide = async () => {
    await recaptchaClear();
    setIsRegisterModalOpen(false);
  };
  const generateRecaptcha = () => {
    // Ensure auth object is properly initialized

    if (!window.recaptchaVerifier) {
      // Check if container element exists
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        console.error("Container element 'recaptcha-container' not found.");
        return null; // Return null if container element not found
      }

      try {
        // Clear any existing reCAPTCHA instance
        recaptchaContainer.innerHTML = "";

        // Initialize RecaptchaVerifier
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
          },
        );
        return window.recaptchaVerifier;
      } catch (error) {
        console.error("Error initializing RecaptchaVerifier:", error.message);
        return null; // Return null if error occurs during initialization
      }
    }
    return window.recaptchaVerifier;
  };

  useEffect(() => {
    if (!IsRegisterModalOpen) return;
    if (mobile_authentication === 1 && email_authentication === 0) {
      setRegisterMethod("phone");
      return;
    }
    setRegisterMethod("email");
  }, [
    IsRegisterModalOpen,
    mobile_authentication,
    email_authentication,
    setRegisterMethod,
  ]);

  useEffect(() => {
    generateRecaptcha();

    return () => {
      // Clean up recaptcha container and verifier when component unmounts
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = "";
      }
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null; // Clear the recaptchaVerifier reference
      }
    };
  }, []);

  const recaptchaClear = async () => {
    const recaptchaContainer = document.getElementById("recaptcha-container");
    if (recaptchaContainer) {
      recaptchaContainer.innerHTML = "";
    }
    if (window.recaptchaVerifier) {
      window?.recaptchaVerifier?.recaptcha?.reset();
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const response = await signInWithPopup(auth, provider);
      const user = response.user;
      try {
        const response = await userSignUpApi.userSignup({
          name: user.displayName ? user.displayName : "",
          email: user?.email,
          firebase_id: user.uid, // Accessing UID directly from the user object
          fcm_id: fetchFCM ? fetchFCM : "",
          type: "google",
        });

        const data = response.data;
        loadUpdateData(data);
        if (data.error === true) {
          toast.error(data.message);
        } else {
          toast.success(data.message);
        }
        OnHide();
      } catch (error) {
        console.error("Error:", error);
      }
    } catch (error) {
      handleFirebaseAuthError(error);
    }
  };

  const sendOtpWithTwillio = async (phoneE164) => {
    try {
      const response = await getOtpApi.getOtp({ number: phoneE164 });
      if (response?.data?.error === false) {
        toast.success("OTP poslan");
        setIsOTPScreen(true);
        setIsLoginScreen(false);
        setResendTimer(60); // Start the 60-second timer
      } else {
        toast.error("Slanje OTP koda nije uspjelo.");
      }
    } catch (error) {
      console.error("error", error);
    } finally {
      setShowLoader(false);
    }
  };

  const sendOtpWithFirebase = async (phoneE164) => {
    try {
      const appVerifier = generateRecaptcha();
      if (!appVerifier) {
        handleFirebaseAuthError("auth/recaptcha-not-enabled");
        return;
      }
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneE164,
        appVerifier,
      );
      console.info("[Auth][Firebase] OTP request accepted", {
        phone: maskPhoneForDebug(phoneE164),
        verificationId: confirmation?.verificationId || null,
      });
      setConfirmationResult(confirmation);
      toast.success("OTP poslan");
      setIsOTPScreen(true);
      setIsLoginScreen(false);
    } catch (error) {
      handleFirebaseAuthError(error);
    } finally {
      setShowLoader(false);
    }
  };

  const sendOTP = async (phoneE164) => {
    setShowLoader(true);
    if (otp_service_provider === "twilio") {
      await sendOtpWithTwillio(phoneE164);
    } else {
      await sendOtpWithFirebase(phoneE164);
    }
  };

  const Signin = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("E-mail je obavezan");
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Neispravan e-mail");
      return;
    }
    if (username?.trim() === "") {
      toast.error("Korisničko ime je obavezno");
      return;
    }
    if (!password) {
      toast.error("Lozinka je obavezna");
      return;
    } else if (password.length < 6) {
      toast.error("Lozinka mora imati najmanje 6 znakova");
      return;
    }
    try {
      setShowLoader(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      await sendEmailVerification(user);
      try {
        const response = await userSignUpApi.userSignup({
          name: username ? username : "",
          email: email ? email : "",
          firebase_id: user?.uid,
          type: "email",
          registration: true,
        });
        OnHide();
        setIsMailSentSuccess(true);
      } catch (error) {
        console.log("error", error);
      }
    } catch (error) {
      console.log(error);
      handleFirebaseAuthError(error);
    } finally {
      setShowLoader(false);
    }
  };

  const handleShowLoginPassword = () => {
    setIsPasswordScreen(false);
    setIsOTPScreen(false);
    setIsLoginScreen(true);
  };
  const handleLoginClick = async () => {
    await OnHide();
    setIsLoginOpen(true);
  };

  const shouldShowForm =
    !(
      mobile_authentication === 0 &&
      email_authentication === 0 &&
      google_authentication === 1
    ) && IsLoginScreen;

  const showContinueButton =
    IsLoginScreen &&
    !(
      mobile_authentication === 0 &&
      email_authentication === 0 &&
      google_authentication === 1
    );

  const showOrSignInWith =
    IsLoginScreen &&
    !(
      mobile_authentication === 0 &&
      email_authentication === 0 &&
      google_authentication === 1
    ) &&
    google_authentication === 1;

  const resetState = () => {
    setIsLoginScreen(true);
    setIsPasswordScreen(false);
    setIsOTPScreen(false);
    setIsPasswordVisible(false);
    setInputValue("");
    setRegisterMethod(
      mobile_authentication === 1 && email_authentication === 0
        ? "phone"
        : "email",
    );
    setNumber(isDemoMode ? "38761111222" : "");
    setCountryCode("");
    setRegionCode("");
    setConfirmationResult(null);
    setShowLoader(false);
    setResendTimer(0);
    setEmail("");
    setPassword("");
    setUsername("");
  };

  useEffect(() => {
    if (!IsRegisterModalOpen) {
      resetState();
    }
  }, [
    IsRegisterModalOpen,
    isDemoMode,
    mobile_authentication,
    email_authentication,
  ]);

  const handleDialogOpenChange = async (isOpen) => {
    if (!isOpen) {
      await OnHide();
      return;
    }
    setIsRegisterModalOpen(true);
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
max-h-[calc(100dvh-0.75rem)]
sm:max-h-[calc(100dvh-2rem)]
overflow-hidden
gap-0
rounded-[24px] sm:rounded-[28px]
border border-border/80
bg-background
shadow-[0_30px_90px_-45px_rgba(15,23,42,0.55)]
"

        >
          <div className="grid h-full min-h-0 lg:grid-cols-[0.95fr_1.25fr]">
            <AuthValuePanel mode={IsOTPScreen ? "otp" : "register"} />

            <div className="min-h-0 overflow-y-auto bg-gradient-to-b from-background via-background to-muted/35 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
              <div className="mx-auto w-full max-w-[560px]">
                <DialogHeader className="space-y-3">
                  {!IsOTPScreen ? (
                    <div className="inline-flex w-max items-center rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {settings?.company_name || "LMX"}
                    </div>
                  ) : null}
                  <DialogTitle className="text-left text-2xl font-semibold leading-tight text-foreground sm:text-[2rem]">
                    {IsPasswordScreen
                      ? "Dovrši registraciju"
                      : IsOTPScreen
                        ? "Unesi verifikacijski kod"
                        : "Kreiraj korisnički račun"}
                  </DialogTitle>
                  <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    {IsPasswordScreen ? (
                      <>
                        Nastavljaš s email adresom {email}.{" "}
                        <span
                          className="cursor-pointer font-semibold text-primary underline"
                          onClick={handleShowLoginPassword}
                        >
                          Promijeni
                        </span>
                      </>
                    ) : IsOTPScreen ? (
                      <>
                        Kod smo poslali na {`+${number}`}.{" "}
                        <span
                          className="cursor-pointer font-semibold text-primary underline"
                          onClick={handleShowLoginPassword}
                        >
                          Promijeni broj
                        </span>
                      </>
                    ) : (
                      <>
                        Počni sa emailom ili brojem mobitela. Već imaš račun?{" "}
                        <span
                          className="cursor-pointer font-semibold text-primary underline"
                          onClick={handleLoginClick}
                        >
                          Prijavi se
                        </span>
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <AuthCompactHighlights className="mt-4" />

                <AnimatePresence mode="wait" initial={false}>
                  {IsLoginScreen ? (
                    <motion.div
                      key="register-start"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="mt-5 flex flex-col gap-5"
                    >
                      {shouldShowForm && (
                        <form
                          className="flex flex-col gap-5"
                          onSubmit={handleLoginSubmit}
                        >
                          {hasBothCredentialMethods ? (
                            <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-muted/70 p-1.5">
                              <button
                                type="button"
                                className={cn(
                                  "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                                  activeRegisterMethod === "email"
                                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:bg-card/80 hover:text-foreground",
                                )}
                                onClick={() => handleMethodChange("email")}
                              >
                                <MdOutlineEmail className="h-4 w-4" />
                                E-mail
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                                  activeRegisterMethod === "phone"
                                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:bg-card/80 hover:text-foreground",
                                )}
                                onClick={() => handleMethodChange("phone")}
                              >
                                <MdOutlineLocalPhone className="h-4 w-4" />
                                Mobitel
                              </button>
                            </div>
                          ) : null}

                          <div className="rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                            {activeRegisterMethod === "phone"
                              ? "Unesi broj mobitela za početak registracije."
                              : "Unesi e-mail adresu za početak registracije."}
                          </div>

                          {activeRegisterMethod === "email" ? (
                            <RegisterAuthInputField
                              key="register-email"
                              type="email"
                              label="E-mail"
                              placeholder="Unesi e-mail"
                              value={inputValue}
                              handleInputChange={handleEmailInputChange}
                            />
                          ) : null}

                          {activeRegisterMethod === "phone" ? (
                            <RegisterAuthInputField
                              key="register-phone"
                              type="phone"
                              label="Broj mobitela"
                              placeholder="Unesi broj mobitela"
                              value={number}
                              handleInputChange={handlePhoneInputChange}
                              setCountryCode={setCountryCode}
                            />
                          ) : null}

                          {showContinueButton && (
                            <Button
                              type="submit"
                              disabled={showLoader}
                              size="lg"
                              className="h-11 rounded-xl text-sm font-semibold"
                            >
                              {showLoader ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                "Nastavi"
                              )}
                            </Button>
                          )}
                        </form>
                      )}

                      {showOrSignInWith ? (
                        <div className="flex items-center gap-3">
                          <hr className="w-full border-border" />
                          <p className="text-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            ili nastavi sa
                          </p>
                          <hr className="w-full border-border" />
                        </div>
                      ) : null}

                      {google_authentication === 1 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-11 rounded-xl border-border bg-card text-sm font-semibold text-foreground hover:bg-muted"
                          onClick={handleGoogleSignup}
                        >
                          <FcGoogle className="!size-5" />
                          <span>Nastavi preko Google naloga</span>
                        </Button>
                      ) : null}

                      <TermsAndPrivacyLinks
                        t={t}
                        settings={settings}
                        OnHide={OnHide}
                      />
                    </motion.div>
                  ) : null}

                  {IsPasswordScreen ? (
                    <motion.div
                      key="register-password"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="mt-5"
                    >
                      <RegPasswordForm
                        username={username}
                        setUsername={setUsername}
                        password={password}
                        setPassword={setPassword}
                        IsPasswordVisible={IsPasswordVisible}
                        setIsPasswordVisible={setIsPasswordVisible}
                        showLoader={showLoader}
                        Signin={Signin}
                        t={t}
                      />
                    </motion.div>
                  ) : null}

                  {IsOTPScreen ? (
                    <motion.div
                      key="register-otp"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="mt-5"
                    >
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
                        key={IsOTPScreen + "register-otp"}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RegisterModal;
