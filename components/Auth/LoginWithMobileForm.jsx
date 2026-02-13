import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import useAutoFocus from "../Common/useAutoFocus";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { toast } from "@/utils/toastBs";
import { handleFirebaseAuthError, t } from "@/utils";
import { getAuth, signInWithPhoneNumber } from "firebase/auth";
import { getOtpApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { getOtpServiceProvider } from "@/redux/reducer/settingSlice";
import { LMX_PHONE_INPUT_PROPS } from "@/components/Common/phoneInputTheme";

const LoginWithMobileForm = ({
  generateRecaptcha,
  loginStates,
  setLoginStates,
  formattedNumber,
  setIsOTPScreen,
  setConfirmationResult,
  setResendTimer,
}) => {
  const numberInputRef = useAutoFocus();
  const auth = getAuth();
  const otp_service_provider = useSelector(getOtpServiceProvider);
  const { number, countryCode, showLoader } = loginStates;

  const handleInputChange = (value, data) => {
    setLoginStates((prev) => ({
      ...prev,
      number: value,
      countryCode: "+" + (data?.dialCode || ""),
      regionCode: data?.countryCode.toLowerCase() || "",
    }));
  };

  const handleCountryChange = (code) => {
    setLoginStates((prev) => ({
      ...prev,
      countryCode: code,
    }));
  };

  const sendOtpWithTwillio = async (PhoneNumber) => {
    try {
      const response = await getOtpApi.getOtp({ number: PhoneNumber });
      if (response?.data?.error === false) {
        toast.success(t("otpSentSuccess"));
        setIsOTPScreen(true);
        setResendTimer(60); // Start the 60-second timer
      } else {
        toast.error(t("failedToSendOtp"));
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

  const sendOtpWithFirebase = async (PhoneNumber) => {
    try {
      const appVerifier = generateRecaptcha();
      const confirmation = await signInWithPhoneNumber(
        auth,
        PhoneNumber,
        appVerifier
      );
      setConfirmationResult(confirmation);
      toast.success(t("otpSentSuccess"));
      setIsOTPScreen(true);
    } catch (error) {
      console.log(error);
      const errorCode = error.code;
      handleFirebaseAuthError(errorCode);
    } finally {
      setLoginStates((prev) => ({
        ...prev,
        showLoader: false,
      }));
    }
  };

  const sendOTP = async () => {
    setLoginStates((prev) => ({
      ...prev,
      showLoader: true,
    }));
    const PhoneNumber = `${countryCode}${formattedNumber}`;
    if (otp_service_provider === "twilio") {
      await sendOtpWithTwillio(PhoneNumber);
    } else {
      await sendOtpWithFirebase(PhoneNumber);
    }
  };

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    if (isValidPhoneNumber(`${countryCode}${formattedNumber}`)) {
      await sendOTP();
    } else {
      toast.error(t("invalidPhoneNumber"));
    }
  };

  return (
    <form
      className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
      onSubmit={handleMobileSubmit}
    >
      <div className="labelInputCont">
        <Label className="text-sm font-semibold text-slate-700 after:content-['*'] after:text-red-500">
          {t("loginWithMobile")}
        </Label>
        <PhoneInput
          country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY}
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
          t("continue")
        )}
      </Button>
    </form>
  );
};

export default LoginWithMobileForm;
