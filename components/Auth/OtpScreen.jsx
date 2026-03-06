import { getAuth, signInWithPhoneNumber, signOut as firebaseSignOut } from "firebase/auth";
import useAutoFocus from "../Common/useAutoFocus";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "@/utils/toastBs";
import { handleFirebaseAuthError } from "@/utils";
import { authApi, getOtpApi, userSignUpApi, verifyOtpApi } from "@/utils/api";
import { loadUpdateData } from "@/redux/reducer/authSlice";
import { useSelector } from "react-redux";
import {
  Fcmtoken,
  getIsDemoMode,
  getOtpServiceProvider,
} from "@/redux/reducer/settingSlice";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
import { useEffect, useState } from "react";
import { useNavigate } from "../Common/useNavigate";
import { getCanonicalPhonePayload, maskPhoneForDebug } from "./phoneAuthUtils";
import {
  isRecaptchaRecoverableError,
} from "./recaptchaManager";
import {
  isPhoneAlreadyRegisteredError,
  isPhoneNotRegisteredError,
} from "./authPhoneErrors";

const isGatewayOrTimeoutError = (error) => {
  const status = Number(error?.response?.status || 0);
  const code = String(error?.code || "").toUpperCase();
  return (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    code === "ERR_NETWORK"
  );
};

const wait = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const OtpScreen = ({
  generateRecaptcha,
  countryCode,
  formattedNumber,
  confirmationResult,
  setConfirmationResult,
  OnHide,
  resendTimer,
  setResendTimer,
  regionCode,
  onAuthSuccess,
  autoCloseOnSuccess = true,
  authIntent = "login",
}) => {
  const { navigate } = useNavigate();
  const otpInputRef = useAutoFocus();
  const fetchFCM = useSelector(Fcmtoken);
  const auth = getAuth();
  const [resendOtpLoader, setResendOtpLoader] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const isDemoMode = useSelector(getIsDemoMode);
  const [otp, setOtp] = useState(isDemoMode ? "123456" : "");
  const otp_service_provider = useSelector(getOtpServiceProvider);
  const resolvePhonePayload = () =>
    getCanonicalPhonePayload(countryCode, formattedNumber);

  const submitPhoneSignupWithRetry = async (payload, maxAttempts = 2) => {
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await userSignUpApi.userSignup(payload);
      } catch (error) {
        lastError = error;
        if (!isGatewayOrTimeoutError(error) || attempt >= maxAttempts) {
          throw error;
        }
        await wait(attempt * 350);
      }
    }

    throw lastError || new Error("Backend auth sync failed");
  };

  useEffect(() => {
    let intervalId;
    if (resendTimer > 0) {
      intervalId = setInterval(() => {
        setResendTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [resendTimer]);

  const verifyOTPWithTwillio = async () => {
    try {
      const phonePayload = resolvePhonePayload();
      const PhoneNumber = phonePayload.e164;
      const response = await verifyOtpApi.verifyOtp({
        number: PhoneNumber,
        otp: otp,
        intent: authIntent,
        mobile: phonePayload.local,
        country_code: phonePayload.countryCode,
        region_code: regionCode?.toUpperCase() || "",
      });
      if (response?.data?.error === false) {
        const authPayload = response?.data;
        loadUpdateData(authPayload);
        toast.success(authPayload?.message);
        await onAuthSuccess?.(authPayload, {
          method: "phone",
          identifier: PhoneNumber,
        });
        if (
          autoCloseOnSuccess &&
          (authPayload?.data?.email === "" || authPayload?.data?.name === "")
        ) {
          navigate("/profile");
        }
        if (autoCloseOnSuccess) {
          OnHide();
        }
      } else {
        if (isPhoneNotRegisteredError(response?.data)) {
          if (authIntent === "login") {
            toast.error("Broj nije registrovan. Prvo kreirajte račun.");
          } else {
            toast.error(
              response?.data?.message ||
                "Registracija nije dovršena. Pokušaj ponovo.",
            );
          }
        } else if (isPhoneAlreadyRegisteredError(response?.data)) {
          toast.info("Broj je već registrovan. Nastavi prijavu.");
        } else {
          toast.error(response?.data?.message);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setShowLoader(false);
    }
  };

  const verifyOTPWithFirebase = async () => {
    const phonePayload = resolvePhonePayload();
    const phoneE164 = phonePayload.e164;
    let confirmedUser = null;

    try {
      const result = await confirmationResult.confirm(otp);
      // Access user information from the result
      const user = result.user;
      confirmedUser = user;
      const response = await submitPhoneSignupWithRetry({
        mobile: phonePayload.local,
        firebase_id: user.uid, // Accessing UID directly from the user object
        fcm_id: fetchFCM ? fetchFCM : "",
        country_code: phonePayload.countryCode,
        type: "phone",
        auth_intent: authIntent,
        region_code: regionCode?.toUpperCase() || "",
      });
      const data = response.data;
      if (data?.error === true) {
        if (isPhoneNotRegisteredError(data)) {
          if (authIntent === "login") {
            toast.error("Broj nije registrovan. Prvo kreirajte račun.");
          } else {
            toast.error(
              data?.message || "Registracija nije dovršena. Pokušaj ponovo.",
            );
          }
        } else {
          toast.error(data?.message || "Prijava/registracija nije uspjela.");
        }
        try {
          await firebaseSignOut(auth);
        } catch (_) {}
        return;
      }
      loadUpdateData(data);
      toast.success(data.message);
      await onAuthSuccess?.(data, {
        method: "phone",
        identifier: phoneE164,
      });
      if (
        autoCloseOnSuccess &&
        (data?.data?.email === "" || data?.data?.name === "")
      ) {
        navigate("/profile");
      }
      if (autoCloseOnSuccess) {
        OnHide();
      }
    } catch (error) {
      if (
        authIntent === "register" &&
        confirmedUser?.uid &&
        isPhoneAlreadyRegisteredError(error)
      ) {
        try {
          const fallbackLoginResponse = await submitPhoneSignupWithRetry({
            mobile: phonePayload.local,
            firebase_id: confirmedUser.uid,
            fcm_id: fetchFCM ? fetchFCM : "",
            country_code: phonePayload.countryCode,
            type: "phone",
            auth_intent: "login",
            region_code: regionCode?.toUpperCase() || "",
          });
          const fallbackData = fallbackLoginResponse?.data;
          if (fallbackData?.error === false) {
            loadUpdateData(fallbackData);
            toast.success(
              fallbackData?.message ||
                "Broj je već registrovan. Prijavili smo vas na postojeći račun.",
            );
            await onAuthSuccess?.(fallbackData, {
              method: "phone",
              identifier: phoneE164,
            });
            if (
              autoCloseOnSuccess &&
              (fallbackData?.data?.email === "" ||
                fallbackData?.data?.name === "")
            ) {
              navigate("/profile");
            }
            if (autoCloseOnSuccess) {
              OnHide();
            }
            return;
          }
        } catch (fallbackError) {
          const fallbackMessage =
            fallbackError?.response?.data?.message ||
            fallbackError?.message ||
            "Prijava postojećeg računa nije uspjela.";
          toast.error(fallbackMessage);
          try {
            await firebaseSignOut(auth);
          } catch (_) {}
          return;
        }
      }

      const backendMessage = error?.response?.data?.message;
      if (backendMessage) {
        toast.error(backendMessage);
        try {
          await firebaseSignOut(auth);
        } catch (_) {}
        return;
      }

      if (isGatewayOrTimeoutError(error)) {
        toast.error(
          "Prijava trenutno nije dostupna. Backend autentifikacija kasni (504/timeout).",
        );
        try {
          await firebaseSignOut(auth);
        } catch (_) {}
      } else {
        handleFirebaseAuthError(error);
      }
    } finally {
      setShowLoader(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (otp === "") {
      toast.error("Unesi OTP");
      return;
    }
    setShowLoader(true);
    if (otp_service_provider === "twilio") {
      await verifyOTPWithTwillio();
    } else {
      await verifyOTPWithFirebase();
    }
  };

  const ensurePhoneCanLogin = async (phoneE164, countryCodeDigits = "") => {
    try {
      const response = await authApi.resolveLoginIdentifier({
        identifier: phoneE164,
        identifier_type: "phone",
        country_code:
          countryCodeDigits || String(countryCode || "").replace(/\D/g, ""),
      });
      if (response?.data?.error === true) {
        const apiError = new Error(
          response?.data?.message || "Invalid Login Credentials",
        );
        apiError.apiCode = response?.data?.code;
        apiError.apiReason = response?.data?.data?.reason;
        throw apiError;
      }
      return true;
    } catch (error) {
      if (isPhoneNotRegisteredError(error)) {
        toast.error("Broj nije registrovan. Prvo kreirajte račun.");
      } else {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Provjera broja nije uspjela.",
        );
      }
      return false;
    }
  };

  const resendOtpWithTwillio = async ({
    phoneE164,
    localNumber,
    countryCodeDigits,
  }) => {
    try {
      const response = await getOtpApi.getOtp({
        number: phoneE164,
        intent: authIntent,
        mobile: localNumber,
        country_code: countryCodeDigits,
        region_code: String(regionCode || "").toUpperCase(),
      });
      if (response?.data?.error === false) {
        toast.success("OTP poslan");
        setResendTimer(60); // Start the 60-second timer
      } else {
        toast.error("Slanje OTP koda nije uspjelo.");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setResendOtpLoader(false);
    }
  };

  const resendOtpWithFirebase = async (phoneE164) => {
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
      console.info("[Auth][Firebase] OTP resend accepted", {
        phone: maskPhoneForDebug(phoneE164),
        verificationId: confirmation?.verificationId || null,
      });
      setConfirmationResult(confirmation);
      toast.success("OTP poslan");
      setResendTimer(60);
    } catch (error) {
      if (isRecaptchaRecoverableError(error)) {
        try {
          const retriedConfirmation = await requestOtp(true);
          if (retriedConfirmation) {
            if (!retriedConfirmation?.verificationId) {
              toast.error("Slanje OTP koda nije potvrđeno. Pokušaj ponovo.");
              return;
            }
            console.info("[Auth][Firebase] OTP resend accepted after retry", {
              phone: maskPhoneForDebug(phoneE164),
              verificationId: retriedConfirmation?.verificationId || null,
            });
            setConfirmationResult(retriedConfirmation);
            toast.success("OTP poslan");
            setResendTimer(60);
            return;
          }
        } catch (retryError) {
          handleFirebaseAuthError(retryError);
          return;
        }
      }
      handleFirebaseAuthError(error);
    } finally {
      setResendOtpLoader(false);
    }
  };

  const resendOtp = async (e) => {
    e.preventDefault();
    setResendOtpLoader(true);
    const phonePayload = resolvePhonePayload();
    const phoneE164 = phonePayload.e164;
    if (authIntent === "login") {
      const canLogin = await ensurePhoneCanLogin(
        phoneE164,
        phonePayload.countryCode,
      );
      if (!canLogin) {
        setResendOtpLoader(false);
        return;
      }
    }
    if (otp_service_provider === "twilio") {
      await resendOtpWithTwillio({
        phoneE164,
        localNumber: phonePayload.local,
        countryCodeDigits: phonePayload.countryCode,
      });
    } else {
      await resendOtpWithFirebase(phoneE164);
    }
  };

  return (
    <form className="flex flex-col gap-4 rounded-2xl bg-transparent p-0" onSubmit={verifyOTP}>
      <div className="rounded-xl border border-cyan-300/60 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-700 dark:text-cyan-300">
        Unesi šestocifreni kod koji je poslan na tvoj broj.
      </div>

      <div className="labelInputCont">
        <Label className="requiredInputLabel text-sm font-semibold text-foreground">
          {"OTP"}
        </Label>
        <Input
          type="text"
          placeholder={"Unesi OTP"}
          id="otp"
          name="otp"
          value={otp}
          maxLength={6}
          className="h-11 rounded-xl border-border bg-background text-center text-base font-semibold tracking-[0.3em] text-foreground placeholder:text-muted-foreground"
          autoComplete="one-time-code"
          onChange={(e) => setOtp(e.target.value)}
          ref={otpInputRef}
        />
      </div>
      <Button
        type="submit"
        disabled={showLoader}
        className="h-11 rounded-xl text-sm font-semibold"
        size="lg"
      >
        {showLoader ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Potvrdi"
        )}
      </Button>

      <Button
        type="button"
        className="h-11 rounded-xl border border-border bg-transparent text-sm font-semibold text-foreground hover:bg-muted"
        variant="ghost"
        size="lg"
        onClick={resendOtp}
        disabled={resendOtpLoader || showLoader || resendTimer > 0}
      >
        {resendOtpLoader ? (
          <Loader2 className="size-6 animate-spin" />
        ) : resendTimer > 0 ? (
          `${"Pošalji OTP ponovo"} ${resendTimer}s`
        ) : (
          "Pošalji OTP ponovo"
        )}
      </Button>
    </form>
  );
};

export default OtpScreen;
