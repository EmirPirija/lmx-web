"use client";
import { handleFirebaseAuthError, t } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Fcmtoken,
  getIsDemoMode,
  settingsData,
} from "@/redux/reducer/settingSlice";
import "react-phone-input-2/lib/style.css";
import { Button } from "../ui/button";
import { FcGoogle } from "@/components/Common/UnifiedIconPack";
import { MdOutlineEmail, MdOutlineLocalPhone } from "@/components/Common/UnifiedIconPack";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
} from "firebase/auth";
import { toast } from "@/utils/toastBs";
import { userSignUpApi } from "@/utils/api";
import { loadUpdateData } from "@/redux/reducer/authSlice";
import LoginWithEmailForm from "./LoginWithEmailForm";
import LoginWithMobileForm from "./LoginWithMobileForm";
import OtpScreen from "./OtpScreen";
import TermsAndPrivacyLinks from "./TermsAndPrivacyLinks";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import AuthValuePanel, { AuthCompactHighlights } from "./AuthValuePanel";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const LoginModal = ({ IsLoginOpen, setIsRegisterModalOpen }) => {
  const settings = useSelector(settingsData);
  const auth = getAuth();
  const fetchFCM = useSelector(Fcmtoken);
  const isDemoMode = useSelector(getIsDemoMode);
  const [IsOTPScreen, setIsOTPScreen] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [loginStates, setLoginStates] = useState({
    number: isDemoMode ? "+919876598765" : "",
    countryCode: "",
    showLoader: false,
    regionCode: "",
  });

  const [confirmationResult, setConfirmationResult] = useState(null);

  const { number, countryCode } = loginStates;

  // Remove any non-digit characters from the country code
  const countryCodeDigitsOnly = countryCode.replace(/\D/g, "");

  // Check if the entered number starts with the selected country code
  const startsWithCountryCode = number.startsWith(countryCodeDigitsOnly);

  // If the number starts with the country code, remove it
  const formattedNumber = startsWithCountryCode
    ? number.substring(countryCodeDigitsOnly.length)
    : number;

  // Active authentication methods
  const mobile_authentication = Number(settings?.mobile_authentication);
  const google_authentication = Number(settings?.google_authentication);
  const email_authentication = Number(settings?.email_authentication);

  const [IsLoginWithEmail, setIsLoginWithEmail] = useState(
    mobile_authentication === 0 && email_authentication === 1 ? true : false
  );

  const hasOnlyGoogleAuth =
    mobile_authentication === 0 &&
    email_authentication === 0 &&
    google_authentication === 1;

  const canUseBothMethods =
    mobile_authentication === 1 && email_authentication === 1;

  const canShowCredentialForm = !hasOnlyGoogleAuth;

  const canShowGoogleDivider = canShowCredentialForm && google_authentication === 1;

  const getInitialLoginState = () => ({
    number: isDemoMode ? "+919876598765" : "",
    countryCode: "",
    showLoader: false,
    regionCode: "",
  });

  const resetState = () => {
    setIsOTPScreen(false);
    setResendTimer(0);
    setConfirmationResult(null);
    setLoginStates(getInitialLoginState());
    setIsLoginWithEmail(
      mobile_authentication === 0 && email_authentication === 1
    );
  };

  useEffect(() => {
    if (IsLoginOpen) {
      setIsLoginWithEmail(
        mobile_authentication === 0 && email_authentication === 1
      );
      return;
    }
    resetState();
  }, [IsLoginOpen, mobile_authentication, email_authentication, isDemoMode]);

  const OnHide = async () => {
    await recaptchaClear();
    resetState();
    setIsLoginOpen(false);
  };

  const handleDialogOpenChange = async (isOpen) => {
    if (!isOpen) {
      await OnHide();
      return;
    }
    setIsLoginOpen(true);
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
          }
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
      const res = await signInWithPopup(auth, provider);
      const user = res.user;
      try {
        const response = await userSignUpApi.userSignup({
          name: user.displayName ? user.displayName : "",
          email: user?.email,
          firebase_id: user?.uid, // Accessing UID directly from the user object
          fcm_id: fetchFCM ? fetchFCM : "",
          type: "google",
        });

        const data = response.data;
        if (data.error === true) {
          toast.error(data.message);
        } else {
          loadUpdateData(data);
          toast.success(data.message);
        }
        OnHide();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Registracija nije završena. Pokušajte ponovo.");
      }
    } catch (error) {
      const errorCode = error.code;
      handleFirebaseAuthError(errorCode);
    }
  };

  const handleCreateAnAccount = async () => {
    await OnHide();
    setIsRegisterModalOpen(true);
  };

  return (
    <>
      <Dialog open={IsLoginOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="w-[min(1040px,calc(100vw-1rem))] max-w-none max-h-[calc(100dvh-1rem)] overflow-hidden p-0 gap-0 rounded-3xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="grid h-full min-h-0 lg:grid-cols-[0.95fr_1.05fr]">
            <AuthValuePanel mode={IsOTPScreen ? "otp" : "login"} />

            <div className="min-h-0 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <DialogHeader>
                <DialogTitle className="text-left text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
                  {IsOTPScreen ? (
                    "Potvrdi sigurnosni kod"
                  ) : (
                    <>
                      Prijavi se na{" "}
                      <span className="text-primary">{settings?.company_name || "LMX"}</span>
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="text-left text-sm text-slate-600 sm:text-base">
                  {IsOTPScreen ? (
                    <>
                      Kod smo poslali na {`${countryCode}${formattedNumber}`}.{" "}
                      <span
                        onClick={() => setIsOTPScreen(false)}
                        className="text-primary underline cursor-pointer"
                      >
                        Promijeni broj
                      </span>
                    </>
                  ) : (
                    <>
                      Nemaš nalog?{" "}
                      <span
                        className="text-primary cursor-pointer underline"
                        onClick={handleCreateAnAccount}
                      >
                        Kreiraj račun
                      </span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <AuthCompactHighlights className="mt-5" />

              <AnimatePresence mode="wait" initial={false}>
                {IsOTPScreen ? (
                  <motion.div
                    key="otp-login"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="mt-6"
                  >
                    <OtpScreen
                      OnHide={OnHide}
                      generateRecaptcha={generateRecaptcha}
                      countryCode={countryCode}
                      formattedNumber={formattedNumber}
                      confirmationResult={confirmationResult}
                      setConfirmationResult={setConfirmationResult}
                      resendTimer={resendTimer}
                      setResendTimer={setResendTimer}
                      regionCode={loginStates.regionCode}
                      key={IsOTPScreen + "login-otp"}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="login-methods"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="mt-6 flex flex-col gap-6"
                  >
                    {canUseBothMethods ? (
                      <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                            IsLoginWithEmail
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          )}
                          onClick={() => setIsLoginWithEmail(true)}
                        >
                          <MdOutlineEmail className="h-4 w-4" />
                          Email
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                            !IsLoginWithEmail
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          )}
                          onClick={() => setIsLoginWithEmail(false)}
                        >
                          <MdOutlineLocalPhone className="h-4 w-4" />
                          Mobitel
                        </button>
                      </div>
                    ) : null}

                    <AnimatePresence mode="wait" initial={false}>
                      {canUseBothMethods && IsLoginWithEmail ? (
                        <motion.div
                          key="email-login"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                        >
                          <LoginWithEmailForm OnHide={OnHide} />
                        </motion.div>
                      ) : null}

                      {canUseBothMethods && !IsLoginWithEmail ? (
                        <motion.div
                          key="phone-login"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                        >
                          <LoginWithMobileForm
                            formattedNumber={formattedNumber}
                            generateRecaptcha={generateRecaptcha}
                            loginStates={loginStates}
                            setLoginStates={setLoginStates}
                            setIsOTPScreen={setIsOTPScreen}
                            setConfirmationResult={setConfirmationResult}
                            setResendTimer={setResendTimer}
                          />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    {email_authentication === 1 && mobile_authentication === 0 ? (
                      <LoginWithEmailForm OnHide={OnHide} />
                    ) : null}

                    {mobile_authentication === 1 && email_authentication === 0 ? (
                      <LoginWithMobileForm
                        formattedNumber={formattedNumber}
                        generateRecaptcha={generateRecaptcha}
                        loginStates={loginStates}
                        setLoginStates={setLoginStates}
                        setIsOTPScreen={setIsOTPScreen}
                        setConfirmationResult={setConfirmationResult}
                        setResendTimer={setResendTimer}
                      />
                    ) : null}

                    {canShowGoogleDivider ? (
                      <div className="flex items-center gap-3">
                        <hr className="w-full border-slate-200" />
                        <p className="text-nowrap text-xs font-semibold uppercase tracking-wide text-slate-400">
                          ili nastavi sa
                        </p>
                        <hr className="w-full border-slate-200" />
                      </div>
                    ) : null}

                    {google_authentication === 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="h-11 rounded-xl border-slate-200 text-sm font-semibold"
                        onClick={handleGoogleSignup}
                      >
                        <FcGoogle className="!size-5" />
                        <span>Nastavi preko Google naloga</span>
                      </Button>
                    ) : null}

                    <TermsAndPrivacyLinks t={t} settings={settings} OnHide={OnHide} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginModal;
