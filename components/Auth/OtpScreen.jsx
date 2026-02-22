import { getAuth, signInWithPhoneNumber } from "firebase/auth";
import useAutoFocus from "../Common/useAutoFocus";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "@/utils/toastBs";
import { handleFirebaseAuthError } from "@/utils";
import { getOtpApi, userSignUpApi, verifyOtpApi } from "@/utils/api";
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
import { buildPhoneE164, maskPhoneForDebug } from "./phoneAuthUtils";
import {
  isRecaptchaRecoverableError,
} from "./recaptchaManager";

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
      const PhoneNumber = buildPhoneE164(countryCode, formattedNumber);
      const response = await verifyOtpApi.verifyOtp({
        number: PhoneNumber,
        otp: otp,
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
        toast.error(response?.data?.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setShowLoader(false);
    }
  };

  const verifyOTPWithFirebase = async () => {
    try {
      const result = await confirmationResult.confirm(otp);
      // Access user information from the result
      const user = result.user;
      const phoneE164 = buildPhoneE164(countryCode, formattedNumber);
      const response = await userSignUpApi.userSignup({
        mobile: formattedNumber,
        firebase_id: user.uid, // Accessing UID directly from the user object
        fcm_id: fetchFCM ? fetchFCM : "",
        country_code: countryCode.replace(/\D/g, ""),
        type: "phone",
        region_code: regionCode?.toUpperCase() || "",
      });
      const data = response.data;
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
      console.log(error);
      handleFirebaseAuthError(error);
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

  const resendOtpWithTwillio = async (phoneE164) => {
    try {
      const response = await getOtpApi.getOtp({ number: phoneE164 });
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
    const phoneE164 = buildPhoneE164(countryCode, formattedNumber);
    if (otp_service_provider === "twilio") {
      await resendOtpWithTwillio(phoneE164);
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
