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
import {
  MdOutlineEmail,
  MdOutlineLocalPhone,
} from "@/components/Common/UnifiedIconPack";
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
    number: isDemoMode ? "38761111222" : "",
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
    mobile_authentication === 0 && email_authentication === 1 ? true : false,
  );

  const hasOnlyGoogleAuth =
    mobile_authentication === 0 &&
    email_authentication === 0 &&
    google_authentication === 1;

  const canUseBothMethods =
    mobile_authentication === 1 && email_authentication === 1;

  const canShowCredentialForm = !hasOnlyGoogleAuth;

  const canShowGoogleDivider =
    canShowCredentialForm && google_authentication === 1;

  const getInitialLoginState = () => ({
    number: isDemoMode ? "38761111222" : "",
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
      mobile_authentication === 0 && email_authentication === 1,
    );
  };

  useEffect(() => {
    if (IsLoginOpen) {
      setIsLoginWithEmail(
        mobile_authentication === 0 && email_authentication === 1,
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
      handleFirebaseAuthError(error);
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
border border-slate-200/90
bg-white dark:bg-slate-900
shadow-[0_30px_90px_-45px_rgba(15,23,42,0.55)]
"

        >
          <div className="grid h-full min-h-0 lg:grid-cols-[0.95fr_1.25fr]">
            <AuthValuePanel mode={IsOTPScreen ? "otp" : "login"} />

            <div className="min-h-0 overflow-y-auto bg-gradient-to-b from-white via-white to-slate-50/70 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
              <div className="mx-auto w-full max-w-[560px]">
                <DialogHeader className="space-y-3">
                  {!IsOTPScreen ? (
                    <div className="inline-flex w-max items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                      {settings?.company_name || "LMX"}
                    </div>
                  ) : null}
                  <DialogTitle className="text-left text-2xl font-semibold leading-tight text-slate-900 sm:text-[2rem]">
                    {IsOTPScreen
                      ? "Unesi verifikacijski kod"
                      : "Prijava na korisnički račun"}
                  </DialogTitle>
                  <DialogDescription className="text-left text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                    {IsOTPScreen ? (
                      <>
                        Kod smo poslali na {`${countryCode}${formattedNumber}`}.{" "}
                        <span
                          onClick={() => setIsOTPScreen(false)}
                          className="cursor-pointer font-semibold text-primary underline"
                        >
                          Promijeni broj
                        </span>
                      </>
                    ) : (
                      <>
                        Pristupi svom profilu i nastavi gdje si stao. Nemaš
                        nalog?{" "}
                        <span
                          className="cursor-pointer font-semibold text-primary underline"
                          onClick={handleCreateAnAccount}
                        >
                          Kreiraj račun
                        </span>
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <AuthCompactHighlights className="mt-4" />

                <AnimatePresence mode="wait" initial={false}>
                  {IsOTPScreen ? (
                    <motion.div
                      key="otp-login"
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
                      className="mt-5 flex flex-col gap-5"
                    >
                      {canUseBothMethods ? (
                        <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5">
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                              IsLoginWithEmail
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:bg-white/80 hover:text-slate-700",
                            )}
                            onClick={() => setIsLoginWithEmail(true)}
                          >
                            <MdOutlineEmail className="h-4 w-4" />
                            Email
                          </button>
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                              !IsLoginWithEmail
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:bg-white/80 hover:text-slate-700",
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

                      {email_authentication === 1 &&
                      mobile_authentication === 0 ? (
                        <LoginWithEmailForm OnHide={OnHide} />
                      ) : null}

                      {mobile_authentication === 1 &&
                      email_authentication === 0 ? (
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
                          className="h-11 rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50"
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
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginModal;
