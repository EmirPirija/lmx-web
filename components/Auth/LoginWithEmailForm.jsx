import { FaRegEye, FaRegEyeSlash } from "@/components/Common/UnifiedIconPack";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import useAutoFocus from "../Common/useAutoFocus";
import { toast } from "@/utils/toastBs";
import { handleFirebaseAuthError } from "@/utils";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { authApi, userSignUpApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { Fcmtoken } from "@/redux/reducer/settingSlice";
import { loadUpdateData } from "@/redux/reducer/authSlice";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
import { useEffect, useRef, useState } from "react";

const EMAIL_REGEX = /\S+@\S+\.\S+/;

const LoginWithEmailForm = ({
  OnHide,
  prefillIdentifier = "",
  onAuthenticated,
  rememberMe = true,
}) => {
  const emailRef = useAutoFocus();
  const passwordRef = useRef(null);
  const auth = getAuth();
  const fetchFCM = useSelector(Fcmtoken);
  const [loginStates, setLoginStates] = useState({
    identifier: "",
    password: "",
    IsPasswordVisible: false,
    showLoader: false,
  });

  const { identifier, password, IsPasswordVisible, showLoader } = loginStates;

  useEffect(() => {
    const nextIdentifier = String(prefillIdentifier || "").trim();
    if (!nextIdentifier) return;

    setLoginStates((prev) => ({
      ...prev,
      identifier: nextIdentifier,
      password: "",
    }));

    window.setTimeout(() => {
      passwordRef.current?.focus?.();
    }, 680);
  }, [prefillIdentifier]);

  const resolveEmailFromIdentifier = async (rawIdentifier) => {
    const normalizedIdentifier = String(rawIdentifier || "").trim();
    if (!normalizedIdentifier) return "";
    if (EMAIL_REGEX.test(normalizedIdentifier)) {
      return normalizedIdentifier.toLowerCase();
    }

    try {
      const resolved = await authApi.resolveLoginIdentifier({
        identifier: normalizedIdentifier,
      });

      const resolvedEmail = String(resolved?.data?.data?.email || "")
        .trim()
        .toLowerCase();
      if (resolvedEmail && EMAIL_REGEX.test(resolvedEmail)) return resolvedEmail;
    } catch (error) {
      if (error?.response?.status === 429) {
        toast.error("Previše pokušaja. Pokušaj ponovo za minutu.");
        return null;
      }
      console.error("Greška pri provjeri korisničkog imena:", error);
      return "";
    }

    return "";
  };

  const signin = async (email, password) => {
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (!userCredential?.user) {
        toast.error("Korisnik nije pronađen");
        return null;
      }
      return userCredential;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const Signin = async (e) => {
    e.preventDefault();
    const normalizedIdentifier = String(identifier || "").trim();

    if (!normalizedIdentifier) {
      toast.error("Unesite e-mail ili korisničko ime.");
      return;
    } else if (!password) {
      toast.error("Lozinka je obavezna");
      return;
    } else if (password.length < 6) {
      toast.error("Lozinka mora imati najmanje 6 znakova");
      return;
    }

    try {
      setLoginStates((prev) => ({ ...prev, showLoader: true }));
      const resolvedEmail = await resolveEmailFromIdentifier(
        normalizedIdentifier,
      );

      if (resolvedEmail === null) {
        return;
      }
      if (!resolvedEmail) {
        toast.error("Nalog nije pronađen. Provjerite e-mail ili korisničko ime.");
        return;
      }

      const userCredential = await signin(resolvedEmail, password);
      const user = userCredential?.user;
      if (!user) return;
      if (user.emailVerified) {
        try {
          const response = await userSignUpApi.userSignup({
            name: user?.displayName || "",
            email: user?.email,
            firebase_id: user?.uid,
            fcm_id: fetchFCM ? fetchFCM : "",
            type: "email",
          });
          const data = response.data;
          if (data.error === false) {
            loadUpdateData(data);
            onAuthenticated?.(data, {
              method: "email",
              identifier: resolvedEmail,
            });
            toast.success(data.message);
            OnHide();
          } else {
            toast.error(data.message);
          }
        } catch (error) {
          console.error("Error:", error);
        }
        // Add your logic here for verified users
      } else {
        toast.error("Prvo potvrdi e-mail!");
      }
    } catch (error) {
      console.log("Error code:", error?.code);
      handleFirebaseAuthError(error);
    } finally {
      setLoginStates((prev) => ({ ...prev, showLoader: false }));
    }
  };

  const handleForgotModal = async (e) => {
    e.preventDefault();
    const normalizedIdentifier = String(identifier || "").trim();
    if (!normalizedIdentifier) {
      toast.error("Unesite e-mail ili korisničko ime.");
      return;
    }

    const resolvedEmail = await resolveEmailFromIdentifier(normalizedIdentifier);
    if (resolvedEmail === null) {
      return;
    }
    if (!resolvedEmail || !EMAIL_REGEX.test(resolvedEmail)) {
      toast.error("Nije moguće poslati reset link. Provjerite unos.");
      return;
    }

    await sendPasswordResetEmail(auth, resolvedEmail)
      .then(() => {
        toast.success("Provjeri e-mail za reset lozinke.");
      })
      .catch((error) => {
        console.log("error", error);
        handleFirebaseAuthError(error);
      });
  };

  return (
    <>
      <form className="flex flex-col gap-4 rounded-2xl bg-transparent p-0" onSubmit={Signin}>
        <div className="labelInputCont">
          <Label className="requiredInputLabel text-sm font-semibold text-foreground">
            E-mail ili korisničko ime
          </Label>
          <Input
            type="text"
            placeholder="Unesite e-mail ili korisničko ime"
            value={identifier}
            className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground"
            autoComplete="username"
            onChange={(e) =>
              setLoginStates((prev) => ({
                ...prev,
                identifier: e.target.value,
              }))
            }
            ref={emailRef}
          />
        </div>
        <div className="labelInputCont">
          <Label className="requiredInputLabel text-sm font-semibold text-foreground">
            {"Lozinka"}
          </Label>
          <div className="flex items-center relative">
            <Input
              type={IsPasswordVisible ? "text" : "password"}
              placeholder={"Unesi lozinku"}
              className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground ltr:pr-10 rtl:pl-10"
              value={password}
              autoComplete="current-password"
            onChange={(e) =>
              setLoginStates((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            ref={passwordRef}
          />
            <button
              type="button"
              className="absolute ltr:right-3 rtl:left-3 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() =>
                setLoginStates((prev) => ({
                  ...prev,
                  IsPasswordVisible: !prev.IsPasswordVisible,
                }))
              }
            >
              {IsPasswordVisible ? (
                <FaRegEye size={20} />
              ) : (
                <FaRegEyeSlash size={20} />
              )}
            </button>
          </div>
          <button
            className="self-end text-xs font-semibold text-primary hover:underline"
            onClick={handleForgotModal}
            type="button"
          >
            {"Zaboravljena lozinka?"}
          </button>
        </div>
        <Button
          className="h-11 rounded-xl text-sm font-semibold"
          size="lg"
          disabled={showLoader}
        >
          {showLoader ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Prijavi se"
          )}
        </Button>
      </form>
    </>
  );
};

export default LoginWithEmailForm;
