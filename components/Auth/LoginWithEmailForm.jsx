import { FaRegEye, FaRegEyeSlash } from "@/components/Common/UnifiedIconPack";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import useAutoFocus from "../Common/useAutoFocus";
import { toast } from "@/utils/toastBs";
import { handleFirebaseAuthError, t } from "@/utils";
import {
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { authApi, userSignUpApi, usersApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { Fcmtoken } from "@/redux/reducer/settingSlice";
import { loadUpdateData } from "@/redux/reducer/authSlice";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
import { useState } from "react";

const EMAIL_REGEX = /\S+@\S+\.\S+/;

const LoginWithEmailForm = ({ OnHide }) => {
  const emailRef = useAutoFocus();
  const auth = getAuth();
  const fetchFCM = useSelector(Fcmtoken);
  const [loginStates, setLoginStates] = useState({
    identifier: "",
    password: "",
    IsPasswordVisible: false,
    showLoader: false,
  });

  const { identifier, password, IsPasswordVisible, showLoader } = loginStates;

  const resolveEmailFromIdentifier = async (rawIdentifier) => {
    const normalizedIdentifier = String(rawIdentifier || "").trim();
    if (!normalizedIdentifier) return "";
    if (EMAIL_REGEX.test(normalizedIdentifier)) return normalizedIdentifier;

    try {
      const resolved = await authApi.resolveLoginIdentifier({
        identifier: normalizedIdentifier,
      });

      const resolvedEmail = String(resolved?.data?.data?.email || "").trim();
      if (resolvedEmail) return resolvedEmail;
    } catch (error) {
      // Fallback for older backends where resolve-login-identifier route is missing.
      console.warn("resolve-login-identifier failed, trying users fallback.", error);
    }

    try {
      const response = await usersApi.getUsers({
        search: normalizedIdentifier,
        page: 1,
        per_page: 100,
      });

      const candidates = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      const normalizedNeedle = normalizedIdentifier.toLowerCase();

      const toComparableList = (user) =>
        [
          user?.username,
          user?.user_name,
          user?.name,
          user?.display_name,
          user?.slug,
        ]
          .filter(Boolean)
          .map((value) => String(value).trim().toLowerCase());

      const exactMatch =
        candidates.find((candidate) =>
          toComparableList(candidate).includes(normalizedNeedle)
        ) || null;

      const looseMatch =
        exactMatch ||
        candidates.find((candidate) =>
          toComparableList(candidate).some((value) =>
            value.includes(normalizedNeedle)
          )
        );

      return String(looseMatch?.email || "").trim();
    } catch (error) {
      console.error("Error resolving username login identifier:", error);
      return "";
    }
  };

  const signin = async (email, password) => {
    try {
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

      if (!resolvedEmail) {
        toast.error("Korisničko ime nije pronađeno. Pokušajte sa e-mail adresom.");
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
      <form
        className="flex flex-col gap-5 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-sm sm:p-5"
        onSubmit={Signin}
      >
        <div className="labelInputCont">
          <Label className="requiredInputLabel text-sm font-semibold text-slate-700">
            E-mail ili korisničko ime
          </Label>
          <Input
            type="text"
            placeholder="Unesite e-mail ili korisničko ime"
            value={identifier}
            className="h-11 rounded-xl border-slate-200 bg-white"
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
          <Label className="requiredInputLabel text-sm font-semibold text-slate-700">
            {"Lozinka"}
          </Label>
          <div className="flex items-center relative">
            <Input
              type={IsPasswordVisible ? "text" : "password"}
              placeholder={"Unesi lozinku"}
              className="h-11 rounded-xl border-slate-200 bg-white ltr:pr-10 rtl:pl-10"
              value={password}
              autoComplete="current-password"
              onChange={(e) =>
                setLoginStates((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
            />
            <button
              type="button"
              className="absolute ltr:right-3 rtl:left-3 cursor-pointer text-slate-500 hover:text-slate-700"
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
