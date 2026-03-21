import {
  deleteUser as firebaseDeleteUser,
  getAuth,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
} from "firebase/auth";
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
import { getCanonicalPhonePayload } from "./phoneAuthUtils";
import { isRecaptchaRecoverableError } from "./recaptchaManager";
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

const TRUNK_ZERO_COUNTRY_CODES = new Set(["381", "382", "385", "386", "387"]);

const digitsOnly = (value = "") => String(value || "").replace(/\D/g, "");
const normalizeLower = (value = "") => String(value || "").trim().toLowerCase();

const hasDeterministicPhoneState = (error) => {
  const reason = normalizeLower(
    error?.response?.data?.data?.reason || error?.response?.data?.reason || "",
  );
  const message = normalizeLower(
    error?.response?.data?.message || error?.message || "",
  );

  if (reason === "phone_not_registered" || reason === "phone_already_registered") {
    return true;
  }

  return (
    message.includes("nije registrovan") ||
    message.includes("nije registriran") ||
    message.includes("already registered") ||
    message.includes("već registrovan") ||
    message.includes("vec registrovan")
  );
};

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

  const buildPhoneSignupPayloadCandidates = () => {
    const payload = resolvePhonePayload();
    const e164Raw = String(payload.e164 || "").trim();
    const e164Digits = digitsOnly(e164Raw);
    const stateCountryDigits = digitsOnly(countryCode);
    const countryDigits =
      payload.countryCode ||
      stateCountryDigits ||
      (e164Digits.startsWith("387") ? "387" : "");
    const derivedLocalFromE164 =
      countryDigits && e164Digits.startsWith(countryDigits)
        ? e164Digits.slice(countryDigits.length)
        : "";
    const formattedDigits = digitsOnly(formattedNumber);
    const baseLocal =
      digitsOnly(payload.local) || formattedDigits || derivedLocalFromE164;

    const localCandidates = new Set([
      digitsOnly(payload.local),
      formattedDigits,
      derivedLocalFromE164,
      baseLocal,
    ].filter(Boolean));

    if (countryDigits && TRUNK_ZERO_COUNTRY_CODES.has(countryDigits)) {
      for (const local of [...localCandidates]) {
        if (!local) continue;
        if (local.startsWith("0")) {
          const withoutLeadingZero = local.replace(/^0+/, "");
          if (withoutLeadingZero) localCandidates.add(withoutLeadingZero);
        } else {
          localCandidates.add(`0${local}`);
        }
      }
    }

    const mobileCandidates = new Set(Array.from(localCandidates));
    if (mobileCandidates.size === 0 && e164Digits) {
      mobileCandidates.add(e164Digits);
    }

    return Array.from(mobileCandidates)
      .map((mobileCandidate) => ({
        mobile: String(mobileCandidate || "").trim(),
        countryCode: countryDigits || stateCountryDigits || undefined,
      }))
      .filter((candidate) => Boolean(candidate.mobile))
      .slice(0, 1);
  };

  const finalizeSuccessfulPhoneAuth = async (data, identifier) => {
    loadUpdateData(data);
    toast.success(data?.message || "Prijava je uspješna.");
    await onAuthSuccess?.(data, {
      method: "phone",
      identifier,
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
  };

  const cleanupFirebaseAfterBackendFailure = async ({
    confirmedUser,
    shouldDeleteUser = false,
  } = {}) => {
    try {
      if (shouldDeleteUser && confirmedUser?.uid) {
        const currentUser = auth.currentUser;
        if (currentUser?.uid === confirmedUser.uid) {
          await firebaseDeleteUser(currentUser);
          return;
        }
      }
    } catch (_) {
      // fallback to sign-out below
    }

    try {
      await firebaseSignOut(auth);
    } catch (_) {}
  };

  const submitPhoneSignupWithRetry = async (payload, maxAttempts = 1) => {
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

  const buildDirectPhoneSignupPayload = ({
    userUid,
    mobile,
    countryCodeValue,
    intent,
  }) => ({
    mobile: String(mobile || "").trim(),
    firebase_id: userUid,
    fcm_id: fetchFCM ? fetchFCM : "",
    country_code: String(countryCodeValue || "").replace(/\D/g, "") || undefined,
    type: "phone",
    auth_intent: intent || authIntent,
    region_code: regionCode?.toUpperCase() || "",
  });

  const buildSignupErrorFromResponse = (response) => {
    const data = response?.data;
    const error = new Error(
      data?.message || "Prijava/registracija brojem nije uspjela.",
    );
    error.response = {
      status: Number(response?.status || data?.code || 0),
      data,
    };
    return error;
  };

  const isRecoverablePhoneSignupError = (error) => {
    const status = Number(error?.response?.status || 0);
    return (
      isPhoneNotRegisteredError(error) ||
      isPhoneAlreadyRegisteredError(error) ||
      status === 404 ||
      status === 409
    );
  };

  const shouldRetryWithOppositeIntent = (intent, error) => {
    const status = Number(error?.response?.status || 0);
    if (intent === "register") {
      return isPhoneAlreadyRegisteredError(error) || status === 409;
    }
    if (intent === "login") {
      return isPhoneNotRegisteredError(error) || status === 404;
    }
    return false;
  };

  const submitPhoneSignupForIntent = async ({ userUid, intent }) => {
    const candidates = buildPhoneSignupPayloadCandidates();
    let lastError = null;

    for (const candidate of candidates) {
      try {
        const response = await submitPhoneSignupWithRetry(
          buildDirectPhoneSignupPayload({
            userUid,
            mobile: candidate.mobile,
            countryCodeValue: candidate.countryCode,
            intent,
          }),
        );

        if (response?.data?.error === false) {
          return response.data;
        }

        const softError = buildSignupErrorFromResponse(response);
        if (isRecoverablePhoneSignupError(softError)) {
          lastError = softError;
          if (hasDeterministicPhoneState(softError)) {
            break;
          }
          continue;
        }
        throw softError;
      } catch (error) {
        if (isRecoverablePhoneSignupError(error)) {
          lastError = error;
          if (hasDeterministicPhoneState(error)) {
            break;
          }
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error("Prijava/registracija brojem nije uspjela.");
  };

  const syncPhoneSignupWithFallback = async ({ userUid, intent }) => {
    try {
      return await submitPhoneSignupForIntent({ userUid, intent });
    } catch (primaryError) {
      if (!shouldRetryWithOppositeIntent(intent, primaryError)) {
        throw primaryError;
      }

      const oppositeIntent = intent === "register" ? "login" : "register";
      try {
        return await submitPhoneSignupForIntent({
          userUid,
          intent: oppositeIntent,
        });
      } catch (fallbackError) {
        const fallbackStatus = Number(fallbackError?.response?.status || 0);
        if (fallbackStatus && fallbackStatus !== 404 && fallbackStatus !== 409) {
          throw fallbackError;
        }
        throw primaryError;
      }
    }
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

      const doVerify = (intent) =>
        verifyOtpApi.verifyOtp({
          number: PhoneNumber,
          otp: otp,
          intent,
          mobile: phonePayload.local,
          country_code: phonePayload.countryCode,
          region_code: regionCode?.toUpperCase() || "",
        });

      let response = await doVerify(authIntent);

      // Ako je korisnik već registrovan a pokušava registraciju → auto-login
      if (
        response?.data?.error !== false &&
        authIntent === "register" &&
        isPhoneAlreadyRegisteredError(response?.data)
      ) {
        response = await doVerify("login");
      }

      // Ako je korisnik nije registrovan a pokušava login → obavijesti
      if (
        response?.data?.error !== false &&
        authIntent === "login" &&
        isPhoneNotRegisteredError(response?.data)
      ) {
        toast.error(
          response?.data?.message ||
            "Broj nije registrovan. Kreirajte račun prvo.",
        );
        return;
      }

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
        toast.error(
          response?.data?.message ||
            "Verifikacija OTP koda nije uspjela. Pokušaj ponovo.",
        );
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Verifikacija OTP koda nije uspjela.",
      );
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
      const user = result.user;
      confirmedUser = user;
      const data = await syncPhoneSignupWithFallback({
        userUid: user.uid,
        intent: authIntent,
      });
      await finalizeSuccessfulPhoneAuth(data, phoneE164);
    } catch (error) {
      // Ako je greška "broj već registrovan" a mi smo u register modu,
      // syncPhoneSignupWithFallback već pokušava auto-login, dakle ova greška
      // znači da ni login nije uspio — obavijesti korisnika bez brisanja Firebase usera
      const isAlreadyRegistered = isPhoneAlreadyRegisteredError(error);
      const isNotRegistered = isPhoneNotRegisteredError(error);

      if (isAlreadyRegistered || isNotRegistered) {
        const msg = isAlreadyRegistered
          ? "Broj je već registrovan ali prijava nije uspjela. Pokušaj ponovo."
          : "Broj nije registrovan. Kreirajte račun prvo.";
        toast.error(error?.response?.data?.message || msg);
        // Ne brišemo Firebase korisnika — samo odjavljujemo sesiju
        await cleanupFirebaseAfterBackendFailure({
          confirmedUser,
          shouldDeleteUser: false,
        });
        return;
      }

      const backendMessage = error?.response?.data?.message;
      if (backendMessage) {
        toast.error(backendMessage);
        await cleanupFirebaseAfterBackendFailure({
          confirmedUser,
          shouldDeleteUser: authIntent === "register",
        });
        return;
      }

      if (isGatewayOrTimeoutError(error)) {
        toast.error(
          "Prijava trenutno nije dostupna. Backend autentifikacija kasni (504/timeout).",
        );
        await cleanupFirebaseAfterBackendFailure({
          confirmedUser,
          shouldDeleteUser: authIntent === "register",
        });
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
    const shouldUseTwilioOtp =
      otp_service_provider === "twilio" || !confirmationResult;
    if (shouldUseTwilioOtp) {
      await verifyOTPWithTwillio();
    } else {
      await verifyOTPWithFirebase();
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
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Slanje OTP koda nije uspjelo.",
      );
    } finally {
      setResendOtpLoader(false);
    }
  };

  const resendOtpWithFirebase = async (phoneE164) => {
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
    } catch (error) {
      if (isRecaptchaRecoverableError(error)) {
        try {
          const retriedConfirmation = await requestOtp();
          if (retriedConfirmation) {
            if (!retriedConfirmation?.verificationId) {
              toast.error("Slanje OTP koda nije potvrđeno. Pokušaj ponovo.");
              return;
            }
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
    const shouldUseTwilioOtp =
      otp_service_provider === "twilio" || !confirmationResult;
    if (shouldUseTwilioOtp) {
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
