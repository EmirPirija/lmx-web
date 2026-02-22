import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import useAutoFocus from "../Common/useAutoFocus";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { toast } from "@/utils/toastBs";
import { handleFirebaseAuthError } from "@/utils";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  setPersistence,
  signInWithPhoneNumber,
} from "firebase/auth";
import { getOtpApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { getOtpServiceProvider } from "@/redux/reducer/settingSlice";
import {
  LMX_PHONE_DEFAULT_COUNTRY,
  LMX_PHONE_INPUT_PROPS,
  resolveLmxPhoneDialCode,
} from "@/components/Common/phoneInputTheme";
import { buildPhoneE164, maskPhoneForDebug } from "./phoneAuthUtils";
import {
  isRecaptchaRecoverableError,
} from "./recaptchaManager";

const LoginWithMobileForm = ({
  generateRecaptcha,
  loginStates,
  setLoginStates,
  formattedNumber,
  setIsOTPScreen,
  setConfirmationResult,
  setResendTimer,
  rememberMe = true,
}) => {
  const numberInputRef = useAutoFocus();
  const auth = getAuth();
  const otp_service_provider = useSelector(getOtpServiceProvider);
  const { number, countryCode, showLoader } = loginStates;

  const focusPhoneInput = () => {
    window.setTimeout(() => {
      numberInputRef.current?.focus?.();
    }, 0);
  };

  const handleInputChange = (value, data) => {
    setLoginStates((prev) => ({
      ...prev,
      number: value,
      countryCode: "+" + (data?.dialCode || ""),
      regionCode: data?.countryCode.toLowerCase() || "",
    }));
  };

  const handleCountryChange = (countryData) => {
    const regionCodeRaw =
      typeof countryData === "string" ? countryData : countryData?.countryCode;
    const regionCode = String(regionCodeRaw || "").toLowerCase();
    const resolvedDial = resolveLmxPhoneDialCode(regionCode);
    const dialCode = countryData?.dialCode ? `+${countryData.dialCode}` : `+${resolvedDial}`;
    setLoginStates((prev) => ({
      ...prev,
      countryCode: dialCode,
      regionCode,
    }));
    focusPhoneInput();
  };

  const sendOtpWithTwillio = async (phoneE164) => {
    try {
      const response = await getOtpApi.getOtp({ number: phoneE164 });
      if (response?.data?.error === false) {
        toast.success("OTP poslan");
        setIsOTPScreen(true);
        setResendTimer(60); // Start the 60-second timer
      } else {
        toast.error("Slanje OTP koda nije uspjelo.");
      }
    } catch (error) {
      console.error("error", error);
    } finally {
      setLoginStates((prev) => ({
        ...prev,
        showLoader: false,
      }));
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
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );
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
      setIsOTPScreen(true);
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
            setIsOTPScreen(true);
            return;
          }
        } catch (retryError) {
          handleFirebaseAuthError(retryError);
          return;
        }
      }
      handleFirebaseAuthError(error);
    } finally {
      setLoginStates((prev) => ({
        ...prev,
        showLoader: false,
      }));
    }
  };

  const sendOTP = async (phoneE164) => {
    setLoginStates((prev) => ({
      ...prev,
      showLoader: true,
    }));
    if (otp_service_provider === "twilio") {
      await sendOtpWithTwillio(phoneE164);
    } else {
      await sendOtpWithFirebase(phoneE164);
    }
  };

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    const phoneE164 = buildPhoneE164(countryCode, formattedNumber);
    if (isValidPhoneNumber(phoneE164)) {
      await sendOTP(phoneE164);
    } else {
      toast.error("Neispravan broj telefona");
    }
  };

  return (
    <form className="flex flex-col gap-4 rounded-2xl bg-transparent p-0" onSubmit={handleMobileSubmit}>
      <div className="labelInputCont">
        <Label className="text-sm font-semibold text-foreground after:content-['*'] after:text-red-500">
          {"Prijava brojem"}
        </Label>
        <PhoneInput
          country={LMX_PHONE_DEFAULT_COUNTRY}
          value={number}
          onChange={(phone, data) => handleInputChange(phone, data)}
          onCountryChange={handleCountryChange}
          inputProps={{
            name: "phone",
            required: true,
            ref: numberInputRef,
          }}
          {...LMX_PHONE_INPUT_PROPS}
        />
      </div>
      <Button
        type="submit"
        disabled={showLoader}
        className="h-11 rounded-xl text-sm font-semibold"
        size="lg"
      >
        {showLoader ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Nastavi"
        )}
      </Button>
    </form>
  );
};

export default LoginWithMobileForm;
