"use client";
import { handleFirebaseAuthError } from "@/utils";
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
import {
  FcGoogle,
  X,
  User,
  Mail,
  Smartphone,
  Pin,
} from "@/components/Common/UnifiedIconPack";
import {
  MdOutlineEmail,
  MdOutlineLocalPhone,
} from "@/components/Common/UnifiedIconPack";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  getDeviceLoginProfiles,
  getLastUsedDeviceProfileKey,
  getRememberMePreference,
  removeDeviceLoginProfile,
  setRememberMePreference,
  upsertDeviceLoginProfile,
} from "./deviceLoginProfiles";
import {
  clearRecaptchaVerifier,
  ensureRecaptchaVerifier,
} from "./recaptchaManager";

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
  const [rememberMe, setRememberMe] = useState(true);
  const [deviceProfiles, setDeviceProfiles] = useState([]);
  const [lastUsedProfileKey, setLastUsedProfileKey] = useState("");
  const [prefilledIdentifier, setPrefilledIdentifier] = useState("");

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
    setPrefilledIdentifier("");
    setLastUsedProfileKey("");
    setIsLoginWithEmail(
      mobile_authentication === 0 && email_authentication === 1,
    );
  };

  useEffect(() => {
    if (IsLoginOpen) {
      setIsLoginWithEmail(
        mobile_authentication === 0 && email_authentication === 1,
      );
      setRememberMe(getRememberMePreference());
      setDeviceProfiles(getDeviceLoginProfiles());
      setLastUsedProfileKey(getLastUsedDeviceProfileKey());
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

  const generateRecaptcha = (options = {}) => {
    return ensureRecaptchaVerifier({
      auth,
      containerId: "recaptcha-container",
      forceRecreate: Boolean(options?.forceRecreate),
    });
  };

  const recaptchaClear = async () => {
    clearRecaptchaVerifier({ containerId: "recaptcha-container" });
  };

  useEffect(() => {
    return () => {
      clearRecaptchaVerifier({ containerId: "recaptcha-container" });
    };
  }, []);

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );
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
          handleAuthenticated(data, {
            method: "google",
            identifier: user?.email || "",
          });
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

  const handleRememberChange = (checked) => {
    const nextValue = checked === true || checked === "indeterminate" ? true : Boolean(checked);
    setRememberMe(nextValue);
    setRememberMePreference(nextValue);
  };

  const handleAuthenticated = (payload, meta = {}) => {
    const nextProfiles = upsertDeviceLoginProfile(payload, {
      rememberMe,
      method: meta?.method || "email",
      identifier: meta?.identifier || "",
    });
    setDeviceProfiles(nextProfiles);
    setLastUsedProfileKey(getLastUsedDeviceProfileKey());
  };

  const handlePickDeviceProfile = (profile) => {
    const identifier = String(profile?.email || profile?.identifier || "").trim();
    if (!identifier) return;
    setIsLoginWithEmail(true);
    setPrefilledIdentifier(identifier);
  };

  const handleRemoveDeviceProfile = (profileKey) => {
    const nextProfiles = removeDeviceLoginProfile(profileKey);
    setDeviceProfiles(nextProfiles);
    setLastUsedProfileKey(getLastUsedDeviceProfileKey());
  };

  const quickLoginProfiles = deviceProfiles.filter(
    (profile) => String(profile?.email || "").trim().length > 0,
  );
  const activeLoginStepIndex = IsOTPScreen ? 1 : IsLoginWithEmail ? 2 : 0;
  const loginStepProgress = ((activeLoginStepIndex + 1) / 3) * 100;

  const primaryStepMotion = {
    initial: { opacity: 0, y: 16, scale: 0.992, filter: "blur(3px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, y: -10, scale: 0.996, filter: "blur(2px)" },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  };

  const secondaryStepMotion = {
    initial: { opacity: 0, y: 10, scale: 0.995 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.997 },
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
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
border border-border/80
bg-background
shadow-[0_30px_90px_-45px_rgba(15,23,42,0.55)]
"

        >
          <div className="grid h-full min-h-0 lg:grid-cols-[0.95fr_1.25fr]">
            <AuthValuePanel mode={IsOTPScreen ? "otp" : "login"} />

            <div className="min-h-0 overflow-y-auto bg-gradient-to-b from-background via-background to-muted/35 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
              <div className="mx-auto w-full max-w-[560px]">
                <DialogHeader className="space-y-3">
                  {!IsOTPScreen ? (
                    <div className="inline-flex w-max items-center rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {settings?.company_name || "LMX"}
                    </div>
                  ) : null}
                  <DialogTitle className="text-left text-2xl font-semibold leading-tight text-foreground sm:text-[2rem]">
                    {IsOTPScreen
                      ? "Unesi verifikacijski kod"
                      : "Prijava na korisnički račun"}
                  </DialogTitle>
                  <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
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

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {["Odabir metode", "Potvrda koda", "Pristup računu"].map(
                    (label, idx) => {
                      const isDone = idx < activeLoginStepIndex;
                      const isActive = idx === activeLoginStepIndex;
                      return (
                        <motion.div
                          key={label}
                          animate={{ scale: isActive ? 1.015 : 1, y: isActive ? -1 : 0 }}
                          transition={{ type: "spring", stiffness: 320, damping: 26 }}
                          className={cn(
                            "rounded-xl border px-2.5 py-2 text-center transition-all",
                            isActive
                              ? "border-primary bg-primary/10 text-primary shadow-[0_10px_30px_-22px_rgba(20,184,166,0.8)]"
                              : isDone
                                ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "border-border bg-muted/40 text-muted-foreground",
                          )}
                        >
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                            Korak {idx + 1}
                          </div>
                          <p className="text-[11px] font-medium leading-tight">
                            {label}
                          </p>
                        </motion.div>
                      );
                    },
                  )}
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/70">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary/70 via-primary to-cyan-400/90"
                    animate={{ width: `${loginStepProgress}%` }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  />
                </div>

                <AuthCompactHighlights className="mt-4" />

                <AnimatePresence mode="wait" initial={false}>
                  {IsOTPScreen ? (
                    <motion.div
                      key="otp-login"
                      {...primaryStepMotion}
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
                        onAuthSuccess={handleAuthenticated}
                        key={IsOTPScreen + "login-otp"}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="login-methods"
                      {...primaryStepMotion}
                      className="mt-5 flex flex-col gap-5"
                    >
                      {quickLoginProfiles.length > 0 && email_authentication === 1 ? (
                        <div className="rounded-2xl border border-border/80 bg-card/80 p-3.5 shadow-sm">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Postojeći korisnici na ovom uređaju
                            </p>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                              Brza prijava
                            </span>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {quickLoginProfiles.slice(0, 4).map((profile) => {
                              const isLastUsed = profile.key === lastUsedProfileKey;
                              return (
                                <div
                                  key={profile.key}
                                  className={cn(
                                    "group relative overflow-hidden rounded-xl border border-border bg-background/70 p-2.5 transition hover:border-primary/60 hover:shadow-sm",
                                    isLastUsed
                                      ? "border-primary/60 bg-primary/5 shadow-[0_12px_32px_-24px_rgba(20,184,166,0.9)]"
                                      : "",
                                  )}
                                >
                                  {isLastUsed ? (
                                    <motion.span
                                      layout
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary"
                                    >
                                      <Pin className="h-3 w-3" />
                                      Zadnji korišten
                                    </motion.span>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => handlePickDeviceProfile(profile)}
                                    className={cn(
                                      "flex w-full items-center gap-2.5 text-left",
                                      isLastUsed ? "pt-4" : "",
                                    )}
                                  >
                                    {profile?.profile ? (
                                      <img
                                        src={profile.profile}
                                        alt={profile?.name || "Profil"}
                                        className="h-9 w-9 rounded-lg border border-border object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-foreground">
                                        {profile?.name || "Sačuvani profil"}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {profile?.email}
                                      </p>
                                    </div>
                                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveDeviceProfile(profile.key)
                                    }
                                    className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-transparent bg-background/85 text-muted-foreground opacity-100 transition hover:border-border hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
                                    aria-label="Ukloni profil sa uređaja"
                                    title="Ukloni profil sa uređaja"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            Klik na profil automatski popunjava e-mail. Lozinku i dalje unosiš ručno radi sigurnosti.
                          </p>
                        </div>
                      ) : null}

                      {canUseBothMethods ? (
                        <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-muted/70 p-1.5">
                          <button
                            type="button"
                            className={cn(
                              "relative inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                              IsLoginWithEmail
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => setIsLoginWithEmail(true)}
                          >
                            {IsLoginWithEmail ? (
                              <motion.span
                                layoutId="login-auth-toggle-pill"
                                transition={{
                                  type: "spring",
                                  stiffness: 420,
                                  damping: 32,
                                }}
                                className="absolute inset-0 rounded-xl bg-card shadow-sm ring-1 ring-border"
                              />
                            ) : null}
                            <MdOutlineEmail className="relative z-10 h-4 w-4" />
                            <span className="relative z-10">E-mail</span>
                          </button>
                          <button
                            type="button"
                            className={cn(
                              "relative inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                              !IsLoginWithEmail
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => setIsLoginWithEmail(false)}
                          >
                            {!IsLoginWithEmail ? (
                              <motion.span
                                layoutId="login-auth-toggle-pill"
                                transition={{
                                  type: "spring",
                                  stiffness: 420,
                                  damping: 32,
                                }}
                                className="absolute inset-0 rounded-xl bg-card shadow-sm ring-1 ring-border"
                              />
                            ) : null}
                            <MdOutlineLocalPhone className="relative z-10 h-4 w-4" />
                            <span className="relative z-10">Mobitel</span>
                          </button>
                        </div>
                      ) : null}

                      <AnimatePresence mode="wait" initial={false}>
                        {canUseBothMethods && IsLoginWithEmail ? (
                          <motion.div
                            key="email-login"
                            {...secondaryStepMotion}
                          >
                            <LoginWithEmailForm
                              OnHide={OnHide}
                              prefillIdentifier={prefilledIdentifier}
                              onAuthenticated={handleAuthenticated}
                              rememberMe={rememberMe}
                            />
                          </motion.div>
                        ) : null}

                        {canUseBothMethods && !IsLoginWithEmail ? (
                          <motion.div
                            key="phone-login"
                            {...secondaryStepMotion}
                          >
                            <LoginWithMobileForm
                              formattedNumber={formattedNumber}
                              generateRecaptcha={generateRecaptcha}
                              loginStates={loginStates}
                              setLoginStates={setLoginStates}
                              setIsOTPScreen={setIsOTPScreen}
                              setConfirmationResult={setConfirmationResult}
                              setResendTimer={setResendTimer}
                              rememberMe={rememberMe}
                            />
                          </motion.div>
                        ) : null}
                      </AnimatePresence>

                      {email_authentication === 1 &&
                      mobile_authentication === 0 ? (
                        <LoginWithEmailForm
                          OnHide={OnHide}
                          prefillIdentifier={prefilledIdentifier}
                          onAuthenticated={handleAuthenticated}
                          rememberMe={rememberMe}
                        />
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
                          rememberMe={rememberMe}
                        />
                      ) : null}

                      {canShowGoogleDivider ? (
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

                      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                        <label
                          htmlFor="remember-login-device"
                          className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                        >
                          <Checkbox
                            id="remember-login-device"
                            checked={rememberMe}
                            onCheckedChange={handleRememberChange}
                          />
                          <span>Zapamti me na ovom uređaju</span>
                        </label>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Smartphone className="h-3.5 w-3.5" />
                          Brži pristup
                        </span>
                      </div>

                      <TermsAndPrivacyLinks
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
