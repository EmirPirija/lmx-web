"use client";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import {
  handleKeyDown,
  inpNum,
  prefillVerificationDetails,
  prepareCustomFieldFiles,
  prepareCustomFieldTranslations,
  validateExtraDetails,
} from "@/utils";
import {
  getVerificationFiledsApi,
  getVerificationStatusApi,
  deleteUserApi,
  getOtpApi,
  updateProfileApi,
  sendVerificationReqApi,
  verifyOtpApi,
} from "@/utils/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/utils/toastBs";
import { MdOutlineAttachFile } from "@/components/Common/UnifiedIconPack";
import { HiOutlineUpload } from "@/components/Common/UnifiedIconPack";
import CustomLink from "@/components/Common/CustomLink";
import Layout from "@/components/Layout/Layout";
import Checkauth from "@/HOC/Checkauth";
import AdLanguageSelector from "../AdsListing/AdLanguageSelector";
import {
  getDefaultLanguageCode,
  getLanguages,
  getOtpServiceProvider,
} from "@/redux/reducer/settingSlice";
import { logoutSuccess, userSignUpData, loadUpdateUserData } from "@/redux/reducer/authSlice";
import { useSelector } from "react-redux";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageLoader from "@/components/Common/PageLoader";
import { getCurrentLangCode } from "@/redux/reducer/languageSlice";
import CustomImage from "@/components/Common/CustomImage";
import { useNavigate } from "@/components/Common/useNavigate";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Phone,
  Trash2,
} from "@/components/Common/UnifiedIconPack";
import {
  deleteUser as firebaseDeleteUser,
  getAuth,
  linkWithCredential,
  onAuthStateChanged,
  PhoneAuthProvider,
  reload,
  sendEmailVerification,
  updatePhoneNumber,
} from "firebase/auth";
import { cn } from "@/lib/utils";
import { handleFirebaseAuthError } from "@/utils";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import {
  LMX_PHONE_ALLOWED_COUNTRIES,
  LMX_PHONE_DIAL_CODE_BY_COUNTRY,
  resolveLmxPhoneCountry,
} from "@/components/Common/phoneInputTheme";
import {
  clearRecaptchaVerifier,
  ensureRecaptchaVerifier,
  isRecaptchaRecoverableError,
} from "@/components/Auth/recaptchaManager";

const USER_VERIFICATION_RECAPTCHA_CONTAINER_ID = "user-verification-recaptcha-container";

const PHONE_COUNTRY_META = {
  ba: { label: "Bosna i Hercegovina", region: "BA", flag: "🇧🇦" },
  hr: { label: "Hrvatska", region: "HR", flag: "🇭🇷" },
  rs: { label: "Srbija", region: "RS", flag: "🇷🇸" },
  si: { label: "Slovenija", region: "SI", flag: "🇸🇮" },
  me: { label: "Crna Gora", region: "ME", flag: "🇲🇪" },
};

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

const stripCountryCodePrefix = (mobile, countryCode) => {
  const mobileDigits = digitsOnly(mobile);
  const ccDigits = digitsOnly(countryCode);
  if (!mobileDigits) return "";
  if (!ccDigits) return mobileDigits;
  if (mobileDigits.startsWith(ccDigits)) {
    return mobileDigits.slice(ccDigits.length);
  }
  return mobileDigits;
};

const toE164Phone = (countryCode, localNumber) => {
  const ccDigits = digitsOnly(countryCode);
  const numberDigits = digitsOnly(localNumber);
  if (!ccDigits || !numberDigits) return "";
  const normalizedLocal = numberDigits.startsWith(ccDigits)
    ? numberDigits.slice(ccDigits.length)
    : numberDigits;
  return `+${ccDigits}${normalizedLocal}`;
};

const extractFirebaseIdentity = (user) => {
  if (!user) return null;
  return {
    uid: user.uid || "",
    email: user.email || "",
    emailVerified: Boolean(user.emailVerified),
    phoneNumber: user.phoneNumber || "",
    providerIds: Array.isArray(user.providerData)
      ? user.providerData.map((provider) => provider?.providerId).filter(Boolean)
      : [],
  };
};

const toBoolLoose = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "verified", "approved"].includes(normalized);
};

const resolveIso2FromDialCode = (dialCode) => {
  const normalizedDial = digitsOnly(dialCode);
  const matched = Object.entries(LMX_PHONE_DIAL_CODE_BY_COUNTRY).find(
    ([, code]) => String(code) === normalizedDial,
  );
  return matched?.[0] || "ba";
};

const UserVerification = () => {
  const { navigate } = useNavigate();
  const auth = useMemo(() => getAuth(), []);

  const currentUser = useSelector(userSignUpData);
  const authToken = useSelector((state) => state?.UserSignup?.data?.token || "");
  const otpServiceProvider = useSelector(getOtpServiceProvider);

  const [UserVeriFields, setUserVeriFields] = useState([]);
  const [filePreviews, setFilePreviews] = useState({});
  const [VerificationStatus, setVerificationStatus] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [firebaseIdentity, setFirebaseIdentity] = useState(null);
  const [manualPhoneVerified, setManualPhoneVerified] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState("387");
  const [phoneLocalNumber, setPhoneLocalNumber] = useState("");
  const [phoneRegionCode, setPhoneRegionCode] = useState("BA");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneVerificationId, setPhoneVerificationId] = useState("");
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false);
  const [emailVerificationSending, setEmailVerificationSending] = useState(false);
  const [emailVerificationRefreshing, setEmailVerificationRefreshing] = useState(false);

  const langCode = useSelector(getCurrentLangCode);
  const languages = useSelector(getLanguages);
  const defaultLanguageCode = useSelector(getDefaultLanguageCode);
  const defaultLangId = languages?.find(
    (lang) => lang.code === defaultLanguageCode
  )?.id;
  const [langId, setLangId] = useState(defaultLangId);
  const [translations, setTranslations] = useState({
    [defaultLangId]: {},
  });

  const currentTranslation = translations[langId] || {};
  const hasTextbox = UserVeriFields.some((field) => field.type === "textbox");

  const phoneCountryOptions = useMemo(
    () =>
      LMX_PHONE_ALLOWED_COUNTRIES.map((iso2) => {
        const dialCode = String(LMX_PHONE_DIAL_CODE_BY_COUNTRY[iso2] || "");
        const meta = PHONE_COUNTRY_META[iso2] || {
          label: String(iso2 || "").toUpperCase(),
          region: String(iso2 || "").toUpperCase(),
          flag: "🏳️",
        };
        return {
          iso2,
          dialCode,
          regionCode: meta.region,
          label: meta.label,
          flag: meta.flag,
        };
      }),
    [],
  );

  const providerIds = useMemo(
    () => new Set(firebaseIdentity?.providerIds || []),
    [firebaseIdentity?.providerIds],
  );

  const hasPhoneProvider = useMemo(
    () => providerIds.has("phone") || Boolean(firebaseIdentity?.phoneNumber),
    [providerIds, firebaseIdentity?.phoneNumber],
  );

  const hasEmailIdentity = useMemo(
    () => Boolean(firebaseIdentity?.email || currentUser?.email),
    [firebaseIdentity?.email, currentUser?.email],
  );

  const backendEmailVerified = useMemo(
    () =>
      toBoolLoose(currentUser?.email_verified) ||
      Boolean(currentUser?.email_verified_at),
    [currentUser?.email_verified, currentUser?.email_verified_at],
  );

  const isEmailVerified = useMemo(
    () =>
      hasEmailIdentity
        ? Boolean(firebaseIdentity?.emailVerified) || backendEmailVerified
        : false,
    [backendEmailVerified, firebaseIdentity?.emailVerified, hasEmailIdentity],
  );

  const registeredViaPhone = useMemo(() => {
    if (providerIds.has("phone") && !providerIds.has("password") && !providerIds.has("google.com")) {
      return true;
    }
    if (!currentUser?.email && Boolean(currentUser?.mobile)) {
      return true;
    }
    return false;
  }, [providerIds, currentUser?.email, currentUser?.mobile]);

  const isPhoneVerified = useMemo(
    () => hasPhoneProvider || manualPhoneVerified || registeredViaPhone,
    [hasPhoneProvider, manualPhoneVerified, registeredViaPhone],
  );

  const selectedPhoneCountryIso2 = useMemo(() => {
    const byRegion = String(phoneRegionCode || "").toUpperCase();
    const fromRegion = phoneCountryOptions.find(
      (option) => String(option.regionCode || "").toUpperCase() === byRegion,
    );
    if (fromRegion) return fromRegion.iso2;

    const normalizedDial = digitsOnly(phoneCountryCode);
    const fromDial = phoneCountryOptions.find(
      (option) => String(option.dialCode || "") === normalizedDial,
    );
    return fromDial?.iso2 || "ba";
  }, [phoneCountryCode, phoneCountryOptions, phoneRegionCode]);

  const selectedPhoneCountryOption = useMemo(
    () =>
      phoneCountryOptions.find((option) => option.iso2 === selectedPhoneCountryIso2) ||
      phoneCountryOptions.find((option) => option.iso2 === "ba") ||
      null,
    [phoneCountryOptions, selectedPhoneCountryIso2],
  );

  const verificationProgressPercent = useMemo(() => {
    const completed = (isPhoneVerified ? 1 : 0) + (isEmailVerified ? 1 : 0);
    return Math.round((completed / 2) * 100);
  }, [isEmailVerified, isPhoneVerified]);

  const phoneDraftE164 = useMemo(
    () => toE164Phone(phoneCountryCode, phoneLocalNumber),
    [phoneCountryCode, phoneLocalNumber],
  );

  const fallbackPhoneE164 = useMemo(
    () =>
      toE164Phone(
        currentUser?.country_code || "387",
        stripCountryCodePrefix(currentUser?.mobile, currentUser?.country_code || "387"),
      ),
    [currentUser?.country_code, currentUser?.mobile],
  );

  const resolvedPhoneDisplay =
    firebaseIdentity?.phoneNumber || phoneDraftE164 || fallbackPhoneE164 || "nije dostupan";

  useEffect(() => {
    fetchVerificationData();
  }, [langCode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseIdentity(extractFirebaseIdentity(firebaseUser));
    });

    return () => {
      unsubscribe?.();
      clearRecaptchaVerifier({
        containerId: USER_VERIFICATION_RECAPTCHA_CONTAINER_ID,
      });
    };
  }, [auth]);

  useEffect(() => {
    const dialFromProfile = digitsOnly(currentUser?.country_code);
    const iso2FromRegion = resolveLmxPhoneCountry(currentUser?.region_code || "");
    const resolvedIso2 = dialFromProfile
      ? resolveIso2FromDialCode(dialFromProfile)
      : iso2FromRegion || "ba";
    const dialCode = String(
      dialFromProfile || LMX_PHONE_DIAL_CODE_BY_COUNTRY[resolvedIso2] || "387",
    );
    const localNumber = stripCountryCodePrefix(currentUser?.mobile, dialCode);
    const normalizedRegion = (
      PHONE_COUNTRY_META[resolvedIso2]?.region || String(resolvedIso2 || "BA").toUpperCase()
    ).toUpperCase();

    setPhoneCountryCode(dialCode);
    setPhoneLocalNumber(localNumber);
    setPhoneRegionCode(normalizedRegion);
    setManualPhoneVerified(
      toBoolLoose(currentUser?.mobile_verified) ||
        toBoolLoose(currentUser?.phone_verified) ||
        Boolean(currentUser?.mobile_verified_at) ||
        Boolean(currentUser?.phone_verified_at),
    );
  }, [
    currentUser?.country_code,
    currentUser?.mobile,
    currentUser?.region_code,
    currentUser?.mobile_verified,
    currentUser?.phone_verified,
    currentUser?.mobile_verified_at,
    currentUser?.phone_verified_at,
  ]);

  useEffect(() => {
    if (phoneOtpTimer <= 0) return;
    const timer = window.setInterval(() => {
      setPhoneOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phoneOtpTimer]);

  const fetchVerificationData = async () => {
    try {
      setVerificationLoading(true);

      // Step 1: Fetch field definitions
      const fieldsRes = await getVerificationFiledsApi.getVerificationFileds();
      const fieldData = fieldsRes?.data?.data || [];
      setUserVeriFields(fieldData);

      // Step 2: Fetch verification values
      const statusRes = await getVerificationStatusApi.getVerificationStatus();
      const statusData = statusRes?.data?.data;
      const statusError = statusRes?.data?.error;

      if (statusError) {
        setVerificationStatus("not applied");
      } else {
        setVerificationStatus(statusData?.status);
      }

      const verification_fields = statusData?.verification_fields || [];

      // Step 3: Prepare translations
      const translationsToSet = prefillVerificationDetails({
        data: fieldData,
        languages,
        defaultLangId,
        extraFieldValue:
          statusData?.status === "not applied" ? [] : verification_fields,
        setFilePreviews,
      });

      setTranslations(translationsToSet);
    } catch (error) {
      console.log(error);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handlePhoneCountryPresetChange = useCallback(
    (iso2) => {
      const option = phoneCountryOptions.find((entry) => entry.iso2 === iso2);
      if (!option) return;
      setPhoneCountryCode(String(option.dialCode || ""));
      setPhoneRegionCode(String(option.regionCode || "").toUpperCase());
    },
    [phoneCountryOptions],
  );

  const syncProfileVerificationData = useCallback(
    async ({
      nextMobile,
      nextCountryCode,
      nextRegionCode,
      nextEmail,
      markPhoneVerified = false,
    } = {}) => {
      const response = await updateProfileApi.updateProfile({
        mobile: nextMobile || undefined,
        country_code: nextCountryCode || undefined,
        region_code: nextRegionCode || undefined,
        email: nextEmail || undefined,
        mark_phone_verified: markPhoneVerified ? 1 : undefined,
        auth_token: authToken || undefined,
      });

      if (response?.data?.error === false && response?.data?.data) {
        loadUpdateUserData(response.data.data);
      }

      return response;
    },
    [authToken],
  );

  const refreshFirebaseIdentity = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setFirebaseIdentity(null);
      return null;
    }
    await reload(firebaseUser);
    const refreshedUser = auth.currentUser;
    const identity = extractFirebaseIdentity(refreshedUser);
    setFirebaseIdentity(identity);
    return identity;
  }, [auth]);

  const sendPhoneOtpWithTwilio = useCallback(async (phoneE164) => {
    const response = await getOtpApi.getOtp({
      number: phoneE164,
      intent: "profile_verification",
      mobile: stripCountryCodePrefix(phoneLocalNumber, digitsOnly(phoneCountryCode)),
      country_code: digitsOnly(phoneCountryCode),
      region_code: String(phoneRegionCode || "").toUpperCase(),
    });
    if (response?.data?.error === false) {
      setPhoneOtpTimer(60);
      setPhoneVerificationId("twilio");
      toast.success(response?.data?.message || "OTP kod je poslan.");
      return true;
    }
    toast.error(response?.data?.message || "Slanje OTP koda nije uspjelo.");
    return false;
  }, []);

  const sendPhoneOtpWithFirebase = useCallback(
    async (phoneE164) => {
      const requestOtp = async (forceRecreate = true) => {
        const verifier = ensureRecaptchaVerifier({
          auth,
          containerId: USER_VERIFICATION_RECAPTCHA_CONTAINER_ID,
          forceRecreate,
        });

        if (!verifier) {
          handleFirebaseAuthError("auth/recaptcha-not-enabled");
          return null;
        }

        const provider = new PhoneAuthProvider(auth);
        return provider.verifyPhoneNumber(phoneE164, verifier);
      };

      try {
        const verificationId = await requestOtp(true);
        if (!verificationId) return false;
        setPhoneVerificationId(verificationId);
        setPhoneOtpTimer(60);
        toast.success("OTP kod je poslan.");
        return true;
      } catch (error) {
        if (isRecaptchaRecoverableError(error)) {
          try {
            const retriedVerificationId = await requestOtp(true);
            if (!retriedVerificationId) return false;
            setPhoneVerificationId(retriedVerificationId);
            setPhoneOtpTimer(60);
            toast.success("OTP kod je poslan.");
            return true;
          } catch (retryError) {
            handleFirebaseAuthError(retryError);
            return false;
          }
        }
        handleFirebaseAuthError(error);
        return false;
      }
    },
    [auth],
  );

  const handleSendPhoneVerificationOtp = useCallback(async () => {
    const phoneE164 = toE164Phone(phoneCountryCode, phoneLocalNumber);
    if (!phoneE164 || digitsOnly(phoneLocalNumber).length < 6) {
      toast.error("Unesite ispravan broj telefona.");
      return;
    }

    setPhoneOtpSending(true);
    try {
      if (otpServiceProvider === "twilio") {
        await sendPhoneOtpWithTwilio(phoneE164);
      } else {
        await sendPhoneOtpWithFirebase(phoneE164);
      }
    } finally {
      setPhoneOtpSending(false);
    }
  }, [
    otpServiceProvider,
    phoneCountryCode,
    phoneLocalNumber,
    sendPhoneOtpWithFirebase,
    sendPhoneOtpWithTwilio,
  ]);

  const handleVerifyPhoneOtp = useCallback(async () => {
    const trimmedOtp = String(phoneOtp || "").trim();
    const phoneE164 = toE164Phone(phoneCountryCode, phoneLocalNumber);
    const normalizedCountryCode = digitsOnly(phoneCountryCode);
    const normalizedLocalNumber = stripCountryCodePrefix(phoneLocalNumber, normalizedCountryCode);

    if (!trimmedOtp || trimmedOtp.length < 4) {
      toast.error("Unesite važeći OTP kod.");
      return;
    }
    if (!phoneE164) {
      toast.error("Broj telefona nije validan.");
      return;
    }

    setPhoneOtpVerifying(true);
    try {
      if (otpServiceProvider === "twilio") {
        const verifyResponse = await verifyOtpApi.verifyOtp({
          number: phoneE164,
          otp: trimmedOtp,
          intent: "profile_verification",
          mobile: normalizedLocalNumber,
          country_code: normalizedCountryCode,
          region_code: phoneRegionCode || currentUser?.region_code || "BA",
        });

        if (verifyResponse?.data?.error !== false) {
          toast.error(verifyResponse?.data?.message || "OTP verifikacija nije uspjela.");
          return;
        }
      } else {
        if (!phoneVerificationId) {
          toast.error("Prvo pošaljite OTP kod.");
          return;
        }
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          toast.error("Sesija je istekla. Prijavite se ponovo.");
          return;
        }

        const credential = PhoneAuthProvider.credential(phoneVerificationId, trimmedOtp);
        const alreadyLinkedPhone = firebaseUser.providerData?.some(
          (provider) => provider?.providerId === "phone",
        );

        if (alreadyLinkedPhone || firebaseUser.phoneNumber) {
          await updatePhoneNumber(firebaseUser, credential);
        } else {
          await linkWithCredential(firebaseUser, credential);
        }
      }

      await refreshFirebaseIdentity();

      const syncResponse = await syncProfileVerificationData({
        nextMobile: normalizedLocalNumber,
        nextCountryCode: normalizedCountryCode,
        nextRegionCode: phoneRegionCode || currentUser?.region_code || "BA",
        markPhoneVerified: true,
      });

      if (syncResponse?.data?.error !== false) {
        toast.error(syncResponse?.data?.message || "Broj je potvrđen, ali spremanje nije uspjelo.");
        return;
      }

      setManualPhoneVerified(true);
      setPhoneOtp("");
      setPhoneVerificationId("");
      setPhoneOtpTimer(0);
      clearRecaptchaVerifier({
        containerId: USER_VERIFICATION_RECAPTCHA_CONTAINER_ID,
      });
      toast.success("Broj telefona je uspješno verificiran.");
    } catch (error) {
      if (otpServiceProvider === "twilio") {
        toast.error(error?.response?.data?.message || "OTP verifikacija nije uspjela.");
      } else {
        handleFirebaseAuthError(error);
      }
    } finally {
      setPhoneOtpVerifying(false);
    }
  }, [
    auth,
    currentUser?.region_code,
    otpServiceProvider,
    phoneCountryCode,
    phoneLocalNumber,
    phoneOtp,
    phoneRegionCode,
    phoneVerificationId,
    refreshFirebaseIdentity,
    syncProfileVerificationData,
  ]);

  const handleSendEmailVerificationNow = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email) {
      toast.error("Nema aktivne e-mail adrese za verifikaciju.");
      return;
    }
    if (firebaseUser.emailVerified) {
      toast.success("E-mail adresa je već verificirana.");
      return;
    }

    setEmailVerificationSending(true);
    try {
      await sendEmailVerification(firebaseUser);
      toast.success("Link za verifikaciju je poslan na e-mail.");
    } catch (error) {
      handleFirebaseAuthError(error);
    } finally {
      setEmailVerificationSending(false);
    }
  }, [auth]);

  const handleRefreshEmailVerification = useCallback(async () => {
    setEmailVerificationRefreshing(true);
    try {
      const identity = await refreshFirebaseIdentity();
      if (identity?.email && identity?.emailVerified) {
        await syncProfileVerificationData({
          nextEmail: identity.email,
        });
        toast.success("E-mail adresa je potvrđena.");
      } else {
        toast.info("E-mail još nije potvrđen. Otvorite link iz poruke i pokušajte ponovo.");
      }
    } catch (error) {
      handleFirebaseAuthError(error);
    } finally {
      setEmailVerificationRefreshing(false);
    }
  }, [refreshFirebaseIdentity, syncProfileVerificationData]);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await firebaseDeleteUser(firebaseUser);
      }

      const response = await deleteUserApi.deleteUser();
      if (response?.data?.error === true) {
        toast.error(response?.data?.message || "Brisanje profila nije uspjelo.");
        return;
      }

      logoutSuccess();
      toast.success("Profil je uspješno obrisan.");
      setIsDeleteOpen(false);
      navigate("/");
    } catch (error) {
      if (error?.code === "auth/requires-recent-login") {
        toast.error("Ponovo se prijavite pa pokušajte brisanje profila.");
      } else {
        toast.error(error?.response?.data?.message || "Greška pri brisanju profila.");
      }
    } finally {
      setIsDeleting(false);
    }
  }, [auth, navigate]);

  const renderCustomFields = (field) => {
    let {
      id,
      name,
      translated_name,
      type,
      translated_value,
      values,
      min_length,
      max_length,
    } = field;

    const inputProps = {
      id,
      name: id,
      onChange: (e) => handleChange(id, e.target.value),
      value: currentTranslation[id] || "",
      ...(type === "number"
        ? { min: min_length, max: max_length }
        : { minLength: min_length, maxLength: max_length }),
    };

    switch (type) {
      case "number":
        return (
          <div className="flex flex-col">
            <Input
              type="number"
              inputMode="numeric"
              placeholder={`${"Unesi"} ${translated_name || name}`}
              {...inputProps}
              onKeyDown={(e) => handleKeyDown(e, max_length)}
              onKeyPress={(e) => inpNum(e)}
              className="border rounded-md px-4 py-2 outline-none"
            />
            {max_length && (
              <span className="flex justify-end text-muted-foreground text-sm">
                {`${currentTranslation[id]?.length ?? 0}/${max_length}`}
              </span>
            )}
          </div>
        );
      case "textbox": {
        return (
          <div className=" flex flex-col">
            <Textarea
              placeholder={`${"Unesi"} ${translated_name || name}`}
              {...inputProps}
            />
            {max_length && (
              <span className=" flex justify-end text-muted-foreground text-sm">
                {`${currentTranslation[id]?.length ?? 0}/${max_length}`}
              </span>
            )}
          </div>
        );
      }

      case "dropdown":
        return (
          <div className="w-full">
            <Select
              value={currentTranslation[id] || ""}
              onValueChange={(value) => handleChange(id, value)}
              id={id}
              name={id}
            >
              <SelectTrigger className="outline-none focus:outline-none">
                <SelectValue
                  className="font-semibold"
                  placeholder={`${"Odaberi"} ${translated_name || name}`}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel value="">
                    {"Odaberi"} {translated_name || name}
                  </SelectLabel>
                  {values?.map((option, index) => (
                    <SelectItem
                      id={option}
                      className="font-semibold"
                      key={index}
                      value={option}
                    >
                      {translated_value?.[index] || option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        );
      case "checkbox":
        return (
          <div className="flex w-full flex-wrap gap-2">
            {values?.map((value, index) => {
              return (
                <div key={index} className="flex gap-1 items-center">
                  <Checkbox
                    id={id}
                    value={value}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(id, value, checked)
                    }
                    checked={currentTranslation[id]?.includes(value)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {translated_value?.[index] || value}
                  </label>
                </div>
              );
            })}
          </div>
        );
      case "radio":
        return (
          <RadioGroup
            value={currentTranslation[id] || ""}
            onValueChange={(value) => handleChange(id, value)}
            className="flex flex-wrap gap-3"
            id={id}
            name={id}
          >
            {values?.map((option, index) => (
              <div key={option} className="flex items-center">
                <RadioGroupItem
                  value={option}
                  id={option}
                  className="sr-only peer"
                />
                <label
                  htmlFor={option}
                  className={`${
                    currentTranslation[id] === option
                      ? "bg-primary text-white"
                      : "bg-white"
                  } border rounded-md px-4 py-2 cursor-pointer transition-colors flex items-center`}
                >
                  {translated_value?.[index] || option}
                </label>
              </div>
            ))}
          </RadioGroup>
        );
      case "fileinput":
        const fileUrl = filePreviews?.[langId]?.[id]?.url;
        const isPdf = filePreviews?.[langId]?.[id]?.isPdf;
        return (
          <>
            <label htmlFor={id} className="flex gap-2 items-center">
              <div className="flex items-center gap-1 cursor-pointer border border-gray-300 px-2.5 py-1 rounded w-fit">
                <HiOutlineUpload size={24} fontWeight="400" />
              </div>
              {fileUrl && (
                <div className="flex items-center gap-1 text-sm flex-nowrap break-words">
                  {isPdf ? (
                    <>
                      <MdOutlineAttachFile className="file_icon" />
                      <CustomLink
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {"Pogledaj PDF"}
                      </CustomLink>
                    </>
                  ) : (
                    <CustomImage
                      src={fileUrl}
                      alt="Preview"
                      className="h-9 w-9 aspect-square"
                      height={36}
                      width={36}
                    />
                  )}
                </div>
              )}
            </label>
            <input
              type="file"
              id={id}
              name={id}
              className="hidden"
              onChange={(e) => handleFileChange(id, e.target.files[0])}
            />
            <span className="text-sm text-muted-foreground">
              {"Dozvoljeno: PNG, JPG, JPEG, SVG, PDF"}
            </span>
          </>
        );
      default:
        break;
    }
  };

  const write = (fieldId, value) =>
    setTranslations((prev) => ({
      ...prev,
      [langId]: {
        ...prev[langId],
        [fieldId]: value,
      },
    }));

  const handleFileChange = (id, file) => {
    if (file) {
      const allowedExtensions = /\.(jpg|jpeg|svg|png|pdf)$/i;
      if (!allowedExtensions.test(file.name)) {
        toast.error("Podržano: JPG, JPEG, SVG, PNG i PDF");
        return;
      }
      const fileUrl = URL.createObjectURL(file);
      // Language-scoped preview
      setFilePreviews((prev) => ({
        ...prev,
        [langId]: {
          ...(prev[langId] || {}),
          [id]: {
            url: fileUrl,
            isPdf: /\.pdf$/i.test(file.name),
          },
        },
      }));
      write(id, file);
    }
  };

  const handleCheckboxChange = (id, value, checked) => {
    const list = currentTranslation[id] || [];
    const next = checked ? [...list, value] : list.filter((v) => v !== value);
    write(id, next);
  };

  const handleChange = (id, value) => write(id, value ?? "");

  const handleVerify = async () => {
    if (VerificationStatus === "approved") {
      toast.error("Već si odobren/a. Nema potrebe ponovo.");
      return;
    }
    if (
      VerificationStatus === "resubmitted" ||
      VerificationStatus === "pending" ||
      VerificationStatus === "submitted"
    ) {
      toast.error("Verifikacija je već na pregledu.");
      return;
    }

    if (
      validateExtraDetails({
        languages,
        defaultLangId,
        extraDetails: translations,
        customFields: UserVeriFields,
        filePreviews,
      })
    ) {
      setIsVerifying(true);
      const verification_field_translations =
        prepareCustomFieldTranslations(translations);
      const verification_field_files = prepareCustomFieldFiles(
        translations,
        defaultLangId
      );
      try {
        const res = await sendVerificationReqApi.sendVerificationReq({
          verification_field_translations,
          verification_field_files,
        });
        if (res?.data?.error === false) {
          toast.success(res?.data?.message);
          navigate("/profile");
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  return (
    <Layout>
      <BreadCrumb title2={"Verifikacija računa"} />

      {verificationLoading ? (
        <PageLoader />
      ) : (
        <div className="container mt-8 pb-10">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/80 sm:p-6">
              <div className="mb-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Verifikacija računa
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Potvrdi telefon i e-mail za jači nivo povjerenja i sigurnije korištenje platforme.
                </p>
              </div>

              <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${verificationProgressPercent}%` }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Verifikacija broja telefona</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">OTP potvrda u jednom koraku</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold text-center",
                        isPhoneVerified
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                      )}
                    >
                      {isPhoneVerified ? "Verificiran" : "Nije verificiran"}
                    </span>
                  </div>

                  {registeredViaPhone ? (
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Registriran putem telefona
                    </div>
                  ) : null}

                  {isPhoneVerified ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                        Broj je potvrđen
                      </div>
                      <p className="mt-1 text-xs text-emerald-700/90 dark:text-emerald-200/90">
                        Trenutno povezan broj: <span className="font-semibold">{resolvedPhoneDisplay}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Unesi broj koji želiš potvrditi i pošalji OTP kod.
                      </p>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                          <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Država i pozivni
                          </Label>
                          <Select
                            value={selectedPhoneCountryIso2}
                            onValueChange={handlePhoneCountryPresetChange}
                          >
                            <SelectTrigger className="h-10 text-sm">
                              {selectedPhoneCountryOption ? (
                                <span className="inline-flex min-w-0 items-center gap-2">
                                  <span className="shrink-0 text-base" aria-hidden>
                                    {selectedPhoneCountryOption.flag}
                                  </span>
                                  <span className="truncate">{selectedPhoneCountryOption.label}</span>
                                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                                    +{selectedPhoneCountryOption.dialCode}
                                  </span>
                                </span>
                              ) : (
                                <SelectValue placeholder="Odaberi državu" />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {phoneCountryOptions.map((option) => (
                                <SelectItem key={option.iso2} value={option.iso2}>
                                  <span className="inline-flex items-center gap-2">
                                    <span className="text-base" aria-hidden>
                                      {option.flag}
                                    </span>
                                    <span>{option.label}</span>
                                    <span className="text-xs text-slate-500">
                                      +{option.dialCode}
                                    </span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Broj
                          </Label>
                          <Input
                            value={phoneLocalNumber}
                            onChange={(e) => setPhoneLocalNumber(digitsOnly(e.target.value))}
                            className="h-10 text-sm"
                            placeholder=""
                            inputMode="numeric"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                        Format za verifikaciju:{" "}
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {phoneDraftE164 || "+387"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSendPhoneVerificationOtp}
                          disabled={phoneOtpSending || phoneOtpTimer > 0}
                          className="h-10 rounded-xl px-4"
                        >
                          {phoneOtpSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Pošalji OTP kod"
                          )}
                        </Button>
                        {phoneOtpTimer > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Clock className="h-3.5 w-3.5" />
                            Ponovno slanje za {phoneOtpTimer}s
                          </span>
                        ) : null}
                      </div>

                      <AnimatePresence initial={false}>
                        {phoneVerificationId ? (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="rounded-xl border border-primary/20 bg-primary/5 p-3"
                          >
                            <Label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                              OTP kod
                            </Label>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                              <Input
                                value={phoneOtp}
                                onChange={(e) => setPhoneOtp(e.target.value)}
                                className="h-10 text-sm tracking-[0.18em]"
                                placeholder="Unesi 6-cifreni kod"
                                maxLength={6}
                                inputMode="numeric"
                              />
                              <Button
                                type="button"
                                onClick={handleVerifyPhoneOtp}
                                disabled={phoneOtpVerifying}
                                className="h-10 rounded-xl px-4"
                              >
                                {phoneOtpVerifying ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Potvrdi kod"
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Verifikacija e-mail adrese</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Link potvrda + osvježenje statusa</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold text-center",
                        isEmailVerified
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                      )}
                    >
                      {isEmailVerified ? "Verificiran" : "Nije verificiran"}
                    </span>
                  </div>

                  {hasEmailIdentity ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                        Trenutni e-mail:{" "}
                        <span className="font-semibold break-all text-slate-900 dark:text-slate-100">
                          {firebaseIdentity?.email || currentUser?.email}
                        </span>
                      </div>

                      {isEmailVerified ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                          E-mail adresa je potvrđena i spremna za sigurnosne akcije.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 rounded-xl"
                            onClick={handleSendEmailVerificationNow}
                            disabled={emailVerificationSending}
                          >
                            {emailVerificationSending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Pošalji verifikacijski link"
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-10 rounded-xl"
                            onClick={handleRefreshEmailVerification}
                            disabled={emailVerificationRefreshing}
                          >
                            {emailVerificationRefreshing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Provjeri status"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-3 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                      Nema povezane e-mail adrese na aktivnoj sesiji. Dodaj e-mail u osnovnim podacima pa pokreni verifikaciju.
                    </div>
                  )}
                </div>
              </div>

              <div id={USER_VERIFICATION_RECAPTCHA_CONTAINER_ID} className="hidden" />
            </div>

            <div className="hidden rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/80 sm:p-6">
              <div className="flex items-center gap-3 justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Dodatna verifikacija profila
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Po potrebi pošalji dodatne podatke za manualni pregled profila.
                  </p>
                </div>
                {hasTextbox && (
                  <AdLanguageSelector
                    langId={langId}
                    setLangId={setLangId}
                    languages={languages}
                    setTranslations={setTranslations}
                  />
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4">
                {UserVeriFields?.map((field) => {
                  if (langId !== defaultLangId && field.type !== "textbox") return null;

                  return (
                    <div
                      className="col-span-1 md:col-span-6 flex flex-col gap-2"
                      key={field?.id}
                    >
                      <Label
                        className={`${
                          field?.is_required === 1 && defaultLangId === langId
                            ? "requiredInputLabel"
                            : ""
                        }`}
                        htmlFor={field?.id}
                      >
                        {field?.translated_name || field?.name}
                      </Label>
                      {renderCustomFields(field)}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  className="px-5 py-2.5 bg-black text-white text-sm sm:text-base rounded-xl disabled:opacity-60"
                  disabled={isVerifying}
                  onClick={handleVerify}
                >
                  {isVerifying ? "Učitavanje..." : "Pošalji na pregled"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-500/30 dark:bg-red-500/10 sm:p-6">
              <h3 className="text-base font-semibold text-red-800 dark:text-red-200">Opasna zona</h3>
              <p className="mt-1 text-sm text-red-700/90 dark:text-red-200/90">
                Brisanjem profila trajno se uklanjaju tvoji podaci, oglasi i poruke.
              </p>

              <div className="mt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteOpen(true)}
                  className="inline-flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Obriši profil
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReusableAlertDialog
        open={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Obriši profil?"
        description={
          <div className="space-y-2">
            <p>Ova akcija je trajna i ne može se poništiti.</p>
            <ul className="list-disc pl-4 text-xs space-y-1">
              <li>Svi oglasi i poruke bit će uklonjeni.</li>
              <li>Transakcije i historija više neće biti dostupni.</li>
              <li>Nalog se ne može vratiti nakon potvrde.</li>
            </ul>
          </div>
        }
        cancelText="Odustani"
        confirmText="Obriši profil"
        confirmDisabled={isDeleting}
      />
    </Layout>
  );
};

export default Checkauth(UserVerification);
