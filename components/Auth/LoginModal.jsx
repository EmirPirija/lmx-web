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
import { FcGoogle } from "react-icons/fc";
import { MdOutlineEmail, MdOutlineLocalPhone } from "react-icons/md";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
} from "firebase/auth";
import { toast } from "sonner";
import { userSignUpApi } from "@/utils/api";
import { loadUpdateData } from "@/redux/reducer/authSlice";
import LoginWithEmailForm from "./LoginWithEmailForm";
import LoginWithMobileForm from "./LoginWithMobileForm";
import OtpScreen from "./OtpScreen";
import TermsAndPrivacyLinks from "./TermsAndPrivacyLinks";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";

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

  const IsShowOrSignIn =
    !(
      mobile_authentication === 0 &&
      email_authentication === 0 &&
      google_authentication === 1
    ) && google_authentication === 1;

  const OnHide = async () => {
    await recaptchaClear();
    setIsOTPScreen(false);
    setIsLoginOpen(false);
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
        toast.error("Failed to complete signup");
      }
    } catch (error) {
      const errorCode = error.code;
      handleFirebaseAuthError(errorCode);
    }
  };

  const handleCreateAnAccount = () => {
    OnHide();
    setIsRegisterModalOpen(true);
  };

  return (
    <>
      <Dialog open={IsLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="px-[40px] sm:py-[50px] sm:px-[90px]"
        >
          <DialogHeader>
            <DialogTitle className="text-3xl sm:text-4xl font-light">
              {IsOTPScreen ? (
                t("verifyOtp")
              ) : (
                <>
                  {t("loginTo")}{" "}
                  <span className="text-primary">{settings?.company_name}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-base text-black font-light">
              {IsOTPScreen ? (
                <>
                  {t("sentTo")} {`${countryCode}${formattedNumber}`}{" "}
                  <span
                    onClick={() => setIsOTPScreen(false)}
                    className="text-primary underline cursor-pointer"
                  >
                    {t("change")}
                  </span>
                </>
              ) : (
                <>
                  {t("newto")} {settings?.company_name}?{" "}
                  <span
                    className="text-primary cursor-pointer underline"
                    onClick={handleCreateAnAccount}
                  >
                    {t("createAccount")}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {IsOTPScreen ? (
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
          ) : (
            <div className="flex flex-col gap-[30px] mt-3.5">
              {!(
                mobile_authentication === 0 &&
                email_authentication === 0 &&
                google_authentication === 1
              ) &&
                mobile_authentication === 1 &&
                email_authentication === 1 &&
                (IsLoginWithEmail ? (
                  <LoginWithEmailForm OnHide={OnHide} key={IsLoginWithEmail} />
                ) : (
                  <LoginWithMobileForm
                    formattedNumber={formattedNumber}
                    generateRecaptcha={generateRecaptcha}
                    loginStates={loginStates}
                    setLoginStates={setLoginStates}
                    key={IsLoginWithEmail}
                    setIsOTPScreen={setIsOTPScreen}
                    setConfirmationResult={setConfirmationResult}
                    setResendTimer={setResendTimer}
                  />
                ))}

              {email_authentication === 1 && mobile_authentication === 0 && (
                <LoginWithEmailForm OnHide={OnHide} key={IsLoginWithEmail} />
              )}

              {mobile_authentication === 1 && email_authentication === 0 && (
                <LoginWithMobileForm
                  formattedNumber={formattedNumber}
                  generateRecaptcha={generateRecaptcha}
                  loginStates={loginStates}
                  setLoginStates={setLoginStates}
                  key={IsLoginWithEmail}
                  setIsOTPScreen={setIsOTPScreen}
                  setConfirmationResult={setConfirmationResult}
                  setResendTimer={setResendTimer}
                />
              )}

              {IsShowOrSignIn && (
                <div className="flex items-center gap-2">
                  <hr className="w-full" />
                  <p className="text-nowrap text-sm">{t("orSignInWith")}</p>
                  <hr className="w-full" />
                </div>
              )}

              <div className="flex flex-col gap-4">
                {google_authentication === 1 && (
                  <Button
                    variant="outline"
                    size="big"
                    className="flex items-center justify-center py-4 text-base"
                    onClick={handleGoogleSignup}
                  >
                    <FcGoogle className="!size-6" />
                    <span>{t("google")}</span>
                  </Button>
                )}

                {IsLoginWithEmail && mobile_authentication === 1 ? (
                  <Button
                    variant="outline"
                    size="big"
                    className="flex items-center justify-center py-4 text-base h-auto"
                    onClick={() => setIsLoginWithEmail(false)}
                  >
                    <MdOutlineLocalPhone className="!size-6" />
                    {t("continueWithMobile")}
                  </Button>
                ) : (
                  !IsLoginWithEmail &&
                  email_authentication === 1 && (
                    <Button
                      variant="outline"
                      size="big"
                      className="flex items-center justify-center py-4 text-base h-auto"
                      onClick={() => setIsLoginWithEmail(true)}
                    >
                      <MdOutlineEmail className="!size-6" />
                      {t("continueWithEmail")}
                    </Button>
                  )
                )}
              </div>
              <TermsAndPrivacyLinks t={t} settings={settings} OnHide={OnHide} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginModal;
